'use client';

import { ArrowRight, Check, Circle, ArrowUp } from 'lucide-react';
import { skillById } from '@/lib/catalogue';
import { buildSkillBridge } from '@/lib/skill-bridge';
import type { Profile, Role } from '@/lib/types';

const statuses = {
  ready: { label: 'Meets target', Icon: Check },
  developing: { label: 'Build further', Icon: ArrowUp },
  new: { label: 'New skill', Icon: Circle },
};

export function SkillBridge({
  profile,
  role,
}: {
  profile: Profile;
  role: Role;
}) {
  const bridge = buildSkillBridge(profile, role);
  return (
    <section className="panel skill-bridge" aria-labelledby="bridge-title">
      <div className="bridge-route">
        <span>{profile.currentRole || 'Your starting point'}</span>
        <ArrowRight size={15} />
        <strong>{role.shortTitle}</strong>
      </div>
      <div className="bridge-heading">
        <div>
          <h3 id="bridge-title">Your transferable skill bridge</h3>
          <p>See what carries across, and what comes next.</p>
        </div>
        <div className="bridge-coverage">
          <strong>
            {bridge.coverage.toFixed(1)}
            <small>%</small>
          </strong>
          <span>skill coverage</span>
        </div>
      </div>
      <div
        className="bridge-track"
        role="meter"
        aria-label="Coverage of assumed role skill requirements"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={bridge.coverage}
      >
        <span style={{ width: `${bridge.coverage}%` }} />
      </div>
      <dl className="bridge-counts">
        <div>
          <dt>Meet target</dt>
          <dd>
            {bridge.ready}
            <small>{bridge.ready === 1 ? 'skill' : 'skills'}</small>
          </dd>
        </div>
        <div>
          <dt>Build further</dt>
          <dd>
            {bridge.developing}
            <small>{bridge.developing === 1 ? 'skill' : 'skills'}</small>
          </dd>
        </div>
        <div>
          <dt>Learn from scratch</dt>
          <dd>
            {bridge.newSkills}
            <small>{bridge.newSkills === 1 ? 'skill' : 'skills'}</small>
          </dd>
        </div>
      </dl>
      <details className="bridge-details">
        <summary>Inspect {bridge.rows.length} skill requirements</summary>
        <div className="bridge-table-wrap">
          <table className="bridge-table">
            <caption>
              Self-reported current level compared with the assumed target. 0
              Not yet · 1 Basic · 2 Independent · 3 Advanced.
            </caption>
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Current → target</th>
                <th scope="col">Next step</th>
              </tr>
            </thead>
            <tbody>
              {bridge.rows.map((row) => {
                const { label, Icon } = statuses[row.status];
                return (
                  <tr key={row.id}>
                    <th scope="row">{skillById[row.id].label}</th>
                    <td>
                      {row.current}
                      <span aria-hidden="true"> → </span>
                      <span className="sr-only"> to </span>
                      {row.required}
                    </td>
                    <td>
                      <span className={`bridge-status ${row.status}`}>
                        <Icon size={13} />
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!bridge.rows.length && (
          <p>No skill requirements have been mapped for this role.</p>
        )}
      </details>
      <p className="bridge-note">
        Coverage compares your self-reported levels with the team’s simplified
        role requirements. It is not a qualification or a chance of getting
        hired.
      </p>
    </section>
  );
}
