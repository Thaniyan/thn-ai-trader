# THN AI Trader 6.2

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

## v6.2 research workstation

One selected symbol and 15m / 1h / 1d timeframe are shared across Dashboard, Markets, Trading, AI, research and risk planning. The original nine sections, TradingView integration, native drawing/SMC maps and local paper engine remain in place.

- Trading: provider OHLCV candlesticks, price/time axes, OHLC tooltip, wheel/button zoom, pointer/touch pan, keyboard pan and Shift+arrow OHLC inspection, EMA20/50, Wilder RSI14/ATR14, optional volume, support/resistance, causal SMC events, persistent browser-local trend lines/annotations, and analytical JSON export.
- AI: independent 15m, 1h and 1d provider requests, per-frame provenance and recency, trend/momentum/structure comparison, opposing evidence, and bullish/bearish/no-trade scenarios. Valid scenario references transfer to Risk Desk. Four-hour history is not claimed.
- Portfolio: a historical strategy laboratory alongside the existing research-journal analytics. EMA crossover, RSI recovery and prior-range breakout are long-only strategies. Signals use completed bars, fills use the next available open, fixed ATR stops/targets use conservative stop-first ordering, and costs are explicit.
- Risk: hypothetical USD-settled contract sizing, USD-base FX conversion, and separate disclosed spread/slippage/commission estimates. Planning capital never becomes broker account state.
- Journal: browser-local research notes retain symbol, timeframe, data hash and completed strategy parameters/metrics. Exported research contains no account records or credentials.

Research API endpoints: `GET /api/research/series?symbol=EURUSD&interval=1h`, `GET /api/research/mtf?symbol=EURUSD`, and `POST /api/research/backtest` with `{symbol, interval, parameters}`. Requests use genuine provider data; client-submitted candle arrays and financial balances are not used. Server modules `research.js` and `backtest.js` contain the reproducible algorithms and validation.

At least 60 closed, consistent provider candles are required; backtesting also needs 30 eligible bars after warmup. Research uses at most the latest 2,000 bars. Bad/missing provider rows are omitted without interpolation or fabricated prices; omission counts, session/data gaps, hashes and actual periods are disclosed. Gaps can conceal signals or stop touches. Volume is shown only when provided; Forex volume is often unavailable. Stock/corporate-action adjustment and provider history revisions are not normalized.

For v6.2 browser checks (same prerequisites as above):

```sh
TEST_URL=http://127.0.0.1:3000 python tests/browser_research.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_research_outage.py
```

## Availability and hosting

Use the existing Vercel project only. No new infrastructure, paid services, workers, databases, dependencies or deployment projects are introduced. Public financial mutations and live execution remain blocked; the opt-in local engine is unchanged. Existing broker help modals still contain some legacy English content; all new research workflows and many retained screen labels have EN/AR translations. The retained local single-timeframe `/api/analyze` snapshot is separate from the independently fetched `/api/research/mtf` comparison.

Backtests are in-sample, long-only, and depend on finite provider history, proxy instruments and stated costs. There is no walk-forward optimizer, annualized Sharpe, short/funding/borrow model, or broker margin-liquidation simulation. Sharpe per bar is computed only for at least 30 positive-equity observations with nonzero sample variance. Historical performance does not validate future win probabilities.

A verified economic calendar, external broker connectivity and durable hosted account records remain unavailable. Optional OpenAI narrative enhancement uses the existing configuration only; no new model provisioning or model calls were added to research APIs.

Runtime records remain excluded from Git and deployment inputs. See RELEASE.md for v6.2 evidence and limitations; RELEASE-6.1.md preserves the earlier release record. No production push is authorized until the owner approves the exact v6.2 commit.

USD capital results require USD-denominated provider history. USDT-only Binance history remains chartable, but USD backtesting/scenario transfer is unavailable rather than assuming USD/USDT parity. Dollar-base Forex risk is converted at the planning price; other quote-currency conversions are unsupported.
