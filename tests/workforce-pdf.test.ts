import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFParse } from 'pdf-parse';
import { baseline, baseProfile, employees } from '../src/lib/catalogue';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';
import { buildWorkforcePlan } from '../src/lib/workforce-plan';
import { applyWorkforceGoal } from '../src/lib/workforce-settings';
import { analyseGoalLocally, careerGoalSchema } from '../src/lib/career-goals';
import { POST } from '../src/app/api/workforce-export/route';
import { detailedWorkforcePayload } from './fixtures/workforce-detailed';
import {
  renderWorkforcePdf,
  workforceExportSchema,
} from '../src/lib/workforce-pdf';

const input = {
  profile: baseProfile,
  workforce: restoreWorkforceSettings(),
  scenario: 'moderate',
  snapshot: baseline,
  locale: 'en',
};

test('valid escaped ten-worker state exports without exceeding the transport allowance', async () => {
  const payload = detailedWorkforcePayload();
  assert.equal(workforceExportSchema.safeParse(payload).success, true);
  const body = JSON.stringify(payload);
  assert.ok(body.length > 128000);
  const response = await POST(
    new Request('http://localhost/api/workforce-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(
    Buffer.from(await response.arrayBuffer())
      .subarray(0, 5)
      .toString(),
    '%PDF-',
  );
});

test('PDF includes custom destinations, worker-specific openings, exact course links and specialist gaps', async () => {
  const goal = careerGoalSchema.parse(
    analyseGoalLocally({
      title: 'Frontend developer',
      description: 'HTML CSS and JavaScript',
    }),
  );
  const workforce = applyWorkforceGoal(
    { ...input.workforce, members: [employees[1]] },
    employees[1].id,
    goal,
    1,
  );
  const pdf = await renderWorkforcePdf(
    workforceExportSchema.parse({ ...input, workforce }),
  );
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const { text, pages } = await parser.getText();
    assert.match(text, /Frontend developer/);
    assert.match(text, /Daniel.*Frontend developer: 1/);
    assert.match(text, /Accessibility testing/);
    assert.match(text, /Specialist skills not covered/);
    assert.match(text, /editable planning assumptions/);
    assert.ok(
      pages
        .find((page) => page.text.includes('Shared training courses'))
        ?.text.includes('Develop Your Critical Thinking'),
      'The shared course heading stays with its first course',
    );
    assert.ok(
      pdf
        .toString('latin1')
        .includes(
          '/URI (https://openclassrooms.com/us/courses/5265446-build-your-first-web-pages-with-html-and-css)',
        ),
    );
  } finally {
    await parser.destroy();
  }
});
test('PDF export has searchable plan text, exact course URLs and multiple numbered pages', async () => {
  const pdf = await renderWorkforcePdf(
    workforceExportSchema.parse(input),
    new Date('2026-10-24T15:00:00Z'),
  );
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const text = await parser.getText();
    assert.ok(text.total >= 2 && text.total <= 20);
    assert.match(text.text, /Workforce learning plan/);
    assert.match(text.text, /Aina/);
    assert.match(text.text, /19 Oct 2026/);
    assert.match(text.text, /Page 1/);
    text.pages.forEach((page, index) =>
      assert.ok(
        page.text.includes(`Page ${index + 1} of ${text.total}`),
        'Each real page has its matching footer, with no extra footer-only pages',
      ),
    );
    assert.match(text.text, /Introduction to SQL/);
    assert.ok(
      text.pages
        .find((page) => page.text.includes('Individual learning schedules'))
        ?.text.includes('Aina'),
      'The individual section heading stays with its first person',
    );
    assert.ok(
      text.pages
        .find((page) =>
          page.text.includes('Planning assumptions and SDG activity'),
        )
        ?.text.includes('No jobs saved'),
      'The assumptions heading stays with its explanation',
    );
    assert.ok(
      pdf
        .toString('latin1')
        .includes('/URI (https://sqlbolt.com/lesson/introduction)'),
    );
  } finally {
    await parser.destroy();
  }
});

