'use client';

import { ArrowRight, Check, Circle, ArrowUp } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { buildSkillBridge } from '@/lib/skill-bridge';
import type { Profile, Role } from '@/lib/types';

export function SkillBridge({
  profile,
  role,
}: {
  profile: Profile;
  role: Role;
}) {
  const { t, skillLabel, roleText, translateCurrentRole } = useLanguage();
  const localizedRole = roleText(role);
  const bridge = buildSkillBridge(profile, role);
  const statuses = {
    ready: { label: t.bridge.meetsTarget, Icon: Check },
    developing: { label: t.bridge.buildFurther, Icon: ArrowUp },
    new: { label: t.bridge.newSkill, Icon: Circle },
  };
  return (
    <section className="panel skill-bridge" aria-labelledby="bridge-title">
      <div className="bridge-route">
        <span>
          {profile.currentRole
            ? translateCurrentRole(profile.currentRole)
            : t.bridge.startingPointFallback}
        </span>
        <ArrowRight size={15} />
        <strong>{localizedRole.shortTitle}</strong>
      </div>
      <div className="bridge-heading">
        <div>
          <h3 id="bridge-title">{t.bridge.title}</h3>
          <p>{t.bridge.subtitle}</p>
        </div>
        <div className="bridge-coverage">
          <strong>
            {bridge.coverage.toFixed(1)}
            <small>%</small>
          </strong>
          <span>{t.bridge.skillCoverage}</span>
        </div>
      </div>
      <div
        className="bridge-track"
        role="meter"
        aria-label={t.bridge.meterAria}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={bridge.coverage}
      >
        <span style={{ width: `${bridge.coverage}%` }} />
      </div>
      <dl className="bridge-counts">
        <div>
          <dt>{t.bridge.meetTargetCount}</dt>
          <dd>
            {bridge.ready}
            <small>{t.bridge.skillUnit(bridge.ready)}</small>
          </dd>
        </div>
        <div>
          <dt>{t.bridge.buildFurtherCount}</dt>
          <dd>
            {bridge.developing}
            <small>{t.bridge.skillUnit(bridge.developing)}</small>
          </dd>
        </div>
        <div>
          <dt>{t.bridge.learnFromScratchCount}</dt>
          <dd>
            {bridge.newSkills}
            <small>{t.bridge.skillUnit(bridge.newSkills)}</small>
          </dd>
        </div>
      </dl>
      <details className="bridge-details">
        <summary>{t.bridge.inspectRequirements(bridge.rows.length)}</summary>
        <div className="bridge-table-wrap">
          <table className="bridge-table">
            <caption>{t.bridge.tableCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{t.bridge.colSkill}</th>
                <th scope="col">{t.bridge.colCurrentTarget}</th>
                <th scope="col">{t.bridge.colNextStep}</th>
              </tr>
            </thead>
            <tbody>
              {bridge.rows.map((row) => {
                const { label, Icon } = statuses[row.status];
                return (
                  <tr key={row.id}>
                    <th scope="row">{skillLabel(row.id)}</th>
                    <td>
                      {row.current}
                      <span aria-hidden="true"> → </span>
                      <span className="sr-only">{t.bridge.toSrOnly}</span>
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
        {!bridge.rows.length && <p>{t.bridge.noRequirementsMapped}</p>}
      </details>
      <p className="bridge-note">{t.bridge.bridgeNote}</p>
    </section>
  );
}
