# WAIT: direction, admission and genuine Ticket qualification

24 November 2026, existing draft PR23. Baseline60b301f5838eca9cdf29598ea7c05cd9274442bc.
[Owner directive](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7132365813).
No admission, financial formula, source route, model or execution permission changes.

## Is there any real eligible research Ticket today?

**None is verified in the available real evidence.** The owner's earlier nine
EURUSD/BTCUSD/XAUUSD contexts retained no candidate. Subsequent real EURUSD/1h and
USDJPY/1h observations still showed WAIT; USDJPY's86/100 was heuristic agreement,
not a profit probability or proof of qualified levels. The exact current54-context
market set has **not** been observed here. Do not claim that all54 fail, that no
eligible market condition can ever exist, or that synthetic BUY/SELL proves a real
Ticket. Operational acceptance remains NO_GO pending actual evidence.

## Scope actually inspected

The actual local `/api/research/catalog` returns18 catalog-listed instruments and15m/1h/1d:

|Selectable family|Instruments|Contexts|Source mapping / independent constraints|
|---|---|---:|---|
|FX|EURUSD, GBPUSD, AUDUSD, NZDUSD, USDJPY, USDCHF, USDCAD|21|Yahoo respective `=X`; quote must be USD/JPY/CHF/CAD as appropriate|
|Metals/oil|XAUUSD, XAGUSD, USOIL, BRENT|12|GC=F, SI=F, CL=F, BZ=F; catalog futures proxies, never native spot|
|Crypto|BTCUSD, BTCUSDT, ETHUSD, ETHUSDT|12|Binance BTCUSDT/ETHUSDT first; Yahoo BTC-USD/ETH-USD fallback. USD≠USDT; catalog USDT instruments are proxy-restricted|
|Indices|SPX, NAS100, US30|9|Yahoo ^GSPC/^NDX/^DJI. Catalog proxy flag is false; index observations still do not establish an executable broker/CFD contract or rights|

This is a measured **software catalog**, not54 successful market requests.
The legacy `qSymbol` input also accepts syntactically valid free text beyond the
catalog. Loading history for such a symbol does not supply a catalog contract:
`commandAssessment` cannot retain a candidate without a catalog instrument/proxy
flag and numeric specification, so `contract_unavailable` is an additional,
separate WAIT path. Use the supported picker to distinguish that case. The54-cell
matrix covers the complete finite catalog, **not every arbitrary enterable symbol**.
No free-text contract/eligibility is added. Legacy timeframe aliases map to the
same three analytical intervals; TradingView display choices do not change the
native THN source or authorize another analytical instrument.
One read-only probe to the existing Yahoo EURUSD route returned Envoy CONNECT403
before TLS. It establishes a Cloud access restriction, not an application503,
Yahoo denial or real-market WAIT cause. No repeated feed probing, new endpoint,
calendar/vendor access or policy broadening was attempted.

## Real observations retained from the owner

These are earlier rolling Windows captures, not fresh60b301f measurements. The
19 November nine-context audit returned27 successful HTTP200 endpoints and recent,
available frames but no candidate. The latest completed22 November09-context
session audit at57eee183 also returned200 throughout; its Sunday intraday FX/gold
observations were stale. All18 original and72 detailed reconciliations passed:

|Context|Gaps|Full-response rejected rows|Selected assessment phase / established limit|
|---|---:|---:|---|
|EURUSD15m|4|34 missing OHLC|stale; all gaps overlap UTC weekends, not an approved closure calendar|
|EURUSD1h|16|94 missing OHLC|stale;76 rejects before selected bounds,17 inside,1 after; original full-response scope|
|EURUSD1d|281|5 missing +36 invalid geometry|ready;260 weekend-overlap/21 other gap shapes; genuine geometry rejects remain independent|
|BTCUSD15m/1h/1d|0 each|0 each|ready; Binance BTCUSDT/USDT, not native USD Bitcoin|
|XAUUSD15m/1h/1d|21/80/272|470/808/2 missing OHLC|stale/stale/ready; GC=F futures, not spot XAUUSD|

Here `ready` is a lifecycle phase, **not** admission. Sunday staleness is a measured
blocker in this capture, not evidence that feeds never work. Earlier17/93 hourly
EURUSD and22-gap gold captures are different rolling samples, not corrected counts.
P1 later independently confirmed36 geometry-invalid rows **already in Yahoo's
source response**, with reviewed mapping/closed-bar/API agreement. The upstream
construction cause and identity with older36 historical records remain unknown.
Nothing authorizes corrections or tolerances. References:
[provider qualification](PROVIDER-QUALIFICATION-20261119.md),
[latest reconciled session capture](PROVIDER-RESOLUTION-PLAN-20261122.md),
[P1 source evidence](EURUSD-P1-INVESTIGATION-20261122.md).
No new real counts, raw decisions or breach magnitudes are invented.

## Exact admission pathway and root-cause distinctions

1. `server.js` builds raw analytical BUY/SELL or BUY LIMIT/SELL LIMIT. Its legacy
   fallback can emit a limit hypothesis even when the consensus label is NEUTRAL.
   Raw output is neither admission nor execution. It is not a calibrated signal.
