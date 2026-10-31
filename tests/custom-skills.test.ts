import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addCustomSkill,
  matchCatalogueSkill,
  maxCustomSkills,
  splitSpecialistSkills,
} from '../src/lib/custom-skills';
import { createProfileDraft } from '../src/lib/custom-inputs';
import { profileSchema } from '../src/lib/validation';

test('a catalogue skill typed in other words raises that skill instead of a duplicate', () => {
  assert.equal(matchCatalogueSkill('MS Excel'), 'excel');
  assert.equal(matchCatalogueSkill('Spreadsheets'), 'excel');
  assert.equal(matchCatalogueSkill('Microsoft Word'), null);
  const profile = { ...createProfileDraft('p'), skills: { excel: 1 } };
  const result = addCustomSkill(profile, ' MS   Excel ', 3);
  assert.equal(result.matched, 'excel');
  assert.equal(result.profile.skills.excel, 3);
  assert.equal(result.profile.customSkills, undefined);
  // A lower level never lowers the catalogue level.
  assert.equal(
    addCustomSkill(result.profile, 'excel', 1).profile.skills.excel,
    3,
  );
});

test('skills outside the catalogue are kept with a level, once per name, up to the limit', () => {
  let profile = { ...createProfileDraft('p'), name: 'Aina' };
  profile = addCustomSkill(profile, 'Microsoft  Word', 2).profile;
  profile = addCustomSkill(profile, 'microsoft word', 3).profile;
  assert.deepEqual(profile.customSkills, [
    { name: 'Microsoft Word', level: 3 },
  ]);
  for (let i = 0; i < maxCustomSkills + 2; i++)
    profile = addCustomSkill(profile, `Tool ${i}`, 1).profile;
  assert.equal(profile.customSkills?.length, maxCustomSkills);
  assert.ok(profileSchema.safeParse(profile).success);
  assert.equal(
    profileSchema.safeParse({
      ...profile,
      customSkills: [{ name: 'Word', level: 0 }],
    }).success,
    false,
  );
});

test('custom skills cover matching specialist skills of a custom destination', () => {
  const { covered, remaining } = splitSpecialistSkills(
    ['Microsoft Word document formatting', 'Minute taking', 'Canva'],
    [
      { name: 'Microsoft Word', level: 2 },
      { name: 'canva', level: 1 },
    ],
  );
  assert.deepEqual(covered, ['Microsoft Word document formatting', 'Canva']);
  assert.deepEqual(remaining, ['Minute taking']);
  assert.deepEqual(splitSpecialistSkills(['Word'], []).remaining, ['Word']);
});
