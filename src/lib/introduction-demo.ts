import { baseline, employees, updated } from './catalogue';
import { buildPlan, rankRoles, sharedFoundation } from './engine';
import type { Scenario } from './types';

export const introductionPeople = employees.filter((person) =>
  ['aina', 'daniel', 'mei'].includes(person.id),
);

/** A disposable example: no workspace storage, uploads, network or AI calls. */
export function introductionDemo(
  personId: string,
  hours: number,
  scenario: Scenario,
  newer: boolean,
) {
  const profile = structuredClone(
    introductionPeople.find((person) => person.id === personId) ??
      introductionPeople[0],
  );
  profile.hours = hours;
  const snapshot = structuredClone(newer ? updated : baseline);
  const ranking = rankRoles(profile, scenario, snapshot);
  const shared = sharedFoundation(profile, snapshot);
  return {
    profile,
    snapshot,
    ranking,
    shared,
    plan: buildPlan(profile, ranking[0].role, shared, 'free'),
  };
}
