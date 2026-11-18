# Phase2 supervised settings reporting — 2026-11-18

Scope: existing draft PR23, branch
`feature/ai-evidence-interpreter-phase2-20261116`, from owner-verified
`389000dc7bb77ba95e51d51d9d99f37bfd9cae49`. No UI, financial formula, provider
activation, dependencies, timeout policy or original assertion is changed.

## Finding and correction

The owner reports the supervisor correctly timed out at 12,003 ms, with generation
unsettled and no response, while nondefault requested settings were displayed as
defaults. The allowlisted environment already reached the worker. However,
`finish(null,true)` called `safePilotReport(null)`, whose missing-field defaults
were `false`, `0`, `1`. Settings were only in the worker's final result, which a
watchdog must not wait for. The erroneous report cannot establish which settings
Ollama received or applied.

The supervisor now validates the three settings once before worker creation and
retains its own immutable requested receipt on every completion path. The worker
independently uses the same validator and emits small allowlisted receipts for
validation and actual request-body preparation. Parent receipts must match the
requested settings and cannot regress from prepared to validated. Missing,
mismatched and malformed receipts never become confirmations. Worker failure,
exit, noncooperation and timeout cannot overwrite the requested receipt.

`requestedSettings` and compatibility aliases identify validated user requests.
`workerConfirmedSettings` and `settingsConfirmation` identify observed worker
progress only. `runtimeSettingsVerified:false` explicitly avoids claiming Ollama
applied options. Missing legacy settings now project null, not invented defaults.
All receipts contain only a boolean, a bounded keep-alive choice and 1/2/4 threads;
no environment, provider prose, evidence, exception or credential is serialized.

The request-body hook is observational, defaults to a no-op, contains only these
three projected settings and cannot relax deadline or validation checks. The
absolute 12-second acceptance limit, independent watchdog, exact installed identity,
budgets, authentication, strict citations and deterministic fallback remain.

The first complete regression run also exposed an existing fractional timer
rounding defect: the unchanged 150 ms noncooperative-worker assertion observed an
early timeout. The watchdog now rechecks the same absolute deadline when its
timer fires and schedules only the remaining fraction if needed. This prevents
an early callback from falsely declaring TIMEOUT; it does not extend the policy
or permit late acceptance. The original assertion is unchanged.

## Regression evidence

Six new regressions cover timeout before acknowledgement, validated/prepared
asynchronous waits, a noncooperative worker, abrupt exit/error, ordinary inventory
rejection, invalid settings before launch, explicit true defaults, contradictory
or secret-bearing receipts, legacy unknown fields, and full supervised EN/AR
HTTP generation timeouts. The existing EN/AR successful HTTP pipeline also checks
requested/prepared receipts. Fixtures are offline synthetic tests, not actual
Ollama inference. See the release logs for complete gate outcomes.

A separate actual-CLI, default-policy offline HTTP trial returned exit2/TIMEOUT
at 12,002 ms with `accepted:false`, `requestedSettings` and
`workerConfirmedSettings` both `{compactPilot:true,keepAlive:'5m',pilotThreads:2}`,
`settingsConfirmation:'request_prepared'`, no response received and
`runtimeSettingsVerified:false`. This exercises the real supervisor/worker/CLI
JSON path at the unchanged 12,000 ms policy, not only shortened unit-test clocks.

Final local gates passed:423 core/unit/integration/numerical tests (including29
performance regressions),21 dedicated security tests, all10 isolated system
checks and all44 browser/accessibility suites. Original shards0/1 passed24/20
suites respectively, both exit0, in1389.19s total. Build, lint, production
packaging, workflow validation, dependency audit (all severities zero), frozen
dependency install, Git integrity and canonical/source/numerical parity passed.
Neither dependency file changed. No original assertion or timeout was weakened.

Both local browser runner logs include non-failing Python Playwright cleanup
warnings (`Task was destroyed but it is pending` / `TargetClosedError`) after
their last passing suite. Both runners exited0 and every required suite completed;
the warnings were retained, not suppressed or counted as application failures.
No unrelated browser-runner modification was made for this diagnostic correction.

The owner Windows hardware is not available in Cloud. No speedup, successful
real-model inference or real Windows verification is claimed. Use the exact
PowerShell5.1 procedure in [the runbook](PHASE2-PERFORMANCE-WINDOWS.md#verify-timeout-settings-reporting-2026-11-18-correction).
Only the existing development branch is authorized for this correction; no main
merge, Production deployment, hosted/paid inference or financial execution.
