> Local reconciliation candidate based on original main 50857df and reviewed private
> staging b05f070. Not published or deployed. Current authority and publication
> blockers: [Repository reconciliation](docs/REPOSITORY-RECONCILIATION.md).
> Historical staging instructions below do not authorize production or WSL2 changes.

# Staging validation candidate

See [engineering audit and actual validation](docs/staging-engineering-audit.md) and [isolated WSL2 upgrade/rollback](docs/staging-upgrade.md). Market providers remain independently verified prerequisites. Gold futures proxies are analysis-only and cannot authorize paper orders. Live brokers remain disabled.

# THN AI Trader Professional v6.0

# THN AI Trader Professional v5.0

# THN AI Trader Professional v4.0

Institutional-style bilingual AI trading workstation with a redesigned adaptive market map.

## What is new in v4.0

- Clearer professional analysis chart with adaptive price scaling so support/resistance and candles are no longer compressed by distant Fibonacci/outlier levels.
- Layer toggles for candles, EMA stack, support/resistance, zones, Fibonacci, risk box, trend channel, volume, and patterns.
- Market HUD below the chart showing live price, trend quality, nearest support, nearest resistance, and volume profile.
- Analysis Layer Board showing every analysis school and diagnostics used by the engine.
- Improved candlestick rendering, right-side price axis, risk/reward shading, current-price marker, session bands, volume pane, value area, and professional labels.
- Safer watchlist alert-only automation remains enabled; live execution still requires broker authorization and compliance controls.

## Run

```bash
bun install --frozen-lockfile
npm start
```

Open `http://localhost:3000`.

## Notes

This application is an educational decision-support prototype. It is not financial advice and does not execute live orders.


## v5.0 additions
- Institutional analysis workspace upgrade.
- Larger clearer analysis chart.
- Technical drawing overlays plus SMC map (BOS / CHoCH, liquidity, order blocks, pivots).
- Momentum pane below the price chart.
- Two additional professional boards under the chart for chart reading and market structure.


## v6.0 professional additions
- AI Automation Studio with automated copilot, smart alerts, risk governor and next-best action.
- Cleaner professional analysis page with a large technical drawing chart.
- Dedicated SK / SMC analysis chart for BOS/CHoCH, liquidity, pivots and order blocks.
- Trade Compass panel connecting the AI decision, automation score and risk governor.
- Reduced default chart clutter by moving SK/SMC and optional Fibonacci into separate views/layers.
- The platform remains alert-only by design; live broker execution requires regulated broker integration and user authorization.


## Secure runtime and verification

Requires Node.js 24.5 or newer (built-in SQLite), with Bun 1.4.2 for the existing lockfile. No extra runtime dependency was added for persistence.

- Configure `THN_AUTH_TOKEN` (at least 16 characters; use a random 32+ character secret) through managed secrets. Alternatively `THN_AUTH_USERS` accepts an array of `{id, token}` records. Legacy accounts belong to `operator`. Without credentials, account operations stay locked; public analysis remains available.
- Sign in through the account-access form. The token is cleared from the form; sessions use HttpOnly, SameSite=Strict cookies. Set `THN_PUBLIC_ORIGIN` to the HTTPS origin in a hosted environment; HTTPS sessions use Secure cookies. Terminating the server revokes sessions.
- `THN_DATA_DIR` selects durable private storage; default is `.runtime/`. SQLite uses WAL and FULL synchronization. Account mutations, idempotency and realized-fill ledger writes are atomic. A writer lock intentionally disallows multiple application writers. After an unclean shutdown, an operator must establish that no writer is running before removing the stale `.writer.lock`. Back up the database and encryption key together. Existing keys are never silently replaced.
- Live broker execution is disabled in backend handlers and adapter implementations, even if bridge URLs are configured. Paper fills require exact-instrument fresh provider evidence and use a documented 0.8-pip spread approximation and no commission/swap model; it is not an executable broker quote. USD accounts are supported; unavailable verified currency conversions block orders.
- Futures/index and USD/USDT proxy prices are explicitly labelled and cannot qualify actionable notifications. They are analysis-only inputs; exact instrument pricing is required for paper orders, fills and closes.
- No synthetic provider fallback exists. Invalid/stale/unavailable quotes cannot authorize execution or opportunity notifications. Closed candles drive indicators; quote timestamps are separate. Session-closed prices remain stale for execution. The verified exchange-calendar integration is not implemented; its absence is explicit.
- RSI/ATR use rolling simple averages; EMA uses SMA initialization; Bollinger uses population variance. Confidence is a heuristic confluence score, not a probability. D1/H4/H1/M15 fetch independent data; Yahoo H4 aggregates hourly bars. Volume-at-price is an OHLCV approximation, not tick-level exchange liquidity. Calendar events are unavailable until a verified provider is integrated.
- Per-instrument visibility and scanning preferences are independent. Scanning is single-flight with cancellation and backoff, and is active only while the application is open. Browser background scheduling is not guaranteed. Notifications default off and use IndexedDB reservations plus Web Locks for cross-tab deduplication. Quiet hours use browser-local time.
- Saved analysis is a setup, not realized profit. Server paper fills are immutable journal entries; manual/imported entries are unverified and excluded from default analytics. Synthetic benchmark previews never overwrite the journal. Resetting a paper account starts a new performance epoch while preserving its audit history.
- Optional OpenAI enhancement requires a managed `OPENAI_API_KEY`, an allowed destination, and authenticated access. Output is schema-validated narrative only, with an eight-second timeout and request/token budgets. Neither OpenAI nor external brokers are verified merely by configuration presence.

Run `npm test` for isolated deterministic fixtures, concurrency, authorization, market-data, risk, lifecycle and integration regressions. Tests never target production. Run `npm run test:browser` with Python Playwright and Chromium installed (`CHROMIUM_PATH` can select a binary). Run `npm run test:load` for a bounded local-fixture load check; its timings do not establish production/provider capacity. This clean staging snapshot contains no GitHub Actions workflows or automatic deployment triggers; run the documented verification commands manually.

Real-feed freshness rules, exchange calendars/licensing, broker-specific contract specifications, commission/slippage calibration, richer drawing tools, managed key rotation, multi-instance scaling and historical strategy evaluation require further verified integrations. No claim of improved profitability is made.

Deployment preparation and operational procedures: see [deployment operations](docs/deployment-operations.md) and the inactive templates in `deployment/`. Live execution remains disabled. Paper-account funding accepts finite non-negative numbers (including zero); omitted funding defaults to $50,000. `/api/ledger` accepts `limit` (1–500, default 100) and exclusive numeric `before` cursor, returning `fills` and `nextCursor`. The journal follows pages to preserve complete account history.

P1 recovery and data-integrity safeguards: startup authenticates existing SQLite and legacy credential ciphertext before accepting a local or managed encryption key. Missing, malformed, or mismatched keys fail closed; restore the exact key rather than replacing or rotating it in place. New encrypted payloads include a non-secret key fingerprint and format version, while existing payloads remain readable without rewriting them. Production should use a consistently managed key and retain its matching backup version.

Quote freshness and closed-candle freshness are assessed independently. Provenance exposes `quoteFresh`, `candlesCurrent`, `candleStatus`, and `lastClosedCandleAt`; stale or session-gap history cannot authorize actionable analysis or paper execution. Timeframe cadence permits whole-bar gaps and daily daylight-saving transitions. Non-crypto closure allowances are bounded and conservative, not a verified exchange/holiday calendar. Account responses preserve numeric zeros, use conservative missing-margin defaults, and return a non-sensitive error for invalid/non-finite persisted financial values.
