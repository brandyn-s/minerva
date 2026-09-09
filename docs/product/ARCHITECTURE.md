# Minerva: architecture

This file describes the complete product. The `/workspaces` route integrates
Postgres, AI Gateway and Vercel Workflow and is frozen; the demonstration target
in [AGENTS](../../AGENTS.md#current-direction) uses only the root atlas, named
application operations and the AI Gateway adapter. Durable execution, receipts,
admission and reconciliation are opened by a task message, not by this document.
CAPABILITIES records demonstrated scope.

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

Committing a mutation and its command receipt in one transaction requires a
driver that supports transactions, which excludes HTTP-only serverless drivers.
Select the driver and its pooling configuration with M2 / 4 rather than at the
durable-execution package, and record the choice here. A pooler in transaction
mode reassigns backend connections between statements, so prepared statements
must be disabled against those endpoints; the failure is intermittent and
silently drops work rather than failing the request, so assert the pairing at
startup instead of relying on the connection string being right.

The platform provides no migration step, so "an explicit command" means a
deliberate operator action against a named database, not a build hook. Applying
migrations from the build command couples schema change to deployment and makes
a transient database connection fail the whole deploy, and it also runs on every
preview build against whatever database that environment resolves to. Run
migrations as their own command, confirm the target database first, and treat a
deployment expecting new schema as ordered after that command rather than
carrying it. Record with M2 / 4 which command applies migrations, who runs it,
and how a failed partial migration is recovered.

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

Three framework defaults decide whether that holds, and the current
configuration satisfies all three by default rather than by decision. Record
them so a later change is deliberate. Cache Components is off because the Next
configuration does not enable it, which leaves route handlers dynamic; enabling
it makes a handler prerender unless it reads runtime data, so canonical reads
would need explicit request-time access or they are built once and served stale.
Framework-level fetch caching defaults to fetching once during the build for a
route that can be statically prerendered, so a canonical read reached that way
is baked at build time rather than read per request. The platform's remote cache
persists across deployments and regions and must never wrap a canonical read.
Cache derived and presentational results if they are worth caching, never the
records that decide identity, revision or authority.

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

Platform request cancellation is off unless a path opts in, which is why a
disconnecting consumer currently cannot end server work. Enabling it terminates
every function matching the configured pattern when its client disconnects,
whether or not that function watches for the signal, so a broad pattern would
make closing a tab end admission and dispatch. Opt in per path, only for
responses whose work genuinely belongs to one open connection, and never for
admission, dispatch or mutation. Where a cancelled request still owes durable
work, hand that work to the platform's post-response mechanism rather than
leaving it in the terminated invocation.

Workflow keeps a run on the deployment that created it, so releasing new code
does not disturb runs already in flight and recovery need not defend against
that case. A run is also pinned at creation to the region of the function that
started it and stays there for its lifetime; upgrading the SDK does not migrate
existing runs. Neither property removes the dispatch reconciliation above.

Stop is an application capability, not a platform call. The SDK cancels in-flight
work by threading an abort signal into steps, and run cancellation outside the
application is an operator CLI, so a user-facing stop persists a stop intent that
the run observes and then aborts its own in-flight steps. Keep that path distinct
from a suspended run needing operator recovery.

Workflow selects a world for its storage and queuing. Local development uses the
bundled local world automatically under the ordinary development server, with no
extra command. That world separates its two halves: run data persists to a local
`.workflow-data/` directory, while the step queue is in memory and does not
survive a restart. So a restart loses queued steps, not run state, and local
recovery reconciles a queue against records the world still holds rather than
reconstructing those records. Ignore that directory rather than committing it.

The local world also processes steps synchronously and runs as a single
instance, so it cannot demonstrate concurrent step execution. Evidence for
concurrent runs comes from a preview deployment; a local pass does not establish
it. A Postgres-backed world exists as a selectable alternative if durable local
runs are later required, which is a configuration choice rather than building a
queue.

Bound SDK retries, workflow retries, repair and replanning under one explicit
attempt/time/spend policy. Transient failures, invalid output, revision conflict,
repetition and quota denial have different responses. Preserve partial results
and failed attempts. Never bypass a quota or invent successful fallback output.

Quota denial is identifiable rather than inferred: the Gateway rejects an
over-budget request with HTTP 402 and a stable quota type, and names the
exceeded scope with its spend and limit. Authentication and billing-prerequisite
failures arrive as their own statuses and types and are configuration faults,
not transient ones. Match those explicitly and treat the remainder as transient,
rather than reading any failure as retryable.

Usage arrives in two phases. A generation identifier is available immediately,
including inside the first chunk of a streamed response, while cost and token
usage for that generation become available shortly afterward. Record the
identifier with the attempt when it completes and reconcile usage against it
later; a receipt written at completion time cannot carry a cost that does not
exist yet.

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
connects with that token, and the Gateway bounds each session. The published
limits are 25 minutes maximum duration, 5 minutes idle, closure if no client
message arrives within 30 seconds of connecting, and a 256 KB maximum message
size; teams also have an unpublished concurrent-session limit that rejects
further connections until a session ends. Realtime sessions do not accept image
input. The route mints the token with the deployment's OIDC credential, not a
Gateway API key, and sets an explicit token lifetime rather than relying on a
default. Realtime support is in beta and its entry points are still
`experimental_`-prefixed; pin exact versions and confirm the installed AI SDK
channel against current documentation before implementing.

Reconnecting does not resume a Gateway session. A reconnect starts a new session
with no provider-side memory, so resynchronization is the application's work:
recompile and replay the context the conversation needs while suppressing
re-execution of intents already applied and discarding stale navigation.
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
one credential lane, and the owner sets a project-scoped Gateway budget for it;
the Gateway rejects requests with HTTP 402 once that budget is exceeded. Budgets
stack rather than replace each other: a request must pass every budget in its
lane, and a request authenticated by a deployment's OIDC token counts against
both the project budget and the team budget. A team budget exhausted by other
work therefore rejects this application even while its project budget has room,
so the project budget bounds this project's spend without being the only scope
that can stop it. The rejection names the exceeded scope, which is what the
application reports. Spend Management is the backstop: it checks every few
minutes and does not cover Marketplace databases. Do not add Gateway API keys or
bring-your-own provider keys, which move requests to a different budget lane
that the project budget does not meter.
Application admission keeps
its own bounded attempt and spend allowances with headroom.

Text and voice do not share a spend unit. Text generation meters by tokens,
while realtime voice models are priced by connected session time, so a voice
allowance is a duration budget and the 25-minute session cap is also a per-session
cost ceiling. Allocate and report the two separately rather than converting one
into the other; confirm the per-model rate and the usage a closed session
actually reports when configuring the runtime profiles. Consult current
official Vercel documentation when configuring these services. Voice never
places a long-lived key in the browser. Use runtime credentials, not captured
build tokens.

No infrastructure is created by the template. It contains no paid credentials,
configured budget, database, voice implementation or deployed application.

## Infrastructure and extension evidence

The application implements isolated development/review data/configuration, explicit
migration execution, pooler-compatible database connections, durable dispatch
reconciliation, correlated run/request diagnostics and reproducible local startup
paths. Database backup/restore features and procedures are excluded. Test
application restart recovery on isolated data.
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
| M2 / 4 | Managed Postgres; recoverable workspace deletion hides work while retaining history until explicit permanent purge; complete versioned JSON export. Backup/restore is excluded. |
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
