# ArcTalent

> **Skills that travel with you.** An adaptive, explainable reskilling command center that helps working adults and SME managers navigate evolving labour markets under moderate and rapid AI adoption scenarios.

### 🌟 Quick Links:

👉 **[🎥 Watch YouTube Demo Video](https://youtu.be/PYpaD5IAYpE)** · **[📊 Open Canva Pitch Deck Slides](https://canva.link/upnutijay2qn7vn)** · **[🚀 Open Live App Demo](https://arc-talent--emmanuelheng.replit.app/)** · **[📁 View Official Submission PDFs](submission/)**

---

## Team Information

| Field                       | Details                                                                                                                                                  |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Team Name**               | **Xeno Force**                                                                                                                                           |
| **Team Domain**             | **Domain 1 — The Aiversecity Future-Ready Workforce Domain**                                                                                             |
| **SDG Track (1–17)**        | **SDG 8: Decent Work and Economic Growth** _(also addressing SDG 4: Quality Education & SDG 10: Reduced Inequalities)_                                   |
| **Team Leader**             | **Emmanuel Heng Zi Teng**                                                                                                                                |
| **Email & Phone**           | **Enuelhzt1524@gmail.com** · **010-271-6363**                                                                                                            |
| **University Affiliations** | **Universiti Malaya (UM)**, **Universiti Teknologi Malaysia (UTM)**, **Management and Science University (MSU)**, **Swinburne University of Technology** |
| **Number of Members**       | **4**                                                                                                                                                    |

## Links

| Resource                          | Link                                                                                                                   |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **🎨 Pitch Deck Slides (Canva)**  | **[👉 View Presentation Slides (Canva)](https://canva.link/upnutijay2qn7vn)**                                          |
| **🚀 Live Prototype Demo**        | [https://arc-talent--emmanuelheng.replit.app/](https://arc-talent--emmanuelheng.replit.app/)                           |
| **💻 GitHub Repository**          | [https://github.com/MantouOP/ArcTalent](https://github.com/MantouOP/ArcTalent)                                         |
| **☁️ Replit Team Project**        | [https://replit.com/@EmmanuelHeng/ArcTalent](https://replit.com/@EmmanuelHeng/ArcTalent)                               |
| **🌿 Replit Runtime Branch**      | [https://github.com/MantouOP/ArcTalent/tree/replit-runtime](https://github.com/MantouOP/ArcTalent/tree/replit-runtime) |
| **⚡ RunPod Serverless Endpoint** | `https://api.runpod.ai/v2/` _(Qwen/Qwen2.5-7B-Instruct vLLM)_                                                          |
| **🎥 Demo Walkthrough Video**     | **[👉 Watch on YouTube (5–7 min)](https://youtu.be/PYpaD5IAYpE)**                                                      |

---

## Official Submission Documents

All required official submission deliverables are accessible below and archived in the [`submission/`](submission/) directory:

- 🎥 **Pitching & Demo Video**: **[Watch on YouTube](https://youtu.be/PYpaD5IAYpE)**
- 📊 **Pitch Deck Slides**: **[Open Canva Presentation](https://canva.link/upnutijay2qn7vn)**
- 📄 **Preliminary Proposal PDF**: [`submission/SDC2026_XenoForce_Preliminary.pdf`](submission/SDC2026_XenoForce_Preliminary.pdf)
- 📄 **Technical Tools Declaration PDF**: [`submission/SDC2026_XenoForce_TechDeclaration.pdf`](submission/SDC2026_XenoForce_TechDeclaration.pdf)
- 📄 **Replit Proof of Use (POU) PDF**: [`submission/SDC2026_XenoForce_Replit_POU.pdf`](submission/SDC2026_XenoForce_Replit_POU.pdf)
- 📄 **RunPod Proof of Use (POU) PDF**: [`submission/SDC2026_XenoForce_Runpod_POU.pdf`](submission/SDC2026_XenoForce_Runpod_POU.pdf)

---

## Overview

### Problem

Working adults often have limited time and money to retrain, while uncertainty about AI makes it difficult to choose which skills to learn. SME managers also need a practical way to understand their team's skills and discuss potential internal moves.

### Solution

ArcTalent maps a learner's skills and interests to career options across **moderate** and **rapid AI adoption** scenarios. It highlights a shared foundation across the top options, shows where later pathways differ, and schedules catalogue learning resources within the learner's time and budget. Scores and scenarios are planning aids, not forecasts or hiring probabilities.

The repository may contain newer features than the deployed demo. See the dated [Replit verification record](docs/REPLIT_STATUS.md) for details of verified releases.

### Key Features

- **Interactive Orion Command Center**: Dynamic SVG career constellation, transferable skill bridges, and visual score analytics.
- **Frosted-Glass Interface**: Translucent glass cards on a soft icy backdrop, lit from the top left, with glass tooltips on the icon sidebar. **Reduce visual effects** in Settings turns off blur, shadows and animation on slower phones.
- **Dual-Scenario Adaptability**: Toggle between moderate and rapid AI adoption to compare rankings, shared foundations and role-specific learning steps.
- **Your own goals and skills**: Add interests, skills and a career destination in your own words. Review and edit suggested skill targets before using them in a plan. The starter role and course catalogues are finite, so specialist gaps may remain uncovered.
- **CV Import and Reviewed Skills**: Import a TXT or text PDF with consent, then review suggested skills before saving. Local word matching is the default; optional AI-assisted extraction uses the configured provider and checks returned evidence against the source text.
- **SME Workforce Planning**: Add up to ten fictional team members, explore skill gaps and custom destinations, set a company budget and internal openings, and export a workforce PDF. The team view is a prototype for planning conversations.
- **SME Cost Model**: Prices the team plan as internal cohorts versus individual commercial seats, using HRD Corp's Allowable Cost Matrix and DOSM wage data, with editable assumptions and a break-even seat price.
- **Impact Scorecard**: Live check of the four Phase 2 targets from our proposal, for your own route and the synthetic team in both AI scenarios. See the reproducible [impact benchmark](docs/IMPACT.md).
- **SDG Priority Lens**: Choose SDG 4.3 & 4.4, 8.2 or 9.4 to re-rank career options toward that goal. Each option shows its SDG priority points next to an unchanged suitability score.
- **Future Skills Radar and Re-planning**: Compares skill demand between snapshots, then shows which courses the plan kept, added or dropped after a trend update.
- **What Would Raise This Score?**: Each skill gap shows the exact score gain from closing it and the shortest catalogue course that teaches it.
- **Study coach and practice badges**: In the latest repository, learners can request a short study-session plan and reflect on a course marked studied. An optional AI review or local fallback can award a practice badge linked to the learner's reflection; skill-level changes require the learner's confirmation. These badges are self-study milestones, not independent certifications. The app also links to Malaysian training portals.
- **SDG Totals and Fairness Check**: SDG-aligned study hours for one learner, the SME team and a labelled 1,000-learner projection. A fairness check re-runs matching with six different names and job titles and shows the results are identical, because matching never reads them.
- **PDF learning plans**: Download personal or SME plans as searchable PDFs with direct course links. Personal exports preserve the selected destination, funding filter, specialist gaps and typed study preferences in English, Bahasa Melayu or Simplified Chinese.
- **Course and Video Cards**: Each course step shows the course as a card with the provider's own cover image, hours and website, beside an optional YouTube video card with the video's original cover, length, title and channel. Covers load from the providers' and YouTube's image servers, with a drawn cover when none is available; videos are not counted in planned hours.
- **Multilingual support**: Interface options for English, Bahasa Melayu and Simplified Chinese.
- **One Settings page**: Profile, Skills (with CV import), Language & accessibility and Demo data are tabs of one Settings page. Profile and skill edits form one draft and update your pathways together. Language & accessibility also offers larger text, reduced motion and reduced visual effects for slower phones.
- **Start fresh**: The header's **Reset to Default** asks for confirmation, then clears saved profiles, skills, interests, goals, learning progress, team plans and pictures, plus open CV drafts and chat. It opens a blank profile with 4 h/week, RM 0 and 8 weeks, and stays blank after reload. Language and display preferences are kept. **Reset demo** loads the sample workspace again.
- **Profile pictures**: Settings → Profile offers six classic and twelve animal avatars, initials or a JPG/PNG/WebP photo. Photos are cropped and resized on the device, saved per profile in browser storage, and displayed consistently in the workspace.
- **Interests in your own words**: Besides the four work areas, Settings → Profile accepts up to eight interests typed in English, Bahasa Melayu or Simplified Chinese. An interest that matches a work area (for example "data visualisation" or "环保") counts towards route scores like a ticked box, and every interest appears as a one-click idea for your own career goal. The typed words stay in the browser; only the matched work areas reach the AI guide.
- **CV privacy controls**: ArcTalent does not save CV files or raw CV text. PDF conversion processes the file on the application server. Optional AI analysis sends reviewed text to the configured provider when selected. Reviewed profile skills are saved in this browser, and transient CV text and suggestions can be cleared.
- **Optional AI career guide**: Enable **Use AI answers** to ask about your selected plan. The server recomputes the plan and uses catalogue-owned course links; names, photos, CV text and employee records are not attached. The guide also works in local mode.

### Tech Stack

| Layer                   | Technology                                                                                                                |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**            | Next.js 16 (App Router), React 19, TypeScript, Lucide Icons, custom CSS with frosted-glass design tokens                  |
| **Backend & Engine**    | Node.js route handlers, deterministic heuristic matching engine (`engine.ts`), Zod validation                             |
| **Document Processing** | `pdf-parse` for consented text PDFs; PDFKit with an embedded Noto Sans SC font for English, Malay and Chinese PDF reports |
| **AI / GPU Compute**    | Optional RunPod or an HTTPS OpenAI-compatible gateway via Vercel AI SDK                                                   |
| **Cloud Hosting**       | **Replit** (Full-stack production Autoscale deployment in Asia region)                                                    |
| **Storage & Privacy**   | Browser LocalStorage (Zero cloud database required)                                                                       |

---

## How We Use Replit _(Official Sponsor)_

- **Development & Version Control**: Imported canonical source repository, maintaining continuous verified git histories.
- **Production Hosting**: Live public deployment on Replit Autoscale (`https://arc-talent--emmanuelheng.replit.app/`) serving web views and API routes.
- **Build & CI Verification**: The reset release `27c9345` passed 227 unit tests and 35 production integration checks in Replit; the 35 checks also passed against the live site on 31 October 2026. Later source changes may differ from that verified release. See [runtime status](docs/REPLIT_STATUS.md) for the dated record.
- **Secrets Management**: AI provider keys and endpoints (RunPod or another OpenAI-compatible gateway) are stored in Replit Secrets, never committed to git.
- 📄 Proof of use: [`submission/SDC2026_XenoForce_Replit_POU.pdf`](submission/SDC2026_XenoForce_Replit_POU.pdf)

## How We Use RunPod _(Official Sponsor)_

- **Workload**: RunPod can host a configured model such as `Qwen/Qwen2.5-7B-Instruct` for CV skill extraction, career goal analysis and optional guidance. An OpenAI-compatible gateway can also be configured.
- **Integration**: Next.js route handlers communicate with RunPod via the Vercel AI SDK using structured JSON schema decoding (`Output.object`).
- **Verbatim evidence anchoring**: CV skill candidates are checked against exact source substrings; users still need to review the suggestions.
- **Resilient Fallback**: Automatically falls back to deterministic local alias matching if the cloud GPU is idle or offline.
- 📄 Proof of use: [`submission/SDC2026_XenoForce_Runpod_POU.pdf`](submission/SDC2026_XenoForce_Runpod_POU.pdf)

---

## Run Locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 for the introduction, then choose **Build my pathway** or **Plan for my team**.

```sh
npm run typecheck
npm test
npm run build
npm run start
# In another terminal, with the production server running:
npm run test:integration
# Print the Phase 2 impact benchmark (docs/IMPACT.md):
npm run impact
```

### AI provider (optional)

Without AI settings, ArcTalent uses local skill matching and the local planning guide. To turn on AI answers, set **one** of these in Replit Secrets or an untracked `.env.local` (see [`.env.example`](.env.example)):

- **RunPod**: `RUNPOD_API_KEY`, either `RUNPOD_ENDPOINT_ID` or `RUNPOD_BASE_URL`, and either `RUNPOD_MODEL` or `RUNPOD_MODEL_NAME`. The base URL must be a supported RunPod Pod or Serverless OpenAI-compatible endpoint. See [`.env.example`](.env.example).
- **Any OpenAI-compatible gateway** (for example LiteLLM): `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, and optionally `AI_PROVIDER_NAME`, the name people see before they send data (by default, the model name).

When both configurations are complete, the `AI_*` settings take precedence. CV extraction, chat and the study coach offer AI controls that identify the configured provider. Career-goal analysis sends the entered title and description to the configured provider when requested. These features have local fallbacks when AI is unavailable.

### Data, sources and limits

- Profiles, planning choices, progress, pictures and display preferences are stored in the browser. Chat is transient; uploaded CV text is not saved by ArcTalent's server. When AI is used, the configured provider receives the relevant inputs; the study coach's practice note is free text, so learners should avoid including sensitive information.
- The default and replayed snapshots are labelled simulations. Public evidence refreshes use a bounded European job-posting sample and arXiv research, not a representative Malaysian labour-market forecast. Custom snapshots are user-entered assumptions.
- Course cards link directly to the curated resources in [the source register](docs/SOURCES.md). Public learning content is listed at RM 0, but certificates, software and other costs may apply. HRD Corp claimability and current availability must be checked with the provider.
- The workforce and SDG views show planning estimates and contextual mappings, not measured employment, productivity or SDG outcomes. People make their own learning and employment decisions.

---

## How the Model Works

The shared TypeScript engine in `src/lib/engine.ts` powers the browser and `/api/analyze`:

$$\text{Suitability} = 55\% \times \text{Skill Coverage} + 15\% \times \text{Interest} + 15\% \times \text{Market Signal} + 15\% \times \text{Scenario Resilience}$$

- **Skill Coverage**: Compares self-reported levels (0–3) against role requirements. Pivot distance is $100 - \text{Coverage}$.
- **Scenario Resilience**: $1 - (\text{Adoption Factor} \times \text{Role Exposure})$. Moderate uses 0.35; Rapid uses 0.75.
- **Shared Foundation**: Identifies missing skills required by every top-ranked career across **both** scenarios.
- **Greedy Course Scheduler**: Fills weekly study limits (e.g. 4 hrs/week, RM0 budget) and always schedules courses that close a shared-foundation gap before role-specific ones.
- **SDG Priority Lens** (optional): Ranks by suitability plus up to 20 priority points: 10 when the role's own SDG target is in the lens, plus 10 × the share of its required skill levels mapped to a lens target. Suitability itself is unchanged.

---

## Team — Xeno Force

| Name                            | Role                                           | University                         | Email                    |
| :------------------------------ | :--------------------------------------------- | :--------------------------------- | :----------------------- |
| **Emmanuel Heng Zi Teng**       | Team Leader / Full-Stack & System Architecture | Universiti Malaya                  | `enuelhzt1524@gmail.com` |
| **Dihom Chan Dyi Hong**         | Frontend & UI / UX Design                      | Universiti Teknologi Malaysia      | `dihomchan1@gmail.com`   |
| **Nicholas Chuah Zheng Yee**    | AI Integration & RunPod Infrastructure         | Management and Science University  | `711niczheng@gmail.com`  |
| **Ghessweynne Liew Thin Hsing** | Workforce Research & SDG Impact Modeling       | Swinburne University of Technology | `dino55590@gmail.com`    |

---

## Submission Checklist

- [x] Complete and functional repository codebase
- [x] Apache License 2.0 included
- [x] Proof of Replit utilization included in `submission/`
- [x] Proof of RunPod utilization included in `submission/`
- [x] Preliminary Proposal PDF completed (`submission/SDC2026_XenoForce_Preliminary.pdf`)
- [x] Technology Declaration PDF completed (`submission/SDC2026_XenoForce_TechDeclaration.pdf`)
- [x] Fully populated README summary with required hackathon sections
- [x] Pitch deck slide link added ([Canva Slide Deck](https://canva.link/upnutijay2qn7vn))
- [x] YouTube demo video link added ([YouTube Demo Video](https://youtu.be/PYpaD5IAYpE))

---

## License

Project code is licensed under the [Apache License 2.0](LICENSE). External course content, source data, trademarks and dependencies retain their own rights and licenses.
