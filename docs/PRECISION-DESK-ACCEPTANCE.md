# A+ — Precision Desk Refined: implementation acceptance

Authorization: [owner implementation approval on PR #20](https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6891420271).
Baseline: `623c888d1cd788bfc23cfa7dfb11619aaa9a562f`.
Candidate: existing `feature/integrated-research-workstation-issue19-20261110` branch.
This is a Preview candidate for owner acceptance. Main/Production are not approved.
PR #17 and Issue #18 remain separate.

## Working application changes

The main desk uses the original native chart at approximately 68% of the desktop
working grid, with a 24px separation from the setup panel. A compact instrument,
timeframe and analysis/evidence/risk/notes row replaces the expanded opening stack.
The native drawing toolbar and indicator controls remain operable; the TradingView
switch remains a separate feed without THN overlays. Desktop navigation uses named,
keyboard-accessible icons. Secondary views retain their original layout owners.

The original entry/stop references form the first price group; three independent
targets form the second. Immediately below, a source-bound excerpt identifies the
supporting method, then original confirmation and invalidation references and an
opposing excerpt. The excerpt comes from the highest **existing recorded school
score** in the applicable direction; ties keep retained order. This is display
ordering, not a new score, level formula, signal or predictor. Full original reasons
remain available in research details. Missing reasons are explicitly unavailable.

Three distinct states remain research-only:

- **Conditional:** the original candidate requires risk/activation review, or the
  original matched hypothesis is waiting solely for confirmation. A pending
  hypothesis does not gain entry/stop/target prices.
- **Eligible for research review:** an original candidate plus the original
  validated `within_budget` risk result. Never permission to execute an order.
- **WAIT:** missing/stale/mismatched evidence or an original hard blocker. There
  are no invented fallback levels or current activation references.

The one collapsed Research details workspace contains the original trust review,
independent timeframes, contrary evidence, provenance, historical testing, planner
and notes. Inspect setup, Explain and the primary evidence/risk/notes controls open
and focus their original targets. Escape restores focus for the new detail
navigation. Notes and saved records are not replaced by layout changes.

Heuristic agreement, source reliability, historical fixed-rule evaluation and
unavailable calibrated win probability remain separate. The large gauge becomes a
compact original score with expandable school context. The single original
historical form/evaluator and single original risk form are reused. Their retained
settings, running/dirty/failed lifecycle and view restoration remain authoritative.
A fixed-rule historical pass is not presented as validation of an individual trade.

## Responsive and localization contract

Desktop EN/AR at 1440 and 1024; tablet 768; mobile 390 and 320; both themes.
The original 160px stress cases remain in the gate. Mobile keeps the compact state
before the chart and places the full setup beneath it. Entry/stop are grouped;
targets remain separate. Source timestamps remain available, secondary text is
readable, primary controls have 44px minimum height and original gestures/keyboard
chart commands remain available. Source excerpts retain English with explicit
`lang="en"`; Arabic labels, states, school names, conditions and navigation are
localized. Verbatim evidence is not replaced by an invented translation.

## Verification and evidence

Results and measured before/after geometry are in
[evidence/precision-desk/verification.json](evidence/precision-desk/verification.json)
and [the screenshot index](evidence/precision-desk/README.md).
All forty original browser suites and assertions are retained; A+ adds a 41st
suite. The shared disclosure helper only gains the new ancestor disclosure.
No assertion, timeout, threshold, font profile or safeguard is weakened.

The acceptance test exercises real Conditional → explicitly validated Eligible →
input invalidation, delayed-context withdrawal, unavailable quote currency,
source-bound reasons, keyboard focus, record immutability, 20 EN/AR/theme/size
profiles, twelve additional validated Eligible EN/AR/theme/size profiles and
accessibility. Unit coverage checks retained prices, immutable inputs,
pending hypotheses, hard blockers, missing reasons and scored excerpt selection.

Screenshots are genuine packaged-application captures, not the earlier design
renders. Before and after use the same offline provider and frozen clock:
`2026-11-11T17:10:00Z`. Conditional/Eligible captures deliberately control analytical
responses to exercise UI states; they are **synthetic acceptance fixtures, not
live trade signals or performance evidence**. Eligible uses the original risk
form and engine with explicitly supplied assumptions. Context/hash and candidate
prices must match between each pair. A failed or absent fixed-rule test is labeled
as such; no favorable historical result is fabricated.

## Financial/security boundaries and release checklist

The six frozen numerical/chart modules and existing recommendation, confidence
and candidate eligibility contracts remain byte-identical to the baseline.
No server route, schema, credential, dependency, execution policy or provider
configuration is changed. There is no automatic sizing, order submission, model
call, risk-input mutation on inspection, or saved-record re-evaluation.

Before any release approval:

1. Require the full local release gate and both exact-head hosted browser shards,
   their aggregate, source/tests and dependency audit to pass.
2. Confirm GitHub PR #20 branch SHA, conflict-free merge candidate and unchanged
   main; inspect the full diff and review these actual screenshots.
3. Match the existing-project READY Preview to the exact candidate SHA. Perform
   owner interactive EN/AR/mobile/theme and source/risk/Library acceptance there.
4. Keep hosted AI, live/paper/broker execution unavailable. PR #17 is not included.
5. Obtain explicit owner approval before any main merge or Production deployment.

If origin access is blocked by the workspace proxy, public deployment metadata
and local offline tests do not constitute interactive Preview or Production
verification. Report that boundary explicitly.

## Rollback

Before a merge, reject or close the candidate; main needs no rollback. If a later
owner-approved integration must be undone, create a normal revert commit for the
approved integration on main, run the full gates and follow the existing Vercel
release workflow. Never reset/force-push main or erase branch history. There is no
data migration; original Library records and risk/history settings are preserved.

## Interrupted verification: Evolution diagnosis

The unchanged Evolution suite stalled at its TradingView → Dashboard return,
while awaiting finite document animations. A traced run reached the original
line 56 in about twelve seconds, then remained inside the native animation wait.
The A+ palette had been attached to the route-dependent `precision-home` class;
entering Dashboard changed inherited colors on hidden legacy controls, creating
color transitions whose completion promises could remain unresolved. This was an
application style-lifecycle regression, not a reason to increase the timeout.

The palette now belongs to the stable `precision-desk` class; route-specific
layout remains scoped to the Command Center. Animations, assertions and original
240-second suite limit are preserved. The complete targeted Evolution suite then
passed all five journeys, 108 geometry checks and 108 accessibility scans, with
one coalesced render and no page errors. Complete packaged regression results are
reported separately in the verification manifest.
