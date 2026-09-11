# Expedition operation

Select one or more ideas, optionally add a direction, and choose Start expedition.
The selection supplies exact source revisions; the current workspace brief supplies
context. Canonical source snapshots remain complete; model prompts use explicitly
marked excerpts when content is large. Known constraints supplied through the start contract are retained. No
extra model call invents constraints or interprets a separate setup form.
Minerva schedules Wander, Weave, Develop and assessment through the shared operators.
The first operation uses the selected material; multiple selected ideas seed Weave.
Later independent roots share the brief/model and are labeled accordingly.

Three model-generated direction buttons load from the selected material and brief.
Choosing one fills the editable direction; it does not start a run. Responses are
cached for unchanged context during the browser session. Suggestion generation is
a separate bounded model call (800 output tokens); it does not spend the run
allowance. Failure leaves free exploration and custom directions available.

The form exposes a remembered overall spending limit in a collapsed control,
not model settings, policies or per-call accounting. The default limit is $6;
a lower $1–$6 limit reduces the system's initial 12-call allocation. Generation
and assessment share that allocation. Pause/Stop remain available during a run.
Reassessment and interventions explicitly show their additional maximum allowance.

Automatic generation stops after three consecutive drafts have near-identical
summaries and bodies (normalized bigram similarity of at least 90% in both).
Titles do not count as progress. The third draft is assessed before stopping;
all results and readings remain available. This is a bounded textual repetition
guard, not a semantic novelty judgment or evidence that the goal was achieved.
The guard is reconstructed from committed records after restart. Explicitly
funded interventions and reassessments remain available after this stop.


## Hosted ownership and execution

Expedition data uses the existing Neon integration through
`EXPEDITION_DATABASE_URL`, in its own `expedition` schema. Editable atlas data
stays in IndexedDB. Vercel Workflow dispatches bounded steps independently of the
browser. Production builds use webpack: the tested Vercel Turbopack build could
not resolve Workflow's loader. Development can continue using Turbopack.

Run ownership uses a random HttpOnly, same-site browser cookie. Another browser
cannot list/read/control those records; clearing that cookie loses access unless
an operator restores it. This is browser continuity, not cross-device account login.
API pages remain bounded; full evidence is retrieved only when requested.

Postgres row locks serialize call admission and controls. Reservations reject stale
call sequences or budgets so a follow-up cannot fund already planned work. Stop
rejects late commits; Pause permits an in-flight completion. Expired calls become
uncertain and retain their allowance instead of being replayed. Workflow retries
re-read this state. SQLite remains available for the separate local worker. Each local worker processes
runs sequentially on its connection; separate worker processes can run in parallel.

## Setup and verification

Run once with the correct environment loaded:

```sh
node --env-file=.env.local scripts/setup-expedition-store.mjs
```

The setup only creates the isolated schema/tables/indexes. It does not migrate or
delete older Minerva data. Vercel supplies Gateway OIDC credentials; do not ship
local env files. `.vercelignore` explicitly excludes them.

For synthetic verification, set `MINERVA_EXPERIMENT_PROVIDER=fixture` on a local
server or dedicated preview. Never use that setting for ordinary production runs.
Then run `scripts/verify-expedition-start.mjs` and `scripts/verify-expedition.mjs`
with `MINERVA_URL`. Both refuse to start against a live-provider configuration.
`node --env-file=.env.local scripts/verify-expedition-postgres.mjs` tests concurrent
connections, late results, control changes, rollback and stale-budget rejection;
it removes only its own synthetic records afterward.

Gateway calls reject prompt+system input over 100,000 UTF-8 bytes, use no automatic
provider retries, and request at most 4,096 output tokens (assessment: 2,048).
The internal $0.50 call reservation covers that envelope plus schema overhead
using the [Gateway model catalog](https://ai-gateway.vercel.sh/v1/models) checked
2026-09-10: Sonnet 5 listed input $2/M and output $10/M, with higher regional/cache
rates also below this reservation for the bounded input. It is conservative
accounting, not an estimate of actual charges or a provider-enforced billing cap.
Revalidate rates and the reservation when changing models or context bounds.

Synthetic checks establish execution correctness, not creative or scientific value.
No paid model comparison is implied by deploying the feature.

## Delivery evidence

Deployed at https://www.thalient.ai on 2026-09-10. Hosted preview verification
used synthetic providers and passed the complete generation/assessment,
intervention, reassessment, reload and inspection flow. A separate production
browser check blocked all POSTs and verified ready storage, live configuration,
selection-only Start and the remembered limit. No paid model call was made.
41 unit tests, typecheck, lint, webpack production build, four desktop/touch UI
tests and PostgreSQL concurrency/control/rollback tests pass.

## Regression verification

After `npm run build`, `npm run test:browser` starts an isolated production server
and synthetic SQLite worker, runs the full atlas replay, and removes its temporary
database and processes. `npm run test:expedition` runs the focused durable journey
with the same setup. `MINERVA_URL` uses an already running server instead; the
Expedition replay refuses live-provider configurations. No environment file or
production database is needed. Failure logs and captures go to
`evaluation-artifacts/browser` (or `MINERVA_ARTIFACTS`).

The durable journey covers frozen inputs, pause/resume/stop, the four operations,
retained challenge/intervention evidence, reassessment, stale reading coverage,
reload, camera/selection preservation and idempotent atlas inspection. Historical
browser steps, exact reading snapshots and notes survive import/reload/export;
they remain historical records rather than resumable durable runs. Readings of
durable candidates refer to immutable revisions; editing an inspected atlas copy
does not rewrite the run's evidence. A generator's success claim is not a stop
condition; the run's textual repetition and allowance guards make no success claim.

CI runs the full browser replay, worker-process restart and PostgreSQL controls,
including repeated successful drafts across connections. Shared UI checks can
reuse a local development port with `MINERVA_UI_PORT`; CI starts its own server.
