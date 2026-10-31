# Technical & Tools Declaration — final round

**Add-on to the preliminary declaration** ([`submission/preliminary/SDC2026_XenoForce_TechDeclaration.pdf`](../submission/preliminary/SDC2026_XenoForce_TechDeclaration.pdf), 25 October 2026). The sections follow the organiser's template (1–8) so each entry can be copied into the official form. Entries marked **NEW** were added after the preliminary round; entries marked **CORRECTED** fix something the preliminary declaration got wrong. Unmarked entries are unchanged.

Describes the application at source commit `ce314b7` (repository `main`, 1 November 2026). Which release is live, and how it was verified, is recorded in [REPLIT_STATUS.md](REPLIT_STATUS.md). Answers with a word limit keep the preliminary template's limit.

## 1. Team & project overview

| Field                        | Entry                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Team name                    | Xeno Force                                                                                                                                                |
| Project / solution name      | ArcTalent                                                                                                                                                 |
| Name (leader)                | Emmanuel Heng Zi Teng                                                                                                                                     |
| Email & phone (leader)       | Enuelhzt1524@gmail.com · 010-271-6363                                                                                                                     |
| University affiliation(s)    | Universiti Malaya (leader). Team: Universiti Malaya, Universiti Teknologi Malaysia, Management and Science University, Swinburne University of Technology |
| Live prototype URL           | https://arc-talent--emmanuelheng.replit.app/                                                                                                              |
| Code repository URL (public) | https://github.com/MantouOP/ArcTalent (public, Apache-2.0)                                                                                                |
| Replit team project          | https://replit.com/@EmmanuelHeng/ArcTalent                                                                                                                |

## 2. Architecture & technology stack

### 2.1 System architecture overview (≤200 words)

> ArcTalent is a privacy-first web application hosted on Replit. **Client:** Next.js 16 and React 19 render the interface, the SVG career map and the SME workspace in English, Bahasa Melayu and Simplified Chinese. Profiles, plans, progress and the Track Record are kept in browser storage only. **Server:** Next.js route handlers run the deterministic matching engine and course scheduler, read consented PDFs, fetch public job and research signals and render PDF learning plans. **AI tier:** six features call one provider layer: CV skill extraction, career-goal analysis, career chat, the study coach, the one-shot workforce planner and an estimate for user-entered demand assumptions. When configured, the hackathon LiteLLM gateway (model `gpt-5.4-mini`) serves them; otherwise a RunPod-hosted Qwen2.5-7B-Instruct endpoint does. Zod validates API requests and every model output, and extracted skills must quote the source text word for word. Each AI feature has a local fallback, so scoring, scheduling and costing work with no provider at all. **Delivery:** GitHub Actions checks every commit, and each release is checked in Replit and again on the live site.

### 2.2 Languages, frameworks & libraries

Versions and licences were read from the installed packages on 1 November 2026; `package-lock.json` pins them.

