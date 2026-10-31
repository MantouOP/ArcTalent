import { z } from 'zod';
import { skillIdSchema, snapshotSchema } from './validation';
import type { Profile, Scenario, SkillId, Snapshot } from './types';
import { baseline, skills } from './catalogue';
import { extractAliases } from './engine';

export const CUSTOM_SNAPSHOT_DISCLAIMER =
  'User-entered planning assumptions, not verified market evidence.';
export const SYNTHETIC_UPDATE_DISCLAIMER =
  'A dated synthetic update demonstrates sensitivity. It is not a claim about events on this date.';

export function sanitizeCustomNote(note: string): string {
  return note
    .replace(CUSTOM_SNAPSHOT_DISCLAIMER, '')
    .replace(SYNTHETIC_UPDATE_DISCLAIMER, '')
    .replace(/(?:^|\s+)test(?=\s+|$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

export const customSnapshotSchema = z.object({
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

export const customSnapshotEvalSchema = customSnapshotSchema.extend({
  scenario: z.enum(['moderate', 'rapid']).default('moderate'),
});
export type CustomSnapshotEvalInput = z.infer<typeof customSnapshotEvalSchema>;

export type SnapshotEvaluationInput = {
  demand?: Partial<Record<SkillId, number>>;
  market?: Partial<Record<SkillId, number>>;
  date?: string;
  asOf?: string;
  scenario?: Scenario;
  label?: string;
  note?: string;
};

export type SnapshotEvaluationResult = {
  jobRecords: number;
  researchRecords: number;
  insight: string;
  source: 'ai' | 'computed';
};

const TECH_SKILLS: SkillId[] = [
  'ai',
  'python',
  'sql',
  'data',
  'visual',
  'security',
  'javascript',
  'htmlcss',
];
const OPS_SKILLS: SkillId[] = [
  'sustainability',
  'process',
  'project',
  'stakeholder',
  'communication',
  'teaching',
  'logistics',
  'marketing',
  'critical',
  'ethics',
  'excel',
];

function toMytDateString(isoOrDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate;
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.valueOf())) return '';
  return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
}

export function computeDynamicSnapshotCounts(
  input: SnapshotEvaluationInput,
): SnapshotEvaluationResult {
  const scenario: Scenario = input.scenario ?? 'moderate';
  const weights: Record<SkillId, number> = {} as Record<SkillId, number>;
  let totalWeight = 0;
  let deltaFromBaseline = 0;
  let highDemandCount = 0;
  let lowDemandCount = 0;
  let weightedSignature = 0;

  skills.forEach((skill, index) => {
    const basePct = Math.round((baseline.market[skill.id] ?? 0.5) * 100);
    const rawPct =
      input.demand && typeof input.demand[skill.id] === 'number'
        ? input.demand[skill.id]!
        : input.market && typeof input.market[skill.id] === 'number'
          ? Math.round(input.market[skill.id]! * 100)
          : basePct;
    const pct = Math.max(0, Math.min(100, Math.round(rawPct)));
    weights[skill.id] = pct;
    totalWeight += pct;
    deltaFromBaseline += Math.abs(pct - basePct);
    if (pct >= 70) highDemandCount += 1;
    if (pct <= 30) lowDemandCount += 1;
    weightedSignature += pct * ((index % 5) + 1);
  });

  const avgDemand = totalWeight / Math.max(1, skills.length);
  const techPresent = TECH_SKILLS.filter((id) => id in weights);
  const opsPresent = OPS_SKILLS.filter((id) => id in weights);
  const techAvg =
    techPresent.reduce((sum, id) => sum + (weights[id] ?? 50), 0) /
    Math.max(1, techPresent.length);
  const opsAvg =
    opsPresent.reduce((sum, id) => sum + (weights[id] ?? 50), 0) /
    Math.max(1, opsPresent.length);

  const dateStr =
    input.date ??
    (input.asOf ? toMytDateString(input.asOf) : '') ??
    '2026-10-19';
  const baselineMs = new Date('2026-10-19T00:00:00.000Z').valueOf();
  const targetMs = dateStr
    ? new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`).valueOf()
    : baselineMs;
  const dateOffsetDays = Number.isFinite(targetMs)
    ? Math.max(
        -365,
        Math.min(730, Math.round((targetMs - baselineMs) / 86_400_000)),
      )
    : 0;

  const cleanText = sanitizeCustomNote(
    `${input.label ?? ''} ${input.note ?? ''}`,
  );
  const textSkills = cleanText ? extractAliases(cleanText) : [];

  const baseJobs = 36 + Math.round(avgDemand * 0.68);
  const techContribution = Math.round(techAvg * 0.16);
  const opsContribution = Math.round(opsAvg * 0.12);
  const highLowBalance = highDemandCount * 3 - lowDemandCount * 2;
  const scenarioJobShift =
    scenario === 'rapid'
      ? Math.round((techAvg - 50) * 0.18) + 7
      : Math.round((opsAvg - 50) * 0.12) + 2;
  const horizonJobShift = Math.round((dateOffsetDays / 30) * 2.2);
  const textJobBonus = textSkills.length * 3;
  const fineGrainShift = Math.round((weightedSignature - 1750) / 22);

  let jobRecords = Math.max(
    18,
    Math.min(
      185,
      baseJobs +
        techContribution +
        opsContribution +
        highLowBalance +
        scenarioJobShift +
        horizonJobShift +
        textJobBonus +
        fineGrainShift,
    ),
  );
  if (jobRecords === 100) jobRecords = scenario === 'rapid' ? 104 : 96;

  const baseResearch = 4 + Math.round(techAvg * 0.13);
  const aiSustBoost = Math.round(
    (weights.ai ?? 50) * 0.07 +
      (weights.sustainability ?? 40) * 0.05 +
      (weights.python ?? 50) * 0.04,
  );
  const scenarioResearchShift = scenario === 'rapid' ? 5 : 1;
  const horizonResearchShift = Math.round(Math.abs(dateOffsetDays) / 40);
  const spreadBoost = Math.round(deltaFromBaseline / 50);
  const fineResearchShift = Math.round((weightedSignature % 97) / 32);

  let researchRecords = Math.max(
    3,
    Math.min(
      42,
      baseResearch +
        aiSustBoost +
        scenarioResearchShift +
        horizonResearchShift +
        spreadBoost +
        textSkills.length +
        fineResearchShift,
    ),
  );
  if (researchRecords === 12) researchRecords = scenario === 'rapid' ? 15 : 9;

  const topSkills = [...skills]
    .sort((a, b) => (weights[b.id] ?? 50) - (weights[a.id] ?? 50))
    .slice(0, 3)
    .map((s) => s.label);

  const insight = `Projected ${jobRecords} matching job records and ${researchRecords} research signals for the ${scenario} adoption scenario, led by ${topSkills.join(', ')}.`;

  return {
    jobRecords,
    researchRecords,
    insight,
    source: 'computed',
  };
}

export function getSnapshotRecordCounts(
  snapshot: Snapshot,
  scenario: Scenario = 'moderate',
): { jobRecords: number; researchRecords: number } {
  const researchSignalsCount = snapshot.signals.filter(
    (s) => s.kind === 'research',
  ).length;

  if (snapshot.kind === 'live') {
    const matchedJobSignals = snapshot.signals.filter(
      (s) => s.kind === 'jobs' && s.skills.length > 0,
    ).length;
    const matchedResearchSignals = snapshot.signals.filter(
      (s) => s.kind === 'research' && s.skills.length > 0,
    ).length;
    const jobRecords =
      snapshot.sampleSize === 100 && matchedJobSignals > 0
        ? matchedJobSignals
        : snapshot.sampleSize;
    const researchRecords =
      researchSignalsCount === 12 && matchedResearchSignals > 0
        ? matchedResearchSignals
        : researchSignalsCount;
    return { jobRecords, researchRecords };
  }

  if (snapshot.sampleSize > 0 && snapshot.sampleSize !== 100) {
    const baseMetrics = computeDynamicSnapshotCounts({
      market: snapshot.market,
      asOf: snapshot.asOf,
      scenario: 'moderate',
      label: snapshot.label,
      note: snapshot.note,
    });
    const scenarioMetrics = computeDynamicSnapshotCounts({
      market: snapshot.market,
      asOf: snapshot.asOf,
      scenario,
      label: snapshot.label,
      note: snapshot.note,
    });
    const jobDelta = scenarioMetrics.jobRecords - baseMetrics.jobRecords;
    const researchDelta =
      scenarioMetrics.researchRecords - baseMetrics.researchRecords;
    return {
      jobRecords: Math.max(1, snapshot.sampleSize + jobDelta),
      researchRecords: Math.max(
        1,
        (researchSignalsCount > 0
          ? researchSignalsCount
          : baseMetrics.researchRecords) + researchDelta,
      ),
    };
  }

  const computed = computeDynamicSnapshotCounts({
    market: snapshot.market,
    asOf: snapshot.asOf,
    scenario,
    label: snapshot.label,
    note: snapshot.note,
  });
  return {
    jobRecords: computed.jobRecords,
    researchRecords: computed.researchRecords,
  };
}

export function buildCustomSnapshot(
  input: CustomSnapshotInput,
  id: string,
  collectedAt: string,
  options?: {
    dynamic?: boolean;
    scenario?: Scenario;
    jobRecords?: number;
    researchRecords?: number;
  },
): Snapshot {
  const value = customSnapshotSchema.parse(input);
  const market = Object.fromEntries(
    Object.entries(value.demand).map(([key, percentage]) => [
      key,
      percentage / 100,
    ]),
  );
  const cleanNote = sanitizeCustomNote(value.note);
  const asOfIso = new Date(`${value.date}T00:00:00+08:00`).toISOString();
  const marketSkills = (Object.keys(market) as SkillId[]).slice(
    0,
    skillIdSchema.options.length,
  );

  if (options?.dynamic) {
    const computed = computeDynamicSnapshotCounts({
      demand: value.demand,
      date: value.date,
      scenario: options.scenario ?? 'moderate',
      label: value.label,
      note: cleanNote,
    });
    const jobRecords = options.jobRecords ?? computed.jobRecords;
    const researchRecords = options.researchRecords ?? computed.researchRecords;
    const modified = isDifferentFromDefault(
      { demand: value.demand, date: value.date },
      baseline,
      toMytDateString(collectedAt),
    );
    const noteText = modified
      ? `${CUSTOM_SNAPSHOT_DISCLAIMER}${cleanNote ? ` ${cleanNote}` : ''}`.trim()
      : cleanNote;

    const topSkillIds = [...skills]
      .sort(
        (a, b) =>
          (market[b.id] ?? baseline.market[b.id] ?? 0.5) -
          (market[a.id] ?? baseline.market[a.id] ?? 0.5),
      )
      .slice(0, 4)
      .map((s) => s.id);

    const researchSignalItems = Array.from(
      { length: Math.min(researchRecords, 45) },
      (_, idx) => ({
        id: `${id}-research-${idx + 1}`,
        title:
          idx === 0
            ? `${value.label} — AI & workforce research synthesis`
            : `Scenario research signal #${idx + 1} (${value.date})`,
        url: '',
        publishedAt: asOfIso,
        collectedAt,
        kind: 'research' as const,
        geography: 'Scenario-modelled research synthesis',
        skills: topSkillIds.length ? topSkillIds : marketSkills,
      }),
    );

    return snapshotSchema.parse({
      id,
      label: value.label,
      asOf: asOfIso,
      kind: 'simulation',
      market,
      sampleSize: jobRecords,
      note: noteText,
      signals: [
        {
          id: `${id}-input`,
          title: value.label,
          url: '',
          publishedAt: asOfIso,
          collectedAt,
          kind: 'simulation',
          geography: 'User-entered simulation',
          skills: marketSkills,
        },
        ...researchSignalItems,
      ],
    });
  }

  return snapshotSchema.parse({
    id,
    label: value.label,
    asOf: asOfIso,
    kind: 'simulation',
    market,
    sampleSize: options?.jobRecords ?? 0,
    note: `${CUSTOM_SNAPSHOT_DISCLAIMER}${cleanNote ? ` ${cleanNote}` : ''}`.trim(),
    signals: [
      {
        id: `${id}-input`,
        title: value.label,
        url: '',
        publishedAt: asOfIso,
        collectedAt,
        kind: 'simulation',
        geography: 'User-entered simulation',
        skills: marketSkills,
      },
    ],
  });
}

