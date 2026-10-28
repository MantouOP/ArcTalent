import { roles } from './catalogue';
import { buildPlan, matchRole, rankRoles, sharedFoundation } from './engine';
import type {
  LearningPlan,
  Profile,
  Role,
  Scenario,
  SkillId,
  Snapshot,
} from './types';

/** Phase 2 impact targets committed in the SDC 2026 preliminary proposal (section 4). */
export const IMPACT_TARGETS = {
  distanceReduction: 40,
  foundationShare: 100,
  foundationWeeks: 4,
} as const;

export type ImpactStatus = 'met' | 'below' | 'not-applicable';

const round = (n: number) => Math.round(n * 10) / 10;

/** Skill levels if every completed and planned course is finished, using the planner's own level-2 assumption. */
export function projectedSkills(profile: Profile, plan: LearningPlan) {
  const next: Partial<Record<SkillId, number>> = { ...profile.skills };
  [...plan.completed, ...plan.steps.map((s) => s.course)].forEach((c) =>
    c.skills.forEach((s) => {
      next[s] = Math.max(next[s] ?? 0, 2);
    }),
  );
  return next;
}

/** Hours inside the first `weeks` study weeks, and how many of them build the shared foundation. */
export function foundationShare(
  plan: LearningPlan,
  hoursPerWeek: number,
  weeks: number = IMPACT_TARGETS.foundationWeeks,
) {
  const window = Math.max(0, hoursPerWeek) * weeks;
  let cursor = 0,
    total = 0,
    shared = 0;
  for (const step of plan.steps) {
    const overlap = Math.max(
      0,
      Math.min(cursor + step.course.hours, window) - cursor,
    );
    total += overlap;
    if (step.shared) shared += overlap;
    cursor += step.course.hours;
  }
  return {
    totalHours: round(total),
    sharedHours: round(shared),
    share: total > 0 ? round((100 * shared) / total) : null,
  };
}

export function assessPerson(
  profile: Profile,
  role: Role,
  scenario: Scenario,
  snapshot: Snapshot,
  shared: SkillId[],
  plan: LearningPlan,
) {
  const before = matchRole(profile, role, scenario, snapshot);
  const after = matchRole(
    { ...profile, skills: projectedSkills(profile, plan) },
    role,
    scenario,
    snapshot,
  );
  const reduction =
    before.distance > 0
      ? round((100 * (before.distance - after.distance)) / before.distance)
      : null;
  const foundation = foundationShare(plan, profile.hours);
  return {
    profile,
    role,
    plan,
    shared,
    distanceBefore: before.distance,
    distanceAfter: after.distance,
    reduction,
    reductionStatus: (reduction === null
      ? 'not-applicable'
      : reduction >= IMPACT_TARGETS.distanceReduction
        ? 'met'
        : 'below') as ImpactStatus,
    foundation,
    foundationStatus: (shared.length === 0 || foundation.share === null
      ? 'not-applicable'
      : foundation.share >= IMPACT_TARGETS.foundationShare
        ? 'met'
        : 'below') as ImpactStatus,
  };
}
export type PersonImpact = ReturnType<typeof assessPerson>;

/** Same route the explorer proposes by default: top-ranked role, shared foundation first, all funding. */
export function assessTopRoute(
  profile: Profile,
  scenario: Scenario,
  snapshot: Snapshot,
  candidates: Role[] = roles,
) {
  const role = rankRoles(profile, scenario, snapshot, candidates)[0].role;
  const shared = sharedFoundation(profile, snapshot, candidates);
  return assessPerson(
    profile,
    role,
    scenario,
    snapshot,
    shared,
    buildPlan(profile, role, shared),
  );
}

export function assessCohort(
  members: Profile[],
  scenario: Scenario,
  snapshot: Snapshot,
) {
  const people = members.map((p) => assessTopRoute(p, scenario, snapshot));
  const reductions = people.flatMap((p) =>
    p.reduction === null ? [] : [p.reduction],
  );
  const shares = people.flatMap((p) =>
    p.foundationStatus === 'not-applicable' || p.foundation.share === null
      ? []
      : [p.foundation.share],
  );
  const average = (values: number[]) =>
    values.length
      ? round(values.reduce((s, v) => s + v, 0) / values.length)
      : null;
  return {
    people,
    averageReduction: average(reductions),
    reductionMeasured: reductions.length,
    reductionMet: people.filter((p) => p.reductionStatus === 'met').length,
    averageFoundationShare: average(shares),
    foundationMeasured: shares.length,
    foundationMet: people.filter((p) => p.foundationStatus === 'met').length,
  };
}

export const statusFor = (value: number | null, target: number) =>
  (value === null
    ? 'not-applicable'
    : value >= target
      ? 'met'
      : 'below') as ImpactStatus;
