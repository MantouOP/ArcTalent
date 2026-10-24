import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../src/lib/catalogue';

test('SQLBolt uses its published tutorial title and a direct lesson URL', () => {
  const sql = courses.find((course) => course.id === 'sql')!;
  assert.equal(sql.title, 'Introduction to SQL');
  assert.equal(sql.url, 'https://sqlbolt.com/lesson/introduction');
});

test('each catalogue course has a distinct official HTTPS destination checked in this audit', () => {
  const destinations = new Set<string>();
  const providers: Record<string, string> = {
    OpenLearn: 'www.open.edu',
    OpenClassrooms: 'openclassrooms.com',
    SQLBolt: 'sqlbolt.com',
    'Microsoft Learn': 'learn.microsoft.com',
    MDN: 'developer.mozilla.org',
  };
  for (const course of courses) {
    const url = new URL(course.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, providers[course.provider]);
    assert.notEqual(url.pathname, '/');
    assert.equal(url.search, '');
    assert.ok(course.title.trim().length > 0);
    assert.equal(course.checkedAt, '2026-10-24');
    assert.ok(!destinations.has(course.url), course.title);
    destinations.add(course.url);
  }
});
