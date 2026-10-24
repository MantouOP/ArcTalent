import type { LearningPreferences, Profile } from './types';

export const focusOptions = [
  {
    value: 'data',
    label: 'Find the story in data',
    detail:
      'Spot patterns, investigate questions and explain what the numbers mean.',
    interest: 'Data & insights',
  },
  {
    value: 'people',
    label: 'Help people move forward',
    detail: 'Coordinate a project, explain an idea or help a colleague learn.',
    interest: 'People & projects',
  },
  {
    value: 'operations',
    label: 'Make everyday work run better',
    detail:
      'Improve a process, organise resources and solve practical bottlenecks.',
    interest: 'Business operations',
  },
  {
    value: 'sustainability',
    label: 'Solve an environmental challenge',
    detail:
      'Reduce waste and understand how an organisation affects the environment.',
    interest: 'Sustainability',
  },
] as const;

export const formatOptions = [
  {
    value: 'guided',
    label: 'Follow a worked example',
    detail: 'Read or watch a short lesson, then try the steps myself.',
    tip: 'Start with a worked example. Recreate it, then explain one step without looking at the lesson.',
  },
  {
    value: 'practice',
    label: 'Make something practical',
    detail: 'Learn by building a small report, process or project.',
    tip: 'Use a fictional work problem for a small practice project. Save the result and note what you still need to practise.',
  },
  {
    value: 'discussion',
    label: 'Explain and discuss an idea',
    detail: 'Talk through what I learned with a colleague or study partner.',
    tip: 'Explain one idea to a study partner, or record a short explanation for yourself. Use their questions to choose what to revisit.',
  },
] as const;

export function applyLearningPreferences(
  profile: Profile,
  preferences: LearningPreferences,
): Profile {
  return {
    ...profile,
    interests: [preferences.focus],
    learningPreferences: { ...preferences },
  };
}

export function buildStudyRhythm(
  hours: number,
  sessionMinutes: LearningPreferences['sessionMinutes'],
) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  return {
    fullSessions: Math.floor(totalMinutes / sessionMinutes),
    fullSessionMinutes: sessionMinutes,
    remainderMinutes: totalMinutes % sessionMinutes,
    totalMinutes,
  };
}
