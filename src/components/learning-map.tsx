'use client';
import { ArrowRight, Check, GitBranch, Sparkles } from 'lucide-react';
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
  return (
    <div className="learning-map">
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
            LEARN ONCE. KEEP OPTIONS OPEN.
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
              style={{ '--route-color': m.role.color } as React.CSSProperties}
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
