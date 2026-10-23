# Technical and tools declaration — editable working draft

**This is a preparation document. Transfer the reviewed details into the organiser's official template.** Do not submit unchecked statements as completed work.

| Item                   | Actual use / status                                                                                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project                | ArcTalent                                                                                                                                                                                                                                     |
| Team members / IDs     | TODO: enter the four actual members                                                                                                                                                                                                           |
| Main stack             | Next.js 16, React 19, TypeScript; exact installed versions in package-lock.json                                                                                                                                                               |
| UI                     | Custom CSS, SVG learning map/radar and Lucide icons                                                                                                                                                                                           |
| Matching / planning    | Deterministic TypeScript heuristics written with AI assistance; source in src/lib/engine.ts                                                                                                                                                   |
| Input validation       | Zod                                                                                                                                                                                                                                           |
| PDF extraction         | pdf-parse, readable synthetic PDFs only                                                                                                                                                                                                       |
| AI integration library | Vercel AI SDK and OpenAI-compatible provider adapter                                                                                                                                                                                          |
| Runtime AI mode        | Local alias matching by default; no LLM required for matching or planning                                                                                                                                                                     |
| Optional GPU provider  | RunPod adapter implemented; a real endpoint/model must be configured and tested before claiming operational use                                                                                                                               |
| Replit                 | Public deployment verified on 23 October: https://arc-talent--emmanuelheng.replit.app/ . All 14 production API checks passed publicly; scenario, evidence replay and SME browser checks passed. Runtime history pushed. See REPLIT_STATUS.md. |
| Repository             | https://github.com/MantouOP/ArcTalent                                                                                                                                                                                                         |
| Tests                  | Node test runner via tsx; production API integration script; manual browser checks documented in VERIFICATION.md                                                                                                                              |
| External information   | O*NET occupations; public provider learning-resource pages; Arbeitnow API; arXiv RSS; UN SDG target pages                                                                                                                                     |
| Data                   | Eight fictional profiles, two labelled synthetic snapshots; optional public feed refresh                                                                                                                                                      |
| License                | Apache-2.0 for project code; external rights remain with their owners                                                                                                                                                                         |

## AI assistance disclosure

Codex provided substantial assistance with brainstorming, architecture, the matching and planning implementation, React/CSS interface, API handlers, tests, source research and documentation. AI assistance began during ideation and continued through this implementation. The exact underlying model/version should be entered only if it is visible and verifiable in the team's account; it is not inferred here.

The 22 October worker-journey addition used the installed Superpowers planning/testing/review workflows, Taste Skill's app-screen guidance and source lint, and the React checklist. Browser checks used Codex browser tools. No third-party skill browser inspector was run. One fresh code reviewer completed a read-only review; it did not provide worker research or validate career outcomes.

The subsequent Orion redesign followed the team's supplied visual reference: custom dark CSS, an SVG career constellation, score gauges, comparison bars, a proposed weekly-hours area chart and proportional skill-reuse bubbles. These are presentations of existing engine output. The orb is decorative, with no geographic or labour-market claim. No new chart library, data service or AI model was added. Existing application state and event handlers were preserved and checked separately from the visual review.

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
- No production accounts, persistence service, employer permission model, OCR or real-CV handling workflow.
