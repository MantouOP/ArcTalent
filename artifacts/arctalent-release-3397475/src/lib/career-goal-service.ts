import { careerGoalInputSchema } from './validation';
import {
  analyseGoalLocally,
  validateGoalAnalysis,
  type GoalInput,
  type GoalDraft,
} from './career-goals';

export type GoalAnalysisResult = { draft: GoalDraft; notice: string };

/** The model boundary is injected so availability and invalid output are testable without live credentials. */
export async function analyseCareerGoal(
  raw: unknown,
  model?: (input: GoalInput) => Promise<unknown>,
): Promise<GoalAnalysisResult> {
  const input = careerGoalInputSchema.parse(raw);
  if (model) {
    try {
      return {
        draft: validateGoalAnalysis(input, await model(input)),
        notice: '',
      };
    } catch {
      return {
        draft: analyseGoalLocally(input),
        notice:
          'AI analysis is unavailable right now. These are local suggestions you can edit.',
      };
    }
  }
  return {
    draft: analyseGoalLocally(input),
    notice:
      'AI is not connected. Local suggestions and manual skill targets are available.',
  };
}
