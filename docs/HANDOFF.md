# Integrated composer

Branch: `feat/integrated-composer`.
Worktree: `/Users/brandyn.schult/code/minerva-integrated-composer`.
Integrated with origin/main `2314038`; owl, toolbar medallions and header cleanup preserved.

## Outcome
Talk uses one integrated writing surface: hold-to-talk microphone and hands-free
Voice mode on the left, Send arrow on the right. Icons have accessible names,
shared hover/focus tooltips and 44px targets. Enter sends; Shift+Enter adds a line.
Voice mode uses the existing Gateway realtime route and `openai/gpt-realtime-2`.
Automatic speech detection continues across turns, with spoken interruption,
shared transcripts, mute/unmute, End and Back to typing. Closing releases audio.
The active composer shows Minerva, animated waveform and listening/speaking status.
Typed Markdown, smooth streaming and canvas context remain. State resets on reload.
No database, workspace, model credentials or server route changes.

## Evidence
`npm run check`: lint, TypeScript, 12 tests and production build passed.
Browser fixture replay covers microphone denial, token failure, hold/release,
late connection, queued-audio cancellation, transcript sharing and close cleanup.
New fixture coverage exercises two automatic voice turns, interruption, microphone
track mute/unmute, ending, return to typing and narrow layout. Full atlas replay passed.
Real Gateway hold-to-talk and automatic Voice mode replies were received using
synthetic spoken input and the existing production token endpoint. The automatic
reply began “Use a section as a rotating six-” before the test ended the session.
This verifies live connectivity/turn detection, not physical microphone quality.
Desktop integrated composer was visually inspected in the in-app browser.

## Startup and next role
`npm run dev -- --port 3051` (Node/npm launcher in AGENTS.md).
Local preview: http://127.0.0.1:3051/.
Stable target: https://minerva-eight.vercel.app/.
Next role: owner acceptance; no further feature work or critic review is queued.
