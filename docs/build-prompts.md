# Minerva: Astra build packages and Fable reviews

Build the prototype defined by [SPEC](./product/SPEC.md), using the technical
boundaries in [ARCHITECTURE](./product/ARCHITECTURE.md) and design in
[DESIGN](./product/DESIGN.md).

Read [AGENTS](../AGENTS.md) for shared working/review rules and
[README](../README.md#documentation) for document ownership. Each copyable package
contains its outcome, prerequisites, references, integration and completion
evidence; it depends on the current
repository, not a separate conversation. Read only the relevant contracts.

These are 32 work packages, not 32 mandatory sessions. Use AGENTS's authorized
outcome and stopping rule across connected chunks; package numbering alone does
not create a pause or grant authority. The six milestones demonstrate progress
toward all fifteen required capabilities. Follow
[setup](./setup.md#standard-checkpoint-output) for launch instructions and handoffs.

| Milestone | Packages | Demonstrated outcome |
|---|---|---|
| M1: Experience proof | 1-3 | A populated interactive atlas with understandable relationships and contextual actions, using prepared local data. |
| M2: Working spine | 4-12 | Persistence, visible graph, real creative generation, assessment/acceptance and concurrent spoken collaboration. |
| M3: Creative workspace | 13-20 | Inheritance, reusable development, contextual moves, comparison/Weave and three views. |
| M4: Exploration intelligence | 21-25 | Wander, challengeable recurrence/readings and goal-directed Agent Drive on shared operations. |
| M5: Remaining product capabilities | 26-28 | Browser instruments, runnable output artifacts, experiments and reusable results. |
| M6: Integrated release | 29-32 | Independently reviewed local and hosted operation, durable state, accepted experience and honest operating limits. |

## Shared demonstration and review

Use the shipped mall demo in [SPEC](./product/SPEC.md#shipped-demo-and-human-judgment),
plus counterexamples and dense scenes. Extend its editable data and demonstration
of each tool as the owning capability arrives; verify all tools at release.
Use SPEC's tool-based semantic examples and lightweight reference setup. Resolve
lifecycle policies with their owning operations as scheduled in ARCHITECTURE.

Follow AGENTS's review procedure. Review against this milestone's Entry, Working
demonstration, Exit and review, and Still open sections, plus its specific focus.
Return READY FOR NEXT MILESTONE, CHANGES REQUIRED or BLOCKED; M2's interim and
M6's release verdicts are specified below.

M1's experience acceptance precedes dependent work. M2 reviews after packages
10 and 12. M6 reviews the candidate before the hosted-release confirmation.
Missing required review, behavior or acceptance remains a blocker; only
authorized independent work may continue. Local operation alone does not open
the demonstration window, and creative-efficacy claims remain unresolved
without human evidence.

### Small task comparisons within milestone chunks

Use brief owner-led comparisons to guide iteration, with the mall brief and the
same source material where possible. A text/list presentation of saved artifacts
is enough as a reference; do not build another interface or evaluation service.

| When | Small task | Human observation to record |
|---|---|---|
| M1 / 3 | Inspect the same prepared parent/child material as text and in the atlas; identify each contribution and select a next direction | Source comprehension, orientation and interaction friction |
| M2 / 10 | Inspect saved results from the first live operation as text and in the workspace; explain their origins and choose what to develop | Useful differences, evidence clarity and effort to choose a next step |
| M2 / 12 | Discuss a branch while moving another and receiving results | Whether spoken collaboration helps or interrupts the person's work |

Record the task, candidate, prepared/live inputs, observed friction and the
owner's judgment in CAPABILITIES. Reuse saved results; any fresh comparison
calls remain within explicit spend authorization. These comparisons are part
of existing demonstrations, not extra review gates, numeric efficacy scores or
claims of general superiority. Repeat when the owner steers a change or new
evidence warrants it. M4 retains its compact exploration comparison.

## Fable consultation: an independent view at a decision or impasse

```text
You are Fable 5.1 in Claude. Read AGENTS.md and the relevant current contracts.
Use the supplied checkout, candidate and specific question. This is read-only
advice, not permission to edit, deploy, spend or restart the project.
Inspect the relevant code or behavior before accepting the builder's explanation.
Challenge the concrete assumption and distinguish requirements from preferences.
Return the next bounded action, evidence, tradeoffs, unknowns and an observation
that would change your recommendation. Preserve the product scope and modular
monolith; suggest a small falsifying experiment only when it resolves uncertainty.
Report missing inputs explicitly. Astra records the disposition of your advice.
```

## Milestone 1: Experience proof

**Entry:** A new project directory and the full product goal; no database or live provider is needed.

**Working demonstration:** Pan and zoom; trace both parents of a recombination; move a card with its edges attached; inspect inherited material; select a pair; open a local contextual chooser on desktop and touch.

**Exit and review:** The local fixture demonstrates the proposed experience, Fable reviews it, and the user accepts the representative visual/interaction direction. Persistence and AI remain explicitly unimplemented, not simulated as real.

**Still open:** All production persistence, generation, voice and wider product capabilities remain open. Fixture interactions do not complete their capability rows.

### Prompt 1: establish the application identity and starting outcome

```text
You are GPT-6 Astra in Codex, implementing a work package in M1: Experience proof.
Required prerequisites: The target project directory and authorization to create the application repository.
Read AGENTS.md.
Relevant references:
- docs/setup.md (Repository identity)
- docs/product/SPEC.md (Required capabilities; Shipped demo and human judgment)
- docs/product/CAPABILITIES.md

Outcome: An application repository with correct identity, usable inherited checks
and an accurate starting handoff.

Integration work:
Inspect the target and follow setup's repository-identity procedure within the
creation authorization. Record the actual seed revision and the mall brief.
Convert the inherited tests for application development: delete
tests/seed-only.test.mjs and retain/adapt the portable document checks in
tests/seed-docs.test.mjs and configuration behavior in tests/lint-config.test.mjs.
Remove empty-seed restrictions from the generated application, including bans
on application dependencies/files and assertions that every capability is
not started. Use the existing runner; no conversion framework is needed.
Initialize capability evidence without erasing existing work. Create the short
application docs/HANDOFF.md with scope, files, commands, blockers and next outcome.

Completion evidence:
Run the inherited checks after conversion. Inspect the surviving assertions to
confirm that application additions and capability progress are permitted while
references, IDs, package structure and actual configuration remain checked.
Record identity/settings, seed revision, representative brief and check results.
Package complete when: the authorized repository setup and test conversion are
complete, checks pass, capability evidence is accurate and the handoff names the
next unfinished foundation outcome.
```

### Prompt 2: create the runnable fixture foundation

```text
You are GPT-6 Astra in Codex, implementing a work package in M1: Experience proof.
Required prerequisites: Package 1 application setup and the full product contract; no persistence or model service is required yet.
Read AGENTS.md.
Relevant references:
- docs/product/ARCHITECTURE.md (Ownership and dependencies; Concurrent interaction)
- docs/product/SPEC.md (C02, C03, C15; IB01-IB06)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: A runnable fixture foundation that package 3 can compose into the atlas.

Integration work:
Extend the pinned Next.js shell and existing CI instead of re-scaffolding it.
Implement the actual fixture/domain/presentation boundary described in
ARCHITECTURE. Use application-owned fixture records and domain types; map them
to React Flow (@xyflow/react) only at the presentation boundary. Add the renderer
when the first interactive fixture uses it, with custom cards and application
layouts. Keep a working route and local startup path.
Retain the existing ownership description. Define database, workflow and
recovery interfaces with their M2 operations; M1 needs no empty service modules,
future adapter interfaces or backup/recovery scaffolding.

Completion evidence:
Run the foundation and exercise the route with fixture records. Inspect imports
across the fixture/domain/presentation boundary; domain types must remain
independent of renderer and service types. Run required checks and document the
startup path. Record partial C02/C03/C15 evidence and the remaining M1 work.
Package complete when: the local fixture route runs, the implemented boundary
is visible in code, required checks pass and package 3 can extend the same
presentation without unused M2 infrastructure.
```

### Prompt 3: establish the original living-atlas design system

```text
You are GPT-6 Astra in Codex, implementing a work package in M1: Experience proof.
Required prerequisites: The product contract and runnable UI foundation; use local synthetic data only.
Read AGENTS.md.
Relevant references:
- docs/product/DESIGN.md (Materials; Composition and direct interaction; Interaction transitions and overview)
- docs/product/SPEC.md (C15; Shipped demo and human judgment; IB01-IB06)
- docs/product/ARCHITECTURE.md (Concurrent interaction)

Outcome: A populated, interactive living-atlas experience proof using prepared data.

Integration work:
Implement DESIGN's tokens, typography, composition and card interactions in the
existing fixture presentation. Preserve the original identity assets and author
the mall fixture with independent branches, a multi-parent child, an unkept draft,
a semantic link and unknown evidence. Use the seed alone and selected A/B/C
proposals as the starting material defined in SPEC.
Wire pan/zoom, moving cards with attached edges, source inspection, pair
selection and a local prepared contextual chooser. Expose only functioning M1
interactions; production view switching, generation and voice arrive later.
Update DESIGN only where an accepted design decision changes its contract.

Completion evidence:
Exercise IB01-IB06 on the prepared fixture and label the actual input method,
including any simulation. Inspect populated desktop and narrow renderings for
DESIGN's composition targets, hierarchy and clutter. Trace both parents and
compare distant contributions while retaining orientation. Record the demo
and denser-scene reference setup specified in SPEC.
Run the owner-led M1 small task comparison from this catalog. Record C15 evidence,
fixture boundaries and the owner's observations; prepare the Fable M1 packet.
Package complete when: the full M1 working demonstration and IB01-IB06 work
locally, design/journey evidence is recorded and the exact candidate is ready
for M1 review and owner experience acceptance. Fixture evidence leaves production
persistence, generation and voice open.
```

### Fable review M1: Experience proof

```text
You are Fable 5.1 in Claude, independently reviewing M1: Experience proof
Read AGENTS.md and the Shared demonstration and review section of docs/build-prompts.md.
Use the supplied exact candidate, isolated checkout/data and startup instructions
under AGENTS.md's review rules.

Required demonstration:
Pan and zoom; trace both parents of a recombination; move a card with its edges attached; inspect inherited material; select a pair; open a local contextual chooser on desktop and touch.

Review focus:
Inspect the original populated fixture, not an empty page. Trace both parents, use the contextual chooser and comparison selection, and operate with keyboard/touch. Check hierarchy, atlas character, legibility and control clutter. A static screenshot or attractive background is insufficient. Report experience concerns for user judgment; do not claim the user's acceptance.
Identify a concrete task that is materially easier because of the spatial
interaction. If the same journey is equally clear as a linear chat transcript,
report that the demonstration has not established the modality's value.
Distinguish a weak example from missing behavior; do not automatically remove
capabilities or recommend decorative motion to compensate.

Exercise IB01-IB06 from SPEC instead of checking modalities only in isolation:
pan across text, pinch over card controls, then use keyboard/assistive activation
without touching again; inspect the actual overview targets after Fit; navigate
both incoming and outgoing relationships. Inspect explicit unkept/unknown
fixture states. Report simulated input as simulated, not a physical-device or
screen-reader result. Recheck adjacent transitions after a correction.

Does inspection/comparison help develop a thought while retaining source
orientation, or force the user to reconstruct a diagram after every action?
Treat this as a question for user experience acceptance unless there is a
specific reproduced contract failure. Do not universally ban modals or infer
that prepared suggestions establish live AI quality.
Check the milestone's actual prerequisites: persistent recovery and live voice
belong to M2, not M1. Surface conflicting instructions rather than demand a
future capability or approve a fixture as its implementation.

```

## Milestone 2: Working spine

**Entry:** The complete product contract, runnable foundation and reviewed experience proof. Authorized credentials/spend are required only for the real provider demonstration.

**Working demonstration:** Create a workspace and idea; generate alternatives; trace sources; inspect and keep a result; reload; discuss a card by voice while moving another and receiving durable operation results; interrupt speech.

**Exit and review:** State and lineage persist, a bounded real generation/review path and bidirectional voice work, the canvas stays usable, and Fable verifies this exact spine. Missing live credentials leave the live gate blocked, not replaced by fixture claims.

**Still open:** Rich genome/recipe workflows, full comparison/Weave, alternate views, contextual planning, Wander/Agent Drive, instrument breadth and outputs remain explicitly open.

**Review cadence:** M2 is the heaviest milestone, so it has two review points.
After package 10, run the Fable M2 review below as an **interim review** of the
spine without collaboration: persistence, visible graph, frozen context, durable
execution, one live creative operation and assessment/acceptance. Resolve
material findings before starting packages 11 and 12. After package 12, run
the same review as the **final M2 review** with the full demonstration,
including voice during canvas work. Recheck material corrections when failures
or new evidence warrant it; there is no required number of recheck rounds.

### Prompt 4: implement workspaces, persistence and no-sign-in local access

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: The product contract, runnable foundation and original experience proof.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C01)
- docs/product/ARCHITECTURE.md (Canonical records; Four shared contracts; Provider and deployment boundaries; Open implementation choices)

Outcome: Workspace lifecycle and saved state work through the browser and Postgres.

Integration work:
Replace fixture reads with workspace operations while retaining presentation.
Implement the C01 lifecycle, brief/constraint revisions and independent layout
writes. Define database interfaces against these actual operations using the
selected Drizzle adapters and explicit SQL migrations in ARCHITECTURE.
Implement atomic mutation/receipt storage and safe replay after a lost response.
Resolve M2/4 deletion, retained-history, export and backup/restore policies before
their behavior is implemented. Establish the export contract for current records
and extend it with later feature records; old-system import remains excluded.
Wire no-sign-in local access and Host/Origin/same-origin protections for configured
serving hostnames. These carry into the package 32 Vercel demonstration.

Completion evidence:
Exercise create/open/list/rename/duplicate/delete, brief and constraint edits,
reload, duplicate reference integrity, stale writes, lost acknowledgement and
unavailable configuration against isolated local data. Verify the export contract
and backup/restore procedure for this state. Open without sign-in; reject unexpected
Host/Origin and cross-origin mutations. Record C01 evidence and operating commands.
Package complete when: the lifecycle, revision/receipt paths, export contract and
request protections work against the isolated database, the listed cases pass
and C01 evidence identifies remaining later-package records.
```

### Prompt 5: build the spatial canvas and deliberate view controls

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Working workspace/revision operations and the original fixture presentation.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C02, C15; IB01-IB04, IB06)
- docs/product/ARCHITECTURE.md (Canonical records; Concurrent interaction)
- docs/product/DESIGN.md (Composition and direct interaction; Interaction transitions and overview)

Outcome: The fixture canvas becomes a persistent, directly manipulated workspace.

Integration work:
Wire C02's card editing, selection/comparison set, drag/resize, find/focus/fit,
arrange/reset, saved viewpoints and scoped layout undo/redo to workspace
operations. Keep immediate pointer feedback local and persist deliberate changes
through target-scoped layout commands. Integrate incoming records by ID without
resetting user positions, sizes, selection or camera.
Carry semantic zoom, overlay behavior and input-mode transitions from the fixture
across the real persistence/update boundary.

Completion evidence:
Exercise dragging while results arrive, resize/reload, find/focus, fit, arrange
and layout undo/redo on a populated scene. Repeat IB01-IB04 and IB06, including
keyboard/assistive activation after gestures and intentional text selection.
Check saved sizes/camera, usable overview targets and navigation without model
calls. Record C02/C15 evidence and the documented undo scope.
Package complete when: the persistent C02 journey and listed transition cases
pass on mouse, touch and keyboard with incoming updates and reload.
```

### Prompt 6: make the relationship graph visible and understandable

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Canonical revision identity and working canvas interaction; rerun fixture proposal transitions against real decisions before M2 closes.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C03; IB05)
- docs/product/ARCHITECTURE.md (Canonical records)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: People can trace and manipulate the persisted graph from either endpoint.

Integration work:
Map canonical graph relationships into Lineage edges, neighborhood emphasis,
ancestry/descendant focus and an accessible relationship list. Implement C03's
distinct context, derivation, multi-parent and semantic relationships, including
explicit dense-scene aggregation and disclosed filtering/folding.
Wire direct connection of selected cards and keep endpoints attached across
movement/resize. Carry unkept proposals through real acceptance without severing
sources; repeat that transition once package 10 supplies real decisions.

Completion evidence:
Use one brief, two independent roots, a grandchild, a two-parent recombination,
a semantic cycle and an unkept proposal. Trace every path at rest and through
keyboard/touch; test move, keep, filter and reload. Exercise IB05 from both
endpoints with unknown evidence and unkept work. Record observed C03 behavior.
Package complete when: all fixture paths are traceable in the persisted graph,
edges survive the listed changes, dense omissions are explicit and IB05 passes;
any acceptance dependency is closed before M2 finishes.
```

### Prompt 7: compile exact operation context

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Exact brief/source revisions and relationship identity; rich part-selection UI follows in M3.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C04, C08; Cross-cutting architecture and acceptance)
- docs/product/ARCHITECTURE.md (Context compilation)

Outcome: Preview and execution consume the same exact, inspectable operation input.

Integration work:
Implement the context compiler against stored brief/source revisions. Complete
brief-only and whole-source manifests end to end in M2. Define typed part/excerpt
selection and validate it in domain cases; its richer UI arrives in M3.
Wire readable inherited/selected/excluded material beside the source cards.
Validate dependency revisions and input bounds using ARCHITECTURE's manifest
rules, including declared archive exposure and separate retrieval receipts.

Completion evidence:
Test exact inclusion/order, exclusions, stale excerpts/dependencies, selected
contributions, large inputs and root isolation at the model boundary. Verify
that moving a card or switching views does not stale content-only context.
Record C04/C08 evidence with rich selection UI explicitly pending.
Package complete when: brief-only and whole-source preview/execution share frozen
input, the listed cases pass and typed part selection is tested without blocking
the working spine on its later UI. Paid generation awaits package 8 admission.
```

### Prompt 8: implement durable execution and bounded cost admission

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Frozen context, named application operations and stable command identity.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C10, C12; Cross-cutting architecture and acceptance)
- docs/product/ARCHITECTURE.md (Four shared contracts; Durable execution; Open implementation choices)
- docs/setup.md (Vercel demonstration hosting)

