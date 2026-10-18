# Development roadmap

No item here authorizes infrastructure changes, expenditure or live trading.

1. **Publication isolation and reproducibility (release gate).** Independently
   establish original repository visibility, Vercel production/preview branch
   triggers, apps/hooks, authentication protection and environment separation.
   Review the source-tree diff, portable tests and provenance before any push.
2. **Reliable market evidence.** Measure request success, source age, coverage and
   quota behavior using an approved observation plan. Establish exact Gold spot
   identity and exchange calendars; never convert a futures proxy into executable
   spot pricing. Add provider contracts and realistic market-session boundaries.
3. **Explainable analysis and AI.** Show input provenance, indicator conventions,
   limitations and reasons. Keep numeric decisions immutable under optional AI;
   validate narrative quality separately from strategy efficacy. No paid calls
   without approval and bounded spend controls.
4. **Professional UI/UX.** Task-based usability studies across all nine views,
   consistent loading/unavailable/error behavior, keyboard/screen-reader testing,
   mobile EN/AR/RTL and export clarity. Axe passes do not replace manual testing.
5. **Paper execution realism.** Slippage/spread/fees/session models, gap and partial
   fill scenarios, lifecycle/worker telemetry and ledger reconciliation. Test with
   approved real market observations before claiming realistic execution quality.
6. **Backtesting and quantitative research.** Versioned historical datasets,
   survivorship/corporate-action handling, no look-ahead, transaction costs,
   train/validation separation, walk-forward/out-of-sample evaluation and risk
   distributions. Publish methodology and uncertainty, never heuristic win rates.
7. **Operational maturity.** Approved auth provider/MFA options, distributed design
   only if needed, restore drills, retention/observability, least privilege,
   dependency cleanup/security scans and staged rollout/rollback rehearsals.

Delivery order favors trustworthy product behavior over new animated indicators,
framework rewrites or broad autonomous trading. Each item needs acceptance criteria,
fixture/live evidence labels, a reviewed feature branch and a reversible release.
