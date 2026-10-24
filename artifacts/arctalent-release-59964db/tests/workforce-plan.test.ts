import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseline, baseProfile, employees, roles } from '../src/lib/catalogue';
import { buildPlan } from '../src/lib/engine';
import { buildWorkforcePlan } from '../src/lib/workforce-plan';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';

test('workforce export shares displayed worker order, selected destinations and slot allocation', () => {
  const members = employees.slice(0, 3);
  const workforce = {
    ...restoreWorkforceSettings(),
    members,
    slots: { bi: 1 },
    destinations: Object.fromEntries(members.map((p) => [p.id, 'bi'])),
  };
  const result = buildWorkforcePlan(baseProfile, 'rapid', baseline, workforce);
  assert.deepEqual(
    result.allocations.map((r) => r.profile.id),
    members.map((p) => p.id),
  );
  assert.deepEqual(
    result.allocations.map((r) => r.included),
    [true, false, false],
  );
  assert.deepEqual(
    result.allocations.map((r) => r.role.id),
    ['bi', 'bi', 'bi'],
  );
  const expected = buildPlan(
    result.team[0],
    roles.find((r) => r.id === 'bi')!,
  );
  assert.equal(result.hours, expected.totalHours);
  assert.equal(result.allocated, expected.totalCost);
  assert.equal(result.learners, expected.steps.length ? 1 : 0);
  assert.ok([...result.groups.values()].every((g) => g.names.length === 1));
  assert.equal(result.allocations[1].reason, 'No internal slot');
});

test('an explicitly empty roster stays empty and no openings allocate no training', () => {
  const empty = buildWorkforcePlan(baseProfile, 'moderate', baseline, {
    ...restoreWorkforceSettings(),
    members: [],
  });
  assert.deepEqual(
    [
      empty.team.length,
      empty.learners,
      empty.hours,
      empty.groups.size,
      empty.allocated,
    ],
    [0, 0, 0, 0, 0],
  );
  const closed = buildWorkforcePlan(baseProfile, 'moderate', baseline, {
    ...restoreWorkforceSettings(),
    slots: {},
  });
  assert.equal(closed.learners, 0);
  assert.equal(closed.hours, 0);
  assert.equal(closed.groups.size, 0);
  assert.ok(closed.allocations.every((r) => !r.included));
});
