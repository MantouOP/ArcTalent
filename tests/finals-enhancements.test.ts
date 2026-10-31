import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  baseProfile,
  baseline,
  employees,
  roles,
  skills,
  updated,
} from '../src/lib/catalogue';
import { dictionaries } from '../src/lib/i18n';
import { buildPlan, rankRoles, sharedFoundation } from '../src/lib/engine';
import { assessPerson } from '../src/lib/impact';
import { buildWorkforcePlan } from '../src/lib/workforce-plan';
import {
  applyWorkforceGoal,
  restoreWorkforceSettings,
} from '../src/lib/workforce-settings';
import { analyseGoalLocally, goalToRole } from '../src/lib/career-goals';
import { careerGoalSchema } from '../src/lib/validation';
import {
  aggregateSdgContributions,
  applySdgPriority,
  buildFutureSkillsRadar,
  calculateScoreBoosters,
  computeLearnerBadges,
  computeReplanDiff,
  FAIRNESS_SWAPS,
  getMalaysiaReskillingOptions,
  MALAYSIA_RESKILLING_DIRECTORY,
  runFairnessAudit,
  SDG_FOCUS_OPTIONS,
  sdgPriorityBonus,
} from '../src/lib/finals-enhancements';

test('Bugfix #1: Level 3 custom skill target does not schedule redundant starter courses once level 2 is reached', () => {
  const customRole = goalToRole({
    title: 'Senior Project Lead',
    description: 'Advanced project planning and critical thinking',
    family: 'people',
    requirements: { project: 3, critical: 3 },
    otherSkills: [],
    summary: 'Custom goal with level 3 requirements',
    mode: 'manual',
  });
  const plan = buildPlan(
    { ...baseProfile, hours: 10, weeks: 12, skills: {} },
    customRole,
  );
  const projectCourses = plan.steps.filter((s) =>
    s.course.skills.includes('project'),
  );
  const criticalCourses = plan.steps.filter((s) =>
    s.course.skills.includes('critical'),
  );
  assert.equal(projectCourses.length, 1);
  assert.equal(criticalCourses.length, 1);
});

test('Bugfix #2: assessPerson reports below target (not No gap to close) when shared foundation gaps exist but 0 hours are scheduled', () => {
  const zeroHoursProfile = { ...baseProfile, hours: 0 };
  const role = roles[0];
  const shared = sharedFoundation(zeroHoursProfile, baseline);
  const plan = buildPlan(zeroHoursProfile, role, shared);
  const impact = assessPerson(
    zeroHoursProfile,
    role,
    'moderate',
    baseline,
    shared,
    plan,
  );
  assert.ok(shared.length > 0);
  assert.equal(impact.foundation.share, null);
  assert.equal(impact.foundationStatus, 'below');
});

test('Bugfix #3: buildWorkforcePlan hides custom role openings when worker switches back to a preset role', () => {
  const worker = employees[1];
  const goal = careerGoalSchema.parse(
    analyseGoalLocally({
      title: 'Web developer',
      description: 'Build websites with HTML, CSS and JavaScript',
    }),
  );
  const withCustom = applyWorkforceGoal(
    { ...restoreWorkforceSettings(), members: [worker] },
    worker.id,
    goal,
    2,
  );
  const switchedToPreset = {
    ...withCustom,
    destinations: { ...withCustom.destinations, [worker.id]: 'bi' },
  };
  const plan = buildWorkforcePlan(
    baseProfile,
    'moderate',
    baseline,
    switchedToPreset,
  );
  assert.equal(
    plan.openings.some((o) => o.role.id === `custom:${worker.id}`),
    false,
  );
});

test('Feature #1: SDG priority lens re-ranks roles without changing any suitability score', () => {
  const baseMatches = rankRoles(baseProfile, 'moderate', baseline);
  const balanced = applySdgPriority(baseMatches, 'all');
  assert.equal(balanced.shifted, false);
  assert.equal(balanced.matches[0].role.id, 'bi');
  assert.ok(balanced.matches.every((m) => m.sdgBonus === 0));

  const greenFocus = applySdgPriority(baseMatches, '9');
  const position = (list: { role: { id: string } }[]) =>
    list.findIndex((m) => m.role.id === 'sustainability');
  assert.ok(position(greenFocus.matches) < position(baseMatches));
  for (const m of greenFocus.matches)
    assert.equal(
      m.score,
      baseMatches.find((base) => base.role.id === m.role.id)!.score,
    );
  for (let i = 1; i < greenFocus.matches.length; i++) {
    const [above, below] = [greenFocus.matches[i - 1], greenFocus.matches[i]];
    assert.ok(above.score + above.sdgBonus >= below.score + below.sdgBonus);
  }
});

