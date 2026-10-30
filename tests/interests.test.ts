import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, baseline, roles } from '../src/lib/catalogue';
import { buildPlan, matchRole, sharedFoundation } from '../src/lib/engine';
import { makeChatRequest } from '../src/lib/career-chat-request';
import { dictionaries } from '../src/lib/i18n';
import { effectiveInterests, matchInterestAreas } from '../src/lib/interests';
import { restoreWorkforceSettings } from '../src/lib/workforce-settings';
import type { Profile } from '../src/lib/types';
import { profileSchema } from '../src/lib/validation';

test('typed interests match work areas in English, Malay and Chinese', () => {
  for (const [text, areas] of [
    ['Data visualisation', ['data']],
    ['Excel dashboards', ['data']],
    ['AI ethics', ['data']],
    ['Teaching adults', ['people']],
    ['Supply chain management', ['operations']],
    ['Green logistics', ['operations', 'sustainability']],
    ['Analisis data', ['data']],
    ['Latihan pekerja', ['people']],
    ['Alam sekitar', ['sustainability']],
    ['Kemampanan', ['sustainability']],
    ['数据分析', ['data']],
    ['人工智能', ['data']],
    ['团队管理', ['people']],
    ['环保', ['sustainability']],
  ] as const)
    assert.deepEqual(matchInterestAreas(text), areas, text);
});

test('interests outside the four work areas stay unmatched', () => {
  for (const text of [
    'Graphic design',
    // Short and listed words only match whole: no "excel" in "excellent", no "ai" in "maintenance".
    'Excellent cooking',
    'Car maintenance',
    // "碳水化合物" is carbohydrate, not carbon.
    '碳水化合物',
  ])
    assert.deepEqual(matchInterestAreas(text), [], text);
});

test('matched typed interests join the ticked work areas once each', () => {
  assert.deepEqual(
    effectiveInterests({
      interests: ['people'],
      customInterests: ['Data visualisation', 'Graphic design', 'data science'],
    }),
    ['data', 'people'],
  );
  assert.deepEqual(effectiveInterests({ interests: ['data'] }), ['data']);
});

test('a typed interest counts towards the interest score like a ticked box', () => {
  const role = roles.find((candidate) => candidate.family === 'data')!;
  const none: Profile = { ...baseProfile, interests: [] };
  const typed: Profile = { ...none, customInterests: ['Data analysis'] };
  const ticked: Profile = { ...none, interests: ['data'] };
  const score = (profile: Profile) =>
    matchRole(profile, role, 'moderate', baseline);
  assert.equal(score(none).interest, 40);
  assert.equal(score(typed).interest, 100);
  assert.equal(score(typed).score, score(ticked).score);
  assert.ok(score(typed).score > score(none).score);
});

test('profiles keep typed interests within the saved limits', () => {
  assert.ok(profileSchema.safeParse(baseProfile).success);
  const parsed = profileSchema.parse({
    ...baseProfile,
    customInterests: ['Graphic design'],
  });
  assert.deepEqual(parsed.customInterests, ['Graphic design']);
  for (const customInterests of [
    ['x'.repeat(41)],
    [''],
    Array.from({ length: 9 }, (_, index) => `Interest ${index}`),
  ])
    assert.equal(
      profileSchema.safeParse({ ...baseProfile, customInterests }).success,
      false,
    );
});

test('the chat request sends matched work areas but never the typed words', () => {
  const profile: Profile = {
    ...baseProfile,
    interests: [],
    customInterests: ['Data stories for charities', 'PRIVATE HOBBY'],
  };
  const active = matchRole(profile, roles[0], 'moderate', baseline);
  const shared = sharedFoundation(profile, baseline);
  const request = makeChatRequest('What should I learn first?', 'en', {
    profile,
    active,
    shared,
    scenario: 'moderate',
    snapshot: baseline,
    plan: buildPlan(profile, active.role, shared),
    workforce: restoreWorkforceSettings(),
  });
  assert.deepEqual(request.profile.interests, ['data']);
  assert.doesNotMatch(JSON.stringify(request), /charities|HOBBY/);
});

test('the typed interest controls have Malay and Simplified Chinese copy', () => {
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of [
      'Add your own interest',
      'Counts as {0}',
      'Not linked to a scored work area',
      'From your interests',
    ])
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});
