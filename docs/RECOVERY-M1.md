> Latest iteration: [owner-supplied reference revision](RECOVERY-M1-OWNER-REFERENCE.md).
> The earlier iteration below remains preserved as design history. Owner acceptance is pending.

# Milestone 1 — revised visual direction, awaiting owner acceptance

The owner rejected candidate `5bd4421d15db44751a9745beb25ea14c162e0faa`.
This continues the same milestone, branch and [PR #10](https://github.com/Thaniyan/thn-ai-trader/pull/10).
Technical test success is **not** visual acceptance. Do not merge or release Production.
Canonical main remains `53679a0be3f53967c5a409c579f8765d12d1afe5`.
The preceding candidate and its original evidence remain preserved in Git.

## What was wrong

The rejected result retained an admin-panel composition: stacked context/header
rows, uniformly outlined buttons, weak type hierarchy and too much explanatory
text ahead of primary actions. Drawing tools were concealed. Status badges and
account utilities competed with the instrument. Navigation glyphs looked unfinished;
mobile inherited the same wide control groups instead of a deliberate arrangement.
Reducing cards had not established a coherent workstation.

The earlier THN frontend (`a6d442e`) supplied a visual reference for recognizable
branding, navigation and strong primary actions. Its unsupported broker/balance
claims were not restored. Its mobile layout also overflows; historical mobile
captures are naturally scrolled to the original navigation/chart, not patched to
look responsive. Only public frontend files were rendered; no historical backend,
credentials, account records or runtime state were loaded.

## Design principles and implementation

Reviewed primary references: [TradingView's Supercharts interface](https://www.tradingview.com/support/solutions/43000746464-getting-started-with-supercharts/)
and [cTrader's interface anatomy](https://help.ctrader.com/ctrader-web/interface/basics-and-layouts/).
The applicable principles are contextual tool placement, a dominant chart, distinct
navigation/analysis/status regions, and secondary controls that do not compete
with the current instrument. No proprietary assets, platform code or private APIs
were copied.

- Rebuilt the existing design-system owners: `professional.css` owns tokens,
  application chrome, typography and controls; `platform-evolution.css` owns
  workspace composition. Replaced accumulated terminal overrides rather than
  adding a new stylesheet, CSS framework or chart implementation.
- Slate surfaces, restrained teal actions, consistent borders/radii and deliberate
  text sizes separate navigation, workspace and plot. Original THN branding remains.
- Grouped nine-section navigation uses original outline SVG icons. Account/session
  utilities move to the sidebar footer. The main header identifies the current
  section, with quiet clock, language and theme controls; mobile shows one brand.
- Instrument and observed-close typography anchor the workspace. Provider currency,
  selected context, unavailable/proxy warnings and stale-history disclosure remain
  explicit; there are no fabricated execution quotes or balances.
- Drawing and native zoom tools now sit beside the plot. Mobile uses a horizontal
  tool dock and scrollable overlays. Drawing buttons dispatch to the **existing**
  drawing-mode handler; existing zoom/reset nodes are moved, not cloned.
- A distinct Analysis rail presents matched trend/structure and prior levels.
  Confirmed structure abbreviations are expanded. A dedicated hypothetical Trade
  Scenario section leads to the original Risk Desk. Evidence/methodology stays
  available after the primary analysis actions.
- Dashboard and Terminal still share one exact chart instance, viewport and drawing
  state. Dashboard's secondary footer becomes compact research activity, rather
  than another competing command card. History navigation updates the route title.
- Mobile quote layout, tool placement, RTL and light/dark surfaces are deliberate
  adaptations, not a scaled desktop grid. No control merely pretends to work.

## Evidence to inspect

[Evidence inventory](recovery-m1-visual-revision/index.json) records original PNG hashes.
All screenshots are local captures. “Production source” means the verified v7.5
source rendered locally, **not** a live Production browser session. Regression
comparisons use explicit offline provider fixtures. Separate `real-provider-*`
captures use genuine retained Yahoo observations, not fresh executable prices.

| Matched comparison | Desktop | Mobile |
|---|---|---|
| Dashboard, EN | [Three-way](recovery-m1-visual-revision/comparison-dashboard-desktop-en.png) | [Three-way](recovery-m1-visual-revision/comparison-dashboard-mobile-en.png) |
| Terminal, EN | [Three-way](recovery-m1-visual-revision/comparison-trading-desktop-en.png) | [Three-way](recovery-m1-visual-revision/comparison-trading-mobile-en.png) |
| Dashboard, AR | [Three-way](recovery-m1-visual-revision/comparison-dashboard-desktop-ar.png) | [Three-way](recovery-m1-visual-revision/comparison-dashboard-mobile-ar.png) |
| Terminal, AR | [Three-way](recovery-m1-visual-revision/comparison-trading-desktop-ar.png) | [Three-way](recovery-m1-visual-revision/comparison-trading-mobile-ar.png) |

Desktop captures use 1440 × 1000; mobile uses 390 × 844. Original-size images and
HTML comparison sheets are alongside the comparison PNGs. Historical, v7.5,
rejected-candidate and revised screenshots are retained separately. Comparison
sheets lay out those original captures in a browser; source screenshots are not edited.

## Verification and preservation

The additive recovery suite exercises actual drawing creation (trendline, note,
horizontal), pan selection, native zoom/reset, observed-close identity, browser
history, analysis/save classification, unavailable-data clearing, mode visibility,
official-widget protocol/fallback, all nine views, EN/AR, themes and emulated zoom.
It does not inject prices or analysis to satisfy assertions.

The comprehensive run detected a genuine transient navigation overflow at zoom
breakpoints: an inherited all-property transition animated button widths while
labels already occupied their new width. The design system now transitions colors
only. The original geometry assertions and wait durations remain unchanged.
Final local results, focused reruns and packaging hashes are recorded in
[validation.json](recovery-m1-visual-revision/validation.json); raw logs are preserved
outside Git in `/workspace/work/recovery-m1-revision/final`.

The canonical release guard passes. This integrated repository retains its existing
legacy history; it is not independently sanitized. The older independent-history
checker reports that known ancestry and is not the canonical CI release gate.

All server sources, numerical engines, chart calculations, provenance rules,
Research Library/Journal contracts, financial classification, official TradingView
bootstrap/synchronization, CI workflow and Vercel configuration are preserved.
All nine sections remain functional. Hosted financial mutations and generative
inference remain disabled. No model, broker connection, cloud resource or paid
service was activated; main and Production were not changed.

## Remaining limitations and approval boundary

External TradingView candle reliability and live Production browser acceptance
are not established by protocol fixtures or local screenshots. Provider gaps,
staleness and device-local storage limitations remain visible. Historical mobile
rendering is an imperfect reference and is explicitly labeled as such. Advanced
research sections remain information-dense; no claim of universal subjective
polish or owner acceptance is made.

This milestone remains **open until the owner accepts the revised visual result**.
PR #10 must remain unmerged. Production release requires separate authorization.
