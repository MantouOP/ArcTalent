import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baseline, baseProfile, courses } from '../src/lib/catalogue';
import { avatarPresets } from '../src/lib/profile-pictures';
import type { LearningPlan } from '../src/lib/types';
import { rankRoles } from '../src/lib/engine';
import { buildCustomSnapshot } from '../src/lib/custom-inputs';
import { goalDraftSchema } from '../src/lib/career-goals';
import { PDFParse } from 'pdf-parse';
import {
  applyWorkforceGoal,
  restoreWorkforceSettings,
} from '../src/lib/workforce-settings';
import { analyseGoalLocally, careerGoalSchema } from '../src/lib/career-goals';
import { makeStudyProgressRequest } from '../src/lib/study-progress-ai';
import { detailedWorkforcePayload } from './fixtures/workforce-detailed';

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
await check(
  'introduction opens before the dashboard and links to both workspaces',
  async () => {
    const response = await fetch(origin);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Your next career/);
    assert.match(html, /href="\/workspace"/);
    assert.match(html, /href="\/workspace\/team"/);
    assert.match(html, /Language \/ Bahasa \/ 语言/);
    assert.doesNotMatch(html, /Career command center|Workforce command center/);
  },
);
await check('production workspace renders', async () => {
  const response = await fetch(origin + '/workspace');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /ArcTalent/);
  assert.match(html, /Loading your workspace/);
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(html, /Administrative assistant|Aina/);
});
await check('health reports actual extraction mode', async () => {
  const response = await fetch(origin + '/api/health');
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.ok, true);
  assert.ok(
    ['ai-configured', 'local-planning-guide'].includes(health.careerChat),
  );
  assert.ok(
    ['ai-configured', 'local-study-coach'].includes(health.studyProgress),
  );
  assert.equal(
    health.aiProvider === null,
    health.careerChat !== 'ai-configured',
  );
});
await check('all avatar choices are served as local SVG assets', async () => {
  await Promise.all(
    avatarPresets.map(async ({ id }) => {
      const response = await fetch(origin + '/avatars/' + id + '.svg');
      assert.equal(response.status, 200, id);
      assert.match(
        response.headers.get('content-type') ?? '',
        /image\/svg\+xml/,
      );
      assert.match(await response.text(), /<svg\s/);
    }),
  );
});
await check(
  'chat rejects missing consent, malformed input and oversized requests',
  async () => {
    for (const input of [
      { question: 'hello' },
      { consent: false },
      { consent: true, question: 'x'.repeat(33000) },
    ]) {
      const response = await post('/api/chat', input);
      assert.ok([400, 413].includes(response.status));
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  },
);
await check(
  'chat rejects cross-origin browser requests before invoking the model',
  async () => {
    const response = await fetch(origin + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://untrusted.invalid',
      },
      body: JSON.stringify({ consent: true, question: 'hello' }),
    });
    assert.equal(response.status, 403);
  },
);
await check(
  'same-origin chat requests reach validation behind a proxy host',
  async () => {
    const response = await fetch(origin + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ consent: false }),
    });
    assert.equal(response.status, 400);
  },
);
await check(
  'personal pathway exports the selected route as a searchable PDF with exact course links',
  async () => {
    const response = await post('/api/pathway-export', {
      profile: {
        ...baseProfile,
        learningPreferences: {
          focus: 'data',
          format: 'practice',
          sessionMinutes: 25,
          workAnswer: 'Build accessible community applications',
          practiceAnswer: 'Test a contact form with a friend',
        },
      },
      scenario: 'moderate',
      snapshot: baseline,
      roleId: 'bi',
      funding: 'all',
      locale: 'en',
    });
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get('content-type') ?? '',
      /^application\/pdf/,
    );
    assert.match(
      response.headers.get('content-disposition') ?? '',
      /ArcTalent-learning-plan\.pdf/,
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
      const { text } = await parser.getText();
      assert.match(text, /Your learning pathway/);
      assert.match(text, /Aina/);
      assert.match(text, /Business Intelligence Analyst/);
      assert.match(text, /Data analysis: visualisations in Excel/);
      assert.match(text, /Shared foundation/);
      assert.match(text, /Build accessible community applications/);
      assert.match(text, /Test a contact form with a friend/);
      assert.match(text, /25/);
    } finally {
      await parser.destroy();
    }
  },
);
await check(
  'personal PDF keeps custom specialist gaps and honours the selected funding filter',
  async () => {
    const customGoal = careerGoalSchema.parse(
      analyseGoalLocally({
        title: 'Frontend developer',
        description: 'HTML CSS and JavaScript',
      }),
    );
    const response = await post('/api/pathway-export', {
      profile: baseProfile,
      scenario: 'rapid',
      snapshot: baseline,
      roleId: 'custom-goal',
      customGoal,
      funding: 'hrd',
      locale: 'en',
    });
    assert.equal(response.status, 200);
    const parser = new PDFParse({
      data: new Uint8Array(await response.arrayBuffer()),
    });
    try {
      const { text } = await parser.getText();
      assert.match(text, /Frontend developer/);
      assert.match(text, /Accessibility testing/);
      assert.match(text, /Skills still to cover/);
      assert.match(text, /No new learning is scheduled/);
      assert.doesNotMatch(text, /5265446-build-your-first-web-pages/);
    } finally {
      await parser.destroy();
    }
  },
);
await check(
  'personal PDF supports Chinese and zero available learning time',
  async () => {
    const response = await post('/api/pathway-export', {
      profile: { ...baseProfile, name: '测试学习者', hours: 0 },
      scenario: 'moderate',
      snapshot: baseline,
      roleId: 'bi',
      funding: 'all',
      locale: 'zh-CN',
    });
    assert.equal(response.status, 200);
    const parser = new PDFParse({
      data: new Uint8Array(await response.arrayBuffer()),
    });
    try {
      const { text } = await parser.getText();
      assert.match(text, /你的学习路径/);
      assert.match(text, /测试学习者/);
      assert.doesNotMatch(text, /NaN|Infinity/);
    } finally {
      await parser.destroy();
    }
  },
);
await check(
  'personal PDF rejects malformed, unknown-role and oversized requests',
  async () => {
    assert.equal((await post('/api/pathway-export', {})).status, 400);
    assert.equal(
      (
        await post('/api/pathway-export', {
          profile: baseProfile,
          scenario: 'moderate',
          snapshot: baseline,
          roleId: 'made-up-role',
        })
      ).status,
      400,
    );
    assert.equal(
      (await post('/api/pathway-export', { description: 'x'.repeat(128001) }))
        .status,
      413,
    );
  },
);
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
  'custom workforce destinations export exact courses and specialist gaps for the selected worker',
  async () => {
    const goal = careerGoalSchema.parse(
      analyseGoalLocally({
        title: 'Frontend developer',
        description: 'HTML CSS and JavaScript',
      }),
    );
    const workforce = applyWorkforceGoal(
      { ...restoreWorkforceSettings(), members: [baseProfile] },
      baseProfile.id,
      goal,
      1,
    );
    const response = await post('/api/workforce-export', {
      profile: baseProfile,
      workforce,
      scenario: 'rapid',
      snapshot: { ...baseline, signals: [] },
      locale: 'en',
    });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(
      bytes
        .toString('latin1')
        .includes(
          '/URI (https://openclassrooms.com/us/courses/5265446-build-your-first-web-pages-with-html-and-css)',
        ),
    );
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    try {
      const { text } = await parser.getText();
      assert.match(text, /Frontend developer/);
      assert.match(text, /Accessibility testing/);
      assert.match(text, /Specialist skills not covered/);
    } finally {
      await parser.destroy();
    }
  },
);
await check(
  'a detailed ten-worker custom plan remains inside the bounded PDF request allowance',
  async () => {
    const payload = detailedWorkforcePayload();
    assert.ok(JSON.stringify(payload).length > 128000);
    const response = await post('/api/workforce-export', payload);
    assert.equal(response.status, 200);
    assert.equal(
      Buffer.from(await response.arrayBuffer())
        .subarray(0, 5)
        .toString(),
      '%PDF-',
    );
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
      (await post('/api/workforce-export', { description: 'x'.repeat(512001) }))
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
  'consented CV analysis works without a fictional-data declaration or AI opt-in',
  async () => {
    const response = await post('/api/extract', {
      text: 'I prepare Excel spreadsheets and SQL reports.',
      processingConsent: true,
      useAi: false,
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.match(result.mode, /local/i);
    assert.ok(
      result.skills.some((skill: { id: string }) => skill.id === 'excel'),
    );
  },
);
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
await check(
  'PDF processing accepts explicit consent without a synthetic declaration',
  async () => {
    const bytes = await readFile(
      new URL('../public/synthetic-cv.pdf', import.meta.url),
    );
    const form = new FormData();
    form.set('processingConsent', 'true');
    form.set('file', new Blob([bytes], { type: 'application/pdf' }), 'cv.pdf');
    const response = await fetch(origin + '/api/pdf', {
      method: 'POST',
      body: form,
    });
    assert.equal(response.status, 200);
    assert.match((await response.json()).text, /SQL/);
  },
);
await check(
  'study-progress rejects cross-origin, unconsented, unstudied-course and oversized requests',
  async () => {
    const crossOrigin = await fetch(origin + '/api/study-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://untrusted.invalid',
      },
      body: JSON.stringify({ consent: true }),
    });
    assert.equal(crossOrigin.status, 403);
    assert.equal(crossOrigin.headers.get('cache-control'), 'no-store');

    for (const bad of [
      { consent: false },
      {
        ...makeStudyProgressRequest({
          action: 'coach',
          locale: 'en',
          profile: baseProfile,
          scenario: 'moderate',
          snapshot: baseline,
          roleId: 'bi',
        }),
        action: 'verify-badge',
        courseId: 'sql',
        reflection: 'Practised SQL SELECT and JOIN queries on order tables.',
      },
      { reflection: 'x'.repeat(25000) },
    ]) {
      const res = await post('/api/study-progress', bad);
      assert.ok([400, 413].includes(res.status));
      assert.equal(res.headers.get('cache-control'), 'no-store');
    }
  },
);
await check(
  'study-progress coaches scheduled courses and verifies studied-course practice badges',
  async () => {
    const coachRes = await post(
      '/api/study-progress',
      makeStudyProgressRequest({
        action: 'coach',
        locale: 'en',
        profile: baseProfile,
        scenario: 'moderate',
        snapshot: baseline,
        roleId: 'bi',
      }),
    );
    assert.equal(coachRes.status, 200);
    assert.equal(coachRes.headers.get('cache-control'), 'no-store');
    const coachBody = await coachRes.json();
    assert.equal(coachBody.kind, 'coach');
    assert.ok(['ai', 'local'].includes(coachBody.mode));
    assert.ok(coachBody.summary.length > 10);
    assert.ok(coachBody.microTask.length > 10);
    for (const c of coachBody.courses) {
      const canonical = courses.find((item) => item.id === c.id);
      assert.ok(canonical);
      assert.equal(c.url, canonical.url);
    }

    const reflectionText =
      'I practised SQL SELECT, WHERE and JOIN queries on sample sales tables to summarise monthly totals.';
    const badgeRes = await post(
      '/api/study-progress',
      makeStudyProgressRequest({
        action: 'verify-badge',
        locale: 'en',
        profile: { ...baseProfile, completed: ['sql'] },
        scenario: 'moderate',
        snapshot: baseline,
        roleId: 'bi',
        courseId: 'sql',
        reflection: reflectionText,
      }),
    );
    assert.equal(badgeRes.status, 200);
    const badgeBody = await badgeRes.json();
    assert.equal(badgeBody.kind, 'verify-badge');
    assert.equal(badgeBody.awarded, true);
    assert.equal(badgeBody.courseId, 'sql');
    assert.ok(badgeBody.demonstratedSkills.length >= 1);
    for (const item of badgeBody.demonstratedSkills) {
      assert.equal(item.id, 'sql');
      assert.ok(reflectionText.includes(item.quote));
    }
  },
);
console.log(`${checks} production integration checks passed.`);
