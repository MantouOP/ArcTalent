# ArcTalent language options implementation plan

**Goal:** Let users select English, Bahasa Melayu or Simplified Chinese throughout the existing app.

**Architecture:** A small client-side locale context supplies a dictionary translator to presentation components. English source phrases are keys; named interpolation preserves whole sentences and numbers. The independent `arctalent-locale-v1` preference survives reload and demo reset. Existing profile, engine, CV, workforce and API contracts remain canonical and unchanged.

**Tech stack:** Existing TypeScript, React and Next.js; no additional runtime dependency or translation service.

## Constraints and review focus

- Render English on the server and first client render to avoid hydration differences; restore a validated saved locale afterwards. Storage denial falls back safely.
- Use `en`, `ms` and `zh-CN`, set the document language, and show native option names.
- Translate controls, headings, accessible labels, charts, fixed role/skill descriptions and status copy; retain external resource titles, quotes, names and editable user content.
- Language changes must preserve active view, edited fields, selected destination, scenario, completed courses and SME settings.
- No new background animation, SDK, paid service or network dependency.
- Check longer Malay labels and Chinese glyphs at desktop and mobile widths.

## Task 1: Locale core and dictionary contract

- [x] Add meaningful tests for locale validation/fallback, interpolation (including zero), safe unknown-source fallback and matching placeholder sets in both translations.
- [x] Implement `src/lib/i18n.ts`, translation dictionaries, and `src/components/language-provider.tsx` with `useI18n()` and accessible native language selector.
- [x] Run locale tests and existing tests.

## Task 2: Translate the presentation layer

- [x] Connect the provider at the root and place the selector in the existing header.
- [x] Replace visible fixed copy and dynamic sentence templates in the existing presentation components. Translate labels at render time, keeping IDs and values unchanged.
- [x] Add fixed catalogue/preference display phrases to the dictionaries. Extend career search to translated titles as well as English.
- [x] Verify dictionary coverage, type checking, build, formatting and existing API checks.

## Task 3: Verify and publish

- [x] Test all three languages in Chrome, saved preference after reload, and switching language without losing an edited profile or SME settings.
- [x] Check desktop/mobile layout, document language and browser errors; save screenshots.
- [x] Review the whole change, commit, push GitHub, import the exact release into Replit and publish.
- [x] Verify the live selector and all 14 production API checks, record the deployed source and evidence.
