# Population discovery implementation

## Ownership

Wander creates related ideas; Weave combines sources; Develop appends revisions to one idea; Expedition selects and coordinates those operations. Searchlight is only historical reference material. No Scorebook source implementation was copied into the application.

The browser owns editable atlas state, layout, conversation and materialized results. SQLite owns immutable experiment input snapshots, operations, candidate revisions, assessments and readings, plus mutable run/attempt/control state. Materialization never overwrites a locally diverged source. Every experiment outcome is available without a keep click; the atlas materializes only requested items, avoiding a node per historical attempt.

Source snapshots and other exposed context are distinct. Operation manifests contain the exact system and prompt sent, version, model and output bound; no credentials. Develop prior steps identify their actual source revisions. Historical exports remain readable through additive v3 fields. Unknown past contributions remain unknown.

## Local startup

From `/Users/brandyn.schult/code/minerva-scorebook-transition`, in two terminals:

```sh
MINERVA_EXPERIMENT_DB="$PWD/.minerva/experiments.sqlite" npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3086
```

```sh
MINERVA_EXPERIMENT_DB="$PWD/.minerva/experiments.sqlite" npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run expedition:worker
```

Open Expedition and select **Synthetic rehearsal** to verify without model calls. The worker is independent of the browser and request lifetime. SQLite uses WAL and owner-private file/directory permissions. Never put the database on an ephemeral serverless filesystem or commit it. The local adapter rejects Vercel execution and non-loopback/cross-origin requests. Production durable storage and worker hosting are not configured or verified.

Live workers require all of: an authorized task budget, existing Gateway credentials, `MINERVA_EXPERIMENT_LIVE=1`, and `MINERVA_GATEWAY_CALL_CEILING_MICROS` set to an independently verified conservative maximum for the configured model/input/output envelope. A run must reserve at least that amount per call. Direct calls with local journaling require `MINERVA_DIRECT_CALL_ALLOWANCE_MICROS`. These are accounting reservations, not provider-enforced billing caps. Unknown/failed charges retain their reservation; reported token usage is stored when available. No live calls were made during this implementation.

## Query/operation surface

- `GET /api/expedition/runs`: latest 100 run summaries.
- `GET /api/expedition/runs?id=UUID&kind=candidate&after=0&limit=30`: cursor page; kind also supports operation, assessment and reading.
- `GET /api/expedition/runs?id=UUID&candidateId=UUID`: exact candidate, operation and up to five latest assessments.
- `GET /api/expedition/runs?id=UUID&q=TEXT&after=0&limit=30`: bounded text search over recorded candidates.
- `POST`: create, pause, resume, stop, analyze, reassess (+1 explicitly requested call), intervene (+2 explicitly requested calls), or bounded allocation probe (no model calls). Schemas live in the route/contracts modules.

There is no public corpus access. API and browser expose bounded previews, while immutable full records remain in SQLite. Assessment disagreement stays in the historical record; the latest judgment is the current selection lens. No destructive retention endpoint exists. Export/backup the private database with SQLite backup facilities or with all writers stopped; removing sensitive records requires an explicit separate disposition, including backups and browser copies.

## Verification commands

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run test:ui
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run test:expedition-process
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run test:expedition-scale
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run eval:expedition
MINERVA_URL=http://127.0.0.1:3086 npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run test:expedition
```

The last command needs the web process and synthetic worker on the same database. Focused Develop and voice replays use existing scripts/verify-atlas.mjs flags; see the final handoff for actual results. Synthetic outputs and screenshots are ignored under evaluation-artifacts/transition. They are not research findings.

## Limits

The archive/analysis algorithms are intentionally simple versioned baselines: normalized assessor mechanisms and optional categorical behavior coordinates. They do not learn a representation or prove attraction. The assessor is a separate call, presently to the same configured model. The allocation model is an explicit toy formalization. Research efficacy, calibration, global novelty, real-world feasibility and hosted durability are unvalidated.

Some old all-in-one atlas replay sections still describe the removed browser-only Expedition flow. The new connected Expedition replay exercises its replacement; do not present the old flow as current acceptance criteria.
