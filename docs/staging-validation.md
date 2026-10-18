# Isolated staging architecture and approval plan

Prepared 2026-10-13. Application release: `7b87c44d56b025374873b187e246d2ef029ca376` on `work`. No push, provisioning, deployment, production settings changes or real-account access authorized. Live broker adapters stay disabled in code; there is no live-enabling environment flag. Templates are inactive, credential-free and use reserved placeholder domains.

## Recommended topology

Browser → dedicated staging Vercel project/domain → same-origin `/api/*` rewrite → HTTPS staging backend reverse proxy (Caddy) → one Node 24.x process, minimum 24.5 → dedicated SQLite directory on persistent local SSD. The same process owns the paper worker. Use a dedicated VM, service user and database/key; do not share a backend, volume, account credentials or secret bindings with production. There is no database migration requirement for this staging topology.

The frontend artifact contains only `public/` and static Vercel configuration. It has no `server.js`, database, secrets or Node Function entrypoint. Backend artifact preparation exports the committed application using an allowlist and excludes existing root legacy account/audit JSON files, generated vault keys, runtime directories, tests and installed dependencies. This matters because normal backend startup can import root legacy JSON when no SQLite accounts exist. A fresh staging database should create only the new internal paper sandbox.

## Hosting comparison

Planning estimates below are not researched current vendor quotes; verify regional availability, pricing, taxes, backup charges and current volume/deploy semantics before purchase. Vercel/domain charges are additional.

| Option | Compatibility and reliability | Operations/scaling | Indicative monthly staging budget |
| --- | --- | --- | --- |
| Dedicated VPS (Hetzner/DO/Lightsail or equivalent) | Best fit: persistent local SSD, one systemd process, controllable signals/permissions/backups | OS patching/TLS/monitoring required; vertical scaling, manual failover; no automatic second writer | Roughly USD 5–25 compute, 15–40 including backup/monitoring allowance |
| Render paid persistent web service + disk | Potential fit if one persistent instance and exclusive disk mount are guaranteed | Simpler platform management; verify deployment overlap, recovery shell, region and disk backup/export behavior | Roughly USD 15–40+, subject to current plan/disk pricing |
| Railway service + volume | Potential fit with one replica and exclusive volume ownership | Easy app management; verify volume redeploy behavior, resource billing, signal grace and export/restore | Roughly USD 10–40+, usage dependent |
| Fly Machine + local volume | Fits a single machine with deliberate volume ownership | More volume/region/host-failure management; replicas cannot independently write the same SQLite state | Roughly USD 10–40+, topology dependent |
| Vercel Functions backend | Incompatible unchanged: ephemeral storage, independent invocations, local sessions and timer worker | Would require shared durable services and a separate worker | Not recommended for this backend |

Recommend a dedicated Ubuntu LTS VM with 2 vCPU / 2 GB RAM as an initial staging target, local SSD, systemd and Caddy. Treat sizing as a hypothesis to test, not production capacity. A region close to testers and permitted providers reduces network latency. Enable encrypted off-host backups and operational alerts before relying on data. Single-host failure remains a known availability limit. Do not scale to multiple writers; only consider PostgreSQL/shared sessions/distributed workers when a demonstrated scaling/availability requirement justifies that change.

## Architecture boundary review

- **Cookies:** frontend fetches relative `/api`, so browser authentication stays same-origin without a permissive CORS policy. Cookies are host-only (no Domain), HttpOnly, SameSite=Strict, eight-hour Max-Age; Secure depends on explicitly setting the HTTPS public origin. Verify Vercel forwards both Cookie and Set-Cookie, including logout, without caching. Browser reload should retain login; restart intentionally revokes every in-memory session.
- **CSRF/origins:** POSTs and logout check Origin when supplied, against the exact `THN_PUBLIC_ORIGIN`. Ownership and permission checks remain mandatory. No wildcard allowed origin, no Access-Control-Allow-Origin reflection and no credentialed cross-origin design. Requests without Origin are supported for authenticated non-browser clients; do not infer that CORS is authorization.
- **Proxy trust:** application does not consume forwarded client addresses or protocol for authentication. Use the configured HTTPS origin rather than Host/proxy inference. Native HTTP listens on 0.0.0.0; firewall port 3000 from public access and route only through Caddy. Do not add broad trust of X-Forwarded-For. Current rate limits use the socket address for unauthenticated traffic, so many users behind Vercel may share a login/provider budget. Load-test this boundary before broader exposure.
- **TLS/security headers:** Caddy terminates origin TLS; Vercel provides frontend TLS. Frontend template supplies CSP, frame denial, nosniff, no-referrer and staging-only short HSTS. Verify final edge headers and HTTPS redirects; no weakening of CSP for tests on the deployed site. CSP permits the existing TradingView/font sources but actual external integration must be checked separately.
- **Routing/cache:** `/api/*` goes exclusively to the staging backend and is no-store, including authenticated GETs and Set-Cookie. Static HTML/assets remain Vercel-hosted. Validate response Cache-Control at the edge; no cookie caching or cached account records. No WebSocket or EventSource/streaming requirement was found; current behavior uses ordinary HTTP requests/polling. Verify edge timeouts for slow scans and OpenAI calls.
- **Workers/storage:** one API and one timer worker in one process; no cluster mode, rolling overlap or autoscaling. Graceful drain deadline 30 seconds; supervisor timeout 40 seconds. SQLite WAL/FULL sync requires persistent local filesystem, private permissions and enough space. A stale lock is recovered explicitly after stopping all supervisors, in the same PID namespace, never automatically deleted.
- **Encryption/audit:** staging gets a new managed encryption key, never a production copy. Startup checks ciphertext compatibility and fails closed on wrong/missing keys. Keep matching key versions with encrypted backups. Audit logs share transactional SQLite storage and append-only triggers; this is not external tamper-proof archival. Logs and monitoring must redact tokens/cookies and payload secrets.
- **Health:** `/api/health` checks process availability/version and live-disabled flag; `/api/readiness` reports observed providers/OpenAI, not a verified worker or filesystem heartbeat. Use additional account/ledger checks, worker/pricing-age monitoring, disk/backup alerts and restore drills. Initially UNAVAILABLE provider readiness is expected before a real request.
- **Identity:** configured tokens, not public signup/OIDC. Paper account registration/linking requires login. User IDs, ownership, token handling and rate limits must be tested; never describe an absent public registration flow as implemented.

