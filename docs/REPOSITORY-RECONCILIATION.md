# Repository reconciliation and publication decision

## Verified source baselines

| Repository/ref | SHA | Visibility evidence |
|---|---|---|
| Thaniyan/thn-ai-trader main | 50857dfc1e45a901515b56ffe2ed914d897671af | Owner states PUBLIC; metadata API Forbidden here |
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
on original history. Cherry-picking staging's initial unrelated root imports opaque
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

## Baseline and candidate validation

Original baseline syntax passes. Its original system suite, run on fresh temporary
state with provider fixtures and no copied tracked runtime data, gives 8 pass / 2
fail: order execution expected 200 but got 400 INVALID_TAKE_PROFIT; the close test
then lacked its prerequisite ticket. This is a fixture-observed original failure,
not a claim that live execution was tested. Legacy direct probes confirm anonymous
accounts HTTP200, cross-origin risk POST HTTP200 and no root CSP. Original lacks
staging's regression, session and browser suites; those cannot be reported as passed.

Candidate results and clean-clone verification are appended after execution. Local
fixtures do not verify live quotes, paid AI, real HTTPS/protected Preview, Windows/
WSL2 or real-world paper fills. Current product gaps: exact spot Gold execution,
venue calendars/cost models, genuine historical backtesting, real provider observation,
manual accessibility/usability and multi-process auth/rate coordination.

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
