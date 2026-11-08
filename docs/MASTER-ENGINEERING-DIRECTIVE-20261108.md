# THN AI TRADER — MASTER ENGINEERING DIRECTIVE
## Comprehensive Technical Audit, Product Development, Quality Assurance & Controlled Production Delivery

**Project:** THN AI Trader
**Canonical repository:** https://github.com/Thaniyan/thn-ai-trader
**Production:** https://thn-ai-trader.vercel.app/
**Target branch:** `main`
**Existing development candidate:** `feature/unified-decision-workstation-20261107`
**Existing Pull Request:** https://github.com/Thaniyan/thn-ai-trader/pull/14

---

# 1. YOUR MISSION

You are the lead software engineer, technical architect, quality-assurance engineer, quantitative-systems reviewer, security reviewer, and release engineer responsible for advancing THN AI Trader.

Your mission is to turn the existing application into a professional, reliable, bilingual, AI-powered trading intelligence and quantitative research platform.

This is an **implementation assignment**, not a request for another roadmap-only report.

You must inspect the actual repository, identify verified gaps, implement meaningful improvements, test them thoroughly, and deliver working changes through the established GitHub and Vercel workflow.

Do not claim completion without actual evidence.

Do not rebuild the product from scratch.

Do not sacrifice existing functionality to achieve visual improvements.

Do not replace functioning numerical engines with simplified or unverified alternatives.

Do not deploy major changes without the owner's explicit approval.

Development must proceed through coherent, independently verifiable milestones.

# 2. NON-NEGOTIABLE PROJECT RULES

1. Preserve the original repository and canonical Git history.
2. Treat `main` as the verified production branch.
3. Perform new development on dedicated branches.
4. Preserve all validated existing functionality.
5. Preserve the recognizable THN AI Trader visual identity.
6. Maintain Arabic and English, LTR/RTL, mobile responsiveness, and dark/light themes.
7. Keep research, hypothetical planning, paper trading, and real trading strictly separated.
8. Never fabricate market prices, account balances, execution results, profitability, AI inference, or confidence probabilities.
9. Use authoritative server-side validation for financial calculations.
10. Keep real-money trading disabled.
11. Keep hosted broker execution disabled.
12. Never expose real credentials or introduce public broker connections without separate authorization.
13. Do not add paid infrastructure or paid APIs without explicit approval.
14. Do not perform destructive data migrations without approval.
15. Do not bypass tests, branch protections, security boundaries, or release checks.
16. Do not weaken or delete existing assertions merely to obtain green CI.
17. Do not force-push, rewrite shared history, or merge unrelated histories.
18. Do not assume a successful build means the application works.
19. Do not assume a successful deployment status means all production functions work.
20. Keep a known rollback reference for every production release.

**Approval policy:** Routine, low-risk changes may proceed through normal PR review, all mandatory checks, Preview verification, and merge when repository policy permits. Significant UI changes, architecture changes, financial logic changes, security-sensitive changes, destructive changes, broker integrations, and paid infrastructure require explicit owner approval before merge or deployment.

If an approval boundary is reached, preserve the completed development branch and PR, provide review evidence, and stop before the restricted action. Continue with independent low-risk work only where safe.

# 3. INITIAL REPOSITORY AND RELEASE VERIFICATION

Before changing code, obtain the current repository state.

Inspect:

- Current `main` SHA and recent commit history.
- Existing development branches.
- Open PRs, especially PR #14.
- Current GitHub Actions workflows.
- Branch protection rules and repository rulesets.
- Required status checks and merge policies.
- Vercel Git integration and Production Branch.
- Preview deployment behavior.
- Production domain and deployment aliases.
- Production deployment SHA.
- Current production health and supported runtime capabilities.
- Existing release documentation and rollback procedures.

At the time of this directive, the inspected baseline was:

