# Professional Trading Workstation candidate

Original repository: `Thaniyan/thn-ai-trader`. Local implementation only, 21 October 2026.
Foundation: published Core Research Trust `2ed5b20a465ccf524692e301ac7228d76490e4c6`,
a direct descendant of released v7.1 `fad7fe6d03f799bc699401e9fc31004e9b6c1087`.
No legacy branch merge, ancestry rewrite, publication or cloud configuration change.

## User-visible release

- One compact workstation shell across all nine views: smaller original brand mark,
  restrained typography, numbered navigation, compact session/header controls,
  shared surfaces and accessible focus states. Desktop branding appears once;
  mobile retains a horizontally scrollable keyboard-operable navigation dock.
- Markets is a real research table, replacing the default oversized discovery cards.
  Search all 18 curated mappings, filter categories, sort observed closes/changes,
  favorite instruments, inspect selected provenance and move directly to either chart,
  Intelligence or Risk Desk. Unknown/unavailable coverage stays explicit. Prices show
  source quote currencies; UTC timestamps identify candle opens. Change uses the
  previous valid observed close, not a real-time bid/ask or session-return claim.
- Observation batches are explicit user actions, limited to six displayed candidates,
  two concurrent requests, 60-second request caching and a cancel action. Each request
  has a timeout; selection/data boundaries retain the existing validated histories.
- The Trading Terminal now puts a two-source chart workspace first. TradingView is
  a prominent manual mode using the existing official public widget, with its side
  toolbar, built-in supported studies, timeframe and mapped instrument configuration.
  THN Research remains the independent owned chart for validated candles, authoritative
  indicators, causal structure and hypothetical plan overlays. No third chart library.
- The owned chart adds horizontal levels, validated bounded drawing restoration,
  per-drawing removal, storage-failure reporting, keyboard guidance and a focusable
  recent-candle data alternative. Existing trendlines, annotations, pan/zoom/crosshair,
  EMA/RSI/ATR/volume, structure, hypothetical plans and historical replay remain.
- Dashboard retains the existing closed-candle briefing, data quality, independent
  timeframes, research quality, watchlist, recent reports and chart/risk shortcuts,
  in the compact shared visual system. No parallel dashboard or duplicated report store.
- Journal adds a read-only, searchable, type-filtered record register with original
  JSON inspection and direct access to existing import/export tools. It preserves
  ambiguous legacy rows and never turns ideas into outcomes. Portfolio continues to
  exclude unverified reports by default; all Trust classification/import safeguards remain.
- Broker Accounts explains available, unavailable and future capabilities before the
  legacy desk. Light-theme surfaces/contrast and keyboard scrolling are corrected.
  Hosted connection buttons lead to readiness information instead of a credential form.
  Real credential inputs and external-provider choices are disabled; only existing,
  explicitly opted-in local paper workflows remain. No new broker integration.
- Blocked preference storage cannot crash initialization. Preference writes report
  refusal; journal and Library remain strict stores, with no successful-save fiction.
  Library's lazy storage adapter fixes an exception thrown before its own error handling.
- The existing raster logo is resized without changing its design: initial UI asset
  falls from a 4,027,258-byte embedded SVG to a 14,684-byte PNG. Original source remains
  recoverable and unmodified. The external widget script is asynchronous so it does
  not block application startup. No new external asset dependency or paid service.

## Research and AI boundaries

All authoritative numerical engines and the original research chart renderer are
byte-identical to the canonical baseline enforced by the unchanged release guard.
The additive chart extension consumes existing arrays; it calculates no new indicators.
Existing scenario → risk → owned chart, report → evidence, snapshot replay, comparison,
Research Library, deterministic assistant and six-role committee workflows remain.
EN/AR, RTL/LTR, both themes and all nine sections remain supported.

TradingView uses its own data, mappings and tools. Selections inside its iframe do not
flow back into THN. THN controls configure the next widget instance semantically, not
through a private Advanced Charts API. No arbitrary THN overlays are injected into the
embed; drawing features depend on TradingView's public widget availability/entitlements.
No private chart library is copied, no price equality is asserted, and no widget
interaction is falsely claimed from a local configuration shim.

