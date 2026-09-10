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
The unchanged atlas replay fails at line 363 in both dev and production startup.
Untouched base `3f2034f` reproduces the same failure; captured UI text is identical.
Logs: `/tmp/minerva-root-check.log`, `/tmp/minerva-root-{dev,start,baseline}.log`.
The release decision for the pre-existing replay failure is pending owner direction.

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
