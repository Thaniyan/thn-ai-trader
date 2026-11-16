# Inline Decision Center assurance: matched application captures

These are genuine before/after browser screenshots, not design mockups.
Baseline `d53c7368e911c922eafbb555e208ebcc2ced1d92`; same offline provider,
frozen clock `2026-11-11T17:10:00Z`, identical dataset IDs and candidate prices.
The Conditional/Eligible response fixtures are synthetic UI acceptance cases,
not real signals. Eligible requires explicit original risk-engine validation.

| State | Profile | Before | After |
|---|---|---|---|
| wait | 1440px en dark | [Before](before-wait-1440-en-dark.png) | [After](after-wait-1440-en-dark.png) |
| wait | 1440px ar light | [Before](before-wait-1440-ar-light.png) | [After](after-wait-1440-ar-light.png) |
| wait | 390px en dark | [Before](before-wait-390-en-dark.png) | [After](after-wait-390-en-dark.png) |
| wait | 390px ar light | [Before](before-wait-390-ar-light.png) | [After](after-wait-390-ar-light.png) |
| wait | 320px ar light | [Before](before-wait-320-ar-light.png) | [After](after-wait-320-ar-light.png) |
| conditional | 1440px en dark | [Before](before-conditional-1440-en-dark.png) | [After](after-conditional-1440-en-dark.png) |
| conditional | 1440px ar light | [Before](before-conditional-1440-ar-light.png) | [After](after-conditional-1440-ar-light.png) |
| conditional | 390px en dark | [Before](before-conditional-390-en-dark.png) | [After](after-conditional-390-en-dark.png) |
| conditional | 390px ar light | [Before](before-conditional-390-ar-light.png) | [After](after-conditional-390-ar-light.png) |
| conditional | 320px ar light | [Before](before-conditional-320-ar-light.png) | [After](after-conditional-320-ar-light.png) |
| Full conditional setup | 1440px en dark | [Before](before-setup-1440-en-dark.png) | [After](after-setup-1440-en-dark.png) |
| Full conditional setup | 390px ar light | [Before](before-setup-390-ar-light.png) | [After](after-setup-390-ar-light.png) |
| Full conditional setup | 320px ar light | [Before](before-setup-320-ar-light.png) | [After](after-setup-320-ar-light.png) |
| eligible | 1440px en dark | [Before](before-eligible-1440-en-dark.png) | [After](after-eligible-1440-en-dark.png) |
| eligible | 1440px ar light | [Before](before-eligible-1440-ar-light.png) | [After](after-eligible-1440-ar-light.png) |
| eligible | 390px en dark | [Before](before-eligible-390-en-dark.png) | [After](after-eligible-390-en-dark.png) |
| eligible | 390px ar light | [Before](before-eligible-390-ar-light.png) | [After](after-eligible-390-ar-light.png) |
| eligible | 320px ar light | [Before](before-eligible-320-ar-light.png) | [After](after-eligible-320-ar-light.png) |
| Expanded confidence / historical workspace | 1440px en dark | [Before](before-expanded-trust-1440-en-dark.png) | [After](after-expanded-trust-1440-en-dark.png) |
| Expanded confidence / historical workspace | 390px ar light | [Before](before-expanded-trust-390-ar-light.png) | [After](after-expanded-trust-390-ar-light.png) |
| Expanded confidence / historical workspace | 320px ar light | [Before](before-expanded-trust-320-ar-light.png) | [After](after-expanded-trust-320-ar-light.png) |
| Completed fixed-rule evaluation · insufficient sample, not trade validation | 1440px en light | [Before](before-historical-1440-en-light.png) | [After](after-historical-1440-en-light.png) |
| Completed fixed-rule evaluation · insufficient sample, not trade validation | 1440px ar light | [Before](before-historical-1440-ar-light.png) | [After](after-historical-1440-ar-light.png) |

The mobile viewport screenshots show the decision/evidence context and chart opening; the separate setup
captures show the complete genuine price/activation/invalidation panel below it.
The original fixed-rule evaluator and full trust review remain in the single
progressive research workspace. Retained engine quotations remain English with
localized Arabic labels; no source evidence is invented.

[Geometry](geometry.json) includes all 34 matched layout/state profiles and
their actual chart/setup boxes and visible chart pixels in a 1000px viewport.
[Manifest](screenshots.json) records hashes of every PNG.
[Verification](verification.json) separates local tests from hosted/interactive acceptance.

## Integrated workflow and acceptance boundary

[Owner requirements](https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6918001632).
Before is the actual upstream confidence candidate d53c736, not a design mockup.
Five concurrent upstream confidence commits and every added Heritage assertion are preserved. Their widget is consolidated into the same original confluence owner, not rendered in parallel. The original confluence widget is moved beneath the decision; no second score or evaluator exists. Test opens the original controls without sending an evaluation request or changing assumptions. View test opens the original report; Escape returns focus. A running test remains inspectable while its original execution guard prevents duplicate runs.

Historical status distinguishes untested/running/stale/failed/complete. Completed fractions count authoritative requirements met, not winning trades. Dirty/failed/running results do not display a current count. The visible boundary states calibrated win probability is unavailable and fixed-rule tests do not validate this trade. Source reliability/freshness remains separate from candidate/risk gates.

Desktop reuses the hero for decision assurance and instrument controls; the hypothetical ticket stays beside the native chart. Mobile keeps decision assurance immediately before the chart. At320px the original source switch and Focus chart share a44px-control row; long Eligible and status text remain readable. Native full-review feedback remains intact and uses normal inline flow rather than forced caption/message lines.

The legacy source audit and original results remain available below the chart for existing workflows, including their original navigation. The main confluence is shown once. Retained English engine quotations keep Arabic controls. Existing financial/numerical engines, Library, schemas, dependencies and Vercel configuration are unchanged.

[Completed inline states](inline-completed.json) adds three genuine after-only detail screenshots produced by the original evaluator. These are not reconstructed before results. All captures use disclosed offline fixtures rather than live signals. Interactive exact-Preview, live-source and independent TradingView feed acceptance remain separate from regression/deployment metadata.

## Measured geometry and trade-offs

Values are actual canvas geometry in a1000px viewport. Making trust/testing immediately visible uses some desktop vertical space. Mobile measurements include the complete state rather than hiding warnings to hit a threshold. All42 original suites remain unchanged and the additional suite brings the gate to43.

| State/profile | Chart top before → after | Visible chart pixels before → after |
|---|---|---|
| wait · 1440px en dark | 465.7 → 615.2 | 534.3 → 384.8 |
| wait · 390px ar light | 787.7 → 685.2 | 212.3 → 314.8 |
| wait · 320px ar light | 875.9 → 746.9 | 124.1 → 253.1 |
| eligible · 1440px en dark | 465.7 → 602.2 | 534.3 → 397.8 |
| eligible · 390px ar light | 760.5 → 679.5 | 239.5 → 320.5 |
| eligible · 320px ar light | 848.7 → 736.4 | 151.3 → 263.6 |
