# P2 — Attributable source correction and independent-source qualification

Implementation-ready proposal for existing draft PR23. Owner scope:
[comment7076985015](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7076985015).
[Verified redacted P1 evidence](evidence/eurusd-p1/owner-windows-verified.json)
closes the source-stage investigation; no generic diagnostic extension or repeated
owner fetch is needed. This plan creates no source access or financial permission.

## 1. Established result and the actual blocker

At62ea56ad, the owner's real Windows capture contains36 invalid Yahoo EURUSD=X
OHLC records in1305 raw rows. The mapper retained1264 after rejecting36 geometry
and5 missing rows. The reviewed mapper and closed-bar/API hashes agree.
Proximate origin is SOURCE_RESPONSE, not a demonstrated app transformation defect.
Yahoo/upstream construction cause and individual earlier historical36-record
identity remain unestablished. Never infer rounding, adjustment or a holiday cause.

No application price repair is justified. Vendor-corrected data or an approved
alternative source is required to resolve this input defect. Even resolving all36
would not automatically resolve the5 missing rows, historical session gaps,
source/contract rights, freshness, consensus or risk prerequisites. Existing
zero-gap/zero-discard admission remains in force. A clean FX replacement may
still have legitimate session gaps; source qualification is distinct from a
separately reviewed calendar/admission policy. No eligible setup is promised.

## 2. Next deliverable: private case-disposition and source-contract comparison

Build one offline, operator-local case comparator **after lawful inputs and the
source contract are available**. It consumes the owner's existing private original
and one attributable corrected revision or approved independent snapshot. It
makes no network requests, changes no prices and has no production/admission hooks.
This is a case-resolution workflow, not another telemetry layer or audit fetch.

Proposed deliverables:

- A source-contract review record with explicit approved/pending/blocked decisions.
- A private36-case ledger anchored to the09:09 capture's original body hash, with
  exactly one disposition per case and a redacted aggregate report.
- One bounded offline comparison command plus controlled regression fixtures,
  excluded from production packaging. No new UI, provider route or financial code.
- A disposition recommendation: accept an attributable source revision as new
  research input, continue to reject unresolved data, or qualify a replacement
  source for a separately approved integration candidate.

The original body SHA256 is
`d0b0435ff1b685a250c60d208fda058d44aff8c69bab744f3074dc64b55add0d`.
Use it locally to verify the original, not to request its upload. This defines the
**current capture cohort**. Matching mask/count patterns do not identify the older
05:18 cohort. No retrospective identity claim is permitted without private evidence.

### Private evidence and matching contract

Keep original body/hash sidecar unchanged outside Git; preserve every revised or
reference body separately with SHA256, capture/receipt time, source identity,
revision/methodology identifiers and applicable rights record. Never overwrite an
original or silently rewrite a saved Library report. All new evaluations use
explicit new dataset/source versions and retain the prior research context.

Match private cases by the documented provider instrument, interval and canonical
bar-open key under the **same** session/quote/adjustment convention. Never match by
row index alone after a rolling window changes. Duplicate keys, missing timestamps,
changed bar boundaries, quote sides or ambiguous revisions stop case attribution.
Do not shift timestamps, resample, interpolate or mix OHLC fields to force a match.

Each of the36 current-capture cases must receive exactly one disposition:

1. Attributable source-corrected record, strictly valid under unchanged checks.
2. Still invalid in the supplied revision.
3. Missing/out of revision coverage — not evidence of correction.
4. Identity or bar semantics incompatible — comparison withheld.
5. Duplicate/ambiguous matching or revision attribution unavailable.

Public output is aggregate dispositions, hashes, reviewed contract identifiers
and pass/fail/unknown states only. No prices, individual keys/timestamps, source
files, account/license secrets or private paths enter Git or PR comments. The
owner keeps any record-level ledger privately. A hash is tamper evidence, not
proof of price accuracy, source independence or a license.

## 3. Path A — attributable correction from the existing source

Safe preparation now: the owner-reviewable vendor brief below and acceptance
contract. Existing authorized private read-only inspection remains permitted;
no further capture is requested. **Vendor outreach or private-data submission
requires explicit owner authorization**, including recipient and sharing scope.
No message is sent by preparing this package.

Vendor brief:

