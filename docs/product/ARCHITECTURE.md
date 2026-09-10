# Minerva: architecture

The demonstration uses the root atlas, application-owned domain types and
AI Gateway model routes. [CAPABILITIES](./CAPABILITIES.md) records verified scope.

## System shape

The Next.js/React/TypeScript application serves the atlas. The browser
owns its editable atlas and IndexedDB save. Durable Expedition uses the existing Neon resource and Vercel Workflow for hosted
execution, with SQLite and a separate worker retained for local use. Model route handlers call AI Gateway;
voice uses a server-minted token and a browser realtime connection.

## Ownership and dependencies

| Area | Owns | Does not own |
|---|---|---|
| Atlas domain and fixture | Cards, typed relationships and prepared content | React Flow or provider transport |
| Atlas UI | Viewport, selection, rendering, editing and layout history | Server credentials |
| Local state | Versioned IndexedDB saves, validation, import/export and recovery copies | Model execution |
| Generation and analysis | Request/output schemas, context and validation | Camera or pointer state |
| Model routes | AI Gateway calls and streamed responses | Atlas persistence |
| Voice | Capture, playback, realtime context and shared transcript | Card mutations |

Domain code does not import React or route handlers. Renderer data is derived
from application-owned records. Keep narrow boundaries without a generic
command bus, service framework or universal agent engine.

## Canonical records

The browser stores cards, relationships, revisions, layout sizes and history,
perspective positions and cameras, selection, themes, Talk and Expedition state
in versioned IndexedDB saves. Import validates shape and references; Merge follows artifact identity and compatible revision history, extends known
histories and preserves divergent histories as deterministic forks. Recovery copies and Export are browser-owned.
Lineage, Evolution and Constellation share card IDs and have independent layout
state. The server does not persist the editable atlas. The experiment
store owns frozen inputs, operations, outcomes, assessments and readings.
Materialization preserves source identity when its frozen revision still matches;
otherwise it retains a separate result. See [Expedition execution](../expedition.md).

## Context compilation

Each model request supplies the current relevant cards and relationships.
Typed Talk and voice receive a bounded canvas view prioritizing focus/selection,
with omitted/truncated content disclosed. Conversation input is bounded separately
from the saved visible transcript.
Voice updates its context when the user inspects or selects a card. Model output
is untrusted; validate generated records and graph references before adding them.

## Concurrent interaction

Use React Flow (`@xyflow/react`) for viewport, nodes, edges and pointer mechanics,
with custom React cards and application-owned layout functions. Map canonical
IDs and typed relationships into renderer data at the presentation boundary;
do not persist the renderer store or export its types from domain contracts.
Keep the living-atlas composition in DESIGN, not the library's demo appearance.
The renderer maps atlas records into presentation state. Exercise IB01-IB06 and representative
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
input. The route mints the token with the server-held voice-only Gateway key. Realtime support is in beta and its entry points are still
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
The public Vercel demonstration uses the linked project’s model configuration.
Text uses deployment OIDC; voice uses `MINERVA_PRIME_VOICE_API` on the server.
Keep credentials out of browser bundles and source control. Gateway and platform
budgets are owner-controlled. See [setup](../setup.md#vercel-demonstration-hosting)
for operation and [AGENTS](../../AGENTS.md#execute-one-connected-outcome) for authorization.

## Infrastructure and extension evidence

`npm run check` covers lint, types, domain/configuration tests and production build.
The unchanged atlas browser replay exercises the root journey through development
and production startup. Mocked responses establish application behavior, not live
model quality. Creative usefulness remains an owner judgment.
