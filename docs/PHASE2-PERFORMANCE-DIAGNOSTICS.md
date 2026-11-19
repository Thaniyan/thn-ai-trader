# Phase 2 local inference: deadline integrity, diagnostics and evaluation

Owner authorization: [PR23 comment6953635952](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-6953635952).
Base: `a5bbef8551ed1a31701fd3f87a24acc2e34709ac`. Existing draft PR23 only.
No main merge, Production deployment, model installation/download, hosted/paid
inference or paper/live financial execution is authorized or enabled here.

## What the 23,241ms observation establishes

The owner reports Windows Ollama0.40.16, qwen3:1.7b digest
`8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7`,
1.4GB nominal weights, and Intel i7-7600U: two physical cores/four logical threads.
Strict synthetic THN inference has **not** produced an accepted real-model result.
The warmed compact pilot reported12,017ms/TIMEOUT; four threads reported
23,241ms/TIMEOUT. Neither value proves when generation completed.

Source inspection found:

1. The old outer timeout was a JavaScript timer race. If synchronous work or
   scheduling delays the event loop, a resolved provider promise can win before
   the delayed timer runs. A timer alone cannot prove a result met its deadline.
2. The old CLI inspected inventory before starting its reported elapsed timer,
   then `generateLocal` inspected it again. Its provider latency also included
   inventory; these scopes obscured performance diagnosis.
3. The HTTP timeout destroyed the request but relied on a subsequent error event
   to settle. That is weaker than rejecting at cancellation and cleaning up the
   socket independently.

These are demonstrated engineering defects/measurement ambiguities. Without a
trace from the owner's actual machine, the precise cause of that particular
23-second settlement remains **unverified**. Do not describe it as a23-second
completed generation or infer adequate model quality from simple token tests.

## Implemented behavior

- The existing interpretation boundary and local adapter share an absolute
  **monotonic deadline, maximum12,000ms**. Checks bracket construction, inventory,
  generation and strict validation. A late valid response is discarded even if
  the timer callback could not run. Lower existing local timeouts remain allowed.
- Literal-loopback HTTP settles its promise immediately on abort/timeout,
  destroys its owned socket, and checks elapsed time again before accepting parsed
  responses. Endpoint, model-size, local/hosted, authentication, digest, source
  freshness and token reservation guards remain intact.
- The CLI runs its attempt inside an owned worker. An independent parent watchdog
  includes worker startup in the12s ceiling, terminates/unrefs only that worker,
  rejects late IPC results, and does not wait for an uncooperative provider.
  **It never kills Ollama or another user's inference.**
- Inventory runs once per inference request, inside its deadline. There is no
  cross-request identity cache. Optional `THN_AI_EXPECTED_DIGEST` pins single-pilot
  runs; the A/B runner always pins every selected model to the configured digest.
- Application requests remain in the original server architecture. Absolute
  checks enforce fail-closed acceptance even if its event loop cannot settle
  promptly; worker isolation is for the explicit operator CLI. This is not an
  operating-system hard real-time guarantee: OS suspension/starvation can delay
  any callback or console publication. Overruns are measured, never hidden.

## Safe metric meanings

