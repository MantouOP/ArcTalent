import type {
  LearningPlan,
  Match,
  Profile,
  Scenario,
  SkillId,
  Snapshot,
} from './types';
import type { WorkforceSettings } from './workforce-settings';
import { getWorkforceMembers } from './workforce-settings';
import { courses, roles, skillById } from './catalogue';
import { rankRoles } from './engine';

export type ChatView = 'explore' | 'pathway' | 'team' | 'evidence' | 'profile';
export type ChatIntent =
  | 'recommendation'
  | 'learning'
  | 'gaps'
  | 'scenario'
  | 'budget'
  | 'time'
  | 'funding'
  | 'evidence'
  | 'team'
  | 'greeting'
  | 'unsupported';
export type ChatValue = string | number | { label: string };
export type ChatLine = { text: string; values?: Record<string, ChatValue> };
export type ChatContext = {
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  active: Match;
  plan: LearningPlan;
  shared: SkillId[];
  workforce: WorkforceSettings;
};
export type ChatReply = {
  intent: ChatIntent;
  paragraphs: ChatLine[];
  bullets: ChatLine[];
  sources: { label: string; href: string; courseTitle?: string }[];
  action?: { label: string; view: ChatView };
  basis: { role: string; scenario: Scenario; snapshot: string; asOf: string };
};

// Every display phrase is a whole translation unit. Catalogue course titles stay
// source text; role and skill labels use the translatable ChatValue object form.
const copy = {
  welcome:
    'I am a plan-based guide running on this device. I can explain your selected career route, learning plan, skill gaps, scenarios, budget, time, funding, evidence and team planning.',
  scope:
    'I am a plan-based guide, not a language-model service. I can explain the current ArcTalent planning data, but I cannot answer that request.',
  suggestions:
    'Try asking about the learning plan, which skills are missing, how scenarios differ, or what the current budget and evidence show.',
  selected:
    'Your selected route is {0}, with a match score of {1}/100 and {2}% current skill coverage.',
  leading:
    'The highest-scoring route in the current scenario is {0}, at {1}/100. Your selected route remains the basis of this answer.',
  scoring:
    'Scores combine skill coverage, interests, market visibility and scenario resilience. They are planning heuristics, not hiring predictions or proof of job readiness.',
  learning:
    'The current plan for {0} contains {1} courses, {2} planned hours and RM {3} in course fees.',
  foundation:
    'The shared foundation has {0} skills in common across the compared routes under both scenarios.',
  noFoundation:
    'No shared foundation is currently identified across the compared routes. Follow the selected route and its individual skill needs.',
  course: '{0} takes {1} planned hours, scheduled from week {2} to week {3}.',
  noCourses: 'No courses are scheduled in the current plan for {0}.',
  zeroTime:
    'Your available study time is zero. Increase weekly hours and the planning horizon in your profile before expecting a course schedule.',
  filters:
    'The current plan reflects your time, budget, prerequisites, completed courses, funding filter and the available catalogue. Review those constraints to explore more options.',
  readiness:
    'Course coverage is a planning assumption. Course completion does not establish proficiency or full job readiness.',
  gaps: 'For {0}, the current profile has {1} skill gaps. Showing up to five current gaps below.',
  noGaps:
    'No skill gaps are recorded for {0} under the current profile assumptions. Employer requirements and proficiency still need verification.',
  gap: '{0} is currently at level {1}; the route requires level {2}.',
  uncovered:
    'The current learning plan leaves {0} skill needs uncovered. Completion alone does not verify proficiency.',
  scenario:
    'For your selected route, {0}, the moderate scenario gives {1}/100 and the rapid scenario gives {2}/100.',
  scenarioLeaders:
    'The moderate scenario ranks {0} first; the rapid scenario ranks {1} first for the current profile and snapshot.',
  scenarioLimit:
    'Both scenarios use exposure assumptions in the existing scoring model. They are sensitivity comparisons, not forecasts; changing the scenario does not change your recorded skills.',
  budget:
    'Your personal course budget is RM {0}. The current plan schedules course fees of RM {1}.',
  costs:
    'Catalogue course fees exclude possible software, connectivity and other costs. Free access does not verify HRD claimability.',
  time: 'Your profile allows {0} hours per week over {1} weeks, for {2} hours of study capacity.',
  plannedTime:
    'The current plan schedules {0} hours across {1} study weeks. Duration may include planning estimates and is not a completion guarantee.',
  funding:
    'The current catalogue lists {0} free courses and {1} courses with verified HRD funding status.',
  noHrd:
    'No HRD-claimable course listing is currently verified in this catalogue. A free course is not automatically claimable.',
  verifyHrd:
    'Confirm the specific course, provider, employer eligibility and current claim rules directly with HRD Corp before making a funding decision.',
  evidence:
    'The active evidence snapshot is {0}, dated {1}, with {2} job records and {3} research records.',
  simulation:
    'This is a synthetic simulation. Its market values are assumptions used to demonstrate replanning, not measured labour-market demand.',
  live: 'Public job evidence is a small Europe-focused sample, not Malaysian vacancy demand or a forecast. Research provides context and does not prove adoption.',
  smallSample:
    'Fewer than 30 job records means the engine uses a neutral market component. There is insufficient evidence for a market comparison.',
  evidenceAction:
    'Open the evidence view to inspect source dates, geography and the assumptions behind the current snapshot.',
  team: 'The team view covers {0} synthetic workers with a current shared training budget of RM {1}.',
  teamRules:
    'Team planning considers each worker’s destination, internal openings and the shared budget. Open the team view for its current allocation and any excluded workers.',
  teamLimit:
    'The team view computes its own routes and allocations. Your personal funding filter and learning plan should not be treated as the whole team allocation.',
  exploreAction: 'Explore career routes',
  pathwayAction: 'Open learning plan',
  profileAction: 'Review profile',
  evidenceViewAction: 'Inspect evidence',
  teamAction: 'Open team planning',
  occupationSource: 'Occupational requirements (O*NET)',
  courseSource: 'Course provider',
  hrdSource: 'HRD Corp claimable courses',
  jobsSource: 'Arbeitnow public job source',
  researchSource: 'arXiv AI research feed',
} as const;