- `main`: `a752fa4f533b0376c8d60eab1a450c5fbf9932f9`
- Candidate: `28f5d1a69540c7233c17a23702741b398eebe879`
- Application version: `7.5.0`
- Existing Production deployment: Vercel READY for the inspected `main` SHA.
- Candidate CI: successful.
- Candidate Preview: READY with HTTP 200 homepage.
- Branch protection: `main` was reported as unprotected.
- PR #14: open, awaiting complete acceptance and owner authorization for major changes.

Revalidate every item because repository state may have changed.

Do not reset, overwrite, or duplicate existing work.

Read `AGENTS.md` first and follow the latest direct owner instructions where historical documentation conflicts.

## Important existing documents

Inspect at least:

- `AGENTS.md`
- `README.md`
- `docs/PRODUCT-ROADMAP.md`
- `docs/CORE-PLATFORM-AUDIT.md`
- `docs/CORE-PLATFORM-FEATURE-MATRIX.md`
- `docs/CORE-RESEARCH-TRUST.md`
- `docs/UNIFIED-DECISION-WORKSTATION.md`
- `docs/V7-RELEASE-READINESS.md`
- `docs/EXNESS-READONLY-PILOT.md`
- `docs/LOCAL-AI-RESEARCH.md`
- `RELEASE.md`
- `vercel.json`
- `.github/workflows/ci.yml`

Review the repository's copies of the illustrated product vision and strategic roadmap.

Reference illustrations are inspiration, not approved implementation assets.

# 4. COMPLETE TECHNICAL AUDIT

Build an evidence-based capability inventory covering all nine application sections and the six strategic product systems.

For every major capability, identify:

- Existing source files and owners.
- Entry points and API routes.
- Data dependencies.
- Actual implemented behavior.
- Local and hosted environment differences.
- Persistence mechanism and failure modes.
- Security boundaries.
- Existing tests.
- Missing tests.
- Known defects.
- Production verification status.
- Business and technical impact.
- Recommended implementation milestone.

Use explicit evidence classifications:

- SOURCE VERIFIED
- TEST VERIFIED
- LOCAL RUNTIME VERIFIED
- PRODUCTION VERIFIED
- PARTIALLY VERIFIED
- UNAVAILABLE
- BLOCKED
- NOT IMPLEMENTED

Do not represent test fixtures as live production evidence.

Do not repeat historical findings as current defects without checking whether they were fixed.

Produce a compact current-state audit that developers can use immediately.

# 5. PRIORITY ZERO — FINANCIAL TRUTHFULNESS AND SAFETY

This is a permanent release-blocking standard.

Audit every interface that displays or calculates:

- Market prices.
- Trading signals.
- Recommendation confidence.
- Historical performance.
- Account balances.
- Equity and margin.
- Realized and unrealized profit.
- Risk/reward.
- Strategy returns.
- Win rates.
- Simulated trades.
- Reported trade outcomes.
- Broker status.
- AI-generated interpretation.

Requirements:

1. An unexecuted research idea must never become a realized WIN or LOSS.
2. A hypothetical target must never become an actual exit price.
3. Do not insert default capital or fabricated account equity when accounts are unavailable.
4. Do not convert confluence scores into win probabilities.
5. Do not present historical backtesting as guaranteed future profitability.
6. Never silently promote imported or manually entered records into broker-verified trades.
7. Preserve imported original records and their provenance.
8. Do not silently rewrite or erase existing research records.
9. Validate numeric inputs and reject NaN, Infinity, invalid ranges, inconsistent currencies, and impossible financial conditions.
10. Distinguish authoritative calculations from explanatory presentation.

Inspect the existing `THN-RECORD-1` classification and its tests before touching older journal code.

Ensure the newer research-trust protections still govern all legacy displays.

Add regression tests for any discovered discrepancy.

# 6. PRIORITY ONE — COMPLETE THE UNIFIED DECISION WORKSTATION

Use the existing candidate and PR #14 as the first major development milestone.

Do not rebuild functionality already implemented there.

Examine:

