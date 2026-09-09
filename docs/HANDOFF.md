# Minerva application handoff

## Current outcome

M1 package 1 is complete: the application repository was initialized from the
approved seed, repository settings and inherited checks were adapted, and the
starter shell is now hosted on Vercel. Runtime compatibility was merged in
[PR #3](https://github.com/brandyn-s/minerva/pull/3) at
`0f8b1a16e1cd831774bcc09fcb61582a9c31a5de`.

- Repository: https://github.com/brandyn-s/minerva
- Seed: https://github.com/brandyn-s/minerva-template at
  `248665c116fb0655e2b70f732ca1b9bffb5b5dcb`.
- Generated initial commit: `33f81109ea47ad83732f316e72f6adeb8ed7a352`;
  its tree matches the seed: `e48604d23a6dfbcde2011f827767fdae8eb57cee`.
- Local worktree: `/Users/brandyn.schult/code/minerva`.
- Resume branch: current `main` after the handoff PR merges.

All C01-C15 capabilities remain not started. The representative brief is
**What to do with a dead shopping mall**, with editable starting proposals
A: independent retail shops, B: a food hall and C: a shared tool library.
The demonstration data and tools that expand the seed or selected proposals
are not implemented. Hosting the shell does not constitute M1 experience
acceptance or open the M6 demonstration window.

## Configuration and verification

Repository protection requires squash PRs, resolved review threads and the
Verify repository check; force pushes and main deletion are blocked. Actions
use read-only tokens and pinned GitHub-owned actions. Private vulnerability
reporting is enabled. Portable documentation and configuration checks remain;
the seed-only restriction test was removed for application development.

Local development and CI pin Node 24.20.0 and npm 12.0.2. The application engine
range is `^24.15.0` so Vercel can manage Node 24 patch updates. `vercel.json`
explicitly selects npm 12.0.2 for installation and build. See
[setup](./setup.md#node-and-npm) for the compatibility rationale.

Validation: lint, typecheck, all eight tests and the production build passed
locally; PR #3's required CI passed. The configured install/build also passed
under the minimum supported Node 24.15.0 with bootstrap npm 11.19.1.

## Hosted checkpoint

Configured and verified on 2026-09-09:

- Project: [thalient/minerva](https://vercel.com/thalient/minerva),
  ID `prj_LwZ9H81IBdwWEHZ5DEJfJNaeqfrb`.
- Team: Thalient, ID `team_CPMDIZRXjSVqupCatDjsDq4Q`.
- Git integration: `brandyn-s/minerva`; production branch `main`, Git
  deployments enabled. Branch updates can create previews.
- Framework: Next.js; root directory `.`; managed Node version `24.x`.
- Install: `npx --yes npm@12.0.2 ci`; build:
  `npx --yes npm@12.0.2 run build`; default Next.js output.
- Stable URL: https://minerva-eight.vercel.app
- Verified deployment: `dpl_J428z3vwbDGfr8jbp19rEiBNr2mu`, production/READY,
  [build details](https://vercel.com/thalient/minerva/J428z3vwbDGfr8jbp19rEiBNr2mu).
- Source revision: `0f8b1a16e1cd831774bcc09fcb61582a9c31a5de`.

The remote source build installed 348 packages with zero reported vulnerabilities
and built Next.js 16.3.4 successfully using the configured npm 12.0.2 commands.
Deployment metadata confirms Node 24.x; logs do not report the precise managed
Node patch. Engine-strict installation passed. The stable URL returned HTTP 200
without credentials, and browser verification showed the starter shell and a
working Wander disclosure. This verifies hosting, not the future Wander tool.
Later Git deployments can move the stable URL beyond this verified revision.

Vercel's default deployment protection remains configured. Local `.vercel/`
link state and `.env.local` are ignored; the CLI populated a local OIDC token.
No credentials are committed. No database, model integration, voice or workflow
resources have been provisioned, and no paid model calls were made.

## Startup and next outcome

From `/Users/brandyn.schult/code/minerva`:

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
```

Startup mode is the starter shell on loopback, without database or model services.
The hosted shell is also available at the stable URL above.

Next role: owner steers the next application chunk; Astra builds package 2's
fixture/domain/presentation foundation and package 3's interactive atlas. This
turn completes the authorized commit, merge, deployment and handoff outcome.
The next implementation chunk is **Not authorized yet** by this deployment request.
The first required Fable review and owner experience acceptance remain at the
M1 boundary; no additional review gate is introduced here.
