# Phase 2.3 — Real-model pilot acceptance protocol (local, opt-in, zero hosted spend)

Status: **approved to prepare and evaluate a genuine local pilot**, NOT evidence that any model was installed, invoked, validated or integrated in Production. Owner explicitly permits an isolated trial, but has not authorized paid providers, credentials, hosted AI or trading.

## Baseline and reason for local-first
- Existing PR #23: source-backed Command Center evidence panel, original Research Assistant and a strict deterministic fallback; last verified candidate `e04f7ec16c6a3c891fe636774096456e4e31732b`.
- Vercel Production is still disabled for LLM generation. Neither `http://127.0.0.1:11434` on a user's PC nor a local runtime in CI is a remote endpoint reachable from Production.
- Existing `server/intelligence-local.js` allows Ollama only on literal loopback port 11434; it checks installed local weights, matching model digest and a size no greater than **2 GiB**, accepts context 2,048–8,192, and bounds generation to 12 seconds. Relaxing those constraints is **out of scope** until independently evaluated, tested and explicitly reviewed.
- The optional OpenAI provider path is deliberately **not** a safe substitute for the local pilot: it remains non-hosted only and uses a weaker legacy provider output contract. Do not configure a key or make paid calls.

## Candidates to evaluate, not pre-approved models

| Model tag | Ollama catalog nominal artifact size | Fit under current 2 GiB metadata guard | First-pilot role |
| --- | ---: | --- | --- |
| `qwen3:0.6b` | 523 MB | Yes | Low-cost/low-memory structured-output baseline; no expectation of financial competence |
| `qwen3:1.7b` | 1.4 GB | Yes | Main local candidate if available RAM/latency permit |
| `gemma3:1b` | 806 MB | Yes | Cross-family EN/AR comparison, subject to license/terms review |
| `qwen3:4b` | 2.5 GB | **No** | Do not install for existing pilot guard; separate architecture decision required |

These are published artifact size labels, **not measured RAM**, speed, correctness, recommendation quality or actual installed files. Confirm each model's exact tag, local digest, size and configured completion capability with `inspectLocalModel`. Ollama schema-based `/api/chat` generation uses `format` with a JSON schema; THN still independently validates every field after generation. Model license/terms and any external-download permission must be reviewed before obtaining weights.

Sources:
- https://ollama.com/library/qwen3
- https://ollama.com/library/qwen3:0.6b
- https://ollama.com/library/gemma3
- https://docs.ollama.com/capabilities/structured-outputs

## Authorization and infrastructure boundary
1. No model runtime is accessible from this assistant's execution environment at kickoff. A read-only loopback check found neither an Ollama executable nor a responding `127.0.0.1:11434` service; this says nothing about the owner's Windows computer.
2. The owner of the intended test computer must explicitly approve/install a local Ollama runtime and chosen model weights on **that computer or an explicitly authorized sandbox**. Do not run `ollama pull` automatically, connect to third-party host, provision a Vercel service, or enter/share keys.
3. Read-only readiness: run `ollama list`, then `node scripts/check-local-ai.mjs --model <installed-tag>`. Report model/digest/bytes; `generationTested:false` is expected until a real response succeeds.
4. Only in an authorized local process, set in the terminal (not Git, screenshots, browser storage or chat) `THN_AI_PROVIDER=ollama`, `THN_AI_MODEL=<verified tag>`, `THN_AI_ENABLED=1`, a private `THN_AI_AUTH_TOKEN` and strict per-process `THN_AI_MAX_REQUESTS`, `THN_AI_MAX_OUTPUT_TOKENS`, `THN_AI_TOTAL_TOKEN_CEILING`; keep `THN_LOCAL_PAPER=0`. Local auth and budgets are not durable shared spend accounting.
5. All browser-side attempts are explicit opt-in and isolated to the Research Assistant. Never send the token to a hosted preview. No order/broker/paper/live permissions are added.


## Reproducible operator CLI (added to PR #23)

The isolated pilot runner is `scripts/pilot-local-ai.mjs`. The script does not download or install weights, run orders, change hosted configuration or print provider prose. It accepts only an exact installed-model tag and an EN/AR locale; `--check` performs read-only inventory, while `--run` is a separate explicit local-only action.

```sh
# No model calls, no download, no credentials needed:
node scripts/pilot-local-ai.mjs --check --model qwen3:1.7b en

# ONLY after operator installs/approves a model and configures private local
# environment credentials and all bounded THN_AI_* settings:
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b ar
```

