'use client';
import { useState } from 'react';
import {
  RefreshCw,
  Play,
  Database,
  ArrowRight,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';
import { skillById, roles } from '@/lib/catalogue';
import { diffSnapshots, MODEL_VERSION } from '@/lib/engine';
import type { Profile, Scenario, Snapshot } from '@/lib/types';
import { External, Tag } from './ui';
export function EvidencePanel({
  profile,
  scenario,
  snapshot,
  previous,
  busy,
  onRefresh,
  onReplay,
  onBaseline,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  previous: Snapshot | null;
  busy: boolean;
  onRefresh: () => void;
  onReplay: () => void;
  onBaseline: () => void;
}) {
  const [all, setAll] = useState(false);
  const changes = previous
    ? diffSnapshots(profile, scenario, previous, snapshot)
    : [];
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">EVIDENCE LAB</span>
          <h2>A recommendation should show its work.</h2>
          <p className="muted">
            Inspect the source, the assumption and the reason a pathway changed.
          </p>
        </div>
      </div>
      <div className="two-columns evidence-actions">
        <section className="panel">
          <div className="course-icon">
            <Database />
          </div>
          <h2>Refresh public evidence</h2>
          <p>
            Fetch a bounded sample of European job postings from Arbeitnow and
            recent AI research from arXiv.
          </p>
          <button className="primary" disabled={busy} onClick={onRefresh}>
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            {busy ? 'Fetching sources…' : 'Refresh public sources'}
          </button>
          <small>Five-minute cache · Sources may be unavailable</small>
        </section>
        <section className="panel warm">
          <div className="course-icon">
            <FlaskConical />
          </div>
          <h2>See the replanning moment</h2>
          <p>
            Replay a dated synthetic shift in skill demand. The same engine
            recomputes the worker and team views.
          </p>
          <div className="button-row">
            <button className="secondary" onClick={onReplay}>
              <Play size={15} />
              Apply newer demo snapshot
            </button>
            <button className="text-button" onClick={onBaseline}>
              Restore baseline
            </button>
          </div>
          <small>Clearly simulated. No invented market event.</small>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{snapshot.label}</h2>
            <p>
              Snapshot {snapshot.id} ·{' '}
              {new Date(snapshot.asOf).toLocaleString('en-MY', {
                timeZone: 'Asia/Kuala_Lumpur',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              MYT
            </p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {snapshot.kind === 'live' ? 'Public data' : 'Simulation'}
          </Tag>
        </div>
        <p className="notice">{snapshot.note}</p>
        <div className="signal-metrics">
          <span>
            <strong>{snapshot.sampleSize}</strong>job records
          </span>
          <span>
            <strong>
              {snapshot.signals.filter((s) => s.kind === 'research').length}
            </strong>
            research records
          </span>
          <span>
            <strong>{MODEL_VERSION}</strong>scoring model
          </span>
        </div>
        {snapshot.signals.slice(0, all ? 200 : 8).map((s) => (
          <article className="source-item" key={s.id}>
            <span className="source-type">
              {s.kind === 'research'
                ? 'AI RESEARCH'
                : s.kind === 'jobs'
                  ? 'JOB POSTING'
                  : 'DEMO FIXTURE'}
            </span>
            <h3>
              {s.url ? <External href={s.url}>{s.title}</External> : s.title}
            </h3>
            <p>{s.geography}</p>
            <small>
              Published:{' '}
              {s.publishedAt
                ? new Date(s.publishedAt).toLocaleDateString('en-MY', {
                    timeZone: 'Asia/Kuala_Lumpur',
                  })
                : 'Unknown'}{' '}
              · Collected:{' '}
              {new Date(s.collectedAt).toLocaleDateString('en-MY', {
                timeZone: 'Asia/Kuala_Lumpur',
              })}
            </small>
            <div className="chips">
              {s.skills.map((id) => (
                <span className="skill-chip" key={id}>
                  {skillById[id].label}
                </span>
              ))}
            </div>
          </article>
        ))}
        {snapshot.signals.length > 8 && (
          <button className="text-button" onClick={() => setAll(!all)}>
            {all ? 'Show fewer' : `Show all ${snapshot.signals.length} records`}
          </button>
        )}
        <div className="source-links">
          <External href="https://www.arbeitnow.com/blog/job-board-api">
            Arbeitnow API & attribution
          </External>
          <External href="https://info.arxiv.org/help/rss.html">
            arXiv RSS documentation
          </External>
        </div>
      </section>
      {previous && (
        <section className="panel">
          <h2>What changed, exactly?</h2>
          <p className="muted">
            {previous.label} → {snapshot.label}. Scores below use your current
            profile and scenario for both snapshots.
          </p>
          {previous.kind !== snapshot.kind && (
            <p className="notice">
              The evidence mode changed. This comparison shows model
              sensitivity, not a measured market trend over time.
            </p>
          )}
          <div className="change-list">
            {changes.map((c) => (
              <div key={c.id}>
                <span>
                  <strong>{c.title}</strong>
                  <small>
                    {c.changedSkills.length
                      ? c.changedSkills
                          .map((id) => skillById[id].label)
                          .join(', ')
                      : 'No mapped signal changed'}
                  </small>
                </span>
                <span className="score-change">
                  {c.before.toFixed(1)}
                  <ArrowRight size={14} />
                  <b>{c.after.toFixed(1)}</b>
                </span>
                <span
                  className={`delta ${c.delta >= 0 ? 'positive' : 'negative'}`}
                >
                  {c.delta > 0 ? '+' : ''}
                  {c.delta.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <p className="muted small">
            Only the evidence component changed. Existing skills, interests and
            scenario exposure assumptions remain fixed in this comparison.
          </p>
        </section>
      )}
      <section className="panel">
        <h2>Assumptions, in the open</h2>
        <p>
          Suitability = 55% skill coverage + 15% interest + 15% evidence + 15%
          scenario suitability.
        </p>
        <div className="two-columns compact">
          <div>
            <h3>Two possible futures</h3>
            <p className="muted">
              Moderate uses an illustrative adoption factor of 0.35; rapid uses
              0.75. Scenario suitability = 1 − adoption factor × task exposure.
              Neither factor is an unemployment probability.
            </p>
            <h3>Evidence quality</h3>
            <p className="muted">
              Live evidence uses skill mentions in one sample, with a neutral
              market score below 30 valid postings. Research is shown for
              interpretation, not treated as proof of automation. Reliable
              growth estimates need comparable historical windows.
            </p>
          </div>
          <div>
            <h3>Role exposure assumptions</h3>
            <div className="gap-list">
              {roles.map((r) => (
                <div key={r.id}>
                  <External href={r.source}>{r.shortTitle}</External>
                  <span>{r.exposure.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="muted small">
              Team-model parameters, not O*NET estimates. Role sources inform
              task context; they do not validate these values.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
