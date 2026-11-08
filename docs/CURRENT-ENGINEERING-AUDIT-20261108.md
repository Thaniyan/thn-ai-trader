# Current engineering audit — 8 November 2026

M0 baseline and M1 acceptance review; independent M2 implementation. Canonical
repository: `Thaniyan/thn-ai-trader`. This record supersedes **current-status**
interpretations of the October audit, while preserving that historical evidence.
[Latest owner directive](MASTER-ENGINEERING-DIRECTIVE-20261108.md) governs release.

## Baselines and release envelope

| Item | Current observation | Evidence classification |
| --- | --- | --- |
| Canonical main / rollback source | `a752fa4f533b0376c8d60eab1a450c5fbf9932f9`; read independently through Git remote refs | SOURCE VERIFIED |
| Recovered M1 / PR #14 checkpoint | `28f5d1a69540c7233c17a23702741b398eebe879`; 47-file diff reviewed/classified; original checkout preserved | SOURCE VERIFIED |
| Current M1 correction | Existing `feature/unified-decision-workstation-20261107`, correction `527c0c985e54eaa6519ab352b8dd7e645f289fe7`; exact check status in evidence/release report | TEST VERIFIED; actual Preview/owner acceptance still pending |
| M2 branch | `fix/api-route-contracts-20261108`, `3ed704557ce10b4c188a4fc29f3ea9ab237c0a93`, starts directly from main, excludes all unaccepted M1 UI changes | SOURCE VERIFIED |
| M0 audit branch | `feature/engineering-audit-20261108`, starts directly from main; docs/policy only | SOURCE VERIFIED |
| PR #14 | Open; current head/review gates rechecked through public GitHub PR/check pages | SOURCE VERIFIED; not owner acceptance |
| Production identity | Owner directive reports READY for main above; no current platform deployment ID/SHA/domain mapping independently retrieved | PARTIALLY VERIFIED / BLOCKED |
| Existing M1 Preview checkpoint | Vercel bot in PR #14 reports Ready, unique URL `https://thn-ai-trader-6st3pvf41-s139354s-projects.vercel.app/`, checkpoint `28f5d1a`; dashboard link ends `AM7UWapVFyKRYd8faG4wPvLU6UDc` | PARTIALLY VERIFIED metadata; not current-correction Preview |
| Actual Preview/Production health and rendering | Both HTTPS CONNECT attempts rejected by Cloud proxy with HTTP 403, before an application response | BLOCKED |
| Main protection/rulesets/required-check enforcement | GitHub API access returns Forbidden; owner reported unprotected at prior inspection, not independently revalidated here | BLOCKED; do not claim protected/unprotected as a current verified fact |
| CI contract | Three jobs: **Source and tests**, **Browser and accessibility**, **Dependency audit**; pinned actions, read-only permissions, no deployment job | SOURCE VERIFIED; enforcement is separate |
| Hosting settings | `vercel.json`: main enabled, develop and old release branch disabled. Actual Project Production Branch, protections and aliases require platform access | SOURCE VERIFIED configuration / BLOCKED platform policy |
| Accounts/model capability | Hosted finance and inference are denied by current source and isolated HTTP checks; no real model or broker was activated | SOURCE VERIFIED, TEST VERIFIED, LOCAL RUNTIME VERIFIED; not Production verification |

Twenty remote heads were inventoried without fetching unrelated branches. Remote
`develop` is `5382a015f6b8524a59c2e0de9a6951ddf51e274d`; its commit is not
locally available, so ancestry is unverified and it was not used as a baseline.
The public open-PR listing currently shows #14; this is an observed page, not an
exhaustive paginated API claim. The existing release guard rejects post-anchor
merge commits, so an eventual PR integration must use a permitted linear method
(e.g. an authorized squash merge), not relax the guard or rewrite existing history.