const hrdUrl = 'https://hrdcorp.gov.my/hrdcorp-claimable-courses';
const line = (text: string, values?: Record<string, ChatValue>): ChatLine =>
  values ? { text, values } : { text };
const label = (value: string): ChatValue => ({ label: value });

// Unicode word boundaries keep e.g. "hi" out of "this" and "jam" out of
// "jammed". Chinese terms are phrases because spaces do not delimit words.
function hasWords(question: string, terms: string[]): boolean {
  return terms.some((term) =>
    new RegExp(`(?<![\\p{L}\\p{N}_])${term}(?![\\p{L}\\p{N}_])`, 'u').test(
      question,
    ),
  );
}

function intentFor(question: string, previous?: ChatIntent): ChatIntent {
  const q = question.normalize('NFKC').toLowerCase().trim();
  if (!q || q.length > 2000) return 'unsupported';
  if (
    /ignore (?:all |the |any )?(?:previous|prior|system)|system prompt|developer (?:message|instructions)|reveal.*(?:secret|prompt)|abaikan.*arahan|忽略.*(?:指令|规则)|系统提示/.test(
      q,
    )
  )
    return 'unsupported';
  const has = (words: string[], chinese: string[] = []) =>
    hasWords(q, words) || chinese.some((term) => q.includes(term));
  if (
    has(
      [
        'hrd',
        'hrdf',
        'funding',
        'funded',
        'claimable',
        'claim',
        'free',
        'percuma',
        'pembiayaan',
        'dituntut',
        'tuntutan',
        'dibiayai',
      ],
      ['资助', '报销', '免费', '补助'],
    )
  )
    return 'funding';
  if (
    has(
      [
        'scenario',
        'scenarios',
        'moderate',
        'rapid',
        'senario',
        'sederhana',
        'pesat',
        'automation',
      ],
      ['情景', '场景', '自动化'],
    )
  )
    return 'scenario';
  if (
    has(
      [
        'evidence',
        'source',
        'sources',
        'snapshot',
        'research',
        'bukti',
        'sumber',
        'penyelidikan',
      ],
      ['证据', '来源', '快照', '研究'],
    )
  )
    return 'evidence';
  if (
    has(
      ['gap', 'gaps', 'missing', 'lack', 'lacking', 'jurang', 'kekurangan'],
      ['缺少', '差距', '欠缺', '不足'],
    )
  )
    return 'gaps';
  if (
    has(
      [
        'team',
        'workforce',
        'employees',
        'employee',
        'staff',
        'pasukan',
        'pekerja',
        'kakitangan',
      ],
      ['团队', '员工', '人力'],
    )
  )
    return 'team';
  if (
    has(
      [
        'budget',
        'cost',
        'costs',
        'fees',
        'fee',
        'price',
        'afford',
        'bajet',
        'kos',
        'yuran',
        'harga',
      ],
      ['预算', '费用', '学费', '花费', '多少钱'],
    )
  )
    return 'budget';
  if (
    has(
      [
        'time',
        'hours',
        'hour',
        'weeks',
        'week',
        'schedule',
        'duration',
        'how long',
        'masa',
        'jam',
        'minggu',
        'jadual',
        'tempoh',
      ],
      ['时间', '小时', '多久', '几周', '日程'],
    )
  )
    return 'time';
  if (
    has(
      [
        'learn',
        'learning',
        'course',
        'courses',
        'study',
        'training',
        'pathway',
        'plan',
        'next',
        'belajar',
        'pelajari',
        'mempelajari',
        'pembelajaran',
        'kursus',
        'latihan',
        'pelan',
      ],
      ['学习', '学什么', '怎么学', '先学', '课程', '培训', '下一步'],
    )
  )
    return 'learning';
  if (
    has(
      [
        'recommend',
        'recommendation',
        'recommendations',
        'career',
        'careers',
        'role',
        'roles',
        'match',
        'kerjaya',
        'disyorkan',
        'cadangan',
      ],
      ['推荐', '职业', '岗位', '匹配'],
    )
  )
    return 'recommendation';
  const short = q.replace(/[?!.,？！，。]+$/u, '').trim();
  if (
    /^(?:why|how|tell me more|explain|more|what about that|kenapa|mengapa|lagi|jelaskan|boleh jelaskan|为什么|为何|怎么做|详细一点|然后呢)$/.test(
      short,
    )
  )
    return previous && previous !== 'unsupported' && previous !== 'greeting'
      ? previous
      : 'recommendation';
  if (/^(?:hi|hello|hey|salam|hai|helo|你好|您好)(?:\s+there)?$/.test(short))
    return 'greeting';
  return 'unsupported';
}

