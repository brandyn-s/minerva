# Transition verification

Candidate: uncommitted changes on `docs/scorebook-transition-batch-00`, base
`6f148242c93f2cd44868c6374178ef12a8876586`, September 10, 2026.
Commands use Node 24.20.0 / npm 12.0.2 through the prefix in implementation.md.

| Check | Result and boundary |
| --- | --- |
| `npm run check` | Lint, TypeScript, 37 tests and production build pass. |
| `npm run test:ui` | All four desktop/touch shared-control and navigation tests pass. Updated old Expedition assertions to current controls, including offline start protection. |
| `npm run test:expedition-process` | Three separate worker processes resume one persisted run without duplicate candidate commits. |
| `npm run test:expedition-scale` | 100 / 1,000 / 10,000 synthetic candidates; query returns 30. Latest 10,000 query ~0.55 ms, full analysis ~218 ms, reading preview 13,022 bytes. Local timings vary; no production throughput claim. |
| `npm run eval:expedition` | 18 runs / 432 synthetic calls; all budgets respected. All four fixture mechanisms found by each policy; no superiority claim. Full run, attempt, operation, candidate, assessment and reading evidence retained in ignored comparison.json. |
| `MINERVA_URL=http://127.0.0.1:3086 npm run test:expedition` | Connected browser run, intervention +2 calls, reassessment +1, explicit allocation probe, reload, and atlas materialization pass. Desktop/touch screenshots retained. |
| Focused Develop replay | Edit/diff/Revert, frozen sources, Develop, reused intent, Stop, reload, JSON/Markdown and v2 migration pass using mocked provider responses. |
| Focused voice replay | Fails before context exchange: `microphone must deliver audio before releasing the test press`. Same failure reproduced on a clean detached base checkout at 6f14824. This is not fresh voice integration proof; bounded typed/voice context is unit-tested. |
| Runtime dependency inspection | No application runtime import/fetch to Scorebook. Historical source can be archived independently of Minerva runtime. |

Raw synthetic artifacts live under ignored `evaluation-artifacts/transition/`.
Logs: `/tmp/minerva-check-final.log`, `/tmp/minerva-ui-final.log`,
`/tmp/minerva-expedition-final.log`, `/tmp/minerva-process-final.log`,
`/tmp/minerva-scale-final.log`, `/tmp/minerva-eval-final.log`,
`/tmp/minerva-transition-voice2.log`, `/tmp/minerva-baseline-voice.log`.
The voice baseline is `/Users/brandyn.schult/research/private/minerva-voice-baseline`.

No fresh hosted verification, paid model experiments, historical-result replay,
independent semantic review, calibrated assessor accuracy or live cost validation.
Live protocol pins exact briefs and prompt/schema hashes, but its numeric spend
ceiling is intentionally unset until authorized. Batch 09 was subsequently completed with accessible exports recovered and remaining
unknown coverage explicitly disposed; see batch-09.md for the verified archival record.
