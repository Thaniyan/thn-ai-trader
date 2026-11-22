# Provider resolution and approval plan — 22 November 2026

Decision package for existing draft PR23, based on application commit
`57eee183dcb39426b946efe00f2e9ba8bed35a82` and
[owner comment7074717568](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7074717568).
The Windows audit was captured at2026-11-22T05:18:28.718Z (09:18 Muscat), on Sunday.
It is owner-supplied real-feed evidence, not a Cloud replay. No raw prices,
individual rejected timestamps, secrets or accounts are reproduced here.

**Decision:** diagnostic collection is complete for this investigation. Do not
add another generic instrumentation cycle. No runtime correction is justified
by these aggregates alone without changing a source, qualification rule or data.
The safe work now is to fix the resolution scope, acceptance cases and approval
boundaries below. This document authorizes none of the proposed runtime changes.
Existing UI, strict validation, financial engines and every restriction stay intact.

## 1. Evidence that closes the diagnostic phase

All9 contexts returned200 for series/brief/analyze. All18 original reconciliation
flags and72 detailed checks passed. Every candidate remained absent, AI unavailable,
execution unauthorized and calendars/provider authentication unverified.

|Context|Gap count|Missing OHLC (all four null)|Geometry rejects|Assessment phase|
|---|---:|---:|---:|---|
|EURUSD15m|4|34|0|stale|
|EURUSD1h|16|94|0|stale|
|EURUSD1d|281|5|36|ready|
|BTCUSD15m /1h /1d|0 each|0 each|0 each|ready|
|XAUUSD15m|21|470|0|stale|
|XAUUSD1h|80|808|0|stale|
|XAUUSD1d|272|2|0|ready|

Here `ready` is an assessment lifecycle phase, **not** an eligible Ticket.
Sunday stale FX/futures observations do not establish a feed outage. They also do
not certify an exchange calendar or become fresh merely because a closure seems
likely. Neutral consensus, incomplete current frames and unreviewed hypothetical
risk remain separate blockers after any future data-quality resolution.

### EURUSD geometry: a concrete source-quality problem

|Comparison mask|Rows|Actual strict boundary failures|
|---|---:|---|
|2|6|High below close|
|3|12|High below open and close|
|8|7|Low above close|
|12|11|Low above open and close|

All36 closes are outside the supplied high/low range.23 opens are also outside
it;13 rows fail only the close comparison. No high/low range is inverted.
These describe the supplied fields, not a diagnosed vendor root cause.

Breach-size counts are19 in[0.01,1)bp,16 in[1,10)bp and1 at least10bp; none is
below0.01bp. The scale is relative to maximum OHLC, not an admission tolerance.
Do not call these floating-point noise, clamp extrema, swap fields, interpolate,
substitute a close, mix adjusted/unadjusted fields or change strict comparisons.
The inspected Yahoo adapter maps quote.open/high/low/close directly; it does not
apply an adjusted-close transformation. Raw source records were not supplied,
so adjustment, rounding and bar-construction explanations remain hypotheses.

Daily gaps partition as3 missing-only,34 geometry-only,1 mixed and243 without a
known rejected timestamp:281 total. All5 missing and36 geometry rows lie inside
gaps.35 gaps contain geometry rejects,38 contain some known rejected row. This
is co-occurrence, not proof of cause. The calendar-overlap totals260 weekend /21
other do not provide a cross-tab with these quality categories: do not subtract
35 from either group or declare the other243 gaps scheduled closures.

### Intraday nulls and sessions

All4 EURUSD15m and16 hourly gap shapes overlap UTC weekends. The known missing
rows occur inside every counted intraday gap.15m nulls split28 inside selected
bounds /6 after; hourly nulls split76 before /17 inside /1 after. Longest response
runs are10 and67. These are all-four-null records, not confirmed harmless calendar
placeholders. Nulls before/after the selected window must remain distinguishable
from nulls within it. Current eligibility still uses full-response discardedRows.
Changing that scope is a separate policy decision, not a counter correction.

Ten daily gaps cross timezone offset changes. This is not proof of DST-caused
closures. Yahoo GC=F's all-null records and intraday gaps likewise do not establish
spot gold history or a verified futures-maintenance schedule.

## 2. Prioritized work and exact approval boundary

