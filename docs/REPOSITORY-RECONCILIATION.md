# Repository reconciliation and publication decision

## Verified source baselines

| Repository/ref | SHA | Visibility evidence |
|---|---|---|
| Thaniyan/thn-ai-trader main | 50857dfc1e45a901515b56ffe2ed914d897671af | PUBLIC independently confirmed by GitHub repository page; metadata API Forbidden |
| Thaniyan/thn-ai-trader-staging main | 75110ec2ca317ae0a873268f42a577636f250dbd | Owner previously independently verified PRIVATE; API Forbidden here |
| staging review/vercel-name-fix-b05f070 | b05f070c1c9b289bc5b39f833e4591f0bdd8d8ac | Remote Git ref verified |

All three refs were checked through read-only Git before local source changes.
The original clone was pinned to its exact main and configured with push URL
/dev/null before preparing local reconciliation/unified-development-local.
No push, remote branch, PR, merge, deploy, hosting setting change or WSL2 access.

## Comparison and selection

Original has 24 tracked files; staging has 105. Six shared files are byte-identical:
bun.lock, brand-preview.png, d3.min.js, logo.svg, public/manifest.json and
server/reconciliationEngine.js. Fifteen common files differ, three are original-only
and 84 are staging-only. FEATURE-MATRIX.md evaluates each product/security area;
reconciliation/file-assessment.json covers all 108 paths with baseline hashes and
retain/adapt/exclude decisions. No new framework or persistence redesign is added.

Retain staged hardening because its code and regressions cover authentication,
ownership, CSRF/session clearing, CSP, provider identity/freshness/backoff, server
risk/paper worker, durable transactions/ledger, encryption recovery and static
artifact integrity. Original branding, assets, nine-view workflow and reconciliation
logic survive through the staged tree. No named original app function was removed;
unsafe bodies/fallbacks and misleading performance representations were corrected.

Do not import original trading_accounts.json (one record) or audit_log.json (52
records); inspect only structural counts/field names. No encrypted credential payload
was present in that account snapshot. The obsolete original AUDIT_REPORT.md has
legacy identifiers and unsupported readiness claims; retain it in history, not as
current assurance. Prior staging PUBLICATION-MANIFEST.json/REVIEW.md also describe
a different destination/approval and are excluded. Historical staging operations
docs are retained for provenance and governed by current AGENTS.md, not executed.

Adapt the source-transition regression to generate a disposable source-only fixture
and test-only known-release map. A clean clone must not depend on private staging's
unrelated 374bc780 Git object. No production tool or historical allowlist is changed.
Keep dependency declaration and lock bytes; require Node24 >=24.5 for native SQLite.
An unused declared Google SDK remains a separate dependency-cleanup item.

## Strategy and provenance

Use reviewed source-tree reconciliation, followed by local integration/review commits
on original history. A portable read-only baseline runner is included at
scripts/reconciliation/baseline-review.py; it exports only original source into
a temporary directory, blocks non-fixture network and never copies runtime JSON.
Cherry-picking staging's initial unrelated root imports opaque
bulk history and offers no conflict advantage. A merge of unrelated histories adds
irrelevant ancestry and risks runtime artifacts. Copy only tracked reviewed source,
record per-file source hashes and exclusions, then validate a clean clone. Staging
release SHAs remain evidence, not ancestors or remote refs in the original repository.

## Production isolation — unresolved publication blocker

Neither original nor staged tree has tracked Actions workflows; original root has
no Vercel/Netlify/Render deployment file. This candidate preserves that absence and
adds only inactive deployment templates/helpers. No .vercel project link is imported.
The original repository is associated with https://thn-ai-trader.vercel.app/.
GitHub metadata/hooks/apps/deployments APIs all return Forbidden here. No Vercel
account binding/API integration is available. Original project's production branch,
preview triggers, connected app scope, build hooks, protection, domains and secret
scope therefore cannot be independently verified. A development push may create a
Preview or other deployment. Unavailable metadata is NOT proof of isolation.

Owner-confirmed empty staging webhooks, Codex-only staging app and disconnected
independent staging Vercel project do not establish anything about the ORIGINAL
production project's connection. Generated staging git.deploymentEnabled:false
also cannot control that separate project. Publication of this candidate is NO-GO
until original repository/project isolation is independently established and the
exact public-source branch/commit is explicitly authorized.

