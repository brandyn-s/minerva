# Voice lifecycle and transcript correction

Branch: `fix/voice-survives-dismiss`, based on `main` at `598fdf2`.
Worktree: `/Users/brandyn.schult/code/minerva-card-metadata-release`.
Changes are uncommitted.

## Outcome
Talk's close button and Escape hide the window without clearing active Voice.
Reopening retains the same session, transcript, and mute state.
End voice mode still stops capture and releases the session.
Normal teardown on page unload and connection failure remains.
Separate speech text parts render as paragraphs; empty transcriptions add no blank messages.
Push-to-talk checks captured audio before committing or requesting a response.
A missing microphone callback now shows a retry status instead of sending an empty turn.
The historical repeated wording is not reproduced: saved text cannot establish
whether audio repeated or the provider emitted repeated text.

## Verification
`npm run check` passed: lint, typecheck, 15 tests, production build.
The focused mocked voice replay covers close/Escape, replies while hidden,
reopening without a new microphone, retained mute state, and explicit End.
Replay also checks repeated final transcript events, multi-part speech, empty
input transcripts, and that text events cannot schedule audio playback.
These are mocked protocol/PCM tests, not a live-provider or acoustic-echo diagnosis.
No paid voice calls or deployment in this task.

## Startup and next role
Local production preview: http://127.0.0.1:56007.
Prefix commands with `npx --yes --package=node@24.20.0 --package=npm@12.0.2`.
Startup: `npm run build`, then `npm run start -- --port 56007`.
Replay: `MINERVA_VOICE_ONLY=1 MINERVA_URL=http://127.0.0.1:56007 node scripts/verify-atlas.mjs`.
Next role: owner inspects the local result; no critic requested.
