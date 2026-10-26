# Research evidence workflow — local candidate

Base: released `7a742fdfc6b370afdd30e7cac485ad65aa3912d6`.
Branch: `feature/research-evidence-workflow`. No publication or deployment authorized.

A user can inspect the evidence behind a desk review, understand the indicator
observations and limitations, prepare a follow-up question, then return to the
same chart context. This improves the research workflow; it does not activate AI
models, brokers, hosted accounts or trading.

## Changes

- One shared evidence renderer for the Dashboard/Terminal reader and original
  assistant's role citations. Sources, provider symbols, availability timestamps,
  indicator values, limitations and original reference identity remain visible.
- The chart's pinned timeframe leads the reader. Price display delegates to the
  existing formatter; raw snapshot values remain available for verification.
- Readable structure names, explicit historical/hypothetical status, no invented
  missing values or calculated forecasts. Unknown raw fields are not copied.
- A keyboard-accessible modal with a persistent Close control, Escape/return focus,
  responsive EN/AR/RTL and themes. Context changes close outdated evidence.
- Guided question starters and the evidence-to-assistant action prepare editable
  drafts. They never automatically submit an inference request. Existing explicit
  submission, cancellation, provider authentication and bounds remain authoritative.
- “Inspect current chart” requires a matching reviewed context and delegates to
  the original chart/overlays. No replacement chart or numerical engine.

## Validation scope

The full local packaged browser gate is followed by focused final-source checks
for evidence presentation, assistant and responsive layout. Exact results and
native before/after captures are under `research-evidence-workflow/` once finalized.
Frozen provider fixtures exercise actual local analysis/committee HTTP routes;
they do not establish real-model or live external TradingView quality.

Numerical modules, server/API gates, financial record classification, account
storage, official TradingView lifecycle and hosting settings are preserved.
Real generative inference remains unavailable here. The hosted site continues
using the previously approved release until separate owner release approval.

## Final local results

- 174 unit/integration tests, 21 security tests and all 10 system checks passed.
- Full packaged run: all 24 browser suites passed on the initial integration.
  Final refined package: evidence workflow, assistant and original layout suites
  passed again. Evidence coverage includes 16 EN/AR/theme/viewport profiles, 16
  reader accessibility scans, 4 expanded-raw-reference scans, keyboard/return focus,
  busy-request draft protection and actual context-change dismissal. Assistant:
  85 checks. Existing layout suite: 202 cases, zero failures.
- Build/lint, workflow/source guards, dependency audit (zero advisories) passed.
  Packaging reproduced identical manifests twice.
- No model call, download, paid API, financial activation, push or deployment.

The full-run and final-targeted artifact hashes and exact scopes are recorded in
[validation.json](research-evidence-workflow/validation.json). This distinguishes
completed full regression from checks rerun for the final small refinements.

[Before/after comparison](research-evidence-workflow/comparison.html) ·
[Desktop reader](research-evidence-workflow/after-reader-en-1440.png) ·
[Arabic mobile reader](research-evidence-workflow/after-reader-ar-390.png) ·
[Native image integrity](research-evidence-workflow/image-manifest.json).

This is a local review candidate. Production remains on the previously approved
release. Real-model reasoning quality and live third-party candle reliability are
not established by these offline tests. Browser research remains device-local.

## Subsequent hosted gate

The approved original candidate later failed hosted dialog-width checks in PR #11.
Production was not updated. See [targeted correction and evidence](EVIDENCE-OVERFLOW-REMEDIATION.md).
Local passes above are retained as historical evidence, not substituted for hosted CI.
