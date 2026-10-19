# THN AI Trader 6.3

Bilingual trading intelligence and research workstation, developed directly from the original `main` application. The terminal, indicators, drawing overlays, SMC map, scanner, journal and local paper engine remain in the original Node/HTML/JavaScript stack.

## Run

```sh
npm install
npm start
```

Open http://127.0.0.1:3000. The default mode provides market observation, deterministic analysis, hypothetical risk planning and browser-local research notes. Account operations are unavailable by default. Live-money execution is disabled.

Market prices require reachable Yahoo Finance or Binance endpoints. Failures produce unavailable states; synthetic prices are never substituted. Quotes are candle-close observations, not executable bid/ask prices. Changes compare consecutive candles. Metals and oil use explicitly labeled futures proxies. Provider times are shown in UTC. A bounded 30-second process cache coalesces requests without changing provider timestamps.

On Node 24 in a managed proxy environment, use `NODE_USE_ENV_PROXY=1 npm start` to respect the configured environment proxy. This is an environment-specific launch setting, not a new production dependency.

## Local paper engine

```sh
THN_LOCAL_PAPER=1 npm start
```

This is a loopback-only, single-operator development engine. It creates an explicitly simulated USD 50,000 sandbox in ignored `.runtime/`. Set `THN_DATA_DIR` to use a separate private local directory. Do not expose this engine to a network; it has no multi-user authentication. Vercel always disables financial endpoints regardless of this flag. The API preserves local execution, settlement, reconciliation and auditing; the legacy bid/ask ticket remains unavailable because candle providers do not supply executable quotes.

Only supported USD-settled contracts are accepted for risk/execution. Orders require a recent provider observation, protective prices, valid volume increments and an idempotency key. The idempotency cache is scoped to account and payload, protects concurrent requests, and lasts five minutes within one process; it is not durable across process restarts. Local paper fills model a fixed spread; they do not reproduce broker execution.

## Verification

```sh
npm test
npm run build
npm run lint
```

Tests use isolated temporary ledgers and test-only provider fixtures. They cover public-mode isolation, real response shapes, unavailable/stale data, risk dimensions, idempotency, settlement and reconciliation. Production never imports the fixtures.

Optional browser checks require Python Playwright, Chromium at `/usr/bin/chromium`, and `axe-core` under ignored `work/node_modules`:

```sh
mkdir -p work
npm install --prefix work --no-save --no-package-lock axe-core
TEST_URL=http://127.0.0.1:3000 python tests/browser_workstation.py
```

Screenshots and results are written under ignored `work/`. The original legacy system suite is retained as `npm run test:legacy`; it assumes unrestricted local execution and continuously available providers and is not the public-mode acceptance suite.

## Research workstation

One selected symbol and 15m / 1h / 1d timeframe are shared across Dashboard, Markets, Trading, AI, research and risk planning. The original nine sections, TradingView integration, native drawing/SMC maps and local paper engine remain in place.

- Trading: provider OHLCV candlesticks, price/time axes, OHLC tooltip, wheel/button zoom, pointer/touch pan, keyboard pan and Shift+arrow OHLC inspection, EMA20/50, Wilder RSI14/ATR14, optional volume, support/resistance, causal SMC events, persistent browser-local trend lines/annotations, and analytical JSON export.
- AI: independent 15m, 1h and 1d provider requests, per-frame provenance and recency, trend/momentum/structure comparison, opposing evidence, and bullish/bearish/no-trade scenarios. Valid scenario references transfer to Risk Desk. Four-hour history is not claimed.
- Portfolio: a historical strategy laboratory alongside the existing research-journal analytics. EMA crossover, RSI recovery and prior-range breakout support long-only, short-only and symmetric long/short directions. Signals use completed bars, fills use the next available open, fixed ATR stops/targets use conservative stop-first ordering, and costs are explicit.
- Risk: hypothetical USD-settled contract sizing, USD-base FX conversion, and separate disclosed spread/slippage/commission estimates. Planning capital never becomes broker account state.
- Journal: browser-local research notes retain symbol, timeframe, data hash and completed strategy parameters/metrics. Exported research contains no account records or credentials.