test('SDG priority points follow the published rule', () => {
  const role = (id: string) => roles.find((r) => r.id === id)!;
  // Own target matches (+10), and 2 of its 11 required levels map to 9.4.
  assert.equal(sdgPriorityBonus(role('sustainability'), ['9.4']), 11.8);
  // Own target is 4.4, and every required skill maps to 4.3 or 4.4.
  assert.equal(sdgPriorityBonus(role('training'), ['4.3', '4.4']), 20);
  assert.equal(sdgPriorityBonus(role('bi'), ['9.4']), 0);
  assert.equal(sdgPriorityBonus(role('bi'), []), 0);
  for (const option of SDG_FOCUS_OPTIONS.filter((o) => o.id !== 'all'))
    assert.ok(
      roles.some((r) => sdgPriorityBonus(r, option.targets) > 0),
      `${option.id} lens changes nothing`,
    );
});

test('SDG totals count a learner only when their plan schedules hours for the target', () => {
  const baseMatches = rankRoles(baseProfile, 'moderate', baseline);
  const shared = sharedFoundation(baseProfile, baseline);
  const plan = buildPlan(baseProfile, baseMatches[0].role, shared);
  const agg = aggregateSdgContributions(
    baseProfile,
    baseMatches[0].role,
    plan,
    'moderate',
    baseline,
    restoreWorkforceSettings(),
  );
  // Whole UN goals only: SDG 4, 8, 9 and 10.
  assert.deepEqual(
    agg.person.map((item) => item.target),
    ['4', '8', '9', '10'],
  );
  assert.equal(agg.company.length, 4);
  assert.equal(agg.region.length, 4);
  for (const scope of [agg.person, agg.company, agg.region])
    for (const item of scope)
      assert.equal(item.learnersCount > 0, item.hours > 0, item.target);
  assert.ok(agg.region.some((item) => item.learnersCount > 0));
  agg.region.forEach((item, i) =>
    assert.equal(
      item.learnersCount,
      Math.round((agg.company[i].learnersCount * 1000) / agg.teamSize),
    ),
  );
});

test('Feature #2: Score boosters show exact gains and only offer courses that can close the gap', () => {
  const bi = roles.find((r) => r.id === 'bi')!;
  const boosters = calculateScoreBoosters(
    baseProfile,
    bi,
    'moderate',
    baseline,
  );
  assert.ok(boosters.length > 0);
  for (const item of boosters) {
    assert.ok(item.deltaScore > 0);
    assert.ok(item.scoreAfter > item.scoreBefore);
    assert.ok(item.recommendedCourse?.skills.includes(item.skillId));
  }
  // Courses lift a skill to Level 2 at most, so a Level 3 gap gets none.
  const advanced = { ...bi, requirements: { ...bi.requirements, sql: 3 } };
  const sql = calculateScoreBoosters(
    baseProfile,
    advanced,
    'moderate',
    baseline,
  ).find((item) => item.skillId === 'sql')!;
  assert.equal(sql.targetLevel, 3);
  assert.equal(sql.recommendedCourse, null);
});

test('Feature #3: Skills radar compares only real snapshot values', () => {
  const alone = buildFutureSkillsRadar(baseline, null);
  assert.equal(alone.length, Object.keys(baseline.market).length);
  assert.ok(
    alone.every((i) => i.deltaPercent === null && i.beforeDemand === null),
  );
  assert.deepEqual(buildFutureSkillsRadar(baseline, baseline), alone);

  const radar = buildFutureSkillsRadar(updated, baseline);
  const item = (id: string) => radar.find((r) => r.skillId === id)!;
  assert.equal(item('sustainability').deltaPercent, 55);
  assert.equal(item('sustainability').trend, 'rising');
  assert.equal(item('excel').deltaPercent, -40);
  assert.equal(item('excel').trend, 'declining');
  // The baseline has no process value, so no change is claimed.
  assert.equal(item('process').deltaPercent, null);
  assert.equal(item('process').trend, 'steady');
});

