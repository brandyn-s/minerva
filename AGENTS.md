# Minerva: Astra builds, Fable reviews

These are the shared working rules for building and reviewing Minerva.

## Sources and scope

[README](./README.md#documentation) indexes the documents. AGENTS owns working
rules; SPEC owns product behavior; ARCHITECTURE owns technical boundaries;
DESIGN owns visual and interaction design; CAPABILITIES owns evidence. Read the
selected package and relevant contracts, not the whole catalog. Packages state
outcomes, prerequisites, relevant references, integration work and completion
evidence; link to the owning contract instead of restating it. Keep template
docs current-only: no commented-out alternatives, decision history or duplicate
specifications.

Keep this seed content-free. Generate the application from it, then implement
in that repository. Author custom application code and assets for this build;
reuse its existing work and appropriately licensed frameworks, libraries and
assets. Do not port another application's implementation.

Treat build feasibility as settled; do not add feasibility studies or estimation
gates. The owner steers milestone chunks and makes the human judgments defined
in [SPEC](./docs/product/SPEC.md#shipped-demo-and-human-judgment).

## Execute one connected outcome

Complete the authorized outcome, including its connected chunks. Stop at the next
required owner or review boundary, or when further work exceeds that authorization.

Make routine reversible decisions within that scope. Ask only when missing
information materially changes the result or an action requires authority not
already granted. Existing authorization persists across chunks and handoffs.

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

The 32 packages form six milestones. M1 uses prepared local data; M2 integrates
persistence, generation and voice. M2 reviews after package 10 and after package
12; M5 reviews browser instruments/outputs. M6 reviews the candidate locally,
then confirms hosted operation on the served Vercel URL before the demonstration
window opens.

Astra owns the writable checkout. The operator starts Fable 5.1 in Claude on a
separate checkout of the exact committed candidate, read-only for application
source. Do not launch the critic unless explicitly requested. Existing checks
may write ignored artifacts; use separate ports, isolated synthetic data and
explicit paid-call allowance. Start both models at medium effort; escalate only
for demonstrated difficulty, then return to medium.

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

## Handoff

Use CAPABILITIES and a short application `docs/HANDOFF.md` for scope, findings,
dispositions, evidence and the next outcome. Distinguish written, integrated,
locally/live demonstrated, reviewed, accepted and hosted facts by revision.
Do not add diaries, status engines or parallel per-model records.

Emit the operator handoff in the final response, not just a link: outcome/state,
candidate SHA, branch, absolute worktree, startup mode, handoff path and next
role. Supply the applicable bounded launch instructions from
[setup](./docs/setup.md#standard-checkpoint-output). Apply the authorized-outcome
stopping rule above; a handoff neither grants new authority nor creates a review
gate per increment.

## Run and contribute

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
```

The seed has documentation-consistency tests, not product coverage. Add relevant
behavior coverage in application slices. Text checks do not prove that prose is
consistent; review package prerequisites and completion criteria together against
their owning contracts. Use a branch and PR; merge only after
required CI. Generated repositories need their own settings. Report meaningful
results, failures and unverified boundaries.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
