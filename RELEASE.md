# THN AI Trader 6.4 — integrated intelligence release candidate

Base: original `Thaniyan/thn-ai-trader` main, `5a318cf90056ccff029ff33c48ff157aabb294f7`. Implementation, tests and local commit only. Production push requires approval of the resulting exact commit.

## Visible and functional changes

- Dashboard selected-market briefing with observed closed-candle OHLC/time, provider identity, timeframe completeness/conflicts, observed ATR, matching research-quality label, recent saved reports and direct chart/research/risk navigation. Existing curated watchlist and provider coverage remain.
- Explainable Intelligence brief from independent 15m/1h/daily observations. Every directional claim contains source, provider symbol, dataset SHA-256, observation time, EMA/RSI/ATR inputs and documented rule. It retains opposing evidence, observed ranges, causal structure events, bullish/bearish/wait hypotheses and explicit invalidation/uncertainty. No news, sentiment, economic events or model narrative is invented.
- The shared context adds provider symbol, data time, analysis version, selected-frame levels, matched evaluation period and research quality without metadata-triggered chart reloads. New requests have identity/selection guards and bounded timeouts. Outage/refresh clears current intelligence rather than presenting an old snapshot as fresh.
- Research-quality `6.4-Q1` interprets the existing evaluator without rerunning or changing numerical strategies. Ten conservative checks cover both windows, costs/parameters, fold consistency/sample counts, concentrations, history gaps and undefined metrics. Exact criteria and four label rules are documented in README. Labels never represent a probability or significance test.
- Risk Desk now uses the existing authoritative risk engine through a bounded hypothetical-plan endpoint. Up to three independent target outcomes, lot rounding, contract/currency rules, explicit friction, cost-adjusted stop risk and margin are shown. Four local plans can be compared; current plan levels overlay the preserved candle chart. Input/selection changes invalidate old results; delayed plan responses cannot overwrite newer assumptions.
- Eight complete local research reports combine computed brief, matching historical results and quality diagnostics, a matching risk plan, and separately labeled user thesis/notes/conclusion. JSON import/export and standalone printable HTML require no dependencies. Unknown nested keys are stripped; schema, nesting, arrays, finite numbers, hashes, strings, file size and record count are bounded. Imports are explicitly unverified and never become computational inputs. HTML escapes user content and blocks scripts/network access.
- EN/AR labels, RTL, keyboard operation, responsive tables and dark/light themes cover the connected workflow. Original nine sections, drawings, indicator/SMC layers, local research notes/experiments and financial engine remain. Original single-snapshot technical panels are retained under progressive disclosure with an explicit heuristic-score limitation.

## Verification

- 71 unit/integration tests pass, 0 fail: deterministic claims and provenance, stale/unavailable/conflicting evidence, all quality labels and negative cases, long/short numerical regressions, USDJPY stop-risk/margin conversion, directional/cost/contract limits, imports/XSS/active-content defenses, actual public API behavior and existing financial-operation blocks.
- Build and lint pass. Both are syntax checks, as appropriate to the original unbundled Node/HTML/JS stack.
- Chromium genuine-provider acceptance: 2,000 hourly Yahoo Finance observations, independently observed 15m/hourly/daily evidence, chart navigation/zoom/keyboard inspection/drawings/undo, matched evaluation, scenario transfer, server risk plans, chart overlays, local comparisons, JSON/HTML export, safe/unverified import, persistence/reload, repeated symbol/timeframe changes, delayed old brief and plan response rejection, and explicit provider outage.
- All nine sections checked in EN and AR at 390×844: 18 layout checks, no page overflow. 22 axe scans (nine views in each language plus four changed views in Arabic light mode): zero violations. No browser JavaScript errors. Automated checks are not comprehensive accessibility certification.
- Existing v6.3 browser research/experiment/export/journal acceptance and EN/AR outage/USDJPY risk regressions pass. Unit/provider fixtures stay test-only; genuine browser observations are not substituted with synthetic prices.
- No actual credential signatures or tracked runtime financial records were introduced. A private-key marker in the rejection test is deliberately invalid test input. Existing Git/deployment exclusions and hosted financial guards remain. Production dependencies, hosting settings and lockfile are unchanged. No paid resources, background workers, accounts, environments or projects were created. No generative-model call is added.

Runnable checks: `npm test`, `npm run build`, `npm run lint`, `tests/browser_decision.py`, `tests/browser_quality.py`, `tests/browser_research_outage.py`. Browser prerequisites are in README. Captures/results remain ignored under `work/v64-*`.

## Limits

Finite provider coverage, history revisions, missing rows/session gaps, futures proxies and unadjusted corporate actions still limit inference. Recency is interval-aware, not a verified exchange-session calendar. Structure detection is heuristic. Brief refresh is on selection or explicit request, not continuous streaming. News, verified economic calendar, sentiment and generative narrative remain unavailable. No new model/budget is configured.

Holdout reuse permits manual overfitting. No statistical significance, future win probability or optimization is claimed. Fixed-parameter fold results reset capital and do not form one continuous portfolio. Positive criteria are historical observations only; gaps and undefined metrics prevent the strongest label. No branch of the quality engine overrides risk validation.

Planning capital is hypothetical. Stops do not guarantee execution, and gap losses can exceed nominal stop budgets. Friction estimates use entry notional and omit financing, borrowing, actual short availability and liquidation. Targets are alternative full-position outcomes, not partial-exit schedules. Native USDT is not treated as USD. Broker terms require independent verification.

Reports/notes/plans are unencrypted browser-local records, bounded to eight reports/four plans and 400 KB report storage/import. Clearing storage loses them. Do not enter secrets in free text. Imported reports cannot be authenticated or treated as verified performance. Attached quantitative/plan evidence requires matching instrument, timeframe and dataset; otherwise the report explicitly lacks it. Existing notes and experiments remain separate and preserved.

These are local candidate verification results, not verification of unreleased Production functionality. Optional Production browser access was not used as a development prerequisite.

## Safe release references

Original website: https://thn-ai-trader.vercel.app/

Original existing Vercel project: `prj_IFLYEB85CRNBjDEGO69xcW4O55Wd`, team `team_MOU3JztK2qXaXBQNFYDx1dX6`.

Retained v6.3 Production/rollback deployment: `dpl_59isH5V8B4rgEi1CqBsBFp7zxZun`, commit `5a318cf90056ccff029ff33c48ff157aabb294f7`. Prior v6.2 reference remains `dpl_GnHaevGxBWmUQayXnTBerznPnb7w`.

After exact-commit approval, fetch original main, require clean work and verified ancestry, push the approved commit normally to main, monitor the existing Production deployment and verify the original domain where accessible. Stop on rejection or critical failure. If needed, restore the retained deployment via Vercel's safe deployment promotion/rollback; never rewrite Git history. Account for Vercel rollback potentially pausing subsequent automatic domain assignments. Do not change hosting settings or create another environment.

Prior release records are preserved in RELEASE-6.3.md, RELEASE-6.2.md and RELEASE-6.1.md.
