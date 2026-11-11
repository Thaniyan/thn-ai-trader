# Issue 21 — AI-first Trading Command Center candidate

Authoritative vision: https://github.com/Thaniyan/thn-ai-trader/issues/21 .
Base: verified PR20 head `93dcbaf50c0a52d8444b34c6c1ccdd08796d2dd1`.
Branch: `feature/integrated-research-workstation-issue19-20261110`.
Main baseline: `fb92c9604d16d0df45d3a13096c2f84a6d66546b`.
No merge or Production deployment is authorized. The existing candidate evolves;
no duplicate app, repository, Vercel project or prototype is created.

## Implemented working application

- First-use catalog chooser: actual supported mappings, categories, shared EN/AR
  instrument aliases, search, keyboard/escape behavior, recent selections and
  explicit retry through the original catalog controller. Invalid catalog payloads
  fail closed. This is a guided entry over the existing selected context; the
  default EURUSD observation can load in the background, with no order or sizing.
- One shared chart in a dominant main-page column, original drawing/indicator/
  structure/history tools, TradingView switch and explicit independent-feed
  caveat. The terminal route uses the same canvas, widget and viewport owner.
- Typed `THN-COMMAND-1` assessment exposes `rule_based_evidence` separately from
  optional `verified_model_interpretation`. Confluence is qualified and never a
  win probability (`probability:null`). Missing/stale/malformed/currently loading
  evidence yields N/A and no candidate. Grade/school count, source timestamps,
  historical validation and contrary conditions remain distinct.
- Candidate prices are copied exactly from the original server analysis only
  when existing recommendation rules permit BUY/SELL and provenance, currency,
  contract schema and direction/target geometry are valid. Neutral, incomplete,
  conflicting, proxy, stale or over-budget evidence yields no valid setup.
  There is no new entry/stop/target, sizing, PnL or financial formula.
- Coordinate-bound SVG annotations extend the licensed original canvas instead
  of drawing inside TradingView. Their bounds match the canvas; price/time
  positions use its actual plot and visible bars. Every draw checks symbol,
  interval, dataset and source-bar identity. Off-scale prices remain documented
  in the setup panel rather than fabricating a visible position. The source-bar
  inspector and methodology/legend are keyboard accessible. Stale original plan
  overlays are cleared unless their validated plan matches the plotted dataset.
- Expandable reasoning contains independent frames, eight existing perspectives,
  contrary evidence, conditional trigger/invalidation hypotheses and the precise
  retained-level algorithm. They are scenarios, not future-price forecasts.
  Native disclosures and focused controls survive reactive appearance updates.
- The original Risk Desk form AND cost controls move into a main-page disclosure
  and return to Risk Desk on secondary routes. Explicit level copying leaves
  capital/leverage unchanged and makes no POST. Calculation remains exclusively
  the original `/api/research/plan` handler. Preview leverage is not account
  leverage; entry references are not provider execution quotes.
- Main-page thesis shares the original draft. Saving creates a separate original-
  schema Library report. Optional quoted candidate notes require explicit opt-in,
  include raw recorded prices/hash/time/policy, never become a validated plan,
  and respect the existing 2,000-character limit. Existing draft notes and old
  records are not overwritten. No schema migration or silent re-evaluation.
- In-place cancellation uses the existing review coordinator plus an actual
  AbortController for technical requests. Superseded symbols are aborted and
  existing generation guards still reject late responses. Hosted execution stays
  disabled and no order is created by market selection or level preparation.

## Changed-file ownership map

