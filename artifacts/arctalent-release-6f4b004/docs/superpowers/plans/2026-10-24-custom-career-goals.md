# Custom career goals implementation plan

> **For agentic workers:** Use executing-plans inline, with a final independent review.

**Goal:** Let users describe any career goal, review analysed requirements, and build a constrained pathway with real direct course links.

**Architecture:** A validated custom-goal domain object becomes one additional individual Role using the existing engine. A bounded server route provides structured RunPod analysis or an explicit local/manual fallback. Courses remain a separate verified catalogue.

**Tech stack:** Existing Next.js, TypeScript, React, Zod, AI SDK, node:test.

**Spec:** `docs/superpowers/specs/2026-10-24-custom-career-goals.md`.

## Constraints / review focus

- Existing six-role results remain unchanged without a custom goal; scoring weights stay unchanged.
- Custom title/requirements survive reload; edited inputs invalidate pending analysis; applying/resetting/removing updates the correct selected route.
- Reject empty targets, unknown skill IDs, invalid levels, malformed/oversized bodies and malicious stored payloads.
- AI cannot supply course URLs. A missing/failed model never produces an AI-labelled local response.
- Specialist skills outside the catalogue remain explicit gaps; time, budget, prerequisites, funding and completion constraints still apply.
- Custom source copy must not claim occupational validation. Chat/scenario/evidence/export all use the selected custom route.
- New UI is translated, keyboard usable and scoped to the existing dark theme. No unrelated redesign.

## Tasks

- [x] Inspect selector, matching, persistence, AI configuration and course sources. Public health confirms no model is configured. Ask about connecting AI without requesting keys in chat.
- [x] Write failing domain/engine/API regression tests. Add schemas and custom-goal conversion/local analysis, extend optional engine candidate lists, add verified learning content.
- [x] Implement bounded structured AI route and honest fallback; test response validation and no URL generation.
- [x] Add free-text form, editable skill targets, preview/application, source notice, persistence and integration across individual views/chat. Translate all new display copy.
- [x] Run formatting/typecheck/unit/build/integration and actual browser flows; perform independent review and fix findings.
- [x] Push, import exact source into Replit, verify, publish, check public behavior and record any remaining model-configuration dependency.

Review fixes cover the seventh route, preserving curated selection on removal, canonical chat titles, focus and funding-consistent previews. The user supplied an existing Serverless endpoint; validated aliases and SDK structured output were added. Real inference succeeded.

Public release verified at 2026-10-24 22:59:04 MYT: real AI inference, nineteen HTTPS checks, browser persistence/scenario pinning and direct course destinations. Replit runtime and CI evidence are in docs/REPLIT_STATUS.md.
