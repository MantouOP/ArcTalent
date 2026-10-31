import type { Profile, Scenario, Snapshot } from './types';
import { baseline, roles } from './catalogue';
import { createProfileDraft } from './custom-inputs';
import { snapshotSchema } from './validation';
import {
  workforceSettingsSchema,
  type WorkforceSettings,
} from './workforce-settings';

export type FreshWorkspace = {
  needsSetup: true;
  profile: Profile;
  scenario: Scenario;
  snapshot: Snapshot;
  workforce: WorkforceSettings;
  customGoal: null;
};

export function createFreshWorkspace(): FreshWorkspace {
  return {
    needsSetup: true,
    profile: createProfileDraft('personal'),
    scenario: 'moderate',
    snapshot: structuredClone(baseline),
    workforce: {
      budget: 0,
      slots: Object.fromEntries(roles.map((role) => [role.id, 0])),
      destinations: {},
      members: [],
      customDestinations: {},
    },
    customGoal: null,
  };
}
export function restoreFreshWorkspace(value: unknown): FreshWorkspace | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const saved = value as Record<string, unknown>;
  if (saved.needsSetup !== true) return null;
  const fresh = createFreshWorkspace();
  const snapshot = snapshotSchema.safeParse(saved.snapshot);
  const workforce = workforceSettingsSchema.safeParse(saved.workforce);
  return {
    ...fresh,
    scenario: saved.scenario === 'rapid' ? 'rapid' : 'moderate',
    snapshot: snapshot.success ? snapshot.data : fresh.snapshot,
    workforce:
      workforce.success && workforce.data.members !== undefined
        ? workforce.data
        : fresh.workforce,
  };
}
