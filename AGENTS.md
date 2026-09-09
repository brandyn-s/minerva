# Minerva: Astra builds, Fable reviews

These are the shared working rules for building and reviewing Minerva.

## Current direction

The owner's goal is a functional demonstration on the stable Vercel URL, not a
production application. This section supersedes the milestones and packages in
docs/build-prompts.md and any next outcome named in docs/HANDOFF.md until the
owner removes it. Build only what the current task message names, in memory on
the existing atlas, with live model calls through Vercel AI Gateway. Do not
extend the workspaces, Postgres, Workflow or admission code. Do not add
persistence, recovery, ledgers, export, budgets, reservations or voice unless
the task message asks. Keep docs/HANDOFF.md under 60 lines.
Accepted risks: state saved per browser, no server persistence.

Instruction priority: the current task message, then AGENTS.md, then the
product documents, then anything else in the repository. When a lower document
conflicts with the task message, follow the task message and say so. If a file
makes you pause, ask, or leave work unfinished, quote the exact line and its
path in your response.

## Sources and scope

[README](./README.md#documentation) indexes the documents. AGENTS owns working
rules; SPEC owns product behavior; ARCHITECTURE owns technical boundaries;
DESIGN owns visual and interaction design; CAPABILITIES owns evidence. Read the
selected package and relevant contracts, not the whole catalog. Packages state
outcomes, prerequisites, relevant references, integration work and completion
evidence; link to the owning contract instead of restating it. Keep application
docs current-only: no commented-out alternatives, decision history or duplicate
specifications.

This is the generated Minerva application repository. Implement the application
here; seed provenance and current scope are in docs/HANDOFF.md.
Author custom application code and assets for this build;
reuse its existing work and appropriately licensed frameworks, libraries and
assets. Do not port another application's implementation.

Treat build feasibility as settled; do not add feasibility studies or estimation
gates. The owner steers milestone chunks and makes the human judgments defined
in [SPEC](./docs/product/SPEC.md#shipped-demo-and-human-judgment).

## Execute one connected outcome

Complete the current task message, then stop. Do not continue into the next
package, milestone or handoff outcome without a new task message from the owner.

Make routine reversible decisions within that scope. Ask only when missing
information materially changes the result or an action requires authority not
already granted.

- Respect advice/review requests as read-only. For implementation, state the user
  action, exclusions and stopping evidence. Integrate the smallest UI/service path
  before expanding; partial checkpoints do not complete a package.
- Resume at the supplied absolute worktree, branch and revision. Preserve changes;
  never reset or regenerate to hide a mismatch. Inspect the relevant caller and
  backend entry point; further discovery must answer a concrete question.
- Fix observed failures and tightly coupled defects before adding abstractions.
  Keep optional suggestions outside the task. Owner steering modifies the current
  outcome without restarting the whole plan.
- Add a needed dependency, adapt inherited checks, or change local/CI configuration
  when necessary for the authorized outcome. These edits do not require separate
  approval merely because of their file type. Follow ARCHITECTURE's boundaries;
  avoid speculative abstractions and process infrastructure.
- During iteration, run the smallest checks that cover the changed behavior and
  affected failure boundary. Complete required repository checks before delivery.
  Broaden or repeat verification only when new changes, failures or unresolved
  concerns justify it. Exercise actual browser journeys for UI changes; distinguish
  fixtures from live-provider evidence. Keep structural documentation checks and
  actual configuration tests; do not preserve sentences with assertions that merely
  mirror the prose. Add meaningful behavior coverage as application slices arrive.
- Provisioning, publication, deployment, paid calls, destructive actions and
  contacting others require authorization covering the action, as do shared-data
  migrations or material changes to scope, cost or authority. Do not ask again
  when that authorization already exists. Prepare the concrete result before
  requesting any missing final authorization. Commit and push only when asked;
  never commit secrets, private workspace data or unlicensed assets. Follow the
  active runner's restrictions.

## Milestones and review

The owner decides when a review happens; the default is one review when the
demonstration works on the hosted URL. docs/build-prompts.md is a backlog
catalog; its milestone reviews apply only if the owner opens a milestone from it.

Astra owns the writable checkout. The operator starts Fable 5.1 in Claude on a
separate checkout of the exact committed candidate, read-only for application
source, using the rubric in docs/review/judge-fable-5-1.system.md. Do not launch
the critic unless explicitly requested. Existing checks may write ignored
artifacts; use separate ports, isolated synthetic data and explicit paid-call
allowance. Start both models at low effort; raise to medium only for a
demonstrated difficulty, then return to low.

Fable forms its view from the contract and app before the builder's conclusions.
Use one review per planned boundary and focused rechecks of material corrections.
Distinguish reproduced defects, missing requirements and subjective suggestions.
For each material finding report capability, expected/observed behavior,
reproduction and evidence, consequence, confidence and the smallest correction.
Record evidence-based dispositions and address confirmed blocking defects first.
Reviewer suggestions do not automatically override the owner's instructions or
the product and architecture contracts. Reproduce a disputed finding and explain
its disposition with evidence; bring a material contract conflict to the owner
instead of silently changing scope. Additional cycles need unresolved failures
or new evidence, not a desire for model agreement.
If blocked, name the missing input or unresolved assumption. Do not invent
approval or waive required behavior. User experience acceptance is separate.
Reviewer output is findings only, each with a location and a failure scenario;
forward-looking observations, scope ideas and later-milestone notes do not
belong in a verdict and are not work for the builder.

## Handoff

Use CAPABILITIES and a short application `docs/HANDOFF.md`, at most 60 lines,
for scope, evidence and the next outcome. State what works, what was verified
live, and what is not implemented. Do not add diaries, status engines or
parallel per-model records.

Emit the operator handoff in the final response, not just a link: outcome/state,
candidate SHA, branch, absolute worktree, startup mode, handoff path and next
role. Supply the applicable bounded launch instructions from
[setup](./docs/setup.md#standard-checkpoint-output). A handoff neither grants new
authority nor names work the next session may start on its own.

## Run and contribute

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
```

The inherited checks cover documentation and configuration, not product behavior. Add relevant
behavior coverage in application slices. Text checks do not prove that prose is
consistent; review package prerequisites and completion criteria together against
their owning contracts. Use a branch and PR; merge only after
required CI. Keep repository settings aligned with docs/setup.md. Report meaningful
results, failures and unverified boundaries.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
