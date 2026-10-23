# Replit runtime verification

Verified on 22 October 2026 in the team project: https://replit.com/@EmmanuelHeng/ArcTalent .

The import began converting the original Next.js app into a PNPM workspace. That migration stopped before a working preview was available. Its scaffold and source backup were preserved during recovery.

The tested original source from GitHub commit `143a0cb` was restored to `artifacts/arctalent-next` in that Replit workspace. The web artifact launch configuration was updated to use Next.js on port 23585, with Next.js serving both the interface and API routes. The superseded API artifact configuration was retained as a backup.

## Observed results inside Replit

- Node.js 24.13.0.
- All 14 engine and evidence tests passed.
- The production Webpack build passed, including all five API routes.
- Manual Next.js server startup succeeded.
- All 12 integration checks passed against that production server, including parsing the real synthetic PDF fixture.
- Temporary verification servers were stopped after testing.
- Extraction remained in the explicitly labelled local matching mode; no RunPod model was configured.

## Runtime location and commands

In the Replit Shell, from the workspace root:

```sh
npm --prefix artifacts/arctalent-next ci --no-audit --no-fund --workspaces=false
npm --prefix artifacts/arctalent-next run dev -- --port 23585
```

The Replit recovery was committed locally on branch `replit-runtime`, commit `ca44adc`, with runtime notes in `ARCTALENT_REPLIT.md`. A Git bundle export named `ArcTalent-replit-runtime.bundle` was created in the Replit workspace for transferring that branch through an authenticated Git connection.

## Remaining verification

Replit browser Preview access was restricted by the account, so the browser journey and Project workflow restart remain unverified there. No public Replit deployment was published. The runtime branch's push from Replit failed authentication, and its export download did not complete before browser access disconnected. The runtime recovery commit is therefore **not yet on GitHub**. GitHub `main` remains the canonical Next.js application with the separately verified local and CI results.

Once project access is available, export the runtime bundle, verify it with `git bundle verify`, import the `replit-runtime` branch and push it through the team's authenticated Git connection. Then check its CI, start the Project workflow and repeat the browser demonstration before treating Replit setup as complete.
