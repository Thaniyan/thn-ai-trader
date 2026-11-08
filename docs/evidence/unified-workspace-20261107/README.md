# Unified workstation — rendered before/after review

Actual local screenshots with synthetic provider fixtures; **not Production or live-market evidence**. Before: main `a752fa4f533b0376c8d60eab1a450c5fbf9932f9`. After: the tested runtime in this candidate. All viewports are 1000px high. Click an image for its original size.

[Full 216-profile measurements](visual-matrix.json) · [Verification results](verification.json) · [All 33 browser-suite results](browser-gate.txt)

The gallery selects ten pairs. The full matrix covers all nine views, 1440/768/390px widths, English/Arabic and dark/light themes with no horizontal page overflow or page errors.

## Dashboard workspace · 1440px · EN · dark

| Before | After |
| --- | --- |
| ![Before Dashboard workspace 1440px](before-dashboard-1440-en-dark.png) | ![After Dashboard workspace 1440px](after-dashboard-1440-en-dark.png) |

## Dashboard workspace · 768px · EN · dark

| Before | After |
| --- | --- |
| ![Before Dashboard workspace 768px](before-dashboard-768-en-dark.png) | ![After Dashboard workspace 768px](after-dashboard-768-en-dark.png) |

## Dashboard workspace · 390px · AR · light

| Before | After |
| --- | --- |
| ![Before Dashboard workspace 390px](before-dashboard-390-ar-light.png) | ![After Dashboard workspace 390px](after-dashboard-390-ar-light.png) |

## AI Research · 1440px · EN · dark

| Before | After |
| --- | --- |
| ![Before AI Research 1440px](before-ai-1440-en-dark.png) | ![After AI Research 1440px](after-ai-1440-en-dark.png) |

## AI Research · 768px · EN · dark

| Before | After |
| --- | --- |
| ![Before AI Research 768px](before-ai-768-en-dark.png) | ![After AI Research 768px](after-ai-768-en-dark.png) |

## AI Research · 390px · AR · light

| Before | After |
| --- | --- |
| ![Before AI Research 390px](before-ai-390-ar-light.png) | ![After AI Research 390px](after-ai-390-ar-light.png) |

## Risk Desk · 1440px · EN · dark

| Before | After |
| --- | --- |
| ![Before Risk Desk 1440px](before-risk-1440-en-dark.png) | ![After Risk Desk 1440px](after-risk-1440-en-dark.png) |

## Risk Desk · 390px · AR · light

| Before | After |
| --- | --- |
| ![Before Risk Desk 390px](before-risk-390-ar-light.png) | ![After Risk Desk 390px](after-risk-390-ar-light.png) |

## Research Library · 1440px · EN · dark

| Before | After |
| --- | --- |
| ![Before Research Library 1440px](before-journal-1440-en-dark.png) | ![After Research Library 1440px](after-journal-1440-en-dark.png) |

## Research Library · 390px · AR · light

| Before | After |
| --- | --- |
| ![Before Research Library 390px](before-journal-390-ar-light.png) | ![After Research Library 390px](after-journal-390-ar-light.png) |

## Measured default layouts

English/dark; page height includes scrollable content. Chart start is measured from the viewport top at scroll zero.

| View · width | Page height before → after | Chart start before → after | Canvas width before → after |
| --- | --- | --- | --- |
| Dashboard workspace · 1440px | 2639 → 2063px | 490.9px → 514.9px | 846px → 810px |
| Dashboard workspace · 768px | 3873 → 3395px | 692.2px → 695.3px | 658px → 658px |
| Dashboard workspace · 390px | 4738 → 3926px | 687.5px → 695.9px | 312px → 312px |
| AI Research · 1440px | 1957 → 1982px | — | — |
| AI Research · 390px | 2890 → 2940px | — | — |
| Risk Desk · 1440px | 1457 → 1775px | — | — |
| Risk Desk · 390px | 2633 → 2642px | — | — |

Dashboard pages are shorter, while the mobile chart starts about 8px lower to retain recommendation context. Desktop canvas width changes from 846px to 810px for the integrated 300px recommendation rail, preserving its original >800px contract. AI Research height is broadly unchanged. Risk Desk desktop is taller because review/save readiness and costs share the rail; these inputs remain available. Detailed evidence is accessible through native disclosures.

Actual model inference and interactive Production acceptance remain outstanding; see the implementation report for access restrictions.