|Priority / deliverable|Safe now|Approval needed to proceed|Measurable completion|
|---|---|---|---|
|P0 Close collection; publish this decision package|Yes: record measured cases, inspect code, retain current blockers; no new runtime instrumentation|None for this review package|9/18/72 evidence fixed; unknown causes labelled; runtime source unchanged|
|P1 Resolve36 geometry cases at source|Prepare the aggregate brief; inspect lawfully available existing-source records read-only; keep anomalies rejected|No extra approval for already-authorized read-only access. Explicit approval is needed for vendor contact, expanded private-data handling or new access/source scope|Each disputed record gets a source disposition; only newly supplied, strictly valid, attributable source corrections can enter a new dataset|
|P2 Reconcile FX history to an applicable calendar|Specify cases now; an isolated non-admitting comparison is safe once lawful matching inputs exist|Data owner supplies the lawful source-matched schedule; new acquisition/access/cost needs approval. Admission/freshness/engine changes always require separate explicit approval|Complete interval/window coverage; every gap has coverage and quality states; zero hidden counters, repaired bars or newly eligible Tickets|
|P3 Native USD Bitcoin|Choose among the reviewed alternatives in section5; keep USDT mismatch blocked|Owner selects lawful source/contract and authorizes isolated read-only qualification; routing requires later separate approval|Actual USD/product identity, rights and all three histories verified; no fallback to USDT under USD identity|
|P4 Genuine spot XAUUSD|Fix the required product/source terms in section6; keep GC=F proxy blocked|Owner selects licensed spot entitlement/vendor and approves access/cost cap; later route/contract sign-off|Documented spot XAU/USD, units, quote side, session/bar semantics and rights; no futures/CFD substitution|
|P5 Independent real-model qualification|Review existing qualification contract and offline fixtures only|Explicit bounded local-inference authorization using an already installed lawful model; no installation or hosted/paid inference|All mandatory EN/AR/citation/context/deadline cases pass; otherwise NO_GO and deterministic fallback|

P1 read-only review and calendar-contract review can proceed in parallel within
existing access and rights; only expansions need new authorization.
Do not postpone the real geometry defect behind calendar work. Bitcoin and gold
rights/product decisions can be made independently; they do not depend on FX
calendar approval. No step authorizes merging, Production or financial execution.

## 3. P1 source correction, not price repair

Prepare a case brief now using only approved aggregates: source EURUSD=X/CURRENCY,
interval1d, source commit/capture time,36 strict violations, mask/severity tables,
zero inverted ranges, and the fact that the mapper reads unadjusted quote OHLC.
It asks whether the source will supply corrected records and documented revision/
bar-construction semantics. Do not invent a ticker-specific root cause or promise
that every case is correctable. This package sends no vendor message.

Within existing lawful access, the owner/operator can privately identify the
36 disputed source records. No new permission is needed to inspect already
authorized records read-only; the posted aggregates simply do not contain them. A single bounded comparison
of the existing source's same instrument/interval against its own corrected or
versioned response is a source-verification exercise, not a new diagnostic layer.
Retain dataset hashes, window/capture metadata and correction disposition. No raw
bars or individual rejected timestamps go into public PR comments. Access to a
second vendor, expansion of private-record retention or vendor submission needs
its own authorization and lawful scope; no new provider is enabled by this plan.

A usable replacement must pass the existing exact finite/positive/geometry,
ordering, cadence and closed-bar checks. Preserve original rejected evidence and
saved research context; never silently rewrite Library reports or recompute them
against changed history. Revised source data receives a new hash/provenance and
separately evaluated research. It can change indicators/results even though the
financial formulas stay identical. A persisted bad record, undocumented revision
or unavailable correction remains rejected; a verified calendar cannot excuse it.

**Stop condition:** if Yahoo cannot document/correct the daily records or lawful
research use cannot be established, stop treating Yahoo daily FX as a resolved
source. The owner must choose continued restricted research or qualification of
a separately approved replacement. Do not keep rerunning the same aggregate audit.

## 4. P2 source-specific calendar reconciliation

### Required contract, before code or any admission review

EURUSD is OTC FX: NYSE holidays, CME futures schedules and a generic24/5 template
are not authoritative Yahoo EURUSD=X bar specifications. IANA/ICU supplies civil
time rules, not market sessions. Today's currentTradingPeriod and GMT offset are
not a historical schedule. No applicable licensed/authoritative contract has yet
been supplied or verified for this source.

Require the data owner to provide: applicability to EURUSD=X and the vendor's
underlying feed; documented right to use/store the schedule; authoritative issuer
and revision; complete capture/lookback coverage; timezone and historical offset
rules; regular sessions, holidays, early/exceptional closures and corrections;
daily and intraday bar-open/close alignment; treatment of weekend/null placeholders;
publication/receipt time and revision rules. Uncovered dates remain unknown.
Source timezone values are not present in the posted summary; do not infer them.

