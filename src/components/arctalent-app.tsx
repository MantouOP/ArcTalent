'use client';
import './worker-journey.css';
import './orion.css';
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
  Globe,
  GraduationCap,
  Info,
  Leaf,
  Map,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { baseline, baseProfile, roles, sdgUrl, updated } from '@/lib/catalogue';
import {
  buildPlan,
  diffSnapshots,
  MODEL_VERSION,
  rankRoles,
  sharedFoundation,
} from '@/lib/engine';
import {
  LANGUAGES,
  LanguageProvider,
  useLanguage,
  type Language,
} from '@/lib/i18n';
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
import { SkillBridge } from './skill-bridge';
import { StudyRhythm } from './study-rhythm';
import { RouteSummary, RouteAnalytics } from './command-overview';
import { buildSkillBridge } from '@/lib/skill-bridge';
import { buildStudyRhythm } from '@/lib/learning-preferences';
import {
  restoreWorkforceSettings,
  type WorkforceSettings,
} from '@/lib/workforce-settings';

type View = 'explore' | 'pathway' | 'team' | 'evidence' | 'profile';

const defaultRole = rankRoles(baseProfile, 'moderate', baseline)[0].role.id;

export function ArcTalentApp() {
  return (
    <LanguageProvider>
      <ArcTalentWorkspace />
    </LanguageProvider>
  );
}

