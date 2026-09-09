# Minerva capability evidence

Requirements live in [SPEC.md](./SPEC.md); this file records implementation
evidence, not another specification. Status values are `not started`,
`works locally` and `works on the hosted URL`. Update a row only when its
status changes, and keep the evidence column short, naming the surface and the
revision. Do not record reviewer observations, owner remarks or later-milestone
ideas here; the handoff carries the next outcome and nothing else carries a
backlog.

| ID | Capability | Status | Evidence / owning surface |
|---|---|---|---|
| C01 | Workspaces and durable state | works locally | Root atlas uses version-1 IndexedDB saves per browser for cards/provenance, all edges, text, perspective positions/cameras, selection, themes, Talk and expedition histories/readings/notes. Debounced save, reload, confirmed fixture reset and corrupt-save recovery are exercised in the existing mocked browser replay. No server persistence was added; existing managed workspace behavior is unchanged. [Implementation](../../features/atlas/local-state.ts). |
| C02 | Spatial canvas and view controls | works locally | Pan/zoom, Fit, focus/search, pointer and keyboard card movement, persistent-in-session selection; [atlas presentation](../../features/atlas/atlas.tsx). IB01-IB04 and IB06 exercised locally with fixtures. Saved layout/size/camera, resize and session-local layout undo are now integrated with Postgres; the complete M2 interaction matrix is not claimed. |
| C03 | Visible relationships | works locally | [Mall fixture](../../features/atlas/fixture.ts) distinguishes shared brief, derivation, two-parent recombination and a semantic association. Both directions and exact prepared source revisions are inspectable. Moving edges and IB05 exercised locally; the saved graph now includes exact revisions, a grandchild, revised source, semantic cycle and direct connections. Dense saved-graph folding/focus remains incomplete. |
| C04 | History, inheritance and genome | works locally | Root demo inspection and Markdown show parent titles, stored contributions, contextual move names and frozen generation feature/tag/source titles from memory; replay covers generated cards. Existing saved revision/manifests remain; rich genome workflows are open. |
| C05 | Branch development and reusable intent | not started | No application implementation |
| C06 | Comparison and Weave | works locally | Root demo: two or more selected cards generate one live recombination draft with every parent edge and one-line contributions. A real three-parent Sonnet 5 call and browser error/retry, three-parent lineage and reload-reset checks passed. In memory only; no saved recombination. |
| C07 | Three perspectives | works locally | Root Lineage/Evolution/Constellation share cards, selection, comparison and Talk with separate in-memory cameras/layouts. Themes use validated Sonnet 5 groups, incremental SHA-256 cache, Regroup and failure Retry; dev replay plus one real 10-card/4-theme response recorded in HANDOFF. |
| C08 | Contextual creative moves | works locally | Root Consider a move returns three live Sonnet 5 suggestions for one selected card (`feature:moves`); choosing one reuses Wander to create one card and a derivation labelled with its move title. Real planner response, mocked prepared fallback/card Retry, lineage and >=73% zoom/Select checks passed. In memory only. |
| C09 | Creative instruments | works locally | A bounded two-alternative generation and assessment workflow is integrated. One brief-only live Gateway run produced two proposals, followed by inspect/keep/reload/export. Whole-source live execution remains unverified; broader instruments remain open. |
| C10 | Wander | works locally | Root demo: one selected card generates two or three adjacent cards with derivation edges. Local real Sonnet 5 call returned three cards; browser checks cover generation, error/retry and reload reset. In memory only; no durable run or history. |
| C11 | Navigable interpretation and feedback | works locally | Root expedition reading uses Sonnet 5 (`feature:reading`) for mechanisms, changes, observations/hypotheses, two experiments and coverage. Validated step links focus actual cards; Challenge adds only a user note; edits mark stale with Re-read. Mocked replay and one real two-card reading passed; see [HANDOFF](../HANDOFF.md). |
| C12 | Agent Drive | works locally | Root in-memory Expedition chains one Sonnet 5 call per step (`feature:expedition`) from one selected card and a frozen goal, with 2–5 steps, rationale and derivation edges. Replay covers budget, Stop with retained cards, model-claim and stagnation stops; one real two-step run stopped on a model claim. See [HANDOFF](../HANDOFF.md). |
| C13 | Typed and spoken collaboration | works locally | Root Talk preserves typed Sonnet 5 (`feature:talk`) and adds push-to-talk via AI SDK/Gateway `openai/gpt-realtime-2` (`feature:voice`), confirmed by `gateway.getAvailableModels()`. Voice-only server key mints short-lived client tokens. Permission is requested on press; release sends buffered audio; pressing again stops playback. Heard turns and streamed/spoken replies share the transcript and full-canvas context, with selected IDs indicating focus. Mocked denial, setup Retry, delayed setup, interruption, pointer/keyboard hold, dismissal and typed follow-up passed. A real Gateway exchange with a synthetic Chromium microphone is transcribed in HANDOFF; physical microphone/speaker acceptance remains owner-run. |
| C14 | Outputs and reusable results | works locally | Root Export atlas downloads the complete versioned browser save as JSON. Import uses zod shape/reference validation; Replace restores it, Merge remaps distinct content to new IDs and skips duplicates by text hash. Replay checks round trips, duplicate and distinct merges, malformed files and unchanged state on rejection. Existing card/atlas Markdown downloads remain unchanged. [Implementation](../../features/atlas/local-state.ts). |
| C15 | Living-atlas experience | works locally | Original paper/ink atlas, serif cards, screen-space overview targets, explicit dense aggregation, dismissible inspection/comparison. IB01-IB06 exercised locally. Fable approves the M1 candidate; owner accepts the fixture experience with documented orientation/interaction friction. Production capability remains pending. |