- Identify EURUSD=X/CURRENCY/USD,1d, requested5y history; code62ea56ad and capture
  2026-11-22T09:09:27.231Z; public body/dataset hashes and redacted36-case table.
- Explain that quote OHLC fields were assigned directly, no adjclose substitution
  occurred, and the validated closed-bar/API output preserved values.
- Ask whether all quote arrays use the same instrument/feed, timestamp/session,
  quote side and adjustment convention; ask what close represents and how source
  corrections are versioned. These are questions, not a claimed root cause.
- Request an attributable corrected source revision and bar-construction/correction
  methodology, not permission for the app to clamp values. Any private examples
  are supplied only by the owner within the approved license/sharing scope.
- Obtain an explicit lawful-use position for ingestion, local/hosted storage,
  derived research, redistribution, retention and any permitted vendor support use.
  Existing endpoint accessibility does not settle those rights.

Correction acceptance: all36 cases accounted for; any claimed corrected record
must be supplied by the source, match unambiguously, carry attributable revision
context, and pass the original finite/positive/OHLC/ordering/cadence/closed-bar
checks with no tolerance. Partial correction is reported as partial; uncorrected,
absent or ambiguous cases stay unresolved. Disappearance from a rolling response
is not correction. No local record is manufactured or repaired.

Decision exit: if correction/rights cannot be established, stop waiting for more
aggregate diagnostics. Keep Yahoo daily FX restricted and choose Path B or retain
its current blocked research scope. New input can change indicators/backtests;
version it and never imply old historical results were retrospectively repaired.

## 4. Path B — legally approved independent historical source

Owner must select an existing lawful entitlement or explicitly approve a vendor,
product, endpoint/access scope and cost cap before any new upstream request.
No provider is selected/connected and no license or price is assumed in this plan.
A read-only existing-source permission is not approval for a different vendor.

Required contract, settled **before** implementation or capture:

|Dimension|Required evidence / fail-closed condition|
|---|---|
|Rights|Named rights holder and terms/version covering historical ingestion, local and hosted use, storage/backup, derived outputs, display/redistribution, retention/deletion, geography and support sharing. Account/subscription/API availability alone is insufficient. Unknown rights block acquisition/use|
|Identity|Actual provider symbol, EUR base/USD quote units, OTC spot versus CFD/future/composite, venue or upstream feed and quote basis. Do not compare unlike products as equivalent|
|Independence|Declared upstream/venue lineage distinct from Yahoo's source where known. Query2 Yahoo, an embed or an undisclosed white-label mirror is not proven independent. Unknown lineage stays unestablished|
|Bar semantics|1d session boundary and timezone/history rules; bar-open versus close timestamps; bid/ask/mid/trade/indicative basis; adjusted versus unadjusted fields; missing/placeholding rules; volume meaning; corrections/revisions. Obtain15m/1h contracts before any multi-frame integration|
|Coverage|Exact historical window, required closed-bar count and duplicate/order policy; maintenance/holiday/exception coverage and publication delays. No assumed UTC24h grid where the source uses another session boundary|
|Quality|Original strict numerical/geometry checks; source clock and actual observation age; null/rejection/gap accounting. Do not zero counters or relabel a closed-market observation fresh|
|Budget/access|Explicit permission for host/endpoints, request limits, retention and one bounded approved capture; published or quoted costs reviewed by owner. No free-tier/commercial-rights assumption or paid activation|
|Comparison|Private immutable snapshots and hashes; semantics compatible before value comparison. Owner-approved venue/side/time/error budgets specified in advance; no invented universal price tolerance|

A different OTC venue can publish different valid prices. Independence/price
agreement does not establish Yahoo's internal cause. Conversely a valid alternative
may qualify as its own research source even when direct case matching is impossible;
report NO_COMPARISON for incompatible bars, not an estimated Yahoo correction.
Never copy a reference close/high/low into the original record or stitch vendors.

Independent-source qualification is a contract/data decision, **not** production
routing or eligibility approval. A later integration diff needs explicit owner
approval, consistent source identity across frames/caches, preserved source failure
semantics, immutable saved reports and full release gates. No engine change follows.

## 5. Measurable regression and real-data acceptance

