import test from 'node:test';
import assert from 'node:assert/strict';
import {
  baseline,
  baseProfile,
  employees,
  courses,
} from '../src/lib/catalogue';
import { analyseGoalLocally } from '../src/lib/career-goals';
import { careerGoalSchema } from '../src/lib/validation';
import {
  applyWorkforceGoal,
  clearWorkforceGoal,
  removeWorkforceMember,
  restoreWorkforceSettings,
  workforceSettingsSchema,
} from '../src/lib/workforce-settings';
import { buildWorkforcePlan } from '../src/lib/workforce-plan';

const goal = careerGoalSchema.parse(
  analyseGoalLocally({
    title: 'Web developer',
    description: 'Build websites with HTML, CSS and JavaScript',
  }),
);
const worker = employees[1];
const chosen = {
  ...restoreWorkforceSettings(),
  members: [worker],
  destinations: { [worker.id]: 'custom-goal' },
  customDestinations: { [worker.id]: { goal, openings: 1 } },
};

test('a worker custom destination and explicit openings survive storage', () => {
  assert.deepEqual(
    restoreWorkforceSettings(JSON.parse(JSON.stringify(chosen))),
    chosen,
  );
  assert.equal(
    workforceSettingsSchema.safeParse({
      ...chosen,
      destinations: { [worker.id]: 'bi' },
    }).success,
    true,
  );
});

test('custom destinations require a valid worker, reviewed skills and bounded openings', () => {
  for (const invalid of [
    { ...chosen, customDestinations: {} },
    {
      ...chosen,
      members: [{ ...worker, id: 'toString' }],
      destinations: { toString: 'custom-goal' },
      customDestinations: {},
    },
    { ...chosen, customDestinations: { ghost: { goal, openings: 1 } } },
    { ...chosen, customDestinations: { [worker.id]: { goal, openings: 11 } } },
    {
      ...chosen,
      customDestinations: {
        [worker.id]: { goal: { ...goal, requirements: {} }, openings: 1 },
      },
    },
  ])
    assert.equal(workforceSettingsSchema.safeParse(invalid).success, false);
});

test('custom worker goals drive real verified courses and keep specialist gaps partial', () => {
  const plan = buildWorkforcePlan(baseProfile, 'rapid', baseline, chosen);
  const row = plan.allocations[0];
  assert.equal(row.role.title, goal.title);
  assert.equal(row.role.custom, true);
  assert.equal(row.included, true);
  assert.ok(
    row.plan.steps.some((step) => step.course.skills.includes('htmlcss')),
  );
  assert.ok(
    row.plan.steps.every((step) =>
      courses.some(
        (course) =>
          course.id === step.course.id && course.url === step.course.url,
      ),
    ),
  );
  assert.deepEqual(row.specialistSkills, goal.otherSkills);
  assert.equal(row.reason, 'Partial learning route');
  assert.equal(plan.hours, row.plan.totalHours);
  assert.equal(
    plan.openings.find((opening) => opening.role.id === row.role.id)?.count,
    1,
  );
});

test('separate custom worker roles have independent capacities and survive scenario changes', () => {
  const second = employees[2];
  const settings = {
    ...chosen,
    members: [worker, second],
    destinations: { [worker.id]: 'custom-goal', [second.id]: 'custom-goal' },
    customDestinations: {
      [worker.id]: { goal, openings: 0 },
      [second.id]: {
        goal: { ...goal, title: 'Frontend developer' },
        openings: 1,
      },
    },
  };
  for (const scenario of ['moderate', 'rapid'] as const) {
    const plan = buildWorkforcePlan(baseProfile, scenario, baseline, settings);
    assert.notEqual(plan.allocations[0].role.id, plan.allocations[1].role.id);
    assert.deepEqual(
      plan.allocations.map((row) => row.included),
      [false, true],
    );
    assert.equal(plan.allocations[0].reason, 'No internal slot');
    assert.ok(
      [...plan.groups.values()].every((group) =>
        group.names.every((name) => name === second.name),
      ),
    );
  }
});

test('applying, switching presets and clearing one goal preserve other workers and settings', () => {
  const initial = {
    ...restoreWorkforceSettings(),
    members: [worker, employees[2]],
  };
  const saved = applyWorkforceGoal(initial, worker.id, goal, 1);
  assert.equal(saved.destinations[worker.id], 'custom-goal');
  assert.equal(initial.destinations[worker.id], undefined);
  const both = applyWorkforceGoal(
    saved,
    employees[2].id,
    { ...goal, title: 'Frontend developer' },
    0,
  );
  const preset = {
    ...both,
    destinations: { ...both.destinations, [worker.id]: 'bi' },
  };
  const cleared = clearWorkforceGoal(preset, worker.id);
  assert.equal(cleared.destinations[worker.id], 'bi');
  assert.equal(cleared.customDestinations?.[worker.id], undefined);
  assert.equal(cleared.customDestinations?.[employees[2].id]?.openings, 0);
  assert.deepEqual(cleared.slots, initial.slots);
  assert.throws(() => applyWorkforceGoal(initial, worker.id, goal, -1));
  assert.throws(() => applyWorkforceGoal(initial, 'ghost', goal, 1));
});

test('removing a worker clears their saved destination and goal while preserving the other worker', () => {
  const saved = applyWorkforceGoal(
    { ...restoreWorkforceSettings(), members: [worker, employees[2]] },
    worker.id,
    goal,
    1,
  );
  const removed = removeWorkforceMember(saved, worker.id, saved.members!);
  assert.deepEqual(
    removed.members?.map((member) => member.id),
    [employees[2].id],
  );
  assert.equal(removed.destinations[worker.id], undefined);
  assert.equal(removed.customDestinations?.[worker.id], undefined);
  assert.equal(workforceSettingsSchema.safeParse(removed).success, true);
});
