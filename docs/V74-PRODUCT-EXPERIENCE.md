# v7.4 Product Experience — local candidate

Parent: `4cbee1968bcc1460191676b8fbf9a2a0f17ed96c` (verified canonical main).
Branch: `feature/product-experience-v74`. No publication, PR, deployment, hosting
change, infrastructure, paid service, model activation or broker activation.

## Existing owners, one product

The owner's Chrome-review findings are the requirements. The 25 original Production
screenshots were not attached to this task; the linked before/after originals are
locally rendered **offline fixtures**, not claims of live Production observations.
The before application is an exact archive of the v7.3 parent. Same capture script,
viewport profiles and provider fixture implementation are used for the candidate.

No new presentation adapter, context store, preference store, record format,
dependency or framework. Changes live in the existing app, professional workstation,
platform evolution, decision presentation, assistant and Library owners. Original
nodes are moved into accessible native disclosures, preserving IDs and handlers.

| Section | Change |
|---|---|
| Dashboard | One concise observed-close/readiness command center. Detailed briefing and original tools remain in a disclosure. Coverage explicitly does not establish research sufficiency. Recent Library buttons open original reports. |
| Markets | Instrument-aware observed closes, tighter rows, request/unavailable/stale distinctions retained. Detailed provider panel is expandable. Curated symbols, favorites, sorting, 60s cache, six-row cap, two concurrent requests and cancellation unchanged. |
| Trading | Wider/taller chart and narrower evidence rail. Tools, drawings, indicators and provenance share an accessible disclosure; active states reflect the original chart layer state. Focus mode enlarges the existing chart without recreating its canvas or widget; Escape, focus restoration, keyboard cycling and inert background preserve access. |
| Intelligence | Deterministic branding, readable timeframe roles, compact research options. Every conversation message retains its original context and explicitly says history/current instrument match or historical different context. Old evidence never becomes current through relabeling. |
| Risk | Compact plan state precedes the real calculator. Original snapshot checklist is separate. Condition-met labels never approve a plan, authorize execution or establish broker verification. Context, source candle time and dataset match are visible; context transitions mark retained diagnostics unmatched. Theoretical break-even and hypothetical exposure semantics are explicit. |
| Portfolio | Research inventory, historical evaluation, experiment comparison and reported outcomes have distinct reachable areas. Empty source/period results show a concise explanation; full KPI/chart surfaces are shown only for eligible selected-source outcomes. No synthetic returns. |
| Journal | Daily save, search, filter, inspection, backup and original Library workflows stay primary. Original imports/migration and recovery remain under labeled Advanced Recovery. Records and existing safe restore semantics are unchanged. |
| Brokers | Honest research-only capabilities and restrictions retained; consistent compact panel spacing. No credentials collected and hosted account/trading operations remain unavailable. |
| Settings | Existing sizing card consolidated with appearance, research defaults, local backup and release information. Original confirmed destructive actions are separated in a Danger Zone. Startup preference restoration and quota-failure notices remain. |

## Investigated semantics

The Risk PASS values originate in `renderTables(analysis).checklist`; the validated
position is a separate server-calculated `THNDecision.plan()`. These are different
objects and may refer to different snapshots. We retain the individual predicates
and calculations, label satisfied predicates as **Condition met**, and show the
snapshot's symbol, interval, closed-candle timestamp and dataset match. A context
change immediately marks unmatched retained diagnostics. It does not erase useful
history or imply the underlying predicate was mathematically false.

Assistant messages already persist a context string. Historical EURUSD messages
under another selected instrument were preserved conversation history, not an
instruction to use EURUSD evidence for the new context. Every message now labels
that distinction; even same-instrument history instructs users to refresh evidence.
The existing cancellation, frozen snapshot, citation and memory safeguards remain.

`THNPresentation.price` formats presentation only: JPY pairs 3 decimals, supported
major FX pairs 5, other normal-sized instruments 2 (small values retain 6). It is
reused for Dashboard, detailed briefing, Markets and explicit original price fields.
Raw evidence, record values and numerical inputs are untouched. Numerical modules,
server files and the protected base chart are byte-identical to the parent.

## Measured presentation

At 1440 × 1000, English/dark, default unpopulated fixture state:

