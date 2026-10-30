import { z } from 'zod';
import { maxCustomInterestLength, maxCustomInterests } from './interests';
export const learningPreferencesSchema = z.object({
  focus: z.enum(['data', 'people', 'operations', 'sustainability']),
  format: z.enum(['guided', 'practice', 'discussion']),
  sessionMinutes: z.number().int().min(5).max(180),
  workAnswer: z.string().trim().max(600).optional(),
  practiceAnswer: z.string().trim().max(600).optional(),
});
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
  'htmlcss',
  'javascript',
  'marketing',
]);
export const careerGoalInputSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1200).default(''),
  locale: z.enum(['en', 'ms', 'zh-CN']).default('en'),
});
export const careerGoalSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1200),
  family: z.enum(['data', 'people', 'operations', 'sustainability']),
  requirements: z
    .partialRecord(skillIdSchema, z.number().int().min(1).max(3))
    .refine(
      (value) => Object.keys(value).length > 0,
      'Choose at least one skill target',
    ),
  otherSkills: z.array(z.string().trim().min(1).max(120)).max(8),
  summary: z.string().trim().max(500),
  mode: z.enum(['ai', 'local', 'manual']),
});
export const profileSchema = z.object({
  id: z.string().max(60),
  name: z.string().trim().min(1).max(60),
  currentRole: z.string().max(100),
  hours: z.number().int().min(0).max(40),
  budget: z.number().min(0).max(100000),
  weeks: z.number().int().min(1).max(52),
  interests: z
    .array(z.enum(['data', 'people', 'operations', 'sustainability']))
    .max(4),
  customInterests: z
    .array(z.string().trim().min(1).max(maxCustomInterestLength))
    .max(maxCustomInterests)
    .optional(),
  skills: z.partialRecord(skillIdSchema, z.number().int().min(0).max(3)),
  completed: z.array(z.string().max(50)).max(30),
  learningPreferences: learningPreferencesSchema.optional(),
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
        skills: z.array(skillIdSchema).max(skillIdSchema.options.length),
      }),
    )
    .max(200),
});
export const analysisSchema = z.object({
  profile: profileSchema,
  scenario: z.enum(['moderate', 'rapid']),
  snapshot: snapshotSchema,
  customGoal: careerGoalSchema.optional(),
});
