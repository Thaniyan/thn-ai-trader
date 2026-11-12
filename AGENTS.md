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

## Main-First release directive — 2026-11-10

Main is authoritative. Use short-lived development branches and one substantial
integrated release at a time; finish PR #20 before starting another major branch.
Push verified PR #20 corrections to its existing development branch. Owner approval
is required before merging PR #20 or deploying Production; no automatic merge.
Keep PR #17 separate and subject to financial approval. Preserve every existing
gate, hosted execution restriction, and canonical linear history. After approval,
integrate promptly through the existing release workflow without force pushes.

## Authoritative Issue #21 — 2026-11-10

The owner explicitly authorizes evolving the existing PR #20 candidate into the
AI-first Trading Command Center defined in GitHub Issue #21, reusing verified
research functionality. Continue on its existing feature branch rather than
accumulating another major branch. This supersedes the earlier visual scope,
not the release gates. Target owner review: November 17, 2026 (Asia/Muscat).
Keep genuine model execution disabled unless separately authorized and verified.
Use existing engine results and planner; never invent prices, probabilities or
execution approval. Keep PR #17 and Issue #18 financial work separate. No merge
into main or Production deployment without explicit owner release approval.

## Owner professional refinement — 2026-11-11

Continue PR #20 on its existing branch toward the evidence-first Command Center,
per https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6803982233 .
The green `7fedc5b` candidate is a review baseline, not release approval. Improve
the real chart, coordinate-linked references, multi-timeframe/contrary evidence,
context provenance and EN/AR responsive workflow. Preserve the numerical engines,
financial restrictions, all original modules and full CI gates. Provide genuine
before/after captures and an exact-head Preview for owner acceptance. PR #17 and
Issue #18 stay separate. No main merge or Production deployment is authorized.

## Owner institutional refinement — 2026-11-12

Continue existing PR #20 from reviewed `1fbff005`, per
https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6833948553 .
The owner requires one coherent chart-led improvement: concise decision evidence,
source-inspectable chart layers/candles, contextual hypothetical scenarios and
one-page research actions. Preserve all original browser assertions, engines,
financial restrictions and architecture. Report matched before/after observations,
viewport geometry and workflow steps at 1440/1024/390 with EN/AR and themes.
Keep PR #17 and Issue #18 separate. No main merge or Production deployment is
approved; final exact-head CI and matching READY Preview precede owner acceptance.

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
