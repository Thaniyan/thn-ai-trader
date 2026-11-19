# Session and rejected-row review — diagnostics only

Owner evidence: [PR23 comment7015373102](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7015373102),
real Windows application at `c773e5cc83838bb09de4a5b12278bdeaf34ba07b`.
All nine contexts reconciled: both original gapsMatch and rejectionsMatch true.
This is owner-observed real-feed evidence, not a new Cloud replay. Only redacted
aggregates were supplied. Exact prices, rejected timestamps, timezone values,
geometry comparisons and breach sizes were not supplied. No cause is invented.

## Measured findings

|Context|Gaps: UTC weekend overlap / other|Full-response rejected rows|Location and scope|
|---|---|---|---|
|EURUSD15m|4 /0; all36–96h|28 missing OHLC|28 inside selected bounds;2 not closed/excluded;180 older closed rows trimmed|
|EURUSD1h|17 /0; all36–96h|93 missing OHLC|75 before selected,18 inside;2 excluded;1075 trimmed|
|EURUSD1d|261 /21;265 at36–96h,17 at least96h|5 missing +36 invalid OHLC geometry|All41 inside selected;1 excluded;980 daily24h spacings and282 other spacings|
|BTCUSD15m,1h,1d|0 /0 each|0 each|Binance request BTCUSDT, USDT;1000 raw /999 retained closed each; native product metadata absent|
|XAUUSD15m|4 /17;17 under6h,4 at36–96h|479 missing OHLC|8 before selected,471 inside|
|XAUUSD1h|17 /65;65 under6h|811 missing OHLC|315 before selected,496 inside|
|XAUUSD1d|261 /12;238 at36–96h,35 at least96h|2 missing OHLC|Both inside selected|

EURUSD metadata reported CURRENCY/USD; gold reported GC=F/FUTURE/USD. Bitcoin
uses the adapter's USDT currency and requested BTCUSDT symbol: the last kline
opening is not exchange server time or independent product authentication.
All calendar/authentication/execution/qualification-change flags stayed false.
Expected closures and unexplained gaps remain null. No real eligible Ticket or
qualified model is established. The earlier gold15m total22 was a different
rolling sample; this sample's21 is not a repaired or suppressed gap.

## What the evidence establishes and what remains unknown

- All EURUSD intraday gaps overlap UTC weekends. This supports investigation of
  session timing, not verified closure classification. Its21 daily non-weekend
  shapes and17 long gaps need source-specific historical calendar evidence.
-36 EURUSD daily rows really fail the existing adapter's OHLC geometry check.
  The aggregates do not show which boundaries failed, how large the breaches are,
  or whether rounding, vendor construction or another defect explains them.
  Reject them unchanged; never clamp prices or grant numerical tolerances here.
- Missing OHLC is not automatically a nontrading placeholder. All-four-null,
  absent-array fields, partial nulls, isolated omissions and longer runs are
  different observations, but none alone proves a holiday or scheduled closure.
-75 EURUSD hourly rejections precede its selected window. The full-response
  rejected-row counter still blocks admission even if the selected tail looks
  clean. Changing that policy requires independent evidence and separate review.
- Neutral consensus, pending confirmation and unreviewed risk assumptions remain
  distinct prerequisites; successful transport does not remove them.

## Implemented bounded diagnostics

The original adapters, filters, closed-bar engine, numerical/risk calculations,
source mapping and admission rules remain unchanged. No upstream request, provider,
calendar dependency, model or execution permission is added. The UI markup/CSS
is unchanged. The existing API and literal-loopback collector gain an additive
`readiness.dataQuality.detail` projection, schema THN-PROVIDER-SHAPES-1.

Raw-response collection is bounded at20000 rows; selected closed history remains
bounded by the original engine's2000 bars. Over-limit raw evidence is unavailable,
not a fabricated zero. Missing/geometry category runs refer to adjacent original
response indices, not verified time intervals or market sessions. The private
weak-map side channel contains timestamps/kinds only; no rejected OHLC is retained
there. None of its individual timestamps or rows enters the exported report.

- Missing patterns: fixed O/H/L/C bitmask, null versus absent field counts,
  all-four-null/all-four-absent/partial categories, response-run lengths,
  weekday/hour histograms in UTC and the reported timezone when available.
