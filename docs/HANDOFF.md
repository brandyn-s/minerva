# Compact Card pane

Branch: `feat/compact-card-pane`.
Worktree: `/Users/brandyn.schult/code/minerva-compact-card-pane`.
Base: `f64fbed` (current main when integration began).

## Outcome
Root-atlas inspection uses the approved compact manuscript pane: Content,
Connections and History tabs, persistent relationship summary, Explore and Edit.
Real parent/child edges, associations and shared context remain separate.
Source excerpts, contributions, generation details, provenance and Markdown
export remain available. Explore opens the existing Wander flow for this card.
Save updates current atlas text and creates a session revision. Restore makes a
new revision; generation provenance survives, stale revision assessments do not.
Unsaved drafts survive dismissal and other card inspections within the session.
Current text uses existing browser persistence; earlier history is session-only.
Managed-workspace inspection and unrelated worktrees are unchanged.

## Verification
`npm run check`: lint, TypeScript, 17 tests and production build passed.
New unit coverage checks revision restoration, stale-edit rejection, assessment
invalidation, multi-parent relationships and context/association separation.
In-app browser: real cards, both parents, editing, dismiss/reopen draft, save,
review/restore, Cancel, keyboard tabs and Wander entry verified. Narrow layout
390x844 checked and Menu/close overlap fixed. No provider generation was run.
Existing full atlas browser replay was not run; its older inspection selectors
need a separate refresh before using that broad replay on this design.
See `design-qa.md` for visual evidence and limitations.

## Startup and next role
Local preview: http://127.0.0.1:3081/.
Start with `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3081`.
Next role: owner visual acceptance. Commit and merge are authorized.