- `public/unified-workspace.js`
- `public/unified-workspace.css`
- `public/recommendation-core.js`
- `public/recommendation-view.js`
- `tests/recommendation.test.mjs`
- `tests/browser_unified_workspace.py`
- `docs/UNIFIED-DECISION-WORKSTATION.md`

Verify the complete user journey:

**Market selection → Market evidence → Chart → Technical analysis → Research recommendation → Risk Desk → Historical evaluation → Research Library → Comparison and review.**

The selected instrument, timeframe, dataset identity, and evidence freshness must remain consistent.

Rapid instrument switching must not display delayed results from the previously selected market.

Recommendations must clearly distinguish:

- WAIT
- Conditional BUY
- Conditional SELL
- AVOID
- Unavailable evidence

A recommendation must never imply that an actual order was executed or that a verified executable quote is available.

Preserve confirmation conditions, invalidation levels, opposing evidence, provenance, and uncertainty.

Verify that charts, research panels, risk inputs, historical reports, and saved records remain synchronized.

Review all 47 changed files in the candidate PR, not just the new UI.

Confirm no regression in existing code, numerical results, storage formats, or security restrictions.

Capture real Preview screenshots at representative desktop, tablet, and mobile widths with English/Arabic and dark/light themes.

Review interactions and layout, not only static screenshots.

**Milestone acceptance:** One genuinely connected research workflow, passing all mandatory tests, with no misleading financial claims or material UX regressions.

Because this integration materially changes the UI and several workflows, do not merge it without explicit owner approval.

# 7. MARKET DATA RELIABILITY AND EVIDENCE PROVENANCE

Inspect:

- `server/market-evidence.js`
- `server/research.js`
- Market provider integration in `server.js`
- `public/research-state.js`
- `public/research-workstation.js`
- `public/market-terminal.js`
- Existing data-quality and context tests

Requirements:

1. Use validated provider observations.
2. Clearly show canonical symbol and provider symbol.
3. Preserve timestamp and observation-source identity.
4. Separate last closed candle from live or provisional quotes.
5. Reject future or malformed timestamps.
6. Handle missing, stale, incomplete, or inconsistent histories.
7. Validate out-of-order and duplicate candles.
8. Preserve dataset hashes where used for research identity.
9. Invalidate outdated research when the underlying market context changes.
10. Do not silently fall back to another instrument or incompatible dataset.
11. Distinguish weekend/market-closed stale observations from provider failures where evidence supports the distinction.
12. Prevent stale cached observations from appearing as fresh data.
13. Do not manufacture a current market price from the server clock.
14. Do not imply market depth, tick feeds, executable spreads, or guaranteed real-time prices where none exist.
15. Confirm independent timeframe data for 15m, 1h, and 1d analyses.

Add deterministic fixture tests covering market outages, malformed responses, delayed requests, holidays/weekends, stale observations, partial datasets, and context races.

For any genuine provider testing, use read-only requests, document failures and limits, and avoid uncontrolled request volume.

# 8. FIX CONFIRMED API CONTRACT ISSUES

A direct production check on November 8, 2026 found that:

`GET /api/this-route-does-not-exist`

returned HTTP 200 with the application HTML rather than an appropriate API 404 response.

Reproduce this in the current code and Preview environment.

Correct route handling so that:

- Unknown `/api/*` paths return a structured JSON 404.
- Unsupported HTTP methods return the appropriate stable 4xx response.
- Unknown static asset paths do not accidentally return successful HTML.
- Legitimate SPA navigation remains functional.
- Error responses use consistent content types.
- Internal exceptions do not expose credentials, stack traces, or sensitive configuration.
- API failures are not mistaken for successful frontend responses.

Add tests for missing routes, unknown asset names, unsupported methods, malformed JSON, payload limits, and valid SPA entry points.

Do not broadly rewrite routing when a small, safe correction is sufficient.

# 9. RISK DESK AND AUTHORITATIVE NUMERICAL ENGINES

Inspect:

