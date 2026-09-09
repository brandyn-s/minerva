# Selected regroup preview

Branch: feat/regroup-selection
Worktree: /Users/brandyn.schult/code/minerva-regroup-selection
Base: 50fd2a0; changes uncommitted.

## Outcome
Constellation grouping controls move to the upper left, freeing the Minerva corner.
Regroup selected (or all when nothing is selected) opens a left preview panel.
The existing themes endpoint receives only the chosen cards. Apply changes the
selected memberships; unaffected cards and theme slots retain their positions.
Cancel, request cancellation, retry, stale-source protection, and Undo are included.
Apply announces completion; View regrouped ideas includes affected theme headings.
Undo restores the camera as well as membership and layout. Full regroup replaces
old slots; selected regroup reuses emptied slots without moving other ideas.
Talk opens through the existing launcher. Preview and card review lists scroll.
No new persistence or provider implementation is introduced.

## Evidence
npm run check: lint, types, unit tests, production build.
120-node unit coverage verifies 22 selected and 98 untouched memberships/positions,
full regroup compaction, and empty-slot reuse.
In-app browser with synthetic theme responses: preview, Apply, Undo, Cancel, Talk.
See design-qa.md for scope and visual evidence. No paid model calls.
Live provider quality and dense-browser performance were not measured.
Local provider configuration is linked from the existing main checkout.

## Startup and next role
npm run dev -- --port 4320
Production: npm run start -- --port 4322
Fixture-response review proxy: http://127.0.0.1:4323/ (temporary local test process).
Live-endpoint application: http://127.0.0.1:4322/.
Next role: owner review; no commit, push, merge, or deployment performed.
The original checkout had concurrent edits, so final checks use this isolated copy.
