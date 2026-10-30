'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, GitBranch, Play } from 'lucide-react';
import { baseline, skillById, updated } from '@/lib/catalogue';
import { diffSnapshots } from '@/lib/engine';
import { introductionDemo, introductionPeople } from '@/lib/introduction-demo';
import { IntroductionDemo } from './introduction-demo';
import { LanguageSelector, useI18n } from './language-provider';
import './introduction.css';

const example = introductionDemo('aina', 4, 'moderate', false);
const changes = diffSnapshots(
  example.profile,
  'moderate',
  baseline,
  updated,
).slice(0, 2);
const questions = [
  [
    'Is this a career test?',
    'ArcTalent is a skills and learning planner. It compares your current skills, interests and constraints with career requirements. It is not a validated personality or aptitude test, and a match score is not a chance of getting hired.',
  ],
  [
    'Can I choose my own career goal?',
    'Yes. Enter your own destination and describe the work you want to do. Review the suggested skills before adding them. The workspace shows when specialist skills or courses are outside the current catalogue.',
  ],
  [
    'Do I need an account or a CV?',
    'No account is required. You can enter your skills yourself, try a fictional profile, or import a text PDF or TXT CV with consent. Your workspace is saved in this browser. Optional AI analysis sends only the information described in its consent notice.',
  ],
  [
    'Are the courses real and free?',
    'The plan uses named courses with direct provider links, listed hours and fees. The current catalogue includes free learning resources. Certificates, software or other provider services may cost extra; check the course details before enrolling. HRD Corp claimability is shown only when verified.',
  ],
  [
    'What do the AI scenarios mean?',
    'Moderate and rapid adoption are planning assumptions, not predictions. They change how the model weighs task exposure. You can inspect the evidence, dates and scoring assumptions, and compare the resulting routes.',
  ],
  [
    'Will this demo change my saved plan?',
    'No. The homepage example uses disposable fictional profiles. Its controls do not save to your workspace or call an AI model. Open your workspace when you are ready to build or continue your own plan.',
  ],
];

