# M3 — strict financial preview inputs and contextual risk integrity

Owner direction resumed on 9 November 2026. This is a working change to the
existing application, not a standalone design. Dedicated branch:
`feature/m3-risk-context-integrity-20261109`. Financial review and explicit owner
approval are required before main integration. No main push or Production change.

## Synchronized engineering baseline

Canonical main was independently fetched as
`fb92c9604d16d0df45d3a13096c2f84a6d66546b`. Its linear history includes M2 PR #15
squash `689000ed98f6c3bcabdcf7466007eb778218d762` and M1 PR #14 squash
`fb92c9604d16d0df45d3a13096c2f84a6d66546b`. Public PR pages show both merged.
M0 audit/policy/evidence remains preserved on `feature/engineering-audit-20261108`
at `7f1aebdd8f462b36d9d99a13d8a34ccaf0136a38`, not merged into main. Read the
[current independent audit](https://github.com/Thaniyan/thn-ai-trader/blob/7f1aebdd8f462b36d9d99a13d8a34ccaf0136a38/docs/CURRENT-ENGINEERING-AUDIT-20261108.md)
alongside the historical [original audit](CORE-PLATFORM-AUDIT.md).

PR #16 is **closed without merge**, head
`359cb4346e2ec38819930dd001b00612ad4e0bd3`. Its standalone prototype is rejected;
no source, design, assets or history from that candidate are integrated here.
Do not confuse it with earlier accepted hierarchy work already in main.

Production health access still fails at the workspace proxy: HTTPS CONNECT 403,
`server: envoy`, before any application response. This is not evidence of an
application authorization defect. The main-to-Production alias/deployment/SHA
relationship is **unverified**, not inferred from Git or prior READY reports.
Read-only GitHub API/GraphQL access also returns Forbidden. No protection,
authentication, hosting settings or network policy was weakened.

## Measured defect and correction

The [actual before/after probe](evidence/m3-risk-context-20261109/before-after-contracts.json)
runs identical requests against packaged exact main and M3 using disposable,
offline providers, without account mutations:

| Case | Before | M3 |
| --- | --- | --- |
| Leverage -1 | 200, silently clamped; margin $11,000 | 400 `INVALID_LEVERAGE` |
| Leverage 0 | 200, silently defaulted; margin $55 | 400 `INVALID_LEVERAGE` |
| Leverage `"bad"` | 200, silently defaulted; margin $55 | 400 `INVALID_RISK_INPUT` |
| JSON null | 500 generic request failure | 400 `INVALID_RISK_INPUT` |
| Entry 1.1, currentPrice 1.11 | Validates 1.1 but calculates 1.11: stop $200, margin $555 | 400 `AMBIGUOUS_ENTRY` |
| Numeric string volume | 200 by coercion | 400 `INVALID_RISK_INPUT` |
| Wrong BUY stop direction | 400 | Same 400 geometry rejection |
| Valid EURUSD .1 lot, entry 1.1, stop 1.09, target 1.12, leverage 20 | Stop $100, target $200, margin $550, R/R 2 | Exact same result; explicitly hypothetical, no execution approval |

`server/risk-preview.js` is a request/evidence boundary, not another numerical
engine. It strictly validates object shape, JSON numeric values, explicit side,
existing supported contracts, positive bounded prices, lot limits/step and
leverage **1–2000**, the existing margin engine's clamp bounds. It rejects values
outside those bounds rather than changing/clamping them. It neither raises the
Risk Desk planner's separate 200 limit nor certifies leverage availability.

An entry-only or legacy currentPrice-only request remains supported, normalized
into one explicit entry. Providing both requires exact numeric equality. Side and
leverage must now be explicit; strings, booleans and default inference are rejected.
Both `metrics` and `riskAnalysis` response aliases remain. Added response metadata
includes exact assumptions, `hypothetical: true`, `executionApproval: false`, and
either `manual_assumptions_only` or `matched_at_calculation` evidence status.
There is no saved-record, financial-state or research-evaluation schema migration.

A request without retained context can calculate **manual hypothetical assumptions**,
but gets `context: null`; it cannot claim current verified market evidence. A
contextual request must include symbol, interval, hash, source, provider symbol
and closed-bar timestamp. The server fetches through the existing authoritative
closed-market provider boundary, compares exact provenance and existing freshness
status, and returns 409 for stale/mismatched evidence or 503 when unavailable.
There is no silent replacement/re-evaluation of saved historical research.
Matched evidence is not a live quote, authentication or a profitability claim.

The original local paper ticket now has visible bilingual entry and leverage
assumptions. Risk Desk handoff carries its validated entry/leverage instead of
leaving entry absent. The ticket sends the selected research context, blocks
cross-instrument drafts, clears estimates on input/context/series/language changes,
and ignores asynchronous results for superseded drafts. It shows source and UTC
bar time beside the assumptions. Errors render as text in EN/AR, without HTML.
Local submission also stops inventing entry/target/volume fallback values; the
existing paper order engine still obtains its own provider price and validates
orders authoritatively. Preview estimates never authorize execution or change
account leverage. Hosted ticket/account/execution restrictions stay intact.

Actual rendered comparisons (offline fixture, not Production acceptance):

| Profile | Exact main before | Working M3 estimate after |
| --- | --- | --- |
| 1440px English dark | [Missing entry / unavailable estimate](evidence/m3-risk-context-20261109/before-1440-en-dark.png) | [Explicit entry / exact $100 risk and $550 margin](evidence/m3-risk-context-20261109/m3-risk-success-1440-en-dark.png) |
| 390px Arabic light | [Original ticket](evidence/m3-risk-context-20261109/before-390-ar-light.png) | [Localized assumptions and estimate](evidence/m3-risk-context-20261109/m3-risk-success-390-ar-light.png) |

A tested light-theme paper badge had contrast 1.56:1. A scoped existing-theme
rule now uses the established accessible amber palette. No standalone page,
rebranding, unrelated chart redesign or new infrastructure was introduced.

## Verification and preserved boundaries

New `tests/risk-preview.test.mjs` supplies eleven tests with matrix subcases:
invalid/missing/null/nonnumeric/boolean/nonfinite inputs, geometry, volume, leverage,
entry ambiguity, BUY/SELL, exact USD-quoted/USD-base/metals/crypto/index arithmetic,
input immutability, provider identities, stale/future/missing/changed evidence,
packaged HTTP behavior, safe bilingual errors, hosted and origin denial.

The full original Paper Review suite is retained and expanded: Risk Desk handoff,
failed/malformed/negative/string response fields, actual successful HTTP estimates,
12 profiles (1440/768/390 × EN/AR × dark/light), exact localized amounts, bilingual
invalid leverage, missing entry, zero volume, wrong stop, keyboard tab order,
late-response invalidation, cross-market blocking, local-record preservation,
WCAG2 A/AA and WCAG2.1 AA axe scans, no overflow, zero submitted orders, and the
original cost-inclusive/over-budget review gate. Screenshots and profiles live in
[evidence](evidence/m3-risk-context-20261109/m3-profiles.json).

Existing tests were not weakened. The integration geometry fixture now includes
explicit BUY/leverage so its original geometry assertion remains meaningful.
System and legacy-system valid preview fixtures add explicit BUY; **all original
assertions remain**, and system remains ten tests. The new context-change browser
case intentionally clears the planner, so the final original over-budget case
restores its original valid price inputs before submitting. Arabic checks use
actual Arabic currency digits, not English formatting. No timeout, assertion,
suite selection, force click, arbitrary sleep or broad first-selector was relaxed.
The initial diagnostic failures are retained in local logs, not hidden as passes.
The longer matrix also exposed the original generic fixture regenerating every
bar timestamp after the real 30-second provider cache expiry. The new context
check correctly rejected that changed hash. The paper suite now uses an additive
`risk-provider-fixture.js` wrapper retaining identical provider responses, without
freezing the application clock or changing cache behavior. Independent stale,
changed, future and unavailable evidence assertions remain in the API tests;
no mismatch tolerance was introduced. The immutability check uses a nonempty
actual saved report and the current v65 Library key.

The six guarded numerical modules and `riskEngine.js`, `accountStore.js`,
`paper-intents.js`, dependency declarations and `bun.lock` remain byte-identical
to main. The existing build/lint/check scripts add syntax checking of the new
contract module; lint remains a syntax check, not a semantic static analyzer.
Packaging automatically includes the new server module; fixtures/tests/state and
credentials remain excluded. Source guard remains canonical and fail-closed.

Reproduce from the candidate root with Node 24.19.0, Bun 1.4.3,
Playwright 1.62.0 / Chrome for Testing **151.0.7922.34**, Chromium revision **1234**,
and axe-core 4.10.3:

```sh
npm run build
npm run lint
npm run package:production
npm test
npm run test:security
npm run test:system
python3 scripts/ci/check-workflow.py
bun install --frozen-lockfile --ignore-scripts
node scripts/ci/dependency-audit.mjs
node scripts/ci/release-guard.mjs
git fsck --no-dangling
# Use the existing pinned tooling paths; do not download/change dependencies.
CHROMIUM_PATH=/home/agent/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
AXE_PATH=/workspace/thn-tools/node_modules/axe-core/axe.min.js \
BROWSER_LOG_ROOT=/tmp/thn-m3-20261109/browser-full \
PAPER_REVIEW_OUTPUT=/tmp/thn-m3-20261109/browser-full/paper \
PATH=/workspace/thn-qa-venv/bin:$PATH npm run test:browser
```

Final local result: **287 core, 21 security, 10 system and all 33 browser
suites passed**, zero failures/skips. The full gate includes the final nonempty
Library immutability case and stable-snapshot fixture, plus all original suites.
The professional suite recorded 288 layouts and 72 accessibility scans with zero
failures; the expanded ticket matrix adds 12 successful localization/theme/width
profiles and zero axe violations. Build, syntax lint, packaging, workflow, frozen
dependencies, zero-advisory audit, canonical source/numerical guard, Git fsck,
report links and exact 82-file runtime-manifest parity passed. Both system
harnesses retain all 49 original assertion lines. These counts overlap and must
not be added as independent security assurances.

[Portable verification](evidence/m3-risk-context-20261109/verification.json) and
[all 33 suite results](evidence/m3-risk-context-20261109/browser-gate.txt) accompany
this report. Hosted CI is triggered by branch publication and must be checked
separately; no unobserved hosted result is claimed here. Local fixture results do not establish live market quality, real-model
quality, broker contract eligibility, assistive-technology certification or
Production acceptance.

## Risk, release acceptance and remaining roadmap

**Review classification: financially significant.** Formulas are unchanged, but
invalid requests that previously defaulted/coerced now fail, missing BUY/leverage
is no longer accepted, context validation can require provider access, and local
draft submission requires explicit assumptions. Review those contract changes and
actual Preview behavior before approval. Do not merge this candidate automatically.
No live trading, hosted finance, inference, paid activation or account migration.
Rollback source: `fb92c9604d16d0df45d3a13096c2f84a6d66546b`; an actual platform
rollback deployment ID must be independently mapped before any release.

Prioritized remaining work:

1. **M3 follow-up:** review paper-intent crash boundaries (account/intent/audit are
   not one transaction), disk errors and intended new-key-after-completion policy.
   Existing recovery safeguards remain; no distributed exactly-once claim.
2. **M4 quantitative research experience:** improve retained report interpretation,
   development/holdout comparison, missing assumptions and replay discovery in the
   existing Historical Lab/Library. Inventory existing controls/tests first, then
   implement evidence-linked interactions on a separate branch. Do not resurrect
   PR #16 or alter numerical formulas.
3. **M2/M5:** actual provider freshness/coverage observations and measured asset
   caching/performance improvements with API privacy retained; no cosmetic rebuild.
4. **Security/M7:** staged CSP, durable authentication/tenant isolation, audit
   retention and persistence require separate architectural/security approval.
5. **M6/M8/M9:** real local-model evaluation, opt-in monitoring and official
   read-only broker feasibility remain gated; no configured model/broker claim.

M0 audit findings F01/F02/F04/F06 remain scoped to previously verified fixes;
F08 is now integrated through M2; F07 preview input/entry defect is addressed by
this candidate, not claimed fixed in Production. Other open/partial F03/F05/
F09–F16 findings remain as documented in the independent audit. Current Production
identity and functional verification are still an access dependency, not a passed
release gate.
