# Root atlas: layout controls and graph navigation
Branch: `demo-layout-navigation`, from `origin/main` at `83844e4`, integrated through `e3b9727`.
Worktree: `/Users/brandyn.schult/code/minerva-layout-navigation`.
Scope ends after merge and deployment to https://minerva-eight.vercel.app/; one operator-started Fable review follows.

## Behavior
Working-zoom cards have resize handles; positions and sizes are saved per card and perspective.
Layout controls name the next action: Undo/Redo move, resize or arrange.
Each perspective retains its last 50 layout changes across reloads, including its redo stack.
Ctrl/Cmd+Z and Shift+Z work in the field; text controls retain their native editing shortcuts.
Card text edits, generation, import and reset clear layout history and cannot be undone.
Ancestors and descendants follow only derivation/recombination edges, transitively, with cycle protection.
Focus highlights the chain and dims other cards/edges; links list the origin, then nearest to farthest relatives.
A second press clears the focus; Clear chain also clears it while following links.
Fold descendants hides the full descendant set and incident edges in every perspective, with a counted marker.
Folded thoughts remain searchable, inspectable and selectable in Thoughts; the index names every folding ancestor and offers Unfold.
Unfold restores the original positions. Folding is local, persisted and included in JSON export/import.
Version 2 adds sizes, per-perspective layout history and folded roots; version 1 saves/files migrate with empty values.
Merge remaps imported sizes/folds, clears history and reports added/skipped card counts in one line.
Reset and Replace use in-page Confirm/Keep current atlas buttons in Menu.
Current main header, Wander toolbar, compact card preview, regroup preview, text reader, plain overview nodes, association styling and thought catalogue are preserved.
Recovery copies have a list in the import area with Export and Discard; dev-mode restore shares one pending read.
No model routes, /workspaces, database or Workflow code changed. No dependencies added.

## Verification
`npm run check` and complete mocked replays passed through `npm run dev` and `next start`.
Final operator handoff supplies the exact release SHA and hosted verification.
Browser artifacts: `/tmp/minerva-layout-dev` and `/tmp/minerva-layout-start`.
Existing `scripts/verify-atlas.mjs` covers layout, transitive focus/folds, migration, merge counts and confirmations.
All model responses in replay are mocked; no live model calls authorized or made.

## Startup and next role
Use `npx --yes --package=node@24.20.0 --package=npm@12.0.2` before npm commands.
Dev: `npm run dev -- --port 3050`; production: `npm run build`, then `npm run start -- --port 3061`.
Replay: `MINERVA_URL=http://127.0.0.1:3061 npm run test:browser` (3050 for dev).
Next: operator-started Fable 5.1 at low effort, exact released candidate, read-only, C02/C03 and named carry-overs.
Use docs/setup.md's bounded launch prompt, a separate checkout/port and fresh synthetic browser data.
No paid model calls. No further batch is authorized; stop after this release.
