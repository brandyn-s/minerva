# Plain overview nodes

Release branch: `fix/plain-overview-nodes`, based on main `fe57f75`.
Worktree: `/Users/brandyn.schult/code/minerva-wander-toolbar`.
Scope: remove Seed, A/B/C, compound ancestry codes, and generated initials from overview nodes.

## Behavior
Overview circles retain their colors, external titles, selection, drag, and connection behavior.
Existing zoom-dependent title visibility is preserved.
Compact markers are plain; accessible full titles remain on their controls.
No generation, data, lineage, or backend changes.

## Validation and release
Run `npm run check` and the existing browser replay; its overview assertion now expects only the title.
User authorized commit, merge, and deploy after validation and required GitHub CI.
Stable URL: https://minerva-eight.vercel.app/.
Prefix commands with `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
Local start: `npm run build`, then `npm run start -- --port 3189`.
Replay: `MINERVA_URL=http://127.0.0.1:3189 npm run test:browser`.
Next role: owner inspects the deployed result.