Outcome: A browser action starts a recoverable, bounded operation with visible progress.

Integration work:
Define workflow and recovery interfaces against the actual admission, dispatch,
checkpoint and reconciliation operations. Implement ARCHITECTURE's Postgres/
Vercel Workflow path, stable command/step identities and bounded polling.
Resolve M2/8 run lifecycle policy alongside pause/resume/stop and reconnection.
Expose admitted/running/awaiting-input/completed/failed/stopped states.
Configure the owner's application envelope and component allocations for text,
voice, workflow and database. Reserve bounded attempts/spend before paid work
and retain uncertain attempts under the shared retry/repair allowance.
Follow setup's package 8 project/linking procedure within the applicable
authorization so preview deployments supply hosted evidence. Use the same
previews for package 9 budget rejection and package 12 realtime session limits;
production release remains package 32.

Completion evidence:
Exercise dispatch failure, changed-payload command reuse, duplicate completion,
browser close/reconnect, stopped admission, partial siblings and exhausted
allowance with fixtures. Verify the UI's polling cleanup does not stop the run.
Exercise restart recovery and dispatch reconciliation locally and on a preview,
preserving ARCHITECTURE's distinction between stranded local runs and hosted
step resumption. Do not build a persistent local queue.
Keep Lineage responsive; record the obligation to repeat affected cases in
Evolution/Constellation when those views arrive. Update C10/C12 and architecture
evidence with actual operation/interface boundaries.
Package complete when: admission through recovery and cost denial work with
idempotent application receipts, local/preview recovery evidence is recorded,
the listed cases pass and the M3 cross-view obligation remains explicit.
```

### Prompt 9: generate live alternatives with capability-aware models

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Durable run/cost admission and frozen inputs; authorized provider access for live evidence.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C05, C08, C09)
- docs/product/ARCHITECTURE.md (Provider and deployment boundaries; Durable execution)

Outcome: One-source divergence produces persisted, lineage-linked live proposals.

Integration work:
Connect the context compiler and admitted durable run to a server-side Vercel
AI Gateway adapter through the AI SDK. Consult current official documentation
for supported model settings, credentials, schemas, output/time bounds and
attempt behavior. Runtime model profiles remain explicit.
Persist proposals with full artifacts, concise titles, mechanisms, prerequisites,
uncertainties, per-parent contributions and requested-versus-observed change.
Display each result or failure against its actual context without moving kept
cards. Record actual input/output, finish state, usage and errors.

Completion evidence:
Exercise malformed output and partial siblings, then a bounded authorized live
one-source divergence through admission, provider, persistence and graph display.
Exercise project-budget rejection on the authorized preview from package 8.
Record the result or exact live-access blocker. Track richer branch development,
contextual planning and instruments as remaining C05/C08/C09 obligations.
Package complete when: the integrated divergence path and failure cases work
and its live evidence is recorded; unavailable live access leaves that gate
blocked, with the affected capability rows explicitly partial.
```

