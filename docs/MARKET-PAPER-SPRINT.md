# Sprint 2 — market data and paper execution

Local feature branch: `feature/market-paper-reliability`, based on UX commit
`3bd670e1516a51afe5db1298a3d3b06bfa5b1f1f`. Reconciliation and UX refs are preserved.
Publication remains NO-GO; this sprint authorizes local implementation only.

## Implemented behavior

- Yahoo chart quotes must supply a numeric positive quote, valid quote timestamp,
  currency and matching instrument. Forex currency must match the pair. Removed
  last-candle-close and USD defaults: missing evidence now fails closed.
- Provider timestamps remain separate from first observation and current evaluation.
  Five-second cache hits retain original `quoteAt`/`observedAt`, expose
  `delivery: CACHED`, and re-evaluate quote and closed-candle age. Quote maximum age
  is 120 seconds inclusive, with at most one second of future clock tolerance.
- `provenance.dataType` is `LIVE`, `DELAYED` or `DELAY_UNKNOWN`; cache delivery,
  stale/current status, proxy identity and simulated execution are separate axes.
  LIVE means provider-indicated delivery, not an exchange/broker entitlement claim.
  Yahoo's `exchangeDataDelayedBy` is minutes, converted to seconds; declared delay
  blocks paper execution and actionable analysis even with a recent timestamp.
  Missing delay metadata remains explicitly unknown; fresh timestamp evidence can
  support paper execution, without claiming verified live exchange delivery.
- Readiness exposes per-host last transport/validation state, measured request
  latency, check age and timeout/rate-limit/connection/invalid-response codes.
  RESPONDED means JSON transport succeeded, not continuous connectivity or valid
  pricing for every instrument. Readiness is the last observed instrument, not a
  whole-market SLA. No background connectivity probe or synthetic fallback added.
- Preserve the existing four-active/32-queued request bounds, request coalescing,
  five-second cache and provider Retry-After cooldown. Existing 429 behavior remains.
- Paper pricing rechecks candle age at use and quote freshness after asynchronous
  currency conversion. Exposure refresh revalidates all captured markets before
  applying marks. Proxies, stale, delayed and unavailable data cannot create fills.
- `paper-fixed-v1` centralizes the existing 0.4-pip adverse offset on each side
  (0.8-pip modeled round trip). Additional slippage, commission and financing are
  explicitly zero assumptions. This is not an observed spread or realistic broker
  fee schedule. Every new fill/position records the model and input provenance.
- Immediate equity includes modeled spread loss. Admission reserves enough free
  margin for both margin and this loss. Partial closes mark the remaining volume
  at the actual fresh paper exit quote rather than retaining full-position PnL.
- Pending-order admission validates server-side even at the adapter boundary;
  only execution fields are retained, excluding arbitrary client properties.
  Pending ticket and order ID are correlated. Each worker fill rechecks risk,
  other reservations, used margin and equity; a known validation rejection removes
  only that pending order. Unexpected failures retain transactional rollback.
- Expiration is audited once instead of silently deleting an order. Acceptance,
  fills, rejection, cancellation, expiry and manual/protective closes are durable
  append-only SQLite audit events. Provider refusals explicitly commit their audit
  outcome while retaining the established HTTP502 contract; no fill is produced.
- New authenticated `GET /api/orders/history?accountId=...&limit=100&before=...`
  returns account-owned lifecycle events newest first, with bounded cursor pages.
  It reads existing audit storage, with no schema migration. Legacy events cannot
  retroactively acquire missing metadata. Successful order/close idempotency and
  serialized transactions remain in place; no live adapter was enabled.
- Removed invented one/two-millisecond paper connection latency values.

## Validation and reproduction

From the repository root, Node 24.x >=24.5 and Python/Chromium/Playwright installed:

```sh
npm run build
npm run lint
node --test --test-concurrency=1 tests/*.test.mjs
node tests/run-system.mjs
python tests/browser.test.py
python tests/release-browser.test.py
WORKSPACE_QA_OUTPUT=/tmp/thn-sprint2-browser-new python tests/workspace-ux.browser.py
AXE_PATH=/workspace/.tools/reconciliation-qa/node_modules/axe-core/axe.min.js \
  ACCESSIBILITY_OUTPUT=/tmp/thn-sprint2-accessibility-new.json python tests/accessibility.test.py
```

