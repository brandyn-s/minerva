# Root atlas demo handoff
Root `/` now includes Lineage, Evolution, Constellation and inspection inheritance/provenance.
Owner scope ends after merge and deployment to https://minerva-eight.vercel.app/; one operator-started Fable review follows.
- Branch: `demo/perspectives-inheritance`; base: refreshed `origin/main` at `118b095`.
- Worktree: `/Users/brandyn.schult/code/minerva`; released SHA and hosted result are in the operator response.
- No persistence, admission/budget logic, dependencies, database, workspace or Workflow changes.

## Behavior
Microphone denial explains browser site settings and Retry; Thoughts uses “Download all cards”.
Lineage retains the original layout. Evolution uses deepest-parent generation columns and creation order.
Every view shares cards, selection, comparison and Talk; cameras and manual positions are separate in memory.
Unknown-evidence and unkept cards remain visible. Lineage/Evolution switches make no requests.
Constellation calls `/api/themes` with `generateObject`, `anthropic/claude-sonnet-5`, `feature:themes`.
Its screen states the method and grouping time; named groups show reasons and cross-group associations.
Derivation/recombination edges are hidden there. Every submitted card must be assigned exactly once.
The in-memory cache tracks card IDs and SHA-256(title, body); only entering a stale view computes.
Incremental calls send changed/new cards and existing names, permitting at most one new theme.
Regroup recomputes all cards. Errors retain the prior grouping with Retry.
Inspection Inheritance lists each parent's title, stored edge contribution and contextual move title.
Provenance freezes the feature/move name, tag and source titles when root-generated cards are created.
Both sections are included in card Markdown. Prepared cards do not invent generated provenance.

## Verification
`npm run check`: lint, TypeScript, 12 tests and production build passed.
Existing replay covers generated cards across views, selection/comparison and cameras, request counts,
cache reuse, incremental edits, failed Regroup retention/Retry, group edges and Markdown sections.
Dev replay: `/tmp/minerva-perspectives-dev`; production and stable results are in the operator response.
`MINERVA_LIVE=1` full dev replay passed with exactly one real themes call using project OIDC.
Other model paths stayed mocked; no real voice call in this batch. Existing voice replay still passes.
Full input/response: `/tmp/minerva-perspectives-live/themes-live.json` (10 cards, 4 groups).

## Real themes response
The response's `groups` array, one object per line (member IDs preserved):
```json
{"name": "The Mall Brief", "reason": "The originating brief that frames all exploration of what the dead mall could become.", "memberIds": ["brief"]}
{"name": "Foundational Mall Concepts", "reason": "Independent, standalone starting ideas for the mall brief covering retail, food, tools, and flexible retail space.", "memberIds": ["retail", "food", "tools", "rotation"]}
{"name": "Repair-and-Meal Synthesis (Unassessed)", "reason": "A hybrid draft combining the food hall and tool library ideas into a repair-and-supper format, explicitly flagged as unendorsed with unresolved unknowns.", "memberIds": ["repair"]}
{"name": "Repair Concept Explorations", "reason": "Concrete drafts that build out variations of the repair theme—apprenticeships, workshop borrowing, and timed repair/meal sessions.", "memberIds": ["662587ec-98fd-41b2-aef1-f87ecf6efa97", "2304c893-12ce-4101-bebf-56f36876b8be", "2b362fef-200f-44b4-a5fc-a6513393c8cc", "2f4b7e3b-c0bf-43cf-8a36-ef2db791c58b"]}
```
Generated IDs above correspond, in order, to Repair apprenticeships, Borrow a workshop,
Cook and mend evenings, and Morning repair table (synthetic cards; grouping is actual Sonnet output).

## Startup and review
Use Node 24.20.0/npm 12.0.2 via `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
Dev: `npm run dev -- --port 3048`; replay: `MINERVA_URL=http://127.0.0.1:3048 npm run test:browser`.
Production: `npm run build`, then `npm run start -- --port 3049`; replay with that `MINERVA_URL`.
Use separate dev/build runs; after refreshing dependencies, discard stale ignored dev compiler caches.
`MINERVA_LIVE=1` allows one themes call; `MINERVA_LIVE=1 MINERVA_VOICE_ONLY=1` remains the voice-only opt-in.
Next role: operator-started Fable 5.1 at low effort, read-only, exact released candidate, C04/C07 and carry-overs.
Use docs/setup.md's bounded review prompt; no additional paid calls or feature work are authorized by this handoff.
