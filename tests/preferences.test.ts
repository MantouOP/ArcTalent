import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, baseline } from '../src/lib/catalogue';
import { profileSchema } from '../src/lib/validation';
import { rankRoles } from '../src/lib/engine';

const preferences = {
  focus: 'sustainability' as const,
  format: 'practice' as const,
  sessionMinutes: 30 as const,
};

test('saved preferences survive profile parsing while old profiles remain valid', () => {
  const saved = { ...baseProfile, learningPreferences: preferences };
  assert.deepEqual(profileSchema.parse(saved), saved);
  assert.deepEqual(profileSchema.parse(baseProfile), baseProfile);
});

test('unsupported preference values are rejected at the profile boundary', () => {
  for (const change of [
    { focus: 'unknown' },
    { format: 'psychometric' },
    { sessionMinutes: 0 },
    { sessionMinutes: 181 },
    { sessionMinutes: 4 },
    { sessionMinutes: 15.5 },
    { workAnswer: 'x'.repeat(601) },
  ]) {
    assert.equal(
      profileSchema.safeParse({
        ...baseProfile,
        learningPreferences: { ...preferences, ...change },
      }).success,
      false,
    );
  }
});

test('typed check-in answers and a custom session duration survive validation', () => {
  const answers = {
    ...preferences,
    sessionMinutes: 45,
    workAnswer: 'I want to reduce waste in a fictional warehouse.',
    practiceAnswer:
      'Build a small stock dashboard and explain it to a partner.',
  };
  const parsed = profileSchema.safeParse({
    ...baseProfile,
    learningPreferences: answers,
  });
  assert.equal(parsed.success, true);
  if (parsed.success)
    assert.deepEqual(parsed.data.learningPreferences, answers);
});

test('study format and session length cannot change career ranking or skill coverage', () => {
  const original = rankRoles(baseProfile, 'moderate', baseline);
  const parsed = profileSchema.parse({
    ...baseProfile,
    learningPreferences: preferences,
  });
  assert.deepEqual(rankRoles(parsed, 'moderate', baseline), original);
});