### Prompt 10: assess proposals and preserve human decisions

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Generated proposals, immutable source revisions and a visible graph.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C03, C04, C05)
- docs/product/ARCHITECTURE.md (Canonical records; Four shared contracts)
- docs/build-prompts.md (Small task comparisons; Fable review M2)

Outcome: A person can inspect, edit and decide on generated proposals with durable evidence.

Integration work:
Connect assessments to exact proposal revisions and expose supported,
contradicted, unclear, pending and unavailable states. Wire inspect/edit/keep/
set-aside and dependent undo to shared revisions and transactional decisions.
Keeping records the accepted revision, per-parent contributions and lineage
atomically. Editing invalidates dependent text-specific assessments. Reject
deterministically invalid output; unavailable review requires explicit
acknowledgement before keeping it as unreviewed work.
For changed sources, offer regeneration or a separate historical-context branch.
Preserve rejected work and downstream references.

Completion evidence:
Exercise duplicate acceptance, changed parents, unavailable review, edited
annotations, multi-parent keep and dependent undo. Verify visible relationships
before/after keep and after reload, closing package 6's acceptance dependency.
Run the M2/10 small task comparison with saved live results and record the owner's
observations. Update C03/C04/C05 and prepare the interim Fable M2 packet.
Package complete when: the assessment/decision path and listed cases work and
the exact candidate is ready for the required review before packages 11-12.
```

### Prompt 11: build a collaborative typed partner with shared attention

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: The working Lineage canvas, shared command receipts and creative-operation admission.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C13)
- docs/product/ARCHITECTURE.md (Four shared contracts; Context compilation; Open implementation choices)

Outcome: Typed collaboration discusses selected work and performs one requested creative action.

Integration work:
Resolve M2/11-12 transcript retention/deletion before conversation storage.
First connect selected-card context, a typed message and a grounded reply in the
working UI, with actions disabled until wired. Then integrate shared attention
and one explicit creative action through existing commands/admission, displaying
the actual receipt. Exercise each connected chunk before expanding it.
Support C13's discussion, challenges, connections and suggestions; resolve named
cards/relationships/comparison references and fetch bounded details on demand.
Implement sequenced, expiring attention independently of selection and commands.
Keep the collaborator independent of view/panel lifetimes.

Completion evidence:
Exercise discussion during a durable operation, two-card references, relationship
inspection, suggestions versus execution, duplicate intents and out-of-order
attention. Verify the reply and acknowledged creative action in working Lineage.
Record C13 evidence with voice in package 12, cross-view/full creative actions
in M3 and repetition during Wander in M4 still open.
Package complete when: the selected-card discussion, shared attention and one
explicit action work through the UI and existing service path during a durable
operation, and the listed cases and pending obligations are recorded.
```

