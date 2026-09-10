# Minerva: a living atlas

## Identity and naming

Use the feeling of a contemporary workshop for thought: paper, ink, fine
threads, restrained bronze, and an abstract owl. The owl represents attention
and perspective, not an all-knowing oracle. The starter's original mark is in
`app/icon.svg`; it is not a trademark-clearance claim.

| Experience | Name | Plain action wording |
|---|---|---|
| Main environment | Studio | Open workspace |
| Bounded exploration | Wander | Explore this idea |
| Combining contributions | Weave | Recombine selected ideas |
| Space interpretation | Patterns | See patterns |
| Voice collaborator | Minerva | Talk to Minerva |
| Proposal decisions | Drafts | Keep / Edit / Set aside |

Use "What this space suggests" for evidence-linked readings. Do not call
outputs truths or winners. The thematic Weave label uses the recombination
operation; it does not require a second synthesis engine. Backend operations
should keep plain domain names rather than spread metaphor through types.

## Materials

Paper `#e9dfc7`, cards `#f1e9d6`, ink `#273a35`, deep teal `#213f3e`, teal `#28686a`,
coral `#a15442`, amber `#b18a58`, violet `#755584`. Use aged bronze sparingly for
deliberate selection and details. Serif content and headings sit alongside
compact instrument-like labels. A readable editorial serif and restrained
monospaced controls are appropriate; font packages need suitable licenses.

Avoid distressed parchment, ornamental columns, cartoon mascots, neon,
permanent glowing, and mythological names for every tool. A night theme is
optional, not a first-release obligation.

## Expedition panel standard

Expedition is the visual template for atlas instruments. Layout, Read as text,
and Browse thoughts share its warm paper surface, fine borders, rounded frame,
medallion header, uppercase monospaced instrument name and shared close control (36px desktop, 44px touch).
Use `PanelHeader` from `components/ui` rather than separate header styles.
Shared tokens in `components/ui/tokens.css` own the palette and spacing.
[UI ownership and verification](./UI.md) defines components and enforcement.

The shared type roles are 20px serif titles, 15px serif body text, 16px serif
inputs and actions, 12px mono labels, and 11px mono notes/instrument names.
Narrow layouts retain the same type scale. Use the `--guide-type-*`
and `--guide-font-*` tokens; do not introduce pane-specific type scales. All
headers use a 32px medallion, 36px close control and the same spacing. Primary
and secondary actions share a 36px minimum height, type and radius; color
indicates priority. Inputs share their type, padding and cream surface. Touch targets retain at least
44px height. Panel padding is 14px; Expedition and Browse use 440px widths,
Layout 340px, and the reader 880px to accommodate contents and article.

Use deep green primary/selected controls and a teal left edge for selected or
source material. Reuse each instrument's existing medallion. Keep the reader's
contents/article layout and the catalogue's search, selection and previews;
the shared template adapts to each task's content.

## Composition and direct interaction

This is an atlas, not an admin dashboard. One compact header contains identity,
view/workspace context and exploration/conversation entry. Compact instruments
sit at the field edges, zoom near a lower corner and details in a dismissible
overlay that does not resize the canvas. At 1440x900 with panels closed, target
at least 80% viewport height for the field. This is a composition target, not
a provider or rendering speed claim.

Cards at normal zoom are approximately 260-320px wide with an expressive
concise serif title, restrained source/operation accent, a relationship cue
and one principal contextual action. Full artifact text, provenance and
diagnostics open on demand. Show all real parent paths at rest in Lineage;
hover/focus emphasizes them rather than being their only discovery mechanism.
Dense scenes aggregate explicitly and provide accessible relationship lists.
These lists expose outgoing descendants and associations as well as incoming
parents; showing sources only leaves part of the graph undiscoverable.

Click a card once to inspect at every zoom level without moving the camera;
double-click to toggle its selection without moving the camera. Keep a keyboard/touch-accessible explicit Focus action
in inspection. Cards remain draggable at overview zoom, with a drag distinct
from a click. Pointer activation, keyboard focus and explicit inspection bring
the relevant card to the front. Focus and selection marks follow the visible
card or circular marker, never its hidden layout bounds.

Inspect in one activation; open/choose a contextual move in at most two;
after selecting sources, Connect/Weave is directly available in one activation.
Optional contribution editing is additional by choice. A generic menu is not
card-specific AI planning. Preview affected sources and selected contributions
where the person works, not behind a mandatory diagnostic dashboard.

