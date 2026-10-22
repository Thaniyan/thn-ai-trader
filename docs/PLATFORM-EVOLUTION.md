# Professional platform evolution — local candidate

## Scope and lineage

Canonical main was fetched and verified at
`a3e996e2b0881ca2a36a5426bc2bccad08c66ec9` before implementation.
The dedicated local branch is `feature/professional-platform-evolution`.
No remote branch, pull request, hosting environment, account, database or deployment
is created by this milestone. Original canonical ancestry and recovery artifacts
are retained. This is not a rewritten/sanitized replacement of original history.

The product version is **7.2.0**, maintained in package.json. The server reads that
same packaged file for `/api/health`; service labels and the Settings release
panel use the existing health state. Engine/schema version identifiers remain
unchanged because the underlying numerical engines and research formats did not
change. The existing THN brand favicon is retained and verified as a served PNG.

## Product changes by section

| Section | Delivered behavior | Existing functionality retained |
| --- | --- | --- |
| Dashboard | Selected instrument/interval, actual closed observation, source/time/freshness, provider-frame coverage, local research activity, next useful action and one-click research/risk/record routes. No invented P&L. | Original detailed command/evaluation controls and capability notices. |
| Markets | Selected-row emphasis, matching/favorite/observed counts, more readable rows and direct instrument-specific Research/Risk actions. | Curated mapping catalog, search, categories, favorites, observed-price/change sorting, provenance, explicit first-six observations, two-request concurrency and 60-second cache. |
| Trading | Consolidated instrument/context header; chart canvas ahead of detailed controls; shorter provider-chart heading; workflow actions below charts; clearer responsive spacing. Mobile opens onto chart content sooner. | Official public TradingView script, generation parents and guards, symbol/timeframe mappings, retry, honest load states, external link/fallback, owned candles, indicators, drawings, persisted annotations, keyboard controls and accessible candle table. |
| Intelligence | Four evidence layers: observations, interpretation/agreement, counter-evidence, limitations/invalidation. Existing ready scenarios link to the original Risk workflow. A direct action opens/focuses the real six-role committee. | All deterministic research, MTF, confluence, quality, historical/chronological evaluation, committee, citations and research memory. No model activation. |
| Risk | Explicit planning checklist, authoritative current budget/cost-adjusted exposure, validated-state feedback and one-click save of a matching research report plus hypothetical plan to Library. | Original server position sizing, contracts, directional validation, costs, margin warnings, targets and chart overlays. No assumed broker capital or order dispatch. |
| Portfolio | Research-report/idea/reported-outcome inventory and explicit unavailable verified-broker-performance status. Direct evaluation, record-inspection and risk routes. | Existing protected evaluation/backtesting, chronological splits, sensitivity and comparison tools; unverified entries never become verified returns. |
| Journal | Current-context save readiness, immediate original-record access, JSON/CSV backup actions, Library navigation and browser-local limitations. | Classification, newest-first display, original JSON, filtering, import/export safety, quota/corruption behavior and PR #5 synchronous lifecycle. |
| Brokers | One capability board consolidates the prior readiness board: available research, explicit operator-local paper requirements and unavailable hosted execution/account/generative features. | Disabled credential controls and existing local-paper gates/tools. No simulated connection success. |
| Settings | Appearance/language actions, explicit instrument/timeframe defaults using the existing context preference, recovery/export routes and service-backed release version. | Existing research/risk preferences, storage handling and confirmed destructive controls. No new settings store or migration. |

## Integrated workflow and trust boundaries

1. Discover an instrument through the existing Markets catalog. A row action commits
   that instrument to THNContext and opens the actual Intelligence or Risk section.
2. Inspect closed provider observations and provenance. The shared control ribbon
   remains the original ribbon; hash/experiment status is consolidated into an
   inspectable disclosure rather than duplicated across several global strips.
3. Explore the owned research chart or the independent official TradingView embed.
   TradingView's internal iframe choices do not synchronize back into THN.
4. Explicitly run the existing deterministic analysis, then review supporting and
   conflicting evidence. No role or confluence score is presented as calibrated
   prediction probability or live generative output.
5. Enter explicit capital, contract, levels and costs in the original planner. The
   existing numerical HTTP path validates the hypothetical plan.
6. Save the plan with the existing Library report only when the original snapshot
   accepts matching symbol, interval and evidence hash. No financial record is
   created by saving this hypothetical research report.
7. Save an analysis as a research idea, inspect its original bytes, reload and
   export using the original safe codecs. Reported/manual outcomes stay separate.

The core `saveJournal()` guard now rejects missing, in-flight or mismatched
instrument/timeframe analysis. It returns success only after the original guarded
storage write succeeds. Context changes leave prior analysis available for honest
inspection, but cannot accidentally save it as the newly selected research idea.
No new record schema, financial verification flag or data migration is introduced.

