# ArcTalent — Updated PRD (final round)

**Team Xeno Force** · Domain 1, The Aiversecity Future-Ready Workforce Domain · SDG 8 (supporting SDG 4, 9 and 10)

This revises the preliminary proposal ([`submission/SDC2026_XenoForce_Preliminary.pdf`](../submission/SDC2026_XenoForce_Preliminary.pdf), 25 October 2026). It records what changed since the preliminary round, why, and how each preliminary promise stands today. It describes the application at source commit `6569bfb` (repository `main`, 1 November 2026); the dated release record is in [REPLIT_STATUS.md](REPLIT_STATUS.md). The problem, solution and design-thinking answers keep the preliminary template's word limits so they can be pasted into the official form.

## 1. Team & project overview

| Field                   | Entry                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Team name               | Xeno Force                                                                                                                                                    |
| Selected domain         | Domain 1 — The Aiversecity Future-Ready Workforce Domain                                                                                                      |
| SDG track               | SDG 8: Decent Work and Economic Growth. Supporting: SDG 4 (Quality Education), SDG 9 (Industry, Innovation and Infrastructure), SDG 10 (Reduced Inequalities) |
| Project / solution name | ArcTalent — _Skills that travel with you_                                                                                                                     |
| Leader                  | Emmanuel Heng Zi Teng (Universiti Malaya)                                                                                                                     |
| Team                    | 4 members: Universiti Malaya, Universiti Teknologi Malaysia, Management and Science University, Swinburne University of Technology                            |
| Live prototype          | https://arc-talent--emmanuelheng.replit.app/                                                                                                                  |
| Repository              | https://github.com/MantouOP/ArcTalent (public, Apache-2.0)                                                                                                    |

## 2. What changed since the preliminary round, and why

The reasons below are drawn from the build record (commit messages, [REPLIT_STATUS.md](REPLIT_STATUS.md), [SOURCES.md](SOURCES.md) and [IMPACT.md](IMPACT.md)). No external user testing has been run, so none is claimed.

