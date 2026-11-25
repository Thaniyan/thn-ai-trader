# Day6 eligible Trade Ticket — actual application evidence

All observations here are **controlled offline UI acceptance**, not live-provider eligibility, verified signals, model inference or profitability. Analysis direction/consensus, available-frame trends, brief completeness/conflict flags and scenario readiness are controlled. Scenario trigger is the fixture selected close and invalidation is the original analysis stop; these scenario controls are not claimed as original brief conclusions. Entry/SL/targets are unmodified values computed by the existing engine. Risk eligibility comes from the original server planner. Original LIMIT decisions are retained explicitly in the receipt; they are not represented as genuine immediate-entry signals.

Baseline: `c3f9942b9c987012502700a905633dd3ea42d5d0`. Final source is linked through [runtime fingerprints](runtime-source.json), the final Git commit and exact-head CI. No accepted interface redesign; engines, policy, backend and dependencies unchanged. Only target-cell inline padding changes to fit retained decimals under the diagnostic font; no accepted layout redesign.

## Owner acceptance status

| Area | Result | Evidence |
| --- | --- | --- |
| Earlier five owner walkthrough checks | PASS (owner accepted) | Preserved accepted design/layout |
| Eligible BUY + SELL Ticket UI/integrity | PASS, controlled fixtures | 48 language/theme/width/mode profiles; exact retained values and authoritative risk validation |
| Negative/context/currency/contract/provider safeguards | PASS, controlled fixtures | 14 negative cases, partial targets, held context response, no substitute prices |
| Real provider-qualified eligible Ticket on Preview | NOT VERIFIED | Workspace proxy denies CONNECT before TLS; no origin/provider observation |
| TradingView independent live candle feed | NOT VERIFIED by these tests | Protocol stub verifies mode ownership only; owner accepted mode switching separately |

## Readable retained prices — demonstrated P1 fixed

Original engine values `1.100029` and `1.100034` were both displayed as `1.10003`. The original engine and risk plan were unchanged and eligible for the controlled hypothesis. The Ticket now retains all six persisted decimal places; missing/disqualified values do not acquire prices. Quote/axis formatting outside the Ticket remains unchanged.

The first complete native 46-suite run passed, but the additional actual-DejaVu diagnostic caught target-price wrapping. Only target-cell inline padding is reduced from 8px to 2px; font size, grid, gaps and 44px controls are retained. [Before Ticket](before-font-fit.png), [after Ticket](after-font-fit.png) and [pre-correction range geometry](before-font-fit.json) and [corrected geometry](after-font-fit.json) document the blocker. The final complete gate was rerun and passed after this correction.

[Before screenshot](before-precision.png) · [raw before evidence](before-precision.json) · [matching EN corrected render](after-precision.png) · [raw corrected evidence](after-precision.json) · [AR corrected retained precision](retained-precision.png). Different fixture process timestamps are not the same market context; the numerical engine outputs are explicitly recorded and unchanged.

## Qualified Ticket matrix

Each opening capture below pairs EN/dark and AR/light. Tests additionally cover EN/light and AR/dark. All profiles are 1000px high; native scrolling/direct Trade setup access is tested on phones. No claim that the entire chart and Ticket fit in one phone viewport. TradingView pictures contain an explicitly labelled protocol-only frame, not fabricated candles.

| Side | Width | THN EN | THN AR | TradingView mode EN | TradingView mode AR |
| --- | --- | --- | --- | --- | --- |
| BUY | 1440 | [EN](buy-1440-en-dark-research.png) | [AR](buy-1440-ar-light-research.png) | [EN protocol](buy-1440-en-dark-manual.png) | [AR protocol](buy-1440-ar-light-manual.png) |
| BUY | 1024 | [EN](buy-1024-en-dark-research.png) | [AR](buy-1024-ar-light-research.png) | [EN protocol](buy-1024-en-dark-manual.png) | [AR protocol](buy-1024-ar-light-manual.png) |
| BUY | 390 | [EN](buy-390-en-dark-research.png) | [AR](buy-390-ar-light-research.png) | [EN protocol](buy-390-en-dark-manual.png) | [AR protocol](buy-390-ar-light-manual.png) |
| SELL | 1440 | [EN](sell-1440-en-dark-research.png) | [AR](sell-1440-ar-light-research.png) | [EN protocol](sell-1440-en-dark-manual.png) | [AR protocol](sell-1440-ar-light-manual.png) |
| SELL | 1024 | [EN](sell-1024-en-dark-research.png) | [AR](sell-1024-ar-light-research.png) | [EN protocol](sell-1024-en-dark-manual.png) | [AR protocol](sell-1024-ar-light-manual.png) |
| SELL | 390 | [EN](sell-390-en-dark-research.png) | [AR](sell-390-ar-light-research.png) | [EN protocol](sell-390-en-dark-manual.png) | [AR protocol](sell-390-ar-light-manual.png) |

Phone Ticket close-up: [BUY en research](buy-390-en-dark-research-ticket.png), [BUY en manual](buy-390-en-dark-manual-ticket.png), [BUY ar research](buy-390-ar-light-research-ticket.png), [BUY ar manual](buy-390-ar-light-manual-ticket.png), [SELL en research](sell-390-en-dark-research-ticket.png), [SELL en manual](sell-390-en-dark-manual-ticket.png), [SELL ar research](sell-390-ar-light-research-ticket.png), [SELL ar manual](sell-390-ar-light-manual-ticket.png).

## WAIT — no qualifying setup

[1440 en](wait-1440-en-dark.png), [1440 ar](wait-1440-ar-light.png), [1024 en](wait-1024-en-dark.png), [1024 ar](wait-1024-ar-light.png), [390 en](wait-390-en-dark.png), [390 ar](wait-390-ar-light.png). No entry/stop/target is synthesized.

## Numeric provenance

Display strings use locale-aware six-decimal retained-reference formatting; raw candidates and Risk Desk inputs remain identical to the original engine values. Conditions and Ticket references use the same formatter. The accepted native chart uses its existing quote/axis rounding; actual coordinates remain the original engine coordinates.

| Controlled side | Instrument | Original engine decision (before controlled admission) | Raw entry | Raw stop | Raw targets |
| --- | --- | --- | --- | --- | --- |
| BUY | GBPUSD | BUY LIMIT | 1.078733 | 1.075192 | 1.084398, 1.08723, 1.089355 |
| SELL | EURUSD | SELL LIMIT | 1.121267 | 1.124808 | 1.115602, 1.11277, 1.110645 |

The same 48-profile matrix additionally passed under the process-scoped DejaVu diagnostic, with actual price fonts asserted via Chromium CDP on every profile: [full font receipt](dejavu-acceptance.json). This diagnostic changes only the launched QA process font selection, not application or environment configuration.

Full receipt: [actual displayed strings, raw values, provenance, geometry and risk results](acceptance.json). [Engine/policy/original-test integrity](integrity.json). [Baseline Preview access diagnostic](live-access.json). [Final verification](verification.json).

## Reproduce

Build the unchanged production package, then run with the existing pinned Chromium/axe tooling:

```bash
npm run package:production
CHROMIUM_PATH=/path/to/pinned/chromium AXE_PATH=/path/to/axe.min.js python3 tests/browser_day6.py
```

The suite starts and cleans up its own loopback fixture server. No credentials, external providers/models, financial execution, dependency changes or deployment are used. All 45 prior suites remain mandatory; Day6 adds the 46th.
