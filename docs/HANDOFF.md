# Expedition field guide

Branch: `feat/expedition-field-guide`.
Worktree: `/Users/brandyn.schult/code/minerva-expedition-field-guide`.
Base: origin/main `7c80f0d`.

## Outcome
Expedition setup matches the selected field-guide mockup: compass header,
starting-card preview, multiline goal, 2–5 segmented steps and full-width Start.
No-selection state explains what is required. Native radios support keyboard use.
Existing generation, completion, stop, reading and stored history remain.
No backend or model changes. Existing compass asset reused.

## Evidence
`npm run check` passed lint, TypeScript, repository tests and production build.
Focused browser replay passed empty state, selected source, three generated steps,
completion, New expedition and desktop/mobile layout with mocked provider responses.
No browser page errors. In-app visual inspection passed; see `design-qa.md`.
Full replay stopped before Expedition on an unrelated old “unkept draft” assertion.
No paid model calls for this visual change.

## Startup and next role
`npm run dev -- --port 3063` using the Node/npm launcher from AGENTS.md.
Preview: http://127.0.0.1:3063/.
Next role: owner visual acceptance; no critic or further feature work queued.