## Current milestone

M1 package 2 is implemented and locally exercised. Package 3's experience proof
is implemented and locally exercised; owner comparison is recorded below.
The owner accepts the M1 fixture experience with the limitation recorded below;
Fable technical review is approved. The merged M1 application candidate is
`4e28dfbd85f6cdf349bba6fd2d180371492a327b`.

The application-owned [domain](../../features/atlas/domain.ts) and
[fixture](../../features/atlas/fixture.ts) have no renderer/service imports;
React Flow mapping is confined to [presentation](../../features/atlas/atlas.tsx).
The six-card mall scene has seven relationships. A separate synthetic dense
scene contains 30 cards and 31 relationships; at compact zoom, its 24 variations
are explicitly grouped by source. The index exposes every individual thought
and relationship. Selected variations remain individually visible.

Inputs are prepared, not generated. A/B/C are independent proposals sharing the
brief, not children of each other. The food/tool child explains both inherited
contributions and changes. The repair draft is unkept with unknown evidence;
the kept shopfront example also has unknown evidence. Keeping and certainty are
distinct. Text edits are an ephemeral rehearsal; prepared source excerpts remain
fixed, with no revision-history claim. In the root fixture, no model calls, microphone or persistence
is connected. The separate saved application is described below. Scene switching and reload restore prepared data.

### Local verification

Reference setup agreed by owner: prioritize laptop/desktop, with or without
external monitors. Chromium 153.0.8010.36 on macOS Apple Silicon; automated mouse
and keyboard at 1440×900 and 1280×600, and Chromium CDP simulated touch at 390×844.
This is not a physical touch-device or screen-reader review.

[Browser verification](../../scripts/verify-atlas.mjs) exercises:

- IB01: pan across a title without selecting text or opening a panel; deliberately
  select inspection text. Drag a card and observe its attached edge change.
- IB02: two touch contacts spanning a title and an action control zoom without
  moving a card or activating an action; subsequent deliberate tap opens it.
- IB03: Enter/Space Fit and Zoom after gestures; programmatic button click as
  simulated assistive activation. No claim of actual assistive-technology testing.
- IB04: short and narrow Fit, screen-space focus targets and return to detail.
- IB05: both parents, reverse descendants and both semantic-link endpoints;
  separate unkept/kept decisions from unknown evidence.
- IB06: compare distant contributions, close and preview a prepared move while
  retaining the camera and selection. The text reference contains the same data.

Domain tests check actual source references, bidirectional navigation, unique
endpoints and acyclic inheritance in both scenes. Browser screenshots are local
ignored evidence under `evaluation-artifacts/m1/`; rerun using setup instructions.
No reproduced responsiveness problem required a timing benchmark. Physical input,
subjective orientation and creative usefulness remain human review questions.

## Review and acceptance

M1 has owner experience acceptance with documented limitations and Fable
technical approval at `4e28dfbd85f6cdf349bba6fd2d180371492a327b`.
The owner supplied Fable's disposition on 2026-09-09: separate read-only clone,
medium effort, port 3011, no blocking findings, 11 tests/build/browser replay
passing. Keyboard activation relied on the repository replay; the reviewer's
independent keyboard instrument was inconclusive. Physical touch, screen-reader
behavior and measured layered contrast remain unverified. The owner accepted
overlay occlusion and phone marker-only overview as-is and deferred hosted
atlas verification. Single-click delay remains a non-blocking tradeoff. The
grandchild, revised source and semantic cycle are M2 demonstration obligations.
On 2026-09-09 the owner supplied the M1 text-versus-atlas comparison for the
prepared repair/supper child and both parents at candidate
`4e28dfbd85f6cdf349bba6fd2d180371492a327b`:

