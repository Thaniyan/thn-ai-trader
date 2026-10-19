# THN AI Trader 6.2 — local release candidate

Date: 2026-10-19. Original repository: `Thaniyan/thn-ai-trader`. Base: `e63a48d57c9d9b3c636cd53b00aa22d0a6be493c`, verified against remote main at the start of implementation. Local branch: `product/quant-workstation-6-2`. No push or production deployment is part of this development cycle.

## Implemented capabilities

The existing terminal now includes a real provider OHLCV workstation with zoom, pointer/touch pan, OHLC crosshair, keyboard controls, true interval changes, optional EMA/RSI/volume/levels/SMC layers, time/price anchored annotations, and analytical exports. The original TradingView/native drawing maps remain intact. A single persisted research context links the existing nine sections and the dashboard closed-candle preview.

Independent 15m, 1h and 1d series drive a comparison of higher-timeframe trend, intermediate momentum, lower-timeframe context, support/resistance and conflicts. Each frame carries its source, provider symbol, actual dates, closed-bar count, status and SHA-256. Unavailable/stale frames cannot become verified agreement. Bullish, bearish and no-trade scenarios expose supporting/opposing timeframes, hourly range triggers and daily invalidation references. Valid scenarios transfer to the server-backed Risk Desk with explicit hypothetical capital and cost assumptions.

Portfolio contains a historical strategy laboratory: confirmed EMA crossover, RSI recovery mean reversion and prior-range breakout. Each is deterministic and long-only. Entry signals are calculated at a completed bar; fills occur at the next available bar open. Fixed ATR stops/targets, adverse gap-stop fills, stop-first ambiguous-bar ordering, per-fill spread/slippage/commission, contract lot increments, risk limits and leverage/margin caps are modeled. Remaining positions settle at the final sample close. Equity/drawdown, win rate, profit factor, expectancy, realized R, average win/loss ratio, trade counts and non-annualized Sharpe are computed from actual outcomes. Zero trades, zero losses and invalid Sharpe denominators produce undefined metrics rather than fabricated success.

Browser-local notes save research context, dataset hash and completed backtest metadata; JSON exports contain research only. All new controls/results/errors have English/Arabic support. Retained labels were translated and misleading legacy connection/feed/account claims corrected. Light-theme tabs/decision contrast and mobile chart density were improved.

## Correctness and provenance

- Provider intervals and observed median candle cadence must agree. Fixed legacy Binance swing mapping (4h candles had been labeled 1d).
- Invalid, missing or inconsistent provider rows are omitted without altering valid OHLC or synthesizing prices. Counts and session/data gaps are disclosed. Missing periods can conceal signals/exits and limit inference.
- Indicators use seeded EMA and Wilder RSI/ATR recurrences. Pivots confirm two bars after their anchor; BOS/CHoCH, FVG, candidate order blocks and liquidity sweeps use information available at each event bar. These are reproducible heuristics, not proof of actual institutional orders.
- No lookahead from future bars enters strategy signals or structure event confirmation. Prefix-invariance tests compare truncated and extended histories, excluding explicit terminal sample liquidation.
- Data hashes identify exact provider snapshots; the same data and parameters reproduce results. Provider revisions can change future snapshots.
- The new public research endpoints cannot mutate account state. They ignore client candles/balances and preserve all v6.1 hosted financial guards. No new paid calls, services, dependencies or hosting changes were introduced.

## Validation

- 39 unit/integration tests pass: numerical indicators/metrics, prefix invariance, deterministic strategies, ambiguous stop handling, explicit costs, invalid inputs/history, partial/full outages, stale data, independent hashes/cadence, public isolation, local paper lifecycle, risk/currency correctness and partial settlement.
- Build/syntax and lint checks pass.
- Chromium exercised true candle rendering, OHLC tooltip, keyboard pan/inspection, zoom/reset, layers, line/annotation/undo, independent interval changes, scenario-to-risk transfer, actual historical testing/export and note persistence.
- Real Yahoo Finance EURUSD requests returned distinct independently valid 15m, 1h and daily histories. Forex volume was absent and explicitly unavailable. Historical inconsistencies were counted and excluded, not repaired.
- Example captured hourly EMA run: 2,000 provider bars, 1,973 post-warmup bars, 35 trades, 6 wins/29 losses, approximately -3.34% net return. This is an observed research example, not a product performance claim or forecast.
- All nine sections checked at desktop and in English/Arabic at 390×844 without page overflow. Arabic RTL and light/dark chart behavior checked. Axe scans cover nine active view regions plus the light Trading view; automated checks do not establish full accessibility conformance.
- Browser outage checks explicitly reject substitute chart/backtest results in both languages. USDJPY planning example: 0.15 lots, USD 100 nominal stop risk and USD 750 margin at 20:1 leverage for entry 150, stop 149, target 152 and USD 10,000/1% hypothetical capital.
- Browser screenshots/results are retained under ignored `work/v62-*`; runnable tests are in `tests/browser_research.py` and `tests/browser_research_outage.py`.

## Functional limits

Research is in-sample and long-only, bounded to 2,000 closed bars and supported USD-settled contracts. There is no short selling, walk-forward/out-of-sample validation, annualized Sharpe, corporate-action adjustment, funding/borrow cost model, or broker margin liquidation. Cost/risk estimates do not guarantee execution or cap gap losses. Closed daily bars use a conservative 24-hour completion boundary. SMC regions are historical candidates; their future validity is not assured. Four-hour independent analysis, a verified calendar, external broker execution and durable hosted account records remain unavailable. Some long-form legacy broker help content is still English. Notes/drawings are browser-local and subject to storage limits. Existing optional model output was not tested; new research is fully deterministic.

## Safe release and rollback after explicit approval

1. Record the existing production deployment/alias and verify remote main still equals this release base; rerun the relevant tests/build and confirm a clean tree.
2. Fast-forward the exact approved v6.2 commit to original `origin/main` with a normal push. Never force-push, reset remote history, create another project or change billing.
3. Monitor the existing Vercel project `thn-ai-trader` (`prj_IFLYEB85CRNBjDEGO69xcW4O55Wd`) and verify https://thn-ai-trader.vercel.app/ after READY. Production browsing/runtime-log access was blocked by environment/connector permissions in the earlier cycle; resolve those access limits before claiming end-to-end production verification.
4. Last verified v6.1 production rollback reference: `dpl_871FGRtHnCDz4rDdgVuU7AwUkfqk`, URL `https://thn-ai-trader-hjuqiorka-s139354s-projects.vercel.app`. Reconfirm it before release. If necessary use the existing Vercel project's non-destructive deployment rollback, verify original URL and record the action; do not rewrite Git history. Vercel rollback can suspend automatic alias assignment, which must be checked before later releases.

Zero additional hosting cost: existing Hobby project only; no new infrastructure, purchases, paid resources or live-money execution.

USD capital results require USD-denominated provider history. USDT-only Binance history remains chartable, but USD backtesting/scenario transfer is unavailable rather than assuming USD/USDT parity. Dollar-base Forex risk is converted at the planning price; other quote-currency conversions are unsupported.
