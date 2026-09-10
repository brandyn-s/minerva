# Expedition theme QA

Source visual truth: user attachment `codex-clipboard-c7cedeaf-a23b-4d4f-9cf7-4ea81305a85c.png`.
Source location: `/var/folders/qy/mxhht8_d30dd1bf61h8k525m0000gn/T/codex-clipboard-c7cedeaf-a23b-4d4f-9cf7-4ea81305a85c.png`.
Reference is a 1146x1080 panel crop, approximately twice CSS scale. Compare its
panel framing at roughly 573x540 to the 560px desktop instrument, excluding canvas.
Implementation: in-app browser, 1280x720 desktop and 390x844 narrow viewport.
Screenshots are 1x CSS pixel captures in `evaluation-artifacts/theme/`.

## Fidelity surfaces
- Typography: Georgia content and primary actions, mono labels and helper text;
  uppercase instrument name. Existing responsive sizing preserved.
- Spacing: shared 22px desktop / 18px narrow padding, 9px frame radius, medallion
  and close header. Reader intentionally remains wide with contents and article.
- Colors: Expedition paper #f5eddb, input #fbf7ec, line #c9bea3, selected #273e35,
  teal #417975 mapped to shared guide tokens.
- Assets: original compass, scroll, olive and layout medallions reused. Circular
  cropping prevents the olive image's square background from appearing.
- Content: instrument-specific copy and workflows retained; visible search label
  and catalogue total added to the common hierarchy. No mock content substituted.

## Comparison evidence
Full views: `expedition.png`, `browse.png`, `reader.png`, `layout.png`.
Narrow views: `browse-mobile.png`, `reader-mobile.png`, `layout-mobile.png`.
Focused comparison uses the readable medallion/header, search/goal fields,
source/selected-card accents and primary-action areas in these captures.
The source establishes a shared visual language; different instrument contents
and the reader's wider layout are intentional, not missing Expedition form fields.

## Findings and correction history
- P2: olive medallion showed a square background (`browse-before.png`). Added
  circular image cropping; final desktop and narrow Browse captures confirm fix.
- P2: transparent catalogue left borders left cards visually open. Applied a
  continuous warm border with teal reserved for selection; final Browse confirms.
- P2: selected-card preview obscured mobile Layout. Raised the open Layout's
  stacking context above the preview; final mobile capture verifies clear actions.

## Functional checks
Search for food returns one thought; checking it updates selection; disclosure
reveals summary and actions. Reader contents switches to A food hall and Next
switches to A shared tool library. Arrange enables Undo; Undo enables Redo;
Redo and Undo restore the layout. Close returns to toolbar; Escape closes Layout.
No browser console warnings/errors. No provider requests made.
Repository check passes lint, TypeScript, 15 tests and build.

## Remaining limits
Local fixture UI verification only; no deployment or live-provider verification.
## Typography consistency revision
User feedback identified inconsistent interiors despite the shared frame.
Replaced pane-specific effective typography with shared title/body/control/label/
note tokens; normalized header sizing, secondary buttons, spacing and Layout width.
Final desktop evidence: `expedition-v2.png`, `browse-v2.png`, `reader-v2.png`,
`layout-v2.png`; narrow evidence: `browse-mobile-v2.png`, `reader-mobile-v2.png`.
Compared the same food-hall title and summary across Expedition, Browse and reader:
24px titles (22px narrow), 18px body, 20px actions, 14px labels, 12px notes.
All retain Georgia content and monospace instrument labels; the source reference's
material palette and medallions remain. The uniform type scale is the intentional
revision requested by the owner after the first visual review.
Short-screen Expedition initially clipped Start with a selected source; shared
compact spacing and 96px goal field restore the full form at 1280x720.
Narrow reader contents initially clipped a wrapped title; increased its bounded
height and item width. Final narrow capture verifies full title access.
Search/disclosure and reader Previous navigation rechecked. No console errors.
No actionable P0/P1/P2 findings remain.

## Compact density revision
Owner requested less space throughout. Shared scale reduced to 20px titles,
15px body, 16px controls, 12px labels and 11px notes. Padding is 14px; medallions
32px; desktop controls 36px with 44px coarse-pointer minimums. Widths are 440px
for Expedition/Browse, 340px Layout, 880px reader; reader height capped at 520px.
Evidence: `expedition-compact.png`, `browse-compact.png`, `reader-compact.png`,
`layout-compact.png`, `reader-mobile-compact.png`. Captured at 1280x720 and 390x844.
Palette, source assets and shared role hierarchy retained. Desktop catalogue
shows all six titles; Expedition Start remains visible. Reader navigation and
catalogue search/disclosure still work. No observed console errors.

final result: passed
