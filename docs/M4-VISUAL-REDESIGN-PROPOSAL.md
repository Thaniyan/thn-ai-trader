# THN AI Trader | M4 visual design proposal

The proposal gives research one continuous path. Select an instrument, inspect its
last closed bar, review the evidence and conditional thesis, then estimate downside
and save a local example with its context. The desktop composition reserves the
largest surface for the chart. A single-column mobile flow keeps instrument
identity and data limitations above the chart and places evidence immediately
after the primary task.

## Review the prototype

Open `/m4-prototype.html` on the existing application's Preview, or run
`npm start` in the repository and open
[the local review route](http://127.0.0.1:3000/m4-prototype.html).
The route is an unlinked design review surface. The normal application entry
point and all nine application views retain their existing implementations.

| Prototype view | Change visible at first glance | Interaction |
| --- | --- | --- |
| Market Command Center | One chart and its last-close strip lead the page. The watchlist and provenance sit together in a compact rail. | Filter five instruments in the market picker or select one directly from the watchlist. Continue to the Terminal with the same instrument. |
| Trading Terminal | A taller candlestick plot takes the center. The right rail reads from observation provenance to conditional thesis, counterpoint and risk handoff. | Switch 1H, 4H or 1D. Toggle example levels. Inspect a bar by pointer or arrow keys. Carry the selected instrument and interval to the scenario. |
| Risk & Scenario Lab | A three-step guide frames a two-column form and result panel. The result gives loss, remaining budget and budget use together. | Adjust entry, stop, quantity and budget. Try invalid geometry and an over-budget estimate. Save a within-budget example to this browser and review its provenance. |

## Design system

Deep ink surfaces separate the shell, working panels and controls. Teal indicates
selection and available research actions. Amber marks synthetic data, cautions
and hypothetical results. Red identifies invalid form inputs. The typographic
scale distinguishes instrument identity, prices and evidence labels. Tabular
numerals and LTR ticker isolation preserve alignment in both languages.

Desktop navigation is persistent at the side. Tablet moves navigation to the
top and retains a two-column research workspace where the chart has room.
Narrow screens stack the chart and rail. The prototype includes English and
Arabic RTL, dark and light themes, a native modal market picker with
Escape and focus return, and keyboard bar inspection. The prototype's language
and theme settings are independent of the current application.

## Evidence boundaries

The selector exposes a synthetic example, stale example close, empty verified
observations, simulated market outage and simulated loading. The synthetic
candles have fixed UTC closing times and are generated deterministically. Stale
mode shows only the sample close. Empty, outage and loading states clear chart
values. No provider is connected and the verified observations panel is empty.

The thesis and reference levels are illustrative. The risk calculator uses a
linear USD teaching formula and excludes leverage, contract multipliers, fees and
slippage. A browser-local record retains the instrument, interval, example source,
bar time and assumptions. It does not enter the current application's Journal.
The prototype performs no API calls and has no hosted AI, broker balance, local
paper or execution controls.

## Ownership and integration boundary

| Review component | Prototype owner | Existing application owner for a later implementation |
| --- | --- | --- |
| Shell, navigation, dashboard and research-to-risk handoff | `public/m4-prototype.html`, `m4-prototype.css`, `m4-prototype.js` | `public/index.html`, `unified-workspace.js`, `unified-workspace.css` and the existing view controllers |
| Candles and source states | `public/m4-chart.js`, `m4-fixture.js` | `public/research-chart.js`, `professional-chart.js`, `research-state.js` and the existing provenance contract |
| Conditional thesis and scenario result | Prototype presentation and local example state in `public/m4-prototype.js` | `public/recommendation-view.js`, `research-risk-comparison.js`, and the existing authoritative risk and research record services |
| Language and theme | `public/m4-copy.js` and scoped review-route preference keys | Existing locale and preference controllers |

The prototype reviews three compositions. Intelligence, Journal and the other
existing views are outside the prototype redesign. A later integration should
bind the accepted layouts to the existing evidence and risk owners and run the
contract's same-fixture before/after and release acceptance matrix.

## Browser review evidence

| Profile | Baseline and prototype composition |
| --- | --- |
| Desktop · 1440 × 1000 · English dark | [Three view comparisons](m4-prototype-review/comparison-1440-en-dark.webp) |
| Tablet · 768 × 1000 · English dark | [Three view comparisons](m4-prototype-review/comparison-768-en-dark.webp) |
| Mobile · 390 × 1000 · Arabic light | [Three view comparisons](m4-prototype-review/comparison-390-ar-light.webp) |

The baseline screenshots use the repository's offline browser provider on
`fb92c96`. The prototype uses its own fixed synthetic candles. These are
composition references at matched viewport, locale and theme. The two fixtures
differ, so the images cannot establish same-data visual acceptance.

[Browser measurements](m4-prototype-review/browser-measurements.json) cover 60
prototype combinations across 1920, 1440, 768, 390 and 320 px, both languages
and themes, and all three prototype views. The focused review found no
document overflow, WCAG-tagged axe violations or page errors. It exercised
keyboard picker focus and dismissal, chart inspection, stale and missing data,
invalid and over-budget estimates, local saving and preference persistence.
All nine baseline application views were opened. This evidence covers the
prototype design review and is separate from the existing release gates.
