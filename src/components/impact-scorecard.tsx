'use client';
import './impact-scorecard.css';
import { useMemo } from 'react';
import { Layers3, ShieldCheck, TrendingDown, Users } from 'lucide-react';
import {
  IMPACT_TARGETS,
  assessCohort,
  assessPerson,
  type ImpactStatus,
} from '@/lib/impact';
import { buildWorkforcePlan } from '@/lib/workforce-plan';
import {
  getWorkforceMembers,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
import { roleLabel } from '@/lib/role-label';
import type {
  LearningPlan,
  Match,
  Profile,
  Scenario,
  SkillId,
  Snapshot,
} from '@/lib/types';
import { Tag } from './ui';
import { useI18n } from './language-provider';

type CardStatus = ImpactStatus | 'pending' | 'design';
const statusTag: Record<CardStatus, { tone: string; label: string }> = {
  met: { tone: 'green', label: 'Target met' },
  early: { tone: 'blue', label: 'Foundation finished early' },
  below: { tone: 'amber', label: 'Below target' },
  'not-applicable': { tone: 'blue', label: 'No gap to close' },
  pending: { tone: 'amber', label: 'Not yet measurable' },
  design: { tone: 'green', label: 'Enforced by design' },
};

function Meter({ value, target }: { value: number | null; target: number }) {
  return (
    <div className="impact-meter" aria-hidden="true">
      <span
        className="impact-meter-fill"
        style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
      />
      <span className="impact-meter-target" style={{ left: `${target}%` }} />
    </div>
  );
}

const pct = (value: number | null) =>
  value === null ? '—' : `${Math.round(value)}%`;

/** Read-only check of the Phase 2 proposal targets. Every number comes from the shared engine. */
export function ImpactScorecard({
  profile,
  scenario,
  snapshot,
  active,
  shared,
  plan,
  workforce,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  active: Match;
  shared: SkillId[];
  plan: LearningPlan;
  workforce: WorkforceSettings;
}) {
  const { t } = useI18n();
  const mine = useMemo(
    () => assessPerson(profile, active.role, scenario, snapshot, shared, plan),
    [profile, active.role, scenario, snapshot, shared, plan],
  );
  const members = useMemo(
    () => getWorkforceMembers(workforce, profile),
    [workforce, profile],
  );
  const cohorts = useMemo(
    () => ({
      moderate: assessCohort(members, 'moderate', snapshot),
      rapid: assessCohort(members, 'rapid', snapshot),
    }),
    [members, snapshot],
  );
  const cohort = cohorts[scenario];
  const team = useMemo(
    () => buildWorkforcePlan(profile, scenario, snapshot, workforce),
    [profile, scenario, snapshot, workforce],
  );
  const enrolments = [...team.groups.values()].reduce(
    (s, g) => s + g.names.length,
    0,
  );
  const sharedRuns = [...team.groups.values()].filter(
    (g) => g.names.length > 1,
  ).length;
  const scenarioName = t(
    scenario === 'moderate' ? 'Moderate adoption' : 'Rapid adoption',
  );

  const cards: {
    icon: typeof Layers3;
    title: string;
    target: string;
    value: string;
    meter?: { value: number | null; target: number };
    status: CardStatus;
    detail: string;
  }[] = [
    {
      icon: TrendingDown,
      title: 'Skill gap distance reduction',
      target: t('Target: at least {0}% within {1} weeks at RM0', {
        0: IMPACT_TARGETS.distanceReduction,
        1: 8,
      }),
      value: pct(mine.reduction),
      meter: {
        value: mine.reduction,
        target: IMPACT_TARGETS.distanceReduction,
      },
      status: mine.reductionStatus,
      detail: t(
        'Your route to {0}: gap distance {1} → {2} if you finish this plan.',
        {
          0: roleLabel(active.role, t, true),
          1: mine.distanceBefore.toFixed(1),
          2: mine.distanceAfter.toFixed(1),
        },
      ),
    },
    {
      icon: Layers3,
      title: 'Shared foundation first',
      target: t('Target: {0}% of weeks 1–{1} study time', {
        0: IMPACT_TARGETS.foundationShare,
        1: IMPACT_TARGETS.foundationWeeks,
      }),
      value: pct(mine.foundation.share),
      meter: {
        value: mine.foundation.share,
        target: IMPACT_TARGETS.foundationShare,
      },
      status: mine.foundationStatus,
      detail:
        mine.foundationStatus === 'not-applicable'
          ? t('No shared-foundation gaps remain for this profile.')
          : mine.foundationStatus === 'early'
            ? t(
                'The whole shared foundation is finished in week {0}, before any role-specific study. The rest of weeks 1–{1} moves on to role skills.',
                {
                  0: mine.foundation.completeWeek,
                  1: IMPACT_TARGETS.foundationWeeks,
                },
              )
            : t(
                '{0} of {1} early study hours build skills needed in both AI futures.',
                {
                  0: mine.foundation.sharedHours,
                  1: mine.foundation.totalHours,
                },
              ),
    },
    {
      icon: Users,
      title: 'SME training cost reduction',
      target: t('Target: {0}% lower reskilling spend', { 0: 35 }),
      value: `${t('RM')} ${team.allocated}`,
      status: 'pending',
      detail: t(
        'Every catalogue course is currently free, so there is no spend to reduce yet. {0} enrolments in total; {1} courses are shared by two or more workers.',
        { 0: enrolments, 1: sharedRuns },
      ),
    },
    {
      icon: ShieldCheck,
      title: 'Human-confirmed CV skills',
      target: t('Target: {0}% of adopted skills confirmed by the user', {
        0: 100,
      }),
      value: '100%',
      status: 'design',
      detail: t(
        'AI suggestions change your profile only after you add and save them. RunPod quotes are kept only when found word-for-word in the CV.',
      ),
    },
  ];

  return (
    <div className="impact-scorecard">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t('PHASE 2 IMPACT TARGETS')}</span>
            <h2>{t('Your route, checked against our commitments.')}</h2>
          </div>
          <Tag tone="blue">{t('Projected · synthetic')}</Tag>
        </div>
        <div className="impact-cards">
          {cards.map((card) => (
            <article className="impact-card" key={card.title}>
              <header>
                <card.icon size={18} />
                <h3>{t(card.title)}</h3>
              </header>
              <strong className="impact-value">{card.value}</strong>
              {card.meter && <Meter {...card.meter} />}
              <p className="impact-target">{card.target}</p>
              <Tag tone={statusTag[card.status].tone}>
                {t(statusTag[card.status].label)}
              </Tag>
              <p className="muted small">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t('COHORT BENCHMARK')}</span>
            <h2>
              {t('{0} synthetic workers, each on their top route.', {
                0: cohort.people.length,
              })}
            </h2>
          </div>
          <Tag tone="blue">{scenarioName}</Tag>
        </div>
        <div className="impact-summary">
          {(['moderate', 'rapid'] as const).map((s) => (
            <div
              key={s}
              className={
                s === scenario
                  ? 'impact-summary-item active'
                  : 'impact-summary-item'
              }
            >
              <span>
                {t(s === 'moderate' ? 'Moderate adoption' : 'Rapid adoption')}
              </span>
              <strong>{pct(cohorts[s].averageReduction)}</strong>
              <small>
                {t('average gap reduction · {0} of {1} workers at {2}%+', {
                  0: cohorts[s].reductionMet,
                  1: cohorts[s].reductionMeasured,
                  2: IMPACT_TARGETS.distanceReduction,
                })}
              </small>
              <strong>{pct(cohorts[s].averageFoundationShare)}</strong>
              <small>
                {t(
                  'average foundation share in weeks 1–{0} · {1} at 100%, {2} finished the foundation early',
                  {
                    0: IMPACT_TARGETS.foundationWeeks,
                    1: cohorts[s].foundationMet,
                    2: cohorts[s].foundationEarly,
                  },
                )}
              </small>
            </div>
          ))}
        </div>
        <div className="heatmap-wrap">
          <table className="impact-table">
            <thead>
              <tr>
                <th scope="col">{t('Worker')}</th>
                <th scope="col">{t('Proposed route')}</th>
                <th scope="col">{t('Gap distance')}</th>
                <th scope="col">{t('Reduction')}</th>
                <th scope="col">{t('Foundation, weeks 1–4')}</th>
              </tr>
            </thead>
            <tbody>
              {cohort.people.map((p) => (
                <tr key={p.profile.id}>
                  <th scope="row">
                    {p.profile.name}
                    <small>{t(p.profile.currentRole)}</small>
                  </th>
                  <td>{roleLabel(p.role, t, true)}</td>
                  <td>
                    {p.distanceBefore.toFixed(1)} → {p.distanceAfter.toFixed(1)}
                  </td>
                  <td className={`impact-cell ${p.reductionStatus}`}>
                    {pct(p.reduction)}
                  </td>
                  <td className={`impact-cell ${p.foundationStatus}`}>
                    {pct(p.foundation.share)}
                    {p.foundationStatus === 'early' && (
                      <small>
                        {t('done by week {0}', {
                          0: p.foundation.completeWeek,
                        })}
                      </small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          {t(
            'Projections, not observed outcomes. They assume each planned course lifts its skills to working level (2 of 3), the same rule the planner uses. Profiles are synthetic; pilot results have not been measured.',
          )}
        </p>
      </section>
    </div>
  );
}