### Prompt 12: deliver bidirectional voice that survives concurrent work

```text
You are GPT-6 Astra in Codex, implementing a work package in M2: Working spine.
Required prerequisites: Typed collaboration, shared attention, command identity and cost admission.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C13)
- docs/product/ARCHITECTURE.md (Concurrent interaction; Provider and deployment boundaries; Open implementation choices)
- docs/build-prompts.md (Small task comparisons; Fable review M2)

Outcome: Bidirectional voice stays grounded during concurrent canvas and generation work.

Integration work:
Extend the typed collaborator's context, attention, commands and admission with
the Vercel AI Gateway realtime path. Check current official documentation and
the installed AI SDK channel for this beta capability. Resolve raw-audio and
session retention/reconnect policies with the owner before storage.
Use ARCHITECTURE's server token boundary, session limits and independent lifecycle.
Integrate each chunk in the running workspace:

| Chunk | Observable result |
|---|---|
| Provider probe | A bounded authorized Gateway probe establishes authentication, transport, session limits including the team's concurrent-session cap, and supported settings, or records the blocker |
| Basic voice | Connect, speak, hear a reply, interrupt and disconnect with permission cleanup and cost bounds |
| Continuity | Talk about one card while moving another; panel changes and late setup cannot reset or reopen a stopped session |
| One spoken action | A clear request invokes the working typed operation and displays its acknowledged result without duplicate effects |
| Recovery | Reconnect, cancellation, denied allowance and uncertain outcomes work during the combined M2 journey |

Completion evidence:
Exercise fixtures and an authorized real spoken exchange with interruption,
reconnect and pending-permission cancellation. Verify grounded references while
selection, drag, zoom, panels and incoming results change. Check typed fallback,
visible voice state, sound suppression and duration/spend under the shared
envelope, including actual token/billing behavior. Label simulations and live gaps.
Use the package 8 preview for session-limit evidence. Check permission-before-token
setup and initial-message/idle expiry as specified in ARCHITECTURE.
Run the M2/12 small task comparison and full M2 working demonstration. Record C13
and prepare the final Fable M2 packet. Track all-three-view coverage for M3 and
Wander coverage for M4 rather than simulating absent features.
Package complete when: the connected voice chunks and listed cases work, the
real exchange is recorded or its live gate remains blocked, and the exact
candidate is ready for final M2 review.
```

### Fable review M2: Working spine

```text
You are Fable 5.1 in Claude, independently reviewing M2: Working spine
Read AGENTS.md and the Shared demonstration and review section of docs/build-prompts.md.
Use the supplied exact candidate, isolated checkout/data and startup instructions
under AGENTS.md's review rules.

Interim demonstration (after package 10):
Create a workspace and idea; generate alternatives; trace sources; inspect and
keep a result; reload and recover the saved graph/run state. Follow one operation
from source revision through admission, provider result, assessment and acceptance.
Collaboration and voice are open scope, not interim failures. Missing real
provider evidence is still a named live gate; a fixture cannot substitute for it.

Final demonstration (after package 12):
Repeat the interim journey while discussing a card by voice, moving another,
and receiving durable results. Exercise spoken replies, interruption, reconnect
and pending-permission cancellation without losing the workspace context.
An unconnected component or transcription-only path is not complete voice.

Shared review focus:
Apply only the demonstration matching the packet's review stage. Check server
ownership and independent lifecycles. Wander and alternate views remain later
scope. Never approve real-path claims from fixture evidence.
Recheck affected IB01-IB06 scenarios against the working state/update boundary,
including gesture-to-keyboard activation and outgoing relationship inspection
after a result is accepted. A fixture-only pass does not establish the new path.
For each claimed increment, follow its actual UI caller through the application
and service boundary to the visible result. Separate written components,
integrated behavior, local fixture demonstration and real provider evidence.
Do not accept an unconnected voice component or a reported code return as a
working conversation. Review the planned boundary, not every increment as an
additional full-review ceremony.

For the interim review, return READY FOR COLLABORATION INCREMENTS,
CHANGES REQUIRED, or BLOCKED. Interim readiness does not complete M2 or
permit advancing to M3. For the final review, return READY FOR NEXT MILESTONE,
CHANGES REQUIRED, or BLOCKED.
```

## Milestone 3: Creative workspace

**Entry:** A working persistence/generation/review/voice spine with exact source identity and visible relationships.

**Working demonstration:** Inspect a multi-parent genome; preserve selected parts; compare distant cards; choose a card-specific suggested move; Weave and keep a child; revisit history; switch all three views while speaking and while a durable operation finishes.

**Exit and review:** The complete creative-workspace journey works with existing services, all views use canonical data, Fable verifies the interaction, and the user reviews the richer experience. Constellation initially uses a stated computed method, not canned groupings.

**Still open:** Wander-specific recurrence overlays and advanced space readings belong to M4. Standalone instrument breadth and output artifacts belong to M5; they are not optional.

### Prompt 13: expose history, inheritance and the idea genome

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Persistent revisions, graph relationships, proposal assessments and the working spine.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C04)
- docs/product/ARCHITECTURE.md (Canonical records)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: A card exposes readable inheritance evidence and revisitable history.

Integration work:
Connect full artifacts, functional parts/traits, exact parents, selected excerpts,
provenance, assessments, edits and decisions into C04's layered inspection.
Wire ancestor/descendant navigation and revisit to source-linked new revisions
or branches. Invalidate dependent claims on source edits while retaining layout
and unrelated evidence. Keep model annotations, human assertions and locks distinct.

Completion evidence:
Exercise multi-parent inheritance, edited descendants, unknown traits, rejected
work and revisit-after-edit. Compare displayed contributions with actual sources,
records and export; inspecting saved evidence must not call a model. Record C04.
Package complete when: C04's inspection and revisit journey works from any card
and the listed cases match canonical records and export.
```

### Prompt 14: support branch continuation and reusable transformation intent

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Source/history inspection and the already working shared generation/review path; wire real behavior now.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C05)
- docs/product/ARCHITECTURE.md (Canonical records; Context compilation)

Outcome: A person develops a branch and replays reusable transformation intent.

Integration work:
Wire continue/vary/refine, a selected change axis, preserve/avoid choices and
source/change preview into the existing generation/review path. Store versioned
recipes with source identity, constraints and requested behavior. Integrate
preview/accept-as-child/discard and explicit replay against a chosen revision
with fresh validation and separate result identity.

Completion evidence:
Exercise preserve/avoid conflicts, stale selections, recipe replay, rejected
previews and acceptance with downstream history. Use fixtures for focused
iteration, then demonstrate generated alternatives through the working live
path. Record C05's implementation and live evidence separately.
Package complete when: the branch-development and replay journey works through
generation/review, the listed cases pass and C05 evidence is recorded. Missing
live-path prerequisites leave this package incomplete.
```

