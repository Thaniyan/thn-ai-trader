# THN AI Trader 6.1

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

## Availability and hosting

Use the existing Vercel project only. No new infrastructure, paid services, background workers, databases or deployment projects are introduced. The public application retains all nine sections, but hosted account storage/execution is unavailable until reliable persistence and authenticated account isolation exist. Browser journals contain manually maintained research records, not verified broker performance. Historical backtests, independent multi-timeframe confirmation, a verified economic calendar and external broker connections are unavailable. Deterministic scores express heuristic confluence, never calibrated win probabilities. Optional OpenAI narrative enhancement requires an already configured key; no model purchase or provisioning is performed.

Runtime account/audit files have been removed from tracking and deployment inputs. Historical records are never loaded as startup state. See RELEASE.md for release evidence and credential-rotation considerations.
