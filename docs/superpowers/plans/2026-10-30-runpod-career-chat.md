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
- [x] Review the final diff, push to GitHub, publish a fresh immutable Replit release and verify the public chat flow.

**Review focus:** No consent means no model request; arbitrary request fields cannot carry CV data; fabricated model URLs never become links; an empty custom-career catalogue is not evidence of readiness; clear/toggle/context changes cannot append stale replies. Rate limiting is best effort per process, consistent with the app's existing anonymous demo APIs.

**Progress:** Complete. Local verification passed 188 unit tests, TypeScript, formatting and build. Replit independently matched 222 canonical source files and passed 188 tests, build and 34 integration checks for source `577b986`. Replit reports Live; all 34 public checks passed again. The original public weekend-chef question returned an actual Qwen answer, and a separate synthetic public web-development query returned exact course links. Proxy-origin validation, selected-career specialist facts, stale-reply invalidation and empty-plan decoding were corrected with regressions. Real English, Chinese and Malay model answers, local fallback and cancellation were observed. Browser warnings/errors were empty. The viewport override did not change the measured 2560px width; it was reset and no new mobile-width verification is claimed. Existing public user profile, career goal, rapid scenario and dated evidence were retained. Live screenshot and publication details are in VERIFICATION.md and REPLIT_STATUS.md.
