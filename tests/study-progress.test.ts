import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baseline, baseProfile, courses } from '../src/lib/catalogue';
import { analyseGoalLocally, careerGoalSchema } from '../src/lib/career-goals';
import { rankRoles } from '../src/lib/engine';
import { dictionaries } from '../src/lib/i18n';
import {
  coachStudyProgressLocally,
  makeStudyProgressRequest,
  prunePracticeBadges,
  restorePracticeBadgesByProfile,
  runStudyProgressAi,
  studyCoachModelOutputSchemaForPlan,
  studyProgressRequestSchema,
  upsertPracticeBadge,
  verifyBadgeReflectionLocally,
} from '../src/lib/study-progress-ai';

test('study progress request strips personal identity, free-text notes and custom goal prose', () => {
  const customGoal = careerGoalSchema.parse({
    ...analyseGoalLocally({
      title: 'Frontend engineer',
      description: 'Confidential company roadmap details',
    }),
    summary: 'Private summary note',
  });
  const request = makeStudyProgressRequest({
    action: 'coach',
    locale: 'en',
    profile: {
      ...baseProfile,
      name: 'Secret Full Name',
      currentRole: 'Confidential Role',
      customInterests: ['data pipelines'],
      customSkills: [{ name: 'Internal ERP Tool', level: 2 }],
      learningPreferences: {
        focus: 'data',
        format: 'practice',
        sessionMinutes: 25,
        workAnswer: 'Private workplace answer',
        practiceAnswer: 'Private friend name',
      },
    },
    scenario: 'moderate',
    snapshot: baseline,
    roleId: 'custom-goal',
    customGoal,
    funding: 'all',
  });

  const serialized = JSON.stringify(request);
  assert.doesNotMatch(
    serialized,
    /Secret Full Name|Confidential Role|Internal ERP Tool|Private workplace answer|Private friend name|Confidential company roadmap|Private summary note/,
  );
  assert.equal(request.profile.sessionMinutes, 25);
  assert.equal(request.customGoal?.description, '');
  assert.equal(request.customGoal?.summary, '');
});

test('study progress validation requires consent, a known destination and a studied course for badge checks', () => {
  const validCoach = makeStudyProgressRequest({
    action: 'coach',
    locale: 'en',
    profile: baseProfile,
    scenario: 'moderate',
    snapshot: baseline,
    roleId: 'bi',
  });

  assert.equal(
    studyProgressRequestSchema.safeParse({ ...validCoach, consent: false })
      .success,
    false,
  );
  assert.equal(
    studyProgressRequestSchema.safeParse({
      ...validCoach,
      roleId: 'unknown-role',
    }).success,
    false,
  );
  // Course 'sql' is not in baseProfile.completed yet, so verify-badge must reject it.
  assert.equal(
    studyProgressRequestSchema.safeParse({
      ...validCoach,
      action: 'verify-badge',
      courseId: 'sql',
      reflection:
        'I practised writing SQL SELECT and JOIN queries on sample tables.',
    }).success,
    false,
  );
  // Too short reflection (< 20 chars) is rejected even when studied.
  assert.equal(
    studyProgressRequestSchema.safeParse({
      ...validCoach,
      profile: { ...validCoach.profile, completed: ['sql'] },
      action: 'verify-badge',
      courseId: 'sql',
      reflection: 'Did SQL.',
    }).success,
    false,
  );
});

test('AI study coach returns canonical scheduled course links and localized milestone targets', async () => {
  const request = makeStudyProgressRequest({
    action: 'coach',
    locale: 'ms',
    profile: baseProfile,
    scenario: 'moderate',
    snapshot: baseline,
    roleId: 'bi',
  });

  const response = await runStudyProgressAi(request, async (facts) => {
    assert.equal(facts.action, 'coach');
    assert.ok(facts.progress.scheduledCourses.length > 0);
    return {
      summary:
        'Fokus minggu ini pada asas data yang dikongsi merentas laluan kerjaya.',
      nextBadgeId: 'foundation-pioneer',
      microTask:
        'Luangkan 30 minit menyiapkan latihan jadual pertama dan semak formula utama.',
      recommendedCourseIds: [facts.progress.scheduledCourses[0].id],
    };
  });

  assert.equal(response.kind, 'coach');
  assert.equal(response.mode, 'ai');
  assert.equal(response.notice, '');
  assert.equal(response.nextBadgeTitle, 'Pembina Asas');
  assert.equal(response.courses.length, 1);
  const catalogueCourse = courses.find((c) => c.id === response.courses[0].id)!;
  assert.equal(response.courses[0].url, catalogueCourse.url);
  assert.equal(response.courses[0].title, catalogueCourse.title);
});

