import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { POST as extract } from '../src/app/api/extract/route';
import { POST as readPdf } from '../src/app/api/pdf/route';

const text = 'I prepare Excel spreadsheets and SQL reports for customers.';
const request = (body: unknown) =>
  new Request('http://localhost/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('a consented CV can be analysed without declaring it fictional', async () => {
  const response = await extract(
    request({ text, processingConsent: true, synthetic: false, useAi: false }),
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(
    result.skills.map((skill: { id: string }) => skill.id),
    ['excel', 'sql'],
  );
  assert.ok(
    result.skills.every((skill: { evidence: string }) =>
      text.includes(skill.evidence),
    ),
  );
});

test('real CV consent alone never opts a user into a configured AI provider', async (t) => {
  const variables = {
    RUNPOD_BASE_URL: 'https://api.runpod.ai/v2/test-endpoint/openai/v1',
    RUNPOD_MODEL: 'test-model',
    RUNPOD_API_KEY: 'test-only-key',
  };
  const previous = Object.fromEntries(
    Object.keys(variables).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, variables);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  let providerCalls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    providerCalls++;
    throw new Error('This test must never transmit CV text.');
  });
  for (const useAi of [undefined, false]) {
    const response = await extract(
      request({ text, processingConsent: true, useAi }),
    );
    assert.equal(response.status, 200);
    assert.match((await response.json()).mode, /local/i);
  }
  assert.equal(providerCalls, 0);
});

test('missing, declined and string-valued CV consent are rejected', async () => {
  for (const processingConsent of [undefined, false, 'true', 'false']) {
    const response = await extract(
      request({ text, processingConsent, useAi: false }),
    );
    assert.equal(response.status, 400);
  }
});

test('legacy confirmed synthetic requests remain compatible', async () => {
  const response = await extract(
    request({ text, synthetic: true, useAi: false }),
  );
  assert.equal(response.status, 200);
  assert.ok(
    (await response.json()).skills.some(
      (skill: { id: string }) => skill.id === 'excel',
    ),
  );
});

test('a consented PDF imports without claiming the file is synthetic', async () => {
  const bytes = await readFile(
    new URL('../public/synthetic-cv.pdf', import.meta.url),
  );
  const form = new FormData();
  form.set('processingConsent', 'true');
  form.set(
    'file',
    new Blob([bytes], { type: 'application/pdf' }),
    'personal-cv.pdf',
  );
  const response = await readPdf(
    new Request('http://localhost/api/pdf', { method: 'POST', body: form }),
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.match(result.text, /SQL/);
  assert.equal(result.pages, 1);
});

test('a PDF without processing consent is rejected before parsing', async () => {
  const form = new FormData();
  form.set('processingConsent', 'false');
  form.set('file', new Blob(['%PDF-test']), 'personal-cv.pdf');
  const response = await readPdf(
    new Request('http://localhost/api/pdf', { method: 'POST', body: form }),
  );
  assert.equal(response.status, 400);
});
