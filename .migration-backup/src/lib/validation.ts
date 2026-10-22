import { z } from 'zod';
export const skillIdSchema = z.enum([
  'excel',
  'data',
  'critical',
  'communication',
  'project',
  'stakeholder',
  'sql',
  'visual',
  'ai',
  'ethics',
  'process',
  'logistics',
  'sustainability',
  'teaching',
  'security',
  'python',
]);
export const profileSchema = z.object({
  id: z.string().max(60),
  name: z.string().min(1).max(60),
  currentRole: z.string().max(100),
  hours: z.number().int().min(0).max(40),
  budget: z.number().min(0).max(100000),
  weeks: z.number().int().min(1).max(52),
  interests: z
    .array(z.enum(['data', 'people', 'operations', 'sustainability']))
    .max(4),
  skills: z.partialRecord(skillIdSchema, z.number().int().min(0).max(3)),
  completed: z.array(z.string().max(50)).max(30),
});
export const snapshotSchema = z.object({
  id: z.string().max(100),
  label: z.string().max(120),
  asOf: z.iso.datetime(),
  kind: z.enum(['simulation', 'live']),
  market: z.partialRecord(skillIdSchema, z.number().min(0).max(1)),
  sampleSize: z.number().int().min(0).max(10000),
  note: z.string().max(2000),
  signals: z
    .array(
      z.object({
        id: z.string().max(300),
        title: z.string().max(1000),
        url: z
          .string()
          .max(2000)
          .refine((v) => v === '' || /^https:\/\//.test(v)),
        publishedAt: z.iso.datetime().nullable(),
        collectedAt: z.iso.datetime(),
        kind: z.enum(['jobs', 'research', 'simulation']),
        geography: z.string().max(200),
        skills: z.array(skillIdSchema).max(16),
      }),
    )
    .max(200),
});
export const analysisSchema = z.object({
  profile: profileSchema,
  scenario: z.enum(['moderate', 'rapid']),
  snapshot: snapshotSchema,
});