| Files | Responsibility |
| --- | --- |
| `public/command-center-core.js` | Pure source/freshness/contract eligibility, copied original prices, chart projection and explicit quoted note; financial display policy review surface |
| `public/command-center.js`, `public/command-center.css`, `public/index.html` | Actual landing-page composition, one owned chart/planner, chooser, source annotations, reasoning, notebook and responsive shell |
| `public/app.js`, `public/platform-evolution.js` | Abort and review cancellation; retain original analysis/review ownership and support an in-place action |
| `public/market-terminal.js`, `public/unified-workspace.js` | Original catalog validation/retry, shared selection/refresh and navigation labels |
| `public/analysis-cockpit.js`, `public/professional-workspace.js`, `public/workflow-polish.js` | Placement adapters for original evidence, terminal and watchlist; unchanged original records and controls |
| `tests/command-center.test.mjs`, `tests/browser_command_center.py` | Eligibility/engine-freshness parity, coordinates, immutability and complete main-page interaction regressions |
| `tests/browser_recovery.py` | Exact approved route-caption expectation; all original safety/geometry assertions retained |
| `scripts/ci/browser_suites.py`, `tests/browser-sharding.test.mjs`, `package.json` | Add modules to syntax checks and new suite to complete fail-closed browser roster; dependencies/lockfile unchanged |
| `AGENTS.md`, `docs/PRODUCT-ROADMAP.md`, this document, `docs/evidence/issue21/` | Current owner scope, implementation boundaries, actual captures, measurements and verification evidence |

No server, frozen numerical/chart engine, execution permission, persistence schema,
dependency version, lockfile, CI job timeout or accessibility threshold changes.

## Boundaries and separately reviewable policy

`public/command-center-core.js` is a read-only eligibility/display projection over
`recommendationReview`, `confidenceReview` and original analysis prices. Its
stricter target-order/currency/contract checks suppress unsupported candidates;
review this file explicitly before financial acceptance. It does not change any
numerical engine or integrate PR17. Issue18 persistence/corruption findings remain
unresolved. Characterization tests are not approval of financial durability.

No hosted model was enabled, configured, called or claimed. Genuine local/model
output may be shown only through the existing authorized provider contract after
executed, validated, source-cited inference. No credentials, paid inference or
infrastructure changes are included. Rule-based annotations are labeled honestly.

## Verification evidence

`docs/evidence/issue21/verification.json` records final completed gates and their
scope. TradingView browser tests use the existing approved widget protocol stub;
live third-party feeds, provider latency and interactive Preview behavior need
separate acceptance. The new browser suite exercises actual one-page selection, chart mode,
positive controlled analytical fixtures, source-bound overlays under viewport
changes, explicit original-engine planning, empty inputs, source staleness,
cancellation, delayed-symbol invalidation, save/quotation immutability and catalog
recovery. It covers 1440/1024/768/390/320/160, EN/AR and dark/light, with axe scans.
A positive fixture tests display behavior, never real signal accuracy or model
execution. The core journey records actual route changes; screenshots use offline
provider fixtures and cannot substitute for interactive Preview acceptance.

All numerical, safety and geometry assertions, numerical engines, job/suite timeouts
and financial restrictions remain. One exact route-caption expectation follows the
approved Command Center rename, as documented below. Browser CI uses the existing two-shard, fail-closed aggregate
workflow, extended to the complete 36-suite roster. No test is disabled or skipped.

## Seven-day delivery and acceptance

The Nov 10–17 program is tracked by substantial working checkpoints, not micro-PRs:
main-shell/chart integration; complete analysis/setup/research workflow; final
verified release candidate. Implementation and local verification may complete
before the planned calendar day; do not pretend future days have elapsed.
Nov17 remains the owner's review and release decision. Real model activation and
financial acceptance remain separately gated, irrespective of that date.

Before acceptance, verify exact-head CI and the existing-project Preview, then
inspect real EN/AR/theme/desktop/mobile workflows. Direct Vercel and GitHub API
access may remain restricted by the workspace proxy; public Git metadata and a
branch push do not establish interactive production behavior. Do not change
network security, deployment protection or credentials to bypass restrictions.

Release and rollback: [PR20 acceptance runbook](PR20-RELEASE-ACCEPTANCE.md). Record
the actual current Production deployment before owner-approved integration. Use
linear integration, verify the new main/deployment identity and safe smoke checks.
Rollback only with authorization, preserving records and reverting the actual
approved integration commit rather than resetting history. PR17 remains separate.

