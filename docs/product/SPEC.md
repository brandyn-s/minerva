# Minerva: observable product specification

This is the authoritative required scope. The seed implements a shell, not
these application capabilities. C01-C15 are required before prototype
completion; milestones are demonstrations of progress, not smaller products.
Implementation and composition may improve without a pixel-for-pixel replica.

The central loop is explore, observe, challenge, intervene, inspect the result.
A person can discuss possible recurrence while manipulating the field, inspect
evidence, request a change, recombine useful contributions and see both parents
and what actually changed. A mistaken challenge or failed intervention is an
honest outcome, not a defect to hide.

## Required capabilities

### C01: Workspaces and durable state

Create, list, open, rename, duplicate and deliberately delete workspaces.
A workspace has a brief and explicit constraints with revision identity.
Duplicate creates independent IDs while preserving internal references;
deletion accounts for active jobs and dependent history with clear confirmation.
Reload recovers canonical content and view state, not only browser storage.

Export versioned content, revisions, relationships, layouts, proposals, decisions,
runs/attempts and provenance from a consistent snapshot without pagination loss.
Old-system imports, endpoint compatibility and offline synchronization are not required.
Public code does not grant access to workspaces or paid operations. There is
no sign-in, account or owner-password screen. Local development binds to loopback;
the release target is a public Vercel deployment for a bounded demonstration
window used by a small judge panel. The browser is the only client; internal
application endpoints and server-held provider credentials remain. Reject
unexpected Host/Origin values and cross-origin mutations on every configured
serving hostname; do not enable permissive CORS or treat an open URL as
permission for unrelated websites to trigger paid work. These are internal
request protections, not a user login flow.

During the demonstration window the judges share one deployment and its
workspaces without accounts. The window's dates, the configured Vercel budget
and the teardown at its end are the controls; record them in the application
handoff. Do not add accounts, access infrastructure or access-gating
confirmation steps that slow the judges; the deletion confirmation above stays.
Judges start by duplicating the seeded demonstration workspace, and re-running
the seed restores it. Local services must stay running for local work to
execute; browser closure is not service shutdown. After a service or deployment
restart, recover saved state and reconcile interrupted work. Locally, a restart
surfaces stranded runs from their dispatch records and re-dispatches or fails
them explicitly; full resumption of in-flight steps is a hosted property of
Vercel Workflow.

### C02: Spatial canvas and view controls

Title-first cards support creation, inspection/editing, selection/multi-selection,
dragging and resizing. Support mouse/touch/keyboard pan and intent-anchored zoom,
search/focus/fit, explicit arrange/reset, layout undo/redo with a stated scope,
and saved per-view viewpoints. Rich content is available without filling every
card with buttons or text.

Pointer feedback is local; deliberate layout mutations use independent
revision-scoped writes. Incoming results merge by ID without changing the
camera, selection, sizes or existing positions. Navigation does not launch
model work. Detail overlays do not resize the canvas or reset its transform.
Dense views use stable semantic-zoom thresholds and explicit aggregation while
preserving access to selected objects.

Exercise transitions between input modes, not only mouse, touch and keyboard
in isolation. Panning must not accidentally select card text; intentional text
selection in reading/editing surfaces remains available. Pinch works when
contacts begin over cards as well as empty space. Gesture completion cannot
trigger an unintended card action or suppress the next keyboard/assistive
activation. Fit/overview must preserve a discoverable, usable path back to
working detail rather than leaving miniature controls.

### C03: Visible relationships

Distinguish brief/run context membership, exact-revision derivation,
multi-parent recombination and labeled semantic links. Derivation is acyclic;
semantic links may cycle and preserve kind/direction in identity. Independent
roots share context, never invented parentage.

Meaningful source/result connections are traceable at rest at normal working
zoom. Hover, selection and focus strengthen a neighborhood; they are not the
only discovery mechanism. Include ancestor/descendant focus and an accessible
relationship list covering incoming sources and outgoing descendants and
semantic associations, with direction, kind and navigable endpoints. Either
endpoint can reveal an association without falsely treating it as parentage.
Endpoints follow movement/resize. Keeping a draft and
reloading preserves all real parents. Folding and filtering disclose omissions.
Stored rows, parent counts or invisible SVG paths do not establish this capability.

### C04: History, inheritance and genome

Inspect full artifacts, exact parent revisions, functional parts/traits,
inherited/changed/new material, reasons, enabled moves and per-parent evidence.
Show original model input/provenance, assessments, edits and decisions in
readable layers, with exact source excerpts available.

