'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileUp, LoaderCircle, Sparkles } from 'lucide-react';
import { roles, skillById } from '@/lib/catalogue';
import type { Scenario } from '@/lib/types';
import {
  maxWorkforceReportLength,
  suggestWorkforceBudget,
  WORKFORCE_REPORT_SAMPLES,
  type WorkforceAiResult,
  type WorkforceBudgetSuggestion,
  type WorkforceSummaryItem,
} from '@/lib/workforce-ai';
import { extractReportTextFromFile } from '@/lib/member-report-parser';
import type { WorkforceSettings } from '@/lib/workforce-settings';
import { useI18n } from './language-provider';
import { Tag } from './ui';

const roleById = new Map(roles.map((role) => [role.id, role]));

/** Turns a pasted or uploaded company report into a whole team plan in one step. */
export function WorkforcePlanner({
  scenario,
  workforce,
  onApply,
  onBudgetChange,
}: {
  scenario: Scenario;
  workforce?: WorkforceSettings;
  onApply: (workforce: WorkforceSettings) => void;
  onBudgetChange?: (budget: number) => void;
}) {
  const { t, locale } = useI18n();
  const id = useId();
  const [report, setReport] = useState('');
  const [budget, setBudget] = useState(() =>
    workforce?.budget ? String(workforce.budget) : '',
  );
  const [targetHeadcount, setTargetHeadcount] = useState<number>(
    () => workforce?.members?.length || 3,
  );
  const [targetCoveragePct, setTargetCoveragePct] = useState<number>(85);
  const [targetSlotCap, setTargetSlotCap] = useState<number>(2);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [budgetChoiceNotice, setBudgetChoiceNotice] = useState('');
  const [consent, setConsent] = useState(false);
  const [provider, setProvider] = useState('');
  const [useAi, setUseAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<WorkforceAiResult | null>(null);
  const [applied, setApplied] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    if (workforce?.members?.length) {
      setTargetHeadcount(workforce.members.length);
    }
  }, [workforce?.members?.length]);

  const budgetSuggestion: WorkforceBudgetSuggestion = useMemo(
    () =>
      suggestWorkforceBudget({
        workforce: result?.workforce ?? workforce,
        report,
        scenario,
        targetHeadcount,
        targetCoveragePct,
        targetSlotCap,
      }),
    [
      result?.workforce,
      workforce,
      report,
      scenario,
      targetHeadcount,
      targetCoveragePct,
      targetSlotCap,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', {
      cache: 'no-store',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        const configured = data.workforcePlanner === 'ai-configured';
        setProvider(configured ? String(data.aiProvider ?? '') : '');
        setUseAi(configured);
      })
      .catch(() => setProvider(''));
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, []);

  const changeReport = (next: string) => {
    setReport(next.slice(0, maxWorkforceReportLength));
    setResult(null);
    setApplied(false);
    setError('');
  };

  async function readFile(file: File) {
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('Use a file smaller than 5 MB.');
      return;
    }
    setReading(true);
    try {
      const extracted = await extractReportTextFromFile(file);
      changeReport(extracted);
    } catch {
      setError('This file could not be read. Paste the report text instead.');
    } finally {
      setReading(false);
    }
  }

  async function generate() {
    if (busy || !consent || report.trim().length < 40) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setResult(null);
    setApplied(false);
    try {
      const response = await fetch('/api/workforce-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(60000),
        ]),
        body: JSON.stringify({
          report,
          processingConsent: true,
          useAi: useAi && Boolean(provider),
          scenario,
          locale,
          ...(budget.trim() ? { budget: Number(budget) } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(String(data.error ?? ''));
      if (!controller.signal.aborted) setResult(data as WorkforceAiResult);
    } catch (caught) {
      if (!controller.signal.aborted)
        setError(
          caught instanceof Error && caught.message
            ? caught.message
            : 'The plan could not be generated. Please try again.',
        );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  const summaryLine = (item: WorkforceSummaryItem) => {
    switch (item.kind) {
      case 'text':
        return item.text;
      case 'cohorts':
        return t('Shared training cohorts: {0}.', {
          0: item.cohorts
            .map(
              (cohort) =>
                `${cohort.title} (${t('{0} learners', { 0: cohort.learners })})`,
            )
            .join('; '),
        });
      case 'no-cohorts':
        return t(
          'No course is shared by two or more people yet; each person follows an individual route.',
        );
      case 'gaps':
        return t('Priority skill gaps across the team: {0}.', {
          0: item.skills.map((skill) => t(skillById[skill].label)).join(', '),
        });
      case 'no-gaps':
        return t('The proposed destinations need no further skill levels.');
      case 'effort':
        return item.saving === null
          ? t('Estimated {0} person-hours of planned learning.', {
              0: item.hours,
            })
          : t(
              'Estimated {0} person-hours of planned learning, about {1}% below individual commercial seats (RM {2} vs RM {3}).',
              {
                0: item.hours,
                1: item.saving,
                2: item.grouped,
                3: item.individual,
              },
            );
    }
  };

  const members = result?.workforce.members ?? [];
  return (
    <section
      className="panel workforce-planner"
      aria-labelledby={`${id}-title`}
    >
      <div className="panel-heading">
        <div>
          <h2 id={`${id}-title`}>{t('Plan the whole team from one report')}</h2>
          <p className="muted">
            {t(
              'Paste or upload a workforce report, department summary or restructuring brief. ArcTalent drafts the team, destinations, openings, budget and a short summary in one step.',
            )}
          </p>
        </div>
        <Sparkles size={22} />
      </div>
      <div className="workforce-planner-samples">
        <span className="muted small">{t('Try a sample report:')}</span>
        {WORKFORCE_REPORT_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="secondary"
            onClick={() => changeReport(sample.report)}
          >
            {t(sample.label)}
          </button>
        ))}
      </div>
      <label htmlFor={`${id}-report`}>{t('Workforce report')}</label>
      <textarea
        id={`${id}-report`}
        rows={7}
        maxLength={maxWorkforceReportLength}
        value={report}
        placeholder={t(
          'One line per person or role, for example: Nadia - Admin assistant: Excel, scheduling, 4 hours per week. CSV with role and skills columns also works.',
        )}
        onChange={(event) => changeReport(event.target.value)}
      />
      <div className="workforce-planner-inputs">
        <label className="file-button secondary">
          {reading ? (
            <LoaderCircle size={15} className="spin" />
          ) : (
            <FileUp size={15} />
          )}
          {t('Upload TXT, CSV or PDF')}
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.txt,.csv,text/plain,text/csv,application/pdf"
            disabled={!consent || reading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void readFile(file);
            }}
          />
        </label>
        <label>
          {t('Target team size')}
          <input
            type="number"
            min={1}
            max={50}
            value={targetHeadcount}
            onChange={(event) => {
              setTargetHeadcount(
                Math.max(
                  1,
                  Math.min(50, Math.round(Number(event.target.value) || 1)),
                ),
              );
              setBudgetChoiceNotice('');
            }}
          />
        </label>
        <label>
          {t('Target gap coverage (%)')}
          <input
            type="number"
            min={50}
            max={100}
            step={5}
            value={targetCoveragePct}
            onChange={(event) => {
              setTargetCoveragePct(
                Math.max(
                  50,
                  Math.min(100, Math.round(Number(event.target.value) || 85)),
                ),
              );
              setBudgetChoiceNotice('');
            }}
          />
        </label>
        <label>
          {t('Role slot cap')}
          <input
            type="number"
            min={1}
            max={10}
            value={targetSlotCap}
            onChange={(event) => {
              setTargetSlotCap(
                Math.max(
                  1,
                  Math.min(10, Math.round(Number(event.target.value) || 2)),
                ),
              );
              setBudgetChoiceNotice('');
            }}
          />
        </label>
        <label>
          {t('Training budget (RM, optional)')}
          <input
            type="number"
            min={0}
            max={100000}
            value={budget}
            placeholder={t('Let ArcTalent suggest')}
            onChange={(event) => {
              const nextVal = event.target.value;
              setBudget(nextVal);
              setBudgetChoiceNotice('');
              if (nextVal.trim() && Number.isFinite(Number(nextVal))) {
                onBudgetChange?.(
                  Math.max(0, Math.min(100000, Math.round(Number(nextVal)))),
                );
              }
            }}
          />
        </label>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setShowSuggestion(true);
            setBudgetChoiceNotice('');
          }}
        >
          <Sparkles size={15} />
          {t('Ask ArcTalent to Suggest Budget')}
        </button>
        <small className="muted">
          {t('{0}/{1} characters', {
            0: report.length,
            1: maxWorkforceReportLength,
          })}
        </small>
      </div>
      {showSuggestion && (
        <div
          className="workforce-plan-preview"
          role="region"
          aria-label={t('ArcTalent budget suggestion')}
        >
          <div className="badge-card-top">
            <strong>
              {t('ArcTalent suggested budget: RM {0}', {
                0: budgetSuggestion.recommendedBudget,
              })}
            </strong>
            <Tag tone="blue">{t('Suggest by ArcTalent')}</Tag>
          </div>
          <p className="muted small">
            {t(
              'Calculated for {0} team members, {1} skill gaps, {2}% target coverage and up to {3} total role slots ({4} planned person-hours across {5} shared cohorts).',
              {
                0: budgetSuggestion.headcount,
                1: budgetSuggestion.totalSkillGaps,
                2: budgetSuggestion.targetCoveragePct,
                3: budgetSuggestion.slotCapTotal,
                4: budgetSuggestion.plannedHours,
                5: budgetSuggestion.sharedCohorts,
              },
            )}
          </p>
          <dl className="workforce-plan-stats">
            <div>
              <dt>{t('Cohort training')}</dt>
              <dd>{t('RM {0}', { 0: budgetSuggestion.cohortTrainingCost })}</dd>
            </div>
            <div>
              <dt>{t('Materials & buffer')}</dt>
              <dd>
                {t('RM {0}', { 0: budgetSuggestion.certificationAndBuffer })}
              </dd>
            </div>
            <div>
              <dt>{t('Individual baseline')}</dt>
              <dd>
                {t('RM {0}', { 0: budgetSuggestion.individualSeatBaseline })}
              </dd>
            </div>
            <div>
              <dt>{t('Estimated cohort saving')}</dt>
              <dd>
                {t('RM {0} ({1}%)', {
                  0: budgetSuggestion.savingsAmount,
                  1: budgetSuggestion.savingsPercent,
                })}
              </dd>
            </div>
          </dl>
          <div className="button-row">
            <button
              type="button"
              className="primary"
              onClick={() => {
                const suggested = budgetSuggestion.recommendedBudget;
                setBudget(String(suggested));
                onBudgetChange?.(suggested);
                if (result) {
                  setResult({
                    ...result,
                    workforce: { ...result.workforce, budget: suggested },
                  });
                }
                setBudgetChoiceNotice(
                  t('Applied ArcTalent suggested budget of RM {0}.', {
                    0: suggested,
                  }),
                );
              }}
            >
              <CheckCircle2 size={15} />
              {t('Apply suggested budget (RM {0})', {
                0: budgetSuggestion.recommendedBudget,
              })}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                const customVal = budget.trim()
                  ? Math.max(0, Math.min(100000, Math.round(Number(budget))))
                  : (workforce?.budget ?? budgetSuggestion.recommendedBudget);
                setBudget(String(customVal));
                onBudgetChange?.(customVal);
                setShowSuggestion(false);
                setBudgetChoiceNotice(
                  t('Kept custom training budget of RM {0}.', {
                    0: customVal,
                  }),
                );
              }}
            >
              {t('Keep custom budget')}
            </button>
          </div>
          {budgetChoiceNotice && (
            <p className="status-text" role="status">
              {budgetChoiceNotice}
            </p>
          )}
        </div>
      )}
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        {t(
          'I have permission to process this report. E-mails, phone and IC numbers are removed and names are shortened to first names or codes before planning.',
        )}
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={useAi && Boolean(provider)}
          disabled={!provider}
          onChange={(event) => setUseAi(event.target.checked)}
        />
        {provider
          ? t('Use AI planning ({0})', { 0: provider })
          : t('Use AI planning')}
      </label>
      <p className="muted small">
        {provider
          ? t(
              'With AI planning on, the cleaned report is sent to {0}. Without it, a local parser reads the report on the server. Nothing is saved on ArcTalent’s server.',
              { 0: provider },
            )
          : t(
              'AI is not connected. A local parser reads one line per person or a CSV with role and skills columns.',
            )}
      </p>
      <div className="button-row">
        <button
          type="button"
          className="primary"
          disabled={busy || !consent || report.trim().length < 40}
          aria-busy={busy}
          onClick={() => void generate()}
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {busy ? t('Planning the team…') : t('Generate team plan')}
        </button>
      </div>
      {error && (
        <p role="alert" className="notice">
          {t(error)}
        </p>
      )}
      {result && (
        <div
          className="workforce-plan-preview"
          role="status"
          aria-live="polite"
        >
          <div className="badge-card-top">
            <strong>{t('AI executive redeployment summary')}</strong>
            <Tag tone={result.mode === 'ai' ? 'blue' : 'amber'}>
              {result.mode === 'ai'
                ? `${t('AI plan')} · ${result.model ?? (provider || 'AI')}`
                : t('Local parser')}
            </Tag>
          </div>
          {result.notice && <p className="muted small">{t(result.notice)}</p>}
          <ul className="workforce-summary">
            {result.summary.map((item, index) => (
              <li key={index}>{summaryLine(item)}</li>
            ))}
          </ul>
          <dl className="workforce-plan-stats">
            <div>
              <dt>{t('Team members')}</dt>
              <dd>{result.stats.members}</dd>
            </div>
            <div>
              <dt>{t('Planned learners')}</dt>
              <dd>{result.stats.learners}</dd>
            </div>
            <div>
              <dt>{t('Shared cohorts')}</dt>
              <dd>{result.stats.cohorts}</dd>
            </div>
            <div>
              <dt>{t('Budget')}</dt>
              <dd>{t('RM {0}', { 0: result.workforce.budget })}</dd>
            </div>
          </dl>
          <ul className="workforce-plan-members">
            {members.map((member) => {
              const role = roleById.get(
                result.workforce.destinations[member.id] ?? '',
              );
              return (
                <li key={member.id}>
                  <strong>{member.name}</strong>
                  <small className="muted">{member.currentRole}</small>
                  <span>→ {role ? t(role.shortTitle) : '—'}</span>
                </li>
              );
            })}
          </ul>
          {result.redactions > 0 && (
            <p className="muted small">
              {t('{0} personal details were removed from the report.', {
                0: result.redactions,
              })}
            </p>
          )}
          <div className="button-row">
            <button
              type="button"
              className="primary"
              disabled={applied}
              onClick={() => {
                onApply(result.workforce);
                setApplied(true);
              }}
            >
              <CheckCircle2 size={16} />
              {applied
                ? t('Applied to SME workspace')
                : t('Apply to SME workspace')}
            </button>
            <small className="muted">
              {t(
                'Replaces the current fictional team, destinations, openings and budget. You can still edit every row.',
              )}
            </small>
          </div>
        </div>
      )}
    </section>
  );
}
