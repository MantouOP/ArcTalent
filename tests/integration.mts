import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baseline, baseProfile } from '../src/lib/catalogue';
import { rankRoles } from '../src/lib/engine';

const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const post = (path: string, body: unknown) =>
  fetch(origin + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
let checks = 0;
async function check(name: string, action: () => Promise<void>) {
  await action();
  checks++;
  console.log(`PASS ${name}`);
}
await check('production page renders', async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /ArcTalent/);
});
await check('health reports actual extraction mode', async () => {
  const response = await fetch(origin + '/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});
await check(
  'API and browser engine use identical recommendations',
  async () => {
    const response = await post('/api/analyze', {
      profile: baseProfile,
      scenario: 'moderate',
      snapshot: baseline,
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(
      result.matches,
      rankRoles(baseProfile, 'moderate', baseline),
    );
    assert.equal(result.plans.length, 6);
    assert.ok(result.shared.includes('data'));
  },
);
await check('invalid skill levels are rejected', async () => {
  const response = await post('/api/analyze', {
    profile: { ...baseProfile, skills: { sql: 8 } },
    scenario: 'rapid',
    snapshot: baseline,
  });
  assert.equal(response.status, 400);
});
await check('malformed JSON is rejected', async () => {
  const response = await fetch(origin + '/api/analyze', {
    method: 'POST',
    body: '{',
  });
  assert.equal(response.status, 400);
});
await check('oversized analysis requests are rejected', async () => {
  assert.equal(
    (await post('/api/analyze', { text: 'x'.repeat(100001) })).status,
    413,
  );
});
await check('synthetic confirmation is enforced', async () => {
  assert.equal(
    (
      await post('/api/extract', {
        text: 'I use Excel and SQL',
        synthetic: false,
      })
    ).status,
    400,
  );
});
await check(
  'skill extraction returns supported candidates and evidence',
  async () => {
    const text =
      'Fictional CV: I prepare Excel reports and use SQL and Power BI.';
    const response = await post('/api/extract', { text, synthetic: true });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.ok(result.skills.some((s: { id: string }) => s.id === 'excel'));
    assert.ok(
      result.skills.every((s: { evidence: string }) =>
        text.includes(s.evidence),
      ),
    );
    assert.ok(result.mode);
  },
);
await check('oversized extraction requests are rejected', async () => {
  assert.equal(
    (await post('/api/extract', { text: 'x'.repeat(17000), synthetic: true }))
      .status,
    413,
  );
});
await check('PDF confirmation is enforced', async () => {
  const form = new FormData();
  form.set('file', new Blob(['%PDF-test']), 'sample.pdf');
  assert.equal(
    (await fetch(origin + '/api/pdf', { method: 'POST', body: form })).status,
    400,
  );
});
await check('non-PDF bytes are rejected', async () => {
  const form = new FormData();
  form.set('synthetic', 'true');
  form.set('file', new Blob(['not a PDF']), 'sample.pdf');
  assert.equal(
    (await fetch(origin + '/api/pdf', { method: 'POST', body: form })).status,
    400,
  );
});
await check(
  'real synthetic PDF is parsed by the production server',
  async () => {
    const bytes = await readFile(
      new URL('../public/synthetic-cv.pdf', import.meta.url),
    );
    const form = new FormData();
    form.set('synthetic', 'true');
    form.set(
      'file',
      new Blob([bytes], { type: 'application/pdf' }),
      'sample.pdf',
    );
    const response = await fetch(origin + '/api/pdf', {
      method: 'POST',
      body: form,
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.match(result.text, /Aina/);
    assert.match(result.text, /SQL/);
    assert.equal(result.pages, 1);
  },
);
console.log(`${checks} production integration checks passed.`);
