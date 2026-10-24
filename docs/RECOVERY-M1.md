# Professional Product Recovery — Milestone 1

Canonical source: `53679a0be3f53967c5a409c579f8765d12d1afe5` (v7.5.0).
Branch: `feature/professional-product-recovery-m1`.
This is a presentation/workflow recovery, not a new strategy or AI release.

## Product diagnosis and recovered strengths

The v7.5 landing page required a navigation action before seeing a chart. Repeated
context, source explanations, workflow links and boxed metrics competed with the
primary task. Basic overlays were concealed with advanced tools; a long evidence
rail overwhelmed the chart's interpretation. Historical CSS overrides repeated
terminal sizing and breakpoint rules.

Read-only reference: pre-v6 `a6d442e` public frontend, inspected alongside v7.5 at
1440 × 1000 in Chromium. Its strengths were a recognizable THN brand, a clear
sidebar, strong primary actions and consistent teal chart framing. It also showed
unsupported account and market claims while its backend was unavailable. Those
claims, old backend, runtime state and numerical implementations were not reused.
Historical captures are visual references, not evidence of working market feeds.

The recovery keeps one sidebar, one instrument/timeframe selector, one chart owner,
one existing official TradingView integration, and the current engines. No new
framework, chart library, duplicate store, strategy or external service was added.

## Implemented experience

- Dashboard opens directly on the real THN candle chart. Dashboard and Terminal
  move the **same DOM/canvas/chart object**, preserving viewport and drawings.
  A route lifecycle event covers navigation, direct links, browser history and reload.
- Chart focus from Dashboard routes to Terminal before entering the original
  accessible focus mode. Escape and navigation restore the original inert state.
- EMA, volume, RSI, support/resistance, confirmed structure and hypothetical-plan
  toggles are visible by the chart. Annotation tools, detailed indicators and
  accessible candle tables remain available through native disclosures.
- A concise assessment displays the **matching authoritative frame's** trend,
  confirmed structure, observed close and prior support/resistance. Symbol, interval
  and dataset hash must match. No price or level is invented when unavailable.
  Prior-20-bar summary levels are explicitly distinguished from visible-window
  chart levels. Existing chart and engine calculations are unchanged.
- Source details and independent-chart limitations share the existing global
  provenance disclosure. Its closed summary still exposes provider and retained /
  unavailable status. Manual TradingView's independent-source warning and fallback
  remain visible within its existing workflow.
- Long evidence/methodology text is secondary. The Dashboard's duplicate command
  billboard becomes a compact research footer and recent saved-research links.
- Existing presentation stylesheet consolidates the accumulated terminal/context
  overrides. Cards use quieter borders, consistent spacing and readable text.
  Numerical identity wrapping, cost-inclusive controls, unavailable states and
  original responsive fixes are retained.
- Mobile keeps the nine-section navigation and instrument/timeframe controls;
  redundant workflow shortcuts are suppressed. Desktop retains the workflow links.
  English, Arabic, RTL/LTR, themes, keyboard focus and chart fallback are preserved.

## Nine-section review

| Section | Recovery / preserved purpose |
|---|---|
| Dashboard | Chart-first landing; compact secondary observation and recent research |
| Markets | Existing searchable watchlist, favorites, real observations and chart actions; quieter table and readable provenance |
| Trading Terminal | Same flagship chart, immediate layers, concise assessment, advanced tools on demand |
| Research Intelligence | Quieter evidence groups; deterministic assistant, committee, reports and original tools preserved |
| Risk Desk | Existing explicit hypothetical inputs, validated direction/cost budget and stale-plan rejection; consistent presentation |
| Portfolio | Existing evaluation/experiment disclosures and honest empty outcomes; no fabricated performance |
| Journal | Original immediate updates, classification, newest-first ordering, deletion and backup/recovery preserved |
| Broker Accounts | Existing capability gating and honest unavailable hosted connections; no credentials requested |
| Settings | Original preferences, local persistence warnings and confirmed destructive controls retained |

## Acceptance evidence and scope