| Area                          | At the preliminary round (25 Oct)                                                                                              | Final                                                                                                                                                                                                                                        | Why                                                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Measuring the Phase 2 targets | Four KPIs and targets stated in the proposal                                                                                   | An in-app **Impact scorecard** and `npm run impact`, which regenerates [IMPACT.md](IMPACT.md) from the code                                                                                                                                  | The proposal's targets had to be testable. A number anyone can regenerate is stronger than a claim.                                                                            |
| Shared foundation             | Promised 100% of weeks 1–4                                                                                                     | The scheduler places foundation courses first; the benchmark reports workers whose whole foundation is shorter than four weeks separately                                                                                                    | Keeps the promise checkable, and honest where the data cannot support 100%.                                                                                                    |
| SME training cost             | A 35% saving target with no price basis                                                                                        | A **cost model** priced from HRD Corp's Allowable Cost Matrix (November 2025) and DOSM wages, with editable assumptions and a break-even seat price                                                                                          | A saving is only credible against a stated price basis the manager can change.                                                                                                 |
| CV input                      | Synthetic CVs only                                                                                                             | Real TXT and text-PDF CVs after explicit consent; the verbatim-quote rule and user confirmation are unchanged                                                                                                                                | A tool for working adults has to start from the CV they actually have. Consent and the quote rule keep the privacy and evidence promises.                                      |
| AI provider                   | RunPod Qwen2.5-7B-Instruct only                                                                                                | A provider-neutral layer: the LiteLLM gateway issued to finalists (`gpt-5.4-mini`) or RunPod                                                                                                                                                 | The organisers issued finalists a gateway key, and a provider-neutral layer means the AI features do not depend on one GPU endpoint being awake.                               |
| AI features                   | CV extraction and career-goal analysis, plus a local-only career guide                                                         | Connects the career guide to the AI provider and adds a study coach, a one-shot workforce planner and an estimate for user-entered demand assumptions. Each has a local fallback                                                             | Chat answers questions about a plan; the coach gives feedback after studying; the planner suits managers who hold reports, not skill matrices; the estimate tests assumptions. |
| SME workspace                 | Eight-worker gap heatmap, manual entry, slot controls                                                                          | Paste or upload a report; a six-column **redeployment table** (destination, readiness, gaps, courses, why included); inline custom destinations; per-member report upload; budget suggestion. Manual editing and slot caps move into drawers | The heatmap was dense and hard to act on. The table shows what a manager needs for a conversation, and the planner removes most manual entry.                                  |
| Learning progress             | Courses could be marked studied                                                                                                | A **study coach** with practice check-ins and badges, and a per-profile **Track Record** of courses, badges and confirmed skill levels                                                                                                       | The KPIs are projections. A Track Record gives learners an evidence trail of what they did, without ever changing their skills automatically.                                  |
| Interface                     | Orion dark command centre                                                                                                      | A frosted-glass interface, larger text and stronger contrast, a reduce-visual-effects switch, and main views that lead with one decision while secondary tools sit in disclosures                                                            | The finals features had piled panels onto the main views, small text and contrast were audit findings, and slower phones need less blur.                                       |
| SDG labels                    | Sub-target decimals (4.4, 8.2, 8.5, 10.2)                                                                                      | Whole goals in the interface (SDG 4, 8, 9, 10). The sub-target mapping stays in the register and still drives ranking                                                                                                                        | A contextual mapping supports a goal-level claim; the decimals implied precision the project does not measure.                                                                 |
| Personalisation               | Custom career goals, planner inputs and typed workforce destinations on a fixed catalogue of 19 skills, 6 roles and 17 courses | Adds up to eight custom skills outside the catalogue, interests in the user's own words, inline custom destinations in the redeployment table, profile pictures and a confirmed reset to a blank workspace                                   | A finite catalogue cannot cover every worker. Skills it cannot map stay visible as gaps instead of being forced onto unrelated courses.                                        |
| Outputs                       | A localised SME workforce PDF                                                                                                  | Adds a personal learning-pathway **PDF plan** with direct course links, plus a companion video and cover image on every course                                                                                                               | A plan has to leave the app to be used, and direct links remove search steps.                                                                                                  |
| Problem baseline              | Hays training share and a MOSTI figure of about 600,000 workers                                                                | Hays figures kept with their source; the national estimate refreshed to TalentCorp's about 697,000 workers across 22 sectors; the derived "74% untrained" figure dropped                                                                     | The base of the 26% is unclear in the coverage we could reach, and the newer estimate supersedes the older one (see 3).                                                        |
| Quality evidence              | 32 unit tests, 14 production checks                                                                                            | 255 unit tests, 39 production checks, CI on every commit and dated Replit release records                                                                                                                                                    | Each feature needed proof that it and its fallback work.                                                                                                                       |
| Not delivered                 | A "direct drop-in" to HRD Corp claimable programmes and MYFutureJobs                                                           | Not built. The app states that no programme is verified as HRD Corp claimable                                                                                                                                                                | Programme-level claimability and a Malaysian vacancy feed need verified sources, so we say so rather than imply coverage (see 8).                                              |

## 3. Problem context

### 3.1 The problem (≤250 words)

> Rapid AI adoption is changing workplace skills faster than curricula can follow. In Malaysia, 56% of professionals already use AI tools at work but only 26% report any formal training, and 46% avoid AI for lack of understanding or support (Hays Asia Salary Guide 2025, as reported by People Matters). TalentCorp now estimates that about 697,000 workers across 22 sectors will be significantly affected by AI, digitalisation and the green economy within three to five years; our preliminary proposal cited the earlier figure of about 600,000.
>
> Working adults and small and medium enterprises (SMEs) feel this most. Adults cannot leave work for multi-year degrees and often have under four hours a week and no training budget. SMEs, about 97% of Malaysian businesses, rarely have HR analytics to see which employees could move into new roles, so they risk redundancies or costly external hiring. TalentCorp itself notes a significant gap in technology adoption between large companies and SMEs.
>
> The consequences are unequal: wider wage gaps, mid-career workers left behind and lost productivity, with vulnerable workers shut out of high-value work in digital, clean-technology and responsible-AI roles. Without accessible, transparent and affordable reskilling, workforce disruption threatens decent work (SDG 8) and social mobility (SDG 10).

### 3.2 Evidence notes