test('AI study coach rejects injected links, unscheduled courses and empty-plan course hallucinations', async () => {
  const request = makeStudyProgressRequest({
    action: 'coach',
    locale: 'en',
    profile: baseProfile,
    scenario: 'moderate',
    snapshot: baseline,
    roleId: 'bi',
  });

  const injectedLink = await runStudyProgressAi(request, async (facts) => ({
    summary: 'Visit https://malicious.invalid for a shortcut.',
    nextBadgeId: 'foundation-pioneer',
    microTask: 'Open the link above.',
    recommendedCourseIds: [facts.progress.scheduledCourses[0].id],
  }));
  assert.equal(injectedLink.mode, 'local');
  assert.match(injectedLink.notice, /could not be verified/);

  const unscheduledCourse = await runStudyProgressAi(request, async () => ({
    summary: 'Try web development instead.',
    nextBadgeId: 'foundation-pioneer',
    microTask: 'Build an HTML page.',
    recommendedCourseIds: ['htmlcss'],
  }));
  assert.equal(unscheduledCourse.mode, 'local');

  // Empty plan forces zero recommended course IDs at the schema boundary.
  const emptySchema = studyCoachModelOutputSchemaForPlan([], []);
  assert.equal(
    emptySchema.safeParse({
      summary: 'All milestones complete.',
      nextBadgeId: null,
      microTask: 'Review your notes.',
      recommendedCourseIds: ['sql'],
    }).success,
    false,
  );
  const emptyLocal = coachStudyProgressLocally(
    makeStudyProgressRequest({
      action: 'coach',
      locale: 'zh-CN',
      profile: { ...baseProfile, hours: 0 },
      scenario: 'moderate',
      snapshot: baseline,
      roleId: 'bi',
      funding: 'hrd',
    }),
  );
  assert.deepEqual(emptyLocal.courses, []);
  assert.match(emptyLocal.summary, /徽章/);
});

test('AI practice badge verification requires verbatim reflection quotes and never auto-mutates profile skills', async () => {
  const learner = {
    ...baseProfile,
    skills: { ...baseProfile.skills, sql: 1 },
    completed: ['sql'],
  };
  const beforeScore = rankRoles(learner, 'moderate', baseline)[0].score;
  const reflection =
    'I practised SQL SELECT, WHERE and INNER JOIN queries to combine monthly customer orders with product tables.';

  const request = makeStudyProgressRequest({
    action: 'verify-badge',
    locale: 'en',
    profile: learner,
    scenario: 'moderate',
    snapshot: baseline,
    roleId: 'bi',
    courseId: 'sql',
    reflection,
  });

  const awarded = await runStudyProgressAi(request, async () => ({
    awarded: true,
    badgeTitle: 'Applied SQL Query Practice',
    feedback:
      'Your note clearly demonstrates filtering and joining relational tables.',
    nextStep: 'Practise GROUP BY aggregations on summary metrics next.',
    demonstratedSkills: [
      { id: 'sql', quote: 'sql select, where and inner join queries' },
    ],
  }));

  assert.equal(awarded.kind, 'verify-badge');
  assert.equal(awarded.mode, 'ai');
  assert.equal(awarded.awarded, true);
  // Quote preserves exact verbatim casing from the learner's reflection.
  assert.deepEqual(awarded.demonstratedSkills, [
    { id: 'sql', quote: 'SQL SELECT, WHERE and INNER JOIN queries' },
  ]);
  assert.ok(awarded.sdgTargets.includes('4.4'));
  // Profile skills and role scores remain completely untouched until human confirmation.
  assert.equal(learner.skills.sql, 1);
  assert.equal(rankRoles(learner, 'moderate', baseline)[0].score, beforeScore);

  // Hallucinated quote not present in reflection cannot award an AI badge.
  const hallucinated = await runStudyProgressAi(request, async () => ({
    awarded: true,
    badgeTitle: 'Applied SQL Query Practice',
    feedback: 'Great work building stored procedures.',
    nextStep: 'Keep going.',
    demonstratedSkills: [
      { id: 'sql', quote: 'built production PostgreSQL stored procedures' },
    ],
  }));
  assert.equal(hallucinated.mode, 'local');
  assert.match(hallucinated.notice, /could not be verified/);
});

