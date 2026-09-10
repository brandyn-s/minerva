# Expedition: simple start and hosted execution

Branch: `feat/expedition-simple-start`, integrated main `33402bf`.
Worktree: `/Users/brandyn.schult/code/minerva-scorebook-transition`.
The prior population extension is merged in PR #92.

Select ideas, optionally add a direction, then Start. Source revisions and the
workspace brief are automatic. Policy, execution provider and call accounting
are system-owned; an optional remembered overall limit remains available.

Hosted execution uses the existing Neon resource in a separate expedition schema
and Vercel Workflow. SQLite remains supported locally. Cookie ownership isolates
browser runs. Exact sequence/budget checks reject stale reservations.

Verification: 42 unit tests, typecheck, lint and local production build pass;
four desktop/touch UI checks pass. Native PostgreSQL concurrency/control/rollback
and stale-budget checks pass. Connected synthetic workflow, intervention,
reassessment, reload and materialization pass. Selection-only start and cross-browser
isolation pass; desktop/mobile captures are in ignored evaluation-artifacts/simple-start.
Suggestion follow-up: one bounded live LLM call returned three selectable directions.
Reopening reused them; no expedition or efficacy experiment was started.

Startup: `npm run dev -- --port 3086` with EXPEDITION_DATABASE_URL loaded.
Synthetic rehearsal: set MINERVA_EXPERIMENT_PROVIDER=fixture on a test server.
One-time schema setup and bounded test commands: [Expedition](expedition.md).
Production build uses webpack after a Vercel-only Workflow loader resolution failure.
Production: https://www.thalient.ai (deployment minerva-nell7x3un-thalient.vercel.app).
Hosted synthetic preview passes the complete run and browser-isolation checks.
Production read-only browser check passes: configured storage, live provider,
selection-only Start, one optional direction and remembered limit; zero API writes.
Next role: owner reviews the delivered experience; no new research scope is opened.

Three context-tailored LLM suggestion buttons fill the editable direction;
custom input remains available. Local checks and live verification pass.

## Wander pane follow-up
Local branch `fix/wander-pane` in `/Users/brandyn.schult/code/minerva-revision-labels`.
Compact title-first Wander uses the shared header, secondary suggestion actions,
and a scrolling body with an accessible fixed close control on mobile.
Focused mocked desktop/mobile replay covers suggestions, failure/retry, hide/show,
free exploration and chosen moves. Repository and desktop/touch UI checks pass.
No paid calls. Owner authorized commit and merge after required CI.

## Weave output contract
Weave sends an exact one-card schema and one contribution per selected source
to the provider. Wander uses its requested count; root and Develop require one.
Final cardinality validation remains in place for malformed provider responses.
Regression tests cover SDK schema conversion, valid outputs and rejection paths.
Verification uses synthetic providers; no paid generation calls.
Worktree: `/Users/brandyn.schult/code/minerva-weave-count`, branch `fix/weave-output-count`.