test('Feature #3: Automatic re-planning diff captures snapshot changes', () => {
  const diff = computeReplanDiff(baseProfile, 'moderate', baseline, updated);
  assert.equal(diff.topRoleChanged, true);
  assert.equal(diff.oldTopRole.id, 'bi');
  assert.equal(diff.newTopRole.id, 'project');
  assert.ok(diff.keptCourses.length > 0);
});

test('Feature #4: Fairness check swaps names and job titles without changing results', () => {
  const audit = runFairnessAudit(baseProfile, 'moderate', baseline);
  assert.equal(audit.passed, true);
  assert.equal(audit.maxScoreChange, 0);
  assert.equal(audit.pathwayChanges, 0);
  assert.equal(audit.personasTested, 6);
  assert.ok(audit.results.every((r) => r.pathwayIdentical));
  assert.ok(audit.results.every((r) => r.name !== baseProfile.name));
});

test('Feature #5 & #6: Malaysian portals and learner badges respond to role and completed courses', () => {
  for (const item of MALAYSIA_RESKILLING_DIRECTORY)
    assert.match(
      item.url,
      /^https:\/\/([a-z-]+\.)*(gov\.my|mymahir\.my)(\/|$)/,
    );
  for (const role of roles)
    assert.ok(getMalaysiaReskillingOptions(role).length >= 2, role.id);
  const bi = roles.find((r) => r.id === 'bi')!;

  const shared = sharedFoundation(baseProfile, baseline);
  const initialPlan = buildPlan(baseProfile, bi, shared);
  const beforeBadges = computeLearnerBadges(
    baseProfile,
    initialPlan,
    shared,
    bi,
  );
  assert.equal(beforeBadges.completedHours, 0);

  const progressedProfile = {
    ...baseProfile,
    completed: ['excel', 'responsible', 'environment'],
  };
  const progressedPlan = buildPlan(progressedProfile, bi, shared);
  const afterBadges = computeLearnerBadges(
    progressedProfile,
    progressedPlan,
    shared,
    bi,
  );
  assert.ok(afterBadges.completedHours > 0);
  assert.ok(afterBadges.badges.filter((b) => b.earned).length >= 3);
});

test('every finals panel label has Malay and Simplified Chinese copy', () => {
  const source = readFileSync('src/components/finals-widgets.tsx', 'utf8');
  const role = roles[0];
  const plan = buildPlan(baseProfile, role);
  const expert = {
    ...baseProfile,
    skills: Object.fromEntries(skills.map((s) => [s.id, 3])),
  };
  const badgeText = [
    computeLearnerBadges(baseProfile, plan, [], role),
    computeLearnerBadges(expert, buildPlan(expert, role), ['excel'], role),
  ].flatMap(({ badges }) =>
    badges.flatMap((b) => [b.title, b.description, b.progressText]),
  );
  const labels = [
    ...[...source.matchAll(/\bt\(\s*'([^']+)'/g)].map((m) => m[1]),
    ...[...source.matchAll(/\['\w+', '([^']+)'\]/g)].map((m) => m[1]),
    ...SDG_FOCUS_OPTIONS.flatMap((o) => [o.badge, o.title, o.description]),
    ...MALAYSIA_RESKILLING_DIRECTORY.flatMap((o) => [o.fundingType, o.summary]),
    // Personal names stay as written; job titles and the placeholder translate.
    ...FAIRNESS_SWAPS.map((s) => s.currentRole).filter(Boolean),
    'Anonymised candidate',
    ...badgeText,
    ...aggregateSdgContributions(
      baseProfile,
      role,
      plan,
      'moderate',
      baseline,
      restoreWorkforceSettings(),
    ).person.flatMap((item) => [item.title, item.rationale]),
  ];
  assert.ok(labels.length > 100);
  for (const [locale, messages] of Object.entries(dictionaries))
    for (const label of labels)
      assert.ok(Object.hasOwn(messages, label), `${locale}: ${label}`);
});
