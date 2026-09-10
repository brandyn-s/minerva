# Expedition theme standard

Branch: `feat/expedition-theme`.
Worktree: `/Users/brandyn.schult/code/minerva-expedition-theme`.
Base candidate: `f184531` (current changes are uncommitted).

## Outcome
Expedition is the shared visual standard for Layout, Read as text and Browse
thoughts. `FieldGuideHeading` supplies each instrument's medallion, mono title
and close control. `field-guide` and `--guide-*` tokens share paper, borders,
inputs, primary actions and selection accents. DESIGN owns this convention.
The reader retains contents/article navigation; Browse retains filtering,
selection, disclosure and downloads; Layout retains arrange/undo/redo.
Open Layout stays above selected-card previews on narrow screens.
Typography uses shared role tokens: titles 20px, body 15px, inputs/actions 16px,
labels 12px and notes/header names 11px. Compact widths: Expedition/Browse 440px,
Layout 340px, reader 880px. Desktop controls 36px; touch targets remain 44px.
Header icons, control heights and responsive spacing follow the same scale.
No backend changes, paid model calls, commits, pushes or deployment.

## Verification
`npm run check`: lint, TypeScript, 15 tests and production build passed.
In-app browser: search, selection, disclosure, reader contents/next navigation,
Layout arrange/undo/redo, close and Escape checked using the local fixture.
Desktop 1280x720 and narrow 390x844 visual checks; see `design-qa.md`.
No browser console warnings or errors observed. Provider behavior was not retested.

## Startup and next role
Development preview: http://127.0.0.1:3077/.
Use `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3077`
with the same launcher.
Next role: owner visual acceptance. No further feature or critic work queued.