/** A deterministic local planning guide; never executes text or calls a service. */
export function answerCareerQuestion(
  question: string,
  context: ChatContext,
  previousIntent?: ChatIntent,
): ChatReply {
  const { profile, active, plan, scenario, snapshot, shared, workforce } =
    context;
  const intent = intentFor(question, previousIntent);
  const reply: ChatReply = {
    intent,
    paragraphs: [],
    bullets: [],
    sources: [],
    basis: {
      role: active.role.title,
      scenario,
      snapshot: snapshot.id,
      asOf: snapshot.asOf,
    },
  };
  const p = (text: string, values?: Record<string, ChatValue>) =>
    reply.paragraphs.push(line(text, values));
  const action = (text: string, view: ChatView) => {
    reply.action = { label: text, view };
  };
  const occupation = roles.find((role) => role.id === active.role.id);
  const occupationSource = () => {
    if (occupation)
      reply.sources.push({
        label: copy.occupationSource,
        href: occupation.source,
      });
  };
  const emptyPlan = () => {
    p(copy.noCourses, { 0: label(active.role.title) });
    p(profile.hours <= 0 || profile.weeks <= 0 ? copy.zeroTime : copy.filters);
  };
  switch (intent) {
    case 'greeting':
      p(copy.welcome);
      action(copy.pathwayAction, 'pathway');
      break;
    case 'unsupported':
      p(copy.scope);
      p(copy.suggestions);
      action(copy.pathwayAction, 'pathway');
      break;
    case 'recommendation': {
      p(copy.selected, {
        0: label(active.role.title),
        1: active.score,
        2: active.coverage,
      });
      const top = rankRoles(profile, scenario, snapshot)[0];
      if (top.role.id !== active.role.id)
        p(copy.leading, { 0: label(top.role.title), 1: top.score });
      p(copy.scoring);
      occupationSource();
      action(copy.exploreAction, 'explore');
      break;
    }
    case 'learning':
      if (!plan.steps.length) emptyPlan();
      else {
        p(copy.learning, {
          0: label(active.role.title),
          1: plan.steps.length,
          2: plan.totalHours,
          3: plan.totalCost,
        });
        p(
          shared.length ? copy.foundation : copy.noFoundation,
          shared.length ? { 0: shared.length } : undefined,
        );
        p(copy.readiness);
        for (const step of plan.steps) {
          reply.bullets.push(
            line(copy.course, {
              0: step.course.title,
              1: step.course.hours,
              2: step.startWeek,
              3: step.endWeek,
            }),
          );
          const source = courses.find((course) => course.id === step.course.id);
          if (source)
            reply.sources.push({
              label: copy.courseSource,
              href: source.url,
              courseTitle: source.title,
            });
        }
      }
      action(copy.pathwayAction, 'pathway');
      break;
    case 'gaps':
      p(active.gaps.length ? copy.gaps : copy.noGaps, {
        0: label(active.role.title),
        1: active.gaps.length,
      });
      reply.bullets = active.gaps.slice(0, 5).map((gap) =>
        line(copy.gap, {
          0: label(skillById[gap.id].label),
          1: gap.current,
          2: gap.required,
        }),
      );
      p(copy.uncovered, { 0: plan.uncovered.length });
      occupationSource();
      action(copy.pathwayAction, 'pathway');
      break;
    case 'scenario': {
      const moderate = rankRoles(profile, 'moderate', snapshot);
      const rapid = rankRoles(profile, 'rapid', snapshot);
      const moderateSelected = moderate.find(
        (match) => match.role.id === active.role.id,
      );
      const rapidSelected = rapid.find(
        (match) => match.role.id === active.role.id,
      );
      if (moderateSelected && rapidSelected)
        p(copy.scenario, {
          0: label(active.role.title),
          1: moderateSelected.score,
          2: rapidSelected.score,
        });
      p(copy.scenarioLeaders, {
        0: label(moderate[0].role.title),
        1: label(rapid[0].role.title),
      });
      p(copy.scenarioLimit);
      occupationSource();
      action(copy.exploreAction, 'explore');
      break;
    }
    case 'budget':
      p(copy.budget, { 0: profile.budget, 1: plan.totalCost });
      p(copy.costs);
      if (!plan.steps.length) p(copy.filters);
      action(copy.profileAction, 'profile');
      break;
    case 'time':
      p(copy.time, {
        0: profile.hours,
        1: profile.weeks,
        2: Math.max(0, profile.hours) * Math.max(0, profile.weeks),
      });
      if (!plan.steps.length) emptyPlan();
      else p(copy.plannedTime, { 0: plan.totalHours, 1: plan.weeks.length });
      action(copy.profileAction, 'profile');
      break;
    case 'funding': {
      const verifiedHrd = courses.filter(
        (course) => course.funding === 'hrd',
      ).length;
      p(copy.funding, {
        0: courses.filter((course) => course.funding === 'free').length,
        1: verifiedHrd,
      });
      p(copy.learning, {
        0: label(active.role.title),
        1: plan.steps.length,
        2: plan.totalHours,
        3: plan.totalCost,
      });
      if (!verifiedHrd) p(copy.noHrd);
      p(copy.verifyHrd);
      reply.sources.push({ label: copy.hrdSource, href: hrdUrl });
      action(copy.pathwayAction, 'pathway');
      break;
    }
    case 'evidence':
      p(copy.evidence, {
        0: snapshot.id,
        1: snapshot.asOf,
        2: snapshot.sampleSize,
        3: snapshot.signals.filter((signal) => signal.kind === 'research')
          .length,
      });
      p(snapshot.kind === 'simulation' ? copy.simulation : copy.live);
      if (snapshot.kind === 'live' && snapshot.sampleSize < 30)
        p(copy.smallSample);
      p(copy.evidenceAction);
      if (snapshot.kind === 'live')
        reply.sources.push(
          {
            label: copy.jobsSource,
            href: 'https://www.arbeitnow.com/api/job-board-api',
          },
          {
            label: copy.researchSource,
            href: 'https://rss.arxiv.org/rss/cs.AI',
          },
        );
      action(copy.evidenceViewAction, 'evidence');
      break;
    case 'team':
      p(copy.team, {
        0: getWorkforceMembers(workforce, profile).length,
        1: workforce.budget,
      });
      p(copy.teamRules);
      p(copy.teamLimit);
      action(copy.teamAction, 'team');
      break;
  }
  return reply;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stable(item)]),
    );
  return value;
}

/** Includes the supplied plan, so changing funding cannot silently reuse replies. */
export function careerChatContextKey(context: ChatContext): string {
  const { profile, ...planning } = context;
  return JSON.stringify(
    stable({
      ...planning,
      profile: {
        id: profile.id,
        budget: profile.budget,
        hours: profile.hours,
        weeks: profile.weeks,
        interests: [...profile.interests].sort(),
        skills: profile.skills,
        completed: [...profile.completed].sort(),
        learningPreferences: profile.learningPreferences,
      },
    }),
  );
}
