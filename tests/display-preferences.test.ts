import test from 'node:test';
import assert from 'node:assert/strict';
import {
  restoreDisplayPreferences,
  shouldReduceMotion,
} from '../src/lib/display-preferences';

test('new or malformed display preferences use safe defaults', () => {
  for (const value of [undefined, null, [], 'larger', 1, {}])
    assert.deepEqual(restoreDisplayPreferences(value), {
      textSize: 'standard',
      reduceMotion: false,
      reduceEffects: false,
    });
});
test('only supported text sizes and boolean motion preferences are restored', () => {
  assert.deepEqual(
    restoreDisplayPreferences({ textSize: 'larger', reduceMotion: true }),
    { textSize: 'larger', reduceMotion: true, reduceEffects: false },
  );
  assert.deepEqual(
    restoreDisplayPreferences({ textSize: 'huge', reduceMotion: 'false' }),
    { textSize: 'standard', reduceMotion: false, reduceEffects: false },
  );
  assert.deepEqual(
    restoreDisplayPreferences({ textSize: 'larger', reduceMotion: 1 }),
    { textSize: 'larger', reduceMotion: false, reduceEffects: false },
  );
  assert.deepEqual(
    restoreDisplayPreferences({
      textSize: 'standard',
      reduceMotion: true,
      theme: 'light',
    }),
    { textSize: 'standard', reduceMotion: true, reduceEffects: false },
  );
});
test('reduced visual effects restore only from a true boolean', () => {
  assert.equal(
    restoreDisplayPreferences({ reduceEffects: true }).reduceEffects,
    true,
  );
  for (const value of ['true', 1, null])
    assert.equal(
      restoreDisplayPreferences({ reduceEffects: value }).reduceEffects,
      false,
    );
});
test('display settings survive a JSON round trip without retaining unrelated data', () => {
  const saved = {
    textSize: 'larger',
    reduceMotion: true,
    reduceEffects: true,
    profile: { name: 'sample' },
  };
  assert.deepEqual(
    restoreDisplayPreferences(JSON.parse(JSON.stringify(saved))),
    { textSize: 'larger', reduceMotion: true, reduceEffects: true },
  );
});
test('display defaults are fresh objects', () => {
  const first = restoreDisplayPreferences();
  first.reduceMotion = true;
  assert.equal(restoreDisplayPreferences().reduceMotion, false);
});
test('device reduced motion is respected even when the manual preference is off', () => {
  const preferences = (reduceMotion: boolean) => ({
    textSize: 'standard' as const,
    reduceMotion,
    reduceEffects: false,
  });
  assert.equal(shouldReduceMotion(preferences(false), false), false);
  assert.equal(shouldReduceMotion(preferences(true), false), true);
  assert.equal(shouldReduceMotion(preferences(false), true), true);
  assert.equal(shouldReduceMotion(preferences(true), true), true);
});