No direct main push, force update, unrelated-history merge, new project, paid API,
credential activation or deployment-protection change was performed. Public GitHub
pages and Git refs work; `api.github.com` and Vercel hosts remain inaccessible in
this workspace. PR creation/administration cannot be assumed available from Git
push capability. Exact remote refs and gate results accompany each branch report.

Evidence terms: **SOURCE VERIFIED** = inspected implementation/refs;
**TEST VERIFIED** = actually executed tests or observed exact-head CI results;
**LOCAL RUNTIME VERIFIED** = isolated local HTTP/browser observation;
**PRODUCTION VERIFIED** = actual supported request to Production (none this cycle);
**PARTIALLY VERIFIED** = some boundaries remain unchecked; **UNAVAILABLE** = no
usable observation; **BLOCKED** = access prevents checking; **NOT IMPLEMENTED** =
source does not implement the capability. Fixtures never establish live feed,
model quality, broker execution or Production correctness.

## Capability inventory — all nine sections

Paths refer to main unless explicitly marked M1. All rows' functional Production
status is **BLOCKED**. The original APIs, storage owners and numerical engines are
preserved; absence of a hosted capability is not fabricated as working.

| Section / owner files | Entry/API/data dependencies | Implemented behavior and local/hosted distinction | Persistence, safety and failure modes | Existing/current verification; remaining gap and milestone |
| --- | --- | --- | --- | --- |
| Dashboard — `professional-workspace.js`, `platform-evolution.js`, `analysis-cockpit.js`; M1 `unified-workspace.js` | `#dashboard`; shared context, `/api/health`, series/brief/MTF/analyze | One chart, observed close/provenance, confidence/grade/schools/evidence/test access. M1 adds picker and explicit conditional recommendation, context-safe automatic technical requests | Context/hash binding clears mismatches; no executable quote/probability; availability labels remain explicit. Drawings/watchlists browser-local | SOURCE/TEST/LOCAL RUNTIME VERIFIED. Dashboard/confidence/hierarchy/unified suites; real feeds and physical-device review remain unavailable. M1 acceptance |
| Markets — `market-terminal.js`, `professional-markets.js`, `research-state.js` | `#markets`; catalog, series/MTF, quotes | Search/categories/favorites, bounded observations and shared-chart navigation; catalog is candidate coverage, not exchange entitlement | Provider aliases/currency/proxy disclosure; coalesced bounded observation requests; outage/stale/partial states. Favorites local; no synthetic prices | SOURCE/TEST/LOCAL RUNTIME VERIFIED via terminal/outage/context suites. No all-symbol live coverage or holiday calendar guarantee. M2 data contracts |
| Trading Terminal — `professional-chart.js`, `research-chart.js`, `professional-workspace.js`, legacy `app.js` | `#trading`; internal candles and optional official TradingView widget; original ticket | Real canvas controls/overlays/keyboard/drawings; shared chart identity. Hosted ticket inputs/execution disabled; local opt-in simulation distinct | Drawings per browser/context; external chart may use another dataset. Legacy risk response falsely affirmed failed checks: corrected on M1 only. Missing entry/legacy validation remains | SOURCE/TEST/LOCAL RUNTIME VERIFIED. 288 layouts/72 scans at M1 checkpoint; full paper-review failure tests after correction. External widget candles, touch hardware and legacy contract still incomplete. M1/M3 |
| AI Intelligence — `intelligence-workspace.js`, memory/generation, `server/intelligence*.js` | `#ai`; intelligence/provider/check/saved/reflect, causal frozen refs | Deterministic six-role conversation and opposing evidence; bounded authenticated optional local inference, never enabled hosted | Local browser conversation/library; imports unverified; freshness/language/hash/citation checks; cancellation and output validation; no model arithmetic authority | SOURCE/TEST/LOCAL RUNTIME VERIFIED. Core/pilot/intelligence/memory suites; no real installed-model run or EN/AR model-quality evidence. M6 separate integration plan |
| Risk Desk — `decision-workspace.js`, `workflow-polish.js`, `server/decision.js`, `plan-budget.js`, risk engine | `#risk`; `/api/research/plan`; independent `/api/risk/calculate` legacy route | Validated hypothetical capital, side, costs, stop/targets, lot step, USD conversions, margin and budget warnings. No executable buying-power claim | Plans browser-local, invalidated by input/context changes; no broker-spec certification. Legacy negative/zero/nonnumeric leverage accepted, null 500 confirmed | New plan SOURCE/TEST/LOCAL RUNTIME VERIFIED; legacy defects LOCAL RUNTIME VERIFIED and open. Exact valid EURUSD result stop $100/margin $550. Isolated M3 validation/contract work before financial release |
| Portfolio / Historical Lab — research UI, `research-quality.js`, backtest/evaluation/replay engines | `#portfolio`; backtest/evaluate/replay | Closed-bar bounded strategies, development/holdout chronology, costs/sensitivity/walk-forward, reproducible research; no current broker holdings | Browser-local experiments; explicit unavailable metrics; repeated holdout inspection still biases research; fixed-interval data lacks roll/corporate-action normalization | SOURCE/TEST/LOCAL RUNTIME VERIFIED through research/evaluation/quality suites and numerical parity. No statistical profitability certification/portfolio covariance. M4 |
| Journal / Research Library — `research-library.js`, library/validation/comparison modules, `research-records.js` | `#journal`; browser records, exports/import/replay, saved evidence | Retention/search/rename/delete/backup preview/append restore; saved ten-check explanations; historical/current hypothetical risk comparison | Existing schemas and original records immutable; bounded/quota/corrupt-storage failures preserve bytes; imports never gain verification. Device-local, unencrypted, no cloud sync | SOURCE/TEST/LOCAL RUNTIME VERIFIED; current integrated save/compare/original-record immutability and existing reliability tests. Cross-device identity/persistence NOT IMPLEMENTED. M4/M7 |
| Broker Accounts — `broker-workspace.js`, catalog, account store/adapters, `exness-readonly.js` | `#brokers`; gated accounts/broker/orders/positions routes | Hosted unavailable; isolated local paper uses explicit synthetic account. Exness CLI is constrained read-only local protocol, not an activated website connection | Stable-key persistent reservation, atomic private account writes and single-writer recovery; no distributed exactly-once transaction. Stub adapters must stay gated; no real authentication verified | SOURCE/TEST/LOCAL RUNTIME VERIFIED for sandbox/denial; same/new-key and corrupt-file probes current. Actual broker eligibility/schema/auth NOT VERIFIED. M3/M7/M9; explicit approval required |
| Settings — preferences, `workflow-maturity.js`, M1 model-status entry | `#settings`; browser appearance/defaults/storage actions; denied hosted reset | EN/AR/theme controls, safe storage notices, truthful model availability and link to existing authorized local pilot | Separate local stores, no tenant/cloud retention; refused writes report failure, no silent repair/migration; destructive actions explicit | SOURCE/TEST/LOCAL RUNTIME VERIFIED through preference, refused-storage, full UI and new journey checks. Unified secure persistence/identity NOT IMPLEMENTED. M7 |

