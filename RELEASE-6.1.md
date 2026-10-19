# Original-project release candidate — 2026-10-19

Baseline: `50857dfc1e45a901515b56ffe2ed914d897671af`, verified by GitHub connector and remote fetch. Implementation branch: `product/workstation-integrity`. No remote push or deployment has occurred.

## Visible upgrade

- Calmer high-density cyan/dark workstation styling, improved panel hierarchy and light-theme contrast, compact responsive navigation and reduced-motion support.
- Market command center with actual provider coverage, shared instrument focus, provider history chart, freshness, capability status and linked research workflow.
- Searchable/filterable instrument discovery connected to the original analytical terminal and a server-backed position-sizing laboratory. Analysis scenarios can transfer to the laboratory.
- English/Arabic localization for the new workflow, RTL layouts, keyboard navigation, accessible labels, status announcements and chart crosshair controls. Existing untranslated secondary content remains outside this increment.
- Original terminal, SMC/drawing maps, scanner, portfolio, journal, brokers and settings retained; startup failures caused by undefined reset/clamp functions repaired.

## Integrity and security

- Removed silent synthetic market feeds, seeded dashboard opportunities, executable bid/ask inventions, fabricated calendar events, benchmark-journal loading and score-derived pseudo-backtests.
- Independent multi-timeframe results are unavailable rather than inferred from a single candle series. Missing providers never generate successful analysis.
- Public account records and mutations are protected by default; Vercel cannot opt into the unauthenticated local engine. Local broker execution is restricted to paper mode. External connection/register attempts cannot claim success.
- Runtime accounts/audits removed from Git tracking; `.gitignore` and `.vercelignore` exclude financial records, databases, runtime keys and temporary QA files. New local state and encryption keys use a clean private runtime directory, never the historical root records.
- Risk guards enforce finite inputs, direction, protection, volume increments, supported contracts, price freshness and server-side state. Fixed USD-base FX conversion, concurrent idempotency and partial-close volume/margin/PnL handling.

The historical main repository contained financial runtime records. Removing them in this commit does not erase old Git objects or revoke previously disclosed credentials. The owner should revoke/rotate any broker/API credentials historically stored in these records, and any associated encryption/model keys that were exposed. Credential validity was not tested; no values were printed, exported or copied into assets. No destructive history rewrite was performed.

## Verification evidence

- 18 unit/integration tests passed, including isolated public/local modes, outages, stale prices, deterministic analysis, contract validation, concurrent order replay, closing, reconciliation and partial settlement.
- Build/syntax and lint commands passed.
- Actual Yahoo Finance observations returned for all six watched instruments during browser verification; provider availability remains external and time-dependent. Binance requests can fall back to explicitly identified Yahoo data.
- All nine sections navigated in Chromium. Search/class filters, shared selection, risk API calculation, chart layers and keyboard crosshair exercised.
- Risk example: USD 10,000 planning capital, 1% budget, EURUSD buy 1.10 / stop 1.09 / target 1.12 / leverage 20: 0.10 lots, USD 100 stop risk, USD 200 target reward, USD 550 estimated margin.
- Mobile checks at 390×844 in English and Arabic: all nine views without page overflow. Desktop at 1440×1000; Arabic RTL and light theme checked.
- Axe WCAG A/AA/2.1 AA scans on all nine active view regions: zero reported violations after fixes. Light command-center scan: zero. These automated scans do not establish full accessibility conformance.
- Before/after screenshots captured from original-main local code for Dashboard, Markets, Trading, AI and Risk, plus the other sections. Direct production browsing was unavailable in this environment, so no production visual comparison or post-deploy verification is claimed.
- The original system suite was run first: 2 passed, 8 failed because its assertions require unrestricted financial operations and guaranteed feeds. It remains available as the legacy suite. The new acceptance suite validates the supported operating modes explicitly.

## Limitations

Hosted persistence, account authentication, external brokers and live execution remain unavailable. Local idempotency is bounded and process-local. Existing secondary UI translations are incomplete. Native TradingView availability depends on its external script; the original local analysis/SMC map remains available with provider data. No reproducible historical backtester, independent multi-timeframe engine or verified calendar was delivered. Optional model output was not exercised because no key was configured.

## Intended release

After explicit approval of the exact local commit: recheck remote `main`; if unchanged, fast-forward the original `Thaniyan/thn-ai-trader` main to this commit and deploy through the existing Vercel project `thn-ai-trader` (`prj_IFLYEB85CRNBjDEGO69xcW4O55Wd`, existing team `team_MOU3JztK2qXaXBQNFYDx1dX6`). Preserve its current Node 24 hosting configuration and original domain https://thn-ai-trader.vercel.app/. Verify deployment and original URL afterward. If remote main advances, reconcile and retest before releasing a different commit.

Zero additional spending: no billing changes, purchases, paid resources or new hosting projects. Release uses the existing project and plan only.
