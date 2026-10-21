# PR #5 Journal rendering correction

Parent candidate: `df87afb8d0529eb963a05664e7e038b64029ab87`.
Local correction only; PR #5 is not updated by this task.

## Confirmed cause

The hosted professional browser test checked the register immediately after saving
and navigation. The register listened for `thn:journal`, but no producer dispatched
that event. Same-tab localStorage changes do not fire `storage`. Instead a click
listener scheduled register rendering after 100 ms, while the test's navigation
helper waited 70 ms and then performed a non-waiting count assertion. Browser
protocol overhead sometimes concealed the race locally.

Baseline browser diagnostics proved that the saved EURUSD idea existed in storage,
classified as `research_idea`, and was excluded from financial selection while the
register remained empty in the same JavaScript task. The new regression fails
against the exact parent source. This is a stale-render lifecycle defect, not a
failed save or incorrect financial classification.

Populated-storage testing also exposed a deterministic ordering defect: journal
writes prepend new records, but the register reversed that order before selecting
30 rows. With 35 existing records, the saved idea disappeared once the delayed
render completed. Diagnostics recorded 36 stored records, correct classification,
and zero matching visible rows after rendering.

## Targeted changes

- `renderJournal()` synchronously notifies same-tab register readers. All existing
  save/import/delete/clear refresh paths use this common lifecycle; failures still
  preserve existing bytes and do not claim a successful save.
- Remove the register's delayed click refresh. Keep cross-tab storage and language
  refreshes, and display the existing newest-first storage order without mutation.
- Preserve the professional journey's visible label and inspection assertions,
  using Playwright's condition-based visibility expectation instead of a snapshot
  count. Keep the assertion excluding ideas from financial outcomes.
- Add a mandatory browser lifecycle suite: the actual professional analysis journey
  followed by 20 immediate save/navigation cycles (EN/AR, 0/35 prior records,
  five repetitions each), persistent reload, deletion, stored-record diagnostics,
  classification and financial exclusion. Its synchronous DOM assertion cannot
  pass merely because an automation command waited for a timer.

No classifier, numerical engine, TradingView integration, account authorization,
provider configuration, workflow permissions, or deployment configuration changes.

## Evidence

Raw local logs and baseline source copies are retained outside the repository at
`/workspace/work/journal-ci-remediation/`. `before-deterministic.log` records the
expected failure against parent source; `before.log` captures clean/populated
storage diagnostics. The focused suite writes `journal-lifecycle.json`.

Local environment matches CI Node 24.19.0, Python 3.12.14 and Playwright 1.62.0.
Chromium is the available system build 151.0.7922.173; the Playwright-managed
Chromium executable is not installed. Tests use the same packaged application,
offline provider fixture and hosted restrictions as CI. This is local validation,
not a claim that hosted CI has passed. Real external TradingView candle rendering
remains unverified under the managed network restrictions.

## Completed local validation

- All 16 mandatory browser suites passed, including the previously failing full
  professional journey and the added Journal lifecycle suite.
- Lifecycle suite passed twice: 40 total EN/AR clean/populated save/navigation/
  reload/delete cycles; the original source fails its synchronous render assertion.
- Professional matrix: 288 layout checks, 72 accessibility scans, 64 zoom checks;
  no browser runtime errors. TradingView remediation protocol suite passed.
- 155 unit/numerical/integration tests, 21 security tests and all 10 system assertions
  passed. Build, lint, production packaging, workflow validation, canonical source
  guard, frozen dependency install and dependency audit passed (zero vulnerabilities).
- Frozen numerical and TradingView workspace source files remain byte-identical to
  the parent. No checks were removed or skipped; the browser gate gained a suite.
- Packaged manifest SHA-256:
  `3c297dcdd1f00cea657db44a71332b38cae34b88ec8f8487880b21977e571cd1`.

Hosted CI remains pending approval to publish the new local SHA to PR #5. No push,
merge, hosted rerun, deployment, hosting change or spending occurred.
