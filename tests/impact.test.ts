import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dictionaries } from '../src/lib/i18n';
import {
  baseProfile,
  baseline,
  courses,
  employees,
  roles,
} from '../src/lib/catalogue';
import { buildPlan } from '../src/lib/engine';
import {
  IMPACT_TARGETS,
  assessCohort,
  assessPerson,
  assessTopRoute,
  foundationShare,
  projectedSkills,
} from '../src/lib/impact';
import type { LearningPlan } from '../src/lib/types';

const step = (hours: number, shared: boolean) => ({
  course: { ...courses[0], hours },
  startWeek: 1,
  endWeek: 1,
  shared,
});
const planOf = (steps: ReturnType<typeof step>[]): LearningPlan => ({
  steps,
  totalHours: steps.reduce((s, x) => s + x.course.hours, 0),
  totalCost: 0,
  weeks: [],
  uncovered: [],
  completed: [],
});

test('foundation share counts only hours inside the first four study weeks', () => {
  // 4 h/week → 16 h window: 6 shared + 6 other + 4 of the last shared course.
  const result = foundationShare(
    planOf([step(6, true), step(6, false), step(10, true)]),
    4,
  );
  assert.equal(result.totalHours, 16);
  assert.equal(result.sharedHours, 10);
  assert.equal(result.share, 62.5);
});

test('foundation share is unavailable for an empty plan or zero weekly hours', () => {
  assert.equal(foundationShare(planOf([]), 4).share, null);
  assert.equal(foundationShare(planOf([step(4, true)]), 0).share, null);
});

test('foundation completion week and order are reported', () => {
  const early = foundationShare(planOf([step(6, true), step(6, false)]), 4);
  assert.equal(early.completeWeek, 2);
  assert.equal(early.first, true);
  const late = foundationShare(planOf([step(2, false), step(6, true)]), 4);
  assert.equal(late.completeWeek, 2);
  assert.equal(late.first, false);
  assert.equal(foundationShare(planOf([step(2, false)]), 4).completeWeek, null);
});

test('a foundation shorter than four weeks is reported as finished early, not as met', () => {
  const aina = assessTopRoute(baseProfile, 'moderate', baseline);
  assert.ok(aina.foundation.share !== null && aina.foundation.share < 100);
  assert.equal(aina.foundationStatus, 'early');
  assert.equal(aina.foundation.completeWeek, 3);
  const mei = employees.find((e) => e.id === 'mei')!;
  const meiImpact = assessTopRoute(mei, 'moderate', baseline);
  assert.equal(meiImpact.foundation.share, 100);
  assert.equal(meiImpact.foundationStatus, 'met');
});

test('a foundation that cannot fit the plan stays below target', () => {
  const mei = employees.find((e) => e.id === 'mei')!;
  const role = roles.find((r) => r.id === 'bi')!;
  // 2 h/week × 8 weeks cannot hold the 24-hour communication course.
  const profile = { ...mei, hours: 2 };
  const shared = ['communication' as const];
  const impact = assessPerson(
    profile,
    role,
    'moderate',
    baseline,
    shared,
    buildPlan(profile, role, shared),
  );
  assert.equal(impact.foundationStatus, 'below');
});

test('projected skills never lower an existing level and lift planned skills to working level', () => {
  const profile = {
    ...baseProfile,
    skills: { ...baseProfile.skills, data: 3 },
  };
  const plan = buildPlan(profile, roles[0]);
  const next = projectedSkills(profile, plan);
  for (const [id, level] of Object.entries(profile.skills))
    assert.ok((next[id as keyof typeof next] ?? 0) >= (level ?? 0));
  for (const s of plan.steps.flatMap((x) => x.course.skills))
    assert.ok((next[s] ?? 0) >= 2);
});

test('a worker who already meets every requirement is not counted toward the distance target', () => {
  const role = roles[0];
  const profile = { ...baseProfile, skills: { ...role.requirements } };
  const impact = assessPerson(
    profile,
    role,
    'moderate',
    baseline,
    [],
    buildPlan(profile, role),
  );
  assert.equal(impact.distanceBefore, 0);
  assert.equal(impact.reduction, null);
  assert.equal(impact.reductionStatus, 'not-applicable');
  assert.equal(impact.foundationStatus, 'not-applicable');
});

test('completing the proposed plan never widens the skill gap', () => {
  for (const scenario of ['moderate', 'rapid'] as const)
    for (const p of employees) {
      const impact = assessTopRoute(p, scenario, baseline);
      assert.ok(impact.distanceAfter <= impact.distanceBefore);
      assert.ok(impact.plan.totalHours <= p.hours * p.weeks);
      assert.ok(impact.plan.totalCost <= p.budget);
    }
});

test('the synthetic cohort reaches the 40% average gap reduction target in both scenarios', () => {
  for (const scenario of ['moderate', 'rapid'] as const) {
    const cohort = assessCohort(employees, scenario, baseline);
    assert.equal(cohort.people.length, employees.length);
    assert.ok(
      (cohort.averageReduction ?? 0) >= IMPACT_TARGETS.distanceReduction,
    );
    assert.ok(cohort.reductionMet <= cohort.reductionMeasured);
    // Every worker either fills weeks 1–4 with foundation or finishes it early.
    assert.equal(
      cohort.foundationMet + cohort.foundationEarly,
      cohort.foundationMeasured,
    );
  }
});

test('every scorecard label has Malay and Simplified Chinese copy', () => {
  const source = readFileSync('src/components/impact-scorecard.tsx', 'utf8');
  const labels = [
    ...source.matchAll(/\bt\(\s*'([^']+)'/g),
    ...source.matchAll(/\b(?:label|title): '([^']+)'/g),
  ].map((m) => m[1]);
  assert.ok(labels.length > 20);
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of labels)
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});