### First implementation after input-contract review: comparison only, outside frozen engines

A local comparison with lawfully supplied matching inputs and no admission or
engine hooks is within the current safe development scope; it does not need a
new financial approval. Its concrete input contract is missing, so implement it
after that contract is established rather than inventing another generic layer.
Use the existing immutable dataset/counters and a versioned calendar contract.
Evaluate every entire missing interval, not just endpoint weekdays or overlap
with Saturday/Sunday. Keep two independent axes:

1. Schedule coverage: fully documented closed interval / contains expected open
   slots / coverage unknown or invalid contract.
2. Data quality: geometry rejects / all-null rows / both / no known rejection.

Calendar matches never erase the second axis. An all-null row may be described
as an expected placeholder only if the vendor's explicit bar contract says so
and the complete applicable interval is covered as closed. Any expected open slot,
partial/mixed gap, unknown timestamp or unsupported calendar revision blocks a
benign classification. A genuine geometry reject is always a quality defect,
even if its interval overlaps a closure. Do not derive an effectiveGapCount by
subtracting weekend counts or reset original gap/discard counters.

Comparison output must remain outside original indicators, backtest gap exits,
historical evaluator, recommendation admission and risk sizing. Future display
could distinguish documented market closure from provider failure, while keeping
actual observation age and current age-based safety decisions. Sunday staleness
must not be relabelled fresh. No new candidate is permitted by comparison alone.

### A later, separate financial/data approval

Current source explicitly blocks nonzero gaps/discards in recommendation-core and
command-center-core; historical backtest/evaluation also handle gaps independently.
A calendar label alone cannot fix that. Any calendar-aware qualification proposal
must specify one versioned quality contract used consistently across those
consumers, saved-record provenance and replay. Do not patch only a frontend boolean.
Changing freshness, omitted-row scope, gap admission or backtest behavior requires
explicit separate review; no financial-engine modification is currently authorized.

## 5. Bitcoin: owner source/product choice

**Recommended first choice to review:** approve a bounded read-only qualification
of the already implemented Yahoo BTC-USD route, isolated from Binance fallback,
only after lawful-use terms are established. Existing adapter code is not proof
of rights, native USD identity, authenticated venue provenance or adequate history.
Current Binance-first routing remains unchanged until a later explicit decision.

Acceptance contract: actual returned BTC/USD identity and USD quote units;
product/venue versus vendor-composite disclosure; licensed local/hosted/storage/
redistribution scope and limits; complete15m/1h/1d timing/quality evidence; actual
provider clock conventions; same source/currency across frames and cached context;
strictly valid closed bars and existing contract checks. Native-USD failure must
be unavailable, not a USDT response silently relabelled USD. No synthetic conversion.

Owner alternatives:

- Authorize qualification of an existing lawful USD entitlement or separately
  selected licensed venue/vendor if Yahoo fails rights/quality review. Source,
  access scope, region and spending cap must be approved before connection.
- Select BTCUSDT as a genuinely separate USDT research product. This needs explicit
  source/catalog/account-valuation/cost/contract approval; USD capital and a1:1
  stablecoin conversion cannot be assumed. Keep it reference-only unless those
  contracts are approved. This does not satisfy a native-USD requirement.
- Keep current restricted BTC research while decisions are unresolved.

Pricing/availability of any replacement license is unverified. No zero-cost or
commercial-redistribution entitlement is assumed from a successful public response.

## 6. Gold: genuine spot is a different source contract

GC=F/FUTURE is not spot XAUUSD. Do not remove the proxy flag, convert futures to
spot, splice histories or treat a TradingView view as the native analytical feed.

**Recommended product specification:** licensed OTC spot bullion quotes/composite,
XAU/USD in USD per troy ounce, with named source and explicit bid/ask/midpoint/
transaction/indicative-price basis. There is no universal consolidated OTC spot
OHLC tape. A broker CFD and physical/OTC spot are not interchangeable labels.
A daily benchmark is not15m/1h history and cannot be turned into manufactured bars.

Owner must identify an existing lawful entitlement or select/approve a licensed
spot vendor, its permitted access/regions, storage/redistribution rights, rate limits
and spending cap. Before implementation require interval coverage, bar construction,
source/receipt times, timezone/session/exception rules, quality limits and outage
behavior. Price comparisons with a reference need pre-agreed venue/side/time
semantics and acceptance budgets; do not invent a universal tolerance here.
Research price availability never supplies a broker lot/contract or execution right.
Those must receive independent financial approval without changing engine formulas.

