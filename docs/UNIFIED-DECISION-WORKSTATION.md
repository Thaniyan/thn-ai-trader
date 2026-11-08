# Unified decision workstation — development candidate

November 8 acceptance review: [legacy ticket risk truthfulness correction](M1-TICKET-RISK-TRUTHFULNESS.md). Original gate/gallery results below identify the recovered `28f5d1a` checkpoint; they do not assert a final-code run on later corrections.

Baseline: `a752fa4f533b0376c8d60eab1a450c5fbf9932f9`.
Branch: `feature/unified-decision-workstation-20261107`.
This is a major development candidate, separate from main. A local fixture render
or passing test is not evidence of a deployed Preview or Production acceptance.

## A connected research workflow

A keyboard-accessible market picker opens the shared workspace and requests one
matching technical assessment. It does not invoke a model automatically. Rapid
market changes discard late old-context results. Identical in-flight technical
requests coalesce only while their generation is still current, without caching
or weakening the existing response guards. Returning to an earlier market starts
a fresh request after invalidation, even when its payload and dataset hash match.

The chart now carries a recommendation in its research rail. Its concise verdict
and rationale distinguish WAIT, a conditional BUY/SELL setup and AVOID when a
matching hypothetical plan exceeds modeled exposure or margin limits. Full
explanations, confirmation/invalidation references and missing evidence are
available through a keyboard-accessible disclosure. Matching successful research
reviews open that explanation and retain cited-evidence navigation and focus.

The recommendation interprets existing engine outputs; it does not implement
position sizing, indicators, price prediction, strategy returns or order execution.
A neutral legacy consensus cannot become a BUY recommendation merely because the
older engine supplied a limit-order fallback. Conflicting/stale/missing evidence,
proxy instruments, unconfirmed scenarios and opposite-side plans remain explicit.
Closed-bar confirmation is not a current executable quote. Confidence remains
school confluence; historical checks are a separate measure, never win probability.

Dashboard confidence, consensus, grade, school count, source details, evidence
coverage and confidence-test access remain available. AI Research shows the same
recommendation language and keeps independent historical evaluation and notes.
The original chart, datasets, controls, notebook and storage owners are reused.

Risk Desk places review/save readiness beside the original calculator. Costs,
capital, leverage and optional targets remain explicit inputs to the authoritative
engine. Research Library surfaces saved reports ahead of the manual register.
The workflow continues through historical testing, hypothetical planning, saving,
new-scenario comparison and return to the immutable original research record.
All nine sections retain their existing functionality and data-view identities;
Historical Lab and Research Library now have direct, clearer navigation labels.

## Local AI is not installed

The owner confirmed that no existing Ollama model is available. This candidate
therefore says **Rule-based recommendation**. It does not claim generated AI
output, download weights, activate a provider or introduce hosted infrastructure.
Settings links to the existing authenticated local pilot and explains availability.
[Local setup and verification](LOCAL-AI-RESEARCH.md) documents the existing adapter;
`scripts/check-local-ai.mjs` provides read-only installed-model inspection.

A genuine model label requires an accepted cited response, recorded model calls,
provider/model identity, matching language/context/hash, fresh evidence and no
import/fallback downgrade. Generation cannot override the recommendation blockers,
financial engines or execution restrictions. Actual model quality and end-to-end
inference remain unverified until a local model is installed and configured.

## Presentation and trade-offs

English/Arabic, RTL, dark/light and responsive layouts share the existing controls.
Desktop pairs the chart with a 300px research rail; the rail scrolls independently
rather than extending the page with repeated full-width assessment cards. Narrow
screens stack the recommendation after the chart. The confidence/decision summary
stays above the mobile chart, while detailed evidence uses native disclosures.
The new market picker supports Ctrl/Cmd-K, arrows, Enter, Escape and focus return.
Notes and the original research records survive navigation and appearance changes.

Before/after screenshots use identical synthetic provider fixtures, 1000px viewport
height, widths 1440/768/390, both languages/themes, and all nine sections (216
renders). They are local development evidence, not live-market or Production proof.
The final measurements and selected screenshots accompany the completed gate.
The intentional risk-review rail can increase desktop page length because review
and cost assumptions now occupy the same column; all original inputs remain visible.

