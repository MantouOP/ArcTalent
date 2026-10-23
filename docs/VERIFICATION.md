# Verification record

## Watermark and graphics-load removal — 23 October 2026

The user reported intrusive Unicorn watermarks and lag after the embed was published. Removed the entire Unicorn background component, its CSS, root-layout mount and npm dependency. The original Orion CSS background is restored. This removes the additional continuously rendered WebGL scene rather than hiding its branding. The previously observed desktop canvas was about 7.5 million pixels at DPI 1.5; no frame-time or whole-app performance benchmark is claimed.

The clean local production build passed type checking and all 32 tests. Chrome showed zero background hosts, zero canvas elements and zero Unicorn SDK script tags; scenario switching and SME navigation worked with no captured warnings/errors. The core layout, original styling, engine, APIs and dependency manifests match clean source `53fdc89`. That release passed a fresh 32 tests and 14 API checks in Replit and is being restored there; public verification is tracked in REPLIT_STATUS.md.

## Unicorn Studio background — 23 October 2026

Added only a root-layout background component, its styles and the pinned `unicornstudio-react` 2.4.0 dependency. Existing application handlers, state, scoring and API routes were not edited. The supplied scene `1tL5S72Xeil63nK5HBc1` loads through a client-only chunk with viewport dimensions, scale 1, DPI 1.5 and a 30 FPS target. The existing Orion gradient remains available while loading or after failure. A local error boundary contains chunk/render failures; the decorative layer is inert, hidden from assistive technology and cannot intercept pointer events. Reduced-motion preferences control whether the scene mounts and destroy it when disabled; OS preference changes were source-reviewed rather than toggled in the browser.

The final production build loaded the scene with `data-state="ready"`, one canvas and no captured browser warnings/errors. Scenario switching and SME navigation worked above it. Desktop, 768 × 1024 and 390 × 844 checks showed a viewport-sized canvas with no document-level horizontal overflow. Temporary viewport overrides were reset. The published scene includes repeating Unicorn watermarks; they were preserved. A read-only reviewer identified an import-error isolation gap; the local error boundary resolved it and the reviewer confirmed the fix. Source lint on the two new interface files reported zero failures/warnings; no third-party browser inspector was used.

Production build, type checking, formatting, 32 unit tests and all 14 local production API checks passed. Exact public release status is recorded separately in REPLIT_STATUS.md.

Source `5273e76` is now Live on Replit through runtime `68bda37`. Replit's locked install, 32 tests, production build and 14 API checks passed before publication; all 14 API checks passed again against public HTTPS after the new background host appeared. The public browser initialized one scene successfully, with an inert host and no overflow. Scenario switching and SME navigation passed, and no browser warnings/errors were captured. The demo was reset and the [live screenshot](images/unicorn-background-live.jpg) saved. An initial browser-tool click timed out during first scene startup; inspection showed a loaded canvas with no application error, and the subsequent interaction checks passed.

## Acceptance fixes — 23 October 2026

Two live failures were reproduced: SME settings disappeared when its view unmounted, and edited CV text retained candidates from the previous sample. Workforce settings now live in the application state and validated optional browser storage. CV evidence uses an invalidating reducer and request IDs to reject superseded async completions and errors.

The revised local production build passed **32 unit tests**, type checking, repository formatting, compilation and all **14 API integration checks**. Chrome confirmed that RM750, Aina's Sustainability destination and three openings survived evidence replay and reload; Reset demo restored defaults. Editing an Excel/SQL/Power BI sample immediately removed its four candidates, and re-extracting a Python-only sample returned only Python. Revoking synthetic confirmation disabled extraction. The actual synthetic PDF passed through Chrome's file picker after the extension permission was enabled. Worker JSON and workforce CSV downloads were inspected. No warning/error entries were captured in the revised local tab. An independent read-only code reviewer found no actionable issues.

See the [feature acceptance matrix](FEATURE_ACCEPTANCE.md) for the boundary between the implemented prototype and the broader concept. Public deployment of this revision is tracked separately in [Replit status](REPLIT_STATUS.md).

A final file-picker check exposed `pdf-parse` rendering the supplied PDF's dash punctuation as mojibake, while an independent PDF reader recovered the original dashes. The synthetic PDF fixture was regenerated with ASCII hyphens. Both readers then extracted the expected text, and a rendered-page inspection confirmed legibility. This corrects the demo fixture; it does not claim universal PDF font/Unicode compatibility or change the parser/backend.

