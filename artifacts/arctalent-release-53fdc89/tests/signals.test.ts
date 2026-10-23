import test from 'node:test';
import assert from 'node:assert/strict';
import { liveSnapshot } from '../src/lib/signals';
import type { Signal } from '../src/lib/types';

const signal: Signal = {
  id: 'https://arxiv.org/abs/example',
  title: 'Synthetic research fixture',
  url: 'https://arxiv.org/abs/example',
  publishedAt: '2026-10-22T00:00:00Z',
  collectedAt: '2026-10-22T01:00:00Z',
  kind: 'research',
  geography: 'Synthetic test record',
  skills: ['ai'],
};
test('New research changes snapshot identity without inventing market movement', () => {
  const before = liveSnapshot([], []),
    after = liveSnapshot([], [signal]);
  assert.notEqual(before.id, after.id);
  assert.deepEqual(before.market, after.market);
});
test('Collection timestamps and record order do not create fake new evidence', () => {
  const second = { ...signal, id: 'https://arxiv.org/abs/second' };
  const before = liveSnapshot([], [signal, second]);
  const after = liveSnapshot(
    [],
    [{ ...second, collectedAt: '2026-10-23T00:00:00Z' }, signal],
  );
  assert.equal(before.id, after.id);
});
test('Small job samples stay neutral and enough samples use mention share', () => {
  const jobs = Array.from({ length: 30 }, (_, i) => ({
    ...signal,
    id: `job-${i}`,
    kind: 'jobs' as const,
    skills: i < 3 ? ['sql' as const] : [],
  }));
  assert.equal(liveSnapshot(jobs.slice(0, 29), []).market.sql, 0.5);
  assert.equal(liveSnapshot(jobs, []).market.sql, 0.6);
});