Genome is a product metaphor, not a fixed taxonomy or novelty score. Unknown
traits stay unknown. User constraints, model annotations and human assertions
are distinct. Revisit creates a new source-linked revision or branch without
erasing later work. Editing invalidates only dependent claims; old reviews
cannot silently apply to new text. Inspecting saved evidence needs no model call.

### C05: Branch development and reusable intent

Continue any branch; vary/refine a selected axis; choose traits to preserve or
avoid. Preview exact source and requested change before acceptance. Retain
discarded proposals and reasons. A versioned recipe can be explicitly replayed
against a chosen revision with fresh validation and separate result identity.
Save an evidence-bearing reusable synthesis. No silent source overwrite or
automatic promotion of model assumptions to user constraints.

Assess exact proposal revisions for goal fidelity, explicit constraints, causal
dependencies, requested transformation and mechanism differences. Distinguish
supported, contradicted, unclear, pending and unavailable evidence. Keeping
records the decision, accepted revision and per-parent contributions atomically.
Deterministically invalid output cannot be kept; unavailable assessment requires
explicit acknowledgement as unreviewed work. Changed sources require regeneration
or a separate historical-context branch. Undo preserves downstream references.

### C06: Comparison and Weave

Maintain a two-to-four-card comparison set distinct from camera and AI attention.
Add/remove/replace slots, inspect full artifacts side by side, and compare
mechanisms, constraints, inheritance and evidence without mandatory generation.
Unknown profiles and contradictions remain distinct; distance is not a winner.

Select whole ideas or exact parts/excerpts from distant cards. Combine preserves
recognizable contributions; Weave/recombine changes how functional parts
interact. Preview selected material and intended interaction. Show each result
with all parents and compare the actual output against the claimed contribution.
Concatenated summaries and valid parent IDs do not prove meaningful inheritance.

### C07: Three perspectives

Lineage, Evolution and Constellation operate on the same IDs, revisions,
decisions and runs, with independent saved arrangement/viewpoint state.
Lineage shows derivation; Evolution follows recorded development and history;
Constellation exposes provisional relationships/groupings under a stated method.
One renamed grid or disabled tabs do not count as three views.

Switching preserves useful selection, comparison and voice without triggering
generation. Unknown records remain visible. Analysis does not silently rearrange
the user's field. Context membership, ancestry, similarity and real-world causal
claims must not be conflated.

### C08: Contextual creative moves

Offer card-specific AI suggestions for divergence, combine, recombine, split,
tension and mechanism escape. Each states what changes, why, actual sources/
partners and what to preserve. Retrieve useful contrasting partners when
appropriate rather than requiring every pairing or a long instruction from the user.

A discoverable, local, one-level chooser appears immediately and supports touch/
keyboard. Choose available suggestions while planning continues; late arrivals
cannot overwrite a choice. Pan/zoom does not restart planning; source edits
do require revalidation. Preview affected sources before admission. A labeled
generic fallback is not a substitute for contextual intelligence.
Inspect a card in one activation; open/choose a move in at most two, excluding
optional editing. After source selection, Weave is one further activation.

Opening the chooser is local; planning suggestions and generating creative
artifacts are distinct operations. Show valid saved suggestions and explicit
pending/unavailable state. Planning uses declared inputs, revision-scoped
freshness and bounded cost admission under an explicit request or existing
authorized scope. Opening a menu creates no spending authority; navigation
cannot launch model work. Define planning triggers with C08 without silently
precomputing outside that scope or adding confirmation to already authorized work.

### C09: Creative instruments

Provide independently callable perspective generation under conflicting named
operations, Constraint Deck (content-blind chance/medium/scale/combinatorial
restrictions), Assumption Fork (independent reversals of named agency, sequence,
interface or success assumptions), Distance Panel (generation-independent
comparison), and Refinery (human-selected development).
Each has distinct semantics, bounded behavior and a versioned input/output
contract, not five labels for one prompt. Experimental constraints stay
experimental. They share generation, review, context and admission machinery.
These are selectable instruments, not a taxonomy every Wander idea must fit.

### C10: Wander

Run bounded durable exploration with brief-only independent roots, a frontier,
archive-aware development, distant recombination and targeted interventions.
Record actual context exposure, paths, requested/observed changes, repairs,
repeated/rejected outcomes, assessments and usage. Generation, strategy and
space analysis are separate responsibilities.

Detect recurrence from artifact mechanisms and recorded paths, not titles,
labels or the generator's narrative. Change approach on stagnation while
preserving goals and explicit constraints. Repetition needs a recorded reason.
Bound combined retries/repairs; preserve successful siblings and explain
exhaustion. Starting points are not a claim of exhaustive space coverage.
Results appear without a keep click per card, distinct from human-kept work.
Start/pause/resume/stop and partial results survive browser close/reconnect.