test('PDF preserves Chinese names, localised labels, exclusions and an empty team', async () => {
  const pdf = await renderWorkforcePdf(
    workforceExportSchema.parse({
      ...input,
      locale: 'zh-CN',
      workforce: {
        ...input.workforce,
        members: [
          {
            ...employees[0],
            id: 'pdf-chinese',
            name: '林美玲',
            currentRole: '行政助理',
          },
        ],
        slots: Object.fromEntries(
          Object.keys(input.workforce.slots).map((id) => [id, 0]),
        ),
      },
    }),
  );
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const { text } = await parser.getText();
    assert.match(text, /林美玲/);
    assert.match(text, /行政助理/);
    assert.match(text, /员工学习计划/);
    assert.doesNotMatch(text, /Introduction to SQL/);
  } finally {
    await parser.destroy();
  }
  const empty = await renderWorkforcePdf(
    workforceExportSchema.parse({
      ...input,
      workforce: { ...input.workforce, members: [] },
    }),
  );
  const reader = new PDFParse({ data: new Uint8Array(empty) });
  try {
    assert.match((await reader.getText()).text, /No team members/);
  } finally {
    await reader.destroy();
  }
});

test('export validation rejects malformed state instead of replacing it with demo data', () => {
  assert.equal(
    workforceExportSchema.safeParse({ ...input, locale: 'bad' }).success,
    false,
  );
  assert.equal(
    workforceExportSchema.safeParse({
      ...input,
      workforce: { ...input.workforce, members: Array(11).fill(baseProfile) },
    }).success,
    false,
  );
  assert.equal(
    workforceExportSchema.safeParse({
      ...input,
      workforce: { ...input.workforce, budget: -1 },
    }).success,
    false,
  );
});

test('a valid multiline evidence note continues across pages without losing content or numbering', async () => {
  const note = Array.from({ length: 80 }, (_, i) => `Assumption ${i + 1}`).join(
    '\n',
  );
  const pdf = await renderWorkforcePdf(
    workforceExportSchema.parse({ ...input, snapshot: { ...baseline, note } }),
  );
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const result = await parser.getText();
    assert.match(result.text, /Assumption 1\b/);
    assert.match(result.text, /Assumption 80\b/);
    result.pages.forEach((page, i) =>
      assert.ok(page.text.includes(`Page ${i + 1} of ${result.total}`)),
    );
  } finally {
    await parser.destroy();
  }
});

test('long ten-person course groups keep each direct URL with its course heading', async () => {
  const members = Array.from({ length: 10 }, (_, i) => ({
    ...employees[i % employees.length],
    id: `long-${i}`,
    name: '培训团队成员林美玲陈伟敏'.repeat(4) + i,
    currentRole: '负责企业运营与数据分析以及跨部门协作的行政专员'.repeat(3),
    hours: 10,
    weeks: 26,
  }));
  const validated = workforceExportSchema.parse({
    ...input,
    locale: 'zh-CN',
    workforce: {
      ...input.workforce,
      members,
      slots: Object.fromEntries(
        Object.keys(input.workforce.slots).map((id) => [id, 10]),
      ),
      destinations: Object.fromEntries(
        members.map((member) => [member.id, 'bi']),
      ),
    },
  });
  const result = buildWorkforcePlan(
    validated.profile,
    validated.scenario,
    validated.snapshot,
    validated.workforce,
  );
  const parser = new PDFParse({
    data: new Uint8Array(await renderWorkforcePdf(validated)),
  });
  try {
    const { pages } = await parser.getText();
    for (const { course } of result.groups.values()) {
      const page = pages.find((page) =>
        page.text.replace(/\s/g, '').includes(course.url),
      );
      assert.ok(page, 'Every grouped course has its visible direct URL');
      assert.ok(
        page.text.replace(/\s/g, '').includes(course.title.replace(/\s/g, '')),
        'A course URL must stay on the page with its heading',
      );
    }
  } finally {
    await parser.destroy();
  }
});