- `server/decision.js`
- `server/backtest.js`
- `server/evaluation.js`
- Existing risk engine and account modules.
- `/api/research/plan`
- `/api/risk/calculate`
- Relevant frontend risk presentation.

Validate:

- Position sizing.
- Capital and risk percentage.
- Stop distance.
- Contract size.
- Pip/tick precision.
- Quote and account currency conversion.
- Leverage and margin.
- Trading costs and spreads.
- Independent profit targets.
- Maximum modeled loss.
- Exposure limits.
- Invalid instrument specifications.
- Missing or inconsistent market evidence.

Investigate the historical finding that the older `/api/risk/calculate` endpoint accepted invalid leverage and handled some malformed inputs incorrectly.

First determine whether the current implementation still exhibits the defect.

If the legacy route is incompatible with the authoritative plan contract, normalize or deprecate it safely, without changing validated formulas accidentally.

Create exact numerical regression fixtures and metamorphic/property-based tests where appropriate.

Preserve existing numerical-engine parity checks.

Any change to financial algorithms or risk policy must be isolated, fully justified, and owner-approved before Production release.

# 10. QUANTITATIVE RESEARCH AND BACKTESTING

Preserve the existing authoritative research engines.

Improve the usability and credibility of existing quantitative capabilities before creating new strategy algorithms.

Required capabilities to inspect and strengthen:

- Historical backtesting.
- Chronological training/development and holdout separation.
- Strategy comparisons.
- Transaction costs.
- Slippage assumptions.
- Maximum drawdown.
- Return distributions.
- Risk-adjusted metrics when statistically justified.
- Parameter sensitivity.
- Walk-forward evaluation.
- Sample-size sufficiency.
- Missing-data handling.
- Reproducible research snapshots.
- Research confidence evidence.
- Source and timestamp disclosure.

Avoid look-ahead bias, survivorship claims unsupported by the datasets, and parameter tuning that implicitly uses holdout observations.

Make historical validation failures understandable to the user.

Show which evidence supports a strategy and which evidence contradicts it.

Do not invent missing metrics.

Historical evidence must not automatically trigger an order.

Acceptance requires deterministic repeatability, stable outputs for equivalent inputs, and clearly identified calculation limitations.

# 11. AI RESEARCH COPILOT

The existing platform contains a deterministic research engine and optional model-provider adapters.

Do not misrepresent them.

Inspect:

- `server/intelligence.js`
- `server/intelligence-provider.js`
- `server/intelligence-local.js`
- `server/intelligence-conversation.js`
- `public/intelligence-workspace.js`
- `public/intelligence-generation.js`
- Relevant provider documentation and tests

The production provider endpoint currently reports hosted generative inference disabled.

Build on the existing research architecture.

The intended Copilot should explain:

- Current observed market conditions.
- Technical evidence.
- Supporting and opposing arguments.
- Alternative scenarios.
- Multi-timeframe disagreement.
- Important levels.
- Data limitations.
- Risk implications.
- Historical evidence.
- Invalidation conditions.

A genuine model-backed answer must have a verified provider/model identity, authorized inference, matching dataset context, usable citations, and validated output.

If a model is unavailable, clearly label the output as deterministic research.

Do not automatically download model weights, activate a paid API, or expose an unauthenticated AI endpoint.

Preserve explicit provider budgets, timeouts, authentication, payload limits, and fail-closed output validation.

Test prompt injection, unsupported numeric assertions, malformed structured responses, stale context, citation mismatches, cancellation, and provider outages.

Prepare a separately reviewable genuine-model integration plan after proving technical availability and obtaining required authorization.

# 12. PAPER TRADING AND FINANCIAL STATE

Inspect:

- `server/paper-intents.js`
- Existing account storage.
- Paper-order execution code.
- Broker adapters.
- Reconciliation and audit mechanisms.
- Order submission UI.
- Browser-to-server intent lifecycle.

A previous audit identified duplicate-intent risks and unsafe retry behavior.

Later work introduced a persistent intent reservation mechanism and single-writer recovery gate.