Research API endpoints: `GET /api/research/series?symbol=EURUSD&interval=1h`, `GET /api/research/mtf?symbol=EURUSD`, and `POST /api/research/backtest` with `{symbol, interval, parameters}`. Requests use genuine provider data; client-submitted candle arrays and financial balances are not used. Server modules `research.js`, `backtest.js` and `evaluation.js` contain the reproducible algorithms and validation.

At least 60 closed, consistent provider candles are required; backtesting also needs 30 eligible bars after warmup. Research uses at most the latest 2,000 bars. Bad/missing provider rows are omitted without interpolation or fabricated prices; omission counts, session/data gaps, hashes and actual periods are disclosed. Gaps can conceal signals or stop touches. Volume is shown only when provided; Forex volume is often unavailable. Stock/corporate-action adjustment and provider history revisions are not normalized.

For retained chart browser checks (same prerequisites as above):

```sh
TEST_URL=http://127.0.0.1:3000 python tests/browser_research.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_research_outage.py
```

## Availability and hosting

Use the existing Vercel project only. No new infrastructure, paid services, workers, databases, dependencies or deployment projects are introduced. Public financial mutations and live execution remain blocked; the opt-in local engine is unchanged. The research, risk and privacy help is bilingual, including retained account/connection limitations. The retained local single-timeframe `/api/analyze` snapshot is separate from the independently fetched `/api/research/mtf` comparison.

Research depends on finite provider history, proxy instruments and stated costs. Chronological holdout and fixed-parameter walk-forward checks are available; there is no optimizer, annualized Sharpe, funding/borrow model, or broker margin-liquidation simulation. Sharpe per bar is computed only for at least 30 positive-equity observations with nonzero sample variance. Historical performance does not validate future win probabilities.

A verified economic calendar, external broker connectivity and durable hosted account records remain unavailable. Optional OpenAI narrative enhancement uses the existing configuration only; no new model provisioning or model calls were added to research APIs.

Runtime records remain excluded from Git and deployment inputs. See RELEASE.md for v6.3 evidence and limitations; RELEASE-6.2.md and RELEASE-6.1.md preserve earlier release records. No production push is authorized until the owner approves the exact v6.3 commit.

USD capital results require USD-quoted or supported USD-base Forex provider history. USDT-only Binance history remains chartable, but USD backtesting/scenario transfer is unavailable rather than assuming USD/USDT parity. Dollar-base Forex risk is converted at the planning price; other quote-currency conversions are unsupported.

## v6.3 chronological evaluation

`POST /api/research/evaluate` accepts `{symbol, interval, parameters, validation}`. Validation options include `trainFraction` (0.5–0.8, default 0.7) and `minimumTrades` (5–100, default 20). Each segment needs at least 60 eligible bars. Signals are causal; development receives only its data prefix. Each segment starts flat with fresh hypothetical capital. Parameters are user-selected and unchanged across the split. Repeated manual use of the holdout can still overfit it.

Reports compare actual UTC windows, return, drawdown, per-bar returns, realized R, exposure, holding times, trade distribution, concentration and drawdown contributors. Five bounded parameter/cost perturbations and three subsequent nonoverlapping test folds run where history permits, with an 18-engine-run ceiling. No variant is automatically selected. Window curves compare normalized progress, not simultaneous dates. Fold returns are summarized, never presented as a compounded continuous portfolio.

Missing-bar policy either rejects gaps or cancels pending entries and exits held positions at the next observed open. It cannot recover hidden intragap prices. Short PnL is directional and costs adverse, without crediting sale proceeds as available capital. This is hypothetical research, not broker-executable shorting.

Shared context carries dataset, scenario and explicit hypothetical risk assumptions without triggering chart reloads for metadata changes. Previous reports remain labeled when selections, inputs or data change. Save and compare up to four local experiments, export/import bounded whitelisted research JSON (imports labeled unverified), and attach conclusions to the journal. Browser storage is neither private encrypted custody nor a durable hosted database; do not enter secrets.

Current end-to-end checks:

```sh
TEST_URL=http://127.0.0.1:3000 python tests/browser_quality.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_research_outage.py
```
