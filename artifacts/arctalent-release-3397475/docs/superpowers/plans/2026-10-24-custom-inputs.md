# ArcTalent Custom Inputs Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task.

**Goal:** Repair the CV import experience and enable the approved custom inputs throughout the planner.

**Architecture:** Reuse existing profile/snapshot callbacks and browser persistence. Share profile fields with the SME editor; add validated optional roster/check-in data and a pure simulation builder. Preserve all existing APIs and score arithmetic.

**Tech Stack:** TypeScript, React, Next.js, Zod and existing CSS; no new dependency.

**Spec:** `docs/superpowers/specs/2026-10-24-custom-inputs.md`.

## Global constraints

- Retain demo presets, synthetic-data confirmation, request invalidation and the three languages.
- Maximum CV size 5 MiB; session length 5–180 integer minutes; maximum roster ten people.
- User-entered evidence is simulation; API guards and scoring coefficients remain unchanged.
- Continue the authorized main/GitHub/Replit workflow in this existing workspace.

## Review focus

- Same-file reselection, invalid files and edits while importing must not leave stale candidates.
- Notes and custom durations survive schema/API/storage round trips without changing skill scores.
- Roster IDs, pinned destinations, active-profile synchronization and empty-team counts remain consistent.
- Calendar dates and percentages reject malformed input; a custom snapshot changes the engine result.
- Long labels/translations, keyboard use and forms fit phones with larger reading text.

## Tasks

- [x] CV: reproduce the inactive initial action; add file-validation tests (`tests/custom-inputs.test.ts`), import feedback, repeat-file handling and visible error/loading states in `profile-panel.tsx`.
- [x] Individual/check-in: extract `profile-fields.tsx`, add blank profiles, typed optional answers and custom session minutes; update `types.ts`, `validation.ts`, `preference-check.tsx` and `study-rhythm.tsx`. Observe the 45-minute/notes regression fail before implementation.
- [x] SME: extend `workforce-settings.ts` with validated optional `members` and `getWorkforceMembers(workforce, profile)`. Add editor UI, dynamic counts/export and root synchronization; test old/new saves, duplicate IDs, unknown roles and actual roster counts. Update the guide's team count.
- [x] Evidence: create `custom-inputs.ts` with `buildCustomSnapshot(input, id, collectedAt): Snapshot`; validate date/label/note/percentages before conversion and application. Add `custom-snapshot-form.tsx` and wire `onApply` into EvidencePanel/root.
- [x] Translate new copy, format/typecheck/test/build, run integration checks, browser-test all new flows and review the branch. Record results and push verified source.
- [x] Import exact source into Replit, verify runtime tests/build/integration, publish and verify public API/browser flows. Save screenshots, push runtime history and release evidence, check CI.

## Execution record

- Starting source: `78ae3a1`, clean working tree.
- Browser reproduction: the importer is disabled before confirmation, with no action-specific explanation. After checking confirmation, the deployed synthetic PDF imports successfully. The PDF endpoint itself is functioning in this reproduction.
- Ruling: retain explicit work/format categories alongside typed check-in notes, so users control the mapping to the existing catalogue rather than silently interpreting their prose.
- Ruling: keep the approved Orion palette/type; add compact native forms and existing dialogs rather than redesigning the shell.

- Review corrections: synchronized individual saves and course activity with the roster, seeded legacy saves during hydration and retained saved course activity in profile selection. Both reviewed issues have regression coverage; the focused reviewer found no remaining concrete issues.
- Browser correction: larger numeric fields were 12px because the existing input selector won specificity; the scoped reading-size rule now measures 16px.
- Release correction: the first publishing image exceeded Replit's 8 GiB limit. Removed only regenerable output from old releases, preserving sources/history and the complete current runtime. The unchanged app source passed promotion on retry and all 15 public HTTPS checks. Runtime history and cleanup CI passed.
