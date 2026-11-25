# Phase 2 — integrated evidence interpretation review

Candidate for existing **PR #23**, branch
`feature/ai-evidence-interpreter-phase2-20261116`. No main merge, Production
release, AI-provider activation or trading activation is authorized.

The actual application now exposes its original Research Assistant directly
through the Command Center's **Evidence interpretation** action. A review shows
explicit upward/downward observations, source references, uncertainty and method
identity without adding another chart, financial engine, conversation store or
confidence metric. It leaves the adjacent hypothetical Trade Ticket and original
historical evaluator intact. Questions and independently authorized local model
settings remain with the original assistant.

The source-linked interpretation is withdrawn on instrument, timeframe, dataset,
assumption, language and evidence-age changes. Chart-bound review/question actions explicitly leave any saved assistant selection;
opening a saved report never silently supplies historical evidence to the current
chart. Cancelled/failed requests cannot
reintroduce an old interpretation through either the new panel or the existing
recommendation projection. Provider cancellation/deadline and deleted/expired
conversation boundaries are tested with offline injected providers. Structured
model facts must match the existing strict contract; prose still requires human
review. **No real model has been connected or verified.**

## Real application screenshots

All screenshots use the original offline synthetic provider and identical frozen
clock (`2026-11-11 17:10 UTC`), instrument and font configuration. They are neither
live market signals nor Production acceptance evidence. The before UI's public
source is byte-identical to the reviewed PR23 baseline `fbc8f67`. Full-page before/after screenshots include the below-chart workflow actions; the
above-fold chart-first layout is deliberately preserved. After screenshots
render this candidate's production package. Expanded evidence screenshots show
actual deterministic reviews, not invented AI output.

| Profile | Before | After, chart-first default | New integrated evidence review |
| --- | --- | --- | --- |
| Desktop EN / dark, 1440px | [Before](before-1440-en-dark.png) | [After](after-1440-en-dark.png) | [Open review](evidence-1440-en-dark.png) |
| Desktop AR / light, 1440px | [Before](before-1440-ar-light.png) | [After](after-1440-ar-light.png) | [Open review](evidence-1440-ar-light.png) |
| Mobile AR / light, 390px | [Before](before-390-ar-light.png) | [After](after-390-ar-light.png) | [Open review](evidence-390-ar-light.png) |

[Recorded measurements and screenshot SHA-256 values](measurements.json) cover
20 matched profiles at 1440/1024/768/390/320px, both languages and themes. **All20
retain exactly the same chart geometry and selected dataset.** Detailed reasoning
stays in the original progressive research area below the chart, preserving
chart visibility rather than adding another above-chart panel.

## Verification contract

The full release gate includes all43 original browser workflows plus the additive
Phase2 suite. The new suite covers 20 EN/AR/theme profiles, including 160px stress
layout, WCAG axe checks, source focus/Escape, cancellation, language/hash/instrument
response races, strict offline-mock generation, fabricated-fact rejection,
deterministic verdict/level preservation, both saved-to-current review handoffs,
retained-panel focus and immutable saved research/plans.

Heritage now checks null candidate/absent level explanation at the synchronous
instrument transition, then verifies any subsequently completed BTCUSD candidate
against its own instrument, timeframe, dataset and chart. Its positive fixture
also applies to BTCUSD: waiting an arbitrary browser round trip before asserting
withdrawal can race a legitimate new analysis. All previous assertions and
coverage remain; no sleeps, forced clicks, relaxed thresholds or timeouts were
introduced. The application synchronously withdraws the obsolete level explanation
and description links rather than waiting for its animation-frame renderer.

[Final local verification](local-verification.json) records all10 passing gates,
379 core tests,21 security tests,10 system checks and44 passing browser suites,
with runtime SHA-256 and package-manifest identity. Hosted results and Preview
identity are reported with the pushed candidate. Screenshots/local tests do not substitute for hosted CI or an
interactive Preview check. This workspace's outbound proxy currently refuses the
existing Vercel Preview CONNECT request with HTTP403 before TLS; no deployment
protection or network policy was changed.

Targeted results: [Phase2](phase2-interpretation-results.json) and
[Heritage transition](heritage-results.json). The latter records null candidate
and absent explanation at the transition, followed by a newly completed BTCUSD
BUY candidate from the controlled offline fixture. This confirms why a late
null assertion can race valid new research.

## Review and rollback

Review the exact branch commit in PR23, require source/dependency and both browser
shards plus aggregate CI to pass, and confirm the existing-project Preview's source
SHA matches before owner acceptance. Exercise EN/AR review, citation navigation,
Cancel, instrument changes, WAIT/conditional states, historical test access and the
unchanged hypothetical planner. This candidate is not authorized for main merge.

To withdraw it before release, keep main/Production unchanged and close or revise
PR23. If a later separately approved release needs rollback, create a normal revert
of the approved integration commit on canonical main, run every mandatory gate,
and follow the existing deployment review policy. Never reset shared history,
force-push, restore credentials or weaken execution guards.