For `--run`, the terminal environment must explicitly set `THN_AI_ENABLED=1`, a privately chosen `THN_AI_AUTH_TOKEN`, `THN_AI_MAX_REQUESTS`, `THN_AI_MAX_OUTPUT_TOKENS`, `THN_AI_TOTAL_TOKEN_CEILING`, and `THN_LOCAL_PAPER=0`. The script invokes only the existing loopback Ollama adapter and the strict interpretation verifier, on frozen **synthetic** EURUSD/15m+1h+1d observations. Request reservations must not exceed the configured token ceiling. It reports model digest, accepted/fallback, citation/claim counts and latency if available; it deliberately suppresses actual prose, secrets and original data. Acceptance is a technical contract result, not independent human appraisal.

The script exits nonzero for an unavailable model, disabled/invalid budget configuration, rejected generation or invalid runtime. This prevents treating an invalid response as a passed pilot. The run mode requires a real installed local model; passing CI mocks does **not** prove real inference. Do not copy credentials into chat, source files, PR comments or screenshot evidence.

## Test matrix and quality gate
Use frozen, synthetic or pre-approved historical observations (never real brokerage credentials, personal data or private records). For each model run at least two distinct instances of each:
- aligned bullish, bearish and neutral/WAIT evidence;
- conflicting timeframes or opposing observations;
- source absent, stale, gapped and changed symbol/hash between request and response;
- missing/outdated historical test, hypothetical Trade Ticket and intentionally unsupported question;
- English and Arabic, with keyboard/RTL presentation;
- malformed/injected provider replies, unsupported percentages/entry prices, unsupported news and execution requests.

Record per request: model tag and immutable digest, evidence snapshot ID and time, accepted/rejected/fallback, valid citation IDs, exact field claims, conflicting assertions, omitted objections, EN/AR clarity, wall time, timeout, optional tokens and NO external provider calls. Strip secrets and unapproved market data from results.

**Mandatory gate:** 100% of accepted *structured claims* exactly match referenced source fields; 0 unsupported numeric predictions/orders/market-source switches; 0 leaked credentials; 0 late-context responses shown; 100% unsupported or malformed model outputs fall back deterministically. Report observed acceptance/abstention rate, median/p95 latency, and analyst ratings for explanation utility and uncertainty. **No numerical win-rate claim.**

A single successful response establishes actual inference but **does not** establish adequate model quality or justify deploying a hosted provider. Small models may be slow, overly terse, or incapable of satisfying the restrictive schema. If results are poor, downgrade or reject; do not quietly loosen validation.

## Implementation and release sequence
- P2.3a: review this protocol and check runtime/candidate suitability without a download or inference.
- P2.3b: run actual local weights only after the authorized operator confirms a machine/runtime is available; measure a real response using THN's strict generation contract.
- P2.3c: collect qualitative analyst review, test cancellation/rejection/identity, compare candidates, publish redacted evidence in PR #23.
- P2.3d: stop at a separate release gate. No merge to main/Production, hosted activation or paid provider without explicit owner permission.

**Current blocker:** no permitted accessible Ollama runtime or installed model has been identified for genuine inference testing. Offline/CI mocks cannot substitute for that result.

## Safe failure diagnosis for local pilot
The `--run` output now includes a fixed `failureCode` when strict interpretation falls back. Codes are `TIMEOUT` (local or outer deadline), `CONTEXT_LIMIT` (bounded context or reservation), `INVALID_JSON`, `INVALID_SCHEMA`, `UNSUPPORTED_CLAIM` (unsourced data or prohibited prose), `MODEL_RESPONSE_INVALID`, `MODEL_UNAVAILABLE`, `CONTEXT_CHANGED`, or `UNKNOWN`. Only these enums are emitted; raw model responses, private tokens, and arbitrary error messages remain suppressed. A code is a **failure category, not evidence of model quality**. Do not loosen the validation or increase the 12-second local timeout to make a failed model pass.

## P2.3b — Bounded local warm-model comparison (2026-11-17)

**Observed on the owner's Windows workstation:** simple `/api/generate` request with `keep_alive:'5m'` measured 14.67s cold (5.10s load, 9.03s generation, 133 output tokens) and 6.58s warm (0.02s load, 6.46s generation, 99 output tokens). These measurements are **not** the THN structured-evidence task, and neither accuracy nor passing the 12s THN deadline is established. The earlier THN pilot still returned `TIMEOUT` and deterministic fallback.

