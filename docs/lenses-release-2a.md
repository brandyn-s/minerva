# Editable lenses

Constellation → Edit lenses creates a named interpretation of the atlas. Start
with every current revision unassigned, or seed a proposal from existing themes.
Find themes and Regroup remain explicit generation actions. Opening a view,
creating a lens and editing membership make no model calls.

In a lens, select members to create a group or move them to another group or
Unassigned. Select two or more complete groups to merge them. Groups can be
renamed without changing their identity, and each nonempty group has a chosen
representative. A separate review action marks a seeded proposal as reviewed.
Name, description, membership, representatives and review status have append-only
revisions. Undo records a new revision restoring the previous editable state;
repeated undo walks back the preceding edits. Layout undo remains separate.

Membership refers to exact card revisions. Editing an idea retains the old
assignment as historical; its current revision appears under Awaiting
classification in the field. Include new revisions explicitly to add them as
unassigned. Historical member inspection reads the original card revision.
Manual dragging changes arrangement only. Switching lenses restores each
arrangement and size state while retaining the camera. Membership changes arrange
the scoped Constellation view; other perspectives retain their positions.

Browser saves and JSON exports carry atlas lenses, their histories and view
state. Older saves remain readable. Merge remaps exact card references through
divergent identity forks and retains divergent lens histories separately;
reimporting the same history does not duplicate it. Run lenses belong with their
Expedition records and are not copied implicitly into atlas saves.

## Expedition corpus

Open a saved run → Edit expedition lenses. The same editor uses complete
candidate references, independently of the reading's 20-group/five-example
preview and the ordinary candidate page. Member lists initially display 20 rows;
search and Show more help inspection. Select all explicitly selects the entire
group, including hidden rows. Merge operates on complete group membership.
Candidate bodies load by immutable candidate ID without materializing the corpus
as editable atlas cards.

A run lens can start unassigned or from the existing normalized mechanism groups.
That origin is distinct from Constellation themes. The lens freezes the candidate
and assessment references used. Reassessment cannot silently rewrite membership.
Reload lenses discovers later candidates; Include adds them as unassigned.

The existing SQLite/Neon record store retains immutable lens revisions. The API
uses the existing same-origin and run-owner checks. Expected revisions and unique
immutable record keys reject concurrent stale edits. Reload is explicit after a
conflict or uncertain response. Editing a lens does not change the run's active
population, admission, limits, status or operation schedule.

Using a lens to select an Expedition population and generating across groups are
later slices. This release establishes editable interpretations only.

## Verification

`tests/lenses.test.mjs` covers partition invariants, representative membership,
revision history and undo, stale card assignments, save/import compatibility,
complete run membership, frozen assessments and stale edits using SQLite.
`tests/ui/lenses.spec.ts` exercises desktop and touch atlas editing, historical
inspection, reload, arrangement/camera preservation and a 65-member run corpus.
Browser provider routes are intercepted; these are software behavior checks.

`scripts/verify-lenses-api.mjs` exercises the real production-built local HTTP
routes against an isolated synthetic SQLite corpus. It checks complete membership,
concurrent writes, candidate detail, missing runs, origin rejection and unchanged
run/call state. Set `MINERVA_LENS_TEST_URL` to a loopback production server and
`MINERVA_LENS_TEST_DB` to that server's isolated `/tmp/minerva-lenses-*` database.
The verifier creates a stopped fixture run, never dispatches a worker and never
invokes a provider. Hosted Neon execution has not been exercised for this slice;
it reuses the existing adapter and immutable insert contract.

Required checks use the Node/npm versions in AGENTS.md: `npm run check`,
`MINERVA_UI_PORT=3088 npm run test:ui` and `git diff --check`.
Human judgments of useful grouping, false splits/merges and editing effort remain
open; membership integrity does not establish a useful taxonomy.
