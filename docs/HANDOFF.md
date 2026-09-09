# Minerva application handoff

## Current outcome

M1 packages 2–3 now have a connected local fixture atlas: inspect the mall brief
and independent A/B/C proposals, trace the two-parent repair/supper draft, move
cards with attached edges, pan/zoom, select distant contributions, compare them
and consider prepared contextual moves. The root route includes the same data as
a text reference and a denser 30-card scene with explicit overview groups.

Package 2 is implemented and locally exercised. Package 3's implementation and
local journey evidence are prepared; the owner-led comparison is recorded in
CAPABILITIES. The owner accepts the M1 experience with documented orientation/
interaction friction. Fable M1 review remains pending.
The next M2 milestone has not been authorized. No live services are simulated.

- Repository: https://github.com/brandyn-s/minerva
- Isolated publication worktree: `/Users/brandyn.schult/code/minerva-m1-overview-fix`.
- The original `/Users/brandyn.schult/code/minerva` checkout contains separate M2
  work and is not reset or switched by this publication.
- Branch: `fix/m1-overview-ghosting` (M1 overview corrections and owner observations).
- Last committed application/review candidate: `4e28dfbd85f6cdf349bba6fd2d180371492a327b`.
  This publication additionally removes overview subtext and fixes drag-shadow
  ghosting; the existing review checkout does not include those corrections.
