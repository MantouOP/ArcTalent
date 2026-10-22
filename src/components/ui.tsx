'use client';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, X, Check, Circle } from 'lucide-react';
import { skillById, sdgUrl } from '@/lib/catalogue';
import type { Match, Profile, SkillId } from '@/lib/types';
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
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
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
  const skill = skillById[id];
  return (
    <a
      className={`skill-chip ${existing ? 'existing' : ''}`}
      href={sdgUrl(skill.target)}
      target="_blank"
      rel="noreferrer"
      title={`SDG ${skill.target}: ${skill.rationale}`}
      aria-label={`${skill.label} — SDG target ${skill.target}. ${skill.rationale}`}
    >
      {existing ? <Check size={12} /> : <Circle size={9} />} {skill.label}
    </a>
  );
}
export function MatchDetails({ match }: { match: Match }) {
  return (
    <>
      <div className="score-detail">
        <strong>
          {Math.round(match.score)}
          <small>/100</small>
        </strong>
        <div>
          <h3>Why this route?</h3>
          <p>A transparent suitability estimate, not a hiring probability.</p>
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
              {label}
              <small>weight {weight}</small>
            </span>
            <div className="bar">
              <i style={{ width: `${value}%` }} />
            </div>
            <b>{Math.round(Number(value))}</b>
          </div>
        ))}
      </div>
      <h3>Your transferable skills</h3>
      <div className="chips">
        {match.reused.map((id) => (
          <SkillChip key={id} id={id} existing />
        ))}
      </div>
      <h3>Skills to develop</h3>
      <div className="gap-list">
        {match.gaps.map((g) => (
          <div key={g.id}>
            <span>{skillById[g.id].label}</span>
            <span>
              Level {g.current} → {g.required}
            </span>
          </div>
        ))}
      </div>
      <p className="notice">{match.role.entry}</p>
      <p className="muted">
        Role requirements and exposure factors are simplified team assumptions
        informed by occupational tasks. O*NET describes US occupations;
        Malaysian entry requirements need local validation.
      </p>
      <div className="source-links">
        <External href={match.role.source}>Occupational source: O*NET</External>
        <External href={sdgUrl(match.role.target)}>
          SDG target {match.role.target}
        </External>
      </div>
      <p className="muted">{match.role.rationale}</p>
    </>
  );
}
export function Radar({ profile }: { profile: Profile }) {
  const ids: SkillId[] = [
    'excel',
    'data',
    'critical',
    'communication',
    'project',
    'stakeholder',
  ];
  const point = (i: number, r: number) => [
    140 + Math.sin((i * Math.PI) / 3) * r,
    125 - Math.cos((i * Math.PI) / 3) * r,
  ];
  const poly = (r: number) =>
    ids.map((_, i) => point(i, r).join(',')).join(' ');
  return (
    <svg
      viewBox="0 0 280 260"
      className="radar"
      role="img"
      aria-label="Current self-reported skill levels, on a scale of zero to three"
    >
      {[25, 50, 75].map((r) => (
        <polygon key={r} points={poly(r)} fill="none" stroke="#e1e8e8" />
      ))}
      {ids.map((id, i) => {
        const p = point(i, 75),
          label = point(i, 103);
        return (
          <g key={id}>
            <line x1={140} y1={125} x2={p[0]} y2={p[1]} stroke="#e1e8e8" />
            <text
              x={label[0]}
              y={label[1]}
              textAnchor="middle"
              fontSize="10"
              fill="#677b85"
            >
              {skillById[id].label}
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
        fill="#23877626"
        stroke="#238776"
        strokeWidth="2"
      />
      {ids.map((id, i) => {
        const p = point(i, ((profile.skills[id] ?? 0) / 3) * 75);
        return <circle key={id} cx={p[0]} cy={p[1]} r={3} fill="#238776" />;
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
