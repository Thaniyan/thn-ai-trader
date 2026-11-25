# Day 5 — integrated Command Center acceptance candidate

Owner scope: [PR23 comment6979451886](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-6979451886).
Starting commit: `6275939fd7d2dd892a37d2298cc1c28455baaa9e`.
Branch: `feature/ai-evidence-interpreter-phase2-20261116`; PR23 remains DRAFT.
This is an owner-reviewable bounded **research** candidate. Main/Production release
and financial execution are not authorized. Model qualification is separate.

## What changed in the real application

The oversized desktop hero is now a compact selection/action ribbon. The original
Decision Center and hypothetical Trade Ticket sit beside the original, wider native
chart. On phones, confidence remains above the chart, and the **same ticket node**
follows the plotted chart immediately, ahead of the technical audit controls. The
new Trade setup action jumps there directly; Back to chart and Escape provide
predictable keyboard return. View/size changes restore ticket ordering and focus,
without duplicating the chart, form, levels or saved record.

The chart header now exposes the recorded provider symbol, observed currency and
bar-opening UTC time on desktop, with a compact source action on phones. The
original certificate supplies full identity/currency/time/hash details. TradingView
retains its genuine mode owner and independent-feed notice; its widget does not
receive THN overlays. The mobile ticket stays accessible in both modes. Selecting
a recorded price focuses its corresponding original chart annotation; Escape
returns to that exact level. No prices or coordinates are reconstructed.

School confluence is explicitly named, the historical-test action is fully named,
and fixed-rule results remain separate from individual-trade prediction. Short
bilingual blocker headlines link through the existing detailed explanations.
Activation now distinguishes a condition met in the recorded closed bar from a
pending condition; neither is execution approval. Entry rationale/opposition use
one native disclosure with retained expansion/focus. It explains that a recorded
analytical entry and observed close can differ, and neither is an execution quote.
The real Arabic screenshot review exposed mirrored inequality glyphs in RTL.
Confirmation operator and value now share an explicit left-to-right isolate;
BUY retains >= semantics and SELL retains <= semantics without altering the rule.

Context changes synchronously withdraw stale ticket values, confluence, source
claims and overlays before the next animation frame. Late assistant responses
remain rejected even after switching away and back. An empty supported catalog
now offers explicit retry through the original catalog owner.

## Source-identity display admission — review surface

`public/command-center-core.js` adds only a **restrictive, read-only display guard**:
provider name/symbol/currency must be present and agree between current selected
observations, current analysis, any matching retained brief/available frames, and
the catalog mapping when supplied. Missing or contradictory identity cannot
supply current levels, confluence or a current model projection. Recorded source
metadata remains inspectable. The original recommendation object and analysis
remain unchanged; the new guard can withhold a display, never promote a signal.

Incomplete timeframes are a different state from contradictory identity: an
otherwise matching current school score remains its original value while missing
independent frames still prevent an eligible setup. No new score, probability,
calibration, price, conversion, position size, risk formula or permission is added.
`recommendationReview` itself and all six protected engines are byte-identical to
the starting commit. The added recommendation-module line is a bilingual label.
Metadata agreement is **not provider authentication or real-market qualification**.

## Source ownership

- [Command Center composition](../public/command-center.js): picker/empty-catalog
  recovery, concise blocker descriptions, native chart return and synchronous withdrawal.
- [Original precision adapter](../public/precision-desk.js): the single responsive
  ticket, recorded confirmation/invalidation, RTL math, rationale disclosure and focus.
- [Chart/evidence workbench](../public/command-workbench.js): source/currency
  inspection, direct ticket navigation and level-to-chart keyboard return.
- [THN heritage presentation](../public/heritage-desk.js) and
  [scoped layout](../public/command-journey.css): recorded-source ribbon and chart-first composition.
- [Decision validation](../public/decision-validation.js): original confluence/evaluator
  labels, distinct reliability states and unchanged ten-check ownership.
- [Display admission](../public/command-center-core.js) and
  [evidence projection](../public/command-evidence.js): restrictive identity matching
  and bilingual headlines; no new financial calculation.
- [Interpretation projection](../public/command-interpretation.js): reuse the original
  assistant; withhold current explanations when source identity does not match.
- [Acceptance browser suite](../tests/browser_day5.py),
  [unit/regression cases](../tests/day5.test.mjs) and
  [capture tool](../scripts/qa/capture-command-center.py): actual working evidence.

## Functional acceptance journey

