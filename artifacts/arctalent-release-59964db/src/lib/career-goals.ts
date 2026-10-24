import { z } from 'zod';
import { roles, skills } from './catalogue';
import { extractAliases } from './engine';
import {
  careerGoalInputSchema,
  careerGoalSchema,
  skillIdSchema,
} from './validation';
import type { CareerGoal, Role, SkillId } from './types';

export { careerGoalSchema } from './validation';
export type GoalInput = {
  title: string;
  description: string;
  locale?: 'en' | 'ms' | 'zh-CN';
};
export type GoalDraft = Omit<CareerGoal, 'requirements'> & {
  requirements: Partial<Record<SkillId, number>>;
};
export const goalDraftSchema = careerGoalSchema.extend({
  requirements: z.partialRecord(skillIdSchema, z.number().int().min(1).max(3)),
});

export const goalAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  family: z.enum(['data', 'people', 'operations', 'sustainability']),
  targets: z
    .array(
      z.object({ id: skillIdSchema, level: z.number().int().min(1).max(3) }),
    )
    .max(skills.length)
    .refine(
      (targets) =>
        new Set(targets.map((target) => target.id)).size === targets.length,
      'Duplicate skill targets',
    ),
  otherSkills: z.array(z.string().trim().min(1).max(120)).max(8),
});

const localSummary =
  'Local suggestions based on recognised career terms and skills in your description. Review and edit these learning targets.';
const unknownSummary =
  'No skill targets were recognised. Add your own targets below or describe the work and tools you want to learn.';
const goalPatterns: {
  pattern: RegExp;
  family: CareerGoal['family'];
  requirements: Partial<Record<SkillId, number>>;
  otherSkills: string[];
}[] = [
  {
    pattern: /web develop|front.?end|pembangun web|网页开发|前端/i,
    family: 'data',
    requirements: { htmlcss: 2, javascript: 2, critical: 2, project: 1 },
    otherSkills: ['Accessibility testing', 'Version control and deployment'],
  },
  {
    pattern: /data scien|machine learning|saintis data|数据科学|机器学习/i,
    family: 'data',
    requirements: { data: 2, python: 2, sql: 2, visual: 2, ai: 2, critical: 2 },
    otherSkills: ['Statistical modelling', 'Model evaluation'],
  },
  {
    pattern:
      /software develop|software engineer|pembangun perisian|软件开发|软件工程/i,
    family: 'data',
    requirements: { critical: 2, project: 1, communication: 2 },
    otherSkills: [
      'Programming language and frameworks for your chosen role',
      'Software testing',
      'Version control and deployment',
    ],
  },
  {
    pattern:
      /cyber.?security|information security|keselamatan siber|网络安全|信息安全/i,
    family: 'data',
    requirements: { security: 2, critical: 2, communication: 2, data: 1 },
    otherSkills: [
      'Network and operating system security',
      'Incident response practice',
    ],
  },
  {
    pattern: /digital market|social media|pemasaran digital|数字营销|数码营销/i,
    family: 'operations',
    requirements: { marketing: 2, data: 2, communication: 2, project: 1 },
    otherSkills: ['Campaign measurement and practice'],
  },
  {
    pattern: /ux design|user experience|用户体验/i,
    family: 'people',
    requirements: { stakeholder: 2, critical: 2, communication: 2, data: 1 },
    otherSkills: [
      'User research methods',
      'Interaction design and prototyping',
      'Accessibility testing',
    ],
  },
];

/** An explicit non-LLM fallback; unknown professions never receive made-up requirements. */
export function analyseGoalLocally(raw: GoalInput): GoalDraft {
  const input = careerGoalInputSchema.parse(raw);
  const text = `${input.title} ${input.description}`;
  const template = goalPatterns.find((option) => option.pattern.test(text));
  const existing = roles.find(
    (role) =>
      text.toLowerCase().includes(role.title.toLowerCase()) ||
      text.toLowerCase().includes(role.shortTitle.toLowerCase()),
  );
  const requirements: GoalDraft['requirements'] = {
    ...(template?.requirements ?? existing?.requirements ?? {}),
  };
  for (const skill of extractAliases(text))
    requirements[skill.id] = Math.max(requirements[skill.id] ?? 0, 2);
  return {
    title: input.title,
    description: input.description,
    family:
      template?.family ?? (existing?.family as CareerGoal['family']) ?? 'data',
    requirements,
    otherSkills: template?.otherSkills.slice() ?? [],
    summary: Object.keys(requirements).length ? localSummary : unknownSummary,
    mode: 'local',
  };
}

/** Model text can suggest skills; it never defines course identities or URLs. */
export function validateGoalAnalysis(
  raw: GoalInput,
  output: unknown,
): GoalDraft {
  const input = careerGoalInputSchema.parse(raw);
  const analysed = goalAnalysisSchema.parse(output);
  const known = new Set(
    skills.flatMap((skill) => [skill.id, skill.label.toLowerCase()]),
  );
  return {
    title: input.title,
    description: input.description,
    family: analysed.family,
    requirements: Object.fromEntries(
      analysed.targets.map((target) => [target.id, target.level]),
    ),
    otherSkills: analysed.otherSkills.filter(
      (skill) => !known.has(skill.toLowerCase()),
    ),
    summary: analysed.summary,
    mode: 'ai',
  };
}

export function goalToRole(goal: CareerGoal): Role {
  return {
    id: 'custom-goal',
    custom: true,
    title: goal.title,
    shortTitle: goal.title,
    description: goal.description || goal.summary,
    family: goal.family,
    requirements: goal.requirements,
    exposure: 0.5,
    source: '',
    target: '4.4',
    rationale:
      'This SDG mapping describes planned learning activity, not a measured career outcome.',
    entry:
      'Custom learning targets are planning assumptions. Verify specialist training, qualifications and local employer requirements separately.',
    color: '#65dbe8',
  };
}

export function goalCandidates(goal: CareerGoal | null | undefined): Role[] {
  return goal ? [...roles, goalToRole(goal)] : roles;
}
