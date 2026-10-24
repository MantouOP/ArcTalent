'use client';

import Link from 'next/link';
import { ArrowRight, GitBranch } from 'lucide-react';
import { LanguageSelector, useI18n } from './language-provider';
import './introduction.css';

export function Introduction() {
  const { t } = useI18n();
  return (
    <div className="intro-page">
      <a href="#welcome" className="skip-link">
        {t('Skip to content')}
      </a>
      <header className="intro-header">
        <a href="/" className="intro-brand" aria-label={t('ArcTalent home')}>
          <GitBranch size={27} aria-hidden="true" />
          ArcTalent
        </a>
        <nav aria-label={t('Main navigation')}>
          <a href="#how-it-works">{t('How it works')}</a>
          <LanguageSelector />
        </nav>
      </header>
      <main id="welcome">
        <section className="intro-sheet" aria-labelledby="intro-title">
          <div className="intro-copy">
            <p className="intro-opening">
              {t('Your skills have somewhere to go.')}
            </p>
            <h1 id="intro-title">
              <span>{t('A new direction.')}</span>
              <span>{t('Built on you.')}</span>
            </h1>
            <p className="intro-description">
              {t(
                'Find a practical learning path for a changing world of work. Start with what you know, explore what could come next, and learn at your own pace.',
              )}
            </p>
            <div className="intro-actions">
              <Link
                href="/workspace"
                prefetch={false}
                className="intro-primary"
              >
                {t('Explore my pathway')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/workspace/team"
                prefetch={false}
                className="intro-secondary"
              >
                {t('Plan for my team')}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <p className="intro-footnote">
              {t('Your time. Your budget. More than one possible future.')}
            </p>
          </div>
          <figure className="intro-route">
            <svg
              viewBox="0 0 500 380"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M60 185H180C220 185 218 65 270 65H430M180 185H430M180 185C220 185 218 305 270 305H430"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M60 185H180" stroke="var(--cyan)" strokeWidth="3" />
              {[
                [60, 185],
                [180, 185],
                [430, 65],
                [430, 185],
                [430, 305],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={i === 1 ? 12 : 7}
                    fill="var(--paper)"
                    stroke={i < 2 ? 'var(--cyan)' : 'currentColor'}
                    strokeWidth="2"
                  />
                  {i === 1 && <circle cx={x} cy={y} r="4" fill="var(--cyan)" />}
                </g>
              ))}
            </svg>
            <div className="intro-route-start">{t('What you know')}</div>
            <div className="intro-route-shared">
              <strong>{t('Shared foundation')}</strong>
              <span>{t('Learn first')}</span>
            </div>
            <div className="intro-route-stop stop-data">
              {t('Data & insights')}
            </div>
            <div className="intro-route-stop stop-people">
              {t('People & projects')}
            </div>
            <div className="intro-route-stop stop-operations">
              {t('Business operations')}
            </div>
            <figcaption>
              {t(
                'One starting point. Several ways forward. An illustrative route, not a recommendation.',
              )}
            </figcaption>
          </figure>
        </section>
        <section
          id="how-it-works"
          className="intro-how"
          aria-labelledby="intro-how-title"
        >
          <div className="intro-section-heading">
            <h2 id="intro-how-title">
              {t('A little clarity. A useful next step.')}
            </h2>
            <p>{t('You do not have to figure out your whole future today.')}</p>
          </div>
          <div className="intro-steps">
            {[
              [
                'Bring what you know',
                'Tell us about your skills, interests, learning time and budget. You can also explore with a fictional sample profile.',
              ],
              [
                'Explore different futures',
                'Compare moderate and rapid AI adoption. See which skills stay useful, and where your options branch.',
              ],
              [
                'Make the next step real',
                'Get an ordered starter plan with real courses and direct links. Review the gaps, then choose what works for you.',
              ],
            ].map(([title, description]) => (
              <article key={title}>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="intro-team" aria-labelledby="intro-team-title">
          <div>
            <h2 id="intro-team-title">
              {t('A next chapter for your team, too.')}
            </h2>
            <p>
              {t(
                'Connect individual ambitions to shared training. Explore skill gaps, custom destinations and internal opportunities together.',
              )}
            </p>
          </div>
          <Link
            href="/workspace/team"
            prefetch={false}
            className="intro-secondary"
          >
            {t('Open the SME workspace')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="intro-footer">
        <span>ArcTalent · {t('Skills that travel with you.')}</span>
        <span>
          {t('Hackathon prototype. Planning scenarios, not predictions.')}
        </span>
      </footer>
    </div>
  );
}
