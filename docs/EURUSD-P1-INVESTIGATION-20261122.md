# P1 EURUSD daily source-boundary investigation — 22 November 2026

Existing draft PR23 / feature/ai-evidence-interpreter-phase2-20261116 only.
The resolution package was committed and pushed first, documentation-only, at
`6e7652e2042815332c659342c01198d03dfe89ad`. All273 existing non-documentation
files were unchanged by that commit. Main remains d75dc60.

## Verified Windows result — source-response origin established

[Owner evidence7076985015](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7076985015)
and its [redacted transcription](evidence/eurusd-p1/owner-windows-verified.json)
complete the real P1 capture gate. The owner ran the investigator at62ea56ad on
Windows using the existing authorized route. This is real source-stage evidence,
not a synthetic test or a Cloud replay. Original source bytes/sidecars remain
private on the owner's device; do not request their upload or public record data.

|Observed field|Verified redacted result|
|---|---|
|Capture|2026-11-22T09:09:27.231Z (13:09 Muscat)|
|Source / application API|query1.finance.yahoo.com HTTP200 / API200|
|Original response body|140144 Fetch-decoded bytes; owner unchanged check true|
|Original body SHA256|`d0b0435ff1b685a250c60d208fda058d44aff8c69bab744f3074dc64b55add0d`|
|Raw / adapter-retained / excluded|1305 /1264 /41 (5 missing +36 geometry)|
|Nonzero geometry masks|2:6;3:12;8:7;12:11; all other masks0|
|Independent boundaries|highBelowOpen12; highBelowClose18; lowAboveOpen11; lowAboveClose18; rangeInverted0|
|Severity below0.01 /[0.01,1) /[1,10) /at least10bp|0 /19 /16 /1|
|Reviewed mapper block|SHA256 `774b2f1c5fb7be9b4aeb929d30f4e7f0d6cacdf4fcda17c4ed3176f558a11520` matched|
|enginePreservesMappedClosedBars / apiMatchesExpectedClosedBars|true /true|
|Expected dataset hash|`1abcdf5ad53784b6a6c002f93a603921a2e24ff17c3ec8cc3bcb35d6513a0af8`|
|Outcome|analysisFailure null; COMPARISON_COMPLETE; exit0; SOURCE_RESPONSE|
|Still unestablished|Upstream bar-construction cause; individual earlier historical36-record identity|
|Permissions/policy|qualificationChanged false; calendarExceptionApplied false; executionAuthorized false|

**Current capture verdict:**36 invalid OHLC records are present in the Yahoo
response before the app processes them. No mapping, closed-bar or API discrepancy
is demonstrated in this tested path. Strict rejection worked:1264 is the
adapter-retained count, not a claim that raw invalid rows entered the API or that
all retained rows are closed/eligible. Successful stage comparisons establish
fidelity of the validated subset, not feed quality or a qualified Ticket.

This supersedes the earlier absence-of-source-body limitation **for this owner
capture**. It does not diagnose why Yahoo/upstream assembled those values, prove
license rights or identify the earlier historical records individually. No price
repair, tolerance or calendar exception is authorized. Keep source originals and
sidecars immutable and private. Do not repeat the successful fetch just to collect
another diagnostic report.

[Next milestone: attributable correction and independent-source qualification](SOURCE-CORRECTION-QUALIFICATION-PLAN-20261122.md).

## Earlier code review and Cloud access limits — historical evidence

Owner's05:18:28.718Z Windows sample at57eee183 supplies real aggregate evidence:
36 EURUSD daily geometry rejects (masks2:6,3:12,8:7,12:11),19 breaches in[0.01,1)bp,
16 in[1,10)bp and1 at least10bp, with5 all-four-null rows. All36 closes and23 opens
are outside their reported high/low ranges; no range is inverted. Those counts
are verified owner observations. No original response, individual records or
record identifiers from that capture were supplied to this Cloud investigation.

Read-only code inspection verifies that the current Yahoo adapter assigns each
quote.open/high/low/close array element directly to the same row index. It only
converts the timestamp to milliseconds and applies the original strict filter.
It does not substitute adjclose, resample intraday bars into daily bars, clamp a
price or apply a numerical tolerance. The original closed-bar engine validates,
selects closed bars and retains the tail; its source is unchanged.

