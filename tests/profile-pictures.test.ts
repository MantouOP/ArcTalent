import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dictionaries } from '../src/lib/i18n';
import {
  avatarPresets,
  restoreProfilePictures,
  setProfilePicture,
  validatePhotoFile,
  maxPhotoBytes,
  maxStoredPhotoLength,
  maxPictureProfiles,
} from '../src/lib/profile-pictures';

const photo = {
  kind: 'upload' as const,
  dataUrl: 'data:image/webp;base64,UklGRg==',
};

test('animal avatars survive storage alongside original presets and uploaded photos', () => {
  const animalIds = [
    'cat',
    'puppy',
    'bunny',
    'fox',
    'panda',
    'bear',
    'koala',
    'otter',
    'capybara',
    'penguin',
    'owl',
    'axolotl',
  ];
  for (const id of animalIds) {
    const saved = restoreProfilePictures({
      version: 1,
      pictures: {
        animal: { kind: 'preset', id },
        original: { kind: 'preset', id: 'violet' },
        uploaded: photo,
      },
    });
    assert.deepEqual(saved.pictures.animal, { kind: 'preset', id });
    assert.deepEqual(saved.pictures.original, { kind: 'preset', id: 'violet' });
    assert.deepEqual(saved.pictures.uploaded, photo);
  }
});

test('every avatar has a local self-contained illustration and translated label', () => {
  assert.equal(
    new Set(avatarPresets.map((preset) => preset.id)).size,
    avatarPresets.length,
  );
  for (const preset of avatarPresets) {
    const source = readFileSync(
      new URL('../public/avatars/' + preset.id + '.svg', import.meta.url),
      'utf8',
    );
    assert.match(source, /<svg\s/);
    assert.match(source, /viewBox="0 0 \d+ \d+"/);
    assert.doesNotMatch(
      source,
      /<script\b|<foreignObject\b|\bon\w+=|(?:href|src)="(?:https?:|data:|javascript:)/i,
    );
    for (const [locale, messages] of Object.entries(dictionaries))
      assert.ok(messages[preset.label]?.trim(), locale + ': ' + preset.label);
  }
});

test('missing and malformed picture preferences start empty without retaining unrelated data', () => {
  for (const input of [
    undefined,
    null,
    [],
    true,
    'photo',
    {},
    { version: 2, pictures: {} },
  ]) {
    assert.deepEqual(restoreProfilePictures(input), {
      version: 1,
      pictures: {},
    });
  }
  assert.notEqual(
    restoreProfilePictures().pictures,
    restoreProfilePictures().pictures,
  );
});

test('preset and uploaded pictures survive storage independently for each profile', () => {
  let saved = setProfilePicture(restoreProfilePictures(), 'aina', {
    kind: 'preset',
    id: 'violet',
  });
  saved = setProfilePicture(saved, 'daniel', photo);
  const restored = restoreProfilePictures(
    JSON.parse(JSON.stringify({ ...saved, profile: { hours: 99 } })),
  );
  assert.deepEqual(restored, {
    version: 1,
    pictures: { aina: { kind: 'preset', id: 'violet' }, daniel: photo },
  });
  const reset = setProfilePicture(restored, 'aina', null);
  assert.equal(Object.hasOwn(reset.pictures, 'aina'), false);
  assert.deepEqual(reset.pictures.daniel, photo);
  assert.equal(
    restored.pictures.aina.kind,
    'preset',
    'Updates do not mutate the previous value',
  );
});

test('only bundled presets and bounded raster data URLs can enter saved picture state', () => {
  const invalid = [
    { kind: 'preset', id: '../other.svg' },
    { kind: 'preset', id: 'unknown' },
    { kind: 'upload', dataUrl: 'https://example.com/photo.jpg' },
    { kind: 'upload', dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' },
    { kind: 'upload', dataUrl: 'data:text/html;base64,PHN2Zz4=' },
    { kind: 'upload', dataUrl: 'data:image/png;base64,<script>' },
    {
      kind: 'upload',
      dataUrl: 'data:image/webp;base64,' + 'A'.repeat(maxStoredPhotoLength),
    },
    { kind: 'upload', dataUrl: '' },
  ];
  for (const picture of invalid) {
    const restored = restoreProfilePictures({
      version: 1,
      pictures: { bad: picture, good: photo },
    });
    assert.deepEqual(restored.pictures, { good: photo });
  }
  for (const preset of avatarPresets) {
    assert.equal(
      restoreProfilePictures({
        version: 1,
        pictures: { aina: { kind: 'preset', id: preset.id } },
      }).pictures.aina.kind,
      'preset',
    );
  }
});

test('invalid updates preserve the current picture and unrelated profile choices', () => {
  const current = setProfilePicture(restoreProfilePictures(), 'aina', photo);
  assert.deepEqual(
    setProfilePicture(current, 'aina', {
      kind: 'preset',
      id: 'not-bundled',
    } as never),
    current,
  );
  assert.deepEqual(setProfilePicture(current, 'x'.repeat(61), photo), current);
  assert.deepEqual(
    restoreProfilePictures({ version: 1, pictures: null }),
    restoreProfilePictures(),
  );
});

test('saved picture maps are bounded and retain the latest active choice', () => {
  let saved = restoreProfilePictures();
  for (let index = 0; index < maxPictureProfiles + 5; index++)
    saved = setProfilePicture(saved, `worker-${index}`, {
      kind: 'preset',
      id: 'teal',
    });
  assert.equal(Object.keys(saved.pictures).length, maxPictureProfiles);
  assert.equal(Object.hasOwn(saved.pictures, 'worker-0'), false);
  assert.equal(
    saved.pictures[`worker-${maxPictureProfiles + 4}`].kind,
    'preset',
  );
});

test('photo upload accepts supported nonempty raster files up to five MB', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(validatePhotoFile({ type, size: maxPhotoBytes }), null);
    assert.equal(validatePhotoFile({ type, size: 1 }), null);
  }
  assert.equal(
    validatePhotoFile({ type: 'image/png', size: maxPhotoBytes + 1 }),
    'size',
  );
  assert.equal(validatePhotoFile({ type: 'image/png', size: 0 }), 'size');
  for (const type of [
    'image/svg+xml',
    'image/gif',
    'image/heic',
    '',
    'text/plain',
  ])
    assert.equal(validatePhotoFile({ type, size: 10 }), 'type');
});