Do not assume either the old defect or its later correction is sufficient without retesting.

Investigate:

- Repeated submission with the same idempotency key.
- Same financial intent submitted with a new key.
- Timeout after server acceptance.
- Concurrent submissions.
- Process termination between reservation and completion.
- Partial or failed disk writes.
- Recovery after restart.
- Corrupt ledger/intent records.
- Reconciliation after interrupted operations.
- Stop-loss and take-profit monitoring limitations.

The current local implementation explicitly does not guarantee distributed exactly-once execution.

Preserve that limitation.

Keep all hosted financial mutations disabled.

Do not turn the local JSON-based sandbox into a public account service.

Do not activate real-money trading.

Any new durable transaction infrastructure or security-sensitive account architecture must be proposed separately for approval.

# 13. PORTFOLIO, TRADE JOURNAL AND RESEARCH LIBRARY

Prioritize reliable research retention and accurate reporting.

Requirements:

1. Keep saved research separate from executed trades.
2. Clearly label local-only persistence.
3. Preserve existing report schemas and compatibility.
4. Support understandable research browsing, filtering, comparison, and export.
5. Reject malformed imports without partial unintended writes.
6. Preserve original imported evidence.
7. Prevent automatic conversion of research scenarios into realized trades.
8. Handle storage quota failures.
9. Handle disabled browser storage.
10. Handle corrupt saved data.
11. Preserve existing data when reads or writes fail.
12. Support explicit backup and restore.
13. Ensure no duplicate records are introduced by retries.
14. Preserve keyboard navigation and focus restoration.
15. Explain missing portfolio data rather than inventing account values.

Inspect legacy and modern state stores for duplicate ownership and inconsistent behavior.

Avoid destructive migrations.

Do not claim cross-device durability or cloud synchronization without a verified user identity and persistent backend.

# 14. PROFESSIONAL UI/UX DEVELOPMENT

The final product should feel like a professional trading workstation, not a generic administration dashboard.

Preserve the strongest existing THN design features.

Use the illustrated product vision as a design reference, not as permission to copy third-party artwork.

Maintain:

- Strong THN branding.
- Clear chart hierarchy.
- High-information-density trading layouts.
- Consistent typography.
- Professional dark and light themes.
- Readable financial values.
- Clear control states.
- Efficient navigation.
- Responsive charts and tables.
- Full Arabic and English support.
- Correct RTL behavior.
- Keyboard access.
- Accessible focus indicators.

Review all nine sections.

Pay special attention to:

**Dashboard:** Market overview, selected instrument, provenance, chart, research status and next actions.

**Markets:** Instrument discovery, search, filtering, source quality and watchlists.

**Trading Terminal:** Chart prominence, tools, indicators, overlays, market context and evidence.

**AI Intelligence:** Readable research, opposing views, citations, scenarios and model availability.

**Risk Desk:** Clear financial assumptions, validated calculations and risk boundaries.

**Portfolio:** Honest simulated/research performance, without fictional broker positions.

**Trade Journal:** Saved decisions, review history, source evidence and import/export.

**Broker Accounts:** Truthful unavailable/read-only states, accessibility and no deceptive connection claims.

**Settings:** Preferences, language, theme, safe storage controls and clear feature availability.

Before every visual change, capture baseline screenshots.

After implementation, compare matching viewport, language, theme and application state.

Test 1440px, 1024px, 768px, 390px and narrower widths where existing coverage requires it.

Test both languages and both themes.

Check long Arabic strings, mixed-direction financial values, modal dialogs, sticky headers, scroll containers, keyboard operation and browser zoom.

Do not reduce chart usability simply to make another panel larger.

Major visual redesigns require owner approval.

# 15. APPLICATION PERFORMANCE AND MAINTAINABILITY

Audit:

- Static asset sizes.
- Repeated downloads.
- Cache policies.
- Vercel function usage.
- Large scripts and stylesheets.
- Duplicate DOM observers.
- Excessive event listeners.
- Chart rendering frequency.
- Unnecessary market API requests.
- Unbounded data structures.
- Memory usage.
- Startup time.
- Browser responsiveness.

