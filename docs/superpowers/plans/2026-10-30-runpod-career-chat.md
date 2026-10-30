# RunPod career assistant repair

**Goal:** Answer natural career and learning questions using the existing RunPod model, while retaining the current local guide.

**Diagnosis:** The deployed composer and suggested questions work, but `send` only calls `answerCareerQuestion`; no chat API exists. Natural questions outside its keyword list are rejected. RunPod configuration is used only by CV extraction and goal analysis.

**Design:** Keep the existing chat layout and planning engine. Add an optional, explicitly consented RunPod mode, off by default in each tab. Send only the question, recent same-plan conversation, anonymised skill/time/budget inputs, selected career targets and evidence summary. Never include CV text, profile names, pictures or SME employee records. Recompute the plan on the server and return catalogue-owned course links. Show the reply's actual provider and explain fallback. Model output is plain text, not executable HTML. Existing plan state never changes through chat.

**Approaches:** Expanding keyword lists cannot handle arbitrary phrasing. Replacing the local guide would introduce an unnecessary network dependency. A model-backed mode with the existing guide as fallback fits the user's request to check and repair API-based chat using their existing endpoint. This implementation choice is made by the implementer within the authorised repair scope.

**Stack:** Existing Next.js, TypeScript, React, Zod and version-matched AI SDK / OpenAI-compatible provider; no new dependencies.

- [x] Add meaningful failing tests for consent, anonymisation, canonical plan reconstruction, output validation, approved course links and unavailable-model fallback.
- [x] Implement the bounded chat service and API with browser-origin host validation (compatible with proxy URLs), timeouts, no retries, no-store responses and a per-process request cap.
- [x] Wire the current composer to optional AI mode; handle loading, cancellation, stale context and translations in English, Malay and Chinese.
- [x] Run the full tests, TypeScript, formatting, build and integration suite; test actual RunPod and the browser.
- [ ] Review the final diff, push to GitHub, publish a fresh immutable Replit release and verify the public chat flow.

**Review focus:** No consent means no model request; arbitrary request fields cannot carry CV data; fabricated model URLs never become links; an empty custom-career catalogue is not evidence of readiness; clear/toggle/context changes cannot append stale replies. Rate limiting is best effort per process, consistent with the app's existing anonymous demo APIs.

**Progress:** Local verification now passes 188 unit tests. Replit published source `819e96c` after the cache backup reduced the project bundle, and all 34 public integration checks passed. Browser reproduced a proxy-origin rejection (403 instead of validation 400); Host-based validation fixed it. A fresh reviewer found custom specialist gaps leaking into a stock career's facts; its regression failed before the fix and passed afterwards. A further regression ensures specialist-goal and funding edits invalidate pending AI replies even when course schedules stay empty. Public chef testing found that the model selected a catalogue ID outside its empty plan, correctly causing fallback. The decoding schema is now constrained to scheduled IDs and forces an empty array for empty plans; direct Qwen inference returned a valid practical chef-learning answer with no course IDs. Real Qwen answers, canonical course links, Chinese and Malay output, local fallback and cancellation were observed. Explicit language instructions corrected a Malay request answered in English. Browser warnings/errors were empty. The viewport override did not change the measured 2560px width; it was reset and no new mobile-width verification is claimed. Existing public user profile and career goal were not changed. Final schema-fix publication and public chef verification remain pending.
