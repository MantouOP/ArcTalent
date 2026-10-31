import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseProfile, roles } from '../src/lib/catalogue';
import { buildPlan, rankRoles } from '../src/lib/engine';
import { baseline } from '../src/lib/catalogue';
import { computeLearnerBadges } from '../src/lib/finals-enhancements';
import {
  maxTrackRecordEntries,
  recordSkillProgressions,
  restoreTrackRecords,
  summarizeTrackRecord,
  syncTrackRecord,
  type TrackRecordEntry,
} from '../src/lib/track-record';
import type { PracticeBadge } from '../src/lib/study-progress-ai';

const day = (n: number) => new Date(Date.UTC(2026, 9, n)).toISOString();
const sqlBadge: PracticeBadge = {
  courseId: 'sql',
  badgeTitle: 'Applied SQL Practice',
  feedback: 'Verified SQL query exercise.',
  nextStep: 'Try grouping next.',
  demonstratedSkills: [{ id: 'sql', quote: 'SELECT query' }],
  sdgTargets: ['4.4'],
  mode: 'local',
};

test('track record mirrors studied courses and earned badges, keeping first dates', () => {
  const milestones = [
    { id: 'foundation-pioneer', title: 'Foundation Builder', earned: true },
    { id: 'ai-ready', title: 'Responsible AI Navigator', earned: false },
  ];
  const first = syncTrackRecord(
    [],
    { completed: ['sql'], milestones, practiceBadges: [sqlBadge] },
    day(1),
  );
  assert.deepEqual(first.map((e) => e.kind).sort(), [
    'course',
    'milestone-badge',
    'practice-badge',
  ]);
  // A later sync keeps the original dates and adds only what is new.
  const second = syncTrackRecord(
    first,
    { completed: ['sql', 'excel'], milestones, practiceBadges: [sqlBadge] },
    day(5),
  );
  const sql = second.find((e) => e.kind === 'course' && e.courseId === 'sql');
  assert.equal(sql?.recordedAt, day(1));
  assert.equal(second[0].recordedAt, day(5), 'newest first');
  // Unmarking a course removes it and the practice badge that depended on it.
  const undone = syncTrackRecord(
    second,
    { completed: ['excel'], milestones, practiceBadges: [] },
    day(6),
  );
  assert.ok(!undone.some((e) => 'courseId' in e && e.courseId === 'sql'));
  assert.equal(
    syncTrackRecord(
      undone,
      { completed: [], milestones: [], practiceBadges: [] },
      day(7),
    ).length,
    0,
  );
});

test('only raised skill levels become progressions, and progressions survive syncing', () => {
  const recorded = recordSkillProgressions(
    [],
    { sql: 1, excel: 2, data: 2 },
    { sql: 2, excel: 2, data: 1, visual: 1 },
    'profile-review',
    day(2),
  );
  assert.deepEqual(
    recorded.map(
      (e) => e.kind === 'skill' && [e.skillId, e.fromLevel, e.toLevel],
    ),
    [
      ['sql', 1, 2],
      ['visual', 0, 1],
    ],
  );
  assert.equal(
    recordSkillProgressions(
      recorded,
      { sql: 2 },
      { sql: 2 },
      'profile-review',
      day(3),
    ).length,
    2,
  );
  const synced = syncTrackRecord(
    recorded,
    { completed: [], milestones: [], practiceBadges: [] },
    day(4),
  );
  assert.equal(synced.filter((e) => e.kind === 'skill').length, 2);
});

test('summary counts hours, badges, skills and gap distance closed towards the role', () => {
  const bi = roles.find((r) => r.id === 'bi')!;
  let record: TrackRecordEntry[] = syncTrackRecord(
    [],
    {
      completed: ['sql'],
      milestones: [
        { id: 'foundation-pioneer', title: 'Foundation Builder', earned: true },
      ],
      practiceBadges: [sqlBadge],
    },
    day(1),
  );
  record = recordSkillProgressions(
    record,
    { sql: 0 },
    { sql: 1 },
    'practice-badge',
    day(2),
  );
  record = recordSkillProgressions(
    record,
    { sql: 1 },
    { sql: 3 },
    'profile-review',
    day(3),
  );
  const summary = summarizeTrackRecord(record, bi);
  assert.ok(summary.hoursStudied > 0);
  assert.equal(summary.coursesCompleted, 1);
  assert.equal(summary.verifiedBadges, 2);
  assert.equal(summary.skillsLeveledUp, 1);
  // From level 0 to the role's requirement of 2: two levels, counted once.
  assert.equal(summary.gapDistanceClosed, bi.requirements.sql);
});

test('track record never changes skills or suitability scores', () => {
  const profile = structuredClone({ ...baseProfile, completed: ['sql'] });
  const before = rankRoles(profile, 'moderate', baseline).map((m) => m.score);
  const role = roles[0];
  const badges = computeLearnerBadges(
    profile,
    buildPlan(profile, role),
    [],
    role,
  ).badges;
  syncTrackRecord(
    [],
    {
      completed: profile.completed,
      milestones: badges,
      practiceBadges: [sqlBadge],
    },
    day(1),
  );
  assert.deepEqual(profile.skills, baseProfile.skills);
  assert.deepEqual(
    rankRoles(profile, 'moderate', baseline).map((m) => m.score),
    before,
  );
});

test('stored track records are validated and bounded', () => {
  const good = syncTrackRecord(
    [],
    { completed: ['sql'], milestones: [], practiceBadges: [] },
    day(1),
  );
  assert.deepEqual(restoreTrackRecords({ aina: good }), { aina: good });
  assert.deepEqual(
    restoreTrackRecords({
      aina: [{ kind: 'course', courseId: 'nope', recordedAt: day(1) }],
    }),
    {},
  );
  assert.deepEqual(restoreTrackRecords('nonsense'), {});
  const many = Array.from({ length: maxTrackRecordEntries + 5 }, (_, i) => ({
    kind: 'skill' as const,
    skillId: 'sql' as const,
    fromLevel: 0,
    toLevel: 1,
    source: 'profile-review' as const,
    recordedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
  }));
  assert.equal(
    recordSkillProgressions(
      many,
      { excel: 0 },
      { excel: 1 },
      'profile-review',
      day(9),
    ).length,
    maxTrackRecordEntries,
  );
});
