# v7.5 visual and workflow evidence

Original Chromium captures, not edited images. The before application is exact canonical v7.4 commit `9fa6b69d5b36a0cdcb99e627674fe6d4e2cfb22a`, recovered by source archive into an isolated local fixture workspace. Its deterministic production package reproduces manifest `1ccae1e5ebaa0445dd9ce82ef07ddf44659d09af8c46293ab5e3d96d7f36bd4e`.

Both sides use explicit synthetic provider fixtures. The TradingView iframe uses the deliberately labelled toolbar-only protocol fixture: **these images do not establish external market candle availability**. No real customer/account data or live financial execution is used.

## Audited trust workflows

| Workflow | Before v7.4 | After v7.5 |
| --- | --- | --- |
| Independent manual chart / pinned evidence / compact recovery | [Before](v75-evidence/audit-journeys/before-independent-chart.png) | [After](v75-evidence/audit-journeys/after-independent-chart.png) |
| EURUSD analysis retained while BTCUSDT becomes selected | [Before](v75-evidence/audit-journeys/before-historical-context.png) | [After](v75-evidence/audit-journeys/after-historical-context.png) |
| USD proxy source in selected crypto research | [Before](v75-evidence/audit-journeys/before-proxy-evidence.png) | [After](v75-evidence/audit-journeys/after-proxy-evidence.png) |
| Valid inputs but total exposure above the $50 budget | [Before](v75-evidence/audit-journeys/before-risk-budget.png) | [After](v75-evidence/audit-journeys/after-risk-budget.png) |
| Optional cost-inclusive sizing | Not previously offered | [After: $49.95 total exposure](v75-evidence/audit-journeys/after-cost-inclusive.png) |

These journeys were exercised through real local application HTTP endpoints and actual original controls. The legacy disclosure is explicitly opened for the retained-context screenshot. Earlier in-progress captures remain outside Git under `/workspace/work/v75-evidence`; the committed journey set is the reviewed presentation.

## Nine-view matrix

Each view has four exact before/after profiles: desktop English dark/light (1440), Arabic light mobile (390), and English dark tablet (768). The complete 36-before + 36-after set is in `v75-evidence/before` and `v75-evidence/after`.

| View | Desktop before | Desktop after | Arabic mobile after |
| --- | --- | --- | --- |
| Dashboard | [Before](v75-evidence/before/dashboard-1440-en-dark.png) | [After](v75-evidence/after/dashboard-1440-en-dark.png) | [AR](v75-evidence/after/dashboard-390-ar-light.png) |
| Markets | [Before](v75-evidence/before/markets-1440-en-dark.png) | [After](v75-evidence/after/markets-1440-en-dark.png) | [AR](v75-evidence/after/markets-390-ar-light.png) |
| Terminal | [Before](v75-evidence/before/trading-1440-en-dark.png) | [After](v75-evidence/after/trading-1440-en-dark.png) | [AR](v75-evidence/after/trading-390-ar-light.png) |
| Intelligence | [Before](v75-evidence/before/ai-1440-en-dark.png) | [After](v75-evidence/after/ai-1440-en-dark.png) | [AR](v75-evidence/after/ai-390-ar-light.png) |
| Risk | [Before](v75-evidence/before/risk-1440-en-dark.png) | [After](v75-evidence/after/risk-1440-en-dark.png) | [AR](v75-evidence/after/risk-390-ar-light.png) |
| Portfolio | [Before](v75-evidence/before/portfolio-1440-en-dark.png) | [After](v75-evidence/after/portfolio-1440-en-dark.png) | [AR](v75-evidence/after/portfolio-390-ar-light.png) |
| Journal | [Before](v75-evidence/before/journal-1440-en-dark.png) | [After](v75-evidence/after/journal-1440-en-dark.png) | [AR](v75-evidence/after/journal-390-ar-light.png) |
| Brokers | [Before](v75-evidence/before/brokers-1440-en-dark.png) | [After](v75-evidence/after/brokers-1440-en-dark.png) | [AR](v75-evidence/after/brokers-390-ar-light.png) |
| Settings | [Before](v75-evidence/before/settings-1440-en-dark.png) | [After](v75-evidence/after/settings-1440-en-dark.png) | [AR](v75-evidence/after/settings-390-ar-light.png) |

The additional focused captures show populated risk, evidence and historical record journeys in English/Arabic at desktop/mobile widths. They complement the default-view matrix and are not substitutes for Production browser acceptance.

`screenshots-sha256.json` inventories every original committed PNG. `validation.json` records final local results; `consistency.json` includes the genuine delayed-response ordering evidence (old risk input 0.5%, new input 0.7%, retained 0.7%), nine routes, 16 focused axe scans and zero page errors.