2. `recommendationReview` matches symbol/interval/hash; requires recent evidence,
   nonproxy selected history with exactly zero gaps/discards, complete current
   three-frame evidence, directional consensus without opposite-frame evidence,
   matching immediate engine direction, a ready scenario and closed-candle
   confirmation. Pending pullbacks, neutral consensus and conflicting frames
   remain separate reasons. No confluence score overrides them.
3. `commandAssessment` additionally enforces elapsed freshness, source/provider/
   currency agreement, numeric catalog contract availability, valid retained
   Entry/SL/ordered targets and all three frame expiries. It releases no candidate
   when those predicates fail. Missing/wrong evidence cannot be made current by
   printing a direction next to WAIT.
4. Original scenario semantics use the hourly prior-range trigger and daily
   invalidation; the selected closed close tests confirmation. This is an existing
   cross-frame policy, not a new calculation. It needs explicit design/financial
   review if the owner wants different semantics, not a covert threshold change.
5. Unreviewed risk is appended after direction selection and **does not itself
   prohibit retaining a candidate**. Opposite-side or over-budget submitted plans
   can block/avoid. The Ticket additionally requires exact original level/context
   binding before a risk-reviewed label. The batch submits no plan or capital;
   its unreviewed risk is expected, not proof that every WAIT is a planner bug.
6. Historical validation and real-model qualification are separate disclosures;
   neither is an automatic prerequisite inside candidate admission. Legal rights,
   independently approved source/product/calendar and venue contract acceptance
   remain independent release gates. Do not invent a universal licensing reason
   code: the current runtime contract check verifies numeric specifications, not
   licensing approval. A retained software candidate alone cannot establish rights.

**The shared FX quality restriction is structurally significant.** The frozen gap
counter counts adjacent openings more than1.5 intervals apart. A normal weekend
closure inside hourly/daily history can therefore trigger the same zero-gap rule
as missing data. Default source windows are1mo for15m,6mo for1h and5y for1d,
all longer than a regular FX trading week. Under correctly sparse weekday-only
bars covering those windows, ordinary weekend closures therefore **will** violate
the current zero-gap rule. Null off-session placeholders can additionally enter
full-response rejection counts. Waiting for a stronger trend or replacing a feed
with another correctly sparse FX feed does not by itself resolve that structural
contract conflict. This is a conditional deduction from the verified code/window
contract, not a claim that all54 real contexts were fetched or that every missing
row is a harmless closure. A separately approved, source-grounded calendar/quality
contract is needed to support such history without fabricated filler bars.
Synthetic cadence regression proves this mechanism; the owner's
EURUSD aggregates support investigating it in actual history. It does not prove a
source-matched historical calendar for all seven FX instruments. Even a calendar
approval would not pardon36 genuine daily geometry violations or every missing
OHLC row. Full-response rejection scope is another deliberate current contract:
changing it to selected-tail-only would be an admission change requiring review.
Daily quality rejects do not automatically block every other selected timeframe:
selected gap/discard counts are tested directly; other frames must still be
available/fresh/nonopposing. Do not inflate the causal scope of the daily issue.

**Identity is a separate structural restriction.** Clean Binance BTCUSDT cannot
become BTCUSD by aliasing/conversion. Clean futures cannot become spot gold.
Yahoo native-USD fallback may have different actual quality; it is not selected
or certified by this task. ETH, other FX and indices have no new real measurements.

No universal admission-engine software defect was established. Controlled
positive candidates prove that the code is not an unconditional WAIT function,
but never qualify a real feed. The demonstrated presentation defect was that
WAIT obscured retained analytical direction; the implementation below fixes that
ambiguity without weakening a single predicate.

## Completed safe product changes

When no candidate is admitted, the existing Decision Center now shows the retained
**engine hypothesis and consensus separately** from WAIT/eligibility. Admitted
setups keep their original BUY/SELL heading without a duplicate hypothesis caption. Neutral consensus stays neutral even
if the raw legacy label is BUY LIMIT. Unqualified hypotheses are explicitly marked unqualified; the original research-
only and no-execution-approval notices remain. Selected gap/rejected-row counts replace vague quality
wording in the existing blocker list. No extra page, gauge or duplicate ticket.
The raw caption clears synchronously on symbol/timeframe/hash changes, is withheld
for stale/busy/mismatched analysis and never supplies Entry/SL/TP. EN/AR, themes,
keyboard/source inspection and existing risk/Library owners remain in place.

The existing read-only audit and closed Day9 redactor now cover the actual fixed
18-symbol catalog, including CHF/CAD currencies and INDEX metadata. Their original
three-symbol-per-call limit, endpoint allowlist,25s request bound, no redirects,
error redaction and no price/record exports remain. A single orchestration command
reuses them to collect54 contexts, capped at164 loopback requests: one catalog,
one configuration-only provider request and162 series/brief/analyze calls. It has
no retries, inference, planner, order, source substitution or admission hook.