## Six strategic systems and gap-to-vision mapping

| Strategic system | Verified foundation | Highest material limit / next implementation |
| --- | --- | --- |
| Professional workstation | Shared chart/context, strong retained THN brand, native disclosures, bilingual themes and keyboard access | M1 major acceptance; actual Preview interactions still blocked, dense risk rail trade-offs documented |
| Market intelligence | Validated provider closed bars, independent 15m/1h/1d, causal indicators/SMC, hashes and source times | M2 routing implemented; real provider coverage/calendars/licensing/point-in-time data not established |
| AI Copilot | Deterministic cited committee, opposing evidence, bounded operator-local protocol | M6 requires real installed-model quality/latency/traceability; no automatic weights, public endpoint or paid activation |
| Trading/risk | Authoritative hypothetical planner; isolated local paper only | M3 legacy input contract and retry policy; M7 durable authenticated account architecture; live remains disabled |
| Quantitative research | Bounded chronological backtest/holdout/stress/walk-forward/replay and explainable saved validation | M4 improve retained evidence/comparisons without altering formulas; no guarantees or invented metrics |
| Portfolio/journal/monitoring | Browser research Library/backup/classification, honest unverified outcomes, bounded market scanning | M7 device/tenant identity and durable storage; M8 opt-in alerts only after supported architecture; no fabricated holdings |

