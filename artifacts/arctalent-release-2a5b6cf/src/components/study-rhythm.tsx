'use client';

import { ArrowRight } from 'lucide-react';
import { buildStudyRhythm, formatOptions } from '@/lib/learning-preferences';
import type { Profile } from '@/lib/types';

export function StudyRhythm({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  const preferences = profile.learningPreferences;
  const rhythm = preferences
    ? buildStudyRhythm(profile.hours, preferences.sessionMinutes)
    : null;
  return (
    <section className="panel study-rhythm">
      <h3>A rhythm for your week</h3>
      {rhythm && preferences ? (
        <>
          {rhythm.totalMinutes === 0 ? (
            <p className="rhythm-lead">No study time set yet.</p>
          ) : (
            <p className="rhythm-lead">
              Up to{' '}
              {rhythm.fullSessions > 0 && (
                <>
                  <strong>{rhythm.fullSessions}</strong> ×{' '}
                  {rhythm.fullSessionMinutes}-minute sessions
                </>
              )}
              {rhythm.remainderMinutes > 0 && (
                <>
                  {rhythm.fullSessions > 0 ? ', plus ' : ''}one{' '}
                  {rhythm.remainderMinutes}-minute session
                </>
              )}{' '}
              each week.
            </p>
          )}
          <p>
            {rhythm.totalMinutes
              ? `This divides your ${profile.hours}-hour weekly limit. Use only the hours scheduled in your course plan.`
              : 'Add weekly hours in your profile when you have time to begin.'}
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
          <p className="small">
            Your chosen practice style does not change course hours or skill
            scores.
          </p>
        </>
      ) : (
        <p>
          Choose a session length and a way to practise in the optional profile
          check.
        </p>
      )}
      <button className="text-button" onClick={onEdit}>
        {preferences ? 'Edit study preferences' : 'Find my study rhythm'}
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
