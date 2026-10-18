# Feature reconciliation matrix

O = original 50857df; S = staging b05f070. Verification refers to local fixture
and browser results in REPOSITORY-RECONCILIATION.md, not live-provider certification.
File-by-file coverage, hashes and decisions: reconciliation/file-assessment.json.

| Area | Original | Staging/candidate | Decision, verification and remaining risk |
|---|---|---|---|
| Nine-view navigation | All nine views present | Same workflow, evidence-aware dashboard and unavailable states | Retain staging; EN/AR browser checks; no removed named app functions |
| Dashboard | Rich widgets with heuristic/synthetic evidence paths | Quote provenance, provider/session status, private clearing | Retain; browser/privacy tests; not a profitability dashboard |
| Markets | Provider fetches and silent synthetic fallback | Cached/coalesced feeds, quote age, identity and provider status | Retain staging; provider failures/freshness tested; live quota remains external |
| Trading Terminal | Paper/order UI and client/server hazards | Server quote/risk authority, honest outages, protected paper flow | Retain; paper/system regressions; not exchange-equivalent fills |
| AI Intelligence | Confluence and pseudo backtest; loosely parsed narrative | Strict optional narrative schema; numeric immutability; performance unavailable | Retain/adapt expectations; mocked AI tests; paid/live AI untested |
| Risk Desk | Contract/margin/risk functions | Currency conversion, sub-cent limits, aggregate risk and owner checks | Retain; numerical/risk regressions; contract specs remain modeled |
| Portfolio | Default/shared/client evidence | Owner-scoped server balances and marked positions | Retain; account/browser isolation; no verified broker NAV |
| Trade Journal | Historical/sample/client state | Server fill ledger and empty/unavailable states | Retain; durable/cursor tests; local drafts are not audited fills |
| Broker Accounts | Paper and unverified external gateway classes | Paper permitted; every external adapter fails closed | Retain; negative execution tests; no live broker support |
| Settings | UI preferences and branding | Session, storage/notification/scanner safeguards | Retain; browser opt-in, quiet hours and transition tests |
| EN/AR and mobile | Bilingual, RTL and nine-view markup | Preserved with semantic/accessibility corrections | Retain; 18 axe view scans plus browser/mobile checks; manual AT needed |
| Indicators | Inline functions | Extracted, documented warm-up/conventions | Retain; reference tests; RSI/ATR are simple rolling methods, not universal vendor parity |
| Quantitative validation | Synthetic confidence-dependent performance projection | Historical performance explicitly unavailable | Exclude fabricated statistics; backtesting/walk-forward roadmap |
| Gold analysis | Futures labeled like spot and generic failure | Futures proxy disclosed, analysis-only, order gate blocks proxy | Retain; Gold/quota regressions; exact spot feed still missing |
| Quote throttling | Unbounded repeated upstream attempts | Coalescing, bounded batches, cooldown/Retry-After and partial results | Retain; failure/quota tests; provider 429 cannot be eliminated |
| Authentication/authorization | Anonymous private reads/mutations; no owner isolation | Tokens, expiring sessions, account owner checks, revocation/clearing | Retain; security/browser tests; no MFA/OIDC/distributed session store |
| CSRF/cookies/CSP | Root CSP absent in baseline probe; cross-origin risk allowed | Origin rejection, HttpOnly/SameSite, HTTPS Secure, CSP and no-store | Retain; local HTTP/attribute tests; actual hosted HTTPS roundtrip unverified |
| Persistence | Tracked mutable account/audit JSON | WAL SQLite, atomic transactions/idempotency, writer exclusion | Retain; restart/concurrency/integrity tests; Node24/runtime migration required |
| Encryption/recovery | Key regeneration/decrypt-null hazards | Wrong/missing keys fail closed; controlled recovery | Retain; incident/recovery regressions; preserve external keys/backups |
| Audit/ledger | Mutable JSON audit; no durable authoritative fills | Redaction, append-only DB audit, indexed paginated fills | Retain; tests; not tamper-proof against OS/admin access |
| Paper lifecycle | Immediate paper orders and reconciliation | Pending price crossing, server TP/SL, partial-close precision, worker drain | Retain; paper/system tests; realistic spreads/slippage/session calendar incomplete |
| Backups/upgrades | Runtime state in root Git files | Consistent SQLite backup, validated source-only transition tools | Retain tools inactive; synthetic portable transition test; owner WSL2 untouched |
| Frontend integrity | No isolated build verifier | Source/config boundary with only exact validated injected project name | Retain; exact hosted SHA reproduction, negative tests, deterministic ZIP |
| Deployment | Existing Vercel connection; no tracked config/workflow | Optional inactive templates and generated static preview package | Preserve root absence; no auto workflow added; original hosting isolation UNKNOWN |
| Dependencies/runtime | Node >=18; bun.lock and declared Google SDK | Node >=24.5, same lock/dependency; actual narrative OpenAI | Retain Node24 requirement; prune unused SDK only in separate reviewed change |
| Original audit/runtime JSON | Obsolete audit assertions and tracked account/events | Excluded from candidate tree | Keep original Git history; deletion does not sanitize public historical commits |
| Staging release metadata | Not applicable | Prior private-publication destination/status files | Exclude from candidate; replace with reconciliation provenance and current authority |
