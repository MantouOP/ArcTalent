import { z } from 'zod';
import { skillIdSchema, snapshotSchema } from './validation';
import type { Profile, Snapshot } from './types';

export function validateCvFile(file: {
  name: string;
  size: number;
}): string | null {
  if (file.size > 5 * 1024 * 1024) return 'Choose a file smaller than 5 MB.';
  if (!/\.(txt|pdf)$/i.test(file.name)) return 'Use a text PDF or .txt file.';
  if (!file.size)
    return 'This file is empty. Choose another file or paste your experience.';
  return null;
}

export function createProfileDraft(id: string): Profile {
  return {
    id,
    name: '',
    currentRole: '',
    hours: 4,
    budget: 0,
    weeks: 8,
    interests: [],
    skills: {},
    completed: [],
  };
}

const customSnapshotSchema = z.object({
  label: z.string().trim().min(1).max(120),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(date.valueOf()) &&
        date.toISOString().slice(0, 10) === value
      );
    }),
  note: z.string().trim().max(1500),
  demand: z.partialRecord(skillIdSchema, z.number().min(0).max(100)),
});
export type CustomSnapshotInput = z.infer<typeof customSnapshotSchema>;

export function buildCustomSnapshot(
  input: CustomSnapshotInput,
  id: string,
  collectedAt: string,
): Snapshot {
  const value = customSnapshotSchema.parse(input);
  const market = Object.fromEntries(
    Object.entries(value.demand).map(([key, percentage]) => [
      key,
      percentage / 100,
    ]),
  );
  return snapshotSchema.parse({
    id,
    label: value.label,
    asOf: new Date(`${value.date}T00:00:00+08:00`).toISOString(),
    kind: 'simulation',
    market,
    sampleSize: 0,
    note: `User-entered planning assumptions, not verified market evidence. ${value.note}`.trim(),
    signals: [
      {
        id: `${id}-input`,
        title: value.label,
        url: '',
        publishedAt: new Date(`${value.date}T00:00:00+08:00`).toISOString(),
        collectedAt,
        kind: 'simulation',
        geography: 'User-entered simulation',
        skills: Object.keys(market),
      },
    ],
  });
}
