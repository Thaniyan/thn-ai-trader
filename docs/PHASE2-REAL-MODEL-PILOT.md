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