## Local artifacts and variables

Existing `deployment/staging.env.example` supplies names with blank secrets. New inactive templates under `deployment/staging/`: `vercel.json.example`, `Caddyfile.example`, `backend.service.example`, `preflight.mjs`, `prepare-release.py`. The original generic production/Vercel templates are unchanged. Preflight validates Node 24.x, HTTPS staging origin, private staging directory, strong configured auth/encryption, port consistency and absence of legacy data in the release. It does not prove keys differ from production; operators must confirm independent generation without reading/copying production secrets. Domain must begin `staging.` for this prepared guard.

Variables (names only): `NODE_ENV`, `PORT`, `THN_PUBLIC_ORIGIN`, `THN_DATA_DIR`, `THN_AUTH_TOKEN`, `THN_AUTH_USERS`, `APP_ENCRYPTION_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`.

Authentication requires THN_AUTH_TOKEN and/or THN_AUTH_USERS. This staging plan requires a dedicated managed APP_ENCRYPTION_KEY. OpenAI variables are optional and its key starts blank. Backend variables never belong in frontend build configuration. Do not add bridge credentials or copy production broker secrets.

## Deployment instructions — approval required before external actions

1. Review the application SHA and local artifacts. Prepare the immutable local release with `python deployment/staging/prepare-release.py /absolute/new/output-directory`. Review manifest hashes; placeholder domains must be replaced in a reviewed config revision. No network or install occurs in preparation.
2. **STOP for approval** of provider, region, spending limit, staging domains, exact SHA and external provisioning/deployment scope. Also review existing production Git/Vercel linkage before any separately authorized push. Nothing in this guide authorizes pushing or merging.
3. After approval, create a distinct Vercel project with no production-main auto-deploy linkage and an isolated VM/project. Scope tokens/secret access to staging only. Never reuse production project settings implicitly. Provide separate staging DNS and TLS; provision OS/user/storage/firewall deliberately.
4. Transfer ONLY the prepared backend to a versioned directory under `/opt/thn-ai-trader-staging/releases/<SHA>`; install verified Node 24.x and Bun 1.4.2; use `bun install --frozen-lockfile` there. No legacy data or production backup import. Configure a fresh private `/var/lib/thn-ai-trader-staging` directory, dedicated private env file and independent secrets through approved management, without logging them.
5. Configure Caddy and install the reviewed staging service under a unique service name. Adjust service paths and read/write policy; use the dedicated thn-staging user. Run preflight in release working directory with staging variables. Link `current` to the chosen release only while service is stopped; start exactly one backend instance. Verify origin HTTPS health before exposing frontend traffic.
6. Review the isolated frontend `/api` destination; deploy only the prepared static frontend folder to the staging Vercel project after approval. Its local `vercel.json` has null install/build commands because source syntax/full tests were checked separately; it contains no server entrypoint. No staging secret in frontend variables.
7. Complete the checklist below, retain evidence with UTC timestamps and commit/config hashes, and conduct a realistic paper-only soak. Record failures as BLOCKED/FAIL; do not promote based solely on local tests.

## Complete independent staging checklist