| Name & version                                                     | Purpose in project                                                                  | Licence    | Status                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| TypeScript 7.0.2                                                   | Strongly typed language across client and server                                    | Apache-2.0 |                                                                        |
| Next.js 16.4.2                                                     | Full-stack framework, App Router and API route handlers                             | MIT        |                                                                        |
| React and React DOM 19.3.1                                         | Interface rendering and state                                                       | MIT        |                                                                        |
| Zod 4.6.7                                                          | Runtime validation of requests, model output and stored data                        | MIT        |                                                                        |
| Lucide React 1.61.0                                                | Icons                                                                               | ISC        |                                                                        |
| pdf-parse 2.4.5                                                    | Server-side text extraction from consented, text-based PDFs                         | Apache-2.0 | **CORRECTED** (preliminary said MIT)                                   |
| PDFKit 0.20.2                                                      | Server-side generation of personal and SME learning-plan PDFs                       | MIT        | **NEW** to the declaration (already in the preliminary `package.json`) |
| Vercel AI SDK `ai` 7.0.148                                         | Structured, schema-constrained model calls                                          | Apache-2.0 |                                                                        |
| `@ai-sdk/openai-compatible` 3.0.75                                 | Adapter for any HTTPS OpenAI-compatible endpoint (the gateway and RunPod)           | Apache-2.0 |                                                                        |
| tsx 4.23.15                                                        | Runs the unit tests, integration checks and the impact benchmark (development only) | MIT        | **NEW** to the declaration                                             |
| Prettier 3.9.10                                                    | Formatting check in CI (development only)                                           | MIT        | **NEW** to the declaration                                             |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/pdfkit` | Type definitions (development only)                                                 | MIT        | **NEW** to the declaration                                             |

**Fonts and bundled assets**

| Asset                                 | Use                                                                                                                                | Licence              | Status                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------- |
| Noto Sans SC Regular (`assets/fonts`) | Embedded by the server-side PDF renderer for Chinese text; redistributed unchanged with `OFL.txt`; never downloaded by the website | SIL OFL 1.1          | **NEW** to the declaration (used since 24 October) |
| Inter and Outfit (Google Fonts)       | Interface typefaces, requested by the visitor's browser from `fonts.googleapis.com` at run time                                    | SIL OFL 1.1          | **NEW** to the declaration                         |
| 18 SVG avatars and the app icon       | Profile pictures and favicon (`public/`); simple SVGs created in this project, with no third-party artwork                         | Apache-2.0 (project) | **NEW**                                            |

**Removed:** a Unicorn Studio background (`unicornstudio-react` 2.4.0) was trialled on 23 October and removed the same day (commit `1fc5845`). It is not in the build and has never been in the preliminary or final dependency list.

## 3. APIs & cloud services

### 3.1 External APIs

No keys or secrets appear in this document.

| API & provider                                                                                     | Purpose in project                                                                                                                 | Access tier                                                              | Status                                                                        |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Hackathon LiteLLM gateway, OpenAI-compatible (`https://litellm.rapidscreen.io/v1`), `gpt-5.4-mini` | Serves the AI features when its key is set                                                                                         | Key provided to finalists by the organisers; kept only in Replit Secrets | **NEW**                                                                       |
| RunPod Serverless vLLM endpoint (`api.runpod.ai/v2/`), Qwen2.5-7B-Instruct                         | Serves the same features when the gateway is not configured                                                                        | Sponsor-provided credits                                                 | Unchanged; now an optional alternative provider                               |
| Arbeitnow Job Board API                                                                            | Public job-posting sample used to weight skill mentions                                                                            | Free, public                                                             | **CHANGED**: keeps skill-matched postings (up to 95) instead of the first 100 |
| arXiv cs.AI RSS feed                                                                               | Research-paper context for the same skills                                                                                         | Free, open access                                                        | **CHANGED**: keeps skill-relevant items (up to 28) instead of the first 12    |
| YouTube (`i.ytimg.com` covers, `youtube.com` links)                                                | Cover image and link for the optional companion video on each of the 17 course cards                                               | Free; the visitor's browser makes the requests                           | **NEW**                                                                       |
| Course providers: OpenLearn (`open.edu`), OpenClassrooms, Microsoft Learn, MDN, SQLBolt            | Direct course links; each course card shows the page's own share image, loaded by the visitor's browser from the provider's server | Free, public                                                             | Links unchanged; cover images **NEW** (31 October)                            |
| Google Fonts (`fonts.googleapis.com`)                                                              | Inter and Outfit typefaces                                                                                                         | Free                                                                     | **NEW**                                                                       |

The UN SDG goal pages (`sdgs.un.org`) are linked, not called. The HRD Corp, DOSM and Department of Labour documents listed in 4.2 were read by the team to set cost defaults; the app does not call them.

### 3.2 Cloud platforms & deployment

