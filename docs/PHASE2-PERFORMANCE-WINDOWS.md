# Windows PowerShell5.1 — bounded local model assessment

Use the existing repository and authorized private local pilot session. No hosted
Preview or Production connection to your Windows loopback runtime is configured.
Do not share the token, raw model prose or unapproved records in chat/PR logs.
No script here installs, pulls or downloads weights or enables financial execution.

## Update and inspect (no inference)

```powershell
cd "$HOME\thn-ai-trader"
git status --short
git checkout feature/ai-evidence-interpreter-phase2-20261116
git pull --ff-only origin feature/ai-evidence-interpreter-phase2-20261116
git rev-parse HEAD
node --version
ollama --version
ollama list
node scripts/pilot-local-ai.mjs --check --model qwen3:1.7b en
```

Do not discard local modifications if Git refuses to update. Node24.5+ is required.
Check that the exact installed digest matches the owner-verified value in the
example config. A different digest requires explicit candidate review, not a
silently updated result. Read-only metadata is not proof of successful generation.

## Existing private opt-in and limits

Retain your existing private `THN_AI_AUTH_TOKEN`; if absent, follow the private
entry instructions in [the original runbook](PHASE2-WINDOWS-LOCAL-PILOT.md). Never
put it in the assessment JSON, command arguments, screenshots or reports.
Only on the explicitly authorized local computer:

```powershell
$env:THN_AI_PROVIDER = 'ollama'
$env:THN_AI_ENABLED = '1'
$env:THN_LOCAL_PAPER = '0'
$env:THN_AI_MAX_REQUESTS = '8'
$env:THN_AI_MAX_OUTPUT_TOKENS = '500'
$env:THN_AI_TOTAL_TOKEN_CEILING = '40000'
$env:THN_AI_CONTEXT_TOKENS = '4096'
$env:THN_AI_EXPECTED_DIGEST = '8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7'
$env:THN_AI_PILOT_COMPACT = '1'
$env:THN_AI_PILOT_KEEP_ALIVE = '5m'
$env:THN_AI_PILOT_THREADS = '2'
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b ar
```

The original single-pilot command now uses independent worker supervision. A
fallback exits2, invalid/unavailable setup exits1, accepted technical response
exits0. Check `accepted`, `failureCode`, request/stage timings, supervision and
matched claims, not just wall time. `runtimeSettlementVerified:false` on timeout
means **do not assume Ollama finished**. Confirm idle before another trial.

## Verify timeout settings reporting (2026-11-18 correction)

The supervisor now validates and retains the requested settings before starting
its worker. The previous timeout-only report used defaults when the worker had
not returned its final result; this did not establish that those defaults were
sent to Ollama. The owner-observed 12003ms timeout remains a rejected inference,
not an accepted model result or proof of completed generation.

After the branch update and existing private opt-in above, run one bounded trial:

```powershell
$env:THN_AI_TIMEOUT_MS = '12000'
$env:THN_AI_PILOT_COMPACT = '1'
$env:THN_AI_PILOT_KEEP_ALIVE = '5m'
$env:THN_AI_PILOT_THREADS = '2'
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en |
    Out-File -FilePath "$env:TEMP\thn-settings-en.json" -Encoding utf8
$pilotExit = $LASTEXITCODE
$r = Get-Content "$env:TEMP\thn-settings-en.json" -Raw | ConvertFrom-Json
$r | Select-Object compactPilot, keepAlive, pilotThreads, requestedSettings,
    workerConfirmedSettings, settingsConfirmation, runtimeSettingsVerified,
    failureCode, accepted, supervision, timings | ConvertTo-Json -Depth 8
if ($r.requestedSettings.compactPilot -ne $true -or
    $r.requestedSettings.keepAlive -ne '5m' -or
    $r.requestedSettings.pilotThreads -ne 2) {
    throw 'Requested settings were not preserved.'
}
"Pilot exit: $pilotExit"
```

The top-level `compactPilot`, `keepAlive`, `pilotThreads` fields are compatibility
aliases for **validated requested settings**, not claims about runtime behavior.
`requestedSettings` must read `true`, `5m`, `2`, even if startup, inventory,
generation or worker termination prevents a final worker result.

- `settingsConfirmation: unconfirmed`: no matching worker acknowledgement arrived;
  `workerConfirmedSettings` is null. Do not substitute defaults for unknown values.
- `worker_validated`: the worker independently validated the same settings, but
  preparation of the generation request has not been confirmed.
- `request_prepared`: the worker confirmed the actual encoded request uses the
  compact profile (`think:false`), `keep_alive:'5m'` and `options.num_thread:2`.
  This receipt is emitted immediately before calling the loopback transport. It
  is not proof of server receipt, completed inference or actual scheduling.
