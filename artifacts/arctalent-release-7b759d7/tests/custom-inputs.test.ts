import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCvFile,
  createProfileDraft,
  buildCustomSnapshot,
} from '../src/lib/custom-inputs';
import { snapshotSchema } from '../src/lib/validation';
import { baseProfile, baseline } from '../src/lib/catalogue';
import { rankRoles } from '../src/lib/engine';

test('CV file validation accepts supported case-insensitive names within 5 MiB', () => {
  for (const name of ['sample.pdf', 'sample.TXT']) {
    assert.equal(validateCvFile({ name, size: 5 * 1024 * 1024 }), null);
  }
  assert.equal(
    validateCvFile({ name: 'sample.pdf', size: 5 * 1024 * 1024 + 1 }),
    'Choose a file smaller than 5 MB.',
  );
  assert.equal(
    validateCvFile({ name: 'empty.txt', size: 0 }),
    'This file is empty. Choose another file or paste your experience.',
  );
  assert.equal(
    validateCvFile({ name: 'cv.docx', size: 10 }),
    'Use a text PDF or .txt file.',
  );
});

test('a blank profile has no inherited skill, interest or completed-course claims', () => {
  const draft = createProfileDraft('custom-test');
  assert.equal(draft.id, 'custom-test');
  assert.equal(draft.name, '');
  assert.equal(draft.currentRole, '');
  assert.deepEqual(draft.skills, {});
  assert.deepEqual(draft.interests, []);
  assert.deepEqual(draft.completed, []);
  draft.skills.python = 3;
  assert.deepEqual(createProfileDraft('second').skills, {});
});

const input = {
  label: 'My warehouse planning case',
  date: '2026-10-24',
  note: 'Fictional assumptions for a workshop.',
  demand: { ...baseline.market, python: 100, sustainability: 100, excel: 0 },
};
const percentages = Object.fromEntries(
  Object.entries(baseline.market).map(([key, value]) => [key, value * 100]),
);

test('custom demand is converted into a dated simulation and actually changes ranking scores', () => {
  const snapshot = buildCustomSnapshot(
    {
      ...input,
      demand: { ...percentages, python: 100, sustainability: 100, excel: 0 },
    },
    'custom-test',
    '2026-10-24T02:00:00.000Z',
  );
  assert.equal(snapshotSchema.safeParse(snapshot).success, true);
  assert.equal(snapshot.kind, 'simulation');
  assert.equal(snapshot.sampleSize, 0);
  assert.equal(snapshot.label, input.label);
  assert.equal(snapshot.market.python, 1);
  assert.equal(snapshot.market.excel, 0);
  assert.equal(snapshot.asOf, '2026-10-23T16:00:00.000Z');
  assert.match(snapshot.note, /User-entered planning assumptions/);
  assert.ok(
    snapshot.signals.every(
      (signal) => signal.kind === 'simulation' && signal.url === '',
    ),
  );
  assert.notDeepEqual(
    rankRoles(baseProfile, 'moderate', snapshot),
    rankRoles(baseProfile, 'moderate', baseline),
  );
});

test('custom snapshots reject impossible dates, blank labels and invalid percentages', () => {
  for (const change of [
    { date: '2026-02-30' },
    { date: '' },
    { label: '  ' },
    { demand: { python: 101 } },
    { demand: { python: -1 } },
    { demand: { python: NaN } },
    { demand: { unknown: 50 } },
  ]) {
    assert.throws(() =>
      buildCustomSnapshot(
        { ...input, demand: percentages, ...change },
        'custom-test',
        '2026-10-24T02:00:00.000Z',
      ),
    );
  }
});