## Follow-up isolation verification (read-only)

The 2026-10-17 follow-up rechecked the existing c87af55 candidate and both remote
main SHAs; no implementation work or test suites were repeated. Nine original
GitHub settings/API checks (including Actions permissions, protections, rulesets and
environments) all returned Forbidden. A read-only GitHub public-page check did
independently confirm original repository visibility as PUBLIC (HTTP200, repository
public metadata=true). That page does not expose hosting settings. No authenticated
Vercel metadata capability
is available. Original project's connected repository, Production/Preview/custom
branch tracking, domain overrides and external promotion triggers remain unverified.

[Deployment isolation checklist](DEPLOYMENT-ISOLATION-CHECKLIST.md) gives the minimum
owner UI observations, precise navigation and explicit GO/NO-GO criteria. Non-main
Preview builds are still deployments; Vercel Authentication is not deployment
suppression. Publication remains NO-GO until the exact ref has verified isolation
from both Production and unauthorized Preview/custom deployments, followed by
separate exact-commit/ref publication approval. Branch protections are also unknown;
absence of tracked workflows is not proof against app/organization automation.

The reviewed candidate remains c87af55bfa5c492fe017ab72220cd4d32216f905. This follow-up
changes reports only; no push, deployment, settings change or credential access.

### Latest owner evidence and readiness assessment

The owner verified thn-ai-trader.vercel.app is assigned to Production, Production
tracks main, Preview tracks All unassigned branches, and Vercel Authentication uses
Standard Protection. Vercel Deploy Hooks and GitHub repository Webhooks are empty;
no GitHub Rulesets exist. Actions are allowed with default GITHUB_TOKEN read-only.
Installed GitHub Apps are ChatGPT Codex Connector, Google AI Studio, Render and
Vercel. No settings changed. These observations supersede earlier broad statements
that the corresponding facts were wholly unknown; they are owner evidence, not API
verification. Prior auto-assign-custom-production-domain observation remains recorded.

A non-main push is expected to create Vercel Preview, not directly Production through
observed branch tracking. Publication remains NO-GO because that Preview is not
approved, and external integration behavior is unresolved. Standard Protection is
not All Deployments protection or proof against exceptions. Empty repository hooks
do not clear GitHub Apps: their own event subscriptions are separate. Default
read-only GITHUB_TOKEN does not restrict Render/Vercel app credentials or every
workflow's cloud access. No Rulesets does not establish legacy branch protection.

The remaining-only checklist covers Render service/branch/auto-deploy and preview
mapping, other Vercel project/custom-environment/domain overrides, Standard Protection
exceptions, and Google AI Studio/app/workflow automation. These need read-only owner
evidence because cloud metadata access is unavailable. No product code change is
needed to document the risk; completed tests remain applicable.

Minimum approval gates after verification: separately authorize either a narrowly
specified isolation change (no automatic deployments of the exact review ref) OR
explicitly authorize its verified protected Preview deployment scope. Then approve
one exact source SHA and absent non-main GitHub ref, with other services excluded
and Production promotion prohibited. Neither approval is provided by this task.
Candidate c87af55bfa5c492fe017ab72220cd4d32216f905 is unchanged; only local report
edits are prepared. No push, deployment, production change or test repetition.

## Baseline and candidate validation

Original baseline build/syntax passes on Node24.19.0. Its 10 legacy system tests
pass with fresh temporary state and correctly configured provider fixtures. During
preparation, an initially missing THN_DATA_DIR in the external fixture wrapper
caused upstream fixtures to throw: 8/10 legacy cases passed and the order/close
chain failed. That setup was corrected and rerun; it is not an unresolved product
regression. A separate explicit outage probe then confirms the actual product
hazard: original returns HTTP200 and Algorithmic Pricing Engine Feed analysis
when the provider is forced unavailable.

