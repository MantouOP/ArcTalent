'use client';

import { ArrowRight } from 'lucide-react';
import { buildStudyRhythm, formatOptions } from '@/lib/learning-preferences';
import type { Profile } from '@/lib/types';
import { useI18n } from './language-provider';

export function StudyRhythm({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  const { t, locale } = useI18n();
  const preferences = profile.learningPreferences;
  const rhythm = preferences
    ? buildStudyRhythm(profile.hours, preferences.sessionMinutes)
    : null;
  return (
    <section className="panel study-rhythm" lang={locale}>
      <h3>{t('A rhythm for your week')}</h3>
      {rhythm && preferences ? (
        <>
          {rhythm.totalMinutes === 0 ? (
            <p className="rhythm-lead">{t('No study time set yet.')}</p>
          ) : (
            <p className="rhythm-lead">
              {rhythm.fullSessions > 0
                ? rhythm.remainderMinutes > 0
                  ? t(
                      'Up to {0} × {1}-minute sessions, plus one {2}-minute session each week.',
                      {
                        0: rhythm.fullSessions,
                        1: rhythm.fullSessionMinutes,
                        2: rhythm.remainderMinutes,
                      },
                    )
                  : t('Up to {0} × {1}-minute sessions each week.', {
                      0: rhythm.fullSessions,
                      1: rhythm.fullSessionMinutes,
                    })
                : t('Up to one {0}-minute session each week.', {
                    0: rhythm.remainderMinutes,
                  })}
            </p>
          )}
          <p>
            {rhythm.totalMinutes
              ? t(
                  'This divides your {0}-hour weekly limit. Use only the hours scheduled in your course plan.',
                  { 0: profile.hours },
                )
              : t(
                  'Add weekly hours in your profile when you have time to begin.',
                )}
          </p>
          <div className="rhythm-practice">
            <strong>
              {t(
                formatOptions.find(
                  (option) => option.value === preferences.format,
                )?.label,
              )}
            </strong>
            <p>
              {t(
                formatOptions.find(
                  (option) => option.value === preferences.format,
                )?.tip,
              )}
            </p>
          </div>
          <p className="small">
            {t(
              'Your chosen practice style does not change course hours or skill scores.',
            )}
          </p>
        </>
      ) : (
        <p>
          {t(
            'Choose a session length and a way to practise in the optional profile check.',
          )}
        </p>
      )}
      <button className="text-button" onClick={onEdit}>
        {t(preferences ? 'Edit study preferences' : 'Find my study rhythm')}
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
