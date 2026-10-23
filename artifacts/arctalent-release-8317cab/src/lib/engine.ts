import { courses, roles, skillById, skills } from './catalogue';
import type {
  LearningPlan,
  Match,
  Profile,
  Role,
  Scenario,
  SkillId,
  Snapshot,
} from './types';
export const MODEL_VERSION = 'arctalent-heuristic-1.0';
export const clamp = (n: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n * 100) / 100;

export function matchRole(
  profile: Profile,
  role: Role,
  scenario: Scenario,
  snapshot: Snapshot,
): Match {
  const requirements = Object.entries(role.requirements) as [SkillId, number][];
  const gaps = requirements.map(([id, required]) => ({
    id,
    required,
    current: profile.skills[id] ?? 0,
    gap: Math.max(required - (profile.skills[id] ?? 0), 0),
  }));
  const coverage = clamp(
    1 -
      gaps.reduce((s, g) => s + g.gap, 0) /
        requirements.reduce((s, [, r]) => s + r, 0),
  );
  const market =
    requirements.reduce(
      (s, [id, r]) => s + (snapshot.market[id] ?? 0.5) * r,
      0,
    ) / requirements.reduce((s, [, r]) => s + r, 0);
  const resilience =
    1 - (scenario === 'moderate' ? 0.35 : 0.75) * role.exposure;
  const interest = profile.interests.includes(role.family) ? 1 : 0.4;
  const score = round(
    100 *
      (0.55 * coverage + 0.15 * interest + 0.15 * market + 0.15 * resilience),
  );
  return {
    role,
    score,
    coverage: round(coverage * 100),
    distance: round((1 - coverage) * 100),
    market: round(market * 100),
    resilience: round(resilience * 100),
    interest: interest * 100,
    gaps: gaps.filter((g) => g.gap > 0),
    reused: requirements
      .filter(([id]) => (profile.skills[id] ?? 0) > 0)
      .map(([id]) => id),
  };
}
export function rankRoles(
  profile: Profile,
  scenario: Scenario,
  snapshot: Snapshot,
) {
  return roles
    .map((r) => matchRole(profile, r, scenario, snapshot))
    .sort((a, b) => b.score - a.score || a.role.id.localeCompare(b.role.id));
}
export function sharedFoundation(
  profile: Profile,
  snapshot: Snapshot,
): SkillId[] {
  const compared = [
    ...rankRoles(profile, 'moderate', snapshot).slice(0, 3),
    ...rankRoles(profile, 'rapid', snapshot).slice(0, 3),
  ];
  return skills
    .filter((s) =>
      compared.every(
        (m) => (m.role.requirements[s.id] ?? 0) > (profile.skills[s.id] ?? 0),
      ),
    )
    .map((s) => s.id);
}
export function buildPlan(
  profile: Profile,
  role: Role,
  shared: SkillId[] = [],
  funding: 'all' | 'free' | 'hrd' = 'all',
): LearningPlan {
  const required = new Map<SkillId, number>();
  const expand = (id: SkillId, level: number, seen = new Set<SkillId>()) => {
    if (seen.has(id)) throw new Error('Cyclic skill prerequisites');
    required.set(id, Math.max(required.get(id) ?? 0, level));
    if ((profile.skills[id] ?? 0) >= level) return;
    for (const dep of skillById[id].prerequisites)
      expand(dep, 1, new Set([...seen, id]));
  };
  (Object.entries(role.requirements) as [SkillId, number][]).forEach(
    ([id, r]) => expand(id, r),
  );
  const completed = courses.filter((c) => profile.completed.includes(c.id));
  const planned = { ...profile.skills };
  completed.forEach((c) =>
    c.skills.forEach((s) => {
      planned[s] = Math.max(planned[s] ?? 0, 2);
    }),
  );
  const steps: LearningPlan['steps'] = [];
  let hours = 0,
    cost = 0;
  const capacity = Math.max(0, profile.hours) * Math.max(0, profile.weeks);
  const selected = new Set(completed.map((c) => c.id));
  for (let iteration = 0; iteration < courses.length; iteration++) {
    const options = courses
      .filter(
        (c) =>
          !selected.has(c.id) &&
          (funding === 'all' || c.funding === funding) &&
          c.fee + cost <= profile.budget &&
          c.hours + hours <= capacity &&
          c.prerequisites.every((s) => (planned[s] ?? 0) >= 1),
      )
      .map((c) => ({
        course: c,
        value:
          c.skills.reduce(
            (n, s) =>
              n +
              ((required.get(s) ?? 0) > (planned[s] ?? 0)
                ? shared.includes(s)
                  ? 4
                  : 1
                : 0),
            0,
          ) / c.hours,
      }))
      .filter((o) => o.value > 0)
      .sort(
        (a, b) =>
          b.value - a.value ||
          a.course.fee - b.course.fee ||
          a.course.id.localeCompare(b.course.id),
      );
    if (!options.length) break;
    const c = options[0].course;
    steps.push({
      course: c,
      startWeek: Math.floor(hours / profile.hours) + 1,
      endWeek: Math.ceil((hours + c.hours) / profile.hours),
      shared: c.skills.some((s) => shared.includes(s)),
    });
    selected.add(c.id);
    hours += c.hours;
    cost += c.fee;
    c.skills.forEach((s) => {
      planned[s] = Math.max(planned[s] ?? 0, 2);
    });
  }
  const weeks: LearningPlan['weeks'] = [];
  let cursor = 0;
  for (const step of steps) {
    let left = step.course.hours;
    while (left > 0 && profile.hours > 0) {
      const weekIndex = Math.floor(cursor / profile.hours);
      const allocation = Math.min(
        left,
        profile.hours - (cursor % profile.hours),
      );
      if (allocation < 0.00001) break;
      const w = weeks[weekIndex] ?? {
        week: weekIndex + 1,
        hours: 0,
        courseIds: [],
      };
      w.hours = round(w.hours + allocation);
      if (!w.courseIds.includes(step.course.id))
        w.courseIds.push(step.course.id);
      weeks[weekIndex] = w;
      cursor = round(cursor + allocation);
      left = round(left - allocation);
    }
  }
  return {
    steps,
    totalHours: hours,
    totalCost: cost,
    weeks,
    uncovered: [...required]
      .filter(([id, r]) => (planned[id] ?? 0) < r)
      .map(([id]) => id),
    completed,
  };
}
export function diffSnapshots(
  profile: Profile,
  scenario: Scenario,
  before: Snapshot,
  after: Snapshot,
) {
  const old = rankRoles(profile, scenario, before),
    next = rankRoles(profile, scenario, after);
  return next.map((m, i) => {
    const previous = old.find((o) => o.role.id === m.role.id)!;
    return {
      id: m.role.id,
      title: m.role.title,
      before: previous.score,
      after: m.score,
      delta: round(m.score - previous.score),
      oldRank: old.indexOf(previous) + 1,
      newRank: i + 1,
      changedSkills: (Object.keys(m.role.requirements) as SkillId[]).filter(
        (id) => (before.market[id] ?? 0.5) !== (after.market[id] ?? 0.5),
      ),
    };
  });
}
export function extractAliases(text: string) {
  const normal = text.toLowerCase();
  return skills.flatMap((skill) => {
    const alias = skill.aliases.find((a) =>
      new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
        normal,
      ),
    );
    if (!alias) return [];
    const start = normal.indexOf(alias);
    return [
      {
        id: skill.id,
        evidence: text.slice(
          Math.max(0, start - 35),
          Math.min(text.length, start + alias.length + 35),
        ),
        level: 1,
      },
    ];
  });
}
