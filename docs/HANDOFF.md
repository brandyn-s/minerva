# Wander and Weave demo handoff

Root `/` runs the mall fixture plus in-memory Wander and Weave. Reload resets.
This owner-directed demo supersedes the M2 packages and all earlier handoff plans.
No workspace, database, Workflow, request-policy or migration code was changed.
No new voice, drive, perspectives, outputs, assessments, decisions, ledgers, export, duplication, history or quality controls.

- Checkout: `/Users/brandyn.schult/code/minerva`; branch: `demo/weave-many`.
- Base: `origin/main` at `4f6ec769aca61645f5a028bb070c532683bc5f34`.
- Release target: https://minerva-eight.vercel.app/; exact released SHA and hosted evidence go in the operator response.
- The original post-deployment Fable review is complete; this follow-up expands Weave selection.

## Behavior and authentication

Select one card → Wander → two or three adjacent cards with derivation edges.
Select two or more cards → Weave → one recombination draft with an edge for every parent.
Inspect the draft to read its full body and one-line contribution from each parent.
Errors appear on source cards; Retry repeats that feature with the same source snapshot.
`POST /api/wander` and `POST /api/weave` each call AI SDK `generateObject` once.
Both use plain `anthropic/claude-sonnet-5`, confirmed once with `gateway.getAvailableModels()` on 2026-09-09.
Tags: `feature:wander`, `feature:weave`. SDK automatic retries are disabled.
Authentication: Vercel OIDC, locally refreshed with `vercel env pull .env.local --yes`; automatic when hosted.
No key was created or requested. No application admission, reservation, budget or receipt logic in this path.
The existing Gateway project budget is the only spend control for these features; it was not changed.

## Verification and actual returned cards

Local `npm run check` passes: lint, TypeScript, inherited tests and production build.
Extended only `scripts/verify-atlas.mjs`: selection, card error/retry, counts, lineage, contributions and reload reset.
Three-parent browser error/retry, edges, contributions and reload checks passed; one real three-parent Weave call returned HTTP 200.
Live evidence: `/tmp/minerva-weave-three-live.json`; original Wander: `/tmp/minerva-live-wander-weave/wander-weave.json`.
Wander input: A shared tool library. HTTP 200 returned these three cards:

**The Depreciation Bank** — A mall wing where former anchor-store inventory is checked out against a decaying local currency instead of returned.
Instead of borrowing tools that must come back, shoppers 'withdraw' leftover retail stock (furniture, appliances, clothing) using a scrip that loses value the longer an item sits unused in someone's home, tracked via tags. The mechanism inverts library logic: return is discouraged, hoarding is penalized, and the old department store becomes a slow-motion auction where usage itself is the currency. Empty anchor stores become sorting and tagging floors; the mall's parking structure becomes a rotating outdoor market for reappraising scrip value weekly.

**Skill Escrow Court** — Tool lending is replaced by a peer-arbitration system where you borrow expertise, not objects, and disputes are settled publicly in the mall's old food court.
The food court's abandoned seating becomes a standing tribunal: anyone can 'check out' a skilled neighbor's time (rewiring a lamp, patching drywall) but must post a skill of equal value in escrow. If the exchange goes wrong, a rotating panel of mall regulars hears the case that afternoon, judgment enforced by reputation scores displayed on old directory screens. The mechanism shifts the tool-library idea from object circulation to obligation circulation, using the mall's central gathering architecture as an actual civic instrument rather than a metaphorical one.

**The Un-Return Wing** — One anchor store never takes anything back — instead it becomes a permanent record of what the neighborhood needed and never gave back.
A single former department store is converted into a growing archive: every tool, appliance, or item borrowed elsewhere in the mall that is never returned gets logged here with a note from the borrower explaining why. Shelves fill not with objects but with placards, photos, and stories of failure-to-return, curated as an evolving exhibition on community trust and breakdown. The mechanism replaces circulation with confession, turning the mall's dead retail architecture into a monument to unmet reciprocity rather than a functioning exchange.

Weave inputs, in order: A food hall; A shared tool library; Independent retail shops. HTTP 200 returned:
**The Fixed & Fed Mall** — A dead mall becomes a repair-and-provisioning commons where borrowed tools, cooked food, and small maker-shops circulate through the same daily loop.
The anchor department stores become a tool library, its checkout counter feeding directly into a central food hall built from the old atrium. Members borrow a sewing machine or drill, sit down to a shared table meal while waiting on a repair class, then walk the surrounding corridor of independent shops—each one stocked and often staffed by people who fix things with the borrowed tools, selling mended, remade, or small-batch goods that never existed in the mall's old retail mix. Tool returns happen at the food hall's edge, so borrowing, eating, and buying become one continuous, self-reinforcing walk through the building rather than three separate destinations.
Parent 1: The food hall supplies the daily communal rhythm and central gathering space that anchors the whole loop.
Parent 2: The tool library supplies the skill-building, borrowing, and repair activity that gives shoppers a reason to return and use the mall's other spaces.
Parent 3: Independent retail supplies the small, distinct shops that sell the goods made or mended using the borrowed tools, closing the loop back into commerce.

## Startup and limits

`cd /Users/brandyn.schult/code/minerva` then `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev`; open `/`.
Browser check: `npm run test:browser`; `MINERVA_LIVE=1` opts into one paid call per feature.
Generated content is speculative. Local mocked checks cover failures; they do not prove hosted fault recovery.
No persistence or owner acceptance is claimed. The original Fable review is complete; stop after deploying this selection update.
