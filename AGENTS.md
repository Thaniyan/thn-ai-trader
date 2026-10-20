# Integrated v7 release contract

This branch is a descendant of canonical main ddd13c298103d93ced74fdb8bbf8c43f4579369c.
The independent candidate 9a7342d116d14354498898c8f7ae0b0d7c6a6086 remains a recovery reference in its separate checkout.
Owner explicitly authorized source-only integration onto original history on 2026-10-20.
Do not merge unrelated histories, rewrite history, or claim legacy history is sanitized.
Never restore historical account/audit/credential files into the working tree or artifact.
No push, deploy, settings changes, paid service or live execution without separate approval.
Read RELEASE-7.0.md and docs/V7-RELEASE-READINESS.md before release changes.
Node24.5+; built-in test fixtures, no external market/LLM calls in CI.
Required gates: npm run build; npm run lint; npm test; npm run test:system;
npm run test:browser; npm run test:security; npm run package:production;
python3 scripts/ci/check-workflow.py; node scripts/ci/dependency-audit.mjs.
Keep unit/integration/security/browser/accessibility/source/dependency gates fail-closed.
Preserve v6.6 numerical engines, EN/AR, RTL, all nine views and Library compatibility.
Hosted finance is unavailable, never ephemeral persistence presented as durable storage.
