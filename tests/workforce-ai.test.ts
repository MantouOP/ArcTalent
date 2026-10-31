import { test } from 'node:test';
import { z } from 'zod';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courses, roles } from '../src/lib/catalogue';
import { dictionaries } from '../src/lib/i18n';
import { createRunpodModel } from '../src/lib/runpod-model';
import {
  parseWorkforceReportLocally,
  planWorkforceFromReport,
  redactPersonalDetails,
  safeAlias,
  WORKFORCE_REPORT_SAMPLES,
  workforceModelOutputSchema,
  type WorkforceModelOutput,
} from '../src/lib/workforce-ai';
import { workforceSettingsSchema } from '../src/lib/workforce-settings';

const request = (report: string, extra = {}) => ({
  report,
  processingConsent: true as const,
  useAi: true,
  scenario: 'moderate' as const,
  locale: 'en' as const,
  ...extra,
});

/** A model that answers with the given JSON, through the real OpenAI-compatible client. */
function fakeModel(output: unknown) {
  return createRunpodModel(
    {
      baseURL: 'https://gateway.example.test/v1',
      apiKey: 'test-key',
      model: 'test-model',
    },
    async () =>
      new Response(
        JSON.stringify({
          id: 'test',
          object: 'chat.completion',
          created: 1,
          model: 'test-model',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: JSON.stringify(output) },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
  );
}

test('personal details are removed and full names shortened', () => {
  const { text, redactions } = redactPersonalDetails(
    'Reach me at nadia.k@corp.my or 012-345 6789. IC 900101-14-5678.',
  );
  assert.equal(redactions, 3);
  assert.doesNotMatch(text, /@|900101|345/);
  assert.equal(safeAlias('Ahmad Faizal bin Ali', 'Member 1'), 'Ahmad');
  assert.equal(safeAlias('Admin assistants', 'Member 1'), 'Admin assistants');
  assert.equal(safeAlias('LOG-4', 'Member 1'), 'LOG-4');
  assert.equal(safeAlias('ali@corp.my', 'Member 2'), 'Member 2');
});

test('the local parser reads both sample reports into a valid team plan', () => {
  for (const sample of WORKFORCE_REPORT_SAMPLES) {
    const workforce = parseWorkforceReportLocally(sample.report, 'moderate');
    assert.ok(workforce, sample.id);
    assert.ok(workforceSettingsSchema.safeParse(workforce).success, sample.id);
    const members = workforce.members!;
    assert.ok(members.length >= 6 && members.length <= 10, sample.id);
    for (const member of members) {
      assert.ok(Object.keys(member.skills).length > 0, member.name);
      const destination: string = workforce.destinations[member.id] ?? '';
      assert.ok(roles.some((r) => r.id === destination));
      assert.ok(workforce.slots[destination] >= 1);
    }
  }
  const retail = parseWorkforceReportLocally(
    WORKFORCE_REPORT_SAMPLES[0].report,
    'moderate',
  )!;
  assert.equal(retail.members![0].name, 'Nadia');
  assert.equal(retail.members![0].currentRole, 'Admin assistant');
  assert.equal(retail.budget, 6000, 'stated budget is read');
  assert.equal(retail.members!.length, 8, 'the budget line is not a person');
  assert.equal(
    parseWorkforceReportLocally(
      'Nothing here describes any people at all.',
      'moderate',
    ),
    null,
  );
});

test('without a model the plan is local and every figure is computed', async () => {
  const result = await planWorkforceFromReport(
    request(WORKFORCE_REPORT_SAMPLES[1].report, { useAi: false }),
  );
  assert.ok(result);
  assert.equal(result.mode, 'local');
  assert.deepEqual(
    result.summary.map((item) => item.kind),
    ['cohorts', 'gaps', 'effort'],
  );
  const effort = result.summary[2];
  assert.ok(effort.kind === 'effort' && effort.hours === result.stats.hours);
  for (const item of result.summary)
    if (item.kind === 'cohorts')
      for (const cohort of item.cohorts)
        assert.ok(
          courses.some((c) => c.title === cohort.title),
          'only catalogue courses',
        );
});

test('a model structures the report in one shot; its text cannot carry figures or links', async () => {
  const output: WorkforceModelOutput = {
    members: [
      {
        alias: 'Nadia Binti Rahman',
        currentRole: 'Admin assistant',
        skills: [
          { id: 'excel', level: 2 },
          { id: 'communication', level: 2 },
        ],
        interests: ['data'],
        hours: 4,
        destination: 'bi',
      },
      {
        alias: 'Ops-2',
        currentRole: 'Warehouse supervisor',
        skills: [
          { id: 'logistics', level: 2 },
          { id: 'process', level: 1 },
        ],
        interests: [],
        hours: 3,
        destination: 'logistics',
      },
    ],
    slots: [{ role: 'bi', openings: 1 }],
    budget: 4000,
    summary: [
      'Both people can share a data and process cohort.',
      'This saves 40% and RM 2,000 over 30 hours.',
    ],
  };
  const result = await planWorkforceFromReport(
    request(
      'Nadia Binti Rahman - Admin assistant: Excel. Ops-2 - Warehouse supervisor: logistics.',
    ),
    fakeModel(output),
  );
  assert.ok(result);
  assert.equal(result.mode, 'ai');
  assert.deepEqual(
    result.workforce.members!.map((m) => m.name),
    ['Nadia', 'Ops-2'],
  );
  assert.equal(
    result.workforce.slots.logistics,
    1,
    'every destination gets an opening',
  );
  assert.equal(result.workforce.budget, 4000);
  // The bullet with invented figures is dropped; the computed effort line is added.
  assert.deepEqual(
    result.summary.map((i) => i.kind),
    ['text', 'effort'],
  );
  // A manager's own budget wins over the model's suggestion.
  const capped = await planWorkforceFromReport(
    request('Nadia - Admin assistant: Excel and reports for the team.', {
      budget: 900,
    }),
    fakeModel(output),
  );
  assert.equal(capped?.workforce.budget, 900);
});

test('the model schema is strict structured-output compatible', () => {
  const schema = JSON.stringify(z.toJSONSchema(workforceModelOutputSchema));
  assert.doesNotMatch(schema, /"additionalProperties":\{/);
  assert.doesNotMatch(schema, /propertyNames/);
  assert.doesNotMatch(schema, /minItems/);
});

test('invalid model output falls back to the local parser', async () => {
  const result = await planWorkforceFromReport(
    request(WORKFORCE_REPORT_SAMPLES[1].report),
    fakeModel({
      members: [
        { alias: 'Visit https://evil.example', currentRole: '<b>x</b>' },
      ],
    }),
  );
  assert.ok(result);
  assert.equal(result.mode, 'local');
  assert.match(result.notice ?? '', /local parser/);
  assert.equal(result.workforce.members!.length, 6);
});

test('every workforce planner, table and Track Record label has Malay and Chinese copy', () => {
  const labels = new Set<string>();
  for (const file of [
    'workforce-planner',
    'employer-panel',
    'track-record-panel',
    'finals-widgets',
    'impact-scorecard',
  ])
    for (const m of readFileSync(`src/components/${file}.tsx`, 'utf8').matchAll(
      /\bt\(\s*'([^']+)'|\blabel: '([^']+)'/g,
    ))
      labels.add(m[1] ?? m[2]);
  for (const sample of WORKFORCE_REPORT_SAMPLES) labels.add(sample.label);
  for (const notice of [
    'AI is busy. A local parser read the report.',
    'AI planning was unavailable. A local parser read the report.',
  ])
    labels.add(notice);
  assert.ok(labels.size > 80);
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of labels)
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});
