# Scorebook transition: local implementation candidate

Branch: `docs/scorebook-transition-batch-00`.
Worktree: `/Users/brandyn.schult/code/minerva-scorebook-transition`.
Base SHA: `6f148242c93f2cd44868c6374178ef12a8876586`.
Candidate is uncommitted; no new candidate SHA, push or deployment.
The owner authorized all remaining transition batches, extending the demo scope.

## Outcome
Batches 01–08 implement local experiment persistence, shared operations,
separate durable worker, population selection, readings, interventions,
bounded browser/model context and reproducible synthetic evaluation.
Existing Wander, Weave and Develop use the same operation contracts as Expedition.
Revision contribution history, append-only Revert and identity-aware Merge remain.
Batch 09 is complete: Scorebook archived at ed2a81c after accessible exports were recovered.
Remaining unknown historical coverage has an explicit owner disposition; services remain running.

## Evidence and limits
See [verification](scorebook-transition/verification.md) for exact outcomes.
No paid calls or fresh hosted checks were performed.
Synthetic evidence verifies software behavior, not discovery efficacy.
Separate assessment currently uses the same configured model, not independent validation.
SQLite/worker durability is local to one host; hosted durable infrastructure is absent.
Voice replay fails at the same microphone assertion on this candidate and clean base.

## Startup and next role
Use Node 24.20.0 / npm 12.0.2 via the repository npx prefix.
In two terminals set MINERVA_EXPERIMENT_DB to the same absolute private SQLite path.
Run `npm run dev -- --port 3086` and `npm run expedition:worker`.
Open http://127.0.0.1:3086 and select Expedition / Synthetic rehearsal.
Full bounded commands: [implementation](scorebook-transition/implementation.md#local-startup).
Next role: owner reviews the uncommitted Minerva candidate; Scorebook archival is complete.
Live comparison configuration is prepared but requires an explicit numeric budget.
No further implementation, commit, deployment or paid execution is granted by this handoff.

## Wander pane follow-up
Local branch `fix/wander-pane` in `/Users/brandyn.schult/code/minerva-revision-labels`.
Compact title-first Wander uses the shared header, secondary suggestion actions,
and a scrolling body with an accessible fixed close control on mobile.
Focused mocked desktop/mobile replay covers suggestions, failure/retry, hide/show,
free exploration and chosen moves. Repository and desktop/touch UI checks pass.
No paid calls. Owner authorized commit and merge after required CI.

## Rectangular loading follow-up
Local, uncommitted branch `fix/preview-loading` in `/Users/brandyn.schult/code/minerva-development`.
Rectangular Constellation previews pulse along their bottom edge; circles retain the ring.
Reduced motion disables animation. Mocked Weave verified the loading state in `next start`.
`npm run check` (37 tests/build), `npm run test:ui` (4 tests), and diff checks pass.
Start with the Node/npm prefix above: `npm run start -- --port 56102`.
No paid calls or deployment. Next role: owner checks the local visual change.
Selection toolbar hides unavailable actions for selection size and generation activity.
Mocked browser checks cover one card, two cards and active Weave; repository/UI checks pass.