Author the [shipped mall demo](./SPEC.md#shipped-demo-and-human-judgment) incrementally,
starting with an original populated fixture with independent roots, a multi-parent
child, semantic links, drafts and unknown evidence. At M1 its local interactions
are explicitly fixtures; do not fake persistence, generated output or voice.
The seed landing page and dotted background are identity examples, not the final
workspace layout. An original subtle cartographic terrain may support the field;
it is decorative, not inferred idea quality. Use original artwork.

Mouse, touch and keyboard expose equivalent actions. Preserve visible focus,
readable contrast, sensible touch targets and narrow-screen access. User
acceptance concerns the interactive experience, not a pixel-perfect copy.

## Interaction transitions and overview

Use the [interaction boundary scenarios](./SPEC.md#interaction-boundary-scenarios)
IB01-IB06 during the original proof and after affected changes. Field gestures
must not leave accidental text selection, but reading/editing surfaces support
deliberate selection. Pinching must work over populated content. Ignore only
unintended gesture-generated activation, not subsequent keyboard, assistive or
deliberate pointer activation.

Evaluate controls in screen-space after zoom and Fit, on narrow and short
desktop viewports as well as a large display. When detailed controls would be
too small, offer a readable, touch-usable focus target (aim for at least 44 by
44 CSS pixels on touch) that opens inspection in one activation. Double-click or the explicit Focus
action returns to working detail. Explain how to reveal actions; do not make them appear to have been removed. An overview
can aggregate content without pretending that tiny working controls are usable.

Compare and inspect while retaining orientation to source material. The user
should not have to rebuild the comparison set or remembered graph after closing
a panel. Evaluate modal versus non-modal comparison through the actual journey,
not a universal prohibition. Prepared moves demonstrate source-aware interaction
only; their quality is not evidence of a live contextual planner.

## Liveliness with stable spatial memory

- Selected cards unfold readable detail and reveal relevant threads.
- Dragging gives a slight lift and a clear placement preview; deliberate
  positions stay intact when results arrive.
- Recombination previews each source's contribution before its draft appears.
- Zoom moves between detail, concise title and compact marker with hysteresis.
- Minerva can point briefly at what it discusses without taking over the camera.
- New exploratory drafts arrive near their sources and visibly settle only
  when persisted. Preparing, running, saved and blocked are distinct states.

Animate in response to user attention or a real state transition. Do not move
the map to imply activity, conceal an error behind progress effects, or
celebrate model output as correct. Preserve selected and input-needed objects,
provide keyboard/touch access, and honor reduced motion.

## Sound: quiet, optional, meaningful

Sound starts off. Enable it only through an explicit user choice; never autoplay
on load or make audio necessary to understand an event. Remember local volume/
mute preferences and provide an immediately reachable mute control.

| Event | Optional sound character | Meaning |
|---|---|---|
| Pick up/place a card | Very soft paper movement | A direct manipulation began/ended |
| Create a connection | Short muted string pluck | A connection was acknowledged |
| Keep/save work | Small wooden or bronze click | Persistence acknowledged, not idea quality |
| A batch of drafts arrives | One restrained arrival cue | New material is available |
| Action cannot finish | Distinct low tap with visible explanation | Attention may be needed, not an alarm |

Coalesce rapid events and avoid a sound for every generated card, streamed
token, pan or zoom tick. No ambient music, heartbeat, repeated progress tones,
or "correct idea" fanfare. Prefer original or suitably licensed assets.

Voice takes priority: suppress decorative cues while the microphone/listening
session or spoken reply is active; do not let cue playback feed the microphone
or trigger voice interruption. Keep text/visual state as the authoritative
equivalent. Failed or denied audio playback leaves the interface functional.

This is a product behavior contract. The starter itself has native disclosure
interactions, an icon and styling; it contains no audio engine, model calls,
microphone activation or simulated creative workspace.

## Compact Card inspection

The root atlas Card pane uses the owner's selected manuscript design: title-first
reading, horizontal Content / Connections / History tabs, a persistent relationship
summary and local Explore / Edit actions. Its 540px maximum width, 28px title,
17px reading text and 44px action targets are the approved Card-specific exception
to the instrument type scale above. Connections orders parents, current idea and
children, with associations and shared context separate. Full original content,
source excerpts and generation provenance remain available. Save and Cancel are
explicit; unsaved drafts survive pane dismissal during the session. History reviews
and restores session revisions without replacing earlier source records.
