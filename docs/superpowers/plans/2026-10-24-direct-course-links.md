# Direct course links implementation plan

> **For agentic workers:** Use executing-plans to implement this targeted change inline, with one final independent review.

**Goal:** Every displayed learning activity identifies a real course and opens that exact provider page.

**Architecture:** Keep the existing catalogue and planning engine as the single source of course identity. Reuse a small accessible course-link component across the pathway, overview, completed learning and SME groups. Chat sources retain canonical course titles.

**Tech stack:** Next.js, React, TypeScript, existing CSS and node:test.

**Spec:** The user's request: “all the learning pathway is exactly have the course and an link direct to it”.

## Constraints and review focus

- Preserve scoring, scheduling, state, APIs, event handlers and existing exports.
- Verify the eleven official pages; use exact titles, HTTPS course URLs, and a 2026-10-24 check date. No generic search or invented courses.
- Keep canonical course titles in all three languages; translate link labels and accessible names.
- Completed courses and SME grouped courses must remain directly accessible.
- Chat must identify and link every scheduled course, including plans longer than five steps.
- Empty/HRD-only plans must retain honest empty states. Uncovered skills remain visible.
- Links open a new tab safely and remain usable at 320px, standard/larger text.

## Tasks

- [x] Inspect every course presentation and check the eleven official provider pages, including durations.
- [x] Write failing tests for the SQLBolt identity and full named chat course links; observe the failures.
- [x] Correct catalogue metadata and add course access across the existing views; translate new UI copy.
- [x] Run unit tests, formatting, typecheck, production build and integration checks. Inspect rendered UI and actual external navigation.
- [x] Obtain independent review, resolve concrete issues, commit and push to GitHub.
- [x] Import the exact source into Replit, verify its tests/build, clear obsolete generated build folders, publish and verify public links.

## Evidence and rulings

- The eleven provider pages were read on 24 October 2026. Existing provider study durations match the pages; SQLBolt and Microsoft Learn retain clearly labelled planning allowances.
- Existing individual course cards already linked to courses. Overview, completed learning and SME groups lacked direct access; chat used identical generic source labels and truncated at five courses.
- Ruling: retain all existing course IDs, skill mappings, hours and planner logic. Only SQLBolt's display title/URL need correction; its eight-hour allowance covers the interactive lesson series.
- Three new tests failed for the expected old title/date and five-step chat limit, then passed after implementation. All 115 unit tests, typecheck, formatting, production build and 16 local production integration checks passed.
- Browser: the four baseline steps, rapid scenario project route, overview, completed-course access, all six SME groups and named chat sources matched catalogue URLs. SQL navigation opened the actual Introduction to SQL page. Malay and Chinese labels preserve canonical course titles. HRD-only filtering retained an honest empty plan.
- Responsive limitation: the browser viewport override returned without changing the measured 2560px viewport. Temporary overrides were reset; this change's narrow-phone layout was reviewed in CSS but was not claimed as a measured phone browser test.
- Independent read-only reviewer found no concrete actionable issues.
- Shipped source `7b759d7`, runtime `a9baef3`; both GitHub CI runs passed. Replit exact-tree/build/115-test/16-integration verification passed. Removed 840,928 KiB of old regenerable output before publishing. Public version observed 2026-10-24 07:28:14 UTC; all 16 public HTTPS integration checks passed. Public browser course cards confirmed and screenshot saved at `docs/images/direct-course-links-live.jpg`.
