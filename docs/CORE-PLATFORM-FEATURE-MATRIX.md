# Feature functionality matrix — audited v7.1

Baseline: `fad7fe6d03f799bc699401e9fc31004e9b6c1087`; evidence collected
20–21 October 2026. Legend and defects F01–F16 are defined in
[the audit](CORE-PLATFORM-AUDIT.md). S = source; T = established tests;
L = targeted local runtime; P-meta = platform metadata; B = blocked;
U = unverified. Fixture-backed runtime results do not establish live feed quality.

## Nine-section assessment

All nine sections were actually navigated by keyboard in 108 combinations of
desktop/tablet/mobile, EN/AR and dark/light. No page horizontal overflow or ordinary
page exception occurred. These checks establish rendering/navigation, not every
subfeature's correctness. Existing regression suites exercise the deeper workflows
listed below. Every row's functional Production verification is B; only exact
deployment SHA, READY and domain assignment have P-meta evidence.

| Section / intended purpose | Implemented behavior, API and data | States, persistence and safety | Coverage and readiness |
|---|---|---|---|
| Dashboard: market command center | Six-instrument observation watch, focused sparkline, shared symbol/interval, independent-frame selected brief, shortcuts to chart/risk/Library; `/api/quotes`, `/api/research/series`, `/api/research/brief`, health. S/T/L. | Provider/time/stale/unavailable and deterministic-mode disclosures; no executable bid/ask. Selection local to browser. Closed-frame and raw-quote snapshots can differ (F02). Legacy balance fallback literals remain and must never be treated as an authoritative ledger. | Workstation, context, maturity and terminal tests; supplemental all profiles. Usable research dashboard; not account equity or streaming terminal. |
| Markets: discover and inspect instruments | Curated candidate catalog, categories/search, independent histories and chart/context navigation; original six-symbol filters/watchlist in disclosure; `/api/research/catalog`, series, MTF, quotes. S/T/L. | “Coverage not checked” and unavailable frames are explicit. Commodity proxies labeled. Quote/provider currency changes possible with fallback. Catalog is not exchange entitlement or verified global coverage. | Discovery/filter/select/rapid context tests; real local hourly retrieval for three selections. Research-ready with provider limitations; all instruments/timeframes online not verified. |
| Trading Terminal: analyze charts and plan | Native canvas candles, EMA, RSI, volume, prior ranges, causal SMC markers, line/note tools, crosshair, keyboard pan/zoom/reset, optional plan overlay; legacy map and external TradingView display; series plus `/api/analyze`. S/T/L. | Loading/errors clear new chart state. Drawings saved per browser/symbol/frame, capped at 50. Independent/provisional snapshots differ; external chart data not synchronized. Execution ticket cannot provide verified bid/ask; broker mutations blocked hosted. | Research/workstation/terminal suites exercise candles, layer changes, keyboard, context, overlay and snapshot chart. External TradingView/real touch devices U. Professional research subset works; order-routing UI is not broker functionality. |
| AI Intelligence: understand evidence | Deterministic contextual assistant, bounded six-role committee, opposing evidence, citation drill-down, independent MTF audit, risk/evaluation references, save/reflect memory, EN/AR; intelligence/brief/MTF/reflection APIs. S/T/L. | Model unavailable/disabled is explicit; saved imports unverified, no financial authority. Conversation history/Library browser-local. Optional loopback model protocol exists but not real-model validated. Legacy score panels are separate heuristics, not probabilities or actual news/flow. | Intelligence, memory, pilot, context and malformed-output/security suites. Hosted-mode 503 generation probe passed locally. Good deterministic support; hosted generative service intentionally unavailable. |
| Risk Desk: hypothetical position plans | Finite directional inputs, generic contract sizing, USD-base FX conversion, risk budget, leverage, SL/TP, up to three independent target outcomes, costs and margin warnings, four alternative saved plans, chart levels; `/api/research/plan` plus older `/api/risk/calculate`. S/T/L. | Hypothetical capital; stops/gaps/costs disclosed; no broker terms verification. Costs can exceed nominal budget; margin warning does not establish executable buying power. No portfolio aggregation. Old risk preview has weaker contract (F07). | Risk, decision, research-outage and terminal tests; $100-stop/$550-margin EURUSD case and USDJPY conversion. Normal mobile/RTL stable; ultra-narrow content limitation documented. Ready for bounded planning, not broker-approved pre-trade checks. |
| Portfolio: evaluate historical strategies | Historical Strategy Laboratory: EMA/RSI/breakout, long/short variants, friction, chronological development/holdout, sensitivity, walk-forward, equity/drawdown/trades, comparisons; backtest/evaluate APIs. Legacy performance panels read browser journal. S/T/L. | Real deterministic computation over fetched closed history; unavailable/short history reasons explicit; no fabricated fallback backtest. Legacy journal outcomes/KPIs can be misleading (F01). Not a synchronized holdings/cash portfolio. | Research/evaluation tests assert causal timing, costs, holdout separation, metrics, gaps; quality/terminal browser journeys. Laboratory useful; legacy performance cannot be treated as investment track record. |
| Trade Journal: research preservation | Primary Research Library with 24 reports, 120 bounded compatibility archives, two raw snapshots, search/filter/status/rename/delete, full JSON backup/preview/append restore, HTML/print, 2–4-case comparison and replay. Older notebook and signal journal remain in disclosures. S/T/L. | Canonical browser store ~1.8 MB, import max 2.1 MB. Writes fail closed on unreadable/capacity errors and stale expected state; snapshots hashed; imports unverified. No encryption/device sync/server retention. Legacy note→WIN/CSV defaults/trimming are inconsistent with primary Library (F01/F04). | Library unit and reliability/browser suites cover retention, corruption, quota, cross-tab changes, malicious imports, replay mismatch/outage and recovery. New Library strong local-only workflow; old outcomes require remediation. |
| Broker Accounts: account status and paper interface | Hosted list returns empty/unavailable; connections/register/order/close/reset/funds/audit routes gated. Opt-in loopback local account/order/close/reconciliation endpoints work with synthetic paper capital. Exness/MT5/XTB adapter shells and documentation remain. S/T/L. | No real account authentication or external broker synchronization. JSON single-operator ledger, no durable worker, new-key duplicate risk. Empty/unavailable UI is honest overall but retained advisory/ticket copy and statuses need cleanup. Never enter real credentials. | Ten system assertions and hosted security tests; same/new-key targeted probe. Supplemental scans found contrast and keyboard scroll failures (F06). NOT ready for real broker accounts or hosted paper trading. |
| Settings: preferences and local reset | Language/theme, research preferences, provider capability descriptions, clear legacy journal and request local sandbox reset; browser keys and gated broker reset endpoint. S/T/L. | Settings are browser-local, no account preferences sync. Reset labels distinguish legacy journal from Library, but there is no unified lifecycle/backup screen. Hosted paper reset unavailable. Denied storage breaks legacy startup (F04). | Workstation/terminal/layout/locale tests and supplemental profiles. Normal preference flows usable; blocked storage/deletion taxonomy needs improvement. |

