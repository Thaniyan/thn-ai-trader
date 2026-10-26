# Broker workspace — local implementation

Base: `bca80e16346899af28504fbf82259b124b540f48`. This milestone changes the
existing Broker Accounts surface, not the server financial boundary. No release
or real broker activation is authorized by this implementation.

## Working now

- 249 ISO 3166-1 country/territory choices plus Other; Oman is the default.
  Codes are static selection metadata (public-domain tzdata country table);
  browser Intl.DisplayNames supplies English/Arabic names. Country selection is
  not geolocation, residence verification, regulatory approval or eligibility.
- XTB, Exness and MT5 preferences, device-local persistence with a truthful
  storage-failure status. Only country and broker identifiers are stored;
  capital, credentials and account information are not stored by this feature.
- Clearly disconnected account panel: no invented balance, equity, margin,
  synchronization timestamp or permission. MT5 is a platform, not a broker.
- Official public information links, explicit external destination, no referral
  parameters or eligibility/fee claims. They are not an account-opening API.
  Official API documentation was checked on 26 October 2026; regional eligibility,
  actual account access and partner terms remain unverified. No broker/API is
  represented as approved or connected.
- Manual hypothetical USD capital drafts the existing Risk Desk field, fires
  existing plan-invalidation events and requires explicit recalculation. It
  never changes broker balances, research outcomes, a paper account or orders.
- Existing broker/local-paper tools remain in their original disclosure.
  All nine views, EN/AR, RTL, themes, engines and existing restrictions remain.

## What real connectivity still requires

The provider differences are material and displayed alongside the selection:

- [XTB help](https://intercom-help.eu/xtb/en/articles/3868-does-xtb-offer-investment-automation-tools)
  reports that API access ended on 14 March 2025. Do not build on the old xAPI
  scaffold or describe it as a working integration.
- [Exness help](https://get.exness.help/hc/en-us/articles/27866287512476-Exness-API)
  documents account information and trading APIs for eligible verified Exness
  trading accounts, excluding standard MetaTrader accounts. Its help page links
  to the [developer portal](https://www.exness-api.com/), which documents signed
  requests, operation scopes and host discovery. This is a candidate for a
  read-only pilot, not proof of Oman eligibility, THN partner rights or free access.
- [MetaQuotes documentation](https://www.mql5.com/en/docs/python_metatrader5)
  describes interprocess communication with a running MT5 terminal. It is not a
  general browser OAuth API or an implicitly available Vercel service.

Stale commission, licensing, universal-MT5 and xStation-API claims in the old
external-information dialog were removed rather than presented as verified facts.

1. Verify the chosen broker's Oman-facing legal entity, permitted customer
   regions, current official API, demo access, authentication and partner terms.
   XTB/Exness/MT5 scaffolding is **not** evidence of functioning APIs.
2. Implement a supported provider authorization flow (OAuth/PKCE only where
   supported), authenticated per-user sessions, encrypted server-side secrets,
   private durable storage, revocation and tenant isolation. Never collect
   brokerage passwords in this UI. Provider-hosted onboarding/KYC is the default;
   in-app account opening requires an expressly supported partner flow.
3. Begin read-only: broker-sourced currency, balance, equity, free margin,
   positions and freshness. No inference from user-entered capital. Validate
   broker contracts and FX conversion before connecting this to sizing.
4. Validate demo orders, persisted idempotency, unknown-response recovery,
   broker reconciliation, risk checks, order preview/confirmation, audit trail
   and an emergency stop before separately approving any live execution.
   AI has no account mutation or order execution authority.

Existing Vercel Hobby has no durable private financial ledger. Ephemeral SQLite
is not suitable. An MT5 terminal/bridge cannot be assumed to run on serverless
hosting. No new storage, bridge, external credentials, costs or hosting changes
were configured. Zero-cost feasibility for a genuine integration is unresolved
until its official API and durable-storage requirements are verified.

## Validation and evidence

`tests/broker-workspace.test.mjs` checks preferences, all country/provider
combinations remaining unverified and disabled, and strict USD capital bounds.
`tests/browser_broker_workspace.py` uses actual packaged local application and
offline provider fixtures: reload/persistence, all broker choices, EN/AR,
dark/light, 1440/768/390/240/160px, axe accessibility, safe invalid input,
real HTTP plan creation then invalidation, refused storage and corrupt data.
No real broker, account onboarding, real model or trade was tested.

See [matched before/after images](broker-workspace-evidence/comparison.html)
and [recorded local results](broker-workspace-evidence/validation.json).
