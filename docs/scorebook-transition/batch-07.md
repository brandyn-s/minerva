# Batch 07: Population navigation and bounded access

Base: `6f148242c93f2cd44868c6374178ef12a8876586`; branch `docs/scorebook-transition-batch-00`; worktree `/Users/brandyn.schult/code/minerva-scorebook-transition`. Changes remain uncommitted. No deployment or paid model calls. Scope is verified local software, not creative efficacy or hosted durability. See [implementation](implementation.md) for startup and the shared verification record.

## Implemented

Expedition exposes run controls/history, paginated candidate revisions, assessment evidence, reassessment, readings, interventions and an executable probe. Results live in the run without per-card approval; requested materialization preserves existing atlas camera/selection and uses the current inspection pane. Develop appends when the frozen source matches, otherwise creates an explicit separate result.

## Evidence and limits

GET /api/expedition/runs supports bounded pages, search and exact candidate/operation/assessment lookup. Preview payloads disclose omissions. Typed and voice canvas context prioritizes focus/selection, caps cards/bytes, and discloses truncation; conversation input is bounded while the visible saved transcript remains intact. The API is local same-origin only, not a hosted multi-user agent service. Browser journey and desktop/touch controls pass; see final verification record for voice results.

## Dependency handoff

08 measures integration and prepares the live protocol. No automatic full-corpus render or prompt.
