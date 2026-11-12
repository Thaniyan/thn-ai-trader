# Command Center — institutional acceptance candidate

Owner requirements: [PR20, 12 November review](https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6833948553).
Reviewed baseline: `1fbff005bcb34a84f3ddab200928636979cbeccc`.
This is the existing application on the existing PR20 branch. Main and Production
remain unapproved; PR17 and Issue18 remain separate.

## Connected functionality

The landing desk now provides a source-bound decision briefing. It distinguishes
available timeframe evidence from directional agreement: neutral/directional
mixtures are labeled different, not unanimous. Supporting and opposing facts
quote retained school reasons; clicking a fact opens that exact original school
in the evidence ledger. Escape returns keyboard focus to the citation. AVOID and WAIT retain neutral upward/downward headings; they never imply an
approved trading direction. No ranking,
new probability, vote weighting or recommendation calculation is introduced.

Recorded conditional confirmation and invalidation references remain distinct
from an eligible candidate. They require a fresh selected context and matching
brief symbol, interval and dataset hash. Missing, delayed, stale or mismatched
records produce explicit unavailable states. A WAIT decision remains WAIT even
when some timeframe observations point in the same direction.

The original chart now has an OHLC reading and a direct original candle-inspector
path. Hover and keyboard inspection use the actual visible candle; the readout
copies original values and never constructs replacement prices. Outside the
inspection range it clearly identifies the visible window's last closed candle.
Source changes and stale analysis remove the current readout.

An inspectable layer-source disclosure explains the original rolling support/
resistance method and identifies its exact source-bar period and dataset. Users
can open the original source candle. It exposes provenance, not a duplicate range
calculation. Original EMA/Wilder indicator methods, layer toggles, drawings,
pan/zoom, axes and chart coordinates stay authoritative.

The compact action bar exposes market review, evidence, hypothetical risk and
notes without route changes. Risk opens the existing planner; notes focus the
shared draft. Copying recorded price levels and validating risk still require
separate explicit original actions. Capital, account leverage and position size
are never copied or calculated by these controls. Library saving preserves the
original schema and earlier records.

## Visual hierarchy and original ownership

The shared chart remains the focal point. Its native canvas grows to 560px on
desktop/tablet and 480px on mobile. A compact selected-market/source strip remains
with the selector. Duplicate generic chart headings are removed on Dashboard;
the selected instrument, observed-close label, source and timeframe remain.
History/export and secondary inspection commands remain below the plot. Their
original header returns to its original anchor on secondary views. No canvas is
replaced or moved into a new chart owner.

The assessment keeps confidence before the research-only scenario. Entry and
stop references share a compact row; three independent targets follow in their
original order, with individually operable chart links. Deep decision
facts and conditions use a native disclosure, with the full ledger below. Narrow
layouts retain the opening confidence card, all original routes, theme/language
controls and a readable chart. No essential context is concealed to pass a gate.

## Verification contract

All original 37 browser suite sources, assertions and timeouts remain unchanged.
The new 38th suite covers 20 EN/AR, dark/light and responsive profiles plus eight complete eligible-scenario
first-viewport profiles, including
1024px and 160px stress cases. It checks actual OHLC selection, native zoom/reset,
layer provenance, source-candle inspection, evidence citation and return focus,
zero-route planner/notes access, preserved drafts/records, stale invalidation,
a delayed cross-symbol brief and the independent TradingView mode boundary.
Price controls are checked for cell overflow. New regions receive WCAG 2 A/AA and 2.1 AA axe scans.

Four additional pure regressions check copied facts/conditions and immutable
source records, neutral/directional differences, incomplete frames, cross-context
or stale evidence, exact original OHLC/source windows and invalid/missing input.
The six frozen numerical engines, all server code, dependencies, lockfile,
recommendation policy and candidate eligibility are unchanged.

The new eligible-scenario check additionally caught a small 1024px overflow;
the actual reference grid was corrected with the assertion retained.
The initial local pass exposed an original first-viewport confidence regression;
its layout was corrected, not its threshold. Source inspection exposed a real
focus loss caused by moving an already-placed disclosure; conditional placement
preserves focus. The new pointer test uses explicit nonanimated scrolling rather
than measuring during smooth scrolling. Failed provisional logs are excluded from
passing evidence. Identical offline OHLC hashes are not assumed to prove different
instrument identity: tests check symbol, interval and dataset binding together.