The final release (`53fdc89`, runtime `a8086ef`) is **Live on Replit**. Its public PDF checksum exactly matched the corrected fixture before all 14 HTTPS API checks passed again. Public Chrome checks verified CV invalidation, the new single Python candidate, manager settings retained through scenario/replay/reload, and clean PDF text through the actual file picker. The final log inspection contained no application warnings/errors; an earlier extension-origin error was outside the app. The demo was reset to Aina's baseline and the [final live screenshot](images/replit-acceptance-live.jpg) saved. Both source and runtime GitHub CI runs passed; details are in REPLIT_STATUS.md.

Run date: **22 October 2026 (MYT)**. Local Windows environment: Node.js 24.13.1, npm, production Next.js Webpack build. These results do not establish deployment or external platform compliance.

## Automated results

| Check                                                      | Observed result                            |
| ---------------------------------------------------------- | ------------------------------------------ |
| `npm run typecheck`                                        | Passed                                     |
| `npm test`                                                 | 22 passed, 0 failed                        |
| `npm run format:check`                                     | Passed                                     |
| `npm run build`                                            | Passed, all five API routes and page built |
| `npm run test:integration` against final production server | 14 passed, 0 failed                        |
| `git diff --check`                                         | Passed                                     |

Engine checks cover skill coverage, monotonic improvement, scenario sensitivity, shared foundations, deterministic evidence changes, budget/time limits, prerequisite order, zero-time constraints, funding gaps, name independence, retained studied courses, supported extraction candidates, snapshot identity and the minimum live-sample rule.

Worker-journey tests additionally cover optional preference validation, old-profile compatibility, unchanged skill/time/budget values when applying preferences, unchanged ranking from practice/session preferences, exact weekly-session arithmetic including zero time/remainders, bridge status boundaries, capped coverage and agreement with each role's score explanation in both scenarios.

Production integration checks cover the page, health, API/engine parity, invalid skill levels, malformed and oversized requests, synthetic confirmation, extraction evidence, non-PDF rejection and successful parsing of the actual one-page synthetic PDF fixture.

Two new production checks verify that explicit interests override the check-in focus for matching, and invalid preference values receive HTTP 400.

The integration script assumes the default extraction mode. A configured model requires a separate evaluation of output validity, latency and supported candidates.

## Browser observations

- Moderate adoption led with Business Intelligence Analyst, using the Excel/data and critical-thinking foundation followed by Power BI and SQL.
- Rapid adoption led with Project Management Specialist; the same foundation remained, followed by the project methodology course.
- The newer synthetic snapshot produced visible before/after scores and changed skill signals. For example, project management in the rapid scenario moved from approximately 65.5 to 68.1.
- A course marked studied remained in “Learning you're keeping” after a newer snapshot was applied.
- A manually chosen Sustainability Specialist destination survived a browser reload.
- Synthetic CV text generated supported candidates through `/api/extract`; the UI required confirmation and explained the local matching mode.
- Saving zero weekly hours produced an honest empty pathway with guidance to review constraints.
- The HRD funding filter returned zero courses and explained the missing programme verification.
- The SME table showed eight synthetic workers, updated a proposed destination and recalculated training activity.
- The score dialog opened, and Escape dismissed it.
- Desktop layout checked at 1440 × 1000. Mobile layout checked at 390 × 844; career and workforce screens had no document-level horizontal overflow. The workforce table scrolls inside its container.
- No browser warning/error entries were captured during the recorded checks.
- A live refresh successfully retrieved **100 Arbeitnow job records and 12 arXiv research records** during the session. This is an observed fetch, not a promise of future source availability or a claim about Malaysian demand.

The [dashboard screenshot](images/dashboard.jpg) records the verified desktop baseline. Temporary viewport overrides were reset after testing.

## Worker-journey browser checks

