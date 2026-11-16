# Actual A+ application: paired acceptance captures

These are genuine before/after browser screenshots, not design mockups.
Baseline `623c888d1cd788bfc23cfa7dfb11619aaa9a562f`; same offline provider,
frozen clock `2026-11-11T17:10:00Z`, identical dataset IDs and candidate prices.
The Conditional/Eligible response fixtures are synthetic UI acceptance cases,
not real signals. Eligible requires explicit original risk-engine validation.

| State | Profile | Before | After |
|---|---|---|---|
| wait | 1440px en dark | [Before](before-wait-1440-en-dark.png) | [After](after-wait-1440-en-dark.png) |
| wait | 1440px ar light | [Before](before-wait-1440-ar-light.png) | [After](after-wait-1440-ar-light.png) |
| wait | 390px ar light | [Before](before-wait-390-ar-light.png) | [After](after-wait-390-ar-light.png) |
| wait | 320px ar light | [Before](before-wait-320-ar-light.png) | [After](after-wait-320-ar-light.png) |
| conditional | 1440px en dark | [Before](before-conditional-1440-en-dark.png) | [After](after-conditional-1440-en-dark.png) |
| conditional | 1440px ar light | [Before](before-conditional-1440-ar-light.png) | [After](after-conditional-1440-ar-light.png) |
| conditional | 390px ar light | [Before](before-conditional-390-ar-light.png) | [After](after-conditional-390-ar-light.png) |
| conditional | 320px ar light | [Before](before-conditional-320-ar-light.png) | [After](after-conditional-320-ar-light.png) |
| Full conditional setup | 1440px en dark | [Before](before-setup-1440-en-dark.png) | [After](after-setup-1440-en-dark.png) |
| Full conditional setup | 390px ar light | [Before](before-setup-390-ar-light.png) | [After](after-setup-390-ar-light.png) |
| Full conditional setup | 320px ar light | [Before](before-setup-320-ar-light.png) | [After](after-setup-320-ar-light.png) |
| eligible | 1440px en dark | [Before](before-eligible-1440-en-dark.png) | [After](after-eligible-1440-en-dark.png) |
| eligible | 1440px ar light | [Before](before-eligible-1440-ar-light.png) | [After](after-eligible-1440-ar-light.png) |
| eligible | 390px ar light | [Before](before-eligible-390-ar-light.png) | [After](after-eligible-390-ar-light.png) |
| eligible | 320px ar light | [Before](before-eligible-320-ar-light.png) | [After](after-eligible-320-ar-light.png) |
| Expanded confidence / historical workspace | 1440px en dark | [Before](before-expanded-trust-1440-en-dark.png) | [After](after-expanded-trust-1440-en-dark.png) |
| Expanded confidence / historical workspace | 390px ar light | [Before](before-expanded-trust-390-ar-light.png) | [After](after-expanded-trust-390-ar-light.png) |
| Expanded confidence / historical workspace | 320px ar light | [Before](before-expanded-trust-320-ar-light.png) | [After](after-expanded-trust-320-ar-light.png) |
| Completed fixed-rule evaluation · insufficient sample, not trade validation | 1440px en light | [Before](before-historical-1440-en-light.png) | [After](after-historical-1440-en-light.png) |
| Completed fixed-rule evaluation · insufficient sample, not trade validation | 1440px ar light | [Before](before-historical-1440-ar-light.png) | [After](after-historical-1440-ar-light.png) |

The mobile viewport screenshots show the chart-led opening; the separate setup
captures show the complete genuine price/activation/invalidation panel below it.
The original fixed-rule evaluator and full trust review remain in the single
progressive research workspace. Retained engine quotations remain English with
localized Arabic labels; no source evidence is invented.

[Geometry](geometry.json) includes all 34 matched layout/state profiles and
their actual chart/setup boxes and visible chart pixels in a 1000px viewport.
[Manifest](screenshots.json) records hashes of every PNG.
[Verification](verification.json) separates local tests from hosted/interactive acceptance.

## Measured layout

Matched WAIT fixtures, 1000px viewport height.

| Profile | Chart top before → after | Visible chart pixels before → after |
|---|---|---|
| 1440px en | 427.2 → 493.9 | 560.0 → 506.1 |
| 768px en | 684.7 → 680.0 | 315.3 → 320.1 |
| 390px en | 668.4 → 700.0 | 331.6 → 300.0 |
| 390px ar | 667.8 → 671.2 | 332.2 → 328.8 |
| 320px ar | 842.0 → 773.4 | 158.0 → 226.6 |

Desktop provides a wider, complete setup panel beside the 560px native chart.
Tablet uses 480px candles; phones use the approved 330px chart. The compact
original heuristic score stays above the chart on tablet/phones. Drawing tools
remain directly below the phone chart. At 320px the primary action row scrolls;
no control is removed. These are layout measurements, not trading performance.
