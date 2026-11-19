# Provider qualification: owner Windows evidence and next gate

Owner evidence: PR23 comment 7013242375. This is owner-observed real network
behavior, not a cloud replay or synthetic qualification. Only aggregate totals
were supplied; row-level causes, historical calendars and licensing remain
unverified. Release approval is withheld.

| Instrument | Intervals 15m / 1h / 1d: gaps | Discarded rows | Source limitation |
|---|---|---|---|
| EURUSD | 4 / 17 / 282 | 28 / 93 / 41 | Yahoo EURUSD=X, USD; quality blocks remain |
| BTCUSD | 0 / 0 / 0 | 0 / 0 / 0 | Binance BTCUSDT, USDT; not USD Bitcoin |
| XAUUSD | 22 / 82 / 273 | 479 / 811 / 2 | Yahoo GC=F futures proxy, not spot gold |

All 27 series/brief/analyze requests succeeded (HTTP200). Each context retained
three available/recent frames, but no candidate was retained. Reachability is
partially established on that Windows device. This supersedes any inference
that providers are universally unreachable from earlier cloud-network failures.
It does not establish a valid ticket, licensing, authenticated provenance,
independent sources or real-model qualification. AI remained unavailable.

WAIT categories must not be conflated: `data_quality` records measured quality
counters; `neutral_consensus` records analytical non-direction, not failed network
access; `risk_review_required` is the separate unreviewed hypothetical-risk gate.
BTC daily additionally reported `pending_pullback` and `confirmation_pending`.
Those conditional states are not immediate executable entries. Successful HTTP200
and recent frames alone cannot override any of these independent prerequisites.

## Safe implementation

The existing adapters retain their exact filtering predicates and provider
selection. An aggregate side channel records the actual rejected-row membership:
missing OHLC, nonnumeric/nonfinite OHLC, nonpositive OHLC, inconsistent geometry,
or other adapter rejection. No bars are repaired, inserted or re-timestamped.
No financial formulas, source admission or recommendation rules change.

The original discarded-row counter covers the **full raw response**; the gap
counter covers the **retained closed-bar tail** (maximum 2000 bars). They are not
necessarily the same window. Forming/after-observation rows and older closed
rows trimmed from the tail are reported separately, never called rejections.
Rejection locations relative to the selected bounds, gap duration buckets,
UTC-weekend overlap shapes, daily 23/24/25-hour spacing and UTC hour/minute
histograms permit subsequent diagnosis without exporting OHLC.

Timezone, current-session presence, product type and reported symbol are
allowlisted provider hints. A current session or static GMT offset is not a
historical exchange calendar. Weekend overlap does not prove an expected closure;
23/25-hour spacing does not prove DST. Expected closure and unexplained-gap
counts deliberately remain null. Existing gap/discard counters and WAIT guards
remain unchanged. Reconciliation compares the breakdown against those counters. A clean selected
tail can still be blocked by rejections earlier in the full response: changing
that qualification policy requires separate evidence and review, rather than
silently clearing this increment's counters.

Diagnostics are additive to series/analyze responses and the existing loopback
audit report. The Command Center exposes them inside existing source details,
EN/AR, bound to symbol, interval, dataset hash and original counters. A changed
context cannot reuse an old diagnostic. Only aggregate fields are projected;
raw bars, rejected timestamps, arbitrary metadata and credentials are excluded.
This is diagnostic context, not provider authentication or execution authority.

## Instrument decisions requiring separate acceptance

- BTCUSD: keep the USDT/USD mismatch blocked. A separately reviewed native USD
  route could use the existing Yahoo BTC-USD adapter, subject to real observations,
  licensing, provenance and contract acceptance. No routing change is enabled.
  Alternatively USDT research needs explicit instrument/account/cost contracts;
  silently converting or relabelling BTCUSDT is not acceptable.
- Gold: keep GC=F identified as a futures proxy. Separately named futures research
  is a different product scope, and continuous futures are not a specified broker
  contract. Spot XAUUSD requires an approved, licensed spot source and independent
  acceptance. No new provider or formula is introduced.
- FX: collect the rejection taxonomy and interval metadata before proposing a
  calendar-aware qualification change. Do not clear all weekend-shaped gaps or
  null-price rows merely to make an eligible BUY/SELL appear.

## Precise next acceptance test (owner Windows, read-only)

Use this branch's new commit, a fresh PowerShell window and the existing installed
Node/dependencies. Do not start inference or install a model.

```powershell
$env:VERCEL='1'
$env:THN_AI_ENABLED='0'
$env:THN_LOCAL_PAPER='0'
node --input-type=module -e "import app from './server.js'; app.listen(3000,'127.0.0.1')"
```

In a second PowerShell window at the same repository:

```powershell
node scripts/audit-research-runtime.mjs --base http://127.0.0.1:3000 --symbols EURUSD,BTCUSD,XAUUSD > provider-audit-redacted.json
```

The collector uses all three intervals by default. Share only the aggregate audit
JSON, never raw OHLC, secrets or private account records.

Acceptance: record all nine contexts and HTTP statuses; inspect each sample's
readiness.dataQuality. Both reconciliation flags must be true where diagnostics
are present. Rejection categories must sum to discardedRows; gap shapes/duration
buckets must sum to gapCount; separate excluded/trimmed counts must not enter
rejections. Missing diagnostics or a reconciliation failure is a blocker, not zero.
Record timezone/product/symbol and metadata availability. Expected closures remain
undetermined pending independent calendar evidence. BTCUSDT must remain USDT and
GC=F must remain futures; unchanged guards must still reject incompatible scope.
Rolling feeds need not reproduce earlier totals. Do not manufacture an eligible
ticket: liveEligibleTicket remains NOT_VERIFIED until legitimate, independently
reviewed same-context data and a genuine scenario meet every existing gate.
No execution is authorized. Local synthetic CI cannot satisfy that real-data gate.

Next: review these aggregates, then propose a narrowly scoped calendar or native
instrument contract only where evidence supports it. Real AI remains a separate
local-device qualification gate with strict citations and the unchanged12s deadline.