| Service & provider               | Purpose in project                                                                                                                                                                                                                               | Plan / region                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Replit                           | Hosts the live Next.js application (Autoscale deployment, Replit Secrets for AI settings). Each release folder is checked against its Git commit (file hashes), and the live site is re-checked with the production API checks after publishing. | Sponsor-provided; Autoscale, Asia (as in preliminary)       |
| RunPod                           | Optional GPU container serving Qwen2.5-7B-Instruct through an OpenAI-compatible API                                                                                                                                                              | Sponsor-provided; serverless endpoint                       |
| GitHub                           | Source control and the public repository. **NEW detail:** the workflow `Verify ArcTalent` runs on every push to `main` and every pull request: format check, typecheck, unit tests, production build and production API checks.                  | Free tier. Uses `actions/checkout` and `actions/setup-node` |
| Browser storage (`localStorage`) | All profile, plan, team, progress, Track Record and picture data; no server-side persistence                                                                                                                                                     | Client device                                               |

## 4. AI tools, models & datasets

### 4.1 AI models used in the solution

| Model & version                                    | Source / provider                                                                                                                           | Usage                                                                                                   | Licence / terms                                                       | Status                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| `gpt-5.4-mini`                                     | Served through the hackathon LiteLLM gateway (model name as exposed by the gateway)                                                         | Pre-trained, used as supplied for structured JSON output through the AI SDK; no fine-tuning by the team | Gateway and model-provider terms of use; weights not held by the team | **NEW**                         |
| Qwen2.5-7B-Instruct                                | Alibaba Cloud (Hugging Face), hosted on RunPod                                                                                              | Pre-trained, used as supplied; optional alternative provider                                            | Apache-2.0                                                            | Unchanged                       |
| ArcTalent deterministic engine and local fallbacks | Self-developed in TypeScript (`src/lib/engine.ts`, the local report, member-report and study-coach parsers, `computeDynamicSnapshotCounts`) | Rule-based scoring, scheduling, alias matching and parsing; no training                                 | Apache-2.0                                                            | Extended with new local parsers |

**Where AI is used, and what each feature sends**

| Feature (route)                                          | Sent to the provider                                                                                                        | Checks on the answer                                                                                                                                                                                                | Local fallback                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| CV skill extraction (`/api/extract`)                     | CV text the user reviewed and consented to send                                                                             | Zod schema; every skill must quote the CV word for word; the user confirms each skill                                                                                                                               | Local alias matching            |
| Career-goal analysis (`/api/career-goal`)                | The goal title and description the user typed                                                                               | Zod schema; suggested skill targets are editable; the model never supplies course URLs                                                                                                                              | Manual skill selection          |
| Career chat (`/api/chat`)                                | The question and a plan the server recomputes; no names, photos, CV text or employee records                                | Course links come only from the catalogue                                                                                                                                                                           | Local planning guide            |
| Study coach and practice check (`/api/study-progress`)   | The course title and the learner's free-text practice note                                                                  | Skill levels change only after the learner confirms; a practice badge is a self-study milestone, not a certificate                                                                                                  | Local reviewer                  |
| One-shot workforce planner (`/api/workforce-ai`)         | The pasted or uploaded team report, after e-mail addresses, phone numbers and MyKad numbers are removed and names shortened | Fixed structured fields; text cannot contain links or markup; prices, hours and savings are recomputed in code; the manager previews before applying                                                                | Local report parser             |
| Demand-assumption estimate (`POST /api/signals`) **NEW** | The label, date, scenario, note and 0–100 demand value per skill the user typed                                             | Zod schema and a 10 KB size cap; the counts are model estimates for the user's own assumptions, not retrieved records, and the snapshot lists placeholder scenario items with no source URL, labelled as simulation | Deterministic count calculation |

### 4.2 Datasets

No dataset below contains personal data. Data typed or uploaded by users stays with them (see 6.1).

