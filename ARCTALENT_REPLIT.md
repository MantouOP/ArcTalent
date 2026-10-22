# ArcTalent Replit runtime

This branch preserves the Replit import scaffold and the recovery from its incomplete migration. The canonical Next.js app remains on GitHub main: https://github.com/MantouOP/ArcTalent .

## App location

The tested app is in `artifacts/arctalent-next`, restored from canonical commit `143a0cb`. The original migration and its `.migration-backup` are preserved. The web artifact configuration points to Next.js on port 23585; the superseded API artifact configuration is retained with a `.disabled-next-backup` suffix. Next.js serves the UI and all five API routes.

From the Replit Shell:

```sh
npm --prefix artifacts/arctalent-next ci --no-audit --no-fund --workspaces=false
npm --prefix artifacts/arctalent-next run dev -- --port 23585
```

## Verified in Replit on 22 October 2026

- Node.js 24.13.0.
- 14 engine/evidence tests passed.
- Production Webpack build passed, including all five API routes.
- Manual Next.js startup succeeded.
- 12 API integration checks passed against the Replit production server, including the actual synthetic PDF fixture.
- The temporary verification server was stopped after testing.

The default extractor is labelled local alias matching. No RunPod model or API key was configured.

## Remaining platform restriction

The Replit UI shows exhausted daily Agent credits and an explicit Preview restriction: full preview access requires Core. Browser verification and publication in Replit remain unverified. Clearing the account restriction is a user account action. No plan upgrade or public deployment was performed during this recovery. The Project workflow still needs a successful start and browser check once access is available.

## Source updates and licenses

Make product changes on canonical GitHub main, then update the runtime copy deliberately and rerun tests. Do not merge this platform scaffold wholesale into main. The restored ArcTalent source includes its Apache-2.0 LICENSE; scaffold and dependencies retain their own licenses. Substantial Codex and Replit Agent assistance must be declared accurately.