Only the isolated `scripts/pilot-local-ai.mjs --run` path can opt in to keeping loaded weights briefly via a new terminal-only `THN_AI_PILOT_KEEP_ALIVE=5m` variable. Omitting it still sends `keep_alive:0`; invalid values are rejected. The provider's 12s local timeout, independent 12s interpretation deadline, strict source/citation validation, hosted disable, zero trade execution, token reservation bounds, exact model metadata checks and safety fallback remain unchanged. The CLI reports `elapsedMs` for the complete attempt **even on rejection**, so the measured failure can be distinguished from an accepted response's `latencyMs`. Neither raw generated text nor secrets are printed.

Read-only model warm-up is not performed by this code and no weights are downloaded. For a controlled comparison, the operator can explicitly load the installed model using its local, literal-loopback API and then run the pilot immediately. Example *from an existing Windows PowerShell session where local pilot opt-in/authentication already exist*:

```powershell
$env:THN_AI_PILOT_KEEP_ALIVE = '5m'
# Uses existing local Ollama installation; this is a separate explicit warm-up request.
$warm = @{model='qwen3:1.7b';keep_alive='5m'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -ContentType 'application/json' -Body $warm | Out-Null
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en
```

A warm run **can still return `TIMEOUT`** on actual cited technical analysis. Do not increase the deadline or accept incomplete/unsupported answers to make a benchmark pass. Compare `elapsedMs`, `accepted`, `failureCode`, `matchedCitations`, and `matchedClaims` to the previously measured cold behavior. The broader product's provider path retains `keep_alive:0` by default and Production is not activated.

## P2.3c — Opt-in compact pilot contract

For the **isolated local CLI only**, set `THN_AI_PILOT_COMPACT=1` to use a shorter research prompt, a compact but source-preserving evidence projection, and Ollama `think:false` (suppressing optional model reasoning tokens). Default is unchanged. The compact projection keeps every reference ID, timeframe, direction, cited source, provider symbol and dataset hash, availability time, status, exact claimable indicator inputs, missing-data and limitations. The original frozen full evidence snapshot remains the authoritative validation target; **do not remove evidence citations or lower the validator requirements**. The compact mode is neither a claim of better accuracy nor evidence of acceptance until verified against real Qwen3 replies.

For the user's existing Windows PowerShell session after `git pull --ff-only` and local auth environment setup:
```powershell
$env:THN_AI_PILOT_COMPACT = '1'
$env:THN_AI_PILOT_KEEP_ALIVE = '5m'
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en
```
Keep the 12-second interpretation deadline unchanged and report `failureCode`, `elapsedMs`, `matchedCitations`, `matchedClaims`. Compare to the prior warmed full-prompt pilot (12,029 ms and `TIMEOUT`) without claiming speedup until measured. No hosted enablement, Production deploy or trading authorization.

## P2.3d — Bounded local CPU thread comparison (2026-11-17)

The owner's Intel Core i7-7600U has two physical cores and four logical processors. On a single *non-THN* local Ollama `/api/generate` benchmark with `think:false`, `num_predict:160`: two threads generated 112 tokens in 11.61s (9.64 tokens/s); four threads generated 126 tokens in 9.89s (12.74 tokens/s). This is suggestive, not conclusive: token counts differ, and the benchmark did **not** include the THN evidence/JSON schema.

The **isolated local CLI only** now permits explicit `THN_AI_PILOT_THREADS=2` or `=4` (or `=1`); omission retains the original one-thread default. Unsupported counts fail closed. All existing strict validation, 12s timeout, loopback and auth gates, model digest verification, and deterministic fallback are unchanged. With the existing authenticated Windows PowerShell environment:
```powershell
cd "$HOME\thn-ai-trader"
git pull --ff-only
$env:THN_AI_PILOT_COMPACT = "1"
$env:THN_AI_PILOT_KEEP_ALIVE = "5m"
$env:THN_AI_PILOT_THREADS = "4"
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en
```
Only an **actual accepted strict-citation result**, rather than a faster generic token rate, would advance real-model qualification. Report `accepted`, `failureCode`, `elapsedMs`, `matchedCitations` and `matchedClaims`, and do not extrapolate from this one benchmark.
