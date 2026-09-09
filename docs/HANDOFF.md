# Remove Evidence labels

Branch: `fix/remove-evidence-labels`, integrated with main `16f39b7`.
Worktree: `/Users/brandyn.schult/code/minerva-wander-toolbar`.
Change: remove visible Evidence labels from the card inspector, reader Details, and comparison view.
Evidence data and Markdown downloads remain intact; decision labels are unchanged.

Validation: `npm run check` passed (lint, typecheck, tests, production build).
Browser inspection verified all three affected views without Evidence labels.
Local production preview: http://127.0.0.1:3191/.
Prefix npm commands with `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
Start: `npm run build`, then `npm run start -- --port 3191`.
User authorized commit, merge, and production deployment after required CI.
Stable URL: https://minerva-eight.vercel.app/. Next role: owner review.