|Case|Required outcome|
|---|---|
|Original36 geometry pattern, including19 below1bp|All still fail unchanged strict validation; no rounding, clamp or calendar excuse|
|Original private body altered or wrong hash|Stop before comparison; never overwrite/replace the evidence anchor|
|Revision corrects all36 with attributable matching keys|Exactly36 valid corrected dispositions; original unchanged; new dataset/hash; other data/eligibility blockers separately retained|
|Revision corrects only some records|Exact partial counts; all36 dispositions sum; unresolved cases stay blocked|
|Old bad row disappears outside revised lookback|Missing/out of coverage, not corrected|
|Duplicate key, changed daily session, quote side or adjustment convention|Withhold case attribution; no row-index matching or implicit resampling|
|Independent reference has different valid prices|Assess its contract and agreed budgets; never rewrite Yahoo or infer causation from disagreement alone|
|Reference uses same upstream or lineage is unknown|Do not claim independent confirmation|
|Null/malformed/stale/unavailable source evidence|Original guards remain; no fabricated values, age reset or placeholder exemptions|
|License, source identity or private retention scope missing|Block acquisition/qualification step; no automatic provider activation|
|Corrected geometry but missing rows/session gaps or neutral/risk conditions remain|No automatic eligible Ticket; every original requirement remains enforced|
|Imported or saved old research after revision|Immutable original/provenance; any new evaluation explicitly separate|
|Comparator output|No raw prices/record IDs/timestamps/private paths or license secrets; tests inspect exports for leakage|
|Software acceptance|Controlled positive/negative fixtures, original regressions/security and packaging/integrity pass; comparator has no network, production route, price-repair or admission side effect|
|Real-data acceptance|Owner-local immutable pair, complete36-case accounting or explicit NO_COMPARISON, signed-off source contract and redacted disposition report. Synthetic tests are not real-source qualification|

## 6. Separate instrument decisions remain open

- **Native USD Bitcoin:** current Binance BTCUSDT/USDT is not BTCUSD/USD. An isolated
  qualification of existing Yahoo BTC-USD or a selected licensed native-USD source
  needs source/rights approval first. Require actual USD/product identity, all
  interval semantics and failure behavior with no USDT-as-USD fallback. A distinct
  USDT product needs separate account/valuation/contract approval. No route changes.
- **Genuine spot XAUUSD:** require licensed spot XAU/USD in USD per troy ounce and
  explicit quote/venue/composite/bar contracts. GC=F futures, broker CFDs and daily
  benchmarks cannot silently substitute. Existing Exness account snapshots are
  not a historical OHLC entitlement. Owner selects product, lawful source and cost
  scope before access; any broker risk contract remains independently reviewed.

These source choices can be reviewed in parallel with EURUSD correction; they do
not authorize purchases, credentials in chat, new endpoints or an eligibility lift.

## 7. Decisions and next implementation-ready milestone

**Next milestone: P2 private source-case comparator and contract acceptance.**
The deliverable is one offline operator command, a fixed source-contract schema,
a36-case private disposition ledger/redacted report and regression fixtures. It
consumes existing approved files only, makes no upstream requests and modifies no
app/financial code. No new generic diagnostics, UI panels or fetch campaign.

|Owner decision|Specific scope|Not included|
|---|---|---|
|A. Correction route|Approve vendor recipient/contact and any permitted private evidence sharing, or choose restricted Yahoo research if not actionable|No message, private upload or source repair is authorized by this plan|
|B. Reference source|Select vendor/product/entitlement; approve lawful historical access, endpoint scope and spending/retention limits|No new provider, subscription or route activated|
|C. Input contract|Supply/approve revision attribution or reference bar semantics/rights so the offline comparator can be implemented against real contracts|No invented semantics, repeated source fetch or public raw-file request|
|D. Later application adoption|Review an isolated proposed integration only after real-data/source acceptance|No eligibility, freshness, calendar policy, financial engine or saved-record rewrite automatically follows|

Safe now is this evidence update, case brief, schema/acceptance specification and
implementation plan. Offline comparison with lawfully available inputs is within
the current read-only scope once the concrete input contract exists; it does not
need a new financial permission. New outreach/access/cost and any later financial
or admission change require their explicit approvals. No runtime patch is justified
for a mapper/engine path that preserved its tested source values correctly.

Genuine local-model qualification remains an independent gate after stable source
contracts: no model may repair data or override WAIT. Current approval does not
activate AI, paid/hosted inference, install models, enable trading, merge main or
deploy Production. PR23 remains draft and release approval remains withheld.
