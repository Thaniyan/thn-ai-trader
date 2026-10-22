# PR #5 intermittent widget assertion diagnosis

Original SHA: `9f37b755ceb296f4168724631aef3c305015e04d`.
Original PR workflow: 39726512226; failing browser job: 119651666718.
One retry of that exact job was requested using GitHub's single-job rerun API;
no commit was changed remotely and no second retry was requested.

## Evidence and root cause

The old transition assertion inspected `__widgets.at(-1)`. This is an append-only
history of fixture bootstrap executions, including detached obsolete generations;
it is not the currently mounted widget. Two changes (symbol, then interval) create
two async script generations at the same public URL. Execution/completion order is
not guaranteed to follow insertion order, including browser-coalesced fetches.

A local stress run reproduced the failure after two successful 12-transition laps:

| State | Symbol | Interval | Container |
| --- | --- | --- | --- |
| Expected | OANDA:XAUUSD | 15 | current |
| Selected context and controls | XAUUSD | 15m | — |
| Mounted/executed active widget | OANDA:XAUUSD | 15 | thn-tv-39 |
| Last historical execution | OANDA:XAUUSD | 60 | thn-tv-38 (detached) |

The active generation had scriptLoaded=true, iframeLoaded=true and the correct
configuration. A separate reverse-completion reproduction yielded current
thn-tv-3 (GBPUSD/15), followed in history by detached thn-tv-2 (GBPUSD/60).
Thus the old predicate can remain false for 30 seconds while the application is
correct. The original hosted log contains neither the pair nor generation state;
its exact failing pair cannot be recovered. The same failure mechanism is now
reproduced locally, rather than inferred from a successful retry.

Inspection confirms context-changing events are distinct from metadata events;
provider requests reject stale sequence/context results. The embed has unique
parents and generation guards on timers/load/error handlers. Detached scripts do
not replace the current parent or restore the research context. No user-facing
incorrect symbol/interval was observed in these reproductions. This does not
establish real TradingView candle availability or exclude all third-party defects.

## Targeted test correction

- Synchronize each committed symbol and interval with the actual context event
  result, then require the matching fixture execution for the active parent ID,
  successful script and iframe flags, and exactly one frame in that parent.
- Preserve all 12 functional mappings and public configuration assertions, retry,
  failure, timeout, stale-event, fallback, risk, Library, geometry and axe coverage.
- Record transition state and full failure JSON. Compact assertion failures include
  expected values, selected context/controls, active container/widget, historical
  tail and readiness flags, so the CI runner's bounded log still contains them.
- Add a controlled fixture that defers detached bootstrap completion. Release it
  after the active frame initializes; explicitly prove that the old historical-tail
  predicate is false while the active generation/context/frame remain correct.
  This is protocol-only fixture behavior, never a fabricated market-data result.
- No timeout increase, added arbitrary sleep, private TradingView API, production
  runtime change, numerical change, Journal change or CI permission change.

The first exploratory test needed to restore its context before the existing
network-failure cases; the final test restores EURUSD/1h explicitly. Exploratory
logs and original diagnostics remain retained, including unsuccessful trials.

## Local evidence

`/workspace/work/pr5-intermittent/` contains the original failure.json,
reverse.json, transition traces, corrected suite logs/screenshots and gate logs.
Node 24.19.0, Python 3.12.14 and Playwright 1.62.0 match CI; local Chromium is the
available system build 151.0.7922.173. Exact hosted Chromium binary parity is not
claimed. Provider and widget responses are explicit offline fixtures.

Only tests and this document change. The production package and every runtime
source file remain identical to the original SHA. The new local commit needs
separate owner approval before updating PR #5. No merge/deployment is authorized.

## Completed local checks

- Corrected TradingView suite passed three times, including all 12 mappings,
  deterministic detached-completion negative control, retry/fallback/network
  failure checks, risk and Library journeys, 24 layout and 24 accessibility scans
  per run, and zero browser runtime errors. The final run includes null-safe
  diagnostics for a script that never initializes.
- Corrected active-generation stress predicate passed 15 laps / 180 transitions.
  The original predicate failed naturally on lap 2 with the state recorded above.
- 155 unit/numerical/integration tests, 21 security tests, all 10 system assertions,
  build, lint, packaging, workflow, canonical source guard and dependency audit
  passed. No vulnerabilities reported.
- Package manifest remains exactly
  `32f5c8fcba0397daa547d5f754007978a9bb635ba226a3f7fbe74124e66eb6d4`.
- The complete browser gate was not redundantly rerun locally: other runtime and
  browser suites are unchanged, and all 16 passed in original push CI. The new
  candidate still requires fresh mandatory hosted checks after publication approval.

## Single hosted retry outcome

The one authorized retry passed: browser job 119657882387, workflow 39726512226,
attempt 2, original SHA `9f37b755ceb296f4168724631aef3c305015e04d`.
All 16 browser suites passed, including professional, Journal lifecycle and
TradingView remediation. Source/tests and dependency results remain successful.
No further retry was requested.

The green retry is consistent with the reproduced asynchronous history race; it
is not proof that the old assertion is sound. Recommend the new test-corrected
candidate and a fresh exact-SHA approval rather than relying on the retry alone.
The production runtime is unchanged; actual external candle loading remains an
independent provider/network limitation. No merge, push or deployment occurred.
