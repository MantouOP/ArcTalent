import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, baseline, roles, courses } from '../src/lib/catalogue';
import {
  buildPlan,
  rankRoles,
  sharedFoundation,
  diffSnapshots,
} from '../src/lib/engine';
import {
  careerGoalSchema,
  analyseGoalLocally,
  goalToRole,
  goalCandidates,
  validateGoalAnalysis,
} from '../src/lib/career-goals';
import { roleLabel } from '../src/lib/role-label';
import { translate } from '../src/lib/i18n';
import { answerCareerQuestion } from '../src/lib/career-chat';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';

test('a typed web developer goal adds a real custom destination with directly linked relevant courses', () => {
  const draft = analyseGoalLocally({
    title: 'Web developer',
    description: 'Build accessible websites with HTML, CSS and JavaScript.',
  });
  assert.equal(draft.mode, 'local');
  const goal = careerGoalSchema.parse(draft);
  assert.equal(goal.requirements.htmlcss, 2);
  assert.equal(goal.requirements.javascript, 2);
  const role = goalToRole(goal);
  assert.equal(role.title, 'Web developer');
  assert.equal(role.source, '');
  const candidates = goalCandidates(goal);
  const ranked = rankRoles(baseProfile, 'moderate', baseline, candidates);
  assert.equal(ranked.length, roles.length + 1);
  assert.ok(ranked.some((match) => match.role.id === 'custom-goal'));
  const plan = buildPlan({ ...baseProfile, hours: 10, weeks: 26 }, role);
  assert.ok(plan.steps.some((step) => step.course.skills.includes('htmlcss')));
  assert.ok(
    plan.steps.some((step) => step.course.skills.includes('javascript')),
  );
  for (const step of plan.steps)
    assert.ok(
      courses.some(
        (course) =>
          course.id === step.course.id && course.url === step.course.url,
      ),
    );
});

test('unknown career text does not invent requirements, but explicit skills can be analysed', () => {
  const unknown = analyseGoalLocally({
    title: 'Space crystal wizard',
    description: '',
  });
  assert.deepEqual(unknown.requirements, {});
  assert.equal(careerGoalSchema.safeParse(unknown).success, false);
  const explicit = analyseGoalLocally({
    title: 'My own role',
    description: 'Use Python and SQL to create dashboards.',
  });
  assert.equal(explicit.requirements.python, 2);
  assert.equal(explicit.requirements.sql, 2);
  assert.equal(explicit.requirements.visual, 2);
});

test('stored custom targets reject unknown IDs, empty targets and invalid skill levels', () => {
  const goal = analyseGoalLocally({ title: 'Web developer', description: '' });
  for (const requirements of [
    {},
    { invented: 2 },
    { javascript: 0 },
    { javascript: 4 },
    { javascript: NaN },
  ]) {
    assert.equal(
      careerGoalSchema.safeParse({ ...goal, requirements }).success,
      false,
    );
  }
  assert.deepEqual(
    careerGoalSchema.parse(JSON.parse(JSON.stringify(goal))),
    goal,
  );
});

test('custom candidates participate in both scenarios, shared foundations and evidence differences without changing legacy output', () => {
  assert.deepEqual(goalCandidates(null), roles);
  const goal = careerGoalSchema.parse(
    analyseGoalLocally({
      title: 'Cybersecurity analyst',
      description: 'Protect digital systems.',
    }),
  );
  const candidates = goalCandidates(goal);
  const before = rankRoles(baseProfile, 'moderate', baseline, candidates);
  const after = rankRoles(baseProfile, 'rapid', baseline, candidates);
  assert.ok(before.some((match) => match.role.id === 'custom-goal'));
  assert.ok(after.some((match) => match.role.id === 'custom-goal'));
  assert.ok(
    diffSnapshots(baseProfile, 'moderate', baseline, baseline, candidates).some(
      (change) => change.id === 'custom-goal',
    ),
  );
  for (const id of sharedFoundation(baseProfile, baseline, candidates)) {
    for (const scenario of ['moderate', 'rapid'] as const) {
      for (const match of rankRoles(
        baseProfile,
        scenario,
        baseline,
        candidates,
      ).slice(0, 3)) {
        assert.ok(
          (match.role.requirements[id] ?? 0) > (baseProfile.skills[id] ?? 0),
        );
      }
    }
  }
});

test('AI analysis accepts only known skill targets and never accepts model-generated links', () => {
  const input = {
    title: 'My custom destination',
    description: 'Build useful websites.',
  };
  const output = {
    summary: 'Start with web fundamentals and practical projects.',
    family: 'data',
    targets: [{ id: 'htmlcss', level: 2 }],
    otherSkills: ['Accessibility testing', 'htmlcss', 'HTML & CSS'],
    url: 'https://fake-course.example',
  };
  const analysed = validateGoalAnalysis(input, output);
  assert.equal(analysed.title, input.title);
  assert.equal(analysed.mode, 'ai');
  assert.deepEqual(analysed.otherSkills, ['Accessibility testing']);
  assert.ok(!JSON.stringify(analysed).includes('fake-course'));
  assert.throws(() =>
    validateGoalAnalysis(input, {
      ...output,
      targets: [{ id: 'invented', level: 2 }],
    }),
  );
  assert.throws(() =>
    validateGoalAnalysis(input, {
      ...output,
      targets: [
        { id: 'htmlcss', level: 2 },
        { id: 'htmlcss', level: 3 },
      ],
    }),
  );
});

test('custom goal titles stay user-authored in all locales and chat compares that custom route', () => {
  const goal = careerGoalSchema.parse(
    analyseGoalLocally({
      title: 'Web developer',
      description: 'Create websites.',
    }),
  );
  const candidates = goalCandidates(goal);
  const role = goalToRole(goal);
  for (const locale of ['en', 'ms', 'zh-CN'] as const) {
    assert.equal(
      roleLabel(role, (text) => translate(locale, text)),
      'Web developer',
    );
  }
  const active = rankRoles(baseProfile, 'moderate', baseline, candidates).find(
    (match) => match.role.custom,
  )!;
  const context = {
    profile: baseProfile,
    active,
    scenario: 'moderate' as const,
    snapshot: baseline,
    shared: sharedFoundation(baseProfile, baseline, candidates),
    plan: buildPlan(baseProfile, role),
    workforce: restoreWorkforceSettings(),
    candidates,
  };
  const scenario = answerCareerQuestion('Compare AI scenarios', context);
  assert.equal(scenario.basis.custom, true);
  assert.ok(
    scenario.paragraphs.some(
      (paragraph) => paragraph.values?.[0] === goal.title,
    ),
  );
  const learning = answerCareerQuestion('What should I learn next?', context);
  assert.equal(learning.sources.length, context.plan.steps.length);
});