- Geometry patterns: independent high-below-open/close, low-above-open/close,
  inverted-range counts and a mutually exclusive comparison bitmask. Independent
  boundary counts overlap; sum the masks, not the boundary labels, for row totals.
  Breach sizes are binned at0.01,1,10 basis points relative to max O/H/L/C. This is
  diagnostic scale only, not a tolerance, financial formula or repair policy.
- Gap shapes: departure/arrival weekday/hour histograms at recorded bar openings,
  local offset-change counts, and strictly interior rejected-row co-occurrence.
  Prefix counts and binary search avoid scanning all rejected rows for every gap.
  Gap spacing means adjacent bar-open delta, not a measured exchange closure.
  A rejection inside a gap does not establish that it caused that gap. A gap
  with no known rejected timestamp can still have missing or unlocated evidence.
- Each date uses the reported IANA timezone through Intl/ICU rules, not today's
  static GMT offset. ICU/tzdb versions are exported for reproducibility. Missing
  or mismatched timezone evidence suppresses local histograms. An observed offset
  difference is not proof that DST caused a gap, nor authority to skip a bar.
- Counts/masks/bins/boundaries and gap partitions reconcile independently. Unknown
  old reports omit the new detail instead of reconstructing it. The outer original
  symbol/interval/hash/counter admission prevents stale-context diagnostic reuse.
  The export allowlist drops arbitrary metadata, raw prices and timestamp arrays.

## Calendar/source decision, pending approval

EURUSD is OTC FX, not an equity exchange listing. A generic NYSE holiday calendar,
CME futures calendar or convenient24/5 template cannot establish Yahoo EURUSD=X
historical bar availability. An IANA timezone only supplies civil-time rules.
No licensed, source-matched historical trading schedule was supplied or independently
verified for this sample. Accordingly no calendar was installed or classified.

Before calendar comparison, require the source/rights owner to provide a licensed
or authoritative schedule applicable to the exact vendor instrument, with timezone,
version and coverage dates, open/close sessions, holidays, exceptional closures,
early closes, DST rules, timestamp conventions and intraday/daily bar alignment.
Record where vendor bars use a different session/date boundary. Require historical
exceptions and provider documentation, not today's currentTradingPeriod alone.
CME gold trading schedules could inform a separately labelled GC futures study;
they cannot certify EURUSD or spot XAUUSD. No calendar-based admission policy is
implemented or implicitly approved.

[Engineering source proposals and approval gates](DATA-SOURCE-PROPOSALS.md) cover
native USD Bitcoin and genuine spot gold without enabling any new route.

## Next meaningful acceptance gate — Windows aggregate geometry/session audit

At the new feature commit, use the same read-only application as the successful
owner audit. Existing Node/dependencies only; no credentials in chat or report.
In a fresh PowerShell window at the repository:

```powershell
$env:VERCEL='1'
$env:THN_AI_ENABLED='0'
$env:THN_LOCAL_PAPER='0'
node --input-type=module -e "import app from './server.js'; app.listen(3000,'127.0.0.1')"
```

In a second window:

```powershell
node scripts/audit-research-runtime.mjs --base http://127.0.0.1:3000 --symbols EURUSD,BTCUSD,XAUUSD > session-quality-redacted.json
```

Acceptance: nine contexts, original reconciliation flags true, every available
new detail reconciliation flag true, and no altered counter, mapped currency or
candidate authorization. Detailed rows and original counters must be present;
missing/null diagnostics or a non-true reconciliation block this evidence gate
rather than counting as zero or a pass. Unavailable timezone metadata remains
explicitly unknown and cannot satisfy calendar acceptance. For EURUSD daily, inspect geometry masks/boundaries and
severity bins, missing-field patterns, local/UTC timing and gap co-occurrence.
For15m/1h, inspect null/absent runs and gap departure/arrival shapes. Share only
aggregate JSON, never raw OHLC, individual rejected timestamps or account data.
Rolling data need not reproduce exactly36 geometry rows; record the current hash,
window, counts and runtime timezone versions rather than claiming an old replay.
A successful collector is still not calendar/source/licensing or Ticket approval.

Then obtain the independently licensed source/calendar evidence above and owner
sign-off on the separate source proposals. Only after that can a narrowly scoped
policy-change request be considered. Keep admission, engines and WAIT blockers
unchanged until explicit financial/data-source approval. PR23 stays draft;
no main merge, Production, paid/hosted AI, model install or execution is authorized.
