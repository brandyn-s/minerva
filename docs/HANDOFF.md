# Atlas revision label fix

Branch: `fix/revision-label-overlap`, based on `origin/main` at `6f14824`.
Worktree: `/Users/brandyn.schult/code/minerva-revision-labels`.
State: owner authorized commit and merge after required checks.

## Outcome
Zoomed-out Atlas markers show titles without revision badges, preventing the
revision count from overlapping the title. Expanded cards retain their count,
aligned with the title and summary inset. History and Develop data are unchanged.

## Verification
`npm run check` and `npm run test:ui` pass (desktop and touch).
Focused Develop browser replay verifies title-only overview labels, expanded
badge placement, revision history, reuse, Stop, reload and export/import.
Provider responses are mocked; no paid model calls were made.

## Local startup and next role
Use Node 24.20.0 / npm 12.0.2 via the repository npx prefix.
Production build: `npm run build`, then `npm run start -- --port 56113`.
Replay: `MINERVA_URL=http://127.0.0.1:56113 MINERVA_DEVELOP_ONLY=1 node scripts/verify-atlas.mjs`.
Next role: operator completes the authorized commit and merge after required CI.
