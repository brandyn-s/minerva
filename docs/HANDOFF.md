# Remove card decision and evidence metadata

Branch: `fix/remove-card-metadata`, based on `origin/main` at `f184531`.
Worktree: `/Users/brandyn.schult/code/minerva-card-metadata-release`.

## Outcome
Cards no longer carry decision/evidence status fields. Catalogue, inspection,
comparison, and Markdown downloads omit them; decision controls are removed.
Provenance, contributions, relationships, and current layout/navigation remain.
Old browser saves migrate and discard retired fields without losing provenance.
Shared card producers and graph readers match the simplified type; no DB migration.

## Verification
`npm run check` passed: lint, typecheck, 15 tests, and production build.
`scripts/verify-card-metadata.mjs` passed against the production build: legacy
restore, catalogue, inspection, download, provenance, and cleaned browser save.
No live model calls are needed for this change.

## Release and next role
Owner authorized commit, merge, and production deployment.
Use the PR checks before merging; verify the stable URL after deployment.
Production: https://minerva-eight.vercel.app/.
Local start: prefix commands with `npx --yes --package=node@24.20.0 --package=npm@12.0.2`,
then run `npm run build` and `npm run start -- --port 54426`.
Next role: owner inspects the released cards; no critic requested.

## Voice canvas continuity release
Live focus follow-up (`fix/voice-live-focus`, uncommitted): voice context updates
when cards change or users inspect, focus, select or deselect cards; "this one"
resolves to the current focus and "these" to the selection without reconnecting.
Full checks and mocked browser context-update regression passed; `/tmp/minerva-live-focus`.
Local production preview port 3301. This follow-up is not deployed.
Active voice survives card inspection hiding Talk; reopening retains controls and transcript.
Explicit Talk close, Escape and End voice mode still end the session.
Branch `fix/voice-canvas-continuity`; worktree `/Users/brandyn.schult/code/minerva-voice-canvas`.
`npm run check` and focused mocked voice replay passed; artifacts `/tmp/minerva-voice-release`.
Production startup: `npm run start -- --port 3299`; replay with `MINERVA_VOICE_ONLY=1`.
Owner authorized merge and deployment; verify hosted behavior, then owner review.
