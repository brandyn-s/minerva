# Voice lifecycle and transcript correction

Branch: `fix/voice-survives-dismiss`, integrated with `main` at `f64fbed`.
Worktree: `/Users/brandyn.schult/code/minerva-card-metadata-release`.
Voice change commit: `f607e7b`. Owner authorized commit and merge.

## Outcome
Current main pane styling and node/card transitions are preserved.
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

## Live voice focus
Voice receives updated canvas content, inspection focus and selection during an active session.
The instructions map "this one" to focus and "these" to selected cards without reconnecting.
Branch `fix/voice-live-focus`; worktree `/Users/brandyn.schult/code/minerva-voice-canvas`.
Local startup: `npm run start -- --port 3302`; focused replay uses `MINERVA_VOICE_ONLY=1`.
Owner authorized commit and merge; final response records integrated verification.

## Constellation clusters
Branch: `fix/constellation-clusters`, based on `main` at `6155709`.
Worktree: `/Users/brandyn.schult/code/minerva-constellation-release`.
Compact theme shelves and readable zoom previews share the current Studio styling.
Association edges join ideas; headings follow moved members. Regroup keeps untouched positions.
Current folding, resizing, chain inspection and voice behavior are preserved.
Verification: `npm run check` passed (18 tests, lint, types, build); browser fixture smoke passed.
Theme responses were mocked for visual verification; no paid provider calls.
Startup: use the Node/npm prefix above, then `npm run start -- --port 56020`.
Next role: owner; no additional implementation or critic requested.
