# ArcTalent

> **Skills that travel with you.** An adaptive, explainable reskilling command center that helps working adults and SME managers navigate evolving labour markets under moderate and rapid AI adoption scenarios.

---

## Team Information

| Field | Details |
| :--- | :--- |
| **Team Name** | **Xeno Force** |
| **Team Domain** | **Domain 1 — The Aiversecity Future-Ready Workforce Domain** |
| **SDG Track (1–17)** | **SDG 8: Decent Work and Economic Growth** *(also addressing SDG 4: Quality Education & SDG 10: Reduced Inequalities)* |
| **Team Leader** | **Emmanuel Heng Zi Teng** |
| **Email & Phone** | **Enuelhzt1524@gmail.com** · **010-271-6363** |
| **University Affiliations** | **Universiti Malaya (UM)**, **Universiti Teknologi Malaysia (UTM)**, **Management and Science University (MSU)**, **Swinburne University of Technology** |
| **Number of Members** | **4** |

## Links

| Resource | Link |
| :--- | :--- |
| **GitHub Repository** | [https://github.com/MantouOP/ArcTalent](https://github.com/MantouOP/ArcTalent) |
| **Live Demo (Replit)** | [https://arc-talent--emmanuelheng.replit.app/](https://arc-talent--emmanuelheng.replit.app/) |
| **Replit Team Project** | [https://replit.com/@EmmanuelHeng/ArcTalent](https://replit.com/@EmmanuelHeng/ArcTalent) |
| **Replit Runtime Branch** | [https://github.com/MantouOP/ArcTalent/tree/replit-runtime](https://github.com/MantouOP/ArcTalent/tree/replit-runtime) |
| **RunPod Endpoint** | `https://api.runpod.ai/v2/` *(Qwen/Qwen2.5-7B-Instruct Serverless vLLM)* |
| **Slide Deck** | *(Paste your Slide Deck / PDF link here)* |
| **Demo Video (YouTube)** | *(Paste your 5–7 min YouTube demo link here)* |

---

## Official Submission Documents

All required official submission documents are available in the [`submission/`](submission/) directory:

- 📄 **Preliminary Proposal**: [`submission/SDC2026_XenoForce_Preliminary.pdf`](submission/SDC2026_XenoForce_Preliminary.pdf)
- 📄 **Technical Tools Declaration**: [`submission/SDC2026_XenoForce_TechDeclaration.pdf`](submission/SDC2026_XenoForce_TechDeclaration.pdf)
- 📄 **Replit Proof of Use (POU)**: [`submission/SDC2026_XenoForce_Replit_POU.pdf`](submission/SDC2026_XenoForce_Replit_POU.pdf)
- 📄 **RunPod Proof of Use (POU)**: [`submission/SDC2026_XenoForce_Runpod_POU.pdf`](submission/SDC2026_XenoForce_Runpod_POU.pdf)

---

## Overview

### Problem

Rapid AI adoption is outpacing traditional training programmes. In Malaysia, 56% of professionals use AI at work but only 26% have received formal training (Hays Asia 2025), while over 600,000 workers will need reskilling within 3–5 years (MOSTI). Working adults cannot afford to start from scratch whenever AI forecasts shift, and SMEs (97% of Malaysian businesses) lack the HR intelligence to redeploy existing talent before turning to layoffs or costly hiring.

### Solution

ArcTalent provides an explainable career reskilling command center that maps current capabilities into adjacent careers across two distinct AI scenarios: **Moderate** and **Rapid AI Adoption**. It isolates the **shared foundation** (skills vital in both futures, like data literacy and critical thinking) so learners can start immediately with zero wasted effort, while scheduling free verified courses within weekly hour and budget limits.

### Key Features

- **Interactive Orion Command Center**: Dynamic SVG career constellation, transferable skill bridges, and visual score analytics.
- **Dual-Scenario Adaptability**: Instant toggle between Moderate and Rapid AI futures; preserves foundational learning while updating specialized branches.
- **Evidence-Backed Skill Extraction**: GenAI extracts CV skills anchored to verbatim source quotes (`Qwen/Qwen2.5-7B-Instruct` on RunPod) with instant local regex fallback.
- **SME Workforce Redeployment**: 8–10 worker gap heatmap, company budget management, internal seat quotas, grouped training economies, and localized PDF reports.
- **Multilingual Support**: Fully accessible in English, Bahasa Melayu, and 简体中文.
- **Zero-Database Privacy**: All state lives in Browser LocalStorage; no personal resume data is ever stored on the server.

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Lucide Icons, Custom CSS |
| **Backend & Engine** | Node.js route handlers, deterministic heuristic matching engine (`engine.ts`), Zod validation |
| **Document Processing** | `pdf-parse` for synthetic text resumes; `@react-pdf/renderer` font embedding for PDF reports |
| **AI / GPU Compute** | **RunPod** (Serverless `Qwen/Qwen2.5-7B-Instruct` via Vercel AI SDK) |
| **Cloud Hosting** | **Replit** (Full-stack production Autoscale deployment in Asia region) |
| **Storage & Privacy** | Browser LocalStorage (Zero cloud database required) |

---

## How We Use Replit *(Official Sponsor)*

- **Development & Version Control**: Imported canonical source repository, maintaining continuous verified git histories.
- **Production Hosting**: Live public deployment on Replit Autoscale (`https://arc-talent--emmanuelheng.replit.app/`) serving web views and API routes.
- **Build & CI Verification**: All 32 unit tests and 14 production integration tests pass directly inside Replit.
- **Secrets Management**: RunPod API keys and endpoints are stored in Replit Secrets, never committed to git.
- 📄 Proof of use: [`submission/SDC2026_XenoForce_Replit_POU.pdf`](submission/SDC2026_XenoForce_Replit_POU.pdf)

## How We Use RunPod *(Official Sponsor)*

- **Workload**: Cloud GPU container hosting `Qwen/Qwen2.5-7B-Instruct` for structured CV skill extraction and custom career goal analysis.
- **Integration**: Next.js route handlers communicate with RunPod via the Vercel AI SDK using structured JSON schema decoding (`Output.object`).
- **Verbatim Evidence Anchoring**: Model candidates are filtered against exact CV substrings to eliminate hallucination.
- **Resilient Fallback**: Automatically falls back to deterministic local alias matching if the cloud GPU is idle or offline.
- 📄 Proof of use: [`submission/SDC2026_XenoForce_Runpod_POU.pdf`](submission/SDC2026_XenoForce_Runpod_POU.pdf)

---

## Run Locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 for the introduction, then choose **Explore my pathway** or **Plan for my team**.

```sh
npm run typecheck
npm test
npm run build
npm run start
# In another terminal, with the production server running:
npm run test:integration
```

---

## How the Model Works

The shared TypeScript engine in `src/lib/engine.ts` powers the browser and `/api/analyze`:

$$\text{Suitability} = 55\% \times \text{Skill Coverage} + 15\% \times \text{Interest} + 15\% \times \text{Market Signal} + 15\% \times \text{Scenario Resilience}$$

- **Skill Coverage**: Compares self-reported levels (0–3) against role requirements. Pivot distance is $100 - \text{Coverage}$.
- **Scenario Resilience**: $1 - (\text{Adoption Factor} \times \text{Role Exposure})$. Moderate uses 0.35; Rapid uses 0.75.
- **Shared Foundation**: Identifies missing skills required by every top-ranked career across **both** scenarios.
- **Greedy Course Scheduler**: Optimally fills weekly study limits (e.g. 4 hrs/week, RM0 budget) prioritizing shared foundational skills first.

---

## Team — Xeno Force

| Name | Role | University | Email |
| :--- | :--- | :--- | :--- |
| **Emmanuel Heng Zi Teng** | Team Leader / Full-Stack & System Architecture | Universiti Malaya | `enuelhzt1524@gmail.com` |
| **Dihom Chan Dyi Hong** | Frontend & UI / UX Design | Universiti Teknologi Malaysia | `dihomchan1@gmail.com` |
| **Nicholas Chuah Zheng Yee** | AI Integration & RunPod Infrastructure | Management and Science University | `711niczheng@gmail.com` |
| **Ghessweynne Liew Thin Hsing** | Workforce Research & SDG Impact Modeling | Swinburne University of Technology | `dino55590@gmail.com` |

---

## Submission Checklist

- [x] Complete and functional repository codebase
- [x] Apache License 2.0 included
- [x] Proof of Replit utilization included in `submission/`
- [x] Proof of RunPod utilization included in `submission/`
- [x] Preliminary Proposal PDF completed (`submission/SDC2026_XenoForce_Preliminary.pdf`)
- [x] Technology Declaration PDF completed (`submission/SDC2026_XenoForce_TechDeclaration.pdf`)
- [x] Fully populated README summary with required hackathon sections
- [ ] Pitch deck slide link added
- [ ] YouTube demo video link added (5–7 minutes)

---

## License

Project code is licensed under the [Apache License 2.0](LICENSE). External course content, source data, trademarks and dependencies retain their own rights and licenses.