The October audit identified an approximately 4 MB `logo.svg` and extensive repeated asset transfers.

Recheck whether this remains true.

Optimize only after collecting current measurements.

Prefer:

- Safe image/vector optimization.
- Appropriate static asset caching.
- Resource reuse.
- Request coalescing where context-safe.
- Lazy loading for noncritical features.
- Incremental extraction of duplicated UI logic.
- Centralized capability/error states.
- Stable cleanup of listeners and observers.

Keep API privacy headers distinct from static caching policies.

Do not weaken CSP, authentication, or data freshness to increase performance.

The legacy application contains large central files and overlapping UI/state paths. Refactor incrementally, with regression tests, rather than performing a wholesale rewrite.

# 16. SECURITY AND OPERATIONAL RELIABILITY

Audit security boundaries and document verified findings.

Review:

- Route authorization.
- Hosted financial-operation denial.
- Input validation.
- Output encoding.
- XSS risks.
- Third-party script handling.
- CSP feasibility.
- Dependency vulnerabilities.
- Secrets handling.
- Sensitive logging.
- File import/export handling.
- Request limits.
- Provider timeouts.
- Server-side concurrency.
- Error disclosure.
- Data persistence.
- Account and tenant boundaries.
- Backup and restoration.
- Audit event integrity.

Do not interpret the absence of discovered vulnerabilities as a security certification.

Avoid active penetration testing of third-party services.

Use controlled local tests and authorized safe production smoke tests.

Do not disable Vercel Deployment Protection.

Do not log tokens or secret values.

For CSP changes, assess the currently loaded official chart and third-party integrations; use a staged rollout and regression coverage.

For major security architecture changes, prepare a dedicated PR and obtain approval before deployment.

# 17. GITHUB AND CI/CD HARDENING

Inspect `.github/workflows/ci.yml`, `vercel.json`, and GitHub repository policy.

The initial inspection found `main` unprotected.

Recommend enforcing:

- Pull-request review for important releases.
- Required passing CI jobs.
- No force pushes.
- No history deletion.
- No bypass of mandatory checks.
- Branch-to-production deployment alignment.
- Preview verification before substantial changes.
- Release SHA traceability.
- Documented rollback.

Determine the exact current workflow check names before proposing rules.

Do not modify repository administration settings without the necessary owner approval.

Do not create new Vercel projects.

Do not disable existing Preview or Production protections to make a check pass.

Do not treat `develop` as the current engineering baseline without comparing it to `main`; historical branch histories may be unrelated.

# 18. MANDATORY AUTOMATED TESTS

Use the exact current scripts from `package.json`, not assumptions copied from older releases.

For the inspected baseline, mandatory commands include:

```bash
npm run build
npm run lint
npm test
npm run test:system
npm run test:browser
npm run test:security
npm run package:production
python3 scripts/ci/check-workflow.py
node scripts/ci/dependency-audit.mjs
```

Also run the existing source-integrity guard, frozen dependency installation, Git integrity checks and numerical parity checks as configured in current CI.

Review the actual CI workflow for the correct invocation and pinned runtime versions.

The existing `lint` script is primarily syntax checking; do not describe it as a complete semantic lint or static-security audit.

Add targeted tests for changed behavior.

At minimum, verify:

- Numerical correctness.
- Financial input boundaries.
- Stable API contracts.
- Security restrictions.
- Research identity and freshness.
- Historical reproducibility.
- Persistence failure recovery.
- Arabic/English rendering.
- Responsive layout.
- Keyboard interactions.
- Accessibility.
- Error handling.
- No accidental broker activation.
- No fabricated outcomes.

Never suppress a failure merely to continue releasing.

If any required test fails, diagnose the root cause, correct it, rerun the affected checks, then complete the required full regression suite on the final code.

# 19. VERCEL PREVIEW ACCEPTANCE

