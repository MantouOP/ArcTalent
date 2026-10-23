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
type View = 'explore' | 'pathway' | 'team' | 'evidence' | 'profile';
const navigation = [
  { id: 'explore' as const, label: 'Career explorer', icon: Compass },
  { id: 'pathway' as const, label: 'My learning pathway', icon: Map },
  { id: 'team' as const, label: 'SME workspace', icon: Users },
  { id: 'evidence' as const, label: 'Evidence lab', icon: FlaskConical },
  { id: 'profile' as const, label: 'My skills & profile', icon: UserRound },
];
const defaultRole = rankRoles(baseProfile, 'moderate', baseline)[0].role.id;
export function ArcTalentApp() {
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
          JSON.stringify({ profile, scenario, snapshot, selected, followTop }),
        );
      } catch {
        /* Storage is optional. */
      }
  }, [ready, profile, scenario, snapshot, selected, followTop]);
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
    setFunding('all');
    setView('explore');
    setToast('Demo reset to Aina’s starting profile.');
  }
  function complete(id: string) {
    setProfile((p) => ({
      ...p,
      completed: p.completed.includes(id)
        ? p.completed.filter((x) => x !== id)
        : [...p.completed, id],
    }));
    setToast(
      'Learning activity updated. Skill proficiency stays unchanged until you review it in your profile.',
    );
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
    .filter((m) => m.role.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, showAll ? 6 : 3);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('explore');
          }}
          aria-label="ArcTalent home"
        >
          <span className="brand-icon">
            <GitBranch size={24} />
          </span>
          <span className="brand-wordmark">
            Arc<span className="brand-light">Talent</span>
            <small>BUILD YOUR NEXT CHAPTER</small>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
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
            title="Explore your pathway"
            aria-label="Explore your pathway"
          >
            <Sparkles size={20} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="tiny-leaf">
            <Leaf size={17} />
          </span>
          <span>
            Built for a more
            <br />
            <b>inclusive future of work.</b>
          </span>
        </div>
        <div
          className="sidebar-user"
          title={`${profile.name} · Synthetic demo profile`}
        >
          <span className="avatar">{profile.name.slice(0, 1)}</span>
          <div>
            <strong>{profile.name}</strong>
            <small>Synthetic demo profile</small>
          </div>
          <button
            onClick={() => navigate('profile')}
            className="icon-button"
            aria-label="Edit profile"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="topbar-brand">
              ArcTalent<span className="product-label"> / WORKSPACE</span>
            </span>
            <ChevronRight size={13} />
            <strong>{navigation.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-indicator">
              <i />
              Hackathon prototype
            </span>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={15} />
              Reset demo
            </button>
            <button
              className="avatar small-avatar"
              aria-label="Open my profile"
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
                  ? 'GROW YOUR PEOPLE, TOGETHER'
                  : view === 'profile'
                    ? 'YOUR EXPERIENCE IS A HEAD START'
                    : 'A LITTLE CLARITY FOR WHAT COMES NEXT'}
              </span>
              <h1>
                {view === 'explore' ? (
                  <>Career command center</>
                ) : view === 'pathway' ? (
                  'Your learning pathway'
                ) : view === 'team' ? (
                  'Workforce command center'
                ) : view === 'evidence' ? (
                  'Evidence intelligence'
                ) : (
                  'Your skills & profile'
                )}
              </h1>
              <p>
                {view === 'explore'
                  ? `${profile.name}, explore where your skills can take you across different AI futures.`
                  : view === 'pathway'
                    ? 'A practical route that respects your time, budget and the skills you already have.'
                    : view === 'team'
                      ? 'Connect individual growth to a thoughtful workforce learning plan.'
                      : view === 'evidence'
                        ? 'Every source has a date. Every assumption has an explanation.'
                        : 'Your skills, interests and constraints shape every recommendation.'}
              </p>
            </div>
            {view !== 'profile' && (
              <div className="scenario-box">
                <label id="scenario-label">
                  EXPLORE AN AI FUTURE
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
                    Moderate adoption
                  </button>
                  <button
                    aria-pressed={scenario === 'rapid'}
                    className={scenario === 'rapid' ? 'selected' : ''}
                    onClick={() => setScenario('rapid')}
                  >
                    <Sparkles size={13} />
                    Rapid adoption
                  </button>
                </div>
                <small>
                  Planning scenarios, not predictions.
                  <button onClick={() => navigate('evidence')}>
                    See assumptions <ArrowUpRight size={11} />
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
                  ? 'Simulated evidence'
                  : 'Public evidence'}
                <span className="strip-divider">/</span>
                {snapshot.label}
                <span className="strip-date">
                  {' '}
                  ·{' '}
                  {new Date(snapshot.asOf).toLocaleDateString('en-MY', {
                    timeZone: 'Asia/Kuala_Lumpur',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <button onClick={() => navigate('evidence')}>
                Inspect sources
                <ArrowRight size={13} />
              </button>
            </div>
          )}
          {view === 'explore' && (
            <>
              <div className="stats-grid">
                <div className="stat">
                  <Compass />
                  <span>Career options</span>
                  <strong>
                    {roles.length}
                    <small>sourced occupations</small>
                  </strong>
                </div>
                <div className="stat">
                  <ShieldCheck />
                  <span>Transferable strengths</span>
                  <strong>
                    {
                      Object.values(profile.skills).filter((v) => v && v > 0)
                        .length
                    }
                    <small>skills to build on</small>
                  </strong>
                </div>
                <div className="stat">
                  <Clock3 />
                  <span>Your learning rhythm</span>
                  <strong>
                    {profile.hours}
                    <small>hours per week</small>
                  </strong>
                </div>
                <div className="stat">
                  <Wallet />
                  <span>Your course budget</span>
                  <strong>
                    RM {profile.budget}
                    <small>over {profile.weeks} weeks</small>
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
                        YOUR POSSIBILITIES, CONNECTED
                      </span>
                      <h2>Your career constellation</h2>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => navigate('pathway')}
                      aria-label="Open full learning pathway"
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
                      <h2>Your skills radar</h2>
                      <button
                        className="text-button"
                        onClick={() => navigate('profile')}
                      >
                        Edit
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <Radar profile={profile} />
                    <div className="profile-card-footer">
                      <span className="avatar">{profile.name.slice(0, 1)}</span>
                      <div>
                        <strong>{profile.name}</strong>
                        <small>{profile.currentRole}</small>
                      </div>
                    </div>
                    <p className="muted small">Self-reported levels · 0 to 3</p>
                  </section>
                  <section className="next-step-card">
                    <span className="eyebrow">
                      <Sparkles size={13} />
                      YOUR NEXT USEFUL STEP
                    </span>
                    <h3>
                      {plan.steps[0]?.course.title ??
                        'Review your learning constraints'}
                    </h3>
                    <p>
                      {plan.steps.length
                        ? `${plan.steps[0].course.hours} study hours · ${plan.steps[0].course.provider}`
                        : 'Try a longer horizon or inspect uncovered skills.'}
                    </p>
                    <button onClick={() => navigate('pathway')}>
                      See the learning plan
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  <div className="small-callout">
                    <ShieldCheck size={20} />
                    <p>
                      Your experience stays valuable.
                      <br />
                      <strong>We show the bridge, not a blank slate.</strong>
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
                      <h2>Where your skills could take you</h2>
                      <p className="muted">
                        Ranked for your profile and the {scenario} adoption
                        scenario.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'Show top three' : 'View all six'}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {showAll && (
                    <label className="search-box">
                      <Search size={16} />
                      <input
                        aria-label="Search career options"
                        placeholder="Find a career option…"
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
                            {i === 0 ? 'TOP MATCH' : `OPTION ${i + 1}`}
                          </span>
                          <button
                            className="icon-button"
                            aria-label={`Explain ${m.role.title} score`}
                            onClick={() => setDetails(m)}
                          >
                            <Info size={16} />
                          </button>
                        </div>
                        <h3>{m.role.title}</h3>
                        <p>{m.role.description}</p>
                        <div className="match-score">
                          <strong>
                            {Math.round(m.score)}
                            <small>/100</small>
                          </strong>
                          <span>
                            Suitability
                            <small>Skill match {Math.round(m.coverage)}%</small>
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
                          <span>{m.reused.length} transferable skills</span>
                          <span>{m.gaps.length} gaps</span>
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
                          Explore pathway
                          <ArrowRight size={14} />
                        </button>
                      </article>
                    ))}
                  </div>
                  {visibleMatches.length === 0 && (
                    <div className="empty-state">
                      No occupation matches that search.
                    </div>
                  )}
                </section>
              </div>
              <section className="update-banner">
                <div className="update-icon">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <span className="eyebrow">BUILT TO ADAPT</span>
                  <h3>What if the evidence changes?</h3>
                  <p>
                    Try a newer demo snapshot and see exactly why the
                    recommendations move.
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
                  Try the replanning demo
                  <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {view === 'pathway' && (
            <>
              <div className="pathway-toolbar">
                <label>
                  Your destination
                  <select
                    value={active.role.id}
                    onChange={(e) => chooseRole(e.target.value)}
                  >
                    {matches.map((m) => (
                      <option key={m.role.id} value={m.role.id}>
                        {m.role.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Course funding
                  <select
                    value={funding}
                    onChange={(e) =>
                      setFunding(e.target.value as typeof funding)
                    }
                  >
                    <option value="all">All verified options</option>
                    <option value="free">Verified free</option>
                    <option value="hrd">Verified HRD Corp listed</option>
                  </select>
                </label>
                <button className="secondary" onClick={exportPlan}>
                  <Download size={16} />
                  Export pathway
                </button>
              </div>
              <label className="checkbox-label follow-recommendation">
                <input
                  type="checkbox"
                  checked={followTop}
                  onChange={(e) => setFollowTop(e.target.checked)}
                />
                Follow the leading recommendation as scenarios and evidence
                change
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
                      <span className="eyebrow">YOUR CHOSEN ROUTE</span>
                      <h2>{active.role.title}</h2>
                      <p className="muted">
                        {plan.totalHours} planned hours · RM {plan.totalCost} in
                        course fees · {profile.weeks}-week horizon
                      </p>
                      <p className="muted small">
                        Course coverage is a planning assumption. Study and
                        assessment are needed to confirm proficiency.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setDetails(active)}
                    >
                      Why this route?
                      <Info size={15} />
                    </button>
                  </div>
                  {funding === 'hrd' && (
                    <div className="notice">
                      No HRD Corp programme has been verified in this starter
                      catalogue yet. Use verified free options, or verify an
                      individual programme before adding it. Provider
                      registration alone does not guarantee claimability.{' '}
                      <External href="https://hrdcorp.gov.my/hrdcorp-claimable-courses">
                        Check HRD Corp guidance
                      </External>
                    </div>
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
                              ? 'Shared foundation'
                              : 'Career branch'}
                          </Tag>
                          <small>
                            Week {step.startWeek}
                            {step.endWeek !== step.startWeek
                              ? `–${step.endWeek}`
                              : ''}
                          </small>
                        </div>
                        <h3>{step.course.title}</h3>
                        <p>
                          {step.course.provider} · {step.course.hours} hours (
                          {step.course.durationKind}) · RM {step.course.fee}
                        </p>
                        <div className="chips">
                          {step.course.skills.map((id) => (
                            <SkillChip key={id} id={id} />
                          ))}
                        </div>
                        <p className="muted small">{step.course.note}</p>
                        <div className="course-bottom">
                          <External href={step.course.url}>
                            Open learning resource
                          </External>
                          <button
                            className="text-button"
                            onClick={() => complete(step.course.id)}
                          >
                            <CheckCircle2 size={15} />
                            Mark studied
                          </button>
                        </div>
                        <small className="verification">
                          <ShieldCheck size={12} />
                          Source checked {step.course.checkedAt} ·{' '}
                          <a
                            href={sdgUrl('4.4')}
                            target="_blank"
                            rel="noreferrer"
                          >
                            SDG 4.4: relevant work skills
                          </a>
                        </small>
                      </div>
                    </article>
                  ))}
                  {!plan.steps.length && (
                    <div className="panel empty-state">
                      <BookOpen size={28} />
                      <h3>No new course fits this selection.</h3>
                      <p>
                        Review the available time, funding filter and gaps
                        below. You may have already studied the relevant
                        courses.
                      </p>
                      <button
                        className="secondary"
                        onClick={() => navigate('profile')}
                      >
                        Edit constraints
                      </button>
                    </div>
                  )}
                  {plan.completed.length > 0 && (
                    <section className="panel completed-panel">
                      <h3>Learning you’re keeping</h3>
                      {plan.completed.map((c) => (
                        <div key={c.id}>
                          <span>
                            <CheckCircle2 size={16} />
                            {c.title}
                          </span>
                          <button
                            className="text-button"
                            onClick={() => complete(c.id)}
                          >
                            Undo
                          </button>
                        </div>
                      ))}
                      <p className="muted small">
                        Marked studied in this browser. Your assessed skill
                        levels do not change automatically.
                      </p>
                    </section>
                  )}
                  {plan.uncovered.length > 0 && (
                    <section className="panel gap-panel">
                      <h3>A useful start, with gaps still to cover.</h3>
                      <p>
                        These needs do not fit the available time, prerequisites
                        or verified catalogue. Finishing the plan does not
                        establish full role readiness.
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
                    <span className="eyebrow">MAKE ROOM FOR LEARNING</span>
                    <h2>Your weekly rhythm</h2>
                    <p className="muted">
                      Maximum {profile.hours} hours each week.
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
                      <p className="muted small">
                        First 12 weeks shown. Export includes the full schedule.
                      </p>
                    )}
                    <div className="section-divider" />
                    <div className="budget-line">
                      <span>Course fees</span>
                      <strong>RM {plan.totalCost}</strong>
                    </div>
                    <div className="budget-line">
                      <span>Available budget</span>
                      <strong>RM {profile.budget}</strong>
                    </div>
                    <p className="muted small">
                      Device, software, data and staff-time costs are separate.
                    </p>
                  </section>
                  <StudyRhythm
                    profile={profile}
                    onEdit={() => navigate('profile')}
                  />
                  <section className="panel qualification-panel">
                    <GraduationCap size={23} />
                    <h3>Keep the destination realistic</h3>
                    <p>{active.role.entry}</p>
                    <External href={active.role.source}>
                      Explore role requirements
                    </External>
                  </section>
                  {previous && (
                    <section className="panel">
                      <h3>Your plan can adapt</h3>
                      <p>
                        {changes.length} occupation scores changed after the
                        latest snapshot. Completed learning was retained.
                        Manually chosen destinations stay pinned.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate('evidence')}
                      >
                        Inspect the changes
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
              ArcTalent · Skills that travel with you.
            </span>
            <span>
              Synthetic profiles · Human decisions · Evidence you can inspect
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {details && (
        <Modal title={details.role.title} onClose={() => setDetails(null)}>
          <MatchDetails match={details} />
        </Modal>
      )}
    </div>
  );
}