If the only available licensed source is a broker XAUUSD CFD, the owner must
explicitly change the product scope; do not call that genuine spot by default.
The existing Exness module reads account configuration/snapshots, not historical
OHLC. Its existence grants no new quote endpoint, permission or private-data scope.
Keeping explicitly labelled futures research is allowed under existing restrictions,
but is not resolution of the requested spot source.

## 7. Acceptance matrix for separately approved implementation

These are review cases to carry into future regressions, not new tests or policies
implemented by this documentation package.

|Case|Required result|
|---|---|
|All36 original geometry cases, including the19 below1bp|Continue to reject; no tolerance/clamp/closure exception|
|Corrected vendor record with complete attribution|Fresh dataset only after every existing strict check; old research unchanged|
|Unchanged or undocumented supposedly corrected OHLC|Reject / unresolved source case|
|Fully covered vendor-documented weekend closure|Comparison may explain it; original counters/eligibility unchanged|
|Holiday or early close with documented source coverage|Exact interval comparison; never infer from a generic weekday rule|
|Offset transition with no schedule evidence|Unknown closure; offset change alone is insufficient|
|All-null row during a documented expected open slot|Missing-data defect; no benign classification|
|All-null row in a documented closed period but no placeholder contract|Unknown vendor semantics; still no quality waiver|
|Gap partly closed and partly expected open|Do not exempt the entire gap|
|Gap containing geometry rejects plus valid closure coverage|Geometry defect retained independently|
|Calendar wrong instrument/venue/timezone/revision or incomplete coverage|Fail closed / unavailable comparison|
|Sunday old observations followed by Monday reopening|Preserve actual age; no fresh/eligible status until existing checks pass on actual new data|
|75/76 older discarded rows outside selected tail|Original full-response policy retained; scope change requires separate approval|
|BTC native-USD route unavailable but USDT source healthy|Unavailable USD path; no cross-currency fallback|
|Mixed USD/USDT or provider identity across frames/cache|Withdraw mismatched context; no eligible candidate|
|GC=F, CFD or benchmark presented as spot intraday OHLC|Reject product mapping; no fabrication|
|Null, invalid, stale, unavailable or imported/unverified source evidence|Existing fail-closed guards and provenance preserved|
|Valid data but neutral/confirmation/risk prerequisites unmet|WAIT remains; data success is not trade approval|
|Any stored research after a source/calendar revision|Immutable original; any new evaluation explicitly versioned and separate|
|Any proposed new route/qualification change|Full numerical/API/security/system/browser/EN/AR/RTL/keyboard/packaging/integrity gates; exact-SHA Preview; independent owner acceptance|

## 8. Real model remains an independent gate

A model cannot repair OHLC, certify a calendar, convert quote currency, override
WAIT or create a qualified trade from unsupported data. Keep deterministic decisions,
strict citations, financial restrictions and the12s lifecycle unchanged.
After source-contract decisions, seek separate authorization for a bounded local
trial on already installed licensed weights and declared hardware/model digest.
All mandatory EN/AR/context/citation/opposition/uncertainty/deadline cases must pass;
late settlement, timeout, unsupported facts or unavailable evidence remains NO_GO
with deterministic fallback. Offline fixtures do not qualify real inference.
No model installation, paid/hosted inference or AI activation is authorized now.

## 9. Immediate owner decisions

Approval requests must be narrow and independent:

- A: provide the existing-source case evidence through an authorized private workflow
  and identify the rights-approved Yahoo FX historical schedule, or choose restricted Yahoo
  research versus qualification of a separately approved replacement.
- B: settle the calendar source/input contract. Comparison-only implementation
  remains within the safe read-only scope once lawful matching inputs exist;
  new access/cost and later eligibility, freshness or engine changes need approval.
- C: choose native USD Bitcoin qualification versus a distinct USDT product;
  identify lawful source/rights and a cost cap before any new access.
- D: confirm genuine spot gold product terms and a lawful entitlement/vendor,
  or explicitly choose a different labelled product. Do not imply it is already spot.

Only after those evidence gates should a specific admission-policy change be
submitted for financial approval. Release, main merge, Production, AI activation
and trading are still separate and withheld. Do not request another broad audit
or promise BUY/SELL simply because the current diagnostics reconcile.
