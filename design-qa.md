# Shared compact UI QA

Visual direction: the owner's Expedition reference, with the subsequently
requested compact density. Shared palette, serif content and monospaced labels
remain. Control sizes are 36px desktop and 44px for coarse pointers; functional
icons use one 18px family. Source medallion artwork remains.

## Scope
Shared controls replace raw buttons, fields and disclosure triggers throughout
Atlas, Layout, Expedition, Browse, reader, Talk, Voice, Guide and existing
workspace/exploration screens. Canvas markers retain zoom-dependent geometry.
Shared control defaults use a lower layer; existing feature styling is preserved.

## Evidence
`npm run check` passes lint, typecheck, 17 Node tests and production build.
`npm run test:ui` passes four browser tests at 1280x800 desktop and 390x844 touch.
The gallery verifies disabled/busy/pressed states, keyboard tooltip dismissal,
native form behavior, radio arrow navigation and disclosure activation.
Axe reports no violations on the gallery; this is not a full application audit.
Atlas journeys verify Browse search and selection, Expedition configuration,
reader navigation, Layout undo/redo and Talk composer availability.
Provider routes are intercepted. No paid calls are made.

Computed-style regression contracts live in `tests/ui/snapshots` and cover
fonts, colors, borders, spacing and target sizes. These are not pixel baselines.
Screenshots beneath `test-results/ui` include gallery, Browse, Expedition,
reader and Talk for both viewports. Narrow Expedition and Talk were visually
inspected for clipping and control consistency. The local in-app gallery and
Browse were also inspected. No horizontal document overflow in tested journeys.
Production `/dev/ui` returns HTTP 404.
Focused mocked voice replay passed, including hold/release, mute, close/Escape,
retained sessions and explicit End. Tooltip dismissal preserves panel Escape.

## Maintenance
ESLint rejects feature-owned raw controls, direct icon imports, inline control
paint and feature stylesheets. Rule tests verify allowed and rejected examples.
CI runs the repository checks and the UI browser suite.
New reusable variants must be added to the gallery and verified there.

## Limits
Local verification only; no deployment or physical microphone acceptance.
Whole-screen pixel regression coverage is not included. Composition changes
still need visual inspection of screenshots and affected workflows.

The broader mocked replay currently stops at its existing export assertion for
`## Decision`; the unchanged exporter no longer includes that metadata section.
This prevents claiming a complete full-replay pass. Navigation assertions were
updated for decorative icons, compact targets and current lineage controls.

Regression correction: restored feature styling after shared defaults overrode
reader layout, composer controls and other specialized elements. Actual reader
and Talk style assertions supplement gallery coverage.
