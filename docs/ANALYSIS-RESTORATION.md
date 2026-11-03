# Analysis and confidence restoration

This pass responds to the owner's before/after screenshot comparison. The references
contain 25 earlier screenshots and six current screenshots. They are visual evidence,
not instructions to execute or proof that every pictured feature worked. Private
browser chrome and uploaded archives stay outside tracked source and production.

## Findings and implemented response

- Earlier THN screens gave the decision, confidence ring, analysis schools and
  playbook a strong visual hierarchy. Recent screens prioritize generic explanatory
  panels and bury the original school assessments in an advanced disclosure.
  The Intelligence view now opens with a dedicated analysis center, the actual
  confidence ring and eight original school cards. Its evidence overview is compact.
- The existing Dashboard/Terminal decision desk now exposes both school confluence
  and historical checks, with a direct route to the detailed analysis.
- The earlier screenshots also show zero market/entry/support values alongside
  seemingly favorable governance scores. Those values are not copied or fabricated.
  Current context/hash checks withhold mismatched analysis and historical scores.
- A visible research playbook connects timeframe conflicts, existing hypothetical
  scenarios, Risk Desk inputs, validation and Journal/Library. Scenario transfers
  reuse the authoritative existing action handler; no new order path exists.
- Historical evaluation previously appeared as a closed disclosure above a flat
  collection of controls. It opens by default and groups the original controls into
  strategy/direction, hypothetical sizing/costs and independent validation windows.
  Original IDs, form handlers and strategy-specific field visibility are retained.
  Before a test, the ten-check checklist is expandable so it does not obstruct the
  configuration form. Current completed results expand the checklist automatically.
- Bullish references were misleadingly presented as "agreement", while bearish
  references were always labeled "counter-evidence". Both are now correctly labeled
  by direction; bearish evidence can support a bearish hypothesis.
- Evaluation requests now have a 25-second timeout. Failure retains earlier reports
  and restores retry controls. Pending, failed and changed-input reports cannot show
  a current validation score. A first failure is distinguished from an untested state.
  Changes made while a request is in flight also mark the arriving report as belonging
  to earlier settings; the engine result is preserved without presenting it as current.
- Analysis controls show their preparing/disabled state rather than accepting clicks
  that silently do nothing while the existing review is busy.

## Meaning of the scores

The confidence ring restores the **existing** school-confluence heuristic:
`round(clamp(46 + 1.28*abs(weightedConsensus) + 2.5*directionalSchools - 3.2*riskWarnings,18,94))`.
It is not a calibrated win probability, statistical confidence interval, independent
AI vote, or historical accuracy measurement. The formula is disclosed in the UI.
School indicators retain the legacy-window-14 rolling RSI/ATR methodology. The chart
and independent timeframe brief retain Wilder RSI/ATR. Their differences are disclosed.

The separate confidence test applies the ten **existing 6.4-Q1 research-quality
criteria**: trade sample, holdout expectancy, development expectancy, retained
expectancy, cost stress, parameter stress, walk-forward consistency, concentration,
coverage and defined metrics. Each check is visible. Validation score is checks
passed / 10 * 100; the existing insufficient/limited/mixed/consistent quality label
is also shown. An insufficient sample is never upgraded because other checks pass.

The historical test evaluates a configured fixed strategy, not the multi-school
consensus signal. It does not statistically calibrate the ring. Reports retain their
original dataset and assumptions. Market/timeframe/hash mismatch withholds their
current score; parameter changes and failed retries keep previous evidence visible
as previous evidence. Repeated holdout tuning still compromises independence.

## Verification

- New pure-function regressions cover missing evaluations, exact ten-check scores,
  failed criteria, changed/busy/failed states, first failures, and context/hash changes.
- New browser suite uses the real fixture-backed evaluation endpoint: eight school
  cards, confidence-test navigation, successful evaluation, changed assumptions,
  provider failure, recovery, instrument changes, scenario-to-risk handoff and
  input edits made during a real pending evaluation. Populated school cards and the
  evaluation form are checked at six widths, EN/AR, and dark/light themes; axe runs at
  desktop/mobile widths. The Evolution and Consolidation suites now assert the corrected bullish/bearish
  section headings in place of the misleading universal "Counter-evidence" heading.
  Their existing workflow and numerical assertions are retained; no checks are removed.
- Manual stalled-request verification confirms the 25-second failure, withheld score
  and enabled retry. Browser routing deliberately withholds a response; no provider
  or model service is contacted.
- Final build/lint/package, 191 core tests, 10 system tests, 21 security tests,
  workflow validation, dependency audit and protected-engine guard passed.
- All 29 browser suites have passing final results. The interrupted first ten were
  preserved; the remaining nineteen used the unchanged artifact. Evolution and
  Consolidation initially expected the old heading; their corrected, strengthened
  directional assertions passed on targeted rerun. This is aggregate coverage over
  the resumed run and those two reruns, rather than a claim that the interrupted
  invocation exited successfully.
- The final confidence suite passed 48 populated EN/AR, dark/light, responsive
  profiles with no page errors. Its tests include in-flight input changes and
  scenario transfer to the authoritative Risk Desk inputs.
- All 75 runtime-source hashes match the production manifest. Reference archives,
  screenshots and test artifacts are excluded from production packaging.
- Results: `work/comprehensive-review/verification-summary.json`.
  Clean previews of all nine views: `work/comprehensive-review/previews/`.
  These previews use offline fixtures; they do not depict verified live quotes.

Real external model inference, broker connectivity, hosted financial persistence,
live orders and continuous alert workers are not established by these fixture tests.
The screenshot comparison cannot identify every reported malfunction; specific user
reproduction steps can guide further work. The nine views and existing numerical
engines remain the baseline for continued development.
