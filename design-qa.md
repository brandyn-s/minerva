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

---

# Selected idea preview QA

Source: /var/folders/qy/mxhht8_d30dd1bf61h8k525m0000gn/T/codex-clipboard-77dde509-a18f-44b7-9966-801bd296dda6.png
Implementation screenshots: /tmp/minerva-idea-preview-desktop.png and /tmp/minerva-idea-preview-mobile.png

Reference: 1456 × 1081 raster concept; panel normalized to 360 CSS pixels wide within the actual atlas. Desktop viewport 1280 × 720; mobile viewport 390 × 844, screenshots at 1 pixel per CSS pixel. Compare panel proportions and hierarchy rather than surrounding concept whitespace. Actual node summary is preserved rather than replacing it with mock copy.

State: food hall selected, Connections collapsed. Full atlas and focused panel inspected against supplied reference. Serif title and summary, dark primary action, secondary centering action, compact close icon, divider and disclosure match the target hierarchy. Phosphor icons replace the mock symbols.

Iteration: initial mobile panel overlapped the Talk launcher. Raised its bottom offset to 230px; final mobile screenshot shows separation from Talk and selection actions. No remaining P0/P1/P2 findings.

Interactions verified in the in-app browser: select food hall, Open card opens its detail, close detail, Center on canvas focuses the node, expand/collapse Connections, empty Parents state, select Children, follow Repair connection updates preview and collapses disclosure. Console error log empty.

final result: passed

Compact refinement: reduced title to 23px, summary to 16px, panel padding to 16px and action height to 36px. Expanded Repair preview visually checked after refinement; lint passed.
