import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dictionaries } from '../src/lib/i18n';
import { sectionForKey, settingsSections } from '../src/lib/settings-sections';

test('settings lists profile and skills before display and data', () => {
  assert.deepEqual(settingsSections, ['profile', 'skills', 'display', 'data']);
});

test('arrow, Home and End keys move between settings tabs and wrap', () => {
  assert.equal(sectionForKey('profile', 'ArrowRight'), 'skills');
  assert.equal(sectionForKey('data', 'ArrowRight'), 'profile');
  assert.equal(sectionForKey('profile', 'ArrowLeft'), 'data');
  assert.equal(sectionForKey('display', 'ArrowLeft'), 'skills');
  assert.equal(sectionForKey('skills', 'Home'), 'profile');
  assert.equal(sectionForKey('skills', 'End'), 'data');
  // Up and Down keep scrolling the page in a horizontal tab list.
  for (const key of ['ArrowDown', 'ArrowUp', 'Enter', 'a'])
    assert.equal(sectionForKey('skills', key), null);
});

test('every settings, profile and skills label has Malay and Simplified Chinese copy', () => {
  const labels = [
    'src/components/settings-page.tsx',
    'src/components/profile-panel.tsx',
    'src/components/profile-fields.tsx',
    'src/components/arctalent-app.tsx',
  ].flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    return [
      ...source.matchAll(/\bt\(\s*'([^']+)'/g),
      ...source.matchAll(/\blabel: '([^']+)'/g),
    ].map((m) => m[1]);
  });
  assert.ok(labels.length > 100);
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of labels)
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});

test('the workspace has one Settings destination instead of a separate profile page', () => {
  const app = readFileSync('src/components/arctalent-app.tsx', 'utf8');
  assert.match(app, /id: 'settings' as const, label: 'Settings'/);
  assert.doesNotMatch(app, /id: 'profile' as const/);
  assert.doesNotMatch(app, /navigate\('profile'\)/);
});