| Step | Working owner and acceptance evidence |
| --- | --- |
| Landing and selection | Existing catalog/aliases/search/quick pairs; EURUSD/BTCUSD, timeframe changes, keyboard selection and explicit empty-catalog recovery |
| Chart | Same original canvas/engine; native layers/zoom/inspection; exact retained levels and source-bar annotations; level-to-chart focus/Escape |
| TradingView | Existing embed/mode lifecycle; independent-feed disclosure and visible single ticket; protocol fixtures do not prove live candles |
| Decision/confidence | Original BUY/SELL/WAIT and school score; explicit conditional/eligible research/WAIT states; no calibrated win probability |
| Hypothetical ticket | Exact retained Entry/SL/T1–T3; recorded confirmation and invalidation; rationale/opposition disclosure; no fallback prices on invalid context |
| Sources and invalidation | Provider/currency mismatch, invalid geometry, stale/offline records and synchronous symbol/hash withdrawal; old responses cannot revive a superseded context |
| Historical test | Original form/evaluator and ten checks; opening submits nothing; actual fixture-based evaluation screenshots show recorded outcomes, not trade predictions |
| Risk | Explicit copying preserves capital/leverage; original authoritative planner alone validates assumptions; execution remains false |
| Interpretation | Original assistant and strict contracts; disabled model, unsolicited model labels, cancellation and late-response rejection; source mismatch cannot project current model text |
| Notes/Library | Original shared draft and native persistence; language/context transitions preserve notes and existing Library entries; no migration or silent reevaluation |

## Capability status

| Capability | Status and limit |
| --- | --- |
| Integrated deterministic research journey | Locally verified with packaged application and controlled offline providers; full hosted verification reported against the final commit |
| Native chart and annotation/source interactions | Verified with actual original engine; no chart-image replacement |
| Hypothetical planning/historical evaluation | Original numerical engines exercised locally on synthetic observations; not evidence of profitability |
| Real providers/TradingView candles | Interactive live integration remains separately unverified; protocol/HTTP fixtures are not live-feed proof |
| Genuine model generation | Gated/unqualified; owner's Qwen3:1.7b run timed out. No hosted or paid model is enabled or claimed |
| Financial execution | Unavailable by design; no paper/live activation |
| Preview | Exact-commit deployment identity must be verified after push; interactive workspace access previously blocked by CONNECT403 |

## Verification and real visual evidence

[Paired screenshot gallery and geometry](evidence/day5/README.md) contains actual
before/after renders at1440/1024/390, desktop EN/AR, dark/light, WAIT and Conditional,
plus eligible research and expanded confidence/historical findings. All observations
are fixed offline fixtures. Conditional/SELL/eligible cases use controlled analysis
responses to test admission and presentation, not genuine trading signals.

The capture tool serves exact baseline public files from Git against the **same**
unchanged backend/provider sample as the candidate. Receipts record dataset/bar
identity, exact copied levels, viewport geometry and public-content fingerprints.
The final commit must match the tested/captured source fingerprint; timestamps in
the application clock naturally differ. No screenshot was drawn or fabricated.

Twelve additional browser cases verify genuinely rendered DejaVu faces through Chromium CDP, full desktop tickets and Eligible phone-chart visibility. All36 original Day5 profiles and every pre-existing assertion remain mandatory.

Ten new unit/regression cases cover labels, missing/mismatched source identity,
original recommendation/record immutability, unchanged scoring during missing
frames, source-bound model projection, and45-suite coverage. Day5 browser
acceptance adds36 EN/AR/theme/state profiles, source and focus navigation, original
risk validation, BUY/SELL/WAIT, both chart modes, source mismatches, invalid levels,
stale/offline data, empty catalog and false/late model responses. Every one of the
109 pre-existing test files remains byte-identical; no assertion, suite, threshold,
timeout, font or accessibility profile is removed or weakened.

Final numerical/core, security, system, build, lint, packaging, dependency,
workflow, source/Git integrity and full45-suite browser outcomes are recorded in
[the verification receipt](evidence/day5/verification.json) after completion.
Local result: **433 core/unit/integration/numerical,21 security,10 system and all45 browser suites passed**, including36 new responsive Day5 profiles. Build, lint, packaging, workflow, dependency audit, frozen install and source/Git integrity passed.
Hosted CI and Preview identity are reported separately for the exact pushed SHA.
Development diagnostics and superseded partial runs are not counted as passes.

The complete gate caught an actual shared Trading Terminal regression at768px
Arabic: the new source control caused the header/focus control to wrap, putting
the chart at669.14px (330.86px visible, below the unchanged350px minimum). The
source control now has compact styling in both owners, and the tablet terminal
places its context caption on a dedicated inline row. No content is hidden.
The original24-profile visual-refinement suite passes without assertion changes
(chart633.64px,366.36px visible in the failing profile).

