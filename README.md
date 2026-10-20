# THN AI Trader 7.0 — integrated local release candidate

One original product: `Thaniyan/thn-ai-trader`, planned website `thn-ai-trader.vercel.app`.
See [RELEASE-7.0.md](RELEASE-7.0.md) for the delivered assistant, safeguards, test evidence,
provider limitations and preserved implementation evidence. See
[docs/V7-RELEASE-READINESS.md](docs/V7-RELEASE-READINESS.md) for current integration, CI and packaging results.
No push or deployment is authorized.

- AI Intelligence now contains a contextual rule-based conversation and a six-role Research Committee.
- Evidence comes from existing provider, indicator, structure, evaluation and hypothetical-risk engines.
- Live data is distinct from explicitly selected, unverified saved research; reflections do not rewrite originals.
- The optional authenticated local LLM adapter is inactive unless explicitly configured with budgets.
- No real LLM was used in this release validation. No ChatGPT subscription/token is reused.
- Hosted financial execution, mutations and durable accounts remain unavailable.

```sh
npm run build
npm run lint
npm test
node scripts/evaluate-intelligence.mjs
npm start
```

Use Node 24.5+ and existing browser prerequisites. Source code was transferred from verified
v6.6 `ddd13c298103d93ced74fdb8bbf8c43f4579369c` onto the existing sanitized history, without
merging its legacy ancestors or copying runtime/audit records. The prior local release remains
at `a0a75a493b565747d26fc0ef4bf9a22cffec33d6`. Older deployment tools and tests are historical;
they have not been silently removed or disabled. Existing CI remains an explicit release gate.

## v6.6 engine and research workflow reference (preserved)

# THN AI Trader 6.6

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

Runtime records remain excluded from Git and deployment inputs. See RELEASE.md for v6.6 evidence and limitations; RELEASE-6.5.md and earlier release records are preserved. No production push is authorized until the owner approves the exact v6.6 commit.

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

## v6.4 decision workflow

Dashboard opens with a selected-market briefing, closed-candle OHLC, provider coverage, independent timeframe completeness/conflict, observed ATR and recent complete research reports. Intelligence presents a structured deterministic brief: per-frame provider/hash/time, EMA inputs, Wilder RSI/ATR, prior-range levels, causal structure observations, directional and opposing evidence, scenario confirmation/invalidation references and explicit unknowns. Original technical panels remain under a separate-snapshot disclosure. Their heuristic scores are not predictive confidence.

`GET /api/research/brief?symbol=EURUSD&interval=1h` composes existing independently fetched/cached histories. It never generates synthetic prices, news, sentiment, probabilities or model narrative. No new LLM calls are made. Selected-history failure is disclosed even when other timeframes remain available. Provider recency is the existing interval-aware heuristic, not a verified exchange-session calendar.

Research-quality interpretation `6.4-Q1` attaches only when evaluation symbol, timeframe and dataset hash match the current brief and chart context. The ten displayed checks are: minimum trades in both main windows; positive holdout return/expectancy; positive development return/expectancy; retained mean realized R; positive development and holdout returns for all three friction stresses; positive returns in both parameter variants and windows; three positive subsequent folds each meeting the configured minimum trade count; largest-trade concentration within 40% absolute PnL and 25% risk share; recent history without observed gaps/omitted rows; and defined holdout profit factor, Sharpe and mean R.

Label rules are deterministic: missing evaluation or insufficient main-window trades → **Insufficient evidence**; nonpositive holdout return/expectancy → **Limited historical support**; positive sufficient holdout but any remaining criterion unmet → **Mixed evidence**; every criterion met → **Historical evidence more consistent across tests**. These intentionally conservative operational criteria are not statistical significance, calibration or probabilities. History can still overfit, especially through repeated manual holdout use. Existing evaluation rules and 18-run computation cap are unchanged.

Risk Desk accepts up to three independent full-position target outcomes, hypothetical USD capital, nominal risk, adverse friction assumptions and explicit user notes. `POST /api/research/plan` uses the existing server contract/risk engine, floors lots, estimates margin, discloses costs above the nominal stop budget and supports proper USD-base Forex conversion. Native USDT is rejected for USD planning. Stops never guarantee fills. Save up to four independent plans locally, compare assumptions and show entry/stop/target references on the existing candle chart. Target outcomes do not model partial scale-out allocations. No account mutation occurs.

Complete reports capture deterministic evidence, provider identities/timestamps, matched development/holdout summaries, sensitivity and walk-forward summaries, quality diagnostics, a matching hypothetical plan, user thesis/notes and conclusion. Save eight reports in this browser, export JSON or a standalone printable HTML document. User text is escaped, HTML forbids active/network content, unknown imported keys are stripped recursively, JSON is limited to 400 KB and eight bounded records, imports are labeled unverified and never drive calculations. Exports contain whitelisted research only; never enter credentials in notes. Browser storage is unencrypted and may be cleared or reach capacity. Existing notes, experiments and drawings are preserved.

