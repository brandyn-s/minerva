# Minerva application handoff

## Outcome and candidate

M2's MVP path is integrated: create a workspace, edit ideas and layout, preview
frozen input, generate two alternatives, inspect their assessments, keep a
revision and reload. Managed Neon Postgres stores workspace/idea revisions,
relationships, layouts, operation inputs, attempts and decisions. The root `/`
remains the prepared M1 atlas; `/workspaces` opens the saved application.

- Writable worktree: `/Users/brandyn.schult/code/minerva`.
- Branch: `feat/m2-working-spine`.
- Base SHA: `4e28dfbd85f6cdf349bba6fd2d180371492a327b`.
- M2 is **uncommitted**; this base SHA does not identify the new implementation.
  No commit, push or production promotion has been performed.
- M1: Fable approved the base candidate from an independent clone; the owner
  accepted the experience with orientation friction, overlay occlusion and
  phone markers documented as limitations. Hosted M1 verification is deferred.
- M2 is authorized; next step is preparation of an exact
  committed candidate for the planned interim Fable review before voice
  packages 11–12. Do not launch the reviewer automatically.

## Implemented path

Workspace create/list/open/rename/duplicate, brief/constraint revisions,
recoverable deletion and restore, and complete versioned JSON export are wired
through Postgres. Active explorations must be stopped before deletion. Exports
include all workspace and idea revisions, graph records, command receipts,
frozen manifests, runs, attempts, assessments and decisions. Database
backup/restore and old-system import are excluded by owner decision.

Saved cards support text revisions, movement, resizing, explicit camera save,
arrange and session-local layout undo/redo (last 50 card changes). Layout writes
are separate from content revisions. The persisted mall seed adds a grandchild,
a revised tool source and a semantic cycle. Connection commands reject
inheritance cycles while permitting semantic cycles; inspection exposes exact
parent revisions. Existing M1 overview corrections are preserved.

Develop alternatives freezes the current brief and up to four selected whole
sources; no selection means brief-only. The preview and runtime share the saved
manifest. A Workflow run makes two bounded generation calls and two assessment
calls using AI Gateway OIDC and `openai/gpt-5.6-luna`. Proposals remain unkept
until an explicit decision. Keeping stale-context or unreviewed work requires
an explicit acknowledgement; decisions do not rewrite source history.

Runs persist progress outside the browser, support pause/resume/stop and expose
interruption reconciliation. Retries reuse command receipts. Provider retries
are disabled; uncertain calls retain their reservation. These are prototype
recovery controls, not a claim of fully exercised fault tolerance.

## Evidence and limits

- Required local `npm run check`: lint, typecheck, 14 tests and production build
  pass on pinned Node 24.20.0 / npm 12.0.2.
- The earlier isolated persistence browser journey passed workspace lifecycle,
  stale/replayed commands, graph revisions, duplicate references, reload and
  JSON export against managed Postgres.
- One live Chromium smoke run passed browser start, panel close/reload while
  running, two generations and two assessments, inspect, keep, reload and export.
  Workspace: `b070e7b2-173b-40e5-a600-a8822226802b`.
  Run: `2e431e6e-fa6c-419e-b8cf-2c71521360a4`.
  Four recorded calls total **$0.0035978 estimated token cost**; this is not a
  platform invoice. The keep action was a builder smoke action, not owner
  acceptance. Screenshots: `/tmp/minerva-live-running.png` and
  `/tmp/minerva-live-kept.png`; input/output evidence is ignored under `.minerva/`.
- Owner requested a streamlined MVP: no additional broad regression matrix or
  expanded test suite. Whole-source generation, hosted workflow recovery,
  budget-denial injection, physical touch and screen readers are not claimed
  as demonstrated by this brief-only smoke run.
- Owner judgment: both proposals are useful enough to show the working flow
  becoming concrete, but converge too heavily on the same mechanism.
  Alternative 2 varies scheduling rather than offering a meaningfully different
  participation model. Carry this limitation into review; this judgment does
  not constitute full M2 acceptance.
- Dense saved-graph filtering/folding and transitive ancestry focus are not
  complete. Workspace duplication copies graph/revision history but does not
  clone execution/assessment/decision ledgers. Permanent purge has no UI.
- The saved-view footer still describes prepared/user material after generation;
  inspect the generation details for actual provenance. Model assessment labels
  are not verified real-world evidence. These limitations remain reviewable.
- Voice and later-milestone instruments remain unimplemented. M2 is not accepted
  or declared complete, and this is not a production-quality release.

## Operations and spend

Neon resource `minerva-development` (`store_IZfXYy9myJlVOZvu`) uses Free plan
`free_v3`, region `iad1`, connected only to development and preview. Explicit
migrations `drizzle/0000`–`0003` have been applied. Connection strings and OIDC
credentials are in ignored `.env.local`; never put them in this handoff.

The owner's **$5 total M2 cap** includes preview/database provisioning.
AI Gateway has a project budget of $4 with no refresh; application text admission
conservatively reserves $0.20 per run up to $3. Reservations are not automatically
refunded. $1 remains within Gateway for later voice and $1 outside Gateway for
other platform usage. Do not increase or reset these limits without authority.

```sh
cd /Users/brandyn.schult/code/minerva
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
# Only when applying explicit new migrations to the authorized database:
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run db:migrate
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
```

Open `http://127.0.0.1:3000/workspaces`. Keep the dev server running for local
Workflow execution; browser closure does not stop it. After a server interruption,
inspect saved runs and reconcile only after the three-minute inactivity threshold.
A separate review checkout needs its own port and matching `MINERVA_ORIGINS`.
Use synthetic data and an explicit share of the remaining paid allowance.

## Hosted checkpoint

The stable production alias is https://minerva-eight.vercel.app. M1 is served
there but its behavior remains unverified by owner decision. The previously
verified shell SHA `0f8b1a1` is historical, not the current serving revision.
Per-deployment URLs are protected by Vercel SSO; only the stable alias was
previously confirmed public. Do not use protected links for the M6 judge panel.

M2 preview build: https://minerva-lo2b9zezw-thalient.vercel.app from the uncommitted
working-tree snapshot. Deployment status and smoke evidence are recorded below
when the build completes. Production database configuration and promotion remain
outside this checkpoint.

Preview deployment `dpl_ECpu6bNfkvhWHHbL4eMx96n6nMmY` is **READY**. An authenticated
`vercel curl` smoke request returned HTTP 200 from `/internal/graph`, including
the saved generated proposal and its kept decision from managed Postgres. The
CLI generated a project protection-bypass token for this request; its value is
not recorded here. Protection remains enabled. This verifies preview storage
reads, not hosted generation or fault recovery. The preview predates these final
documentation edits; its application code matches this checkpoint.
