import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baseProfile, baseline, courses } from '../src/lib/catalogue';
import {
  COST_DEFAULTS,
  CLASSROOM_SEAT_RATE,
  cohortHourCost,
  compareTrainingCosts,
} from '../src/lib/cost-model';
import { dictionaries } from '../src/lib/i18n';
import { IMPACT_TARGETS } from '../src/lib/impact';
import { buildWorkforcePlan } from '../src/lib/workforce-plan';
import {
  getCostAssumptions,
  restoreWorkforceSettings,
} from '../src/lib/workforce-settings';

const group = (hours: number, learners: number, fee = 0) => ({
  course: { ...courses[0], hours, fee },
  names: Array.from({ length: learners }, (_, i) => `worker-${i}`),
});
const assumptions = { seatRate: 125, trainerRate: 200, wageRate: 15 };

test('the cohort trainer allowance is prorated below five learners', () => {
  assert.equal(cohortHourCost(1, 200), 40);
  assert.equal(cohortHourCost(2, 200), 80);
  assert.equal(cohortHourCost(5, 200), 200);
  assert.equal(cohortHourCost(8, 200), 200);
});

test('a shared course is priced once per cohort and self-study needs no trainer', () => {
  // 4 learners share 6 hours; 1 learner studies 24 hours alone: 48 learner-hours.
  const result = compareTrainingCosts(
    [group(6, 4), group(24, 1)],
    assumptions,
    35,
  );
  assert.equal(result.learnerHours, 48);
  assert.equal(result.cohorts, 1);
  assert.deepEqual(result.individual, {
    fees: 6000,
    studyTime: 720,
    total: 6720,
  });
  assert.deepEqual(result.grouped, {
    fees: 0,
    trainers: 960,
    studyTime: 720,
    total: 1680,
  });
  assert.equal(result.saving, 75);
});

test('the break-even seat price is exactly where the saving meets the target', () => {
  const groups = [group(6, 4), group(24, 1)];
  const { breakEvenSeatRate } = compareTrainingCosts(groups, assumptions, 35);
  assert.equal(breakEvenSeatRate, 38.85);
  const atBreakEven = compareTrainingCosts(
    groups,
    { ...assumptions, seatRate: 1680 / (0.65 * 48) - 15 },
    35,
  );
  assert.equal(atBreakEven.saving, 35);
});

test('paid catalogue fees are charged per learner on the plan side', () => {
  const result = compareTrainingCosts([group(7, 3, 300)], assumptions, 35);
  assert.equal(result.grouped.fees, 900);
  assert.equal(result.grouped.trainers, 7 * 120);
});

test('an empty plan has nothing to price', () => {
  const result = compareTrainingCosts([], assumptions, 35);
  assert.equal(result.saving, null);
  assert.equal(result.breakEvenSeatRate, null);
  assert.equal(result.individual.total, 0);
});

test('the default synthetic team meets the 35% target with sourced defaults', () => {
  for (const scenario of ['moderate', 'rapid'] as const) {
    const plan = buildWorkforcePlan(
      baseProfile,
      scenario,
      baseline,
      restoreWorkforceSettings(),
    );
    const result = compareTrainingCosts(
      plan.groups.values(),
      COST_DEFAULTS,
      IMPACT_TARGETS.costReduction,
    );
    assert.equal(result.learnerHours, plan.hours);
    assert.ok((result.saving ?? 0) >= IMPACT_TARGETS.costReduction);
    // The target holds well below HRD Corp's e-learning cap.
    assert.ok((result.breakEvenSeatRate ?? Infinity) < COST_DEFAULTS.seatRate);
    const classroom = compareTrainingCosts(
      plan.groups.values(),
      { ...COST_DEFAULTS, seatRate: CLASSROOM_SEAT_RATE },
      IMPACT_TARGETS.costReduction,
    );
    assert.ok((classroom.saving ?? 0) > (result.saving ?? 0));
  }
});

test('edited cost assumptions persist and invalid ones are rejected', () => {
  const defaults = restoreWorkforceSettings();
  assert.deepEqual(getCostAssumptions(defaults), COST_DEFAULTS);
  const edited = {
    ...defaults,
    costs: { seatRate: 250, trainerRate: 300, wageRate: 20 },
  };
  const restored = restoreWorkforceSettings(JSON.parse(JSON.stringify(edited)));
  assert.deepEqual(getCostAssumptions(restored), edited.costs);
  for (const costs of [
    { ...edited.costs, seatRate: -1 },
    { ...edited.costs, wageRate: 'twenty' },
  ])
    assert.equal(
      restoreWorkforceSettings({ ...edited, costs }).costs,
      undefined,
    );
});

test('every cost panel label has Malay and Simplified Chinese copy', () => {
  const source = readFileSync('src/components/cost-comparison.tsx', 'utf8');
  const labels = [
    ...source.matchAll(/\bt\(\s*'([^']+)'/g),
    ...source.matchAll(/\b(?:label|hint): '([^']+)'/g),
  ].map((m) => m[1]);
  assert.ok(labels.length > 15);
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of labels)
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});
