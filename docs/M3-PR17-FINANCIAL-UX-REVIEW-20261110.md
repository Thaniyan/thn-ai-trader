# M3 / PR #17 — preview assumptions and paper execution

Responds to the latest **M3 focused financial UX / contract review** on
[PR #17](https://github.com/Thaniyan/thn-ai-trader/pull/17), 10 November 2026.
Previous PR head: `b6e76ec6cc3bd9b9757071c1575be6b8380d0750`.
Same branch: `feature/m3-risk-context-integrity-20261109`.
Main/rollback source remains `fb92c9604d16d0df45d3a13096c2f84a6d66546b`.
No main merge or Production deployment is authorized or performed.

## Review finding and actual correction

The previous ticket accepted hypothetical leverage up to 2000, but account paper
execution uses its own leverage, and the fill derives from provider observations
with the existing paper spread model. Preview entry is an assumption, not an
execution price. The numerical behavior was already separate; UI wording and the
immediate submit path did not sufficiently expose that separation.

- `public/app.js` / `index.html` now label leverage **for hypothetical preview
  only**, show its exact value alongside **paper-account leverage (last server
  report)**, and explain mismatches in EN/AR. Account information comes from the
  selected server-reported paper account with current session availability. The
  local fallback's leverage is never presented as available account evidence.
- The preview result labels margin at the supplied preview leverage. Visible
  disclosure states that preview inputs do not change account leverage, provider
  execution price may differ from hypothetical entry, margin/exposure may differ,
  preview success does not authorize execution, and stops do not guarantee fills.
  There is no live bid/ask or brokerage fill claim: this is isolated local paper.
- Direct paper submission first opens the **existing** native confirmation dialog.
  It shows requested instrument, direction, volume, hypothetical entry, stop and
  target, both leverage assumptions and an explicit confirmation at provider price.
  It no longer calls hypothetical entry an estimated/limit fill price or presents
  unsupported “Max Capital Risk” / “Projected Payout” claims. Cancel/Escape sends
  no order and returns focus. A changed direct draft, language, market context or
  account availability closes its obsolete confirmation; its signature is checked
  again before dispatch.
- Blank/nonfinite DOM numeric inputs serialize as explicit missing values (`null`),
  rather than zero or a default. Existing strict server rejection remains, with
  clearer bilingual blank/positive-price wording. Empty entry, leverage or target
  cannot open direct confirmation or dispatch a paper order.
- Account/source/health changes clear old estimates and invalidate pending preview
  responses. Failed account refresh displays unavailable account leverage, not a
  cached/default account assumption. Current estimates remain hypothetical; no
  account leverage is edited or silently applied to the preview.
- Visual inspection found an inherited missing modal title translation and a dark
  dialog background under light-theme foreground colors. The dialog now uses the
  active palette and explicit EN/AR title, with readable wrapping and accessible
  title/description references. This is a scoped correction to the real ticket,
  not a new page or rejected M4 design.

## Financial boundaries unchanged

The complete `executeBrokerOrder()` request/retry function is byte-identical to
previous PR head. Requests still explicitly send only account, instrument, side,
volume, stop, target and the stable idempotency key. Hypothetical entry/leverage
and the UI review signature are **not sent as execution overrides**.

All guarded numerical modules, `riskEngine.js`, `brokerAdapters.js`, account and
paper-intent persistence, `plan-budget.js`, `server.js` and `bun.lock` match the
previous head byte-for-byte. Only the validation message text in `risk-preview.js`
changes. The 1–2000 preview contract and separate Risk Desk limit of 200 remain;
there is no new leverage entitlement, formula, account mutation API, financial
schema migration, paid service, hosted inference or execution permission.
Backend order validation and provider price selection remain authoritative. The
additional confirmation is a user request, never a financial execution approval.

## Targeted observable evidence

`tests/risk-paper-boundary.test.mjs` adds four regression tests:

1. At entry 1.1 / .1 EURUSD lot, preview margin is $55 at leverage 200 and $5.50
   at 2000; both previews leave the account completely unchanged. A local paper
   request cannot override account leverage/provider price even if extra client
   price/leverage fields are supplied. Actual required margin equals the original
   engine using the account's 200 leverage and actual simulated execution price.
2. Missing, blank and null entry/leverage/target/volume return bilingual 400s with
   no account mutation.
3. A successful hosted preview cannot unlock hosted paper orders (503 remains).
4. A preview whose stop is valid against hypothetical entry 1.1 is rejected by
   the unchanged paper engine when that stop is invalid against its actual
   provider-derived price. The account remains unchanged; preview success is not
   execution approval even in the local opt-in engine.

`tests/browser_risk_paper_boundary.py` adds a mandatory browser suite to the full
runner. Original 33 suites, assertions and timeouts remain. It verifies EN dark
1440px and AR light 390px: matching and mismatched 200/2000 leverage, exact account
leverage text, no orders from previews, blank inputs, delayed responses after
language/context/account changes, failed provider evidence, actual stale-provider
rejection, unavailable account reporting, cancellation/focus, obsolete-confirmation
cancellation, no overflow, translated modal titles, axe and measured text contrast.
Only explicit confirmation submits one **disposable synthetic local paper order**
per language. Order payloads contain no entry/price/leverage overrides; actual
account leverage remains 200, while simulated fill **1.08595 differs from 1.1**.
These are synthetic test values, not live-market or Production observations.

[Portable profiles](evidence/m3-pr17-review-20261110/risk-paper-boundary.json),
[EN confirmation](evidence/m3-pr17-review-20261110/paper-boundary-1440-en.png),
and [AR/light confirmation](evidence/m3-pr17-review-20261110/paper-boundary-390-ar.png).

The first preliminary full browser run was deliberately interrupted after visual
inspection identified the title/theme defect. It is not counted as a passing
release run. The original axe-only dialog check missed that visual defect; a
numerical WCAG text-contrast assertion was added without removing axe assertions.
The corrected targeted suite passes. The full release gate is rerun against the
corrected package with unchanged 240s/360s suite deadlines, no skipped assertions,
forced clicks or arbitrary sleeps. Raw diagnostic/final logs remain under
`/tmp/thn-m3-review-20261110`; final gate evidence accompanies this report.

## Final local release gates

- **291 core unit/integration/numerical tests, 21 security tests and 10 system
  checks passed**, zero failures/skips. The core total includes all four new
  API/financial-boundary regressions; security/core counts overlap.
- **All 34 browser suites passed** on the corrected package, including every
  original suite and the new mandatory EN/AR boundary suite. Professional
  acceptance records 288 layouts and 72 accessibility scans with zero failures.
  Targeted modal axe checks report zero violations; measured title/description
  contrast is 15.92/8.17 in EN dark and 14.47/6.44 in AR light. These are scoped
  automated results, not accessibility certification.
- Build, syntax lint, production packaging, workflow checks, frozen dependency
  install without scripts, zero-advisory audit, canonical source/numerical guard,
  Git fsck, report links and exact 82-file source/package parity passed. No
  dependency/lockfile or original test timeout/assertion was weakened.
- Pinned tools: Node 24.19.0, Bun 1.4.3, Playwright 1.62.0, Chrome for Testing
  151.0.7922.34 / revision 1234, axe-core 4.10.3.

[Portable final checks and preserved-source hashes](evidence/m3-pr17-review-20261110/verification.json)
and [all 34 browser results](evidence/m3-pr17-review-20261110/browser-gate.txt).
Commands: `npm run build`, `npm run lint`, `npm run package:production`, `npm test`,
`npm run test:security`, `npm run test:system`,
`python3 scripts/ci/check-workflow.py`, `bun install --frozen-lockfile --ignore-scripts`,
`node scripts/ci/dependency-audit.mjs`, `node scripts/ci/release-guard.mjs`,
`git fsck --no-dangling`, and `npm run test:browser` with the existing pinned
`CHROMIUM_PATH`, `AXE_PATH` and Python environment. No real broker/model was used.
Final raw logs are under `/tmp/thn-m3-review-20261110` (`core-release.log`,
`security-final.log`, `system-final.log`, `browser-final.log` and its per-suite
`browser-final/` directory). Hosted CI is observed separately after publication;
local success is not a claim about an unobserved remote job.

## Release decision and limitations

Financial review remains required before merge. Local/hosted fixtures do not
certify real broker contracts, liquidity, live model quality or Production behavior.
Paper persistence remains single-operator/process local, not a distributed atomic
account/intent/audit transaction. No automatic recovery policy is added here.

The prior reviewer independently reported green push/PR CI and READY Preview
`thn-ai-trader-pxmnv3fsa-s139354s-projects.vercel.app` at **previous** head `b6e76ec`.
Those results are historical, not acceptance of these corrections. Updated exact
commit, current hosted CI and new Preview identity must be checked after push.
Workspace proxy/API restrictions must be disclosed if they still prevent direct
Preview/Production requests or platform SHA verification. Do not broaden access,
weaken deployment protection, merge main or deploy Production to bypass a blocker.
