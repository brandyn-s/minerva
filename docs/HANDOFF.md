# Wander and Weave demo handoff

Root `/` runs the mall fixture plus in-memory Wander and Weave. Reload resets.
This owner-directed demo supersedes the M2 packages and all earlier handoff plans.
No workspace, database, Workflow, request-policy or migration code was changed.
No new voice, drive, perspectives, outputs, assessments, decisions, ledgers, export, duplication, history or quality controls.

- Checkout: `/Users/brandyn.schult/code/minerva`; branch: `demo/wander-weave`.
- Base: `origin/main` at `56db5551c59cef31918942ee94afa8b529cb0215`.
- Release target: https://minerva-eight.vercel.app/; exact released SHA and hosted evidence go in the operator response.
- Review boundary: one Fable 5.1 review after production deployment, then stop.

## Behavior and authentication

Select one card → Wander → two or three adjacent cards with derivation edges.
Select two cards → Weave → one recombination draft with both parent edges.
Inspect the draft to read its full body and one-line contribution from each parent.
Errors appear on source cards; Retry repeats that feature with the same source snapshot.
`POST /api/wander` and `POST /api/weave` each call AI SDK `generateObject` once.
Both use plain `anthropic/claude-sonnet-5`, confirmed once with `gateway.getAvailableModels()` on 2026-09-09.
Tags: `feature:wander`, `feature:weave`. SDK automatic retries are disabled.
Authentication: Vercel OIDC, locally refreshed with `vercel env pull .env.local --yes`; automatic when hosted.
No key was created or requested. No application admission, reservation, budget or receipt logic in this path.
The existing Gateway project budget is the only spend control for these features; it was not changed.

## Verification and actual returned cards

Local `npm run check` passes: lint, TypeScript, 14 inherited tests and production build.
Extended only `scripts/verify-atlas.mjs`: selection, card error/retry, counts, lineage, contributions and reload reset.
Mocked browser run passed. Live browser run passed with exactly one real Gateway call per feature on 2026-09-09.
Live evidence: `/tmp/minerva-live-wander-weave/wander-weave.json` and feature screenshots.
Wander input: A shared tool library. HTTP 200 returned these three cards:

**The Depreciation Bank** — A mall wing where former anchor-store inventory is checked out against a decaying local currency instead of returned.
Instead of borrowing tools that must come back, shoppers 'withdraw' leftover retail stock (furniture, appliances, clothing) using a scrip that loses value the longer an item sits unused in someone's home, tracked via tags. The mechanism inverts library logic: return is discouraged, hoarding is penalized, and the old department store becomes a slow-motion auction where usage itself is the currency. Empty anchor stores become sorting and tagging floors; the mall's parking structure becomes a rotating outdoor market for reappraising scrip value weekly.

**Skill Escrow Court** — Tool lending is replaced by a peer-arbitration system where you borrow expertise, not objects, and disputes are settled publicly in the mall's old food court.
The food court's abandoned seating becomes a standing tribunal: anyone can 'check out' a skilled neighbor's time (rewiring a lamp, patching drywall) but must post a skill of equal value in escrow. If the exchange goes wrong, a rotating panel of mall regulars hears the case that afternoon, judgment enforced by reputation scores displayed on old directory screens. The mechanism shifts the tool-library idea from object circulation to obligation circulation, using the mall's central gathering architecture as an actual civic instrument rather than a metaphorical one.

**The Un-Return Wing** — One anchor store never takes anything back — instead it becomes a permanent record of what the neighborhood needed and never gave back.
A single former department store is converted into a growing archive: every tool, appliance, or item borrowed elsewhere in the mall that is never returned gets logged here with a note from the borrower explaining why. Shelves fill not with objects but with placards, photos, and stories of failure-to-return, curated as an evolving exhibition on community trust and breakdown. The mechanism replaces circulation with confession, turning the mall's dead retail architecture into a monument to unmet reciprocity rather than a functioning exchange.

Weave inputs, in order: A food hall; A shared tool library. HTTP 200 returned:
**The Fabrication Food Hall** — A dead mall becomes a food hall where each kitchen stall is built and maintained using tools borrowed from an on-site lending library, fusing communal eating with communal making.
The mall's anchor stores are gutted into a checkerboard of open kitchen stalls and a tool library counter at the center court. Vendors don't lease turnkey kitchens; they check out griddles, smokers, dough mixers, and repair equipment from the library, learning to maintain their own stations through short clinics run by library staff. Diners eat at shared tables surrounded by pegboards of hanging tools, and slow hours become open workshop time where anyone can borrow the same equipment to cook at home stations set up in former storefronts. The daily rhythm of meals is literally powered by the circulating inventory of borrowed tools, so the food hall's menu shifts with what equipment is currently available.
Parent 1: Supplies the communal eating structure and daily rhythm that organizes the mall's public space.
Parent 2: Supplies the borrow-learn-return mechanic that determines how each kitchen stall is equipped and staffed.

## Startup and limits

`cd /Users/brandyn.schult/code/minerva` then `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev`; open `/`.
Browser check: `npm run test:browser`; `MINERVA_LIVE=1` opts into one paid call per feature.
Generated content is speculative. Local mocked checks cover failures; they do not prove hosted fault recovery.
No persistence or owner acceptance is claimed. Production deployment and the single Fable review are the stopping boundary.
