import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import {
  baseline,
  baseProfile,
  roles,
  sdgGoal,
  sdgLabel,
  sdgUrl,
  skills,
} from '../src/lib/catalogue';
import { buildPlan } from '../src/lib/engine';
import {
  aggregateSdgContributions,
  computeLearnerBadges,
  SDG_FOCUS_OPTIONS,
} from '../src/lib/finals-enhancements';
import { dictionaries } from '../src/lib/i18n';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';

test('SDG targets are shown as whole UN goals', () => {
  assert.equal(sdgGoal('4.4'), '4');
  assert.equal(sdgLabel('4.4'), 'SDG 4');
  assert.equal(sdgLabel('10.3'), 'SDG 10');
  assert.equal(sdgLabel('9'), 'SDG 9');
  assert.equal(sdgUrl('8.2'), 'https://sdgs.un.org/goals/goal8');
  for (const item of [...skills, ...roles])
    assert.match(sdgLabel(item.target), /^SDG (?:[1-9]|1[0-7])$/);
});

test('lens badges, SDG totals and badges use goal numbers, never sub-targets', () => {
  for (const option of SDG_FOCUS_OPTIONS)
    assert.match(option.badge, /^(?:All SDGs|SDG (?:[1-9]|1[0-7]))$/);
  const role = roles[0];
  const plan = buildPlan(baseProfile, role);
  const totals = aggregateSdgContributions(
    baseProfile,
    role,
    plan,
    'moderate',
    baseline,
    restoreWorkforceSettings(),
  );
  for (const item of [...totals.person, ...totals.company])
    assert.match(item.target, /^\d+$/);
  const badges = computeLearnerBadges(baseProfile, plan, [], role).badges;
  for (const badge of badges) {
    assert.match(sdgLabel(badge.sdgTarget), /^SDG \d+$/);
    assert.doesNotMatch(badge.progressText, /SDG \d+\.\d/);
  }
});

test('no interface, PDF or translation text shows a decimal SDG sub-target', () => {
  const sources = [
    ...readdirSync('src/components').map((f) => `src/components/${f}`),
    'src/lib/pathway-pdf.ts',
    'src/lib/workforce-pdf.ts',
  ].filter((f) => /\.(tsx?|ts)$/.test(f));
  for (const file of sources)
    assert.doesNotMatch(
      readFileSync(file, 'utf8'),
      /SDG\s+\d+\.\d|Targets? \d+\.\d/,
      file,
    );
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const [key, value] of Object.entries(messages))
      assert.doesNotMatch(
        `${key} ${value}`,
        /SDG\s+\d+\.\d/,
        `${locale}: ${key}`,
      );
});
