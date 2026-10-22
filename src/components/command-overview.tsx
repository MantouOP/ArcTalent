import { ArrowUpRight, CircleDot, Layers3 } from 'lucide-react';
import { useId } from 'react';
import type { LearningPlan, Match, Profile } from '@/lib/types';

/** Read-only presentation of the existing engine output. No ranking or state lives here. */
export function RouteSummary({
  active,
  matches,
  delta,
  onSelect,
  onExplain,
}: {
  active: Match;
  matches: Match[];
  delta?: number;
  onSelect: (id: string) => void;
  onExplain: () => void;
}) {
  return (
    <section
      className="panel route-summary"
      aria-label="Selected route overview"
    >
      <div className="widget-heading">
        <span>Selected route</span>
        <CircleDot size={16} />
      </div>
      <h2>{active.role.shortTitle}</h2>
      <div className="hero-metric">
        <strong>{Math.round(active.score)}</strong>
        <span>/ 100</span>
        <svg viewBox="0 0 64 64" aria-hidden="true" className="metric-ring">
          <circle cx="32" cy="32" r="26" />
          <circle
            cx="32"
            cy="32"
            r="26"
            pathLength="100"
            strokeDasharray={`${active.score} 100`}
          />
        </svg>
      </div>
      <p className="metric-caption">Overall route score</p>
      {delta !== undefined ? (
        <span
          className={`metric-delta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}`}
        >
          {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : ''}
          {delta.toFixed(1)} pts vs previous snapshot
        </span>
      ) : (
        <span className="metric-delta">
          Current snapshot · no prior comparison
        </span>
      )}
      <div className="summary-coverage">
        <span>Current skill coverage</span>
        <strong>{Math.round(active.coverage)}%</strong>
      </div>
      <div
        className="segmented-meter"
        role="meter"
        aria-label="Current skill coverage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={active.coverage}
      >
        <span style={{ width: `${active.coverage}%` }} />
      </div>
      <div className="summary-ranking">
        <div className="ranking-label">
          <span>Leading routes</span>
          <span>Score</span>
        </div>
        {matches.slice(0, 3).map((match, i) => (
          <button
            key={match.role.id}
            onClick={() => onSelect(match.role.id)}
            aria-pressed={active.role.id === match.role.id}
            className="ranking-row"
          >
            <i className={`data-dot series-${i}`} />
            <span>{match.role.shortTitle}</span>
            <strong>{Math.round(match.score)}</strong>
          </button>
        ))}
      </div>
      <button className="text-button summary-action" onClick={onExplain}>
        Understand this score <ArrowUpRight size={15} />
      </button>
      <p className="chart-note">
        A planning estimate, not a hiring probability.
      </p>
    </section>
  );
}

export function RouteAnalytics({
  matches,
  plan,
  profile,
}: {
  matches: Match[];
  plan: LearningPlan;
  profile: Profile;
}) {
  const fillId = useId();
  const weeks = Array.from({ length: Math.min(profile.weeks, 12) }, (_, i) => ({
    week: i + 1,
    hours: plan.weeks[i]?.hours ?? 0,
  }));
  const maxHours = Math.max(profile.hours, 1);
  const points = weeks.map((week, i) => ({
    x: 24 + i * (252 / Math.max(weeks.length - 1, 1)),
    y: 106 - (week.hours / maxHours) * 78,
  }));
  // Horizontal tangents keep each smooth segment within the two observed weekly values.
  const line = points
    .map((point, i) =>
      i === 0
        ? `M${point.x},${point.y}`
        : `C${(points[i - 1].x + point.x) / 2},${points[i - 1].y} ${(points[i - 1].x + point.x) / 2},${point.y} ${point.x},${point.y}`,
    )
    .join(' ');
  return (
    <div className="analytics-grid">
      <section className="panel comparison-widget">
        <div className="widget-heading">
          <h2>Skills & scenario fit</h2>
          <Layers3 size={16} />
        </div>
        <div className="chart-legend">
          <span>
            <i className="data-dot cyan" />
            Skill coverage
          </span>
          <span>
            <i className="data-dot violet" />
            Scenario suitability
          </span>
        </div>
        <div
          className="pill-chart"
          role="img"
          aria-label={matches
            .slice(0, 3)
            .map(
              (m) =>
                `${m.role.shortTitle}: ${Math.round(m.coverage)} percent skill coverage, ${Math.round(m.resilience)} percent scenario suitability`,
            )
            .join('; ')}
        >
          <div className="chart-scale">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          {matches.slice(0, 3).map((m) => (
            <div className="pill-series" key={m.role.id}>
              <div className="pill-bars">
                <i style={{ height: `${m.coverage}%` }} />
                <i style={{ height: `${m.resilience}%` }} />
              </div>
              <span>{m.role.shortTitle}</span>
            </div>
          ))}
        </div>
        <p className="chart-note">
          Modelled fit for the active scenario; 0–100 scale.
        </p>
      </section>
      <section className="panel pace-widget">
        <div className="widget-heading">
          <h2>Learning allocation</h2>
          <span>First {weeks.length} weeks</span>
        </div>
        <div className="widget-metric">
          <strong>
            {plan.totalHours}
            <small> h</small>
          </strong>
          <span>planned across {profile.weeks} weeks</span>
        </div>
        <svg
          viewBox="0 0 300 132"
          role="img"
          aria-label={`Planned weekly hours: ${weeks.map((w) => `week ${w.week}: ${w.hours} hours`).join(', ')}`}
          className="pace-chart"
        >
          <defs>
            <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity=".24" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="24" x2="276" y1="28" y2="28" className="chart-grid" />
          <line x1="24" x2="276" y1="106" y2="106" className="chart-grid" />
          <text x="0" y="31">
            {maxHours}h
          </text>
          <text x="0" y="109">
            0h
          </text>
          {points.length > 0 && (
            <>
              <path
                d={`${line} L${points[points.length - 1].x},106 L24,106 Z`}
                fill={`url(#${fillId})`}
              />
              <path d={line} className="pace-line" />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="2.5"
                  className="pace-point"
                >
                  <title>{`Week ${weeks[i].week}: ${weeks[i].hours} hours`}</title>
                </circle>
              ))}
            </>
          )}
          <text x="24" y="129">
            W1
          </text>
          <text x="276" y="129" textAnchor="end">
            W{weeks.length}
          </text>
        </svg>
        <p className="chart-note">
          Weekly capacity: {profile.hours} h · Proposed study, not completed
          activity.
        </p>
      </section>
      <section className="panel bubble-widget">
        <div className="widget-heading">
          <h2>Transferable strengths</h2>
          <span>Top 3 routes</span>
        </div>
        <div className="bubble-chart">
          {matches.slice(0, 3).map((m, i) => (
            <div key={m.role.id} className={`bubble-item series-${i}`}>
              <div className="bubble-space">
                <span
                  className={`skill-bubble ${m.reused.length === 0 ? 'empty-bubble' : ''}`}
                  style={{
                    width: `${Math.sqrt(m.reused.length) * 30}px`,
                    height: `${Math.sqrt(m.reused.length) * 30}px`,
                  }}
                >
                  <b>{m.reused.length}</b>
                </span>
              </div>
              <strong>{m.role.shortTitle}</strong>
            </div>
          ))}
        </div>
        <p className="chart-note">
          Existing skills reused by each route; skills may overlap.
        </p>
      </section>
    </div>
  );
}
