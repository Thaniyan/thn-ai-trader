# Vercel staging implementation — local evidence and acceptance

2026-10-17 Asia/Muscat. **No Vercel project, deployment, external account, tunnel, cloud resource or public URL was created.** No remote push, production/WSL2 modification, paid upgrade or live-trading enablement occurred.

## Implementation delivered

Staging-only generator emits a separate static Vercel project with Node24 build verification, public/ output, zero API/functions, automatic Git deployment configuration disabled, original CSP/security headers and no-store caching. Default backend destination is absent, not `.invalid`. The honest bilingual responsive shell is the only rendered UI until the separately gated persistent backend returns the exact-origin contract. Original app/public/server files are not modified.

Connected mode uses same-origin external rewrites, an independently protected HTTPS backend, real backend session cookies and existing CSRF/ownership/risk controls. Backend service/preflight/preload/proxy files reuse published persistent staging runtime/backup design. Previous unpublished commit09fd770 and its artifacts were not present in this fresh environment; no claim of recovery or reuse of unavailable files is made.

## Executed tests

| Test | Actual result |
|---|---|
| Full Node regression | **60 passed,0 failed/cancelled/skipped**: existing56 plus4 new Vercel build/contract tests. `node --test --test-concurrency=1 tests/*.test.mjs`. |
| System suite | **10 passed,0 failed**, isolated providers/state. `node tests/run-system.mjs`. |
| Existing broad browser suite | PASS: EN/AR navigation, responsive charts, CSP, Gold outage, quote quota, account isolation, scanner, notifications, ledger/sizing. |
| Existing blocker browser suite | **11 passed,0 failed**, CSP enforced, fixture providers. |
| New staging Playwright suite | **130 passed,0 failed**,42 screenshots:36 unavailable9-view EN/AR desktop/mobile screenshots and6 connected-fixture screenshots. Checks no invented rendered state/session, no-JS behavior, API marker/cache, independent backend gate, real session/ownership, provider degradation, network outage, exact-origin mismatch and failed app asset retry. |
| Four new Node tests | Build modes, manifest/tamper handling, safe destination checks, CSP consistency, no functions/state, unavailable metadata, no API caching, gate/Origin/Cookie/Set-Cookie/ownership/logout forwarding and backend preflight refusal paths. |
| Static project verification | Both modes build locally; per-file SHA-256 manifest and Node24 verifier pass using the explicit local development-test flag while checkout is dirty. Final clean committed artifact is separately generated and verified without that flag; exact SHA/checksum supplied with delivery. Dirty artifacts are not approved for deployment. |
| Official Vercel compatibility evidence | Both generated header/rewrite arrays validate against current official vercel/vercel routing schemas at c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb; official source contains Node24 support. This is not full server-side configuration/plan validation. |
| Backend templates | Caddy config validates with locally SHA-512-verified Caddy2.10.2; systemd syntax verifies with local Node path substituted. No real unit installed/started; host user/path/mount/TLS/firewall acceptance still required. |
| Build/lint | Existing application build and17-file syntax check passed; new JavaScript modules separately parsed/executed by tests. |

Logs and private screenshots: `/workspace/reports/vercel-staging/`; latest staging visual report `browser-delivery/REPORT.md` and structured `findings.json`. Console errors are hashed and network failure paths/statuses are sanitized; expected gate/CSRF/ownership refusals, forced provider errors and optional chart failures are distinguished from real online availability. No actual credentials/database files or raw auth headers are included in browser evidence. Connected screenshots use disposable test identities/provider fixtures and mask inputs/account details. Automated width checks do not prove full visual quality; manual layout/accessibility review remains required. No new axe/accessibility certification is claimed.

## What these tests do NOT establish

The local HTTP routing model is **not Vercel**. It proves implementation assumptions under transparent forwarding, not Vercel's real Authorization/WWW-Authenticate/Origin/Cookie/Set-Cookie/cache behavior. Secure cookie attributes are inspected with a configured HTTPS origin, but the local browser model's transport is HTTP; no live HTTPS browser-cookie roundtrip is claimed. Provider fixtures do not establish market freshness, paper fills or AI results. No cloud disk durability or actual systemd hardening is certified.

Official Vercel documentation pages were blocked403; user account/plan is not connected/verified, and GitHub owner-type API is Forbidden. Hobby personal-versus-organization eligibility, commit-author association, current numeric build/deployment limits, exact Git-deployment field acceptance and deployment-protection entitlements/URL coverage remain owner checks. Private GitHub status does not grant website privacy. See VERCEL-STAGING-ACCESS.md.

## Acceptance and decision

**CONDITIONAL GO for reviewing local preparation; NO-GO for online exposure/deployment until all external gates pass.** Owner must approve the separate project/scope, confirm eligible plan/use/author/limits, verify free server-side protection covers every intended URL, approve the exact clean artifact and persistent backend, then validate real HTTPS/proxy/auth/cache behavior. No need to deploy a frontend that appears functional while its backend or perimeter is missing. If a gate cannot be satisfied on Hobby, remain blocked; no paid upgrade, public-repo conversion, identity rewrite, Origin bypass or public backend is authorized.

Publication/deployment require separate explicit approval. Source SHA and generated-artifact checksum in the final delivery are the review targets. None of this authorizes changes to the original repository/site or local WSL2 installation.
