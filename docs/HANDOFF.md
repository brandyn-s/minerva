# Expedition: simple start and hosted execution

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

Three context-tailored LLM suggestions fill the editable direction; custom input remains available.

## Rectangular loading follow-up
Release branch `fix/preview-loading` in `/Users/brandyn.schult/code/minerva-development`.
Rectangular Constellation previews pulse along their bottom edge; circles retain the ring.
Reduced motion disables animation. Mocked Weave verified the loading state in `next start`.
`npm run check` (tests/build), `npm run test:ui` (4 tests), and diff checks pass.
Start with the Node/npm prefix above: `npm run start -- --port 56102`.
No paid calls or manual deployment. Owner authorized commit and merge after CI.
Selection toolbar hides unavailable actions for selection size and generation activity.
Mocked browser checks cover one card, two cards and active Weave; repository/UI checks pass.

## Weave output contract
Weave sends an exact one-card schema and one contribution per selected source
to the provider. Wander uses its requested count; root and Develop require one.
Final cardinality validation remains in place for malformed provider responses.
Regression tests cover SDK schema conversion, valid outputs and rejection paths.
Verification uses synthetic providers; no paid generation calls.
Worktree: `/Users/brandyn.schult/code/minerva-weave-count`, branch `fix/weave-output-count`.

## Shared pane layout
Card, Wander, Develop and Expedition share a compact 540px frame; Compare is wider.
Headers, close controls, typography and scrolling match; Wander toolbar is neutral.
Card tabs and footer remain. Desktop/touch pane tests and mocked generation replays cover behavior.
Owner authorized commit and merge on `fix/shared-pane-layout` after required CI.

## Card footer
Explore is primary, Develop secondary; the anchored overflow contains Edit and
Download Markdown. History stays in its tab. Download controls have no tooltip.
Desktop/touch checks cover menu bounds, targets, download, edit, Escape and History.
Worktree: `/Users/brandyn.schult/code/minerva-card-footer`, branch `fix/card-footer-menu`.