| Field | Meaning / limitation |
| --- | --- |
| `timings.stages.construction` | Snapshot/prompt/schema preparation and local validation; repeated sequential spans accumulate. |
| `inventory` | One tags/show inspection. No generation is implied. |
| `generation` | Local chat HTTP attempt through full envelope receipt/decoding; not pure model compute. |
| `parsingValidation` | Model JSON parsing plus unchanged strict citation/claim validation, including outer validation. |
| `fallbackCleanup` | Local fallback/timer/listener cleanup, not proof that Ollama stopped. |
| `state: unsettled` | Span still running when the observer settled; never represented as completed. |
| `deadlineObservedMs` | When that observer noticed expiry; can exceed policy if blocked. |
| `settlementOverrunMs` | Observer settlement beyond its budget; **not** model generation duration. |
| `supervision.workerStartupMs` | Worker startup within the parent12s budget. |
| `heartbeatGapMs` / responsiveness | Scheduling responsiveness near settlement; a clue, not proof of a CPU/network root cause. |
| `runtimeSettlementVerified` | A completed matching response was observed; false on watchdog timeout. Cancellation requests alone cannot establish it. |
| `reportedLoadMs/PromptMs/GenerationMs/TotalMs` | Bounded **Ollama-reported** counters, only when a matching completed envelope was observed. These are not trusted local-clock measurements. |
| `requestBytes` / `requestedUnits` / `reservedUnits` | Serialized request bytes; requested conservative reservation; reservation actually charged. Missing values are null, not zero. Existing byte-based conservative accounting is unchanged; these are not tokenizer measurements. |
| `latencyMs` | Accepted-only generation HTTP span; inventory is now separate. Read stage metrics for failed attempts. |
| `elapsedMs` / `totalElapsedMs` | Scoped CLI request time / function time; watchdog failures explicitly include startup and unverified runtime settlement. |

Durations are bounded to24h with a clipping indicator, counters are bounded,
unknown stages/fields are rejected or omitted, and nonfinite values become null.
No raw observations, token, model prose, credentials, arbitrary exception strings
or provider-selected diagnostic names are serialized. Stage telemetry remains
available when the worker is terminated. Fixed failure codes remain compatible; `UNSUPPORTED_QUESTION` refuses generation
before inventory. The Arabic CLI uses a supported research question, and both
languages are checked against the original saved-committee contract.

## Source-preserving performance changes

Full and compact requests retain all reference IDs, exact inputs, hashes, provider
symbols, availability times, status, missing limitations, freshness, schema/engine
identity, events and retained quantitative context. Compact mode represents repeated
snapshot/symbol/interval/state/roles constants once in its **request-bound schema**.
Reconstructing schema constants plus wire evidence yields the full projection;
regression tests check this equality. Conversation history is retained in both modes.

The output still contains every original required field, including full context
identifiers. Only allowed references/context are narrowed; numerical claim values
must still be independently verified against the original frozen snapshot. No
partial/plaintext answer, invented fact, shortened hash or weaker verifier is used.

For the fixed English synthetic case,500 output-token limit and the same existing
conservative accounting, full reservation is4092 units and compact3890:202 fewer
units (about4.9%). This is a structural request-size measurement, **not** a measured
Windows latency, acceptance-rate or financial-competence improvement. Keeping full
identifiers may still be too expensive for qwen3:1.7b under12s on this CPU.
Default keep-alive0, compact-off and one thread are unchanged.

## Reproducible bounded A/B workflow

Use `scripts/assess-local-ai.mjs` with
`configs/phase2-assessment.example.json`. `--plan` does not inspect, download,
load or invoke a model. `--run` requires existing local authorization, paper-off,
installed exact digests, at least2GiB currently free RAM, at most20 requested trials,
and the existing request and50,000-unit maximum ceilings. It reserves worst-case
context per trial up front; budgets do not reset for each worker. Model artifact
size is not RAM measurement. Parallelism is always one.

Select installed qwen3:1.7b; optionally add installed qwen3:0.6b **after** inventory
provides its actual digest. Missing optional models are explicitly skipped, never
pulled. Choose1/2/4 threads, EN/AR, full/compact and requested cold/warm conditions.
The example is intentionally an8-trial batch rather than an unbounded Cartesian
product. Repeat comparable batches for bullish/bearish and missing/stale cases.

`prepareModel:true` is explicit operator permission to unload/load that installed
model with an empty local chat request before a trial. Preparation has a separately
labeled12s budget and at most one preparation per eligible trial; it does not
extend the inference request deadline. Negative evidence cases skip preparation
and never invoke inference. Requested conditions and preparation results are
recorded; actual load counters remain separate. Other clients can invalidate a
cold/warm assumption: use an otherwise idle local runtime.

On a timeout or failed preparation the batch stops. Remaining rows are not counted
as attempted or silently retried. A closed socket does not prove Ollama stopped;
confirm runtime idle before explicitly starting another batch.

