'use client';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, X, Check, Circle } from 'lucide-react';
import { skillById, sdgUrl } from '@/lib/catalogue';
import type { Match, Profile, SkillId } from '@/lib/types';
import { useI18n } from './language-provider';
export function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="external">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export function Tag({
  children,
  tone = 'green',
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const previousFocus = document.activeElement;
    el?.showModal();
    return () => {
      el?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={t(title)}
    >
      <header>
        <h2>{t(title)}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t('Close dialog')}
        >
          <X size={20} />
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function SkillChip({
  id,
  existing = false,
}: {
  id: SkillId;
  existing?: boolean;
}) {
  const { t } = useI18n();
  const skill = skillById[id];
  return (
    <a
      className={`skill-chip ${existing ? 'existing' : ''}`}
      href={sdgUrl(skill.target)}
      target="_blank"
      rel="noreferrer"
      title={t('SDG {0}: {1}', { 0: skill.target, 1: t(skill.rationale) })}
      aria-label={t('{0} — SDG target {1}. {2}', {
        0: t(skill.label),
        1: skill.target,
        2: t(skill.rationale),
      })}
    >
      {existing ? <Check size={12} /> : <Circle size={9} />} {t(skill.label)}
    </a>
  );
}
export function MatchDetails({ match }: { match: Match }) {
  const { t } = useI18n();
  return (
    <>
      <div className="score-detail">
        <strong>
          {Math.round(match.score)}
          <small>/100</small>
        </strong>
        <div>
          <h3>{t('Why this route?')}</h3>
          <p>
            {t('A transparent suitability estimate, not a hiring probability.')}
          </p>
        </div>
      </div>
      <div className="component-bars">
        {[
          ['Current skills', match.coverage, '55%'],
          ['Your interests', match.interest, '15%'],
          ['Evidence signal', match.market, '15%'],
          ['Scenario suitability', match.resilience, '15%'],
        ].map(([label, value, weight]) => (
          <div key={label}>
            <span>
              {t(String(label))}
              <small>{t('weight {0}', { 0: weight })}</small>
            </span>
            <div className="bar">
              <i style={{ width: `${value}%` }} />
            </div>
            <b>{Math.round(Number(value))}</b>
          </div>
        ))}
      </div>
      <h3>{t('Your transferable skills')}</h3>
      <div className="chips">
        {match.reused.map((id) => (
          <SkillChip key={id} id={id} existing />
        ))}
      </div>
      <h3>{t('Skills to develop')}</h3>
      <div className="gap-list">
        {match.gaps.map((g) => (
          <div key={g.id}>
            <span>{t(skillById[g.id].label)}</span>
            <span>{t('Level {0} → {1}', { 0: g.current, 1: g.required })}</span>
          </div>
        ))}
      </div>
      <p className="notice">{t(match.role.entry)}</p>
      <p className="muted">
        {t(
          'Role requirements and exposure factors are simplified team assumptions informed by occupational tasks. O*NET describes US occupations; Malaysian entry requirements need local validation.',
        )}
      </p>
      <div className="source-links">
        <External href={match.role.source}>
          {t('Occupational source: O*NET')}
        </External>
        <External href={sdgUrl(match.role.target)}>
          {t('SDG target {0}', { 0: match.role.target })}
        </External>
      </div>
      <p className="muted">{t(match.role.rationale)}</p>
    </>
  );
}
export function Radar({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const ids: SkillId[] = [
    'excel',
    'data',
    'critical',
    'communication',
    'project',
    'stakeholder',
  ];
  // Limit visual coordinates to 0.001px so different JS engines hydrate identically.
  const point = (i: number, r: number) =>
    [
      140 + Math.sin((i * Math.PI) / 3) * r,
      125 - Math.cos((i * Math.PI) / 3) * r,
    ].map((coordinate) => Math.round(coordinate * 1000) / 1000);
  const poly = (r: number) =>
    ids.map((_, i) => point(i, r).join(',')).join(' ');
  return (
    <svg
      viewBox="0 0 280 260"
      className="radar"
      role="img"
      aria-label={t(
        'Current self-reported skill levels, on a scale of zero to three',
      )}
    >
      {[25, 50, 75].map((r) => (
        <polygon key={r} points={poly(r)} fill="none" className="radar-grid" />
      ))}
      {ids.map((id, i) => {
        const p = point(i, 75),
          label = point(i, 103);
        return (
          <g key={id}>
            <line
              x1={140}
              y1={125}
              x2={p[0]}
              y2={p[1]}
              className="radar-grid"
            />
            <text
              x={label[0]}
              y={label[1]}
              textAnchor="middle"
              fontSize="10"
              className="radar-label"
            >
              {t(skillById[id].label)}
            </text>
          </g>
        );
      })}
      <polygon
        points={ids
          .map((id, i) =>
            point(i, ((profile.skills[id] ?? 0) / 3) * 75).join(','),
          )
          .join(' ')}
        className="radar-shape"
        strokeWidth="2"
      />
      {ids.map((id, i) => {
        const p = point(i, ((profile.skills[id] ?? 0) / 3) * 75);
        return (
          <circle key={id} cx={p[0]} cy={p[1]} r={3} className="radar-point" />
        );
      })}
    </svg>
  );
}
export function downloadFile(
  name: string,
  body: string,
  type = 'application/json',
) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
