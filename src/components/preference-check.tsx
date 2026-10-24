'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  applyLearningPreferences,
  focusOptions,
  formatOptions,
} from '@/lib/learning-preferences';
import { learningPreferencesSchema } from '@/lib/validation';
import type { LearningPreferences, Profile } from '@/lib/types';
import { Modal } from './ui';
import { useI18n } from './language-provider';

export function PreferenceCheck({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const preferences = profile.learningPreferences;
  return (
    <section
      className="preference-banner"
      aria-labelledby="preference-title"
      lang={locale}
    >
      <div className="preference-intro">
        <h2 id="preference-title">{t('Make room for the way you learn.')}</h2>
        <p>
          {t(
            'Three questions to choose a work interest and a study rhythm that fits your week.',
          )}
        </p>
        {preferences && (
          <p className="preference-summary">
            {t('Check-in focus: {0} · {1} · {2}-minute sessions', {
              0: t(
                focusOptions.find(
                  (option) => option.value === preferences.focus,
                )?.interest,
              ),
              1: t(
                formatOptions.find(
                  (option) => option.value === preferences.format,
                )?.label,
              ),
              2: preferences.sessionMinutes,
            })}
          </p>
        )}
        <p className="preference-footnote">
          {t(
            'Optional · about a minute. Answers are preferences, not an ability test. Save your profile below to update your pathways.',
          )}
        </p>
      </div>
      <div className="preference-actions">
        <button className="secondary" onClick={() => setOpen(true)}>
          {t(preferences ? 'Review my answers' : 'Start the quick check')}
          <ArrowRight size={16} />
        </button>
        {preferences && (
          <button
            className="text-button"
            onClick={() =>
              onChange({ ...profile, learningPreferences: undefined })
            }
          >
            {t('Clear study preferences')}
          </button>
        )}
      </div>
      {open && (
        <PreferenceDialog
          profile={profile}
          onClose={() => setOpen(false)}
          onApply={(answers) => {
            onChange(applyLearningPreferences(profile, answers));
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}

function PreferenceDialog({
  profile,
  onClose,
  onApply,
}: {
  profile: Profile;
  onClose: () => void;
  onApply: (answers: LearningPreferences) => void;
}) {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<LearningPreferences>>(
    profile.learningPreferences ?? {},
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const questions = [
    'Which problem would you enjoy working on?',
    'How would you like to practise?',
    'How long is a realistic study session?',
    'Your answers, your choice.',
  ];
  const canContinue =
    step === 0
      ? !!answers.focus
      : step === 1
        ? !!answers.format
        : learningPreferencesSchema.shape.sessionMinutes.safeParse(
            answers.sessionMinutes,
          ).success;
  const parsed = learningPreferencesSchema.safeParse(answers);
  return (
    <Modal title={t('Your learning preferences')} onClose={onClose}>
      <div className="preference-check" lang={locale}>
        <div
          className="check-progress"
          aria-label={
            step < 3
              ? t('Question {0} of 3', { 0: step + 1 })
              : t('Review your answers')
          }
        >
          {['Work interest', 'Practice', 'Session length'].map(
            (label, index) => (
              <span className={index <= step ? 'reached' : ''} key={label}>
                <b>{index < step ? <Check size={12} /> : index + 1}</b>
                {t(label)}
              </span>
            ),
          )}
        </div>
        <h3 ref={heading} tabIndex={-1} id="check-question">
          {t(questions[step])}
        </h3>
        <p className="check-help">
          {step === 0
            ? t(
                'Pick the one that appeals most today. You can select more interests in your profile afterwards.',
              )
            : step === 1
              ? t(
                  'This changes your practice suggestion. It does not measure how quickly you learn.',
                )
              : step === 2
                ? t(
                    'Your weekly limit stays at {0} hours. Shorter sessions divide that time into smaller blocks.',
                    { 0: profile.hours },
                  )
                : t(
                    'Review what will change before applying these answers to your profile draft.',
                  )}
        </p>
        {step === 0 && (
          <label className="custom-check-answer">
            {t('Your work goal')}
            <textarea
              rows={3}
              maxLength={600}
              value={answers.workAnswer ?? ''}
              placeholder={t('Describe a problem you would like to solve.')}
              onChange={(event) =>
                setAnswers({ ...answers, workAnswer: event.target.value })
              }
            />
            <small>
              {t(
                'Choose the closest work area below to connect your answer to the career catalogue.',
              )}
            </small>
          </label>
        )}
        {step === 1 && (
          <label className="custom-check-answer">
            {t('Your practice idea')}
            <textarea
              rows={3}
              maxLength={600}
              value={answers.practiceAnswer ?? ''}
              placeholder={t(
                'Describe how you want to practise or what you want to make.',
              )}
              onChange={(event) =>
                setAnswers({ ...answers, practiceAnswer: event.target.value })
              }
            />
            <small>
              {t(
                'Choose a practice style below. Your own words are kept in your plan.',
              )}
            </small>
          </label>
        )}
        {step === 2 && (
          <label className="custom-check-answer">
            {t('Session length (minutes)')}
            <input
              type="number"
              min={5}
              max={180}
              step={1}
              value={answers.sessionMinutes ?? ''}
              onChange={(event) =>
                setAnswers({
                  ...answers,
                  sessionMinutes: Number(event.target.value),
                })
              }
            />
            <small>{t('Enter 5–180 minutes, or choose a preset below.')}</small>
          </label>
        )}
        {step < 3 ? (
          <fieldset className="check-options" aria-labelledby="check-question">
            {step === 0 &&
              focusOptions.map((option) => (
                <label className="check-option" key={option.value}>
                  <input
                    type="radio"
                    name="work-focus"
                    value={option.value}
                    checked={answers.focus === option.value}
                    onChange={() =>
                      setAnswers({ ...answers, focus: option.value })
                    }
                  />
                  <span>
                    <strong>{t(option.label)}</strong>
                    <small>{t(option.detail)}</small>
                  </span>
                </label>
              ))}
            {step === 1 &&
              formatOptions.map((option) => (
                <label className="check-option" key={option.value}>
                  <input
                    type="radio"
                    name="study-format"
                    value={option.value}
                    checked={answers.format === option.value}
                    onChange={() =>
                      setAnswers({ ...answers, format: option.value })
                    }
                  />
                  <span>
                    <strong>{t(option.label)}</strong>
                    <small>{t(option.detail)}</small>
                  </span>
                </label>
              ))}
            {step === 2 &&
              ([15, 30, 60] as const).map((minutes) => (
                <label className="check-option" key={minutes}>
                  <input
                    type="radio"
                    name="session-length"
                    value={minutes}
                    checked={answers.sessionMinutes === minutes}
                    onChange={() =>
                      setAnswers({ ...answers, sessionMinutes: minutes })
                    }
                  />
                  <span>
                    <strong>{t('{0} minutes', { 0: minutes })}</strong>
                    <small>
                      {t(
                        minutes === 15
                          ? 'A small window in a busy day.'
                          : minutes === 30
                            ? 'A focused block with time to try something.'
                            : 'A longer block for deeper practice.',
                      )}
                    </small>
                  </span>
                </label>
              ))}
          </fieldset>
        ) : (
          <>
            <dl className="check-review">
              <div>
                <dt>{t('Selected work interest')}</dt>
                <dd>
                  {t(
                    focusOptions.find(
                      (option) => option.value === answers.focus,
                    )?.interest,
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('Practice preference')}</dt>
                <dd>
                  {t(
                    formatOptions.find(
                      (option) => option.value === answers.format,
                    )?.label,
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('Session length')}</dt>
                <dd>{t('{0} minutes', { 0: answers.sessionMinutes })}</dd>
              </div>
            </dl>
            {(answers.workAnswer || answers.practiceAnswer) && (
              <dl className="check-review">
                {answers.workAnswer && (
                  <div>
                    <dt>{t('Your work goal')}</dt>
                    <dd>{answers.workAnswer}</dd>
                  </div>
                )}
                {answers.practiceAnswer && (
                  <div>
                    <dt>{t('Your practice idea')}</dt>
                    <dd>{answers.practiceAnswer}</dd>
                  </div>
                )}
              </dl>
            )}
            <p className="check-explanation">
              {t(
                'Applying replaces your current interest selections with this focus. You can adjust them below before saving. Your skill levels, completed learning, weekly hours and budget stay the same.',
              )}
            </p>
          </>
        )}
        <div className="check-controls">
          <button
            className="text-button"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
          >
            <ArrowLeft size={15} />
            {t(step === 0 ? 'Cancel' : 'Back')}
          </button>
          {step < 3 ? (
            <button
              className="primary"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              {t(step === 2 ? 'Review answers' : 'Continue')}
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              className="primary"
              disabled={!parsed.success}
              onClick={() => {
                if (parsed.success) onApply(parsed.data);
              }}
            >
              {t('Apply to profile draft')}
              <Check size={15} />
            </button>
          )}
        </div>
        {step < 3 && !canContinue && (
          <p className="check-footnote">
            {t(
              'Choose one answer to continue, or cancel to keep your current profile.',
            )}
          </p>
        )}
      </div>
    </Modal>
  );
}
