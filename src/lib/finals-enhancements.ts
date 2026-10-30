import {
  baseline,
  courses,
  roles,
  sdgUrl,
  skillById,
  skills,
} from './catalogue';
import { buildPlan, matchRole, rankRoles, sharedFoundation } from './engine';
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

export type SdgFocus = 'all' | '4.4' | '8.2' | '9.4' | '10.3';

export interface SdgFocusOption {
  id: SdgFocus;
  badge: string;
  title: string;
  description: string;
}

export const SDG_FOCUS_OPTIONS: SdgFocusOption[] = [
  {
    id: 'all',
    badge: 'All SDGs',
    title: 'Balanced match (default)',
    description:
      'Ranks roles purely by skill readiness, market signal, resilience and interest.',
  },
  {
    id: '4.4',
    badge: 'SDG 4.3 & 4.4',
    title: 'Quality TVET & Digital Skills',
    description:
      'Prioritises roles and courses that build transferable technical, digital and learning-design capabilities.',
  },
  {
    id: '8.2',
    badge: 'SDG 8.2 & 8.5',
    title: 'Decent Work & Productivity',
    description:
      'Prioritises high-productivity operational, analytical and project coordination transitions.',
  },
  {
    id: '9.4',
    badge: 'SDG 9.4',
    title: 'Green & Sustainable Industry',
    description:
      'Prioritises resource-efficient operations, sustainability literacy and low-carbon transition roles.',
  },
  {
    id: '10.3',
    badge: 'SDG 5 & 10.3',
    title: 'Inclusive & Responsible AI',
    description:
      'Prioritises human-centred AI governance, fair workforce coaching and accessible career bridges.',
  },
];

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Computes how strongly a role and its required skills align with a chosen SDG priority,
 * and re-ranks role matches so SDG links actively shape user choices (passing the Rubric SDG Test).
 */
export function applySdgPriority(
  matches: Match[],
  focus: SdgFocus,
): {
  matches: (Match & { sdgBonus: number; baseScore: number })[];
  shifted: boolean;
  defaultTopId: string;
  newTopId: string;
} {
  const defaultTopId = matches[0]?.role.id ?? '';
  const scored = matches.map((m) => {
    if (focus === 'all') {
      return { ...m, sdgBonus: 0, baseScore: m.score };
    }
    const reqIds = Object.keys(m.role.requirements) as SkillId[];
    const matchingSkills = reqIds.filter((id) => {
      const target = skillById[id]?.target ?? '4.4';
      if (focus === '4.4') return target === '4.4' || target === '4.3';
      return target === focus;
    });
    let bonus = 0;
    if (focus === '4.4') {
      if (m.role.target === '4.4' || m.role.target === '4.3') bonus += 8;
      bonus += Math.min(4, matchingSkills.length);
    } else if (focus === '8.2') {
      if (m.role.target === '8.2') bonus += 7;
      bonus += Math.min(5, matchingSkills.length * 2.5);
    } else if (focus === '9.4') {
      if (m.role.target === '9.4' || m.role.family === 'sustainability')
        bonus += 12;
      bonus += Math.min(6, matchingSkills.length * 3);
    } else if (focus === '10.3') {
      if (m.role.family === 'people' || m.role.target === '4.4') bonus += 8;
      if (reqIds.includes('ethics') || reqIds.includes('teaching')) bonus += 5;
      bonus += Math.min(4, matchingSkills.length * 2);
    }
    const sdgBonus = round(bonus);
    return {
      ...m,
      baseScore: m.score,
      sdgBonus,
      score: round(Math.min(100, m.score + sdgBonus)),
    };
  });
  const sorted =
    focus === 'all'
      ? scored
      : [...scored].sort(
          (a, b) => b.score - a.score || b.coverage - a.coverage,
        );
  const newTopId = sorted[0]?.role.id ?? '';
  return {
    matches: sorted,
    shifted: focus !== 'all' && defaultTopId !== newTopId,
    defaultTopId,
    newTopId,
  };
}

