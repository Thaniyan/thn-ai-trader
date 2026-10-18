# THN AI Trader: free local Windows + WSL2 staging

This package runs on **your computer**, not Codex's remote workspace. No hosting account, Vercel deployment or paid AI key is required. Application code includes the committed P1 fixes; `manifest.json` records the exact packaged commit. It never enables live brokers.

## What runs locally

Windows Edge/Chrome → `https://localhost:8443` → Caddy on WSL loopback → static `frontend/public`, or `/api/*` → Node on `127.0.0.1:3000` → private persistent SQLite and the paper worker. Caddy's admin endpoint and HTTP redirect listener are disabled; HTTP/3 is disabled, so only the two loopback TCP ports are used. The staging-only Node preload forces loopback and API-only routing without changing application source. The application's old startup log may still print 0.0.0.0; use the actual listener check below, which must show 127.0.0.1. The original generic Vercel/persistent-host staging templates remain available under `backend/deployment/staging/` but are not activated locally.

All generated credentials, databases, WAL files, logs, backups and CA private keys live in `.local-staging/`, outside the static frontend. Only the public CA certificate is exported when requested. Do not upload this runtime directory or make it publicly accessible. Keep it on Ubuntu's Linux filesystem, **not `/mnt/c`**, for SQLite locking and private permissions.

Required: Windows with WSL2 support, Ubuntu 24.04 LTS, Node 24.x (minimum 24.5), Caddy, Python 3, curl, CA certificates, unzip and xz utilities. The installer supports x86-64 and ARM64 and installs Node/Caddy inside `tools/`, not as system services. Node uses its built-in SQLite. The current runtime uses built-in Node APIs; no paid SDK or npm installation is required to start it. Optional repository dependency installation should use its existing Bun 1.4.2 frozen lockfile. Do not install a system Caddy service or create Windows port-forwarding rules.

## 1. Install WSL2