The code-level order is source JSON -> direct quote mapping -> strict filter /
recordProviderRows -> closedMarket -> prepareSeries -> API output. The reported
geometry count is recorded before the latter bar processing, so later THN bar
construction cannot produce that earlier rejection counter in this code path.
Given the reported unmodified mapper, the evidence points toward the supplied
quote fields rather than a local resampling calculation. This is a code/evidence
chain inference, not independent inspection of the original response bytes or
a diagnosis of Yahoo's internal field/bar construction.


The inspected mapping/filter block has SHA256:
`774b2f1c5fb7be9b4aeb929d30f4e7f0d6cacdf4fcda17c4ed3176f558a11520`.
A block hash attests the inspected code version, not authenticity or licensing
of prices. Mapping review plus synthetic regression cannot independently
establish the original36 source records or Yahoo's internal construction cause.

Both existing Yahoo chart hosts were attempted with the existing EURUSD=X daily
5y request. Normal HTTPS GETs failed with curl56, HTTP status000 and Envoy
CONNECT403 before TLS. This is a workspace proxy restriction, not an observed
Yahoo-origin403. A fresh original-application request to the same research-series
path returned503 MARKET_DATA_UNAVAILABLE; neither source response was captured.
No synthetic substitute was used in the actual network attempt. Network policy
was not changed and no new host, endpoint or provider was introduced.

**Historical Cloud-attempt conclusion:** no source body was obtained in that
attempt. The later owner capture above establishes current source-response
origin, while provider-internal aggregation cause remains unverified. No
application mapping defect was demonstrated in either code review or the
successful owner stage comparison.
The blocked capture report remains BLOCKED_OR_UNVERIFIED with no stage result or
private source originals. This is not a successful real-data stage comparison.

## A single-purpose operator-local investigator, not another generic layer

[scripts/investigate-eurusd-daily.mjs](../scripts/investigate-eurusd-daily.mjs)
performs one EURUSD1d request through the unchanged application handler. It is not
imported or packaged by production and adds no UI, API route or scheduled task.
It uses only the existing query1/query2 Yahoo chart path, range5y/interval1d and
original request options, at most the existing two attempts. Redirect following
is disabled in this operator process, so a redirect cannot enable new host access.
The original source deadlines remain intact. The loopback response is bounded
at20s, response bodies at2MiB, source rows at5000; source/contract/mapping failures
are not converted into successful evidence.

The tool forces research-only hosted restrictions in its own fresh process
(VERCEL1, AI0, local-paper0), binds an ephemeral literal127.0.0.1 listener and calls
only the existing series route. No existing running application, account, model,
order/planner/evaluator endpoint or market-data routing is modified.

For a successful source fetch it preserves the exact Fetch-decoded response body
before the adapter parses it. These are response-body bytes, not a compressed
wire capture. A unique private run directory is created **outside any Git checkout**;
raw files and SHA256 sidecars are exclusively created and made read-only. Existing
originals are never overwritten or deleted. Body hashes are rechecked before
reporting. On Windows, read-only attributes are not an ACL or WORM guarantee:
the owner must choose a genuinely private local folder with suitable ACLs and
retain the hash sidecars. Do not use a shared/synchronised or repository folder.

The trace is deliberately specific:

1. Pin the reviewed production mapping/filter block, normalizing only checkout
   CRLF line endings to LF. Substantive drift stops the
   tool for code review rather than silently using a different reconstruction.
2. Inspect original quote arrays without price conversion; aggregate geometry
   masks, boundaries and severity using the existing diagnostic collector.
3. Compare against the strict accepted rows and their direct closed-tail hash,
   calculated before calling the original engine. Confirm the original engine
   preserves those bar values and order; no resampling or price reconstruction.
4. Compare the actual unchanged API candle hash, source identity and discarded
   count against that same captured response. Any discrepancy withholds origin
   attribution; it is not automatically diagnosed as a construction bug.
5. Export counts, hashes, booleans, safe status codes and capture time only.
   No raw prices, individual bar/rejection timestamps, private paths or headers
   enter stdout/redacted-report.json. Original capture files stay private.

A complete matching capture with invalid raw quote fields can establish the
**proximate origin in that captured source response**. It still cannot establish
whether Yahoo's own upstream feed, adjustment convention or aggregation caused
those fields. A current matching36-count pattern does not identify the original
historical36 records: the tool always reports historical36RecordIdentity as
NOT_ESTABLISHED. A clean current response does not prove old records were fixed.

## Windows execution reference — completed gate, no repeat requested

