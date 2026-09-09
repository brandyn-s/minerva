# Expedition field guide comparison

Source: `/var/folders/qy/mxhht8_d30dd1bf61h8k525m0000gn/T/codex-clipboard-edd13055-b91e-4d86-a1af-001aeebb8eda.png`.
Implementation: `/tmp/minerva-expedition-evidence/expedition-setup-desktop.png` and `expedition-setup-mobile.png`.
Viewports: 1440×900 and 390×844; screenshots at 1× CSS density.
Source: 1166×1349 presentation image, with an approximately 874px-wide panel;
comparison normalized to the implemented 560px-wide panel rather than its surrounding mat.
State: food hall selected, supplied example goal entered, three steps selected.

## Findings
No actionable P0/P1/P2 findings remain. Full panel and focused header, source,
textarea, segmented controls and CTA were compared against the supplied image.
Georgia serif and monospace labels preserve the intended hierarchy; green/ivory,
bronze borders and teal source accent match the reference palette.
The existing compass asset is reused to stay consistent with the atlas launcher.
Source summary uses the actual card content, rather than mock copy.
Desktop proportions preserve the reference; narrow layout wraps labels and summary.

## Comparison history
Initial 1280×720 inspection revealed serif labels and a Start button below the fold.
Replaced undefined font variables and added compact spacing below 800px height.
Second in-app inspection showed the full setup and Start button visible.
Desktop and mobile screenshots confirm no horizontal overflow.

## Verification
Focused browser replay passed empty selection, disabled Start, selected source,
three-step selection, three generated cards, completion and New expedition.
Browser page-error collection was empty. Provider responses were mocked.
Full replay stops earlier on an unrelated stale “unkept draft” assertion.

## Follow-up polish
No blocking refinements. This keeps the existing side-panel placement rather than
adding the mock presentation's exterior blank mat.

final result: passed
