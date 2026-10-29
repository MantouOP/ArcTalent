import test from 'node:test';
import assert from 'node:assert/strict';
import {
  baseProfile,
  baseline,
  employees,
  updated,
  roles,
  skills,
} from '../src/lib/catalogue';
import {
  buildPlan,
  diffSnapshots,
  extractAliases,
  matchRole,
  rankRoles,
  sharedFoundation,
} from '../src/lib/engine';
test('Perfect skill coverage has zero pivot distance', () => {
  const role = roles[0];
  const match = matchRole(
    { ...baseProfile, skills: role.requirements },
    role,
    'moderate',
    baseline,
  );
  assert.equal(match.coverage, 100);
  assert.equal(match.distance, 0);
});
test('Improving a skill cannot worsen coverage', () => {
  for (const role of roles) {
    const a = matchRole(baseProfile, role, 'moderate', baseline);
    const b = matchRole(
      { ...baseProfile, skills: { ...baseProfile.skills, data: 3 } },
      role,
      'moderate',
      baseline,
    );
    assert.ok(b.coverage >= a.coverage);
  }
});
test('Scenario changes risk components without changing skills coverage', () => {
  const a = rankRoles(baseProfile, 'moderate', baseline),
    b = rankRoles(baseProfile, 'rapid', baseline);
  for (const x of a) {
    const y = b.find((z) => z.role.id === x.role.id)!;
    assert.equal(x.coverage, y.coverage);
    assert.ok(y.resilience < x.resilience);
  }
});
test('Demo switches leading career and later courses while preserving shared foundation', () => {
  const a = rankRoles(baseProfile, 'moderate', baseline)[0],
    b = rankRoles(baseProfile, 'rapid', baseline)[0];
  assert.equal(a.role.id, 'bi');
  assert.equal(b.role.id, 'project');
  const shared = sharedFoundation(baseProfile, baseline);
  assert.ok(shared.includes('data') && shared.includes('critical'));
  const pa = buildPlan(baseProfile, a.role, shared),
    pb = buildPlan(baseProfile, b.role, shared);
  assert.notDeepEqual(
    pa.steps.map((s) => s.course.id),
    pb.steps.map((s) => s.course.id),
  );
});
test('Evidence changes scores through the engine', () => {
  assert.ok(
    diffSnapshots(baseProfile, 'moderate', baseline, updated).some(
      (x) => x.delta !== 0,
    ),
  );
  assert.deepEqual(
    rankRoles(baseProfile, 'moderate', baseline),
    rankRoles(baseProfile, 'moderate', baseline),
  );
});
test('Shared skills support all compared routes in both scenarios', () => {
  const shared = sharedFoundation(baseProfile, baseline);
  for (const scenario of ['moderate', 'rapid'] as const)
    for (const m of rankRoles(baseProfile, scenario, baseline).slice(0, 3))
      for (const id of shared)
        assert.ok(
          (m.role.requirements[id] ?? 0) > (baseProfile.skills[id] ?? 0),
        );
});
test('Every plan respects budget, time and prerequisite ordering', () => {
  for (const role of roles) {
    const plan = buildPlan(baseProfile, role);
    assert.ok(plan.totalHours <= 32);
    assert.ok(plan.totalCost <= 0);
    const learned = { ...baseProfile.skills };
    const ids = new Set<string>();
    for (const step of plan.steps) {
      assert.ok(!ids.has(step.course.id));
      ids.add(step.course.id);
      for (const prereq of step.course.prerequisites)
        assert.ok((learned[prereq] ?? 0) >= 1);
      for (const id of step.course.skills)
        learned[id] = Math.max(learned[id] ?? 0, 2);
    }
    for (const week of plan.weeks) assert.ok(week.hours <= baseProfile.hours);
    assert.equal(
      plan.weeks.reduce((n, w) => n + w.hours, 0),
      plan.totalHours,
    );
  }
});
test('Zero available time and unverified funding produce honest gaps', () => {
  const noTime = buildPlan({ ...baseProfile, hours: 0 }, roles[0]);
  assert.equal(noTime.steps.length, 0);
  assert.ok(noTime.uncovered.length > 0);
  assert.equal(buildPlan(baseProfile, roles[0], [], 'hrd').steps.length, 0);
});
test('Names do not affect recommendations', () => {
  assert.deepEqual(
    rankRoles(baseProfile, 'rapid', baseline),
    rankRoles({ ...baseProfile, name: 'Someone else' }, 'rapid', baseline),
  );
});
test('Completed course is retained but never charged or scheduled twice', () => {
  const p = buildPlan({ ...baseProfile, completed: ['excel'] }, roles[0]);
  assert.equal(p.completed.length, 1);
  assert.ok(!p.steps.some((s) => s.course.id === 'excel'));
});
test('Alias parser returns known skills with evidence only', () => {
  const result = extractAliases(
    'Synthetic CV: I use Excel and SQL. I coordinate scheduling.',
  );
  assert.deepEqual(
    result.map((x) => x.id),
    ['excel', 'project', 'sql'],
  );
  assert.ok(
    result.every(
      (x) => skills.some((s) => s.id === x.id) && x.evidence.length > 0,
    ),
  );
});
test('Shared-foundation courses are scheduled before role-specific courses', () => {
  const mei = employees.find((e) => e.id === 'mei')!;
  const bi = roles.find((r) => r.id === 'bi')!;
  const plan = buildPlan(mei, bi, sharedFoundation(mei, baseline));
  // Value per hour alone would put the 2-hour Power BI course first.
  assert.equal(plan.steps[0].course.id, 'communication');
  let seed = 11;
  const random = () =>
    (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const profiles = [...employees];
  for (let i = 0; i < 300; i++)
    profiles.push({
      ...baseProfile,
      id: `random-${i}`,
      hours: 1 + Math.floor(random() * 10),
      weeks: 4 + Math.floor(random() * 23),
      skills: Object.fromEntries(
        skills.flatMap((s) =>
          random() < 0.5 ? [[s.id, Math.floor(random() * 4)]] : [],
        ),
      ),
    });
  for (const profile of profiles)
    for (const role of roles) {
      const steps = buildPlan(
        profile,
        role,
        sharedFoundation(profile, baseline),
      ).steps;
      const firstRole = steps.findIndex((s) => !s.shared);
      if (firstRole >= 0)
        assert.ok(
          steps.slice(firstRole).every((s) => !s.shared),
          `${profile.id} → ${role.id}`,
        );
      const learned = { ...profile.skills };
      for (const step of steps) {
        for (const prereq of step.course.prerequisites)
          assert.ok((learned[prereq] ?? 0) >= 1);
        for (const id of step.course.skills)
          learned[id] = Math.max(learned[id] ?? 0, 2);
      }
    }
});
test('Alias evidence quotes the whole-word match, on word boundaries', () => {
  const text =
    'Excellent communicator with a strong record. Builds weekly Excel reports for the finance team. Migrated the MySQL server, then wrote SQL queries for monthly summaries.';
  const result = extractAliases(text);
  // "Excellent" and "MySQL" contain the letters but are not the matches.
  assert.match(result.find((x) => x.id === 'excel')!.evidence, /Excel reports/);
  assert.match(result.find((x) => x.id === 'sql')!.evidence, /SQL queries/);
  for (const { evidence } of result) {
    const at = text.indexOf(evidence);
    assert.ok(at >= 0, evidence);
    assert.ok(
      at === 0 || /\s/.test(text[at - 1]),
      `starts mid-word: ${evidence}`,
    );
    const end = at + evidence.length;
    assert.ok(
      end === text.length || /\s/.test(text[end]),
      `ends mid-word: ${evidence}`,
    );
  }
});
