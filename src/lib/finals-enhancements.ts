import { courses, roles, sdgUrl, skillById, skills } from './catalogue';
import { buildPlan, matchRole, rankRoles, sharedFoundation } from './engine';
import type { TranslationValues } from './i18n';
import type {
  Course,
  LearningPlan,
  Match,
  Profile,
  Role,
  Scenario,
  SkillId,
  Snapshot,
} from './types';
import type { WorkforceSettings } from './workforce-settings';
import { buildWorkforcePlan } from './workforce-plan';

export type SdgFocus = 'all' | '4.4' | '8.2' | '9.4';

export interface SdgFocusOption {
  id: SdgFocus;
  badge: string;
  title: string;
  description: string;
  /** SDG targets whose roles and skills this lens moves up the ranking. */
  targets: string[];
}

export const SDG_FOCUS_OPTIONS: SdgFocusOption[] = [
  {
    id: 'all',
    badge: 'All SDGs',
    title: 'Balanced match (default)',
    description:
      'Ranks roles purely by skill readiness, market signal, resilience and interest.',
    targets: [],
  },
  {
    id: '4.4',
    badge: 'SDG 4.3 & 4.4',
    title: 'Quality TVET & Digital Skills',
    description:
      'Prioritises roles and courses that build transferable technical, digital and learning-design capabilities.',
    targets: ['4.3', '4.4'],
  },
  {
    id: '8.2',
    badge: 'SDG 8.2',
    title: 'Decent Work & Productivity',
    description:
      'Prioritises high-productivity operational, analytical and project coordination transitions.',
    targets: ['8.2'],
  },
  {
    id: '9.4',
    badge: 'SDG 9.4',
    title: 'Green & Sustainable Industry',
    description:
      'Prioritises resource-efficient operations, sustainability literacy and low-carbon transition roles.',
    targets: ['9.4'],
  },
];

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * SDG priority points for a role under a lens: 10 when the role's own SDG
 * target is in focus, plus up to 10 for the share of its required skill
 * levels mapped to a focused target.
 */
export function sdgPriorityBonus(role: Role, targets: string[]) {
  if (!targets.length) return 0;
  const requirements = Object.entries(role.requirements) as [SkillId, number][];
  const total = requirements.reduce((sum, [, level]) => sum + level, 0);
  const aligned = requirements
    .filter(([id]) => targets.includes(skillById[id].target))
    .reduce((sum, [, level]) => sum + level, 0);
  return round(
    (targets.includes(role.target) ? 10 : 0) +
      (total > 0 ? (10 * aligned) / total : 0),
  );
}

/**
 * Re-ranks role matches by suitability plus SDG priority points, so an SDG
 * lens changes the order without changing any suitability score.
 */
export function applySdgPriority(matches: Match[], focus: SdgFocus) {
  const targets =
    SDG_FOCUS_OPTIONS.find((option) => option.id === focus)?.targets ?? [];
  const ranked = matches.map((m) => ({
    ...m,
    sdgBonus: sdgPriorityBonus(m.role, targets),
  }));
  if (targets.length)
    ranked.sort(
      (a, b) =>
        b.score + b.sdgBonus - (a.score + a.sdgBonus) ||
        b.score - a.score ||
        a.role.id.localeCompare(b.role.id),
    );
  return {
    matches: ranked,
    shifted: ranked[0]?.role.id !== matches[0]?.role.id,
  };
}

export interface SdgTargetSummary {
  target: string;
  goalNumber: string;
  title: string;
  rationale: string;
  url: string;
  hours: number;
  learnersCount: number;
}

const SDG_TARGET_METADATA: Record<
  string,
  { title: string; rationale: string }
