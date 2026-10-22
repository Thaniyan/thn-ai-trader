# v7.3 professional trading experience — local candidate

## Scope and lineage

Branch: `feature/professional-trading-experience-v73`. Verified canonical starting
commit: `2546b5b48d9e94db45675d3d50268a8f22d86868` (v7.2). Existing v7.2 work,
canonical ancestry and recovery material are preserved. No push, pull request,
merge, deployment, hosting/billing/security change, paid resource or provider
activation is part of this milestone. Version comes from package.json (7.3.0),
which the existing health endpoint reads. Original canonical history is retained;
it is not claimed to have been independently sanitized.

## Consolidation and ownership

This refactors the existing modules; no new presentation module, parallel context,
record store, engine, framework, library or dependency was introduced.

| Surface | Active owner and consolidation |
| --- | --- |
| Shared context | Original `.q-context` inputs and `.q-context-actions`; Platform Evolution reuses the actions as one toolbar instead of generating a second five-step strip. |
| Trading | `professional-workspace.js` owns chart placement, mode controls, evidence rail and actions. Platform Evolution no longer relocates its canvas. The underlying chart/research modules retain their handlers and data. |
| Scenarios | Original `decision-workspace.js`; duplicate Evolution scenario cards and planning controls were removed. Existing scenario validation/transfers remain authoritative. |
| Dashboard | Evolution provides selected context, readiness, activity and actual Library shortcuts. Original detailed briefing remains available; old watch/overview widgets and observation strip are consolidated into the existing disclosure. |
| Records | `professional-records.js` inspects the original Journal; `research-library.js` owns Library reports/replay. No migration or verification promotion. |
| Settings | Evolution owns active appearance/context/capability controls. Duplicate inert timeframe/appearance and static capability cards were removed; original sizing and confirmed destructive tools remain. Sizing uses the existing setup preference key. |

Advanced original terminal/local-paper panels are retained in a clearly labeled
closed disclosure below the primary research terminal. Existing IDs, listeners,
local gates and financial restrictions remain. Brokers retains the existing honest
capability board and original local-paper disclosure; no competing broker UI.

## Delivered behavior across the nine views

| View | What changed / what is preserved |
| --- | --- |
| Dashboard | One shared toolbar; fewer default overview widgets; recent actual Library entries open the original report. Selected observation, provenance, readiness and Journal actions remain. |
| Markets | Compact wrapping row actions; clearer retry language for unavailable observations. Search, category, favorites, selected state, provenance, bounded first-six requests, concurrency and cache remain intact. |
| Trading | Main chart plus responsive research/action rail; matched EMA/RSI/ATR observations, plan status, save readiness and real analysis/evidence/risk/Library actions. Advanced original tools are below the chart. Tool-specific instructions and measured non-overlapping time-axis labels improve owned-chart usability. |
| Intelligence | Concise observed/derived/opposing/invalidation summary, followed by the original committee and single authoritative scenario workspace. No model activation or probability claim. |
| Risk | Explicit transferred scenario/invalidation context and direct return to evidence. Existing calculator, costs, margin, targets, validation and matched Library save remain authoritative. |
| Portfolio | Duplicate page heading removed; existing research/outcome classification, chronological laboratory and comparison tools retained. Shared toolbar and record-review improvements connect evaluation to original records. |
| Journal/Library | Current-instrument filter and match count; stale selection clears after deletion. Saved reports can open their instrument/timeframe in current research, explicitly distinguishing newly retrieved history from immutable saved evidence. Original inspection, newest-first behavior, backup/recovery/replay and classifications are retained. |
| Brokers | Shared navigation consolidation; existing capability board and restricted local-paper tools retained. No real account connection, credential capture or hosted execution. |
| Settings | Functional sizing defaults, explicit apply/storage-failure feedback, release/storage status and one context/appearance owner. The unavailable broker can no longer overwrite restored research risk/capital inputs. Existing setup preferences and destructive confirmations remain. |

## Connected workflows

A. Dashboard/Markets → explicit provider observation → selected THN chart.

B. Terminal analysis action → actual deterministic HTTP analysis → technical
observations → Intelligence evidence/counter-evidence → original scenarios.

C. Explicit capital/entry/directional stop/target/costs → existing server plan
validation → matching research + hypothetical plan saved to existing Library.
Opening a report's current context does not rewrite its stored evidence.

D. Terminal save → immediate Journal idea → selected-instrument filter → reload →
original JSON inspection. While a genuine analysis request is held, saving is
unavailable and rejected; completion enables it. No outcomes are fabricated.

E. Official public widget → measured script/frame phases → symbol/timeframe and
navigation lifecycle → unchanged retry/fallback. Measurements are not evidence
of toolbar or market-candle readiness; those flags stay unverified.

