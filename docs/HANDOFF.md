# Light selection dock

Branch: `feat/light-selection-dock`.
Worktree: `/Users/brandyn.schult/code/minerva-light-selection-dock`.
Integrated with origin/main `a194627`; catalogue and relationship updates preserved.

## Outcome
Root atlas selection toolbar matches the chosen light dock: parchment surface,
bronze border/dividers, green Wander, labelled icons and inline Clear selection.
Existing single/multiple selection eligibility, actions and loading behavior remain.
Mobile uses two action columns; summary and cameo sit clear of its controls.
Workspace toolbar styling remains separate. No backend or model changes.

## Evidence
`npm run check` passed lint, TypeScript, repository tests and production build.
Focused browser replay passed one/two-card states, all four actions, mocked Weave
loading/completion, clearing, and 390px layout; no browser page errors.
Desktop in-app inspection and mobile screenshot comparison passed; `design-qa.md`.
No paid calls. Full legacy replay was not rerun for this scoped toolbar change.

## Startup and next role
`npm run dev -- --port 3067` with the Node/npm launcher in AGENTS.md.
Preview: http://127.0.0.1:3067/.
Next: owner visual acceptance. No critic or further work queued.
