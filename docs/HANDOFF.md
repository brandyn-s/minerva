# Shared loading graphics

State: implemented locally, uncommitted; publication not requested.
Branch: `fix/shared-loading-graphics`.
Worktree: `/Users/brandyn.schult/code/minerva-loading-graphics`.
Base HEAD: `ad58c1cd003732f53771941fc3bc7ab0fee9a864`.
No committed candidate exists for these changes.

Loading and generation use the shared green banner and circular ring from the
Wander reference. Busy buttons use the same ring. Covers Atlas startup, Wander,
Weave, Develop, themes/Regroup, Talk, Voice setup/thinking, Expedition and lens
requests. Completion/error/idle/listening states keep their own semantics.
Banners reserve space for the selection dock and Talk launcher.

Verified: full lint/type/unit/build checks, plus 34 desktop/touch UI tests.
Includes waiting, completion, cancellation,
failure, reduced motion, and mobile overlap. Provider routes intercepted.
Voice rendering integrated; live microphone/provider behavior not retested.
See `docs/product/UI.md` and `docs/product/CAPABILITIES.md`.

Preview mode: development server, port 3096; `/dev/ui` shows shared graphics.
Start from this worktree:
`npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3096`

Next role: owner reviews the local change. Commit, push and deployment require
a new request; no additional product slice is authorized.