- **Hays figures:** quoted from [People Matters, 31 July 2025](https://sea.peoplemattersglobal.com/article/strategic-hr/ai-in-malaysian-workplaces-a-strategic-outlook-46436). We did not obtain the Hays report itself, and the coverage does not make clear whether the 26% is a share of all professionals or of AI users. The preliminary proposal's derived figure, "74% of AI-active professionals lack formal training", is therefore withdrawn.
- **National estimate:** [Malay Mail, 1 May 2026](https://www.malaymail.com/news/money/2026/05/01/nearly-700000-malaysian-workers-at-high-risk-from-ai-and-automation-with-adaptability-now-key-to-sustainability-says-talentcorp/218379), quoting TalentCorp's group chief executive. The preliminary proposal's 600,000 workers is the earlier estimate.
- **SME share (97%):** carried over from the preliminary proposal and not re-verified for this revision.

## 4. Users and scenarios

| User                                | Situation                                                                                | What ArcTalent does                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Aina**, a working adult           | Four hours a week, RM0 budget, eight weeks; unsure which skills survive AI change        | Ranks adjacent careers in two AI scenarios, schedules the shared foundation first, records what she studies and keeps her in control of her own skill levels |
| **A learner outside the catalogue** | Has skills or goals the starter catalogue does not list (for example Microsoft Word)     | Accepts custom skills, interests and destinations in their own words and shows unmapped skills as gaps                                                       |
| **An SME manager**                  | Holds a team report, not a skills matrix; has a small training budget and a few openings | Reads the report into a draft team plan, shows each person's destination, readiness and gaps in one table, prices a shared cohort against individual seats   |

## 5. Solution and architecture

### 5.1 The proposed AI solution (≤300 words)

> ArcTalent is an adaptive, explainable reskilling command centre for working adults and SME managers. It compares career routes under two AI-adoption scenarios, moderate and rapid, and plans the first steps inside the learner's real limits, such as four hours a week and RM0.
>
> **For the learner:** a transparent engine scores routes (55% skill coverage, 15% interest, 15% market signal, 15% scenario resilience), finds the shared foundation that stays useful in both futures and schedules free catalogue courses with that foundation first. People can import a CV with consent, add skills and goals in their own words, follow a study coach that offers practice check-ins, and keep a Track Record of what they have actually done. Plans export as PDFs in English, Bahasa Melayu or Simplified Chinese.
>
> **For the SME manager:** a one-shot planner reads a pasted or uploaded team report and drafts members, destinations, openings and a budget. A redeployment table shows each person's destination, readiness, gaps, courses and reason for inclusion. A cost model prices a shared internal cohort against individual commercial seats using HRD Corp's allowable-cost rates, and a budget suggestion gives a starting figure.
>
> **Responsible AI by design:** AI is optional, CVs and reports are sent only after consent, every extracted skill needs a verbatim quote and the learner's confirmation, model output cannot change scores or skills, planner figures are recomputed in code, and every AI feature has a local fallback. Data stays in the browser.
>
> Since the preliminary round we added the gateway provided to finalists alongside RunPod, the study coach, the workforce planner and the Track Record, and simplified the workspace so each screen leads with one decision. The app runs on Replit, the sponsor cloud platform.

### 5.2 Architecture changes

The full inventory of libraries, services, models and datasets is in the [Technical & Tools Declaration](TECHNICAL_DECLARATION.md). In short:

- **Unchanged:** Next.js 16 and React 19 client, Zod validation, the shared deterministic engine (`src/lib/engine.ts`), browser-only storage, no database.
- **New API routes:** `/api/chat` (career chat), `/api/study-progress` (study coach), `/api/workforce-ai` (workforce planner), `POST /api/signals` (demand-assumption estimate) and `/api/pathway-export` (personal PDF plan).
- **New provider layer:** `getAiConfig()` chooses the `AI_*` gateway settings first and RunPod second; every AI route uses the same model client.
- **New local logic:** workforce report parser, per-member report parser, study-coach reviewer, deterministic budget suggestion, snapshot counts and the Track Record store.

### 5.3 Design thinking and deployment (≤200 words)

> **Empathise and define:** unchanged. Our persona remains Aina, with four hours a week, RM0 and eight weeks, plus an SME manager who holds reports rather than spreadsheets. **Ideate:** we kept transferable skill bridges and a shared foundation, then asked what a person needs after the plan: evidence that they are progressing (study coach, practice badges, Track Record) and, for managers, a faster way in (the one-shot planner). **Prototype and test:** design audits of the finals build found small text, weak contrast and too many panels competing on the first screen. We raised text size and contrast, moved secondary tools into disclosures, used whole SDG goals instead of decimal targets, and checked the simplified views at 390 px width. Each release was verified in Replit with unit tests, production API checks and a production build. We have not yet run external user testing; the roadmap names it. **Deployment:** still zero-database and browser-stored, hosted on Replit, with AI through the finalist gateway or RunPod and a local fallback for every feature.

## 6. Requirements and status

### 6.1 Preliminary commitments

| ID  | Commitment in the preliminary proposal                                                      | Status                                                                                 | Where / proof                                                                                              |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P1  | Evidence-grounded skill extraction with a verbatim quote and human confirmation             | Delivered; extended to consented real CVs, optional AI and a local fallback            | `/api/extract`; `tests/cv-evidence.test.ts`, `tests/cv-import.test.ts`                                     |
| P2  | Deterministic, explainable matching: 55% coverage, 15% interest, 15% market, 15% resilience | Delivered, unchanged                                                                   | `src/lib/engine.ts`; `tests/engine.test.ts`                                                                |
| P3  | Shared foundation across moderate and rapid scenarios                                       | Delivered                                                                              | `tests/engine.test.ts`, `tests/impact.test.ts`                                                             |
| P4  | Constraint-aware scheduling inside hours and budget                                         | Delivered; foundation-first guarantee added                                            | `tests/engine.test.ts`, `tests/worker-journey.test.ts`                                                     |
| P5  | SME redeployment: heatmap, slot controls, grouped training, SDG mappings                    | Delivered with changes: heatmap replaced by the redeployment table; slot caps retained | `tests/workforce-plan.test.ts`, `tests/workforce-settings.test.ts`, `tests/workforce-destinations.test.ts` |
| P6  | Dated scenario replanning (evidence lab)                                                    | Delivered                                                                              | `tests/signals.test.ts`, `tests/finals-enhancements.test.ts`                                               |
| P7  | Three-question learning check-in                                                            | Delivered                                                                              | `tests/preferences.test.ts`                                                                                |
| P8  | Zero-database, browser-stored privacy model                                                 | Delivered and extended (consent gates, report redaction, confirmed reset)              | `tests/workspace-defaults.test.ts`, `tests/workforce-ai.test.ts`                                           |
| P9  | Live on Replit with RunPod GPU acceleration                                                 | Delivered; AI also available through the finalist gateway                              | [REPLIT_STATUS.md](REPLIT_STATUS.md)                                                                       |
| P10 | A drop-in connection to HRD Corp claimable programmes and MYFutureJobs                      | **Not delivered** (see 8)                                                              | [SOURCES.md](SOURCES.md)                                                                                   |

### 6.2 Added since the preliminary round

| ID  | Requirement                                                                                                                                                                                                          | Status    | Where / proof                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| A1  | Impact scorecard and a reproducible benchmark of the four Phase 2 targets                                                                                                                                            | Delivered | `src/lib/impact.ts`, `npm run impact`; `tests/impact.test.ts`                                                            |
| A2  | SME cost model with editable HRD Corp and DOSM assumptions and a break-even seat price                                                                                                                               | Delivered | `src/lib/cost-model.ts`; `tests/cost-model.test.ts`                                                                      |
| A3  | Real CV import with explicit processing consent and a control that clears the CV text                                                                                                                                | Delivered | `/api/pdf`, `/api/extract`; `tests/cv-import.test.ts`                                                                    |
| A4  | A personal PDF plan beside the SME PDF; both localised, with direct course links                                                                                                                                     | Delivered | `/api/pathway-export`, `/api/workforce-export`; `tests/workforce-pdf.test.ts`, `tests/integration.mts`                   |
| A5  | Career chat connected to the AI provider with consent, using only the recomputed plan and catalogue links (a local guide already existed)                                                                            | Delivered | `/api/chat`; `tests/career-chat.test.ts`, `tests/career-chat-ai.test.ts`                                                 |
| A6  | Custom skills outside the catalogue (up to eight) and interests in the user's own words; custom goals already existed                                                                                                | Delivered | `tests/custom-skills.test.ts`, `tests/interests.test.ts`                                                                 |
| A7  | Provider-neutral AI configuration with safe host rules                                                                                                                                                               | Delivered | `src/lib/ai-config.ts`; `tests/ai-config.test.ts`, `tests/runpod-config.test.ts`                                         |
| A8  | Simplified workspace with progressive disclosure, and whole-goal SDG labels                                                                                                                                          | Delivered | `tests/sdg-labels.test.ts`, `tests/finals-enhancements.test.ts`                                                          |
| A9  | One-shot workforce planner, redeployment table, inline custom destinations, per-member report upload, budget suggestion                                                                                              | Delivered | `/api/workforce-ai`; `tests/workforce-ai.test.ts`, `tests/workforce-destinations.test.ts`, `tests/custom-inputs.test.ts` |
| A10 | Study coach, practice badges and Track Record, with no automatic skill changes                                                                                                                                       | Delivered | `/api/study-progress`; `tests/study-progress.test.ts`, `tests/track-record.test.ts`                                      |
| A11 | Course cover images and one companion video per course, outside planned hours                                                                                                                                        | Delivered | `tests/course-links.test.ts`; [SOURCES.md](SOURCES.md)                                                                   |
| A12 | Tabbed Settings page, profile pictures and animal avatars, confirmed reset to a blank workspace                                                                                                                      | Delivered | `tests/settings.test.ts`, `tests/profile-pictures.test.ts`, `tests/workspace-defaults.test.ts`                           |
| A13 | Custom demand snapshots with modelled record counts and placeholder scenario items (labelled as simulation, no source URL), shown under the "user-entered planning assumptions, not verified market evidence" notice | Delivered | `POST /api/signals`; `tests/custom-inputs.test.ts`                                                                       |

### 6.3 Non-functional requirements

- **Privacy:** no accounts or database; data stays in the browser; CVs and reports need consent before they reach any provider; e-mail addresses, phone numbers and MyKad numbers are removed from reports first; **Reset to Default** clears local data.
- **Explainability:** the score formula, the shared foundation and each gap are visible in the interface ("Why this route?", "What would raise this score?").
- **Honest labelling:** simulations, user-entered assumptions and estimates carry on-screen disclaimers; SDG mappings are described as contextual.
- **Accessibility and responsiveness:** tabs and disclosures work from the keyboard; larger text, reduced motion and reduced visual effects are available; the simplified views were checked at 390 px width without horizontal page overflow.
- **Languages:** English, Bahasa Melayu and Simplified Chinese. Tests fail if a message is missing in any of the three or its placeholders differ (`tests/i18n.test.ts`, `tests/workforce-ai.test.ts`).
- **Security and reliability:** Zod validation of requests and model output, bounded request bodies, origin checks on the chat, study and planner routes, eight AI calls a minute on the extraction, goal, chat, study and planner routes, no secrets in the repository, and a local fallback for every AI feature.

### 6.4 Guardrails: what the product will not do

- Change a learner's skills automatically because a course is marked studied or a badge is earned. Skill levels change only after the learner confirms.
- Let workforce-planner text carry links, HTML or Markdown, or take course links from a model. Course links come from the catalogue.
- Present scores or scenarios as forecasts, hiring probabilities or job guarantees.
- Call a course HRD Corp claimable without programme-level evidence.
- Treat practice badges or the Track Record as certification.
- Store CVs, team reports or practice notes on the server.

## 7. Impact framework

### 7.1 Target SDG sub-targets

The interface shows whole goals. Ranking uses these sub-target mappings, all described as contextual rather than measured ([SOURCES.md](SOURCES.md)).

| Goal                      | Sub-target in the code                                                                    | What is mapped                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **SDG 8** (primary track) | 8.2, higher productivity through diversification, technological upgrading and innovation  | Four of six destination roles and two skills (Process improvement, Supply chain)                    |
| SDG 4                     | 4.4, relevant skills for employment, and 4.3, access to technical and vocational learning | Fourteen skills and the Training & Development role (4.4); Learning design (4.3)                    |
| SDG 9                     | 9.4, resource-efficient and cleaner industrial processes                                  | The Sustainability Specialist role and Sustainability literacy                                      |
| SDG 10                    | 10.3, equal opportunity and reduced inequalities of outcome                               | Responsible AI skill, and the fairness check that shows names and job titles do not affect matching |

Targets 8.5 and 10.2, named in the preliminary proposal, remain framing only: no role or skill is mapped to them.

### 7.2 Baseline, KPIs and results

| KPI (preliminary)                              | Preliminary target                     | Result in the final benchmark ([IMPACT.md](IMPACT.md))                                                                                              | How to read it                                                                                                                                                                                             |
| ---------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill-gap pivot-distance reduction             | At least 40% within eight weeks at RM0 | Average 79% (moderate) and 76% (rapid); 7 of 8 synthetic workers reach 40% (the lowest, 33%)                                                        | A projection that assumes every planned course lifts its skills to level 2 of 3. It is not an observed outcome.                                                                                            |
| SME training cost reduction                    | At least 35%                           | 71% to 88% across both scenarios and two seat prices (RM125 and RM250 per learner-hour). Break-even seat price: RM46.51 (moderate), RM35.22 (rapid) | The cohort plan costs every shared hour with an internal trainer, a deliberate upper bound. Seat prices are HRD Corp maximum claimable amounts, not quotes. Free courses may lack certificates or support. |
| Shared foundation in weeks 1–4                 | 100%                                   | Average 92%; 5 of 8 workers reach 100%; 3 finish the whole foundation early; none fall below                                                        | A foundation shorter than four weeks cannot fill weeks 1–4, so those workers are reported separately instead of being counted as 100%.                                                                     |
| Human-confirmed skill adoption                 | 100%                                   | Enforced in code: extracted skills change a profile only after the user adds and saves them; planner results apply only on a click                  | A design guarantee, not a measured rate.                                                                                                                                                                   |
| Skill evidence verification                    | 100% verbatim quotes                   | Enforced in code: a quote is kept only if it appears word for word in the CV                                                                        | A design guarantee.                                                                                                                                                                                        |
| _New:_ Track Record per learner and per cohort | None stated                            | Hours studied, courses completed, verified badges, skills levelled up and gap distance closed, summed per profile and for the SME cohort            | Browser-local and self-reported. It records activity, not employment or wage outcomes.                                                                                                                     |

The benchmark covers eight fictional workers and a fictional company. **No pilot with real learners or SMEs has been run**, and the preliminary proposal's reference to pilot workers should be read as synthetic workers only.

## 8. Scope decisions: what we did not build

- **HRD Corp claimable programmes:** no programme is verified as claimable, so the HRD Corp filter stays empty and the cost model uses maximum claimable rates as a reference.
- **Malaysian vacancy feed (MYFutureJobs):** not connected. The live job sample is Europe-focused and labelled as such.
- **Accounts, server-side storage and an employer permission model:** not built. They are needed before any real employee data is stored, and the privacy model deliberately avoids them for now.
- **OCR for scanned CVs:** not built; scanned PDFs cannot be read.
- **Outcome measurement:** not built. Dashboards report planned activity, not jobs saved, wages or SDG outcomes.

## 9. Risks and mitigations

| Risk                                                                | Mitigation                                                                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Model output is wrong, slow or unavailable                          | Optional AI; verbatim-quote and schema checks; planner preview before applying; local fallback for every feature             |
| Estimates read as facts (demand counts, budget suggestion, savings) | On-screen disclaimers; figures recomputed in code; assumptions editable; this document and the declaration state their basis |
| Cost savings overstated                                             | Break-even seat price shown; trainer costed for every shared hour; seat prices labelled as maximum claimable amounts         |
| Sensitive data sent to a provider                                   | Consent gates, report redaction, no server storage, practice-note warning                                                    |
| Evidence is not Malaysian                                           | Labelled Europe-focused job sample; roadmap item to verify local sources                                                     |
| Learners over-trust badges                                          | Badges are described as self-study milestones, never certification; skills change only on the learner's confirmation         |

## 10. Next steps

1. Interview Malaysian workers and SME managers, and test the planner with consented, redacted real reports.
2. Verify HRD Corp claimable programmes and add a Malaysian vacancy source.
3. Replace course-level coverage assumptions with explicit assessments.
4. Add accounts and an employer permission model before storing any real employee data.
5. Run a small pilot with an SME and measure outcomes against the targets in 7.2.

## 11. Verification and evidence

- **Tests:** 255 unit tests pass at `6569bfb` (run on 1 November 2026). The GitHub Actions workflow `Verify ArcTalent` (format check, typecheck, unit tests, production build, production API checks) passed for that commit.
- **Releases:** each release is imported into Replit and checked (file hashes, locked install, tests, build, production API checks) before publishing; see [REPLIT_STATUS.md](REPLIT_STATUS.md).
- **Benchmark:** `npm run impact` reproduces [IMPACT.md](IMPACT.md); it matched the committed file on 1 November 2026.
- **Sources:** [SOURCES.md](SOURCES.md) lists every course, video, occupation and cost assumption with check dates.
- **Declaration:** [TECHNICAL_DECLARATION.md](TECHNICAL_DECLARATION.md) lists every library, service, model, dataset and AI tool, with corrections to the preliminary declaration.

## 12. IP and originality

Unchanged from the preliminary proposal. Third-party code, datasets, models and fonts, with their licences, are listed in the [Technical & Tools Declaration](TECHNICAL_DECLARATION.md). Course content, videos and occupation data stay with their owners and are linked, not copied.
