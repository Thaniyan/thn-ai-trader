# THN AI Trader 6.3 — local release candidate

Built from original `Thaniyan/thn-ai-trader` main at `0afd76f2e5d93773144105d09fb1bb7b5e7e9ee3`. This cycle authorizes local implementation and commit only. No push, deployment, hosting change or additional environment was made.

## Delivered

- Chronological development/holdout evaluation with prefix-only development data, common warmup and independent flat-start windows. User rules remain fixed; the development window is not an automatically fitted model.
- Long-only, short-only and symmetric long/short EMA, RSI and breakout strategies. Signals use completed bars and next-open fills. Shorts have directional PnL, adverse costs, correct stops/targets and no artificial cash from sale proceeds. Supported USD-base Forex quote conversion is explicit; USD/USDT parity is rejected.
- Default gap handling cancels pending entries and closes held positions at the next observed open; an alternative rejects gapped samples. Neither reconstructs unavailable prices or anticipates future gaps.
- Side-by-side actual UTC windows, equity/drawdown curves, per-bar returns, trade counts, exposure, holding times, realized R distribution, concentration and drawdown contributors. Undefined metrics explain their denominator limitations.
- Five bounded parameter/cost sensitivity variants and three fixed-parameter expanding-development test folds when sufficient data exists, with at most 18 engine runs. Every variant is disclosed; no winner is automatically selected.
- Integrated dataset/scenario/strategy/risk context, explicit retained-report and dirty-input labels, request identity guards, four browser-local experiment records, comparison curves, validated research-only import/export and journal conclusions.
- English/Arabic research, risk and privacy help replaces misleading legacy broker instructions. Original nine sections and chart features remain; retained Portfolio panels now have readable light-theme backgrounds.

## Verification

- 60 unit/integration tests: chronological isolation under altered future candles, direct engine equivalence, common variant boundaries, disjoint walk-forward windows, repeatability, numerical metrics, all direction modes, explicit short cash flows/costs, stop collisions and price gaps, missing-data policies, currencies, bounds and insufficient history, metadata event isolation, provider outages and existing financial guards.
- Build and lint are JavaScript syntax checks; no bundler compilation is required by this application.
- Chromium real-provider acceptance covers evaluation, two-run comparison, bounded imports, removal of unknown credential fields, invalid timestamp rejection, export, journal metadata, delayed old evaluation rejection and Risk Desk assumptions transfer.
- All nine active view regions scanned in Arabic dark mode; Portfolio also scanned in English light mode. Zero axe violations in those scans. Both languages checked at 390×844 across all nine sections without page overflow. No browser JavaScript errors. Automated checks are not a complete accessibility audit.
- Real Yahoo Finance EURUSD hourly history supplied 2,000 closed provider observations. Missing Forex volume and 18 observed session/data gaps were disclosed. Captured default long/short results were negative in both development and holdout; the interface presents adverse evidence without manufacturing success.
- Separate browser outage coverage checks unavailable chart/evaluation states in EN/AR and the existing USDJPY hypothetical risk calculation.
- Runtime/credential patterns remain excluded from Git and deployment inputs; research endpoints cannot enable financial mutation. No dependencies, paid services, AI calls, live execution or broker integrations were added.

Runnable checks: `npm test`, `npm run build`, `npm run lint`, `tests/browser_quality.py`, `tests/browser_research_outage.py`. Browser prerequisites are documented in README. Local screenshots/results are ignored under `work/v63-*`.

## Limits and release procedure

Holdout reuse permits manual overfitting. There is no statistical significance test, strategy optimizer or calibrated probability. Three walk-forward tests use fixed parameters and fresh capital; mean fold returns are not a compounded portfolio. Sample-normalized chart progress does not align different calendar windows.

Finite provider history, revisions, omitted inconsistent rows, session/data gaps, proxies and lack of corporate-action normalization limit inference. Intrabar sequencing is unknown; stop-first collisions are conservative, but hidden gap excursions can still be worse. Funding, borrowing, actual short availability, liquidation and broker execution are not modeled. Drawdown contributors list closed trades overlapping a period, not complete causal attribution. Historical performance is not evidence of future profitability.

Saved experiments and notes are browser-local, unencrypted and capacity-limited. Imported metrics are labeled unverified, not recomputed or authenticated. Some legacy analytics remain separate from the quantitative evaluator. Four-hour research history and a verified economic calendar remain unavailable.

Production-domain access is blocked by the execution environment; local checks do not establish Production verification. The existing v6.2 READY deployment remains the release/rollback reference: `dpl_GnHaevGxBWmUQayXnTBerznPnb7w`, commit `0afd76f2e5d93773144105d09fb1bb7b5e7e9ee3`. After explicit exact-commit approval, fetch and verify a clean fast-forward from original main, push normally, and monitor the existing Vercel project. Stop on rejection or failure. A necessary rollback should promote the retained deployment through Vercel without rewriting Git history.

Prior release evidence remains in RELEASE-6.2.md and RELEASE-6.1.md. Intended original Production URL: https://thn-ai-trader.vercel.app/.
