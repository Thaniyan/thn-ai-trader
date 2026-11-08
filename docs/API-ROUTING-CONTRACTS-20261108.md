# M2 — reliable API and static-resource errors

Branch: `fix/api-route-contracts-20261108`.
Baseline/rollback source: `a752fa4f533b0376c8d60eab1a450c5fbf9932f9`.
This branch starts from main and **does not include PR #14's UI/workflow changes**.

## Verified defect and resulting behavior

The unchanged packaged server returned HTTP 200 with app HTML for both
`GET /api/this-route-does-not-exist` and `GET /missing-engine.js`. Its shared static
fallback did not distinguish API errors, absent assets or document navigation.

The correction is limited to the HTTP envelope in `server.js`:

- Unknown API namespace paths return structured JSON 404 `API_NOT_FOUND`.
- Known routes reject unsupported methods with JSON 405 `METHOD_NOT_ALLOWED` and
  explicit `Allow`; registered preflights retain 204.
- Absent static/private files return JSON 404 `NOT_FOUND`, including a document
  Accept header. Assets/static/images/fonts namespaces cannot fall back to HTML.
- Existing documents and modules retain their MIME types. Eligible extensionless
  browser document navigation (`Accept: text/html`) retains the SPA fallback.
- Static/document HEAD works without a body. Invalid percent/NUL paths return
  JSON 400 `INVALID_PATH`; an invalid URL cannot escape the request error boundary.
- Existing body limits, origin checks, privacy headers and generic internal-error
  handling remain. API failures cannot become a successful HTML response.

Route method metadata enumerates existing handlers and the single-symbol market
route; adding an endpoint must update its method contract and corresponding
unsupported-method regression. No framework or broad routing rewrite was added.
No formula, financial risk policy, record schema, broker capability, credential,
CSP, persistence or deployment configuration was changed.

## Actual complete verification

On the final source: build and syntax-only lint passed; **226 core tests**,
**21 security tests**, **ten system checks**, and **all 32 canonical-main browser
suites** passed. No test, original financial assertion or timeout was disabled or
relaxed. These are fixture-backed local packaged checks, not live feed evidence.

Ten added HTTP tests cover all existing known method contracts, unknown API verbs,
asset/private-path denial, valid SPA documents/modules, HEAD/Allow, malformed
paths/JSON, payload limits, origin rejection, a controlled internal exception and
hosted financial/model denial. The test-only failure fixture never enters the
production package. The existing private-file test now asserts exact JSON 404
instead of accepting successful HTML; this strengthens the same no-disclosure
boundary rather than suppressing a failure.

Frozen Bun 1.4.3 dependencies were installed with lifecycle scripts disabled and
package/lock bytes preserved; fail-closed advisory audit reports zero advisories.
Workflow validation, canonical-source guard and numerical parity passed. Protected
financial/research files **and public/app.js** match main byte-for-byte.
Production package: 77 runtime files / 81 artifact files. Full source hashes,
artifact identity, commands' outcome summary and every browser-suite result:
[verification](evidence/api-routing-20261108/verification.json) and
[browser gate](evidence/api-routing-20261108/browser-gate.txt).

Commands: `npm run build`, `npm run lint`, `npm test`, `npm run test:system`,
`npm run test:security`, `npm run package:production`, pinned-tool
`python scripts/ci/run-browsers.py` (`npm run test:browser`),
`python3 scripts/ci/check-workflow.py`, `bun install --frozen-lockfile --ignore-scripts`,
`node scripts/ci/dependency-audit.mjs`, `node scripts/ci/release-guard.mjs`,
`git diff --check` and Git integrity checks before publication.

## Risk and controlled delivery

Classification: low-risk HTTP error-contract repair, supported by complete local
regression and unchanged financial/UI engines. The intentional compatibility
change is that previously successful HTML responses for nonexistent API/assets
are now errors. Valid API success contracts and browser navigation are preserved.

Current release gates remain external: normal PR creation/review/check enforcement
needs GitHub API access, and Preview verification needs permitted access to the
existing Vercel hosts. The workspace proxy currently rejects those destinations;
no protection or network policy was weakened and no direct main push substitutes
for the requested PR workflow. No READY deployment, deployed SHA or Production
smoke success is claimed here. Git push alone is not release acceptance.

After a permitted PR merge, verify the exact merged commit/deployment/domain,
health/read-only contracts, bilingual UI and denied financial capabilities. Use a
normal revert of this correction if necessary, preserving canonical history; do
not reset main or promote an unrelated old deployment.

Remaining separate finding: `/api/risk/calculate` still accepts invalid leverage
and returns generic 500 for JSON null; the direct legacy ticket lacks an explicit
entry assumption. These are M3 contract/financial-policy review, not silently
changed by the routing patch. The existing authoritative Risk Desk plan remains
available. Major PR #14 still requires its separate owner acceptance.