## Major supporting capabilities and implementation status

| Capability | Status | Evidence and exact boundary |
|---|---|---|
| Provider OHLCV retrieval | Implemented with limitations | S/T/L-real: hourly Yahoo data retrieved in three cases; no uptime or rights guarantee |
| Bid/ask, tick stream, depth, live order book | Missing | S: quote API intentionally returns null bid/ask; no executable feed |
| Independent multi-timeframe research | Implemented | S/T: actual separate 15m/1h/1d retrieval with partial/stale handling; legacy faux-MTF builder is not used by analyze endpoint |
| Economic calendar / news / macro feed | Unavailable | S/T: calendar builder returns empty; no verified event/news provider |
| Sentiment | User context/heuristic only | S: not independently observed social/news/institutional sentiment |
| Indicators/SMC | Deterministic heuristics | S/T: causal confirmation for new research events; no actual institutional-order evidence |
| Native charts and drawings | Implemented | S/T/L: keyboard, zoom, pan, overlays and local persistence; no shared cloud drawings |
| Backtesting / holdout / sensitivity | Implemented | S/T: real bounded numerical engines; no future profitability claims |
| Walk-forward | Implemented fixed-parameter form | S/T: expanding development/disjoint tests; no optimizer or winner selection |
| Historical replay | Implemented | S/T/L: exact retained snapshot, supported engine and hash needed; provider authenticity stays unverified |
| Risk sizing and contract metadata | Implemented hypothetical subset | S/T/L: USD-focused generic contracts, cost/margin warnings; no brokerage contract certification |
| Portfolio-level risk / broker holdings sync | Missing | S: no durable user portfolio, covariance/stress/currency aggregation |
| Research backups / restore / comparisons | Implemented locally | S/T/L: bounded JSON preview/append, HTML export, numerical differences; user must retain backups |
| Account signup/login, sessions, RBAC | Missing in active canonical app | S: Vercel protection is not end-user account ownership; no tenant auth/database |
| SQLite persistence/authentication from Sprint 1 | Historical recovery implementation | S: preserved separately, not active/hosted; do not represent as shipped v7.1 capability |
| Paper fills, partial close and settlement | Implemented opt-in local simulation | S/T/L: isolated single-user JSON, indicative candle prices plus modeled spread; no restart-safe intent ledger or guaranteed bracket worker |
| Read-only real broker API | Not implemented end-to-end | S: adapter stubs, disabled connection routes; no actual broker contacted |
| Live execution | Explicitly disabled | S/T/L hosted-mode denial; Production functional check B |
| Deterministic committee and citations | Implemented | S/T/L: six roles, context, immutable evidence and bounded references |
| Genuine generative model path | Protocol integration implemented; quality U | S/T: synthetic Ollama-compatible HTTP fixture only; no weights/model run |
| Hosted generative inference | Explicitly disabled | S/T/L: runtime gate before local contact; no public model proxy |
| EN/AR and LTR/RTL | Implemented/tested subset | T/L: all nine sections/rendering, translated research/AI flows; manual linguistic completeness and every modal U |
| Responsive shared shell | Preserved | T/L: established geometry/zoom coverage and 108 normal section cases pass; physical devices U |
| WCAG conformance | Partial, not certified | T/L: established scans pass; additional Broker Accounts failures confirmed; screen-reader review U |
| Monitoring, distributed limits, DR/SLO | Incomplete | S/U/B: provider failures handled, small per-process bounds; no app-level operational proof |

