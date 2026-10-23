# Replit runtime and publishing verification

Verified on **23 October 2026** in the [team project](https://replit.com/@EmmanuelHeng/ArcTalent).

## Current release

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
npm --prefix artifacts/arctalent-release-2a5b6cf ci --workspaces=false
npm --prefix artifacts/arctalent-release-2a5b6cf run build
npm --prefix artifacts/arctalent-release-2a5b6cf run start -- --port 23585
```

For development, use `npm --prefix artifacts/arctalent-release-2a5b6cf run dev -- --port 23585`.

## Publishing and submission evidence

**[Live ArcTalent demo](https://arc-talent--emmanuelheng.replit.app/)** — verified publicly on 23 October 2026. Replit reports Live, public access, Autoscale and the Asia region. The [live screenshot](images/replit-live.jpg) records the deployed interface. Use this URL for the working-prototype field and the team project URL for project-history evidence.

The first publishing attempt passed build/security/bundling but stayed at Promote for 16 minutes. It was cancelled and retried once. The retry completed promotion after a further delay, without application or launch-configuration changes. The temporary workspace test port was confirmed closed. The deployed application source remains `2a5b6cf`.

The account displays a **29-day expiry** for its Starter publication. No paid upgrade was purchased. Activate the organiser-provided Replit benefit or review the hosting arrangement before that expiry if the app must remain available longer.

The supplied Participant Handbook, section 9.1.1, requires Replit to be part of the solution. Section 10.6 accepts a live deployment URL, a team project link with project history, or the stated credit-usage evidence as proof. Replit publication is therefore one accepted proof option. The separate working-prototype link must still be accessible to judges.

## Recovery history

The original import began a PNPM workspace migration that stopped before a working preview. The scaffold and source backup were retained. On 22 October, the original Next.js source from commit `143a0cb` was restored to `artifacts/arctalent-next`; its 14 tests, production build and 12 API checks passed. Recovery commit `ca44adc` is now preserved in the pushed runtime branch.

Replit's development Preview was previously gated by the account. The Project workflow and development browser preview have not been claimed as verified by the production API checks.
