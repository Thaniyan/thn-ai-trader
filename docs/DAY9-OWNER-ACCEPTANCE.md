# Day 9 — one owner-device acceptance handoff

Prepared **23 November 2026, Asia/Muscat**, ahead of scheduled Day9 (25 November).
Final review: **26 November**; this date is not release approval.
[Owner directive](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7101808552).
Existing draft PR23 / `feature/ai-evidence-interpreter-phase2-20261116` only.
Verified starting point: `ff8e85311698e01bf5bf1b0f09337a5c8fbe1862`.

## A. One Windows source check — no inference or orders

Use the existing checkout, supported Node24.5+ and **already running** local THN application. Do not
install anything, start a service, change environment settings or paste credentials.
Set `$Candidate` to the **full Day9 commit in the delivery report** and `$Base` to
the existing application's literal `http://127.0.0.1:PORT` origin. A protected
Preview can be reviewed separately in the owner's browser; this command never
forwards a local token to Preview. Run from the repository root:

```powershell
$Candidate = '<full reviewed Day9 commit SHA>'
$Base = 'http://127.0.0.1:3000' # use the port of the existing running application
node scripts/day9-owner-acceptance.mjs --expected-head $Candidate --base $Base --symbol EURUSD --interval 1h
if ($LASTEXITCODE -ne 0) { throw 'Acceptance refused. Stop; do not reset, install or change guards.' }
```

The command checks the existing branch, exact HEAD and clean Git tree before any
request. If the checkout is old/dirty, preserve it and resolve checkout separately;
do not reset or run an old collector against new code. The reported HEAD verifies
the collector checkout, **not the running server build**: confirm the running app
was launched from that same candidate. If unknown, mark application identity
NOT_VERIFIED and stop acceptance; do not infer identity from a port or healthy GET.

This reuses `auditRuntime`: catalog + provider configuration + selected series,
brief and deterministic analyze (five local application requests, no retries).
The original brief can request its normal three frames through existing routes;
no repeated P1 daily anomaly capture, raw-row tracing or new source is performed.
Existing adapter fallback/cache behavior is unchanged. The collector timeout is
the original bounded research HTTP timeout, **not an AI inference allowance**.

Only selected/frame counts, recorded freshness labels, provider/product/currency
metadata, rejection totals, endpoint statuses, original blocker codes and actual
engine direction are exported. Unknown strings become null; prices, source times,
hashes, personal paths, raw bodies and model prose are not exported. `recent` is
retained metadata: elapsed freshness/blockers and the browser's current assessment
still govern admission. A raw engine BUY can coexist with **no retained Ticket**.
No license/authentication is inferred from metadata. No browser plan/model state
is observable in this CLI: `NOT_OBSERVED` must not be reported as a failed plan or
deterministic model. Source/model/Ticket acceptance stays NOT_VERIFIED/NO_GO.

Share only this redacted JSON plus the short walkthrough receipt below. Do not
upload the existing P1 originals, screenshots containing private account data,
raw prices, source timestamps, local paths, prompts, tokens or answer text.

## B. Actual browser walkthrough — same context, no forced setup

Open the exact-commit existing Preview if accessible, or the identity-confirmed
existing local app. Record **Preview** or **LOCAL**, not interchangeable acceptance.
Do not change sources, thresholds, prices, AI configuration or browser state with
DevTools. Use actual current data; no fixtures or manually injected candidate.
Read the existing local `/api/health` in the browser and confirm capability flags
`liveTrading=false` and `paperExecution=false`. If either is true or unavailable,
stop the walkthrough and report it; do not alter configuration to conceal it.

1. Select EURUSD/1h; inspect source identity and the current three frames. Open
   Decision Center confidence/testing. Distinguish heuristic confluence from the
   original recorded fixed-rule historical test; unavailable results stay explicit.
2. Inspect the real decision and every blocker. **WAIT is a safety PASS, real
   eligible Ticket NOT_VERIFIED.** Do not repeat fetches until BUY/SELL appears.
   If no candidate exists, mark the positive Ticket/risk steps NOT_VERIFIED.
3. If an actual candidate exists, inspect recorded Entry/SL/available targets,
   confirmation/invalidation, support/opposition and source references. Inspect
   annotations and native/TradingView mode switch. The embed is a separate display
   feed, not independent validation of native THN prices.
