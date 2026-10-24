import { z } from 'zod';
import { employees, roles } from './catalogue';
import { careerGoalSchema, profileSchema } from './validation';
import type { CareerGoal, Profile } from './types';

export type WorkforceSettings = {
  budget: number;
  slots: Record<string, number>;
  destinations: Partial<Record<string, string>>;
  members?: Profile[];
  customDestinations?: Record<string, { goal: CareerGoal; openings: number }>;
};

const roleIdSchema = z.enum(roles.map((role) => role.id));
export const workforceSettingsSchema = z
  .object({
    budget: z.number().min(0).max(100000),
    slots: z.record(roleIdSchema, z.number().int().min(0).max(10)),
    destinations: z.record(
      z.string().min(1).max(60),
      z.enum([...roles.map((role) => role.id), 'custom-goal']),
    ),
    customDestinations: z
      .record(
        z.string().min(1).max(60),
        z.object({
          goal: careerGoalSchema,
          openings: z.number().int().min(0).max(10),
        }),
      )
      .optional(),
    members: z
      .array(profileSchema.extend({ id: z.string().min(1).max(60) }))
      .max(10)
      .optional(),
  })
  .superRefine((value, context) => {
    const members = value.members ?? employees;
    const ids = new Set(members.map((member) => member.id));
    if (
      ids.size !== members.length ||
      Object.entries(value.destinations).some(
        ([id, destination]) =>
          !ids.has(id) ||
          (destination === 'custom-goal' &&
            !Object.hasOwn(value.customDestinations ?? {}, id)),
      ) ||
      Object.keys(value.customDestinations ?? {}).some((id) => !ids.has(id))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Use unique workers and valid destinations.',
      });
    }
  });

export function applyWorkforceGoal(
  workforce: WorkforceSettings,
  workerId: string,
  goal: CareerGoal,
  openings: number,
): WorkforceSettings {
  return workforceSettingsSchema.parse({
    ...workforce,
    destinations: { ...workforce.destinations, [workerId]: 'custom-goal' },
    customDestinations: {
      ...workforce.customDestinations,
      [workerId]: { goal, openings },
    },
  });
}

export function clearWorkforceGoal(
  workforce: WorkforceSettings,
  workerId: string,
): WorkforceSettings {
  return {
    ...workforce,
    destinations: Object.fromEntries(
      Object.entries(workforce.destinations).filter(
        ([id, destination]) => id !== workerId || destination !== 'custom-goal',
      ),
    ),
    customDestinations: Object.fromEntries(
      Object.entries(workforce.customDestinations ?? {}).filter(
        ([id]) => id !== workerId,
      ),
    ),
  };
}

export function removeWorkforceMember(
  workforce: WorkforceSettings,
  workerId: string,
  team: Profile[],
): WorkforceSettings {
  const cleared = clearWorkforceGoal(workforce, workerId);
  return {
    ...cleared,
    members: team.filter((member) => member.id !== workerId),
    destinations: Object.fromEntries(
      Object.entries(cleared.destinations).filter(([id]) => id !== workerId),
    ),
  };
}

export function getWorkforceMembers(
  workforce: WorkforceSettings,
  profile: Profile,
): Profile[] {
  return (workforce.members ?? employees).map((member) =>
    member.id === profile.id ? profile : member,
  );
}

export function updateWorkforceProfile(
  workforce: WorkforceSettings,
  profile: Profile,
): WorkforceSettings {
  const members = workforce.members ?? employees;
  if (!members.some((member) => member.id === profile.id)) return workforce;
  return {
    ...workforce,
    members: members.map((member) =>
      member.id === profile.id ? profile : member,
    ),
  };
}

export function restoreWorkforceSettings(value?: unknown): WorkforceSettings {
  const parsed = workforceSettingsSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return {
    budget: 500,
    slots: {
      bi: 2,
      project: 2,
      sustainability: 1,
      logistics: 1,
      training: 1,
      management: 1,
    },
    destinations: {},
  };
}