> = {
  '4.3': {
    title: 'Equal access to affordable TVET & lifelong learning',
    rationale:
      'Workplace learning design and peer coaching expand accessible technical training.',
  },
  '4.4': {
    title: 'Relevant technical and vocational skills for decent jobs',
    rationale:
      'Core digital, analytical and problem-solving skills improve employability.',
  },
  '8.2': {
    title: 'Higher economic productivity through diversification & upgrading',
    rationale:
      'Process improvement, data analytics and supply-chain coordination raise SME productivity.',
  },
  '9.4': {
    title: 'Upgrade infrastructure & industries for sustainability',
    rationale:
      'Sustainability literacy and resource-efficient workflows support cleaner operations.',
  },
  '10.3': {
    title: 'Ensure equal opportunity & reduce outcome inequalities',
    rationale:
      'Responsible AI governance and bias-free skill matching protect workers during transition.',
  },
};

/** Planned hours counted toward an SDG target: every course when the destination role maps to it, otherwise courses teaching a skill mapped to it. */
function alignedHours(plan: LearningPlan, role: Role, target: string) {
  return plan.steps
    .filter(
      (step) =>
        role.target === target ||
        step.course.skills.some((id) => skillById[id].target === target),
    )
    .reduce((sum, step) => sum + step.course.hours, 0);
}

/**
 * Contextual SDG contributions for one learner, the SME team, and a
 * projection of that team to 1,000 learners. A learner counts toward a target
 * only when their plan schedules hours for it.
 */
export function aggregateSdgContributions(
  profile: Profile,
  activeRole: Role,
  plan: LearningPlan,
  scenario: Scenario,
  snapshot: Snapshot,
  workforce: WorkforceSettings,
) {
  const wfPlan = buildWorkforcePlan(profile, scenario, snapshot, workforce);
  const targets = ['4.4', '8.2', '9.4', '4.3', '10.3'];
  const summary = (
    target: string,
    hours: number,
    learnersCount: number,
  ): SdgTargetSummary => ({
    target,
    goalNumber: target.split('.')[0],
    title: SDG_TARGET_METADATA[target].title,
    rationale: SDG_TARGET_METADATA[target].rationale,
    url: sdgUrl(target),
    hours: round(hours),
    learnersCount,
  });
  const person = targets.map((target) => {
    const hours = alignedHours(plan, activeRole, target);
    return summary(target, hours, hours > 0 ? 1 : 0);
  });
  const company = targets.map((target) => {
    const hours = wfPlan.allocations.map((row) =>
      alignedHours(row.plan, row.role, target),
    );
    return summary(
      target,
      hours.reduce((sum, h) => sum + h, 0),
      hours.filter((h) => h > 0).length,
    );
  });
  const teamSize = Math.max(1, wfPlan.team.length);
  const regionScale = 1000 / teamSize;
  const region = company.map((item) => ({
    ...item,
    hours: Math.round(item.hours * regionScale),
    learnersCount: Math.round(item.learnersCount * regionScale),
  }));
  return { person, company, region, teamSize };
}

export interface ScoreBoosterItem {
  skillId: SkillId;
  skillLabel: string;
  currentLevel: number;
  targetLevel: number;
  scoreBefore: number;
  scoreAfter: number;
  deltaScore: number;
  coverageAfter: number;
  recommendedCourse: Course | null;
}

/**
 * Decomposes "What would raise this score?" by computing the exact match score gain
 * if each missing skill is raised to the role's required level.
 */
export function calculateScoreBoosters(
  profile: Profile,
  role: Role,
  scenario: Scenario,
  snapshot: Snapshot,
): ScoreBoosterItem[] {
  const currentMatch = matchRole(profile, role, scenario, snapshot);
  return currentMatch.gaps
    .map((gap) => {
      const nextSkills = {
        ...profile.skills,
        [gap.id]: gap.required,
      };
      const nextMatch = matchRole(
        { ...profile, skills: nextSkills },
        role,
        scenario,
        snapshot,
      );
      // Catalogue courses lift a skill to Level 2 at most, so Level 3 gaps get none.
      const recommendedCourse =
        gap.required <= 2
          ? (courses
              .filter((c) => c.skills.includes(gap.id))
              .sort((a, b) => a.hours - b.hours)[0] ?? null)
          : null;
      return {
        skillId: gap.id,
        skillLabel: skillById[gap.id].label,
        currentLevel: gap.current,
        targetLevel: gap.required,
        scoreBefore: currentMatch.score,
        scoreAfter: nextMatch.score,
        deltaScore: round(nextMatch.score - currentMatch.score),
        coverageAfter: nextMatch.coverage,
        recommendedCourse,
      };
    })
    .sort((a, b) => b.deltaScore - a.deltaScore);
}

