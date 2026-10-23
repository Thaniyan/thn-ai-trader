# v7.5.0 — Research trust and consistency

Local implementation milestone on `feature/research-trust-consistency-v75`, directly based on canonical v7.4 commit `9fa6b69d5b36a0cdcb99e627674fe6d4e2cfb22a`. This is a descendant of the original canonical history, not a new sanitized Git root. No release is authorized by this document.

## Findings and implementation

| Finding | Status | Correction and evidence |
| --- | --- | --- |
| F01 Unsupported narratives | Fixed for generated/presented research | Legacy server reasons no longer infer institutional identity, accumulation/distribution intent or calibrated rebound probability from price patterns. SMC presentation describes observed range/three-candle rules as heuristics. Numerical inputs/thresholds remain inspectable. Original saved bytes remain historical and unverified, rather than being edited retrospectively. Narrative regression checks run against generated API results and source strings. |
| F02 Context / history | Fixed | THNContext remains the sole selected instrument/timeframe owner. Request generations prevent an older A→B→A analysis response from winning. New ideas retain immutable provider/hash/time/method identity. Save and complete-report export require the exact selected dataset. Retained legacy presentations are marked HISTORICAL with origin/method; Journal records are historical, never current recommendations. No old records are migrated into new tickers. |
| F03 Hosted execution | Fixed | Health capability fails closed while unknown/unavailable. Broker and direct-order controls are actually disabled; a capture guard prevents programmatic UI activation. Read-only scrollable tables remain keyboard accessible. Existing operator-local capability can restore only controls disabled by this gate, preserving original permanently disabled controls. All server restrictions remain. |
| F04 USD / USDT identity | Fixed | Shared explicit identity has requested/canonical instrument, base/quote, product description, provider instrument/currency, unknown venue, proxy status and limitations. Missing observation currency stays unknown. Yahoo BTC-USD/ETH-USD are conspicuous USD proxies for requested USDT. Reverse USDT observations cannot silently become USD planning either. Native USDT or mismatched research-currency planning is rejected. Legacy proxy contract estimates/scenario amounts are not presented as usable plans. |
| F05 Independent TradingView | Fixed | Strategy B: public embed remains independent. An always-visible source/context warning and separately labelled pinned THN rail distinguish internal widget changes from THN selections. No private iframe inspection or false bidirectional synchronization. Official widget initializer is byte-identical to v7.4. |
| F06 Routes | Fixed | Initial hash, hashchange and popstate restore the visible view. Normal navigation creates history entries; restoration uses replacement only when normalization is needed. Unknown hash selects Dashboard. Removed the legacy dashboard fragment collision that otherwise auto-opened advanced terminal contents. All nine reload/direct routes plus back/forward are covered. |
| F07 Risk errors / stale estimates | Fixed | Idle/pending/valid/rejected/stale states. Direction-specific BUY/SELL stop errors; native-USDT explanation is restricted to relevant failures. Changing inputs clears the prior plan/levels. The old independent client cost calculator is retired: its readout uses the current validated server result only. |
| F08 Total budget | Fixed within explicit cost model | Input validity, nominal risk, assumed costs, total exposure, budget compliance and unavailable execution are separate. Primary Risk and Terminal summaries explicitly flag OVER BUDGET. Optional proportional-cost-inclusive sizing rounds lots down using existing contract increments and risk calculations, rejects infeasible minimums, and never silently changes nominal sizing. No actual spread/fee schedule is claimed. |
| F09 Comparison units | Fixed | Normalized comparison curves explicitly say index/base 100, not USD, in EN/AR captions and accessible labels. Export metadata distinguishes displayed comparison index units from raw hypothetical USD equity. Backtest math is unchanged. |
| F10 Indicators | Fixed by explicit method distinction | Legacy RSI14 = simple rolling last 14 close changes; legacy ATR14 = simple rolling last 14 true ranges. THN Research uses full-window Wilder smoothing, RSI first seeded at index 14 and ATR at index 13 (first true range is high-low). Both EMA implementations use SMA initialization then alpha=2/(period+1); warmup/window/hash are attributable. Raw arrays remain unrounded; legacy display/API precision remains documented. Independent recurrence/seed fixtures and browser cross-checks verify this distinction. |
| F11 Assistant contract | Fixed | Provenance/mapping/currency/freshness/method questions return actual frozen snapshot sources, symbols, timestamps, hashes, missing frames and methods even when directional evidence is insufficient. Unsupported questions receive an explicit limitation and supported alternatives. Six-role research remains available; no model or new tool authority. |
| F12 Runtime locale | Fixed for application-owned states | Active notice identity survives static translation (which previously replaced success with Ready). Stable notice keys and original bilingual pairs rerender success/failure/loading messages. Assistant/Library/decision/evaluation messages retain their actual state on language change. Risk rejection, save success and pending/success paths are exercised. Historical user-authored text and original model/research responses are not translated into invented new evidence. |
| F13 Widget fallback | Fixed | Always-visible neutral independent-source line; status, troubleshooting, external official link and THN fallback live in a compact native disclosure. No candle success is inferred from script/frame readiness. Existing retry, timeout and detached-script handling remain. |
| F14 Duplicate workflows | Fixed for active journey | Existing presentation owners remain; no framework, state store or extra presentation adapter. Discover → Chart → Evidence → Evaluate → Risk → Save/Review uses one THN context. Original specialized tools remain in Advanced/Diagnostics, with origin/method labels. Independent client cost estimates are removed; readouts use one server plan. Public TradingView remains deliberately independent. |
| F15 Versions / precision | Fixed for new exports | applicationVersion=7.5.0, unchanged compatible schemaVersion, and actual analysisEngineVersion are separate in new analysis, report, backup, evaluation, experiment and committee exports. Human OHLC uses instrument-aware price formatting; raw numeric exports remain full precision. Legacy imported metadata is retained, not retroactively relabelled. |

