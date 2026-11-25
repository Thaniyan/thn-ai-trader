# Existing Yahoo BTC-USD — bounded read-only qualification

26 November2026 (Asia/Muscat), existing draft PR23.
[Owner authorization](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7171759538).
Starting head: `db6938deac253dabbd10361a8dc95c7f647e544a`.

## Current decision

**Actual Yahoo BTC-USD technical qualification: NOT_VERIFIED.** One Cloud access
probe to the existing15m chart URL failed at Envoy CONNECT403 before TLS. No source
body or real BTC rows were obtained. This is a workspace restriction, not evidence
that Yahoo returned malformed Bitcoin data or denied a valid license. No repeated
Cloud feed harvesting, policy change or new host access was attempted.

|Gate|Actual-source result|Evidence still required|
|---|---|---|
|15m /1h /1d retrieval and quality|NOT_VERIFIED for all three|One bounded existing-route owner pass below|
|Reported BTC-USD / USD / CRYPTOCURRENCY identity|NOT_VERIFIED|Actual source metadata; no Binance substitution|
|Native base and independent venue identity|NOT_VERIFIED|BTC is inferred from a matching reported symbol; that is not independently authenticated venue metadata|
|Price basis: composite/venue/trade/indicative|NOT_VERIFIED|Applicable Yahoo/underlying-feed contract; do not infer from a display name|
|Historical bar timestamps, timezone, sessions/maintenance|NOT_VERIFIED|Source-defined bar semantics and coverage, not a blanket24/7 assumption|
|Local retrieval, derived research and display rights|NOT_VERIFIED|Applicable terms/entitlement, permitted uses and geography|
|Hosted processing, caching/retention, redistribution/commercial rights|NOT_VERIFIED|Owner-reviewed scope and retention/license evidence; public chart availability is not permission|
|Routing/admission/release approval|NOT_GRANTED|Separate owner decision after technical and contract review|

There is no defensible actual PASS or FAIL on data quality without the rows.
The route is an **unqualified investigation candidate**, not yet a verified native-
USD production alternative. FX session findings and strict admission stay unchanged.

## Existing implementation, isolated without changing it

Production `fetchMarketData` tries Binance first for crypto. Its BTCUSD mapping
requests BTCUSDT; successful USDT observations preempt the existing Yahoo fallback.
The isolated audit does not call that routing function, start an HTTP server or
change an environment setting. It executes only the hash-pinned original
`fetchYahooCandles` function and original timeframe configuration from `server.js`
in an isolated VM context with the original row diagnostics and closed-bar engine.
No replacement price mapper or financial formula is introduced.

|Interval|Original requested range|Existing source route|
|---|---|---|
|15m|1mo|`/v8/finance/chart/BTC-USD`|
|1h|6mo|same|
|1d|5y|same|

Only existing `query1.finance.yahoo.com` then `query2.finance.yahoo.com` host fallback
is permitted. At most six requests, sequentially, with the original7500ms bound
per attempt. No retries on the same host, redirects, Binance, novel endpoints,
credentials, inference, planner or orders. If no source body can be inspected for
a frame, stop the entire pass and mark remaining frames not attempted. A successful
HTTP response is not itself a quality pass. Request and rate-limit-header presence
are recorded without inventing vendor rate limits.

Bodies are limited to2MiB each, processed only in memory and never written to disk.
Only counts, closed reason enums, identity attributes, source/dataset hashes and
quality states are exported. No raw OHLC, source timestamps, arbitrary metadata,
error messages, private paths or rights documents are emitted. A complete raw hash
does not establish vendor authenticity or permit redistribution.

The existing adapter mapping/filters, original closed-bar engine and diagnostics
are authoritative. Technical PASS requires all three frames: matching reported
BTC-USD/USD/CRYPTOCURRENCY identity, ordered unique valid source timestamps, enough
closed history, zero original gaps/discards, reconciled original counters, matching
reported granularity when present, and current observation age under the original
Command Center expiry rule. A gap, geometry error, missing row, stale observation,
wrong product/currency or invalid history produces FAIL on observed data. Absent
source access produces NOT_VERIFIED, not invented zero counters. Raw accepted rows,
retained closed tail and excluded/trimmed history have different scopes.

Even an all-frame technical PASS leaves **sourceContract, usageRights and overall
source approval NOT_VERIFIED**. Vendor bar-open semantics and price basis are not
authenticated by the engine's convention. The existing policy's candidate
direction/confirmation, exact levels/risk and legal qualification remain separate.
This tool does not compute a candidate, promise BUY/SELL or run a model.

## One Windows handoff

Use the existing reviewed PR23 branch, installed Node24.5+ and dependencies. First
verify the exact candidate SHA from the delivery report; preserve any local work.
The command refuses a dirty checkout, wrong branch/HEAD or changed adapter/config.
No application or Ollama server needs to be started. No credentials are requested.

Run once from that repository in PowerShell, replacing the SHA placeholder with
the **full reviewed audit commit supplied in the delivery report**, not a dynamically
accepted current HEAD:

```powershell
$report = Join-Path $env:TEMP ("thn-yahoo-btc-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
node scripts/audit-yahoo-bitcoin.mjs --expected-head <EXACT_REVIEWED_AUDIT_COMMIT> > $report
$resultCode = $LASTEXITCODE
$report
$resultCode
```

Keep the report outside Git. Exit0 means all three technical controls passed;
exit2 means FAIL or NOT_VERIFIED: read the redacted report and stop, without retry.
Exit1 means the handoff was refused: preserve the checkout and resolve its exact
identity separately; do not bypass the guard. Share only the redacted JSON, not
the printed local path or other private files. Attest that the run used existing
authorized real access and no test transport. The audit checks local source HEAD;
it does not authenticate Yahoo's venue or license.

## Regression and release scope

The audit is operator-only and has no application caller. Its tests use explicit
synthetic upstream responses, not real-market qualification. They cover source
isolation, hash pinning/Windows line endings, all three frames, USDT/symbol/product
mismatch, stale data, missing/invalid OHLC, duplicates/disorder/gaps, original
host fallback, blocked access,429, response limits, redaction and exact clean HEAD.
Complete original release gates remain mandatory; final exact-head CI results
are reported separately. Do not confuse synthetic technical PASS with actual
Yahoo qualification. No real source result has been supplied by this implementation.

## Next per-change decisions

1. Review the one owner-device report. If observed technical FAIL, resolve the
   exact recorded defect/source limitation without weakening quality predicates.
   If NOT_VERIFIED, identify the access/contract limitation; do not auto-retry.
2. Independently approve source terms for the intended local/hosted uses, retention,
   display/redistribution/commercial/geographical scope, and source product/price/
   historical bar semantics. No new purchase, vendor contact or legal-document
   acquisition endpoint is authorized by this audit.
3. Only after evidence review, separately authorize a narrowly reviewed native-
   USD routing candidate that cannot fall through to USDT-labelled USD. No such
   change is included. All frames/cache identities, original signal/confirmation,
   risk binding and saved context must remain consistent. Real Ticket and real
   model qualification are separate gates; no trading activation follows.

Keep PR23 draft. No main merge, Production, model or execution activation.
