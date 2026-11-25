# Day 8 — source-bound research Ticket

Owner directive: [PR23 comment7083295848](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7083295848).
Implemented on existing draft PR23 from verified Day7
19d47f8011b958d58cb77337d90a7efc6af44b6d, execution advanced22 November2026
(Asia/Muscat). November26 remains an acceptance review, not automatic GO.

## Demonstrated problem and resulting workflow

The original precision projection treated within-budget metadata as sufficient
for its Eligible label. Actual packaged Day7 rendering reproduced the defect for
both synthetic GBPUSD BUY and EURUSD SELL: a different entry produced an
input-valid separate plan while the original Ticket still read Eligible.
Before evidence records entryMatches:false/status:eligible. No original engine
price or financial formula was replaced in either render.

The real Command Center now composes that original projection with a read-only
Ticket binding. The plan must match symbol, side, interval, selected dataset hash,
source bar, entry, stop and the entire retained target sequence. Recorded source
interval/hash, when supplied, must agree too. Otherwise the Ticket remains
Conditional and explicitly identifies a separate plan; its monetary outcomes are
not borrowed. The original plan remains inspectable in the original planner.
This changes a misleading presentation label, not the authoritative recommendation,
candidate, eligibility policy, position sizing, budget, return or price engine.

Inside the existing Ticket, a closed-by-default progressive review connects:

- Recorded instrument/provider/currency, source bar opening time and exact hash,
  with direct navigation to the original source evidence. Identity is not source
  authentication, licensing or qualification; closed bars are not execution quotes.
- Exact bound original planner outcomes: capital/budget, stop loss including costs,
  margin, round-trip costs, hypothetical leverage, explicit cost assumptions, and
  each available independent target's original net reward and reward/risk.
- Clear unreviewed, pending, rejected, changed, separate-plan and matched states.
  Blank required numeric assumptions are rejected before network dispatch; an
  explicitly entered zero cost remains valid. Original engine limits still apply.
- Original inline historical evaluator, existing source-linked interpretation and
  existing Library note/save workflow. No duplicate form, evaluator, assistant,
  numerical service, persistence schema or execution action was introduced.

Only actual available target rows are rendered; missing T2/T3 are not placeholder
prices or invented outcomes. Original level controls still inspect source-bound
native chart coordinates and return focus with Escape. The TradingView mode stays
an independent feed; original native inspection remains authoritative for these
retained levels. No missing/out-of-range chart coordinate is fabricated.

Recorded-level transfer now identifies its actual source interval/hash/bar in the
existing scenario metadata. The original planner owns every input and result.
Pending responses compare the captured selected dataset as well as instrument,
interval and input signature. A source-hash change invalidates the plan immediately,
clears original plan overlays and prevents a late result attaching to new context.
Saved records and historical results are never rewritten or re-evaluated.

## Verification and evidence boundaries

All49 original browser suites/assertions/timeouts remain; Day8 adds a50th suite.
The focused actual packaged API/browser tests cover24 BUY/SELL profiles
(390/768/1440 × EN/AR × dark/light × two directions), axe, exact price/context
binding, independent target availability, source/inline-evaluator/interpretation
navigation, keyboard return, original Library roundtrip/immutability,18 blank
assumption cases and delayed actual planner response invalidation. Eight new unit
regressions cover binding/immutability/missing/stale/context/targets and EN/AR
blocker wording. The original Day6 suite separately retains its48 profiles and
14 negative cases, original prices and authoritative API risk results.

Before captures use immutable actual Day7 source packaged separately for rendering,
not a prototype, new repository or product. Matched screenshots and all positive
admission tests are SYNTHETIC and do not demonstrate lawful real-source admission,
model inference or a real eligible Ticket. All reported actual test counts/results
and image identities are in docs/evidence/day8; hosted verification must match the
pushed candidate SHA. A successful Preview deployment is distinct from interactive
access, which may be blocked before TLS by workspace CONNECT403.

## Unresolved real-world gates and precise decisions

