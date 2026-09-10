# Shared UI integrated with the current root atlas

Branch: `feat/ui-normalization`.
Worktree: `/Users/brandyn.schult/code/minerva-expedition-theme`.
Integrated main through `8255efa`; owner authorized commit and merge.

Shared controls, icons, tooltips and headers live in `components/ui`.
Guide and Menu share the perspective buttons' engraved framing and active states.
Existing feature styles retain precedence over shared defaults.
Main's compact Card pane, voice preferences, toolbar toggles and Layout selection
ring are preserved. Removed workspace/Workflow/Postgres code stays removed.

## Verification
Run `npm run check`, `npm run test:ui`, and `npm run test:browser`.
UI tests cover gallery accessibility and actual desktop/touch panel journeys,
including matching Guide/Menu styles and active states, reader accents and Talk.
Provider requests in browser verification are mocked; no paid calls authorized.
The gallery at `/dev/ui` is development-only.

## Operation
Preview: http://127.0.0.1:3077/.
Start: `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3077`.
See [UI ownership](./product/UI.md) for maintenance rules.
Next role: owner inspects the merged UI.