| Area | Required verification and acceptance evidence |
| --- | --- |
| Isolation | Distinct Vercel project, domains, host/user, database directory, auth tokens, encryption key, backup destination; no main automatic deployment or production credentials. Fresh paper-only accounts/empty audit origin. |
| Frontend | Real CSP enabled; EN/AR at 390/768/1440px and DPR2, navigation, charts/pan/zoom/levels, watchlist hide/restore, custom scanner intervals, journal pages, notification opt-in/preferences/cross-tab dedup. No browser errors or credential persistence in local storage. |
| Connectivity | Relative API URLs route to the staging backend, no accidental production calls, correct request Origin, successful health/version and live-disabled flag. Backend static root is not publicly served. |
| Login/registration/logout | No public signup expected. Sign in with staging token; create/link only paper accounts. Invalid login/anonymous private APIs rejected. Logout clears cookie and revokes session. No token in logs or browser storage. |
| Sessions | Cookie has Secure/HttpOnly/SameSite=Strict/Path=/; refresh/new tab persists within eight hours, logout removes it, actual expiry rejects after eight hours, backend restart requires login again. No cached Set-Cookie/private responses. |
| Ownership | Two dedicated staging users cannot read, preview risk, execute, close, cancel, reconcile, reset or delete each other's accounts. READ_ONLY cannot mutate execution state. |
| CSRF/CORS | Wrong Origin login/order/reset/logout rejected; exact frontend origin works through proxy. No wildcard CORS or leaked credentials. Non-browser bearer access remains authenticated; do not rely on CORS for account isolation. |
| Paper execution | Market and limit orders, crossing, cancel/reserved margin, retry idempotency, concurrent requests, partial/full closes and server TP/SL without an open browser; totals agree with immutable ledger. |
| Risk | Missing/wrong stops, wrong targets, lot steps, USDJPY conversion, insufficient/zero margin, 2%/6%/daily-loss/position ceilings rejected; non-paper adapters cannot execute. Zero equity/margin remain zero in API and display. |
| Market data | Real permitted providers/timeframes; stale quotes and fresh quotes with stale candles block opportunities/orders. Outage/fallback identity/proxy flags fail safely. Weekend/session/DST and post-open behavior observed. No fabricated candles/quotes, no live-ready claim. |
| AI/integrations | Initially OpenAI disabled honestly. If separately authorized staging key and egress are supplied, verify schema/timeouts/budgets and numerical invariance. TradingView/font/chart behavior checked under actual CSP and network; blocked optional service is reported, not mock-success. |
| Persistence | Restart after committed fills/pending orders; accounts, balances, ledger, audit, idempotency survive. Retry does not duplicate fills. One writer only. |
| Keys | Correct managed key supports restart; missing/wrong key with ciphertext refuses startup without replacement/re-encryption; restore exact staging key and recover. Preserve ciphertext and record identity/version. Never test against production. |
| Backups/restore | Run SQLite-native backup during staging activity, verify private permissions/integrity, retain matching key/version off-host encrypted. Restore into a new staging-only directory, without current WAL/SHM, reconcile fills/balances/idempotency and meet agreed RPO/RTO. |
| Worker/lifecycle | Observe worker price updates and server protections; SIGTERM drains accepted work with checkpoint/lock release. Test staging SIGKILL, supervisor stop and explicit stale-lock recovery; never allow two writers. |
| HTTPS/headers | TLS hostname/chain/redirects; origin port firewall, CSP/frame denial/nosniff/referrer/HSTS on edge; no cached private APIs; no secrets in logs/traces. |
| Performance | Measure real-provider p50/p95/p99, concurrent scans/orders, edge budgets and current proxy-address rate-limit behavior. Test resource saturation without risking production. Local fixture timings are not production capacity. |
| Monitoring | Alert delivery for process down/restarts, repeated worker/provider errors, stale active-position pricing, HTTP errors, disk/inodes, WAL growth, backup age and lock recovery. Health 200 alone cannot pass this gate. |
| Rollback | Maintenance mode; stop single backend, revert to previously verified compatible artifact while retaining current state when possible; require login after restart. If restoring storage, preserve/reconcile post-backup fills/audits first. Verify health/auth/worker/ledger before resuming traffic. |

Use `docs/deployment-operations.md` for exact backup and stale-lock recovery tooling. Never copy active SQLite/WAL files piecemeal, restore old data over new fills without reconciliation, or roll back publicly to the insecure original baseline. Staging frontend and backend must be reverted as a compatible pair; SQLite is not rolled back automatically with code. No automatic promotion to production.

## Remaining blockers

Actual provider pricing/volume guarantees, host/TLS/firewall configuration, Vercel Cookie/Origin forwarding and timeout/caching behavior, proxy-shared rate budgets, eight-hour session soak, operational alerts/restore drills and external integrations are unverified. Sessions are intentionally lost at restart; single-instance availability is limited. Exchange/holiday calendars and broker-specific executable quotes/contracts are not verified, so live trading remains disabled. Record these limits explicitly; no production-readiness or profitability claim follows from a green local suite.