Every substantive milestone must use the existing Preview environment when available.

Verify:

1. Preview deployment is READY.
2. Deployment SHA matches the PR head commit.
3. Homepage returns the expected response.
4. `/api/health` responds correctly.
5. Required read-only APIs return valid contracts.
6. The application loads without unexpected browser errors.
7. Major user journeys work.
8. English and Arabic layouts function.
9. Desktop and mobile layouts remain usable.
10. Screenshots show intended changes.
11. Sensitive/financial operations remain disabled.
12. No release-blocking security or numerical regression remains.

Use fixture-backed tests where necessary, but distinguish them from live-provider tests.

Do not present a Preview HTTP 200 as proof that all flows work.

# 20. PRODUCTION RELEASE POLICY

For routine low-risk changes:

- Complete implementation on a dedicated branch.
- Run all mandatory checks.
- Open or update a PR.
- Inspect the final diff.
- Confirm relevant Preview functionality.
- Classify the change as low risk with written justification.
- Merge only when repository policies permit and all required gates pass.
- Verify the existing Vercel integration deploys the intended commit.
- Run read-only Production smoke tests.
- Publish actual release evidence.

For major or high-risk changes:

- Complete the candidate.
- Verify tests and Preview.
- Provide before/after evidence.
- Explain the impact, risks and rollback.
- Request explicit owner approval before merging or deploying.

Never use a direct push to `main` as a shortcut around the requested PR workflow.

Never classify significant financial, security, architectural or UI changes as low-risk simply to avoid approval.

# 21. POST-DEPLOYMENT VERIFICATION

After an authorized merge:

1. Record the exact merged commit SHA.
2. Inspect the Vercel Production deployment.
3. Confirm Production target and deployment state.
4. Confirm the deployment references the intended commit.
5. Confirm the production domain points to the expected deployment.
6. Verify homepage and health endpoint.
7. Verify safe read-only market/research endpoints.
8. Check application errors and relevant runtime logs.
9. Test representative navigation and UI where browser access is available.
10. Confirm prohibited financial capabilities remain disabled.
11. Record any verification blocked by network or access restrictions.
12. Compare observed status with release acceptance criteria.

If the deployment is unhealthy, stop subsequent releases and execute the approved recovery procedure.

Prefer a normal revert commit or approved Vercel rollback. Never force-reset shared Git history.

# 22. DEVELOPMENT MILESTONES

Work in this priority order, adjusting only when current evidence justifies a change.

## M0 — Current-state audit and release baseline

Deliver a verified inventory, deployment mapping, unresolved-defect register, CI assessment and rollback baseline.

Do not repeat completed historical investigation without need.

## M1 — Unified workstation acceptance

Review, improve and validate the existing PR #14 candidate.

Deliver a connected market-analysis-to-risk-to-research experience.

Major UI integration requires explicit approval before release.

## M2 — Data and API reliability

Fix confirmed API routing defects.

Strengthen source freshness, error states, consistency, provider contract handling and stale-context protection.

Prefer small, backward-compatible PRs.

## M3 — Financial workflow reliability

Verify authoritative risk plans, paper-intent recovery, storage failures and outcome classification.

Fix proven defects without relaxing existing protections.

High-risk financial changes require approval.

## M4 — Quantitative research experience

Improve historical report interpretation, strategy comparison, holdout evidence, assumptions, and reproducible analysis.

Preserve numerical engine authority.

## M5 — Professional workstation polish

Improve charts, information hierarchy, responsive presentation, Arabic/English, accessibility and performance.

Keep a cohesive visual identity.

Major redesign requires acceptance.

## M6 — AI Copilot readiness

Evaluate authorized local/model integration, inference traceability, citations, safety, costs and quality.

Do not claim a genuine model is active until demonstrated.

## M7 — Persistence and account architecture

Design secure multi-user research storage, authentication, recovery and tenant isolation as a separately approved architecture milestone.

Do not activate hosted accounts or migrate data without approval.

