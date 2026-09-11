# Editable lenses — Release 2A

Release 1 merged in PR #101 as `0af336bc93144d4ea752aeb72501741048eb1c80`.
Its Vercel production status is successful; the stable alias returns HTTP 200.
Branch: `feat/editable-lenses`.
Worktree: `/Users/brandyn.schult/code/minerva-contribution-weave`.
HEAD: `8039662c9204f03d538164d63d632d16505e1c70` (integrates Release 1 main).
The owner authorized commit and merge of Release 2A.

Constellation → Edit lenses → create a named lens → select members → create,
rename, split, merge or move groups → choose representatives → undo.
Lenses preserve historical card assignments, exact run candidate/assessment
references, per-lens arrangements and the camera. New revisions await explicit
classification. Saved-run Expedition offers the same editor over full membership.
Find themes/Regroup are explicit; lens edits make no model calls.

Scope and verification: [Release 2A](lenses-release-2a.md).
Repository check: lint, TypeScript, 55 unit tests and production build pass.
The full UI suite and focused rechecks cover 18 passing desktop/touch journeys,
including historical revision inspection and the final touch hit areas.
The real local HTTP/SQLite check retains 65 members, rejects a stale concurrent
writer, resolves full candidate text and leaves run/call state unchanged.
Hosted Neon lens behavior and human grouping usefulness are not verified.

Start using the documented Node/npm versions: `npm run dev -- --port 3088`.
UI tests: `MINERVA_UI_PORT=3088 npm run test:ui`.
The ignored `.env.local` contains a short-lived project-scoped OIDC token.
Lens editing needs no provider access. The synthetic API server/database are
separate from the user's atlas and saved runs.

Next builder outcome: Release 2B, explicit preview/application of a lens to a
paused Expedition and versioned population selection. Release 2C follows later.
Release 1 human usefulness review remains open in the original evaluation pack.