export interface SkillMomentumItem {
  skillId: SkillId;
  label: string;
  /** Demand in the comparison snapshot, or null when there is none. */
  beforeDemand: number | null;
  currentDemand: number;
  deltaPercent: number | null;
  trend: 'rising' | 'declining' | 'steady';
  sdgTarget: string;
}

/**
 * Builds the Future Skills Radar: skill demand in the active snapshot and,
 * when an earlier snapshot is given, how it moved. Skills without a demand
 * value are left out rather than given an assumed one.
 */
export function buildFutureSkillsRadar(
  snapshot: Snapshot,
  reference?: Snapshot | null,
): SkillMomentumItem[] {
  const compare = reference && reference.id !== snapshot.id ? reference : null;
  return skills
    .flatMap((s) => {
      const current = snapshot.market[s.id];
      if (current === undefined) return [];
      const before = compare?.market[s.id];
      const deltaPercent =
        before === undefined ? null : Math.round((current - before) * 100);
      const trend: SkillMomentumItem['trend'] =
        deltaPercent === null
          ? 'steady'
          : deltaPercent >= 8
            ? 'rising'
            : deltaPercent <= -8
              ? 'declining'
              : 'steady';
      return [
        {
          skillId: s.id,
          label: s.label,
          beforeDemand: before === undefined ? null : Math.round(before * 100),
          currentDemand: Math.round(current * 100),
          deltaPercent,
          trend,
          sdgTarget: s.target,
        },
      ];
    })
    .sort(
      (a, b) =>
        Math.abs(b.deltaPercent ?? 0) - Math.abs(a.deltaPercent ?? 0) ||
        b.currentDemand - a.currentDemand,
    );
}

/**
 * Computes a complete Before vs. After Automatic Re-Planning Diff when trend data changes.
 */
export function computeReplanDiff(
  profile: Profile,
  scenario: Scenario,
  before: Snapshot,
  after: Snapshot,
  candidates: Role[] = roles,
) {
  const oldMatches = rankRoles(profile, scenario, before, candidates);
  const newMatches = rankRoles(profile, scenario, after, candidates);
  const oldTop = oldMatches[0];
  const newTop = newMatches[0];
  const oldShared = sharedFoundation(profile, before, candidates);
  const newShared = sharedFoundation(profile, after, candidates);
  const oldPlan = buildPlan(profile, oldTop.role, oldShared);
  const newPlan = buildPlan(profile, newTop.role, newShared);

  const oldCourseIds = new Set(oldPlan.steps.map((s) => s.course.id));
  const newCourseIds = new Set(newPlan.steps.map((s) => s.course.id));

  const keptCourses = newPlan.steps
    .filter((s) => oldCourseIds.has(s.course.id))
    .map((s) => s.course);
  const addedCourses = newPlan.steps
    .filter((s) => !oldCourseIds.has(s.course.id))
    .map((s) => s.course);
  const removedCourses = oldPlan.steps
    .filter((s) => !newCourseIds.has(s.course.id))
    .map((s) => s.course);

  return {
    topRoleChanged: oldTop.role.id !== newTop.role.id,
    oldTopRole: oldTop.role,
    newTopRole: newTop.role,
    oldTopScore: oldTop.score,
    newTopScore: newTop.score,
    keptCourses,
    addedCourses,
    removedCourses,
    sharedSkillsBefore: oldShared,
    sharedSkillsAfter: newShared,
  };
}

