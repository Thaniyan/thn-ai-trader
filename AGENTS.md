# Integrated v7 release contract

## Owner branch directive — 2026-11-02

The owner requires all completed past, present and future changes to be delivered
to `main`. Use `main` as the destination for future pushes; feature-branch-only
delivery does not fulfill the owner's request. Preserve remote updates and use
normal, non-forced pushes. Deployment, paid resources and real financial
operations remain subject to their separate authorization boundaries.

## Active development and deployment — owner directive, 2026-11-04

Routine, low-risk improvements are authorized through implementation, required
verification, commit/push to main, existing Vercel deployment and Production
verification without another approval. Major changes use a development branch
and the existing Vercel Preview workflow before owner acceptance where needed
and integration into main. Do not create duplicate projects or infrastructure.
The user's current direct instructions supersede older approval wording below
and in historical release/vision documents. Preserve all release gates.
Explicit approval is still required for real-money/broker execution, destructive
data operations, significant security changes and new paid infrastructure.
Keep a rollback commit and report actual deployment evidence separately from Git.
Product priorities and verified limitations: docs/PRODUCT-ROADMAP.md.

## Release requirements

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