Every output is source/context-specific: raw engine decision/consensus, retained
candidate flag, frame freshness/availability, original blocker list, source product/
quote metadata and existing rejection counts. Reason counts overlap. A code shared
by54 samples is reported as co-occurrence, not automatic proof of sole causality.
No candidate is upgraded to real-market or risk/rights qualification. Market data
remain rolling during the batch, not a simultaneous frozen market snapshot.

## One Windows handoff — existing authorized sources only

Use the existing reviewed branch and installed Node/dependencies. No pull/reset,
model inventory, inference, service/model install or new provider configuration.
Substitute the exact candidate SHA from the final engineering report; do not
silently approve whatever HEAD happens to contain.

PowerShell1 at the repository (bind loopback, finance and inference disabled):

```powershell
$env:VERCEL='1'
$env:THN_AI_ENABLED='0'
$env:THN_LOCAL_PAPER='0'
node --input-type=module -e "import app from './server.js'; app.listen(3000,'127.0.0.1')"
```

Start that process only after verifying the reviewed checkout. If the port is
already occupied or startup fails, stop the handoff; do not audit an unidentified
older process. End only your own previous application with Ctrl+C and start the
reviewed application again. The wrapper verifies checkout HEAD, not a remote or
cryptographically attested server revision; fresh-process/source provenance is
part of the owner's explicit runtime attestation.

PowerShell2 in the same clean repository:

```powershell
$report=Join-Path $env:TEMP ("thn-wait-matrix-"+(Get-Date -Format "yyyyMMdd-HHmmss")+".json")
node scripts/audit-wait-matrix.mjs --expected-head <EXACT_REVIEWED_SHA_FROM_REPORT> --base http://127.0.0.1:3000 > $report
$report
```

Keep the output outside the checkout: shell redirection creates the file before
Node starts; an untracked output inside the repository would correctly trip the
clean-tree guard. No guard is bypassed or ignore rule broadened.

The wrapper refuses dirty/wrong HEAD/branch, a changed18×3 catalog or remote/
credential-bearing base before market collection, and refuses export if the tree
changes during collection. It runs each context once, using original concurrent
three endpoint reads but serial context rounds; worst-case request waits approach
23 minutes. Do not click Analyze concurrently, retry automatically or submit private
raw bars/P1 originals. Stop on a refused report; share only the redacted JSON and
attest that the runtime used real existing sources without test fixtures. This
attestation and Cloud synthetic results are different evidence classes.

## Prioritized corrective execution and approval path

|Priority|Implementation-ready next action|Measurable acceptance / required owner decision|
|---|---|---|
|1|Run the single owner batch; use actual reason intersections and raw/admitted separation|54 unique contexts,164 requests, endpoint statuses, precise shared reason counts; source/current context mismatch stays blocked. No real positive inferred from synthetic output|
|2|Review Yahoo FX historical session/quality contract against those actual contexts|Approve source-matched licensed calendar/bar semantics and any narrowly reviewed gap/rejection-scope rule **separately**. Test known closures vs unexplained omissions, DST/holidays, stale evidence; genuine invalid geometry still rejected. Current rule stays unchanged pending approval|
|3|Resolve the36 Yahoo source anomalies via attributable correction or existing offline P2 approved independent evidence|Immutable original, exact record reconciliation, corrected-source attribution, geometry and source identity; no local clamping/tolerance. Vendor contact/new access requires explicit approval|
|4|Review native-USD crypto and genuine spot metal source contracts|Approve provider selection/rights/identity/quote/bar/cost contracts before routing changes. Existing Yahoo native-USD adapter is a candidate, not an activated/qualified fix. GC futures remain separate from spot|
|5|Observe one genuinely admitted current BUY/SELL and validate that Ticket through the original planner|Real identified source, zero applicable current blockers, recorded levels/confirmation, exact hash/time/level risk binding, EN/AR browser review; execution stays off. Absence of a positive leaves the product objective unresolved|
|Separate|Qualify the actual local model only under separate owner consent|Unchanged12s and full strict EN acceptance before AR; no inference performed here. Engineering CI cannot qualify real AI|

The next implementation-ready approval package should be **FX source/calendar
qualification**, not a numerical-engine rewrite. Keep original gap/rejection counts
visible and immutable; specify a separately versioned, source-identity-bound
qualification policy only after lawful historical session/bar semantics are
reviewed. Its isolated candidate diff would target the source boundary and the
`data_quality`/zero-gap admission predicates in `recommendation-core.js` and
`command-center-core.js`, with the original counters/financial formulas retained.
Require tests for verified closures versus unexplained gaps, malformed/null data,
all36 genuine geometry cases, changed sources/hashes, stale evidence and missing
calendar coverage. Never substitute a weekday template, reset timestamps or mark a
closed-market observation fresh. Index/CFD and all-frame quality semantics also
need explicit source/financial review, not a blanket FX exception. No such policy
change is included or approved by this implementation.

Readiness: safe UI/collection improvements can be reviewed now. **Genuine Ticket
and operational AI release remain NOT_VERIFIED / NO_GO** until the real gates above
succeed. November26 is an acceptance review, not authority to erase blockers.
Keep PR23 draft; main and Production unchanged.