Use unused output paths. Full evidence resides outside source under
`/workspace/reports/market-paper-sprint`. Test providers are process-local fixtures
loaded only by isolated test subprocesses. Tests create disposable SQLite state;
fixture control files and synthetic tokens never enter application runtime code.

Nineteen new tests cover inclusive age thresholds, future clocks, cached observation
identity, missing/wrong evidence, malformed JSON, timeout/outage/429, stale history,
provider-declared/invalid delay, adapter validation and payload minimization, spread
margin, concurrent duplicate requests, ownership, cursor bounds, restart durability,
worker expiry/reservations and original-quote expiry during currency conversion.
The existing security/system/browser suites remain required. The first full run
found two regressions introduced during this sprint: generic rejection text hid the
specific proxy cause, and an unsolicited Retry-After cap changed the existing
contract. Both changes were corrected; assertions were preserved. Initial failure
logs remain in the evidence directory.

Validated results: build and lint pass (18 syntax targets); 84/84 Node tests
(including 19 new), 10/10 system tests, broad CSP browser regression, 137/137
responsive EN/AR workspace checks and 11/11 release-browser checks pass. The
configured accessibility scan passes across 18 EN/AR views. No tests were skipped.
Secret review found zero strong credential-pattern findings or runtime artifacts
in 124 proposed/tracked files; `.env.example` has empty credential fields. This is
not exhaustive secret detection or a historical purge.

## Limits and next sprint

All execution evidence is simulated against local provider fixtures. No live-market
observation, real broker fill, paid AI, Windows/WSL2 or hosted deployment was tested.
Yahoo/Binance access, quotas, venue clocks, exchange calendars, delayed entitlements
and out-of-order upstream delivery remain provider/operational limitations. Exact
Gold spot/CFD execution remains blocked because GC=F is a futures proxy. Binance
USDT and Yahoo USD remain distinct; unsupported settlement is refused.

Fixed costs ignore depth, liquidity, latency, swaps and price-impact distributions.
SL/TP executes only when the worker observes a valid fresh quote; it does not invent
missed intrabar execution or guarantee stop prices across gaps/outages. During an
outage, old marks remain historical values with degraded/unavailable pricing status;
no fresh equity claim or substitute fill is warranted. SQLite remains single-writer;
process-local sessions/budgets are not distributed infrastructure. Order history is
available through the API; a dedicated lifecycle/history UI is a following sprint.

Next: expose these provenance/diagnostic/history fields in EN/AR UI, add a separately
approved read-only provider observation campaign and venue/calendar validation,
then configurable reviewed cost models and historical execution evaluation. No
publication or integration changes are authorized by this recommendation.

## Recovery and cloud reset

Completed work is committed locally; existing reconciliation and UX branches remain.
Recovery bundles and SHA-256 manifest are prepared under
`/workspace/releases/sprint2-recovery/` for both source checkouts. Bundles contain Git
history and refs, not untracked runtime state, keys, databases, local Git config or
node_modules. Historical original Git objects include the legacy tracked account/
audit files already documented in reconciliation; treat full-history bundles as
private recovery material, never as sanitized public release packages.

Bundle verification and a disposable clone/fsck restore rehearsal are required.
After copying the recovery directory to durable private storage, from that copy:

```sh
sha256sum -c SHA256SUMS
git bundle verify reconciled.bundle
git clone -b feature/market-paper-reliability reconciled.bundle thn-restored
cd thn-restored
git remote set-url --push origin /dev/null
git fsck --full
```

A bundle clone imports other branches as remote-tracking refs; recreate local refs
from `REFS.txt` as needed. `staging.bundle` independently preserves the unrelated
staging history. The bundles are source recovery only, not a trading-state backup.
**Workspace refs and bundles can all disappear together on a Codex reset.** Local
commits are not durable off-environment backups; export the verified private bundles
before reset, or separately authorize publication after isolation review. This
sprint does not upload them, access WSL2 or perform any remote mutation.
