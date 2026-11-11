# Product roadmap and continuous delivery

Owner direction: 2026-11-04. Principal references: [illustrated product vision](vision/ILLUSTRATED-VISION.md) and [strategic roadmap](vision/STRATEGIC-ROADMAP.md).
These source documents retain the supplied text with normalized whitespace. Their historical branch and
approval language is reference material; the owner's current direct development
and deployment instructions govern delivery. Reference illustrations are design
inspiration, not shipped assets or claims about operational capabilities.

## Authoritative Issue 21 — Trading Command Center

Owner direction 2026-11-10: [Issue #21](https://github.com/Thaniyan/thn-ai-trader/issues/21).
The owner rejects PR #20 as the final visual/product outcome but explicitly
approves evolving its verified functionality on the same review branch. The
single main page now integrates a catalog-backed chooser, the owned two-mode
chart, qualified evidence assessment, existing-engine candidate references,
conditional reasoning, the original risk planner/cost controls and research
saving. See [implementation and acceptance](ISSUE21-COMMAND-CENTER.md).
This remains a candidate. Main and Production require explicit owner approval.
PR #17 and Issue #18 remain separate; genuine hosted model generation is off.
The November 17, 2026 target is an owner review/release decision, not permission
to bypass safeguards or claim a model is running.

## Issue 19 candidate — 2026-11-10 (not accepted or deployed)

The active independent development branch is
`feature/integrated-research-workstation-issue19-20261110`, based on canonical
main `fb92c9604d16d0df45d3a13096c2f84a6d66546b`. It adds a connected chart,
cited-evidence, chronological validation, immutable saved-case comparison/replay
and hypothetical planning workflow in the existing application. See
[the ownership, implementation and verification report](ISSUE19-INTEGRATED-PROGRAM.md).

PR #17 remains separately financially gated; rejected PR #16 is excluded. The
Issue 18 disposable failure investigation demonstrates unresolved independent
audit persistence and corruption gaps. No recovery semantics, financial formulas,
execution permissions or account architecture are changed. Main integration,
Production deployment and owner visual acceptance remain outstanding. These
statements describe a review candidate, not released capabilities.

## Delivery policy

Routine, low-risk improvements: implement, run required gates, review the diff,
commit/push to main, allow the existing Vercel integration, verify the actual
Production deployment. No separate routine deployment approval is required.
Major changes: dedicated branch, comprehensive tests, existing Vercel Preview,
responsive EN/AR/theme review and necessary owner acceptance before main.
Do not create duplicate Vercel projects. Branch Preview availability must be
checked: current vercel.json explicitly enables main and disables two older
branches, so a branch push alone does not prove Preview availability.

Real-money execution, live brokers, destructive data operations, significant
security changes and new paid infrastructure still require explicit approval.
Never bypass a critical failure or represent fixtures as real market evidence.

## Current capability map

Verified main baseline: `a752fa4f533b0376c8d60eab1a450c5fbf9932f9`, containing
Integrated Research increments 1–3 and the accepted Milestone 4 hierarchy work.
Production identity and interactive behavior remain separate from local source
verification and any Git push.

Active candidate: the unified decision workstation overhaul, on
`feature/unified-decision-workstation-20261107`. It connects market selection,
evidence-bound recommendations, AI Research, hypothetical Risk Desk planning and
saved research. See [implementation, limits and verification](UNIFIED-DECISION-WORKSTATION.md).
This is a major development candidate requiring responsive visual/Preview review
and owner acceptance before main integration. The rollback reference is the main
baseline above. Genuine Ollama inference remains unconfigured and local-only;
rule-based recommendations must not be represented as generated model output.

| Product system | Existing foundation | Next integration or limitation |
| --- | --- | --- |
| Professional workspace | Nine views; shared chart/context; Dashboard confidence, grade and school count; responsive EN/AR/themes | Keep market evidence clear at the entry point; refine density incrementally |
| Market intelligence | Closed-bar observations, independent timeframes, technical/structure engines and dataset identities | Expose source/time/stale history beside the Dashboard price; live provider reachability remains separately verifiable |
| AI research copilot | Deterministic research, opposing evidence, bounded contextual conversation; optional model adapters | Actual generative inference requires configured, authorized and validated model access; no active-model claim |
| Trading and risk | Server-validated hypothetical planning and opt-in local paper capabilities | Hosted financial mutations remain unavailable; no live execution or broker activation |
| Quantitative research | Cost assumptions, holdout/walk-forward evaluation, reproducible replay and historical checks | Improve discovery and comparison of existing reports before adding engines |
| Portfolio, Journal and monitoring | Local research records, watchlists and review workflows | Clarify local persistence/export; hosted durable multi-user storage and notifications need separate design |

## Completed baseline milestone: Dashboard evidence provenance

Show source/provider symbol, server-reported history state and the opening
timestamp of the last closed bar beside the observed close. Recent means recent
at retrieval, not a live quote or a client-invented market-open assessment. Use
the existing context/hash binding; clear provenance when context changes or
data is unavailable. Reuse numerical engines and confidence calculations.

Acceptance: exact provider metadata and UTC time, stale/unavailable states, no
old-market provenance while loading, existing confidence lifecycle/navigation,
24 EN/AR/theme/width profiles and accessibility, full browser and non-browser
gates. No new API, dependency, security boundary or financial operation.

## Next measured milestones

1. Improve the connected analysis-to-risk-to-saved-research journey using existing
   evidence, with explicit missing-data and local-persistence states.
2. Make existing quantitative reports and comparison/holdout limitations easier
   to inspect from the research workflow.
3. Scope authorized genuine-model integration and durable research persistence
   against actual hosting/model requirements; do not invent availability.

## Release evidence and rollback

Record commit, branch, tests, deployment URL and verified deployment state for
each cycle. A Git push is not evidence of Vercel success. The current environment
blocks thn-ai-trader.vercel.app through its HTTP proxy (CONNECT 403); report that
blocker until actual access is available, without widening network policy.

Rollback baseline for this cycle: fd2ce7d20b34e7182afb1bf90000c09313f0eedd.
If needed, revert the routine change through a new normal main commit, retest
and verify the existing Vercel deployment. Do not reset or force-push history.

## Cycle verification — 2026-11-04

All 30 complete browser suites passed on pinned Playwright 1.62.0 / Chromium
151.0.7922.34 (revision 1234). Dashboard coverage includes 24 width/language/theme
profiles, exact source/time metadata, delayed context transitions and explicit
stale/unavailable states. Desktop dark and mobile Arabic light screenshots were
visually reviewed. The test found a real existing refresh-notification gap:
clearing the shared series now emits the same series update event used after
success, so connected presentation can clear stale observations after a failed
refresh. Existing analytical engines and financial endpoints are unchanged.

Build, lint, 191 core unit/integration/numerical tests, 21 security tests, 10
system checks, production packaging, workflow validation, dependency audit
(zero advisories), Git integrity and source/numerical parity passed. No dependency
or lockfile was changed. Full browser logs are retained locally under ignored
work/roadmap-20261104. Production verification remains subject to the network
block described above; no live deployment success is inferred from these tests.

## Verified cycle: evidence-bound Risk Desk saving

Rollback baseline: 79cb730ec858af3417aa83d21489c6f8968b37c5. The Risk Desk
save button previously enabled for any validated plan, even if matching research
was unavailable; clicking then produced a generic failure. The presentation now
asks the existing report builder whether a matching plan can be included. The
snapshot probe writes no record; the save action independently validates again.
No financial calculation, API, persistence format or execution boundary changes.

An associated bilingual status explains whether a hypothetical plan needs
validation, matching research is unavailable, or the matched report is ready for
browser-local saving and backup. The workflow regression now exercises research
outage with a retained valid plan, recovery, an evidence-bound Library save with
no execution record, and input-change invalidation. Existing responsive, theme,
accessibility and financial assertions are retained.

All 30 browser suites passed on pinned Chromium 151.0.7922.34, including the
expanded Workflow Polish suite's 60 responsive view profiles and accessibility
checks. The ready-to-save desktop screenshot and mobile Arabic light layout were
reviewed. Build, lint, 191 core tests, 21 security tests, 10 system checks,
packaging, workflow validation, zero-advisory dependency audit, Git integrity and
source/numerical parity also passed. No assertion, timeout or safeguard changed.

## Verified cycle: readable saved research

Rollback baseline: 5ff2fbbb63ddcbac21101bc63c4c7aa14b63abbd. An opened Library
report previously exposed detailed strategy results mainly through raw JSON. A
read-only summary now shows development and holdout outcomes side by side,
recorded costs, evaluation dates, strategy settings and any saved hypothetical
plan's risk assumptions. It displays stored values without rerunning analysis or
changing the original report. Missing metrics remain unavailable; reports with no
quantitative evaluation explicitly say so. Imported research remains unverified.

The original source audit, comparison controls and authoritative replay stay
intact. The compact table fits normal mobile layouts; a labeled, focusable
region preserves horizontal access on very narrow screens. Arabic dates and
parameter sequences use isolated directionality. Expanded Terminal regression
coverage checks exact saved metrics/costs, immutable records across 12
language/theme/width profiles, imported warnings and absent evaluations.

All 30 complete browser suites passed on pinned Chromium 151.0.7922.34. The
Terminal/Library regression verifies recorded metrics and costs, source-data
immutability across 12 EN/AR/theme/width profiles, missing evaluations, imported
warnings and retained replay/compare protections. Desktop dark and mobile Arabic
light summary screenshots were reviewed. Build, lint, 191 core tests, 21 security
tests, 10 system checks, packaging, workflow validation, zero-advisory dependency
audit, Git integrity and source/numerical parity passed. No dependency, numerical
engine, persistence schema, financial boundary, assertion or timeout changed.

## Verified cycle: comparison selection and compatibility

Rollback baseline: e0d01a12d47119848d825b3a60ca00ef5a42b9ac. Library comparison
now displays its selection count, two-to-four-report requirement, hidden filtered
selections and shared compatibility warnings before a comparison is opened.
Warnings reuse the existing comparison engine and vocabulary; no compatibility
rule or ranking is introduced. Incompatible cases remain inspectable, with their
existing warnings. A clear-selection action changes UI selection only.

Changing a checkbox formerly left the prior comparison visible. The old result
is now removed and the user is asked to compare again. Checkbox focus is
preserved without rerendering the Library or its open report. Filtering preserves
selection and explicitly states when hidden reports remain included.

The extended Terminal regression covers zero/one/two/four/five selections,
filtered hidden cases, compatibility notes, keyboard focus, stale-result removal,
clearing and unchanged storage. Existing replay, source-integrity, comparison
and financial assertions remain intact.

A targeted diagnostic also confirmed that the existing import codec accepts
some incomplete legacy quality metadata which the comparison engine cannot
always assess. Pre-comparison guidance catches that error, disables Compare and
asks the user to inspect metadata or choose other reports. It neither mutates
the import nor changes comparison calculations. A UI import regression verifies
this state, unchanged storage and recovery to valid selections without page
errors. The initial full run was paused for this correction; the complete gate was
then rerun successfully on the final source.

Final verification passed all 30 browser suites on pinned Chromium 151.0.7922.34,
including selection bounds, hidden selections, compatibility failures/recovery,
keyboard focus, unchanged storage and all original replay/financial assertions.
EN desktop and AR mobile guidance screenshots were reviewed. Build, lint, 191
core tests, 21 security tests, 10 system checks, packaging, workflow validation,
zero-advisory dependency audit, Git integrity and source/numerical parity passed.
Dependencies, comparison calculations, original assertions and timeouts remain
unchanged. Production status still requires an actual reachable live-site check.

## Verified cycle: Library filter recovery

Rollback baseline: b9d10ded2a1a908c8ada2bb35a55c5b25a9f76b3. The Library now
shows the visible/total saved-report count and distinguishes an empty Library
from a search or status filter with no matches. A clear-filters action resets
search and status, preserves sort order and comparison selections, and returns
keyboard focus to Search. It writes no saved data. English and Arabic wording
and a wrapping, touch-accessible toolbar cover narrow layouts.

The expanded Terminal/Library regression verifies empty search and status
results, exact counts, keyboard recovery, retained hidden comparison selections,
sort order, unchanged storage and EN/AR desktop/mobile/narrow layouts. English
dark desktop and Arabic light mobile captures were visually reviewed. All 30
complete browser suites passed with pinned Chromium 151.0.7922.34. Build, lint,
191 core unit/integration/numerical tests, 21 security tests, 10 system checks,
packaging, workflow validation, zero-advisory dependency audit, Git integrity and
source/numerical parity passed. No dependency, persistence schema, comparison
rule, numerical engine, financial boundary, assertion or timeout changed.

The update uses the existing main delivery workflow. A read-only request to the
Production domain still returned proxy CONNECT HTTP 403; no network rule was
widened. GitHub publication and live deployment verification remain separate.
Local verification evidence: ignored work/library-discovery-20261104.

## Verified cycle: cancellable Library editors — 2026-11-05

Rollback baseline: e97be2cb1f9d4f81dce352760ad8763cbb5619de. Rename and
report/candle-removal prompts now open as named inline regions with predictable
keyboard focus. Rename focuses the title field; removal prompts focus Cancel,
without automatically confirming deletion. Cancel and Escape close the prompt
and return focus to its originating button. Report removal identifies its title.
Existing confirmation requirements, persistence formats and financial behavior
remain unchanged; cancellation writes no report or candle data.

The recovered implementation was preserved after workspace interruption. The
Terminal/Library suite checks all three editors, Cancel and Escape, unchanged
Library state and no overflow at English desktop, Arabic mobile and a 160-pixel
narrow layout. All original assertions and deadlines are retained. All 30 browser
suites passed on pinned Chromium 151.0.7922.34: nineteen logged passes survived
execution-session loss; the remaining eleven completed successfully using the
original runner logic and deadlines. This was resumed verification, not a claimed
single uninterrupted full-command exit. Recovery hashes confirm unchanged source.
Build, lint, 191 core unit/integration/numerical tests, 21 security tests, ten
system checks, packaging, workflow, zero-advisory dependency audit, Git integrity
and source/numerical parity passed.

Release diagnostics identify the workspace proxy as the observed HTTP 403 source:
HTTPS CONNECT is denied before TLS reaches thn-ai-trader.vercel.app or
api.github.com; both hosts are absent from the enforced destination allowlist.
This does not establish Vercel Deployment Protection, GitHub API authorization
or application health. No protection, credential or network rule was changed.
Repository configuration enables main deployment; actual Vercel connection,
deployment commit and Production smoke tests remain unverified behind that block.
GitHub publication must be reported separately from Production readiness.

## Next priority: actionable historical-validation interpretation

Connect each existing failed confidence check to its recorded evidence and the
relevant strategy, costs or validation-window controls. Explain sample sufficiency,
parameter sensitivity and holdout limitations without inventing metrics or win
probabilities. Preserve dataset/context invalidation and original report values.
Acceptance: an evidence-bound route from analysis to a historical test, readable
reasons for unmet checks and relevant assumptions, and saving the matched research
without creating an execution record; verify EN/AR, themes, responsive layouts
and all existing release gates. Model integration, hosted persistence and live
execution remain separately scoped capabilities, not implied by this milestone.

## Integrated Research and Decision Intelligence — increment 1

Rollback baseline: 8e834323c201fdc3a6beab5c85057bc34458d7e3. Historical
validation now explains all ten existing 6.4-Q1 checks through expandable findings.
Each finding uses the existing confidence verdict and recorded evaluation values;
no numerical engine, threshold, verdict, dataset identity or record format changes.
The evidence panel displays development/holdout periods, transaction-cost
assumptions, trade counts, returns, expectancy, average R, all recorded stress
variants and patches, fold results, concentration, coverage and undefined metrics.
Missing folds show the engine-reported eligible-bar requirement. Values are rounded
for display, with scientific notation for tiny nonzero values; verdicts retain full
precision. Arabic score sequences use explicit left-to-right directionality.

A finding's assumptions action focuses its existing strategy, cost, minimum-trade,
gap-policy or chronological-window control without changing it. Editing inputs,
a pending request or failure explicitly labels the retained report as non-current;
market/timeframe/hash mismatches remove the evidence panel and scored findings.
This reuses confidenceReview, researchQuality and the authoritative evaluation
report. Existing analysis, scenario-to-risk and Library workflows remain intact.
It neither trains a model nor estimates probability of future trading success.

The expanded Confidence Lifecycle regression verifies exact recorded values,
criteria verdict parity, periods, costs, variant returns, focus routing and report
immutability. It opens findings across 16 EN/AR/theme/width profiles with
accessibility scans, retaining the original 48 lifecycle profiles. Real bounded
historical evaluation exercises missing walk-forward folds and insufficient
history; retained-report and context-invalidation protections remain asserted.

A hostile-label fixture found that the older detailed-results table rendered an
unknown sensitivity label as HTML. Publication stopped for a one-line escaping
correction in research-quality.js. The regression retains the execution assertion
and verifies both presentation surfaces contain no injected image element. No
assertion, suite, time limit or safeguard was removed to resolve that failure.
The complete browser gate is rerun on the corrected source before publication.

The next increment should bring these explanations into saved-research review,
using only evidence retained in existing records and explicitly identifying any
missing detail. This will connect current validation interpretation to revisited
research without introducing a second engine or changing persistence formats.

Final increment verification passed all 30 browser suites in one corrected full
gate with exit 0, using pinned Playwright 1.62.0 / Chromium 151.0.7922.34. The
original failing run is retained as diagnostic evidence. The English desktop dark
and Arabic mobile light expanded findings were visually reviewed. Build, lint,
191 core unit/integration/numerical tests, 21 security tests, ten system checks,
packaging, workflow, zero-advisory dependency audit, Git integrity and numerical
source parity passed. No dependency, persistence schema, financial endpoint or
quantitative engine changed. Local evidence: work/integrated-validation-20261105.
Production status must still be verified separately; prior proxy CONNECT 403
responses do not establish Vercel deployment success or application failure.

## Integrated Research and Decision Intelligence — increment 2

Rollback baseline: a857be970c26a18e1e70a38e87fd837ea892b297. The owner
independently confirmed that baseline's matching READY Vercel Production
deployment; interactive live-site verification remains a separate open item.

Saved Library reports now use the same validation-evidence renderer as the live
Confidence panel. The shared module owns the ten descriptions, evidence formatting
and disclosure UI; neither renderer recalculates historical verdicts. The read-only
saved adapter reshapes retained metrics and periods without modifying the record,
consulting current market state, fetching history or applying today's thresholds.
Recorded passes and unmet requirements remain the stored outcomes even if the
retained metrics appear inconsistent with them. Unknown criteria versions,
conflicting period/assumption metadata, missing or conflicting dataset identity,
and duplicated or malformed flags are indeterminate. Original boolean flags stay
inspectable; absent flags are not reconstructed from metrics.

Current records retain variant parameter snapshots and walk-forward summaries,
not original change-only patches or individual folds. These omissions are explicit.
Where richer records contain individual fold periods and results, they are shown
as recorded. Unknown numeric values are not zero; absent values are distinguished
from recorded-but-unavailable metrics. Recognized 6.4-Q1 requirements are shown as
that criteria version's descriptions; unsupported versions receive no current-rule
interpretation. Imported findings remain unverified, including recorded passes.

Reader navigation focuses recorded outcomes, saved assumptions, the saved
hypothetical plan when present, or opens the saved source audit. The separate
current-research action still retrieves fresh context without copying saved
assumptions or altering historical evidence. No record schema, persistence key,
import codec, comparison calculation, snapshot, risk engine or financial endpoint
was changed. The shared module is included in the existing production package and
build/lint syntax checks without adding dependencies.

Regression coverage includes a deliberately contradictory saved verdict to prove
no re-rating, missing and malformed records, unknown versions, unverified imports,
safe source labels, complete retained fold dates and conflicting legacy periods.
Browser coverage verifies all ten stored outcomes, omitted fold/stress detail,
saved navigation, immutable Library storage, no new evaluation requests during
reading, current-market context changes, and 16 EN/AR/theme/width profiles with
accessibility scans. Existing live Confidence, Library replay, comparison,
backup/recovery and financial assertions remain intact.

Final verification passed all 30 browser suites with exit 0 on pinned Chromium
151.0.7922.34, including unchanged live Confidence and the expanded Terminal /
Library workflows. Build, lint, 203 core unit/integration/numerical tests (12 new
saved-evidence tests), 21 security tests, ten system checks, packaging (76 runtime
files), workflow, zero-advisory dependency audit, Git integrity and source/numerical
parity passed. Desktop English dark and mobile Arabic light captures were reviewed.
No dependency version, lockfile, persistence schema or numerical engine changed.

Import-safety review identified that retained fold identifiers need HTML-attribute
escaping as well as text escaping. This was corrected before final verification;
the regression verifies that a hostile imported identifier creates no event-handler
attribute. An ambiguous test locator was scoped to its intended cost finding,
without changing its expectation or selecting an arbitrary first match.

An earlier full run failed the existing Trading Remediation script-only phase
assertion after its unchanged 18.05-second wait. The original log did not record
the actual phase. A passive isolated diagnostic passed: its timer fired at about
18,000.1 ms, with the page visible and the expected generation. The final full gate
also passed the same wait and predicate. No TradingView application logic or
timeout was changed; the canonical assertion now includes state, generation,
elapsed-time and visibility evidence if it recurs. The earlier intermittent
failure's cause remains unproven and must not be described as fixed by this work.
Local evidence is retained under work/library-validation-20261105.

Next increment: compare a saved thesis with a fresh, separately validated
hypothetical risk scenario, making the context and assumptions review explicit.
Keep the original record immutable; never silently transfer historical levels
into a current plan or represent a plan as an execution authorization.

## Integrated Research and Decision Intelligence — increment 3 (2026-11-06)

Rollback baseline: b9f7d015100000a5710acf2b4acc865c0f045638. The owner
independently confirmed a matching READY Vercel Production deployment for that
baseline; interactive behavior and this increment's deployment require separate
verification.

The Library reader now starts a separate historical-to-current Risk Desk
comparison. It retains an in-memory copy of the selected historical record and
leaves the stored report, evaluation and hypothetical plan unchanged. No prices,
stops, targets or capital are transferred from history. An explicit action selects
the report's instrument/timeframe for new research; the existing context rules
still clear stale price levels and invalidate prior estimates. Users review or
enter current hypothetical inputs and submit the existing authoritative planner.
The original report can be reopened through End comparison or Escape, restoring
keyboard focus without saving or overwriting anything.

The comparison reads the supplied recorded plan and server-validated estimate.
It subtracts comparable numeric values only; it never sizes positions, converts
currencies, calculates margin, recalculates historical returns or approves an
execution. Rows cover capital, risk percentage/budget, entered levels and targets,
lots, recorded contract units, leverage, cost assumptions, modeled exposure,
margin, stop exposure and supplied target reward/risk. Missing targets and values
remain missing rather than zero. Backtest assumptions never substitute for an
absent historical plan.

Numeric differences require matching selected instrument/timeframe, provider,
provider instrument, observation currency, current snapshot binding and recent-at-
retrieval history. Historical plan provenance and validation metadata must be
retained. The supported planner version and recorded contract size must match;
these are model specifications, not verified broker terms. New validation must
postdate the saved report. Different historical/current source hashes remain
visible and are explicitly an assumptions comparison, not a replay. Direction or
scenario-reference changes withhold price-level and target reward/risk differences
while allowing otherwise compatible supplied USD amounts. Imported, unverified,
proxy, incomplete, unsupported or mismatched baselines remain inspectable with
explicit reasons and withheld differences. Input edits, pending/rejected validation
or lost evidence remove valid comparison differences immediately.

Source cards retain selected candle opening times, provider metadata and hashes.
Browser save/validation times are labeled as browser times. Retained scenario
reference intervals/hashes are shown; absent reference timestamps are not invented.
Existing budget-compliance flags and margin warnings are surfaced separately from
input validity and never imply execution authorization. Side-by-side differences
explain changed modeled stop exposure without projecting strategy performance.

Browser verification caught that the old instrument-change event also clears
planning prices. The new same-context preparation action uses the existing form
invalidation path instead. Actual context changes preserve their original clearing
safeguards; tests require explicit new prices afterward rather than restoring old
levels. No numerical engine, server endpoint, saved schema or persistence key was
changed. The comparison session is not persisted and cancellation writes no report.

Thirteen new focused tests cover supplied-value arithmetic, immutability, missing
plans/values, invalidation, context/currency/provider/time/snapshot conflicts,
imports/proxies, contract mismatches, direction/reference differences and safe
source labels. The new browser suite exercises genuine historical evaluation and
server plan validation, Library selection, input preservation, differences,
evidence outage/recovery, context transitions, cancellation/focus, imported and
legacy reports, and unchanged records/evaluation request counts. Sixteen EN/AR,
dark/light, desktop/tablet/mobile/narrow profiles and accessibility scans passed;
desktop English dark and mobile Arabic light captures were reviewed. Narrow tables
have a labeled keyboard-focusable horizontal region and visible scroll guidance.

The preserved full browser run records all 31 unique suite passes with no failure
or traceback. After continuation, tested-source hashes were verified unchanged.
Build, lint, 216 core unit/integration/numerical tests, 21 security tests, ten system
checks, packaging (77 runtime files), workflow, zero-advisory dependency audit,
Git integrity and source/numerical parity passed. No dependency version, lockfile,
financial calculation or execution restriction changed. Existing Vercel main
delivery is reused; GitHub publication must remain distinct from live verification.
Local verification evidence: work/research-risk-20261105.

Next increment: an explicit, separately saved follow-up research record linking the
new scenario to its historical thesis, retaining both snapshots and user-authored
rationale. Keep the original immutable; assess the existing record format before
adding linkage, and never imply a simulated or realized trade outcome.
