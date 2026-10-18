# Architecture and operational boundaries

The candidate retains the staged architecture rather than introducing a framework
migration. Browser HTML/CSS/JavaScript is served by a persistent Node application;
server-side modules own market data, indicators, optional narrative, identity,
authorization, account state, paper risk, execution and append-only audit storage.

| Boundary | Implementation and constraint |
|---|---|
| Browser | public/index.html, app.js, style.css; nine EN/AR views, server sessions, no authoritative balances or client fills |
| HTTP | server.js; explicit routes, bounded requests, actual CSP, security/no-store headers, Origin checks |
| Identity | server/auth.js; timing-safe token matching, HttpOnly/SameSite cookies, secure cookies with configured HTTPS origin; process-local expiring sessions |
| Market data | server/marketData.js; symbol/currency identity, request coalescing, cache, concurrency/cooldown, freshness/provenance and honest failure |
| Analysis | server/indicators.js and server.js; explicit indicator conventions, heuristic confluence; no validated probability or historical PnL |
| AI | server/openai.js; optional server-side OpenAI narrative, schema/time/budget constraints; immutable numeric levels; disabled without key |
| Paper execution | server/riskEngine.js, brokerAdapters.js, paperWorker.js; server-owned risk, pending limits, TP/SL, fill ledger; external adapters disabled |
| Persistence | server/storage.js; Node built-in SQLite, WAL/FULL sync, serialized immediate transactions, writer lock, ledger and append-only audit triggers |
| Credentials | server/encryption.js; AES-GCM, private key file or managed secret, recovery validation, fail closed for missing/wrong keys |
| Recovery | scripts/backup-sqlite.mjs and recover-writer-lock.mjs; verified backups and explicit stopped-service lock recovery |
| Optional static preview | deployment/vercel-staging; generated public-only artifact, no engine/backend by default, immutable source/asset SHA-256 and exact config policy |

SQLite is single-writer and local-disk oriented. Process-local sessions, request
budgets and caches do not provide distributed coordination. Do not run multiple
writers or treat Vercel serverless filesystem state as durable trading storage.
Restart invalidates in-memory sessions. Append-only audit triggers protect against
application writes, not a privileged database administrator or tampered backup.

Runtime is Node 24.x >=24.5, not original Node >=18: the native SQLite/backup API
and proxy behavior require it. Dependency declaration and bun.lock are unchanged
between source baselines; @google/genai is legacy declared SDK, not an active Gemini
integration. No framework, ORM, cloud database or paid service was introduced.

The generated static project is separate from the connected original production
project. Its git.deploymentEnabled:false and validated project name cannot control
the original project's hosting settings. Original root has no vercel.json or CI
workflow, and that absence is preserved. Hosting isolation remains unverified.