| Dataset                                                                           | Source                                                                                                                                                  | Type                    | Licence / terms            | Status                                                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| O*NET occupation summaries (6 destination roles)                                  | O*NET OnLine, onetcenter.org                                                                                                                            | Public                  | CC BY 4.0                  | Unchanged                                                                                |
| Public course catalogue: 17 courses                                               | OpenLearn (8), OpenClassrooms (4), Microsoft Learn (3), SQLBolt (1), MDN (1). Links only; no course content copied. Register: [SOURCES.md](SOURCES.md)  | Public, curated by team | Each provider's own terms  | **CORRECTED** (preliminary named Coursera, edX, Kaggle, freeCodeCamp and UN SDG Academy) |
| Companion videos: 17 YouTube links                                                | 12 channels; titles and channels confirmed through YouTube oEmbed on 30 October. Register: [SOURCES.md](SOURCES.md)                                     | Public                  | YouTube terms; links only  | **NEW**                                                                                  |
| HRD Corp Allowable Cost Matrix, November 2025 edition                             | hrdcorp.gov.my. E-learning seat RM125 per learner-hour, classroom alternative RM250, internal trainer RM200 per course-hour (prorated below 5 learners) | Public document         | Public document            | **NEW**: SME cost model defaults, editable in the app                                    |
| DOSM Salaries & Wages Survey Report 2025; Employment (Amendment) Act 2022 summary | dosm.gov.my; Department of Labour Peninsular Malaysia. Median RM2,940 a month over 195 hours gives RM15.08 per paid study hour                          | Public documents        | Public documents           | **NEW**                                                                                  |
| Synthetic worker cohort: 8 fictional profiles and 2 dated demand snapshots        | `src/lib/catalogue.ts`                                                                                                                                  | Synthetic               | Apache-2.0 (project)       | Unchanged                                                                                |
| Synthetic CV (`public/synthetic-cv.pdf` and `.txt`)                               | Project-made                                                                                                                                            | Synthetic               | Apache-2.0 (project)       | Unchanged                                                                                |
| Two fictional workforce reports                                                   | `src/lib/workforce-ai.ts` (one-click planner samples)                                                                                                   | Synthetic               | Apache-2.0 (project)       | **NEW**                                                                                  |
| Arbeitnow job postings                                                            | arbeitnow.com/api/job-board-api; Europe-focused sample                                                                                                  | Public                  | Arbeitnow public API terms | Unchanged (selection rule **CHANGED**)                                                   |
| arXiv cs.AI feed                                                                  | rss.arxiv.org/rss/cs.AI                                                                                                                                 | Public                  | arXiv terms                | Unchanged (selection rule **CHANGED**)                                                   |

### 4.3 AI-assisted development tools

Did the team use generative-AI tools to help create code, design, text or other project material? **Yes.**

| Tool & version                                                                                                              | Used for                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Extent   | Status                         |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| OpenAI Codex / ChatGPT                                                                                                      | Scaffolding the Next.js architecture, matching logic, React components and documentation (22 October; five commits authored "Codex (AI-assisted)")                                                                                                                                                                                                                                                                                                                                 | Major    | As declared in the preliminary |
| Google Antigravity / Claude                                                                                                 | Pair-programming, debugging, running tests and refining submission material                                                                                                                                                                                                                                                                                                                                                                                                        | Moderate | As declared in the preliminary |
| GitHub Copilot                                                                                                              | Inline completion, type annotations and unit-test drafts                                                                                                                                                                                                                                                                                                                                                                                                                           | Moderate | As declared in the preliminary |
| **Claude Code (Anthropic), Claude Opus 5.5 and Claude Sonnet 5.5**                                                          | Finals work from 29 October, identified by `Co-Authored-By` trailers: impact scorecard, foundation-first scheduling, SME cost model, companion YouTube videos, tabbed Settings, the frosted-glass interface, text-size and contrast fixes, interests in the user's own words, the AI gateway, custom skills, course covers, the simplified workspace with the one-shot workforce planner, redeployment table and Track Record, plus tests, release verification and documentation. | Major    | **NEW**                        |
| **Taste Skill and Impeccable** (open-source skill packs, github.com/Leonxlnx/taste-skill and github.com/pbakaus/impeccable) | Design and review guidance loaded into Claude Code for UI audits (contrast, text size, hierarchy). No code or assets from them are in the repository.                                                                                                                                                                                                                                                                                                                              | Minor    | **NEW**                        |
| **Replit Agent** (through the Replit connector)                                                                             | Importing release commits into the Replit project, running file-hash, install, test and build checks, switching the deployment target (`artifact.toml`, `.replitignore`) and, for the latest release, a read-only file-hash comparison. It wrote no application source.                                                                                                                                                                                                            | Minor    | **NEW**                        |

