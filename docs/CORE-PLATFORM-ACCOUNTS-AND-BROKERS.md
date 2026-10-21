# Persistent workspace and broker feasibility

Audit/planning only, 21 October 2026. Original application and website remain
authoritative. No account was connected, credential requested, cloud resource
created or service activated. Findings refer to audited commit
`fad7fe6d03f799bc699401e9fc31004e9b6c1087`.

## Current architecture versus required architecture

The active v7.1 application has no end-user registration/login/session service,
tenant ownership or durable hosted database. Vercel project authentication controls
deployment access; it does not supply application account authorization. The local
paper engine is deliberately opt-in, loopback-bound at normal startup and shared
between requests by one operator. It is not safely exposed by adding an internet
tunnel or switching off the hosted gate.

Current local files are JSON account and audit records under an ignored runtime
directory, with an AES-256-GCM credential helper and adjacent local key (or operator
environment key). Generic account DTOs mask account numbers and omit credential
payloads. Whole-file writes, swallowed persistence errors, in-memory idempotency,
no tenant identity and a rewritable 200-event audit make this unsuitable for hosted
multi-user use. A hash or encrypted credential does not fix those boundaries.

The earlier SQLite/account implementation remains a recovery source, not an active
service. Review and port isolated modules/tests if useful; never merge unrelated
history or copy historical databases, account records, credentials or runtime state.
Fresh account data is acceptable; user-authored browser research must be preserved
or migrated only through explicit preview/consent.

## Recommended zero-additional-cost operating model

**Now:** retain the original Vercel site as an anonymous market-research service,
with browser-local Library/settings plus explicit validated JSON backup/restore.
Keep hosted finance and generative inference disabled. This supports useful core
research without pretending localStorage or function disk is a durable private
database. Browser deletion/device loss requires a user-held backup.

**Conditional next architecture for a small private account pilot:** keep the same
frontend, Node API, domain and deterministic modules; add a narrow repository/data
access boundary backed by external managed Postgres plus managed authentication.
Supabase Free is a reasonable single-provider candidate for Auth/Postgres/RLS,
subject to owner approval, provider terms, region, available free-project capacity
and acceptance of free-tier limitations. This is a recommendation, not a provisioned
or tested integration. If the owner permits no additional data resource at all,
cloud account synchronization remains blocked; continue browser-local research.

Official terms checked on 21 October 2026:

