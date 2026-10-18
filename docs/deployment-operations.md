# Controlled deployment and operations

Status: templates prepared; hosted topology and integrations NOT independently verified. No deployment or production changes are authorized by these files. Live broker execution stays disabled in code. There is no environment switch to enable it.

## Architecture and prerequisites

Vercel serves only `public/`. A single persistent Node 24.x process (minimum 24.5) hosts `/api`, SQLite, and the paper worker on a VM/container with a private durable local volume. Do not put SQLite on ephemeral `/tmp`, a Vercel Function filesystem, or a shared network filesystem. Never start a second backend writer or a separate worker against the same directory. Sessions are process-local; restart requires login again. This architecture intentionally does not support horizontal backend scaling.

Use `deployment/vercel.frontend.json.example` as an explicitly reviewed template, not an active root configuration. Replace the backend destination and copy it to the Vercel project's configuration only after approval. Confirm Node 24.x in project build settings. There are no secrets in frontend build variables. Backend variables belong exclusively to the persistent host. Configure Bun 1.4.2/frozen lockfile in the build environment. The build script is syntax verification; the static deployable output is `public/`.

The rewrite preserves the frontend's relative `/api` requests. Configure `THN_PUBLIC_ORIGIN` to the exact browser-facing HTTPS origin, including staging separately. Verify Vercel forwards Origin and Set-Cookie, Secure/HttpOnly/SameSite=Strict login, logout, and authenticated POSTs. Never cache authenticated API responses. Test headers at the final browser-facing edge: backend CSP does not protect Vercel-served static pages; the frontend template supplies matching security headers. Each preview domain requires a matched isolated backend/origin or must keep account operations unavailable. Do not share a production backend with arbitrary previews.

Provision TLS to the backend, host firewall, least-privilege service user, resource limits, monitoring and private storage mode 0700. Keep its database/key private, with private backup permissions. Adapt the systemd example paths and `ReadWritePaths` for staging. Its 40-second stop timeout exceeds the application's 30-second drain deadline. The backend endpoint is still authenticated even if reached directly; evaluate a tested edge-to-origin access restriction separately without weakening application auth.

## Configuration

Use the staging/production environment templates. Provide a random authentication token (32+ characters recommended), or valid JSON `THN_AUTH_USERS` records `{id,token}`. Set the public HTTPS origin and absolute durable `THN_DATA_DIR`. For managed encryption, supply a separately stored `APP_ENCRYPTION_KEY`; never change it against existing encrypted data without a verified migration. If using the generated `.vault_key` instead, configure a durable data directory and preserve that exact file. Do not print tokens, keys or env contents in logs. Staging uses entirely separate credentials, encryption material, data and hostname.

OpenAI is optional. Leave its key empty until egress, authorization, model availability, budgets and real-service tests are verified. Existing broker adapters remain disabled regardless of credentials. Binance/Yahoo data are indicative paper data, not verified executable broker quotes; verify licensing, freshness and operating sessions. Safe data failure should suspend execution, not substitute fabricated quotes.

## Shutdown and lock recovery

SIGTERM/SIGINT stop acceptance, reject further requests on existing connections, stop future worker ticks, and wait for accepted requests plus active worker/transactions. On success SQLite is checkpointed/closed and `.writer.lock` released. Deadline is 30 seconds; a timeout exits nonzero and leaves transaction recovery to SQLite on restart. A SIGKILL may leave a stale lock.

Stop the supervisor and establish exclusive maintenance access before recovery. Work in the same host/container PID namespace as the writer. Do NOT run recovery against a remotely mounted directory or while another supervisor can restart a writer. Run:

```sh
THN_DATA_DIR=/var/lib/thn-ai-trader node scripts/recover-writer-lock.mjs --service-stopped
```

The tool refuses live, inaccessible, malformed and changed locks. A reused PID is deliberately refused; investigate manually. Recovery is never automatic. Confirm no writer is using the database, retain a forensic backup, then restart exactly one process. Never delete a live lock or a WAL file. Inspect failed startup logs; do not put restart loops around manual lock deletion.

## Backups and restore

Use SQLite's backup API rather than copying an active database file:

```sh
THN_DATA_DIR=/var/lib/thn-ai-trader node scripts/backup-sqlite.mjs /private/backups/release-unique.sqlite
```

The destination must be new. The snapshot is private and integrity-checked; treat a failed output as unusable. The API produces a consistent snapshot including committed WAL content. Separately retain the matching encryption key/managed-secret version, application commit, configuration version and UTC backup time. Encrypt off-host backups and test retention/access controls. Set backup frequency and retention from agreed RPO/RTO; verify restores before release.

To restore, put the edge in maintenance mode, stop the service and supervisor, confirm no writer, archive the entire current state directory (including WAL/SHM/lock) and post-backup fills/audit data. Restore into a NEW private directory with the snapshot named `state.sqlite` and the matching encryption material. Do not combine an old snapshot with current WAL/SHM files. Run `PRAGMA integrity_check`, verify schema/app compatibility and reconcile balance, positions, ledger and idempotency before routing traffic. Restoring an older snapshot loses subsequent records unless reconciled; never silently overwrite them.

## Health and monitoring

Probe `/api/health` for process availability/version and `liveExecutionEnabled:false`; it is not a provider, worker or persistence guarantee. Inspect `/api/readiness` for observed market/OpenAI readiness. Alert on stale/unavailable pricing, repeated worker errors, failure to update active-position `lastSyncAt`, process restarts, shutdown deadlines, lock errors, filesystem capacity/inodes and backup age. Test an authenticated account/ledger synthetic check with a dedicated non-trading identity and no secret logging. Monitor HTTP errors/latency and queue saturation. Establish alert thresholds in staging; automated health alone must never enable live execution.

## Staging gate, deployment and rollback

1. Keep production auto-deployment disabled for review pushes. After explicit push approval, push a review branch, run CI and review exact SHA. Merge and deployment require separate approval.
2. Prepare isolated staging, use a tested Node 24.x runtime and install frozen dependencies. Run build, lint, complete tests, browser tests and fixture load tests.
3. Verify real HTTPS login/logout and origin checks through Vercel, chart interactions and mobile EN/AR, watchlist persistence, custom scanning, opt-in notification permissions/deduplication, and paginated journals. Browser scanning requires an open page; server paper protection requires the persistent worker.
4. Verify real market outages/staleness, sustained paper execution, SIGTERM draining, supervisor behavior after SIGKILL, explicit stale-lock recovery, backup restore, and resource/latency limits. OpenAI/TradingView are separate integration gates. No profitability claim follows from these checks.
5. Before approved release, retain previous verified artifact and consistent backup/key; briefly quiesce the single writer. Never do a rolling two-writer backend deployment. Start the reviewed version, check health/auth/ledger/worker and then restore edge traffic with live execution still disabled.
6. Roll back application artifacts only when compatible with current database schema; this change adds an index without destructive schema changes. Use maintenance mode and a quiesced backend. Prefer retaining the current database to avoid lost fills. If storage restore is necessary, follow the restore/reconciliation procedure above. Restart revokes sessions. Verify exact artifact SHA, balances, journal and worker before routing traffic.

Do not roll back to the original insecure baseline on the public internet. If no known-safe artifact is available, remain in maintenance mode. Hosting, disaster recovery, operational monitoring and external integrations remain release blockers until independently demonstrated.
