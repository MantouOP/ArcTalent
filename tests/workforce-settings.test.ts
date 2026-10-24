import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkforceMembers,
  restoreWorkforceSettings,
  updateWorkforceProfile,
} from '../src/lib/workforce-settings';
import { baseProfile, employees } from '../src/lib/catalogue';

const defaults = {
  budget: 500,
  slots: {
    bi: 2,
    project: 2,
    sustainability: 1,
    logistics: 1,
    training: 1,
    management: 1,
  },
  destinations: {},
};

const chosen = {
  budget: 750,
  slots: { ...defaults.slots, sustainability: 2, project: 0 },
  destinations: { aina: 'sustainability', daniel: 'training' },
};

test('stored manager choices survive a JSON storage round trip', () => {
  const saved = JSON.parse(JSON.stringify({ workforce: chosen }));
  assert.deepEqual(restoreWorkforceSettings(saved.workforce), chosen);
});

test('older saves without workforce settings receive the demo defaults', () => {
  const saved = JSON.parse('{"scenario":"rapid"}');
  assert.deepEqual(restoreWorkforceSettings(saved.workforce), defaults);
});

test('invalid stored budgets and opening counts fall back to valid defaults', () => {
  for (const budget of [-1, 100001, Infinity, NaN, '750', null]) {
    assert.deepEqual(restoreWorkforceSettings({ ...chosen, budget }), defaults);
  }
  for (const sustainability of [-1, 11, 1.5, Infinity, NaN, '2', null]) {
    assert.deepEqual(
      restoreWorkforceSettings({
        ...chosen,
        slots: { ...chosen.slots, sustainability },
      }),
      defaults,
    );
  }
});

test('a custom roster and its destinations survive browser storage', () => {
  const member = {
    ...baseProfile,
    id: 'custom-worker',
    name: 'Fictional Nadia',
    skills: { python: 1 },
  };
  const custom = {
    ...chosen,
    members: [...employees, member],
    destinations: { ...chosen.destinations, 'custom-worker': 'bi' },
  };
  assert.deepEqual(
    restoreWorkforceSettings(JSON.parse(JSON.stringify(custom))),
    custom,
  );
});

test('an explicitly empty custom roster stays empty', () => {
  const empty = { ...chosen, members: [], destinations: {} };
  assert.deepEqual(restoreWorkforceSettings(empty), empty);
});

test('duplicate, oversized and invalid custom rosters cannot enter saved state', () => {
  for (const members of [
    [baseProfile, baseProfile],
    Array.from({ length: 11 }, (_, index) => ({
      ...baseProfile,
      id: `worker-${index}`,
    })),
    [{ ...baseProfile, name: '  ' }],
  ]) {
    assert.deepEqual(
      restoreWorkforceSettings({ ...chosen, members, destinations: {} }),
      defaults,
    );
  }
});

test('the active profile stays synchronized only when it belongs to the roster', () => {
  const edited = { ...baseProfile, name: 'Updated fictional worker', hours: 7 };
  const roster = { ...chosen, members: [baseProfile] };
  assert.deepEqual(getWorkforceMembers(roster, edited), [edited]);
  assert.deepEqual(getWorkforceMembers({ ...chosen, members: [] }, edited), []);
  assert.equal(getWorkforceMembers(chosen, edited).length, 8);
  assert.equal(baseProfile.hours, 4);
});

test('individual edits and completed learning stay in the roster after switching worker', () => {
  const before = {
    ...chosen,
    members: [{ ...baseProfile, hours: 7 }, employees[1]],
  };
  const updated = { ...baseProfile, hours: 9, completed: ['excel-openlearn'] };
  const saved = updateWorkforceProfile(before, updated);
  const switched = getWorkforceMembers(saved, employees[1]);
  assert.equal(switched[0].hours, 9);
  assert.deepEqual(switched[0].completed, updated.completed);
  assert.equal(before.members[0].hours, 7);
  assert.deepEqual(
    updateWorkforceProfile({ ...chosen, members: [] }, updated).members,
    [],
  );
});

test('hydrating a legacy active profile preserves its changes before switching worker', () => {
  const savedProfile = {
    ...baseProfile,
    hours: 9,
    completed: ['excel-openlearn'],
  };
  const hydrated = updateWorkforceProfile(
    restoreWorkforceSettings(chosen),
    savedProfile,
  );
  const switched = updateWorkforceProfile(hydrated, employees[1]);
  assert.equal(getWorkforceMembers(switched, employees[1])[0].hours, 9);
  assert.deepEqual(
    getWorkforceMembers(switched, employees[1])[0].completed,
    savedProfile.completed,
  );
});

test('stored workforce settings cannot introduce unknown workers or roles', () => {
  for (const invalid of [
    { ...chosen, destinations: { aina: 'unknown-role' } },
    { ...chosen, destinations: { 'unknown-worker': 'bi' } },
    { ...chosen, slots: { ...chosen.slots, 'unknown-role': 1 } },
  ]) {
    assert.deepEqual(restoreWorkforceSettings(invalid), defaults);
  }
});