- [Supabase pricing](https://supabase.com/pricing): Free includes a 500 MB database,
  50,000 monthly active users, 5 GB egress and 1 GB file storage; two active projects,
  shared compute, pause after one week of inactivity. These are quotas, not a
  production availability guarantee. Do not add paid extras or automatic upgrades.
- [Supabase backups](https://supabase.com/docs/guides/platform/backups): free-tier
  operators should export and maintain off-site backups; do not assume paid-plan
  automatic backup retention or point-in-time recovery is included.
- [Vercel Hobby](https://vercel.com/docs/plans/hobby): restricted to personal,
  non-commercial use; included resource caps can make features unavailable after
  exhaustion. Confirm the owner's intended public/business use qualifies before
  expanding it. Remain on the existing plan; this audit recommends no paid upgrade.

This permits a limited research-account pilot at zero spend within quotas. It does
not establish dependable brokerage custody, always-on market workers or an SLA.
Sustained professional multi-user trading cannot be promised on this free setup.
No temporary runtime SQLite database on Vercel should be described as durable.

## Minimal account/workspace design

| Boundary | Planned implementation / acceptance requirement |
|---|---|
| Identity | Managed provider identity; verified server-side session/JWT issuer, audience and expiry. Prefer OAuth/PKCE for a small pilot where email-delivery reliability is not established. Email signup/recovery requires validated delivery, quotas and abuse controls first. No homegrown password store. |
| Session | Secure HttpOnly/SameSite cookies if using cookie sessions, CSRF tokens/origin controls, session rotation/revocation, logout-all and bounded expiry; OAuth callback/state validation. Never use browser-provided user ID as authority. |
| Authorization | Default-deny RLS/owner predicates on every record; authenticated user versus operator/admin roles. Server-only privileged keys never enter bundles. Two-user negative tests cover list/read/write/delete/export/replay. |
| Data | `profiles`, `research_reports`, `research_snapshots`, `plans`, `preferences`, `journal_entries`, `audit_events`; immutable snapshot hashes and explicit record kind/source/verification state. Ownership mandatory; bounded JSON schemas; no arbitrary browser storage upload. |
| Concurrency | Unique IDs, revision/optimistic concurrency, transactions for related writes, idempotent mutations and request fingerprints. Do not transplant a shared single-user account object into tenant data. |
| Browser compatibility | Existing Library remains usable offline; explicit import preview and record-by-record source labels. Sync conflict resolution preserves both versions; no silent overwrite or automatic clearing of local records. |
| Limits | Per-user record/byte/API quotas, pagination, bounded snapshot retention, concurrent-request control and hard failure on capacity. Avoid unbounded tick/history warehousing in a 500 MB database. |
| Privacy | Data minimization, export/delete flows, retention schedule, user consent and transparent local/cloud distinction. Do not collect broker secrets in research notes. No real customer data in fixtures. |
| Operations | Explicit schema migrations, backup inventory, encrypted off-site export and restore verification, documented recovery objectives and key recovery. Target pilot RPO <=24 h/RTO <=1 business day only after a restore drill proves them; these are proposed goals, not current guarantees. |

Managed Postgres is durable storage, but pause/quota/outage handling and backup
discipline remain application responsibilities. A provider service key bypassing
RLS must not be the default public data-access path. For future order settlement,
use server-side transactional functions with strict ownership checks; browser writes
must never directly change balances or executions.

Before any sensitive broker token is retained, add envelope encryption, key version
and rotation/revocation, strict scopes, recursive log redaction and a tested recovery
story. An environment master key is not itself a full key-management program.
Provider infrastructure encryption does not replace application least privilege.

## Broker feasibility: actual implementation

| Adapter/interface | Current reality (source inspection) | Feasibility decision |
|---|---|---|
| Paper adapter | Generates synthetic tickets/fills from provider candle observations with a modeled spread; partial close and PnL settlement exist locally. | Useful for local tests/education; not a broker venue or executable quote simulator. Fix uncertain-result/idempotency and durable state before expansion. |
| Exness/MT5 bridge | Can probe a configured bridge status; account/position/order synchronization and transmission are not complete. Some status methods infer connectivity from configuration. | Needs a separately verified, supported bridge/terminal service and account permissions; an environment URL alone is not proof of account access. |
| Universal MT5 | Placeholder connectivity/status and unimplemented live order methods. | No hosted MT5 terminal or durable process exists. Vercel's current request-only function does not provide one. |
| XTB xStation | Stub connection reports configured URL; account method echoes state; order methods throw; no authenticated stream. | Verify current official API/product availability, regional eligibility and provider terms before investing. Existing class name/docs are not evidence that an API is available to this owner. |
| Reconciliation engine | Request-driven local balance/margin comparison; base positions method returns empty; not an event/cursor-based broker reconciler. | Must never interpret a failed/stub empty broker response as authoritative zero positions or successfully synchronized state. |
| Broker website links | External links/documentation. | Not account linking, delegated authentication, balance retrieval or consent. |

External broker connection/register paths are blocked before adapter calls, both
hosted and in the ordinary opt-in local flow. No actual broker protocol, account,
OAuth login, portfolio stream or trade was tested. No live credentials are needed
for further source/fixture engineering.

## Phased broker path and hard gates

### A — Documented read-only connection

Select exactly one currently supported official broker API or sanctioned bridge.
Confirm owner/region eligibility, provider agreement, scope model, consent,
revocation, quota, quote rights and sandbox capability. Prefer delegated OAuth with
read-only scopes. Use contract fixtures until a separate owner authorization permits
a real read-only connection. Display connection state from verified API responses,
not a configured URL or fabricated latency.

Requires managed identity/ownership, encrypted token retention and recursive
redaction. Acceptance: revoked/expired tokens fail closed, wrong-user access denied,
no write scopes or order route possible, balances timestamped and sourced.
Provider costs/agreements and infrastructure needs remain unverified; zero-cost
eligibility cannot be promised. No live-execution authorization is implied.

### B — Verified portfolio synchronization

Model broker account IDs, balances/currencies, cash movements, positions, orders,
fills and fees independently. Keep broker occurrence time, ingestion time, external
event ID and cursor; handle duplicates/out-of-order events and stale snapshots.
Poll only on explicit refresh initially if permitted by quotas; label this as
on-demand, not continuous synchronization. Verify signed webhooks if supported.

Use transactional upserts, reconciliation checkpoints and discrepancy status. A
partial/outage response must preserve last-known positions marked stale. Acceptance:
replay is idempotent; currency/fee balances reconcile; expired permissions, missing
pages and contradictory snapshots are surfaced. A durable stream/session daemon
would require a separately approved compatible runtime; current Vercel packaging
does not supply it.

### C — Reliable paper integration

Keep PAPER and live accounts separate by schema, namespace and API permission.
Introduce server-authoritative order intents, stable idempotency keys, transactional
ledger/fills/settlement and explicit status after lost responses/restarts. Verify
contract/currency/quote age, margin/exposure, daily limits and bracket policies.
Model costs, gaps and ambiguity honestly. Use no real order-transmission credentials.

A research-only on-demand paper ledger can potentially use request functions plus
the approved database within free quotas, with an explicit “not continuously
monitored” limitation. Guaranteed stops, unattended replay of market movement and
continuous portfolio/strategy workers require dependable scheduled/streaming compute
and data. A sleeping host, browser timer or function after response does not meet
that requirement. Do not label such a reduced pilot fully operational paper trading.

Acceptance: lost response/new attempt/restart never duplicate an intent; partial
fills and settlement balance exactly; unavailable/stale prices block; risk limits
are cumulative/atomic; process crash never returns success without durable commit;
every execution has an audit trail. Independent scenario tests required.

### D — Controlled live execution (deferred, separate authorization)

Not part of the current zero-cost roadmap implementation scope. Requires explicit
owner approval, suitable broker agreements and jurisdiction-specific assessment,
independently reviewed security and transaction controls, least-privilege order
credentials, verified execution data/contract specs, durable reconciliation,
monitoring, owner kill switch, per-order/account exposure caps, incident response,
consent and a tested release/rollback plan. Paper success or AI output is not an
authorization to send money orders. Never grant any model direct execution authority.

## Minimum owner decisions, not actions performed

1. Approve the first core reliability milestone in the roadmap; it needs no new
   service and leaves all financial/AI deployment gates intact.
2. Decide whether a future private cloud workspace justifies one approved free
   data/auth resource and its pause/backup/terms limitations. Otherwise retain
   local-only persistence and say so.
3. Before broker engineering, name a supported read-only provider and approve only
   the documented scope after agreements/technical eligibility are verified.
4. Any publication, settings change, provisioning or production release remains a
   distinct approval. This planning report authorizes none of them.
