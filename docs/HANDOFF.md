# Root atlas: browser state and JSON backups
Branch: `demo-browser-state-release`, started from `origin/main` at `09d0396`, rebased onto `2314038`.
Worktree: `/Users/brandyn.schult/code/minerva-browser-state`.
Release SHA and stable deployment evidence are in the operator handoff.
Scope ends after merge and deployment to https://minerva-eight.vercel.app/; one operator-started Fable review follows.

## Behavior
Root atlas state is saved per browser in IndexedDB, with a 200 ms debounce and a page-hide flush.
Version 1 includes cards/provenance/text, every edge, perspective positions/cameras, selection, grouping cache, Talk and expedition histories/readings/notes.
Reload restores a valid save; a missing save starts the six-card fixture. Interrupted expeditions retain completed work without resuming model calls.
Reset to fixture confirms before discarding current state. Invalid saves are preserved under `root-atlas-recovery-*` before the fixture loads with a notice.
IndexedDB database: `minerva-atlas`; object store: `saves`; active key: `root-atlas`.
Export atlas downloads `minerva-atlas.json` in the same integer-versioned shape.
Import validates the complete shape and references with zod before offering Replace or Merge.
Replace restores the backup. Merge hashes title/summary/body, gives distinct cards and edges new IDs, remaps references and skips duplicates.
Merge keeps local cameras, grouping and Talk, and retains imported expedition history. Markdown downloads are unchanged.
Constellation fits after measured nodes commit, including the whole tall column. Group timestamps include the date.
Stop says which in-flight step was cancelled. New expedition keeps prior runs available in Expedition history.
No new dependencies, server persistence, identity, admission or budget logic. No database, /workspaces or Workflow changes.

## Verification
Full mocked dev replay passed: persistence, export/Replace/Merge, invalid files, recovery, tall-column fit and cancelled-step text.
The existing replay also covers Markdown, desktop/mobile interaction and simulated voice; no live model calls were made for this batch.
Artifacts: `/tmp/minerva-browser-state-dev` and `/tmp/minerva-browser-state-start`.
`npm run check` and the complete mocked replay passed through both `npm run dev` and `next start`.

## Startup and next role
Use `npx --yes --package=node@24.20.0 --package=npm@12.0.2` before npm commands.
Dev: `npm run dev -- --port 3048`; production: `npm run build`, then `npm run start -- --port 3049`.
Replay: `MINERVA_URL=http://127.0.0.1:3049 npm run test:browser` (3048 for dev).
Next: operator-started Fable 5.1 at low effort, exact released candidate, read-only, C01/C14 plus named carry-overs.
Use the bounded launch prompt in docs/setup.md; fresh browser data and a separate port. No paid calls are authorized for this review.
Stop after this release; no further batch is authorized.
