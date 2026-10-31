import test from 'node:test';
import assert from 'node:assert/strict';
import { baseline, baseProfile } from '../src/lib/catalogue';
import { profileSchema } from '../src/lib/validation';
import {
  getWorkforceMembers,
  restoreWorkforceSettings,
} from '../src/lib/workforce-settings';
import {
  createFreshWorkspace,
  restoreFreshWorkspace,
} from '../src/lib/workspace-defaults';

test('fresh workspace starts with no personal data or sample employees', () => {
  const fresh = createFreshWorkspace();
  assert.equal(fresh.needsSetup, true);
  assert.equal(fresh.profile.name, '');
  assert.equal(fresh.profile.currentRole, '');
  assert.deepEqual(fresh.profile.skills, {});
  assert.deepEqual(fresh.profile.interests, []);
  assert.deepEqual(fresh.profile.completed, []);
  assert.equal(fresh.profile.customSkills, undefined);
  assert.equal(fresh.profile.customInterests, undefined);
  assert.equal(fresh.profile.learningPreferences, undefined);
  assert.equal(fresh.profile.hours, 4);
  assert.equal(fresh.profile.budget, 0);
  assert.equal(fresh.profile.weeks, 8);
  assert.equal(fresh.customGoal, null);
  assert.equal(fresh.scenario, 'moderate');
  assert.equal(fresh.snapshot.id, baseline.id);
  assert.equal(fresh.workforce.budget, 0);
  assert.deepEqual(fresh.workforce.destinations, {});
  assert.ok(Object.values(fresh.workforce.slots).every((count) => count === 0));
  assert.deepEqual(getWorkforceMembers(fresh.workforce, fresh.profile), []);
});

test('blank workspace survives JSON storage without becoming the Aina demo', () => {
  const restored = restoreFreshWorkspace(
    JSON.parse(JSON.stringify(createFreshWorkspace())),
  );
  assert.ok(restored);
  assert.equal(restored.profile.name, '');
  assert.equal(restored.needsSetup, true);
  assert.deepEqual(restored.workforce.members, []);
  assert.equal(profileSchema.safeParse(restored.profile).success, false);
  assert.equal(
    profileSchema.safeParse({ ...restored.profile, name: 'New learner' })
      .success,
    true,
  );
});

test('fresh restoration rejects malformed team/evidence data and keeps valid user team edits', () => {
  const fresh = createFreshWorkspace();
  const invalid = restoreFreshWorkspace({
    ...fresh,
    profile: baseProfile,
    workforce: { budget: -10 },
    snapshot: { id: 'invalid' },
    scenario: 'unknown',
  });
  assert.ok(invalid);
  assert.equal(invalid.profile.name, '');
  assert.deepEqual(invalid.workforce.members, []);
  assert.equal(invalid.snapshot.id, baseline.id);
  assert.equal(invalid.scenario, 'moderate');
  const missingMembers = restoreFreshWorkspace({
    ...fresh,
    workforce: restoreWorkforceSettings(),
  });
  assert.deepEqual(missingMembers?.workforce.members, []);
  assert.equal(missingMembers?.workforce.budget, 0);
  const edited = restoreFreshWorkspace({
    ...fresh,
    scenario: 'rapid',
    workforce: {
      ...fresh.workforce,
      members: [{ ...baseProfile, id: 'new-worker', name: 'New colleague' }],
    },
  });
  assert.equal(edited?.workforce.members?.[0].name, 'New colleague');
  assert.equal(edited?.scenario, 'rapid');
});

test('fresh defaults are independent and only explicit setup mode overrides legacy data', () => {
  const first = createFreshWorkspace();
  first.profile.skills.excel = 3;
  first.profile.completed.push('example');
  first.snapshot.market.excel = 0;
  first.workforce.members?.push({ ...baseProfile });
  const second = createFreshWorkspace();
  assert.deepEqual(second.profile.skills, {});
  assert.deepEqual(second.profile.completed, []);
  assert.deepEqual(second.workforce.members, []);
  assert.equal(second.snapshot.market.excel, baseline.market.excel);
  assert.notEqual(second.profile, baseProfile);
  for (const value of [
    null,
    [],
    {},
    { profile: baseProfile },
    { needsSetup: false },
  ])
    assert.equal(restoreFreshWorkspace(value), null);
});
