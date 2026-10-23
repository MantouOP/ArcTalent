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

export function PreferenceCheck({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const preferences = profile.learningPreferences;
  return (
    <section className="preference-banner" aria-labelledby="preference-title">
      <div className="preference-intro">
        <h2 id="preference-title">Make room for the way you learn.</h2>
        <p>
          Three questions to choose a work interest and a study rhythm that fits
          your week.
        </p>
        {preferences && (
          <p className="preference-summary">
            Check-in focus:{' '}
            {
              focusOptions.find((option) => option.value === preferences.focus)
                ?.interest
            }
            {' · '}
            {
              formatOptions.find(
                (option) => option.value === preferences.format,
              )?.label
            }
            {' · '}
            {preferences.sessionMinutes}-minute sessions
          </p>
        )}
        <p className="preference-footnote">
          Optional · about a minute. Answers are preferences, not an ability
          test. Save your profile below to update your pathways.
        </p>
      </div>
      <div className="preference-actions">
        <button className="secondary" onClick={() => setOpen(true)}>
          {preferences ? 'Review my answers' : 'Start the quick check'}
          <ArrowRight size={16} />
        </button>
        {preferences && (
          <button
            className="text-button"
            onClick={() =>
              onChange({ ...profile, learningPreferences: undefined })
            }
          >
            Clear study preferences
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
        : !!answers.sessionMinutes;
  const parsed = learningPreferencesSchema.safeParse(answers);
  return (
    <Modal title="Your learning preferences" onClose={onClose}>
      <div className="preference-check">
        <div
          className="check-progress"
          aria-label={
            step < 3 ? `Question ${step + 1} of 3` : 'Review your answers'
          }
        >
          {['Work interest', 'Practice', 'Session length'].map(
            (label, index) => (
              <span className={index <= step ? 'reached' : ''} key={label}>
                <b>{index < step ? <Check size={12} /> : index + 1}</b>
                {label}
              </span>
            ),
          )}
        </div>
        <h3 ref={heading} tabIndex={-1} id="check-question">
          {questions[step]}
        </h3>
        <p className="check-help">
          {step === 0
            ? 'Pick the one that appeals most today. You can select more interests in your profile afterwards.'
            : step === 1
              ? 'This changes your practice suggestion. It does not measure how quickly you learn.'
              : step === 2
                ? `Your weekly limit stays at ${profile.hours} hours. Shorter sessions divide that time into smaller blocks.`
                : 'Review what will change before applying these answers to your profile draft.'}
        </p>
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
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
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
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
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
                    <strong>{minutes} minutes</strong>
                    <small>
                      {minutes === 15
                        ? 'A small window in a busy day.'
                        : minutes === 30
                          ? 'A focused block with time to try something.'
                          : 'A longer block for deeper practice.'}
                    </small>
                  </span>
                </label>
              ))}
          </fieldset>
        ) : (
          <>
            <dl className="check-review">
              <div>
                <dt>Selected work interest</dt>
                <dd>
                  {
                    focusOptions.find(
                      (option) => option.value === answers.focus,
                    )?.interest
                  }
                </dd>
              </div>
              <div>
                <dt>Practice preference</dt>
                <dd>
                  {
                    formatOptions.find(
                      (option) => option.value === answers.format,
                    )?.label
                  }
                </dd>
              </div>
              <div>
                <dt>Session length</dt>
                <dd>{answers.sessionMinutes} minutes</dd>
              </div>
            </dl>
            <p className="check-explanation">
              Applying replaces your current interest selections with this
              focus. You can adjust them below before saving. Your skill levels,
              completed learning, weekly hours and budget stay the same.
            </p>
          </>
        )}
        <div className="check-controls">
          <button
            className="text-button"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
          >
            <ArrowLeft size={15} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button
              className="primary"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              {step === 2 ? 'Review answers' : 'Continue'}
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
              Apply to profile draft
              <Check size={15} />
            </button>
          )}
        </div>
        {step < 3 && !canContinue && (
          <p className="check-footnote">
            Choose one answer to continue, or cancel to keep your current
            profile.
          </p>
        )}
      </div>
    </Modal>
  );
}