### Prompt 15: build the comparison workbench

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Canonical cards/revisions and multi-selection; build the complete comparison workbench.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C06, C09)
- docs/product/ARCHITECTURE.md (Canonical records; Concurrent interaction)
- docs/product/DESIGN.md (Interaction transitions and overview)

Outcome: Two to four distant ideas can be compared without generating new artifacts.

Integration work:
Connect ordered comparison slots to exact canonical revisions, with add/remove/
replace and full side-by-side inspection. Implement the Distance Panel using a
stated lexical/structural/semantic method and expose its limits and unknowns.
Keep comparison independent of camera and temporary attention. Integrate the
contextual workbench with voice and the path to contribution selection/Weave;
leave any unwired action explicitly unavailable until package 19.

Completion evidence:
Exercise repeated selection, edited sources, identical artifacts, unknown
profiles, contradictory evidence, slot removal and view switching. Verify
comparison needs no generation and preserves voice and source orientation.
Record C06/C09 evidence with the method and limits.
Package complete when: the complete comparison set and generation-independent
Distance Panel work, and the listed cases pass with voice unaffected.
```

### Prompt 16: implement the Evolution view

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Visible lineage and recorded history; preserve the working voice lifecycle.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C07)
- docs/product/ARCHITECTURE.md (Canonical records; Concurrent interaction)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: Evolution follows recorded development while preserving the shared workspace.

Integration work:
Project canonical ideas, revisions, source links and decisions into the recorded
development timeline. Wire following a thread, inspecting earlier steps,
focusing related work and returning to the current branch. Use actual source
links rather than inferring cause from creation order.
Store Evolution layout/viewpoint independently; integrate shared selection,
comparison and voice. Explain folded history and preserve the user's place
as results arrive.

Completion evidence:
Exercise a branched timeline, two-parent child, revised content, hidden history,
incoming results and saved viewpoint recovery on keyboard/touch. Repeat affected
package 8 run/progress and package 12 voice cases across the available views.
Verify switching does not mutate content or launch generation. Record C07.
Package complete when: Evolution renders real development/source relationships,
its independent layout and cross-view continuity work and the listed cases pass.
```

### Prompt 17: implement the Constellation view

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Canonical graph and view-state separation; compute initial groups, with M4 interpretation tracked separately.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C07, C11)
- docs/product/ARCHITECTURE.md (Canonical records; Concurrent interaction)

Outcome: Constellation provides computed provisional groups on the same canonical ideas.

Integration work:
Compute an initial grouping from available relationships/content using a stated
deterministic method. Wire groups, representatives, outliers, actual ancestry,
search/focus and return to other views. Keep unknown records visible and store
the view's arrangement independently. Recompute through an explicit action or
indicated new analysis snapshot without moving deliberate positions.
Track model-assisted readings and recurrence overlays for M4.

Completion evidence:
Exercise multiple groups, unknown records, cross-group links, filtering, saved
arrangement and switching during updates. Repeat affected package 8 progress
and package 12 voice cases across all three views. Verify stable source identity,
comparison and selection with no model call on view switch. Record C07/C11.
Package complete when: computed grouping and view continuity work, the listed
cases pass and C11's M4 interpretation dependency remains explicit.
```

### Prompt 18: make contextual creative moves specific and immediate

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Shared context, generation, review and the creative workspace; no static-menu substitute.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C08, C15)
- docs/product/ARCHITECTURE.md (Context compilation; Durable execution)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: A card-local chooser leads directly to specific AI-planned creative moves.

Integration work:
Wire the immediate local chooser to saved suggestions, bounded contextual
planning and separate artifact generation. Define planning triggers, revision
freshness and admission under C08; retain choices while planning continues.
Connect the six move families, suggested contrasting partners and source/
contribution preview to the existing context, generation/review and graph paths.
Implement the direct one-level mouse/touch/keyboard journey described in SPEC
and DESIGN; a radial layout is an implementation choice.

Completion evidence:
Exercise different source cards, partner previews, choosing during planning,
late suggestions, source/constraint edits and planner failure. Verify pan/zoom
does not restart planning, the chooser creates no spending authority and each
admitted result/failure reaches the graph. Record C08/C15 and activation counts.
Package complete when: specific suggestions and source preview are available
within the prescribed direct journey, choices survive late results and the
listed freshness/failure cases pass.
```

### Prompt 19: complete distant recombination and contribution selection

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Comparison slots, selected-part context and shared generation/review.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C03, C06, C08)
- docs/product/ARCHITECTURE.md (Context compilation; Four shared contracts)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: Selected contributions from distant ideas become inspectable multi-parent results.

Integration work:
Connect two-to-four-card comparison, whole/part/excerpt selection, source threads
and intended-interaction preview to shared context and generation/review.
Expose combine and recombine semantics and evidence-bearing contrasting-partner
recommendations. Put Connect/Weave beside the selection as prescribed in DESIGN.
Show selected material from each parent against where it appears or changes in
the actual result, and retain all parent edges after acceptance.

Completion evidence:
Exercise different parent counts, duplicate selections, edited sources, partial
alternatives and acceptance/reload. Inspect true contribution preservation,
unsupported inheritance and summary concatenation against the artifacts;
parent IDs alone establish no semantic success. Verify stable camera, slots
and voice, plus the source-selection-to-Weave activation count. Record C03/C06/C08.
Package complete when: selected contributions pass through preview, generation
and keep with all parents traceable, actual inheritance can be inspected and
the listed cases pass.
```

### Prompt 20: connect conversation to the full creative workflow

```text
You are GPT-6 Astra in Codex, implementing a work package in M3: Creative workspace.
Required prerequisites: Working voice, three views, comparison, contextual moves and Weave.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C13, C08; Shipped demo and human judgment)
- docs/product/ARCHITECTURE.md (Four shared contracts; Concurrent interaction)

Outcome: Conversation performs the full creative workspace journey across all views.

Integration work:
Extend the existing typed/voice collaborator from package 11's single action to
ancestry/relationship discussion, contrasting directions, comparison, links,
contribution selection and recombination. Resolve current revisions and affected
sources through the same operations as UI actions. Integrate challenges through
evidence, intervention preview and the requested action, preserving the distinction
between an observation and authorization to act.
Keep partial speech, attention, proposals and finalized commands distinct;
resynchronize relevant context across view/panel changes and source edits.

Completion evidence:
Demonstrate a real or labeled fixture conversation explaining a multi-parent
child, identifying tension, proposing a link and performing requested recombination
during a durable creative operation. Verify no unrequested acceptance, duplicate
effects or canvas lock. Run the full M3 working demonstration, including all
views and voice; record C13/C08 and prepare the Fable M3 packet. Repeat the
conversation during Wander in M4 once that policy exists.
Package complete when: the complete M3 discussion/action and cross-view journey
passes and the exact candidate is ready for review with M4 dependencies recorded.
```

### Fable review M3: Creative workspace

```text
You are Fable 5.1 in Claude, independently reviewing M3: Creative workspace
Read AGENTS.md and the Shared demonstration and review section of docs/build-prompts.md.
Use the supplied exact candidate, isolated checkout/data and startup instructions
under AGENTS.md's review rules.

Required demonstration:
Inspect a multi-parent genome; preserve selected parts; compare distant cards; choose a card-specific suggested move; Weave and keep a child; revisit history; switch all three views while speaking and while a durable operation finishes.

Review focus:
Test inheritance evidence and multi-parent visibility, rejected recipes and revisit behavior, comparison slots, selected contributions, source-specific AI suggestions and actual recombination. Switch Lineage/Evolution/Constellation without changing content or losing voice. Distinguish computed initial Constellation groups from M4 interpretation. Flag generic menus or repeated toolbars that recreate friction.

