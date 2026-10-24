# Workforce PDF export implementation plan

> **For agentic workers:** Use executing-plans inline, with one final independent review.

**Goal:** Make the SME workspace's Export plan download a readable PDF of the current plan.

**Architecture:** Extract the current workforce calculation unchanged into a shared pure function. A bounded Node route validates the same profile, roster, constraints, scenario and snapshot, recomputes that plan, and renders a PDF using PDFKit with an embedded licensed Noto font. The UI downloads the binary response and exposes loading/error states. No allocation or individual JSON-export behavior changes.

**Scope / decisions:** The screenshot identifies the workforce Export plan button, so this change covers that export. Prefer a direct PDF download over browser print, which requires an extra Save as PDF step. Use PDFKit because the deployed app uses Node, with no Python runtime dependency. English, Bahasa Melayu and Simplified Chinese headings follow the selected interface language; names and official course titles remain canonical. Include scenario/evidence metadata, budgets, allocation status, grouped courses with direct links, per-worker course weeks and remaining gaps, and the existing planning/SDG limitations. Excluded workers receive no assigned courses. An empty roster remains empty. Fonts are bundled, with no network or model call during export.

## Tasks

- [x] Write failing shared-plan and PDF regression tests, including current displayed allocation parity, zero/ten members, exclusions, long/Chinese text and course-link annotations.
- [x] Extract `src/lib/workforce-plan.ts` and reuse it in `employer-panel.tsx`; implement PDF validation/rendering and `POST /api/workforce-export` with bundled font/license and tracing configuration.
- [x] Replace CSV action with PDF download, busy/error states and translated copy; preserve current settings and all existing allocation behavior.
- [x] Run unit/type/format/build and production integration checks. Generate sample PDFs, render with Poppler, inspect pages and verify links/text. Test the actual browser download. Perform independent review and fix findings.
- [ ] Push, import exact source into Replit, verify and publish. Confirm the public PDF download and preserve release evidence.

## Review focus

- The exported snapshot must agree with the user's current roster, selected destinations, budget and proposed openings.
- No-slot/over-budget workers must not receive assigned training or inflate aggregate hours/fees.
- Empty plans and completed learning must not become fabricated new training.
- Long names, translated copy and multi-page course lists must wrap without clipping or blank overflow pages; links must remain clickable.
- Invalid/oversized requests must return a normal error, and download failures must restore the export button.

Verification ledger:136 unit tests, typecheck and formatting pass. PDF pagination regressions were reproduced and fixed (extra footer pages, orphaned course links/headings, multiline-note overlap). Poppler/PDF extraction checks covered English/Malay seven-page reports, a ten-member long-Chinese twelve-page report, and an eighty-line note with all lines inside the reserved body area. Allocation extraction is unchanged; the independent reviewer confirmed parity. Final browser/build/deployment checks remain below.

Local production verification: build and all 22 integration checks passed. Chrome downloads produced real seven-page PDFs with 23 direct course links. The English export matched the visible eight-person team, five planned learners, 109 person-hours and RM 500 budget. After changing the UI to rapid adoption, RM 250 and Simplified Chinese, the second export contained those current values and translated labels. Test preferences were restored. Independent re-review found no remaining important issues.
