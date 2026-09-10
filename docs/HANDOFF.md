# Root atlas demo

Branch: `cleanup/root-atlas-only`; worktree: `/Users/brandyn.schult/code/minerva-root-only`.
Base: `3f2034f` from `origin/main`.
The demo runs at `/` with per-browser IndexedDB storage and AI Gateway routes.
No server persistence or durable execution engine is included.

## Verification
`npm run check` passed: lint, typecheck, 22 tests and production build.
Build output lists only `/`, model API routes, the icon and the not-found page.
`npm ls esbuild --all` is empty; no esbuild version below 0.25 is installed.
Local production requests to `/workspaces` and `/internal/graph` return 404.
The atlas replay passes against both dev and production startup.
Replay interactions use the current card pane, edit, export and layout controls.
Preview requests to `/workspaces` and `/internal/graph` return 404.
Logs: `/tmp/minerva-root-check.log`, `/tmp/minerva-root-{dev,start}.log`.

## Operation
Prefix npm/node with `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
Dev: `npm run dev -- --port 3321`; production: `npm run build`, then
`npm run start -- --port 3320`.
Stable URL: https://minerva-eight.vercel.app/.

## Owner cleanup outside the repository
- Neon database resource.
- Vercel `DATABASE_URL` secret.
- Vercel Workflow integration.
These external resources are untouched.

## Next role
One operator-started Fable 5.1 review of the exact released candidate, read-only
for application source, using `docs/review/judge-fable-5-1.system.md`.
Use a separate checkout, synthetic browser state and no paid provider calls.
Stop after this cleanup release; no new feature work is authorized.
