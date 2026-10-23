import { z } from 'zod';
import { employees, roles } from './catalogue';

export type WorkforceSettings = {
  budget: number;
  slots: Record<string, number>;
  destinations: Partial<Record<string, string>>;
};

const roleIdSchema = z.enum(roles.map((role) => role.id));
const workforceSettingsSchema = z.object({
  budget: z.number().min(0).max(100000),
  slots: z.record(roleIdSchema, z.number().int().min(0).max(8)),
  destinations: z.partialRecord(
    z.enum(employees.map((employee) => employee.id)),
    roleIdSchema,
  ),
});

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