## Revalidation of historical F01–F16

“Fixed” below is scoped to the stated code/ref, not a claim that every behavior or
Production path has been exhaustively verified. New restricted financial/security
architecture remains outside this cycle's authorized release scope.

| ID | Current result | Evidence and remaining boundary | Action |
| --- | --- | --- | --- |
| F01 | FIXED core truthfulness on main/M1, not re-reported as current old defect | `THN-RECORD-1`, idea PnL/exit omitted; legacy source rows preserved/unverified, no automatic WIN/LOSS; planning capital is explicitly hypothetical, not account equity. Current trust/record tests pass | Preserve classification and default exclusion; no destructive migration |
| F02 | FIXED common analytical closed-bar boundary; limitations remain | `closedMarket` uses provider time/cutoff, shared eligible hash and bar-close availability. Current trust HTTP/causality tests pass. Paper marks intentionally use separate raw-observation semantics; no exchange holiday calendar | Preserve independent frames and disclose proxy/stale data, M2 future provider cases |
| F03 | PARTIALLY FIXED / bounded intent policy | Same-key HTTP replay returned original ticket; actual persisted restart tests pass. Same completed payload with a new key returned a different ticket and two simulated positions. Uncertain reserved intent blocks new keys; client retains pending key | Do not equate this with distributed exactly-once. New-key-after-completion is a policy boundary, not proof every intentional repeat is erroneous. M3 review |
| F04 | FIXED tested initialization/refused-storage cases | Guarded preferences, current professional denied-storage startup across nine views and core refusal/quota/import tests; no original-byte repair | Preserve fail-closed writes; broader storage lifecycle/real devices remain M7 |
| F05 | NOT IMPLEMENTED intentionally | No end-user identity, tenant ownership, durable hosted ledger or account DB; hosted finance denied in source/tests | Approval needed for M7; do not advertise multi-user accounts |
| F06 | FIXED tested Broker Accounts contrast/keyboard states | Current 72-scan professional check includes broker EN/AR/light/dark; no violations in tested states. Existing focusable scroll shells retained | Not accessibility certification; real assistive-tech/devices remain unverified |
| F07 | OPEN legacy API; M1 UI truthfulness corrected | Valid EURUSD: $100 stop/$550 margin at leverage 20. -1, 0 and `bad` leverage all HTTP 200; null HTTP 500. Old ticket lacks entry and used obsolete fields; failed request previously said verified. M1 now rejects false approval, validates displayed fields and removes fabricated request balance | Isolated M3 strict input/entry binding. No formula changes or financial release approval implied |
| F08 | REPRODUCED main/M1 checkpoint; CORRECTED M2 candidate | Unknown API and `.js` yielded HTML 200 locally. M2 returns JSON 404, explicit 405/Allow, safe path errors and preserved document navigation; targeted HTTP/security tests pass | Full M2 gates/PR/Preview before routine release; no direct main shortcut |
| F09 | PARTIAL per-process bounds, no distributed protection | Bounded bodies/research/replay/model requests remain; body overflow drains input, cache/locks/budgets per process, no per-tenant global admission control | Separate scaling/security review; no load-test/SLO claim |
| F10 | PARTIALLY FIXED; current measurements differ materially from October | Legacy SVG still 4,027,258B, but current UI uses 14,684B PNG. 36 local navigations: **0 SVG**, **38 PNG** HTTP responses; same-origin resource timing transfer 2,901,045B. Static no-store/function delivery remains | M5 asset reuse/cache design based on measured behavior, not old 443MB claim; retain API privacy headers |
| F11 | PARTIAL / unavailable real integration | Exness read-only local signed two-read CLI and fixture validation implemented. No real account authenticated; other configured stub statuses do not establish actual account/positions. Hosted linking stays denied | M9 eligibility/official schema/credentials separately authorized; no broker activation |
| F12 | PARTIALLY FIXED storage/recovery | Accounts now atomic private writes with fsync/rename and writer gate; corrupt-account probe rejected and preserved exact original bytes. Intent file atomic, uncertainty fails closed. Accounts/intents/audit are not one distributed transaction; no durable bracket worker | M3 crash/disk boundary coverage, M7 approved durable architecture. No unattended-execution guarantee |
| F13 | STILL OPEN staged security work | No application HTML CSP; official third-party widget and dynamic rendering remain. Exports restrict content; current encoded-text/import checks pass; M1 risk errors use text | Inventory/staged CSP requires approval and widget regression; no unproven exploit claim |
| F14 | STILL OPEN local audit limits | `auditLogger.js` retains 200 JSON events, redacts only selected top-level keys, rewritable local file; no compliance-grade immutability | Separate approved audit/key/retention architecture; no secrets copied |
| F15 | PARTIAL maintainability; docs entry corrected in M0 | Incremental modules retain overlapping legacy paths; syntax-only lint, unused declared SDK. Current README/policy now point at owner directive and current evidence | Contract boundaries before extraction; no wholesale rewrite or inflated lint claims |
| F16 | PARTIAL / operational verification blocked | Health has app version/server time, no exact deployment SHA. Current Git/check links exist but platform identity/domain checks and Production UI blocked. Required-check enforcement unverified | Read-only deployment mapping/health/runbook and owner-side rules verification; no admin mutation |