Current full workflow verification (same browser prerequisites as above):

```sh
TEST_URL=http://127.0.0.1:3000 python tests/browser_decision.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_quality.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_research_outage.py
```

## v6.5 workflow and research preservation

The shared selection ribbon now links chart, independent evidence, evaluation, risk and the unified research library. Copilot opens as a compact scenario brief with expandable timeframe audit, quality criteria and uncertainty checks. The Dashboard keeps selected-market observations and the watchlist prominent while moving the introductory process/capability panels into disclosure. Original advanced charts, drawings, SMC maps, notebook and independent-frame controls remain available. A research-to-plan action transfers explicit capital, risk, leverage and friction assumptions; scenario transfer preserves the selected candle timeframe while recording the hourly source hash used for scenario levels.

The Research Lab retains the numerical engine and adds a compact development/holdout summary, plain-language next steps, and a bounded browser-local count of repeated inspections of the exact dataset/holdout window. Counts ignore parameter differences to expose repeated tuning. Clearing browser data, another device or a revised dataset resets that local record; the unconditional holdout-reuse warning still applies. No significance statistic or predictive probability was added.

### Unified library and recovery

The canonical `thn_research_library_v65` record contains up to 24 complete reports, 120 compatible legacy archives and two selected-timeframe raw candle snapshots, within a 1.8 MB UTF-8 content budget. Physical browser quotas may be smaller, especially when old records also remain. Save failures and capacity limits preserve previous work; saves do not silently trim it. Records can be searched, filtered, sorted, compared, renamed, marked draft/reviewed/archived, opened, printed and explicitly deleted. Review status is user-authored, not a claim of verified profitability.

Full JSON backup includes canonical reports/snapshots and compatible v6.2 notes, v6.3 experiments, v6.4 plans/reports and up to ten drawing sets. Limits are 100 legacy notes, four experiments, four plans, eight old reports and 50 drawings per set. Preview/export reports the number of invalid or over-limit legacy records not included; their original browser keys remain untouched. Recovery stores old notes/experiments/plans/drawings as readable unverified archives rather than rewriting active historical formats. Existing original interfaces remain available for the unchanged active records.

Import accepts the new `THN-BACKUP-6.5` format (2.1 MB maximum) or existing `THN-DECISIONS-6.4` report exports. It stages a validated preview first; explicit confirmation appends records without overwriting existing work. Capacity failures reject the entire restore. All imported content is unverified. Unknown fields, including credential fields, are removed recursively; shape, bounds and OHLCV hashes are validated. User content is escaped in the interface and printable HTML. No accounts, ledgers, authentication tokens or arbitrary localStorage keys are collected.

Writes use one synchronous localStorage update and reject stale expected state; storage events reload changes from other tabs. This is not a durable multi-user database or a cross-tab transaction service. Unreadable library storage blocks writes rather than overwriting the original bytes. Restore a valid backup in clean browser storage if the original is corrupt. No encryption, sign-in or cross-device synchronization is provided. Do not put secrets in research free text.

### Candle snapshots and offline replay

A dataset hash identifies observed content; it does not promise future retrieval from a provider. Select **Retain current candle snapshot** in the library to keep the current selected timeframe's actual closed OHLCV rows (60–2,000 bars). SHA-256 is recomputed before retention and on restore. It verifies content integrity, not source authenticity. At most two snapshots are retained; capacity does not automatically evict earlier snapshots. Confirm deletion explicitly after exporting any needed backup.

Complete reports record product analysis version, evaluation engine version, parameters (including optional start/end dates), chronological windows, risk/cost assumptions, observation coverage, provider symbol, creation time, hash and raw-retention limitation. Comparing two records highlights changed datasets, coverage, parameters/costs, windows, risk, engine version and observed holdout outcome without implying a controlled experiment when inputs differ.

Offline replay is a local-only command, with no network access or public client-candle endpoint:

```sh
npm run replay -- path/to/THN-library-backup-6.5.json [report-id]
```

It validates the bounded backup and candle hash, reruns the existing 6.3 evaluator using saved parameters and split, and compares recorded development/holdout metric fields. It refuses missing snapshots or unsupported engines instead of refetching potentially revised history. Only the selected timeframe is retained; other timeframe observations remain summarized in the report. The replay does not authenticate imported provenance or simulate unobserved gap prices.

Current acceptance checks:

```sh
TEST_URL=http://127.0.0.1:3000 python tests/browser_maturity.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_library_reliability.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_quality.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_research_outage.py
```

The older `browser_decision.py` is retained as the v6.4 historical UI harness; its immediate-import expectations are superseded by the explicit v6.5 restoration preview. Before/after captures and test results are stored under ignored `work/v65-*`.

## v6.6 browser replay and research terminal