[Evidence index](recovery-m1-evidence/index.json) inventories original PNGs and
SHA-256 hashes. `before-*` is v7.5 source served locally; `after-*` is the candidate
production package. Historical reference uses only selected public frontend files.
Automated browser regression captures use explicitly offline provider fixtures,
never synthetic production data. Separate `real-provider-*` captures use genuine
Yahoo observations through the supported proxy: 2,000 EURUSD / 1h closed candles,
17 gaps and a correctly disclosed stale-history status. The selected assessment
matched the exact dataset hash. No page errors occurred; finance and generative
inference stayed disabled. These captures are still local, not Production. Before/after captures use identical viewport,
language and theme; timestamps may differ. No local screenshot is labeled Production.

The new browser suite traces selection → actual API → matched frame → chart →
real deterministic analysis → Journal. It compares summary values against engine
output, checks shared chart identity/viewport, visible layer changes, focus/Escape,
reload, provider failure and disabled saving, and the official embed protocol /
THN fallback. It never injects analysis or financial records to satisfy a test.
Existing tests and meaningful assertions remain enabled. The new suite is included
in the normal packaged browser runner.

A development run caught loss of the long legacy provenance wrapping rule during
CSS consolidation. The original identity/budget and intelligence-form rules were
restored; final acceptance includes the expanded original analysis panel.

Final validation: 169 unit/integration/numerical tests, 21 dedicated security tests,
10 system assertions and all 21 packaged browser suites passed. The recovery suite
adds 8 journeys, 288 geometry checks and 72 axe scans; the original shell geometry
gate passed 202 cases. Build, lint, source/history integrity, workflow validation
and dependency audit passed (zero advisories). Two builds produced identical
64-runtime-file / 68-artifact-file packaging. Exact hashes and results are recorded
in [validation.json](recovery-m1-evidence/validation.json). Raw logs remain in `/workspace/work/recovery-m1/logs`.

## Preservation and remaining gaps

All server code, authoritative numerical modules, research chart engine,
financial classification, provider authentication, storage contracts, hosted
finance/LLM restrictions, official widget bootstrap, CI workflow and Vercel
configuration retain their baseline implementations. The browser runner adds a
suite; no gate is removed, skipped or weakened. Existing saved records are not
rewritten. The full local application is retained.

No claim of live Production browser acceptance or repeated external TradingView
candle reliability is made. Managed browser egress excludes those hosts; widget
acceptance uses the explicit official-protocol fixture. Real provider availability,
third-party delays and owner Chrome acceptance remain external checks.

Milestone 2 requirements only: additional validated supply/demand/liquidity
semantics or broker/AI architecture would need separate scope and authoritative
inputs. This milestone adds no such calculations, connections or inference.

Publication boundary: the owner authorizes this feature branch and one PR after
local gates. Main, Production, hosting settings, billing and infrastructure must
remain unchanged. Production release requires owner approval of the final SHA.

## Visual comparisons

| Workflow | v7.5 local before | Recovery local after |
|---|---|---|
| Desktop landing, EN/dark | [Before](recovery-m1-evidence/before-dashboard-en-1440-dark.png) | [After](recovery-m1-evidence/after-dashboard-en-1440-dark.png) |
| Tablet terminal, AR/dark | [Before](recovery-m1-evidence/before-trading-ar-820-dark.png) | [After](recovery-m1-evidence/after-trading-ar-820-dark.png) |
| Mobile landing, AR/light | [Before](recovery-m1-evidence/before-dashboard-ar-390-light.png) | [After](recovery-m1-evidence/after-dashboard-ar-390-light.png) |
| Mobile risk, EN/light | [Before](recovery-m1-evidence/before-risk-en-390-light.png) | [After](recovery-m1-evidence/after-risk-en-390-light.png) |
| Desktop Journal, EN/dark | [Before](recovery-m1-evidence/before-journal-en-1440-dark.png) | [After](recovery-m1-evidence/after-journal-en-1440-dark.png) |

[Earlier visual reference](recovery-m1-evidence/reference-a6d442e-desktop.png).
[Actual-provider desktop](recovery-m1-evidence/real-provider-en-desktop.png) and
[Arabic mobile](recovery-m1-evidence/real-provider-ar-mobile.png) show genuine
retained observations, not fresh executable prices. All 68 original PNGs are
inventoried in the evidence index; originals have not been resized or edited.

Local recommendation: GO for reviewed feature publication and owner visual review.
Production remains behind fresh hosted CI and separate owner approval; no merge
or Production deployment is authorized by this milestone.