| Active view | v7.3 height px | v7.4 height px | Reduction |
|---|---:|---:|---:|
| Dashboard | 1189 | 570 | 52.0% |
| Markets | 2714 | 1959 | 27.8% |
| Trading | 1294 | 1155 | 10.8% |
| Intelligence | 2368 | 2161 | 8.7% |
| Risk | 2365 | 1175 | 50.3% |
| Portfolio | 3268 | 439 | 86.6% |
| Journal | 1159 | 1116 | 3.7% |
| Brokers | 423 | 390 | 7.8% |
| Settings | 1017 | 777 | 23.7% |

Chart canvas shell grows from **814 × 510 to 868 × 610 px** (~27.5% more area).
Focus mode expands it further. Disclosures intentionally change default visible
height, not feature count; expanded analysis can remain long. The measurements
are in `v74-evidence/presentation-metrics.json`. They are not network, predictive
quality, startup latency or memory benchmarks. No speculative speed claim.

## Regression approach

All original 18 browser suites remain in the runner; `experience` is appended.
The new suite covers A–J owner scenarios through real packaged HTTP analysis,
research planning, actual UI outcome logging, persistence and immutable records.
Provider and widget protocol inputs are explicit fixtures. It never injects an
analysis or fabricated research record to make a save ready.

Older tests use `workspace_controls.control` only to click visible native summary
controls for newly disclosed workspaces before using their original controls.
No forced clicks, arbitrary waits, disabled assertions or fabricated state. Exact
financial assertions remain; unavailable hidden KPI values use `text_content`
while the new suite independently requires compact visible empty states, absence
of visible empty charts and full charts only after an eligible manual outcome.
A condition-based finite-animation readiness check precedes new accessibility
scans. The focused mobile chart has its own EN/AR and theme accessibility checks.

Initial evidence is retained outside Git under `/workspace/work/v74-evidence`:
a tools DOM reparenting error was fixed; a raw-report/Library-entry shape mismatch
in recent report presentation was fixed; old tests learned to open disclosures;
contrast and transition-timing findings were addressed. Final results are recorded
separately, never by deleting failed-run evidence or weakening required gates.

## Boundaries and limitations

Official TradingView initialization/configuration, private APIs prohibition,
detached-generation isolation, mappings, fallback and honest candle-unverified
status are preserved. No real external TradingView candles were observed in this
local milestone. Existing managed-proxy restrictions remain; owner Chrome
acceptance and fresh hosted CI are required after separate release authorization.
No model has been activated or tested; hosted generation, accounts and financial
execution remain disabled. Browser records remain unencrypted and device-local.
No destructive migration or broker verification mechanism was introduced.

See [visual evidence](V74-VISUALS.md) and `v74-evidence/validation.json` for final gates.

## UI → API → data → response evidence

| Boundary | Evidence |
|---|---|
| UI entry and context | Markets selection updates the existing THNContext; Dashboard close formatting is compared to the unchanged raw selected candle. |
| HTTP analysis | Terminal invokes the real `/api/analyze` path; readiness is required before an idea can be saved. |
| Risk server calculation | Explicit USD10,000 capital / 1% risk / directional levels and zero fixture costs yield the authoritative USD100 stop budget. |
| Response rendering | Validated plan state, selected technical evidence, chart layer states and real raw-record inspection are asserted in Chromium. |
| Research persistence | Plan/research saved through the original Library codec; current-context navigation leaves original saved bytes unchanged. |
| Outcome eligibility | A closed outcome logged through the real UI becomes visible only under the explicit manual/unverified source; verified source remains unavailable. |
| Failure handling | Missing analysis rejects saves; storage refusal, malformed imports, provider outages, delayed widget scripts and fallback remain in the established suites. |

The final complete browser pass initially reported two navigation compatibility
failures: the plan-overlay control now lives under Chart tools, and the redundant
Dashboard Markets shortcut was removed in favor of the visible original navigation.
Its Journal backup selector also moved to the primary backup tools.
Targeted reruns use these real controls; every original functional assertion remains.
The complete-run log and corrected-suite logs are retained separately. Final aggregate
results explicitly identify these reruns rather than claiming the earlier runner
exited successfully.
