# Day 6 — offline local-AI qualification preparation

2026-11-22, PR #23. This is executable preparation, not model qualification.
No application, UI, numerical engine, provider permission, model or deadline changed.

## Working capability

`node scripts/prepare-local-ai.mjs --plan <private-assessment.json>` validates the
existing `THN-LOCAL-ASSESSMENT-1` contract using `assessmentPlan`, the existing
loopback configuration/budget validators and validated pilot settings. It requires
one exact requested model/digest, both EN/AR and all six evidence cases. It refuses
invalid settings, hosted context, paper execution, identity mismatch and exhausted
budgets. It neither sets environment values nor enables inference.

The JSON output shows requested settings separately from unconfirmed worker/runtime
settings, reserved context units, coverage limitations, six existing immutable
synthetic evidence contract checks, future single-shot commands and explicit
`NOT_VERIFIED` model/inventory status with a `NO_GO` release decision. It contains
no snapshot, OHLC values, model prose, token, configuration path or digest value.
`--run`, `--check` and install flags are deliberately unsupported. Preparation does
not call inventory HTTP, generation, workers, subprocesses or model preparation.
A successful CLI exit means configuration validation only; it never means AI PASS.

## Actual Day 6 findings

The existing runtime path already provides strict snapshot hash/context and citation
validation, source-grounded claims, opposing-evidence checks, bounded output,
deterministic fallback and independent 12-second worker supervision. Existing
assessment summaries require repeated EN/AR positive cases, both negative cases,
valid citations, language checks, preparation evidence and human review. These
contracts are reused, not replaced by this preparation tool.

Read-only checks found no `ollama` executable on PATH, `/usr/bin/ollama` or
`/usr/local/bin/ollama`, and no model directory at `/workspace/.ollama/models` or
`/root/.ollama/models` in this Cloud workspace. This limited filesystem check is
not a runtime inventory and cannot establish what is installed on the Windows
owner device. No network request or model execution was made.

The last actual owner-device result remains **NO_GO**: TIMEOUT at 12003 ms,
no response, generation unsettled. That is separate from the newly prepared
configuration, whose actual model latency/quality remains **NOT_VERIFIED**.
No new model was downloaded, installed, started, activated or qualified.

## Owner-device handoff — offline first

Use the existing repository and privately configured model/digest, budgets and
settings. Do not paste credentials or raw model outputs into PR comments. This
PowerShell command constructs a private plan from existing settings; it does not
change environment values, install or activate anything:

```powershell
if (-not $env:THN_AI_MODEL -or -not $env:THN_AI_EXPECTED_DIGEST) { throw 'Existing reviewed model/digest required; do not invent them.' }
$condition = if ($env:THN_AI_PILOT_KEEP_ALIVE -eq '5m') { 'warm' } else { 'cold' }
$profile = if ($env:THN_AI_PILOT_COMPACT -eq '1') { 'compact' } else { 'full' }
$threads = if ($env:THN_AI_PILOT_THREADS) { [int]$env:THN_AI_PILOT_THREADS } else { 1 }
$plan = @{ schema='THN-LOCAL-ASSESSMENT-1'; models=@(@{ model=$env:THN_AI_MODEL; digest=$env:THN_AI_EXPECTED_DIGEST; optional=$false }); languages=@('en','ar'); threads=@($threads); conditions=@($condition); profiles=@($profile); cases=@('bullish','bearish','neutral','conflicting','missing','stale'); repetitions=1; prepareModel=$false }
$planPath = Join-Path $env:TEMP 'thn-local-ai-private-plan.json'
$plan | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $planPath
node scripts/prepare-local-ai.mjs --plan $planPath
```

At context 4096 this 12-case plan reserves 49152 units, requiring at least 12
requests and that many units inside the existing maximum 50000. Smaller budgets
are rejected; the tool never increases them. It explicitly reports incomplete
repeated-positive coverage: passing this one batch cannot qualify the model.
Do not reset/replenish budgets automatically or use the plan as authorization.

## Future single-shot — only after separate owner authorization

These are the existing real inference commands, shown for handoff only. **Do not
run them as part of Day 6.** They require an already installed, exact reviewed local
model, an already running authorized local runtime, existing explicit local opt-in,
a private token, paper mode off and unchanged bounded budgets. No command below
installs a model, starts Ollama or changes the environment:

```powershell
node scripts/pilot-local-ai.mjs --run --model $env:THN_AI_MODEL en
if ($LASTEXITCODE -ne 0) { throw 'Stop: no accepted English model result. Do not auto-retry or extend the deadline.' }
node scripts/pilot-local-ai.mjs --run --model $env:THN_AI_MODEL ar
if ($LASTEXITCODE -ne 0) { throw 'Stop: no accepted Arabic model result. Do not auto-retry or extend the deadline.' }
```

Each uses the existing supervised 12-second ceiling, synthetic conflicting evidence
and exact installed digest guard. A successful pair still establishes neither
market-data qualification, financial competence nor full repeated EN/AR model
qualification. Report accepted/fallback, failure code, requested/worker-confirmed
settings, digest verified status, matched citations/claims, elapsed time and
settlement status only. Keep any human-language review local/private.

Next meaningful gate is a separately authorized real owner-device attempt with a
strictly accepted source-grounded response within 12 seconds; TIMEOUT remains
NO_GO. If successful, use the original assessment/combination tools for bounded
repeated EN/AR positive and negative coverage and human utility review under
reviewed cumulative budgets. No new weights, paid/hosted inference or execution.