### C11: Navigable interpretation and feedback

Expose groups, representatives, unusual candidates, recurrence and possible
connections with exact artifact/path evidence. A provisional basin is a group
under a stated analysis; a candidate attractor requires distinct paths returning
to a mechanism with shared context disclosed. A supported escape needs an
evidenced mechanism change still serving the goal, not merely a new label.
Feasibility and global novelty remain separate.

"What this space suggests" links exact revisions, distinguishes observations
from hypotheses, includes counterexamples/coverage limits and offers concrete
next experiments. Navigate to actual cards and challenge a grouping or
equivalence. Feedback links to an authorized intervention and its result, or
an explicit reason not to act. A challenge is not automatically fact or a
permanent constraint. Stale readings are marked; even fresh narrative is not
authoritative hidden context.

### C12: Agent Drive

Pursue an explicit goal with permitted operation scope, observable stopping
condition and attempt/spend allowance. Its policy is distinct from Wander,
but shares operations and execution. Record rationale and observed effects;
model-estimated progress is not an observed satisfied condition. Stop on
completion, user stop, exhausted allowance or bounded stagnation, preserving
partial work. Never redefine success after seeing the result.

### C13: Typed and spoken collaboration

Discuss, explain, challenge and develop ideas; suggest links, resolve card/edge/
comparison references and perform explicitly requested scoped actions through
the same application operations. Fetch bounded relevant details rather than
resending the entire graph/transcript. Clarify ambiguity; speculation is not
a new constraint. Report acknowledgements, not model intentions.

Bidirectional voice includes spoken replies, interruption/barge-in, disconnect
and reconnect, not transcription alone. Talk about one card while moving
another. Panel/view changes and incoming results do not reset the connection.
Stopping pending permission/setup disposes late media and cannot reopen it.
Reconnect resynchronizes context without replaying executed intents or stale
navigation. Partial speech never mutates. Keep typed fallback and visible
microphone/listening/speaking states. Attention expires and does not steal
selection, write content, launch work or move the camera without explicit navigation.

### C14: Outputs and reusable results

Produce exact-revision-linked structured browser prototypes, isolated runnable
HTML, controlled paired experiments and coding-session handoffs. State the goal,
contributions, constraints, observable behavior and evidence to return.
Prototype interactions actually work; static validity is not demonstrated utility.
Generated HTML has no app credentials, same-origin authority or unapproved
network access. Generated server execution and autonomous site deployment are excluded.

Provide focus/side-by-side inspection, download and new result revisions.
Paired experiments declare comparable conditions and preserve contradictory
outcomes; model scores are not human observations. Save observed effect,
evidence, rationale and reusable synthesis linked to source records.

### C15: Living-atlas experience

Follow [DESIGN.md](./DESIGN.md): original cartographic paper/ink, expressive
titles, legible source threads and compact contextual controls. The field
dominates, details are on demand, and fewer buttons must not mean lost capability.
Keyboard/touch, narrow screens, focus, contrast and reduced motion remain usable.
Sound is off by default, sparse, explicitly enabled and suppressed during
voice. Model output gets no correctness celebration.

## Cross-cutting architecture and acceptance

Models interpret, suggest, generate and explain. Conventional code validates
identity, revisions, graph references, authority, admission and state transitions.
Deterministic code still needs evidence of correctness and cannot certify
semantic truth or novelty. Freeze exact source/brief revisions, selected parts,
inclusion/order reasons, prompt/model profiles and declared archive exposure.
No hidden memory is appended afterward; later retrieval gets its own receipt.

Duplicate commands return the same receipt; changed payload reuse conflicts.
Content, layout, run and voice lifecycles stay independent. Quota denial stops
admission, partial failures retain evidence and stop does not promise zero
cost for in-flight work. The owner sets the Vercel AI Gateway budget and platform
spend limits for the demonstration window; application admission keeps its own
bounded allowances because platform metering is delayed and soft.

Use an original scenario with a brief anchor, independent roots, a grandchild,
a multi-parent child, a semantic cycle, revised source, unkept/rejected work
and an unknown mechanism. Trace relationships while moving and accepting;
compare/Weave and revisit; speak and switch views while results arrive; challenge
recurrence; pursue successful/impossible goals; produce and download outputs
through the browser. Inject stale writes, malformed results, unavailable review,
voice loss and exhausted allowance.

