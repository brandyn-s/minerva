# Starting a Minerva application

The template is a shell, not an implemented studio. Generate the public
`brandyn-s/minerva` repository only when authorized; never overwrite, rename or
delete an existing repository to claim that identity. Carry forward the MIT
license, original seed assets and exact dependency pins.

## Repository identity

Record the template URL and actual seed revision in the application's handoff.
Update package identity with the package manager:

```sh
npm pkg set name=minerva \
  repository.url=git+https://github.com/brandyn-s/minerva.git \
  bugs.url=https://github.com/brandyn-s/minerva/issues \
  homepage=https://github.com/brandyn-s/minerva#readme
```

Keep lockfile metadata consistent. Update README and SECURITY links and confirm
the remote before pushing. Keep `"private": true` to avoid accidental npm
publication; it does not control GitHub
visibility. Configure Actions permissions, branch rules, required checks and
private vulnerability reporting on the new repo.

Package 1 converts the inherited checks for application development: delete
`tests/seed-only.test.mjs`, whose empty-seed restrictions would reject application
dependencies, files and progress. Retain the portable structure/reference checks
in `tests/seed-docs.test.mjs` and the actual ESLint behavior checks in
`tests/lint-config.test.mjs`. Adapt their paths and configuration expectations to
the generated application as needed, then run `npm run check`. Confirm that normal
application additions and capability-status updates are allowed. Use the existing
runner and files; this is a small conversion step, not a testing framework.

## Local operation

The prototype is single-user and browser-only with no sign-in. Dev/start bind
to 127.0.0.1. Open localhost and work; internal server endpoints, Postgres,
AI Gateway calls and durable runs remain. External REST/MCP APIs and accounts
are excluded. Local operation is the development loop; the release target is the
Vercel demonstration deployment described below.

