'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { applyLearningPreferences } from '@/lib/learning-preferences';
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
  const { t, focusOptions, formatOptions } = useLanguage();
  const [open, setOpen] = useState(false);
  const preferences = profile.learningPreferences;
  return (
    <section className="preference-banner" aria-labelledby="preference-title">
      <div className="preference-intro">
        <h2 id="preference-title">{t.prefCheck.bannerTitle}</h2>
        <p>{t.prefCheck.bannerDesc}</p>
        {preferences && (
          <p className="preference-summary">
            {t.prefCheck.checkInFocus}{' '}
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
            {t.prefCheck.minuteSessions(preferences.sessionMinutes)}
          </p>
        )}
        <p className="preference-footnote">{t.prefCheck.bannerFootnote}</p>
      </div>
      <div className="preference-actions">
        <button className="secondary" onClick={() => setOpen(true)}>
          {preferences
            ? t.prefCheck.reviewMyAnswers
            : t.prefCheck.startQuickCheck}
          <ArrowRight size={16} />
        </button>
        {preferences && (
          <button
            className="text-button"
            onClick={() =>
              onChange({ ...profile, learningPreferences: undefined })
            }
          >
            {t.prefCheck.clearPreferences}
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
  const { t, focusOptions, formatOptions } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<LearningPreferences>>(
    profile.learningPreferences ?? {},
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const questions = t.prefCheck.questions;
  const canContinue =
    step === 0
      ? !!answers.focus
      : step === 1
        ? !!answers.format
        : !!answers.sessionMinutes;
  const parsed = learningPreferencesSchema.safeParse(answers);
  return (
    <Modal title={t.prefCheck.modalTitle} onClose={onClose}>
      <div className="preference-check">
        <div
          className="check-progress"
          aria-label={
            step < 3
              ? t.prefCheck.questionProgress(step + 1)
              : t.prefCheck.reviewProgress
          }
        >
          {t.prefCheck.steps.map((label, index) => (
            <span className={index <= step ? 'reached' : ''} key={label}>
              <b>{index < step ? <Check size={12} /> : index + 1}</b>
              {label}
            </span>
          ))}
        </div>
        <h3 ref={heading} tabIndex={-1} id="check-question">
          {questions[step]}
        </h3>
        <p className="check-help">
          {step === 0
            ? t.prefCheck.help[0]
            : step === 1
              ? t.prefCheck.help[1]
              : step === 2
                ? t.prefCheck.help[2](profile.hours)
                : t.prefCheck.help[3]}
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
                    <strong>{t.prefCheck.minutesLabel(minutes)}</strong>
                    <small>{t.prefCheck.minutesDetail[minutes]}</small>
                  </span>
                </label>
              ))}
          </fieldset>
        ) : (
          <>
            <dl className="check-review">
              <div>
                <dt>{t.prefCheck.selectedWorkInterest}</dt>
                <dd>
                  {
                    focusOptions.find(
                      (option) => option.value === answers.focus,
                    )?.interest
                  }
                </dd>
              </div>
              <div>
                <dt>{t.prefCheck.practicePreference}</dt>
                <dd>
                  {
                    formatOptions.find(
                      (option) => option.value === answers.format,
                    )?.label
                  }
                </dd>
              </div>
              <div>
                <dt>{t.prefCheck.sessionLength}</dt>
                <dd>{t.prefCheck.minutesLabel(answers.sessionMinutes ?? 30)}</dd>
              </div>
            </dl>
            <p className="check-explanation">{t.prefCheck.applyExplanation}</p>
          </>
        )}
        <div className="check-controls">
          <button
            className="text-button"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
          >
            <ArrowLeft size={15} />
            {step === 0 ? t.prefCheck.cancel : t.prefCheck.back}
          </button>
          {step < 3 ? (
            <button
              className="primary"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              {step === 2
                ? t.prefCheck.reviewAnswersBtn
                : t.prefCheck.continueBtn}
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
              {t.prefCheck.applyToProfileDraft}
              <Check size={15} />
            </button>
          )}
        </div>
        {step < 3 && !canContinue && (
          <p className="check-footnote">{t.prefCheck.chooseOneFootnote}</p>
        )}
      </div>
    </Modal>
  );
}
