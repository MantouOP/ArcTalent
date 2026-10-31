'use client';

import { useId, useState } from 'react';
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
import { sdgLabel } from '@/lib/catalogue';
import { roleLabel } from '@/lib/role-label';
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
  type SkillMomentumItem,
} from '@/lib/finals-enhancements';
import type {
  CareerGoal,
  LearningPlan,
  Profile,
  Role,
  Scenario,
  SkillId,
  Snapshot,
} from '@/lib/types';
import type { PracticeBadge } from '@/lib/study-progress-ai';
import type { TrackRecordEntry } from '@/lib/track-record';
import type { WorkforceSettings } from '@/lib/workforce-settings';
import { CourseLink } from './course-link';
import { useI18n } from './language-provider';
import { StudyProgressAiSection } from './study-progress-ai-panel';
import { TrackRecordPanel } from './track-record-panel';
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
  const active = SDG_FOCUS_OPTIONS.find((option) => option.id === focus);
  return (
    <section className="sdg-pill-bar" aria-label={t('SDG priority lens')}>
      <span className="sdg-pill-label">{t('SDG priority')}</span>
      <div
        className="sdg-pills"
        role="group"
        aria-label={t('SDG priority lens')}
      >
        {SDG_FOCUS_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`sdg-pill ${focus === option.id ? 'is-active' : ''}`}
            aria-pressed={focus === option.id}
            title={t(option.description)}
            onClick={() => onChange(option.id)}
          >
            <strong>{t(option.badge)}</strong>
            {option.id !== 'all' && <span>{t(option.title)}</span>}
          </button>
        ))}
      </div>
      {focus !== 'all' && active && defaultTopRole && newTopRole && (
        <p className="sdg-pill-note" role="status">
          <Sparkles size={14} />
          <span>
            <strong>
              {shifted
                ? t('SDG lens changed your #1 recommendation: {0} → {1}', {
                    0: roleLabel(defaultTopRole, t),
                    1: roleLabel(newTopRole, t),
                  })
                : t('With this lens, {0} is still your #1 match.', {
                    0: roleLabel(newTopRole, t),
                  })}
            </strong>{' '}
            <span className="muted">
              {t(
                'Lens points: +10 when a role’s own SDG goal matches, plus up to +10 for the share of its required skills mapped to that goal. Suitability scores stay the same; only the order changes.',
              )}
            </span>
          </span>
        </p>
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
  const comparing = previous !== null && previous.id !== snapshot.id;
  const items = buildFutureSkillsRadar(snapshot, previous);
  const byDemand = [...items].sort((a, b) => b.currentDemand - a.currentDemand);
  const rising = comparing
    ? items.filter((i) => i.trend === 'rising').slice(0, 4)
    : byDemand.slice(0, 4);
  const cooling = comparing
    ? items.filter((i) => i.trend === 'declining').slice(0, 4)
    : byDemand.slice(4).slice(-4).reverse();
  const row = (item: SkillMomentumItem, tone: 'green' | 'amber') => (
    <div className="momentum-row" key={item.skillId}>
      <div>
        <strong>{t(item.label)}</strong>
        <small>{sdgLabel(item.sdgTarget)}</small>
      </div>
      <Tag tone={tone}>
        {item.beforeDemand === null
          ? `${item.currentDemand}%`
          : `${item.beforeDemand}% → ${item.currentDemand}%`}
      </Tag>
    </div>
  );

  return (
    <section
      className="panel future-radar-panel"
      aria-label={t('Future Skills Radar')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t('FUTURE SKILLS RADAR')}</span>
          <h2>
            {comparing
              ? t('Rising & declining skill signals')
              : t('Skill demand in this snapshot')}
          </h2>
          <p className="muted small">
            {t('Source: {0} · Snapshot date: {1}', {
              0: t(snapshot.label),
              1: snapshot.asOf.slice(0, 10),
            })}{' '}
            {comparing
              ? t('Compared with {0} ({1}).', {
                  0: t(previous.label),
                  1: previous.asOf.slice(0, 10),
                })
              : t('Switch the demo snapshot to see which skills rise or cool.')}
          </p>
        </div>
        <button type="button" className="secondary" onClick={onFlipTrend}>
          <RefreshCw size={15} />
          {t('Switch demo snapshot')}
        </button>
      </div>
      <div className="radar-momentum-grid">
        <div className="momentum-col rising">
          <h3>
            <TrendingUp size={16} />
            {comparing ? t('Rising demand') : t('Highest demand now')}
          </h3>
          {rising.length > 0 ? (
            rising.map((item) => row(item, 'green'))
          ) : (
            <p className="muted small">
              {comparing
                ? t('No skill rose by 8 points or more.')
                : t('This snapshot has no skill demand values.')}
            </p>
          )}
        </div>
        <div className="momentum-col declining">
          <h3>
            <TrendingDown size={16} />
            {comparing ? t('Cooling demand') : t('Lowest demand now')}
          </h3>
          {cooling.length > 0 ? (
            cooling.map((item) => row(item, 'amber'))
          ) : (
            <p className="muted small">
              {comparing
                ? t('No skill fell by 8 points or more.')
                : t('This snapshot has no skill demand values.')}
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
          <span className="eyebrow">{t('AUTOMATIC RE-PLANNING')}</span>
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
          <strong>{t('Courses kept')}</strong>
          <p className="muted small">
            {diff.keptCourses.length > 0
              ? diff.keptCourses.map((c) => c.title).join(' · ')
              : t('No course carried over from the earlier plan.')}
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
}: {
  profile: Profile;
  role: Role;
  scenario: Scenario;
  snapshot: Snapshot;
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
            {item.recommendedCourse ? (
              <>
                <p className="muted small">
                  {t('Shortest course for this skill: {0} ({1}h · {2})', {
                    0: item.recommendedCourse.title,
                    1: item.recommendedCourse.hours,
                    2: item.recommendedCourse.provider,
                  })}
                </p>
                <div className="booster-actions">
                  <CourseLink course={item.recommendedCourse} />
                </div>
              </>
            ) : (
              <p className="muted small">
                {t(
                  'Level 3 needs advanced study or work experience beyond these courses.',
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const badgeTabs = [
  { id: 'milestones', label: 'Milestone badges' },
  { id: 'coach', label: 'AI study coach' },
  { id: 'practice', label: 'Practice check-in' },
  { id: 'track', label: 'Track record' },
] as const;
type BadgeTab = (typeof badgeTabs)[number]['id'];

export function LearnerBadgesPanel({
  profile,
  plan,
  shared,
  role,
  scenario,
  snapshot,
  customGoal = null,
  funding = 'all',
  practiceBadges = [],
  trackRecord = [],
  onChangePracticeBadges,
  onConfirmSkillLevel,
}: {
  profile: Profile;
  plan: LearningPlan;
  shared: SkillId[];
  role: Role;
  scenario?: Scenario;
  snapshot?: Snapshot;
  customGoal?: CareerGoal | null;
  funding?: 'all' | 'free' | 'hrd';
  practiceBadges?: PracticeBadge[];
  trackRecord?: TrackRecordEntry[];
  onChangePracticeBadges?: (next: PracticeBadge[]) => void;
  onConfirmSkillLevel?: (skillId: SkillId, level: number) => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const [tab, setTab] = useState<BadgeTab>('milestones');
  const { badges, completedHours, totalPlannedHours, progressPercent } =
    computeLearnerBadges(profile, plan, shared, role);
  const earnedCount = badges.filter((b) => b.earned).length;
  const hasStudyAi = Boolean(scenario && snapshot && onChangePracticeBadges);
  const tabs = badgeTabs.filter(
    (item) => hasStudyAi || (item.id !== 'coach' && item.id !== 'practice'),
  );
  const move = (step: number) => {
    const index = tabs.findIndex((item) => item.id === tab);
    const next = tabs[(index + step + tabs.length) % tabs.length].id;
    setTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <section
      className="panel learner-badges-panel"
      aria-label={t('Learner progress & skill badges')}
    >
      <div className="panel-heading">
        <div>
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
      <div
        className="badge-tabs"
        role="tablist"
        aria-label={t('Badge and progress views')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') move(1);
          else if (event.key === 'ArrowLeft') move(-1);
          else return;
          event.preventDefault();
        }}
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`${id}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`${id}-panel-${item.id === 'practice' ? 'coach' : item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => setTab(item.id)}
          >
            {t(item.label)}
            {item.id === 'track' && trackRecord.length > 0 && (
              <span className="badge-tab-count">{trackRecord.length}</span>
            )}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel-milestones`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-milestones`}
        hidden={tab !== 'milestones'}
      >
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
                <small>{sdgLabel(badge.sdgTarget)}</small>
              </div>
              <h3>{t(badge.title)}</h3>
              <p className="muted small">{t(badge.description)}</p>
              <small className="badge-status-text">
                {t(badge.progressText, badge.progressValues)}
              </small>
            </article>
          ))}
        </div>
      </div>
      {scenario && snapshot && onChangePracticeBadges && (
        // Stays mounted across tabs so a coach answer or draft reflection is kept.
        <div
          id={`${id}-panel-coach`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab === 'practice' ? 'practice' : 'coach'}`}
          hidden={tab !== 'coach' && tab !== 'practice'}
        >
          <StudyProgressAiSection
            view={tab === 'practice' ? 'practice' : 'coach'}
            profile={profile}
            plan={plan}
            role={role}
            scenario={scenario}
            snapshot={snapshot}
            customGoal={customGoal}
            funding={funding}
            practiceBadges={practiceBadges}
            onChangePracticeBadges={onChangePracticeBadges}
            onConfirmSkillLevel={onConfirmSkillLevel}
          />
        </div>
      )}
      <div
        id={`${id}-panel-track`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-track`}
        hidden={tab !== 'track'}
      >
        <TrackRecordPanel record={trackRecord} role={role} />
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
      aria-label={t('Malaysian training portals')}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {t('MALAYSIA PUBLIC & HRD CORP ECOSYSTEM')}
          </span>
          <h2>{t('Malaysian training portals for this role')}</h2>
          <p className="muted small">
            {funding === 'hrd'
              ? t(
                  'HRD Corp funding is claimed by registered employers, not by individual learners. Ask your employer before you enrol.',
                )
              : t(
                  'Official Malaysian portals to search for courses on these skills. Check each course’s fee and funding before you enrol.',
                )}
          </p>
        </div>
        <Compass size={20} />
      </div>
      <div className="malaysia-hrd-grid">
        {options.map((item) => {
          const relevant = item.skills.filter((s) => role.requirements[s]);
          return (
            <article className="malaysia-hrd-card" key={item.id}>
              <Tag tone="blue">{t(item.fundingType)}</Tag>
              <h3>{item.title}</h3>
              <p className="muted small">{item.agency}</p>
              <p className="small">{t(item.summary)}</p>
              {relevant.length > 0 && (
                <>
                  <p className="muted small">{t('Skills to search for')}</p>
                  <div className="chips">
                    {relevant.map((s) => (
                      <SkillChip key={s} id={s} />
                    ))}
                  </div>
                </>
              )}
              <External href={item.url}>{t('Open official portal')}</External>
            </article>
          );
        })}
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
                ['region', '3. Regional projection (1,000 learners)'],
              ] as const
            ).map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={scope === id ? 'primary' : 'secondary'}
                aria-pressed={scope === id}
                onClick={() => setScope(id)}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        {scope === 'region' && (
          <p className="notice small">
            {t(
              'Projection, not a measurement: the {0}-person SME team’s plans scaled to 1,000 learners.',
              { 0: sdgAgg.teamSize },
            )}
          </p>
        )}
        <div className="sdg-aggregate-grid">
          {activeSdgList.map((item) => (
            <article className="sdg-aggregate-card" key={item.target}>
              <div className="sdg-card-header">
                <Tag tone="green">{sdgLabel(item.target)}</Tag>
                <External href={item.url}>{t('UN Goal')}</External>
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
        aria-label={t('Fairness check')}
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t('FAIRNESS CHECK')}</span>
            <h2>{t('Recommendations ignore personal identity')}</h2>
            <p className="muted small">
              {t(
                'Matching reads only skills, interests, study time, budget and completed courses. There are no fields for age, gender, ethnicity or religion. This check re-runs matching with six different names and job titles to confirm the results stay the same.',
              )}
            </p>
          </div>
          <Tag tone={fairness.passed ? 'green' : 'amber'}>
            {fairness.passed
              ? t('Same results for all {0}', { 0: fairness.personasTested })
              : t('Results changed: review')}
          </Tag>
        </div>
        <div className="fairness-summary-grid">
          <div className="fairness-stat">
            <strong>{fairness.personasTested}</strong>
            <span>{t('name and job-title swaps')}</span>
          </div>
          <div className="fairness-stat">
            <strong>{fairness.maxScoreChange}</strong>
            <span>{t('largest score change (points)')}</span>
          </div>
          <div className="fairness-stat">
            <strong>{fairness.pathwayChanges}</strong>
            <span>{t('learning pathways that changed')}</span>
          </div>
        </div>
        <div className="fairness-actions">
          <button
            type="button"
            className="secondary"
            aria-expanded={showPersonas}
            onClick={() => setShowPersonas(!showPersonas)}
          >
            <ShieldCheck size={16} />
            {showPersonas
              ? t('Hide the checks')
              : t('Show all {0} checks', { 0: fairness.personasTested })}
          </button>
        </div>
        {showPersonas && (
          <div className="fairness-table-wrap">
            <table className="fairness-table">
              <thead>
                <tr>
                  <th>{t('Name used')}</th>
                  <th>{t('Job title used')}</th>
                  <th>{t('Top matched role')}</th>
                  <th>{t('Suitability score')}</th>
                  <th>{t('Score change')}</th>
                </tr>
              </thead>
              <tbody>
                {fairness.results.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{t(r.name)}</strong>
                    </td>
                    <td>
                      {r.currentRole ? t(r.currentRole) : t('No job title')}
                    </td>
                    <td>{t(r.topRoleTitle)}</td>
                    <td>{Math.round(r.topScore)}/100</td>
                    <td>
                      <Tag tone={r.scoreChange === 0 ? 'green' : 'amber'}>
                        {r.scoreChange}
                      </Tag>
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
