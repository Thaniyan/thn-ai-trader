# Milestone 1 — reference-led intelligent trading desk

Same repository, branch and [PR #10](https://github.com/Thaniyan/thn-ai-trader/pull/10).
Parent candidate: `a7c60a1c1d223933ce2b793bb33614d00b3b43c0`.
**Not visually accepted. Keep PR #10 unmerged and Production unchanged.**

The owner's Production screenshot shows the deployed v7.5 interface, not the
unmerged candidate. The design rejection still applies: this iteration restores
the earlier THN-style branded market-entry composition from the supplied PDF,
while retaining the current engines and protections. No old backend, account
records, credentials, execution scores or “AI active” claims were restored.

## Working product changes

- Branded THN AI Trader entry desk with one original instrument/timeframe input,
  an explicit market-review action and a visible actual model-availability state.
- Mobile branding precedes a wrapped nine-section navigation grid; labels no longer
  disappear into an offscreen strip. Desktop sidebar and EN/AR/RTL remain.
- One action calls the existing analysis API, then the existing evidence-grounded
  committee/optional provider path. The result receives keyboard focus.
- Dashboard and Terminal share one chart **and** one review panel: selected-frame
  view, cited explanation/counter-evidence, honest wait outcome, scenario/risk route.
  The contextual assistant is accessible from every section.
- Scenario preparation delegates to the existing scenario controls and HTTP risk
  planner. Entry, stop and targets appear from a validated plan, not model arithmetic.
  The original chart renders those hypothetical levels.
- The local paper handoff only pre-fills the existing review ticket. It requires
  local opt-in, a fresh matched conditional review, complete/non-conflicting frames,
  a native provider mapping, a matching plan, budget/margin compliance and a supported
  ticket contract/volume. It submits no order and grants no model financial authority.
  Original authentication, server risk checks and idempotency remain authoritative.
- Failed analysis cannot recycle a previous successful object as a new success.
  Context/evidence changes cancel pending reviews; unmatched or unverified responses
  and old-language answers do not become the selected market's current explanation.
  Status messages translate; a new-language review requires an explicit request.
- The optional provider's summary validation now also rejects unsafe prose, secret
  patterns and conflicting instruments alongside its existing numbers/citation checks.
  Eight mock rejection cases cover this gap. Local structured-output validation,
  endpoint allowlists, authentication, request ceilings and hosted-disable gates remain.

## What is and is not actual AI

| Capability | Evidence/status |
|---|---|
| Deterministic analysis, committee, indicators and risk planning | Working actual local HTTP workflows; not an LLM |
| Optional generative interpretation/conversation | Existing authenticated adapter reused; actual model not run |
| Local model availability | No Ollama binary found; standard loopback runtime endpoint refused connection |
| Model installation/download | None; no weights downloaded or runtime started |
| Hosted inference, financial/account mutations, live orders | Disabled; not activated by this work |
| Local paper engine | Preserved and system-tested; new review handoff never auto-submits |

A model and suitable verified evidence are still required before genuine generative
quality can be evaluated. Current actual Yahoo history is retained/stale, with gaps;
it correctly produces an insufficient-evidence / wait outcome. Protocol mocks do
not establish real-model reasoning quality. A connected model will not supply prices,
probabilities, account balances or order-execution authority.

## Evidence and validation

All captures are **local**, not live Production. Before captures render the parent
candidate's public frontend against the same offline fixtures. The supplied PDF stays
private outside Git because it contains personal browser chrome. Separately labeled
real-provider captures use actual retained Yahoo observations, with their hash and
quality status recorded. No fictional broker connection or profit is displayed.

The new connected-desk suite exercises real local analysis/committee/planning APIs,
six-role citations, chart-layer behavior, plan overlays, cancellation, failed-analysis
rejection, all-nine-view mobile navigation, language handling and blocked financial
requests. It injects no analysis records or fake successful AI answer.

Final screenshots, manifests and validation are recorded in `recovery-m1-intelligent-desk/`.
Fresh CI results must be assessed on the final SHA in PR #10. Existing numerical
engines, server financial gates, official TradingView lifecycle and storage contracts
remain preserved. No history rewrite, main change, hosting-setting change, paid
service, broker activation or Production deployment is part of this milestone.

## Final local validation

170 unit/integration tests, 21 security tests and 10 system checks passed. The full
22-suite local browser run passed before final targeted corrections. All four affected
suites then passed on the final source, including the new positive local-paper handoff,
202 layout cases, 288 geometry checks and 72 accessibility scans. Fresh hosted CI must
run all 23 suites on the committed candidate. Dependency audit found zero vulnerabilities.
Build/lint, workflow guard, canonical source guard and reproducible packaging passed.

“See analysis” resets to the latest matched chart viewport and enables EMA/support
resistance; it preserves the explicit structure-overlay choice to avoid automatic clutter.
The original paper ticket subtab becomes visible on handoff; zero orders are submitted.
Optional provider summaries retain the existing 4,000-character limit.

[Matched before/after comparison](recovery-m1-intelligent-desk/comparison.html) ·
[Native image manifest](recovery-m1-intelligent-desk/index.json) ·
[Exact validation scope](recovery-m1-intelligent-desk/validation.json).
