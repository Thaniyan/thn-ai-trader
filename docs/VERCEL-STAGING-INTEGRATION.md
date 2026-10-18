# Persistent backend contract for the staging frontend

## Topology and security boundary

Protected Vercel **static** Preview -> same-origin `/api/*` external rewrite -> dedicated HTTPS Caddy backend gate -> loopback Node24 -> private durable SQLite + embedded paper worker. No SQLite, worker, encryption key, token or account DTO is stored in Vercel Functions/build output. No browser-side authenticated session is fabricated.

Use the published persistent backend service design, not Vercel serverless. A backend requires one long-lived process, one embedded5s worker, local persistent WAL filesystem, dedicated credentials/key, clock synchronization, private backups and controlled SIGTERM drain. Sleeping/ephemeral hosts do not satisfy this contract. The previous unpublished online-preparation files are unavailable in this checkout; this implementation reuses the published service/backup code rather than claiming they were recovered.

## Dedicated files

`deployment/vercel-staging/backend.service.example` derives from the existing staging unit and selects the dedicated backend-preflight.mjs and backend-preload.mjs. Do not replace production or WSL2 services. Preflight enforces Node24.x>=24.5, exact staging HTTPS frontend origin, private unredirected staging data directory, two fresh identities, fresh64-hex key, loopbackport3000 and no inherited operator/paid AI credentials. Supply fresh values through the dedicated private environment file, never Git or Vercel public/build variables. Existing staging.env.example is a list of names, not real values. Keep OPENAI_API_KEY empty; no paid call is needed.

The preload binds Node to127.0.0.1 and adds `/api/staging-contract` only for this dedicated unit. The contract returns version1, persistent-node-sqlite profile, exact configured frontend origin and liveExecutionEnabled:false. It is liveness/configuration metadata, **not certification of durable cloud disks or fresh prices**. Existing health/readiness/ownership/risk/strict price/session controls remain unchanged. Market/provider failure can degrade analysis independently without hiding a healthy backend. Unpriced Gold futures proxy still cannot execute as XAUUSD.

The new Caddyfile.backend.example gates **all** routes with independent HTTP Basic authentication, serves only `/api/*`, disables its admin API and emits no-store cache headers. The gate credential is independently generated/stored privately; only a bcrypt hash belongs in the proxy's private environment. The proxy process requires its own private THN_STAGING_BACKEND_HOST and THN_STAGING_GATE_HASH environment configuration; setting the application unit environment does not configure a separate proxy automatically. Never log raw Authorization/Cookie/Set-Cookie values. Never bake that password into static assets, rewrite URLs or frontend variables. Standard Vercel external rewrites cannot safely be assumed to inject a private backend credential; response-header configuration is not request authentication.

## Origin, cookies and backend access

1. THN_PUBLIC_ORIGIN is the **browser's exact frontend HTTPS origin**, not the backend hostname. The backend preserves the browser Origin. Never rewrite Origin to force CSRF checks to pass, use wildcard allowlists or trust arbitrary forwarded headers.
2. Frontend fetches remain same-origin `/api/...`. Vercel rewrites to dedicated backend `/api/...`; forwarding of Authorization, Cookie, Origin and multiple Set-Cookie values must be verified on the actual service, not assumed from the local model.
3. Backend gate is independent of Vercel Authentication. `/api/staging-contract` returning401 keeps the workstation unloaded. Owner opens its same-origin access-check link, completes the backend's native Basic challenge, then retries. Browser/Playwright supplies those credentials through native HTTP authentication; no client-side password gate or token-synthesizing login is added. Do not place Basic secrets into URLs. Vercel must preserve WWW-Authenticate/Authorization for this workflow. If the deployed edge strips or consumes them, integration remains BLOCKED pending a separately reviewed gateway design, not an auth bypass or an unprotected backend.
4. Application sign-in POST creates the real backend's HttpOnly, SameSite=Strict, Secure, Path=/ cookie. It is host-only (no Domain attribute); when forwarded through same-origin API it belongs to the frontend origin. Browser never reads it. Basic access does not grant app account access; app logout revokes app session only, while browser may retain Basic gate credentials. Close private profile or rotate gate credentials for perimeter revocation.
5. Every API response requires no-store on browser, CDN and Vercel edge, especially Set-Cookie, auth errors, account/ledger/risk/order responses. No service worker is installed. No optimistic UI fill or retry of a mutating request occurs in the staging bootstrap. Backend idempotency and risk controls remain authoritative.
6. Caddy shares a loopback backend IP across clients; conservative existing internal/provider rate budgets may aggregate owner traffic. Do not weaken limits or trust X-Forwarded-For to bypass them. Provider/edge/internal429s remain distinct.

