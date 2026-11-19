# Day 6 — eligible Trade Ticket acceptance and stabilization

Owner scope: [PR23 comment7000692246](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7000692246).
Baseline: `c3f9942b9c987012502700a905633dd3ea42d5d0`.
Existing branch: `feature/ai-evidence-interpreter-phase2-20261116`.
The earlier five walkthrough checks are owner-accepted. This increment preserves
that interface and focuses on the remaining eligible hypothetical Trade Ticket.
PR23 remains draft; no main merge, Production, inference or execution approval.

## Demonstrated blocker and bounded correction

The original engine retains prices to six decimals. Its low-range AUDUSD fixture
produced distinct targets `1.100029` and `1.100034`, but the Ticket's five-decimal
quote formatter displayed both as `1.10003`. This was reproduced on the unchanged
baseline with actual original analysis and authoritative hypothetical risk results.
It is a P1 presentation-integrity defect, not a changed financial calculation.

One locale-aware retained-reference formatter now preserves those six decimals
in the existing Ticket, activation/invalidation and retained-reference rationale.
Missing/nonpositive/nonfinite values remain unavailable. Entry/SL/targets, original
candidate admission, chart coordinates, risk inputs and authoritative planner
results remain unchanged. General quote/axis/annotation-label formatting retains
its accepted behavior; those labels remain rounded quotes, not substituted engine
values. A process-scoped actual-DejaVu diagnostic then exposed wrapping of a
six-decimal target inside the existing cell. Only target-cell inline padding changes
from 8px to 2px, preserving type size, grid, gaps and 44px controls; no truncation,
content hiding or interface redesign. The final complete browser gate was rerun and passed
after the correction. No chart engine, backend, dependencies, risk/decision/
evaluation formula, saved record or financial permission changes.

[Actual before/after evidence and full profile gallery](evidence/day6/README.md).
[Raw numerical and displayed-value receipt](evidence/day6/acceptance.json).
[Baseline integrity proof](evidence/day6/integrity.json).

## Acceptance matrix

| Area | Outcome and scope |
| --- | --- |
| Previous five owner checks | PASS, owner accepted; existing layout preserved |
| Eligible BUY and SELL Ticket | PASS in controlled offline acceptance: 48 profiles at 1440/1024/390, EN/AR, dark/light and THN/TradingView modes |
| Retained prices and geometry | Original engine values exactly equal candidate and submitted original-planner inputs; six-decimal display strings fit on one line; directional geometry preserved |
| Workflow and accessibility | Single adjacent desktop Ticket / same node directly after mobile chart; direct Trade setup jump, keyboard level inspection, Escape focus return, RTL inequalities, axe scans |
| Missing/stale/incompatible evidence | 14 negative cases withdraw all levels/overlays and report the intended specific blocker |
| Partial targets | Only original available T1 remains interactive; T2/T3 are not invented |
| Concurrent context and outage | Old references withdraw synchronously; delayed new brief cannot inherit old risk eligibility; provider 503 supplies no replacement prices |
| Financial and record boundaries | Hosted live/paper capabilities false; no order POST; Library records immutable; original risk planner required for eligibility |
| Precision defect | PASS: original distinct retained targets are distinct in EN/AR; no conversion or financial recalculation |
| Genuine provider-qualified eligible Ticket on Preview | NOT VERIFIED: direct Preview request denied by workspace CONNECT proxy before TLS |
| Independent TradingView live candles | NOT VERIFIED by controlled protocol fixture; no live-feed claim |
| Genuine local-model inference qualification | Separate unqualified capability; offline fixtures are not verified Ollama/model execution |

The eligible profiles explicitly control direction/consensus/confirmation admission
on synthetic histories. Controls include brief completeness/conflict flags and
available-frame trends; scenario readiness uses the selected fixture close as
trigger and the original analysis stop as invalidation. These scenario controls
are UI test inputs, not unmodified original brief conclusions. Original engine
LIMIT decisions and neutral consensus are
recorded before those UI controls; they are not represented as genuine immediate
BUY/SELL market signals. Numeric levels are original unmodified engine results;
position sizing, budget and margin validation use the original server planner.
This establishes UI/integrity behavior, not real-market qualification, predictive
accuracy, provider authentication, profitability or execution permission.

## Complete verification

[Machine-readable gate results and log fingerprints](evidence/day6/verification.json)
record the actual complete final-source run. The additional 48-profile DejaVu run
asserts actual rendered price fonts through Chromium CDP; requested font names
alone are not accepted as proof. All45 previous suites/assertions are
preserved; Day6 adds the 46th through the existing fail-closed runner and two workers.
No original suite, timeout, assertion, font coverage or pinned browser version is
removed or weakened. Targeted diagnostic passes do not substitute for the full run.

Final local result: **437 core/unit/integration/numerical tests, 21 security tests,
ten system checks and all 46 browser suites passed**. The additional 48 actual-font
profiles passed under DejaVu; all 111 original test files remain byte-identical.

Required gates: build, lint, core/unit/integration/numerical, security, system,
complete browser/accessibility, packaging, workflow, dependency audit, frozen
install, source/engine integrity and Git integrity. Runtime fingerprints bind the
captures to the reviewed source; hosted CI and deployment identity are checked
separately against the exact pushed Git SHA. Any failed mandatory gate blocks
release readiness; successful local tests alone do not establish hosted success.

## Day 7 — release-readiness checklist

1. Confirm PR23 exact-head hosted source/tests, dependency audit, both complete
   browser/accessibility workers and aggregate status are successful; confirm the
   existing-project Preview is successful and bound to that same source SHA.
2. Owner reviews the sixth check on that exact Preview: real EN/AR desktop/mobile
   and keyboard/touch, Entry/SL/available targets, activation/invalidation, research
   labels and real provider context. Record the result, including if genuine data
   correctly remains WAIT and no eligible real-provider example is available.
   Synthetic acceptance must never be relabeled as a real eligible market setup.
3. Keep any inaccessible live/provider/TradingView behavior explicitly NOT VERIFIED.
   Resolve or explicitly accept the bounded limitation before release; do not
   weaken protection, force eligibility or infer healthy origin behavior from
   workspace proxy errors. Do not require paid/model activation for deterministic UX.
4. Check current remote main and actual Production identity before integration;
   preserve independent remote changes and reverify integration as required.
   PR17/Issue18 financial approval and durability work remain separate.
5. Obtain explicit owner release approval. Until then keep PR23 draft and all
   execution/hosted inference restrictions intact; no automatic main merge or
   Production deployment follows from green tests.
6. After separately authorized integration, verify the existing project's exact
   deployment identity and perform supported production smoke tests. Record any
   access restriction honestly; do not create infrastructure or claim end-to-end
   verification from metadata alone.

## Rollback and retained limitations

The immutable baseline SHA above identifies the preceding accepted candidate.
Candidate rollback is an owner-authorized normal revert on the existing branch,
with full verification; never reset/force-push or rewrite records/history. No
rollback or Production action is performed by this task. A later approved release
must first record the actual prior main/Production identities and use the existing
project's reviewed rollback workflow; do not guess a deployment identifier.

Real Windows/Ollama qualification, actual provider eligibility, independent live
TradingView candles and inaccessible Preview interaction remain separate from
this offline acceptance. The interface deliberately continues WAIT whenever
context/admission/risk evidence fails. No win probability, AI-generated signal,
guaranteed execution price or approval to trade is introduced.
