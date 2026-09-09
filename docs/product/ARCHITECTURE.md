# Minerva: architecture

The shell does not yet implement the services described here.

## System shape

```text
Browser canvas / typed collaborator / voice
                    |
           named application operations
                    |
       feature-owned domain rules and contracts
                    |
      Postgres     AI Gateway adapter     Vercel Workflow
```

One Next.js/React/TypeScript application is the deployment unit. Start with
feature folders in one package, not empty packages or independently deployed
services. Add dependencies when a working slice needs them.

This is a single-user, browser-only prototype with no sign-in. Local development
binds to loopback; the release target is a public Vercel deployment for a bounded
demonstration window. Browser-only does not remove the internal backend:
browser/voice requests still reach shared operations, Postgres, AI Gateway and
workflows. Do not build an external REST/MCP surface, machine-client credentials
or accounts.

## Ownership and dependencies

| Area | Owns | Does not own |
|---|---|---|
| Workspace/ideas | Brief, constraints, content revisions, relationships, ownership | DOM, camera, provider transport |
| Exploration/review | Operation definitions, proposals, assessments, decisions | Canvas rendering or runtime model SDK types |
| Wander/space analysis | Exploration policy, archive, recurrence and evidence-linked readings | A second execution engine or universal creativity score |
| Runs | Admission, attempt identity, progress and recovery contracts | Browser lifecycle or policy-specific creative choices |
| Agent Drive | Explicit goal pursuit and stopping policy on shared operations | A separate execution engine |
| Comparison/development | Comparison slots, selected parts, versioned recipes and inheritance evidence | Provider transport or user camera |
| Outputs | Branch-linked prototypes, experiments, handoffs and reusable synthesis | Executing arbitrary generated server code |
| Investigator | Conversational intents and bounded context/attention contracts | A duplicate mutation path |
| Canvas/UI | Viewport, selection, rendering and interaction | Canonical content or direct provider credentials |
| Infrastructure | Database, model and workflow bindings | Independent business rules |

Domain code does not import React, database clients, route handlers,
`Request`/`Response`, or provider SDK objects. UI and transport adapters call the same application
functions. Use narrow dependencies at real boundaries; no generic command bus,
service framework, dependency-injection container, or universal agent engine.

This ownership description is the target, not a requirement to create every
interface in M1. Implement the actual fixture/domain/presentation boundary for
the interactive proof: fixture records use application-owned domain types and
map to React Flow only in presentation. Retain that presentation as real state
arrives. Define database interfaces with M2 / 4 operations, workflow and recovery
interfaces with M2 / 8, and conversation/session interfaces with M2 / 11-12.
Unused interfaces, empty modules and backup/recovery scaffolding do not belong
in M1.

## Canonical records

Use Drizzle (`drizzle-orm`) inside feature-owned Postgres adapters, not in domain
contracts or UI code. Keep relational constraints and transaction boundaries
explicit. Generate versioned SQL migrations with `drizzle-kit`, inspect and
commit them, and apply them through an explicit command against the intended
database. Do not replace migrations with schema push or mutate schema during
requests or ordinary server startup. Add these dependencies with M2 persistence,
not to the content-free seed or an unused M1 persistence skeleton.

Postgres owns workspaces, brief/constraint revisions, ideas and immutable
revisions, derivation edges, semantic links, proposals, reviews, decisions,
command receipts, operation manifests, runs/steps and exploration observations.
Use relational records for identities/relationships and bounded versioned JSON
for feature payloads. Derivation is acyclic; semantic links may contain cycles.

Add comparison state, selected functional parts, transformation recipes,
inheritance evidence, execution artifacts and reusable synthesis as their
owning slices arrive. Lineage, Evolution and Constellation share canonical
IDs/revisions and have independent presentation state. Model classifications,
user decisions and recorded relationships are distinct.

The graph read model returns usable typed relationships and source references,
including brief-context membership and all recombination parents. It exposes
omissions and ancestor expansion rather than silently dropping endpoints at
pagination boundaries. Keeping a proposal does not sever its original sources.

Layout/viewpoint state has its own revision path. Browser selection, active
pointer gestures, temporary highlights and unfinished speech are ephemeral.
Caching must not create a second authority. Restore/revisit creates a new
revision referring to the source; it does not erase intervening history.

## Four shared contracts