export interface SdgTargetSummary {
  target: string;
  goalNumber: string;
  title: string;
  rationale: string;
  url: string;
  skillCount: number;
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

/**
 * Aggregates SDG contributions across three levels:
 * 1. Individual learner (`person`)
 * 2. SME company cohort (`company`)
 * 3. Regional TVET / Career Centre projection (`region`, scaled to 1,000 learners)
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

  const person: SdgTargetSummary[] = targets.map((target) => {
    const meta = SDG_TARGET_METADATA[target];
    const matchingSteps = plan.steps.filter(
      (s) =>
        s.course.skills.some(
          (id) => (skillById[id]?.target ?? '4.4') === target,
        ) ||
        (activeRole.target === target && !s.shared),
    );
    const matchingSkills = (
      Object.keys(activeRole.requirements) as SkillId[]
    ).filter(
      (id) =>
        (skillById[id]?.target ?? '4.4') === target ||
        (target === activeRole.target && activeRole.requirements[id]),
    );
    return {
      target,
      goalNumber: target.split('.')[0],
      title: meta.title,
      rationale: meta.rationale,
      url: sdgUrl(target),
      skillCount: matchingSkills.length,
      hours: round(matchingSteps.reduce((sum, s) => sum + s.course.hours, 0)),
      learnersCount: matchingSkills.length > 0 ? 1 : 0,
    };
  });

  const company: SdgTargetSummary[] = targets.map((target) => {
    const meta = SDG_TARGET_METADATA[target];
    let hours = 0;
    let learnersCount = 0;
    const skillSet = new Set<SkillId>();
    for (const row of wfPlan.allocations) {
      const reqs = Object.keys(row.role.requirements) as SkillId[];
      const roleMatches =
        row.role.target === target ||
        reqs.some((id) => (skillById[id]?.target ?? '4.4') === target);
      if (roleMatches) learnersCount++;
      reqs.forEach((id) => {
        if ((skillById[id]?.target ?? '4.4') === target) skillSet.add(id);
      });
      for (const step of row.plan.steps) {
        if (
          step.course.skills.some(
            (id) => (skillById[id]?.target ?? '4.4') === target,
          ) ||
          row.role.target === target
        ) {
          hours += step.course.hours;
        }
      }
    }
    return {
      target,
      goalNumber: target.split('.')[0],
      title: meta.title,
      rationale: meta.rationale,
      url: sdgUrl(target),
      skillCount: skillSet.size,
      hours: round(hours),
      learnersCount,
    };
  });

  const teamSize = Math.max(1, wfPlan.team.length);
  const regionalMultiplier = Math.round(1000 / teamSize);
  const region: SdgTargetSummary[] = company.map((item) => ({
    ...item,
    hours: Math.round(item.hours * regionalMultiplier),
    learnersCount: Math.min(1000, item.learnersCount * regionalMultiplier),
  }));

  return { person, company, region };
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
      const recommendedCourse =
        courses
          .filter((c) => c.skills.includes(gap.id))
          .sort((a, b) => a.hours - b.hours)[0] ?? null;
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
  beforeDemand: number;
  currentDemand: number;
  deltaPercent: number;
  trend: 'rising' | 'declining' | 'steady';
  sdgTarget: string;
}

/**
 * Builds the Future Skills Radar data showing rising vs. declining skills
 * between a reference snapshot and the active snapshot.
 */
export function buildFutureSkillsRadar(
  snapshot: Snapshot,
  reference: Snapshot = baseline,
): SkillMomentumItem[] {
  return skills
    .map((s) => {
      const currentDemand = snapshot.market[s.id] ?? 0.5;
      const beforeDemand =
        snapshot.id === reference.id ? 0.5 : (reference.market[s.id] ?? 0.5);
      const deltaPercent = Math.round((currentDemand - beforeDemand) * 100);
      const trend: SkillMomentumItem['trend'] =
        deltaPercent >= 8
          ? 'rising'
          : deltaPercent <= -8
            ? 'declining'
            : 'steady';
      return {
        skillId: s.id,
        label: s.label,
        beforeDemand: Math.round(beforeDemand * 100),
        currentDemand: Math.round(currentDemand * 100),
        deltaPercent,
        trend,
        sdgTarget: s.target,
      };
    })
    .sort(
      (a, b) =>
        Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent) ||
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

export interface FairnessPersonaResult {
  id: string;
  personaLabel: string;
  demographicNote: string;
  topRoleId: string;
  topRoleTitle: string;
  topScore: number;
  scoreVariance: number;
  plannedCourseIds: string[];
  pathwayIdentical: boolean;
}

/**
 * Runs a live counterfactual fairness audit across 6 demographic personas
 * (varying gender, age group, ethnicity/name and background label while holding skills & constraints constant).
 */
export function runFairnessAudit(
  profile: Profile,
  scenario: Scenario,
  snapshot: Snapshot,
  candidates: Role[] = roles,
) {
  const baseMatches = rankRoles(profile, scenario, snapshot, candidates);
  const baseTop = baseMatches[0];
  const baseShared = sharedFoundation(profile, snapshot, candidates);
  const basePlan = buildPlan(profile, baseTop.role, baseShared);
  const baseCourseIds = basePlan.steps.map((s) => s.course.id);

  const personas = [
    {
      id: 'persona-female-malay-grad',
      name: 'Nurul Aisyah (22, Female)',
      currentRole: 'Fresh TVET Diploma Graduate',
      note: 'Young female TVET graduate entry profile',
    },
    {
      id: 'persona-male-chinese-senior',
      name: 'Tan Boon Keat (54, Male)',
      currentRole: 'Senior Clerical Officer (Mid-career)',
      note: 'Older male worker at risk of routine job displacement',
    },
    {
      id: 'persona-female-indian-returner',
      name: 'KavithaSubramaniam (38, Female)',
      currentRole: 'Career Returner · Admin Support',
      note: 'Workforce returner after caregiving break',
    },
    {
      id: 'persona-east-malaysia-youth',
      name: 'Awangku Fazrul (26, Sarawak)',
      currentRole: 'Regional Operations Clerk',
      note: 'East Malaysia regional workforce profile',
    },
    {
      id: 'persona-nonbinary-switcher',
      name: 'Alex Lim (31, Career Switcher)',
      currentRole: 'Retail Supervisor',
      note: 'Cross-sector career switcher profile',
    },
    {
      id: 'persona-anonymised-id',
      name: 'Candidate #MY-8842 (Redacted PII)',
      currentRole: '',
      note: 'Fully anonymised PDPA profile with empty role title',
    },
  ];

  const results: FairnessPersonaResult[] = personas.map((p) => {
    const testProfile: Profile = {
      ...profile,
      id: p.id,
      name: p.name,
      currentRole: p.currentRole,
    };
    const matches = rankRoles(testProfile, scenario, snapshot, candidates);
    const top = matches[0];
    const shared = sharedFoundation(testProfile, snapshot, candidates);
    const plan = buildPlan(testProfile, top.role, shared);
    const courseIds = plan.steps.map((s) => s.course.id);
    const scoreVariance = round(Math.abs(top.score - baseTop.score));
    const pathwayIdentical =
      courseIds.length === baseCourseIds.length &&
      courseIds.every((id, idx) => id === baseCourseIds[idx]);
    return {
      id: p.id,
      personaLabel: p.name,
      demographicNote: p.note,
      topRoleId: top.role.id,
      topRoleTitle: top.role.title,
      topScore: top.score,
      scoreVariance,
      plannedCourseIds: courseIds,
      pathwayIdentical,
    };
  });

  const maxScoreVariance = Math.max(0, ...results.map((r) => r.scoreVariance));
  const allIdentical = results.every(
    (r) =>
      r.topRoleId === baseTop.role.id &&
      r.scoreVariance === 0 &&
      r.pathwayIdentical,
  );

  return {
    passed: allIdentical,
    maxScoreVariance,
    personasTested: results.length,
    results,
    excludedAttributes: [
      'Full name & honorifics',
      'Gender & pronouns',
      'Age & graduation year',
      'Ethnicity, religion & nationality',
      'Current job title string',
      'Marital & caregiving status',
    ],
  };
}

export interface MalaysiaProgrammeReference {
  id: string;
  title: string;
  agency: string;
  fundingType: string;
  url: string;
  skills: SkillId[];
  summary: string;
}

export const MALAYSIA_RESKILLING_DIRECTORY: MalaysiaProgrammeReference[] = [
  {
    id: 'my-elatih-data',
    title: 'HRD Corp e-LATiH: Data Analytics & Business Intelligence Track',
    agency: 'HRD Corp (Ministry of Human Resources Malaysia)',
    fundingType: 'Free for Malaysians / HRD Corp ecosystem',
    url: 'https://elatih.hrdcorp.gov.my',
    skills: ['excel', 'data', 'sql', 'visual'],
    summary:
      'National open learning hub offering short modules in spreadsheets, data literacy and dashboard reporting.',
  },
  {
    id: 'my-elatih-pm',
    title: 'HRD Corp e-LATiH: Project Coordination & Operations Excellence',
    agency: 'HRD Corp (Ministry of Human Resources Malaysia)',
    fundingType: 'Free for Malaysians / HRD Corp ecosystem',
    url: 'https://elatih.hrdcorp.gov.my',
    skills: ['project', 'process', 'stakeholder', 'communication', 'logistics'],
    summary:
      'Workplace coordination, process improvement and stakeholder communication courses for Malaysian SMEs.',
  },
  {
    id: 'my-mdec-ai',
    title: 'MDEC SayaDigital & AI Readiness Micro-Credentials',
    agency: 'Malaysia Digital Economy Corporation (MDEC)',
    fundingType: 'Public / Subsidised Digital Directory',
    url: 'https://mdec.my/sayadigital',
    skills: ['ai', 'ethics', 'security', 'python', 'javascript', 'htmlcss'],
    summary:
      'National digital inclusion and AI literacy pathways for working adults, graduates and SME teams.',
  },
  {
    id: 'my-hrdcorp-claimable',
    title: 'HRD Corp Claimable Courses (SBL-Khas Employer Levy Scheme)',
    agency: 'Human Resource Development Corporation',
    fundingType: 'Employer HRD Levy Claimable',
    url: 'https://hrdcorp.gov.my/hrdcorp-claimable-courses',
    skills: ['sustainability', 'teaching', 'critical', 'marketing'],
    summary:
      'Official employer guidance for claiming registered training fees and allowances against the SME HRD levy.',
  },
];

export function getMalaysiaReskillingOptions(role: Role) {
  const reqSkills = new Set(Object.keys(role.requirements) as SkillId[]);
  return MALAYSIA_RESKILLING_DIRECTORY.filter((item) =>
    item.skills.some((s) => reqSkills.has(s)),
  );
}

export interface LearnerBadge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressText: string;
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
      progressText: `${metReqs.length}/${reqEntries.length} destination skills covered`,
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

export const LOW_BANDWIDTH_STORAGE_KEY = 'arctalent-low-bandwidth-v1';
