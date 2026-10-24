import type { SkillId } from './types';

type Candidate = { id: SkillId; evidence: string; level: number };

export type CvEvidenceState = {
  text: string;
  synthetic: boolean;
  candidates: Candidate[];
  message: string;
  requestId: number | null;
};

export type CvEvidenceAction =
  | { type: 'source'; text?: string; synthetic?: boolean }
  | { type: 'reset' }
  | { type: 'start'; requestId: number }
  | {
      type: 'complete';
      requestId: number;
      text?: string;
      candidates?: Candidate[];
      message: string;
    }
  | { type: 'message'; message: string };

export const initialCvEvidence: CvEvidenceState = {
  text: '',
  synthetic: false,
  candidates: [],
  message: '',
  requestId: null,
};

export function cvEvidenceReducer(
  state: CvEvidenceState,
  action: CvEvidenceAction,
): CvEvidenceState {
  switch (action.type) {
    case 'reset':
      return initialCvEvidence;
    case 'source':
      return {
        ...state,
        text: action.text ?? state.text,
        synthetic: action.synthetic ?? state.synthetic,
        candidates: [],
        message: '',
        requestId: null,
      };
    case 'start':
      return {
        ...state,
        candidates: [],
        message: '',
        requestId: action.requestId,
      };
    case 'complete':
      // Edits, profile changes, and newer requests invalidate old completions.
      if (action.requestId !== state.requestId) return state;
      return {
        ...state,
        text: action.text ?? state.text,
        candidates: action.candidates ?? [],
        message: action.message,
        requestId: null,
      };
    case 'message':
      return { ...state, message: action.message };
  }
}
