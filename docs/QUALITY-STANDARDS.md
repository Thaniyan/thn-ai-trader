# Quality and release standards

Use Node 24.x >=24.5 and Python 3. Runtime dependencies are unchanged; application
and fixture tests use built-ins and need no provider secrets. Where installing
packages is necessary, use the existing bun.lock in frozen mode rather than create
an unrelated lockfile. Browser QA requires locally installed Playwright, Chromium
and axe-core. Keep these test tools outside the source tree.

From repository root:

```sh
npm run build
npm run lint
node --test --test-concurrency=1 tests/*.test.mjs
node tests/run-system.mjs
python tests/browser.test.py
python tests/release-browser.test.py
ACCESSIBILITY_OUTPUT=/tmp/thn-accessibility-review.json python tests/accessibility.test.py
VERCEL_QA_OUTPUT=/tmp/thn-vercel-browser-review python tests/vercel-staging.browser.py
```

Choose unused output paths. Browser routes block external requests; servers and
SQLite fixtures run in disposable temporary directories. These scripts exercise
actual local CSP, not a hosted deployment. Accessibility instruments same-origin
axe; automated passes do not establish complete WCAG compliance. Browser suites
exercise EN/AR views, responsive layouts, drawings, identity changes and outages.

Do not suppress failures. Build/syntax alone cannot establish functional health.
Require account isolation, CSRF/session revocation, concurrent idempotency, durable
fills, exact pricing/freshness gates, provider 429/outage handling, missing/wrong key
recovery, backup consistency, lock exclusion and shutdown tests. Test validators
must fail for altered assets, names, CSP, cache, routes and Git deployment settings.

The portable source-transition regression uses a disposable tool copy with a
synthetic known-release map; the shipped historical allowlist remains unchanged.
It validates approval/rollback/state boundaries without importing unrelated Git
objects. It is not proof of upgrading any actual WSL2 installation.

Before public-source publication, scan all proposed commits and tree for private
keys, tokens, environment values, certificate/DB/runtime paths, legacy user state,
archives and source maps. Pattern scans are incomplete: manual review is required.
Do not add Actions workflows or active deployment config in this reconciliation.
A future CI proposal is in REPOSITORY-RECONCILIATION.md; implement only after approval.

Release claims must distinguish local fixtures, browser routing models, real
providers, actual HTTPS/protected Preview, Windows/WSL2 and real-world paper fills.
No production readiness claim with unresolved critical regressions or unverified
hosting isolation. Imported staging docs are historical procedures, not permission
to install, publish or deploy this candidate.
