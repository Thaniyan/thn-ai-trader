# THN AI Trader — M4 Visual Redesign Contract
Version: 2026-11-08 | Target: existing `Thaniyan/thn-ai-trader` PR #16

## 0. Product intent and observable success

**Problem**: Previous releases improved code and truthfulness without a sufficiently noticeable improvement in the product. The next accepted release must produce a substantial, screenshot-verifiable change in hierarchy and usability—not only gradients, border radii, shadows, fonts, or color changes.

**Core product**: bilingual English/Arabic **market research workstation**. It is not an authenticated, durable, live brokerage or hosted AI execution platform. Chart data are attributed observations; a model-generated answer must never be claimed unless the provider actually responded successfully. Confluence scores are not risk-calibrated probabilities.

**North-star desktop user journey** (same instrument across pages):
Choose a market → inspect an attributed chart and timeframe → compare confirmed observations → review conditional thesis, invalidation and scenario → validate hypothetical risk → save a provenance-rich research record.

## 1. Sites — design exploration contract

Produce **one coherent design system**, not a disconnected marketing site. Prototype at least these three real application states:
1. **Dashboard / Market Command Center** — a compact, legible instrument search and freshness/source strip; a dominant chart or clearly signposted path to it; a glanceable fact panel and next research action; never fake live quotes.
2. **Trading Terminal / Research Workstation** — primary chart occupies most central width, with timeframe and overlays; supporting evidence and conditional recommendation on a readable side rail; risk handoff; information hierarchy is source → observation → hypothesis → risk.
3. **Risk Desk / Scenario Lab** — clear input form, validation, result explanations and provenance; explicit unavailable/blocked conditions; no trade execution call-to-action.

Visual vocabulary: restrained deep ink/navy surfaces, teal for selected research actions and selection, amber for caution, red only for real blockers; professional numerical alignment; precise typography; readable dimensions and meaningful whitespace.

Required distinct states: loading, stale/close-only quote, no data, market unavailable, research-only mode, risk invalid, hypothetical scenario, and local paper not available. Labels must say what the system actually knows.

**Sites is a visual exploration workspace**; keep its prototype separate. Do not connect it to live trading, fabricate API results, create a new production site or treat the prototype as the source of truth. The actual code source is the GitHub repository.

## 2. Layout acceptance — measurable

### Desktop 1440/1920
- Dominant chart visually prioritized over decorative summary cards; one central primary reading path.
- Clear instrument, last observation, provenance and freshness labels in the same scan region; do not equate last close with executable quote.
- Right research rail may scroll independently only if chart, focus and full keyboard navigation remain usable.
- A user must identify current instrument, active view, data limitations and next action within the first viewport.

### Tablet 768
- No clipped chart overlays/toolbar; relevant evidence remains near the chart or in clearly labeled flow.
- Navigation discoverable and stable; no invisible controls.

### Mobile 390/320
- Responsive single-column sequence; primary task first, no microscopic chart, scroll trap or horizontally overflowing document.
- Independent chart panning, when present, must not break page scroll.
- At least 44×44 effective touch targets for key navigation and form actions where practicable; no hidden submit/continue buttons.

### Locales and themes
- EN / AR RTL plus dark / light, desktop/tablet/mobile; verify real instrument symbol numbers and mixed LTR ticker content within RTL documents.
- Keyboard access, visible focus and escape/return-focus behavior in market dialog.
- Respect prefers-reduced-motion and WCAG 2.1 AA target; compare actual contrast and axe output.

## 3. Implementation sequence for Codex

**Read first**: AGENTS.md, docs/PRODUCT-ROADMAP.md, docs/UNIFIED-DECISION-WORKSTATION.md, and `docs/M1-TICKET-RISK-TRUTHFULNESS.md`. Recheck `main`, PR #16, latest CI, exact-head Vercel Preview, and all 9 views before editing.

1. Capture before evidence from production/known base commit `fb92c9604d16d0df45d3a13096c2f84a6d66546b` using offline fixtures and record actual browser dimensions.
2. Audit duplicate legacy/new dashboard and terminal surfaces; provide a view ownership map. Preserve components and selectors expected by existing browser workflows.
3. Create a unified token/spacing/typography/layout strategy. Prefer refactoring existing classes rather than another global CSS override file. Keep design changes scoped and reversible.
4. Implement chart-first terminal and dashboard as **substantial composition changes**; remove visible duplication where safe, not features. Keep real functionality/IDs/events intact.
5. Implement evidence/risk info hierarchy and mobile/RTL usability; deliver visible changes in AI Intelligence and research records after core journey works.
6. Capture after evidence with same data/viewport/theme/locale/route and state. Include difference summary, screenshots and browser-measured overflow, chart bounds and interaction tests.
7. Run all release gates before requesting owner visual acceptance.

### Explicit non-goals / release safety
- No changes to numerical engines, trading calculations, leverage validation, inference availability logic, market provenance, broker permissions, production configuration, paid resources, or live/paper execution policy in this visual milestone.
- Do not manufacture chart data, balances, unrealized P&L, win rates, confidence probability, provider uptime or market-open claims.
- No new repository, Vercel project, account, credential, or unrelated branch history.
- No `main` merge until exact-head CI and true visual sign-off. No forced pushes.
- Preserve release rollback point and report production identity separately from CI/Preview.

## 4. Acceptance evidence matrix

Generate screenshot pairs for each:
- Dashboard: desktop 1440 EN dark; 390 AR light; 768 EN dark.
- Terminal: desktop 1440 EN dark; 390 AR light; 768 EN dark.
- Risk Desk: desktop 1440 EN dark; 390 AR light.
- Intelligence and Journal: 1440 EN dark; 390 AR light.
- State matrix: no data, stale close-only, unavailable AI, invalid risk, valid hypothetical risk.

Each pair must use the **same deterministic fixtures**, view, selected instrument, state, viewport, locale and theme. Store reference provenance and screenshot manifest. Do not misrepresent older fixture captures as current screenshots.

Required test commands from AGENTS.md:
`npm run build`, `npm run lint`, `npm test`, `npm run test:system`, `npm run test:security`, `npm run test:browser`, `npm run package:production`, `python3 scripts/ci/check-workflow.py`, `node scripts/ci/dependency-audit.mjs`.

Test all 9 views, navigation, market selection, timeframe and chart gestures, research/risk flow, saved records, reduced motion, axe violations, no horizontal overflow, language/theme persistence, and no console errors. No test weakening or selective omissions.

## 5. Release decision rule

A candidate is **READY FOR OWNER VISUAL REVIEW** only after:
- Exact SHA and branch ancestry verified, Preview deployment SHA matches.
- Source/tests, Dependency audit, and Browser/accessibility all passed on latest head.
- Real side-by-side visual evidence and interactions reviewed.
- No regression to main M1 and M2 fixes; no false financial claims.
- Explicit list of changes that a user will notice at first glance.
- Clear limits and actual browser coverage disclosed.

A candidate is **READY FOR MERGE** only after owner accepts the visual review and release gates pass. This contract **does not itself authorize deployment or production merge**.

## 6. Deliverables

1. Working PR #16 on its existing branch, not a new site.
2. Usable Preview URL and exact commit SHA.
3. Before/after image matrix and browser gate artifact.
4. Semantic component ownership and changed files.
5. Truthfulness, financial safety and accessibility review.
6. Remaining shortcomings and next milestones.
