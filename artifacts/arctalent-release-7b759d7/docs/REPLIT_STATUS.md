# Replit runtime and publishing verification

Verified on **24 October 2026** in the [team project](https://replit.com/@EmmanuelHeng/ArcTalent).

## Custom inputs and CV import — live

Canonical source `27648ef95d9a5c64f390bd83a984e001bea6b052` repairs the inactive CV import experience and adds blank profiles, typed check-in answers, custom session lengths, editable fictional teams and dated simulation inputs. Its [source CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/40069241921). Replit imported it unchanged into `artifacts/arctalent-release-27648ef`; exact Git tree comparisons passed before installation and again after downloading the runtime history. A locked install, **112 unit tests**, production build and all **15 production integration checks** passed inside Replit.

Runtime `6867c111cc71663c9204b98dfc2be89722f16e9e` switches the artifact launch configuration to this release. Its 10,003,561-byte incremental Git bundle requires ancestor `ef59495988dd903d1c816da7d6d133fcac8f16e3`; the bundle verified locally and was pushed to `replit-runtime`. Its [runtime CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/40071177542).

The first publishing attempt passed build/security checks but failed at Bundle: Replit reported an image larger than its 8 GiB limit. Disk inspection found retained old release directories of roughly 800 MiB each. A bounded cleanup removed **6,768,328 KiB** of untracked `node_modules`/`.next` output from sixteen directories in eight older releases. All source/history and the complete current release were preserved, with exact current-source equality rechecked. Old dependencies and builds can be regenerated from their locked source. Cleanup record `61def1f9f6f2a9ca98fa4ddc55df5c9899937675` is pushed to `replit-runtime`, preserved in a verified 845-byte incremental bundle based on `6867c11`; its [CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/40071692835).

The retry completed build, security, bundling and promotion. Replit reports **Live**. The new public analysis contract was observed at **2026-10-24 06:52:55 UTC (14:52:55 MYT)**, approximately eight minutes after the retry began. All **15 public HTTPS integration checks passed**, including the custom profile/session/snapshot flow, existing API parity and real synthetic PDF parsing.

Public Chrome verified initial-import guidance and checkbox focus, actual PDF import, six supported skill candidates, editing then selecting the same PDF again and stale candidates cleared before re-extraction. A blank fictional Maya profile saved typed work/practice answers and 45-minute sessions; the pathway showed four sessions within three weekly hours and retained the original answers after reload. A ninth fictional SME worker appeared in the editor and heatmap. A dated custom snapshot changed the score from 37.12 to 38.76, displaying +1.64 and explicit simulation provenance; both the snapshot and custom roster survived reload. Chinese text entry in the member editor fit 375 × 812 without document/dialog overflow. No warnings/errors or canvas elements were captured in the final public check. Test data, locale and viewport were restored to Aina's moderate baseline, English, standard text and the normal desktop viewport. The [live importer screenshot](images/cv-import-live.jpg) and [custom assumptions screenshot](images/custom-inputs-live.jpg) record the public interface.

## Previously published Settings

Canonical source `e8ab8d077a58f56d45209adfaf187c678e688d6d` adds language, reading-size, reduced-motion, profile-shortcut and demo-data settings. Its [GitHub CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/40050258636). Replit imported it unchanged into `artifacts/arctalent-release-e8ab8d0`; Git tree comparisons before installation and after downloading the runtime history confirmed exact source equality. A locked install, **100 unit tests**, the production build and all **14 production integration checks** passed inside Replit.

Runtime commit `ef59495988dd903d1c816da7d6d133fcac8f16e3` switches the launch configuration to that directory and retains its predecessor. Its 8,155,924-byte incremental Git bundle was downloaded, verified and pushed to `replit-runtime`; it requires ancestor `df121b63a20389cca2126eaad0e3cc8df047cc65`. Its [runtime CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/40050691283). The default extraction mode, existing APIs and dependencies remain unchanged.

Replit reports **Live** after its build, security checks, bundle and promotion completed. The public Settings launcher was observed at **2026-10-24 01:49:21 UTC (09:49:21 MYT)**. All **14 public HTTPS integration checks passed**, including the Settings/chat launchers, API/engine parity and synthetic PDF parsing. Promotion completed without cancellation or source changes, approximately 14 minutes after publishing began.

Public Chrome verified English, Malay and Simplified Chinese Settings; larger text measured 16px, manual reduced motion produced a 0s button transition, and Chinese/larger-text/reduced-motion preferences survived reload. Reset confirmation focused Cancel, cancellation returned focus to Reset demo data, and Escape returned focus to the header Settings trigger. There was no document/dialog horizontal overflow at 320 × 740 with larger Chinese text or 375 × 812 with larger Malay text. Display defaults and English were restored, with Aina's moderate baseline retained. Zero canvas elements were present. The captured log contained one browser-extension bridge error and no application warning/error entries. The [live Settings screenshot](images/settings-live.jpg) and [phone screenshot](images/settings-mobile-live.jpg) record the deployed interface; temporary viewport overrides were reset.

## Previously published career and learning guide

Canonical source `bfc8eab51c22f17f3e426f2f92d5547168a8b1a9` adds the multilingual plan-based career guide. Its [GitHub CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39971315998). Replit imported the complete source unchanged into `artifacts/arctalent-release-bfc8eab`; Git tree comparisons before installation and after downloading the runtime history confirmed exact source equality. A locked install, **95 unit tests**, the production build and all **14 production integration checks** passed inside Replit.

Runtime commit `df121b63a20389cca2126eaad0e3cc8df047cc65` switches the artifact to the new directory and retains the previous launch configuration. Its verified incremental Git bundle was downloaded and pushed to `replit-runtime`; the [runtime CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39971913680). The bundle is 6,449,213 bytes and requires runtime ancestor `0cc2afc4b2352c03493aecd4346874f3ca511d07`.

Replit reports **Live** after its build, security checks, bundle and promotion completed. The new public launcher was observed at **2026-10-23 14:51:23 UTC (22:51:23 MYT)**. All **14 public HTTPS integration checks passed**, including PDF parsing and the rendered chat launcher. Publication completed in approximately 12 minutes without cancellation or source changes.

Chrome verified typed learning questions and the four-course/22-hour/RM0 plan, Malay translation and typed budget questions, Chinese translation and typed skill-gap questions, current scenario context, retained original user messages, the historical-context notice, and a 320px layout with no horizontal overflow or navigation overlap. A manually pinned route stayed authoritative after switching scenario. No warning/error entries were captured and no canvas elements were present. The demo was reset to Aina's moderate baseline and English; the open guide shows a fresh route explanation. The [live chat screenshot](images/career-chat-live.jpg) and [mobile language screenshot](images/career-chat-mobile-live.jpg) record the deployed interface.

## Previously published three-language interface

Canonical source `40c9e05545cde8eb09cdc97569b631fb9228bbe6` adds English, Bahasa Melayu and Simplified Chinese interface options. Its [GitHub CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39963901230). Replit imported the source unchanged into `artifacts/arctalent-release-40c9e05`; the staged directory tree exactly matched the canonical source tree before installation. A fresh locked install, **38 unit tests**, the production build and all **14 production API/selector checks** passed inside Replit.

Runtime commit `0cc2afc4b2352c03493aecd4346874f3ca511d07` switches the artifact launch commands to that directory, retains the previous configuration and records the verification. Its incremental Git bundle was downloaded, verified, imported locally and pushed to `replit-runtime`; its [CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39964694094). A second local Git comparison confirmed exact imported-source equality. The existing APIs, matching engine and dependency manifests are unchanged.

Replit reports **Live** after completing promotion. All **14 public HTTPS API/selector checks passed**, including PDF parsing. Chrome verified the English, Malay and Chinese choices, the Chinese preference retained after reload, correct document language, scenario switching and SME navigation. No browser warnings/errors were captured; there is no background canvas or document overflow. The demo was reset to Aina's moderate-adoption baseline, retaining the selected language, and the [live multilingual screenshot](images/language-options-live.jpg) saved. Promotion took longer than the build/bundle stages; it completed without cancelling or changing the verified source.

## Previously published clean background restoration

The user requested removal of the watermark and lag. Canonical commit `1fc58451de5426971ff253a9b7a2791d97f9fe31` removes the Unicorn component, stylesheet, root mount and package. The application source and dependency manifests match the clean `53fdc89` release, retaining the workforce/CV fixes and corrected PDF. The [removal CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39927400169).

Replit restored `artifacts/arctalent-release-53fdc89` through runtime commit `a5d91fc84c78fd89cdebdca1ee89fa6384cc78e1`. Exact source equality, 32 unit tests and all 14 production API checks passed again before publishing. The configuration/history was exported in a verified Git bundle and pushed to `replit-runtime`.

The Publishing tool reports **Live**. All **14 HTTPS API checks passed** against the clean public deployment. Chrome confirmed zero Unicorn background hosts, zero canvas elements, zero Unicorn SDK script tags and no horizontal overflow. The rapid-adoption switch changed the leading route to Project management; SME navigation worked, with no captured browser warnings/errors. The demo was reset to its baseline and the [clean live screenshot](images/clean-background-live.jpg) saved. Open tabs need a refresh to unload a previously loaded renderer. These checks confirm removal of the animation; they do not measure overall frame time or rule out other sources of latency.

## Withdrawn Unicorn Studio background release

The background release uses canonical source `5273e76b83142de55b68f0ce99931c53c3bef49d`, imported unchanged into `artifacts/arctalent-release-5273e76`. Replit passed its 32 unit tests, TypeScript production build and all 14 production API checks. An additional HTTP check confirmed the background host appears in server-rendered HTML. The launch TOML was parsed and checked, and a Git tree comparison confirmed exact source equality.

Runtime commit `68bda37acd10fa5237546faf3b06314e0d9d526e` is preserved in a verified incremental Git bundle and pushed to `replit-runtime`. The [canonical source CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39923185328), and the [runtime history CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39924118380).

Replit reported **Live** for this now-withdrawn release after its build, security checks, bundle and promotion stages completed. The public server-rendered page contained the new background host, and all **14 HTTPS API checks passed** against that deployment. Chrome confirmed `data-state="ready"`, one canvas, an inert decorative host and no horizontal overflow. Scenario switching and SME navigation worked above the animation. No browser warnings/errors were captured. The demo was reset to Aina's baseline; the [historical background screenshot](images/unicorn-background-live.jpg) records the result. The supplied scene's repeating Unicorn watermarks were visible; the entire embed has since been removed as recorded above.

## Previously verified acceptance release

Source commit `53fdc890dafb483dee7331bff5aceebdf01c3749` is imported unchanged into `artifacts/arctalent-release-53fdc89`. Its 32 unit tests, TypeScript production build and 14 API integration checks passed inside Replit before publishing. An additional production request confirmed that the regenerated synthetic PDF extracts with clean ASCII punctuation. A Git tree comparison confirmed exact source equality; the launch TOML was parsed and checked. The artifact now points to this release on port 23585. Previous release directories and the prior launch configuration remain available for recovery.

The actual runtime commit is `a8086ef5fb323cc4e2bab4cfc9fd788aac6e5aeb`, preserved in a verified Git bundle and pushed to `replit-runtime`. The [canonical source CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39917079124), and the [final runtime CI passed](https://github.com/MantouOP/ArcTalent/actions/runs/39917615173).

Replit reports **Live** for the final publication. Its public PDF download has SHA-256 `610db32272280193fc7402464d57f87b219ace604788a1f20a57ee5199c7da68`, matching the corrected source fixture exactly. All **14 HTTPS API checks passed again after that match**. The [final live screenshot](images/replit-acceptance-live.jpg) records the interface reset to Aina's baseline.

Public browser checks verified both functional fixes: editing the CV cleared four stale candidates and a Python-only extraction returned one supported candidate; RM750, Aina's Sustainability destination and three openings survived a newer snapshot, a scenario switch and reload. The corrected PDF was also imported through the public file picker and displayed clean punctuation. No application warning/error entries were captured in the final browser log inspection; an earlier Chrome extension error was unrelated to application code.

## Previously published Orion release

The Orion application source is GitHub commit `2a5b6cf4d1c0ee466c287c4148f07a102ca121ef`. Its complete source tree was imported unchanged into `artifacts/arctalent-release-2a5b6cf` in Replit. A Git tree comparison confirmed that the imported application matches that source commit.

The workspace's web artifact uses Next.js for both the interface and all five API routes on port 23585. Its production build installs the release's locked dependencies with `npm ci --workspaces=false` before building. The previous runtime and launch configuration remain available for recovery.

## Observed results

- All **22 unit tests** passed inside Replit.
- Production Webpack build and TypeScript checking passed inside Replit.
- All **14 production API integration checks** passed against a temporary server inside Replit, including parsing the actual synthetic PDF fixture.
- Default extraction used labelled local matching; no RunPod model was configured.
- The artifact TOML parsed successfully and points to the current release.
- Replit's cloud publishing build, automatic security checks, bundle and promotion stages completed. The Publishing tool reports **Live** with public access.
- All **14 production API integration checks** also passed against the public HTTPS URL without credentials, including synthetic PDF parsing.
- Public browser checks confirmed the Orion interface, moderate-to-rapid destination change with the shared foundation retained, the dated replay with explicit score changes, and the eight-worker SME view. No browser warning/error entries were captured. The demo was reset to its starting profile afterwards.
- A public-source refresh through the deployed `/api/signals` route returned 100 Arbeitnow job records and 12 arXiv research records during verification.

The runtime history was exported from Replit, verified with `git bundle verify`, imported locally and pushed to the [replit-runtime branch](https://github.com/MantouOP/ArcTalent/tree/replit-runtime), commit `b4c0c05875baa957f2ba365604e98ef1db78ea81`. Its [GitHub Actions run](https://github.com/MantouOP/ArcTalent/actions/runs/39889898689) passed. GitHub `main` remains the canonical root-level Next.js source; the runtime branch records Replit's existing workspace layout.

## Runtime commands

From the Replit workspace root:

```sh
npm --prefix artifacts/arctalent-release-27648ef ci --workspaces=false
npm --prefix artifacts/arctalent-release-27648ef run build
npm --prefix artifacts/arctalent-release-27648ef run start -- --port 23585
```

For development, use `npm --prefix artifacts/arctalent-release-27648ef run dev -- --port 23585`.

## Publishing and submission evidence

**[Live ArcTalent demo](https://arc-talent--emmanuelheng.replit.app/)** — verified publicly on 24 October 2026. Replit reports Live, public access, Autoscale and the Asia region. The [current live screenshot](images/cv-import-live.jpg) records working CV import and editable profile fields. Use this URL for the working-prototype field and the team project URL for project-history evidence.

The original publishing attempt passed build/security/bundling but stayed at Promote for 16 minutes. It was cancelled and retried once. The retry completed promotion after a further delay, without application or launch-configuration changes. The temporary workspace test port was confirmed closed. That original publication used source `2a5b6cf`; the acceptance release is recorded above.

The account displays a **29-day expiry** for its Starter publication. No paid upgrade was purchased. Activate the organiser-provided Replit benefit or review the hosting arrangement before that expiry if the app must remain available longer.

The supplied Participant Handbook, section 9.1.1, requires Replit to be part of the solution. Section 10.6 accepts a live deployment URL, a team project link with project history, or the stated credit-usage evidence as proof. Replit publication is therefore one accepted proof option. The separate working-prototype link must still be accessible to judges.

## Recovery history

The original import began a PNPM workspace migration that stopped before a working preview. The scaffold and source backup were retained. On 22 October, the original Next.js source from commit `143a0cb` was restored to `artifacts/arctalent-next`; its 14 tests, production build and 12 API checks passed. Recovery commit `ca44adc` is now preserved in the pushed runtime branch.

Replit's development Preview was previously gated by the account. The Project workflow and development browser preview have not been claimed as verified by the production API checks.
