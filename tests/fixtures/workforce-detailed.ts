import { baseline, baseProfile, skills } from '../../src/lib/catalogue';
import {
  applyWorkforceGoal,
  restoreWorkforceSettings,
  type WorkforceSettings,
} from '../../src/lib/workforce-settings';
import type { CareerGoal, Profile } from '../../src/lib/types';

/** Maximum-length editable fields exercise JSON escaping, not just plain ASCII. */
export function detailedWorkforcePayload() {
  const fill = '\\';
  const goal: CareerGoal = {
    title: 'Custom career '.padEnd(100, fill),
    description: fill.repeat(1200),
    summary: fill.repeat(500),
    family: 'data',
    mode: 'manual',
    requirements: Object.fromEntries(skills.map((skill) => [skill.id, 2])),
    otherSkills: Array.from({ length: 8 }, (_, i) =>
      `Specialist ${i} `.padEnd(120, fill),
    ),
  };
  const members: Profile[] = Array.from({ length: 10 }, (_, i) => ({
    ...baseProfile,
    id: `full-${i}`,
    name: `Fictional ${i} `.padEnd(60, fill),
    currentRole: 'Role '.padEnd(100, fill),
    interests: ['data', 'people', 'operations', 'sustainability'],
    skills: Object.fromEntries(skills.map((skill) => [skill.id, 1])),
    completed: Array.from({ length: 30 }, (_, j) =>
      `course-${j}-`.padEnd(50, fill),
    ),
    learningPreferences: {
      focus: 'data',
      format: 'practice',
      sessionMinutes: 30,
      workAnswer: fill.repeat(600),
      practiceAnswer: fill.repeat(600),
    },
  }));
  let workforce: WorkforceSettings = { ...restoreWorkforceSettings(), members };
  for (const member of members)
    workforce = applyWorkforceGoal(workforce, member.id, goal, 1);
  return {
    profile: members[0],
    workforce,
    scenario: 'moderate' as const,
    snapshot: { ...baseline, signals: [], note: fill.repeat(2000) },
    locale: 'en' as const,
  };
}