Before contract verification, all workstation markup remains inert; only navigation, bilingual text and responsive shell work. API metadata returns ok:false in unconfigured mode. After verified contract, original app.js loads and all private state is cleared before display; actual server authentication remains required. Network loss hides the workstation and clears private state. Wrong contract/origin or failed app assets keep it hidden, including retries. This protects truthful availability, **not deployment privacy**. Do not expose without independent verified protection.

## Approved-host operations (not executed)

Provision a fresh dedicated root/data volume/user and exact service/proxy paths only after separate approval. Existing WSL2 and production directories must never be targets. Validate the supplied unit with installed verified Node24 paths, configure private environment mode0600 and data0700, deny public3000/IPv6 bypass, and obtain trusted backend TLS under approved DNS. Node24 preflight plus `/api/readiness` diagnostics are required; health success is not fresh market data.

Backups: reuse `scripts/backup-sqlite.mjs` consistent SQLite backup with the exact private THN_DATA_DIR; separately preserve matching APP_ENCRYPTION_KEY and dedicated auth configuration. Verify integrity and checksums privately; never copy a live WAL DB casually or upload it to Vercel. Same-host backup is not disaster recovery. Approve an independent private backup destination before claiming recoverability.

For a future approved backend transfer, export the exact reviewed commit with the dedicated files included (the older staging exporter predates this integration):

```bash
git archive --format=tar EXACT_REVIEWED_SHA server.js server public package.json bun.lock scripts deployment/vercel-staging > /absolute/new-backend-source.tar
sha256sum /absolute/new-backend-source.tar
```

This exports committed source only, never ignored runtime data. Review archive paths and SHA, extract into a new dedicated release root after transfer/deployment approval, and use the new backend.service.example/preflight/preload, not the old unit. Never upload this backend source tar as the Vercel frontend artifact.

Updates/rollback: retain immutable source and previous revision, take a matching-key backup, stop **only** the owned service, verify writer/port stopped, switch compatible source, restart and verify ownership/account/ledger counts. Preserve DB/key across source rollback; no reset or implicit DB downgrade. Existing `scripts/recover-writer-lock.mjs --service-stopped` must run only after owned-process verification with exact staging data environment; never delete a live lock. Separate review/approval is required for any schema change or destructive DB restore. Published docs/staging-upgrade.md applies to the local kit, not permission to operate on WSL2.

## External acceptance gate

Local tests use a loopback HTTP model and real fixture backend. They prove implementation/header assumptions under that model and inspect Secure cookie attributes under configured HTTPS origin; they do **not** prove a browser HTTPS roundtrip on Vercel or Vercel's forwarding semantics.

After separate deployment approval, test: incognito frontend denial, direct backend denial, no port bypass, exact contract origin, real HTTPS chain, Basic challenge forwarding, app sign-in/cookie flags, both owners/empty accounts, forbidden Origin and foreign-account ledger, logout/restart revocation, cache denial across users, unavailable/stale/proxy provider refusal, all9 views EN/AR/mobile and sanitized browser evidence. No paid AI key, live broker, WSL2 data or real-money action. Stop if any security assumption fails; never weaken authentication/CSRF/CSP to make the proxy work.
