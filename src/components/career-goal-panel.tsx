'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  LoaderCircle,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { skills, skillById } from '@/lib/catalogue';
import {
  careerGoalSchema,
  goalCandidates,
  goalDraftSchema,
  goalToRole,
  type GoalDraft,
} from '@/lib/career-goals';
import { buildPlan, sharedFoundation } from '@/lib/engine';
import type { CareerGoal, Profile, SkillId, Snapshot } from '@/lib/types';
import { CourseLink } from './course-link';
import { useI18n } from './language-provider';
import './career-goal.css';

export function CareerGoalPanel({
  profile,
  goal,
  snapshot,
  funding,
  onApply,
  onClear,
  workforceMode = false,
  initialTitle = '',
  onCancel,
}: {
  profile: Profile;
  goal: CareerGoal | null;
  snapshot: Snapshot;
  funding: 'all' | 'free' | 'hrd';
  onApply: (goal: CareerGoal) => void;
  onClear: () => void;
  workforceMode?: boolean;
  initialTitle?: string;
  onCancel?: () => void;
}) {
  const { t, locale } = useI18n();
  const [title, setTitle] = useState(goal?.title ?? initialTitle);
  const [description, setDescription] = useState(goal?.description ?? '');
  const [draft, setDraft] = useState<GoalDraft | null>(goal);
  const [otherText, setOtherText] = useState(
    goal?.otherSkills.join('\n') ?? '',
  );
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!goal || workforceMode);
  const revision = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const titleField = useRef<HTMLInputElement>(null);
  const focusRequested = useRef(false);

  useEffect(() => {
    if (editing && focusRequested.current) {
      titleField.current?.focus();
      focusRequested.current = false;
    }
  }, [editing]);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setDraft(goal);
      setOtherText(goal.otherSkills.join('\n'));
      setEditing(workforceMode);
    }
  }, [goal, workforceMode]);
  useEffect(
    () => () => {
      revision.current++;
      pending.current?.abort();
    },
    [],
  );

  function invalidate() {
    revision.current++;
    pending.current?.abort();
    setBusy(false);
    setDraft(null);
    setNotice('');
    setError('');
  }
  const reviewed = useMemo(
    () =>
      careerGoalSchema.safeParse(
        draft
          ? {
              ...draft,
              otherSkills: otherText
                .split(/\n/)
                .map((value) => value.trim())
                .filter(Boolean),
            }
          : null,
      ),
    [draft, otherText],
  );
  const preview = useMemo(
    () =>
      reviewed.success
        ? buildPlan(
            profile,
            goalToRole(reviewed.data),
            workforceMode
              ? []
              : sharedFoundation(
                  profile,
                  snapshot,
                  goalCandidates(reviewed.data),
                ),
            funding,
          )
        : null,
    [reviewed, profile, snapshot, funding, workforceMode],
  );

  async function analyse() {
    const id = ++revision.current;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 50000);
    setBusy(true);
    setError('');
    setDraft(null);
    setNotice('');
    try {
      const response = await fetch('/api/career-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, locale }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (id !== revision.current) return;
      if (!response.ok) throw new Error('Career analysis failed');
      const parsed = goalDraftSchema.safeParse(result.draft);
      if (!parsed.success) throw new Error('Invalid career analysis');
      setDraft(parsed.data);
      setOtherText(parsed.data.otherSkills.join('\n'));
      setNotice(typeof result.notice === 'string' ? result.notice : '');
    } catch {
      if (id === revision.current)
        setError(
          'Could not analyse this goal. Try again, or choose your own skill targets.',
        );
    } finally {
      clearTimeout(timeout);
      if (id === revision.current) setBusy(false);
    }
  }
  function manual() {
    invalidate();
    setDraft({
      title: title.trim(),
      description: description.trim(),
      family: 'data',
      requirements: {},
      otherSkills: [],
      summary: 'Learning targets chosen by you.',
      mode: 'manual',
    });
    setOtherText('');
  }
  function changeTarget(id: SkillId, level: number) {
    if (!draft) return;
    const requirements = { ...draft.requirements };
    if (level) requirements[id] = level;
    else delete requirements[id];
    setDraft({ ...draft, requirements, mode: 'manual' });
  }
  function clear() {
    invalidate();
    setTitle('');
    setDescription('');
    setOtherText('');
    focusRequested.current = true;
    setEditing(true);
    onClear();
    if (editing) {
      titleField.current?.focus();
      focusRequested.current = false;
    }
  }

  if (goal && !editing)
    return (
      <section
        className="panel career-goal-applied"
        aria-label={t('Your custom career goal')}
      >
        <div>
          <span className="eyebrow">{t('YOUR CUSTOM DESTINATION')}</span>
          <h2>{goal.title}</h2>
          <p>
            {t(
              'Your learning targets are editable planning assumptions, not official role requirements.',
            )}
          </p>
        </div>
        <div className="goal-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              focusRequested.current = true;
              setEditing(true);
            }}
          >
            <Pencil size={15} />
            {t('Edit my goal')}
          </button>
          <button type="button" className="text-button" onClick={clear}>
            <Trash2 size={15} />
            {t('Remove my goal')}
          </button>
        </div>
      </section>
    );

  return (
    <section
      className="panel career-goal-panel"
      aria-labelledby="career-goal-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="career-goal-title">
            {t(
              workforceMode
                ? 'Type a destination for this worker'
                : 'Type your own career goal',
            )}
          </h2>
          <p>
            {t(
              'You can describe any destination. Review the suggested skills, then build a plan with real course links.',
            )}
          </p>
        </div>
        <Sparkles size={21} aria-hidden="true" />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void analyse();
        }}
      >
        <label>
          {t('Career or learning goal')}
          <input
            ref={titleField}
            autoFocus={workforceMode}
            value={title}
            minLength={2}
            maxLength={100}
            required
            placeholder={t(
              'For example: web developer or digital marketing specialist',
            )}
            onChange={(event) => {
              const nextTitle = event.target.value;
              revision.current++;
              pending.current?.abort();
              setBusy(false);
              setError('');
              setTitle(nextTitle);
              setDraft((current) =>
                current ? { ...current, title: nextTitle.trim() } : null,
              );
            }}
          />
        </label>
        <div className="goal-examples" aria-label={t('Example career goals')}>
          {[
            'Web developer',
            'Cybersecurity analyst',
            'Digital marketing specialist',
          ].map((example) => (
            <button
              type="button"
              key={example}
              onClick={() => {
                invalidate();
                setTitle(t(example));
                titleField.current?.focus();
              }}
            >
              {t(example)}
            </button>
          ))}
        </div>
        {!!profile.customInterests?.length && (
          <div
            className="goal-examples goal-interest-ideas"
            aria-label={t('From your interests')}
          >
            <span aria-hidden="true">{t('From your interests')}</span>
            {profile.customInterests.map((interest) => (
              <button
                type="button"
                key={interest}
                onClick={() => {
                  invalidate();
                  setTitle(interest);
                  titleField.current?.focus();
                }}
              >
                {interest}
              </button>
            ))}
          </div>
        )}
        <label>
          {t('What work do you want to do? (optional)')}
          <textarea
            value={description}
            rows={3}
            maxLength={1200}
            placeholder={t(
              'Describe the tasks, tools or skills you want to learn. Leave out personal or confidential information.',
            )}
            onChange={(event) => {
              const nextDescription = event.target.value;
              revision.current++;
              pending.current?.abort();
              setBusy(false);
              setError('');
              setDescription(nextDescription);
              setDraft((current) =>
                current
                  ? { ...current, description: nextDescription.trim() }
                  : null,
              );
            }}
          />
        </label>
        <div className="goal-actions">
          <button type="submit" className="primary" disabled={busy}>
            {busy ? (
              <LoaderCircle className="goal-spinner" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {t(busy ? 'Analysing your goal…' : 'Analyse my goal')}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={title.trim().length < 2}
            onClick={manual}
          >
            {t('Choose skill targets myself')}
          </button>
          {goal && workforceMode && (
            <button type="button" className="text-button" onClick={clear}>
              <Trash2 size={15} />
              {t('Remove my goal')}
            </button>
          )}
          {goal && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                  return;
                }
                invalidate();
                setTitle(goal.title);
                setDescription(goal.description);
                setDraft(goal);
                setOtherText(goal.otherSkills.join('\n'));
                setEditing(false);
              }}
            >
              {t('Cancel editing')}
            </button>
          )}
        </div>
        <p className="muted small">
          {t(
            'Only your goal and description are sent for analysis. Course links come from the checked catalogue.',
          )}
        </p>
      </form>
      {error && (
        <p role="alert" className="notice">
          {t(error)}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {t(notice)}
        </p>
      )}
      {draft && (
        <div className="goal-review" aria-live="polite">
          <h3>
            {t(
              draft.mode === 'ai'
                ? 'AI skill suggestions'
                : draft.mode === 'local'
                  ? 'Local skill suggestions'
                  : 'Your skill targets',
            )}
          </h3>
          <p>{t(draft.summary)}</p>
          <label>
            {t('Work interest')}
            <select
              value={draft.family}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  family: event.target.value as CareerGoal['family'],
                  mode: 'manual',
                })
              }
            >
              <option value="data">{t('Data & insights')}</option>
              <option value="people">{t('People & projects')}</option>
              <option value="operations">{t('Business operations')}</option>
              <option value="sustainability">{t('Sustainability')}</option>
            </select>
          </label>
          <div className="goal-targets">
            {Object.entries(draft.requirements).map(([id, level]) => (
              <label key={id}>
                <span>
                  {t(skillById[id as SkillId].label)}
                  <small>
                    {t(
                      workforceMode
                        ? 'Current level: {0}'
                        : 'Your current level: {0}',
                      {
                        0: profile.skills[id as SkillId] ?? 0,
                      },
                    )}
                  </small>
                </span>
                <select
                  aria-label={t('Target level for {0}', {
                    0: t(skillById[id as SkillId].label),
                  })}
                  value={level}
                  onChange={(event) =>
                    changeTarget(id as SkillId, Number(event.target.value))
                  }
                >
                  <option value="0">{t('Remove skill')}</option>
                  <option value="1">{t('1 · Basic')}</option>
                  <option value="2">{t('2 · Independent')}</option>
                  <option value="3">{t('3 · Advanced')}</option>
                </select>
              </label>
            ))}
          </div>
          <label>
            {t('Add a skill to this goal')}
            <select
              value=""
              onChange={(event) => {
                if (event.target.value)
                  changeTarget(event.target.value as SkillId, 2);
              }}
            >
              <option value="">{t('Choose another skill…')}</option>
              {skills
                .filter((skill) => !draft.requirements[skill.id])
                .map((skill) => (
                  <option value={skill.id} key={skill.id}>
                    {t(skill.label)}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {t('Other specialist skills to investigate')}
            <textarea
              value={otherText}
              rows={2}
              maxLength={1000}
              placeholder={t('Add up to eight skills, one per line.')}
              onChange={(event) => {
                setOtherText(event.target.value);
                setDraft({ ...draft, mode: 'manual' });
              }}
            />
          </label>
          <p className="muted small">
            {t(
              'Specialist skills listed here are not covered by this starter catalogue. Keep them in your longer-term plan.',
            )}
          </p>
          {!reviewed.success && (
            <p className="notice">
              {t(
                'Choose at least one skill target. Use up to eight other skills, with 120 characters each.',
              )}
            </p>
          )}
          {preview && (
            <div className="goal-course-preview">
              <h3>{t('Courses that fit your current time and budget')}</h3>
              <p>
                {t('{0} courses · {1} planned hours · RM {2}', {
                  0: preview.steps.length,
                  1: preview.totalHours,
                  2: preview.totalCost,
                })}
              </p>
              {preview.steps.map((step) => (
                <div className="goal-course-row" key={step.course.id}>
                  <div>
                    <strong>{step.course.title}</strong>
                    <small>
                      {step.course.provider} ·{' '}
                      {t('{0} hours', { 0: step.course.hours })}
                    </small>
                  </div>
                  <CourseLink course={step.course} />
                </div>
              ))}
              {!preview.steps.length && (
                <p className="notice">
                  {t('No new course fits this selection.')}{' '}
                  {t('Review your time, completed learning and skill targets.')}
                </p>
              )}
              {preview.uncovered.length > 0 && (
                <p className="muted">
                  {t('Skills still to cover: {0}', {
                    0: preview.uncovered
                      .map((id) => t(skillById[id].label))
                      .join(', '),
                  })}
                </p>
              )}
            </div>
          )}
          <div className="goal-actions">
            <button
              type="button"
              className="primary"
              disabled={!reviewed.success}
              onClick={() => {
                if (reviewed.success) onApply(reviewed.data);
              }}
            >
              {t(workforceMode ? 'Apply to this worker' : 'Build my pathway')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