Commit trailers record tool use only for Claude Code. The first three rows are carried over from the preliminary declaration.

#### How the team reviewed, tested and took responsibility for AI-generated output (≤100 words)

> AI output was treated as a draft. The team leader specified the finals features and approved each Claude Code commit and each release, and every release was checked in Replit and on the live site. Changes must pass 255 unit tests, the typecheck, Prettier and a production build, and CI also runs 39 production API checks. Tests cover English, Bahasa Melayu and Simplified Chinese parity, model-schema rules and every fallback path. In the workforce planner, prices, hours and savings are recomputed in code and course links come only from the catalogue. The team owns the code and these declarations.

## 5. Sponsor-provided resources

Did the project use an official SDC sponsor-provided resource? **Yes.**

| Sponsor                        | Resource                                                       | How it was used                                                                                                                                                   | Status    |
| ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Replit                         | Cloud workspace, Autoscale publishing and Secrets              | Hosts the live prototype and serves every API route. Releases are checked in Replit and on the live site (see [REPLIT_STATUS.md](REPLIT_STATUS.md)).              | Unchanged |
| RunPod                         | GPU credits and a serverless vLLM endpoint                     | Serves Qwen2.5-7B-Instruct as an optional alternative AI provider; live career chat through it was verified on 30 October.                                        | Unchanged |
| SDC Hackathon organisers       | Finalist API key for the LiteLLM gateway, model `gpt-5.4-mini` | Serves CV extraction, career-goal analysis, career chat and the workforce planner on the live site (verified 31 October). The key is held only in Replit Secrets. | **NEW**   |
| Aiversecity (Domain 1 sponsor) | Domain 1 problem statement, workforce brief and rubric         | Defined the challenge scope: dynamic AI adoption, a transferable-skills taxonomy and alignment with SDG 4, 8 and 10.                                              | Unchanged |

#### Was the sponsor resource essential, or could it be replaced? (≤100 words)

> Replit hosts the live demo, but any Node 22 host can run the app with `npm run build` and `npm start`. The AI provider is a configuration choice: the hackathon gateway, RunPod or any HTTPS OpenAI-compatible endpoint, set through environment variables. With no provider every AI feature falls back to local logic, and the matching engine, scheduler, cost model, PDF plans and Track Record need no external service. Sponsor resources speed up and enrich the prototype, but they are not a single point of failure.

## 6. Security, privacy & responsible use

### 6.1 Data handling & privacy (≤150 words)

> ArcTalent has no accounts and no database. Profiles, plans, team plans, progress, the Track Record and profile pictures stay in the visitor's browser storage; **Reset to Default** clears them. CV text, workforce reports, goals and practice notes go to an AI provider only when the user turns AI on, and CVs and reports also need an explicit consent tick. Reports first lose e-mail addresses, phone numbers and MyKad numbers, and names are shortened. The custom demand snapshot sends only the assumptions the user typed, with no separate consent step. ArcTalent's server saves none of this text; the provider's own retention terms apply. API keys live in Replit Secrets, never in the repository. Inputs are validated with Zod and size-capped, and five AI routes allow eight calls a minute. Visitors' browsers also load fonts from Google and cover images from course providers and YouTube, which can see their IP address.