## Verification scope

The complete browser runner includes the existing 32 suites plus an integrated
workflow regression. The new test covers explicit market selection, one technical
request/no model call, cancellation/focus, stale responses, cited explanation,
historical checks, authoritative risk, Library save/comparison/immutability,
16 width/language/theme profiles across all nine views and picker accessibility.
Fifty added core tests exercise recommendation boundaries and escaping. The
preexisting risk-layout assertion now verifies the budget and review are visible
and do not overlap side by side, matching the deliberate new placement; all
financial values, save-readiness, outage and accessibility assertions remain.
The history-navigation assertion retains its exact route-dependent title check
using the renamed Chart/Workspace labels. The same test opens the new native
price-context disclosure through the existing control helper, asserts visibility
and retains both exact authoritative support/resistance assertions. Confidence checks retain the original
consensus assertion on its new dedicated label and add the recommendation verdict.

Required release gates: complete browser, build/lint, core/integration/numerical,
security, system, production packaging, workflow validation, frozen dependencies,
fail-closed advisory audit, Git integrity and unchanged numerical-engine parity.
Final outcomes must be recorded after execution; an interrupted run is not a pass.

Rollback reference is the baseline above. Use a normal revert and rerun gates;
never reset or force-push shared history. No main integration or Production
acceptance is inferred from preparation of this development candidate.

## Review access

Production access was retried through the configured Cloud proxy on 2026-11-07.
It failed during HTTPS CONNECT with HTTP 403 (`server: envoy`), before an
application response. This does not establish a Vercel protection or application
failure. No network policy, authentication or deployment setting was weakened.

The workspace-local fixture application runs at `http://127.0.0.1:34117` **inside
the cloud workspace**, not on the reviewer's personal computer. It is not a
public Preview URL. The configured desktop capability is enabled but its observed
state is unknown on environment
`ccarenv_b64_Y2NhcmVudl83N2RlNzcxZTZjNDA4MTkxOWUxZGUyZDI5ODEzZmQ3ZQ`.
Neither a desktop JavaScript/control tool nor `open_in_codex` is offered in this
chat. Consequently an interactive shared-Desktop review has not been verified.
If the client provides a Desktop viewer, it can be used to open the workspace-local
address; otherwise the recorded screenshots are the available visual evidence.
A genuine Vercel Preview must still have its deployment state and source commit
verified separately. A feature-branch push or feedback check alone is insufficient.

## Resolved verification findings

The Recovery gate detected that the initial 324px recommendation rail narrowed
the 1440px desktop chart to 786px, below its preserved `width > 800` contract.
The rail was reduced to 300px to restore chart room. The chart-width, height and
visible-height assertions were not relaxed. The full Recovery suite is rerun,
not just its first geometry assertion.

A subsequent diagnostic found empty rendered `innerText` for support/resistance
while the new native price-context disclosure was closed. Its retained text
contained the exact expected engine values; the issue was test interaction,
not numerical disagreement. Recovery now opens that disclosure using the existing
UI helper and asserts visibility before the unchanged exact-value checks.
No arbitrary sleeps, forced clicks or timeout increases were added.

Browser evidence uses offline provider and official-embed protocol fixtures.
Actual Yahoo/other provider reachability and the external TradingView widget are
not proven by those fixtures. Local model guards are exercised with test
transports; no real installed-model inference quality is claimed. Existing
hosted financial mutations and live trading remain unavailable.

## Completed local gates — 2026-11-07

All **33 complete browser suites passed** on pinned Chrome for Testing
151.0.7922.34 / Playwright revision 1234. Core/unit/integration/numerical: **266
passed**; security: **21 passed**; system: **10 passed**. Build, lint, production
packaging, workflow validation, frozen dependencies, zero-advisory fail-closed
audit, Git integrity and six-engine numerical-source parity passed.

[Actual before/after gallery and measured trade-offs](evidence/unified-workspace-20261107/README.md),
[full verification record](evidence/unified-workspace-20261107/verification.json) and
[33-suite gate output](evidence/unified-workspace-20261107/browser-gate.txt) accompany
this candidate. The final 216 renders report no page errors or horizontal overflow.
These results do not assert live provider availability, actual model inference,
Preview readiness or interactive Production acceptance.