## Verification and production limitations

All financial/provider browser records in this audit are **synthetic fixtures**.
Source-defined hosted flags were tested locally, not asserted as observed current
Production health. M1 checkpoint validation: 266 core tests, 21 security tests,
16-profile integrated journey, 288 layouts, 72 accessibility scans, 64 emulated
zoom cases, refused-storage startup, plus 36 independent 1024px cases. M1 ticket
correction adds full Paper Review error/schema/bilingual checks and current-code
non-browser gates; final full-suite status must match the new PR head.

M2 runs the actual main-based 32-suite gate, not the M1-only 33rd suite; all
existing assertions/timeouts remain. Ten added HTTP tests exercise unknown APIs,
method contracts, static/private-file 404s, SPA/HEAD, malformed paths/JSON, body
limits, origin denial, controlled exception privacy and hosted execution denial.
The old security test's successful-HTML expectation for private/missing files was
replaced by a **stronger exact JSON 404/no-disclosure contract**, as the requested
routing behavior requires; no financial/security denial assertion was removed.

Exact commands, counts, final refs, raw gate summaries and portable observations
are in the evidence directory/release report. Security/core suites overlap;
counts are not additive independent assurances. Real model inference, live provider
quality, actual external TradingView candles and Production browser acceptance
remain unavailable/blocked. No new infrastructure or protection bypass is proposed.

## Release decision and next concrete work

M1 is a major candidate, not an approved integration. M2 is a small error-contract
correction with no financial formula, storage, schema, credential or paid-service
change; remaining checks/PR/Preview still gate routine release. M0 only changes
current documentation/policy and stores redacted synthetic audit evidence.

No milestone is declared Production-complete while actual deployment mapping and
smoke testing are blocked. Keep source rollback `a752fa4`; obtain the matching
existing platform deployment ID when authorized access works. Do not promote a
much older deployment merely because a historical document lists it.

Next implementation: M3 strictly validate legacy risk request type/leverage and
bind the ticket to an explicit hypothetical entry/context, while preserving
`calculateOrderRisk`/planning formulas and golden tests. Independently investigate
reserved/completed intent crash points and the intended meaning of a new key for
an identical completed payload. Those financial-policy decisions require review
before merge/release. Continue M4/M5 from measured research/UI gaps, without
activating hosted accounts, real brokers, paid AI or new infrastructure.