Trials in a batch share a frozen synthetic evidence timestamp and scenario data,
so profile/thread comparisons do not silently change source evidence. Cases are
bullish, bearish, neutral/WAIT, conflicting, missing and stale. Record latency by
language/cell, technical acceptance ratio, verified citations/claims, failure codes,
Arabic/Latin script-presence checks and censored timeouts. Script presence is not
translation accuracy or explanation quality.

Combine bounded batches with `--summarize report1.json report2.json ...`.
Duplicate batch IDs, different resource settings, fixture/optimizer versions and
invalid row identities fail closed. Reports are explicitly **operator-local and
unattested**, not signed proof of hardware execution. The aggregator projects only
safe fields and never reprints arbitrary imported text.

### Objective decision gate

Each model/digest/thread/condition/profile cell needs at least two attempts of
each bullish/bearish/neutral/conflicting case **in each language**, and at least
one missing and stale negative in each language. Requirements: at least90%
eligible strict acceptance; no timeouts/late accepted results;100% accepted claims
source-verified; conflicting cases cite both opposing frame1h/frame1d observations;
negative cases never invoke generation; output has the requested script; all
conditions prepared; no leaked credentials. Incomplete/censored evidence is
**NO_GO**, not a zero-latency success. Accepted-only median/p95 must be read with
acceptance and timeout counts; do not compare unlike token workloads.

Passing this is only `TECHNICAL_CANDIDATE_REQUIRES_HUMAN_EN_AR_REVIEW`, never
financial approval. Analysts must separately assess language clarity, useful
opposing reasoning, missing evidence and semantic truthfulness using the existing
separately authorized local Research Assistant; the privacy-preserving CLI does
not log its prose. No automated win-rate, profitability, model competence or
Production readiness is inferred.

## Current decision table

| Item | Evidence available here | Decision |
| --- | --- | --- |
| Deadline, noncooperative transport, blocked worker, late results | Deterministic offline regressions | Engineering fix verified by tests; OS real-time behavior not guaranteed |
| Schema/evidence equivalence, strict EN/AR plumbing, secret filtering | Offline source/fixture tests | Contract retained; not model-language qualification |
| qwen3:1.7b strict inference on owner's CPU | Owner-reported TIMEOUT; no accepted result | NO_GO pending instrumented rerun |
| qwen3:0.6b | No accessible installation/digest here | Unverified; optional operator-installed comparison only |
| Real Windows speedup / EN/AR explanation quality | Owner computer inaccessible from Cloud; read-only local check unavailable | Not measured; do not claim success |
| Hosted inference, trading, main/Production | Not authorized | Remain disabled/untouched |

Operator instructions: [PowerShell5.1 runbook](PHASE2-PERFORMANCE-WINDOWS.md).
Mandatory verification commands remain build/lint, core numerical/integration,
security, system, complete browser/axe, packaging, workflow, dependency and source
integrity gates. Exact completed results are recorded with this candidate; a
passing offline mock is not a successful real-model pilot.

## Completed local verification

[Machine-readable commands and results](PHASE2-PERFORMANCE-VERIFICATION.json):
417 core/numerical/integration tests,21 dedicated security tests,10 system checks,
and all44 original browser/accessibility suites passed. Build, lint, production
packaging, workflow validation, dependency audit, canonical/source integrity and
Git object checks passed. The23 new performance regressions include a complete
supervised worker + literal-loopback HTTP fixture in both languages, exactly one
inventory per request, blocked-worker termination, late-result rejection, stage
privacy, source/schema equivalence and bounded A/B aggregation. The final full gate also checks supported Arabic
question routing and saved-record compatibility, and refuses unsupported model
requests before inference; runtime hashes remained unchanged throughout
the browser gate. No existing assertion or test timeout was relaxed.

The read-only qwen3:1.7b check returned unavailable in this Cloud environment.
That is an explicit real-hardware verification limitation, not a successful pilot.
Hosted CI/source-commit identity are reported after publishing this candidate to
its existing development branch. PR23 remains draft and main/Production untouched.
