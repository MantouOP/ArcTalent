'use client';
import './cost-comparison.css';
import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { compareTrainingCosts, type CostAssumptions } from '@/lib/cost-model';
import { IMPACT_TARGETS } from '@/lib/impact';
import {
  getCostAssumptions,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
import type { Course } from '@/lib/types';
import { External, Tag } from './ui';
import { useI18n } from './language-provider';

export const ACM_URL =
  'https://hrdcorp.gov.my/wp-content/uploads/2025/11/Attachment-ACM-Table-November-2025-Edition.pdf';
const DOSM_URL =
  'https://www.dosm.gov.my/portal-main/release-content/salaries-and-wages-survey-report-';

const fields: {
  key: keyof CostAssumptions;
  label: string;
  hint: string;
  max: number;
}[] = [
  {
    key: 'seatRate',
    label: 'Individual commercial seat (RM per learner-hour)',
    hint: 'HRD Corp cap: RM125 for e-learning, RM250 for a public classroom course.',
    max: 5000,
  },
  {
    key: 'trainerRate',
    label: 'Internal cohort trainer (RM per course-hour)',
    hint: 'HRD Corp internal trainer allowance: RM1,400 per 7-hour day, prorated below 5 learners.',
    max: 20000,
  },
  {
    key: 'wageRate',
    label: 'Paid study time (RM per hour)',
    hint: 'DOSM 2025 median wage of RM2,940 a month over a 45-hour week.',
    max: 1000,
  },
];

/** Prices the planned team learning two ways; assumptions are stored with the workforce settings. */
export function CostComparison({
  groups,
  workforce,
  onChange,
}: {
  groups: Map<string, { course: Course; names: string[] }>;
  workforce: WorkforceSettings;
  onChange: (settings: WorkforceSettings) => void;
}) {
  const { t } = useI18n();
  const costs = getCostAssumptions(workforce);
  const result = useMemo(
    () =>
      compareTrainingCosts(
        groups.values(),
        costs,
        IMPACT_TARGETS.costReduction,
      ),
    [groups, costs],
  );
  const rm = (n: number) =>
    `${t('RM')} ${Math.round(n).toLocaleString('en-MY')}`;
  const met =
    result.saving !== null && result.saving >= IMPACT_TARGETS.costReduction;
  return (
    <section className="panel cost-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t('COST MODEL · PLANNING ESTIMATE')}</span>
          <h2>{t('Learning together costs less.')}</h2>
          <p>
            {t(
              'The same planned learning, priced as individual commercial seats and as the ArcTalent cohort plan.',
            )}
          </p>
        </div>
        {result.saving !== null && (
          <Tag tone={met ? 'green' : 'amber'}>
            {t(met ? 'Target met' : 'Below target')}
          </Tag>
        )}
      </div>
      {result.saving === null ? (
        <div className="empty-state">
          {t('No planned learning yet, so there is nothing to price.')}
        </div>
      ) : (
        <>
          <div className="cost-options">
            <div className="cost-option">
              <span>{t('Individual commercial seats')}</span>
              <strong>{rm(result.individual.total)}</strong>
              <small>
                {t('Seats {0} · paid study time {1}', {
                  0: rm(result.individual.fees),
                  1: rm(result.individual.studyTime),
                })}
              </small>
            </div>
            <div className="cost-option plan">
              <span>{t('ArcTalent cohort plan')}</span>
              <strong>{rm(result.grouped.total)}</strong>
              <small>
                {t(
                  'Course fees {0} · cohort trainers {1} · paid study time {2}',
                  {
                    0: rm(result.grouped.fees),
                    1: rm(result.grouped.trainers),
                    2: rm(result.grouped.studyTime),
                  },
                )}
              </small>
            </div>
            <div className="cost-option">
              <span>{t('Saving')}</span>
              <strong>{Math.round(result.saving)}%</strong>
              <small>
                {t(
                  'Target {0}% · {1} learner-hours, {2} courses shared by a cohort',
                  {
                    0: IMPACT_TARGETS.costReduction,
                    1: result.learnerHours,
                    2: result.cohorts,
                  },
                )}
              </small>
            </div>
          </div>
          {result.breakEvenSeatRate !== null && (
            <p className="muted">
              {t(
                'The saving stays at {0}% or more while an individual seat costs more than RM {1} per learner-hour.',
                {
                  0: IMPACT_TARGETS.costReduction,
                  1: result.breakEvenSeatRate.toFixed(2),
                },
              )}
            </p>
          )}
        </>
      )}
      <h3>{t('Assumptions')}</h3>
      <div className="cost-inputs">
        {fields.map((field) => (
          <label key={field.key}>
            {t(field.label)}
            <input
              type="number"
              min={0}
              max={field.max}
              step="any"
              value={costs[field.key]}
              onChange={(e) => {
                // Partly typed numbers such as "15." are not finite yet.
                const value = e.target.valueAsNumber;
                if (Number.isFinite(value))
                  onChange({
                    ...workforce,
                    costs: {
                      ...costs,
                      [field.key]: Math.max(0, Math.min(field.max, value)),
                    },
                  });
              }}
            />
            <small>{t(field.hint)}</small>
          </label>
        ))}
      </div>
      <div className="cost-actions">
        <button
          type="button"
          className="text-button"
          disabled={!workforce.costs}
          onClick={() => onChange({ ...workforce, costs: undefined })}
        >
          <RotateCcw size={14} />
          {t('Use sourced defaults')}
        </button>
        <External href={ACM_URL}>
          {t('HRD Corp cost matrix (Nov 2025)')}
        </External>
        <External href={DOSM_URL}>{t('DOSM wage survey 2025')}</External>
      </div>
      <p className="notice small">
        {t(
          'Planning estimate. Prices are HRD Corp maximum claimable amounts, not quotes, and every shared course is costed with a trainer for all of its hours. Free courses may not include the certificates or support that paid training offers.',
        )}
      </p>
    </section>
  );
}