Use the foundation choices and milestone timing in
[ARCHITECTURE](./product/ARCHITECTURE.md#ownership-and-dependencies).

Add dependencies and configuration only with their application slices. Document
variables in `.env.example` without values. Use a local Postgres path or explicitly
authorized managed service; never silently substitute browser-only persistence.
Validate Host/Origin, reject cross-origin mutations and avoid permissive CORS.
Unrelated websites must not read workspaces or trigger paid operations.

Fixtures support the offline development loop but are not live AI evidence.
Model/voice calls need configured providers and explicit bounded spend. Document
which services must remain running: closing the browser does not stop work, but
stopping local services halts local execution. Recover saved checkpoints and
reconcile interrupted work after restart.

## Resuming an existing checkpoint

Read AGENTS, the selected package, relevant capability rows and the short handoff.
Use the existing code; do not recreate a working foundation. Follow AGENTS's
authorized-outcome rule across connected chunks. Packages 11-12 demonstrate
incremental typed and voice integration. Probe external transport/settings early within authorized
bounds; keep unavailable live evidence explicit.

Use the Astra launch block below for both fixes and new outcomes. Fill the exact
absolute path and candidate; a branch name alone does not locate a worktree.
If the checkout is unavailable, report the mismatch instead of searching the
machine or resetting files.

## Separate builder and critic

Prepare the intended committed candidate within the task's authorization.
The operator opens Fable 5.1 in Claude on a separate checkout; two terminals
on one mutable tree are not isolation.
Existing checks may write ignored artifacts. Use separate ports and isolated
synthetic data, not the builder's working database. A fix creates a new candidate.

Follow [AGENTS](../AGENTS.md#milestones-and-review) for review timing, independence
and finding dispositions. When adapting a general builder prompt for Minerva,
use those milestone reviews and focused rechecks, the authorized-outcome rule,
and the scoped dependency/CI permissions in AGENTS. Replace conflicting generic
defaults in the launch prompt before use; do not layer a review of every change,
blanket edit approvals or automatic reviewer precedence over these rules.

## Standard checkpoint output

A handoff supplies context, not authorization. Keep evidence in CAPABILITIES and
the short application `docs/HANDOFF.md`; emit the operator launch instructions in
the final response as well. State the outcome and partial/package state, exact SHA,
branch, absolute checkout, clean/dirty state, startup mode, known gaps and next role.
Distinguish local-only, published, reviewed and hosted facts. Label an unapproved
next outcome **Not authorized yet** rather than implying permission to advance.

### Fable review launch and prompt

Use an unused absolute review path and the exact committed candidate. Offer these
commands to the operator rather than automatically launching the reviewer:

```sh
git -C "<absolute-build-worktree-path>" worktree add --detach "<absolute-review-checkout-path>" <candidate-sha>
cd "<absolute-review-checkout-path>"
```

Open Fable 5.1 at medium effort in Claude and paste:

```text
Review checkout: <absolute-review-checkout-path>
Exact committed candidate: <candidate-sha>
Review scope: <outcome, milestone and affected capability IDs>
Review question: <concrete behavior or failure boundary>
Runtime/startup: <mode, command, separate port and isolated synthetic data>
Exclusions: <out-of-scope work; no paid calls without explicit allowance>

This is an operator-started review, read-only for application source.
Verify the exact checkout/candidate without resetting or recreating it.
Read AGENTS.md, docs/HANDOFF.md, relevant docs/product/CAPABILITIES.md rows
and the applicable milestone review in docs/build-prompts.md.
Form your view from the contract and behavior before the builder's conclusions.
Exercise the bounded journey and failure case using existing checks.
Return evidence-based findings and unverified boundaries to the operator.
Do not implement fixes, expand scope, claim user acceptance or start another agent.
```

### Astra return or next-outcome prompt

Return to the existing writable build tree, not the review checkout:

```sh
cd "<absolute-existing-build-worktree-path>"
```

Open Astra at medium effort in Codex and paste:

```text
Worktree: <absolute-existing-build-worktree-path>
Branch and expected checkpoint: <branch> at <commit-sha>
Authorized task: <fix named findings OR implement one authorized outcome>
Review findings: <bounded findings with evidence/candidate SHA, or none>
Outcome: <starting state, user action and observable result>
Exclusions: <services, features and later increments outside this task>
Failure boundary: <specific case and stopping evidence>
Runtime/startup: <mode and exact command>

Verify the existing checkout and changes without resetting or regenerating.
Read AGENTS.md, docs/HANDOFF.md, relevant docs/product/CAPABILITIES.md rows
and the selected work package. Preserve existing work and evidence.
Implement the connected UI/backend outcome or reproduce and fix the named findings.
Exercise the affected journey, failure boundary and required checks.
Prepare a coherent candidate, commit if authorized, and provide the standard
operator handoff at the stopping boundary defined in AGENTS.md.
```

## Vercel demonstration hosting

The release target is a public Vercel deployment for a bounded demonstration
window, used by a small judge panel with no sign-in. Anyone with the URL can use
it during the window; the window, the Vercel budget and the teardown are the
controls. Do not add sign-in, gates or confirmation steps that slow the judges.
Record the window's dates, audience, budget and teardown owner in `docs/HANDOFF.md`.

- **Project.** Create the Vercel project in the authorized team and link the
  repository when package 8 is authorized, so automatic preview deployments
  serve as hosted evidence from then on; production deployment remains package
  32. Confirm the application root and framework settings against official
  documentation. Git linking deploys previews automatically; authorize it
  separately. A preview build is evidence, not the release or a hosted journey.
- **Models.** Text and realtime voice use Vercel AI Gateway. Authenticate the
  deployment with its Vercel OIDC token only; do not add a Gateway API key or a
  bring-your-own provider key. Set the Gateway budget at project scope, the one
  scope that meters OIDC requests and rejects with HTTP 402 when exceeded.
  Realtime voice is a beta Gateway capability: the token route mints single-use
  short-lived client tokens after microphone permission is granted, and sessions
  are capped at 25 minutes.
- **Platform spend.** Set the Spend Management amount the owner chooses. It
  covers functions, bandwidth and workflow events, checks every few minutes and
  does not cover Marketplace databases. Pausing production at that amount is
  the owner's call: it caps platform spend but shows judges a 503 for the rest
  of the window.
- **Data.** Use a Marketplace Postgres or an authorized managed service with its
  own spending cap. Use one non-production database for local and preview work
  and a separate production database with its own credentials. Seed the
  demonstration workspace before the window opens; judges start by duplicating
  it, and re-running the seed restores it.
- **Durable runs.** Vercel Workflows execute Wander, Agent Drive and other runs;
  use the stable SDK line unless a demonstrated requirement needs the beta.
- **Teardown.** When the window closes, pause or delete the deployment, which
  ends its OIDC access to the Gateway, revoke the database credentials, export
  or delete judge data, and record in the handoff what was preserved.

See [ARCHITECTURE](./product/ARCHITECTURE.md#provider-and-deployment-boundaries)
for the ownership and spend boundaries these steps implement.
