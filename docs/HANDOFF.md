# Shared loading graphics

State: committed for merge, integrated with main through PR #105.
Branch: `fix/shared-loading-graphics`.
Worktree: `/Users/brandyn.schult/code/minerva-loading-graphics`.
Loading implementation: `a559a47`; integration base: `496f650`.
Owner authorized commit and merge.

Loading and generation use the shared green banner and circular ring from the
Wander reference. Busy buttons use the same ring. Covers Atlas startup, Wander,
Weave, Develop, themes/Regroup, Talk, Voice setup/thinking, Expedition and lens
requests. Completion/error/idle/listening states keep their own semantics.
Banners reserve space for the selection dock and Talk launcher.

Preserves main's Start fresh seed flow, persisted repetition guard, sequential
SQLite worker handling and repaired Expedition regression coverage.
See `docs/expedition.md` for their implementation and verification boundaries.

Before integration: full lint/type/unit/build checks and 34 desktop/touch UI
journeys passed, covering cancellation, completion, errors and reduced motion.
Integrated checks must pass before merge. Provider routes are intercepted.
Voice rendering integrated; live microphone/provider behavior not retested here.
See `docs/product/UI.md` and `docs/product/CAPABILITIES.md`.

Preview mode: development server, port 3096; `/dev/ui` shows shared graphics.
Start from this worktree:
`npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3096`

Next role: owner reviews the merged change. No further product slice authorized.
