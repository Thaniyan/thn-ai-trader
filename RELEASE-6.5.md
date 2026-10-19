# THN AI Trader 6.5 — workflow maturity release candidate

Built from original `Thaniyan/thn-ai-trader` main at `31384d4cab7da1f90ea0427dce36054158bf1b8f`. This cycle authorizes implementation, tests and a local commit only. No push, Production deployment, new project or hosting change is authorized or performed.

## Delivered product changes

- One context ribbon connects observations, independent evidence, evaluation, risk and the library. The real-data acceptance journey uses EURUSD / 15m and non-default capital, risk, leverage and friction without re-entering them. Scenario transfer preserves the selected chart timeframe and separately records the hourly source hash for scenario levels.
- More compact first-screen Copilot: scenarios and opposing evidence remain visible; independent observations, quality criteria, technical audit and uncertainty checks expand on demand. Redundant navigation and duplicate timeframe panels are reduced. Dashboard keeps selected-market data and the genuine provider watchlist prominent, with process/capability details collapsed.
- Research Lab adds a concise side-by-side development/holdout summary, next-step actions and local repeated-holdout inspection warnings. Cost/parameter sensitivity, walk-forward results, R distribution, equity/drawdown and the correct v6.3 engine remain intact. The engine now preserves optional date bounds in returned parameter metadata, enabling exact replay of date-limited evaluations.
- A unified research library supports search, status filtering, sorting, open/read, two-record lineage/outcome comparison, rename, user review status, confirmation before deletion, standalone safe HTML and full JSON backups. Historical signal-journal/snapshot panels are retained under an explicitly separate disclosure; the old notebook and experiment interfaces remain available.
- Canonical library capacity: 24 reports, 120 compatible legacy archives and two 60–2,000-bar selected-timeframe candle snapshots within 1.8 MB UTF-8 content. Writes reject capacity/physical quota failure without evicting older work. Unreadable library storage blocks writes. Stale expected-state writes are rejected; storage events synchronize other tabs. This is browser-local persistence, not a transactional multi-user service.
- Full backup/recovery uses bounded, recursively whitelisted research JSON. New backups and existing v6.4 report exports produce an explicit restoration preview. Confirmation appends unverified records; cancellation writes nothing; whole-restore capacity failures preserve existing data. Recovery copies compatible v6.2 notes, v6.3 experiments and v6.4 reports/plans/drawings into readable archives without modifying original active-format keys. Over-limit/invalid legacy records are counted as not included, never silently deleted.
- Optional raw-candle snapshots recompute SHA-256 before retention and on import. Reports expose provider, symbol, time coverage, dataset identity, engine/product versions, parameters/date windows, costs/risk, creation time, snapshot retention and reproducibility limits. A local-only replay CLI validates the backup/snapshot and reruns the existing evaluator without network calls. A hash alone is never presented as future provider retrievability or source authentication.
- EN/AR/RTL, dark/light styling, compact tables, journal hierarchy and mobile spacing are refined. Original advanced candle charts, TradingView/native drawings, SMC overlays/maps, all nine sections and isolated local paper engine remain. The sidebar health badge now preserves and translates the last actual health response after language changes rather than reverting to an initialization claim.

## Verification

- 85 unit/integration tests pass, 0 fail. New coverage includes atomic write/quota protection, corrupt storage, stale-tab writes, bounded append-only recovery, old export compatibility, nested credential-field stripping, snapshot OHLCV validation and SHA-256 tamper rejection, changed-input comparisons, exact offline metric reproduction with explicit date bounds, and refusal to replay without a retained snapshot. Existing numerical backtest/holdout/long-short/risk tests and hosted financial blocks pass.
- Build and lint pass (syntax checks for the original unbundled Node/HTML/JS stack). No new dependency or lockfile change.
- Genuine Yahoo Finance browser observations drive the complete selected-market → chart/SMC/drawing → non-default evaluation → scenario → server risk plan → complete report journey. It tests repeated holdout warnings, changed-cost experiment/report comparisons, snapshot retention, JSON/HTML, legacy preview, cancellation and restoration, fresh-context recovery/reload, offline replay of the recorded development/holdout metrics, tampered files, escaped user injection, confirmed deletion and simulated quota failure.
- Repeated symbol/timeframe changes and a deliberately late old response cannot replace the latest selection. Provider outage removes current Copilot evidence without manufacturing substitute results. Cross-tab browser checks retain both tabs' saved work; corrupt storage remains byte-for-byte intact after a rejected save.
- All nine views checked in EN and AR at 390×844: 18 layout checks, zero page overflow. 23 axe scans (nine views in each language, plus five changed views in Arabic light mode): zero violations. No browser JavaScript errors. Automated scans supplement visual/keyboard checks and do not establish complete accessibility conformance.
- Existing v6.3 browser research/experiment/journal tests and EN/AR outage/USDJPY risk regressions pass. Before/after screenshots cover Dashboard, Intelligence, Research Lab and Journal; mobile/light captures and machine-readable results are under ignored `work/v65-*`. Visual review guided compact disclosure of duplicate and stale legacy panels.
- Credential/runtime scan finds no actual credential signatures outside deliberate rejection fixtures and no tracked sensitive/runtime financial paths. No paid resources, APIs, workers, database, hosting environment, repository or deployment project was introduced. Hosted paper/live execution and financial mutations remain blocked. Generative AI remains unused; no model or budget was configured.