The owner has completed this procedure successfully. Retain it for reproducibility;
it is not the next task and no private source file/individual-record upload is
requested. The new work is correction/source qualification in the linked plan.


Use the existing repository/dependencies and Node24.5+ (the pinned project version
is24.19.0). No service activation, provider credential, model install or new access
is needed. Do not start another server: this is a one-shot isolated process.
Select an owner-private folder outside all Git checkouts. In PowerShell:

```powershell
$p1Private = Join-Path $env:LOCALAPPDATA 'THN-EURUSD-P1'
New-Item -ItemType Directory -Force -Path $p1Private | Out-Null
node scripts/investigate-eurusd-daily.mjs --private-dir "$p1Private"
$LASTEXITCODE
```

Inspect the private child directory locally. Preserve source-N.json and its
.sha256 sidecar unchanged. Only share the aggregate stdout or redacted-report.json,
never source files, individual rejected rows/timestamps or account information.
POSIX operator folders must have owner-only permissions; Windows ACL privacy is
the operator's responsibility. No filesystem path or ACL manipulation enables
market access or changes the application security policy.

Exit0 means a stage comparison completed, not source/model/trade qualification.
Exit2 means source/API evidence is blocked or unverified. Exit1 means the tool
stopped (for example mapping drift, unsafe private directory or failed invariants).
No state approves an eligible Ticket or applies any price/calendar correction.
A failure is evidence to inspect privately, not permission to loosen guards.

## Conditional correction, with regression acceptance

|Actual result|Proposed action|Required regression / approval|
|---|---|---|
|Raw response has geometry violations; mapping and closed/API hashes match|No application price repair. Seek attributable corrected source records or separately reviewed source replacement|Keep all existing bad cases rejected; every corrected record must pass the same strict checks. Preserve original snapshots and saved reports; new data gets a new hash. Vendor contact/new source/access/rights changes need explicit authorization|
|Mapping block differs from reviewed direct assignment|Stop and inspect the actual code diff privately; no attribution yet|Only a demonstrated mapping bug justifies a narrowly scoped fix, with field-by-field source fidelity, adjusted-close isolation and original rejects preserved; no inferred formula/tolerance change|
|API/engine differs from the direct accepted closed-tail hash|Withhold attribution; investigate the first mismatching stage using the private capture|A corrected implementation must preserve source values, ordering, closed-bar selection and all frozen engine contracts. Any financial-engine change needs explicit owner approval|
|Current raw response is clean|Record this capture only; do not declare historical36 corrected|An archived original/correction pair with traceable identity is needed to dispose of old cases. Never silently rewrite Library research|
|No body, unsupported source identity, malformed contract, size limit or timeout|Keep BLOCKED_OR_UNVERIFIED and current WAIT restrictions|No fabricated hashes/counts, counter waiver, redirect/new host access or unsupported root-cause claim|

Source-response geometry violations are now established by the owner capture.
No application-side price correction is justified: the reviewed path preserved
source values and rejected the invalid records correctly. An upstream correction
would be valid new input only if attributable and strictly valid; not a locally
manufactured repair or silent re-evaluation of historical research. Calendar
exceptions cannot excuse any of the36 genuine geometry records.

## Regression evidence and next gate

Nine targeted tests use **controlled synthetic prices**, constructed to reproduce
the publicly supplied comparison/severity count pattern, not the owner's records.
They exercise the actual unchanged application handler and frozen bar engine,
adjusted-close isolation, pipeline mismatch refusal, clean-current versus unknown
historical identity, mapping drift/source-contract failure and CRLF checkout compatibility, private-path exclusion,
exclusive/read-only snapshot preservation/hash checking, redaction, unavailable
source outcomes and cancellation of oversized streams without partial originals, and source-deadline
abort enforcement even after a body has been privately captured. Test fixtures cannot establish a real provider root cause.

The real P1 capture gate is complete at62ea56ad, as recorded above. The next
implementation-ready milestone is the private correction/approved independent-source
case comparison specified in [the source plan](SOURCE-CORRECTION-QUALIFICATION-PLAN-20261122.md).
No additional generic instrumentation or repeated source fetch is required.
Provider-internal cause and older historical-case identity remain unknown unless
separately supported by attributable source records/revisions.

PR23 stays draft. Main, Production, financial engines, accepted UI, eligibility,
strict validation, provider selection, calendar rules and security restrictions
remain unchanged. No AI activation, paid service, model install or trading occurs.