export function Introduction() {
  const { t } = useI18n();
  return (
    <div className="intro-page">
      <a href="#welcome" className="skip-link">
        {t('Skip to content')}
      </a>
      <header className="intro-header intro-frame">
        <a href="/" className="intro-brand" aria-label={t('ArcTalent home')}>
          <GitBranch size={27} aria-hidden="true" />
          ArcTalent
        </a>
        <nav aria-label={t('Main navigation')}>
          <a href="#how-it-works">{t('How it works')}</a>
          <a href="#try-demo">{t('Try the demo')}</a>
          <a href="#for-teams">{t('For teams')}</a>
          <LanguageSelector />
          <Link href="/workspace" prefetch={false} className="intro-nav-action">
            {t('Open workspace')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>
      <main id="welcome">
        <section
          className="intro-hero intro-frame"
          aria-labelledby="intro-title"
        >
          <div className="intro-hero-copy">
            <h1 id="intro-title">
              {t('Your next career,')}
              <br />
              {t('made clearer.')}
            </h1>
            <p className="intro-lead">
              {t(
                'Start with your skills. Leave with a learning plan that fits your time, budget and a changing world of work.',
              )}
            </p>
            <div className="intro-actions">
              <Link
                href="/workspace"
                prefetch={false}
                className="intro-primary"
              >
                {t('Build my pathway')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#try-demo" className="intro-secondary">
                <Play size={16} aria-hidden="true" />
                {t('Try a live example')}
              </a>
            </div>
            <p className="intro-footnote">
              {t(
                'No account needed. Start with your own skills or a sample profile.',
              )}
            </p>
          </div>
          <figure
            className="intro-route-preview"
            data-ui
            aria-label={t(
              'An example route from existing skills to career options',
            )}
          >
            <div className="intro-preview-top">
              <span>ArcTalent / {t('Pathway preview')}</span>
              <span className="intro-demo-tag">{t('Fictional example')}</span>
            </div>
            <div className="intro-preview-person">
              <span className="intro-avatar" aria-hidden="true">
                A
              </span>
              <div>
                <strong>Aina</strong>
                <p>{t('Administrative assistant')}</p>
              </div>
              <span className="intro-preview-time">
                {t('{hours} h/week', { hours: 4 })}
                <br />
                RM 0
              </span>
            </div>
            <div className="intro-route-drawing">
              <svg
                viewBox="0 0 520 320"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M38 16V110Q38 138 70 138H210Q248 138 248 96V68Q248 42 285 42H490M248 138H490M248 138V211Q248 240 285 240H490"
                  stroke="#625984"
                  strokeWidth="2"
                />
                <path
                  className="intro-route-ink"
                  d="M38 16V110Q38 138 70 138H210"
                  stroke="#76dde6"
                  strokeWidth="3"
                />
                <circle cx="38" cy="16" r="5" fill="#76dde6" />
                <circle cx="210" cy="138" r="7" fill="#76dde6" />
                {[42, 138, 240].map((y) => (
                  <circle key={y} cx="490" cy={y} r="5" fill="#b5a6ed" />
                ))}
              </svg>
              <div className="intro-route-foundation">
                <span>{t('Learn first')}</span>
                <strong>{t('Shared foundation')}</strong>
                <p>
                  {example.shared
                    .map((id) => t(skillById[id].label))
                    .join(' + ')}
                </p>
              </div>
              <div className="intro-route-destinations">
                {example.ranking.slice(0, 3).map((match) => (
                  <div key={match.role.id}>
                    <span>{t('Then explore')}</span>
                    <strong>{t(match.role.shortTitle)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <figcaption>
              <Check size={15} aria-hidden="true" />
              {t('Build a foundation. Keep your options open.')}
            </figcaption>
          </figure>
        </section>

        <section
          className="intro-principles intro-frame"
          aria-label={t('What your plan includes')}
        >
          <p>
            <strong>{t('Start with what you know.')}</strong>
            <span>{t('Transfer your skills, not just your job title.')}</span>
          </p>
          <p>
            <strong>{t('Plan for more than one future.')}</strong>
            <span>{t('Compare two AI adoption scenarios.')}</span>
          </p>
          <p>
            <strong>{t('Know what to learn next.')}</strong>
            <span>{t('Real courses. Direct links. Your pace.')}</span>
          </p>
        </section>

        <section
          id="try-demo"
          className="intro-demo-section intro-frame"
          aria-labelledby="intro-demo-title"
        >
          <div className="intro-section-heading">
            <h2 id="intro-demo-title">{t('Try a pathway.')}</h2>
            <p>
              {t(
                'Meet Aina, Daniel and Mei. Change their learning time or the scenario and watch the plan respond.',
              )}
            </p>
          </div>
          <IntroductionDemo />
        </section>

        <section
          id="how-it-works"
          className="intro-how intro-frame"
          aria-labelledby="intro-how-title"
        >
          <div className="intro-how-heading">
            <h2 id="intro-how-title">{t('Start with you.')}</h2>
            <p>
              {t(
                'You do not have to figure out your whole future today. You need a useful next step.',
              )}
            </p>
            <Link
              href="/workspace"
              prefetch={false}
              className="intro-secondary"
            >
              {t('Create my learning plan')}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <ol className="intro-process">
            {[
              [
                'Bring your experience',
                'Add your skills, interests and a career goal in your own words. Set a weekly time limit and budget. You can also import a CV, then review the detected skills.',
              ],
              [
                'Explore possible directions',
                'Compare career options under moderate and rapid AI adoption. See what you can reuse, what is missing and which foundational skills serve both scenarios.',
              ],
              [
                'Turn the route into a routine',
                'Follow an ordered course plan with provider links and weekly time estimates. Mark your progress, ask the career guide a question or export your plan as a PDF.',
              ],
            ].map(([title, body]) => (
              <li key={title}>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="intro-evidence intro-frame"
          aria-labelledby="intro-evidence-title"
        >
          <div className="intro-evidence-fragment" data-ui>
            <div className="intro-fragment-heading">
              <GitBranch size={20} aria-hidden="true" />
              <strong>
                {t('A route can change. The reason should be clear.')}
              </strong>
            </div>
            <p className="intro-small">
              {t('Simulated evidence')} · 19 → 22 {t('Oct 2026')}
            </p>
            {changes.map((change) => (
              <div className="intro-change-row" key={change.id}>
                <div>
                  <strong>{t(change.title)}</strong>
                  <span>{t('Model score / 100')}</span>
                </div>
                <span>
                  {change.before.toFixed(1)}
                  <ArrowRight size={14} aria-hidden="true" />
                  <b>{change.after.toFixed(1)}</b>
                </span>
              </div>
            ))}
            <p className="intro-change-reason">
              {t(
                'Why: the newer fictional snapshot gives more weight to stakeholder work and operational change.',
              )}
            </p>
          </div>
          <div className="intro-section-copy">
            <h2 id="intro-evidence-title">{t('See what changed.')}</h2>
            <p>
              {t(
                'A static course list cannot explain a changing world. ArcTalent lets you inspect dated signals and see how a new snapshot affects your options and learning steps.',
              )}
            </p>
            <p>
              {t(
                'Scores are planning aids, not hiring probabilities. Sources, assumptions and remaining gaps stay visible so you can decide what makes sense.',
              )}
            </p>
            <a href="#try-demo" className="intro-secondary">
              {t('Try the newer snapshot')}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section
          id="for-teams"
          className="intro-team intro-frame"
          aria-labelledby="intro-team-title"
        >
          <div className="intro-section-copy">
            <h2 id="intro-team-title">{t('Grow your people.')}</h2>
            <p>
              {t(
                'Help a small team see a future inside your business. Compare skills, explore internal moves and bring individual learning needs into one shared training plan.',
              )}
            </p>
            <p>
              {t(
                'Add up to ten people, enter custom destinations, review the skills heatmap and export a workforce plan. These are development conversations, with people making the decisions.',
              )}
            </p>
            <Link
              href="/workspace/team"
              prefetch={false}
              className="intro-secondary"
            >
              {t('Plan for my team')}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="intro-team-fragment" data-ui>
            <div className="intro-fragment-heading">
              <strong>
                {t('Different starting points. Shared possibilities.')}
              </strong>
            </div>
            <p className="intro-small">
              {t('Fictional team preview')} · {t('Moderate adoption')}
            </p>
            <div className="intro-team-rows">
              {introductionPeople.map((person) => {
                const demo = introductionDemo(
                  person.id,
                  person.hours,
                  'moderate',
                  false,
                );
                return (
                  <div key={person.id}>
                    <span className="intro-avatar" aria-hidden="true">
                      {person.name[0]}
                    </span>
                    <div>
                      <strong>{person.name}</strong>
                      <span>{t(person.currentRole)}</span>
                    </div>
                    <ArrowRight size={16} aria-hidden="true" />
                    <strong>{t(demo.ranking[0].role.shortTitle)}</strong>
                  </div>
                );
              })}
            </div>
            <p className="intro-team-note">
              <Check size={16} aria-hidden="true" />
              {t('Explore skill gaps before choosing training.')}
            </p>
          </div>
        </section>

        <section
          className="intro-faq intro-frame"
          aria-labelledby="intro-faq-title"
        >
          <div>
            <h2 id="intro-faq-title">{t('Before you begin.')}</h2>
            <p>
              {t(
                'A few things worth knowing about your plan, your data and the demo.',
              )}
            </p>
          </div>
          <div className="intro-questions">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {t(question)}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </section>
        <section
          className="intro-closing intro-frame"
          aria-labelledby="intro-closing-title"
        >
          <h2 id="intro-closing-title">{t('Your next step starts here.')}</h2>
          <div>
            <p>
              {t('Bring the skills you have. Explore the possibilities ahead.')}
            </p>
            <Link href="/workspace" prefetch={false} className="intro-primary">
              {t('Build my pathway')}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="intro-footer intro-frame">
        <a className="intro-brand" href="/">
          ArcTalent
        </a>
        <span>{t('Skills that travel with you.')}</span>
        <span>
          {t('Hackathon prototype. Planning scenarios, not predictions.')}
        </span>
      </footer>
    </div>
  );
}
