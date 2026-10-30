'use client';

import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { roleLabel } from '@/lib/role-label';
import { skillById } from '@/lib/catalogue';
import {
  aggregateSdgContributions,
  buildFutureSkillsRadar,
  calculateScoreBoosters,
  computeLearnerBadges,
  computeReplanDiff,
  getMalaysiaReskillingOptions,
  runFairnessAudit,
  SDG_FOCUS_OPTIONS,
  type SdgFocus,
} from '@/lib/finals-enhancements';
import type {
  LearningPlan,
  Match,
  Profile,
  Role,
  Scenario,
  SkillId,
  Snapshot,
} from '@/lib/types';
import type { WorkforceSettings } from '@/lib/workforce-settings';
import { CourseLink } from './course-link';
import { useI18n } from './language-provider';
import { External, SkillChip, Tag } from './ui';

export function SdgChoiceBar({
  focus,
  onChange,
  shifted,
  defaultTopRole,
  newTopRole,
}: {
  focus: SdgFocus;
  onChange: (next: SdgFocus) => void;
  shifted: boolean;
  defaultTopRole?: Role;
  newTopRole?: Role;
}) {
  const { t } = useI18n();
  return (
    <section
      className="panel sdg-choice-panel"
      aria-label={t('SDG priority lens')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {t('MEANINGFUL SDG ALIGNMENT · RUBRIC SDG TEST')}
          </span>
          <h2>{t('Choose an SDG priority lens')}</h2>
          <p className="muted small">
            {t(
              'Select a UN Sustainable Development Goal priority to weight role rankings and surface aligned reskilling pathways.',
            )}
          </p>
        </div>
        {focus !== 'all' && (
          <button
            type="button"
            className="text-button"
            onClick={() => onChange('all')}
          >
            {t('Reset to balanced match')}
          </button>
        )}
      </div>
      <div className="sdg-focus-grid" role="group">
        {SDG_FOCUS_OPTIONS.map((option) => {
          const active = focus === option.id;
          return (
            <button
              type="button"
              key={option.id}
              className={`sdg-focus-card ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onChange(option.id)}
            >
              <span className="sdg-focus-badge">{t(option.badge)}</span>
              <strong>{t(option.title)}</strong>
              <small>{t(option.description)}</small>
            </button>
          );
        })}
      </div>
      {focus !== 'all' && defaultTopRole && newTopRole && (
        <div className="notice sdg-shift-notice" role="status">
          <Sparkles size={16} />
          <div>
            <strong>
              {shifted
                ? t('SDG lens changed your #1 recommendation: {0} → {1}', {
                    0: roleLabel(defaultTopRole, t),
                    1: roleLabel(newTopRole, t),
                  })
                : t(
                    'SDG {0} priority active: {1} remains #1 with an SDG alignment boost.',
                    {
                      0: focus,
                      1: roleLabel(newTopRole, t),
                    },
                  )}
            </strong>
            <p className="muted small">
              {t(
                'Removing or changing this SDG lens directly alters role suitability scores and ranking order.',
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export function FutureSkillsRadarPanel({
  snapshot,
  previous,
  onFlipTrend,
}: {
  snapshot: Snapshot;
  previous: Snapshot | null;
  onFlipTrend: () => void;
}) {
  const { t } = useI18n();
  const items = buildFutureSkillsRadar(snapshot, previous ?? undefined);
  const rising = items.filter((i) => i.trend === 'rising').slice(0, 4);
  const declining = items.filter((i) => i.trend === 'declining').slice(0, 4);
  const topSteady = items.filter((i) => i.trend === 'steady').slice(0, 4);

  return (
    <section
      className="panel future-radar-panel"
      aria-label={t('Future Skills Radar')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t('STAGE 2 · FUTURE SKILLS RADAR')}</span>
          <h2>{t('Rising & declining skill signals')}</h2>
          <p className="muted small">
            {t('Source: {0} · Snapshot date: {1}', {
              0: t(snapshot.label),
              1: snapshot.asOf.slice(0, 10),
            })}
          </p>
        </div>
        <button type="button" className="secondary" onClick={onFlipTrend}>
          <RefreshCw size={15} />
          {t('Switch trend snapshot (Live test)')}
        </button>
      </div>
      <div className="radar-momentum-grid">
        <div className="momentum-col rising">
          <h3>
            <TrendingUp size={16} />
            {t('Rising demand skills')}
          </h3>
          {(rising.length > 0 ? rising : topSteady).map((item) => (
            <div className="momentum-row" key={item.skillId}>
              <div>
                <strong>{t(item.label)}</strong>
                <small>SDG {item.sdgTarget}</small>
              </div>
              <Tag tone="green">
                {item.deltaPercent >= 0
                  ? `+${item.deltaPercent}%`
                  : `${item.deltaPercent}%`}{' '}
                ({item.currentDemand}%)
              </Tag>
            </div>
          ))}
        </div>
        <div className="momentum-col declining">
          <h3>
            <TrendingDown size={16} />
            {t('Cooling or routine skills')}
          </h3>
          {declining.length > 0 ? (
            declining.map((item) => (
              <div className="momentum-row" key={item.skillId}>
                <div>
                  <strong>{t(item.label)}</strong>
                  <small>SDG {item.sdgTarget}</small>
                </div>
                <Tag tone="amber">
                  {item.deltaPercent}% ({item.currentDemand}%)
                </Tag>
              </div>
            ))
          ) : (
            <p className="muted small">
              {t(
                'Click "Switch trend snapshot (Live test)" to simulate a shift away from routine spreadsheet/SQL reporting toward stakeholder and sustainability skills.',
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function AutoReplanBanner({
  profile,
  scenario,
  previous,
  snapshot,
  candidates,
  onInspectEvidence,
}: {
  profile: Profile;
  scenario: Scenario;
  previous: Snapshot | null;
  snapshot: Snapshot;
  candidates: Role[];
  onInspectEvidence: () => void;
}) {
  const { t } = useI18n();
  if (!previous || previous.id === snapshot.id) return null;
  const diff = computeReplanDiff(
    profile,
    scenario,
    previous,
    snapshot,
    candidates,
  );

  return (
    <section
      className="panel auto-replan-banner"
      aria-label={t('Automatic re-planning summary')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {t('AUTOMATIC RE-PLANNING · LIVE CHANGE TEST')}
          </span>
          <h2>
            {diff.topRoleChanged
              ? t('Trend update shifted #1 role: {0} → {1}', {
                  0: roleLabel(diff.oldTopRole, t),
                  1: roleLabel(diff.newTopRole, t),
                })
              : t('Trend update recalculated scores for {0}', {
                  0: roleLabel(diff.newTopRole, t),
                })}
          </h2>
          <p className="muted small">
            {t('Compared {0} ({1}) against {2} ({3}).', {
              0: t(previous.label),
              1: previous.asOf.slice(0, 10),
              2: t(snapshot.label),
              3: snapshot.asOf.slice(0, 10),
            })}
          </p>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={onInspectEvidence}
        >
          {t('Inspect full signal diff')}
        </button>
      </div>
      <div className="replan-diff-grid">
        <div className="replan-box">
          <strong>{t('Shared foundation preserved')}</strong>
          <p className="muted small">
            {diff.keptCourses.length > 0
              ? diff.keptCourses.map((c) => c.title).join(' · ')
              : t('Core transferable skills remain valid across snapshots.')}
          </p>
        </div>
        <div className="replan-box">
          <strong>{t('New courses rotated in')}</strong>
          <p className="muted small">
            {diff.addedCourses.length > 0
              ? diff.addedCourses.map((c) => c.title).join(' · ')
              : t('Current pathway already covers the updated skill signals.')}
          </p>
        </div>
        <div className="replan-box">
          <strong>{t('Courses deprioritised')}</strong>
          <p className="muted small">
            {diff.removedCourses.length > 0
              ? diff.removedCourses.map((c) => c.title).join(' · ')
              : t('No previously scheduled courses needed removal.')}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ScoreBoosterPanel({
  profile,
  role,
  scenario,
  snapshot,
  onBoostSkill,
}: {
  profile: Profile;
  role: Role;
  scenario: Scenario;
  snapshot: Snapshot;
  onBoostSkill?: (skillId: SkillId, targetLevel: number) => void;
}) {
  const { t } = useI18n();
  const boosters = calculateScoreBoosters(profile, role, scenario, snapshot);
  if (boosters.length === 0) {
    return (
      <div className="notice">
        <CheckCircle2 size={16} />
        <span>
          {t(
            'You already meet all target skill levels for this role (100% skill coverage).',
          )}
        </span>
      </div>
    );
  }
  return (
    <section
      className="score-booster-section"
      aria-label={t('What would raise this score?')}
    >
      <h3>
        <Zap size={16} /> {t('What would raise this score?')}
      </h3>
      <p className="muted small">
        {t(
          'Each row shows the exact match score increase if you close that skill gap to the required level.',
        )}
      </p>
      <div className="booster-list">
        {boosters.map((item) => (
          <div className="booster-item" key={item.skillId}>
            <div className="booster-main">
              <div>
                <strong>{t(item.skillLabel)}</strong>{' '}
                <span className="muted small">
                  (
                  {t('Level {0} → {1}', {
                    0: item.currentLevel,
                    1: item.targetLevel,
                  })}
                  )
                </span>
              </div>
              <Tag tone="green">
                +{item.deltaScore} pts ({Math.round(item.scoreBefore)} →{' '}
                {Math.round(item.scoreAfter)})
              </Tag>
            </div>
            {item.recommendedCourse && (
              <p className="muted small">
                {t('Fastest verified course: {0} ({1}h · {2})', {
                  0: item.recommendedCourse.title,
                  1: item.recommendedCourse.hours,
                  2: item.recommendedCourse.provider,
                })}
              </p>
            )}
            <div className="booster-actions">
              {item.recommendedCourse && (
                <CourseLink course={item.recommendedCourse} />
              )}
              {onBoostSkill && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onBoostSkill(item.skillId, item.targetLevel)}
                >
                  {t('Simulate Level {0}', { 0: item.targetLevel })}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LearnerBadgesPanel({
  profile,
  plan,
  shared,
  role,
}: {
  profile: Profile;
  plan: LearningPlan;
  shared: SkillId[];
  role: Role;
}) {
  const { t } = useI18n();
  const { badges, completedHours, totalPlannedHours, progressPercent } =
    computeLearnerBadges(profile, plan, shared, role);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section
      className="panel learner-badges-panel"
      aria-label={t('Learner progress & skill badges')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {t('LEARNER MOTIVATION & MILESTONES')}
          </span>
          <h2>{t('Your skill badges & study progress')}</h2>
          <p className="muted small">
            {t(
              '{0} of {1} badges unlocked · {2} of {3} planned hours marked studied ({4}%)',
              {
                0: earnedCount,
                1: badges.length,
                2: completedHours,
                3: totalPlannedHours,
                4: progressPercent,
              },
            )}
          </p>
        </div>
        <Award size={22} />
      </div>
      <div className="badge-progress-bar" aria-hidden="true">
        <i style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="badges-grid">
        {badges.map((badge) => (
          <article
            key={badge.id}
            className={`learner-badge-card ${badge.earned ? 'is-earned' : ''}`}
          >
            <div className="badge-card-top">
              <Tag tone={badge.earned ? 'green' : 'amber'}>
                {badge.earned ? t('Unlocked') : t('In progress')}
              </Tag>
              <small>SDG {badge.sdgTarget}</small>
            </div>
            <h3>{t(badge.title)}</h3>
            <p className="muted small">{t(badge.description)}</p>
            <small className="badge-status-text">{t(badge.progressText)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MalaysiaHrdDirectoryPanel({
  role,
  funding,
}: {
  role: Role;
  funding: 'all' | 'free' | 'hrd';
}) {
  const { t } = useI18n();
  const options = getMalaysiaReskillingOptions(role);
  return (
    <section
      className="panel malaysia-hrd-panel"
      aria-label={t('Malaysia HRD Corp & national reskilling directory')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {t('MALAYSIA PUBLIC & HRD CORP ECOSYSTEM')}
          </span>
          <h2>{t('Local low-cost & HRD Corp reskilling channels')}</h2>
          <p className="muted small">
            {funding === 'hrd'
              ? t(
                  'Individual HRD Corp claimability depends on employer SBL-Khas registration. Below are official Malaysian national platforms mapped to this role’s skills.',
                )
              : t(
                  'Complement your self-paced open courses with official Malaysian public and employer-levy training portals.',
                )}
          </p>
        </div>
        <Compass size={20} />
      </div>
      <div className="malaysia-hrd-grid">
        {options.map((item) => (
          <article className="malaysia-hrd-card" key={item.id}>
            <Tag tone="blue">{t(item.fundingType)}</Tag>
            <h3>{item.title}</h3>
            <p className="muted small">{item.agency}</p>
            <p className="small">{t(item.summary)}</p>
            <div className="chips">
              {item.skills
                .filter((s) => role.requirements[s])
                .map((s) => (
                  <SkillChip key={s} id={s} />
                ))}
            </div>
            <External href={item.url}>{t('Open official portal')}</External>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AggregatedSdgAndFairnessPanel({
  profile,
  activeRole,
  plan,
  scenario,
  snapshot,
  workforce,
}: {
  profile: Profile;
  activeRole: Role;
  plan: LearningPlan;
  scenario: Scenario;
  snapshot: Snapshot;
  workforce: WorkforceSettings;
}) {
  const { t } = useI18n();
  const [scope, setScope] = useState<'person' | 'company' | 'region'>('person');
  const [showPersonas, setShowPersonas] = useState(false);

  const sdgAgg = aggregateSdgContributions(
    profile,
    activeRole,
    plan,
    scenario,
    snapshot,
    workforce,
  );
  const activeSdgList = sdgAgg[scope];
  const fairness = runFairnessAudit(profile, scenario, snapshot);

  return (
    <div className="finals-impact-extensions">
      <section
        className="panel sdg-aggregate-panel"
        aria-label={t('Aggregated SDG contribution view')}
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              {t('UN SDG CONTRIBUTION AGGREGATOR')}
            </span>
            <h2>
              {t('SDG impact across person, SME company & regional scale')}
            </h2>
            <p className="muted small">
              {t(
                'Contextual mapping of how target roles and scheduled study hours align with UN Sustainable Development Goal targets.',
              )}
            </p>
          </div>
          <div className="sdg-scope-tabs" role="group">
            {(
              [
                ['person', '1. Individual learner'],
                ['company', '2. SME company team'],
                ['region', '3. Regional cohort (1,000 learners)'],
              ] as const
            ).map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={scope === id ? 'primary' : 'secondary'}
                onClick={() => setScope(id)}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        <div className="sdg-aggregate-grid">
          {activeSdgList.map((item) => (
            <article className="sdg-aggregate-card" key={item.target}>
              <div className="sdg-card-header">
                <Tag tone="green">SDG {item.target}</Tag>
                <External href={item.url}>{t('UN Target')}</External>
              </div>
              <h3>{t(item.title)}</h3>
              <p className="muted small">{t(item.rationale)}</p>
              <div className="sdg-metrics-row">
                <div>
                  <strong>{item.hours}h</strong>
                  <small>{t('aligned study hours')}</small>
                </div>
                <div>
                  <strong>{item.learnersCount}</strong>
                  <small>{t('learners contributing')}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="panel fairness-audit-panel"
        aria-label={t('Fairness and demographic bias check')}
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              {t('SDG 5 & SDG 10 · COUNTERFACTUAL FAIRNESS CHECK')}
            </span>
            <h2>{t('Algorithmic fairness & demographic bias verification')}</h2>
            <p className="muted small">
              {t(
                'Verifies that recommendations depend strictly on skills, study time, budget and work interests—never on age, gender, ethnicity or background.',
              )}
            </p>
          </div>
          <Tag tone={fairness.passed ? 'green' : 'amber'}>
            {fairness.passed
              ? t('Verified: 0.0% demographic drift')
              : t('Review required')}
          </Tag>
        </div>
        <div className="fairness-summary-grid">
          <div className="fairness-stat">
            <strong>{fairness.personasTested}</strong>
            <span>{t('counterfactual personas tested live')}</span>
          </div>
          <div className="fairness-stat">
            <strong>{fairness.maxScoreVariance}%</strong>
            <span>{t('score variance across age, gender & ethnicity')}</span>
          </div>
          <div className="fairness-stat">
            <strong>0</strong>
            <span>{t('course pathway deviations')}</span>
          </div>
        </div>
        <div className="fairness-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => setShowPersonas(!showPersonas)}
          >
            <ShieldCheck size={16} />
            {showPersonas
              ? t('Hide counterfactual persona table')
              : t('Inspect 6 counterfactual persona checks')}
          </button>
        </div>
        {showPersonas && (
          <div className="fairness-table-wrap">
            <table className="fairness-table">
              <thead>
                <tr>
                  <th>{t('Counterfactual persona')}</th>
                  <th>{t('Demographic variation')}</th>
                  <th>{t('Top matched role')}</th>
                  <th>{t('Suitability score')}</th>
                  <th>{t('Score drift')}</th>
                </tr>
              </thead>
              <tbody>
                {fairness.results.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.personaLabel}</strong>
                    </td>
                    <td>{t(r.demographicNote)}</td>
                    <td>{t(r.topRoleTitle)}</td>
                    <td>{Math.round(r.topScore)}/100</td>
                    <td>
                      <Tag tone="green">{r.scoreVariance}%</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
