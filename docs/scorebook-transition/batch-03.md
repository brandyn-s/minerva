# Batch 03: Durable Expedition execution

Base: `6f148242c93f2cd44868c6374178ef12a8876586`; branch `docs/scorebook-transition-batch-00`; worktree `/Users/brandyn.schult/code/minerva-scorebook-transition`. Changes remain uncommitted. No deployment or paid model calls. Scope is verified local software, not creative efficacy or hosted durability. See [implementation](implementation.md) for startup and the shared verification record.

## Implemented

Existing Expedition now uses the durable /api/expedition/runs path, with browser-only historical runs preserved as history. A separate worker processes at most four runs concurrently and one call per run. Pause admits in-flight completion; Stop cancels commit eligibility. Leases classify abandoned calls uncertain without automatically replaying them or refunding their reservations.

## Evidence and limits

Independent-process restart tests pass. Stop/late response, pause, duplicate commit, stale owner, immutable record, failure exhaustion and budget-contention tests pass. A provider deadline bounds each call below the lease duration. Goal completion is not inferred from model self-report; runs terminate by explicit controls or allowances. Synthetic worker is verified; gateway usage capture and live price-ceiling configuration are implemented but unverified with fresh provider calls.

## Dependency handoff

04 owns selection, not transport. Startup requires the local worker; no request-lifetime background task.
