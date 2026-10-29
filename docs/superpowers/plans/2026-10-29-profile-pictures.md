# Settings profile pictures

> **For agentic workers:** Use the existing checkout and implement this bounded Settings addition inline. Preserve the unrelated `submission/evidence/` files.

**Goal:** Let a user select a profile picture in Settings and see it throughout the workspace.

**Architecture:** Keep a separate versioned browser preference map keyed by profile ID. Offer six bundled SVG avatars, the existing initial, and a locally resized JPG/PNG/WebP upload. Reuse one decorative avatar component in Settings, the navigation rail, header, pathway map and skills card. No image enters the career profile/API/PDF payloads.

**Tech stack:** Existing Next.js, React, TypeScript, plain CSS and native browser image decoding/canvas. No dependency or backend addition.

**Spec:** The user's request is “make an profile picture selection in the settings”. Routine implementation choices: immediate saving, one image per profile, local-only persistence, 256px centre crop, maximum 5 MB input and 24 million decoded pixels. Preserve the current Orion styling and all existing Settings controls. Keep English, Malay and Chinese labels.

## Constraints and review focus

- Limit stored images to bounded raster data URLs or known local preset IDs; reject SVG uploads and remote URLs.
- Preserve the old picture when an upload is invalid or decoding fails.
- Use native radio controls, labelled buttons and visible focus/selected states.
- Ignore stale asynchronous work after choosing another image or closing Settings.
- Keep the chosen image usable in memory with an honest warning if browser storage fails.

## Implementation and verification

- [x] Write failing unit tests for validated file metadata, isolated per-profile updates, removal, malformed storage and bounded local raster URLs.
- [x] Implement the preference helpers/provider and safe local image preparation.
- [x] Build the picker, bundled avatars and shared avatar presentation; integrate Settings and workspace instances; translate labels.
- [x] Verify preset selection and photo upload, reload persistence, initial reset, invalid uploads, keyboard controls and all three languages in Chrome. Inspect the actual Settings layout.
- [x] Run the complete unit suite, TypeScript, formatting, production build and existing integration suite. Obtain an independent code review.
- [x] Push the verified source to GitHub and publish an immutable Replit release. Confirm the public picker and persistence.
