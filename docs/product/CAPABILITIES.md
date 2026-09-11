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
| C01 | Recoverable state | works locally | The root demo uses versioned per-browser IndexedDB storage for atlas records, layout, Talk and Expedition state, with import/export and recovery copies. Editable atlas state remains browser-owned; Neon/Workflow or optional local SQLite/worker own experiment records. [Implementation](../../features/atlas/local-state.ts). |
| C02 | Spatial canvas and view controls | works locally | Root atlas: resize handles at working zoom; bounds-aware edges; positions/sizes and 50 layout-only undo/redo entries per perspective persist in browser save v2. Undo and Redo apply to layout changes; field Ctrl/Cmd+Z and Shift+Z preserve native text editing. Text edits, generation, import/reset clear history. [Browser replay](../../scripts/verify-atlas.mjs) covers resize/reload, edge attachment, move undo/redo and text-edit invalidation. |
| C03 | Visible relationships | works locally | Root atlas: ancestor/descendant focus traverses derivation/recombination only, highlights/dims and lists linked chains. Persistent folded roots hide transitive descendants/edges in every perspective; counted markers and Thoughts index Unfold preserve discoverability and positions. Version 2 JSON includes folds and accepts v1 migration. [Browser replay](../../scripts/verify-atlas.mjs) covers a Weave ancestor chain, three transitive descendants, all perspectives, reload/export/import and zero navigation model calls. |
| C04 | History, inheritance and genome | works locally | Existing append-only revisions/Revert/frozen edges extended with contribution history and operation receipts. Additive v3 compatibility and identity/history Merge pass native tests and focused Develop replay; unknown legacy contributions stay unknown. |
| C05 | Branch development and reusable intent | works locally | Develop keeps artifact identity and saved intents, now sharing versioned operation execution with Expedition. Exact prior revision exposure is recorded. Mocked reuse/Stop and JSON/Markdown round trips pass; no new live efficacy claim. |
| C06 | Comparison and Weave | works locally | [Contribution-based Weave](../weave-release-1.md) supports one editable contribution per source, exact excerpts, historical source/result inspection, separate human interpretations, and frozen variant comparison. JSON/Markdown preserve evidence; conflicting imports keep exact source references. Contract tests and desktop/touch journeys pass. The nine-call formative comparison produced eight valid outputs and one provider response failure; human usefulness review remains pending. |
| C07 | Three perspectives | works locally | Root Lineage/Evolution/Constellation share cards, selection, comparison and Talk with separate in-memory cameras/layouts. Themes use validated Sonnet 5 groups, incremental SHA-256 cache, Regroup and failure Retry; compact theme shelves, readable zoom previews and idea-to-idea association edges; fixture browser smoke and layout/regroup tests pass. |
| C08 | Contextual creative moves | works locally | Root Wander opens three live Sonnet 5 suggestions for one selected card (`feature:moves`); choosing one reuses Wander to create one card and a derivation labelled with its move title. Real planner response, mocked prepared fallback/card Retry, lineage and >=73% zoom/Select checks passed. In memory only. |
| C09 | Creative instruments | works locally | Wander, Weave and Develop share versioned operator contracts with Expedition; successful browser receipts preserve exact context. Configured local journaling uses shared admission and failed-attempt records. Other historical named instruments are not automatically implemented. |
| C10 | Wander | works locally | Current Wander creates related directions; historical autonomous C10 requirements are implemented locally under Expedition. Root sampling, active-population policies and bounded worker execution are synthetic-test verified; hosted durability is unavailable. |
| C11 | Navigable interpretation and feedback | works locally | Local Expedition provides versioned provisional groups/recurrence, exact candidate evidence, explicit challenges/interventions, reassessment and bounded simulation probes. Synthetic end-to-end browser check passes; causal attractors and semantic efficacy remain unvalidated. |
| C12 | Agent Drive | works locally | Expedition supports Neon and Vercel Workflow, plus local SQLite/worker, with pause/resume/stop, atomic reservations and uncertain-call retention. Selection plus an optional direction replaces the configuration form. See [execution](../expedition.md). No model self-report establishes success. Replaces browser-only chaining; old records remain history. |
| C13 | Typed and spoken collaboration | works locally | Typed/voice collaboration uses bounded focused canvas context and discloses omissions; saved transcript remains complete. Context bounds have native tests. No fresh live voice or physical-device acceptance is claimed; see transition handoff for replay results. |
| C14 | Outputs and reusable results | works locally | Browser v3 JSON and Markdown history exports remain; Merge extends compatible identities and retains divergent histories. Local experiment corpus has paginated, scoped queries and exact evidence lookup; private SQLite backup is separate from atlas export. |
| C15 | Living-atlas experience | works locally | Original paper/ink atlas, serif cards, screen-space overview targets, explicit dense aggregation, dismissible inspection/comparison. IB01-IB06 exercised locally. Fable approves the M1 candidate; owner accepts the fixture experience with documented orientation/interaction friction. Production capability remains pending. |

## Embedded reader guide

The root atlas has a Guide button immediately before Menu. Its nonmodal reading
panel introduces the mall example and provides seven expandable reference sections
covering relationships, navigation, perspectives, creative tools, Talk, judgment,
and saving. The content is local and makes no model requests.
[Guide content](../../features/atlas/guide-content.tsx) uses the existing panel
lifecycle. Local in-app checks verified preserved selection/camera, Escape and
close-button focus return, expandable sections, and Menu access. Desktop and
390px phone layouts were inspected. Repository lint, typecheck, tests and build
passed. No hosted or full assistive-technology verification is claimed.

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

## Overview follow-up

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

## Shared compact controls

Local UI normalization uses `components/ui` for feature controls, icons, tooltips
and headers. See [UI ownership](./UI.md). Repository checks and four desktop/touch
UI tests pass, including gallery axe, keyboard/form behavior and atlas journeys.
Focused mocked voice replay passes after preserving Escape propagation through
tooltips. The full replay stops at its older export expectation for `## Decision`,
which the unchanged exporter omits. No live-provider or deployment claim.