The next complete run also caught complete-ticket overflow (1048.52px bottom at
1440px), a320px Eligible chart at820.34px, and an invalid interaction in the new
Day5 test: Playwright correctly refuses a mouse click on an aria-disabled action.
The desktop ticket now uses one44px-target action row, the tablet selection ribbon
avoids unnecessary wrapping, and the320px quote uses the same legible two-column
price hierarchy as larger phones. The original institutional suite confirms all
8 complete-ticket profiles (worst bottom972.11px) and the original decision
validation suite confirms all24 WAIT/Eligible profiles. Nothing essential is
hidden. The new disabled-action test now uses actual keyboard activation and
preserves its assertions that no request or model summary appears. This checks
the application's existing disabled-action handler rather than forcing a click.
All44 original suites/assertions remain unchanged; the complete final-source
45-suite gate subsequently passed with no failures.

Rendered1024px Arabic review additionally caught the source button constraining
the quote's first grid track and pushing the observed close into the mode switch.
The source control now explicitly spans both quote columns; the price remains
inside its own quote. Day5's36 profiles additionally assert price containment and
non-intersection with the mode controls. This was a visual-review finding, not a
false claim that the earlier test suite detected it.

## Hosted candidate70021f3 and font-hardening follow-up

The first Day5 candidate `70021f39c58eae510ea21842ef7e984f242aa4dc`
passed all local gates and was normally pushed to this existing draft PR. Both
hosted source/test and audit jobs passed, but both browser shards failed:
[push44360014930](https://github.com/Thaniyan/thn-ai-trader/actions/runs/44360014930)
and [PR44360034615](https://github.com/Thaniyan/thn-ai-trader/actions/runs/44360034615).
The public annotations expose only browser-step exit1; detailed logs require
sign-in and the supported GitHub API returns Forbidden here. Exact hosted
tracebacks were requested; no inaccessible traceback is invented below.

The Cloud workspace's default system font is OpenAI Sans, unlike the pinned CI
font set. The [process-scoped diagnostic configuration](evidence/day5/dejavu-diagnostic-fontconfig.xml) includes the complete system font configuration and only changes the generic default for the launched QA process; it is not applied to the application or hosted CI. A process-scoped DejaVu diagnostic reproduced two actual regressions
with unchanged assertions: the original institutional test's1024px ticket ended
at1002.02px (limit1000), and Day5's390px Eligible chart began at731.52px
(limit720). This is confirmed local evidence, not a claim to have read hosted logs.
The pinned CI Docker image could not be pulled locally (`Forbidden`); no internet
policy, protection, dependency, font package or CI timeout was changed.

The activation label is now the clearer `Activation rule`, with more width for
its complete recorded condition/invalidation. All financial cautions remain
unchanged. The full Eligible phone heading uses22px typography; research/model
qualifiers share a proportionate row rather than forcing needless wrapping.
The DejaVu Eligible chart now begins at696.92px EN and677.42px AR. No content is
hidden and none of the original thresholds/assertions is reduced.

Eight desktop and four Eligible phone regression cases verify the **actual**
DejaVu platform fonts via CDP, unchanged records, price containment, complete
tickets, chart placement and axe results. All four native affected suites and the complete restarted45-suite
DejaVu-profile gate passed against the corrected source, including all12
actual-font cases. The Cloud reconnect interrupted an earlier partial run;
none of its partial results was substituted for the successful full rerun. New exact-commit hosted
results/Preview are reported separately after the normal corrective push.
Do not treat the earlier successful deployment as a successful browser gate.

## Blockers and Day 6 priorities

- **P0:** any failed required regression or new financial/source-integrity defect
  blocks publication. Do not bypass it to satisfy visual acceptance.
- **P1:** interactive owner review of the matching Preview (EN/AR, real desktop and
  phones), live provider/TradingView behavior and independent deployment identity.
  Report proxy restrictions; do not weaken protection or request credentials.
- **P1, separately gated:** real local-model qualification is not established by
  fixture tests. Keep the12s ceiling and deterministic fallback. It is not a
  prerequisite for accepting this bounded deterministic research product.
- **P2:** owner-led polish for shorter phone viewports, long Arabic/source text and
  technical-control density. The mobile ticket is directly after the chart and
  one click away; it is not promised to fit beside the chart in the opening fold.

Day6 should stabilize this exact candidate: resolve owner-visible Preview issues,
check real-device keyboard/touch/font behavior and actual provider edge cases,
retest the affected workflows and full gates, then prepare a Day7 owner release
recommendation. Do not start another application, branch program or redesign.
PR17/Issue18 financial approval and durability work remain separate.

## Release boundary and rollback

A green candidate is not merge or Production approval. Keep PR23 DRAFT, use only
its existing branch, normal pushes and the existing Vercel project. No hosted/paid
AI or execution activation. Before any future release, record actual Production
identity, obtain explicit owner approval and use the existing acceptance runbook.
For candidate rollback, review the immutable starting commit/Preview or use an
owner-authorized normal revert of this milestone on the same branch. Preserve
history and records; never reset, force-push or change Production here.
