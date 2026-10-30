'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  GitBranch,
} from 'lucide-react';
import { skillById } from '@/lib/catalogue';
import { introductionDemo, introductionPeople } from '@/lib/introduction-demo';
import type { Scenario } from '@/lib/types';
import { useI18n } from './language-provider';

export function IntroductionDemo() {
  const { t } = useI18n();
  const [personId, setPersonId] = useState('aina');
  const [hours, setHours] = useState(4);
  const [scenario, setScenario] = useState<Scenario>('moderate');
  const [newer, setNewer] = useState(false);
  const { profile, ranking, plan, shared, snapshot } = introductionDemo(
    personId,
    hours,
    scenario,
    newer,
  );
  return (
    <div className="intro-demo" data-ui>
      <div className="intro-demo-controls">
        <label>
          {t('Fictional profile')}
          <select
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            {introductionPeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} · {t(person.currentRole)}
              </option>
            ))}
          </select>
        </label>
        <label className="intro-hours" htmlFor="intro-hours">
          <span>
            {t('Learning time')}
            <output htmlFor="intro-hours">
              {t('{hours} h/week', { hours })}
            </output>
          </span>
          <input
            id="intro-hours"
            aria-label={t('Learning time')}
            aria-valuetext={t('{hours} h/week', { hours })}
            type="range"
            min="2"
            max="8"
            step="2"
            value={hours}
            onChange={(event) => setHours(Number(event.target.value))}
          />
          <span className="intro-range-ends">
            <span>{t('2 hours')}</span>
            <span>{t('8 hours')}</span>
          </span>
        </label>
        <fieldset className="intro-scenario">
          <legend>{t('AI adoption scenario')}</legend>
          <div>
            {(['moderate', 'rapid'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={scenario === value}
                onClick={() => setScenario(value)}
              >
                {t(value === 'moderate' ? 'Moderate' : 'Rapid')}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="intro-snapshot">
          <input
            type="checkbox"
            checked={newer}
            onChange={(event) => setNewer(event.target.checked)}
          />
          <span>
            {t('Use newer demo snapshot')}
            <small>22 {t('Oct 2026')}</small>
          </span>
        </label>
        <p className="intro-small">
          {t(
            'Example only. Your saved workspace stays unchanged. No AI call is made.',
          )}
        </p>
      </div>
      <div className="intro-demo-results">
        <div className="intro-demo-meta">
          <span className="intro-demo-tag">
            {t('Simulated evidence')} · {snapshot.asOf.slice(0, 10)}
          </span>
          <span>
            {t('{weeks} weeks · RM {budget} course budget', {
              weeks: profile.weeks,
              budget: profile.budget,
            })}
          </span>
        </div>
        <div className="intro-demo-summary" role="status">
          {t(
            'Top direction: {role}. {courses} courses, {hours} planned hours.',
            {
              role: t(ranking[0].role.shortTitle),
              courses: plan.steps.length,
              hours: plan.totalHours,
            },
          )}
        </div>
        <div className="intro-demo-comparison">
          <div>
            <h3>{t('Possible directions')}</h3>
            <p className="intro-small">
              {t('Model scores, not hiring probabilities.')}
            </p>
            <ol className="intro-demo-ranks">
              {ranking.slice(0, 3).map((match, index) => (
                <li key={match.role.id}>
                  <div>
                    <strong>{t(match.role.shortTitle)}</strong>
                    <span className="intro-score-track" aria-hidden="true">
                      <span style={{ width: match.score + '%' }} />
                    </span>
                  </div>
                  <span className={index === 0 ? 'intro-score-leading' : ''}>
                    {match.score.toFixed(1)}
                    <small>/100</small>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="intro-demo-foundation">
            <GitBranch size={32} aria-hidden="true" />
            <h3>{t('Shared foundation')}</h3>
            <p>{t('Useful first skills across both scenarios.')}</p>
            <div className="intro-skill-chips">
              {shared.length ? (
                shared.map((id) => (
                  <span key={id}>
                    <Check size={13} aria-hidden="true" />
                    {t(skillById[id].label)}
                  </span>
                ))
              ) : (
                <p>
                  {t(
                    'No common missing skill across the top routes for this profile.',
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="intro-demo-course-heading">
          <h3>{t('Your sample learning plan')}</h3>
          <span>
            <Clock3 size={14} aria-hidden="true" />
            {t('{hours} planned hours', { hours: plan.totalHours })} · RM{' '}
            {plan.totalCost}
          </span>
        </div>
        <ol className="intro-demo-courses">
          {plan.steps.map((step) => (
            <li key={step.course.id}>
              <div className="intro-course-week">
                {t('Week {start}–{end}', {
                  start: step.startWeek,
                  end: step.endWeek,
                })}
              </div>
              <div>
                <a
                  href={step.course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(step.course.title)}
                  <ArrowUpRight size={15} aria-hidden="true" />
                  <span className="sr-only">{t('Opens in a new tab')}</span>
                </a>
                <p>
                  {step.course.provider} ·{' '}
                  {t('{hours} h', { hours: step.course.hours })}
                  {step.course.durationKind === 'planning estimate'
                    ? ' · ' + t('Planning estimate')
                    : ''}
                </p>
              </div>
              {step.shared && (
                <span className="intro-course-shared">
                  {t('Shared foundation')}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="intro-demo-limit">
          {plan.uncovered.length
            ? t(
                'Remaining mapped skill gaps: {skills}. This is a partial route, not full career readiness.',
                {
                  skills: plan.uncovered
                    .map((id) => t(skillById[id].label))
                    .join(', '),
                },
              )
            : t(
                'The scheduled courses address the mapped gaps. Practice, experience and employer requirements still matter.',
              )}
        </p>
        <a href="/workspace" className="intro-secondary">
          {t('Build a plan with my own answers')}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