## Architecture, performance and accessibility

`platform-evolution.js` is a presentation adapter over THNContext, THNResearch,
THNDecision, THNLibrary, THNRecords and THNServiceHealth. It does not introduce a
parallel store, engine, automatic provider request, polling timer or dependency.
Repeated notification work is coalesced through requestAnimationFrame; unchanged
panel content is not rewritten, and context/metadata updates do not rebuild the
Settings input form. The tested 40-notification burst produced one render.

One existing broker readiness element has one presentation owner after adapter
initialization. There are no competing broker screens or credentials flows.
The additional JS/CSS are about 36 KB uncompressed. Overall startup latency was
not benchmarked, so no unsupported global speedup claim is made.

The original responsive layout fix remains in place. New grids use zero-minimum
tracks, scoped horizontal scrolling, visible focus, restrained panels, readable
light/dark contrast and English/Arabic text. Original instrument controls and
chart ownership remain intact. The chart canvas and subsequent tool controls have
actual DOM order matching their visual order, rather than a misleading CSS-only
focus order.

The new connected browser gate awaits successful HTTP analysis and plan responses,
real context readiness, completed finite entry animations and actual persisted
records. It does not inject artificial analysis or manufacture a successful record.
All market/widget test data are explicitly offline protocol/provider fixtures.

## Visual evidence and reproducibility

See [the before/after gallery](PLATFORM-EVOLUTION-VISUALS.md). Before images are
from an isolated source archive of exact canonical a3e996e, with the published
production-package manifest verified. After images use the packaged local candidate.
There are 72 images per version across nine views, two widths, two languages and
two themes; selected 36 originals and hashes are committed. The complete 144-image
set, raw test logs, intermediate findings and manifests are retained under
`/workspace/work/platform-evolution-evidence/`.

The first visual pass exposed duplicate context ribbons and a mobile chart below
too many tool actions; those were consolidated/reordered before the final gate.
A new internal Settings marker initially collided with the legacy data-language
button selector; it now uses a private data-evo-language marker. An initial axe
scan observed entry-fade intermediate contrast; the test now awaits finite
animations instead of adding sleeps or excluding contrast checks. Earlier
intermediate browser work was superseded after actual runtime/layout changes;
its logs remain retained. The professional zoom matrix then identified an 8-pixel overflow at 180 CSS pixels from the annotation input’s intrinsic minimum width. A scoped minimum-width correction preserves the unchanged zoom assertions. The final complete gate tests the final runtime source.

## Preserved boundaries and remaining limitations

- All six frozen numerical files remain byte-identical to canonical baseline.
- No dependency additions, provider secrets, model downloads, LLM activation,
  broker credentials, live or hosted-paper execution, durable-account claim,
  hosting changes, paid resources, Git push/PR/merge/deployment or history rewrite.
- Private records remain browser-local. Browser storage is not server persistence;
  exports are needed for backup. Existing storage-denied/full/corrupt handling is
  retained. Nonfinancial context preferences can remain session-only when storage
  is unavailable; this does not grant financial persistence.
- Public TradingView embeds are third-party network-dependent. Script/iframe load
  never establishes actual candle readiness. Existing timeout/fallback remains;
  this milestone does not claim to resolve external provider delays.
- Local Chromium/fixtures establish UI behavior, not actual Production visuals,
  exchange prices, model quality, broker execution or predictive profitability.
- Full hosted CI and original-site browser acceptance are required after separate
  exact-commit publication approval. No release authority is inferred here.

## Final local acceptance

All **17 browser suites passed** (runner exit 0): the existing professional matrix
covered 288 layouts, 72 axe scans, 64 zoom cases and 72 touch-target cases. The
new integrated workflow covered 108 geometry checks and 108 axe scans across nine
views, desktop/tablet/mobile, EN/AR and both themes. TradingView remediation added
24 layout and 24 axe cases. No application page errors were recorded in those
results. The 40-notification burst required one presentation render.

Build, lint, 155 unit/numerical tests, 10 system tests, 21 security tests, production
packaging, workflow validation, source/release guard, frozen dependency install and
the unchanged dependency audit passed (zero vulnerabilities). The initial audit
network failure and intermediate layout findings remain in the external evidence
directory; acceptance uses the successful final runs. No tests were removed.

The successful browser runner emitted a Playwright pending-connection/TargetClosedError
warning on shutdown, after all suite results. This is retained, not represented as
a failed application assertion. Tests used installed local Chromium 151 and pinned
Playwright/axe tooling; hosted CI/browser-binary equivalence is not claimed.

Final package manifest SHA-256:
`bf0526d1eddb8131849673f34cca48aeb1e34ce65648a687ad4d4089d19b358a`.
See [machine-readable validation](platform-evolution-evidence/validation.json)
and the retained raw logs for reproducibility. This is ready for local owner review,
not a claim of hosted CI or Production acceptance.