Current acceptance: `npm test`, `npm run build`, `npm run lint`, `tests/browser_maturity.py`, `tests/browser_library_reliability.py`, `tests/browser_quality.py`, `tests/browser_research_outage.py`. Browser prerequisites are documented in README. Local replay: `npm run replay -- backup.json [report-id]`.

## Remaining limitations

Browser storage is unencrypted, device-local, finite and removable. It has no cross-device sync, account sign-in or durable hosted custody. Physical quotas can be below the content budget. Back up before clearing data. Unsaved form drafts, workspace preferences and the local inspection counter are not restored as a cross-device session. A corrupt canonical library blocks writes; recover a valid backup in clean browser storage rather than overwriting unreadable contents. Optimistic expected-state checks and storage events are not a cross-tab transaction database.

Recovery supports the documented bounded formats: up to 100 legacy notes, four experiments, four plans, eight old reports, ten drawing sets and 50 drawings per set. Invalid/over-limit items are counted and excluded; their original keys remain intact. Recovered legacy records are read-only archives and are not silently written into original active modules. Restored research and imported provenance cannot be authenticated; review status is user-authored, not verified trading performance. Never enter secrets in free-text fields.

Only two selected-timeframe snapshots are retained on explicit request. Other timeframe observations remain summarized, not raw datasets. SHA-256 validates retained content integrity only. Without raw candles, a hash cannot recreate history. Offline replay compares recorded metric fields using the supported v6.3 evaluator; it does not authenticate provider provenance or reconstruct gap paths. Snapshot deletion is explicit and can remove replay capability unless a backup is retained.

Finite/revised provider histories, omitted rows, session/data gaps, proxy contracts and unadjusted corporate actions remain limitations. Recency is an interval heuristic, not an exchange-session calendar. No predictive probabilities, significance tests, new strategy optimization, verified news/calendar/sentiment or generated narrative is added. Repeated-holdout counts are local and reset on cleared storage, another device or a changed dataset; repeated tuning can still overfit.

Risk remains hypothetical: USD capital is not a broker balance; stops do not guarantee execution; gaps/costs can exceed nominal stop budgets. Borrowing, funding, actual short availability and forced liquidation are not modeled. Targets are independent full-position outcomes, not partial allocations. Native USDT is never assumed equal to USD.

These are local candidate checks. v6.5 has not been pushed or deployed, and no local pass is represented as complete Production-browser verification.

## Release and rollback references

Original website: https://thn-ai-trader.vercel.app/

Original Vercel project: `prj_IFLYEB85CRNBjDEGO69xcW4O55Wd`, team `team_MOU3JztK2qXaXBQNFYDx1dX6`.

Approved base / retained v6.4 Production: commit `31384d4cab7da1f90ea0427dce36054158bf1b8f`, deployment `dpl_7RL94Bh4Hb2dSKtX7FAkKdjrHwuH`.

After separate exact-commit approval: fetch original main, verify a clean fast-forward, push normally, monitor the existing Production project and verify the original domain where access permits. Stop on rejection or critical failure. If needed, restore the retained deployment through Vercel without rewriting Git history. Account for Vercel rollback potentially pausing automatic domain assignments. Do not create another environment or change billing/hosting settings.

Prior release records remain in RELEASE-6.4.md and earlier archives.
