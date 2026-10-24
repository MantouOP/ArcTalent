# Workforce custom destinations implementation plan

> **For agentic workers:** Execute inline with executing-plans and one final independent review.

**Goal:** Let managers type a destination for each worker, analyse/edit skill targets and apply a verified starter learning plan that persists and exports to PDF.

**Design / approaches:** Reuse the established career-goal editor and server AI route rather than duplicate inference or merely rename a preset. A row text field with optional datalist suggestions accepts arbitrary titles. Submitting a known preset applies it directly; an unknown title opens a worker-specific review dialog. The existing editor supports AI/manual targets and exact catalogue previews. The dialog explicitly asks for proposed openings (initial suggestion 1, editable 0–10) before Apply. This is an employer assumption, never an inferred vacancy. Preserve the requested dark theme and current table; no unrelated visual redesign.

**Architecture:** Add optional `customDestinations[workerId]: { goal: CareerGoal, openings: number }`. Existing destinations accept the `custom-goal` marker only for a worker with a valid saved custom destination. Each custom role gets a worker-specific ID for allocation, preventing collisions between different goals. Preset slots retain their existing schema and behavior. Custom specialist skills stay visible as uncovered gaps; only verified catalogue courses are scheduled. UI and PDF consume the same shared plan.

**Files:** `workforce-settings.ts` owns validation and set/clear/remove helpers; `workforce-plan.ts` owns resolved roles/openings; `workforce-destination.tsx` owns row input/review dialog; `career-goal-panel.tsx` gets optional initial title/edit mode/apply label/foundation flag with unchanged defaults; employer/team/PDF components integrate them. Add paired workforce-goal translation dictionaries. Test the state helpers, allocator and real PDF/API flow.

## Tasks

- [x] Write failing state/allocation regressions: persistence, missing/orphaned goals, custom role collision isolation, preset switching, member removal, zero openings and specialist gaps.
- [x] Implement bounded backwards-compatible settings helpers and shared plan resolution; run focused tests.
- [x] Add row text input/datalist and accessible review modal using the existing AI editor. Reuse current worker constraints for exact course previews; apply/clear must affect only this worker. Add three-language copy and custom-opening controls.
- [x] Extend PDF and production integration checks for custom destinations, exact course links and specialist-gap disclosure; verify unit/type/format/build. Test actual browser AI/manual/preset/reload/scenario/PDF flows and review independently.
- [x] Push, import exact source into Replit, verify build/tests, publish, verify public typed-destination flow and PDF, and record release evidence.

## Review focus

- Different workers' custom roles must never share accidental IDs/capacity or alter the individual career goal.
- Editing input invalidates old AI results; closing/cancelling leaves saved destinations unchanged.
- Legacy saves and preset openings retain behavior; deleting a worker removes their custom settings.
- Empty/unknown goals require reviewed targets; specialist gaps cannot become fictional course links or a complete route.
- Newly entered openings are explicit editable assumptions. Zero openings allocate no courses. PDF and visible metrics agree.

Ruling: proceed within the user's existing authorization for arbitrary typed goals, AI skill analysis, custom team inputs, GitHub pushes and Replit publication. Reuse the existing stack/provider/catalogue. No new service or dependency is needed.

Validation ledger: the initial tests reproduced discarded custom goals, preset-only planning and colliding custom capacity. Six state/allocation tests now pass, alongside twelve existing workforce checks. The PDF regression reproduced missing custom openings/specialist disclosures. It now includes those fields and keeps the shared-course section with its first course. A prototype-name worker ID exposed an inherited-property validation hole, now rejected with an own-property check.

Ruling: increase the PDF request allowance from 64,000 characters/256,000 bytes to 128,000 characters/512,000 bytes. Ten fully detailed valid worker profiles plus ten goals can exceed the former limit. Streaming bounds and all per-field validation remain in force; a production check exercises this input.

Review fix: independent review reproduced a valid escaped-string payload larger than 128,000 serialized characters. A new route-level regression first returned 413, then passed after allowing 512,000 characters/2,048,000 bytes. The same escaped ten-worker fixture is used in production integration checks. The streamed size bound remains finite, and the client still omits unused signal records. No other important workforce findings were reported.

Local browser ledger: the real AI editor returned HTML/CSS and JavaScript targets with two exact course links and a 30-hour plan for Daniel. Earlier provider timeouts produced explicitly labelled local suggestions; provider inference subsequently recovered. Zero custom openings excluded the worker; changing to one allocated training. Typed input survived language changes, saved goals survived reload and intro/workspace navigation, and cancelling a changed title preserved the applied goal. The actual eight-page PDF contained the custom title, openings, 26 direct links and specialist disclosures; rendered pages were inspected. 144 unit tests and 25 production integration checks pass. Phone review dialog and team controls fit 320px after a one-column openings adjustment.

Release ledger: source `6f4b004`, runtime `bb3b776`, exact source equality, Replit build/144 tests/25 checks/real inference and both CI runs passed. All 25 public HTTPS checks passed after promotion. A temporary public test worker received real AI targets, exact two-course preview, persisted custom destination across reload/scenarios and an eight-page PDF with matching metrics and 23 links. Preset switching and member cleanup passed; the original seven-person team and planning totals were restored. Actual live screenshots and timestamps are preserved in REPLIT_STATUS.md.
