# Exness read-only connection pilot — LOCAL ONLY

Base `96f86c99907467932adf5b21e263dc55108a5f73`; branch
`feature/exness-readonly`. This is an operator-side connector, **not** an activated
website connection, an OAuth login service, account onboarding, or trading.
No account has actually authenticated yet. No private broker data was fetched.

## Implemented

- Node Ed25519 request signing with the documented EXN headers, empty GET
  idempotency value, exact scoped path and empty-body digest.
- Only account configuration and current snapshot GETs. No generic request
  method, order, transfer, withdrawal, account-creation or close-position API.
- Explicit operator-provided Exness account Access Point, constrained to HTTPS
  `ap-…exness.com` / `ap-…trading.exness.com` origins. No review-host guessing,
  arbitrary URL, redirect following or public proxy.
- Local opt-in; Vercel and other recognized hosted runtimes fail closed.
  Importing this module does not contact a provider. No public HTTP route or UI
  imports it. Existing hosted financial restrictions remain unchanged.
- Two bounded signed reads, cancellation, one in-flight inspection, ten-second
  local throttling, no automatic provider retry and no raw upstream error echo.
- Strict response identity/shape validation; monetary strings remain exact.
  Unknown free margin and provider timestamp stay unavailable. A local receipt
  time is not presented as a broker valuation timestamp or execution approval.
- Operator CLI keeps private-key files outside the repo; checks ownership,
  permissions, size, symlinks and opened inode. It outputs only a redacted status,
  never account identifiers, monetary amounts, secrets, headers or raw responses.
  Unencrypted local key files require private OS storage (this is not an
  encrypted multi-user hosted credential vault).

## Owner-side prerequisite (no credentials in chat)

Check the official Exness Personal Area for API/Key Management availability on
the intended verified Oman account and whether supported demo access exists.
Report only availability and demo/real type. Region, terms, scopes, entitlement
and API costs have not been verified for this account. No paid API is approved.

Only after that check, a separately authorized operator can configure these
variables **privately outside Git**, using broker read-only scopes where offered:

| Variable | Purpose |
| --- | --- |
| `THN_EXNESS_READONLY` | Explicit local opt-in, `1` |
| `EXN_API_KEY` | API identifier from Key Management; never a brokerage password |
| `EXN_ACCOUNT_ID` | Exact allowed account identifier |
| `EXN_ACCOUNT_ACCESS_POINT` | Account Access Point from the official portal/discovery |
| `EXN_PRIVATE_KEY_FILE` | Absolute path to an owner-only Ed25519 private key file outside the repository |

With credentials and network access separately authorized, the POSIX-local
verification operation is:

```sh
node --use-env-proxy scripts/exness-readonly.mjs
```

Do not pass keys as command-line arguments, paste them here, commit environment
files, or capture them in screenshots. No keys were generated for actual broker
access. Unit tests generate disposable keys in memory / isolated temporary files.
The supported proxy remains in use. This managed environment currently excludes
Exness API hosts from its egress policy; it must not bypass that policy. No
authenticated broker calls have been attempted.

## Contract evidence and limits

Reviewed 26 October 2026:

- [Official help](https://get.exness.help/hc/en-us/articles/27866287512476-Exness-API)
  describes verified eligible Exness accounts; standard MetaTrader accounts are
  excluded from this API.
- [Signing](https://www.exness-api.com/authentication/request-signing) specifies
  Ed25519 and signed metadata. This is not generic broker-password OAuth.
- [Host setup](https://www.exness-api.com/authentication/api-key-and-host-setup)
  and [discovery](https://www.exness-api.com/trading/get-started/access-point-host-discovery)
  require an account-specific host before account requests. Programmatic host
  discovery was not implemented from a provisional documentation example.
- [Configuration](https://www.exness-api.com/reference/trading/get-account-details)
  documents `/v1/configuration/accounts/:account_id/account`.
- [Snapshot](https://www.exness-api.com/reference/trading/get-trading-state-snapshot)
  documents `/v1/trading/accounts/:account_id/snapshot`. It can be unavailable
  when provider trading mode is disabled; the pilot never changes that mode.

The published OpenAPI download was identified, but this session's web reader
could not ingest its octet-stream response. The strict snapshot parser expects
`orders`, `positions`, and `account_state` with decimal `balance`, `equity`,
`used_margin`; final schema and actual provider compatibility remain pending
authoritative schema/live validation. Unsupported shapes are rejected, never
converted into zero balances. Protocol fixtures are synthetic, not real API
quality/authentication evidence. The pilot does not infer demo/real type.

## Website activation still required

Authenticated users, encrypted durable per-user credential storage, tenant
isolation, session/CSRF controls, revocation, API scopes and terms verification,
safe synchronization and account-to-risk binding are **not implemented** by this
pilot. Nothing here makes Vercel's ephemeral storage a private financial ledger.
Do not expose this operator key as a shared public service or connect it to all
website visitors. No broker monetary values are copied into the hypothetical USD
planner; account currency, precision, valuation age and contract compatibility
must be verified first. Orders remain out of scope and disabled.

No purchases, new services, hosted settings changes, pushes or deployments.