**Exploration archive:** retain attempt/context references, parent/root lineage,
full artifacts, compact mechanism descriptions, failed/repeated outcomes,
repair reasons and usage. Search classifications do not replace human taste
decisions. Independent roots exclude generated archive content; archive-aware
requests list what they include.

**Commands:** use named operations such as create/revise idea, connect ideas,
set position, propose exploration, accept proposal and control run. Carry actor,
workspace, stable command ID, payload identity, targets and expected revisions.
Duplicate delivery returns the same receipt; conflicting ID reuse fails.
Admission is not completion. Apply conflicts to dependencies actually read or
written, not every change anywhere in the workspace.

Commit a mutation and its command receipt in the same database transaction;
include dispatch intent when admitting durable work. A lost response must not
leave a committed mutation without the receipt needed for safe replay.

**Attention:** point/highlight references are sequenced and expire. They do not
write content, steal selection or move the camera. An explicit navigation
command may move it. Reconnection discards stale navigation/highlights.

**Speech-to-proposal:** partial text is preview only. Finalized utterances have
stable intent IDs and resolve to discussion, attention, proposal or a clearly
requested bounded command. Preserve source revisions and distinguish user
language from model additions. Do not duplicate actions after reconnect.

## Context compilation

Compile a deterministic operation manifest with exact source revisions,
excerpts or full text, inclusion/order reasons, brief/constraints, operation
and prompt version, model profile, and admitted reference/archive material.
Preview and execution use that same frozen application-controlled context.
No hidden memory injection afterward. Record execution-time retrieval as an
additional input receipt without rewriting the original manifest.

Provide explicit brief-only and source-directed modes. Archive-aware mode
declares its extra inputs. Context selection is inspectable; incidental
proximity is not an instruction. Geometry does not reorder content or
invalidate content-only requests. Enforce size bounds without silent truncation.

## Durable execution

Persist run admission and dispatch intent before starting Workflow. Reconcile
the database/startup gap. Execute provider/database I/O in durable steps and
checkpoint independent results. Stable step IDs prevent duplicate application
effects; they do not prove exactly-once provider billing.

Poll persisted progress initially, with bounded intervals and cancellation when
the consumer unmounts or the run is terminal. Canceling a poll does not stop the
run. Reconnect by reading durable state. Add a different delivery transport only
for an observed requirement that polling cannot satisfy; do not add a realtime
service preemptively. Normalize progress, input-needed,
proposal-saved and terminal events for presentation. Event delivery is not a
second state store. Reconnect from durable state rather than replaying UI actions.
Stopping ends future admission; already-admitted work may finish or incur cost.

Bound SDK retries, workflow retries, repair and replanning under one explicit
attempt/time/spend policy. Transient failures, invalid output, revision conflict,
repetition and quota denial have different responses. Preserve partial results
and failed attempts. Never bypass a quota or invent successful fallback output.

## Concurrent interaction

Use React Flow (`@xyflow/react`) for viewport, nodes, edges and pointer mechanics,
with custom React cards and application-owned layout functions. Map canonical
IDs and typed relationships into renderer data at the presentation boundary;
do not persist the renderer store or export its types from domain contracts.
Keep the living-atlas composition in DESIGN, not the library's demo appearance.
Add the renderer with the first M1 interactive fixture and retain that
presentation when M2 replaces fixture data. Exercise IB01-IB06 and representative
graph sizes; library selection alone establishes neither accessibility nor speed.

Canvas, run execution and voice have independent lifecycles. No global busy flag.
Incoming results merge by identity and preserve viewport, selection and deliberate
positions. Source edits affect dependent work only. Keep expensive layout and
analysis off the synchronous pointer path; add workers for observed need.

Voice uses the Vercel AI Gateway realtime path: a server route mints a single-use
short-lived session token after microphone permission is granted, the browser
connects with that token, and the Gateway bounds each session (25 minutes
maximum, 5 minutes idle, and closed if no client message arrives within 30
seconds of connecting). Realtime support is in beta; confirm the installed AI
SDK channel against current documentation.
Provide interruption and context resync. Barge-in stops speech, not unrelated
work or acknowledged commands. Typed fallback remains.
Typed and voice collaboration share context compilation and named application
operations; neither introduces a conversation-specific mutation path.

## Provider and deployment boundaries