### 6.2 Known limitations & risks (≤150 words)

> **Model errors:** extracted skills must quote the CV and the user confirms each one; planner output is previewed before it is applied and its figures are recomputed in code. **Estimates:** the demand-assumption counts, the placeholder scenario records listed with them and the budget suggestion are planning aids built on assumptions, not retrieved records or price quotes. **Evidence:** the job feed is a Europe-focused sample, no programme is verified as HRD Corp claimable, and course-to-skill levels are assumptions. **Outcomes:** badges and the Track Record are self-reported; nothing measures jobs, wages or SDG results. **Providers:** AI routes are rate-limited (the demand-estimate route is only size-capped) and every feature has a local fallback, but model answers can still be wrong or slow. **Documents:** there is no OCR, so scanned PDFs cannot be read. **Privacy:** third-party fonts and images expose visitors' IP addresses.

## 7. Compliance & readiness checklist

- [x] All APIs, cloud services, AI tools, models and datasets used in the project are declared in this document.
- [x] All third-party code, datasets and models are used under their licences, with attribution where required (Noto Sans SC ships with its `OFL.txt`).
- [x] No API keys, passwords or other credentials are in the code repository, the prototype or this document. The current tree and all 133 commits then on any branch were scanned for key patterns on 1 November 2026 with no matches, and the only tracked environment file is `.env.example`.
- [x] Use of generative-AI tools for development is disclosed in 4.3 and was reviewed by the team.
- [x] Use of official SDC sponsor resources is declared in section 5.
- [x] The prototype is reachable through the links in section 1: the repository is public, and the live URL answered `/api/health` without signing in on 1 November 2026.
- [x] Answers with a word limit stay within the preliminary template's limits (counted on 1 November 2026).

## 8. Declaration

By submitting this document, the team leader confirms that the information provided is complete and accurate to the best of the team's knowledge, and that every API, cloud service, AI tool, dataset, model and sponsor resource used in the project has been declared.

Team leader: Emmanuel Heng Zi Teng. The signature and date are completed in the organiser's official template.

## Appendix A — What changed since the preliminary declaration

- **AI provider:** the hackathon LiteLLM gateway (`gpt-5.4-mini`) joins RunPod; complete `AI_*` settings take precedence (`src/lib/ai-config.ts`).
- **AI features:** from CV extraction and career-goal analysis to six, adding career chat, the study coach, the workforce planner and the demand-assumption estimate. New routes: `/api/chat`, `/api/study-progress`, `/api/workforce-ai` and `POST /api/signals`.
- **Local logic added:** workforce report parser, per-member report parser (reads `.docx` in the browser and PDFs through `/api/pdf`), study-coach reviewer, deterministic budget suggestion and snapshot counts.
- **New data and sources:** HRD Corp cost matrix, DOSM wages, 17 companion videos, course cover images, two fictional workforce reports.
- **Privacy:** real CVs are accepted after explicit consent (since 29 October); reports are redacted before AI use; new browser-stored items (Track Record, progress, pictures).
- **Quality:** from 32 unit tests and 14 production checks to 255 and 39, with a CI workflow on every commit.
- **Development tools:** Claude Code with two skill packs and the Replit Agent added to 4.3.

## Appendix B — Corrections to the preliminary declaration

