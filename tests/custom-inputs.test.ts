import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCvFile,
  createProfileDraft,
  buildCustomSnapshot,
  computeDynamicSnapshotCounts,
  getSnapshotRecordCounts,
  isDifferentFromDefault,
  hasModifiedValues,
  sanitizeCustomNote,
  CUSTOM_SNAPSHOT_DISCLAIMER,
} from '../src/lib/custom-inputs';
import { snapshotSchema } from '../src/lib/validation';
import { baseProfile, baseline, updated } from '../src/lib/catalogue';
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

test('isDifferentFromDefault and hasModifiedValues compare snapshot values against default baseline', () => {
  assert.equal(isDifferentFromDefault(baseline), false);
  assert.equal(hasModifiedValues(baseline), false);

  assert.equal(isDifferentFromDefault(updated), true);
  assert.equal(hasModifiedValues(updated), true);

  const unmodifiedCustom = buildCustomSnapshot(
    {
      label: 'Unmodified default values',
      date: '2026-10-24',
      note: 'A dated synthetic update demonstrates sensitivity. It is not a claim about events on this date.',
      demand: percentages,
    },
    'custom-unmodified',
    '2026-10-24T00:00:00.000Z',
  );
  assert.equal(isDifferentFromDefault(unmodifiedCustom), false);
  assert.equal(hasModifiedValues(unmodifiedCustom), false);

  const modifiedCustom = buildCustomSnapshot(
    {
      label: 'Modified values',
      date: '2026-10-24',
      note: '',
      demand: { ...percentages, sustainability: 80 },
    },
    'custom-modified',
    '2026-10-24T00:00:00.000Z',
  );
  assert.equal(isDifferentFromDefault(modifiedCustom), true);
  assert.equal(hasModifiedValues(modifiedCustom), true);

  const resetPreset = {
    ...updated,
    market: { ...baseline.market },
  };
  assert.equal(isDifferentFromDefault(resetPreset), false);
  assert.equal(hasModifiedValues(resetPreset), false);

  const dateModifiedCustom = buildCustomSnapshot(
    {
      label: 'Date modified only',
      date: '2027-03-15',
      note: 'test',
      demand: percentages,
    },
    'custom-date-modified',
    '2026-10-24T00:00:00.000Z',
  );
  assert.equal(isDifferentFromDefault(dateModifiedCustom), true);
  assert.equal(dateModifiedCustom.note, CUSTOM_SNAPSHOT_DISCLAIMER);
  assert.equal(sanitizeCustomNote('test'), '');
});

test('dynamic snapshot counts scale with skill weights, adoption scenario, and date horizon instead of static 100/12', () => {
  const baselineCounts = computeDynamicSnapshotCounts({
    demand: percentages,
    date: '2026-10-19',
    scenario: 'moderate',
  });
  const rapidCounts = computeDynamicSnapshotCounts({
    demand: percentages,
    date: '2026-10-19',
    scenario: 'rapid',
  });
  const aiHeavyCounts = computeDynamicSnapshotCounts({
    demand: { ...percentages, ai: 95, python: 95, sql: 90, sustainability: 85 },
    date: '2027-06-01',
    scenario: 'rapid',
    label: 'AI and green operations expansion',
  });

  assert.notEqual(baselineCounts.jobRecords, 100);
  assert.notEqual(baselineCounts.researchRecords, 12);
  assert.notDeepEqual(baselineCounts, rapidCounts);
  assert.notDeepEqual(rapidCounts, aiHeavyCounts);

  const dynamicSnap = buildCustomSnapshot(
    {
      label: 'AI expansion case',
      date: '2027-06-01',
      note: 'test',
      demand: { ...percentages, ai: 95, python: 90 },
    },
    'custom-dynamic',
    '2026-10-24T00:00:00.000Z',
    { dynamic: true, scenario: 'rapid' },
  );
  assert.equal(dynamicSnap.note, CUSTOM_SNAPSHOT_DISCLAIMER);
  assert.ok(dynamicSnap.sampleSize > 0 && dynamicSnap.sampleSize !== 100);
  const recordCounts = getSnapshotRecordCounts(dynamicSnap, 'rapid');
  assert.equal(recordCounts.jobRecords, dynamicSnap.sampleSize);
  assert.ok(
    recordCounts.researchRecords > 0 && recordCounts.researchRecords !== 12,
  );
});
