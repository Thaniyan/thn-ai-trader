# Phase 1 — bilingual evidence-driven workspace

Local branch: `feature/workstation-ux`.
Preserved reconciliation baseline: `c87af55bfa5c492fe017ab72220cd4d32216f905` on
`reconciliation/unified-development-local`. The existing uncommitted isolation
reports were preserved in a separate feature-branch documentation commit before
product changes. This sprint does not investigate integrations or authorize publication.

## Audit and visible changes

| Before | After |
|---|---|
| Duplicate brand/page chrome, nine ungrouped navigation buttons, phone navigation occupies the page | One page title/description, workspace/account navigation groups, keyboard navigation and collapsible mobile menu with Escape/focus restoration |
| Dashboard risk claims Active & Enforcing while signed out | Account-required state; account values and server-submission checks kept distinct |
| Market rows omit source/availability and call futures-derived data Gold Spot | Searchable/filterable market board, provider observation time, fresh/stale/unavailable states, explicit indicative-proxy labels and model bid/ask disclosure |
| Trade/AI/risk/portfolio workflows scatter essential context | Focused order-review checklist, heuristic analysis evidence, account capacity and scoped server-ledger panels with actionable empty states |
| Initial HTML contains sample balances, spreads, latency and performance values | Unavailable placeholders; backend observations populate values; no made-up default account/latency/performance presented as evidence |
| Recent activity filters fields absent from mapped ledger DTO | Uses immutable, already account/epoch-filtered ledger records and actual decision/PnL/date fields; clears when account access is lost |
| Manual journal entries assign an 82 confidence score, grade and default risk | Missing confidence/grade/risk stay null; manual entries do not become verified server fills |
| All amounts use USD formatting | New account panels and dashboard preserve server account currency, including real zeros; missing values/currency remain unavailable |
| Partial Arabic labeling and fixed desktop layout | 133 paired EN/AR workspace keys, 236 legacy exact-copy translations, logical RTL layout, mobile containment and correctly sized checkbox controls |
| Unverified external broker choices look selectable | External choices disabled and labeled unavailable; backend adapters remain unchanged and fail closed |
| Capabilities imply historical testing or connected brokers | Explicit implemented/conditional/optional/unavailable capability disclosure; no historical performance or real-money support claimed |

The Markets Analyze action uses the existing symbol input and analysis function;
it does not submit an order. Refresh reuses the existing coalesced quote loader and
provider cooldown instead of adding a second feed. Account summaries consume the
existing owner-scoped account/ledger loaders; the server remains authoritative.
No API, schema, risk policy, dependency, live adapter or CSP changes were made.
The sign-in form uses POST as a safe fallback so a no-JavaScript submission cannot
put an access token into the URL; normal session requests still use existing JS.

## Validation and reproducibility

Implementation commit: `f34966c1e61302e7026294edeb827cdb61718ab3`.
The final local review also includes a mobile-menu resize intent fix, test-fixture
corrections and this report; the final exact commit is reported after validation. Runtime: Node24.19.0, Python3/Playwright/Chromium,
axe-core4.10.3. All provider and paper-execution evidence below uses disposable
loopback fixtures; no hosted build, real provider or real-money trading was used.

Commands (from repository root; choose new output paths):

```sh
npm run build
npm run lint
node --test --test-concurrency=1 tests/*.test.mjs
node tests/run-system.mjs
python tests/browser.test.py
python tests/release-browser.test.py
WORKSPACE_QA_OUTPUT=/tmp/thn-product-browser python tests/workspace-ux.browser.py
AXE_PATH=/workspace/.tools/reconciliation-qa/node_modules/axe-core/axe.min.js ACCESSIBILITY_OUTPUT=/tmp/thn-axe-dark.json python tests/accessibility.test.py
AXE_PATH=/workspace/.tools/reconciliation-qa/node_modules/axe-core/axe.min.js ACCESSIBILITY_THEME=light ACCESSIBILITY_OUTPUT=/tmp/thn-axe-light.json python tests/accessibility.test.py
VERCEL_QA_OUTPUT=/tmp/thn-static-browser python tests/vercel-staging.browser.py
```

- Build/lint: pass; 65 Node tests, 0 failed/skipped (62 existing + 3 new regressions).
- System: 10 pass. Existing broad browser suite retains actual-CSP chart, scanner,
  notification, privacy, sizing, quota, ledger and all-nine-view checks.
- Product browser: 137 pass; 90 view/viewport cases across two languages and widths
  320/390/768/1280/1440; 24 screenshots. Includes keyboard/focus, search/filter/empty,
  stale quote suppression, cooldown, disconnect, account isolation and ledger mapping.
- Product flow creates/closes a server-side paper position against fixture prices
  and verifies the returned ledger renders in the dashboard. Manual drafts remain
  separate. This is software integration evidence, not realistic execution evidence.
- Release-browser: 11 pass; static-staging browser: 130 pass, 42 screenshots.
- Accessibility: 18 EN/AR view scans per theme (36 total), no violations in configured
  WCAG2A/AA/2.1AA axe scope. Manual screen-reader review is still required.

Initial UI findings were fixed: brand-link contrast, 320px banner overflow and an
inline settings-grid minimum width. The existing mobile browser test now opens the
menu before clicking a hidden navigation item. Its zero-value fixture now includes
the currency present in real account DTOs. Pagination assertions remain exact; the
pagination-only mocked route pauses/resumes the ordinary account poll to avoid
racing a second loader. Responsive click checks wait for media-query state to settle;
the resize handler preserves an explicit menu-open intent instead of closing it
after a user has already opened it. An initial new close fixture correctly failed for missing
idempotency; the fixture supplies the required key, without changing server gates.
Failed and corrected logs are retained outside Git at /workspace/reports/workstation-ux.

Before screenshot: /workspace/reports/workstation-ux/before-dashboard.png.
Final screenshots and structured checks: /workspace/reports/workstation-ux/final-product-browser.
After dashboard: /workspace/reports/workstation-ux/after-dashboard-final.png.
Screenshot market prices are fixture data, not live market observations.

## Limits and recommended next sprint

- New workspace copy is fully paired EN/AR; provider identifiers/raw technical error
  details and portions of legacy broker-reference tutorials remain technical English.
  Those tutorials are not evidence of an operational broker connection.
- Account values are the latest received snapshot; health reachability is a checked
  observation, not continuous monitoring. Bid/ask and fills remain paper models.
- Provider quotas, unavailable exact Gold spot execution, real HTTPS behavior and
  realistic live-market paper fills are unchanged backend limitations. Backtesting
  and calibrated performance remain unavailable; no results were invented.
- Automated accessibility is not full WCAG certification; manual assistive-technology
  and usability review, plus more browsers/OSs, remain necessary.
- No production/hosting/WSL2 settings, credentials, remote main or live trading changed.
  Publication remains NO-GO until separately isolated and explicitly authorized.

Next sprint: market-data quality and end-to-end paper order review. Expose provider
age/cooldown diagnostics, strengthen exact-instrument/market-session evidence, add
clear server-risk-preview/confirmation/rejection UX and pending/fill reconciliation.
Then build a costed, out-of-sample historical research workflow; never infer returns
from confluence. New paid providers or deployment remain separately approved work.

Local rollback: after preserving any new work, return to the existing baseline
branch at c87af55. No reset, source installation, production rollback or remote
operation is required or performed by this sprint. The original reconciliation and
migration/rollback documents are retained.