## Review evidence and release

Before/after captures use the exact reviewed baseline and current real app, the
same fixed offline provider observations and clock, and explicit EN/AR/theme
profiles at 1440, 1024, 768 and 390 pixels. Additional captures show native zoom,
source inspection and TradingView selection with its independent-feed warning.
External TradingView data is blocked in the offline fixture environment; these
images do not claim a loaded live feed. Controlled eligible-candidate images are
labeled synthetic UI scenarios, never real signals or generated AI.

Final measurements and verification evidence must be recorded before pushing.
Exact-head push/PR CI and the unique READY Preview are verified after publication.
A READY association is not interactive Preview acceptance. The existing
[release and rollback runbook](PR20-RELEASE-ACCEPTANCE.md) remains authoritative;
no merge or Production release is authorized by this document.

## Source-navigation regression investigation

The first completed full run recorded 37 suite passes and an Evidence Workflow
timeout before its fallback-font checks. Isolated tracing reproduced the same
failure: analysis and Intelligence requests returned normally, but after Arabic
source-to-chart navigation the English selector's pointerdown landed on the
language wrapper at viewport y=0.51px; no English click event occurred. A minimal
source-chart → immediate language-switch reproduction failed independently of
provider requests and font assertions.

The presentation controller now scrolls that source navigation immediately and
focuses the original canvas with preventScroll, avoiding a competing focus scroll.
The identical minimal interaction passes after that change. No numerical, risk,
authentication or execution logic in that controller is changed. The original
Evidence Workflow suite remains byte-identical; its full rerun and the full gate
are required. The new browser suite also retains immediate AR→EN and EN→AR source
handoffs without forced clicks, retries, sleeps or increased timeouts.

Targeted confirmation after the navigation fix: the unchanged full Evidence
Workflow suite passed all 16 standard and eight actual DejaVu fallback profiles
with zero browser errors. The expanded Institutional Desk suite also passed all
20 responsive profiles, eight eligible-scenario viewport checks and both immediate
source/language handoffs. A fresh complete release gate is required independently
of those targeted results.

## Completed local verification and measurements

The fresh complete gate passed all 38 browser suites together in 1,154.73 seconds,
with both shards exiting zero. The 37 original browser sources are byte-identical
to the reviewed baseline. All ten required non-browser gates passed: build, lint,
332 core/numerical/integration tests, 10 system tests, 21 security tests, production
packaging, workflow validation, dependency audit, source/numerical integrity and
Git object integrity. Frozen installation preserved dependency/lockfile hashes.
Node 24.19.0, Bun 1.4.3, Python 3.12.14, Playwright 1.62.0 and Chromium revision
1234 (Chrome for Testing 151.0.7922.34) were used. No dependency version changed.

[Actual before/after gallery and complete evidence](evidence/command-center-institutional/README.md)
contains 16 identical-context normal pairs and six controlled eligible pairs.
Their original candidate prices/identities are equal before and after. The new
suite passed 20 responsive/accessibility profiles, eight complete desktop
candidate viewports and two immediate bilingual source handoffs. Existing font
coverage includes 72 profiles, plus Evidence Workflow's eight actual DejaVu
fallback profiles. No hosted model or order was executed.

Measured EN/dark first viewport, 1,000px high:

| Width | Chart starts before → after | Visible chart-canvas area change |
| --- | --- | --- |
| 1440 | 520.23px → 427.23px | +22.4% |
| 1024 | 611.38px → 490.23px | +33.0% |
| 768 | 720.23px → 684.73px | +12.7% |
| 390 | 697.05px → 668.42px | +9.4% |

These are measured canvas-area changes, not profitability, price accuracy or
predicted performance. On mobile the chart is larger; lower indicators and deep
reasoning still require scrolling. Four direct header actions replace two;
Risk and notes each take one explicit action without a route switch. Citation
inspection takes two actions; no claim of universally reduced click counts is
made. All images are actual browser renders with disclosed synthetic data.

Local verification is complete. Hosted exact-head CI, the unique existing-project
READY Preview, clean remote identity and interactive-access limitations must be
reported separately after push. Owner visual acceptance and explicit release
approval remain required before any main/Production integration.