|Input required before real qualification|Acceptance requirement / current boundary|
|---|---|
|Corrected EURUSD|Attributable source revision or approved lawful independent snapshot; immutable original/reference identities, compatible quote/session/bar semantics and36 reviewed P2 dispositions. All other missing-row/gap/freshness/consensus gates still apply. No price repair or calendar waiver|
|Native USD Bitcoin|Named native USD product/venue and lawful OHLC entitlement for all required intervals, quote identity and retention/derived-display rights; no BTCUSDT parity assumption or automatic route change|
|Genuine spot XAUUSD|Named spot XAU/USD per troy ounce venue/composite, quote basis, OHLC semantics, required intervals and lawful entitlement; GC futures, benchmark or CFD cannot silently stand in for spot|
|Rights/signoff|Owner-reviewed source/product/terms version covering local/hosted use, retention, backups, derived display, redistribution/geography and request/cost scope. Reachability alone is not a license. Acquisition approval differs from adoption/routing/financial policy approval|
|Real local model|Separate explicit authorization for one EN then one AR request on the exact already-installed reviewed model/digest, unchanged12s and remaining cumulative budgets. Existing Windows handoff applies; no inference here. Prior12003ms/no-response observation stays NO_GO|

No vendor contact, new endpoint, source/calendar eligibility change, purchase,
model installation/activation, hosted inference, paper/live execution, main merge
or Production deployment is authorized. A real WAIT due to unavailable/defective
source is correct; synthetic BUY/SELL cannot satisfy real-source/Ticket acceptance.
The next meaningful gate is lawful source-qualified Ticket review together with
separately authorized owner-device model qualification. Missing dependencies mean
NOT_VERIFIED/NO_GO for full operational acceptance even when software CI is green.

## Full-gate blocker: assistant hover hitbox

The first full run uncovered an actual Arabic assistant click failure in the
unchanged browser_evidence_workflow.py:43. The gate was interrupted and its logs
preserved, not counted as a pass. Bounded60-frame measurements showed stable
assistant/view geometry and no DOM mutations, but the submit button alternated
vertically by exactly1px. A real pointer-boundary reproduction confirmed that the
legacy .primary:hover translation moved the hitbox away from the stationary
pointer, alternating hover/transform every frame. It was not model inference,
font replacement or a stalled network response.

A scoped .i7-panel button:hover rule now keeps the hitbox stationary, preserving
hover color, focus outlines, normal click handling and all original assertions.
Day8 additionally exercises real pointer-boundary hover and normal submit in EN/AR.
The full original Evidence Workflow, all numerical/security gates and complete
browser gate are rerun after this fix. No sleeps, forced click, timeout increase,
reduced-motion test override or assertion bypass is used to conceal the problem.

## Full-gate blocker: default desktop Ticket height

The second full attempt found the new review footer overflowing the original
1000px Institutional Desk limit (1440px EN:top464.02,height603.5). It was stopped
and preserved. Targeted Day5 DejaVu verification additionally exposed the fourth
action wrapping under the original three-column action layout. Neither assertion,
font coverage, control size nor viewport limit was changed.

The compact risk status now accompanies the existing recorded-level caption.
The existing three actions and new Source & risk disclosure share an explicit
four-column desktop action row, all retaining44px targets and complete accessible
names. Their short visible labels remain meaningful; full caveats remain in the
review and the default text still states research-only, no execution approval,
stop uncertainty, risk validation and independent targets. Mobile retains its
original Ticket placement. No field, original action or numerical value is hidden.

Current original Institutional Desk measurements for all8 EN/AR/theme desktop
candidate profiles have a maximum bottom edge of937.61px (minimum62.39px spare space inside the
unchanged1000px bound). Original Day5's genuinely rendered DejaVu profiles also
pass. Full focused acceptance and the complete mandatory gate are required after
this correction; partial earlier runs are not release evidence.

## Nonreproduced local Trust language timeout

A complete local attempt finished49/50 with one30s Playwright click timeout in
original browser_command_trust.py:23, switching the header language after the
historical evaluation lifecycle. The trace reached performing click action;
it did not report a hidden selector, failed financial assertion or hover motion.
That run is a FAIL and is retained separately, not represented as full PASS.

The unchanged complete suite then passed in a diagnostic run and exactly five
bounded uninstrumented repetitions (100 EN/AR/theme/layout profiles), with no
recurrence. Diagnostic state projections took0.1–0.5ms and language transitions
reached subsequent frames normally. This does not establish the original timeout's
root cause. No production change, selector workaround, assertion relaxation,
forced click, sleep or timeout extension was made in response. A fresh complete
50-suite gate and both exact-head hosted workflows remain required. Any remaining
uncertainty must be reported, even if those later gates pass.
