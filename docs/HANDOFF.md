# Shared compact UI

Branch: `feat/ui-normalization`.
Base SHA: `8b48e1b7c9e3a3ac9409947c9beb97a265d13147`; UI changes are authorized for commit and merge.
Worktree: `/Users/brandyn.schult/code/minerva-expedition-theme`.

## Outcome
Expedition's compact language is now owned by `components/ui`.
All feature buttons, fields and disclosure triggers use shared primitives.
Functional icons use one Lucide family; panel headers and tooltips are shared.
Shared defaults sit below existing feature styles to preserve specialized controls.
ESLint guards against new raw controls, icon imports and local paint overrides.
A development-only gallery at `/dev/ui` makes every control state inspectable.
See [UI ownership](./product/UI.md) for variants and maintenance rules.
Existing voice lifecycle handlers are preserved.

## Verification
`npm run check`: lint, typecheck, 17 Node tests and production build passed.
`npm run test:ui`: four desktop/touch browser tests passed, including gallery axe,
keyboard controls, tooltip dismissal, forms and atlas panel journeys.
Computed-style baselines cover typography, color, border, padding and sizing.
Screenshots in `test-results/ui` support composition review; not pixel baselines.
Production `/dev/ui` returns HTTP 404.
Focused mocked voice replay passed, including hold/release, mute, close/Escape,
retained sessions and explicit End. Tooltip dismissal preserves panel Escape.
No paid provider calls or deployment; UI journeys intercept provider routes.

## Startup and next role
Preview: http://127.0.0.1:3077/; gallery: http://127.0.0.1:3077/dev/ui.
Start with `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3077`.
Next role: owner inspects integrated UI; commit and merge are authorized.

The broader mocked replay currently stops at its existing export assertion for
`## Decision`; the unchanged exporter no longer includes that metadata section.
This prevents claiming a complete full-replay pass. Navigation assertions were
updated for decorative icons, compact targets and current lineage controls.

Regression correction: restored feature styling after shared defaults overrode
reader layout, composer controls and other specialized elements. Actual reader
and Talk style assertions supplement gallery coverage.
