# AI, market and trading validation contract

Current analysis is deterministic indicator/confluence logic with optional AI
narrative. Confidence is heuristic confluence, not a calibrated probability.
Historical backtesting is unavailable; display no invented win rate, equity curve,
return or profit factor. Fixture prices belong only in isolated tests.

AI may add bounded narrative, action-plan text and warnings. Schema, timeout and
request budgets must reject malformed/extra numeric fields and retain original
entry/stop/target levels across success, failure, timeout and throttling. The
server alone owns secrets; disabling AI cannot break deterministic analysis.

Market validation requires exact requested instrument/currency identity, verified
provider timestamp, quote age and valid closed-bar history. Futures Gold can be
disclosed as an indicative analysis proxy; it cannot authorize XAUUSD paper fills.
Provider quotas, outages, closed markets and sparse history must degrade honestly.
Retry-After/coalescing correct request behavior but do not guarantee provider access.

Paper orders require an authenticated owner, paper/trading permission, server-owned
account balances, exact executable pricing, volume/stop/margin/currency and risk
budget enforcement, transactional idempotency and durable fills. Limits remain
pending until crossing; exits and partial lots preserve accounting. External
broker adapters must reject execution under every configuration.

Fixture tests validate software invariants, not profitability, licensed market data
quality or realistic order fill rates. Required future evidence includes approved
provider observations, venue calendars, benchmark indicator datasets, costed
historical simulation with walk-forward isolation, and paper execution observations
with reconciliation. Record dataset/version, source, time window, costs and failure
rates. Never extrapolate a local test pass into a promise of return or live readiness.
