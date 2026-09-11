# Lens selection — Release 2B

Release 2A is merged in PR #102 as
`dbdf220715b26fee452926ecbf999f159538e338`; CI and Vercel passed.
The stable production alias returns HTTP 200. Release 2B is verified for publication.
Branch: `feat/lens-selection`.
Worktree: `/Users/brandyn.schult/code/minerva-contribution-weave`.
HEAD/base: `428e51088317fff1036a35bd43e54e35bf550c1b`.

Saved Expedition → Edit expedition lenses → reviewed lens → Use for exploration
→ pause and settle → preview → apply → resume separately.
The preview accounts for the complete corpus, protections, eligibility and
omitted groups. An immutable applied configuration drives deterministic
representative selection, exact generation receipts and subsequent readings.
New/unassigned candidates remain in separate provisional groups.
Scope, startup and deployment prerequisite: [Release 2B](lenses-release-2b.md).

Verified: lint, TypeScript, 60 unit tests, production build, 20 desktop/touch
journeys plus focused header-visibility rechecks, and `git diff --check`.
The real browser/API/SQLite path covers 65 candidates, stale/concurrent apply,
ownership/origin, exact active population and applied readings after reload.
SQLite and actual Neon checks cover concurrency, rollback, in-flight calls,
stale plans, older writers, exact generation parents and provisional readings.
Neon checks use a disposable schema removed after testing; no model calls.
The application-schema writer guard is installed on the existing Neon database.
Without this guard, hosted selection application refuses to save.
No hosted 2B UI or human usefulness acceptance is claimed.

Local fixture demo: http://127.0.0.1:3092/ (production build + fixture worker).
Open Expedition → “Lens selection demo — synthetic”. It starts paused with an
applied lens. Main atlas dev server remains at http://127.0.0.1:3088/.
Fixture database (ignored):
`/Users/brandyn.schult/code/minerva-contribution-weave/.local/selection-demo-6ueeWZ/runs.sqlite`.
Restart from this checkout: `sh .local/run-selection-demo.sh`.
The ignored launcher pins Node/npm and starts the fixture app and worker with
Gateway credentials disabled. Stop the current preview/worker before restarting
or rebuilding; the launcher uses the existing production build.
`node scripts/verify-selection-api.mjs --keep-fixture` creates another isolated
fixture after a production build and prints its database path.

The owner authorized commit/merge of 2B and proceeding with Release 2C.
Next builder outcome after merge: cross-group contribution Weave.
Human comparison of grouping quality and matched-budget exploration remains open.