## Portable evidence and exact review refs

[Current state, checks and access boundaries](evidence/master-audit-20261108/current-state.json),
[all 47 original M1 file hashes](evidence/master-audit-20261108/m1-inventory.json),
[ten-file M1 correction inventory](evidence/master-audit-20261108/m1-correction-inventory.json),
[legacy risk input probe](evidence/master-audit-20261108/legacy-risk-probe.json),
[paper intent probe](evidence/master-audit-20261108/paper-intent-probe.json),
[corrupt account preservation](evidence/master-audit-20261108/corrupt-account-probe.json),
and [1024px/performance observations](evidence/master-audit-20261108/m1-performance-profiles.json)
are synthetic/redacted audit artifacts. Raw GitHub HTML, socket tokens, account
files, operator secrets and runtime databases are not included.

M1 correction and screenshots: [PR #14](https://github.com/Thaniyan/thn-ai-trader/pull/14)
and its `docs/M1-TICKET-RISK-TRUTHFULNESS.md`. M2 source/evidence:
[3ed7045](https://github.com/Thaniyan/thn-ai-trader/commit/3ed704557ce10b4c188a4fc29f3ea9ab237c0a93),
branch `fix/api-route-contracts-20261108`, `docs/API-ROUTING-CONTRACTS-20261108.md`.
PR creation was attempted using `gh pr create --body-file`; GraphQL access returned
Forbidden, so no PR number or merge is invented. The prepared comparison is
https://github.com/Thaniyan/thn-ai-trader/compare/main...fix/api-route-contracts-20261108?expand=1.

The M1 correction's current Vercel-bot Preview link is
https://thn-ai-trader-h4q1y7p9z-s139354s-projects.vercel.app/ (dashboard reference
`9ZmZgjz7JyWy2J9xWbr1mWDcZ6b7`), reported Ready in the PR page. Platform source
identity and interactive acceptance still require independent verification; this
link is not substituted for an actual application test.

## Final local verification results

- **M1 `527c0c985e54eaa6519ab352b8dd7e645f289fe7`: all 33 final-code
  browser suites passed**, including the expanded Paper Review failure/metric
  contract cases. Current-code 266 core, 21 security and ten system checks,
  build/syntax lint/packaging/workflow/frozen dependencies/zero-advisory audit and
  source/numerical parity also passed. [Full local gate](evidence/master-audit-20261108/m1-final-browser-gate.txt).
- **M2 `3ed704557ce10b4c188a4fc29f3ea9ab237c0a93`: all 32 main-based
  browser suites, 226 core, 21 security and ten system checks passed**, with the
  same required build/package/dependency/source gates. [Full local gate](evidence/master-audit-20261108/m2-final-browser-gate.txt).
- **M0 docs-only baseline:** 216 core, 21 security, ten system checks and
  build/syntax lint/packaging/workflow/frozen-lock/zero-advisory/source/link checks
  passed. All 77 runtime source files equal main. No separate docs-only full
  browser rerun is claimed; the final implementation gates above are explicit.

Both published implementation refs match GitHub; main remains `a752fa4`.
Preview and Production acceptance remain blocked despite these local results.
Use the final CI observation in the portable record; passing local tests does
not mean an unobserved hosted job or deployment has passed.

Hosted CI was independently observed **Success** for M1 push
[42461972388](https://github.com/Thaniyan/thn-ai-trader/actions/runs/42461972388),
M1 PR #14 [42461976276](https://github.com/Thaniyan/thn-ai-trader/actions/runs/42461976276),
and M2 [42462362283](https://github.com/Thaniyan/thn-ai-trader/actions/runs/42462362283),
on their exact implementation heads. These results clear code/test gates, not
actual Preview interactions, repository rules, owner approval or Production smoke.
The audit branch itself changes documentation only; its separate newly triggered
hosted run must not be represented as already completed at publication.
