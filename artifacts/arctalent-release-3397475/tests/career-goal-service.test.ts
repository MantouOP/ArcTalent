import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseCareerGoal } from '../src/lib/career-goal-service';

const input = {
  title: 'Frontend developer',
  description: 'Create accessible web pages.',
  locale: 'en' as const,
};
const output = {
  summary: 'Learn web fundamentals and build a practical project.',
  family: 'data',
  targets: [
    { id: 'htmlcss', level: 2 },
    { id: 'javascript', level: 2 },
  ],
  otherSkills: ['Accessibility testing'],
};

test('configured AI analysis returns validated editable skill targets and canonical user goal', async () => {
  let received: unknown;
  const result = await analyseCareerGoal(input, async (value) => {
    received = value;
    return output;
  });
  assert.deepEqual(received, input);
  assert.equal(result.draft.mode, 'ai');
  assert.equal(result.draft.title, input.title);
  assert.deepEqual(result.draft.requirements, { htmlcss: 2, javascript: 2 });
});

test('missing AI, transport failure and invalid model output remain explicitly local', async () => {
  for (const model of [
    undefined,
    async () => {
      throw new Error('unavailable');
    },
    async () => ({ ...output, targets: [{ id: 'fake-skill', level: 3 }] }),
  ]) {
    const result = await analyseCareerGoal(input, model);
    assert.equal(result.draft.mode, 'local');
    assert.ok(result.notice);
    assert.equal(result.draft.requirements.htmlcss, 2);
    assert.equal(result.draft.requirements.javascript, 2);
  }
});

test('model receives goal text only, without extra profile, CV or company data', async () => {
  let received: unknown;
  await analyseCareerGoal(
    {
      ...input,
      profile: { name: 'Secret fictional worker' },
      cv: 'CV text',
      apiKey: 'never pass this',
    },
    async (value) => {
      received = value;
      return output;
    },
  );
  assert.deepEqual(received, input);
});
