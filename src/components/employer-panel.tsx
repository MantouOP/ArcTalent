'use client';
import { useMemo } from 'react';
import {
  Download,
  Users,
  GraduationCap,
  Clock3,
} from 'lucide-react';
import { employees, roles, skills, sdgUrl } from '@/lib/catalogue';
import { buildPlan, rankRoles } from '@/lib/engine';
import { useLanguage } from '@/lib/i18n';
import type { Profile, Scenario, Snapshot } from '@/lib/types';
import type { WorkforceSettings } from '@/lib/workforce-settings';
import { downloadFile, External, Tag } from './ui';
export function EmployerPanel({
  profile,
  scenario,
  snapshot,
  workforce,
  onChange,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  workforce: WorkforceSettings;
  onChange: (settings: WorkforceSettings) => void;
}) {
  const {
    t,
    skillLabel,
    roleText,
    courseText,
    translateCurrentRole,
  } = useLanguage();
  const { destinations, budget, slots } = workforce;
  const team = useMemo(
    () => employees.map((e) => (e.id === profile.id ? profile : e)),
    [profile],
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
  const groups = new Map<
    string,
    { title: string; names: string[]; hours: number; fee: number }
  >();
  let allocated = 0;
  const used: Record<string, number> = {};
  const allocations = rows.map((row) => {
    const slotOk = (used[row.role.id] ?? 0) < (slots[row.role.id] ?? 0),
      budgetOk = allocated + row.plan.totalCost <= budget;
    if (slotOk && budgetOk) {
      used[row.role.id] = (used[row.role.id] ?? 0) + 1;
      allocated += row.plan.totalCost;
      row.plan.steps.forEach((step) => {
        const c = courseText(step.course),
          group = groups.get(c.id) ?? {
            title: c.title,
            names: [],
            hours: c.hours,
            fee: c.fee,
          };
        group.names.push(row.profile.name);
        groups.set(c.id, group);
      });
    }
    return {
      ...row,
      included: slotOk && budgetOk,
      reason: !slotOk
        ? t.employerPanel.reasons.noSlot
        : !budgetOk
          ? t.employerPanel.reasons.overBudget
          : row.plan.uncovered.length
            ? t.employerPanel.reasons.partial
            : t.employerPanel.reasons.fits,
    };
  });
  const hours = [...groups.values()].reduce(
      (s, g) => s + g.hours * g.names.length,
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
        translateCurrentRole(r.profile.currentRole),
        roleText(r.role).title,
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
          <span className="eyebrow">{t.employerPanel.eyebrow}</span>
          <h2>{t.employerPanel.title}</h2>
          <p className="muted">{t.employerPanel.subtitle}</p>
        </div>
        <button className="secondary" onClick={exportCsv}>
          <Download size={16} />
          {t.employerPanel.exportPlan}
        </button>
      </div>
      <div className="stats-grid three">
        <div className="stat">
          <Users />
          <span>{t.employerPanel.plannedLearners}</span>
          <strong>
            {learners}
            <small>/ 8</small>
          </strong>
        </div>
        <div className="stat">
          <Clock3 />
          <span>{t.employerPanel.plannedLearning}</span>
          <strong>
            {hours}
            <small>{t.employerPanel.personHours}</small>
          </strong>
        </div>
        <div className="stat">
          <GraduationCap />
          <span>{t.employerPanel.trainingGroups}</span>
          <strong>
            {groups.size}
            <small>{t.employerPanel.sharedCourses}</small>
          </strong>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t.employerPanel.heatmapTitle}</h2>
            <p>{t.employerPanel.heatmapDesc}</p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {snapshot.kind === 'live'
              ? t.publicEvidence
              : t.simulatedEvidence}
          </Tag>
        </div>
        <div className="heatmap-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th>{t.employerPanel.colTeamMember}</th>
                {shown.map((s) => (
                  <th key={s.id}>{skillLabel(s.id)}</th>
                ))}
                <th>{t.employerPanel.colPlanStatus}</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => (
                <tr key={row.profile.id}>
                  <td>
                    <strong>{row.profile.name}</strong>
                    <small>{translateCurrentRole(row.profile.currentRole)}</small>
                    <select
                      aria-label={t.employerPanel.destinationRoleAria(
                        row.profile.name,
                      )}
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
                          {roleText(r).title}
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
                          title={`${row.profile.name}: ${skillLabel(s.id)}; ${value} / ${required ?? '—'}`}
                        >
                          {gap === null ? '—' : gap === 0 ? '✓' : `−${gap}`}
                        </span>
                      </td>
                    );
                  })}
                  <td>
                    <span className={`tag ${row.included ? 'green' : 'amber'}`}>
                      {row.reason}
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
            {t.employerPanel.legendMeets}
          </span>
          <span>
            <i className="heat-cell develop">−1</i>
            {t.employerPanel.legendOneGap}
          </span>
          <span>
            <i className="heat-cell gap">−2</i>
            {t.employerPanel.legendTwoGap}
          </span>
          <span>{t.employerPanel.legendNotRequired}</span>
        </div>
      </section>
      <div className="two-columns">
        <section className="panel">
          <h2>{t.employerPanel.planWithinConstraints}</h2>
          <label>
            {t.employerPanel.companyBudgetLabel}
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
            {t.employerPanel.budgetAllocationSummary(
              allocated,
              Math.max(0, budget - allocated),
            )}
          </p>
          <h3>{t.employerPanel.proposedOpenings}</h3>
          <p className="muted small">{t.employerPanel.proposedOpeningsDesc}</p>
          <div className="slot-inputs">
            {roles.map((r) => (
              <label key={r.id}>
                {roleText(r).shortTitle}
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={slots[r.id] ?? 0}
                  onChange={(e) =>
                    onChange({
                      ...workforce,
                      slots: {
                        ...slots,
                        [r.id]: Math.max(
                          0,
                          Math.min(8, Math.floor(Number(e.target.value))),
                        ),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <p className="notice small">
            {t.employerPanel.allocationHeuristicNotice}
          </p>
        </section>
        <section className="panel">
          <h2>{t.employerPanel.learnTogether}</h2>
          <p className="muted">{t.employerPanel.learnTogetherDesc}</p>
          {[...groups].map(([id, g]) => (
            <div className="training-group" key={id}>
              <div className="course-icon">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3>{g.title}</h3>
                <p>{g.names.join(', ')}</p>
                <small>
                  {t.employerPanel.groupMeta(g.names.length, g.hours, g.fee)}
                </small>
              </div>
            </div>
          ))}
          {!groups.size && (
            <div className="empty-state">{t.employerPanel.noTrainingFits}</div>
          )}
        </section>
      </div>
      <section className="panel impact-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t.employerPanel.sdgEyebrow}</span>
            <h2>{t.employerPanel.sdgTitle}</h2>
          </div>
          <Tag>{t.employerPanel.plannedSyntheticTag}</Tag>
        </div>
        <div className="impact-grid">
          <div>
            <span className="sdg-square red">4</span>
            <h3>{t.employerPanel.sdg4Title}</h3>
            <strong>{t.employerPanel.sdg4Count(learners)}</strong>
            <p>{t.employerPanel.sdg4Desc}</p>
            <External href={sdgUrl('4.4')}>{t.employerPanel.sdg4Link}</External>
          </div>
          <div>
            <span className="sdg-square burgundy">8</span>
            <h3>{t.employerPanel.sdg8Title}</h3>
            <strong>{t.employerPanel.sdg8Count(hours)}</strong>
            <p>{t.employerPanel.sdg8Desc}</p>
            <External href={sdgUrl('8.2')}>{t.employerPanel.sdg8Link}</External>
          </div>
          <div>
            <span className="sdg-square pink">10</span>
            <h3>{t.employerPanel.sdg10Title}</h3>
            <strong>{t.employerPanel.sdg10Count(learners)}</strong>
            <p>{t.employerPanel.sdg10Desc}</p>
            <External href={sdgUrl('10.2')}>
              {t.employerPanel.sdg10Link}
            </External>
          </div>
        </div>
        <p className="muted small">{t.employerPanel.sdgDisclaimer}</p>
      </section>
    </>
  );
}
