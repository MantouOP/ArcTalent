'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  LoaderCircle,
  Pencil,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { roles } from '@/lib/catalogue';
import { analyseGoalLocally, goalDraftSchema } from '@/lib/career-goals';
import {
  applyDirectWorkforceDraft,
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
  const { t, locale } = useI18n();
  const saved = workforce.customDestinations?.[profile.id];
  const [editingCustom, setEditingCustom] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{
    title: string;
    goal: CareerGoal | null;
    openings: number;
  } | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      pendingRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (editingCustom) {
      customInputRef.current?.focus();
      customInputRef.current?.select();
    }
  }, [editingCustom]);

  function openCustomEditor(initial = '') {
    pendingRef.current?.abort();
    setBusy(false);
    setDraftTitle(initial);
    setEditingCustom(true);
  }

  function cancelCustomEditor() {
    pendingRef.current?.abort();
    setBusy(false);
    setEditingCustom(false);
  }

  async function submitCustomDestination(rawTitle: string) {
    const trimmed = rawTitle.trim();
    if (trimmed.length < 2 || busy) return;

    const knownPreset = roles.find((option) =>
      [option.title, t(option.title)].some(
        (candidate) =>
          candidate.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
      ),
    );
    if (knownPreset) {
      const result = applyDirectWorkforceDraft(
        workforce,
        profile.id,
        trimmed,
        null,
        knownPreset.id,
      );
      if (result.kind === 'applied') onChange(result.settings);
      setEditingCustom(false);
      return;
    }

    if (
      saved &&
      saved.goal.title.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
    ) {
      onChange({
        ...workforce,
        destinations: {
          ...workforce.destinations,
          [profile.id]: 'custom-goal',
        },
      });
      setEditingCustom(false);
      return;
    }

    pendingRef.current?.abort();
    const controller = new AbortController();
    pendingRef.current = controller;
    setBusy(true);
    let draft = null;
    try {
      const response = await fetch('/api/career-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, description: '', locale }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(30000),
        ]),
      });
      if (response.ok) {
        const payload = await response.json();
        const parsed = goalDraftSchema.safeParse(payload.draft);
        if (parsed.success) draft = parsed.data;
      }
    } catch {
      /* Fall back to deterministic local goal analysis unless cancelled. */
    }
    if (controller.signal.aborted) return;
    if (pendingRef.current === controller) {
      pendingRef.current = null;
      setBusy(false);
    }
    const resolvedDraft =
      draft ?? analyseGoalLocally({ title: trimmed, description: '', locale });
    const outcome = applyDirectWorkforceDraft(
      workforce,
      profile.id,
      trimmed,
      resolvedDraft,
    );
    setEditingCustom(false);
    if (outcome.kind === 'applied') {
      onChange(outcome.settings);
    } else {
      setReview({
        title: outcome.title,
        goal: null,
        openings: outcome.openings,
      });
    }
  }

  const selectValue = role.custom && saved ? 'custom-goal' : role.id;

  return (
    <>
      <div className="workforce-destination">
        {editingCustom ? (
          <form
            className="workforce-destination-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCustomDestination(draftTitle);
            }}
          >
            <div className="workforce-destination-row">
              <input
                ref={customInputRef}
                className="workforce-destination-input"
                aria-label={t('Custom destination for {0}', {
                  0: profile.name,
                })}
                placeholder={t('Type any role (e.g. Web developer)…')}
                value={draftTitle}
                minLength={2}
                maxLength={100}
                disabled={busy}
                required
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelCustomEditor();
                  }
                }}
              />
              <button
                type="submit"
                className="text-button workforce-destination-submit"
                disabled={busy || draftTitle.trim().length < 2}
                aria-label={t('Apply custom destination for {0}', {
                  0: profile.name,
                })}
              >
                {busy ? (
                  <LoaderCircle
                    size={13}
                    className="workforce-destination-spin"
                  />
                ) : (
                  <Check size={13} />
                )}
                {busy ? t('Applying…') : t('Apply')}
              </button>
              <button
                type="button"
                className="icon-button workforce-destination-icon"
                onClick={cancelCustomEditor}
                title={t('Cancel custom destination')}
                aria-label={t('Cancel custom destination')}
              >
                <X size={14} />
              </button>
            </div>
          </form>
        ) : (
          <div className="workforce-destination-row">
            <select
              className="workforce-destination-select"
              aria-label={t('Destination for {0}', { 0: profile.name })}
              value={selectValue}
              onChange={(event) => {
                const next = event.target.value;
                if (next === '__custom__') {
                  openCustomEditor(
                    role.custom && saved ? saved.goal.title : '',
                  );
                  return;
                }
                onChange({
                  ...workforce,
                  destinations: {
                    ...workforce.destinations,
                    [profile.id]: next,
                  },
                });
              }}
            >
              {roles.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(option.title)}
                </option>
              ))}
              {saved && <option value="custom-goal">{saved.goal.title}</option>}
              <option value="__custom__">{t('+ Custom destination…')}</option>
            </select>
            <button
              type="button"
              className="icon-button workforce-destination-icon"
              title={t('Type custom destination')}
              aria-label={t('Customize destination for {0}', {
                0: profile.name,
              })}
              onClick={() =>
                openCustomEditor(role.custom && saved ? saved.goal.title : '')
              }
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
        {!editingCustom && role.custom && saved && (
          <div className="workforce-destination-actions">
            <button
              type="button"
              className="text-button workforce-destination-edit"
              aria-label={t('Review goal for {0}', { 0: profile.name })}
              onClick={() =>
                setReview({
                  title: saved.goal.title,
                  goal: saved.goal,
                  openings: saved.openings,
                })
              }
            >
              <SlidersHorizontal size={12} />
              {t('Skills & slots')}
            </button>
          </div>
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