Text generation, assessment and analysis call Vercel AI Gateway through the AI
SDK with the deployment's Vercel OIDC token; runtime models are Gateway model
ids.
Runtime model profiles state capability, supported settings, output schema,
limits and attempt policy. Astra as the development agent does not force the
runtime model. Model output is untrusted and assessments are not proofs.

Models interpret, suggest, generate and explain. Conventional application code
owns identity, revision consistency, graph-reference integrity, permissions,
spend admission and state transitions. Deterministic code still requires
correctness evidence; valid parent IDs do not certify meaningful inheritance.

Open the application without a login flow. Local development binds to loopback.
Validate Host/Origin on internal requests for every configured serving hostname;
reject cross-origin mutations and permissive CORS. Server-held credentials do not
by themselves protect paid operations from an unrelated website. Keep admission
and validation without adding accounts.

The release target is a public Vercel deployment for a bounded demonstration
window used by a small judge panel. Follow [AGENTS](../../AGENTS.md#execute-one-connected-outcome)
for authorization. Use one non-production database and configuration for local
development and preview deployments, and a separate production database and
configuration for the demonstration. The window's dates, budget and
teardown are recorded in the application handoff; the template holds no
account-specific values.

Every deployment authenticates to the AI Gateway with its Vercel OIDC token, the
one credential lane, and the owner sets a project-scoped Gateway budget, the one
scope that meters that lane; the Gateway rejects requests with HTTP 402 once
that budget is exceeded. Spend Management is the backstop: it checks every few
minutes and does not cover Marketplace databases. Do not add Gateway API keys or
bring-your-own provider keys, which the project budget does not meter.
Application admission keeps
its own bounded attempt and spend allowances with headroom. Consult current
official Vercel documentation when configuring these services. Voice never
places a long-lived key in the browser. Use runtime credentials, not captured
build tokens.

No infrastructure is created by the template. It contains no paid credentials,
configured budget, database, voice implementation or deployed application.

## Infrastructure and extension evidence

The application implements isolated development/review data/configuration, explicit
migration execution, pooler-compatible database connections, durable dispatch
reconciliation, correlated run/request diagnostics, and documented backup/
restore and reproducible local startup paths. Test recovery on isolated data.
Browser close does not stop running local services; service shutdown does stop
local execution. Preserve checkpoints and reconcile work after service restart.
The local Workflow world queues steps in memory, so a local restart surfaces
stranded runs from their dispatch records and re-dispatches or fails them
explicitly; full resumption of in-flight steps is a hosted property. Do not
build a persistent local queue.
An expiring preview deployment is not the demonstration's durable storage. These
are responsibilities to implement during the application milestones, not unused
seed dependencies.

An ordinary new operation should extend its feature contract/definition,
generation or analysis logic, registration and focused tests without editing
canvas pointer mechanics, voice connection lifecycle or unrelated workspace
serialization. New data concepts may legitimately need migrations. Evaluate
ownership boundaries, not arbitrary file counts or dependency minimization.

## Open implementation choices

Resolve lifecycle policy in its owning milestone before implementing the
affected behavior. Later policies do not block independent earlier work. Record
the selected behavior here and its observed evidence in CAPABILITIES; use the
existing handoff rather than another decision system.

| Owning milestone/package | Policy to define with the affected feature |
|---|---|
| M2 / 4 | Workspace deletion, retained history, export and backup/restore interactions |
| M2 / 8 | Pause/stop versus admitted work, restart reconciliation and conflicting run effects |
| M2 / 11-12 | Transcript retention/deletion before typed-conversation storage; raw-audio retention and reconnect behavior with voice |
| M4 / 21-24 | Concurrent Wander/Agent Drive scope and goal-specific completion evidence, including human judgment for subjective outcomes |

Model-reported confidence or progress cannot settle human judgments of idea
feasibility or usefulness. Preserve the already specified revision, authority,
cost and recovery boundaries while resolving these details.

Choose compatible dependency versions, the Postgres driver/configuration,
runtime text/voice profiles, exploration policy and analysis thresholds within
the selected React Flow, Drizzle and polling foundations. Reconsider a foundation
only for a demonstrated requirement failure or compatibility constraint.
Before deploying, confirm the authorized Vercel project, data ownership and the
demonstration window's dates. Creative efficacy remains an empirical question.