function ArcTalentWorkspace() {
  const {
    lang,
    setLang,
    dateLocale,
    t,
    roleText,
    courseText,
    snapshotText,
    translateCurrentRole,
  } = useLanguage();
  const [view, setView] = useState<View>('explore'),
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

  const navigation = [
    { id: 'explore' as const, label: t.nav.explore, icon: Compass },
    { id: 'pathway' as const, label: t.nav.pathway, icon: Map },
    { id: 'team' as const, label: t.nav.team, icon: Users },
    { id: 'evidence' as const, label: t.nav.evidence, icon: FlaskConical },
    { id: 'profile' as const, label: t.nav.profile, icon: UserRound },
  ];

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
        if (roles.some((r) => r.id === saved.selected))
          setSelected(saved.selected);
        if (typeof saved.followTop === 'boolean') setFollowTop(saved.followTop);
        setWorkforce(restoreWorkforceSettings(saved.workforce));
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
          }),
        );
      } catch {
        /* Storage is optional. */
      }
  }, [ready, profile, scenario, snapshot, selected, followTop, workforce]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  const matches = useMemo(
    () => rankRoles(profile, scenario, snapshot),
    [profile, scenario, snapshot],
  );
  const shared = useMemo(
    () => sharedFoundation(profile, snapshot),
    [profile, snapshot],
  );
  const active = followTop
    ? matches[0]
    : (matches.find((m) => m.role.id === selected) ?? matches[0]);
  const activeRole = roleText(active.role);
  const plan = useMemo(
    () => buildPlan(profile, active.role, shared, funding),
    [profile, active.role, shared, funding],
  );
  const changes = previous
    ? diffSnapshots(profile, scenario, previous, snapshot).filter(
        (c) => c.delta !== 0,
      )
    : [];
  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function useSnapshot(next: Snapshot) {
    revision.current++;
    setBusy(false);
    if (next.id === snapshot.id) {
      setToast(t.toasts.snapshotActive);
      return;
    }
    setPrevious(snapshot);
    setSnapshot(next);
    setToast(t.toasts.snapshotApplied(next.kind === 'simulation'));
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
        setToast(e instanceof Error ? e.message : t.toasts.refreshFailed);
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
    setView('explore');
    setToast(t.toasts.demoReset);
  }
  function complete(id: string) {
    setProfile((p) => ({
      ...p,
      completed: p.completed.includes(id)
        ? p.completed.filter((x) => x !== id)
        : [...p.completed, id],
    }));
    setToast(t.toasts.learningUpdated);
  }
  function exportPlan() {
    downloadFile(
      'ArcTalent-learning-plan.json',
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          synthetic: true,
          modelVersion: MODEL_VERSION,
          profile,
          scenario,
          snapshot,
          role: active.role,
          skillBridge: buildSkillBridge(profile, active.role),
          studyRhythm: profile.learningPreferences
            ? buildStudyRhythm(
                profile.hours,
                profile.learningPreferences.sessionMinutes,
              )
            : null,
          plan,
        },
        null,
        2,
      ),
    );
  }
  const visibleMatches = matches
    .filter((m) => {
      const q = query.toLowerCase();
      const loc = roleText(m.role);
      return (
        m.role.title.toLowerCase().includes(q) ||
        loc.title.toLowerCase().includes(q) ||
        loc.shortTitle.toLowerCase().includes(q)
      );
    })
    .slice(0, showAll ? 6 : 3);
  const firstStepCourse = plan.steps[0]
    ? courseText(plan.steps[0].course)
    : null;
  const snapMeta = snapshotText(snapshot);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {t.skipToContent}
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('explore');
          }}
          aria-label={t.homeAria}
        >
          <span className="brand-icon">
            <GitBranch size={24} />
          </span>
          <span className="brand-wordmark">
            Arc<span className="brand-light">Talent</span>
            <small>{t.brandTagline}</small>
          </span>
        </a>
        <div className="workspace-label">{t.yourWorkspace}</div>
        <nav aria-label={t.mainNavAria}>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? 'active' : ''}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              title={item.label}
              aria-label={item.label}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {view === item.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <button
            onClick={() => navigate('pathway')}
            title={t.explorePathwayAria}
            aria-label={t.explorePathwayAria}
          >
            <Sparkles size={20} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="tiny-leaf">
            <Leaf size={17} />
          </span>
          <span>
            {t.inclusiveFuture1}
            <br />
            <b>{t.inclusiveFuture2}</b>
          </span>
        </div>
        <div
          className="sidebar-user"
          title={`${profile.name} · ${t.syntheticDemoProfile}`}
        >
          <span className="avatar">{profile.name.slice(0, 1)}</span>
          <div>
            <strong>{profile.name}</strong>
            <small>{t.syntheticDemoProfile}</small>
          </div>
          <button
            onClick={() => navigate('profile')}
            className="icon-button"
            aria-label={t.editProfileAria}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="topbar-brand">
              ArcTalent
              <span className="product-label">{t.workspaceBreadcrumb}</span>
            </span>
            <ChevronRight size={13} />
            <strong>{navigation.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-indicator">
              <i />
              {t.hackathonPrototype}
            </span>
            <label className="lang-switcher" title={t.languageLabel}>
              <Globe size={14} />
              <select
                aria-label={t.languageLabel}
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={15} />
              {t.resetDemo}
            </button>
            <button
              className="avatar small-avatar"
              aria-label={t.openProfileAria}
              onClick={() => navigate('profile')}
            >
              {profile.name.slice(0, 1)}
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                {view === 'team'
                  ? t.eyebrow.team
                  : view === 'profile'
                    ? t.eyebrow.profile
                    : t.eyebrow.default}
              </span>
              <h1>{t.pageTitle[view]}</h1>
              <p>
                {view === 'explore'
                  ? t.pageDesc.explore(profile.name)
                  : t.pageDesc[view]}
              </p>
            </div>
            {view !== 'profile' && (
              <div className="scenario-box">
                <label id="scenario-label">
                  {t.exploreAiFuture}
                  <Info size={13} />
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
                    {t.moderateAdoption}
                  </button>
                  <button
                    aria-pressed={scenario === 'rapid'}
                    className={scenario === 'rapid' ? 'selected' : ''}
                    onClick={() => setScenario('rapid')}
                  >
                    <Sparkles size={13} />
                    {t.rapidAdoption}
                  </button>
                </div>
                <small>
                  {t.planningScenariosNote}
                  <button onClick={() => navigate('evidence')}>
                    {t.seeAssumptions} <ArrowUpRight size={11} />
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
                  ? t.simulatedEvidence
                  : t.publicEvidence}
                <span className="strip-divider">/</span>
                {snapMeta.label}
                <span className="strip-date">
                  {' '}
                  ·{' '}
                  {new Date(snapshot.asOf).toLocaleDateString(dateLocale, {
                    timeZone: 'Asia/Kuala_Lumpur',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <button onClick={() => navigate('evidence')}>
                {t.inspectSources}
                <ArrowRight size={13} />
              </button>
            </div>
          )}
          {view === 'explore' && (
            <>
              <div className="stats-grid">
                <div className="stat">
                  <Compass />
                  <span>{t.stats.careerOptions}</span>
                  <strong>
                    {roles.length}
                    <small>{t.stats.sourcedOccupations}</small>
                  </strong>
                </div>
                <div className="stat">
                  <ShieldCheck />
                  <span>{t.stats.transferableStrengths}</span>
                  <strong>
                    {
                      Object.values(profile.skills).filter((v) => v && v > 0)
                        .length
                    }
                    <small>{t.stats.skillsToBuildOn}</small>
                  </strong>
                </div>
                <div className="stat">
                  <Clock3 />
                  <span>{t.stats.learningRhythm}</span>
                  <strong>
                    {profile.hours}
                    <small>{t.stats.hoursPerWeek}</small>
                  </strong>
                </div>
                <div className="stat">
                  <Wallet />
                  <span>{t.stats.courseBudget}</span>
                  <strong>
                    RM {profile.budget}
                    <small>{t.stats.overWeeks(profile.weeks)}</small>
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
                        {t.possibilitiesConnected}
                      </span>
                      <h2>{t.careerConstellation}</h2>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => navigate('pathway')}
                      aria-label={t.openFullPathwayAria}
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
                      <h2>{t.yourSkillsRadar}</h2>
                      <button
                        className="text-button"
                        onClick={() => navigate('profile')}
                      >
                        {t.edit}
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <Radar profile={profile} />
                    <div className="profile-card-footer">
                      <span className="avatar">{profile.name.slice(0, 1)}</span>
                      <div>
                        <strong>{profile.name}</strong>
                        <small>
                          {translateCurrentRole(profile.currentRole)}
                        </small>
                      </div>
                    </div>
                    <p className="muted small">{t.selfReportedLevels}</p>
                  </section>
                  <section className="next-step-card">
                    <span className="eyebrow">
                      <Sparkles size={13} />
                      {t.nextUsefulStep}
                    </span>
                    <h3>
                      {firstStepCourse?.title ?? t.reviewConstraintsFallback}
                    </h3>
                    <p>
                      {firstStepCourse
                        ? t.studyHoursProvider(
                            firstStepCourse.hours,
                            firstStepCourse.provider,
                          )
                        : t.tryLongerHorizon}
                    </p>
                    <button onClick={() => navigate('pathway')}>
                      {t.seeLearningPlan}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  <div className="small-callout">
                    <ShieldCheck size={20} />
                    <p>
                      {t.experienceValuable}
                      <br />
                      <strong>{t.showTheBridge}</strong>
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
                      <h2>{t.whereSkillsTakeYou}</h2>
                      <p className="muted">{t.rankedForScenario(scenario)}</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? t.showTopThree : t.viewAllSix}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {showAll && (
                    <label className="search-box">
                      <Search size={16} />
                      <input
                        aria-label={t.searchCareerAria}
                        placeholder={t.searchCareerPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  )}
                  <div className="career-cards">
                    {visibleMatches.map((m, i) => {
                      const locRole = roleText(m.role);
                      return (
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
                              {i === 0 ? t.topMatch : t.optionRank(i + 1)}
                            </span>
                            <button
                              className="icon-button"
                              aria-label={t.explainScoreAria(locRole.title)}
                              onClick={() => setDetails(m)}
                            >
                              <Info size={16} />
                            </button>
                          </div>
                          <h3>{locRole.title}</h3>
                          <p>{locRole.description}</p>
                          <div className="match-score">
                            <strong>
                              {Math.round(m.score)}
                              <small>/100</small>
                            </strong>
                            <span>
                              {t.suitability}
                              <small>
                                {t.skillMatchPct(Math.round(m.coverage))}
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
                              {t.transferableSkillsCount(m.reused.length)}
                            </span>
                            <span>{t.gapsCount(m.gaps.length)}</span>
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
                            {t.explorePathwayBtn}
                            <ArrowRight size={14} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  {visibleMatches.length === 0 && (
                    <div className="empty-state">{t.noOccupationMatch}</div>
                  )}
                </section>
              </div>
              <section className="update-banner">
                <div className="update-icon">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <span className="eyebrow">{t.builtToAdapt}</span>
                  <h3>{t.whatIfEvidenceChanges}</h3>
                  <p>{t.tryNewerSnapshotDesc}</p>
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
                  {t.tryReplanningDemo}
                  <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {view === 'pathway' && (
            <>
              <div className="pathway-toolbar">
                <label>
                  {t.yourDestination}
                  <select
                    value={active.role.id}
                    onChange={(e) => chooseRole(e.target.value)}
                  >
                    {matches.map((m) => (
                      <option key={m.role.id} value={m.role.id}>
                        {roleText(m.role).title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.courseFunding}
                  <select
                    value={funding}
                    onChange={(e) =>
                      setFunding(e.target.value as typeof funding)
                    }
                  >
                    <option value="all">{t.fundingAll}</option>
                    <option value="free">{t.fundingFree}</option>
                    <option value="hrd">{t.fundingHrd}</option>
                  </select>
                </label>
                <button className="secondary" onClick={exportPlan}>
                  <Download size={16} />
                  {t.exportPathway}
                </button>
              </div>
              <label className="checkbox-label follow-recommendation">
                <input
                  type="checkbox"
                  checked={followTop}
                  onChange={(e) => setFollowTop(e.target.checked)}
                />
                {t.followRecommendation}
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
                      <span className="eyebrow">{t.yourChosenRoute}</span>
                      <h2>{activeRole.title}</h2>
                      <p className="muted">
                        {t.routeMetricsSummary(
                          plan.totalHours,
                          plan.totalCost,
                          profile.weeks,
                        )}
                      </p>
                      <p className="muted small">
                        {t.courseCoverageAssumption}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setDetails(active)}
                    >
                      {t.whyThisRoute}
                      <Info size={15} />
                    </button>
                  </div>
                  {funding === 'hrd' && (
                    <div className="notice">
                      {t.hrdNotice}{' '}
                      <External href="https://hrdcorp.gov.my/hrdcorp-claimable-courses">
                        {t.checkHrdGuidance}
                      </External>
                    </div>
                  )}
                  {plan.steps.map((step, i) => {
                    const c = courseText(step.course);
                    return (
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
                                ? t.sharedFoundationTag
                                : t.careerBranchTag}
                            </Tag>
                            <small>
                              {t.weekRange(step.startWeek, step.endWeek)}
                            </small>
                          </div>
                          <h3>{c.title}</h3>
                          <p>
                            {c.provider} · {c.hours} {t.hoursLabel} (
                            {t.durationKind[c.durationKind]}) · RM {c.fee}
                          </p>
                          <div className="chips">
                            {c.skills.map((id) => (
                              <SkillChip key={id} id={id} />
                            ))}
                          </div>
                          <p className="muted small">{c.note}</p>
                          <div className="course-bottom">
                            <External href={c.url}>
                              {t.openLearningResource}
                            </External>
                            <button
                              className="text-button"
                              onClick={() => complete(c.id)}
                            >
                              <CheckCircle2 size={15} />
                              {t.markStudied}
                            </button>
                          </div>
                          <small className="verification">
                            <ShieldCheck size={12} />
                            {t.sourceChecked(c.checkedAt)} ·{' '}
                            <a
                              href={sdgUrl('4.4')}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t.sdg44Label}
                            </a>
                          </small>
                        </div>
                      </article>
                    );
                  })}
                  {!plan.steps.length && (
                    <div className="panel empty-state">
                      <BookOpen size={28} />
                      <h3>{t.noNewCourseFits}</h3>
                      <p>{t.noNewCourseDesc}</p>
                      <button
                        className="secondary"
                        onClick={() => navigate('profile')}
                      >
                        {t.editConstraints}
                      </button>
                    </div>
                  )}
                  {plan.completed.length > 0 && (
                    <section className="panel completed-panel">
                      <h3>{t.learningKeeping}</h3>
                      {plan.completed.map((c) => (
                        <div key={c.id}>
                          <span>
                            <CheckCircle2 size={16} />
                            {courseText(c).title}
                          </span>
                          <button
                            className="text-button"
                            onClick={() => complete(c.id)}
                          >
                            {t.undo}
                          </button>
                        </div>
                      ))}
                      <p className="muted small">{t.markedStudiedNote}</p>
                    </section>
                  )}
                  {plan.uncovered.length > 0 && (
                    <section className="panel gap-panel">
                      <h3>{t.usefulStartGaps}</h3>
                      <p>{t.uncoveredGapsDesc}</p>
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
                    <span className="eyebrow">{t.makeRoomForLearning}</span>
                    <h2>{t.yourWeeklyRhythm}</h2>
                    <p className="muted">
                      {t.maxHoursPerWeek(profile.hours)}
                    </p>
                    <div className="weekly-chart">
                      {Array.from(
                        { length: Math.min(profile.weeks, 12) },
                        (_, i) => {
                          const w = plan.weeks[i];
                          return (
                            <div key={i}>
                              <span>W{i + 1}</span>
                              <div className="bar">
                                <i
                                  style={{
                                    width: `${profile.hours ? ((w?.hours ?? 0) / profile.hours) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <b>{w?.hours ?? 0} h</b>
                            </div>
                          );
                        },
                      )}
                    </div>
                    {profile.weeks > 12 && (
                      <p className="muted small">{t.first12WeeksShown}</p>
                    )}
                    <div className="section-divider" />
                    <div className="budget-line">
                      <span>{t.courseFees}</span>
                      <strong>RM {plan.totalCost}</strong>
                    </div>
                    <div className="budget-line">
                      <span>{t.availableBudget}</span>
                      <strong>RM {profile.budget}</strong>
                    </div>
                    <p className="muted small">{t.separateCostsNote}</p>
                  </section>
                  <StudyRhythm
                    profile={profile}
                    onEdit={() => navigate('profile')}
                  />
                  <section className="panel qualification-panel">
                    <GraduationCap size={23} />
                    <h3>{t.keepDestinationRealistic}</h3>
                    <p>{activeRole.entry}</p>
                    <External href={activeRole.source}>
                      {t.exploreRoleRequirements}
                    </External>
                  </section>
                  {previous && (
                    <section className="panel">
                      <h3>{t.yourPlanCanAdapt}</h3>
                      <p>{t.planAdaptDesc(changes.length)}</p>
                      <button
                        className="text-button"
                        onClick={() => navigate('evidence')}
                      >
                        {t.inspectChanges}
                        <ArrowRight size={14} />
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
            />
          )}
          {view === 'profile' && (
            <ProfilePanel
              profile={profile}
              onSave={(p) => {
                setProfile(p);
                setFollowTop(true);
                setSelected(rankRoles(p, scenario, snapshot)[0].role.id);
                setToast(t.toasts.profileUpdated);
                navigate('explore');
              }}
            />
          )}
          <footer className="app-footer">
            <span>
              <GitBranch size={15} />
              {t.footerTagline}
            </span>
            <span>{t.footerSub}</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label={t.dismissNotificationAria}
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {details && (
        <Modal
          title={roleText(details.role).title}
          onClose={() => setDetails(null)}
        >
          <MatchDetails match={details} />
        </Modal>
      )}
    </div>
  );
}
