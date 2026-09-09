# Minerva application handoff

## Current outcome

M1 package 1: initialize the public application repository from the approved
seed, set repository identity/settings and convert inherited checks. Product
implementation begins with package 2; all C01-C15 rows remain not started.

- Repository: https://github.com/brandyn-s/minerva
- Seed: https://github.com/brandyn-s/minerva-template
- Seed revision: `248665c116fb0655e2b70f732ca1b9bffb5b5dcb`
- Generated initial commit: `33f81109ea47ad83732f316e72f6adeb8ed7a352`
- Initial tree matches the seed exactly: `e48604d23a6dfbcde2011f827767fdae8eb57cee`.
- Local worktree: `/Users/brandyn.schult/code/minerva`.
- Resume from the application's current `main` after the setup PR is merged.

The representative brief is **What to do with a dead shopping mall**. Editable
starting proposals are A: independent retail shops, B: a food hall and C: a shared
tool library. Future tools expand the seed, selected proposals or combinations;
the demonstration dataset and its tools are not implemented by this setup.

## Changes and evidence

Application URLs and working instructions now target this repository. The MIT
license, identity assets, dependency pins, portable documentation checks and ESLint
behavior checks are retained. The empty-seed test is removed, allowing application
dependencies, files and capability progress without a new testing framework.

Repository settings use read-only Actions tokens, pinned GitHub-owned actions,
private vulnerability reporting and protected main: squash PRs, resolved review
threads, required Verify repository, no force pushes or deletion.

Validation on this setup: pinned `npm ci` completed; `npm run check` passed lint,
typecheck, all seven retained tests and the production build. A disposable copy
passed the documentation checks with an added application dependency, a deployment
file and capability progress. Repository settings were read back and verified.
CI must pass on the setup PR before merge; this is repository initialization,
not an M1 experience review or product-capability demonstration.

## Startup and next outcome

From the local worktree:

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
```

Startup mode is the seed shell on loopback, without database or model services.
No services, paid calls or Vercel deployment have been provisioned by this setup.

Next owner task: authorize the next application outcome. Astra continues with
package 2's fixture/domain/presentation foundation and package 3's interactive
atlas; the first required Fable review and owner experience acceptance are at
the M1 boundary. This repository-initialization request does not grant live-service
spend or deployment authority. No extra package 1 review gate is introduced.
