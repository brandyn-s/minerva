# User-directed seed and Expedition regression repair

State: implemented locally; uncommitted, not deployed.
Base SHA: 43581f54f5f0696818259643d9e67ed40552c9d3 (PR #100).
Branch: `fix/expedition-regressions`.
Worktree: `/Users/brandyn.schult/code/minerva-expedition-regressions`.

Menu → Start fresh replaces the browser atlas with one selected brief card from
the user’s seed. Replacement is explicit; cancellation preserves the atlas.
The seed persists across reloads, titles the atlas and supplies the brief context.
Reset to fixture remains available. Existing server runs are retained.

Automatic generation stops after three consecutive near-identical summaries and
bodies, after the third assessment. Results remain inspectable and explicit
interventions/reassessments can continue. The guard uses persisted records and
preserves concurrent controls. It is a textual repetition guard, not a judgment
of semantic novelty or observed goal completion.

The local SQLite worker now processes runs sequentially per connection, fixing
nested async transactions when several runs were runnable. Separate workers can
operate concurrently. PostgreSQL continues to use its existing row locks.

The full browser replay follows the current durable API and retains coverage for
frozen inputs, pause/resume/stop, shared operations, challenge/intervention,
reading freshness, legacy-history import/export, camera, selection and inspection.
Other stale selectors now match current Card, toolbar and Merge behavior.
CI runs the full replay with an isolated production server and synthetic worker,
worker-process restarts and PostgreSQL controls. Failure evidence is uploaded.

Verification: 48 unit tests, lint, typecheck and production build pass. All ten
desktop/touch UI tests pass, including seed cancellation, replacement, reload
and fixture restoration. The complete production browser replay, focused
Voice replay, selection-only start, multi-run worker restart and native PostgreSQL
17 controls/stagnation checks pass. No paid model runs or hosted changes.
Artifacts: `evaluation-artifacts/browser`, `evaluation-artifacts/stagnation.png`.

Startup/check: use Node 24.20.0 / npm 12.0.2, run `npm run check`, then
`npm run test:browser` (starts and cleans up its synthetic server/worker/database).
Focused journey: `npm run test:expedition`. For a running dev server, use
`MINERVA_UI_PORT=<port> npm run test:ui` to reuse it.
Next role: owner reviews the local diff. Commit, push and deployment are pending.
Implementation and verification boundaries: [Expedition](expedition.md).
