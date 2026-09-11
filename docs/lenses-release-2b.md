# Using a lens for exploration

Open a saved Expedition → Edit expedition lenses → choose a reviewed lens →
Use for exploration. Pause a running expedition and wait for its in-flight call
to settle. Preview the population, apply it, then resume explicitly. Applying
does not dispatch work or increase the existing call or spending allowance.

The preview uses the complete candidate corpus and current assessments. It shows
entering/leaving candidates, retained representatives and reasons, eligible and
omitted groups, protection changes, capacity, uncertainty, and the exact lens
revision and selection step. Candidates leaving the population remain archived.
Protection can cover at most capacity minus one candidates, including currently
ineligible protections; it never overrides missing or violated assessments.

## Selection contract

`reviewed-lens-v1` retains eligible protections first, then one representative
from each remaining group while slots remain. A chosen eligible representative
takes precedence; otherwise preserved constraints and supported actionability
rank first, with candidate ID breaking ties. Group IDs define stable order;
the recorded run seed plus selection step rotates opportunity when capacity
omits groups. Fewer groups can leave slots unused. The existing root, Wander,
Develop and Weave schedule remains in force.

Applied groups copy exact candidate references from one reviewed run lens.
Unassigned and later candidates use distinct provisional mechanism buckets,
even when a mechanism label matches a human group. Reassessment affects
eligibility, never the copied membership. Subsequent lens edits require another
explicit preview/application to change exploration.

Application saves an immutable configuration and application record with the
new active population in one transaction. Configuration records include the
complete corpus's assessment references at preview time. Changes to the run,
corpus, assessments, attempts or lens invalidate the preview. Replaying a
successful application is idempotent, including after explicit resume.
Expired calls retain their reservations as uncertain and cannot commit later.

Worker reservations compare the planned selection ID, control version, corpus
version, call sequence and allowance under the run lock. Every configured
generation records policy/lens/configuration versions, selection step, retained
population, exact parent candidate IDs and reasons. Explicit interventions identify
their separately chosen source. Readings use the applied grouping and identify
provisional groups separately. Original candidates, operations and readings stay
immutable; candidate detail exposes its generation's Selection context.

## Deployment and local startup

Vercel Workflow runs remain pinned to their originating deployment. The database
writer guard prevents older deployments from reserving calls or overwriting an
applied population. Before publishing this slice, run with the existing Expedition
connection and the documented Node version:

```sh
node scripts/setup-selection-guard.mjs
```

This adds a function/trigger in the existing `expedition` schema; it does not
rewrite run records. New installations include it in the standard store setup.
Application refuses to save a selection if the hosted guard is absent. New
transactions identify the supported writer version; old deployments fail before
admitting a call on a configured run. Runs without applied selection continue
with their existing policy. Resume from the current deployment starts current code.
The guard is tested in an isolated Neon schema and installed in the existing
application schema for this release.

For SQLite, restart the local worker with current code; its connection registers
the writer function required by the local trigger. Configure a private database
with `MINERVA_EXPERIMENT_DB` for both app and worker. Atlas-only dev mode does
not configure an Expedition store. Use fixture mode for synthetic local testing.

## Verification and limits

- `npm run check`: lint, TypeScript, 60 unit tests and production build.
- `MINERVA_UI_PORT=3088 npm run test:ui`: 20 desktop/touch journeys, including
  preview, stale rejection, protection, explicit apply/resume and visible header.
- `node scripts/verify-selection-api.mjs`: real production-built browser/API/
  SQLite path with 65 candidates, concurrent application, stale edits, ownership,
  origin checks, exact population and applied readings after reload; zero calls.
- `node scripts/verify-selection-stores.mjs`: SQLite policy, reservations,
  rollback, exact parents, stale/older writers and configured readings.
- The same script with `--postgres` runs against the existing Neon connection
  in a unique disposable schema and removes that schema afterward. Separate
  connections exercise concurrent application and in-flight reservation races.
- `git diff --check` verifies patch whitespace.

Release 2B is merged in [PR #103](https://github.com/brandyn-s/minerva/pull/103)
as `1e5a90d58a81b25d2268d737277222a8e53dbda3`; CI and production deployment
passed. The installed application guard and deployed API passed a synthetic
owned-run check: eight candidates, two applied representatives, still paused,
zero calls. The check removed its own records afterward.
Synthetic responses establish software behavior; live model comparison and human
usefulness acceptance remain open. Cross-group contribution Weave is specified
separately in [Release 2C](lenses-release-2c.md).