test('local reflection verifier awards concrete practice across languages and guides vague notes', () => {
  const vague = verifyBadgeReflectionLocally(
    makeStudyProgressRequest({
      action: 'verify-badge',
      locale: 'en',
      profile: { ...baseProfile, completed: ['sql'] },
      scenario: 'moderate',
      snapshot: baseline,
      roleId: 'bi',
      courseId: 'sql',
      reflection: 'I finished reading the page yesterday afternoon after work.',
    }),
  );
  assert.equal(vague.awarded, false);
  assert.deepEqual(vague.demonstratedSkills, []);

  const chineseVerified = verifyBadgeReflectionLocally(
    makeStudyProgressRequest({
      action: 'verify-badge',
      locale: 'zh-CN',
      profile: { ...baseProfile, completed: ['sql'] },
      scenario: 'moderate',
      snapshot: baseline,
      roleId: 'bi',
      courseId: 'sql',
      reflection:
        '我完成了数据库查询练习，使用 SELECT 和 JOIN 汇总了部门订单明细。',
    }),
  );
  assert.equal(chineseVerified.awarded, true);
  assert.equal(chineseVerified.demonstratedSkills[0]?.id, 'sql');
  assert.ok(
    '我完成了数据库查询练习，使用 SELECT 和 JOIN 汇总了部门订单明细。'.includes(
      chineseVerified.demonstratedSkills[0].quote,
    ),
  );
});

test('practice badges stay isolated per profile and are pruned when a course is unmarked studied', () => {
  const sqlBadge = {
    courseId: 'sql',
    badgeTitle: 'Applied SQL Practice',
    feedback: 'Verified SQL query exercise.',
    nextStep: 'Try aggregate grouping next.',
    demonstratedSkills: [{ id: 'sql' as const, quote: 'SQL SELECT query' }],
    sdgTargets: ['4.4'],
    mode: 'ai' as const,
    model: 'gpt-5.4-mini',
  };
  const updated = upsertPracticeBadge([], sqlBadge, ['sql', 'excel']);
  assert.equal(updated.length, 1);

  // Unmarking 'sql' from completed immediately prunes its practice badge.
  assert.deepEqual(prunePracticeBadges(updated, ['excel']), []);

  const restored = restorePracticeBadgesByProfile({
    aina: updated,
    daniel: [],
  });
  assert.equal(restored.aina.length, 1);
  assert.equal(restored.daniel.length, 0);
  assert.deepEqual(
    restorePracticeBadgesByProfile({ aina: [{ invalid: true }] }),
    {},
  );
});

test('every AI study progress panel label and fallback notice has Malay and Simplified Chinese copy', () => {
  const source = readFileSync(
    'src/components/study-progress-ai-panel.tsx',
    'utf8',
  );
  const labels = [
    ...[...source.matchAll(/\bt\(\s*'([^']+)'/g)].map((m) => m[1]),
    'AI is not connected. Using the local study coach.',
    'AI reply could not be verified. Using the local study coach.',
    'AI is busy. Using the local study coach.',
    'Could not reach the study coach. Showing local guidance instead.',
  ];
  assert.ok(labels.length >= 35);
  for (const [locale, messages] of Object.entries(dictionaries)) {
    for (const label of labels) {
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
    }
  }
});
