# Cross-group contribution Weave — Release 2C

Release 2B is merged in PR #103 as
`1e5a90d58a81b25d2268d737277222a8e53dbda3`; CI and Vercel passed.
The stable alias and real hosted selection API are verified, with zero calls.
Release 2C is verified locally and authorized for commit, merge and publication.
Branch: `feat/cross-group-weave`.
Worktree: `/Users/brandyn.schult/code/minerva-contribution-weave`.
HEAD/base: `340ace416a38d993b001932fbb8c8a077e1ce685` (implementation base).

Saved Expedition → Edit expedition lenses → reviewed lens → Explore across groups
→ choose two groups and exact candidates → prepare contributions → submit.
One Weave and assessment use two calls from the existing allowance. The run stays
paused. Exact parents, contributions and result mappings survive reload; placing
the result explicitly edits the lens without reapplying selection configuration.
Scope, execution and deployment prerequisite: [Release 2C](lenses-release-2c.md).

Verified: lint, TypeScript, 65 unit tests, production build, 22 desktop/touch
journeys and `git diff --check`. Real production-built browser/API/SQLite checks
cover 65 candidates, stale/ownership/origin rejection, duplicate submission,
three separate worker processes, exact sources, result placement and reload.
SQLite and actual Neon checks cover rollback, concurrent submission/admission,
previous-writer compatibility, two calls and paused completion. Prior selection
checks still pass. Synthetic providers only; no new live model efficacy claim.

The updated 2C writer guard passed isolated Neon tests and is installed in the
application schema using `scripts/setup-selection-guard.mjs`. Existing 2B writers
remain compatible outside pending group Weaves. Restart local SQLite workers
with current code.

Local fixture demo: http://127.0.0.1:3092/ (production build + fixture worker).
Open Expedition → “Cross-group Weave demo — synthetic” → Edit expedition lenses.
Explore across groups shows a completed result; its placement created a new lens
revision. Mark that revision reviewed before preparing another two-call Weave.
Atlas-only dev server remains at http://127.0.0.1:3088/.
Fixture database (ignored):
`/Users/brandyn.schult/code/minerva-contribution-weave/.local/group-weave-demo-hucUNL/runs.sqlite`.
Restart from this checkout: `sh .local/run-group-weave-demo.sh`.
The launcher pins Node/npm and disables Gateway credentials. Stop its app/worker
before rebuilding; it serves the existing production build. Recreate a separate
fixture with `node scripts/verify-group-weave-api.mjs --keep-fixture` after build.

Next role: owner reviews the 2C interaction and contribution evidence.
Further product slices are not authorized yet.
Human comparison of grouping quality and matched-budget exploration remains open.
