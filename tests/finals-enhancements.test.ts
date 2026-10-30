import test from 'node:test';
import assert from 'node:assert/strict';
import {
  baseProfile,
  baseline,
  employees,
  roles,
  updated,
} from '../src/lib/catalogue';
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
  getMalaysiaReskillingOptions,
  runFairnessAudit,
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

test('Feature #1: SDG priority lens shifts role rankings and aggregates across person, company and region', () => {
  const baseMatches = rankRoles(baseProfile, 'moderate', baseline);
  const balanced = applySdgPriority(baseMatches, 'all');
  assert.equal(balanced.shifted, false);
  assert.equal(balanced.matches[0].role.id, 'bi');

  const greenFocus = applySdgPriority(baseMatches, '9.4');
  const sustRole = greenFocus.matches.find(
    (m) => m.role.id === 'sustainability',
  )!;
  assert.ok(sustRole.sdgBonus > 0);
  assert.ok(sustRole.score > sustRole.baseScore);

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
  assert.equal(agg.person.length, 5);
  assert.equal(agg.company.length, 5);
  assert.equal(agg.region.length, 5);
  assert.ok(agg.region.some((item) => item.learnersCount > 0));
});

test('Feature #2: Score boosters decompose exact match gains and pair with verified courses', () => {
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
    assert.ok(item.recommendedCourse !== null);
  }
});

test('Feature #3: Future skills radar and automatic re-planning diff capture snapshot changes', () => {
  const radar = buildFutureSkillsRadar(updated, baseline);
  assert.ok(radar.some((item) => item.trend === 'rising'));
  assert.ok(radar.some((item) => item.trend === 'declining'));

  const diff = computeReplanDiff(baseProfile, 'moderate', baseline, updated);
  assert.equal(diff.topRoleChanged, true);
  assert.equal(diff.oldTopRole.id, 'bi');
  assert.equal(diff.newTopRole.id, 'project');
  assert.ok(diff.keptCourses.length > 0);
});

test('Feature #4: Counterfactual fairness audit verifies zero demographic drift across 6 personas', () => {
  const audit = runFairnessAudit(baseProfile, 'moderate', baseline);
  assert.equal(audit.passed, true);
  assert.equal(audit.maxScoreVariance, 0);
  assert.equal(audit.personasTested, 6);
  assert.ok(audit.results.every((r) => r.pathwayIdentical));
});

test('Feature #5 & #6: Malaysia HRD directory and learner badges respond to role and completed courses', () => {
  const bi = roles.find((r) => r.id === 'bi')!;
  const hrdOptions = getMalaysiaReskillingOptions(bi);
  assert.ok(hrdOptions.length > 0);

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