```

## Milestone 4: Exploration intelligence

**Entry:** The creative workspace, shared operations, durable execution, exact context, and concurrent voice.

**Working demonstration:** Explore independent roots and multiple paths; expose a repeated mechanism; attempt a targeted change and an honest stagnation case; navigate a reading to source evidence; challenge a grouping; pursue an achievable and impossible goal. Speak, move and switch views during these runs.

**Exit and review:** Fable verifies policy/context boundaries and the interactive analysis loop, including previously deferred Wander-plus-voice scenarios. Efficacy has its own evidence status; unresolved human comparative judgments prohibit improvement claims, not honest reporting of implemented behavior.

**Still open:** Instrument breadth and materialized outputs still need M5. Final full-product and infrastructure qualification belongs to M6.

### Prompt 21: build Wander roots, frontier and exploration archive

```text
You are GPT-6 Astra in Codex, implementing a work package in M4: Exploration intelligence.
Required prerequisites: Shared creative operations, durable execution and an independently testable context compiler.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C10)
- docs/product/ARCHITECTURE.md (Four shared contracts; Context compilation; Durable execution; Open implementation choices)

Outcome: Bounded Wander produces independent roots, a frontier and an inspectable archive.

Integration work:
Connect Wander policy to existing context, generation/review, durable execution
and graph operations. Use brief-only inputs for independent roots and record
actual context exposure. Build a frontier and archive of full artifacts,
mechanisms, paths, reviews, repairs, repeated/rejected outcomes and usage.
Integrate allowance-driven concurrent branches, partial results without a keep
click per card, progress/control and archive inspection/export. Resolve the
Wander portion of M4 overlapping-run policy as these operations arrive.

Completion evidence:
Exercise model-boundary root isolation, partial roots, duplicate completion,
browser close/reconnect and archive retention. Verify that failed siblings leave
successful work intact and that results preserve canvas and voice. Record C10
without treating a short run as exhaustive coverage or efficacy evidence.
Package complete when: bounded Wander and its frontier/archive work through
shared operations, the listed cases pass and C10 evidence is recorded.
```

### Prompt 22: make Wander change strategy on actual recurrence

```text
You are GPT-6 Astra in Codex, implementing a work package in M4: Exploration intelligence.
Required prerequisites: Wander roots, frontier, archive and recorded outcomes.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C10, C11)
- docs/product/ARCHITECTURE.md (Four shared contracts; Context compilation; Durable execution)

Outcome: Wander changes strategy from observed recurrence and exposes the result of intervention.

Integration work:
Connect recorded mechanisms/paths to selection among clean roots, local
development, distant recombination and targeted challenges. Record source/context,
requested change, actual result and next-move rationale. Integrate bounded repairs
and a specific stagnation stop that preserves partial work and failed attempts.
Link a user's recurrence challenge to exact revisions, counterevidence, proposed
intervention, an admitted step within scope and its observed result, or a reason
not to act. Reconsider strategy from that evidence.

Completion evidence:
Exercise paraphrases, new wording/same mechanism, real mechanism changes,
infeasible novelty, independent reconvergence, contaminated roots and exhausted
alternatives. Include supported and mistaken challenges, successful intervention
and honest failure. Record C10/C11 dispositions and unresolved quality risks.
Package complete when: observed evidence changes policy or produces a bounded
stagnation stop, both challenge cases have inspectable outcomes, and the listed
cases pass without treating fixture results as live efficacy.
```

### Prompt 23: make the explored space readable, challengeable and navigable

```text
You are GPT-6 Astra in Codex, implementing a work package in M4: Exploration intelligence.
Required prerequisites: Actual artifacts, ancestry/context exposure, archive and computed Constellation view.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C07, C11)
- docs/product/ARCHITECTURE.md (Canonical records; Context compilation)
- docs/product/DESIGN.md (Composition and direct interaction)

Outcome: Patterns and readings lead to source evidence, challenges and concrete next experiments.

Integration work:
Connect the archive and canonical artifacts/paths to Constellation analysis and
Lineage overlays. Implement C11's provisional groups, representatives, outliers,
recurrence and next experiments with exact evidence, uncertainty, counterexamples
and coverage limits. Wire navigation from claims to cards, members and omissions.
Persist explicit challenge provenance and connect it to the intervention/result
path from package 22. Mark stale readings and preserve deliberate arrangement.

Completion evidence:
Exercise misgrouping, unknown profiles, stale data, contradictory evidence,
navigation to a multi-parent source and unsupported attractor/escape claims.
Follow a challenge through its proposed intervention and actual outcome, including
a reason not to act. Record C07/C11 behavior on the canvas.
Package complete when: readings and overlays provide the evidence-linked C11
journey without rearrangement, and the listed cases and feedback loop pass.
```

### Prompt 24: implement goal-directed Agent Drive

```text
You are GPT-6 Astra in Codex, implementing a work package in M4: Exploration intelligence.
Required prerequisites: Shared operations, durable execution, cost admission and recoverable state.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C12)
- docs/product/ARCHITECTURE.md (Ownership and dependencies; Durable execution; Open implementation choices)

Outcome: Agent Drive pursues an explicit goal through the same operations a person uses.

Integration work:
Wire goal, permitted actions, observable stopping condition and attempt/spend
allowance to a goal-directed policy over shared operations. Keep its policy
distinct from Wander. Record action rationale and observed effects, retaining
partial work and history when stopping. Resolve overlapping-run scope and
goal-specific evidence in M4's lifecycle policies, including subjective stopping
conditions that require human judgment.
Expose goal progress/control without blocking canvas inspection or voice.

Completion evidence:
Exercise achievable/impossible goals, repeated attempts, source edits, interruption,
exhaustion and reload. Distinguish estimated progress from observed completion.
Verify identical command receipts through manual and agent invocation and scoped
conflicts while canvas/voice remain usable. Record C12.
Package complete when: the configured goal/control journey and listed cases pass
with shared operation semantics and evidence for each stopping outcome.
```

### Prompt 25: qualify exploration without trusting its own narrative

```text
You are GPT-6 Astra in Codex, implementing a work package in M4: Exploration intelligence.
Required prerequisites: Actual exploration policy, manifests/artifacts and the interactive analysis loop.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C10, C11; Shipped demo and human judgment)
- docs/product/ARCHITECTURE.md (Context compilation; Durable execution)

Outcome: Exploration's functional evidence and human comparison are inspectable.

Integration work:
Use compact repeatable cases covering paraphrases, repeated mechanisms, real
changes, infeasible novelty, independent reconvergence, contaminated roots,
unsupported escapes, misleading summaries and partial failures. Fix supported
context, policy or methodological defects in their owning implementation.
Prepare a small blinded comparison with ordinary independent generation on
representative synthetic briefs. Declare model/settings, candidate/attempt counts
and comparable bounded spend before any authorized run; retain failures, usage
and context exposure. Candidate count alone is not cost parity.

Completion evidence:
Verify isolation, goal fidelity, truthful relationships, archive retention and
bounded strategy change/stagnation. Record human observations separately from
model scores, including confidence, counterexamples and possible refutations.
Keep efficacy unresolved when live runs or human judgments are unavailable.
Run the full M4 working demonstration, including voice and views during Wander
and Agent Drive. Update C10/C11 and prepare the Fable M4 packet.
Package complete when: the compact cases pass, the comparison is prepared,
authorized live runs and human observations are recorded or explicitly pending,
functional/efficacy evidence is separate and the candidate is ready for M4 review.
```

### Fable review M4: Exploration intelligence

```text
You are Fable 5.1 in Claude, independently reviewing M4: Exploration intelligence
Read AGENTS.md and the Shared demonstration and review section of docs/build-prompts.md.
Use the supplied exact candidate, isolated checkout/data and startup instructions
under AGENTS.md's review rules.

