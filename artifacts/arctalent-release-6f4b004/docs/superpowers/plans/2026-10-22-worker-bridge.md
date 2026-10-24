# Worker preferences and skill bridge implementation plan

> Execute in this session using the executing-plans workflow. The user's original questionnaire/adjacent-role brief and instruction to continue building authorise this work.

**Goal:** Help a worker express their preferences and see precisely which existing skills carry into the selected occupation.

**Architecture:** Extend the existing profile with optional preferences; keep recommendations on the existing interest/skill model. Derive the bridge from the same profile and role requirements as the engine. Add focused React components to the existing profile and pathway screens.

**Tech stack:** Existing TypeScript, React, Next.js, Zod and Node test runner. No new dependency or service.

**Spec:** Original approved ArcTalent feature brief in this conversation; `docs/IMPLEMENTATION_PLAN.md`.

## Design and constraints

- Three optional questions: the kind of problem the worker enjoys (one of the four existing interest families), their preferred study activity, and a 15/30/60-minute session length. Review before applying to the profile draft; save the profile once to replan. Cancel discards questionnaire edits.
- Applying answers explicitly replaces interest selections with the chosen focus. Subsequent manual interest edits remain authoritative. Never infer ability, learning speed, proficiency or a credential from preferences.
- Format and session length affect guidance only. Time/budget and score weights stay unchanged. Old saved profiles without preferences remain valid. Synthetic profile changes and demo reset clear personal edits as before.
- Study guidance splits the existing weekly minutes into full sessions and a possible shorter final session; zero available time shows no sessions.
- A bridge row is "Meets target" when current >= required, "Build further" when 0 < current < required, and "New skill" when current = 0. Coverage caps excess skill levels at the target and agrees with engine coverage. Missing and zero requirements cannot create NaN or fake gaps.
- Preserve ArcTalent's forest green/ivory identity, fonts and transit map. These are additions within existing screens, so no new visual direction is needed. The question is "What can I carry into this role?"; a segmented coverage bar and current/target rows answer it. Mobile stacks summary and rows without page overflow. Keyboard controls have labels and visible focus.
- Keep main clean while implementing on `codex/worker-skill-bridge` in the existing dedicated checkout. Merge and push after verification, as already requested. This avoids an unnecessary duplicate checkout for this small coupled change.

## Task 1: Preference validation and study rhythm

Files: `src/lib/types.ts`, `src/lib/validation.ts`, new `src/lib/learning-preferences.ts`, `tests/preferences.test.ts`.

Interfaces: `LearningPreferences`; `applyLearningPreferences(profile, preferences): Profile`; `buildStudyRhythm(hours, sessionMinutes): { fullSessions, fullSessionMinutes, remainderMinutes, totalMinutes }`.

- [x] Write tests for schema preservation/rejection, old profile compatibility, interest replacement without skill/time changes, and 0/1/4-hour schedules with remainder boundaries.
- [x] Run tests and observe missing preference behavior fail.
- [x] Implement validation and pure helpers. Keep format/session preferences out of scoring and course duration.
- [x] Run `npm test` and `npm run typecheck`; expect all passing.

## Task 2: Derived skill bridge and UI

Files: new `src/lib/skill-bridge.ts`, `tests/bridge.test.ts`, `src/components/preference-check.tsx`, `src/components/skill-bridge.tsx`, `src/components/study-rhythm.tsx`; modify profile panel, app and stylesheet.

Interfaces: `buildSkillBridge(profile, role)` returns rows, ready/developing/new counts and coverage; UI consumes Task 1 helpers and the active role.

- [x] Test mixed/empty/overqualified profiles, changing destination and scenario-independent coverage; assert literal status counts and coverage against independent fixtures.
- [x] Observe red, implement bridge derivation, then run the suite.
- [x] Build the three-step questionnaire with review, cancel/back, optional clear and one profile save.
- [x] Add the bridge above the course list and study guidance beside the weekly schedule. Include both in the pathway JSON export.
- [x] Browser-check questionnaire completion/cancel, manual interest changes, persisted preferences, reset, role/scenario changes, and desktop/tablet/mobile layout.

## Task 3: Verify and deliver

- [x] Extend API integration checks to exercise preference-bearing profiles and reject invalid preferences.
- [x] Format, typecheck, run unit tests, production build and production API integration checks. Expect every check to pass.
- [x] Review the complete diff independently; fix important findings and verify again when needed.
- [x] Update demo, implementation/verification notes and accurate tool disclosure. Git history and the final delivery message record the subsequent merge, push and verified remote SHA.

## Review focus

1. Old local-storage profiles must load without the new optional property.
2. Cancelling/closing a partially answered questionnaire must not change the saved profile.
3. Applying preferences must never alter proficiency, completed learning, hours or budget.
4. Zero hours and a session longer than the weekly budget must show an honest schedule.
5. Changing destination or scenario must not leave stale bridge rows or a misleading coverage bar.

## Progress

- Baseline: 14 tests pass; working tree clean at `852e147`.
- Execution choice: implement here and use one fresh reviewer at completion. Existing authorisation covers the feature scope and GitHub push.
- Task 1 complete: schema tests first reproduced dropped/invalid preferences; implementation passed. Session/apply helpers and bridge tests then failed against empty stubs and passed after implementation. Final suite: 22 passed.
- Task 2 complete: questionnaire review/cancel/apply, manual interests, persisted preferences, clear/profile switch/reset, selected-role/scenario bridge, zero time, and desktop/tablet/mobile screens checked through the browser API. Export wiring includes the current profile, bridge and rhythm; the browser download was triggered, but its downloaded bytes were not collected for inspection.
- Final review: one fresh read-only reviewer found no critical, important or actionable minor source issues. Its browser-layout/focus exclusions were checked directly. A separate browser assertion reproduced failure to restore keyboard focus after Escape; the shared dialog now restores its captured trigger, and the same assertion passed.
- Verification: production build, 22 unit tests, 14 production API checks, typecheck and source lint passed. Four new interface files had zero Taste Skill lint failures/warnings. Browser inspector adapted to Codex browser screenshots/DOM checks. No new data-source or forecast claim was added.
- Delivery: commit and fast-forward into the known base `main`, then push using the already authorised GitHub connection. Replit remains separately pending as documented in `docs/REPLIT_STATUS.md`.
