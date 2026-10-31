import { z } from 'zod';
import { courses } from './catalogue';
import type { LearnerBadge } from './finals-enhancements';
import type { PracticeBadge } from './study-progress-ai';
import type { Course, Role, SkillId } from './types';
import { skillIdSchema } from './validation';

const courseById = new Map<string, Course>(
  courses.map((course) => [course.id, course]),
);
const courseIdSchema = z.enum(
  courses.map((course) => course.id) as [string, ...string[]],
);
const recordedAt = z.iso.datetime();

/**
 * One verifiable event in a learner's reskilling journey. Course and badge
 * entries mirror what is currently true (a course still marked studied, a
 * badge still earned); skill progressions are kept because the person
 * explicitly confirmed them.
 */
export const trackRecordEntrySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('course'),
    courseId: courseIdSchema,
    recordedAt,
  }),
  z.object({
    kind: z.literal('milestone-badge'),
    badgeId: z.string().min(1).max(60),
    title: z.string().min(1).max(100),
    recordedAt,
  }),
  z.object({
    kind: z.literal('practice-badge'),
    courseId: courseIdSchema,
    title: z.string().min(1).max(100),
    skillId: skillIdSchema,
    quote: z.string().trim().min(2).max(200),
    mode: z.enum(['ai', 'local']),
    recordedAt,
  }),
  z.object({
    kind: z.literal('skill'),
    skillId: skillIdSchema,
    fromLevel: z.number().int().min(0).max(3),
    toLevel: z.number().int().min(0).max(3),
    source: z.enum(['practice-badge', 'profile-review']),
    recordedAt,
  }),
]);
export type TrackRecordEntry = z.infer<typeof trackRecordEntrySchema>;

export const maxTrackRecordEntries = 200;
export const trackRecordsByProfileSchema = z.record(
  z.string().min(1).max(60),
  z.array(trackRecordEntrySchema).max(maxTrackRecordEntries),
);
export type TrackRecordsByProfile = z.infer<typeof trackRecordsByProfileSchema>;

/** Browser storage is optional and untrusted: anything invalid starts empty. */
export function restoreTrackRecords(raw: unknown): TrackRecordsByProfile {
  const parsed = trackRecordsByProfileSchema.safeParse(raw);
  if (!parsed.success) return {};
  return Object.fromEntries(Object.entries(parsed.data).slice(0, 24));
}

const entryKey = (entry: TrackRecordEntry) =>
  entry.kind === 'course'
    ? `course:${entry.courseId}`
    : entry.kind === 'milestone-badge'
      ? `milestone:${entry.badgeId}`
      : entry.kind === 'practice-badge'
        ? `practice:${entry.courseId}:${entry.skillId}`
        : `skill:${entry.skillId}:${entry.recordedAt}`;

const newestFirst = (a: TrackRecordEntry, b: TrackRecordEntry) =>
  b.recordedAt.localeCompare(a.recordedAt);

/**
 * Brings course and badge entries in line with what is true now, keeping the
 * original date of anything that was already recorded. Unmarking a course
 * removes its course entry and any practice badge that depended on it.
 */
export function syncTrackRecord(
  record: readonly TrackRecordEntry[],
  state: {
    completed: readonly string[];
    milestones: readonly Pick<LearnerBadge, 'id' | 'title' | 'earned'>[];
    practiceBadges: readonly PracticeBadge[];
  },
  now: string,
): TrackRecordEntry[] {
  const wanted: TrackRecordEntry[] = [
    ...state.completed
      .filter((id) => courseById.has(id))
      .map((courseId) => ({
        kind: 'course' as const,
        courseId,
        recordedAt: now,
      })),
    ...state.milestones
      .filter((badge) => badge.earned)
      .map((badge) => ({
        kind: 'milestone-badge' as const,
        badgeId: badge.id,
        title: badge.title,
        recordedAt: now,
      })),
    ...state.practiceBadges.flatMap((badge) =>
      badge.demonstratedSkills.map((skill) => ({
        kind: 'practice-badge' as const,
        courseId: badge.courseId,
        title: badge.badgeTitle,
        skillId: skill.id,
        quote: skill.quote,
        mode: badge.mode,
        recordedAt: now,
      })),
    ),
  ];
  const existing = new Map(record.map((entry) => [entryKey(entry), entry]));
  const synced = wanted.map((entry) => {
    const previous = existing.get(entryKey(entry));
    return previous ? { ...entry, recordedAt: previous.recordedAt } : entry;
  });
  const progressions = record.filter((entry) => entry.kind === 'skill');
  return [...synced, ...progressions]
    .sort(newestFirst)
    .slice(0, maxTrackRecordEntries);
}

/**
 * Records skills the person explicitly raised. Lowered or unchanged levels
 * are not progressions and are not recorded.
 */
export function recordSkillProgressions(
  record: readonly TrackRecordEntry[],
  before: Partial<Record<SkillId, number>>,
  after: Partial<Record<SkillId, number>>,
  source: 'practice-badge' | 'profile-review',
  now: string,
): TrackRecordEntry[] {
  const raised = (Object.keys(after) as SkillId[])
    .filter((id) => (after[id] ?? 0) > (before[id] ?? 0))
    .map((skillId) => ({
      kind: 'skill' as const,
      skillId,
      fromLevel: before[skillId] ?? 0,
      toLevel: after[skillId] ?? 0,
      source,
      recordedAt: now,
    }));
  if (!raised.length) return [...record];
  return [...raised, ...record]
    .sort(newestFirst)
    .slice(0, maxTrackRecordEntries);
}

export type TrackRecordSummary = {
  hoursStudied: number;
  coursesCompleted: number;
  verifiedBadges: number;
  skillsLeveledUp: number;
  /** Required levels closed towards the active destination by confirmed progressions. */
  gapDistanceClosed: number;
};

export function summarizeTrackRecord(
  record: readonly TrackRecordEntry[],
  role?: Pick<Role, 'requirements'>,
): TrackRecordSummary {
  const courseEntries = record.filter((entry) => entry.kind === 'course');
  const skillEntries = record.filter((entry) => entry.kind === 'skill');
  const practiceBadges = new Set(
    record
      .filter((entry) => entry.kind === 'practice-badge')
      .map((entry) => entry.courseId),
  );
  return {
    hoursStudied: courseEntries.reduce(
      (sum, entry) => sum + (courseById.get(entry.courseId)?.hours ?? 0),
      0,
    ),
    coursesCompleted: courseEntries.length,
    verifiedBadges:
      record.filter((entry) => entry.kind === 'milestone-badge').length +
      practiceBadges.size,
    skillsLeveledUp: new Set(skillEntries.map((entry) => entry.skillId)).size,
    // Per skill, from the first recorded level to the latest one, so a skill
    // raised twice is not counted twice.
    gapDistanceClosed: [...new Set(skillEntries.map((e) => e.skillId))].reduce(
      (sum, skillId) => {
        const entries = skillEntries
          .filter((entry) => entry.skillId === skillId)
          .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
        const required = role?.requirements[skillId] ?? 0;
        const from = Math.min(entries[0].fromLevel, required);
        const to = Math.min(entries.at(-1)!.toLevel, required);
        return sum + Math.max(0, to - from);
      },
      0,
    ),
  };
}

export const trackRecordCourse = (id: string) => courseById.get(id);
