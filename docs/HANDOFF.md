# Atlas demo handoff

Root `/` runs the mall atlas with live Wander, Weave, typed Talk and contextual moves.
All new state stays in memory; reload clears conversation, generated cards and edges.
This owner-directed batch supersedes earlier handoff outcomes. Stop after stable deployment.

- Checkout: `/Users/brandyn.schult/code/minerva-remove-denser`; branch: `feat/scalable-atlas-overview`.
- Base: `origin/main` at `fc4b57e7b7b073fa85c05a42d01b8effa13a4840`.
- Stable target: https://minerva-eight.vercel.app/; released SHA and hosted evidence are in the operator response.
- Next role: one operator-started Fable 5.1 review, read-only; no further build is authorized.

## Behavior

Denser Study is removed: no scene switch, prepared variation groups or extra 24-card fixture. The six-card mall remains.

Talk to Minerva opens a dismissible panel; each turn includes prior conversation and every canvas card's title, summary, body and relationships; selected IDs identify focus.
`POST /api/talk` uses AI SDK `streamText`, plain `anthropic/claude-sonnet-5`, tag `feature:talk`.
Enter sends; Shift+Enter adds a newline; IME composition does not send. The composer stays visible while the transcript scrolls. HTTP, interrupted-stream and provider errors show Retry in the panel.
Consider a move selects its source; exactly one selection requests three title/question/preview suggestions.
`POST /api/moves` uses one `generateObject` call, the same model and tag `feature:moves`.
A failed planner keeps the prepared move available and offers Retry. Choosing a move creates one card via `/api/wander` and the shared placement path.
The derivation edge carries the move title; card-generation failures offer Retry in the panel.
Wander/Weave show rotating circles on the active action and source cards, rings on overview nodes, and a larger persistent canvas spinner. Browser checks verify actual rotation, overview rings, and clearing on completion/error.
Root overview uses tinted circles, short collision-filtered labels and distant dots. Focus stays at 100%; linked relatives are paged by category, six at a time, with single-branch Trace. Node positions stay stable.
Vercel OIDC authenticates Gateway calls; SDK automatic retries are disabled. No new dependencies.
No voice, chat tools, chat-created cards, persistence, admission, budgets or workspace changes.

## Verification and real responses

`npm run check`: lint, TypeScript, all 12 tests and production build passed.
Only `scripts/verify-atlas.mjs` extended: mocked failures/retries, partial streaming, conversation context, three moves, lineage and reload reset.
Each generation asserts zoom output >=73% and a generated card's Select control is visible, including mobile fallback generation.
`MINERVA_LIVE=1` opts into one Talk and one moves-planner call; older generation calls stay mocked unless `MINERVA_LIVE_EXISTING=1` is also set.
Live Gateway evidence: `/tmp/minerva-talk-moves-live/talk-moves.json`; mocked screenshots/checks: `/tmp/minerva-talk-moves-mock`.
An initial live run lost the response in Chromium's network-body reader; the corrected run captures rendered text and passed.
Talk input: selected A shared tool library; “Suggest one concrete improvement to this selected idea in two sentences.”

One concrete improvement: pair each tool checkout with a mandatory short skills-check or video demo logged in a simple membership system, so borrowers show basic competence before taking higher-risk equipment (saws, drills) home. This reduces damage/injury risk and creates a natural on-ramp to the peer-taught repair sessions already linked to this idea.

Moves input: A food hall and its relationships. Actual returned response:

**Repair-and-Refuel Counters** — What if each kitchen stall shared a wall with a repair bench, so diners watch shoes, phones, or bikes get fixed while they eat? Turns waiting time for repairs into a dining ritual, blending trades and tables.

**Communal Weave Table** — Could one long table rotate ownership hourly between kitchens and craftspeople, becoming a living timetable of the mall's rhythms? A single table that narrates the mall's day through who's sitting at it.

**Ingredient Barter Board** — What if kitchens traded surplus ingredients with repair stalls for scrap materials, displayed on a public barter board? Makes the food hall a visible economy of exchange, not just consumption.

Wander now requires explicit `intent: "move"` for single-card generation; legacy source move metadata stays ordinary Wander.
`MINERVA_WANDER_REGRESSION=1` verifies this with one real Gateway call; evidence: `/tmp/minerva-wander-regression/wander-regression.json`.
**The Rent-a-Guild Concourse** — Empty anchor stores become six-week guild halls where a trade collectively occupies and reshapes the space before vanishing.
**Supper Court Currency** — Meals cooked at the mender's table are paid for with broken objects instead of money, creating a barter economy that accumulates raw material.
**The Failing Apprentice Wing** — A second, parallel stall run by whoever failed to master the previous six-week trade, turned into a public workshop of visible mistakes.

## Startup

`cd /Users/brandyn.schult/code/minerva-remove-denser`; `npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3016`; open `/`.
Mocked browser check: `MINERVA_URL=http://127.0.0.1:3016 npm run test:browser`.
Actual React Flow scale evidence (30/100/300, desktop/mobile): `/tmp/minerva-scale-runtime-results.json`. No-selection live Talk evidence: `/tmp/minerva-talk-context-live.json`; browser keyboard/context checks: `/tmp/minerva-talk-context`. Live suggestions are speculative. No persistence or owner experience acceptance is claimed.