Required demonstration:
Explore independent roots and multiple paths; expose a repeated mechanism; attempt a targeted change and an honest stagnation case; navigate a reading to source evidence; challenge a grouping; pursue an achievable and impossible goal. Speak, move and switch views during these runs.

Review focus:
Inspect real manifests, artifacts, transitions and rejected attempts. Do not infer independence from different prompts, an escape from its operation label, or quality from distance. Exercise challenged groupings and source-linked readings on the canvas, plus voice/view continuity during Wander and Agent Drive. Separate implemented policy, live observations and unresolved creative efficacy.
Exercise the complete challenge-to-intervention-to-result loop, including a
mistaken challenge and an attempted change that fails. Verify the displayed
contributions against actual artifacts; correct provenance alone does not
establish that the claimed creative transformation occurred.

```

## Milestone 5: Remaining product capabilities

**Entry:** The creative workspace and exploration intelligence on shared application services.

**Working demonstration:** Invoke each instrument in the browser; produce a structured prototype and isolated runnable HTML; compare a controlled pair; save/download a synthesis and coding handoff.

**Exit and review:** Every required capability has an implemented path. Fable verifies browser instruments, outputs and shared admission. A code block alone is not a working output; unresolved paths remain blockers for M6 completion.

**Still open:** All C01-C15 scope is now implemented or explicitly identified as a gap. Cross-product qualification, infrastructure readiness and final user acceptance remain.

### Prompt 26: implement the complete creative instrument family

```text
You are GPT-6 Astra in Codex, implementing a work package in M5: Remaining product capabilities.
Required prerequisites: Shared generation/review, comparison and branch refinement; extend rather than duplicate them.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C09)
- docs/product/ARCHITECTURE.md (Ownership and dependencies; Context compilation)

Outcome: Each of the five creative instruments is independently usable in the browser.

Integration work:
Connect C09's perspective generation, Constraint Deck, Assumption Fork, Distance
Panel and Refinery to the existing context, admission, generation, assessment,
lineage and decision services. Extend the working comparison/refinement paths.
Give each its distinct versioned input/output contract, prompt or algorithm,
bounded behavior and contextual entry point without duplicating the pipeline.

Completion evidence:
Exercise materially distinct inputs/results for each instrument, content-blind
restrictions, independent assumption reversals, comparison without generation,
retained failures and refinement lineage. Record actual bounded live cases and
labeled fixture evidence separately in C09.
Package complete when: all five instruments are independently callable with
their distinct semantics through shared operations and the listed cases pass.
```

### Prompt 27: materialize selected ideas into controlled prototypes

```text
You are GPT-6 Astra in Codex, implementing a work package in M5: Remaining product capabilities.
Required prerequisites: Selected revisions, shared generation/admission and artifact provenance.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C14)
- docs/product/ARCHITECTURE.md (Ownership and dependencies; Canonical records)

Outcome: Selected ideas produce inspectable, downloadable working browser prototypes.

Integration work:
Connect exact selected revisions, shared generation/admission and artifact
provenance to structured screen/action prototypes and self-contained runnable
HTML. Include goal, preserved contributions, requested behavior and evidence
to return. Implement C14's sandbox boundary, full source inspection, focus/
side-by-side viewing, download and new result revisions.
Preserve failures and partial outputs through the existing receipt path.

Completion evidence:
Exercise structured screen navigation, an actual HTML interaction, malformed
output, forbidden capabilities and source edits after an artifact is used.
Verify generated HTML has no credentials, same-origin authority or unapproved
network access. Record C14 live/fixture evidence and actual interactive results.
Package complete when: both prototype forms work from selected revisions, render
within the required isolation boundary, can be inspected/downloaded and pass
the listed cases.
```

### Prompt 28: support paired experiments, handoffs and reusable synthesis

```text
You are GPT-6 Astra in Codex, implementing a work package in M5: Remaining product capabilities.
Required prerequisites: Prototype/output contracts, comparison and source-linked evidence.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C05, C14)
- docs/product/ARCHITECTURE.md (Canonical records)

Outcome: Experiments and coding handoffs return reusable evidence to the workspace.

Integration work:
Connect selected outputs and comparison to a controlled paired experiment with
declared inputs, comparable conditions, procedure, artifacts and observations.
Generate a coding-session handoff with goal, contributions, constraints, behavior,
uncertainties and observable acceptance cases, independent of hidden conversation.
Wire recording observed effect, evidence and rationale into a source-linked
reusable synthesis with save/copy/download and experiment references.

Completion evidence:
Exercise contradictory outcomes, missing human observation, edited sources,
handoff export and synthesis reload. Keep observations distinct from model
interpretations. Run the full M5 browser instrument/output demonstration, update
C05/C14 and prepare the Fable M5 packet.
Package complete when: the paired experiment, coding handoff and reusable
synthesis work with provenance, the listed cases pass and the exact candidate
is ready for M5 review. Unmeasured effects remain unresolved.
```

### Fable review M5: Remaining product capabilities

```text
You are Fable 5.1 in Claude, independently reviewing M5: Remaining product capabilities
Read AGENTS.md and the Shared demonstration and review section of docs/build-prompts.md.
Use the supplied exact candidate, isolated checkout/data and startup instructions
under AGENTS.md's review rules.

Required demonstration:
Invoke each instrument in the browser; produce a structured prototype and isolated runnable HTML; compare a controlled pair; save/download a synthesis and coding handoff.

Review focus:
Try the distinct instruments in the browser rather than merely inspecting their
names. Exercise prototype interactions and source-linked experiments, handoffs
and synthesis. Check shared operations, source identity and cost admission.
Confirm generated artifacts cannot acquire application authority. No external
API, machine-client journey or generic execution platform is required.
Missing paid-call allowance is a stated limit, not permission to spend or
substitute a fabricated response.

```

## Milestone 6: Integrated release

**Entry:** Implemented C01-C15 paths and evidence/findings from all previous milestones; no unacknowledged scope cuts.

**Working demonstration:** Run the complete cross-view, voice, exploration, comparison and output journey locally and on the served Vercel URL with no sign-in; inject failures; recover and reload; inspect dense scenes and narrow layouts; verify service/data ownership, restore instructions and the teardown plan.

**Exit and review:** Fable's release-candidate review, Astra's evidence-based resolution of material findings, user experience acceptance, local operation with configured services and hosted operation on the served Vercel URL all complete. Missing live provider evidence remains a gap; the demonstration window does not open on a candidate that fails hosted confirmation.

**Demonstration:** prepare one coherent before/after story targeting roughly
90 seconds of presentation, not a 90-second provider-response guarantee.
Clearly label prepared data, live operations, recordings and fallbacks. The
short demonstration highlights the complete product; it does not reduce scope.

**Still open:** Empirical creative superiority may remain unproven and must be described honestly. Required functionality, material unresolved defects or missing experience acceptance cannot be silently deferred.

**Review order:** complete Astra packages 29-31, run the Fable M6 review below against the release candidate, resolve material findings, then run Astra package 32. Return to Fable for hosted-operation confirmation on the served URL before the demonstration window opens; do not wait until after publication for the first release review.

### Prompt 29: qualify concurrency and bounded recovery across the product

```text
You are GPT-6 Astra in Codex, implementing a work package in M6: Integrated release.
Required prerequisites: All required capability paths implemented or explicitly listed as blockers.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C01-C15; Cross-cutting architecture and acceptance; IB01-IB06)
- docs/product/ARCHITECTURE.md (Durable execution; Concurrent interaction)

Outcome: The integrated studio survives concurrent work and bounded failures.

Integration work:
Run Wander; speak about one branch; move/resize another; zoom to distant work;
inspect a relationship; compare/Weave parts; switch all views; interrupt speech;
receive/keep proposals; close/reopen and recover state/runs. Fix reproduced
failures in their owning modules and existing recovery paths.

