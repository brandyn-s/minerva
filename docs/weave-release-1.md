# Contribution-based Weave

Select two to eight cards and choose Weave. Edit one contribution per source,
optionally select an exact summary/body excerpt, and describe the intended
interaction. Weave contributions generates one result; Weave whole cards keeps
the quick whole-source path available. Opening and editing preparation make no
model calls.

Inputs retain complete source snapshots, revision numbers and a versioned
contribution selection. Excerpts use offsets in the source's plain string
fields. Selected text is sent in full even when surrounding source context is
truncated. Updating a changed source is explicit and clears excerpt anchors;
the contribution descriptions stay editable.

The result's Content and History tabs expose Selected contributions. Source
disclosures show exact historical snapshots. Result passages quote and highlight
the corresponding output revision. Retained/transformed claims require an exact
output quotation; missing/unknown/duplicate mappings and fabricated quotations
are rejected. These checks establish reference integrity, not semantic truth.
Add your interpretation stores a separate, revision-scoped human note.

Change a contribution reopens the original inputs and produces a separate idea.
Compare with original displays the frozen original and variant, including a body
diff. Both results remain in the atlas. Saved JSON preserves mappings, notes and
source snapshots; Markdown includes them. Import leaves historical receipt IDs
intact and resolves navigation by exact revision content, including identity
forks. Existing whole-card receipts and older atlas saves remain readable.

Generation preserves selection and camera. Closing preparation leaves a request
running; a result arriving while another pane is open does not replace that pane.
Failed requests retain the preparation draft for retry. Reopening the same source
set preserves its draft and historical source versions. Browser reload preserves
completed results and saved notes; unsent preparation drafts remain session-only.

## Evaluation

`evaluation/weave-cases.json` supplies three authored design briefs: a repair
service, an offline coordination tool, and a participatory exhibition. Each has
whole-card, selected-contribution and changed-contribution conditions. They
deliberately include practical conflicts and opportunities to omit a source.

Prepare the exact requests without making calls:

```sh
node scripts/evaluate-weave.mjs
```

With the current task's live-call authorization and project-scoped OIDC loaded,
run the fixed nine-call comparison:

```sh
MINERVA_WEAVE_ENV=.env.weave-evaluation.local node scripts/evaluate-weave.mjs --live --allow-calls=9
```

Each call has the same configured model and 4,096-output-token ceiling, a
60-second deadline, and no automatic retries. Failed outputs are retained.
Results and actual token usage are written under ignored `evaluation-artifacts`.
The script produces randomized-label output review pages and keeps method labels,
requests, generated claims and validation evidence in a separate JSON file.

Review the outputs before revealing the methods. Record recognizable source
contributions, interaction, coherence, preserved constraints, useful next steps,
and disagreements. Then inspect the generated mappings. A real participant
session must separately record preparation and orientation effort. One sample
per condition does not establish efficacy or a causal effect of the intervention.
Human review is never synthesized by the evaluator.

## Verification

The release has focused contract tests and intercepted desktop/touch browser
journeys. They cover exact late-body excerpts, invalid input/output references,
receipt mismatch, changed result histories, divergent imports, interpretation
preservation, experiment materialization, retry, comparison, reload and background
completion. They make no live generation calls.

Run the repository's documented Node/npm versions:

```sh
npm run check
MINERVA_UI_PORT=3088 npm run test:ui
git diff --check
```

`MINERVA_UI_PORT` is an optional test-server override for isolated worktrees;
the default remains 3077. Shared UI checks and the new journeys both run in CI.
Release 2 lenses and population policy changes are outside this release.
