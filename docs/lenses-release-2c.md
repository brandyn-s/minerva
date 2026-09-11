# Cross-group contribution Weave — Release 2C

Open a saved Expedition, edit its lenses, and choose **Explore across groups**
on a reviewed lens. Pick two distinct groups and one assessed candidate from
each. The proposed representative is a starting choice; the complete group is
available, including candidates beyond the normal result preview. Candidates
with reported constraint violations cannot be chosen.

## Preparation and execution

Pause the expedition and let any in-flight call settle. Preparation requires
two calls and two conservative reservations within its existing allowance.
It freezes the exact lens revision, group choices and complete source candidates.
It makes no model call. The shared [Release 1](weave-release-1.md) preparation
editor supplies one editable contribution per source, optional exact excerpts
and an optional interaction. Failed submissions retain these drafts; preparing
again keeps authored contributions for unchanged candidates.

Submitting authorizes one Weave and its assessment through the existing worker
or Vercel Workflow. The run remains paused, with no automatic resumption or added
allowance. While the request is pending, ordinary exploration, reassessment,
interventions, selection application and Resume cannot compete with it. Stop
remains available and rejects late results. Retrying dispatch only wakes the
existing request; committed, failed and uncertain calls are never replayed.

The immutable request is idempotent for the same preparation and contributions.
Changed run controls, corpus, assessments or lens state invalidate a preparation
before submission. Reservations still check call sequence, controls, corpus and
allowance at admission; concurrent submissions/workers admit one bounded request.

## Evidence and classification

Operation sources retain their original artifact IDs, revisions and full text.
An additive candidate ID distinguishes different immutable candidates even when
they share an artifact ID and revision. Contribution selections, generation
parents and group receipts identify those exact candidates. Existing card Weave
receipts and variants remain compatible.

The result shows its body, selected contributions, exact excerpts, model mapping
status and quoted result passages, plus assessment status. Model mappings remain
claims for human inspection. The user explicitly places the result into a group
or Unassigned. Placement appends lens edits and retains earlier revisions; it
does not silently reapply the separate exploration configuration. A completed
assessment still produces a reading under the currently applied configuration.

## Deployment and startup

This increment is verified locally; Release 2B is already hosted. Before
publishing 2C, update the existing database writer guard with current code and
the existing Expedition connection:

```sh
node scripts/setup-selection-guard.mjs
```

The updated function accepts Release 2B writers for ordinary configured runs but
requires the current writer while a bounded group Weave is pending. It changes
no run records. Current code refuses to save a pending request without that
guard. The 2C guard passed tests in a disposable Neon schema and is installed
in the application schema for this release.
Restart SQLite workers with current code to register the additional writer
function. Use the same private database path for the app and worker.

## Verification and limits

- `npm run check`: lint, TypeScript, 65 unit tests and production build.
- `MINERVA_UI_PORT=3088 npm run test:ui`: 22 desktop and touch journeys cover complete
  candidate choices, exact late-body excerpts, draft recovery, result placement,
  visible panel controls and preserved canvas viewpoint.
- `node scripts/verify-group-weave-stores.mjs`: SQLite admission, rollback,
  concurrent workers, exact parents, two calls, paused completion and unchanged
  allowance. `--postgres` repeats these checks on actual Neon, including racing
  submissions and compatibility with the previous writer, in a disposable schema.
- `node scripts/verify-group-weave-api.mjs`: production-built browser/HTTP/SQLite
  path with 65 candidates, stale/ownership/origin rejection, duplicate submission,
  three separate worker processes, exact contributions, classification and reload.
  `--keep-fixture` retains its isolated synthetic database for a local demo.
- Existing selection-store checks remain compatible. `git diff --check` passes.

These checks use synthetic provider responses and make no live model calls.
Creative usefulness and matched-budget comparison remain human judgments.
Automatic group pairing, adaptive scheduling and gap-finding are outside this slice.
