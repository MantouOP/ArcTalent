# Technical and tools declaration — editable working draft

**This is a preparation document. Transfer the reviewed details into the organiser's official template.** Do not submit unchecked statements as completed work.

| Item                   | Actual use / status                                                                                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project                | ArcTalent                                                                                                                                                                                                                                                                  |
| Team members / IDs     | TODO: enter the four actual members                                                                                                                                                                                                                                        |
| Main stack             | Next.js 16, React 19, TypeScript; exact installed versions in package-lock.json                                                                                                                                                                                            |
| UI                     | Custom CSS, SVG learning map/radar and Lucide icons                                                                                                                                                                                                                        |
| Matching / planning    | Deterministic TypeScript heuristics written with AI assistance; source in src/lib/engine.ts                                                                                                                                                                                |
| Input validation       | Zod                                                                                                                                                                                                                                                                        |
| PDF extraction         | pdf-parse, readable text PDFs with explicit processing consent                                                                                                                                                                                                             |
| AI integration library | Vercel AI SDK and OpenAI-compatible provider adapter                                                                                                                                                                                                                       |
| Runtime AI mode        | Structured RunPod career-goal analysis when available; labelled local/manual fallback. Matching and scheduling remain deterministic.                                                                                                                                       |
| Optional GPU provider  | User-provided RunPod Serverless vLLM endpoint, Qwen/Qwen2.5-7B-Instruct. Real career-goal inference verified locally, in Replit and publicly on 24 October. Credentials remain server-side.                                                                                |
| Replit                 | Public deployment verified on 24 October: https://arc-talent--emmanuelheng.replit.app/ . All 19 HTTPS API checks and real career-goal AI inference passed. Replit passed 127 unit tests and its production build. Runtime history and CI are recorded in REPLIT_STATUS.md. |
| Repository             | https://github.com/MantouOP/ArcTalent                                                                                                                                                                                                                                      |
| Tests                  | Node test runner via tsx; production API integration script; manual browser checks documented in VERIFICATION.md                                                                                                                                                           |
| External information   | O*NET occupations; public provider learning-resource pages; Arbeitnow API; arXiv RSS; UN SDG target pages                                                                                                                                                                  |
| Data                   | Eight fictional profiles, two labelled synthetic snapshots; optional public feed refresh                                                                                                                                                                                   |
| License                | Apache-2.0 for project code; external rights remain with their owners                                                                                                                                                                                                      |

## AI assistance disclosure

Codex provided substantial assistance with brainstorming, architecture, the matching and planning implementation, React/CSS interface, API handlers, tests, source research and documentation. AI assistance began during ideation and continued through this implementation. The exact underlying model/version should be entered only if it is visible and verifiable in the team's account; it is not inferred here.

The 22 October worker-journey addition used the installed Superpowers planning/testing/review workflows, Taste Skill's app-screen guidance and source lint, and the React checklist. Browser checks used Codex browser tools. No third-party skill browser inspector was run. One fresh code reviewer completed a read-only review; it did not provide worker research or validate career outcomes.

The subsequent Orion redesign followed the team's supplied visual reference: custom dark CSS, an SVG career constellation, score gauges, comparison bars, a proposed weekly-hours area chart and proportional skill-reuse bubbles. These are presentations of existing engine output. The orb is decorative, with no geographic or labour-market claim. No new chart library, data service or AI model was added. Existing application state and event handlers were preserved and checked separately from the visual review.

The 23 October acceptance audit reproduced and corrected stale CV evidence and manager settings lost on navigation. Codex used the installed debugging, testing, parallel-agent and independent review workflows for those two fixes, and the PDF skill to regenerate a synthetic fixture with parser-compatible punctuation. The revised app passed 32 unit tests and 14 production API checks; browser observations and exact release status are recorded in VERIFICATION.md and REPLIT_STATUS.md. No model was trained or newly configured during this audit.

The team subsequently supplied Unicorn Studio project `1tL5S72Xeil63nK5HBc1` for the site background. Its scene is embedded through `unicornstudio-react` 2.4.0 using the Next.js entry point, client-only loading, scale 1, DPI 1.5 and a 30 FPS ambient render target. This is decorative artwork, not labour-market data. The published scene's visible watermarks remain as supplied. The wrapper is MIT-licensed; the scene and Unicorn Studio SDK retain their own rights and terms.

**Current status:** the team requested removal because of the watermark and lag. The embed, its component/styles and its package have now been removed from the application. The preceding paragraph records historical use; the current clean release uses the original CSS background and loads no Unicorn renderer.

The engine's parameters, role requirements, course mappings and scenario assumptions are initial hypotheses produced during the assisted build. The team must review and adopt or change them consciously. Do not claim those values are measured estimates from the linked sources.

## Team review and contributions — complete with real evidence

| Date / member | Component reviewed or changed | Decision and reasoning | Commit / test / evidence |
| ------------- | ----------------------------- | ---------------------- | ------------------------ |
| TODO          | TODO                          | TODO                   | TODO                     |

Record genuine work as it happens. Do not backdate commits, invent manual review, fabricate teammate contributions or describe the optional model as trained/hosted until that work has happened.

## Limitations to declare

- No validated prediction of AI adoption, employment success, aptitude or job loss.
- Occupational source context is US-based; live job sampling is Europe-focused. Malaysian applicability needs validation.
- No programme currently verified as HRD Corp claimable.
- Source links and provider durations do not validate course-to-skill proficiency assumptions.
- No measured employment, productivity or SDG outcome; the dashboard reports planned activities.
- Real CV import supports explicit processing consent, transient text review and separately selected AI analysis. There are no production accounts, server persistence service, employer permission model or OCR. RunPod handles opted-in AI text under its own policies.
