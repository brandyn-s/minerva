# Minerva UI system

The compact Expedition direction in [DESIGN](./DESIGN.md) supplies the visual
language. UI ownership lives in `components/ui`, not in individual features.

## Inventory and migration

| Surface | Shared controls | Preserved behavior |
|---|---|---|
| Atlas toolbar and selection dock | Button, Summary, standard icons | View selection, layout history, contextual actions |
| Canvas cards | Button, standard icons | Drag handles, selection and card opening |
| Expedition | PanelHeader, Field, Textarea, SegmentedControl, Button | Source context, bounded steps, stop and history |
| Browse / Read as text | PanelHeader, Input, Button, Summary | Search, selection, disclosure, reader navigation |
| Talk / Voice | PanelHeader, Textarea, icon buttons | Existing voice lifetime and composer handlers |
| Wander / Regroup / inspection / comparison / Guide | Button, Summary, PanelHeader | Existing source and proposal flows |
| Contribution-based Weave | Field, Textarea, Select, Summary, Button, PanelHeader | Exact excerpts, preparation/retry, source inspection, interpretations and variant comparison |
| Editable lenses | PanelHeader, Field, Input, Textarea, Select, Summary, Button | Exact membership, full-group selection, historical inspection, undo and lens switching |
| Lens selection | Field, Input, Summary, Button | Protection, full-corpus population preview, explicit paused application/resume and generation selection context |
| Cross-group Weave | Shared WeaveFields, Field, Select, Summary, Button | Complete candidate choices, exact contribution drafts, bounded submission/retry, result evidence and explicit lens placement |
| Card pane / Voice preferences | Button, Input, Textarea, Select, Summary | Current content editing and voice preference behavior |

All feature-owned raw buttons, inputs, textareas, selects and summaries have
migrated. Functional icons use the single Lucide-backed icon module; the Phosphor
dependency is removed. Existing medallion artwork is retained. The old tooltip component is removed. Existing feature styling is preserved
while shared defaults are introduced beneath it.

## Components

- `Button`: header (shared masthead framing and open/selected states), primary, secondary, quiet, danger, content, card-title and medallion
  variants. Defaults to `type="button"`; forms opt into submit. `busy` adds a
  spinner, aria-busy and disabled behavior. Existing explicit busy handlers remain.
- `IconButton`: requires an accessible label and uses it for the shared tooltip.
  Buttons with extra explanations can provide `title`; it becomes an accessible
  custom tooltip rather than a second native browser tooltip.
- `Summary`: native disclosure semantics with the same focus/type/tooltip rules.
- `Input`, `Textarea`, `Select`, `Field`: shared sizes, typography and focus.
- `SegmentedControl`: labeled native radio group with arrow-key selection.
- `MenuItem`: full-width quiet action. `PanelHeader`: shared title and close action.
- `icons`: one 18px / 1.75-stroke functional family. `actions`: repeated action
  names and symbols. Prefer these names over inventing new labels for the same action.

The `canvas` Button variant is the bounded exception: overview nodes retain their
zoom-dependent geometry and visual identity. Feature-owned layout styles may set
positions, widths, overflow and responsive composition. They may not redefine
shared control paint, type or interaction states.

## Ownership and enforcement

`tokens.css` owns the compact type/spacing/palette. Shared control defaults in
`ui.css` use the lower `minerva-controls` layer. Existing feature styles in
`app/globals.css` retain precedence to preserve established composition and
specialized controls. Move these rules into explicit variants incrementally,
with before/after workflow screenshots; do not blanket-override feature geometry.

ESLint rejects raw controls, direct icon-library imports, new per-feature CSS
imports and inline control paint. TypeScript rejects per-instance icon size/stroke
props and unnamed IconButtons. The guard itself has positive and negative tests.

## Review and verification

Run `npm run dev`, then open `/dev/ui` for the interactive reference gallery.
The route returns not-found in production; it is not a new product workflow.

Run `npm run check` and `npm run test:ui`. CI runs both. UI tests cover desktop and
touch dimensions, keyboard operation, tooltip dismissal, safe form defaults,
segmented control behavior, axe accessibility of the gallery, and actual atlas
panel journeys with model routes intercepted. Screenshots are written beneath
`test-results/ui` for visual inspection.

Portable visual baselines live in `tests/ui/snapshots`: computed type, color,
border, padding, state and minimum target sizes. They catch cross-pane styling
regressions without depending on OS font rasterization. They are not pixel-image
baselines. Review screenshot artifacts for spatial/composition changes as well.
Update approved baselines explicitly with `npm run test:ui -- --update-snapshots`;
never update them merely to silence a failure.

For a new UI need, first choose a shared variant. Add a variant only if it has a
clear reusable role; add it to the gallery and tests in the same change. Review
one gallery plus affected workflows instead of collecting individual fixes.
