# Wander toolbar consolidation

Release branch: `feat/wander-toolbar`, based on main `7002d7a`.
Worktree: `/Users/brandyn.schult/code/minerva-wander-toolbar`.
Scope: requested Wander consolidation and compact selection-toolbar dismissal.
Existing main features are preserved; unrelated edits in the original checkout are excluded.

## Behavior
Wander opens suggested next steps for one selected card.
Choosing a suggestion develops one card; Explore freely generates two or three directions.
Wander is highlighted before Compare, Expedition, and Weave.
Card footers are removed; selection is beside the drag handle.
The top-right X keeps a 44px hit area and Clear selection label/tooltip.
No backend, persistence, or model changes.

## Validation
`npm run check` passed (lint, typecheck, tests, production build).
Full mocked browser replay passed on the initial release candidate, including mobile gestures and Constellation fit.
Latest main Expedition styling is preserved in this release.
`node scripts/verify-wander.mjs` passed at 1399px and 390px with mocked responses and no page errors.
Focused artifacts: `/tmp/wander-release-focused`; design QA: `design-qa.md`.
Model responses were mocked; no live provider validation is claimed.

## Release and startup
User authorized commit, merge, and production deployment.
GitHub CI must pass before merge; Git integration deploys main to Vercel.
Stable URL: https://minerva-eight.vercel.app/.
Local production preview: http://127.0.0.1:3188/.
Prefix commands with `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
Start: `npm run build`, then `npm run start -- --port 3188`.
Focused replay: `MINERVA_URL=http://127.0.0.1:3188 node scripts/verify-wander.mjs`.
Next role: owner inspects the deployed result; no additional work is implied.
