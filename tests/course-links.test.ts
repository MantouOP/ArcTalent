import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../src/lib/catalogue';
import { dictionaries } from '../src/lib/i18n';

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

test('every course has a unique, checked YouTube companion video', () => {
  const urls = new Set<string>();
  for (const course of courses) {
    const video = course.video;
    assert.ok(video, course.id);
    const url = new URL(video.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'www.youtube.com');
    assert.equal(url.pathname, '/watch');
    assert.match(url.searchParams.get('v') ?? '', /^[\w-]{11}$/);
    assert.equal([...url.searchParams.keys()].join(), 'v');
    assert.ok(video.title.trim().length > 0 && video.channel.trim().length > 0);
    assert.equal(video.checkedAt, '2026-10-29');
    assert.ok(!urls.has(video.url), course.id);
    urls.add(video.url);
  }
});

test('the companion video labels have Malay and Simplified Chinese copy', () => {
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of [
      'Watch on YouTube',
      'Watch companion video: {0} by {1} on YouTube (opens in a new tab)',
      'Optional YouTube videos give a quick overview and are not counted in planned hours.',
    ])
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});