1. `pdf-parse` is Apache-2.0 (the preliminary said MIT).
2. PDFKit, the bundled Noto Sans SC font, Google Fonts (Inter and Outfit) and the development tools were not listed. They are now.
3. The course catalogue providers are OpenLearn, OpenClassrooms, Microsoft Learn, SQLBolt and MDN. The preliminary named Coursera, edX, Kaggle, freeCodeCamp and UN SDG Academy; those names appear only as companion-video channels (freeCodeCamp.org, Coursera) or not at all.
4. The catalogue has 19 skills, and already had 19 at the preliminary commit `8adb48a`; the preliminary text said 16.
5. The preliminary said CV extraction required a synthetic-data checkpoint. Since 29 October the app accepts a real CV after an explicit processing consent (commit `22a53ee`); section 6.1 describes the current behaviour.
6. The preliminary's "zero-data-retention inference" wording is withdrawn. ArcTalent's server does not save CV text, and the AI provider's own retention terms apply.

## Appendix C — Evidence of human review and decisions

Git history on `main` at `ce314b7` has 107 commits: MantouOP 87 (the team leader's repository account), Dihom Chan Dyi Hong 8, Emmanuel Heng 7 (all pull-request merges) and "Codex (AI-assisted)" 5. Roles for all four members are in the [README](../README.md#team--xeno-force).

| Date           | Who                 | Decision or review                                                                                                                                                                                                | Evidence                                                                                  |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 29 Oct         | Emmanuel Heng       | Reviewed and merged pull requests 1–7 (impact scorecard, foundation-first scheduling, SME cost model, accuracy fixes, YouTube videos and two release records)                                                     | Merge commits `ae42fdb`, `fbe7c54`, `0a23e06`, `95e676f`, `f066963`, `07ccfcf`, `cf0fae3` |
| 30 Oct         | Dihom Chan Dyi Hong | Built the finals-rubric features; merged, then corrected for accuracy after review                                                                                                                                | `ee0d3a6`, `9956c95`, `1f712b9`                                                           |
| 30 Oct         | Team leader         | Kept the existing look and fixed problems (text size, contrast) rather than redesigning                                                                                                                           | `30bd9c6`                                                                                 |
| 31 Oct         | Team leader         | Added the hackathon gateway and chose to show the model name, not a provider label                                                                                                                                | `e5929fe`, `054ca85`                                                                      |
| 31 Oct         | Team leader         | Allowed skills outside the catalogue (for example Microsoft Word)                                                                                                                                                 | `d9c4d2a`                                                                                 |
| 31 Oct         | Team leader         | Specified the simplified workspace, whole-number SDG labels, the one-shot planner, the redeployment table and the Track Record, with rules that skills never change automatically and model text carries no links | `1965f98`, `0cb3c41`                                                                      |
| 31 Oct         | Team leader         | Chose to leave old release installs out of the Replit image rather than delete them (8 GiB limit)                                                                                                                 | [REPLIT_STATUS.md](REPLIT_STATUS.md)                                                      |
| 31 Oct – 1 Nov | Dihom Chan Dyi Hong | Liquid Glass interface polish, budget suggestion, per-member report upload, the custom demand snapshot and the introduction-page pathway cards                                                                    | `1a78e70`, `b8e7386`, `bf62b95`, `33579b1`, `04eeae4`, `92a1457`, `6569bfb`               |

## Appendix D — Additional limitations to declare

- No validated prediction of AI adoption, employment success, aptitude or job loss; scores and scenarios are planning aids.
- Occupational context is US-based (O\*NET) and the live job sample is Europe-focused. Malaysian applicability needs validation with local employers and vacancies.
- No programme is verified as HRD Corp claimable. HRD Corp amounts in the cost model are maximum claimable rates, not quotes.
- The budget suggestion's materials-and-buffer allowance and its fallback rates are team planning assumptions, not sourced prices.
- A custom demand snapshot shows modelled "job records" and "research records" counts and lists placeholder "scenario research signal" items. They are labelled as simulation, carry no source URL and are not retrieved records.
- No measured employment, productivity or SDG outcome; the dashboards report planned activity. No pilot with real learners or SMEs has been run.
- CV import reads text-based files only (no OCR). There are no production accounts, server persistence or employer permission model.
