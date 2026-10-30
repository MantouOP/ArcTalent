'use client';
import './worker-journey.css';
import './orion.css';
import './custom-inputs.css';
import { useI18n, LanguageSelector } from './language-provider';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Download,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Info,
  Leaf,
  Map,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
  X,
  Home,
} from 'lucide-react';
import { baseline, baseProfile, roles, sdgUrl, updated } from '@/lib/catalogue';
import {
  buildPlan,
  diffSnapshots,
  rankRoles,
  sharedFoundation,
} from '@/lib/engine';
import { profileSchema, snapshotSchema } from '@/lib/validation';
import type { Match, Profile, Scenario, Snapshot } from '@/lib/types';
import {
  downloadFile,
  External,
  MatchDetails,
  Modal,
  Radar,
  SkillChip,
  Tag,
} from './ui';
import { LearningMap } from './learning-map';
import { ProfilePanel } from './profile-panel';
import { EmployerPanel } from './employer-panel';
import { EvidencePanel } from './evidence-panel';
import { ImpactScorecard } from './impact-scorecard';
import { SkillBridge } from './skill-bridge';
import { StudyRhythm } from './study-rhythm';
import { RouteSummary, RouteAnalytics } from './command-overview';
import { CareerChat } from './career-chat';
import { SettingsPanel } from './settings-panel';
import { ProfileAvatar } from './profile-avatar';
import { CourseLink } from './course-link';
import { CareerGoalPanel } from './career-goal-panel';
import { careerGoalSchema, goalCandidates } from '@/lib/career-goals';
import { roleLabel } from '@/lib/role-label';
import type { CareerGoal } from '@/lib/types';
import { useDisplayPreferences } from './display-preferences-provider';
import { shouldReduceMotion } from '@/lib/display-preferences';
import {
  restoreWorkforceSettings,
  getWorkforceMembers,
  updateWorkforceProfile,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
type View = 'explore' | 'pathway' | 'team' | 'impact' | 'evidence' | 'profile';
const navigation = [
  { id: 'explore' as const, label: 'Career explorer', icon: Compass },
  { id: 'pathway' as const, label: 'My learning pathway', icon: Map },
  { id: 'team' as const, label: 'SME workspace', icon: Users },
  { id: 'impact' as const, label: 'Impact scorecard', icon: Target },
  { id: 'evidence' as const, label: 'Evidence lab', icon: FlaskConical },
  { id: 'profile' as const, label: 'My skills & profile', icon: UserRound },
];
const defaultRole = rankRoles(baseProfile, 'moderate', baseline)[0].role.id;
export function ArcTalentApp({
  initialView = 'explore',
}: {
  initialView?: View;
}) {
  const { t, locale } = useI18n();
  const { preferences: displayPreferences } = useDisplayPreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [customGoal, setCustomGoal] = useState<CareerGoal | null>(null);
  const candidates = useMemo(() => goalCandidates(customGoal), [customGoal]);

  const [view, setView] = useState<View>(initialView),
    [profile, setProfile] = useState<Profile>(baseProfile),
    [scenario, setScenario] = useState<Scenario>('moderate'),
    [snapshot, setSnapshot] = useState<Snapshot>(baseline),
    [previous, setPrevious] = useState<Snapshot | null>(null),
    [selected, setSelected] = useState(defaultRole),
    [details, setDetails] = useState<Match | null>(null),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(''),
    [ready, setReady] = useState(false),
    [showAll, setShowAll] = useState(false),
    [funding, setFunding] = useState<'all' | 'free' | 'hrd'>('all'),
    [query, setQuery] = useState('');
  const revision = useRef(0);
  const [followTop, setFollowTop] = useState(true);
  const [workforce, setWorkforce] = useState<WorkforceSettings>(() =>
    restoreWorkforceSettings(),
  );
  function chooseRole(id: string) {
    setSelected(id);
    setFollowTop(false);
  }
  useEffect(() => {
    try {
      const raw = localStorage.getItem('arctalent-v1');
      if (raw) {
        const saved = JSON.parse(raw);
        const p = profileSchema.safeParse(saved.profile),
          s = snapshotSchema.safeParse(saved.snapshot);
        if (p.success) setProfile(p.data);
        if (s.success) setSnapshot(s.data);
        if (saved.scenario === 'moderate' || saved.scenario === 'rapid')
          setScenario(saved.scenario);
        const storedGoal = careerGoalSchema.safeParse(saved.customGoal);
        if (storedGoal.success) setCustomGoal(storedGoal.data);
        if (
          goalCandidates(storedGoal.success ? storedGoal.data : null).some(
            (r) => r.id === saved.selected,
          )
        )
          setSelected(saved.selected);
        if (typeof saved.followTop === 'boolean') setFollowTop(saved.followTop);
        const restoredWorkforce = restoreWorkforceSettings(saved.workforce);
        setWorkforce(
          p.success
            ? updateWorkforceProfile(restoredWorkforce, p.data)
            : restoredWorkforce,
        );
      }
    } catch {
      /* Browser storage is optional. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          'arctalent-v1',
          JSON.stringify({
            profile,
            scenario,
            snapshot,
            selected,
            followTop,
            workforce,
            customGoal,
          }),
        );
      } catch {
        /* Storage is optional. */
      }
  }, [
    ready,
    profile,
    scenario,
    snapshot,
    selected,
    followTop,
    workforce,
    customGoal,
  ]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  const matches = useMemo(
    () => rankRoles(profile, scenario, snapshot, candidates),
    [profile, scenario, snapshot, candidates],
  );
  const shared = useMemo(
    () => sharedFoundation(profile, snapshot, candidates),
    [profile, snapshot, candidates],
  );
  const active = followTop
    ? matches[0]
    : (matches.find((m) => m.role.id === selected) ?? matches[0]);
  const plan = useMemo(
    () => buildPlan(profile, active.role, shared, funding),
    [profile, active.role, shared, funding],
  );
  const changes = previous
    ? diffSnapshots(profile, scenario, previous, snapshot, candidates).filter(
        (c) => c.delta !== 0,
      )
    : [];
  function navigate(next: View) {
    setView(next);
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion(
        displayPreferences,
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      )
        ? 'auto'
        : 'smooth',
    });
  }
  function useSnapshot(next: Snapshot) {
    revision.current++;
    setBusy(false);
    if (next.id === snapshot.id) {
      setToast('This snapshot is already active. No recommendations changed.');
      return;
    }
    setPrevious(snapshot);
    setSnapshot(next);
    setToast(
      `${next.kind === 'simulation' ? 'Demo replay' : 'Public evidence'} applied. Scores and proposed pathways recalculated. Completed learning and manually chosen destinations are kept.`,
    );
  }
  async function refresh() {
    const request = ++revision.current;
    setBusy(true);
    try {
      const r = await fetch('/api/signals');
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const parsed = snapshotSchema.parse(data.snapshot);
      if (request !== revision.current) return;
      useSnapshot(parsed);
      if (data.warnings?.length) setToast(data.warnings.join(' '));
    } catch (e) {
      if (request === revision.current)
        setToast(
          e instanceof Error
            ? e.message
            : 'Refresh failed. Your snapshot has been kept.',
        );
    } finally {
      if (request === revision.current) setBusy(false);
    }
  }
  function reset() {
    revision.current++;
    setBusy(false);
    setProfile({
      ...baseProfile,
      skills: { ...baseProfile.skills },
      completed: [],
    });
    setScenario('moderate');
    setSnapshot(baseline);
    setPrevious(null);
    setSelected(defaultRole);
    setFollowTop(true);
    setWorkforce(restoreWorkforceSettings());
    setFunding('all');
    setCustomGoal(null);
    setView('explore');
    setToast('Demo reset to Aina’s starting profile.');
  }
  function complete(id: string) {
    saveProfile({
      ...profile,
      completed: profile.completed.includes(id)
        ? profile.completed.filter((x) => x !== id)
        : [...profile.completed, id],
    });
    setToast(
      'Learning activity updated. Skill proficiency stays unchanged until you review it in your profile.',
    );
  }
  function saveProfile(next: Profile) {
    setProfile(next);
    setWorkforce((current) => updateWorkforceProfile(current, next));
  }
  async function exportPlan() {
    if (exporting) return;
    setExporting(true);
    setExportError(false);
    try {
      const response = await fetch('/api/pathway-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          scenario,
          snapshot: { ...snapshot, signals: [] },
          roleId: active.role.id,
          customGoal,
          funding,
          locale,
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (
        !response.ok ||
        !response.headers.get('content-type')?.startsWith('application/pdf')
      )
        throw new Error('PDF export failed');
      downloadFile(
        'ArcTalent-learning-plan.pdf',
        await response.blob(),
        'application/pdf',
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }
  const visibleMatches = matches
    .filter((m) =>
      [m.role.title, t(m.role.title), t(m.role.shortTitle)].some((title) =>
        title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),
    )
    .slice(0, showAll ? matches.length : 3);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {t('Skip to content')}{' '}
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('explore');
          }}
          aria-label={t('ArcTalent home')}
        >
          <span className="brand-icon">
            <GitBranch size={24} />
          </span>
          <span className="brand-wordmark">
            {t('Arc')}
            <span className="brand-light">{t('Talent')}</span>
            <small>{t('BUILD YOUR NEXT CHAPTER')}</small>
          </span>
        </a>
        <div className="workspace-label">{t('YOUR WORKSPACE')}</div>
        <nav aria-label={t('Main navigation')}>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? 'active' : ''}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              title={t(item.label)}
              aria-label={t(item.label)}
            >
              <item.icon size={19} />
              <span>{t(item.label)}</span>
              {view === item.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <a
            href="/"
            className="introduction-link"
            title={t('Back to introduction')}
            aria-label={t('Back to introduction')}
          >
            <Home size={20} />
          </a>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title={t('Settings')}
            aria-label={t('Open settings')}
          >
            <Settings2 size={20} />
          </button>
          <button
            onClick={() => navigate('pathway')}
            title={t('Explore your pathway')}
            aria-label={t('Explore your pathway')}
          >
            <Sparkles size={20} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="tiny-leaf">
            <Leaf size={17} />
          </span>
          <span>
            {t('Built for a more')} <br />
            <b>{t('inclusive future of work.')}</b>
          </span>
        </div>
        <div
          className="sidebar-user"
          title={t('{0} · Synthetic demo profile', { 0: profile.name })}
        >
          <ProfileAvatar profile={profile} />
          <div>
            <strong>{profile.name}</strong>
            <small>{t('Synthetic demo profile')}</small>
          </div>
          <button
            onClick={() => navigate('profile')}
            className="icon-button"
            aria-label={t('Edit profile')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumb">
            <a
              className="topbar-brand"
              href="/"
              aria-label={t('Back to introduction')}
            >
              {t('ArcTalent')}
              <span className="product-label"> {t('/ WORKSPACE')}</span>
            </a>
            <ChevronRight size={13} />
            <strong>{t(navigation.find((n) => n.id === view)?.label)}</strong>
          </div>
          <div className="topbar-actions">
            <LanguageSelector />
            <button
              type="button"
              className="icon-button settings-open-button"
              onClick={() => setSettingsOpen(true)}
              title={t('Settings')}
              aria-label={t('Open settings')}
            >
              <Settings2 size={18} />
            </button>
            <span className="demo-indicator">
              <i />
              {t('Hackathon prototype')}{' '}
            </span>
            <button
              className="text-button reset-demo"
              onClick={reset}
              aria-label={t('Reset demo')}
              title={t('Reset demo')}
            >
              <RotateCcw size={15} />
              <span className="reset-label">{t('Reset demo')}</span>
            </button>
            <button
              className="avatar small-avatar profile-avatar-button"
              aria-label={t('Open my profile')}
              onClick={() => navigate('profile')}
            >
              <ProfileAvatar
                profile={profile}
                className="profile-avatar-fill"
              />
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                {view === 'team'
                  ? t('GROW YOUR PEOPLE, TOGETHER')
                  : view === 'profile'
                    ? t('YOUR EXPERIENCE IS A HEAD START')
                    : view === 'impact'
                      ? t('MEASURED AGAINST OUR COMMITMENTS')
                      : t('A LITTLE CLARITY FOR WHAT COMES NEXT')}
              </span>
              <h1>
                {view === 'explore'
                  ? t('Career command center')
                  : view === 'pathway'
                    ? t('Your learning pathway')
                    : view === 'team'
                      ? t('Workforce command center')
                      : view === 'impact'
                        ? t('Impact scorecard')
                        : view === 'evidence'
                          ? t('Evidence intelligence')
                          : t('Your skills & profile')}
              </h1>
              <p>
                {view === 'explore'
                  ? t(
                      '{0}, explore where your skills can take you across different AI futures.',
                      { 0: profile.name },
                    )
                  : view === 'pathway'
                    ? t(
                        'A practical route that respects your time, budget and the skills you already have.',
                      )
                    : view === 'team'
                      ? t(
                          'Connect individual growth to a thoughtful workforce learning plan.',
                        )
                      : view === 'impact'
                        ? t(
                            'Live checks of the targets in our proposal, recalculated by the same engine as your pathway.',
                          )
                        : view === 'evidence'
                          ? t(
                              'Every source has a date. Every assumption has an explanation.',
                            )
                          : t(
                              'Your skills, interests and constraints shape every recommendation.',
                            )}
              </p>
            </div>
            {view !== 'profile' && (
              <div className="scenario-box">
                <label id="scenario-label">
                  {t('EXPLORE AN AI FUTURE')} <Info size={13} />
                </label>
                <div
                  className="segmented"
                  role="group"
                  aria-labelledby="scenario-label"
                >
                  <button
                    aria-pressed={scenario === 'moderate'}
                    className={scenario === 'moderate' ? 'selected' : ''}
                    onClick={() => setScenario('moderate')}
                  >
                    {t('Moderate adoption')}{' '}
                  </button>
                  <button
                    aria-pressed={scenario === 'rapid'}
                    className={scenario === 'rapid' ? 'selected' : ''}
                    onClick={() => setScenario('rapid')}
                  >
                    <Sparkles size={13} />
                    {t('Rapid adoption')}{' '}
                  </button>
                </div>
                <small>
                  {t('Planning scenarios, not predictions.')}{' '}
                  <button onClick={() => navigate('evidence')}>
                    {t('See assumptions')} <ArrowUpRight size={11} />
                  </button>
                </small>
              </div>
            )}
          </div>
          {view !== 'profile' && (
            <div
              className={`evidence-strip ${snapshot.kind === 'simulation' ? 'simulated' : ''}`}
            >
              <span>
                <span className="strip-dot" />
                {snapshot.kind === 'simulation'
                  ? t('Simulated evidence')
                  : t('Public evidence')}
                <span className="strip-divider">/</span>
                {t(snapshot.label)}
                <span className="strip-date">
                  {' '}
                  ·{' '}
                  {new Date(snapshot.asOf).toLocaleDateString(
                    locale === 'en'
                      ? 'en-MY'
                      : locale === 'ms'
                        ? 'ms-MY'
                        : 'zh-CN',
                    {
                      timeZone: 'Asia/Kuala_Lumpur',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    },
                  )}
                </span>
              </span>
              <button onClick={() => navigate('evidence')}>
                {t('Inspect sources')} <ArrowRight size={13} />
              </button>
            </div>
          )}
          {view === 'explore' && (
            <>
              <div className="stats-grid">
                <div className="stat">
                  <Compass />
                  <span>{t('Career options')}</span>
                  <strong>
                    {matches.length}
                    <small>
                      {t(
                        customGoal
                          ? 'career routes to compare'
                          : 'sourced occupations',
                      )}
                    </small>
                  </strong>
                </div>
                <div className="stat">
                  <ShieldCheck />
                  <span>{t('Transferable strengths')}</span>
                  <strong>
                    {
                      Object.values(profile.skills).filter((v) => v && v > 0)
                        .length
                    }
                    <small>{t('skills to build on')}</small>
                  </strong>
                </div>
                <div className="stat">
                  <Clock3 />
                  <span>{t('Your learning rhythm')}</span>
                  <strong>
                    {profile.hours}
                    <small>{t('hours per week')}</small>
                  </strong>
                </div>
                <div className="stat">
                  <Wallet />
                  <span>{t('Your course budget')}</span>
                  <strong>
                    {t('RM')} {profile.budget}
                    <small>{t('over {0} weeks', { 0: profile.weeks })}</small>
                  </strong>
                </div>
              </div>
              <div className="explorer-grid">
                <RouteSummary
                  active={active}
                  matches={matches}
                  delta={
                    previous
                      ? (changes.find((change) => change.id === active.role.id)
                          ?.delta ?? 0)
                      : undefined
                  }
                  onSelect={chooseRole}
                  onExplain={() => setDetails(active)}
                />
                <section className="panel map-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">
                        {t('YOUR POSSIBILITIES, CONNECTED')}{' '}
                      </span>
                      <h2>{t('Your career constellation')}</h2>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => navigate('pathway')}
                      aria-label={t('Open full learning pathway')}
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                  <LearningMap
                    matches={matches}
                    shared={shared}
                    profile={profile}
                    selected={active.role.id}
                    onSelect={chooseRole}
                  />
                </section>
                <aside className="explorer-aside">
                  <section className="panel profile-card">
                    <div className="panel-heading">
                      <h2>{t('Your skills radar')}</h2>
                      <button
                        className="text-button"
                        onClick={() => navigate('profile')}
                      >
                        {t('Edit')} <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <Radar profile={profile} />
                    <div className="profile-card-footer">
                      <ProfileAvatar profile={profile} />
                      <div>
                        <strong>{profile.name}</strong>
                        <small>{t(profile.currentRole)}</small>
                      </div>
                    </div>
                    <p className="muted small">
                      {t('Self-reported levels · 0 to 3')}
                    </p>
                  </section>
                  <section className="next-step-card">
                    <span className="eyebrow">
                      <Sparkles size={13} />
                      {t('YOUR NEXT USEFUL STEP')}{' '}
                    </span>
                    <h3>
                      {plan.steps[0]?.course.title ??
                        t('Review your learning constraints')}
                    </h3>
                    <p>
                      {plan.steps.length
                        ? t('{0} study hours · {1}', {
                            0: plan.steps[0].course.hours,
                            1: plan.steps[0].course.provider,
                          })
                        : t(
                            'Try a longer horizon or inspect uncovered skills.',
                          )}
                    </p>
                    {plan.steps[0] && (
                      <CourseLink course={plan.steps[0].course} />
                    )}
                    <button onClick={() => navigate('pathway')}>
                      {t('See the learning plan')} <ArrowRight size={16} />
                    </button>
                  </section>
                  <div className="small-callout">
                    <ShieldCheck size={20} />
                    <p>
                      {t('Your experience stays valuable.')} <br />
                      <strong>
                        {t('We show the bridge, not a blank slate.')}
                      </strong>
                    </p>
                  </div>
                </aside>
                <RouteAnalytics
                  matches={matches}
                  plan={plan}
                  profile={profile}
                />
                <section className="career-section">
                  <div className="section-title">
                    <div>
                      <h2>{t('Where your skills could take you')}</h2>
                      <p className="muted">
                        {t(
                          'Ranked for your profile and the {0} adoption scenario.',
                          { 0: t(scenario) },
                        )}{' '}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll
                        ? t('Show top three')
                        : t('View all {0}', { 0: matches.length })}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {showAll && (
                    <label className="search-box">
                      <Search size={16} />
                      <input
                        aria-label={t('Search career options')}
                        placeholder={t('Find a career option…')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  )}
                  <div className="career-cards">
                    {visibleMatches.map((m, i) => (
                      <article
                        className={`career-card ${m.role.id === active.role.id ? 'is-selected' : ''}`}
                        key={m.role.id}
                      >
                        <div className="card-top">
                          <span
                            className="role-icon"
                            style={{
                              color: m.role.color,
                              background: m.role.color + '12',
                            }}
                          >
                            {m.role.family === 'sustainability' ? (
                              <Leaf size={19} />
                            ) : m.role.family === 'people' ? (
                              <Users size={19} />
                            ) : (
                              <GitBranch size={19} />
                            )}
                          </span>
                          <span className="rank">
                            {i === 0
                              ? t('TOP MATCH')
                              : t('OPTION {0}', { 0: i + 1 })}
                          </span>
                          <button
                            className="icon-button"
                            aria-label={t('Explain {0} score', {
                              0: roleLabel(m.role, t),
                            })}
                            onClick={() => setDetails(m)}
                          >
                            <Info size={16} />
                          </button>
                        </div>
                        <h3>{roleLabel(m.role, t)}</h3>
                        <p>
                          {m.role.custom
                            ? m.role.description
                            : t(m.role.description)}
                        </p>
                        <div className="match-score">
                          <strong>
                            {Math.round(m.score)}
                            <small>/100</small>
                          </strong>
                          <span>
                            {t('Suitability')}{' '}
                            <small>
                              {t('Skill match {0}%', {
                                0: Math.round(m.coverage),
                              })}
                            </small>
                          </span>
                          <svg viewBox="0 0 40 40" aria-hidden="true">
                            <circle cx="20" cy="20" r="16" />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              strokeDasharray={`${m.score} 100`}
                              pathLength="100"
                            />
                          </svg>
                        </div>
                        <div className="career-meta">
                          <span>
                            {t('{0} transferable skills', {
                              0: m.reused.length,
                            })}
                          </span>
                          <span>{t('{0} gaps', { 0: m.gaps.length })}</span>
                        </div>
                        <button
                          className={
                            m.role.id === active.role.id
                              ? 'primary full'
                              : 'secondary full'
                          }
                          onClick={() => {
                            chooseRole(m.role.id);
                            navigate('pathway');
                          }}
                        >
                          {t('Explore pathway')} <ArrowRight size={14} />
                        </button>
                      </article>
                    ))}
                  </div>
                  {visibleMatches.length === 0 && (
                    <div className="empty-state">
                      {t('No occupation matches that search.')}{' '}
                    </div>
                  )}
                </section>
              </div>
              <section className="update-banner">
                <div className="update-icon">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <span className="eyebrow">{t('BUILT TO ADAPT')}</span>
                  <h3>{t('What if the evidence changes?')}</h3>
                  <p>
                    {t(
                      'Try a newer demo snapshot and see exactly why the recommendations move.',
                    )}{' '}
                  </p>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    useSnapshot(
                      snapshot.id === updated.id ? baseline : updated,
                    );
                    navigate('evidence');
                  }}
                >
                  {t('Try the replanning demo')} <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {view === 'pathway' && (
            <>
              <CareerGoalPanel
                profile={profile}
                goal={customGoal}
                snapshot={snapshot}
                funding={funding}
                onApply={(goal) => {
                  setCustomGoal(goal);
                  setSelected('custom-goal');
                  setFollowTop(false);
                  setToast(
                    'Your custom goal is ready. Review the courses and any remaining gaps.',
                  );
                  requestAnimationFrame(() => {
                    const heading = document.getElementById('learning-courses');
                    heading?.focus({ preventScroll: true });
                    heading?.scrollIntoView({
                      block: 'start',
                      behavior: 'auto',
                    });
                  });
                }}
                onClear={() => {
                  setCustomGoal(null);
                  if (selected === 'custom-goal') {
                    setFollowTop(true);
                    setSelected(defaultRole);
                  }
                }}
              />
              <div className="pathway-toolbar">
                <label>
                  {t('Your destination')}{' '}
                  <select
                    value={active.role.id}
                    onChange={(e) => chooseRole(e.target.value)}
                  >
                    {matches.map((m) => (
                      <option key={m.role.id} value={m.role.id}>
                        {roleLabel(m.role, t)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('Course funding')}{' '}
                  <select
                    value={funding}
                    onChange={(e) =>
                      setFunding(e.target.value as typeof funding)
                    }
                  >
                    <option value="all">{t('All verified options')}</option>
                    <option value="free">{t('Verified free')}</option>
                    <option value="hrd">{t('Verified HRD Corp listed')}</option>
                  </select>
                </label>
                <button
                  className="secondary"
                  onClick={exportPlan}
                  disabled={exporting}
                  aria-busy={exporting}
                >
                  <Download size={16} />
                  {t(
                    exporting ? 'Preparing PDF…' : 'Export pathway (PDF)',
                  )}{' '}
                </button>
              </div>
              {exportError && (
                <p role="alert" className="notice">
                  {t('Could not download the PDF. Please try again.')}
                </p>
              )}
              <label className="checkbox-label follow-recommendation">
                <input
                  type="checkbox"
                  checked={followTop}
                  onChange={(e) => setFollowTop(e.target.checked)}
                />
                {t(
                  'Follow the leading recommendation as scenarios and evidence change',
                )}{' '}
              </label>
              <section className="panel map-panel">
                <LearningMap
                  matches={matches}
                  shared={shared}
                  profile={profile}
                  selected={active.role.id}
                  onSelect={chooseRole}
                />
              </section>
              <div className="pathway-grid">
                <section>
                  <SkillBridge profile={profile} role={active.role} />
                  <div className="section-title">
                    <div>
                      <span className="eyebrow">{t('YOUR CHOSEN ROUTE')}</span>
                      <h2 id="learning-courses" tabIndex={-1}>
                        {roleLabel(active.role, t)}
                      </h2>
                      <p className="muted">
                        {t(
                          '{0} planned hours · RM {1} in course fees · {2}-week horizon',
                          {
                            0: plan.totalHours,
                            1: plan.totalCost,
                            2: profile.weeks,
                          },
                        )}{' '}
                      </p>
                      <p className="muted small">
                        {t(
                          'Course coverage is a planning assumption. Study and assessment are needed to confirm proficiency.',
                        )}{' '}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setDetails(active)}
                    >
                      {t('Why this route?')} <Info size={15} />
                    </button>
                  </div>
                  {active.role.custom && customGoal && (
                    <div className="notice">
                      <strong>{t('Your custom learning destination')}</strong>
                      <p>
                        {t(
                          'Requirements are your reviewed planning targets. Scenario comparison uses an illustrative exposure of 0.5, not an occupation forecast.',
                        )}
                      </p>
                      {customGoal.otherSkills.length > 0 && (
                        <p>
                          {t('Other skills to investigate: {0}', {
                            0: customGoal.otherSkills.join(', '),
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  {funding === 'hrd' && (
                    <div className="notice">
                      {t(
                        'No HRD Corp programme has been verified in this starter catalogue yet. Use verified free options, or verify an individual programme before adding it. Provider registration alone does not guarantee claimability.',
                      )}{' '}
                      <External href="https://hrdcorp.gov.my/hrdcorp-claimable-courses">
                        {t('Check HRD Corp guidance')}{' '}
                      </External>
                    </div>
                  )}
                  {plan.steps.length > 0 && (
                    <p className="muted small">
                      {t(
                        'Each step links to the exact course on its provider’s website. Links open in a new tab.',
                      )}{' '}
                      {t(
                        'Optional YouTube videos give a quick overview and are not counted in planned hours.',
                      )}
                    </p>
                  )}
                  {plan.steps.map((step, i) => (
                    <article className="course-card" key={step.course.id}>
                      <div
                        className={`course-number ${step.shared ? 'shared' : ''}`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="course-content">
                        <div className="course-top">
                          <Tag tone={step.shared ? 'green' : 'blue'}>
                            {step.shared
                              ? t('Shared foundation')
                              : t('Career branch')}
                          </Tag>
                          <small>
                            {t('Week {0}{1}', {
                              0: step.startWeek,
                              1:
                                step.endWeek !== step.startWeek
                                  ? `–${step.endWeek}`
                                  : '',
                            })}
                          </small>
                        </div>
                        <h3>{step.course.title}</h3>
                        <p>
                          {t('{0} · {1} hours ( {2}) · RM {3}', {
                            0: step.course.provider,
                            1: step.course.hours,
                            2: t(step.course.durationKind),
                            3: step.course.fee,
                          })}
                        </p>
                        <div className="chips">
                          {step.course.skills.map((id) => (
                            <SkillChip key={id} id={id} />
                          ))}
                        </div>
                        <p className="muted small">{t(step.course.note)}</p>
                        <div className="course-bottom">
                          <CourseLink course={step.course} />
                          <button
                            className="text-button"
                            onClick={() => complete(step.course.id)}
                          >
                            <CheckCircle2 size={15} />
                            {t('Mark studied')}{' '}
                          </button>
                        </div>
                        <small className="verification">
                          <ShieldCheck size={12} />
                          {t('Source checked')} {step.course.checkedAt} ·{' '}
                          <a
                            href={sdgUrl('4.4')}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('SDG 4.4: relevant work skills')}{' '}
                          </a>
                        </small>
                      </div>
                    </article>
                  ))}
                  {!plan.steps.length && (
                    <div className="panel empty-state">
                      <BookOpen size={28} />
                      <h3>{t('No new course fits this selection.')}</h3>
                      <p>
                        {t(
                          'Review the available time, funding filter and gaps below. You may have already studied the relevant courses.',
                        )}{' '}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => navigate('profile')}
                      >
                        {t('Edit constraints')}{' '}
                      </button>
                    </div>
                  )}
                  {plan.completed.length > 0 && (
                    <section className="panel completed-panel">
                      <h3>{t('Learning you’re keeping')}</h3>
                      {plan.completed.map((c) => (
                        <div key={c.id}>
                          <div className="completed-course">
                            <span>
                              <CheckCircle2 size={16} />
                              {c.title}
                            </span>
                            <small>{c.provider}</small>
                            <CourseLink course={c} />
                          </div>
                          <button
                            className="text-button"
                            onClick={() => complete(c.id)}
                          >
                            {t('Undo')}{' '}
                          </button>
                        </div>
                      ))}
                      <p className="muted small">
                        {t(
                          'Marked studied in this browser. Your assessed skill levels do not change automatically.',
                        )}{' '}
                      </p>
                    </section>
                  )}
                  {plan.uncovered.length > 0 && (
                    <section className="panel gap-panel">
                      <h3>{t('A useful start, with gaps still to cover.')}</h3>
                      <p>
                        {t(
                          'These needs do not fit the available time, prerequisites or verified catalogue. Finishing the plan does not establish full role readiness.',
                        )}{' '}
                      </p>
                      <div className="chips">
                        {plan.uncovered.map((id) => (
                          <SkillChip key={id} id={id} />
                        ))}
                      </div>
                    </section>
                  )}
                </section>
                <aside>
                  <section className="panel">
                    <span className="eyebrow">
                      {t('MAKE ROOM FOR LEARNING')}
                    </span>
                    <h2>{t('Your weekly rhythm')}</h2>
                    <p className="muted">
                      {t('Maximum {0} hours each week.', {
                        0: profile.hours,
                      })}{' '}
                    </p>
                    <div className="weekly-chart">
                      {Array.from(
                        { length: Math.min(profile.weeks, 12) },
                        (_, i) => {
                          const w = plan.weeks[i];
                          return (
                            <div key={i}>
                              <span>{t('W{0}', { 0: i + 1 })}</span>
                              <div className="bar">
                                <i
                                  style={{
                                    width: `${profile.hours ? ((w?.hours ?? 0) / profile.hours) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <b>{t('{0} h', { 0: w?.hours ?? 0 })}</b>
                            </div>
                          );
                        },
                      )}
                    </div>
                    {profile.weeks > 12 && (
                      <p className="muted small">
                        {t(
                          'First 12 weeks shown. Export includes the full schedule.',
                        )}{' '}
                      </p>
                    )}
                    <div className="section-divider" />
                    <div className="budget-line">
                      <span>{t('Course fees')}</span>
                      <strong>{t('RM {0}', { 0: plan.totalCost })}</strong>
                    </div>
                    <div className="budget-line">
                      <span>{t('Available budget')}</span>
                      <strong>{t('RM {0}', { 0: profile.budget })}</strong>
                    </div>
                    <p className="muted small">
                      {t(
                        'Device, software, data and staff-time costs are separate.',
                      )}{' '}
                    </p>
                  </section>
                  <StudyRhythm
                    profile={profile}
                    onEdit={() => navigate('profile')}
                  />
                  <section className="panel qualification-panel">
                    <GraduationCap size={23} />
                    <h3>{t('Keep the destination realistic')}</h3>
                    <p>{t(active.role.entry)}</p>
                    {active.role.source && (
                      <External href={active.role.source}>
                        {t('Explore role requirements')}{' '}
                      </External>
                    )}
                  </section>
                  {previous && (
                    <section className="panel">
                      <h3>{t('Your plan can adapt')}</h3>
                      <p>
                        {t(
                          '{0} occupation scores changed after the latest snapshot. Completed learning was retained. Manually chosen destinations stay pinned.',
                          { 0: changes.length },
                        )}{' '}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate('evidence')}
                      >
                        {t('Inspect the changes')} <ArrowRight size={14} />
                      </button>
                    </section>
                  )}
                </aside>
              </div>
            </>
          )}
          {view === 'team' && (
            <EmployerPanel
              profile={profile}
              scenario={scenario}
              snapshot={snapshot}
              workforce={workforce}
              onChange={setWorkforce}
              onProfileChange={(member) => {
                if (member.id === profile.id) saveProfile(member);
              }}
            />
          )}
          {view === 'impact' && (
            <ImpactScorecard
              profile={profile}
              scenario={scenario}
              snapshot={snapshot}
              active={active}
              shared={shared}
              plan={plan}
              workforce={workforce}
            />
          )}
          {view === 'evidence' && (
            <EvidencePanel
              profile={profile}
              scenario={scenario}
              snapshot={snapshot}
              previous={previous}
              busy={busy}
              onRefresh={refresh}
              onReplay={() => useSnapshot(updated)}
              onBaseline={() => useSnapshot(baseline)}
              onApply={useSnapshot}
              candidates={candidates}
            />
          )}
          {view === 'profile' && (
            <ProfilePanel
              profile={profile}
              profiles={getWorkforceMembers(workforce, profile)}
              onSave={(p) => {
                saveProfile(p);
                const keepCustom =
                  selected === 'custom-goal' &&
                  customGoal !== null &&
                  !followTop;
                setFollowTop(!keepCustom);
                setSelected(
                  keepCustom
                    ? 'custom-goal'
                    : rankRoles(p, scenario, snapshot, candidates)[0].role.id,
                );
                setToast(
                  'Profile updated. Your pathways now reflect these skills and constraints.',
                );
                navigate('explore');
              }}
            />
          )}
          <footer className="app-footer">
            <span>
              <GitBranch size={15} />
              {t('ArcTalent · Skills that travel with you.')}{' '}
            </span>
            <span>
              {t(
                'Synthetic profiles · Human decisions · Evidence you can inspect',
              )}{' '}
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{t(toast)}</span>
          <button
            className="icon-button"
            aria-label={t('Dismiss notification')}
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <CareerChat
        customGoal={customGoal}
        funding={funding}
        context={{
          profile,
          scenario,
          snapshot,
          active,
          plan,
          shared,
          workforce,
          candidates,
        }}
        onNavigate={navigate}
      />
      {details && (
        <Modal
          title={roleLabel(details.role, t)}
          onClose={() => setDetails(null)}
        >
          <MatchDetails match={details} />
        </Modal>
      )}
      {settingsOpen && (
        <SettingsPanel
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onEditProfile={() => {
            setSettingsOpen(false);
            navigate('profile');
          }}
          onExport={exportPlan}
          exporting={exporting}
          exportError={exportError}
          onReset={reset}
        />
      )}
    </div>
  );
}
