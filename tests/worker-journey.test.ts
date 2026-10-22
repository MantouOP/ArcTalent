import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, baseline, roles } from '../src/lib/catalogue';
import {
  applyLearningPreferences,
  buildStudyRhythm,
} from '../src/lib/learning-preferences';
import { buildSkillBridge } from '../src/lib/skill-bridge';
import { matchRole } from '../src/lib/engine';

test('applying a chosen focus changes interests without inventing skills or study time', () => {
  const before = structuredClone(baseProfile);
  const next = applyLearningPreferences(baseProfile, {
    focus: 'sustainability',
    format: 'practice',
    sessionMinutes: 30,
  });
  assert.deepEqual(next.interests, ['sustainability']);
  assert.deepEqual(next.skills, before.skills);
  assert.deepEqual(next.completed, before.completed);
  assert.equal(next.hours, before.hours);
  assert.equal(next.weeks, before.weeks);
  assert.equal(next.budget, before.budget);
  assert.deepEqual(baseProfile, before);
  assert.equal(next.learningPreferences?.format, 'practice');
});

test('study sessions exactly fit the weekly time, including short final sessions and zero time', () => {
  assert.deepEqual(buildStudyRhythm(4, 30), {
    fullSessions: 8,
    fullSessionMinutes: 30,
    remainderMinutes: 0,
    totalMinutes: 240,
  });
  assert.deepEqual(buildStudyRhythm(1, 15), {
    fullSessions: 4,
    fullSessionMinutes: 15,
    remainderMinutes: 0,
    totalMinutes: 60,
  });
  assert.deepEqual(buildStudyRhythm(0, 60), {
    fullSessions: 0,
    fullSessionMinutes: 60,
    remainderMinutes: 0,
    totalMinutes: 0,
  });
  assert.deepEqual(buildStudyRhythm(0.5, 60), {
    fullSessions: 0,
    fullSessionMinutes: 60,
    remainderMinutes: 30,
    totalMinutes: 30,
  });
  assert.deepEqual(buildStudyRhythm(1.25, 30), {
    fullSessions: 2,
    fullSessionMinutes: 30,
    remainderMinutes: 15,
    totalMinutes: 75,
  });
});

test('bridge separates ready, partial and new skills and caps excess proficiency', () => {
  const role = {
    ...roles[0],
    requirements: { excel: 2, communication: 2, sql: 2 },
  };
  const profile = { ...baseProfile, skills: { excel: 3, communication: 1 } };
  const bridge = buildSkillBridge(profile, role);
  assert.equal(bridge.coverage, 50);
  assert.equal(bridge.ready, 1);
  assert.equal(bridge.developing, 1);
  assert.equal(bridge.newSkills, 1);
  assert.deepEqual(bridge.rows, [
    { id: 'excel', current: 3, required: 2, gap: 0, status: 'ready' },
    {
      id: 'communication',
      current: 1,
      required: 2,
      gap: 1,
      status: 'developing',
    },
    { id: 'sql', current: 0, required: 2, gap: 2, status: 'new' },
  ]);
});

test('bridge has honest zero and full coverage, and no invented rows for empty requirements', () => {
  const role = { ...roles[0], requirements: { sql: 2 } };
  assert.equal(
    buildSkillBridge({ ...baseProfile, skills: {} }, role).coverage,
    0,
  );
  assert.equal(
    buildSkillBridge({ ...baseProfile, skills: { sql: 3 } }, role).coverage,
    100,
  );
  const empty = buildSkillBridge(baseProfile, {
    ...role,
    requirements: { sql: 0 },
  });
  assert.equal(empty.coverage, 0);
  assert.deepEqual(empty.rows, []);
});

test('bridge follows each destination and agrees with both scenario score explanations', () => {
  for (const role of roles) {
    const bridge = buildSkillBridge(baseProfile, role);
    assert.equal(bridge.rows.length, Object.keys(role.requirements).length);
    for (const scenario of ['moderate', 'rapid'] as const) {
      const match = matchRole(baseProfile, role, scenario, baseline);
      assert.equal(bridge.coverage, match.coverage);
      assert.deepEqual(
        bridge.rows.filter((row) => row.gap > 0).map(({ id }) => id),
        match.gaps.map(({ id }) => id),
      );
    }
  }
});
