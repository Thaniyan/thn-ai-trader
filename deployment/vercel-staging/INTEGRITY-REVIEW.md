# Confirmed Vercel project-name injection review

Base: `45576781d9b5691c7cb52df1081cbab3c7f80cd3`, itself based on approved static
source `280b69cb835faa5cf632204fac4c0c21dee808ad`. Local implementation only;
no authorization to publish or deploy this correction.

## Root cause

The owner's complete hosted failure-log diagnosis establishes that Vercel adds
exactly one top-level field to the effective deployment configuration:

```json
"name": "thn-ai-trader-staging-frontend"
```

Every other setting matches, including CSP, security headers, caching, rewrites,
Git settings, build command and output directory. The previous verifier required
strict equality against the source snapshot, so it correctly detected a difference
but could not distinguish this confirmed project-identity metadata injection.
This supersedes the previous review's uncertainty about the semantic difference.
The original hosted file was not downloaded, but its exact reported digest is
reproduced locally: append the `name` field to the approved configuration, serialize
with `JSON.stringify(hosted) + '\n'` (compact JSON with a trailing newline).
The result hashes to
`1962e12f7487a565b7e7afcc8533a43c4933157e10b92c830f71b1ce307da0b7`.
This independently corroborates the owner's diagnosis. The regression asserts this
fixture digest; the verifier does not whitelist that hash.

## Minimal correction and security boundary

The verifier clones the effective configuration. If that clone has its own
`name` property, it must be exactly the string `thn-ai-trader-staging-frontend`.
Only after validation is that single field removed from the comparison clone.
Every remaining field is compared against the immutable source snapshot using
`assert.deepStrictEqual`. The source snapshot itself must still match the staging
policy. No broader normalization, environment-variable exception or hash whitelist
is introduced. Unmodified local configurations without a name still pass.

Every frontend asset, the source snapshot, policy, package.json and verifier retain
byte-exact SHA-256 verification. `--source` continues requiring deployment-root
vercel.json to match the original snapshot bytes; it intentionally rejects a
platform-injected name before upload. Missing/incorrect snapshots, wrong names,
unknown properties and missing/changed settings fail closed. The manifest remains
an unsigned integrity inventory, not a signature; trust the reviewed source and
independently transferred whole-package checksum.

Regression coverage includes the confirmed hosted input, incorrect/empty/null/object
names, unknown root/nested properties, modified CSP, altered rewrites, changed
caching, enabled Git deployments, missing settings, changed build/output, missing
and incorrect snapshots, and existing per-file tampering/representation tests.

No frontend asset, backend implementation, security policy, configuration template,
packaging algorithm or trading setting is changed. The default artifact is
static-only with `public` output, no functions/server/trading engine, no backend
URL, honest unavailable responses, Git deploymentEnabled:false, and unchanged
security/no-store headers. Vercel Authentication and All Deployments protection
are project-side settings and are untouched; local tests do not establish their
current hosted state. Hosted resolution remains unverified until a separately
authorized protected Preview succeeds.

## Reproduction and packaging on Ubuntu

Use Node 24.x >=24.5 and Python 3. From a clean checkout of the reviewed commit,
choose a NEW absolute output directory outside the checkout:

```sh
node deployment/vercel-staging/build.mjs --output /tmp/thn-reviewed-frontend
(cd /tmp/thn-reviewed-frontend && node verify-build.mjs --source)
python3 deployment/vercel-staging/package.py /tmp/thn-reviewed-frontend /tmp/thn-reviewed-frontend.zip
sha256sum /tmp/thn-reviewed-frontend.zip
```

For review transfer, verify the independently supplied ZIP checksum before
extracting into a new empty directory, then run `node verify-build.mjs --source`.
Do not overwrite an installation, include .vercel/.env credentials or run a Vercel
deployment without separate approval. Local fixture reproduction and browser
routing models create no cloud resources or public endpoints.

## Local validation results

Node 24.19.0, Linux cloud workspace:

- `node --test --test-concurrency=1 tests/*.test.mjs`: 62 passed, 0 failed.
- `node tests/run-system.mjs`: 10 passed, 0 failed.
- `VERCEL_QA_OUTPUT=/workspace/reports/vercel-name-fix/browser python tests/vercel-staging.browser.py`:
  130 passed, 0 failed; 42 screenshots; local routing model only.
- Focused integrity regressions: 2 passed, 0 failed, including exact hosted SHA
  reproduction and rejection of every adverse configuration case.
- `git diff --check`: passed; no strong credential-pattern matches in changed files.

The default build and deterministic ZIP procedure are unchanged. Their outputs
must be regenerated from this clean commit; deployment-root config, immutable
source config and all public assets remain byte-identical to the approved package.
Only verifier bytes and commit-linked manifest metadata change within the artifact.
No push, deployment, hosting-settings change, production modification, WSL2 access
or live-trading configuration change was performed.
