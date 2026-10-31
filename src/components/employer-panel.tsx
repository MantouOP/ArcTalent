'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  LoaderCircle,
  Users,
  GraduationCap,
  Clock3,
  History,
} from 'lucide-react';
import { sdgUrl, skillById } from '@/lib/catalogue';
import {
  summarizeTrackRecord,
  type TrackRecordsByProfile,
} from '@/lib/track-record';
import { buildWorkforcePlan } from '@/lib/workforce-plan';
import type { Profile, Scenario, Snapshot } from '@/lib/types';
import type { WorkforceSettings } from '@/lib/workforce-settings';
import { TeamEditor } from './team-editor';
import { WorkforceDestination } from './workforce-destination';
import { WorkforcePlanner } from './workforce-planner';
import { CourseLink } from './course-link';
import { CostComparison } from './cost-comparison';
import { downloadFile, External, Tag } from './ui';
import { useI18n } from './language-provider';

const visibleGaps = 3;

export function EmployerPanel({
  profile,
  scenario,
  snapshot,
  workforce,
  trackRecords = {},
  onChange,
  onProfileChange,
  needsProfile = false,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  workforce: WorkforceSettings;
  trackRecords?: TrackRecordsByProfile;
  onChange: (settings: WorkforceSettings) => void;
  onProfileChange: (profile: Profile) => void;
  needsProfile?: boolean;
}) {
  const { t, locale } = useI18n();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [applied, setApplied] = useState(false);
  const exportRequest = useRef<AbortController | null>(null);
  useEffect(() => () => exportRequest.current?.abort(), []);
  const { budget, slots } = workforce;
  const { team, allocations, groups, allocated, hours, learners, openings } =
    useMemo(
      () => buildWorkforcePlan(profile, scenario, snapshot, workforce),
      [profile, scenario, snapshot, workforce],
    );
  // Only people who have a track record in this browser count towards the cohort row.
  const cohort = useMemo(() => {
    const recorded = team.filter((member) => trackRecords[member.id]?.length);
    const totals = recorded.map((member) =>
      summarizeTrackRecord(trackRecords[member.id]!),
    );
    return {
      people: recorded.length,
      hours: totals.reduce((sum, item) => sum + item.hoursStudied, 0),
      badges: totals.reduce((sum, item) => sum + item.verifiedBadges, 0),
      skills: totals.reduce((sum, item) => sum + item.skillsLeveledUp, 0),
    };
  }, [team, trackRecords]);
  async function exportPdf() {
    if (exporting || needsProfile) return;
    const controller = new AbortController();
    exportRequest.current = controller;
    setExporting(true);
    setExportError(false);
    try {
      const response = await fetch('/api/workforce-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          workforce,
          scenario,
          snapshot: { ...snapshot, signals: [] },
          locale,
        }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(40000),
        ]),
      });
      if (
        !response.ok ||
        !response.headers.get('content-type')?.startsWith('application/pdf')
      )
        throw new Error('PDF export failed');
      const blob = await response.blob();
      if (!controller.signal.aborted)
        downloadFile('ArcTalent-workforce-plan.pdf', blob, 'application/pdf');
    } catch {
      if (!controller.signal.aborted) setExportError(true);
    } finally {
      if (exportRequest.current === controller) {
        exportRequest.current = null;
        if (!controller.signal.aborted) setExporting(false);
      }
    }
  }
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">
            {t('SYNTHETIC COMPANY · {0} PEOPLE', { 0: team.length })}
          </span>
          <h2>{t('A stronger team starts with shared skills.')}</h2>
          <p className="muted">
            {t(
              'Explore internal opportunities. A manager and each employee decide what happens next.',
            )}
          </p>
        </div>
        <button
          className="secondary"
          onClick={exportPdf}
          disabled={exporting || needsProfile}
          aria-busy={exporting}
        >
          {exporting ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Download size={16} />
          )}
          {exporting ? t('Preparing PDF…') : t('Export plan (PDF)')}
        </button>
      </div>
      {needsProfile && (
        <p className="notice">
          {t('Add your profile before exporting a learning plan.')}
        </p>
      )}
      {exportError && (
        <p role="alert" className="notice">
          {t('Could not download the PDF. Please try again.')}
        </p>
      )}
      <WorkforcePlanner
        scenario={scenario}
        onApply={(next) => {
          onChange({ ...next, costs: workforce.costs });
          setApplied(true);
        }}
      />
      {applied && (
        <p className="notice small" role="status">
          {t(
            'The team plan was applied. Review each row below and adjust anything by hand.',
          )}
        </p>
      )}
      <div className="stats-grid three">
        <div className="stat">
          <Users />
          <span>{t('Planned learners')}</span>
          <strong>
            {learners}
            <small>/ {team.length}</small>
          </strong>
        </div>
        <div className="stat">
          <Clock3 />
          <span>{t('Planned learning')}</span>
          <strong>
            {hours}
            <small>{t('person-hours')}</small>
          </strong>
        </div>
        <div className="stat">
          <GraduationCap />
          <span>{t('Training groups')}</span>
          <strong>
            {groups.size}
            <small>{t('shared courses')}</small>
          </strong>
        </div>
      </div>
      <p className="cohort-track-record">
        <History size={16} />
        {cohort.people
          ? t(
              'Team track record: {0} hours studied · {1} verified badges · {2} skills levelled up, from {3} people with records in this browser.',
              {
                0: cohort.hours,
                1: cohort.badges,
                2: cohort.skills,
                3: cohort.people,
              },
            )
          : t(
              'Team track record: no studied courses, badges or confirmed skill levels recorded for this team yet.',
            )}
      </p>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('Workforce redeployment table')}</h2>
            <p className="muted">
              {t('Each row is measured against its proposed destination role.')}
            </p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {snapshot.kind === 'live'
              ? t('Public evidence')
              : t('Simulated evidence')}
          </Tag>
        </div>
        <div className="workforce-table-wrap">
          <table className="workforce-table">
            <thead>
              <tr>
                <th scope="col">{t('Member & current role')}</th>
                <th scope="col">{t('Target destination')}</th>
                <th scope="col">{t('Readiness')}</th>
                <th scope="col">{t('Key skill gaps')}</th>
                <th scope="col">{t('Planned training')}</th>
                <th scope="col">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => {
                const gaps = [...row.match.gaps].sort((a, b) => b.gap - a.gap);
                return (
                  <tr key={row.profile.id}>
                    <th scope="row">
                      <strong>{row.profile.name}</strong>
                      <small>{t(row.profile.currentRole)}</small>
                    </th>
                    <td>
                      <WorkforceDestination
                        profile={row.profile}
                        role={row.role}
                        snapshot={snapshot}
                        workforce={workforce}
                        onChange={onChange}
                      />
                    </td>
                    <td>
                      <strong>{Math.round(row.match.score)}</strong>
                      <small>
                        {t('{0}% skill coverage', {
                          0: Math.round(row.match.coverage),
                        })}
                      </small>
                    </td>
                    <td>
                      {gaps.length ? (
                        <span className="gap-badges">
                          {gaps.slice(0, visibleGaps).map((gap) => (
                            <span
                              className="gap-badge"
                              key={gap.id}
                              title={t('{0}: current {1}, required {2}', {
                                0: t(skillById[gap.id].label),
                                1: gap.current,
                                2: gap.required,
                              })}
                            >
                              {t(skillById[gap.id].label)}
                            </span>
                          ))}
                          {gaps.length > visibleGaps && (
                            <span className="gap-badge more">
                              {t('+{0} more', {
                                0: gaps.length - visibleGaps,
                              })}
                            </span>
                          )}
                        </span>
                      ) : (
                        <small>{t('No gaps')}</small>
                      )}
                    </td>
                    <td>
                      {t('{0} courses · {1}h', {
                        0: row.plan.steps.length,
                        1: row.plan.totalHours,
                      })}
                    </td>
                    <td>
                      <span
                        className={`tag ${row.included ? 'green' : 'amber'}`}
                      >
                        {row.included ? t('Included') : t(row.reason)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!allocations.length && (
          <p className="empty-state">
            {t('Your team is empty. Add a fictional worker to begin planning.')}
          </p>
        )}
      </section>
      <section className="panel">
        <h2>{t('Learn together')}</h2>
        <p className="muted">
          {t(
            'Compatible needs grouped into the same verified learning resource.',
          )}
        </p>
        <div className="training-groups">
          {[...groups].map(([id, g]) => (
            <div className="training-group" key={id}>
              <div className="course-icon">
                <GraduationCap size={18} />
              </div>
              <div className="training-course">
                <h3>{g.course.title}</h3>
                <small>{g.course.provider}</small>
                <p>{g.names.join(', ')}</p>
                <small>
                  {t('{0} learners · {1} hours each · RM {2} each', {
                    0: g.names.length,
                    1: g.course.hours,
                    2: g.course.fee,
                  })}
                </small>
                <div>
                  <CourseLink course={g.course} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {!groups.size && (
          <div className="empty-state">
            {t(
              'No training fits the current slots and constraints. Increase capacity or choose a different role.',
            )}
          </div>
        )}
      </section>
      <details className="panel disclosure">
        <summary>
          <span>{t('Edit individual members & slot caps manually')}</span>
          <small className="muted">
            {t('{0} people · RM {1} budget', { 0: team.length, 1: budget })}
          </small>
        </summary>
        <TeamEditor
          team={team}
          workforce={workforce}
          onChange={onChange}
          onProfileChange={onProfileChange}
        />
        <div className="manual-constraints">
          <h3>{t('Plan within real constraints')}</h3>
          <label>
            {t('Company training budget (RM)')}
            <input
              type="number"
              min={0}
              max={100000}
              value={budget}
              onChange={(e) =>
                onChange({
                  ...workforce,
                  budget: Math.max(0, Math.min(100000, Number(e.target.value))),
                })
              }
            />
          </label>
          <p className="muted">
            {t(
              'RM {0} allocated · RM {1} remaining. Catalogue fees are currently free; staff time and software costs are separate.',
              { 0: allocated, 1: Math.max(0, budget - allocated) },
            )}
          </p>
          <h3>{t('Proposed internal openings')}</h3>
          <p className="muted small">
            {t(
              'Demo assumptions entered by the employer. These are not vacancies inferred from public job postings.',
            )}
          </p>
          <div className="slot-inputs">
            {openings.map(({ role: r, count, worker }) => (
              <label key={r.id}>
                {r.custom ? `${worker} · ${r.title}` : t(r.shortTitle)}
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={count}
                  onChange={(e) => {
                    const value = Math.max(
                      0,
                      Math.min(10, Math.floor(Number(e.target.value))),
                    );
                    const workerId = r.id.slice('custom:'.length);
                    onChange({
                      ...workforce,
                      ...(r.custom
                        ? {
                            customDestinations: {
                              ...workforce.customDestinations,
                              [workerId]: {
                                ...workforce.customDestinations![workerId],
                                openings: value,
                              },
                            },
                          }
                        : { slots: { ...slots, [r.id]: value } }),
                    });
                  }}
                />
              </label>
            ))}
          </div>
          <p className="notice small">
            {t(
              'Allocation follows the displayed worker order. It is a planning heuristic, not an optimum allocation or an employment decision.',
            )}
          </p>
        </div>
      </details>
      <details className="panel disclosure">
        <summary>
          <span>{t('Customize cost assumptions')}</span>
          <small className="muted">
            {t('Seat price, trainer rate and wage rate')}
          </small>
        </summary>
        <CostComparison
          groups={groups}
          workforce={workforce}
          onChange={onChange}
        />
      </details>
      <section className="panel impact-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t('SDG CONTRIBUTION PLAN')}</span>
            <h2>{t('Make the activity visible.')}</h2>
          </div>
          <Tag>{t('Planned · synthetic')}</Tag>
        </div>
        <div className="impact-grid">
          <div>
            <span className="sdg-square red">4</span>
            <h3>{t('Relevant work skills')}</h3>
            <strong>{t('{0} learners', { 0: learners })}</strong>
            <p>{t('With at least one planned learning activity.')}</p>
            <External href={sdgUrl('4')}>{t('SDG 4')}</External>
          </div>
          <div>
            <span className="sdg-square burgundy">8</span>
            <h3>{t('Technological upgrading')}</h3>
            <strong>{t('{0} person-hours', { 0: hours })}</strong>
            <p>
              {t(
                'Proposed training time; productivity effects are unmeasured.',
              )}
            </p>
            <External href={sdgUrl('8')}>{t('SDG 8')}</External>
          </div>
          <div>
            <span className="sdg-square pink">10</span>
            <h3>{t('Accessible pathways')}</h3>
            <strong>{t('{0} free routes', { 0: learners })}</strong>
            <p>
              {t(
                'At least one free activity; routes may still have uncovered gaps.',
              )}
            </p>
            <External href={sdgUrl('10')}>{t('SDG 10')}</External>
          </div>
        </div>
        <p className="muted small">
          {t(
            'These are overlapping activity counts, not official UN indicators. No jobs saved, employment outcomes or inequality reductions have been measured.',
          )}
        </p>
      </section>
    </>
  );
}
