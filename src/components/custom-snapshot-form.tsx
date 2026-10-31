'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { baseline, skills } from '@/lib/catalogue';
import {
  buildCustomSnapshot,
  computeDynamicSnapshotCounts,
  isDifferentFromDefault,
  sanitizeCustomNote,
  type SnapshotEvaluationResult,
} from '@/lib/custom-inputs';
import { snapshotSchema } from '@/lib/validation';
import type { Scenario, SkillId, Snapshot } from '@/lib/types';
import { useI18n } from './language-provider';

export type CustomSnapshotPreview = {
  modified: boolean;
  jobRecords: number;
  researchRecords: number;
  insight: string;
  evaluating: boolean;
};

const clientEvalCache = new Map<string, SnapshotEvaluationResult>();

export function CustomSnapshotForm({
  snapshot,
  scenario = 'moderate',
  onApply,
  onModeChange,
  onPreviewChange,
}: {
  snapshot: Snapshot;
  scenario?: Scenario;
  onApply: (snapshot: Snapshot) => void;
  onModeChange?: (open: boolean) => void;
  onPreviewChange?: (preview: CustomSnapshotPreview) => void;
}) {
  const { t } = useI18n();
  const initialDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }),
    [],
  );
  const defaultDemand = useMemo(
    () =>
      Object.fromEntries(
        skills.map((skill) => [
          skill.id,
          Math.round((baseline.market[skill.id] ?? 0.5) * 100),
        ]),
      ) as Record<SkillId, number>,
    [],
  );

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(initialDate);
  const [note, setNote] = useState('');
  const [demand, setDemand] = useState<Record<SkillId, number>>(defaultDemand);
  const [message, setMessage] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [aiOverride, setAiOverride] = useState<{
    key: string;
    result: SnapshotEvaluationResult;
  } | null>(null);
  const prevSnapshotId = useRef(snapshot.id);

  useEffect(() => {
    if (snapshot.id !== prevSnapshotId.current) {
      prevSnapshotId.current = snapshot.id;
      if (snapshot.id === baseline.id) {
        setDemand(defaultDemand);
        setDate(initialDate);
        setNote('');
      }
    }
  }, [snapshot.id, defaultDemand, initialDate]);

  const modified = useMemo(
    () => isDifferentFromDefault({ demand, date }, baseline, initialDate),
    [demand, date, initialDate],
  );

  const cleanNote = useMemo(() => sanitizeCustomNote(note), [note]);

  const evalKey = useMemo(
    () =>
      JSON.stringify({
        date,
        scenario,
        note: cleanNote,
        demand: Object.entries(demand).sort(([a], [b]) => a.localeCompare(b)),
      }),
    [date, scenario, cleanNote, demand],
  );

  const computedMetrics = useMemo(
    () =>
      computeDynamicSnapshotCounts({
        demand,
        date,
        scenario,
        label,
        note: cleanNote,
      }),
    [demand, date, scenario, label, cleanNote],
  );

  const activeMetrics =
    aiOverride && aiOverride.key === evalKey
      ? aiOverride.result
      : (clientEvalCache.get(evalKey) ?? computedMetrics);

  useEffect(() => {
    onPreviewChange?.({
      modified,
      jobRecords: activeMetrics.jobRecords,
      researchRecords: activeMetrics.researchRecords,
      insight: activeMetrics.insight,
      evaluating,
    });
  }, [
    modified,
    activeMetrics.jobRecords,
    activeMetrics.researchRecords,
    activeMetrics.insight,
    evaluating,
    onPreviewChange,
  ]);

  function toggleOpen() {
    const nextOpen = !open;
    if (nextOpen && !isDifferentFromDefault(snapshot)) {
      setDemand(defaultDemand);
      setDate(initialDate);
    }
    setOpen(nextOpen);
    onModeChange?.(nextOpen);
  }

  return (
    <section className="panel custom-snapshot">
      <div className="panel-heading">
        <div>
          <h2>{t('Try your own dated assumptions')}</h2>
          <p>
            {t(
              'Enter a planning case and skill-demand values. These are your assumptions, not verified market data.',
            )}
          </p>
        </div>
        <button className="secondary" aria-expanded={open} onClick={toggleOpen}>
          {t(open ? 'Close custom snapshot' : 'Create custom snapshot')}
        </button>
      </div>
      {open && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setEvaluating(true);
            try {
              const sanitizedNote = sanitizeCustomNote(note);
              let finalMetrics =
                clientEvalCache.get(evalKey) ?? computedMetrics;
              let serverSnapshot: Snapshot | null = null;

              try {
                const response = await fetch('/api/signals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    label,
                    date,
                    note: sanitizedNote,
                    demand,
                    scenario,
                  }),
                });
                if (response.ok) {
                  const payload = await response.json();
                  const parsedSnap = snapshotSchema.safeParse(payload.snapshot);
                  if (
                    typeof payload.jobRecords === 'number' &&
                    typeof payload.researchRecords === 'number'
                  ) {
                    finalMetrics = {
                      jobRecords: payload.jobRecords,
                      researchRecords: payload.researchRecords,
                      insight:
                        typeof payload.insight === 'string'
                          ? payload.insight
                          : computedMetrics.insight,
                      source: payload.source === 'ai' ? 'ai' : 'computed',
                    };
                    clientEvalCache.set(evalKey, finalMetrics);
                    setAiOverride({ key: evalKey, result: finalMetrics });
                  }
                  if (parsedSnap.success) {
                    serverSnapshot = parsedSnap.data;
                  }
                }
              } catch {
                /* Offline or local fallback */
              }

              const next =
                serverSnapshot ??
                buildCustomSnapshot(
                  { label, date, note: sanitizedNote, demand },
                  'custom-' + crypto.randomUUID(),
                  new Date().toISOString(),
                  {
                    dynamic: true,
                    scenario,
                    jobRecords: finalMetrics.jobRecords,
                    researchRecords: finalMetrics.researchRecords,
                  },
                );
              onApply(next);
              setMessage(
                'Custom assumptions applied. Individual and team plans recalculated.',
              );
            } catch {
              setMessage(
                'Check the label, calendar date and demand values from 0 to 100.',
              );
            } finally {
              setEvaluating(false);
            }
          }}
        >
          <div className="form-row">
            <label>
              {t('Snapshot label')}
              <input
                required
                maxLength={120}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              {t('Snapshot date (MYT)')}
              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <label>
            {t('Why these assumptions?')}
            <textarea
              rows={3}
              maxLength={1500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <fieldset>
            <legend>{t('Skill demand assumptions (0–100)')}</legend>
            <p className="muted small">
              {t(
                '0 means weakest demand, 100 strongest. Other scoring weights stay the same.',
              )}
            </p>
            <div className="skill-edit-grid">
              {skills.map((skill) => (
                <label key={skill.id}>
                  {t(skill.label)}
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={demand[skill.id]}
                    onChange={(event) =>
                      setDemand({
                        ...demand,
                        [skill.id]: Number(event.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <div className="signal-metrics" aria-live="polite">
            <span>
              <strong>{activeMetrics.jobRecords}</strong>
              {t('job records')}
            </span>
            <span>
              <strong>{activeMetrics.researchRecords}</strong>
              {t('research records')}
            </span>
          </div>
          <button className="primary" type="submit" disabled={evaluating}>
            {t(evaluating ? 'Fetching sources…' : 'Apply my assumptions')}
          </button>
          <p className="status-text" role="status">
            {t(message)}
          </p>
        </form>
      )}
    </section>
  );
}
