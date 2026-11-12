# Command Center professional refinement — review candidate

Owner direction: [PR20 comment](https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6803982233).
Baseline: `7fedc5b22e04d237e1af18398045d1d5079c8c7f`, CI-green but not accepted.
Continue the existing PR20 branch; main and Production require owner approval.

## Working application changes

The existing Command Center now connects a visible independent-timeframe readout,
a source-bound evidence ledger, opposing school perspectives, chart-linked level
inspection and the retained hypothetical planner. This is the same application,
single canvas, market context, numerical engines and saved-record architecture.

- Three timeframe cards open their recorded observations without changing market
  context. Their ledger shows retained EMA20/50, RSI, ATR, source/provider, closed
  bar timestamp and dataset hash. Opening a different market timeframe requires
  an explicit action through the original context controller.
- Bullish, bearish and neutral school filters expose supporting and contrary
  perspectives and retained warnings. Counts are not independent votes or a
  calibrated probability; the UI explicitly states that no live news,
  fundamental or sentiment feed is provided.
- Source identity and retrieval status remain separate from an executable quote.
  Missing, stale, future, mismatched-provider and superseded frame information
  does not become current evidence. Malformed optional frame arrays are handled
  as unavailable. Imported/saved records gain no authentication from a hash.
- Eligible entry/stop/target rows are keyboard-operable chart inspection controls.
  Their lines remain at the original chart engine's price coordinates while
  panning/zooming. The selected reference receives a distinct visual state and
  an accessible status; off-scale references are identified explicitly. Source-
  candle navigation uses the original bar inspector. No off-screen anchor is
  reconstructed.
- Bounded reference/risk shading uses only already-projected visible coordinates;
  it is not sizing, PnL, probability or an expected-return calculation. The
  original recorded-level eligibility remains authoritative. WAIT states show a
  clear reason to inspect evidence instead of five empty price rows.
- The original explicit level-copy action and authoritative Risk Desk calculation
  remain unchanged. Capital/leverage are not copied with price references; no
  order is created. A separate Library record preserves the original schema.
- The command bar has a direct review/cancel path. Source and secondary controls
  remain accessible; the original context toolbar retains its original ancestry.
  Native disclosures, filters, shared drafts and keyboard return focus survive
  translated/theme rerenders. TradingView retains its separate-feed warning and
  never receives private overlays.

## Ownership and safety

`command-evidence.js` is a read-only presentation projection over existing model,
brief, analysis and source identities. It reuses the existing freshness boundary;
it does not alter numerical calculations, candidate eligibility or evaluation.
`command-workbench.js/css` own the added UI and chart decoration; the existing
Command Center still owns its original controls, chart, planner and save action.
The original toolbar ancestry was restored after the unchanged Maturity suite
identified a selector/ownership regression in the initial pass. That failed run
is preserved separately, never counted as a passing gate.

Visual review also caught RTL reference text entering the native price axis;
explicit text direction and bounded, collision-aware label layout correct that
presentation while retaining the original price-line coordinates. Eight browser
label profiles verify actual text bounds and separation. The unchanged Visual
Refinement suite subsequently caught tablet confidence below the first viewport.
Tablets now use the retained opening confidence card and a full-width chart;
all 24 original visual profiles, 12 hierarchy profiles and 72 font profiles passed
targeted reruns. The initial failed and incomplete runs are not passing evidence.
The original Command Center additionally requires the assessment/setup beside the
chart at 1024px. The full-width confidence/chart arrangement is therefore limited
to narrower tablets (through 900px); 1024px retains the two-column workstation.
Both complete original acceptance suites passed that correction unchanged.
The new label-bound test measures current connected SVG nodes and chart geometry
in one browser evaluation to avoid retaining nodes replaced during native redraw;
zero-size or disconnected labels are explicitly rejected.

The six frozen numerical/chart engines and server financial code are unchanged.
No SDK/dependency or lockfile update, schema migration, hosted model activation,
broker execution, new project or paid infrastructure is included. PR17 and
Issue18 remain separate. Source and chart coordinates do not authenticate data
or establish predictive performance.

## Acceptance and evidence

The added browser suite exercises evidence navigation, contrary filters, source
identity, a delayed independent brief, current-context invalidation, actual
cancellation, selected chart coordinates, original hypothetical planning,
Library save, immutable old records and explicit timeframe changes. Sixteen
EN/AR, theme and viewport combinations include axe. The original 36 suites and
their assertions/timeouts are retained; the roster is expanded to 37, with
disjoint complete CI sharding and fail-closed aggregation.

Before/after screenshots are actual headless Chromium renders of the app at
1440, 768 and 390 pixels, EN/AR and dark/light. Paired normal profiles use the
same fixed clock and synthetic offline provider history; they are not live-site,
real-provider or Production acceptance. Separate eligible-scenario screenshots
use explicitly controlled analytical response fixtures to demonstrate conditional
references; they are not live signals, generated AI or verified entry advice.

The original modules and raw records remain available. Trade-offs: independent
evidence is now directly inspectable, so the complete page contains more recorded
detail. Mobile prioritizes the original chart and places the expanded source/
evidence workbench below it. Detailed observations use disclosures rather than
forcing every metric into the first viewport.
Tablet prioritizes a readable full-width chart and opening confidence over a
narrow side rail; initial vertical chart coverage is slightly reduced, while
horizontal coverage increases substantially. Paired measurements record both
dimensions rather than claiming every measure improved.

Final local gates, source fingerprints, paired captures and exact-head hosted CI
must be recorded before acceptance. A READY Vercel association is platform
metadata; direct interactive access remains a separate check. Release and
rollback: [the existing runbook](PR20-RELEASE-ACCEPTANCE.md).

## Completed local candidate verification

All 37 browser suites passed together in the original two shards (1,078.39
seconds wall time), using pinned Playwright 1.62.0 / Chromium revision 1234,
Chromium 151.0.7922.34, axe 4.10.3 and the complete DejaVu font configuration.
All ten non-browser gates passed: build, lint, 328 core/numerical/integration
tests, 10 system tests, 21 security tests, production packaging, workflow/shard
validation, dependency audit, source-integrity and Git object integrity.
Frozen installation preserved package and lockfile hashes.

[Actual before/after gallery and full local evidence](evidence/command-center-professional/README.md)
includes 12 matched context/data/time pairs, 16 new accessibility journey
profiles, eight actual label-bound profiles and 72 existing font profiles.
At 1440px the chart starts 10px earlier and grows from 460px to 520px; at
390px it starts 32.5px earlier. At 768px it starts 26px later while gaining
full width: this tablet trade-off is explicit in the paired geometry.
Hosted CI and Preview identity must be checked separately on the new pushed SHA.
No merge, Production release, financial-engine change or live execution occurs.
