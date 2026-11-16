# Issue 19 — verified integrated workstation candidate

Branch: `feature/integrated-research-workstation-issue19-20261110`.
Canonical base / unchanged main: `fb92c9604d16d0df45d3a13096c2f84a6d66546b`.
Implementation checkpoint: `4c76f624b0c214c43807cb582acbe36da2129363`.
The delivery head adds verified evidence and review handoff; application bytes remain
identical to the fully tested production package. This is not a Production release.

## Working result

The real application now connects instrument selection, loaded-history inspection,
source-linked supporting/opposing evidence, chronological validation, hypothetical
planning, immutable saved-case comparison and numerical replay. Existing controllers,
engines, record codecs and nine routes remain authoritative. There is no second app.

- Chart: bounded history ranges/slider, UTC bar lookup, original OHLC/indicator
  inspection, confirmed-event navigation and drag/click distinction.
- AI Research: selected/all/supporting/opposing timeframe filters, source/time/hash
  citations appended once to the draft, and explicit assistant question composition.
- Historical Lab: development/holdout windows, actual curves/metrics, retained folds,
  every stress variant, original ten-check explanations, full audit disclosures and
  an explicit current-unsaved versus saved-case comparison.
- Library: recorded outcomes/snapshot readiness, original selection/compatibility
  engine, source/replay access and actual numerical reproduction without replacing
  the saved record. Legacy/imported/missing evidence stays qualified.
- Risk Desk: original validated form/cost/result owners in a coherent layout, with
  explicit context and historical-evidence navigation. No sizing formula or account
  leverage/execution policy is changed.
- Performance: selected-history browser requests 4 → 1; encoded resources
  2340621 → 1771905 bytes (24.3% lower), with identical observations. Timings are
  mixed three-sample local measurements, not a general speedup or Production SLA.

## Completed mandatory gates

| Gate | Result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS — 311 unit/integration/numerical/regression tests |
| `npm run test:system` | PASS — 10 checks |
| `npm run test:security` | PASS — 21 tests |
| `npm run test:browser` | PASS — all 33 original suites plus research_studio; 34/34 |
| `npm run package:production` | PASS — 84 runtime files; test fixtures excluded |
| `python3 scripts/ci/check-workflow.py` | PASS |
| `node scripts/ci/dependency-audit.mjs` | PASS — zero advisories |
| `bun install --frozen-lockfile --ignore-scripts` | PASS — lockfile unchanged |
| `node scripts/ci/release-guard.mjs` | PASS — canonical ancestry, source exclusions, six numerical modules unchanged |
| `git fsck --full` | PASS |

Full browser elapsed: 1538.12 seconds (25m38s). Chromium 151.0.7922.34,
Playwright 1.62.0, axe-core 4.10.3. Original suite timeouts/assertions and the CI
job cap are unchanged. Two old tests explicitly open the new native numerical
appendix before their original visibility/screenshot assertions. The helper adds
only the new native audit-disclosure IDs. No forced clicks or sleeps were added.

The new workflow suite covers 16 EN/AR/theme/1440/768/390/320 profiles, all nine
views, 28 scoped WCAG scans, keyboard/focus, precise bar data, explicit refresh,
source citations, current/saved comparison, stale input/context/cancelled responses,
unverified incomplete cases, unavailable evidence, numerical replay and original
record immutability. Existing suites retain 160px stress profiles and safeguards.
Package/source SHA parity was asserted before and after the complete browser run.

Earlier failures were investigated and fixed: original shortcut DOM ancestry was
restored; Library min-content wrapping at 160px was corrected; the tablet research
composition and default evidence selection were made compact enough to meet the
original height thresholds. The entire gate was then rerun from the beginning.
The confirmed old-market evaluator cancellation is tested as ERR_ABORTED; valid
identical retained evidence is not unnecessarily erased on returning to its context.

## Genuine rendered evidence

[Before/after gallery and raw resource measurements](evidence/issue19/README.md):
36 same-fixture real-application screenshots plus interactive evidence captures.
All 18 paired view/profile measurements preserve the same dataset hash, without
page errors or overflow. Historical Lab height falls 5490 → 2563px desktop,
6161 → 2708px tablet and 7974 → 4101px Arabic mobile. Full numerical/source audits
remain accessible. Populated mobile AI may be longer; Terminal tools take one
extra toolbar row. Default hierarchy thresholds still pass unchanged.

[Machine-readable verification](evidence/issue19/verification.json) records all
suite names and results. This evidence is local synthetic-fixture verification,
not independent visual acceptance, live-provider certification or Production QA.

## Financial and external boundaries

[29 actual disposable fault scenarios](ISSUE18-FAULT-INJECTION-EVIDENCE.md) confirm
baseline audit-write swallowing, corrupt-audit replacement and partial-store gaps.
These tests characterize unresolved behavior; green tests do not certify an atomic
ledger. No recovery semantics or financial source was changed. PR #17 remains
separate and financially gated; rejected PR #16 is excluded. Hosted execution,
live brokers and hosted inference are not activated.

GitHub API and existing Vercel hosts return workspace-proxy CONNECT 403 before an
origin application response. The owner will create the PR and independently verify
CI, Preview gitSource SHA and rendered behavior through connected tools. No network
security policy, authentication, deployment protection or project settings changed.
A Preview READY label and independent Production smoke tests are not claimed here.

## Changed-file map

| Area | Files / responsibility |
|---|---|
| Existing application owners | index.html, analysis-cockpit.js, research-library.js, workstation.js |
| Integrated read-only UI | research-studio.js, research-studio-core.js, research-studio.css |
| Mandatory gates | package.json syntax checks; existing run-browsers.py plus one suite |
| Regression/diagnostics | browser_research_studio.py, research-studio.test.mjs, paper-fault-matrix.test.mjs, disposable preload; original audit navigation adjustments |
| Repeatable evidence | capture/measure scripts and test-only snapshot fixture; excluded from production |
| Review package | updated roadmap, ownership/program and fault reports, paired screenshots, raw measurements, verification JSON and PR handoff |

The [exact changed-file list](evidence/issue19/changed-files.txt) is relative to the
canonical base. No server, numerical engine, record schema, lockfile, account/audit
payload, credentials, rejected prototype or unrelated work is included.

## Acceptance recommendation / next step

Ready for substantial functional and visual candidate review. Hold main/Production
until owner acceptance, exact-head CI and independently matched Preview are verified.
Keep financial acceptance of PR #17 and the Issue 18 audit/recovery policy separate.
Continue the actual market-data/operational roadmap after review; do not restart a
standalone visual prototype or add another numerical engine.