F. EN/AR, themes, keyboard and responsive behavior; sizing preferences persist
through the existing setup key. Storage refusal reports session-only behavior
without deleting earlier records.

## Defects found and corrected

- Restored research risk was overwritten by the disconnected broker's default
  risk value during startup. Synchronizing research inputs now requires an
  explicitly connected local paper account. Unavailable hosted account state
  cannot supply capital or replace research defaults.
- A new save control needed notification when the original analysis button's
  disabled state changes. A single attribute observer keeps readiness accurate
  during and after requests; `saveJournal()` remains the final guard.
- Narrow chart time-axis labels collided. The existing presentation subclass
  reuses the authoritative visible bars and measures text spacing, keeping first
  and last labels and omitting intermediate labels only when they cannot fit.
  All numerical data, drawings and protected renderer code are unchanged.
- Visual review found overly tall Markets rows from the initial action grid;
  compact wrapping actions replaced that grid.
- A renamed Arabic heading broke a meaningful existing localization assertion;
  the established bilingual heading was retained. No assertion was removed.
- The shell suite used the retired Dashboard heading as a startup anchor. Its
  wait now targets the visible consolidated Dashboard heading; all 200 geometry/zoom
  cases and two keyboard/scroll stress cases remain unchanged. The new suite uses a
  bounded visible-active-view animation condition rather than an unbounded wait
  for unrelated page animations.

## Evidence and performance

[Before/after gallery](V73-VISUALS.md). Exact v7.2 source archive and original
package hash were retained outside the repository. Both versions use the same
capture code, clean browser storage and explicit deterministic provider fixtures.
Screenshots are local UI evidence, not actual Production or market-price evidence.

At a 1000px viewport height, chart top moved from 542.8px to 485.2px on 1440px
English desktop, 781.6px to 661.6px on 390px Arabic mobile, and 683.2px to 586.6px
at 768px English. Fixture-screen DOM count decreased from 3666 to 3555. These
are reproducible presentation measurements, not a claim about total startup,
CPU, memory or network latency. The widget acceptance check asserts that repeated
navigation and metadata-only updates preserve the same generation.

## Preserved trust and remaining limits

Six frozen numerical/renderer files remain unchanged; no financial verification
rules, record schema, provider normalization or quantitative formula is modified.
The owned-chart subclass changes presentation only. Official TradingView embed
configuration and generation-parent isolation remain; separate timing telemetry
adds no private iframe access or autonomous request loop.

Hosted live trading, hosted paper execution and generative inference stay disabled.
No broker secrets, external LLMs, downloads, paid APIs or new infrastructure are
introduced. Browser records remain local, unencrypted and device-specific; export
backups are necessary. A successful write is never represented as broker execution.

An actual external TradingView script attempt through the inherited managed proxy
failed with `ERR_TUNNEL_CONNECTION_FAILED`; script/frame/candle flags remained
false and the THN fallback worked. Real external candles and Production browser
behavior remain unverified. Offline protocol tests do not establish external
widget reliability. Hosted CI/release require separate exact-SHA approval.

## Final validation

The complete final browser runner exited **0** with all **18 suites passed**.
Results: 288 professional layouts, 72 professional axe scans, 64 zoom cases and
72 touch-target cases; 202 shell geometry/stress cases; 108 integrated geometry
and 108 axe cases; 20 new Terminal geometry and 20 axe cases; TradingView protocol
24 layout and 24 axe cases. Journal reload/save/classification/deletion and the
six new connected journeys passed. No application page errors were recorded in
the measured professional/integrated/TradingView/consolidation results.

Build, lint, 155 unit/numerical/integration tests, 21 security tests, 10 system
assertions, production packaging, workflow validation, source/release guard,
Git integrity, frozen dependencies and advisory audit passed. Dependencies have
zero reported advisories. All original suites and assertions remain; the shell
startup selector follows the consolidated heading and one suite was added.

The tested artifact contains 62 runtime files / 66 artifact files. Manifest SHA-256:
`33ca88c0e8e3ca5aa551207d5c2e968d2f1cec9c5557e5cf1ee518b7f54694b5`.
The final workflow run uses local Chromium 151 and pinned Playwright/axe tooling;
this is not a claim of hosted-CI binary parity. Playwright shutdown warning in the
final run: present (after successful suite results; raw logs retained).

[Machine-readable acceptance](v73-evidence/validation.json). Raw logs, complete
results, intermediate findings, source archive and recovery patch remain at
`/workspace/work/v73-evidence/`. Intermediate localization/readiness failures are
retained and superseded by the complete successful final run. This candidate is
ready for local owner review; publication and hosted CI need separate approval.
