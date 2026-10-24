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
    { sessionMinutes: 45 },
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

test('study format and session length cannot change career ranking or skill coverage', () => {
  const original = rankRoles(baseProfile, 'moderate', baseline);
  const parsed = profileSchema.parse({
    ...baseProfile,
    learningPreferences: preferences,
  });
  assert.deepEqual(rankRoles(parsed, 'moderate', baseline), original);
});