Milestone evidence, review findings and user acceptance are recorded in
[CAPABILITIES.md](./CAPABILITIES.md). Functional completion, infrastructure
readiness, experience acceptance and empirical creative efficacy are distinct.
A roughly 90-second presentation may highlight one honest before/after loop,
but does not replace full-product evidence or justify fake live behavior.

### Shipped demo and human judgment

Ship editable demo data whose seed prompt is **What to do with a dead shopping
mall**. The demo shows each tool and all C01-C15 capabilities in exploring this
creative space, including contrasting branches, inheritance, Weave, the three
views, instruments, Wander, patterns, Agent Drive, conversation and outputs.
Use synthetic material; additional site facts and constraints must be explicit
example assumptions, not invented facts or permanent application requirements.

Include editable starting proposals A: independent retail shops, B: a food hall,
and C: a shared tool library. Users can apply tools to the seed problem alone,
to any one proposal, or to a selected combination, and continue developing the
resulting branches. The demo's purpose is to expand and explore the creative
space. These proposals are starting material, not preclassified equivalents,
endorsed answers or limits on subsequent directions. Brief-only results retain
context membership; source-directed results retain their actual source revisions.

Open the demo through normal workspace behavior and let users continue it with
the same fully functional tools available in a blank workspace. Prepared records
and fresh operations remain distinguishable. Demonstration data is shipped
product content; it does not replace working tools or live-service evidence.
Build the demo incrementally with each capability and verify complete coverage
at M6. The content-free template records this contract; its generated application
owns the data and implementation.

Humans judge feasibility of proposed ideas and usefulness of the creative
experience. Models can explain tradeoffs and supply evidence, but cannot grant
those judgments. The owner steers examples, acceptance and iteration through
milestones and their chunks. Small task comparisons in the build plan support
that judgment without adding an efficacy gate or requiring numerical scores.
Develop operational semantic examples with the owner and place agreed examples
beside their owning capabilities. Proposed examples are not accepted rules.
Frame each example as starting material, a requested tool operation, the resulting
proposal and inspectable inherited/changed contributions. Use these transformations
to clarify semantics as the creative space develops.

### Interaction boundary scenarios

These are reusable acceptance cases, not prescriptions for a particular
pointer-event implementation. M1 exercises them on explicitly prepared data.
M2 and later milestones repeat affected cases when persistence, incoming
results, view changes or voice are introduced. A fixture pass is not evidence
for those later service boundaries.

| ID | Journey | Observable outcome |
|---|---|---|
| IB01 | Pan across card titles; then select text in an inspection/editing surface | No accidental field text selection; deliberate reading/editing selection still works |
| IB02 | Begin a pinch over a card title/body and across an action control; release and tap | Zoom responds without accidental drag, selection or activation; the subsequent deliberate tap works |
| IB03 | After a pinch or drag, activate Fit/Zoom and a card using Enter, Space and supported assistive activation | Actions work without requiring another pointer contact; no stale gesture suppresses or replays input |
| IB04 | Fit a narrow and a short desktop viewport, then open a thought and its actions | Overview labels/focus targets remain usable; working controls are discoverable, not scaled into unreadable or untappable miniatures |
| IB05 | Inspect a multi-parent child, each parent and either end of a semantic association; include an unkept draft and unknown evidence | Incoming/outgoing links are navigable with correct kinds/directions; draft acceptance and evidence certainty remain distinct states |
| IB06 | Inspect a contribution, compare distant thoughts, dismiss comparison and consider a prepared move | Selection and deliberate viewpoint survive; the person can explain which sources the action concerns without reconstructing context from scratch |

Record input device, viewport, revision and observed result for a failure.
Simulated touch or assistive activation is labeled as such; do not claim a
physical-device or screen-reader review that did not occur. Recheck the original
failure and adjacent transitions after a fix, not just its happy path.
Whether comparison/inspection feels like developing an idea rather than
operating a diagram is a user experience judgment. A modal is not automatically
wrong, nor is a non-modal layout automatically better; demonstrate the journey
and separate reproduced failures from preferences.

Use a lightweight reference setup: record the browser/version, device/input,
viewport and actual card/edge counts for the demo and one denser scene. Choose
these with the owner during M1 and extend only as actual use warrants. Observe
direct manipulation, orientation and waiting separately from provider response
time. Measure a reproduced responsiveness problem when needed; do not create a
performance framework, broad device lab or arbitrary latency acceptance gate.

## Product exclusions

External API buildout, machine-client credentials,
accounts/sign-in and access infrastructure are excluded. Internal
browser/voice server endpoints are not an external API product and remain required.
Multi-human co-editing, billing, a plugin marketplace, microservices, desktop
agent hosting, global scale and a large research harness remain outside scope.
