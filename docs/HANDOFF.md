# Contribution-based Weave — Release 1

Branch: `feat/contribution-weave`.
Worktree: `/Users/brandyn.schult/code/minerva-contribution-weave`.
Base: `43581f54f5f0696818259643d9e67ed40552c9d3`.

Select two to eight cards → Weave → choose one contribution per source and
optional exact excerpts → generate → inspect selected contributions in the Card
pane → Change a contribution → Compare with original.
Whole-card Weave remains available. Failed requests retain drafts. Background
completion preserves the current pane; selection and camera stay in place.

Source snapshots, mappings, variant baselines and separate human interpretations
survive existing JSON save/import and Markdown export paths. Source refresh is
explicit. Experiment outputs use the same contracts and materialize their mappings.

Protocol and scope: [Release 1](weave-release-1.md).
Focused contract tests and all 12 desktop/touch UI checks pass.
The repository check passes lint, TypeScript, 51 unit tests and production build.
Targeted persistence tests and Weave journeys also pass after the final import corrections.

Live formative comparison: nine calls, eight valid results, one provider response
failure. Inputs span service, software and exhibition briefs. Human review and
participant effort measurement remain open; no efficacy claim is established.
Evidence: ignored `evaluation-artifacts/weave/2026-09-11T02-25-51-055Z/`.
`review.md` hides method labels; `evidence.json` retains prompts, outputs and usage.

Start with documented Node/npm versions: `npm run dev -- --port 3088`.
The ignored `.env.local` has only a short-lived project-scoped OIDC token.
UI test isolation: `MINERVA_UI_PORT=3088 npm run test:ui`.
The owner authorized commit and merge, then implementation of Release 2A.
Next builder outcome: editable lenses over frozen material, with reversible
membership changes and persistence; exploration policy follows separately.
Human usefulness review of Release 1 remains available to the owner.