- `runtimeSettingsVerified` remains false: Ollama has not independently attested
  that it applied these settings. Even a successful response cannot establish it.

After confirming Ollama is idle, repeat the exact trial with `ar` and a different
output file (`thn-settings-ar.json`). Do not run both concurrently or retry a
timeout while the runtime may still be busy. Exit2/TIMEOUT is still a failed
inference; this correction improves reporting, not model qualification or speed.
Invalid settings still reject the pilot before worker launch without logging
their raw values. Existing reports with missing settings project null rather
than inventing requested defaults.

## A/B batches, without changing the12s policy

The example explicitly permits empty-chat cold unload/warm load via
`prepareModel:true`. Close competing clients first; do not interrupt someone
else's active inference. Preparation time is separately reported.

```powershell
node scripts/assess-local-ai.mjs --plan configs/phase2-assessment.example.json
node scripts/assess-local-ai.mjs --run configs/phase2-assessment.example.json |
    Out-File -FilePath "$env:TEMP\thn-warm-conflict-neutral-1.json" -Encoding utf8
$LASTEXITCODE
```

Only redacted diagnostics are saved. A batch can exit2 because evidence is
incomplete even if some calls succeed. It stops after timeout, not silently
retries. The summarizer accepts the UTF-8 BOM written by PowerShell5.1.

Create another **local** config using ordinary PowerShell5.1 syntax (no ternary,
`??`, `-AsHashtable` or PowerShell7-only features):

```powershell
$cfg = Get-Content configs/phase2-assessment.example.json -Raw | ConvertFrom-Json
$cfg.cases = @('bullish','bearish')
$cfg.threads = @(2)
$cfg.conditions = @('warm')
$cfg.repetitions = 1
$cfg | ConvertTo-Json -Depth 8 |
    Out-File -FilePath "$env:TEMP\thn-bull-bear.json" -Encoding utf8
node scripts/assess-local-ai.mjs --plan "$env:TEMP\thn-bull-bear.json"
node scripts/assess-local-ai.mjs --run "$env:TEMP\thn-bull-bear.json" |
    Out-File -FilePath "$env:TEMP\thn-warm-bull-bear-1.json" -Encoding utf8
```

Repeat each positive-case batch once more as an independent batch for minimum
sample coverage. Also collect an8-trial batch with cases `@('missing','stale')`:
these must not invoke inference. Combine reports, for example:

```powershell
node scripts/assess-local-ai.mjs --summarize `
    "$env:TEMP\thn-warm-conflict-neutral-1.json" `
    "$env:TEMP\thn-warm-conflict-neutral-2.json" `
    "$env:TEMP\thn-warm-bull-bear-1.json" `
    "$env:TEMP\thn-warm-bull-bear-2.json" `
    "$env:TEMP\thn-warm-negative.json"
```

Do not reuse the same file to inflate sample count: duplicate batch IDs fail.
Repeat separate bounded cells for cold and1/4 threads. Keep context/output budget,
fixture version, hardware conditions and model digest fixed for comparisons.
Reports group by model/digest/condition/thread/profile and show EN/AR latency
separately; unlike generic token workloads are not comparable THN benchmarks.

## Optional qwen3:0.6b

Only if already installed and independently authorized:

```powershell
node scripts/pilot-local-ai.mjs --check --model qwen3:0.6b en
```

Use its actual inspected digest in a separate config model entry
`{model:'qwen3:0.6b', digest:<actual64hex>, optional:true}`. Never guess a digest or
run a pull command automatically. Adding both models to an8-trial config doubles
its resource demand; plan first and split into separate bounded batches. A missing
optional model is skipped and explicitly unverified.

## Interpret the decision

- TIMEOUT with active generation does not say the model completed; inspect stage
  state, heartbeat and settlement overrun. A responsive worker waiting on HTTP is
  different from an unresponsive worker, but OS scheduling can affect both.
- Inventory failure precedes generation; INVALID_JSON/SCHEMA/UNSUPPORTED_CLAIM can
  follow a completed response yet still be a rejected research interpretation.
- NO_GO is expected for inadequate samples, missing negative coverage, timeout,
  poor acceptance or wrong requested script. No verifier or deadline is relaxed.
- A technical candidate still needs human EN/AR clarity, opposing evidence and
  semantic-truth review. No numerical win probability or financial quality follows.

This work does not authorize merge, Production, hosted/paid AI, or paper/live
execution. If1.7b cannot satisfy the12s contract on the machine, retain deterministic
fallback and evaluate a permitted smaller installed candidate; do not raise the
policy to turn failure into a passing benchmark.
