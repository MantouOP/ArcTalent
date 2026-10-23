'use client';
import { useState } from 'react';
import {
  RefreshCw,
  Play,
  Database,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import { roles } from '@/lib/catalogue';
import { diffSnapshots, MODEL_VERSION } from '@/lib/engine';
import { useLanguage } from '@/lib/i18n';
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
  const {
    t,
    dateLocale,
    skillLabel,
    roleText,
    snapshotText,
    signalText,
  } = useLanguage();
  const [all, setAll] = useState(false);
  const changes = previous
    ? diffSnapshots(profile, scenario, previous, snapshot)
    : [];
  const snapMeta = snapshotText(snapshot);
  const prevMeta = previous ? snapshotText(previous) : null;
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">{t.evidencePanel.eyebrow}</span>
          <h2>{t.evidencePanel.title}</h2>
          <p className="muted">{t.evidencePanel.subtitle}</p>
        </div>
      </div>
      <div className="two-columns evidence-actions">
        <section className="panel">
          <div className="course-icon">
            <Database />
          </div>
          <h2>{t.evidencePanel.refreshTitle}</h2>
          <p>{t.evidencePanel.refreshDesc}</p>
          <button className="primary" disabled={busy} onClick={onRefresh}>
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            {busy ? t.evidencePanel.fetchingSources : t.evidencePanel.refreshBtn}
          </button>
          <small>{t.evidencePanel.cacheNote}</small>
        </section>
        <section className="panel warm">
          <div className="course-icon">
            <FlaskConical />
          </div>
          <h2>{t.evidencePanel.replanningTitle}</h2>
          <p>{t.evidencePanel.replanningDesc}</p>
          <div className="button-row">
            <button className="secondary" onClick={onReplay}>
              <Play size={15} />
              {t.evidencePanel.applyNewerSnapshotBtn}
            </button>
            <button className="text-button" onClick={onBaseline}>
              {t.evidencePanel.restoreBaselineBtn}
            </button>
          </div>
          <small>{t.evidencePanel.simulatedNote}</small>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{snapMeta.label}</h2>
            <p>
              {t.evidencePanel.snapshotPrefix} {snapshot.id} ·{' '}
              {new Date(snapshot.asOf).toLocaleString(dateLocale, {
                timeZone: 'Asia/Kuala_Lumpur',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              MYT
            </p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {snapshot.kind === 'live'
              ? t.evidencePanel.publicDataTag
              : t.evidencePanel.simulationTag}
          </Tag>
        </div>
        <p className="notice">{snapMeta.note}</p>
        <div className="signal-metrics">
          <span>
            <strong>{snapshot.sampleSize}</strong>
            {t.evidencePanel.jobRecords}
          </span>
          <span>
            <strong>
              {snapshot.signals.filter((s) => s.kind === 'research').length}
            </strong>
            {t.evidencePanel.researchRecords}
          </span>
          <span>
            <strong>{MODEL_VERSION}</strong>
            {t.evidencePanel.scoringModel}
          </span>
        </div>
        {snapshot.signals.slice(0, all ? 200 : 8).map((s) => {
          const sig = signalText(s);
          return (
            <article className="source-item" key={s.id}>
              <span className="source-type">
                {s.kind === 'research'
                  ? t.evidencePanel.sourceTypes.research
                  : s.kind === 'jobs'
                    ? t.evidencePanel.sourceTypes.jobs
                    : t.evidencePanel.sourceTypes.simulation}
              </span>
              <h3>
                {s.url ? <External href={s.url}>{sig.title}</External> : sig.title}
              </h3>
              <p>{sig.geography}</p>
              <small>
                {t.evidencePanel.published}{' '}
                {s.publishedAt
                  ? new Date(s.publishedAt).toLocaleDateString(dateLocale, {
                      timeZone: 'Asia/Kuala_Lumpur',
                    })
                  : t.evidencePanel.unknown}{' '}
                · {t.evidencePanel.collected}{' '}
                {new Date(s.collectedAt).toLocaleDateString(dateLocale, {
                  timeZone: 'Asia/Kuala_Lumpur',
                })}
              </small>
              <div className="chips">
                {s.skills.map((id) => (
                  <span className="skill-chip" key={id}>
                    {skillLabel(id)}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
        {snapshot.signals.length > 8 && (
          <button className="text-button" onClick={() => setAll(!all)}>
            {all
              ? t.evidencePanel.showFewer
              : t.evidencePanel.showAllRecords(snapshot.signals.length)}
          </button>
        )}
        <div className="source-links">
          <External href="https://www.arbeitnow.com/blog/job-board-api">
            {t.evidencePanel.arbeitnowLink}
          </External>
          <External href="https://info.arxiv.org/help/rss.html">
            {t.evidencePanel.arxivLink}
          </External>
        </div>
      </section>
      {previous && prevMeta && (
        <section className="panel">
          <h2>{t.evidencePanel.whatChangedTitle}</h2>
          <p className="muted">
            {t.evidencePanel.whatChangedDesc(prevMeta.label, snapMeta.label)}
          </p>
          {previous.kind !== snapshot.kind && (
            <p className="notice">
              {t.evidencePanel.evidenceModeChangedNotice}
            </p>
          )}
          <div className="change-list">
            {changes.map((c) => {
              const r = roles.find((role) => role.id === c.id);
              return (
                <div key={c.id}>
                  <span>
                    <strong>{r ? roleText(r).title : c.title}</strong>
                    <small>
                      {c.changedSkills.length
                        ? c.changedSkills.map((id) => skillLabel(id)).join(', ')
                        : t.evidencePanel.noMappedSignalChanged}
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
              );
            })}
          </div>
          <p className="muted small">
            {t.evidencePanel.onlyEvidenceChangedNote}
          </p>
        </section>
      )}
      <section className="panel">
        <h2>{t.evidencePanel.assumptionsTitle}</h2>
        <p>{t.evidencePanel.suitabilityFormula}</p>
        <div className="two-columns compact">
          <div>
            <h3>{t.evidencePanel.twoPossibleFutures}</h3>
            <p className="muted">{t.evidencePanel.twoPossibleFuturesDesc}</p>
            <h3>{t.evidencePanel.evidenceQuality}</h3>
            <p className="muted">{t.evidencePanel.evidenceQualityDesc}</p>
          </div>
          <div>
            <h3>{t.evidencePanel.roleExposureAssumptions}</h3>
            <div className="gap-list">
              {roles.map((r) => (
                <div key={r.id}>
                  <External href={r.source}>{roleText(r).shortTitle}</External>
                  <span>{r.exposure.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="muted small">
              {t.evidencePanel.teamModelParamsNote}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
