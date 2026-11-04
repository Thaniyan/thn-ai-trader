# Product roadmap and continuous delivery

Owner direction: 2026-11-04. Principal references: [illustrated product vision](vision/ILLUSTRATED-VISION.md) and [strategic roadmap](vision/STRATEGIC-ROADMAP.md).
These source documents retain the supplied text with normalized whitespace. Their historical branch and
approval language is reference material; the owner's current direct development
and deployment instructions govern delivery. Reference illustrations are design
inspiration, not shipped assets or claims about operational capabilities.

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

Repository baseline: fd2ce7d20b34e7182afb1bf90000c09313f0eedd. Its complete
30-suite offline browser gate and required non-browser checks passed. This is
repository verification, not proof of current Production readiness.

| Product system | Existing foundation | Next integration or limitation |
| --- | --- | --- |
| Professional workspace | Nine views; shared chart/context; Dashboard confidence, grade and school count; responsive EN/AR/themes | Keep market evidence clear at the entry point; refine density incrementally |
| Market intelligence | Closed-bar observations, independent timeframes, technical/structure engines and dataset identities | Expose source/time/stale history beside the Dashboard price; live provider reachability remains separately verifiable |
| AI research copilot | Deterministic research, opposing evidence, bounded contextual conversation; optional model adapters | Actual generative inference requires configured, authorized and validated model access; no active-model claim |
| Trading and risk | Server-validated hypothetical planning and opt-in local paper capabilities | Hosted financial mutations remain unavailable; no live execution or broker activation |
| Quantitative research | Cost assumptions, holdout/walk-forward evaluation, reproducible replay and historical checks | Improve discovery and comparison of existing reports before adding engines |
| Portfolio, Journal and monitoring | Local research records, watchlists and review workflows | Clarify local persistence/export; hosted durable multi-user storage and notifications need separate design |

## Current routine milestone: Dashboard evidence provenance

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