## User-journey verification boundaries

1. Select instrument → provider request → validated closed history → native chart
   → independent briefing: S/T/L; selected real provider retrieval L-real;
   Production B. Failure/outage and rapid selection changes are covered.
2. Backtest → chronological evaluation → hypothetical risk → save complete report
   → retain snapshot → export/import → replay/compare: S/T/L using offline
   fixtures in browser; no general profitability validation.
3. Ask deterministic question → roles/evidence → save/reflection: S/T/L;
   imported evidence stays unverified. No real model involved.
4. Opt-in local sandbox → order → same-key retry → close/settle: S/T/L;
   a fresh retry key duplicates intent, no unattended worker guarantee.
5. Sign in → private cloud research → broker account/portfolio: unavailable;
   the user-facing sections do not establish this missing journey.

## Cross-cutting product gaps

- Loading/unavailable states in new modules are stronger than legacy catch/fallback
  paths. A uniform capability/error model is missing.
- Research settings, drawings, notes, Library and AI history have separate browser
  keys, bounds, export/deletion behavior and failure handling. There is no durable
  multi-device user workspace.
- Audit coverage is broad but not exhaustive. Empty-state section scans do not
  cover every open disclosure, long record, error banner, file import and modal.
  Provider fixtures intentionally avoid external dependencies; successful CI does
  not validate current provider contracts, real brokerage or public model quality.
- The original professional visual identity is retained. Further redesign is
  lower priority than honest records, consistent candles, data durability and
  core accessibility/performance fixes.
