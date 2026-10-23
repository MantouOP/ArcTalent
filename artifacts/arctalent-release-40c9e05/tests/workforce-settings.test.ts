import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';

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
  for (const sustainability of [-1, 9, 1.5, Infinity, NaN, '2', null]) {
    assert.deepEqual(
      restoreWorkforceSettings({
        ...chosen,
        slots: { ...chosen.slots, sustainability },
      }),
      defaults,
    );
  }
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