Completion evidence:
Inject transient provider failure, malformed output, unavailable review, source
edits, duplicate dispatch, delayed reads, voice loss and exhausted allowance.
Check target-scoped conflicts, the combined retry/repair allowance, retained
siblings/uncertain attempts and no false success or replayed decisions.
Use small/dense scenes, mouse/touch/keyboard and reduced motion. Repeat IB01-IB06
and affected voice/update transitions, including the next deliberate activation
after any gesture correction. Save concrete evidence in CAPABILITIES.
Package complete when: the integrated journey and injected failures satisfy the
contracts across the listed scenes/input transitions and evidence is recorded.
```

### Prompt 30: qualify the look, feel and interaction economy

```text
You are GPT-6 Astra in Codex, implementing a work package in M6: Integrated release.
Required prerequisites: A populated working product and original design contract, not a static shell.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C15; IB01-IB06)
- docs/product/DESIGN.md

Outcome: The complete studio meets its visual and interaction contract in actual use.

Integration work:
Review and correct the populated product against DESIGN using independent roots,
descendants, a multi-parent child, semantic links, unkept/rejected work and a
live or labeled fixture run. Fix composition, direct-action or interaction
problems through the existing presentation components.

Completion evidence:
Inspect desktop/narrow, normal-zoom/overview renderings and journeys. Check
DESIGN's field proportion, card hierarchy, activation counts, source threads,
view switching, overlays, focus/contrast, non-color state and reduced motion.
Exercise IB01-IB06 for overview targets, both relationship directions and
comparison orientation. Verify optional sound behavior and voice suppression.
Record annotated images, actual journey results and subjective friction separately.
Update C15 with the owner's look/feel acceptance as recorded or pending.
Package complete when: the populated renderings and journeys meet DESIGN and
SPEC, evidence is recorded and human acceptance status remains explicit.
```

### Prompt 31: prove completeness and architectural improvement

```text
You are GPT-6 Astra in Codex, implementing a work package in M6: Integrated release.
Required prerequisites: The full capability matrix and representative functional/visual/runtime evidence.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C01-C15)
- docs/product/ARCHITECTURE.md (Ownership and dependencies; Infrastructure and extension evidence)
- docs/product/CAPABILITIES.md

Outcome: Full-product completeness and maintainability are supported by traceable evidence.

Integration work:
Trace every capability from visible user action through application logic,
persistence/provider execution and back to the browser. Resolve supported gaps
through their owning modules and record remaining blockers.
Verify ARCHITECTURE's representative new-operation extension: contract/definition,
generation or analysis logic, registration and focused checks should suffice
without changing pointer mechanics, voice lifecycle or unrelated serialization.
Explain any legitimate new-data migration separately.

Completion evidence:
Inspect actual dependency boundaries, shared transports/operations and independent
content/layout/run writes. Exercise isolated infrastructure recovery: configuration,
migrations, pooling, dispatch/reconciliation, diagnostics, backup/restore and
reproducible startup, including service restart and hosted storage ownership.
Confirm code/asset provenance and dependency licenses. Record required checks
and representative live/visual journeys, separating functional, visual,
architecture, infrastructure, runtime and efficacy statuses. Update CAPABILITIES
and the handoff with missing requirements and owner acceptance.
Package complete when: C01-C15 are traced, the extension/recovery checks are
recorded, all gaps are explicit and the exact release candidate is ready for
Fable review before package 32.
```

### Prompt 32: release the Vercel demonstration honestly

```text
You are GPT-6 Astra in Codex, implementing a work package in M6: Integrated release.
Required prerequisites: Fable's M6 release-candidate review, material findings resolved, user acceptance, authorized configured services and the owner's authorization to deploy.
Read AGENTS.md.
Relevant references:
- docs/product/SPEC.md (C01-C15; Shipped demo and human judgment)
- docs/product/ARCHITECTURE.md (Provider and deployment boundaries; Infrastructure and extension evidence)
- docs/setup.md (Vercel demonstration hosting)
- docs/product/CAPABILITIES.md

Outcome: The complete Minerva demonstration operates locally and on its public Vercel URL.

Integration work:
Ship the editable mall demo through normal workspace behavior alongside every
working tool and a blank-start path. Verify tools expanding the seed alone,
selected A/B/C proposals and combinations; retain actual source relationships
and outputs. Record each example in its capability evidence.
Follow setup's authorized deployment procedure for production data/credentials,
Gateway text/realtime voice, durable workflows, owner-selected budgets and
demo seeding. Confirm request protections on every configured serving hostname.
Retain the local loopback startup/recovery path and public repository identity
minerva. Never accept marketplace/legal terms for the person.
Prepare the roughly 90-second central-loop presentation: inspect recurrence,
discuss while moving cards, request an intervention, Weave, inspect the result
and both parents, then decide what to keep. Label prepared/live/recorded/fallback
segments and retain a failed or inconclusive transformation.

Completion evidence:
Exercise the integrated hosted journey on the served URL with configured services,
including relationships, views, contextual choice, recombination, conversation,
partial failure and reconnect. Repeat local behavior where it differs and the
complete M6 working demonstration. Verify each demo tool and the blank start.
Exercise the judge's duplicate-demo start and seed restoration defined in C01.
Deliver the URL, startup/services, provenance, operating limits, window dates,
budget settings, data ownership and blockers. Record setup's teardown plan and
owner in the handoff; execute teardown only when the owner closes the window.
Prepare the exact-candidate packet for Fable's hosted-operation confirmation.
Package complete when: local and hosted journeys work, demo/tool coverage and
operating evidence are recorded, and the confirmation packet is ready. The
demonstration window opens only after required hosted confirmation and owner
acceptance; unproven creative superiority remains a separate status.
```

### Fable review M6: Integrated release

```text
You are Fable 5.1 in Claude, independently reviewing M6: Integrated release
Read AGENTS.md and the Shared demonstration and review section of docs/build-prompts.md.
Use the supplied exact candidate, isolated checkout/data and startup instructions
under AGENTS.md's review rules.

Required demonstration:
Run the complete cross-view, voice, exploration, comparison and output journey locally and on the served Vercel URL with no sign-in; inject failures; recover and reload; inspect dense scenes and narrow layouts; verify service/data ownership, restore instructions and the teardown plan.

Review focus:
Return READY FOR HOSTED RELEASE, CHANGES REQUIRED or BLOCKED for the candidate;
return HOSTED OPERATION CONFIRMED only after exercising the served Vercel URL as
a judge would, with no sign-in. Audit C01-C15 against running behavior and the
exact candidate revision, not the builder's completion narrative. Reproduce
representative concurrency, recovery, relationship and browser output journeys.
Inspect architecture and infrastructure evidence, plus populated desktop/mobile
views. Confirm opening and operating without sign-in, loopback binding for local
development and internal request protections on every configured hostname.
Confirm the deployed revision matches the candidate, production data is separate
from local and preview, the Gateway budget and Spend Management amount are set as
the owner specified, and the teardown plan is written. Do not execute the
teardown. Model agreement is not a substitute for user acceptance.
Sample IB01-IB06 on the final implementation and revisit cases adjacent to
recent fixes. Verify the relationship list is bidirectional in coverage while
preserving each edge's actual direction. Distinguish input simulation, physical
device observation, technical defects and user experience preferences.
Distinguish written, integrated, local/live demonstration, reviewed, accepted
and hosted facts in the handoff. A merge or a Ready deployment does not
establish hosted operation; exercise the served journey yourself.
Watch the central before/after journey without builder narration compensating
for missing behavior. Confirm the user can see the challenge, proposed change,
actual outcome and source evidence. Distinguish prepared, live, recorded and
fallback segments; a short polished presentation cannot conceal missing
capabilities, failed transformations or unusable browser outputs.

```
