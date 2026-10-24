'use client';
import { useMemo } from 'react';
import {
  Download,
  Users,
  GraduationCap,
  Clock3,
  ArrowUpRight,
} from 'lucide-react';
import { roles, skills, skillById, sdgUrl } from '@/lib/catalogue';
import { buildPlan, rankRoles } from '@/lib/engine';
import type { Course, Profile, Scenario, Snapshot } from '@/lib/types';
import type { WorkforceSettings } from '@/lib/workforce-settings';
import { getWorkforceMembers } from '@/lib/workforce-settings';
import { TeamEditor } from './team-editor';
import { CourseLink } from './course-link';
import { downloadFile, External, Tag } from './ui';
import { useI18n } from './language-provider';
export function EmployerPanel({
  profile,
  scenario,
  snapshot,
  workforce,
  onChange,
  onProfileChange,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  workforce: WorkforceSettings;
  onChange: (settings: WorkforceSettings) => void;
  onProfileChange: (profile: Profile) => void;
}) {
  const { t } = useI18n();
  const { destinations, budget, slots } = workforce;
  const team = useMemo(
    () => getWorkforceMembers(workforce, profile),
    [workforce, profile],
  );
  const rows = team.map((p) => {
    const ranked = rankRoles(p, scenario, snapshot);
    const role =
      roles.find((r) => r.id === destinations[p.id]) ?? ranked[0].role;
    return {
      profile: p,
      role,
      match: ranked.find((m) => m.role.id === role.id)!,
      plan: buildPlan(p, role),
    };
  });
  const groups = new Map<string, { course: Course; names: string[] }>();
  let allocated = 0;
  const used: Record<string, number> = {};
  const allocations = rows.map((row) => {
    const slotOk = (used[row.role.id] ?? 0) < (slots[row.role.id] ?? 0),
      budgetOk = allocated + row.plan.totalCost <= budget;
    if (slotOk && budgetOk) {
      used[row.role.id] = (used[row.role.id] ?? 0) + 1;
      allocated += row.plan.totalCost;
      row.plan.steps.forEach((step) => {
        const c = step.course,
          group = groups.get(c.id) ?? {
            course: c,
            names: [],
          };
        group.names.push(row.profile.name);
        groups.set(c.id, group);
      });
    }
    return {
      ...row,
      included: slotOk && budgetOk,
      reason: !slotOk
        ? 'No internal slot'
        : !budgetOk
          ? 'Over team budget'
          : row.plan.uncovered.length
            ? 'Partial learning route'
            : 'Learning route fits',
    };
  });
  const hours = [...groups.values()].reduce(
      (s, g) => s + g.course.hours * g.names.length,
      0,
    ),
    learners = allocations.filter(
      (r) => r.included && r.plan.steps.length > 0,
    ).length;
  const shown = skills.filter((s) =>
    allocations.some((r) => r.role.requirements[s.id]),
  );
  function exportCsv() {
    const escape = (s: string) =>
      `"${s.replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
    const csv = [
      [
        'Synthetic worker',
        'Current role',
        'Proposed role',
        'Scenario',
        'Snapshot',
        'Status',
        'Planned hours',
        'Planned cost RM',
      ],
      ...allocations.map((r) => [
        r.profile.name,
        r.profile.currentRole,
        r.role.title,
        scenario,
        snapshot.id,
        r.reason,
        String(r.included ? r.plan.totalHours : 0),
        String(r.included ? r.plan.totalCost : 0),
      ]),
    ]
      .map((row) => row.map(escape).join(','))
      .join('\r\n');
    downloadFile(
      'ArcTalent-synthetic-training-plan.csv',
      csv,
      'text/csv;charset=utf-8',
    );
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
        <button className="secondary" onClick={exportCsv}>
          <Download size={16} />
          {t('Export plan')}
        </button>
      </div>
      <TeamEditor
        team={team}
        workforce={workforce}
        onChange={onChange}
        onProfileChange={onProfileChange}
      />
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
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('Workforce skills heatmap')}</h2>
            <p>
              {t('Each row is measured against its proposed destination role.')}
            </p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {t(
              snapshot.kind === 'live'
                ? 'Public evidence'
                : 'Simulated evidence',
            )}
          </Tag>
        </div>
        <div className="heatmap-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th>{t('Team member / destination')}</th>
                {shown.map((s) => (
                  <th key={s.id}>{t(s.label)}</th>
                ))}
                <th>{t('Plan status')}</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => (
                <tr key={row.profile.id}>
                  <td>
                    <strong>{row.profile.name}</strong>
                    <small>{t(row.profile.currentRole)}</small>
                    <select
                      aria-label={t('Destination role for {0}', {
                        0: row.profile.name,
                      })}
                      value={row.role.id}
                      onChange={(e) =>
                        onChange({
                          ...workforce,
                          destinations: {
                            ...destinations,
                            [row.profile.id]: e.target.value,
                          },
                        })
                      }
                    >
                      {roles.map((r) => (
                        <option value={r.id} key={r.id}>
                          {t(r.title)}
                        </option>
                      ))}
                    </select>
                  </td>
                  {shown.map((s) => {
                    const required = row.role.requirements[s.id],
                      value = row.profile.skills[s.id] ?? 0,
                      gap = required ? Math.max(required - value, 0) : null;
                    return (
                      <td key={s.id}>
                        <span
                          className={`heat-cell ${gap === null ? 'na' : gap === 0 ? 'ready' : gap === 1 ? 'develop' : 'gap'}`}
                          title={t('{0}: {1}; current {2}, required {3}', {
                            0: row.profile.name,
                            1: t(s.label),
                            2: value,
                            3: required ?? t('not required'),
                          })}
                        >
                          {gap === null ? '—' : gap === 0 ? '✓' : `−${gap}`}
                        </span>
                      </td>
                    );
                  })}
                  <td>
                    <span className={`tag ${row.included ? 'green' : 'amber'}`}>
                      {t(row.reason)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="heatmap-legend">
          <span>
            <i className="heat-cell ready">✓</i>
            {t('Current level meets model')}
          </span>
          <span>
            <i className="heat-cell develop">−1</i>
            {t('One level gap')}
          </span>
          <span>
            <i className="heat-cell gap">−2</i>
            {t('Two level gap')}
          </span>
          <span>{t('— Not required')}</span>
        </div>
      </section>
      <div className="two-columns">
        <section className="panel">
          <h2>{t('Plan within real constraints')}</h2>
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
            {roles.map((r) => (
              <label key={r.id}>
                {t(r.shortTitle)}
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={slots[r.id] ?? 0}
                  onChange={(e) =>
                    onChange({
                      ...workforce,
                      slots: {
                        ...slots,
                        [r.id]: Math.max(
                          0,
                          Math.min(10, Math.floor(Number(e.target.value))),
                        ),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <p className="notice small">
            {t(
              'Allocation follows the displayed worker order. It is a planning heuristic, not an optimum allocation or an employment decision.',
            )}
          </p>
        </section>
        <section className="panel">
          <h2>{t('Learn together')}</h2>
          <p className="muted">
            {t(
              'Compatible needs grouped into the same verified learning resource.',
            )}
          </p>
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
          {!groups.size && (
            <div className="empty-state">
              {t(
                'No training fits the current slots and constraints. Increase capacity or choose a different role.',
              )}
            </div>
          )}
        </section>
      </div>
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
            <External href={sdgUrl('4.4')}>{t('Target 4.4')}</External>
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
            <External href={sdgUrl('8.2')}>{t('Targets 8.2 & 8.5')}</External>
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
            <External href={sdgUrl('10.2')}>{t('Target 10.2')}</External>
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
