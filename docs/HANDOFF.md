# Root atlas: Expedition and reading
Branch: `demo-expedition-reading`, based on `origin/main` at `c5676cc`.
Worktree: `/Users/brandyn.schult/code/minerva`; release SHA and stable verification are in the operator handoff.
Scope ends after merge and deployment to https://minerva-eight.vercel.app/; one operator-started Fable review follows.
Root atlas only, in memory. No persistence, new dependencies, admission, database, /workspaces or Workflow changes.

## Behavior
Constellation fits after grouping arrives, including theme headings, cards and cross-group associations.
One selected card opens Expedition: frozen goal, 2–5 steps, one Sonnet 5 call per step, derivation edges and rationales.
Stops on budget, Stop, model claim of reached, or two consecutive near-identical title/summary transitions.
Completed cards remain; Stop aborts the in-flight request and ignores late output. Errors retain completed work.
Reading groups mechanisms, explains changes, labels observations/hypotheses, suggests two experiments and names coverage gaps.
Every reading item focuses its actual card; Challenge only adds a user disagreement note. Edits mark readings stale; Re-read refreshes them.

## Verification
Full dev replay passed with MINERVA_LIVE=1: exactly two real expedition calls and one real reading; other model paths mocked.
Routes: `/api/expedition` and `/api/reading`; `generateObject`, `anthropic/claude-sonnet-5`, `feature:expedition` / `feature:reading`.
Replay covers all four stops, frozen request/UI goal, frontier/previous cards, retained partial work, reading links, Challenge and stale/Re-read.
It also asserts every theme heading is in the viewport on first Constellation entry, without Fit; existing desktop/mobile/voice replay passed.
`npm run check`, next-start replay and stable-URL results are reported in the operator handoff.
Full live requests/responses: `/tmp/minerva-expedition-live/expedition-live.json` and `reading-live.json`.

## Actual two-step expedition
Frozen goal: Develop two distinct, connected drafts toward a testable evening repair service, first defining a session format and then a booking experiment.
1. Evening Repair Circle: 90-Minute Session Format — Define a recurring evening session where visitors bring broken items and fix them together using the mall's shared tool library.
   Draft: Each session runs 6:30–8:00pm, capped at 8 participants. A volunteer 'fix-guide' rotates tools from the shared library to stations; visitors work in pairs on their own broken items (small appliances, clothing, bikes). First 15 minutes: intake and tool checkout. Middle hour: guided repair work. Final 15 minutes: tool return and quick show-and-tell of what got fixed. This format is speculative—no attendance or repair-success data exists yet.'
   Rationale: Turns the abstract shared tool library into a concrete, time-boxed evening service format, the first of the two drafts the goal requires.
   Model self-report: false — Only the session format draft exists; the second required draft—a booking experiment—has not yet been created or connected to this format.
2. Booking Experiment: 3-Week Signup Test — Design a minimal-cost experiment to test whether people will actually book slots for the Evening Repair Circle before building full infrastructure.
   Draft: Launch a simple booking page (shared calendar link or paper sign-up sheet at mall info desk) offering 3 consecutive weeks of the 90-minute session at the same time slot, capped at 8 spots each. Track: (1) time-to-fill each session, (2) no-show rate, (3) walk-in demand beyond capacity, (4) item categories people mention when booking (appliance/clothing/bike). No paid promotion—only a flyer near the tool library and one social post per week. Success threshold: at least 2 of 3 sessions reach 5+ bookings with under 30% no-shows, signaling enough organic demand to justify a recurring slot and dedicated booking system.'
   Rationale: This directly builds the second requested draft—a testable booking experiment—by attaching measurable demand signals to the already-defined session format.
   Model self-report: true — Both required drafts now exist: the session format card and this new booking experiment card, together forming a connected, testable pair as the goal specified.
Stopped on the model’s step-2 claim; no success or empirical validation is asserted.

## Actual reading
- Mechanism (steps 1): Service format design (defining structure, timing, roles, and flow of the repair session)
- Mechanism (steps 2): Demand validation experiment design (low-cost test of booking behavior before infrastructure investment)
- Change at step 2: Shifts from specifying the internal structure of the session (roles, timing, phases) to designing an external test of whether anyone will actually show up for it, moving from format definition to hypothesis-testing methodology.
- observation (steps 1): The session format explicitly states it is speculative, with no attendance or repair-success data yet collected.
- observation (steps 2): The booking experiment specifies concrete tracking metrics (time-to-fill, no-show rate, walk-in overflow, item categories) and a numeric success threshold (2 of 3 sessions with 5+ bookings, under 30% no-shows).
- observation (steps 2): The experiment card limits promotion to a single flyer and one weekly social post, explicitly avoiding paid promotion.
- hypothesis (steps 1): An 8-participant cap and 90-minute window (15/60/15 split) is a workable size and pacing for pairing visitors with a rotating tool library.
- hypothesis (steps 2): Minimal-cost signage and social posts will surface enough organic demand to distinguish real interest from indifference within three weeks.
- hypothesis (steps 2): Reaching the stated booking threshold would indicate sufficient demand to justify a recurring slot and dedicated booking system, though this causal link is untested.
- hypothesis (steps 1): Pairing strangers on their own broken items for guided repair will produce enough mutual help to complete fixes within the session, though no repair-outcome mechanism is described.
- Next experiment (steps 2): Run the described 3-week booking test exactly as specified in step 2, logging fill time, no-shows, walk-in overflow, and item categories to see if the stated threshold is met.
- Next experiment (steps 1, 2): After the booking test, run a session-format probe that varies the intake/repair/show-and-tell time split (e.g., 10/70/10) with the same 8-person cap to see whether more guided repair time changes completion or satisfaction, independent of booking demand.
- Coverage (steps 1, 2): Neither step tests actual repair success/completion rates, participant satisfaction, alternate time slots or days, different capacity sizes, pricing or donation models, or whether walk-in-only (no booking) demand differs from pre-booked demand. The booking experiment also does not vary promotion intensity to isolate its effect from organic interest.

## Startup and next role
Use `npx --yes --package=node@24.20.0 --package=npm@12.0.2` before npm commands.
Dev: `npm run dev -- --port 3048`; production: `npm run build`, then `npm run start -- --port 3049`.
Replay: `MINERVA_URL=http://127.0.0.1:3049 npm run test:browser` (use 3048 for dev). No new scripts.
`MINERVA_LIVE=1` opts into two expedition steps and one reading; no additional live calls are authorized for the review.
Next: operator-started Fable 5.1 at low effort, exact released candidate, read-only, C11/C12 and first-entry fit; use docs/setup.md’s bounded prompt.
