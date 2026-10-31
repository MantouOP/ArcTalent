'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { courses, sdgGoal, sdgLabel, sdgUrl, skillById } from '@/lib/catalogue';
import {
  coachStudyProgressLocally,
  makeStudyProgressRequest,
  prunePracticeBadges,
  upsertPracticeBadge,
  verifyBadgeReflectionLocally,
  type BadgeVerifyResponse,
  type PracticeBadge,
  type StudyCoachResponse,
} from '@/lib/study-progress-ai';
import type {
  CareerGoal,
  Course,
  LearningPlan,
  Profile,
  Role,
  Scenario,
  SkillId,
  Snapshot,
} from '@/lib/types';
import { useI18n } from './language-provider';
import { External, SkillChip, Tag } from './ui';

const courseById = new Map<string, Course>(
  courses.map((course) => [course.id, course]),
);

export function StudyProgressAiSection({
  view = 'coach',
  profile,
  plan,
  role,
  scenario,
  snapshot,
  customGoal,
  funding,
  practiceBadges,
  onChangePracticeBadges,
  onConfirmSkillLevel,
}: {
  /** Which half the badges panel tab shows; both keep their state. */
  view?: 'coach' | 'practice';
  profile: Profile;
  plan: LearningPlan;
  role: Role;
  scenario: Scenario;
  snapshot: Snapshot;
  customGoal: CareerGoal | null;
  funding: 'all' | 'free' | 'hrd';
  practiceBadges: PracticeBadge[];
  onChangePracticeBadges: (next: PracticeBadge[]) => void;
  onConfirmSkillLevel?: (skillId: SkillId, level: number) => void;
}) {
  const { t, locale } = useI18n();
  const [availability, setAvailability] = useState<
    'checking' | 'configured' | 'local'
  >('checking');
  const [provider, setProvider] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);

  const [coachBusy, setCoachBusy] = useState(false);
  const [coachResult, setCoachResult] = useState<StudyCoachResponse | null>(
    null,
  );
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyResult, setVerifyResult] = useState<BadgeVerifyResponse | null>(
    null,
  );

  const studiedCourses = useMemo(() => {
    const ordered: Course[] = [...plan.completed];
    const seen = new Set(ordered.map((c) => c.id));
    for (const id of profile.completed) {
      if (seen.has(id)) continue;
      const found = courseById.get(id);
      if (found) {
        seen.add(id);
        ordered.push(found);
      }
    }
    return ordered;
  }, [plan.completed, profile.completed]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    studiedCourses.at(-1)?.id ?? '',
  );
  const [reflection, setReflection] = useState('');

  const coachController = useRef<AbortController | null>(null);
  const verifyController = useRef<AbortController | null>(null);
  const coachRevision = useRef(0);
  const verifyRevision = useRef(0);

  const contextKey = useMemo(
    () =>
      JSON.stringify({
        locale,
        roleId: role.id,
        scenario,
        snapshotId: snapshot.id,
        funding,
        hours: profile.hours,
        weeks: profile.weeks,
        completed: profile.completed,
        skills: profile.skills,
        customTitle: customGoal?.title ?? '',
      }),
    [
      locale,
      role.id,
      scenario,
      snapshot.id,
      funding,
      profile.hours,
      profile.weeks,
      profile.completed,
      profile.skills,
      customGoal?.title,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const configured = data.studyProgress === 'ai-configured';
        setProvider(configured ? String(data.aiProvider ?? '') : '');
        setAvailability(configured ? 'configured' : 'local');
        setAiEnabled(configured);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAvailability('local');
          setAiEnabled(false);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      studiedCourses.length > 0 &&
      !studiedCourses.some((c) => c.id === selectedCourseId)
    ) {
      setSelectedCourseId(studiedCourses.at(-1)!.id);
    } else if (studiedCourses.length === 0 && selectedCourseId !== '') {
      setSelectedCourseId('');
    }
  }, [studiedCourses, selectedCourseId]);

  useEffect(() => {
    coachRevision.current++;
    coachController.current?.abort();
    coachController.current = null;
    setCoachBusy(false);
    setCoachResult(null);

    verifyRevision.current++;
    verifyController.current?.abort();
    verifyController.current = null;
    setVerifyBusy(false);
    setVerifyResult(null);
  }, [contextKey]);

  useEffect(
    () => () => {
      coachController.current?.abort();
      verifyController.current?.abort();
    },
    [],
  );

  const activePracticeBadges = useMemo(
    () => prunePracticeBadges(practiceBadges, profile.completed),
    [practiceBadges, profile.completed],
  );

  async function requestStudyCoach() {
    const rev = ++coachRevision.current;
    coachController.current?.abort();
    const requestPayload = makeStudyProgressRequest({
      action: 'coach',
      locale,
      profile,
      scenario,
      snapshot,
      roleId: role.id,
      customGoal,
      funding,
    });

    if (!aiEnabled || availability !== 'configured') {
      setCoachResult(coachStudyProgressLocally(requestPayload));
      return;
    }

    const controller = new AbortController();
    coachController.current = controller;
    setCoachBusy(true);
    try {
      const response = await fetch('/api/study-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(48000),
        ]),
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) throw new Error('Coach request failed');
      const data = (await response.json()) as StudyCoachResponse;
      if (rev !== coachRevision.current) return;
      if (data.kind !== 'coach') throw new Error('Unexpected response');
      setCoachResult(data);
    } catch {
      if (rev !== coachRevision.current || controller.signal.aborted) return;
      setCoachResult({
        ...coachStudyProgressLocally(requestPayload),
        notice:
          'Could not reach the study coach. Showing local guidance instead.',
      });
    } finally {
      if (rev === coachRevision.current) setCoachBusy(false);
    }
  }

  async function submitPracticeReflection() {
    const trimmed = reflection.trim();
    if (!selectedCourseId || trimmed.length < 20 || trimmed.length > 600) {
      return;
    }
    const rev = ++verifyRevision.current;
    verifyController.current?.abort();
    const requestPayload = makeStudyProgressRequest({
      action: 'verify-badge',
      locale,
      profile,
      scenario,
      snapshot,
      roleId: role.id,
      customGoal,
      funding,
      courseId: selectedCourseId,
      reflection: trimmed,
    });

    const applyVerified = (data: BadgeVerifyResponse) => {
      setVerifyResult(data);
      if (data.awarded && data.demonstratedSkills.length > 0) {
        onChangePracticeBadges(
          upsertPracticeBadge(
            practiceBadges,
            {
              courseId: data.courseId,
              badgeTitle: data.badgeTitle,
              feedback: data.feedback,
              nextStep: data.nextStep,
              demonstratedSkills: data.demonstratedSkills,
              sdgTargets: data.sdgTargets,
              mode: data.mode,
              model: data.model,
            },
            profile.completed,
          ),
        );
      }
    };

    if (!aiEnabled || availability !== 'configured') {
      applyVerified(verifyBadgeReflectionLocally(requestPayload));
      return;
    }

    const controller = new AbortController();
    verifyController.current = controller;
    setVerifyBusy(true);
    try {
      const response = await fetch('/api/study-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(48000),
        ]),
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) throw new Error('Badge verification failed');
      const data = (await response.json()) as BadgeVerifyResponse;
      if (rev !== verifyRevision.current) return;
      if (data.kind !== 'verify-badge') throw new Error('Unexpected response');
      applyVerified(data);
    } catch {
      if (rev !== verifyRevision.current || controller.signal.aborted) return;
      applyVerified({
        ...verifyBadgeReflectionLocally(requestPayload),
        notice:
          'Could not reach the study coach. Showing local guidance instead.',
      });
    } finally {
      if (rev === verifyRevision.current) setVerifyBusy(false);
    }
  }

  return (
    <div className="study-ai-section">
      <div className="study-ai-header">
        <label className="checkbox-label study-ai-toggle">
          <input
            type="checkbox"
            checked={aiEnabled}
            disabled={availability !== 'configured'}
            onChange={(event) => {
              coachRevision.current++;
              coachController.current?.abort();
              verifyRevision.current++;
              verifyController.current?.abort();
              setCoachBusy(false);
              setVerifyBusy(false);
              setAiEnabled(event.target.checked);
            }}
          />
          {provider
            ? t('Use AI coach ({0})', { 0: provider })
            : t('Use AI coach')}
        </label>
      </div>
      <p className="muted small study-ai-privacy">
        {availability === 'configured'
          ? t(
              'When AI is enabled, only anonymous skill levels, study pace, course IDs and your practice note are sent to {0}. Names, CVs, photos and team records stay on this device.',
              { 0: provider },
            )
          : availability === 'checking'
            ? t('Checking AI study coach configuration…')
            : t(
                'AI is not connected. Study coaching and reflection checks run locally on this device.',
              )}
      </p>

      <div className="study-ai-grid">
        <div className="study-ai-card" hidden={view !== 'coach'}>
          <div className="badge-card-top">
            <strong>{t('Study progress coach')}</strong>
            {coachResult && (
              <Tag tone={coachResult.mode === 'ai' ? 'blue' : 'amber'}>
                {coachResult.mode === 'ai'
                  ? `${t('AI coach')} · ${coachResult.model ?? (provider || 'AI')}`
                  : t('Local study coach')}
              </Tag>
            )}
          </div>
          <p className="muted small">
            {t(
              'Get a tailored next-session plan for your weekly hours, unlocked badges and scheduled courses.',
            )}
          </p>
          <div>
            <button
              type="button"
              className="secondary"
              disabled={coachBusy}
              aria-busy={coachBusy}
              onClick={() => void requestStudyCoach()}
            >
              {coachBusy ? (
                <LoaderCircle className="goal-spinner" size={15} />
              ) : (
                <Sparkles size={15} />
              )}
              {coachBusy
                ? t('Preparing study plan…')
                : t('Coach my study progress')}
            </button>
          </div>

          {coachResult && (
            <div className="study-ai-output" role="status" aria-live="polite">
              {coachResult.notice && (
                <p className="muted small">{t(coachResult.notice)}</p>
              )}
              <p>{coachResult.summary}</p>
              {coachResult.nextBadgeTitle && (
                <p className="study-ai-milestone">
                  <Tag tone="amber">
                    {t('Next badge target: {0}', {
                      0: coachResult.nextBadgeTitle,
                    })}
                  </Tag>
                </p>
              )}
              <div className="study-ai-microtask">
                <strong>{t('Recommended micro-session')}</strong>
                <p>{coachResult.microTask}</p>
              </div>
              {coachResult.courses.length > 0 && (
                <div className="study-ai-links">
                  <small className="muted">
                    {t('Scheduled focus courses')}
                  </small>
                  <ul>
                    {coachResult.courses.map((course) => (
                      <li key={course.id}>
                        <External href={course.url}>{course.title}</External>
                        <small className="muted">
                          {' '}
                          · {course.provider} ({course.hours}h)
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="study-ai-card" hidden={view !== 'practice'}>
          <div className="badge-card-top">
            <strong>{t('Practice badge check-in')}</strong>
            {verifyResult && (
              <Tag tone={verifyResult.awarded ? 'green' : 'amber'}>
                {verifyResult.awarded
                  ? t('Practice badge unlocked')
                  : t('Needs concrete detail')}
              </Tag>
            )}
          </div>
          <p className="muted small">
            {t(
              'Reflect on what you practised in a studied course to earn an evidence-backed practice badge. Skill ratings stay unchanged until you confirm them.',
            )}
          </p>

          {studiedCourses.length === 0 ? (
            <div className="study-ai-empty">
              <p className="muted small">
                {t(
                  'Mark at least one course as studied below, then write a short practice reflection here to earn a verified practice badge.',
                )}
              </p>
              {plan.steps.length > 0 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    const heading = document.getElementById('learning-courses');
                    heading?.focus({ preventScroll: true });
                    heading?.scrollIntoView({
                      block: 'start',
                      behavior: 'smooth',
                    });
                  }}
                >
                  {t('Jump to scheduled courses')} <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <form
              className="study-ai-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitPracticeReflection();
              }}
            >
              <label>
                {t('Studied course')}
                <select
                  value={selectedCourseId}
                  disabled={verifyBusy}
                  onChange={(event) => {
                    verifyRevision.current++;
                    verifyController.current?.abort();
                    setVerifyBusy(false);
                    setVerifyResult(null);
                    setSelectedCourseId(event.target.value);
                  }}
                >
                  {studiedCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.provider})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('What did you practise or build?')}
                <textarea
                  rows={3}
                  minLength={20}
                  maxLength={600}
                  disabled={verifyBusy}
                  value={reflection}
                  placeholder={t(
                    'Describe a concrete exercise, query, spreadsheet or workflow you practised (20–600 characters). Leave out personal or confidential details.',
                  )}
                  onChange={(event) => {
                    if (verifyResult) setVerifyResult(null);
                    setReflection(event.target.value);
                  }}
                />
              </label>
              <div className="study-ai-form-footer">
                <button
                  type="submit"
                  className="primary"
                  disabled={
                    verifyBusy ||
                    !selectedCourseId ||
                    reflection.trim().length < 20
                  }
                  aria-busy={verifyBusy}
                >
                  {verifyBusy ? (
                    <LoaderCircle className="goal-spinner" size={15} />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  {verifyBusy
                    ? t('Reviewing reflection…')
                    : t('Verify practice reflection')}
                </button>
                <small className="muted">
                  {t('{0}/600 characters (minimum 20)', {
                    0: reflection.trim().length,
                  })}
                </small>
              </div>
            </form>
          )}

          {verifyResult && (
            <div className="study-ai-output" role="status" aria-live="polite">
              <div className="badge-card-top">
                <strong>{verifyResult.badgeTitle}</strong>
                <small className="muted">
                  {verifyResult.mode === 'ai'
                    ? `${t('AI review')} · ${verifyResult.model ?? (provider || 'AI')}`
                    : t('Local review')}
                </small>
              </div>
              {verifyResult.notice && (
                <p className="muted small">{t(verifyResult.notice)}</p>
              )}
              <p>{verifyResult.feedback}</p>
              <p className="muted small">{verifyResult.nextStep}</p>
            </div>
          )}
        </div>
      </div>

      {view === 'practice' && activePracticeBadges.length > 0 && (
        <div className="earned-practice-badges">
          <div className="badge-card-top">
            <strong>
              {t('Earned practice badges ({0})', {
                0: activePracticeBadges.length,
              })}
            </strong>
            <small className="muted">
              {t(
                'Self-study milestones · kept while course stays marked studied',
              )}
            </small>
          </div>
          <div className="badges-grid">
            {activePracticeBadges.map((badge) => {
              const course = courseById.get(badge.courseId);
              return (
                <article
                  key={badge.courseId}
                  className="learner-badge-card is-earned practice-badge-card"
                >
                  <div className="badge-card-top">
                    <Tag tone="green">{t('Practice verified')}</Tag>
                    <small>
                      {[...new Set(badge.sdgTargets.map(sdgGoal))].map(
                        (goal, index) => (
                          <span key={goal}>
                            {index > 0 ? ' · ' : ''}
                            <a
                              href={sdgUrl(goal)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {sdgLabel(goal)}
                            </a>
                          </span>
                        ),
                      )}
                    </small>
                  </div>
                  <h3>{badge.badgeTitle}</h3>
                  {course && (
                    <small className="muted">
                      {course.title} · {course.provider}
                    </small>
                  )}
                  <p className="muted small">{badge.feedback}</p>
                  <div className="chips">
                    {badge.demonstratedSkills.map((item) => (
                      <SkillChip key={item.id} id={item.id} />
                    ))}
                  </div>
                  {badge.demonstratedSkills.map((item) => (
                    <small key={item.id} className="practice-quote">
                      {t('Evidence note: "{0}"', { 0: item.quote })}
                    </small>
                  ))}
                  {onConfirmSkillLevel && (
                    <div className="practice-skill-actions">
                      {badge.demonstratedSkills.map((item) => {
                        const currentLevel = profile.skills[item.id] ?? 0;
                        const skillLabel = t(skillById[item.id].label);
                        if (currentLevel >= 2) {
                          return (
                            <small
                              key={item.id}
                              className="practice-skill-confirmed"
                            >
                              <CheckCircle2 size={13} />{' '}
                              {t('{0} at Level {1}', {
                                0: skillLabel,
                                1: currentLevel,
                              })}
                            </small>
                          );
                        }
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="secondary practice-level-button"
                            onClick={() => onConfirmSkillLevel(item.id, 2)}
                          >
                            <CheckCircle2 size={14} />
                            {t('Set {0} to Working (Level 2)', {
                              0: skillLabel,
                            })}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="practice-badge-footer">
                    <small className="muted">
                      {badge.mode === 'ai'
                        ? `${t('AI review')} · ${badge.model ?? 'AI'}`
                        : t('Local review')}
                    </small>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        onChangePracticeBadges(
                          activePracticeBadges.filter(
                            (b) => b.courseId !== badge.courseId,
                          ),
                        )
                      }
                    >
                      <Trash2 size={13} />
                      {t('Remove badge')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