Hosted financial mutation endpoints and hosted/local-model inference remain disabled.
No LLM, Ollama process, weights, model call or paid infrastructure was activated.
No prices, volumes, spreads, account balances, probabilities or financial outcomes
are invented by these changes. Offline test screenshots use disclosed provider fixtures.

## Local paper intent recovery

The client persists one logical intent key and exact payload fingerprint BEFORE
sending an order. A lost reply or rejected/uncertain response retains the key. Retrying
that same plan reuses it; a changed plan or refused/unreadable intent storage fails closed.
A successful acknowledged ticket resolves that client intent. Concurrent tabs submitting
that same persisted intent receive the same result; this is not cross-tab locking for
separately created intents.

The opt-in local server reserves an intent in private storage before adapter execution.
Account state and intent results use fsync + atomic replacement with mode 0600.
The completed result survives restart and a changed payload under the same key conflicts.
A crash/failure between reservation, fill, account persistence or result persistence
leaves the account blocked for new order keys with `PAPER_RECOVERY_REQUIRED`. Corrupt
account storage refuses startup rather than silently recreating a fresh account.
Corrupt intent storage, capacity exhaustion (10,000 records / 16 MiB) and persistence
failure also fail closed. Nothing automatically clears uncertainty or drops recovery data.

This is a **single-process local recovery gate, not exactly-once execution** or a
transactional multi-process ledger. An exclusive-writer marker gates all local financial POST requests and account writes.
A second process cannot mutate the same directory. Normal SIGTERM/SIGINT/exit removes
only its owned marker; an orphaned marker is preserved and requires operator recovery.
Browser Web Locks serialize pending-intent creation and acknowledgement across tabs;
if safe locking is unavailable, order submission is refused. Different deliberately
created intents are not heuristically deduplicated by identical payload. Crash recovery requires an operator to inspect
and back up account, intent and audit records and reconcile the retained ticket/state;
there is deliberately no public reset/recovery endpoint. A fully transactional ledger
with exclusive-writer enforcement remains future work. Hosted paper execution stays off.

## Acceptance and remaining limitations

See [evidence index](professional-workstation-evidence/README.md) for exact gate results,
visual comparisons and reproducible local commands. The full existing suites remain
required; the new professional suite is additive. No prior test assertions, frozen
numerical modules, workflow protections or dependency policies were relaxed.

The real external TradingView iframe cannot be conclusively exercised from the managed
network. A configuration shim validates wiring only; live external availability requires
an owner browser check. Production's existing alias/deployment was inspected read-only,
not used to claim this unpublished candidate has passed hosted tests. Free provider
availability/rights are not guaranteed; no new feed entitlement is claimed.

Durable hosted private accounts, broker synchronization, public generation and continuous
paper workers remain unavailable on the existing hosting architecture. Manual/imported
journal outcomes remain unverified. Browser accessibility tests are regression evidence,
not a universal accessibility certification or a physical-device/pinch-zoom guarantee.

## Local use and approval boundary

Use Node 24.5+; `npm run build`, `npm run lint`, `npm test`, `npm run test:system`,
`npm run test:security`, `npm run package:production`, `npm run test:browser`,
`python3 scripts/ci/check-workflow.py`, `node scripts/ci/dependency-audit.mjs`,
`node scripts/ci/release-guard.mjs`. Browser tooling requires the pinned `AXE_PATH`
and `CHROMIUM_PATH`; no real provider or model calls are used in CI.
Run `npm start` locally for on-demand provider research. Keep hosted flags unchanged.

The exact final local SHA is reported after committing the validated candidate. Separate
exact-SHA owner approval is required before pushing, opening a PR, merging or deploying.
The original Production project/domain are the sole proposed release destination.
Existing CI must pass on that exact SHA; retain the current Production deployment for
rollback. No Vercel settings change, resource creation or new deployment is performed here.
