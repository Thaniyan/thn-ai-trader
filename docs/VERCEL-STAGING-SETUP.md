# Separate Vercel staging frontend — implementation and owner setup

Prepared 2026-10-17, Asia/Muscat. This is a staging-only implementation, **not a deployment authorization**. Production `Thaniyan/thn-ai-trader`, its Vercel project/domains and working WSL2 installation are excluded. No Vercel account is assumed connected.

## Source and reuse

Initial HEAD was clean at published staging main `75110ec2ca317ae0a873268f42a577636f250dbd`; native Git confirmed the remote SHA. The previous local preparation commit `09fd770a54c45d8665ede7c2f6de09b97710d2aa`, its files and saved source package are absent from this fresh workspace. No unpublished remote branch was invented or fetched to reconstruct it. The published `deployment/staging/backend.service.example`, preflight design, Node24 single-writer runtime and existing SQLite backup/lock-recovery scripts are reused. Dedicated Vercel integration changes remain separate; application/server/public originals are unchanged.

## Prepared artifact and settings

Recommended separate project name: **thn-ai-trader-staging-frontend**, in the owner's independently verified eligible personal scope. Never select the original production project. Generated project contains only frontend assets and a local build verifier:

- Framework: Other / `framework:null`.
- Node: **24.x**, checked >=24.5 by build/verifier; current Vercel official source includes Node24 support.
- Root: the **generated artifact directory**, outside the Git checkout. No backend server or API/function directory is uploaded.
- Output: `public`; build command: `node verify-build.mjs`; install command overridden empty (no dependencies). Current frontend is plain HTML/CSS/JS, not a framework bundle. Do not inherit the repository's server start command.
- Git: `git.deploymentEnabled:false` in generated vercel.json; no Git connection or deploy hook is required. Dashboard must independently confirm Git deployments disconnected/disabled; local JSON is not proof of account-side state.
- Every path retains the application's CSP, nosniff, frame denial, no-referrer and HSTS; all frontend/API paths use browser/CDN/Vercel-CDN no-store. No API/session response is intended to be cached.
- No production credentials/endpoints, databases, keys, WSL2 state or live broker integrations. No serverless trading runtime, cron or fake backend.

## Safe local generation (no account or deployment)

From the staging checkout with Node24:

```bash
node deployment/vercel-staging/build.mjs --output /absolute/new-staging-frontend
cd /absolute/new-staging-frontend
node verify-build.mjs
```

Default has **no backend URL**. API rewrites return a static `ok:false`, STAGING_BACKEND_UNCONFIGURED metadata document; that static GET may be HTTP200, so it is never treated as health/authentication success. POST behavior on static hosting may be405/404; no operation exists. UI shows only truthful navigation/language/layout review. The original workstation markup is inert in a template; app.js is not loaded until an exact persistent-backend handshake succeeds. Even no-JavaScript browsers see an unavailable notice rather than sample balances/signals. This is availability gating, not an access-control layer.

For a separately approved durable backend, generate a new artifact:

```bash
node deployment/vercel-staging/build.mjs --output /absolute/new-connected-frontend --backend https://staging-backend.YOUR-APPROVED-DOMAIN
```

Replace the uppercase domain with a real approved dedicated hostname. The generator rejects .invalid/.test placeholders, user/password URLs, non-HTTPS, paths/queries, production and serverless .vercel.app backend targets. Never deploy old `deployment/vercel.frontend.json.example` / `deployment/staging/vercel.json.example` placeholder templates; the generator and new `deployment/vercel-staging/vercel.template.json` supersede them for this workflow.

Manifest records source commit, clean-tree status, mode and all payload SHA-256 hashes. Generation from a dirty development checkout is explicitly marked; normal build verification refuses it. THN_LOCAL_BUILD_TEST=1 is used **only by local test runners** and must never be configured on Vercel. Final delivery generates a clean committed artifact. Validate the manifest and exact source SHA before any future upload. No `vercel` command is invoked by generation or tests.

## Owner steps — STOP until separate approval

These are future external actions, **not executed**:

1. Verify Hobby eligibility, repository ownership type, project scope, commit-author requirements and all limits under VERCEL-STAGING-ACCESS.md. Stop if paid upgrade, commercial eligibility or unsupported private organization integration is required. Never make the repo public or forge author metadata.
2. After explicit project-creation approval, create an **empty separate project**, e.g. `vercel project add thn-ai-trader-staging-frontend --scope OWNER_SCOPE` using the owner's verified current CLI. Do not use a Git-import wizard that triggers an immediate deployment before access protection is configured. Do not link the original project or connect Git integrations.
3. In that exact project's Settings, verify Node24, Other framework, public output, local verifier build and empty install override. Confirm no Git repository/deploy hooks/production domains or shared environment secrets. Configure Vercel Authentication for protected Preview URLs under an entitlement actually available to the plan. Read back protection (current CLI has `vercel project protection PROJECT --scope OWNER_SCOPE`) and record owner evidence; this read command has not been executed here.
4. Verify the exact intended URL type is protected **before exposing application content**. Standard protection mode may exclude project production domains even when immutable deployment URLs/previews are protected. A private repo is not a private website. If available controls cannot protect the intended URL, keep deployment blocked; do not purchase an upgrade or disable protection.
5. Only after a separate approval for the exact clean artifact/SHA and protected target: link the artifact directory to **this project only**, then manually create a **Preview** deployment with the owner's CLI (`vercel deploy --scope OWNER_SCOPE`, without --prod). Recheck `.vercel/project.json` scope/project IDs privately. No command is authorized merely by inclusion here. Do not upload backend runtime/config/backups. Do not bypass plan/author restrictions using another scope or altered commit identity.
6. Verify incognito denies every intended URL/alias, including root/static/API, and no alternate production-domain alias exposes the deployment. Keep default production alias unused/unassigned to the reviewed Preview; if URL coverage is uncertain, stop/revoke exposure through separately approved owner action.
7. For connected mode only, pin backend THN_PUBLIC_ORIGIN to the **exact approved frontend Preview URL** and restart the owned staging backend under separate approval. Each changed Preview hostname requires a new explicit origin review; do not accept wildcard origins. A stable staging Preview alias is optional only if its access coverage is verified. Run external acceptance in VERCEL-STAGING-INTEGRATION.md before sign-in/paper use.

## Production-isolation checklist

- Selected Git source/release is only Thaniyan/thn-ai-trader-staging; original repo unchanged.
- Separate Vercel project ID/scope reviewed; no `.vercel` link to original project; no --prod deployment or original-domain reassignment.
- No production API URL, secret, account, database, broker credential or WSL2 file imported. No Vercel/Render/AI Studio integration settings changed by this task.
- Automatic Git deployments remain disabled/disconnected; no workflows or deploy hooks created.
- Persistent backend is one isolated Node24 process/worker with dedicated durable SQLite/key and independent access protection; no public unauthenticated administration or analysis endpoint.
- Private snapshots/rollback tested; live adapters remain disabled. A backend or frontend rollback never resets data or weakens price guards.
- Actual edge protection, Origin/auth/Set-Cookie/cache behavior and owner browser checks pass before declaring online staging ready.

See VERCEL-STAGING-VALIDATION.md for actual local tests. There is no online URL to review yet.
