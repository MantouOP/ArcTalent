import { z } from 'zod';
import { careerGoalSchema, profileSchema, snapshotSchema } from './validation';
import { goalCandidates } from './career-goals';
import { effectiveInterests } from './interests';
import type { ChatContext } from './career-chat';
import type { CareerGoal } from './types';
import type { Locale } from './i18n';

const anonymousProfileSchema = profileSchema.pick({
  hours: true,
  budget: true,
  weeks: true,
  interests: true,
  skills: true,
  completed: true,
});
const evidenceSummarySchema = snapshotSchema.pick({
  id: true,
  asOf: true,
  kind: true,
  market: true,
  sampleSize: true,
});
export const chatRequestSchema = z
  .object({
    consent: z.literal(true),
    question: z.string().trim().min(1).max(600),
    locale: z.enum(['en', 'ms', 'zh-CN']),
    profile: anonymousProfileSchema,
    scenario: z.enum(['moderate', 'rapid']),
    snapshot: evidenceSummarySchema,
    roleId: z.string().max(100),
    customGoal: careerGoalSchema.nullish(),
    funding: z.enum(['all', 'free', 'hrd']).default('all'),
    history: z
      .array(
        z.object({
          question: z.string().max(600),
          answer: z.string().max(1800),
        }),
      )
      .max(4)
      .default([]),
  })
  .refine(
    (input) =>
      goalCandidates(input.customGoal ?? null).some(
        (role) => role.id === input.roleId,
      ),
    {
      message: 'Unknown career destination',
      path: ['roleId'],
    },
  );
export type CareerChatRequest = z.infer<typeof chatRequestSchema>;

/** Explicit allowlist: no names, CV content, pictures or team records cross this boundary. */
export function makeChatRequest(
  question: string,
  locale: Locale,
  context: ChatContext,
  options: {
    customGoal?: CareerGoal | null;
    funding?: 'all' | 'free' | 'hrd';
    history?: CareerChatRequest['history'];
  } = {},
): CareerChatRequest {
  const goal = options.customGoal;
  return chatRequestSchema.parse({
    consent: true,
    question,
    locale,
    // Typed interests stay on the device; only the work areas they match are sent.
    profile: anonymousProfileSchema.parse({
      ...context.profile,
      interests: effectiveInterests(context.profile),
    }),
    scenario: context.scenario,
    snapshot: evidenceSummarySchema.parse(context.snapshot),
    roleId: context.active.role.id,
    customGoal: goal ? { ...goal, description: '', summary: '' } : null,
    funding: options.funding ?? 'all',
    history: options.history ?? [],
  });
}
