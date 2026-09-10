# Batch 01: Experimental records and durable ownership

Base: `6f148242c93f2cd44868c6374178ef12a8876586`; branch `docs/scorebook-transition-batch-00`; worktree `/Users/brandyn.schult/code/minerva-scorebook-transition`. Changes remain uncommitted. No deployment or paid model calls. Scope is verified local software, not creative efficacy or hosted durability. See [implementation](implementation.md) for startup and the shared verification record.

## Implemented

Extended existing v3 records additively: contribution and prepared provenance, optional operation receipts and exact experiment references. Legacy missing contributions remain unknown; Revert retains the current contribution with an explicit cause when historical data is missing. Merge follows identity and compatible history, updates extensions, and retains divergent histories under deterministic fork identities; unrelated equal text remains distinct. Native checks cover extension, divergence, repeated import and legacy migration.

## Evidence and limits

SQLite WAL is the single-host durable experiment authority. Browser atlas remains the editable materialized workspace. Exact snapshots/operations/candidates/assessments/readings are immutable records; attempts and run controls are separately mutable. Transactional admission reserves calls and conservative cost allowance before dispatch. Two connections and reopen tests pass. Hosted adapter remains unimplemented; no removed Postgres/Workflow stack restored.

## Dependency handoff

02 uses these contracts; never overwrite experiment history from a canvas edit.
