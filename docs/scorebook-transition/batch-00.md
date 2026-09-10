# Batch 00 handoff

## Outcome

Capability inventory, supplied review, source/metadata preservation, archive readiness and deterministic baseline checks are complete. Historical workspace/receipt preservation remains incomplete because access was unavailable. Batch 01 may proceed from preserved source; archival remains pending. No product behavior changes, commits, pushes, deployment, paid calls or service changes.

## Candidate

- Base/current HEAD: `6f148242c93f2cd44868c6374178ef12a8876586` (PR #91); no later remote-main revision at inspection.
- Branch: `docs/scorebook-transition-batch-00`.
- Worktree: `/Users/brandyn.schult/code/minerva-scorebook-transition`.
- Candidate consists of uncommitted documentation and an original deterministic verification script; no new candidate SHA.
- Scorebook reference: `b22a1dd65b0ca3d0d85498c09edf6d34f0e19be4`.

## Evidence

- `npm ci` and final `npm run check` pass using prescribed Node 24.20.0/npm 12.0.2: lint, typecheck, 28 tests and production build.
- `node docs/scorebook-transition/verify-baseline.mjs PRIVATE_OUTPUT_DIRECTORY` passes with the same Node runtime: native synthetic v3 roundtrip, v2 migration and append-only Revert; reproduces contribution-history omission and Merge duplicate behavior.
- Restored Scorebook bundle passes git fsck; five native synthetic export/projection tests pass.
- Stale generated Workflow routes reproduce build failure in this isolated checkout; removing only the copied subtree resolves it. Setup note added. Original checkout untouched.
- No hosted/browser replay or fresh semantic efficacy claim. No UI changes require a new UI journey.
- Private evidence location and checksums: evidence-manifest.json. Source bundle is restoration-verified; synthetic workspace validation is not historical-data restoration.

## Ownership and next dependencies

Wander, Weave and Develop remain operations; Expedition is the intended shared coordinator. Current Expedition uses its own generation route. Preserve existing revision/Revert/frozen edges/intents/v3 save behavior; extend instead of replacing it. Histories, active populations and analytical readings require separate ownership in Batch 01. Do not automatically restore removed backend infrastructure.

For Batch 01, use inventory.md and the review dispositions; resolve contribution completeness and identity-preserving Merge; define durable run ownership. Do not start Batch 01 without the owner's task instruction. No reviewer was launched.

## Archive gaps and startup

Unknown/unexported: Redis projects/snapshots/runs, browser-unsynced state and local raw evaluation receipts. Scoped credentials were unavailable. Archive-readiness.md provides export and validation requirements. Scorebook remains unarchived; service retirement is separate.

Startup mode: documentation-only; no server running. For local inspection, from this worktree run `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3012`; do not invoke model operations without authorization. Next role: owner reviews this handoff or explicitly opens Batch 01.