| Check | Original baseline | Integrated candidate |
|---|---|---|
| Build/syntax | Pass on Node24; original Node18 compatibility not tested | Build + lint pass (17 application/module syntax targets) |
| Legacy system flow | 10/10 fixture tests | 10/10 authenticated fixture tests |
| Node regressions | Staging suites absent; cannot claim equivalence | 62/62 pass, 0 failed/skipped |
| Anonymous account API | HTTP200 | HTTP401 |
| Cross-origin private risk mutation | HTTP200 | HTTP403 with valid identity and wrong Origin |
| Root CSP | Absent | Present and enforced in browser runs |
| Provider-outage analysis | HTTP200, synthetic Algorithmic Pricing Engine Feed | HTTP502 MARKET_UNAVAILABLE, no invented candles |
| EN/AR navigation/common mobile smoke | 36 view checks visible; 18 mobile overflow findings; resetSandboxCapital undefined page error | Broad CSP browser suite passes EN/AR/mobile, privacy, charts, quota, scanner, notifications, sizing and ledger |
| Release-blocker browser | Suite absent | 11/11 pass |
| Static staging routing browser | Builder/suite absent | 130/130 pass; 42 screenshots |
| Accessibility | Original automated axe suite absent; no compliance claim | 18 EN/AR axe scans, no violations in configured WCAG2A/AA/2.1AA scope; manual review required |
| Release portability | No equivalent suite | Four focused release/integrity tests pass in clean clone lacking private staging root objects |
| Local load fixture | Not measured | 20 concurrent three-instrument scans pass; not provider/production capacity evidence |

The candidate's 62 regressions cover isolation/auth, CSRF/session revocation,
concurrent idempotency, provider failures/freshness, paper risk/order lifecycle,
SQLite persistence/backup/recovery, key failures, release integrity and rollback
boundaries. An absent original suite is not counted as a passing baseline check.
Accessibility initially failed to start due to missing axe-core; installing pinned
axe-core 4.10.3 outside the repository resolved it. No application checks were
suppressed. Summary evidence is in reconciliation/validation-results.json; full
local logs/screenshots are under /workspace/reports/reconciliation.

All 114 tracked candidate files and the complete proposed diff were scanned for
strong credential patterns and sensitive paths: zero findings; template credential
values are empty; no workflow, DB, certificate, runtime state or archive is tracked.
This is not exhaustive secret detection or a purge of historical public Git objects.
Per-file source hashes allow reviewing every copied/adapted path independently.

Local fixtures do not verify live quotes, paid AI, actual HTTPS/protected Preview,
Windows/WSL2 or real-world paper fills. Current product gaps: exact spot Gold
execution, venue calendars/cost models, genuine historical backtesting, real provider
observation, manual accessibility/usability and multi-process auth/rate coordination.
The dashboard's generic risk-status wording and instrument labels deserve future
usability review; passing browser scans do not validate all product copy or realism.


## Proposed branching, CI and release process (not installed)

- main: protected production release history; require review, passing CI and explicit
  release approval. No direct pushes or force pushes; no bot auto-promotion.
- develop: protected integration after hosting isolation; feature/*, fix/* and docs/*
  branches target it. release/<version> is a pinned candidate; hotfix/* starts from
  current production and is reconciled back after review. No remote ref created now.
- Future CI: least-privilege read-only token, no deployment credentials, pinned action
  revisions, Node24/Python/Chromium, syntax/regression/system/browser/accessibility,
  dependency/secret scan, deterministic artifact verification. Run untrusted changes
  without secrets; never use privileged pull_request_target execution of branch code.
- Staging: independent protected project/service, separate data/keys/tokens/origins,
  reviewed immutable artifact and all-deployment access protection. Automatic Git
  builds remain off unless explicitly approved after branch integration review.
- Promotion: human-approved version/tag/artifact digest and environment gate;
  SemVer for actual releases, no version inflation for this local candidate.
  Backup and rollback rehearsals precede stateful schema/runtime changes.
- Codex may implement/test locally within task scope; publication, settings, paid
  calls, installs and deployments remain separately authorized. Never real-money
  execution. Temporary private staging becomes an archive/provenance source; any
  future sync is an explicit one-way reviewed patch with secret scan, not dual-main
  development or automated mirrored pushes.

See PRODUCT-VISION, ARCHITECTURE, DEVELOPMENT-ROADMAP, QUALITY-STANDARDS,
AI-TRADING-VALIDATION and MIGRATION-AND-ROLLBACK for maintained contracts.

To reproduce baseline observations from this checkout (Playwright/Chromium needed):

```sh
python scripts/reconciliation/baseline-review.py --output /tmp/thn-original-baseline-review
```

The source runner pins original 50857df and uses current reviewed provider fixtures;
its legacy system pass does not establish the missing security invariants.
