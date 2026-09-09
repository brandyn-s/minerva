# Minerva capability evidence

Requirements live in [SPEC.md](./SPEC.md); this file records implementation
evidence, not another specification. Status values are `not started`, `partial`,
`implemented`, `exercised`, and `accepted`. A seed shell is not product evidence.

Use the existing evidence column and handoff to distinguish delivery facts;
do not introduce a second tracking system or treat these as seven mandatory
sequential gates. Written code may still be unintegrated. Implemented behavior
has a connected path through the applicable UI/application/persistence/provider
layers. Exercised behavior states whether it was demonstrated locally with
fixtures or against live services. Reviewed identifies the candidate and
review disposition; accepted identifies the user's decision and its scope.
Deployed identifies the actual serving revision/URL, not merely a merged commit.

For example: "Typed reply integrated and demonstrated locally in fixture mode;
live transport unverified; review pending; not deployed." M1's live-service facts
are not applicable to its prepared proof, not evidence that those services work.
Keep a whole capability partial when only one increment is complete.
For each implemented capability, link its mall-demo example and observed tool
behavior in the existing evidence column. Record the owner's feasibility and
usefulness judgments and small task comparisons here; do not substitute model
scores or imply that preparing demo data completes a capability.

| ID | Capability | Status | Evidence / owning surface |
|---|---|---|---|
| C01 | Workspaces and durable state | not started | No application implementation |
| C02 | Spatial canvas and view controls | partial | Pan/zoom, Fit, focus/search, pointer and keyboard card movement, persistent-in-session selection; [atlas presentation](../../features/atlas/atlas.tsx). IB01-IB04 and IB06 exercised locally with fixtures. Saved layouts, resize, layout undo and real persistence remain open. |
| C03 | Visible relationships | partial | [Mall fixture](../../features/atlas/fixture.ts) distinguishes shared brief, derivation, two-parent recombination and a semantic association. Both directions and exact prepared source revisions are inspectable. Moving edges and IB05 exercised locally; real stored graph remains open. |
| C04 | History, inheritance and genome | not started | No application implementation |
| C05 | Branch development and reusable intent | not started | No application implementation |
| C06 | Comparison and Weave | partial | Prepared contribution comparison retains selection/camera. Source-aware Weave preview is local text only; no generated draft or saved recombination. IB06 exercised; production capability remains open. |
| C07 | Three perspectives | not started | No application implementation |
| C08 | Contextual creative moves | partial | Card-specific prepared questions and previews for the brief and selected A/B/C proposals. No contextual model planner or execution. Mouse and simulated touch journeys exercised. |
| C09 | Creative instruments | not started | No application implementation |
| C10 | Wander | not started | No application implementation |
| C11 | Navigable interpretation and feedback | not started | No application implementation |
| C12 | Agent Drive | not started | No application implementation |
| C13 | Typed and spoken collaboration | not started | No application implementation |
| C14 | Outputs and reusable results | not started | No application implementation |
| C15 | Living-atlas experience | partial | Original paper/ink atlas, serif cards, screen-space overview targets, explicit dense aggregation, dismissible inspection/comparison. IB01-IB06 exercised locally; Fable review and owner judgment remain pending. |

## Current milestone

M1 package 2 is implemented and locally exercised. Package 3's experience proof
is implemented and locally exercised; owner comparison and
Fable review and experience acceptance remain pending. The implementation branch is `feat/m1-atlas`, based on
`1e2ae9c92b597040578949c9ad0af8f2343e74b0`. The operator handoff supplies the
exact merged candidate for review; this document does not assert human acceptance.

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
fixed, with no revision-history claim. No model calls, microphone or persistence
is connected. Scene switching and reload restore prepared data.

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

No milestone is reviewed or accepted. The owner agreed to the reference setup,
not overall visual-direction acceptance or creative usefulness. Required M1 comparison task:
read the prepared repair/supper child and both parents as text, then in the atlas;
identify what each contributes and choose a next direction. Record the owner's
source comprehension, orientation, interaction friction and judgment here after
they perform the task. The owner reported four interaction problems in the prepared atlas: cards could
not move at overview zoom, fixed stacking buried cards, a single overview click
zoomed instead of inspecting, and circular markers showed rectangular highlights.
The corrections keep overview dragging, raise deliberately accessed cards, open
inspection on a single click at every zoom, focus on double-click and place
highlights on the visible shape. Browser regressions exercise overlapping-card
hit detection, overview mouse/keyboard movement, compact simulated-touch dragging
and pinching, click versus double-click, and circular selection/focus styling.
The owner has authorized commit and merge of the corrected candidate, but has
not supplied a complete text-versus-atlas comparison or M1 acceptance.

The hosted shell was previously verified at
`0f8b1a16e1cd831774bcc09fcb61582a9c31a5de` on
https://minerva-eight.vercel.app. This local atlas has not been published,
reviewed, accepted or verified on that URL. The M6 demonstration window is closed.

## Next outcome

Owner performs the M1 comparison; operator starts Fable 5.1 on a separate
checkout of the exact committed candidate for the
M1 review. Resolve confirmed blockers and obtain owner experience acceptance
before dependent M2 work. M2 implementation is not authorized by this task.