/** Synthetic names and job titles. Neither is a matching input. */
export const FAIRNESS_SWAPS = [
  {
    id: 'fairness-1',
    name: 'Nurul Aisyah',
    currentRole: 'Senior clerical officer',
  },
  {
    id: 'fairness-2',
    name: 'Tan Boon Keat',
    currentRole: 'Career returner, admin support',
  },
  {
    id: 'fairness-3',
    name: 'Kavitha Subramaniam',
    currentRole: 'Regional operations clerk',
  },
  {
    id: 'fairness-4',
    name: 'Awangku Fazrul',
    currentRole: 'Retail supervisor',
  },
  {
    id: 'fairness-5',
    name: 'Alex Lim',
    currentRole: 'Fresh TVET diploma graduate',
  },
  { id: 'fairness-6', name: 'Anonymised candidate', currentRole: '' },
];

export interface FairnessCheckResult {
  id: string;
  name: string;
  currentRole: string;
  topRoleId: string;
  topRoleTitle: string;
  topScore: number;
  scoreChange: number;
  pathwayIdentical: boolean;
}

/**
 * Re-runs matching and planning with different names and job titles. The
 * engine reads only skills, interests, study time, budget and completed
 * courses, so any change here would reveal an unintended input.
 */
export function runFairnessAudit(
  profile: Profile,
  scenario: Scenario,
  snapshot: Snapshot,
  candidates: Role[] = roles,
) {
  const outcome = (p: Profile) => {
    const top = rankRoles(p, scenario, snapshot, candidates)[0];
    const plan = buildPlan(
      p,
      top.role,
      sharedFoundation(p, snapshot, candidates),
    );
    return { top, courseIds: plan.steps.map((s) => s.course.id).join() };
  };
  const base = outcome(profile);
  const results: FairnessCheckResult[] = FAIRNESS_SWAPS.map((swap) => {
    const { top, courseIds } = outcome({ ...profile, ...swap });
    return {
      ...swap,
      topRoleId: top.role.id,
      topRoleTitle: top.role.title,
      topScore: top.score,
      scoreChange: round(Math.abs(top.score - base.top.score)),
      pathwayIdentical: courseIds === base.courseIds,
    };
  });
  const maxScoreChange = Math.max(0, ...results.map((r) => r.scoreChange));
  const pathwayChanges = results.filter((r) => !r.pathwayIdentical).length;
  return {
    passed:
      maxScoreChange === 0 &&
      pathwayChanges === 0 &&
      results.every((r) => r.topRoleId === base.top.role.id),
    maxScoreChange,
    pathwayChanges,
    personasTested: results.length,
    results,
  };
}

export interface MalaysiaProgrammeReference {
  id: string;
  title: string;
  agency: string;
  fundingType: string;
  url: string;
  /** Skills worth searching the portal for; empty when it suits any role. */
  skills: SkillId[];
  summary: string;
}

/** Official Malaysian portals, checked 2026-10-30. ArcTalent does not claim specific courses or tracks on them. */
export const MALAYSIA_RESKILLING_DIRECTORY: MalaysiaProgrammeReference[] = [
  {
    id: 'my-elatih',
    title: 'e-LATiH',
    agency: 'HRD Corp',
    fundingType: 'Free and paid courses',
    url: 'https://elatih.hrdcorp.gov.my',
    skills: [
      'excel',
      'data',
      'sql',
      'visual',
      'critical',
      'communication',
      'project',
      'stakeholder',
      'process',
      'logistics',
    ],
    summary:
      'HRD Corp’s online learning hub, with free and paid short courses in digital, leadership, quality and personal-development topics.',
  },
  {
    id: 'my-mymahir',
    title: 'MyMahir',
    agency: 'TalentCorp Malaysia',
    fundingType: 'Skills and roles explorer',
    url: 'https://mymahir.my',
    skills: [],
    summary:
      'TalentCorp’s platform to explore skills and roles, find training options and take a workforce readiness assessment.',
  },
  {
    id: 'my-hrdcorp-claimable',
    title: 'HRD Corp Claimable Courses',
    agency: 'HRD Corp',
    fundingType: 'Employer levy claim',
    url: 'https://hrdcorp.gov.my/hrdcorp-claimable-courses',
    skills: [],
    summary:
      'Employers registered with HRD Corp apply through e-TRiS before training starts and claim approved course costs from their levy.',
  },
];

