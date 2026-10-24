'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { roles } from '@/lib/catalogue';
import {
  applyWorkforceGoal,
  clearWorkforceGoal,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
import type { CareerGoal, Profile, Role, Snapshot } from '@/lib/types';
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
    <div className="workforce-destination">
      <form
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
        <input
          aria-label={t('Destination for {0}', { 0: profile.name })}
          list={id}
          value={value}
          minLength={2}
          maxLength={100}
          required
          onChange={(event) => setValue(event.target.value)}
        />
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
        <button
          type="submit"
          className="text-button"
          aria-label={t(known ? 'Use preset for {0}' : 'Review goal for {0}', {
            0: profile.name,
          })}
        >
          {t(known ? 'Use preset' : 'Review goal')}
        </button>
        {known && role.custom && saved && (
          <button
            type="button"
            className="text-button"
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
      <small>{t('Type any career, or choose a suggestion.')}</small>
      {value.trim() !== displayTitle && (
        <small role="status">
          {t('Not applied yet. Review or use a preset to update the plan.')}
        </small>
      )}
      {role.custom && saved && saved.goal.otherSkills.length > 0 && (
        <small>
          {t('{0} additional specialist skills to review', {
            0: saved.goal.otherSkills.length,
          })}
        </small>
      )}
      {review && (
        <Modal
          title={t('Destination for {0}', { 0: profile.name })}
          onClose={() => setReview(null)}
        >
          <div className="workforce-goal-dialog">
            <p className="muted">
              {t(
                'Course previews use this worker’s current skills, weekly time and budget. Applying updates the company plan only.',
              )}
            </p>
            <label className="workforce-opening-label">
              {t('Proposed openings for this worker’s custom destination')}
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
            <p className="muted small">
              {t(
                'An employer planning assumption, not an inferred vacancy. Zero openings excludes this worker from allocated training.',
              )}
            </p>
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
    </div>
  );
}