Open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu-24.04
wsl --set-default-version 2
```

Restart Windows if requested. Open Ubuntu from Start, then create a Linux username/password. The Linux password is for local `sudo`, not your THN login. If WSL is already installed, check `wsl --list --verbose`; the Ubuntu distribution must show version 2. Use `wsl --list --online` if the distribution name is unavailable. Do not uninstall an existing distribution containing your data.

## 2. Transfer and verify the package

First transfer **thn-ai-trader-local-staging.zip** and its **.zip.sha256** file from the Codex remote environment into Windows Downloads. They are not already on your PC. Do not clone GitHub main: the fixes have not been pushed there.

In the environment's Files/file-export interface, if available, navigate to `/workspace/work/` and download both exact files. The package is at `/workspace/work/thn-ai-trader-local-staging.zip` and the checksum at `/workspace/work/thn-ai-trader-local-staging.zip.sha256`. A direct chat attachment is not guaranteed by this managed environment. If you have neither file export nor already-authorized SSH access, **transfer is blocked until that platform capability is available**; the local setup itself is prepared. Do not start a public download server or provision hosting to work around this.

Only if you already have authorized SSH access to this same workspace, this existing-access transfer method works in normal PowerShell (replace the existing account/host; SSH access was not established or verified in this session):

```powershell
scp EXISTING_USER@EXISTING_CLOUD_HOST:/workspace/work/thn-ai-trader-local-staging.zip "$env:USERPROFILE\Downloads\"
scp EXISTING_USER@EXISTING_CLOUD_HOST:/workspace/work/thn-ai-trader-local-staging.zip.sha256 "$env:USERPROFILE\Downloads\"
```

This copies files only; it does not start a service or deploy anything. Continue only once both files are actually in Windows Downloads.

In normal Windows PowerShell, check the downloaded archive:

```powershell
Get-FileHash "$env:USERPROFILE\Downloads\thn-ai-trader-local-staging.zip" -Algorithm SHA256
Get-Content "$env:USERPROFILE\Downloads\thn-ai-trader-local-staging.zip.sha256"
```

The hashes must match. In Ubuntu, replace `YOUR_WINDOWS_USERNAME` below with your Windows profile folder name:

```bash
sudo apt-get update
sudo apt-get install -y curl ca-certificates python3 unzip xz-utils
cd ~
cp "/mnt/c/Users/YOUR_WINDOWS_USERNAME/Downloads/thn-ai-trader-local-staging.zip" .
cp "/mnt/c/Users/YOUR_WINDOWS_USERNAME/Downloads/thn-ai-trader-local-staging.zip.sha256" .
sha256sum --check thn-ai-trader-local-staging.zip.sha256
unzip thn-ai-trader-local-staging.zip
cd ~/thn-local-staging
python3 local/validate-package.py .
```

Do not unzip over an older working environment. Preserve its private state and use a separate folder for a new release. The release manifest checks source/configuration integrity; it never contains runtime secrets.

## 3. Install free local tools and initialize

From `~/thn-local-staging` in Ubuntu:

```bash
bash local/install-tools.sh
export PATH="$PWD/tools/bin:$PATH"
node --version
caddy version
node local/manage.mjs init
node local/manage.mjs start
node local/manage.mjs verify --restart
```

The tool installer downloads official Node 24 archives and Caddy 2.10.2 and verifies published SHA-256/SHA-512 checksums. It preserves existing tool installations. Downloads require internet; installation never provisions hosting or starts a system service. `init` creates independent random local authentication/encryption material with private permissions. Running it again preserves existing keys and data. Existing runtime state without its credentials is refused, never silently initialized with a replacement key. `start` rejects occupied ports instead of stopping unrelated programs.

`verify --restart` uses certificate-verified HTTPS (not `-k`), creates a clearly local paper account, checks login/cookie forwarding/CSRF/ownership/non-paper denial, restarts only its managed services and verifies persisted accounts. Existing browser sessions are deliberately revoked by backend restart. It does not submit market orders or use a paid AI API.

## 4. Trust your own HTTPS certificate in Windows

After the first successful start:

```bash
node local/manage.mjs certificate
explorer.exe .
```

This exports only `THN-local-root.crt`. In Explorer, note the full WSL path. Open **normal PowerShell under the Windows user who will run the browser**. Replace the Linux username/distribution if different:

```powershell
Import-Certificate -FilePath "\\wsl.localhost\Ubuntu-24.04\home\YOUR_LINUX_USERNAME\thn-local-staging\THN-local-root.crt" -CertStoreLocation Cert:\CurrentUser\Root
```

Save the returned certificate thumbprint. Import only the public certificate generated by this local environment; never export/import CA private keys or trust a certificate supplied by someone else. This changes only your current Windows user's certificate store. The local launcher never changes system trust automatically.

Restart Edge/Chrome and open **https://localhost:8443**. Use exactly `localhost`, not a WSL IP or `127.0.0.1`, because the configured origin/certificate are for localhost. Confirm the browser reports a trusted HTTPS connection without bypassing warnings. Firefox may need a separate local-root import into its own certificate store.

In Ubuntu, display your local login token only when you need it:

```bash
node local/manage.mjs token
```

Paste it into the application's account-access form. It is a dedicated local token, not a production credential. The form clears the token and uses an HttpOnly session cookie. Do not paste it into screenshots, issues or shared logs. A second independent local identity is available with `node local/manage.mjs token secondary` for ownership tests.

## Daily commands

Always run inside the package root. In each new Ubuntu terminal:

```bash
cd ~/thn-local-staging
export PATH="$PWD/tools/bin:$PATH"
```

| Action | Command |
| --- | --- |
| Start | `node local/manage.mjs start` |
| Status | `node local/manage.mjs status` |
| Validate HTTPS/authentication | `node local/manage.mjs verify` |
| Restart and validate persistence | `node local/manage.mjs verify --restart` |
| Check real free market provenance | `node local/manage.mjs market-check` |
| Stop gracefully | `node local/manage.mjs stop` |
| Export public CA certificate | `node local/manage.mjs certificate` |
| Private consistent backup | `node local/manage.mjs backup` |
| Reset paper data | Stop, then `node local/manage.mjs reset --confirm-local-reset`, then start |
| Restore | Stop, then `node local/manage.mjs restore BACKUP-NAME --confirm-local-restore`, then start |
| Stale SQLite lock recovery | Stop all managed services, then `node local/manage.mjs recover-lock` |

Backup prints its name; private backups are under `.local-staging/backups/`. They contain a consistent SQLite snapshot, checksums and matching local configuration/key. Never share them as release packages. Restore accepts only a matching backup from this dedicated local instance, verifies hashes/integrity/paper-only accounts, archives current data, and restores without reusing WAL/SHM files. Reset archives rather than deletes the previous database and matching keys; it preserves your current login/key configuration. Restoring an earlier snapshot removes newer records from the active database—review the archived data before treating the old state as authoritative.

Stop before closing Ubuntu or running `wsl --shutdown`. If Windows/WSL is terminated abruptly, the exclusive SQLite lock may remain. `recover-lock` refuses live or malformed locks; never delete a lock to bypass a running writer. The supervisor tracks PID start identity and exact local command markers before signalling processes; it does not kill whatever happens to occupy a port.

## Validation on your Windows computer

1. Confirm Windows/WSL loopback forwarding: the browser loads localhost without a public IP, DNS change, portproxy or router forwarding. Do not accept a broad public Windows firewall exception. In Ubuntu, `ss -ltnp | grep -E ':3000|:8443'` must show `127.0.0.1`, not `0.0.0.0` or a LAN address. In PowerShell, review `Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000,8443 }` if listeners are visible there. Stop if Windows reports a broad network listener.
2. Verify trusted HTTPS, CSP/security headers and `/api` no-store behavior. Browser DevTools must show Secure/HttpOnly/SameSite=Strict cookies; frontend requests stay same-origin. No token/key appears in static assets or browser storage.
3. Login, refresh and open a second tab; sessions persist while the backend remains running. Logout rejects old cookies. Sessions expire after eight hours. Backend restart requires login again, but balances/ledger/account ownership survive.
4. Create paper accounts only. Check primary vs secondary ownership. Invalid login, wrong Origin, anonymous private APIs and read-only execution must fail. There is no public identity signup; configured-token login and authenticated paper-account registration are the supported flows.
5. Run `market-check`. Fresh real quotes must also have current verified candles. Stale/closed/outage data remains blocked, not replaced with synthetic prices. Real provider availability depends on your network and market hours. Then test paper orders/limits/cancel/partial/full closes, mandatory stop/risk limits, server TP/SL with the browser closed and idempotent retries. No live broker is enabled.
6. Test EN/AR, narrow/mobile widths, chart controls/levels, watchlist hide/restore, custom scanning, opt-in notifications and cross-tab duplicate prevention. Browser notifications need explicit permission. Browser scanning needs an open page; the paper worker needs the running backend.
7. Backup, stop, reset, start, stop, restore, start and verify. Missing/wrong encryption keys must refuse startup—use disposable copied local data for destructive recovery tests, never production. Keep the exact matching key with every backup.
8. Check resource use, private log growth and failures during a realistic paper-only soak. Verify Windows sleep/WSL shutdown behavior; paper protections do not execute while your computer/WSL/backend is stopped. This is not continuous hosted availability.

Existing automated regression tests are included under `backend/tests/` and need no paid key:

```bash
cd ~/thn-local-staging/backend
export PATH="../tools/bin:$PATH"
npm run build
npm run lint
npm test
npm run test:load
```

Optional Chromium browser regressions in WSL:

```bash
sudo apt-get install -y python3-venv
python3 -m venv .browser-venv
source .browser-venv/bin/activate
python -m pip install playwright
python -m playwright install --with-deps chromium
npm run test:browser
```

The browser suite enforces the application CSP and uses isolated provider fixtures and explicit response interception; it does not validate the real Windows browser trust store. Actual Windows HTTPS, notification permissions and free-provider behavior remain independent checks. Automated fixtures are test-only and are never loaded by the local runtime launcher.

## Optional AI and external services

OpenAI is off by default even if the parent shell has an unrelated OPENAI_API_KEY. All setup/tests work without a paid key. Optional TradingView/fonts/free market endpoints may need internet and can be blocked by your network; report that honestly. If you later explicitly choose paid AI, use a dedicated non-production key via `THN_LOCAL_OPENAI_API_KEY` (and optional `THN_LOCAL_OPENAI_MODEL`) before starting services. That can incur your provider's charges; it is not required for zero-cost staging. Never use production broker credentials. No key or configuration enables live trading.

## Troubleshooting and rollback

- **Certificate warning:** verify you imported this instance's public root into the same Windows user's store and used localhost. Do not disable TLS verification or weaken cookies/CSP. Remote Codex checks cannot establish Windows trust.
- **Port occupied:** choose another application to stop yourself, or investigate; the launcher will not terminate it. The prepared local origin/ports must stay consistent.
- **Missing tools:** re-run the user-space installer with working internet, then export PATH. A checksum mismatch stops installation.
- **Private permission error:** move the entire package into Ubuntu's home filesystem, not a Windows-mounted directory. Do not loosen permissions to make it run.
- **Provider unavailable/market closed:** health can be good while analysis is blocked. Do not substitute invented data or claim an actionable signal.
- **Lost credentials file:** stop managed services. Restore `credentials.json` only from your matching private `.local-staging/backups/BACKUP-NAME/` snapshot using `cp`, then `chmod 600 .local-staging/credentials.json`; use the restore command above. Do not run init against existing database state or import someone else's keys.
- **Startup/recovery error:** inspect the private `.local-staging/supervisor.log` locally; do not upload raw logs or credential files. Stop all managed services before recovery.
- **Rollback:** stop, preserve the private state/backup, and use a previously verified compatible package in a separate Linux directory. Do not overwrite the runtime directory blindly or copy active WAL files. Restore only matching keys and reconciled snapshots. Never roll back to the insecure production baseline for public use.

To remove local certificate trust after testing, stop services and remove only the saved thumbprint from `Cert:\CurrentUser\Root` in normal PowerShell. Removing the generated runtime folder destroys local keys/data unless you have a private matching backup. This package performs no Vercel deployment, Git push, infrastructure provisioning, or production changes. Local tests do not establish production readiness or trading profitability.
