# Local AI request efficiency —24 November2026

Existing draft PR23 / `feature/ai-evidence-interpreter-phase2-20261116`.
Baseline `7a79e44c0a13c9a77d19dde66172eb12fb1403b0`.
[Owner measured evidence and authority](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7125786633).
November26 is an acceptance review, not an automatic operational GO.

## Actual Windows evidence

The owner ran one authorized Qwen3:1.7b EN pilot. It failed TIMEOUT at approximately
12007–12011ms; accepted=false, citations/claims=0, generation started, worker
responsive at settlement. Startup333.7889ms consumes about2.8% of the12s ceiling.
No complete Ollama response arrived: load, prompt-evaluation, decoding duration and
prompt/completion tokens remain **unknown/null**, not zero. These observations
do not establish which generation substage caused the delay. AR was deliberately
not attempted because EN was not accepted.

The model was installed and Ollama reachable. Inventory digest self-match is not
an independently reviewed trusted-model anchor. Neither inventory nor this timeout
qualifies the model. No additional real inventory, inference, warm-up, service
startup, download or model activation was performed for this engineering task.

## Implemented request path

The original authenticated `generateLocal` now uses a pure shared request builder.
Its existing freshness/hash checks, secret rejection, request/total reservation,
inventory and exact-digest checks, transport limit,12s shared deadline, strict JSON
validation and deterministic fallback remain authoritative. No financial engine,
recommendation/admission rule, provider route, accepted UI or public output-schema
validator changes.

For the **existing explicit compact opt-in only**, the input encoder:

- Shares identical source/provider/status metadata as `refDefaults` only when it
  is present and identical in every retained reference.
- Interns repeated exact dataset hashes in `hashes`; a `$hash` input reference
  resolves to that exact digest. Scalar claim inputs, trends, reference IDs and
  availability times remain literal. All references and opposing evidence remain.
- Selects the smallest representation, retaining flat evidence when sharing
  costs more. Round-trip tests reconstruct every original retained JSON field,
  including provenance, events, quantitative/risk evidence, missing information
  and limitations. Undefined fields retain their original JSON omission semantics.

The model receives the explicit inheritance/hash lookup instructions. This changes
input representation and therefore needs renewed real quality qualification; a
lossless encoder alone does not prove that a small model interprets it correctly.
The original frozen snapshot remains the validator's authority. The model still
must return **every original output field** and exact valid citation/claim/context
values. No missing output is filled in, repaired or manufactured from the schema.

Compact generation requests minified JSON, preserves non-thinking mode and uses
temperature0 with repetition penalty1, avoiding a penalty on legitimate repeated
JSON keys/reference IDs. These are encoded request choices, not evidence that
Ollama applied them or that decoding is faster. Full mode remains the original
control; default compact/keep-alive/thread settings are not changed. No context,
output, request or cumulative budget is increased; reservation remains encoded
messages/format bytes +512 +the configured output allowance.

`runtime.requestProfile` is a closed diagnostic value identifying constructed
request material. It is not a model capability, applied-runtime confirmation or
successful-response flag. Unknown timing/token counters remain null. Existing
requested/worker-confirmed settings and runtimeSettingsVerified=false remain.
New assessment reports carry `shared-provenance-2`; old `bound-schema-1` reports
remain readable, but mixed optimizer versions cannot be pooled into qualification.

## Measured offline result and limits

Run only the new offline command from the existing checkout:

```powershell
node scripts/measure-local-request.mjs
```

It accepts no model/run/input flags, reads no private report or environment values,
and makes no inventory, network, worker or inference calls. It measures14 synthetic
EN/AR request-construction cases, including missing/stale cases as measurements
only; measurement does not admit those cases for generation.

|EN conflicting synthetic control|Baseline|New compact request|
|---|---:|---:|
|Encoded messages/format bytes|2878|2644|
|Reservation, same illustrative256 output allowance|3646|3412|
|Remaining under4096|450|684|
|Reserved percentage|89.0%|83.3%|

This exactly reproduces the posted byte/reservation pair:234 bytes saved (8.13%),
52% more **remaining encoded reservation headroom**. It is not a52% token or speed
improvement. The Arabic control saves234 bytes too. The10-reference rich synthetic
case saves407 bytes, but still exceeds4096 and must remain rejected at that context;
no evidence is discarded or ceiling waived to make it fit.

The initial Cloud benchmark measured baseline/new construction medians around
0.04/0.12ms and new p95 below1ms for the minimal control. Sharing adds small CPU
work; it does **not** make JSON construction faster. The committed receipt records
actual timings, which vary by host and are not Windows/i7 measurements.

A complete valid synthetic EN response with all frame claims uses570 minified
versus755 pretty-printed UTF-8 bytes (AR601 versus786). This illustrates whitespace
overhead only. It is not generated output, actual tokenizer usage, a guaranteed
model response size or measured decoding improvement. Output field/count/length
constraints and configured output allowance remain unchanged.

## Verification and qualification recommendation

Regression tests retain every original output field, strict citations/claims,
numeric-prose refusal, EN/AR, context/digest/source checks, missing/stale refusal,
unchanged reservation and12s cancellation/worker contracts. Added tests cover
lossless sharing, malformed references, full-mode/history preservation, greedy
request encoding, truncated JSON rejection, redacted/null diagnostics, version
isolation and an offline CLI that refuses inference arguments. Existing browser,
security, numerical, system, packaging and integrity gates remain mandatory.

Do not diagnose load, prompt processing or decoding from the current absent
counters. The observed i7 trial had less than11.7s left after worker startup and
did not finish. Without the exact CPU/quantization, tokenizer, memory residency,
actual token counts and load/evaluation durations, there is no defensible real
latency prediction or claim that an8% input reduction will meet12s. The strict
response's fixed fields/source digest and evidence claims still incur generation
work. Cold loading may matter, but was not measured and is not an established cause.

**Real-model qualification remains NOT_VERIFIED / NO_GO.** If the owner separately
renews consent after reviewing this exact candidate and an independent trusted
model/digest anchor, permit only the separately bounded existing EN acceptance
attempt; AR follows only if EN is genuinely accepted. No retries, warm-up, service
startup, model replacement/install, budget increase or hosted/paid inference is
authorized here. Missing full JSON, invalid citations/language/context or a timeout
must retain deterministic fallback and NO_GO. Do not repeat the prior command now.

For November26, recommend owner review of the verified software candidate while
keeping operational AI release NO_GO until actual accepted EN/AR performance,
human utility/safety review, source rights/semantics and real eligible Ticket gates
are independently met. Do not trade strictness or the deadline for a calendar PASS.
Keep PR23 draft, main and Production untouched, and execution disabled.
