# Compass control and shared tooltips

Branch: `codex/compass-tooltips`.
Worktree: `/Users/brandyn.schult/code/minerva`.
Base SHA: `131aa369ef2a1a4218a616eea7ccfb34e4605e1f`; changes are uncommitted.

## Outcome
The root atlas Expedition button is a 44px engraved compass in a 48px control.
Its tooltip reads Open expedition panel. Existing card overview, card movement
and expedition step-link tooltips share the dark-green, ivory and gold style.
Tooltips support focus, hover, Escape dismissal and portal rendering outside
canvas transforms. The existing Expedition dialog and generation behavior remain.

## Evidence
`npm run check` passed: lint, TypeScript, 12 tests and production build.
In-app browser: compass focus tooltip, Escape dismissal, Enter activation,
expanded state, close/focus return and matching card movement tooltip passed.
Visual comparison is recorded in `design-qa.md`.
Hover/collision behavior was code-reviewed; mobile and generated step-link
interactions were not exercised in this focused pass. No provider calls.

## Startup and next role
Local dev preview is running at http://127.0.0.1:3000/.
From this checkout: `npm run dev -- --port 3000`.
Use the Node/npm launcher in AGENTS.md if the installed runtime differs.
Next role: owner visual inspection. Commit, publication and deployment are not
part of this task; no critic was launched.
