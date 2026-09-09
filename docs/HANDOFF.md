# Atlas demo handoff
Root `/` is the in-memory mall atlas with Wander, Weave, typed/spoken Talk and moves.
This owner-directed batch ends after merge and stable deployment; one operator-started Fable review follows.
- Worktree: `/Users/brandyn.schult/code/minerva-remove-denser`; branch: `fix/talk-smooth-stream`.
- Started from refreshed `origin/main` at `f989afa`; exact released SHA is in the operator response.
- Stable target: https://minerva-eight.vercel.app/; hosted verification is in the operator response.
- No persistence, admission/budget logic, new dependencies or workspace features were added.
Root overview: tinted circles, short collision-filtered labels, and distant dots. Focus stays at 100%, with mobile room for the connection panel.
Relatives are paged by category, six at a time; Trace highlights one branch. Node positions stay stable.
Actual React Flow scale evidence: `/tmp/minerva-scale-runtime-results.json` (30/100/300 cards, desktop/mobile); browser evidence: `/tmp/minerva-scale-final-release`.

Talk paces streamed text independently of network chunks and catches up after bursts; replay checks partial and completed Markdown. Talk removes the canvas/reset note, renders CommonMark/GFM safely, uses a compact composer and clearer message typography, and preserves scroll position while reading older replies. Markdown browser evidence: `/tmp/minerva-talk-markdown`.
## Behavior

Includes main through `31b4b8b`: loading circles/colors, full-canvas Talk context and Enter/Shift+Enter controls.

Talk's Hold to talk button accepts mouse/touch and held Space/Enter. Only a deliberate press requests
microphone permission. Speech buffers in memory while connecting; release stops capture and sends it.
Pressing again stops playback and replaces the prior session. Dismissal/cancellation cleans up capture.
Heard user turns and streamed spoken-reply transcripts join typed Talk's full-canvas conversation/context, with selected IDs indicating focus.
Errors stay in the panel; hold Retry to record again. Typed Talk retains its existing route and OIDC.
`POST /api/voice` mints a short-lived Gateway token with the server-only `MINERVA_PRIME_VOICE_API` key.
The key came from the owner's Keychain and is a Vercel Secret for production/preview; never public/client-side.
This owner-authorized voice key supersedes the OIDC-only setup rule for voice; other calls still use OIDC.
`gateway.getAvailableModels()` confirmed `openai/gpt-realtime-2` (realtime); Sonnet 5 is language-only.
AI SDK realtime uses that documented model, disabled automatic turn detection, and `feature:voice`.
One session serves one press/reply; no wake word, always-on listening, tools or card creation via Talk.
Inspection Download saves one card; Thoughts Download saves all cards, regardless of search filtering.
Markdown includes title, summary, body, decision, evidence, contribution and relationships/contributions.
Both downloads use client-side Blobs and include generated/edited cards; failure offers Retry.

## Verification

The replay's moves mock fails until the visible error is followed by Retry, surviving Strict Mode aborts.
Removed toolbar buttons are asserted absent. Dropped the legacy zoom-controls visibility assertion;
camera/overview behavior, attached edges and generated-card readability assertions remain.
`npm run check`: lint, TypeScript, 12 tests and production build passed; final rerun recorded in operator response.
Existing `scripts/verify-atlas.mjs` now checks actual download Blob contents, Retry and generated cards;
voice covers permission denial, setup failure/Retry, delayed setup, transcript streaming, playback interruption,
mouse/keyboard hold, dismissal, typed follow-up context and reload reset. No new scripts.
`MINERVA_LIVE=1 MINERVA_VOICE_ONLY=1` passed with a real Gateway exchange using Chromium's synthetic microphone.
Evidence: `/tmp/minerva-voice-focused/voice-live.json`; earlier full dev replay: `/tmp/minerva-voice-outputs-dev`.
Final full dev/start and hosted replay results are in the operator response; fixtures are not live-provider evidence.

## Real voice exchange (synthetic microphone, actual Gateway response)

You: “Suggest one practical use for an empty shopping mall. Reply in one short sentence. Suggest one practical”
Minerva: “Convert it into a mixed-use community hub with medical clinics, coworking space, and a food hall to keep steady foot traffic.”
The fixture loops, explaining the repeated fragment. Actual audio playback was observed in Chromium (22 audio chunks).
Owner physical check: use localhost/HTTPS with microphone and speakers, allow permission on first press,
hold/speak/release, confirm the heard transcript and audible reply, then press again to verify interruption.

## Startup

Use Node 24.20.0/npm 12.0.2 via `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
From the worktree, `npm run dev -- --port 3026`; `MINERVA_URL=http://127.0.0.1:3026 npm run test:browser`.
Production: `npm run build`, `npm run start -- --port 3027`; set `MINERVA_URL=http://127.0.0.1:3027`.
Inject the voice key from Keychain into the server environment for live voice; no key needed for mocked replay.
`MINERVA_LIVE=1` opts into one real voice exchange; other provider paths stay mocked unless separately opted in.
