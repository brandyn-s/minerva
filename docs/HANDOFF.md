# Olive and scroll toolbar controls

Branch: `codex/toolbar-medallions`; uncommitted changes based on `ea68dab`.
Worktree: `/Users/brandyn.schult/code/minerva-toolbar-medallions`.

## Outcome
Thoughts uses the approved olive medallion with a live count badge.
Read as text uses the approved engraved scroll medallion.
Both use shared tooltips, accessible names and expanded states, and open the
existing panels. Compass and other ongoing work are preserved.

## Evidence
npm run check passed: lint, TypeScript, 12 tests and production build.
In-app browser verified both panels, focus return, tooltip focus and Escape.
Visual comparison passed; see design-qa.md. No paid provider calls.
Mobile and generated count changes were not exercised in this focused pass.

## Startup and next role
Preview: http://127.0.0.1:3057/ (local dev server running).
Run from this worktree:
`npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3057`
Next role: owner visual inspection. No commit, push or deployment in this task.
