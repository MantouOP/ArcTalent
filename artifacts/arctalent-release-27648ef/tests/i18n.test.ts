import test from 'node:test';
import assert from 'node:assert/strict';
import { dictionaries, resolveLocale, translate } from '../src/lib/i18n';
import {
  skills,
  roles,
  courses,
  employees,
  baseline,
  updated,
} from '../src/lib/catalogue';

test('only the three supported saved languages are accepted', () => {
  assert.equal(resolveLocale('en'), 'en');
  assert.equal(resolveLocale('ms'), 'ms');
  assert.equal(resolveLocale('zh-CN'), 'zh-CN');
  for (const invalid of [null, undefined, 'fr', 'zh', {}, 0])
    assert.equal(resolveLocale(invalid), 'en');
});

test('fixed interface headings translate into Malay and Simplified Chinese', () => {
  assert.equal(
    translate('en', 'Career command center'),
    'Career command center',
  );
  assert.equal(
    translate('ms', 'Career command center'),
    'Pusat kawalan kerjaya',
  );
  assert.equal(translate('zh-CN', 'Career command center'), '职业指挥中心');
});

test('whole-sentence interpolation retains zero and keeps unknown source text intact', () => {
  assert.equal(
    translate('en', 'Week {0}: {1} hours', { 0: 2, 1: 0 }),
    'Week 2: 0 hours',
  );
  assert.equal(
    translate('ms', 'Week {0}: {1} hours', { 0: 2, 1: 0 }),
    'Minggu 2: 0 jam',
  );
  assert.equal(
    translate('zh-CN', 'Week {0}: {1} hours', { 0: 2, 1: 0 }),
    '第2周：0小时',
  );
  assert.equal(
    translate('ms', 'Uncatalogued source title'),
    'Uncatalogued source title',
  );
  assert.equal(translate('zh-CN', 'CV quote <script>'), 'CV quote <script>');
  assert.equal(translate('zh-CN', '__proto__'), '__proto__');
  assert.equal(translate('ms', 'toString'), 'toString');
});

test('translation dictionaries have complete, nonempty counterparts and preserve interpolation values', () => {
  assert.deepEqual(
    Object.keys(dictionaries.ms).sort(),
    Object.keys(dictionaries['zh-CN']).sort(),
  );
  const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const [source, translated] of Object.entries(messages)) {
      assert.ok(translated.trim().length > 0, `${locale}: ${source}`);
      assert.deepEqual(
        placeholders(translated),
        placeholders(source),
        `${locale}: ${source}`,
      );
    }
});

test('evidence provenance and normal feed failures also have localised display copy', () => {
  const messages = [
    'Synthetic demo; no market claim',
    'Arbeitnow Europe sample; not Malaysian demand',
    'Global research; not adoption evidence',
    'Research feed unavailable; the job snapshot is usable.',
    'The public job source is unavailable. Your active snapshot has been kept. Try again later or use the labelled demo replay.',
  ];
  for (const locale of ['ms', 'zh-CN'] as const)
    for (const message of messages)
      assert.notEqual(translate(locale, message), message);
});

test('role, skill and catalogue display metadata have translations without changing canonical data', () => {
  const labels = [
    ...skills.flatMap((skill) => [skill.label, skill.rationale]),
    ...roles.flatMap((role) => [
      role.title,
      role.shortTitle,
      role.description,
      role.entry,
      role.rationale,
    ]),
    ...courses.flatMap((course) => [course.note, course.durationKind]),
    ...employees.map((employee) => employee.currentRole),
    ...[baseline, updated].flatMap((snapshot) => [
      snapshot.label,
      snapshot.note,
    ]),
  ];
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of labels)
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
  assert.equal(roles[0].title, 'Business Intelligence Analyst');
  assert.equal(skills[0].id, 'excel');
});