- Food hall contributes shared tables and independent kitchens, transformed from
  ordinary dining to eating alongside an ongoing repair.
- Tool library contributes tools and peer learning, transformed from borrowing
  tools to a staffed, hosted repair session. The recombination makes borrowing
  participatory and the meal a social setting around the work.
- The chosen next concept direction is operational feasibility: safe venue
  sharing, competent repair staffing/supervision and appropriate objects. The
  owner proposes a small pilot with low-risk household items to test those
  questions and attendance. This is a concept direction, not verified feasibility
  or authorization to operate a pilot.
- The atlas helped provenance and comparison by making the contributions and
  transformations explicit and distinguishing shared brief context from parentage.
- Separate “Focus on atlas ↗” navigation and relationship/incoming-recombination
  presentation require mentally moving between the draft and its lineage.
  Unknown evidence remains unknown: clearer claimed relationships do not make
  them more trustworthy.

Owner judgment: “useful for tracing and recombination, but not frictionless for
staying oriented in the concept itself.” This records source comprehension and
qualified usefulness. On 2026-09-09 the owner explicitly accepted M1 with the
orientation/interaction friction documented as a limitation. It does not block
acceptance because it does not prevent identifying the parents, their
contributions or the proposed recombination. Lineage exploration is less
seamless, but the core M1 experience remains usable and interpretable.
This acceptance covers the prepared M1 experience at the candidate above;
it does not establish general creative efficacy. Fable's separate technical
approval is recorded above.

The owner previously reported four interaction problems in the prepared atlas: cards could
not move at overview zoom, fixed stacking buried cards, a single overview click
zoomed instead of inspecting, and circular markers showed rectangular highlights.
The corrections keep overview dragging, raise deliberately accessed cards, open
inspection on a single click at every zoom, focus on double-click and place
highlights on the visible shape. Browser regressions exercise overlapping-card
hit detection, overview mouse/keyboard movement, compact simulated-touch dragging
and pinching, click versus double-click, and circular selection/focus styling.
The corrected application candidate is merged and has owner M1 experience acceptance.

The hosted shell was previously verified at
`0f8b1a16e1cd831774bcc09fcb61582a9c31a5de` on
https://minerva-eight.vercel.app. The atlas is published through
[PR #5](https://github.com/brandyn-s/minerva/pull/5); it has not been reviewed,
accepted or behaviorally verified on that URL. The M6 demonstration window is closed.

## Next outcome

M2 is explicitly authorized, with the next review after package 10 before
packages 11–12. Total incremental spending allowance is $5, including authorized
previews on the existing Vercel project and required development database.
Recoverable workspace deletion and complete versioned JSON export are agreed;
backup/restore is excluded by the owner. Managed Postgres is selected.
The saved MVP now integrates persistence, frozen context, Workflow/Gateway generation, assessment and explicit decisions. One browser live smoke run completed four calls for an estimated $0.0035978, kept a revision, reloaded and exported all run records. This was builder verification, not owner acceptance. Required checks pass (14 tests plus lint/typecheck/build). Neon Free is provisioned for development/preview and a $4 non-refreshing Gateway budget is active under the $5 total cap. Broader M2 fault/input checks are not claimed; the owner requested streamlined MVP verification. See [HANDOFF](../HANDOFF.md) for exact evidence, open scope and the committed candidate.

Owner judgment on the live proposals (2026-09-09): both are useful enough to show
that the working flow is becoming concrete, but they converge too heavily on
the same mechanism. Alternative 2 varies scheduling rather than providing a
meaningfully different participation model. This records qualified usefulness
and a variation limitation for review, not full M2 acceptance.

### Overview follow-up

The owner requested title-only overview cards and reported rectangular ghosting
while zoomed out. A held-drag regression reproduced the detailed-card shadow on
the hidden overview container. The working-tree correction removes the subtext
and restricts the drag shadow to full-detail cards. Mouse and simulated-touch
held-drag checks verify transparent overview containers with no shadow/outline;
IB01–IB06 still pass. These changes are not included in committed candidate
`4e28dfbd85f6cdf349bba6fd2d180371492a327b` or the existing review checkout.

## Atlas readability refinement

The atlas uses measured visible boundaries for dynamic Bézier connections.
Endpoint placement and curvature update with movement and semantic zoom; line
weight and dash spacing remain readable. Overview hides edge labels. Dense
variations stay grouped at every zoom and remain inspectable through group lists.
The visible camera panel is hidden; focusing the canvas and using `+`, `-`, or `0`
provides keyboard zoom or Fit. The seed and legend are clearer, and the requested
status and overview annotations are removed. Browser coverage checks visible
endpoint attachment, grouping across zoom, mouse/keyboard and simulated touch.
This is fixture-based evidence, not live service evidence or a new owner acceptance.
