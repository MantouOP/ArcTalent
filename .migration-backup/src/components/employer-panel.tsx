'use client';
import { useMemo, useState } from 'react';
import {
  Download,
  Users,
  GraduationCap,
  Clock3,
  ArrowUpRight,
} from 'lucide-react';
import { employees, roles, skills, skillById, sdgUrl } from '@/lib/catalogue';
import { buildPlan, rankRoles } from '@/lib/engine';
import type { Profile, Scenario, Snapshot } from '@/lib/types';
import { downloadFile, External, Tag } from './ui';
export function EmployerPanel({
  profile,
  scenario,
  snapshot,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
}) {
  const [destinations, setDestinations] = useState<Record<string, string>>({}),
    [budget, setBudget] = useState(500),
    [slots, setSlots] = useState<Record<string, number>>({
      bi: 2,
      project: 2,
      sustainability: 1,
      logistics: 1,
      training: 1,
      management: 1,
    });
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
        const c = step.course,
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
        ? 'No internal slot'
        : !budgetOk
          ? 'Over team budget'
          : row.plan.uncovered.length
            ? 'Partial learning route'
            : 'Learning route fits',
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
          <span className="eyebrow">SYNTHETIC COMPANY · 8 PEOPLE</span>
          <h2>A stronger team starts with shared skills.</h2>
          <p className="muted">
            Explore internal opportunities. A manager and each employee decide
            what happens next.
          </p>
        </div>
        <button className="secondary" onClick={exportCsv}>
          <Download size={16} />
          Export plan
        </button>
      </div>
      <div className="stats-grid three">
        <div className="stat">
          <Users />
          <span>Planned learners</span>
          <strong>
            {learners}
            <small>/ 8</small>
          </strong>
        </div>
        <div className="stat">
          <Clock3 />
          <span>Planned learning</span>
          <strong>
            {hours}
            <small>person-hours</small>
          </strong>
        </div>
        <div className="stat">
          <GraduationCap />
          <span>Training groups</span>
          <strong>
            {groups.size}
            <small>shared courses</small>
          </strong>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Workforce skills heatmap</h2>
            <p>Each row is measured against its proposed destination role.</p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {snapshot.kind === 'live'
              ? 'Public evidence'
              : 'Simulated evidence'}
          </Tag>
        </div>
        <div className="heatmap-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th>Team member / destination</th>
                {shown.map((s) => (
                  <th key={s.id}>{s.label}</th>
                ))}
                <th>Plan status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => (
                <tr key={row.profile.id}>
                  <td>
                    <strong>{row.profile.name}</strong>
                    <small>{row.profile.currentRole}</small>
                    <select
                      aria-label={`Destination role for ${row.profile.name}`}
                      value={row.role.id}
                      onChange={(e) =>
                        setDestinations((v) => ({
                          ...v,
                          [row.profile.id]: e.target.value,
                        }))
                      }
                    >
                      {roles.map((r) => (
                        <option value={r.id} key={r.id}>
                          {r.title}
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
                          title={`${row.profile.name}: ${s.label}; current ${value}, required ${required ?? 'not required'}`}
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
            <i className="heat-cell ready">✓</i>Current level meets model
          </span>
          <span>
            <i className="heat-cell develop">−1</i>One level gap
          </span>
          <span>
            <i className="heat-cell gap">−2</i>Two level gap
          </span>
          <span>— Not required</span>
        </div>
      </section>
      <div className="two-columns">
        <section className="panel">
          <h2>Plan within real constraints</h2>
          <label>
            Company training budget (RM)
            <input
              type="number"
              min={0}
              max={100000}
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
            />
          </label>
          <p className="muted">
            RM {allocated} allocated · RM {Math.max(0, budget - allocated)}{' '}
            remaining. Catalogue fees are currently free; staff time and
            software costs are separate.
          </p>
          <h3>Proposed internal openings</h3>
          <p className="muted small">
            Demo assumptions entered by the employer. These are not vacancies
            inferred from public job postings.
          </p>
          <div className="slot-inputs">
            {roles.map((r) => (
              <label key={r.id}>
                {r.shortTitle}
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={slots[r.id] ?? 0}
                  onChange={(e) =>
                    setSlots((s) => ({
                      ...s,
                      [r.id]: Math.max(
                        0,
                        Math.min(8, Math.floor(Number(e.target.value))),
                      ),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="notice small">
            Allocation follows the displayed worker order. It is a planning
            heuristic, not an optimum allocation or an employment decision.
          </p>
        </section>
        <section className="panel">
          <h2>Learn together</h2>
          <p className="muted">
            Compatible needs grouped into the same verified learning resource.
          </p>
          {[...groups].map(([id, g]) => (
            <div className="training-group" key={id}>
              <div className="course-icon">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3>{g.title}</h3>
                <p>{g.names.join(', ')}</p>
                <small>
                  {g.names.length} learners · {g.hours} hours each · RM {g.fee}{' '}
                  each
                </small>
              </div>
            </div>
          ))}
          {!groups.size && (
            <div className="empty-state">
              No training fits the current slots and constraints. Increase
              capacity or choose a different role.
            </div>
          )}
        </section>
      </div>
      <section className="panel impact-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SDG CONTRIBUTION PLAN</span>
            <h2>Make the activity visible.</h2>
          </div>
          <Tag>Planned · synthetic</Tag>
        </div>
        <div className="impact-grid">
          <div>
            <span className="sdg-square red">4</span>
            <h3>Relevant work skills</h3>
            <strong>{learners} learners</strong>
            <p>With at least one planned learning activity.</p>
            <External href={sdgUrl('4.4')}>Target 4.4</External>
          </div>
          <div>
            <span className="sdg-square burgundy">8</span>
            <h3>Technological upgrading</h3>
            <strong>{hours} person-hours</strong>
            <p>Proposed training time; productivity effects are unmeasured.</p>
            <External href={sdgUrl('8.2')}>Targets 8.2 & 8.5</External>
          </div>
          <div>
            <span className="sdg-square pink">10</span>
            <h3>Accessible pathways</h3>
            <strong>{learners} free routes</strong>
            <p>
              At least one free activity; routes may still have uncovered gaps.
            </p>
            <External href={sdgUrl('10.2')}>Target 10.2</External>
          </div>
        </div>
        <p className="muted small">
          These are overlapping activity counts, not official UN indicators. No
          jobs saved, employment outcomes or inequality reductions have been
          measured.
        </p>
      </section>
    </>
  );
}