## P1 causes and ownership

F01 came from legacy scoring narrative strings and separate SMC copy, not the protected research engine. The fix changes claims, not weights or numerical rules.

F02 came from separate legacy analysis lifetime and selected context, plus a symbol/timeframe-only asynchronous check that permits A→B→A races. Generations now guard completion and cleanup; exact dataset identity gates saves. The delayed-response regression uses genuine HTTP analysis responses with different user risk inputs, never injected analysis objects.

F03 came from unavailable server capabilities coexisting with enabled legacy CTAs. The existing professional workspace now gates these controls from health. A first attempt to disable the entire fieldset failed keyboard-scroll accessibility; it was replaced with capability-bound controls, preserving read-only table focus.

F04 came from intentional provider aliases being treated as native contracts. Identity is now explicit at server catalog/analysis and existing UI owners. It neither assumes USD/USDT parity nor invents exchange/venue. Planning rejects unsupported/native or mismatched currencies before presenting a position.

F05 is a documented public-embed capability boundary: internal iframe controls cannot be read back through a supported API. We selected explicit independence instead of unsupported synchronization. Owner Production observation that actual candles work is preserved; local protocol fixtures are not represented as external candle tests.

## Numerical acceptance

For EURUSD BUY, capital $10,000, risk 0.5%, entry 1.10000, stop 1.09500, target 1.11000, leverage 20, spread/slippage/commission each 1 bps:

| Sizing | Lots | Nominal stop | Estimated costs | Total exposure | Budget | Compliance |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Existing nominal | 0.10 | $50.00 | $5.50 | $55.50 | $50.00 | Over budget |
| Optional cost-inclusive | 0.09 | $45.00 | $4.95 | $49.95 | $50.00 | Within estimate |

The wrapper calls unchanged createPlan/calculateOrderRisk and handles the current explicit proportional-bps model. Funding, borrow, gaps, minimum/fixed/nonlinear broker fees and actual fills remain unknown. It cannot enforce a real execution budget. Additional tests cover BUY/SELL, three capital levels, cost levels, minimum-lot rejection, malformed flags, USDJPY conversion and XAUUSD/BTCUSD/US30 increments. Independent RSI/ATR recurrence and EMA seed fixtures are checked without using model self-evaluation.

All six protected sources match the approved baseline byte-for-byte: research, backtest, evaluation, decision, replay and base research chart. See committed `v75-evidence/preservation.json`.

## Validation and visual evidence

See `V75-VISUALS.md` and `v75-evidence/validation.json` for the completed gates, original PNG hashes and explicit test limitations. The new consistency browser suite is part of the standard mandatory runner; no existing suite/check is removed. Tests use pinned local Chromium/Playwright/axe and explicit offline provider/widget fixtures, not simulated claims of live connectivity.

Initial failing runs are retained externally under `/workspace/work/v75-evidence`. They exposed the unavailable CTA assumption, recovery-disclosure test paths, disabled-fieldset keyboard scrolling, long-hash mobile overflow, and active-status translation ordering. Functional assertions were preserved or strengthened; tests open actual native disclosure summaries and do not force-click hidden controls or fabricate analysis/records.

## Remaining limits and release boundary

Actual external TradingView candle availability/latency and live Production behavior are not reverified by this local milestone. The owner independently observed working candles in Production; initializer bytes are preserved. Fresh hosted CI and owner Chrome acceptance remain release gates after a separate exact-SHA approval.

Records remain browser-local/unencrypted and user controlled; hashes identify data, not authenticity or account execution. Older records may lack identity fields and are displayed as historical/unverified. No background worker or durable hosted account capability is implied. No model is activated or downloaded, no broker connection is enabled, and no new paid resources are used.

No push, PR, merge, deployment, hosting/security/billing change or Production mutation belongs to this task.
