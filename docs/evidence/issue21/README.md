# Issue 21 rendered application evidence

Candidate: existing PR [20](https://github.com/Thaniyan/thn-ai-trader/pull/20), evolved for [Issue 21](https://github.com/Thaniyan/thn-ai-trader/issues/21). No main integration or Production deployment.

These are real Playwright captures of the production package, not mockups. The before checkout is the previously verified PR head `93dcbaf50c0a52d8444b34c6c1ccdd08796d2dd1`. Both versions use the same original offline provider, EURUSD/1h, fixed analytical clock `2026-11-10T15:00:00Z`, dataset `5d44114bead5a3ab796eb78d8fbe5d71229243c4766541712031dd8cacffe669`, and visible bar windows (90 desktop / 45 mobile). The independent decorative header clock remains real time.

## Paired opening viewports

| Profile | Before | Candidate |
| --- | --- | --- |
| 1440×1000 · English · dark | [Before](before/viewport-1440-en-dark.png) | [After](after/viewport-1440-en-dark.png) |
| 390×1000 · Arabic RTL · light | [Before](before/viewport-390-ar-light.png) | [After](after/viewport-390-ar-light.png) |

Full-page captures and exact measurements accompany both sets.

| Same-data measurement | Before | Candidate |
| --- | ---: | ---: |
| Desktop chart width | 810px | 832px |
| Desktop chart top | 536.89px | 530.23px |
| Arabic mobile chart width | 312px | 312px |
| Arabic mobile chart top | 697.25px | 745.72px |

The mobile chart starts about 48px lower because confidence now has its own visible band. It still meets the preserved opening chart coverage gate; this is an explicit trade-off for owner review, not a claim that every visibility metric improved. The original provider fixture is deliberately neutral: WAIT is correct, not a missing recommendation. Supplemental conditional-setup captures use explicitly controlled analytical responses to verify exact price copying and source-bound annotations; they do not demonstrate real trading signal quality or model generation.

## What to review

- One original chart with Analysis/TradingView modes, alongside the main assessment and hypothetical setup on desktop.
- A narrow labeled sidebar and compact selector; supported search, categories and recents are available from the selector search button.
- One-page conditional evidence → explicit original-engine risk planning → original-schema research saving. No automatic capital, leverage, position size or order.
- Mobile puts the original confidence summary above the chart. This preserves confidence access but trades some opening chart area for that summary; the setup and detailed evidence follow the chart.
- Native expandable reasoning, cited methodology, source-bar inspection, notes and historical-validation access remain available. Missing or stale evidence cannot yield a current score or setup.

These images and offline tests are local candidate evidence, not interactive Vercel Preview or Production acceptance. Exact final verification is recorded in `verification.json`; owner acceptance of the matching Preview and financial display policy remains required.

## Conditional scenario display fixtures

These supplemental screenshots use controlled positive analytical responses to
exercise the actual application; prices and scores are test data, not real signals.

| Profile | English | Arabic RTL |
| --- | --- | --- |
| 1440 · dark | [EN](conditional-fixtures/command-1440-en-dark.png) | [AR](conditional-fixtures/command-1440-ar-dark.png) |
| 1440 · light | [EN](conditional-fixtures/command-1440-en-light.png) | [AR](conditional-fixtures/command-1440-ar-light.png) |
| 390 · dark | [EN](conditional-fixtures/command-390-en-dark.png) | [AR](conditional-fixtures/command-390-ar-dark.png) |
| 390 · light | [EN](conditional-fixtures/command-390-en-light.png) | [AR](conditional-fixtures/command-390-ar-light.png) |

The original first complete gate's [transport failure log](consistency-transport-failure.txt)
and [diagnostic evidence](transport-diagnostic.json) are retained. Its 35 passes
and one upstream interception error are not substituted for a complete passing gate.
