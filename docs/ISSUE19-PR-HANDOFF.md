# PR handoff — owner creation

Suggested title: **Integrate chart evidence, historical validation and saved-case workflows**

Base: `main`. Head: `feature/integrated-research-workstation-issue19-20261110`.

This candidate connects the existing chart, evidence review, Historical Lab, saved research and hypothetical planning into one working investigation workflow. Users can navigate loaded history, inspect exact bars, cite source evidence, evaluate chronological windows, compare current research with an immutable saved case and numerically replay retained candles. It removes duplicate selected-history requests without changing provider freshness or financial calculations.

Related: #19. Diagnostic evidence for #18; #17 remains independently financially gated. No rejected #16 design is integrated.

- Real application changes: `public/research-studio.js`, its read-only core/styles, original Library, chart-focus owner and confidence-test navigation.
- Evidence: `docs/evidence/issue19/README.md` includes 36 paired real-app screenshots, interactive examples and raw resource measurements.
- Engineering/financial boundaries: `docs/ISSUE19-INTEGRATED-PROGRAM.md` and `docs/ISSUE18-FAULT-INJECTION-EVIDENCE.md`.
- Numerical engines, saved-record schemas, account/intent/audit/adapter source and hosted financial restrictions are unchanged.

Verification results and exact candidate identity are supplied in the final delivery report. This is a review candidate: no main merge, Production deployment, financial acceptance or independent visual acceptance is implied. The owner will create the PR and verify Vercel through connected tools if workspace API access remains blocked.

Local mandatory verification passed: build/lint; 311 core/numerical/regression tests; 10 system checks; 21 security tests; all 34 browser suites in 25m38s; frozen dependencies; zero dependency advisories; packaging/workflow/source-integrity/Git fsck. Original assertions and timeouts are preserved.

Review details: [candidate report](https://github.com/Thaniyan/thn-ai-trader/blob/feature/integrated-research-workstation-issue19-20261110/docs/ISSUE19-RELEASE-CANDIDATE.md) and [paired evidence](https://github.com/Thaniyan/thn-ai-trader/blob/feature/integrated-research-workstation-issue19-20261110/docs/evidence/issue19/README.md).

Before integration, independently verify this branch's exact head SHA, hosted CI, and the existing Vercel Preview gitSource SHA. Workspace proxy CONNECT 403 prevents that external verification here. Do not merge or deploy Production without owner release approval.
