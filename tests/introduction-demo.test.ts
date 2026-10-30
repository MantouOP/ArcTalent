import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, courses } from '../src/lib/catalogue';
import { introductionDemo } from '../src/lib/introduction-demo';

test('homepage sample is isolated from saved and catalogue profiles', () => {
  const original = structuredClone(baseProfile);
  const first = introductionDemo('aina', 4, 'moderate', false);
  first.profile.skills.excel = 0;
  first.profile.completed.push('excel-ou');
  const second = introductionDemo('aina', 4, 'moderate', false);
  assert.deepEqual(baseProfile, original);
  assert.deepEqual(second.profile.skills, original.skills);
  assert.deepEqual(second.profile.completed, []);
});

test('sample time, scenario and dated evidence feed the real planner together', () => {
  const short = introductionDemo('aina', 2, 'moderate', false);
  const long = introductionDemo('aina', 8, 'moderate', false);
  const rapid = introductionDemo('aina', 4, 'rapid', false);
  const newer = introductionDemo('aina', 4, 'moderate', true);
  assert.ok(short.plan.totalHours <= 16);
  assert.ok(long.plan.totalHours >= short.plan.totalHours);
  assert.ok(short.plan.uncovered.length > 0);
  assert.notDeepEqual(
    short.ranking.map((m) => m.score),
    rapid.ranking.map((m) => m.score),
  );
  assert.notEqual(short.snapshot.id, newer.snapshot.id);
  assert.notDeepEqual(
    short.ranking.map((m) => m.score),
    newer.ranking.map((m) => m.score),
  );
  for (const result of [short, long, rapid, newer]) {
    assert.equal(result.snapshot.kind, 'simulation');
    for (const step of result.plan.steps) {
      assert.equal(
        step.course.url,
        courses.find((course) => course.id === step.course.id)?.url,
      );
      assert.ok(step.endWeek <= result.profile.weeks);
    }
  }
});
