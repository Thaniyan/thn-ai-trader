# THN AI Trader development contract

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