- Publication: [PR #5](https://github.com/brandyn-s/minerva/pull/5) is merged to
  `main`; the owner-observation documentation is preserved alongside the additional
  UI corrections published by this branch.
- Seed provenance: `brandyn-s/minerva-template` at
  `248665c116fb0655e2b70f732ca1b9bffb5b5dcb`; generated initial commit
  `33f81109ea47ad83732f316e72f6adeb8ed7a352`.

## Implementation and boundaries

[Domain records](../features/atlas/domain.ts) are independent of React Flow and
services. [Prepared data](../features/atlas/fixture.ts) uses those records;
[presentation](../features/atlas/atlas.tsx) maps them to custom React Flow cards.
The original owl and DESIGN palette are retained. Cards drag at overview zoom;
single-click opens inspection at every zoom, and double-click focuses. Pointer,
keyboard and inspection access bring the relevant card forward. Focus/selection
highlights follow the visible card or circular marker instead of hidden bounds. No empty service scaffolding
was added. React Flow and Playwright are pinned in package/lock files.

The prepared demo has six thoughts and seven relationships. A/B/C share brief
context without invented parentage. The repair/supper recombination explicitly
inherits from food and tools. The shopfront example derives from retail and has
a semantic association with tools. Decisions and evidence certainty are separate.
The dense scene has 30 thoughts and 31 relationships; compact zoom groups its
24 variations by source while the index exposes each record. Selection survives
inspection/comparison, and deliberate navigation is the only panel action that
changes the camera.

Fixture text edits, layout and selection reset on reload or scene change. Edited
text does not revise the frozen prepared excerpts. Prepared moves preview source
contributions; they do not generate a card, assess feasibility or save a result.
Persistence, models, voice, production Weave and contextual planning remain open.
See [CAPABILITIES](./product/CAPABILITIES.md) for partial capability evidence.

## Verification

Local lint, typecheck, all 11 domain/document/configuration tests and production
build pass. The browser journey script covers IB01–IB06, card/edge movement,
source navigation, selection/camera retention, overview groups and text reference.
Reference setup agreed by owner: primarily laptop/desktop with or without external
monitors; Chromium 153.0.8010.36 on macOS Apple Silicon, 1440×900 and 1280×600 mouse/
keyboard, plus 390×844 Chromium CDP simulated touch. Programmatic activation is
explicitly simulated; no physical-device or screen-reader review was performed.
Local screenshots live in ignored `evaluation-artifacts/m1/`.

The browser work reproduced and corrected title-panning interception, overview
pointer blocking, overlapping labels and initial-fit interference from handle
measurement. Rechecks cover the original journeys and neighboring input changes. The owner's
subsequent feedback also corrected overview dragging, permanent stacking,
single-click zooming and rectangular marker highlighting. Regression checks cover
mouse/keyboard overlap access, compact simulated-touch drag/pinch, unchanged camera
on single-click inspection, double-click focus and circular selection styling.
A browser accessibility scan reported no confirmed violations; contrast over
layered canvas content required manual inspection, not an automated pass claim.
The owner comparison demonstrates comprehension of both contributions and their
transformations, and finds provenance/comparison useful. Separate focus navigation
and lineage presentation introduce orientation friction; explicit unknown evidence
does not establish trustworthiness. The next concept direction is a feasibility
pilot, not authorization to conduct one. Full observations are in CAPABILITIES;
the owner explicitly accepts the M1 experience because the friction does not
prevent identifying parents, contributions or the recombination. Lineage
exploration is less seamless, but the core experience remains usable and
interpretable. No model calls or paid provisioning occurred.

## Startup and next role

Startup mode: prepared local atlas, loopback only, no database/model/voice service.

```sh
cd /Users/brandyn.schult/code/minerva
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
```

Open http://127.0.0.1:3000. Browser replay is `npm run test:browser` with the pinned
runtime; browser installation and optional executable/output overrides are in
[setup](./setup.md#m1-fixture-verification).

Next role: operator supplies or starts the Fable M1 review.
The owner-led comparison and explicit M1 experience acceptance with the known
orientation/interaction limitation are recorded in CAPABILITIES.

The operator starts Fable 5.1 at medium effort on a separate checkout of the
merged candidate, source read-only, isolated fixtures, port 3001, no paid calls,
using the M1 review in build-prompts.md. Do not launch the critic automatically.
Use setup's full review permissions and prompt. The separate review checkout
already exists at the application candidate; verify it before starting services
and reuse the existing port 3001 server if it is still running:

```sh
git -C /Users/brandyn.schult/code/minerva-review-m1 rev-parse HEAD
cd /Users/brandyn.schult/code/minerva-review-m1
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev -- --port 3001
```

Review scope: M1 packages 2–3; C02/C03/C06/C08/C15 fixture increments and IB01–IB06.
Start with the four owner-reported interaction failures and their neighboring
transitions. Distinguish real card movement from grouped collection navigation,
prepared previews from live execution, and technical findings from experience
judgment. Return findings to the owner; do not edit application source or claim
acceptance on the owner's behalf. Owner experience acceptance is recorded;
M2 work remains **Not authorized yet** and depends on completed M1 review and
resolution of confirmed review blockers.

## Hosted checkpoint

The hosted shell was last verified on 2026-09-09 at
`0f8b1a16e1cd831774bcc09fcb61582a9c31a5de`, deployment
`dpl_J428z3vwbDGfr8jbp19rEiBNr2mu`, on https://minerva-eight.vercel.app.
The corrected atlas has not been verified on the stable URL. Git integration
builds previews on branch updates and production on merge; inspect deployment
metadata before attributing hosted behavior to the recorded shell or M1 candidate.

Existing Vercel project: `thalient/minerva`, ID `prj_LwZ9H81IBdwWEHZ5DEJfJNaeqfrb`,
team `team_CPMDIZRXjSVqupCatDjsDq4Q`. Git integration uses `brandyn-s/minerva`,
production branch `main`; branch pushes can create previews. Managed Node 24.x,
install `npx --yes npm@12.0.2 ci`, build `npx --yes npm@12.0.2 run build`.
Default deployment protection remains configured. Ignored `.vercel/` and
`.env.local` hold local link/OIDC state; no credentials are committed.
The M6 demonstration window is not open.

## Additional overview correction

Overview cards show their titles only; the interaction hint remains in the field
controls and accessible tooltip. The detailed-card drag shadow no longer paints
the invisible overview container. Browser regressions first reproduced the
rectangular shadow while holding a drag, then verified transparent backgrounds
and absent parent shadows/outlines during overview mouse and compact simulated-
touch dragging. Existing IB01–IB06 checks still pass. The merged commit of this correction PR is the next review candidate;
the operator response supplies its exact SHA. Owner comparison and acceptance
remain attributed to the earlier candidate above.
