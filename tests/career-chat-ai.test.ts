import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, baseline, roles } from '../src/lib/catalogue';
import { buildPlan, matchRole, sharedFoundation } from '../src/lib/engine';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';
import { analyseGoalLocally, careerGoalSchema } from '../src/lib/career-goals';
import {
  makeChatRequest,
  chatRequestSchema,
} from '../src/lib/career-chat-request';
import {
  answerWithCareerModel,
  prepareChatFacts,
  chatModelOutputSchemaForPlan,
} from '../src/lib/career-chat-ai';

function request() {
  const active = matchRole(baseProfile, roles[0], 'moderate', baseline);
  const shared = sharedFoundation(baseProfile, baseline);
  return makeChatRequest('What can I practise this weekend?', 'en', {
    profile: {
      ...baseProfile,
      name: 'PRIVATE NAME',
      currentRole: 'PRIVATE ROLE',
      learningPreferences: {
        focus: 'data',
        format: 'practice',
        sessionMinutes: 25,
        workAnswer: 'PRIVATE CV TEXT',
        practiceAnswer: 'PRIVATE NOTE',
      },
    },
    active,
    shared,
    scenario: 'moderate',
    snapshot: baseline,
    plan: buildPlan(baseProfile, active.role, shared),
    workforce: restoreWorkforceSettings(),
  });
}

test('chat request excludes identities, CV text, pictures, free-text preferences and team records', () => {
  const input = request();
  assert.doesNotMatch(JSON.stringify(input), /PRIVATE|workforce|picture/i);
  assert.equal('id' in input.profile, false);
  assert.equal(input.profile.hours, baseProfile.hours);
  assert.equal(input.roleId, roles[0].id);
  const parsed = chatRequestSchema.parse({
    ...input,
    rawCv: 'PRIVATE CV',
    profile: { ...input.profile, name: 'PRIVATE NAME' },
  });
  assert.doesNotMatch(JSON.stringify(parsed), /PRIVATE/);
});

test('chat rejects absent consent, unknown destinations and overlong questions', () => {
  const input = request();
  for (const change of [
    { consent: false },
    { consent: undefined },
    { roleId: 'made-up-role' },
    { question: 'x'.repeat(601) },
  ])
    assert.equal(
      chatRequestSchema.safeParse({ ...input, ...change }).success,
      false,
    );
});

test('AI facts recompute the selected plan and preserve the funding filter', () => {
  const input = request();
  const facts = prepareChatFacts(input);
  assert.equal(facts.selectedCareer.title, roles[0].title);
  assert.equal(facts.plan.totalHours, 22);
  assert.equal(facts.plan.courses.length, 4);
  const filtered = prepareChatFacts({ ...input, funding: 'hrd' });
  assert.equal(filtered.plan.courses.length, 0);
  assert.equal(filtered.plan.totalHours, 0);
});
test('a saved custom goal does not add its specialist gaps to a selected stock career', () => {
  const goal = careerGoalSchema.parse(
    analyseGoalLocally({ title: 'Web developer', description: '' }),
  );
  assert.ok(goal.otherSkills.length);
  const facts = prepareChatFacts({ ...request(), customGoal: goal });
  assert.deepEqual(facts.selectedCareer.specialistSkillsOutsideCatalogue, []);
});

test('natural-language model answer uses only canonical scheduled course links', async () => {
  const input = request();
  const facts = prepareChatFacts(input);
  let called = false;
  const answer = await answerWithCareerModel(input, async (sent) => {
    called = true;
    assert.equal(sent.question, input.question);
    assert.equal(sent.facts.plan.totalHours, 22);
    return {
      paragraphs: ['Practise the first course in short sessions this weekend.'],
      courseIds: [facts.plan.courses[0].id],
    };
  });
  assert.equal(called, true);
  assert.equal(answer.mode, 'ai');
  assert.equal(answer.reply.sources[0].href, facts.plan.courses[0].url);
  assert.equal(answer.reply.basis.role, roles[0].title);
});

test('missing, failing or invalid model output falls back honestly to the local guide', async () => {
  const input = { ...request(), question: 'What should I learn first?' };
  for (const model of [
    undefined,
    async () => {
      throw new Error('private provider secret');
    },
    async () => ({
      paragraphs: ['Open https://invented.invalid/course'],
      courseIds: [],
    }),
    async () => ({
      paragraphs: ['Invented course'],
      courseIds: ['fake-course'],
    }),
  ]) {
    const answer = await answerWithCareerModel(input, model);
    assert.equal(answer.mode, 'local');
    assert.ok(answer.notice);
    assert.equal(answer.reply.intent, 'learning');
    assert.doesNotMatch(
      JSON.stringify(answer),
      /private provider secret|invented.invalid|fake-course/,
    );
  }
});

test('model cannot link a valid catalogue course outside the selected plan', async () => {
  const input = { ...request(), funding: 'hrd' as const };
  const id = prepareChatFacts(request()).plan.courses[0].id;
  const answer = await answerWithCareerModel(input, async () => ({
    paragraphs: ['Check your funding filter.'],
    courseIds: [id],
  }));
  assert.equal(answer.mode, 'local');
  assert.equal(answer.reply.sources.length, 0);
});

test('the model output schema permits only scheduled course IDs and forces an empty list for an empty plan', () => {
  const facts = prepareChatFacts(request());
  const ids = facts.plan.courses.map((course) => course.id);
  const schema = chatModelOutputSchemaForPlan(ids);
  assert.equal(
    schema.safeParse({
      paragraphs: ['Start with the first scheduled course.'],
      courseIds: [ids[0]],
    }).success,
    true,
  );
  assert.equal(
    schema.safeParse({
      paragraphs: ['Practice a recipe.'],
      courseIds: ['communication'],
    }).success,
    false,
  );
  const empty = chatModelOutputSchemaForPlan([]);
  assert.equal(
    empty.safeParse({
      paragraphs: [
        'No verified courses are scheduled. Practise a small task this weekend.',
      ],
      courseIds: [],
    }).success,
    true,
  );
  assert.equal(
    empty.safeParse({
      paragraphs: ['Practice a recipe.'],
      courseIds: ['communication'],
    }).success,
    false,
  );
});

test('history and locale are bounded and a successful answer cannot change the plan', async () => {
  const input = {
    ...request(),
    locale: 'zh-CN' as const,
    history: [{ question: '课程呢？', answer: '查看当前计划。' }],
  };
  const original = JSON.stringify(input);
  const answer = await answerWithCareerModel(input, async (sent) => {
    assert.equal(sent.locale, 'zh-CN');
    assert.equal(sent.history[0].question, '课程呢？');
    return { paragraphs: ['本周先学习计划中的基础课程。'], courseIds: [] };
  });
  assert.equal(answer.mode, 'ai');
  assert.equal(JSON.stringify(input), original);
  assert.equal(
    chatRequestSchema.safeParse({
      ...input,
      history: Array(5).fill(input.history[0]),
    }).success,
    false,
  );
});
