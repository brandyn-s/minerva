# Wander exploration-first pane

Worktree: /Users/brandyn.schult/code/minerva-regroup-selection
Branch: feat/wander-exploration-first
Implementation: f1db13c, integrated with current main for authorized release.

## Outcome
Wander separates source context from a concise exploration heading and makes
Explore freely the primary action. Suggestions remain secondary, with a spinner,
skeleton placeholders and an explanatory loading message. Hide/show preserves
suggestions. Loaded moves, prepared fallback, retry and generation callbacks remain.
The pane scrolls on short windows and supports reduced-motion preferences.

## Evidence
npm run check passed: lint, types, unit tests, production build.
In-app browser: loading, hide/show, failure fallback, retry, loaded moves and free
exploration error handling. Fixture responses only; no paid provider calls.
Visual comparison: design-qa.md. Successful live generation was not retested.

## Startup / next role
npm run dev -- --port 4320
Built app: http://127.0.0.1:4340/
Temporary fixture-response preview: http://127.0.0.1:4341/
Next role: owner review of the authorized production release.
