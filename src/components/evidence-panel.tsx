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
import type { Profile, Role, Scenario, Snapshot } from '@/lib/types';
import { External, Tag } from './ui';
import { useI18n } from './language-provider';
import { CustomSnapshotForm } from './custom-snapshot-form';
export function EvidencePanel({
  profile,
  scenario,
  snapshot,
  previous,
  busy,
  onRefresh,
  onReplay,
  onBaseline,
  onApply,
  candidates = roles,
  showPersonalComparisons = true,
}: {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  previous: Snapshot | null;
  busy: boolean;
  onRefresh: () => void;
  onReplay: () => void;
  onBaseline: () => void;
  onApply: (snapshot: Snapshot) => void;
  candidates?: Role[];
  showPersonalComparisons?: boolean;
}) {
  const { t, locale } = useI18n();
  const dateLocale =
    locale === 'en' ? 'en-MY' : locale === 'ms' ? 'ms-MY' : 'zh-CN';
  const [all, setAll] = useState(false);
  const customNotice =
    'User-entered planning assumptions, not verified market evidence.';
  const changes =
    previous && showPersonalComparisons
      ? diffSnapshots(profile, scenario, previous, snapshot, candidates)
      : [];
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">{t('EVIDENCE LAB')}</span>
          <h2>{t('A recommendation should show its work.')}</h2>
          <p className="muted">
            {t(
              'Inspect the source, the assumption and the reason a pathway changed.',
            )}
          </p>
        </div>
      </div>
      <div className="two-columns evidence-actions">
        <section className="panel">
          <div className="course-icon">
            <Database />
          </div>
          <h2>{t('Refresh public evidence')}</h2>
          <p>
            {t(
              'Fetch a bounded sample of European job postings from Arbeitnow and recent AI research from arXiv.',
            )}
          </p>
          <button className="primary" disabled={busy} onClick={onRefresh}>
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            {t(busy ? 'Fetching sources…' : 'Refresh public sources')}
          </button>
          <small>{t('Five-minute cache · Sources may be unavailable')}</small>
        </section>
        <section className="panel warm">
          <div className="course-icon">
            <FlaskConical />
          </div>
          <h2>{t('See the replanning moment')}</h2>
          <p>
            {t(
              'Replay a dated synthetic shift in skill demand. The same engine recomputes the worker and team views.',
            )}
          </p>
          <div className="button-row">
            <button className="secondary" onClick={onReplay}>
              <Play size={15} />
              {t('Apply newer demo snapshot')}
            </button>
            <button className="text-button" onClick={onBaseline}>
              {t('Restore baseline')}
            </button>
          </div>
          <small>{t('Clearly simulated. No invented market event.')}</small>
        </section>
      </div>
      <CustomSnapshotForm snapshot={snapshot} onApply={onApply} />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t(snapshot.label)}</h2>
            <p>
              {t('Snapshot {0} · {1} MYT', {
                0: snapshot.id,
                1: new Date(snapshot.asOf).toLocaleString(dateLocale, {
                  timeZone: 'Asia/Kuala_Lumpur',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              })}
            </p>
          </div>
          <Tag tone={snapshot.kind === 'live' ? 'blue' : 'amber'}>
            {t(snapshot.kind === 'live' ? 'Public data' : 'Simulation')}
          </Tag>
        </div>
        <p className="notice">
          {snapshot.note.startsWith(customNotice) ? (
            <>
              {t(customNotice)}{' '}
              {snapshot.note.slice(customNotice.length).trim()}
            </>
          ) : (
            t(snapshot.note)
          )}
        </p>
        <div className="signal-metrics">
          <span>
            <strong>{snapshot.sampleSize}</strong>
            {t('job records')}
          </span>
          <span>
            <strong>
              {snapshot.signals.filter((s) => s.kind === 'research').length}
            </strong>
            {t('research records')}
          </span>
          <span>
            <strong>{MODEL_VERSION}</strong>
            {t('scoring model')}
          </span>
        </div>
        {snapshot.signals.slice(0, all ? 200 : 8).map((s) => (
          <article className="source-item" key={s.id}>
            <span className="source-type">
              {t(
                s.kind === 'research'
                  ? 'AI RESEARCH'
                  : s.kind === 'jobs'
                    ? 'JOB POSTING'
                    : 'DEMO FIXTURE',
              )}
            </span>
            <h3>
              {s.url ? <External href={s.url}>{s.title}</External> : s.title}
            </h3>
            <p>{t(s.geography)}</p>
            <small>
              {t('Published: {0} · Collected: {1}', {
                0: s.publishedAt
                  ? new Date(s.publishedAt).toLocaleDateString(dateLocale, {
                      timeZone: 'Asia/Kuala_Lumpur',
                    })
                  : t('Unknown'),
                1: new Date(s.collectedAt).toLocaleDateString(dateLocale, {
                  timeZone: 'Asia/Kuala_Lumpur',
                }),
              })}
            </small>
            <div className="chips">
              {s.skills.map((id) => (
                <span className="skill-chip" key={id}>
                  {t(skillById[id].label)}
                </span>
              ))}
            </div>
          </article>
        ))}
        {snapshot.signals.length > 8 && (
          <button className="text-button" onClick={() => setAll(!all)}>
            {all
              ? t('Show fewer')
              : t('Show all {0} records', { 0: snapshot.signals.length })}
          </button>
        )}
        <div className="source-links">
          <External href="https://www.arbeitnow.com/blog/job-board-api">
            {t('Arbeitnow API & attribution')}
          </External>
          <External href="https://info.arxiv.org/help/rss.html">
            {t('arXiv RSS documentation')}
          </External>
        </div>
      </section>
      {previous && showPersonalComparisons && (
        <section className="panel">
          <h2>{t('What changed, exactly?')}</h2>
          <p className="muted">
            {t(
              '{0} → {1}. Scores below use your current profile and scenario for both snapshots.',
              { 0: t(previous.label), 1: t(snapshot.label) },
            )}
          </p>
          {previous.kind !== snapshot.kind && (
            <p className="notice">
              {t(
                'The evidence mode changed. This comparison shows model sensitivity, not a measured market trend over time.',
              )}
            </p>
          )}
          <div className="change-list">
            {changes.map((c) => (
              <div key={c.id}>
                <span>
                  <strong>{c.custom ? c.title : t(c.title)}</strong>
                  <small>
                    {c.changedSkills.length
                      ? c.changedSkills
                          .map((id) => t(skillById[id].label))
                          .join(', ')
                      : t('No mapped signal changed')}
                  </small>
                </span>
                <span className="score-change">
                  {c.before.toFixed(2)}
                  <ArrowRight size={14} />
                  <b>{c.after.toFixed(2)}</b>
                </span>
                <span
                  className={`delta ${c.delta >= 0 ? 'positive' : 'negative'}`}
                >
                  {c.delta > 0 ? '+' : ''}
                  {c.delta.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="muted small">
            {t(
              'Only the evidence component changed. Existing skills, interests and scenario exposure assumptions remain fixed in this comparison.',
            )}
          </p>
        </section>
      )}
      <section className="panel">
        <h2>{t('Assumptions, in the open')}</h2>
        <p>
          {t(
            'Suitability = 55% skill coverage + 15% interest + 15% evidence + 15% scenario suitability.',
          )}
        </p>
        <div className="two-columns compact">
          <div>
            <h3>{t('Two possible futures')}</h3>
            <p className="muted">
              {t(
                'Moderate uses an illustrative adoption factor of 0.35; rapid uses 0.75. Scenario suitability = 1 − adoption factor × task exposure. Neither factor is an unemployment probability.',
              )}
            </p>
            <h3>{t('Evidence quality')}</h3>
            <p className="muted">
              {t(
                'Live evidence uses skill mentions in one sample, with a neutral market score below 30 valid postings. Research is shown for interpretation, not treated as proof of automation. Reliable growth estimates need comparable historical windows.',
              )}
            </p>
          </div>
          <div>
            <h3>{t('Role exposure assumptions')}</h3>
            <div className="gap-list">
              {roles.map((r) => (
                <div key={r.id}>
                  <External href={r.source}>{t(r.shortTitle)}</External>
                  <span>{r.exposure.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="muted small">
              {t(
                'Team-model parameters, not O*NET estimates. Role sources inform task context; they do not validate these values.',
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