## M8 — Monitoring and advanced research

Extend validated market scanning, alerts, statistical evaluation, portfolio analysis and strategy research using verified data.

Notifications must be opt-in.

## M9 — Future broker integration

Remain research/read-only-first.

Investigate official broker APIs, eligibility, permissions, secure token handling and account reconciliation.

Do not activate real broker credentials, live orders or money movement without separate explicit approval.

# 23. REQUIRED DELIVERABLES AFTER EACH MILESTONE

Provide a concise but complete engineering release report containing:

**A. Milestone identification**

- Milestone name.
- Branch.
- Commit SHA.
- PR link.
- Baseline SHA.

**B. Findings**

- Verified defects.
- Root causes.
- Current limitations.
- Evidence sources.

**C. Actual implementation**

- Files changed.
- Behavior improved.
- Interfaces affected.
- Existing features preserved.
- Any API/schema changes.

**D. Verification**

- Exact commands executed.
- Test counts and outcomes.
- Numerical tests.
- Security tests.
- Browser tests.
- Accessibility tests.
- Preview verification.
- Evidence file locations.

**E. Risk**

- Low/medium/high classification.
- Reasons.
- Financial/security impact.
- Known unresolved issues.
- Approval requirements.

**F. Release**

- Deployment ID and URL.
- Exact deployed SHA.
- Production status.
- Smoke-test results.
- Rollback reference.

**G. Next work**

- Highest-priority remaining defect.
- Next implementation milestone.
- Dependencies and blockers.

Never claim that a test ran or passed when it was not executed.

Never claim Production is verified only because Vercel says READY.

# 24. DEFINITION OF DONE

A milestone is complete only when:

1. Meaningful source changes have been implemented.
2. The implementation works in the intended environment.
3. Existing functionality remains intact.
4. Relevant automated tests pass.
5. Required full regression tests pass.
6. Security and financial safeguards remain active.
7. The UX is usable in both languages.
8. Responsive behavior is verified.
9. The final diff has been reviewed.
10. Preview is verified when applicable.
11. Deployment follows the correct authorization policy.
12. Production status is verified separately after release.
13. Evidence and rollback information are documented.
14. Remaining limitations are disclosed accurately.

Documentation without functioning implementation is not sufficient.

A successful push without deployment verification is not sufficient.

A visually attractive interface without reliable operation is not sufficient.

# 25. IMMEDIATE EXECUTION ORDER

Begin now.

**Step 1:** Synchronize with the canonical repository and inspect the current `main`, branches, PRs, CI, deployment state and source tree.

**Step 2:** Review the uploaded/committed product vision and roadmap alongside current implementation. Identify verified deviations.

**Step 3:** Inspect PR #14 and its existing Preview and test results. Do not duplicate this already completed development.

**Step 4:** Independently audit the candidate's functional, responsive, numerical and security behavior. Fix any confirmed defects on its development branch and rerun the mandatory gates.

**Step 5:** In parallel only where safe, create a separate focused branch for the confirmed unknown-API-route HTTP 200 issue. Implement the smallest compatible fix, add regression tests, and take it through the established low-risk release workflow if all gates pass.

**Step 6:** Record unresolved items from the earlier F01–F16 audit, explicitly distinguishing fixed, partially fixed and still reproducible findings.

**Step 7:** Report the updated state, actual code changes, test evidence, PR status, Preview evidence, Production status and next practical milestone.

Do not merge PR #14 without explicit approval, as it is a significant interface/workflow integration.

Do not activate brokers, live trading, paid AI, paid infrastructure or destructive migrations.

Do not stop after preparing documentation if authorized safe implementation work can proceed.

**Final objective:** Transform THN AI Trader, through measured and verified releases, into a visually distinctive, trustworthy, quantitatively credible, bilingual trading research platform whose real capabilities match its claims.

**Start with M0 and M1 immediately, while allowing an independent, safe M2 API-routing correction. Deliver actual engineering results rather than another planning-only response.**
