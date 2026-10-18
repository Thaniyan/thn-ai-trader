# Local staging verification record — 2026-10-13

Application P1 base: `7b87c44d56b025374873b187e246d2ef029ca376`. The downloadable package's manifest identifies the final configuration/documentation commit. No application source was changed during this local staging preparation. Existing generic staging templates were preserved. No push, deployment, provisioning, purchase, production settings changes or live broker execution occurred.

## Passed in the Codex Linux execution environment

- Node 24.19.0: build and lint (17 application/script files).
- Backend unit/integration suite: 39 passed, 0 failed; existing system checks: 10 passed, 0 failed.
- Existing Chromium browser regressions and fixture load test passed. Fixture timings do not establish production capacity; browser instrumentation is not Windows trust validation.
- Free Caddy 2.10.2 downloaded into scratch storage and verified against published SHA-512; local Caddyfile validation passed.
- Real Caddy HTTPS with certificate/hostname verification: static frontend and API routing, private-state URL denial, Secure/HttpOnly/SameSite cookie forwarding, CSRF rejection, anonymous rejection, account ownership, paper-only registration, logout and session revocation on backend restart.
- Backend restarted with persisted local SQLite accounts and matching generated managed key. No paid AI key used.
- Actual listeners verified at `127.0.0.1:3000` and `127.0.0.1:8443`. No public HTTP redirect or Caddy admin endpoint.
- First-run idempotence, private consistent snapshot, explicit reset confirmation, restore path guard, archived reset, matching-key snapshot restoration and subsequent HTTPS restart verification.
- Lost local credential configuration refuses first-run replacement against existing state. Reset refuses occupied ports without changing the database.
- Graceful stop shuts down only tracked local processes. Already-exited/zombie processes are treated as exited; PID start identity plus exact local command markers guard process signalling.
- Real free-provider quote/candle provenance passed through the local HTTPS proxy on this check; data stayed non-executable for live trading. Future network availability and market hours can produce a blocked result, not synthetic fallback.
- Local helper JavaScript/Bash/Python syntax checks passed. Release builder exports only committed allowed paths, excludes generated runtime/legacy data, and emits per-file and ZIP checksums.

The exact free tool installer was also exercised: published archive checksums passed; it installed Node 24.21.0 and Caddy 2.10.2 into the scratch package only. Packaged build/lint, 39 backend tests and 10 system checks passed on that Node version. Final package HTTPS/restart/private backup checks and release hashes passed without npm dependencies or a paid key.

## Transfer limitation

The managed executor cannot create the designated chat-download output directory and has no direct file-attachment tool. The sanitized ZIP/checksum are saved under `/workspace/work/`; use an available workspace file-export interface or already-authorized SSH file transfer as documented in the guide. No public download service or infrastructure was created. Actual export capability and Windows transfer remain unverified.

## Requires the user's Windows computer

WSL2 installation/architecture, Ubuntu tools download on that network, Windows localhost forwarding/firewall, actual Windows root-certificate import and trusted browser HTTPS, Edge/Chrome/Firefox behavior, notification permissions, Windows sleep/WSL shutdown, eight-hour session expiry, free-provider reachability and sustained paper-order/worker behavior. Existing automated fixtures verify execution/risk/freshness logic without paid APIs, but do not replace those machine-specific checks.

The beginner guide is `docs/local-windows-staging.md` (packaged as START-HERE.md). Local staging is ready to transfer/test; this does not establish production readiness, continuously available hosted protection or improved trading profitability.
