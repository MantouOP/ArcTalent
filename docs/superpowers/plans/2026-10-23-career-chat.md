# ArcTalent career chatbox implementation plan

**Goal:** Add the user-selected career and learning assistant to the existing multilingual app.

**Architecture:** A floating, modeless, keyboard-accessible chat panel reads the existing profile, selected match, plan, scenario, evidence and workforce settings. A small pure function produces structured, translatable, plan-based replies for supported questions, with links and navigation actions. Replies are honestly labelled as a guide running on the device; no language-model service, credentials, costs, new dependency or message transmission is introduced.

## Constraints

- Preserve existing data fetching, state, IDs, exports and scoring.
- English, Malay and Simplified Chinese question recognition and reply presentation; entered messages remain verbatim.
- No invented forecasts, claimability or job-readiness claims. Unsupported questions explain scope and suggest supported topics.
- Exact current course budget, time, selected route and funding filter; zero-time/empty plans stay honest.
- Keep at most 20 turns in memory only; closing preserves them, clearing removes them. Locale switches re-render assistant answers; historical replies retain the scenario/snapshot they used.
- New replies always use current app data. Mark earlier replies when the app context changes.
- Enter sends, Shift+Enter adds a line, IME composition is respected; Escape/close returns focus to the launcher. Keep the rest of the dashboard available.
- Responsive panel clears the mobile navigation and cannot overflow a 320px viewport. No continuous animation or fake typing delay.

## Interfaces

`src/lib/career-chat.ts` exports:

- `ChatView = 'explore' | 'pathway' | 'team' | 'evidence' | 'profile'`.
- `ChatIntent = 'recommendation' | 'learning' | 'gaps' | 'scenario' | 'budget' | 'time' | 'funding' | 'evidence' | 'team' | 'greeting' | 'unsupported'`.
- `ChatValue = string | number | { label: string }`; the object form means translate that display label.
- `ChatLine = { text: string; values?: Record<string, ChatValue> }`.
- `ChatContext = { profile: Profile; scenario: Scenario; snapshot: Snapshot; active: Match; plan: LearningPlan; shared: SkillId[]; workforce: WorkforceSettings }`.
- `ChatReply = { intent: ChatIntent; paragraphs: ChatLine[]; bullets: ChatLine[]; sources: { label: string; href: string }[]; action?: { label: string; view: ChatView }; basis: { role: string; scenario: Scenario; snapshot: string; asOf: string } }`.
- `answerCareerQuestion(question: string, context: ChatContext, previousIntent?: ChatIntent): ChatReply`.
- `careerChatContextKey(context: ChatContext): string` identifies meaningful current planning data, including the funding-dependent plan.

The UI component receives `{ context: ChatContext; onNavigate: (view: ChatView) => void }`. It resolves translated `ChatLine` values with `useI18n()` and never renders raw HTML.

## Task 1: Grounded replies

- [x] Write failing tests for multilingual topic recognition, exact selected-route numbers, empty/zero-time plans, verified funding counts, scenario sensitivity, context freshness and safe unknown questions.
- [x] Implement the pure helper without changing the engine or any API. Return bounded paragraphs/bullets and known catalogue links only.
- [x] Run the new tests and the existing suite.

## Task 2: Floating multilingual interface

- [x] Add the accessible launcher, panel, suggested questions, bounded transcript, composer, clear and close controls.
- [x] Add translations for all chat copy and wire in the existing app context/navigation.
- [x] Verify locale switches, typing/Enter, reopening/clearing, navigation actions and updated-context replies.

## Task 3: Verify and publish

- [x] Check 320px/375px and desktop layout, keyboard behavior, browser logs, and preserved app controls.
- [x] Run tests, type checking, formatting, production build and API checks; review the change.
- [x] Commit and push, import the exact release into Replit, publish and verify the public chatbox and APIs. Save proof and record release provenance.