export function getMalaysiaReskillingOptions(role: Role) {
  return MALAYSIA_RESKILLING_DIRECTORY.filter(
    (item) =>
      !item.skills.length || item.skills.some((id) => role.requirements[id]),
  );
}

export interface LearnerBadge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressText: string;
  progressValues?: TranslationValues;
  sdgTarget: string;
}

/**
 * Computes learner motivation badges and milestone progress from completed courses and skills.
 */
export function computeLearnerBadges(
  profile: Profile,
  plan: LearningPlan,
  shared: SkillId[],
  role: Role,
): {
  badges: LearnerBadge[];
  completedHours: number;
  totalPlannedHours: number;
  progressPercent: number;
} {
  const completedHours = plan.completed.reduce((sum, c) => sum + c.hours, 0);
  const totalPlannedHours = completedHours + plan.totalHours;
  const progressPercent =
    totalPlannedHours > 0
      ? Math.round((completedHours / totalPlannedHours) * 100)
      : 0;

  const hasFoundationCourse =
    plan.completed.some((c) => c.skills.some((s) => shared.includes(s))) ||
    (shared.length > 0 && shared.every((s) => (profile.skills[s] ?? 0) >= 2));

  const hasAiReady =
    (profile.skills.ai ?? 0) >= 2 ||
    (profile.skills.ethics ?? 0) >= 2 ||
    plan.completed.some(
      (c) => c.skills.includes('ai') || c.skills.includes('ethics'),
    );

  const hasGreenSkill =
    (profile.skills.sustainability ?? 0) >= 2 ||
    plan.completed.some((c) => c.skills.includes('sustainability'));

  // A completed course counts as Level 2, as it does in the planner.
  const reqEntries = Object.entries(role.requirements) as [SkillId, number][];
  const metReqs = reqEntries.filter(
    ([id, lvl]) =>
      (profile.skills[id] ?? 0) >= lvl ||
      plan.completed.some((c) => c.skills.includes(id) && lvl <= 2),
  );
  const routeComplete =
    reqEntries.length > 0 && metReqs.length === reqEntries.length;

  const badges: LearnerBadge[] = [
    {
      id: 'foundation-pioneer',
      title: 'Foundation Builder',
      description:
        'Completed a shared-foundation course or reached working level in core transferable skills.',
      earned: hasFoundationCourse,
      progressText: hasFoundationCourse
        ? 'Unlocked · Multi-role safety net active'
        : 'Mark a shared-foundation course studied to unlock',
      sdgTarget: '4.4',
    },
    {
      id: 'ai-ready',
      title: 'Responsible AI Navigator',
      description:
        'Built AI literacy or Responsible AI governance skills for safe workplace adoption.',
      earned: hasAiReady,
      progressText: hasAiReady
        ? 'Unlocked · AI & ethics readiness active'
        : 'Complete an AI or Responsible AI module to unlock',
      sdgTarget: '10.3',
    },
    {
      id: 'sdg-steward',
      title: 'Green Transition Contributor',
      description:
        'Developed sustainability literacy to support cleaner, resource-efficient operations.',
      earned: hasGreenSkill,
      progressText: hasGreenSkill
        ? 'Unlocked · SDG 9.4 capability active'
        : 'Study Sustainability literacy to unlock',
      sdgTarget: '9.4',
    },
    {
      id: 'pathway-finisher',
      title: 'Destination Ready Milestone',
      description:
        'Covered all target skill requirements for your selected career destination.',
      earned: routeComplete,
      progressText: '{0}/{1} destination skills covered',
      progressValues: { 0: metReqs.length, 1: reqEntries.length },
      sdgTarget: role.target,
    },
  ];

  return {
    badges,
    completedHours,
    totalPlannedHours,
    progressPercent,
  };
}
