# Staging frontend only — not deployed

Generate an isolated static project with `node deployment/vercel-staging/build.mjs --output /absolute/new-directory`; run `node verify-build.mjs` from that artifact. Default mode has no backend. Optional `--backend` requires a real approved HTTPS staging-backend hostname and does not provision or connect it.

The generated vercel.json serves public/, creates no functions, preserves security/cache policy and disables automatic Git deployments in configuration. Actual project protection/plan/settings are separate owner verification gates. Do not deploy directly from repository root or use legacy .invalid placeholder rewrite templates.

Read docs/VERCEL-STAGING-SETUP.md, VERCEL-STAGING-INTEGRATION.md and VERCEL-STAGING-ACCESS.md before any external action. This directory's templates do not authorize deployment. Previous unpublished online-staging preparation commit09fd770 is absent in this workspace; published staging service and SQLite recovery tools are reused.

## Configuration integrity boundary

Run `node verify-build.mjs --source` before transferring a generated artifact.
This checks exact SHA-256 bytes for `vercel.json` against its immutable
`vercel.source.json` copy, as well as all frontend assets and build files.
The default build command checks those same immutable files by SHA-256 and
requires the platform-consumed `vercel.json` to contain exactly the same JSON
settings. The effective configuration may additionally contain the top-level
`name` only when it equals `thn-ai-trader-staging-frontend`; the verifier validates
that exact value before removing only that field from its comparison copy.
Otherwise only whitespace and object-key order may differ. All arrays, headers,
rewrites and settings must match; unknown/removed fields fail closed. Neither
mode relies on a `VERCEL` environment-variable exception. The manifest is an
integrity inventory, not a signature: verify the independently supplied ZIP
checksum and trusted source commit before running its code.

The owner-provided hosted failure identifies Vercel's injected project `name`
as the sole configuration difference. The dedicated regression reproduces that
input locally. A real protected Preview must still succeed before claiming hosted
resolution. Do not accept changed backend, security or deployment settings.

Vercel Authentication / All Deployments protection is project-side configuration;
these local files cannot establish or change it. Preserve the existing protection.
