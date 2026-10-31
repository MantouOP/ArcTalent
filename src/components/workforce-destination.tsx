'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { roles } from '@/lib/catalogue';
import {
  applyWorkforceGoal,
  clearWorkforceGoal,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
import type { CareerGoal, Profile, Role, Snapshot } from '@/lib/types';
import { splitSpecialistSkills } from '@/lib/custom-skills';
import { CareerGoalPanel } from './career-goal-panel';
import { Modal } from './ui';
import { useI18n } from './language-provider';
import './workforce-destination.css';

export function WorkforceDestination({
  profile,
  role,
  snapshot,
  workforce,
  onChange,
}: {
  profile: Profile;
  role: Role;
  snapshot: Snapshot;
  workforce: WorkforceSettings;
  onChange: (settings: WorkforceSettings) => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const saved = workforce.customDestinations?.[profile.id];
  const displayTitle = role.custom ? role.title : t(role.title);
  const [value, setValue] = useState(displayTitle);
  const [review, setReview] = useState<{
    title: string;
    goal: CareerGoal | null;
    openings: number;
  } | null>(null);
  const previousTitle = useRef(displayTitle);
  useEffect(() => {
    const previous = previousTitle.current;
    previousTitle.current = displayTitle;
    setValue((current) => (current === previous ? displayTitle : current));
  }, [displayTitle]);
  const known = roles.find((option) =>
    [option.title, t(option.title)].some(
      (title) => title.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
    ),
  );
  return (
    <>
      <div className="workforce-destination">
        <form
          className="workforce-destination-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (known) {
              onChange({
                ...workforce,
                destinations: {
                  ...workforce.destinations,
                  [profile.id]: known.id,
                },
              });
              setValue(t(known.title));
            } else {
              const existing =
                saved?.goal.title === value.trim() ? saved : undefined;
              setReview({
                title: value.trim(),
                goal: existing?.goal ?? null,
                openings: saved?.openings ?? 1,
              });
            }
          }}
        >
          <div className="workforce-destination-row">
            <input
              className="workforce-destination-input"
              aria-label={t('Destination for {0}', { 0: profile.name })}
              list={id}
              value={value}
              minLength={2}
              maxLength={100}
              required
              onChange={(event) => setValue(event.target.value)}
            />
            <button
              type="submit"
              className="text-button workforce-destination-submit"
              aria-label={t(
                known ? 'Use preset for {0}' : 'Review goal for {0}',
                {
                  0: profile.name,
                },
              )}
            >
              {t(known ? 'Use preset' : 'Review goal')}
            </button>
          </div>
          <datalist id={id}>
            {roles.map((option) => (
              <option value={t(option.title)} key={option.id} />
            ))}
            {saved &&
              !roles.some(
                (option) =>
                  option.title === saved.goal.title ||
                  t(option.title) === saved.goal.title,
              ) && <option value={saved.goal.title} />}
          </datalist>
          {known && role.custom && saved && (
            <button
              type="button"
              className="text-button workforce-destination-edit"
              onClick={() =>
                setReview({
                  title: saved.goal.title,
                  goal: saved.goal,
                  openings: saved.openings,
                })
              }
            >
              {t('Edit applied goal')}
            </button>
          )}
        </form>
        <small className="workforce-destination-hint">
          {t('Type any career, or choose a suggestion.')}
        </small>
        {value.trim() !== displayTitle && (
          <small className="workforce-destination-pending" role="status">
            {t('Not applied yet. Review or use a preset to update the plan.')}
          </small>
        )}
        {role.custom &&
          saved &&
          (() => {
            const { covered, remaining } = splitSpecialistSkills(
              saved.goal.otherSkills,
              profile.customSkills,
            );
            return (
              <>
                {remaining.length > 0 && (
                  <small className="workforce-destination-badge">
                    {t('{0} additional specialist skills to review', {
                      0: remaining.length,
                    })}
                  </small>
                )}
                {covered.length > 0 && (
                  <small className="workforce-destination-hint">
                    {t('Already listed: {0}', { 0: covered.join(', ') })}
                  </small>
                )}
              </>
            );
          })()}
      </div>
      {review && (
        <Modal
          title={t('Destination for {0}', { 0: profile.name })}
          onClose={() => setReview(null)}
        >
          <div className="workforce-goal-dialog">
            <div className="workforce-dialog-banner">
              <div className="workforce-worker-badge">
                <span className="workforce-worker-initial" aria-hidden="true">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{profile.name}</strong>
                  <small>
                    {t(profile.currentRole)} · {profile.hours}h/wk · RM{' '}
                    {profile.budget}
                  </small>
                </div>
              </div>
              <p className="muted">
                {t(
                  'Course previews use this worker’s current skills, weekly time and budget. Applying updates the company plan only.',
                )}
              </p>
            </div>
            <div className="workforce-opening-card">
              <label className="workforce-opening-label">
                <span>
                  <strong>
                    {t(
                      'Proposed openings for this worker’s custom destination',
                    )}
                  </strong>
                  <small className="muted">
                    {t(
                      'An employer planning assumption, not an inferred vacancy. Zero openings excludes this worker from allocated training.',
                    )}
                  </small>
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={review.openings}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      openings: Math.max(
                        0,
                        Math.min(10, Math.floor(Number(event.target.value))),
                      ),
                    })
                  }
                />
              </label>
            </div>
            <CareerGoalPanel
              profile={profile}
              goal={review.goal}
              snapshot={snapshot}
              funding="all"
              workforceMode
              initialTitle={review.title}
              onCancel={() => setReview(null)}
              onApply={(goal) => {
                onChange(
                  applyWorkforceGoal(
                    workforce,
                    profile.id,
                    goal,
                    review.openings,
                  ),
                );
                setValue(goal.title);
                setReview(null);
              }}
              onClear={() => {
                onChange(clearWorkforceGoal(workforce, profile.id));
                setReview(null);
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
