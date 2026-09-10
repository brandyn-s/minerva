# Revision and Develop review baseline

Source: owner-supplied review JSON for Minerva 6f14824 / PR #91, served at https://minerva.thalient.ai. This is supplied review evidence, not a fresh verification by the batch author. The original source is preserved beside this summary as revision-develop-review.json. Its approval is restricted to the stated scope.

## Reported existing capabilities

- Revision History and word diffs; Revert appends a new revision.
- Edges retain source revisions and indicate when a parent has moved on.
- Develop changes one artifact in place over steps; intents are saved and reusable.
- Save/export version 3 includes revisions and intents; v2 import creates an imported-current-content revision.
- Postgres, Workflow and frozen-workspace implementation were removed.

## Evidence boundaries

- Reported local checks: lint, typecheck, 28 tests and build, after removing a stale generated Workflow directory; mocked replay against development and production servers.
- Reported hosted: edits, Revert, frozen-edge indications, reload persistence, JSON export, v2 import, and one real two-step Develop. Generated notes were labeled Model claim.
- Intent reuse used a stubbed route.
- Stop/late-response handling passed replay but was not repeated hosted by this reviewer.
- Markdown revision export was not checked.
- Contribution-only revision and Merge-history behavior were code-inferred findings, not observed reproductions.

## Batch ownership

| Finding | Owning batch | Required treatment |
|---|---|---|
| Stale generated app/.well-known/workflow breaks builds | 00; verify in 08 | Narrow setup/build remediation after checking relevance; no blanket directory deletion |
| Contribution-only edit creates empty visible revision diff | 01 | Include contribution in historical snapshots/diffs; migrate without inventing past values |
| Merge hash includes history and may duplicate a logical artifact | 01 | Explicit artifact/revision identity and lossless, idempotent merge policy |
| Prepared fixture timestamps appear as actual dates | 01 | Label prepared provenance accurately |
| Intent reuse live evidence limited | 02 and 08 | Contract tests now; distinguish any later authorized live verification |
| Stop and late responses | 03 and 08 | Test cancellation across Develop and Expedition with retained committed revisions |
| Markdown history export | 08 | Inspect and validate actual output |

Prior unrelated findings (undo labels, folded headings/recovery display, invalid-request status handling, and accepted voice endpoint exposure) remain review history, not automatically opened work. Track materially relevant failures if encountered.

The supplied approval does not demonstrate durable Expedition execution, reliable attractor inference or population-search efficacy.

## Batch 00 fresh evidence

Native-function checks reproduce the contribution-only history omission and Merge duplicate behavior. Revert appends; v3 round-trip and v2 migration pass. Fixture timestamp renders as September 8 at 7 PM in Chicago. See `verify-baseline.mjs` and the evidence manifest. These are deterministic checks, not new hosted verification.
