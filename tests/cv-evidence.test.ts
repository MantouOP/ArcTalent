import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cvEvidenceReducer,
  initialCvEvidence,
  type CvEvidenceAction,
} from '../src/lib/cv-evidence';
import { extractAliases } from '../src/lib/engine';

const originalText =
  'SYNTHETIC DEMO CV. Fictional Aina prepares Excel spreadsheets and SQL reports with Power BI dashboards, coordinates stakeholder meetings, and improves workflows.';
const replacementText =
  'SYNTHETIC DEMO CV. Fictional Aina writes Python scripts.';
const original = {
  ...initialCvEvidence,
  text: originalText,
  consented: true,
  candidates: extractAliases(originalText),
  message: 'Review these candidates.',
};

test('editing CV text immediately discards candidates from the previous sample', () => {
  assert.ok(original.candidates.some((candidate) => candidate.id === 'excel'));
  const next = cvEvidenceReducer(original, {
    type: 'source',
    text: replacementText,
  });
  assert.deepEqual(next.candidates, []);
  assert.equal(next.text, replacementText);
  assert.equal(next.message, '');
});

test('revoking processing consent discards evidence and rejects a pending extraction', () => {
  let state = cvEvidenceReducer(original, { type: 'start', requestId: 1 });
  state = cvEvidenceReducer(state, { type: 'source', consented: false });
  state = cvEvidenceReducer(state, {
    type: 'complete',
    requestId: 1,
    candidates: original.candidates,
    message: 'Old extraction completed.',
  });
  assert.deepEqual(state.candidates, []);
  assert.equal(state.consented, false);
  assert.equal(state.requestId, null);
  assert.equal(state.message, '');
});

test('switching profiles clears the sample, confirmation, and pending import', () => {
  let state = cvEvidenceReducer(original, { type: 'start', requestId: 1 });
  state = cvEvidenceReducer(state, { type: 'reset' });
  state = cvEvidenceReducer(state, {
    type: 'complete',
    requestId: 1,
    text: 'Old PDF text containing Excel.',
    message: 'Old PDF imported.',
  });
  assert.deepEqual(state, initialCvEvidence);
});

test('a new file import immediately discards candidates until its text is reviewed', () => {
  let state = cvEvidenceReducer(original, { type: 'start', requestId: 2 });
  assert.deepEqual(state.candidates, []);
  state = cvEvidenceReducer(state, {
    type: 'complete',
    requestId: 2,
    text: replacementText,
    message: 'Text imported. Choose Find skills to review candidates.',
  });
  assert.equal(state.text, replacementText);
  assert.deepEqual(state.candidates, []);
  assert.equal(state.requestId, null);
});

test('a late PDF import cannot overwrite a newer edited sample or its extraction', async () => {
  let state = original;
  const apply = (action: CvEvidenceAction) => {
    state = cvEvidenceReducer(state, action);
  };
  const oldPdf = Promise.withResolvers<string>();
  apply({ type: 'start', requestId: 1 });
  const pendingImport = oldPdf.promise.then((text) =>
    apply({
      type: 'complete',
      requestId: 1,
      text,
      message: 'Old PDF imported.',
    }),
  );
  apply({ type: 'source', text: replacementText });
  apply({ type: 'start', requestId: 2 });
  apply({
    type: 'complete',
    requestId: 2,
    candidates: extractAliases(replacementText),
    message: 'Current sample reviewed.',
  });
  oldPdf.resolve(originalText);
  await pendingImport;
  assert.equal(state.text, replacementText);
  assert.deepEqual(
    state.candidates.map((candidate) => candidate.id),
    ['python'],
  );
  assert.equal(state.message, 'Current sample reviewed.');
  assert.equal(state.requestId, null);
});

test('a superseded extraction cannot clear the busy state or report errors for a newer request', () => {
  let state = cvEvidenceReducer(original, { type: 'start', requestId: 1 });
  state = cvEvidenceReducer(state, { type: 'start', requestId: 2 });
  state = cvEvidenceReducer(state, {
    type: 'complete',
    requestId: 1,
    message: 'Old extraction failed.',
  });
  assert.equal(state.requestId, 2);
  assert.equal(state.message, '');
  assert.deepEqual(state.candidates, []);
});
