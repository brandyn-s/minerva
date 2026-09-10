# Root atlas development over time

Branch: `feat/card-development`, based on `origin/main` at `60bf8e6`.
Worktree: `/Users/brandyn.schult/code/minerva-development`.
Workspace removal (#86) is included. Owner authorized merge and stable deployment.

## Outcome
C04: every card carries an append-only revision history in the browser save.
History shows newest-first title/body word diffs, time, cause and complete content.
Revert appends a revision. Edges retain their original sourceRevision and
inspection flags parents that have moved on, with historical source excerpts.
JSON import/export and Markdown retain history; Merge preserves distinct histories.
Save version 3 migrates versions 1/2 to one current-content revision and no intents.
C05: Develop performs 1–3 in-place steps under a reusable intent.
Each step calls `/api/develop` once, Sonnet 5, tag `feature:develop`.
Completed revisions survive Stop/failure; interrupted responses cannot append later.
Intents persist in browser saves and JSON exports. Notes are shown as model claims.
No persistence beyond the browser, dependencies, admission or budget logic added.

## Real Develop
`MINERVA_LIVE=1 MINERVA_DEVELOP_ONLY=1` ran on the local dev server.
Intent: Make this cheaper to pilot. Source: A food hall, revision 1.
Step 1 (revision 2): A pop-up food stall cluster.
Model note: replace a permanent hall with rotating stalls to reduce buildout/lease costs.
Step 2 (revision 3): A weekend-only pop-up food stall duo.
Model note: reduce vendors/days and use a hosted site to remove the lease/infrastructure.
These are model claims; demand, costs and feasibility were not verified.
Local evidence: `/tmp/minerva-development-live/develop-live.json` and `.png`.

## Verification and next role
`npm run check` and `npm run test:ui` pass. Full atlas replay passes in dev and next start.
Focused C04/C05 replay covers retained completed steps on Stop and late-response rejection.
Use Node 24.20.0 / npm 12.0.2 via the repository npx prefix.
Dev: `npm run dev -- --port 56100`.
Production: `npm run build`, then `npm run start -- --port 56101`.
Replay: `MINERVA_URL=http://127.0.0.1:56101 node scripts/verify-atlas.mjs`.
Focused replay adds `MINERVA_DEVELOP_ONLY=1`; live adds `MINERVA_LIVE=1`.
Next role: operator starts the single Fable review of the merged candidate.
Stop after stable deployment; no subsequent demo batch is authorized here.