### Regression investigation

The full shared-shell gate exposed an Arabic glyph-containment failure after
removing redundant header labels. The actual glyph range was 42px tall inside a
37.4px line box, overhanging its parent by 3px at the top. Measured 4px block padding
preserves the glyphs without clipping them. Route naming now remains owned by the
original navigation controller rather than competing renderers. Original geometry
assertions and tolerances are unchanged. A single-result Arrow Up chooser defect
was also corrected and covered explicitly; interrupted pre-fix gate logs remain
outside source for audit. No pre-fix partial run is counted as a final passing gate.

The same run also caught a watchlist owner that only recognized direct Dashboard
parents, plus the preserved opening-confidence/desktop-canvas geometry contract.
The original watchlist owner now recognizes the nested command-center host; its
storage and selection behavior are unchanged. Confidence remains visible on
opening and the slim labeled sidebar preserves the original >800px desktop chart
threshold. No threshold was reduced. The sole legacy caption expectation changed
from `Workspace` to the owner-approved `Trading Command Center`; back-navigation
still requires an exact route-title match. Numerical, safety and geometry assertions
remain intact.

The preserved Visual Refinement check additionally requires the full confidence
summary in the opening mobile viewport and a visible provider/model status.
The same owned summary moves to a compact mobile band above the chart; provider
status stays visible in the selector. After selection, the guided chooser becomes
an accessible search button rather than a redundant full-width row. Original
review actions remain reachable below the chart, while the new in-place action
stays beside the main assessment. No safety information or original function is
removed. The existing native selection tests now use that actual search button.

Risk Desk restoration is synchronous on the existing view event, preventing a
visible route from briefly containing a planner still hidden in the main-page
disclosure. The authoritative catalog's `proxy` flag is also required and honored:
commodity futures proxies and USD/USDT proxy contexts cannot produce native spot
candidates. These checks change display eligibility only; original engine prices,
contract calculations and financial permissions are unchanged.

Open sessions also age out: the display guard mirrors the frozen `prepareSeries`
closed-bar freshness boundary and is parity-tested against that authoritative
function. It does not mutate recorded `recent`/`stale` metadata, infer exchange
sessions, recalculate prices or modify a financial engine. A one-shot expiry check
and foreground refresh remove current scores/candidates/markers when evidence
ages out. Explicit main-page retry delegates to the existing shared history,
brief/MTF and technical-analysis owners rather than creating a parallel engine.

The final mobile hierarchy diagnostic measured chart top `751.125px` and visible
height `248.875px` against the original `<750px` / `>250px` requirements. Reducing
only band margins and padding restored those bounds without hiding content.
Paired evidence records the final same-data Arabic chart at `745.72px`; the
mobile trade-off is documented rather than advertised as a universal improvement.

One full-run attempt reported `Route.fetch: socket hang up` inside
Consistency's held-response interceptor, before its ordering assertions. The
packaged server continued serving later suites. Two isolated instrumented runs
preserved every assertion and passed, retaining the newer `0.7` risk input over
the older `0.5`; browser traces showed the expected abort only on instrument
change. No application exception, financial assertion failure, process stall or
provider outage was established. The precise TCP reset origin remains unproven;
this is recorded as a transport uncertainty, not a diagnosed application fix.
No retry, timeout change or interception/assertion change was added to the suite.
The failed run is not counted as a passing full gate. A fresh complete run and
exact-head CI are required; a recurring failure must block publication.

Final rendered positive-fixture review exposed the legacy directional popup covering
the main setup panel. The original toast owner now defers directional signals on
the Command Center, whose in-page assessment already owns them. Entering the main
page dismisses only that identified directional popup; ordinary notices and
secondary-page alerts remain functional. Regression checks exercise all three
paths. No signal calculation, sound preference, order or numerical rule changed.

The original coordinator status is explicitly labeled “Full review” on the main
page, distinguishing its incomplete/full-review lifecycle from an already
available technical snapshot. The original status text, assertions and owner
remain unchanged.
