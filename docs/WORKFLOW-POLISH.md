# Professional workflow continuation

Local work on `feature/workspace-visual-refinement`, based on
`26f3d896040bf00a83dd435994c689cf9aac7126`, continuing the first visual pass.
No push, merge or deployment is part of this work. The unavailable historical
Milestone 1.1 commit is not represented as this candidate.

## Resulting workflow

Markets retains every existing research action but gives the native chart a
clearer primary role. Inspect and chart buttons share the first action row;
TradingView, Research and Risk remain visible as lower-emphasis actions. The
selected row gets the strongest chart action. Instrument-specific accessible
names distinguish controls in the table. Provider identity, proxy warnings,
unknown coverage, stale observations and bounded fetching are unchanged.

Markets favorites now appear in a compact symbol-only strip above the original
Dashboard/Terminal chart. Adding/removing favorites updates it immediately;
preferences survive reload through the existing Markets storage key. Selecting
a favorite changes the authoritative shared context without creating a second
chart, synthesizing a quote or starting background market polling. The active
symbol has a pressed state and keyboard focus reveals offscreen chips. Catalog
initialization refreshes the strip so restored favorites do not disappear while
the asynchronous catalog is loading. Preferences are browser-local, not a
durable account or cross-device service; changes from another tab require reload.

Risk Desk puts the calculator before its explanatory review/save section. Its
original controls are grouped into labeled fieldsets for market/budget,
price/protection, and optional targets/notes. Cost assumptions sit alongside on
desktop and below on narrower screens. The submit button remains in the same
form; cost controls keep their existing listeners and values. Optional targets
remain independently disclosed full-position outcomes. Original server-derived
results and input invalidation remain authoritative. On the 390px-wide local
mobile capture, budget inputs start around 453px down the page.

The lower Dashboard is labeled as research activity instead of repeating the
analysis introduction. Supporting cards have tighter spacing. Whole-workspace
opacity fades are removed: an immediate accessibility check exposed dim text
and controls during route entry, especially around light-theme changes. The
same check now runs without a delay and passes.

## Scope and files

- `public/professional-markets.js`: action hierarchy, favorite accessor and change
  notifications, using the existing favorite owner and catalog.
- `public/workflow-polish.js`: original-control grouping, calculator-first order,
  localized stage labels and connected favorites strip.
- `public/platform-evolution.js`: activity and review/save copy.
- `public/workspace-refinement.css`: responsive styles, visible focus/selection,
  staged forms, compact market actions and full-contrast route entry.
- `public/index.html`: loads the new presentation module.
- `package.json`: adds its syntax check to build/lint; dependencies unchanged.
- `tests/browser_workflow_polish.py` and the browser runner: real UI persistence,
  context/identity, calculator invalidation, geometry and accessibility coverage.

No server, numerical engine, broker connector, market adapter, financial
authorization, dependency or lockfile change is included. Research and paper
boundaries, original test assertions, all nine views, RTL and both themes remain.

## Evidence and validation

`work/workflow-polish/` contains local fixture-based desktop/mobile captures,
`results.json` for the focused suite and the final packaged gate logs. These are
not Production, live-provider, real-model or broker-authentication evidence.
Use `candidate-*.png` for the final visual review; unprefixed captures are earlier
development drafts. `final-gate/` holds the complete final runner's suite logs.

The focused suite checks UI favorite creation/reload/removal and the original
chart object across Dashboard/Terminal. It verifies a server-calculated USD100
hypothetical risk, unauthorized execution, and invalidation after editing. Its
60 viewport/language/theme/view profiles include widths down to 160px, plus
immediate WCAG checks on desktop/mobile. It is registered as the 27th browser
suite; existing suites remain enabled.

The first browser run was deliberately interrupted after the mobile review
identified the calculator-order improvement. The complete final run uses the
rebuilt calculator-first production package and exited successfully.

| Check | Final result |
| --- | --- |
| Build / lint / production package | Passed; new module included |
| Unit / integration / numerical | 186 passed, zero failed/skipped |
| Security | 21 passed |
| Isolated system | 10 passed |
| Complete packaged browser gate | All 27 suites passed; runner exit 0 |
| New workflow profiles | 60 passed, zero runtime errors |
| Existing chart-visibility profiles | 24 passed |
| Workflow syntax / dependency audit / source and numerical parity | Passed; zero advisories |
| Frozen Bun install | 41 installs verified, no dependency changes |

`verification-summary.json` and `validation-logs/` in the evidence directory
retain the final counts and underlying command output. Both languages, both
themes, all nine original views and existing financial-denial checks remain in
the complete browser gate. No existing assertions were removed for this pass.

Owner visual acceptance and manual Safari/iPhone testing remain separate.
Further product work includes research-form simplification and more extensive
manual chart/tool review. No claim of verified live AI, broker connection or
Production behavior is made.
