'use client';

import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { buildStudyRhythm } from '@/lib/learning-preferences';
import type { Profile } from '@/lib/types';

export function StudyRhythm({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  const { t, formatOptions } = useLanguage();
  const preferences = profile.learningPreferences;
  const rhythm = preferences
    ? buildStudyRhythm(profile.hours, preferences.sessionMinutes)
    : null;
  return (
    <section className="panel study-rhythm">
      <h3>{t.rhythm.title}</h3>
      {rhythm && preferences ? (
        <>
          {rhythm.totalMinutes === 0 ? (
            <p className="rhythm-lead">{t.rhythm.noStudyTime}</p>
          ) : (
            <p className="rhythm-lead">
              {t.rhythm.upTo}
              {rhythm.fullSessions > 0 && (
                <>
                  <strong>{rhythm.fullSessions}</strong> ×{' '}
                  {t.rhythm.sessionCount(
                    rhythm.fullSessions,
                    rhythm.fullSessionMinutes,
                  )}
                </>
              )}
              {rhythm.remainderMinutes > 0 && (
                <>
                  {t.rhythm.plusOneRemainder(
                    rhythm.fullSessions > 0,
                    rhythm.remainderMinutes,
                  )}
                </>
              )}
              {t.rhythm.eachWeek}
            </p>
          )}
          <p>
            {rhythm.totalMinutes
              ? t.rhythm.dividesWeeklyLimit(profile.hours)
              : t.rhythm.addWeeklyHoursPrompt}
          </p>
          <div className="rhythm-practice">
            <strong>
              {
                formatOptions.find(
                  (option) => option.value === preferences.format,
                )?.label
              }
            </strong>
            <p>
              {
                formatOptions.find(
                  (option) => option.value === preferences.format,
                )?.tip
              }
            </p>
          </div>
          <p className="small">{t.rhythm.practiceStyleFootnote}</p>
        </>
      ) : (
        <p>{t.rhythm.chooseSessionPrompt}</p>
      )}
      <button className="text-button" onClick={onEdit}>
        {preferences ? t.rhythm.editPreferences : t.rhythm.findStudyRhythm}
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