- Closing a partially answered check discarded its choices; reopening required a new answer.
- Completing the three questions showed a review before application. Applying selected Sustainability only; a subsequent manual Data & insights selection remained authoritative after saving.
- The saved 30-minute practice preference survived a browser reload and showed up to eight sessions within the existing four-hour weekly limit.
- Selecting Sustainability changed bridge coverage to 45.5%, with two skills at target, two to strengthen and two new skills. Switching AI scenario kept that manually pinned role and its skill coverage.
- Aina's BI bridge showed 58.3% coverage: two skills at target, three to strengthen and one new skill. Its rows matched current and target levels.
- Zero weekly hours showed no study sessions. Clearing preferences restored the optional-check invitation; switching synthetic profiles and Reset demo discarded those edits.
- Escape dismissed the questionnaire. A reproduced focus-restoration bug in the shared dialog was fixed so closing returns keyboard focus to the trigger.
- New views checked at desktop 1440 × 1000, tablet 768 × 1024 and mobile 390 × 844. No document-level horizontal overflow in the new bridge/profile views; long mobile dialogs scroll internally.
- Taste Skill source lint on the four new interface files: zero failures and zero warnings. Its Chromium inspector was not run; browser screenshots and DOM measurements used the available Codex browser API.
- A fresh read-only code reviewer found no critical, important or actionable minor source issues. Browser findings and the focus fix were verified by the implementer.

The [worker bridge screenshot](images/worker-bridge.png) shows the new pathway detail. The [preference screenshot](images/learning-preferences.png) shows the optional questionnaire.

## Orion presentation checks — 22 October 2026

- Restyled the explorer, pathway, workforce, evidence and profile screens with the supplied obsidian/indigo palette. Added a fixed icon rail and labelled mobile navigation, translucent panels, geometric type, glowing SVG marks and reduced-motion support.
- Compared the application AST against `cce905f`: the full logic before the render is identical, and all **36 existing event handlers** remain present. The two additional callbacks invoke existing selection/explanation handlers. No changes to `src/lib`, API routes, schemas, exports, scoring, dependencies or request logic.
- Scenario toggling followed the top route when enabled and retained a manually selected Sustainability destination when pinned. A newer snapshot showed its actual +3.3-point evidence delta; studied learning remained retained.
- The score dialog opened and Escape restored focus to its trigger. The funding filter kept its truthful empty state. The three-question check advanced through review and saved through the existing profile flow.
- Zero weekly time produced eight zero-hour points. A zero-skill profile produced 0% coverage, zero-height skill-coverage bars and zero reuse labels without filled bubbles.
- Workforce budget/opening controls remained functional. At 390px, the heatmap was 1179px wide inside a 314px scrolling frame; the document did not overflow horizontally.
- All five views had no document-level horizontal overflow at 768 × 1024 and 390 × 844. An intermediate-width conflict with the legacy 760px breakpoint was reproduced at 700px and fixed by aligning navigation/map reflow: the nav then measured fixed at bottom 0 and the map used three stacked columns, with no horizontal overflow. The desktop composition was inspected at 1440 × 1000.
- Browser logs exposed a new SVG tooltip hydration mismatch and floating-point differences in radar coordinates across JavaScript engines. Rendering each tooltip as one string and rounding only SVG display coordinates to 0.001px fixed both. A subsequent development reload and a fresh production tab recorded no warning/error entries. Scores and proficiency values were untouched.
- Final results: 22 unit tests, 14 production API checks, type checking, formatting and production build passed. One Windows build encountered EPERM creating a generated directory; stopping the temporary servers and rebuilding outside the sandbox succeeded. No build configuration or application integration was changed.
- A fresh read-only reviewer found no critical, important or minor source issues. It declined browser appearance, measured contrast, clipping and keyboard checks; the implementer performed visual/DOM and focus checks. No formal accessibility audit or third-party browser inspector is claimed.

The [full command-center screenshot](images/orion-command-center.png), [workforce screenshot](images/orion-workforce.png) and [phone screenshot](images/orion-mobile.png) record the new presentation. Temporary viewport overrides were reset; the production preview remains available at localhost:3000.

## Public Replit deployment — 23 October 2026

The [public deployment](https://arc-talent--emmanuelheng.replit.app/) is Live with public access. All 14 production integration checks passed against its HTTPS URL without credentials, including real synthetic PDF parsing. Browser checks confirmed the Orion interface, moderate/rapid scenario change with shared foundational learning retained, the dated synthetic replay with explicit score deltas, and the eight-worker SME workspace. The demo was reset after verification; no browser warning/error entries were captured. See [Replit runtime evidence](REPLIT_STATUS.md) and the [deployed screenshot](images/replit-live.jpg).

The deployed public-source refresh also returned 100 Arbeitnow job records and 12 arXiv research records during this verification, exercising the fifth API route (`/api/signals`).

## External verification still pending

Replit development Preview/workflow, a paid RunPod endpoint, Malaysian vacancy data, HRD programme claimability, worker/employer validation, measured career outcomes and the official submission package. Production publication and the public API/browser checks are verified separately from the development Preview/workflow. Remote CI status must be checked for each new commit.
