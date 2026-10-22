'use client';
import { ArrowRight, Check, GitBranch, Sparkles } from 'lucide-react';
import { useId } from 'react';
import { skillById } from '@/lib/catalogue';
import type { Match, Profile, SkillId } from '@/lib/types';
export function LearningMap({
  matches,
  shared,
  profile,
  selected,
  onSelect,
}: {
  matches: Match[];
  shared: SkillId[];
  profile: Profile;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const orbId = useId();
  return (
    <div className="learning-map">
      <svg
        className="constellation-orb"
        viewBox="0 0 700 420"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${orbId}-light`} cx="62%" cy="32%" r="70%">
            <stop offset="0" stopColor="#3228c9" stopOpacity=".7" />
            <stop offset=".65" stopColor="#1a1263" stopOpacity=".5" />
            <stop offset="1" stopColor="#08091c" stopOpacity=".1" />
          </radialGradient>
          <linearGradient id={`${orbId}-edge`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#d552ff" />
            <stop offset=".5" stopColor="#4c42ed" />
            <stop offset="1" stopColor="#00f2fe" />
          </linearGradient>
          <pattern
            id={`${orbId}-dots`}
            width="12"
            height="10.4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.8" fill="#7565ea" opacity=".4" />
            <circle cx="9" cy="8.2" r="1.8" fill="#7565ea" opacity=".4" />
          </pattern>
          <clipPath id={`${orbId}-clip`}>
            <circle cx="355" cy="210" r="180" />
          </clipPath>
        </defs>
        <circle
          cx="355"
          cy="210"
          r="180"
          fill={`url(#${orbId}-light)`}
          stroke={`url(#${orbId}-edge)`}
          strokeWidth="1.5"
          className="orb-edge"
        />
        <circle cx="355" cy="210" r="177" fill={`url(#${orbId}-dots)`} />
        <g clipPath={`url(#${orbId}-clip)`} className="orb-mesh">
          {[60, 110, 160].map((r) => (
            <ellipse key={r} cx="355" cy="210" rx={r} ry="180" />
          ))}
          {[60, 110, 160].map((r) => (
            <ellipse key={r} cx="355" cy="210" rx="180" ry={r} />
          ))}
          <path d="M175 210H535M355 30V390M210 100L500 320M210 320L500 100" />
        </g>
        <ellipse
          cx="355"
          cy="210"
          rx="254"
          ry="100"
          transform="rotate(-26 355 210)"
          className="orb-orbit"
        />
        <circle cx="136" cy="306" r="4" fill="#00f2fe" />
        <circle cx="571" cy="111" r="4" fill="#c978ff" />
      </svg>
      <div className="map-legend">
        <span>
          <i className="legend-dot existing-dot" />
          Existing strengths
        </span>
        <span>
          <i className="legend-dot shared-dot" />
          Shared foundation
        </span>
        <span>
          <GitBranch size={13} />
          Career branches
        </span>
      </div>
      <div className="map-flow">
        <div className="map-start">
          <span className="map-avatar">{profile.name.slice(0, 1)}</span>
          <strong>You are here</strong>
          <small>
            {Object.values(profile.skills).filter((v) => v && v > 0).length}{' '}
            existing skills
          </small>
        </div>
        <div className="map-connector" aria-hidden="true">
          <span />
          <ArrowRight size={18} />
        </div>
        <div className="foundation">
          <span className="eyebrow">
            <Sparkles size={13} />
            SHARED ACROSS FUTURES
          </span>
          <h3>Your shared foundation</h3>
          {shared.length ? (
            shared.map((id) => (
              <div className="foundation-stop" key={id}>
                <span className="stop-node" />
                <span>{skillById[id].label}</span>
              </div>
            ))
          ) : (
            <p>
              No missing skill is common to every compared route. Explore each
              branch.
            </p>
          )}
          <small>Useful across the top routes in both scenarios.</small>
        </div>
        <div className="map-fork" aria-hidden="true">
          <svg viewBox="0 0 70 220" preserveAspectRatio="none">
            <path d="M0 110 H25 Q40 110 40 90 V40 Q40 25 60 25 H70" />
            <path d="M0 110 H70" />
            <path d="M0 110 H25 Q40 110 40 130 V180 Q40 195 60 195 H70" />
          </svg>
        </div>
        <div className="map-destinations">
          {matches.slice(0, 3).map((m, i) => (
            <button
              key={m.role.id}
              className={`destination ${selected === m.role.id ? 'chosen' : ''}`}
              onClick={() => onSelect(m.role.id)}
              aria-pressed={selected === m.role.id}
            >
              <span className="route-letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span>
                <strong>{m.role.shortTitle}</strong>
                <small>
                  {m.gaps.filter((g) => !shared.includes(g.id)).length}{' '}
                  branch-specific gaps
                </small>
              </span>
              <b className="destination-score">
                {Math.round(m.score)}
                <small>/100</small>
              </b>
              {selected === m.role.id ? (
                <Check size={15} />
              ) : (
                <ArrowRight size={15} />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="map-caption">
        <span className="tag green">The ArcTalent approach</span>
        <p>
          Start with skills that travel with you. Specialise when the next step
          is clearer.
        </p>
      </div>
    </div>
  );
}
