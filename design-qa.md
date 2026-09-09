# Selected idea preview QA

Source: /var/folders/qy/mxhht8_d30dd1bf61h8k525m0000gn/T/codex-clipboard-77dde509-a18f-44b7-9966-801bd296dda6.png
Implementation screenshots: /tmp/minerva-idea-preview-desktop.png and /tmp/minerva-idea-preview-mobile.png

Reference: 1456 × 1081 raster concept; panel normalized to 360 CSS pixels wide within the actual atlas. Desktop viewport 1280 × 720; mobile viewport 390 × 844, screenshots at 1 pixel per CSS pixel. Compare panel proportions and hierarchy rather than surrounding concept whitespace. Actual node summary is preserved rather than replacing it with mock copy.

State: food hall selected, Connections collapsed. Full atlas and focused panel inspected against supplied reference. Serif title and summary, dark primary action, secondary centering action, compact close icon, divider and disclosure match the target hierarchy. Phosphor icons replace the mock symbols.

Iteration: initial mobile panel overlapped the Talk launcher. Raised its bottom offset to 230px; final mobile screenshot shows separation from Talk and selection actions. No remaining P0/P1/P2 findings.

Interactions verified in the in-app browser: select food hall, Open card opens its detail, close detail, Center on canvas focuses the node, expand/collapse Connections, empty Parents state, select Children, follow Repair connection updates preview and collapses disclosure. Console error log empty.

final result: passed

Compact refinement: reduced title to 23px, summary to 16px, panel padding to 16px and action height to 36px. Expanded Repair preview visually checked after refinement; lint passed.
