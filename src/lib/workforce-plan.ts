import { roles, skills } from './catalogue';
import { buildPlan, rankRoles, matchRole } from './engine';
import { goalToRole } from './career-goals';
import type { Course, Profile, Scenario, Snapshot } from './types';
import {
  getWorkforceMembers,
  type WorkforceSettings,
} from './workforce-settings';

/** The workforce UI and PDF use the same worker-order allocation. */
export function buildWorkforcePlan(
  profile: Profile,
  scenario: Scenario,
  snapshot: Snapshot,
  workforce: WorkforceSettings,
) {
  const { destinations, budget, slots } = workforce;
  const team = getWorkforceMembers(workforce, profile);
  const rows = team.map((p) => {
    const ranked = rankRoles(p, scenario, snapshot);
    const custom =
      destinations[p.id] === 'custom-goal'
        ? workforce.customDestinations?.[p.id]
        : undefined;
    const role = custom
      ? { ...goalToRole(custom.goal), id: `custom:${p.id}` }
      : (roles.find((r) => r.id === destinations[p.id]) ?? ranked[0].role);
    return {
      profile: p,
      role,
      match: matchRole(p, role, scenario, snapshot),
      plan: buildPlan(p, role),
      specialistSkills: custom?.goal.otherSkills ?? [],
      openings: custom?.openings ?? slots[role.id] ?? 0,
    };
  });
  const groups = new Map<string, { course: Course; names: string[] }>();
  let allocated = 0;
  const used: Record<string, number> = {};
  const allocations = rows.map((row) => {
    const slotOk = (used[row.role.id] ?? 0) < row.openings,
      budgetOk = allocated + row.plan.totalCost <= budget;
    if (slotOk && budgetOk) {
      used[row.role.id] = (used[row.role.id] ?? 0) + 1;
      allocated += row.plan.totalCost;
      row.plan.steps.forEach((step) => {
        const c = step.course,
          group = groups.get(c.id) ?? {
            course: c,
            names: [],
          };
        group.names.push(row.profile.name);
        groups.set(c.id, group);
      });
    }
    return {
      ...row,
      included: slotOk && budgetOk,
      reason: !slotOk
        ? 'No internal slot'
        : !budgetOk
          ? 'Over team budget'
          : row.plan.uncovered.length || row.specialistSkills.length
            ? 'Partial learning route'
            : 'Learning route fits',
    };
  });
  const hours = [...groups.values()].reduce(
      (s, g) => s + g.course.hours * g.names.length,
      0,
    ),
    learners = allocations.filter(
      (r) => r.included && r.plan.steps.length > 0,
    ).length;
  const shown = skills.filter((s) =>
    allocations.some((r) => r.role.requirements[s.id]),
  );
  const openings = [
    ...roles.map((role) => ({ role, count: slots[role.id] ?? 0, worker: '' })),
    ...team.flatMap((member) => {
      const custom =
        destinations[member.id] === 'custom-goal'
          ? workforce.customDestinations?.[member.id]
          : undefined;
      return custom
        ? [
            {
              role: { ...goalToRole(custom.goal), id: `custom:${member.id}` },
              count: custom.openings,
              worker: member.name,
            },
          ]
        : [];
    }),
  ];
  return {
    team,
    allocations,
    groups,
    allocated,
    hours,
    learners,
    shown,
    openings,
  };
}