4. Only for that actual candidate, use recorded levels and the **original** risk
   planner with explicit hypothetical capital, budget, costs and leverage. No
   account/order action. Eligible requires matching source/levels, budget and
   margin review; a separate valid plan must not validate this Ticket. Leverage
   here is hypothetical, not account leverage; execution price could differ.
5. Change instrument/timeframe once. Old levels, annotations and eligibility must
   withdraw immediately; any late result must not reattach. Return to the original
   context. Do not manufacture market staleness or alter clocks to claim real expiry.
6. Save a labelled research note using the original Library, revisit and return.
   Original context/notes stay unchanged. Test keyboard disclosures, level source
   focus and Escape return. No silent re-evaluation or order submission.
7. Repeat visible layout/control checks at **1440/768/390 × EN/AR × dark/light**
   (12 profiles). Inspect RTL, readable prices, large chart, no overlap, preserved
   notes and context. AI support/opposition and citations may be deterministic:
   record the actual method. No model request is part of steps A/B.

Receipt (statuses only; don't paste values or source times):

|Field|Record actual result|
|---|---|
|Candidate SHA / actor / application identity|SHA, OWNER, confirmed or NOT_VERIFIED|
|Environment / real vs synthetic|Preview or LOCAL; REAL observations or SYNTHETIC|
|Source / rights / contract / calendar|PASS / FAIL / NOT_VERIFIED separately|
|Decision / candidate / blockers|Actual BUY/SELL/WAIT, present/absent, fixed codes|
|Ticket risk / historical test / AI method|Actual bound state, recorded test state, deterministic/fallback/llm-assisted/unavailable|
|Chart / mode / citations / withdrawal / save-return / focus|PASS / FAIL / NOT_VERIFIED each|
|12 profiles|Passed count/12; list failing profile and demonstrated symptom|
|Real Ticket / real model / execution|PASS/FAIL/NOT_VERIFIED separately; execution=false|

## C. Minimal read-only model inventory

Use the already-installed, previously reviewed identity privately configured on
the owner device. **No model/service startup, pull, inference or AI_ENABLED change.**
If Ollama is not already available or exact identity is missing, stop.

```powershell
if (-not $env:THN_AI_MODEL -or $env:THN_AI_EXPECTED_DIGEST -cnotmatch '^[a-f0-9]{64}$') { throw 'Stop: exact reviewed identity missing.' }
$PrivateInventory = node scripts/pilot-local-ai.mjs --check --model $env:THN_AI_MODEL en
if ($LASTEXITCODE -ne 0) { throw 'Stop: inventory unavailable. No start/install/retry.' }
$Inventory = $PrivateInventory | ConvertFrom-Json
$Match = $Inventory.digest -ceq $env:THN_AI_EXPECTED_DIGEST
[pscustomobject]@{ installedIdentityChecked=$Inventory.modelInspectionVerified; reviewedDigestMatch=$Match; generationTested=$Inventory.generationTested; qualification='NOT_VERIFIED' }
if (-not $Match -or -not $Inventory.modelInspectionVerified -or $Inventory.generationTested) { throw 'Stop: inventory did not meet the read-only contract.' }
```

Do not post `$PrivateInventory`, digest or identity configuration. Inventory success
does not supersede the prior actual **12003 ms / no response / NO_GO** trial.

## D. Separately authorized real inference — not part of the command

**Pending explicit owner consent**: one EN attempt, then one AR attempt only if
EN is accepted. Existing exact model/digest, private auth and unchanged remaining
request/token budgets; original whole-request **12000 ms**, no retries/parallelism,
no service start, installs, provider changes or budget increases. If enabling an
unconfigured runtime is necessary, stop and obtain separate configuration approval.
Do not run `pilot --run` here: that CLI deliberately uses synthetic snapshots and
cannot establish real-source integration. Do not substitute deterministic prose.

After consent and read-only inventory PASS, use **existing Command Center Evidence
interpretation** on actual fresh, source-matched research. Select the existing
authorized local mode with private local access. Ask once in EN, “Analyze the
supporting and opposing evidence”. Stop on timeout, source refusal, digest mismatch,
invalid citations or fallback; mark NOT_VERIFIED/NO_GO, no second attempt. Only if
accepted, switch to AR and ask once, “حلل الأدلة الداعمة والمعارضة”.

Use the browser's Network timing for that single `/api/intelligence` request.
Do not export a HAR or copy request headers/bodies: they can contain private auth
and evidence. Browser duration includes transport; retained `generation.latencyMs`
measures generation only, not the whole request. They must not be conflated with
the server's12s deadline. Server-stage/settlement timing is not exposed by the
current Command Center; record it NOT_VERIFIED rather than inventing a value.
After each attempt this optional **read-only** browser-console expression emits
statuses/counts and browser timing, with no request or state changes:

```javascript
(() => { const v=THNIntelligence.view(), s=THNIntelligence.researchState(), r=v.current?v.result:null; const e=performance.getEntriesByType('resource').filter(e=>e.initiatorType==='fetch'&&new URL(e.name).pathname==='/api/intelligence').at(-1); return {language:document.documentElement.lang, current:!!v.current, method:['llm-assisted','deterministic'].includes(r?.method)?r.method:null, failureCode:['TIMEOUT','CONTEXT_CHANGED','BUDGET_EXHAUSTED','MODEL_UNAVAILABLE','INVALID_SCHEMA','UNSUPPORTED_CLAIM','INVALID_JSON','MODEL_RESPONSE_INVALID','CONTEXT_LIMIT','INVALID_RESPONSE'].includes(s.requestCode)?s.requestCode:null, browserRequestMs:e?Math.round(e.duration):null, generationOnlyMs:r?.generation?.latencyMs??null, serverWholeRequestMs:null, citations:r?.generation?.citations?.length??0, claims:r?.generation?.claims?.length??0, sourceFresh:r?.snapshot?r.snapshot.fresh===true:null, financialExecution:false}; })()
```

The latest resource entry is relevant only if it is this just-completed attempt;
if the browser omits entries or the request was not sent, mark timing NOT_VERIFIED.
This expression does not verify device model identity or grant acceptance. Retain private model prose for
human review against cited facts; publicly record language, REAL/SYNTHETIC source,
digest-match boolean, actual method/accepted state, fixed failure code, elapsed ms,
deadline exceeded, citation/claim counts, source match/freshness, human EN/AR quality
PASS/FAIL and execution=false. A deterministic fallback is **not model PASS**.
Missing timing/grounding evidence is NOT_VERIFIED. A successful pair is an initial
observation, not completion of repeated-case model qualification.

## E. Explicit Day9 source decisions / Day10 disposition

Choose **keep blocked** or separately approve the precise bounded proposal; this
document authorizes no access, outreach, paid cost, adoption or eligibility change.

|Decision|Required owner record before implementation|
|---|---|
|EURUSD correction|Attributable revised source or lawfully held independent private reference; source-specific quote/session/adjustment semantics; immutable original/reference; closed P2 contract accounting for36 cases. Original36 source-response violations remain verified; upstream construction cause and older record identity remain unverified. No repeat anomaly capture, tolerance or price repair|
|FX sessions|Named authoritative licensed historical session calendar/version/timezone/coverage/exceptions compatible with this feed's bars; approve comparison first, later admission policy separately. Weekend shapes never waive gaps or geometry|
|Native USD BTC|Choose existing lawful native-USD entitlement/product and approve a bounded read-only contract review/capture. Existing Yahoo BTC-USD isolation is a proposal, not routing approval; current Binance USDT is not USD|
|Genuine spot XAUUSD|Choose named spot XAU/USD per-troy-ounce entitlement, venue/composite and bid/ask/midpoint/transaction bar basis; specify15m/1h/1d timing. GC futures, broker CFDs and benchmarks cannot be silently relabelled spot|
|Rights/cost/retention for each|Current terms/version, local/hosted and derived-display rights, storage/backup/support-sharing/redistribution, geography, retention/deletion, quotas and maximum approved cost (or existing no-new-cost entitlement). Unknown terms remain NOT_VERIFIED; no vendor contact here|

See [existing source proposals](DATA-SOURCE-PROPOSALS.md) and
[immutable correction/qualification contract](SOURCE-CORRECTION-QUALIFICATION-PLAN-20261122.md).
Access approval, source adoption, financial policy and release are distinct decisions.

**Readiness:** engineering PASS alone is not operational GO. Missing lawful clean
source, real source-bound Ticket, real model/human EN/AR review or actual browser
acceptance means full operational release **NO_GO** on26 November. Keep PR23 draft;
no main/Production, execution, paid/hosted AI or new models/providers are authorized.
