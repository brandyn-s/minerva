# Voice customization

Branch: `feat/voice-customization`.
Worktree: `/Users/brandyn.schult/code/minerva-remove-node-tooltips`.

Voice now uses `openai/gpt-realtime-2.1` for both token issuance and client sessions.
Voice settings live beside the microphone in Talk: ten voices, generated preview,
tone, approach, length, pace, expertise, follow-up style, language, accent,
custom instructions, server/semantic turn detection, silence/threshold/padding,
transcription language/vocabulary, and browser microphone processing.
Settings persist per browser when storage is available, reset to defaults, and
apply to the next session. Active sessions lock settings and offer Stop voice.
Preview needs no microphone and does not enter the conversation history.
The model follows the current atlas rather than a hardcoded shopping-mall topic;
live focus/selection updates and context boundaries are preserved.

Verification: `npm run check`; `scripts/verify-voice-settings.mjs` verifies settings,
persistence, reset, mobile dialog, and preview configuration with a mock socket.
`tests/voice-settings.test.mjs` covers parsing and session configuration.
Live Realtime 2.1 audio remains unverified: Gateway rejects OIDC token minting;
the existing dedicated voice key is configured only in Preview and Production.
Next role: owner reviews voice behavior on the preview/merged deployment.
Commit and merge authorized; live audio validation is still pending.
Startup: `npm run dev -- --port 3198` (Node 24.20.0 / npm 12.0.2).

Integrated main: the compact card inspector retains Content, Connections and
History tabs, editing, session revision history, and draft preservation.
Voice dismissal, transcript handling, and live focus updates remain intact.

## Constellation clusters
Branch: `fix/constellation-clusters`, based on `main` at `779e2b9`.
Worktree: `/Users/brandyn.schult/code/minerva-constellation-release`.
Compact theme shelves and readable zoom previews share the current Studio styling.
Association edges join ideas; headings follow moved members. Regroup keeps untouched positions.
Current folding, resizing, chain inspection and voice behavior are preserved.
Verification: `npm run check` passed (25 tests, lint, types, build); browser fixture smoke passed.
Theme responses were mocked for visual verification; no paid provider calls.
Startup: use Node 24.20.0 / npm 12.0.2, then `npm run start -- --port 56020`.
Next role: owner; no additional implementation or critic requested.
