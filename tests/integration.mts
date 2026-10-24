import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baseline, baseProfile, courses } from '../src/lib/catalogue';
import type { LearningPlan } from '../src/lib/types';
import { rankRoles } from '../src/lib/engine';
import { buildCustomSnapshot } from '../src/lib/custom-inputs';
import { goalDraftSchema } from '../src/lib/career-goals';
import { PDFParse } from 'pdf-parse';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';

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
  const html = await response.text();
  assert.match(html, /ArcTalent/);
  assert.match(html, /Language \/ Bahasa \/ 语言/);
  assert.match(html, /value="en"/);
  assert.match(html, /value="ms"/);
  assert.match(html, /value="zh-CN"/);
  assert.match(html, /简体中文/);
  assert.ok(html.includes('Open settings'), 'Settings launcher is rendered');
  assert.ok(
    html.includes('Open career assistant'),
    'Career assistant launcher is rendered',
  );
});
await check('health reports actual extraction mode', async () => {
  const response = await fetch(origin + '/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});
await check(
  'workforce export downloads a searchable PDF with exact course links',
  async () => {
    const response = await post('/api/workforce-export', {
      profile: baseProfile,
      workforce: restoreWorkforceSettings(),
      scenario: 'moderate',
      snapshot: { ...baseline, signals: [] },
      locale: 'en',
    });
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get('content-type') ?? '',
      /^application\/pdf/,
    );
    assert.match(
      response.headers.get('content-disposition') ?? '',
      /attachment; filename="ArcTalent-workforce-plan.pdf"/,
    );
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.ok(
      bytes
        .toString('latin1')
        .includes('/URI (https://sqlbolt.com/lesson/introduction)'),
    );
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    try {
      const result = await parser.getText();
      assert.match(result.text, /Aina/);
      assert.match(result.text, /Workforce learning plan/);
      assert.ok(result.total >= 2);
    } finally {
      await parser.destroy();
    }
  },
);
await check(
  'an explicitly empty workforce produces a localised PDF without demo workers',
  async () => {
    const response = await post('/api/workforce-export', {
      profile: baseProfile,
      workforce: { ...restoreWorkforceSettings(), members: [] },
      scenario: 'rapid',
      snapshot: { ...baseline, signals: [] },
      locale: 'zh-CN',
    });
    assert.equal(response.status, 200);
    const parser = new PDFParse({
      data: new Uint8Array(await response.arrayBuffer()),
    });
    try {
      const { text } = await parser.getText();
      assert.match(text, /员工学习计划/);
      assert.match(text, /此计划中没有团队成员/);
      assert.doesNotMatch(text, /Aina|Daniel/);
    } finally {
      await parser.destroy();
    }
  },
);
await check(
  'invalid and oversized workforce exports return ordinary errors',
  async () => {
    assert.equal((await post('/api/workforce-export', {})).status, 400);
    assert.equal(
      (
        await post('/api/workforce-export', {
          profile: baseProfile,
          workforce: { ...restoreWorkforceSettings(), budget: -1 },
          scenario: 'moderate',
          snapshot: baseline,
        })
      ).status,
      400,
    );
    assert.equal(
      (await post('/api/workforce-export', { description: 'x'.repeat(64001) }))
        .status,
      413,
    );
    const response = await fetch(origin + '/api/workforce-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(response.status, 400);
  },
);
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
await check(
  'a user-defined career participates in analysis and receives verified course links',
  async () => {
    const response = await post('/api/analyze', {
      profile: { ...baseProfile, hours: 10, weeks: 26 },
      scenario: 'moderate',
      snapshot: baseline,
      customGoal: {
        title: 'My web developer destination',
        description: 'Create accessible websites.',
        family: 'data',
        requirements: { htmlcss: 2, javascript: 2, critical: 2 },
        otherSkills: ['Accessibility testing'],
        summary: 'A personal learning target for web development.',
        mode: 'manual',
      },
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.matches.length, 7);
    const custom = result.plans.find(
      (plan: { roleId: string }) => plan.roleId === 'custom-goal',
    );
    assert.ok(custom);
    assert.ok(
      custom.steps.some(
        (step: { course: { id: string } }) => step.course.id === 'htmlcss',
      ),
    );
    assert.ok(
      custom.steps.some(
        (step: { course: { id: string } }) => step.course.id === 'javascript',
      ),
    );
  },
);
await check(
  'free-text career analysis returns an honest, editable goal draft',
  async () => {
    const response = await post('/api/career-goal', {
      title: 'Web developer',
      description: 'Build accessible websites with HTML, CSS and JavaScript.',
      locale: 'en',
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    const draft = goalDraftSchema.parse(result.draft);
    assert.equal(draft.title, 'Web developer');
    assert.ok(['ai', 'local'].includes(draft.mode));
    if (draft.mode === 'local') {
      assert.match(result.notice, /AI/);
      assert.equal(draft.requirements.htmlcss, 2);
      assert.equal(draft.requirements.javascript, 2);
    }
  },
);
await check(
  'invalid and oversized career analysis inputs are rejected',
  async () => {
    assert.equal((await post('/api/career-goal', { title: '' })).status, 400);
    assert.equal(
      (
        await post('/api/career-goal', {
          title: 'Test goal',
          description: 'x'.repeat(7000),
        })
      ).status,
      413,
    );
    assert.equal(
      (
        await post('/api/analyze', {
          profile: baseProfile,
          scenario: 'moderate',
          snapshot: baseline,
          customGoal: { title: 'Invalid goal', requirements: {} },
        })
      ).status,
      400,
    );
  },
);
await check(
  'all returned pathways retain exact catalogue course titles and direct URLs',
  async () => {
    const response = await post('/api/analyze', {
      profile: { ...baseProfile, hours: 10, weeks: 26 },
      scenario: 'rapid',
      snapshot: baseline,
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.plans.length, 6);
    let checked = 0;
    for (const plan of result.plans as LearningPlan[]) {
      for (const { course } of plan.steps) {
        const canonical = courses.find((entry) => entry.id === course.id);
        assert.ok(canonical);
        assert.equal(course.title, canonical.title);
        assert.equal(course.url, canonical.url);
        assert.equal(course.provider, canonical.provider);
        assert.equal(course.checkedAt, '2026-10-24');
        checked++;
      }
    }
    assert.ok(checked > 0);
  },
);
await check(
  'custom profile answers and dated assumptions reach the same analysis engine',
  async () => {
    const profile = {
      ...baseProfile,
      id: 'custom-api',
      name: 'Fictional Nadia',
      learningPreferences: {
        focus: 'sustainability' as const,
        format: 'practice' as const,
        sessionMinutes: 45,
        workAnswer: 'Reduce warehouse waste.',
        practiceAnswer: 'Build a fictional stock dashboard.',
      },
    };
    const snapshot = buildCustomSnapshot(
      {
        label: 'Custom API planning case',
        date: '2026-10-24',
        note: 'Fictional workshop case.',
        demand: { sustainability: 100, python: 75, excel: 10 },
      },
      'custom-api-test',
      '2026-10-24T02:00:00.000Z',
    );
    const response = await post('/api/analyze', {
      profile,
      scenario: 'rapid',
      snapshot,
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.snapshotId, snapshot.id);
    assert.deepEqual(result.matches, rankRoles(profile, 'rapid', snapshot));
  },
);
await check(
  'preference-bearing profiles retain explicit interests in API matching',
  async () => {
    const profile = {
      ...baseProfile,
      interests: ['sustainability'],
      learningPreferences: {
        focus: 'data',
        format: 'practice',
        sessionMinutes: 30,
      },
    };
    const response = await post('/api/analyze', {
      profile,
      scenario: 'moderate',
      snapshot: baseline,
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(
      result.matches.find(
        (match: { role: { id: string } }) => match.role.id === 'sustainability',
      ).interest,
      100,
    );
    assert.equal(
      result.matches.find(
        (match: { role: { id: string } }) => match.role.id === 'bi',
      ).interest,
      40,
    );
  },
);
await check(
  'invalid study preferences are rejected instead of silently discarded',
  async () => {
    const response = await post('/api/analyze', {
      profile: {
        ...baseProfile,
        learningPreferences: {
          focus: 'data',
          format: 'practice',
          sessionMinutes: -30,
        },
      },
      scenario: 'moderate',
      snapshot: baseline,
    });
    assert.equal(response.status, 400);
  },
);
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
