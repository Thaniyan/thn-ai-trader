# THN AI Trader development contract

The explicitly authorized local CI foundation is documented in
docs/ENGINEERING-FOUNDATION.md. Its validation-only workflow and pinned QA tool
installation supersede historical instructions forbidding any workflow addition.
No deployment workflow, remote operation or infrastructure/settings change is
authorized. Run scripts/ci/source-guard.mjs before publication; keep clean ancestry.

Read docs/PRODUCT-VISION.md, docs/ARCHITECTURE.md, docs/QUALITY-STANDARDS.md and
 docs/REPOSITORY-RECONCILIATION.md before changing behavior.

- Future authoritative source is Thaniyan/thn-ai-trader; this candidate is LOCAL
  ONLY until a separately approved, deployment-isolated publication. Preserve
  original history; never merge unrelated staging roots wholesale.
- Use the existing isolated checkout. Do not create a worktree without an explicit
  request. Preserve user changes. Never copy .env, .vercel, credentials, certificates,
  SQLite/JSON state, backups or node_modules between environments.
- Local implementation and fixture tests are permitted. Pushes, PRs, merges,
  deployments, environment/settings changes, paid services and local installation
  require task-specific authorization. Existing production and owner WSL2 are out
  of scope by default. No real-money execution; external broker adapters fail closed.
- Keep production deployment configuration unchanged unless explicitly authorized.
  A branch name or git.deploymentEnabled in a generated artifact does not prove
  isolation of a separately connected production project. Never run Vercel CLI as
  a setup step. Review current project integrations before any authorized push.
- Node 24.x >=24.5 is required for the SQLite/proxy baseline; Python 3 and Playwright
  plus Chromium are needed for browser tests. No provider keys are needed for tests.
- Use isolated temporary state and provider fixtures. Preserve SHA-256/TLS checks.
  Report fixture evidence separately from real market, HTTPS, WSL2 and hosted evidence.
- Required commands: npm run build; npm run lint; node --test --test-concurrency=1
  tests/*.test.mjs; node tests/run-system.mjs. Browser commands and limitations are
  documented in docs/QUALITY-STANDARDS.md. Recheck sensitive paths before commits.
- Server owns identity, balances, execution, risk and ledger. Client state must
  clear on identity changes. Never invent prices, fills, performance or AI results.
  Maintain EN/AR, RTL, nine navigation views, accessibility and mobile behavior.
- Do not weaken tests or configuration checks to obtain a pass. Document a defect,
  distinguish historical tests from portable fixtures, and fix it within scope.

## Sanitized publication candidate

This separate local copy is an explicitly authorized clean-root reconstruction.
Its source milestones map to the protected original in SANITIZATION-MAP.json.
Do not fetch, merge, graft or replace its parents with the unsanitized original
history. Never add original branches/tags, refs/replace, alternates or full-history
bundles to a proposed publication. tests/sanitized-history.test.mjs checks all refs.
No remotes are configured. Publication remains blocked pending private off-workspace
recovery, provider credential review, deployment isolation and separate approval.
Historical documents describe prior work; SANITIZED-MIGRATION.md governs this copy.
