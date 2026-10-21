# Journal lifecycle CI stabilization

Parent: `70c9b73df5bae7a418047f424acde84300236053`; PR #5 remains unchanged.

## Root cause and reproduction

Both hosted browser runs passed the original professional Journal assertion and
TradingView remediation. Only the added lifecycle suite failed: after reload it
waited for `THNProfessional` and `THNRecords`, then attempted another save without
establishing that the asynchronous deterministic analysis had completed. A module
being loaded is not an analysis-ready signal. Startup schedules analysis after
250 ms; the actual provider-backed request is asynchronous. `currentAnalysis`
is initialized to null on reload and is assigned only after successful analysis.

A local browser reproduction held the real `/api/analyze` request across reload.
The original readiness predicate passed while analysis was unavailable. Calling
`saveJournal(); getJournal()[0].symbol` reproduced the hosted TypeError. The save
itself correctly refused: no records were written, original storage was unchanged,
and the application emitted the existing localized "Run analysis first" notice.
Users can encounter this unavailable state immediately after reload, but the
application reports it safely rather than claiming a successful save. The save guard itself is correct. A separate warning-display defect was found
while validating its user-visible behavior (below).

## Readiness and notification correction

Every repeated case now holds genuine analysis requests during reload, asserts
that saving without analysis leaves storage unchanged and emits the EN/AR warning,
then releases the requests. It explicitly clicks "Analyze selected instrument",
requires a successful real fixture-backed analysis response, and waits for the
current context's analysis and completed action before saving. No analysis state
or record is fabricated. Existing deterministic provider fixtures are unchanged.
All added waits are condition-based and bounded by Playwright's default timeout.

The same-task save/navigation/DOM assertion is retained, as are persisted storage,
newest-first display, classification and exclusion from financial outcomes. Cases
also inspect original records, verify unverified status/no PnL, reload, and delete.
The matrix remains five repetitions of EN/AR with 0/35 prior records (20 per run).

An exploratory asynchronous toast expectation was interrupted by a normal scanner
notification. The final assertion captures the save warning, toast visibility,
and unchanged storage in the same task, verifying the precise save response
without confusing a later unrelated scanner notification with save failure.

The existing notice helper targeted nonexistent `toastPair`; current markup uses
`toastReason`. Correcting that target ensures the localized save rejection appears
in the visible alert instead of leaving old scanner text there. This is the only
runtime change. The test and this evidence document also change. The synchronous Journal runtime
fix, storage ordering, classifier, numerical engines, official TradingView embed,
workflow protections, hosted account/execution and generative restrictions remain
byte-identical to the parent.

## Environment and evidence

Node 24.19.0, Python 3.12.14, Playwright 1.62.0 and pinned axe tooling match CI.
Available system Chromium: 151.0.7922.173. The managed Playwright Chromium binary
is not installed, so exact browser-binary parity with GitHub is unverified. Tests
use the same packaged server, provider fixtures and hosted restriction environment.

Evidence is retained at `/workspace/work/journal-reload-stabilization/`; the initial
reproduction and first corrected run are also retained under
`/workspace/work/journal-ci-remediation/reload-before.log` and `reload-after1.log`.
Local success is not a claim of hosted CI success or real TradingView candles.
The initial full browser run was superseded after the warning-target correction;
a final complete run validates the final application source.
No push, hosted rerun, PR update, merge, deployment, settings change, new resource
or paid service is part of this correction.

## Final validation

- All 16 browser suites passed on the final packaged application, including the
  original professional Journal assertion, the strengthened lifecycle suite and
  TradingView protocol/fallback coverage. No tests were disabled or skipped.
- Final lifecycle version passed standalone and in the complete gate: 40 total
  EN/AR, 0/35-prior-record cases. Each case exercises genuine unavailable analysis,
  visible localized warning, unchanged storage, explicit analysis HTTP 200,
  immediate save/navigation/render, record inspection, reload and deletion.
- Professional matrix: 288 layout checks, 72 accessibility scans, 64 zoom checks;
  zero browser runtime errors.
- 155 unit/numerical/integration tests, 21 security tests, all 10 system assertions,
  build, lint, packaging, source-integrity/canonical guard, workflow validation,
  frozen dependency install and dependency audit passed. Zero vulnerabilities.
- Final package manifest SHA-256:
  `32f5c8fcba0397daa547d5f754007978a9bb635ba226a3f7fbe74124e66eb6d4`.

Release remains gated on owner approval of the new local commit, followed by
publication to the existing PR and mandatory hosted CI. Actual third-party
TradingView candle rendering and exact hosted Chromium-binary parity remain
unverified. No Production or remote Git changes occurred in this task.
