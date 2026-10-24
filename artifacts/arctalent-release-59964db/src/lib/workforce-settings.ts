import { z } from 'zod';
import { employees, roles } from './catalogue';
import { profileSchema } from './validation';
import type { Profile } from './types';

export type WorkforceSettings = {
  budget: number;
  slots: Record<string, number>;
  destinations: Partial<Record<string, string>>;
  members?: Profile[];
};

const roleIdSchema = z.enum(roles.map((role) => role.id));
export const workforceSettingsSchema = z
  .object({
    budget: z.number().min(0).max(100000),
    slots: z.record(roleIdSchema, z.number().int().min(0).max(10)),
    destinations: z.record(z.string().min(1).max(60), roleIdSchema),
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
      Object.keys(value.destinations).some((id) => !ids.has(id))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Use unique workers and valid destinations.',
      });
    }
  });

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