Markets now provides 18 curated mappings across Forex, metals, oil, indices and crypto, with search/category filters and consistent symbol selection. These are candidate mappings, not guarantees of current history. Inspecting a market fetches the existing independent provider observations; it does not scan every candidate in the background. Selected Dashboard observations include source time/recency, change versus the previous observed candle with actual comparison timestamps, EMA/ATR context and a mini-chart of observed closes with real time spacing. The six-instrument provider watchlist remains separate.

The Data Quality panel distinguishes application API health, provider availability, stale frames, insufficient history and cadence errors. It shows requested/actual interval, source/provider symbol, quote currency, coverage/count, provider time, hash, gaps, omitted rows, volume and proxy disclosures. Retry is bounded and explicit; no cloud monitoring worker or claimed streaming feed is added. Dashboard focus reuses accepted shared history when available. `NAS100` now maps to Yahoo `^NDX` (Nasdaq-100), correcting the old `^IXIC` Composite mapping. Old saved data retains its original provider identity and is never silently relabeled.

### Replay inside the website

Library → Open report → Verify & reproduce evaluation. It requires a retained matching snapshot and supported engine `6.3`. The browser verifies SHA-256, then sends the whitelisted report and candles to the same-origin `POST /api/research/replay` endpoint. The server verifies the dataset again and invokes the identical evaluator used by offline replay. It never fetches fresh provider history, imports an account balance, writes financial state or logs/stores the submitted dataset. The app reports exact recorded-field differences and chronological boundary differences as **Reproduced**, **Numerical mismatch**, **Cannot reproduce** or **Dataset integrity failure**. Cancellation/disposal prevents late results from modifying newer UI or completed records; computation already submitted may finish within its fixed budget.

Replay requests are limited to 1 MB UTF-8, 2,000 candles, 18 engine runs, bounded metric shapes and two in-flight replay requests per server process. This is not platform-wide rate limiting. Unsupported engines, missing snapshots, malformed/oversized input, tampered OHLCV, mismatched instrument/hash/interval and invalid strategy settings fail explicitly. Imported reports remain unverified after numerical reproduction: SHA-256 is not provider authentication. Local reproduction stamps do not survive import as trusted status. Recomputed metrics do not overwrite the stored original report.

A replay can open a separately labeled, read-only retained historical chart using the existing candle-chart component and authoritative server indicator/structure formulas. It has pan/zoom, keyboard inspection and an optional structure overlay; only the most recent 200 causal events are returned. The current chart and research selection stay independent, so retained observations are never passed off as current data. Open the saved report's instrument/timeframe on the current chart separately; hash mismatch is disclosed if newly retrieved history differs. Copilot frame claims have the same explicit chart navigation. Hypothetical plan overlays can be toggled without deleting the plan.

The Node CLI now delegates to the same replay service. It remains local-only and network-free:

```sh
npm run replay -- path/to/backup.json [report-id]
```

### Quantitative comparison

Select two to four Library cases. The workstation compares symbol/timeframe, provider/hash, coverage, actual recorded evaluation boundaries, rules/direction, parameters and costs, development/holdout returns, drawdown, trade count, exposure, defined profit factor/mean R, sensitivity and walk-forward summaries. Compatibility and imported/sample/gap warnings remain explicit. Aggregate return bars have independent recorded windows; no misaligned equity curves are presented as simultaneous performance. A deterministic summary describes changed inputs and observed return/drawdown deltas without ranking a winner or asserting significance. Legacy reports lacking an actual holdout end show it as unrecorded rather than substituting the last provider timestamp.

Risk Desk exposes cost-adjusted risk-budget and insufficient-margin warnings, independent alternative-plan exposure bars, authoritative contract rules for the supported catalog mappings, and the existing hypothetical entry/stop/target overlay. Costs/gaps may exceed the nominal stop budget; the visual is neither executable capital nor aggregate portfolio risk. Native USDT is not assumed equal to USD.

The v6.5 library schema/capacity, snapshots, append-only restore previews, quota/corruption protections, unencrypted local storage and older note/experiment formats remain. Reproduction status is supplementary local metadata. New reports include actual development-first and holdout-last timestamps and preserve RSI/ATR period parameters. The v6.3 numerical strategy formulas and conservative execution model are unchanged.

Current acceptance checks (same browser prerequisites):

```sh
TEST_URL=http://127.0.0.1:3000 python tests/browser_terminal.py
TEST_URL=http://127.0.0.1:3000 TEST_OUTPUT_PREFIX=work/v66-maturity python tests/browser_maturity.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_library_reliability.py
TEST_URL=http://127.0.0.1:3000 python tests/browser_research_outage.py
```

Screenshots, real-provider response summaries and acceptance results remain ignored under `work/v66-*`. Generative AI, paid resources and hosted financial execution remain disabled/unprovisioned. Production has not been changed by this development cycle.