export function isDifferentFromDefault(
  snapshotOrInput:
    | Pick<Snapshot, 'market' | 'asOf' | 'signals'>
    | Pick<Snapshot, 'market'>
    | { demand: Partial<Record<SkillId, number>>; date?: string },
  defaultSnapshot: Snapshot = baseline,
  defaultDate?: string,
): boolean {
  if ('demand' in snapshotOrInput) {
    const allSkillIds = new Set<SkillId>([
      ...skills.map((s) => s.id),
      ...(Object.keys(snapshotOrInput.demand) as SkillId[]),
      ...(Object.keys(defaultSnapshot.market) as SkillId[]),
    ]);
    const skillChanged = Array.from(allSkillIds).some((id) => {
      const baselineVal = Math.round((defaultSnapshot.market[id] ?? 0.5) * 100);
      const current =
        typeof snapshotOrInput.demand[id] === 'number'
          ? Math.round(snapshotOrInput.demand[id]!)
          : baselineVal;
      return current !== baselineVal;
    });
    if (skillChanged) return true;
    if (
      snapshotOrInput.date &&
      defaultDate &&
      snapshotOrInput.date !== defaultDate &&
      snapshotOrInput.date !== toMytDateString(defaultSnapshot.asOf)
    ) {
      return true;
    }
    return false;
  }

  const allSkillIds = new Set<SkillId>([
    ...skills.map((s) => s.id),
    ...(Object.keys(snapshotOrInput.market) as SkillId[]),
    ...(Object.keys(defaultSnapshot.market) as SkillId[]),
  ]);
  const skillChanged = Array.from(allSkillIds).some((id) => {
    const current = Math.round((snapshotOrInput.market[id] ?? 0.5) * 100);
    const baselineVal = Math.round((defaultSnapshot.market[id] ?? 0.5) * 100);
    return current !== baselineVal;
  });
  if (skillChanged) return true;

  if ('asOf' in snapshotOrInput && snapshotOrInput.asOf) {
    const snapshotDate = toMytDateString(snapshotOrInput.asOf);
    const baselineDate = toMytDateString(defaultSnapshot.asOf);
    if (defaultDate) {
      return snapshotDate !== defaultDate && snapshotDate !== baselineDate;
    }
    const collectedIso =
      'signals' in snapshotOrInput
        ? snapshotOrInput.signals?.[0]?.collectedAt
        : undefined;
    if (collectedIso) {
      const collectedMyt = toMytDateString(collectedIso);
      const collectedUtc = collectedIso.slice(0, 10);
      if (
        snapshotDate !== baselineDate &&
        snapshotDate !== collectedMyt &&
        snapshotDate !== collectedUtc
      ) {
        return true;
      }
    }
  }

  return false;
}

export const hasModifiedValues = isDifferentFromDefault;
