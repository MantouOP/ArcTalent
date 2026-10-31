# Blank workspace reset implementation plan

> **For agentic workers:** Execute inline with executing-plans. Request one fresh read-only review after implementation.

**Goal:** Add Reset to Default beside Reset demo, clearing the current browser's personal and planning data and opening an empty profile form that stays empty after reload.

**Architecture:** Keep the existing demo reset and backend validation intact. Add an explicit persisted `needsSetup` mode with a blank profile draft, empty workforce and default scenario/evidence. Gate personal recommendations until a valid profile is saved. Reset picture context and remount draft/chat components; invalidate pending requests. Preserve language, accessibility settings and server configuration.

**Tech stack:** Existing Next.js/React/TypeScript, native dialog, CSS and browser storage. No dependencies.

**Spec:** The user's request in this chat: a separate header action that returns personal data to blank/default so people can enter their own details. Default learning controls remain 4 h/week, RM 0 and 8 weeks. Language and accessibility are preserved, as stated in progress commentary.

## Constraints and review focus

- Show a confirmation describing what is cleared; Cancel/Escape must preserve everything.
- Clear profile details, catalogue/custom skills, interests, preferences, progress, career goals, team plans, pictures, CV drafts and chat. Imported evidence returns to the labelled baseline.
- Never use localStorage.clear or affect unrelated browser data, AI credentials or deployment configuration.
- A blank draft must not be mistaken for a valid completed profile or silently replaced by Aina on hydration.
- An explicitly empty SME roster stays empty. New user-created team records survive reload even while their personal profile is unfinished.
- Preserve existing APIs, demo profiles and all newer custom-skill/gateway work. No backend schema widening.
- Block stale evidence/export responses and remount transient input components. Accessible header control and confirmation in all three languages.
- Test actual clearing only on an isolated local origin. On the public site, verify the control and Cancel path without erasing existing user data.

## Tasks

- [x] Add and run failing tests for blank state, persistence, explicit empty workforce, validation boundaries and legacy mode.
- [x] Implement the factory/restorer, confirmed reset, picture clearing, draft remounting, stale-request cancellation and empty-state presentation.
- [x] Translate labels, check responsive CSS/keyboard behavior, and run unit/type/build/integration checks and a fresh source review.
- [ ] Push and deploy the exact verified release, inspect the public confirmation and Cancel path, and record live proof.

## Verification ledger

- Four new reset tests observed failing before implementation, then passing. Full suite: 226 passed; typecheck and production build passed; all 35 production integration checks passed on isolated port 3002.
- Fresh read-only review resolved: abort workforce PDF on unmount/reset, hide personal evidence score comparisons before setup, neutral loading shell before storage hydration, and guard PDF export until a valid personal profile exists. Reviewer reports no outstanding findings.
- Browser on isolated localhost:3002: Cancel preserves Aina; reset clears modified name/role/time/budget, selected cat avatar and sample team; blank fields/default 4 h/RM 0/8 weeks and zero skills remain after reload; no assistant or personal recommendations before setup. An entered fictional team member survives reload while personal setup remains blank. Evidence remains inspectable without blank-profile comparisons. Saving a new valid profile resumes the planner and persists; Reset demo restores Aina.
- Malay confirmation/reset preserves Malay; Chinese confirmation translated; Escape dismisses. Larger text/reduced motion preserved after reset/reload. Responsive styles inspected; Chrome viewport capability retained a desktop viewport despite requested dimensions, so a phone screenshot is not claimed.
- Ruling: keep strict export API validation and disable exports with a translated setup notice until a personal profile is saved, avoiding invalid blank-profile requests.
- Ruling: incorporate newer remote course-cover commit 2b74590 before deployment so this reset release preserves concurrent team work.
