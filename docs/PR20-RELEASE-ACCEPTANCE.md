# PR #20 release acceptance and rollback

Status: owner approval required. This document authorizes no merge or deployment.
PR #17 remains a separate financial review; this research-only candidate does not
include it or require its merge. No engine, account, execution, or persistence
contract may be changed as part of this responsive correction.

## Pre-release checklist

- Record the final PR head, main head, CI run URLs and conclusions. All required
  source, numerical, system, security, dependency, packaging, integrity, browser
  and accessibility gates must pass on the actual candidate. An older green run
  is insufficient. A cancellation or timeout is a failed readiness gate.
- Confirm main is still an ancestor of the candidate, PR is conflict-free and
  the reviewed diff contains no PR #17 changes, runtime state or credentials.
  If main advances, review the changed relationship and repeat affected gates.
- Verify the existing project's unique Vercel Preview URL is READY and its full
  source SHA equals the candidate. A mutable branch alias is insufficient.
  Record any network restrictions; never substitute local screenshots for
  interactive Preview acceptance or weaken deployment protection.
- Inspect charts/ranges/candle lookup, citations and retained notes, historical
  ten-check evidence, original-record comparison and replay, Library navigation,
  hypothetical Risk Desk context, keyboard navigation/cancellation, EN/AR RTL,
  dark/light, and 1440/768/390 profiles. Include 160px overflow stress checks.
  Confirm hosted execution and hosted AI remain disabled; place no real orders.
- Record the actual active Production deployment ID, source SHA and alias as P0
  using the original Vercel project. Do not infer P0 from Git main alone.
- Obtain explicit owner acceptance of this exact candidate and release. The
  existing main integration automatically deploys Production; approval must
  cover both integration and that automatic deployment.

## Approved integration procedure (not executed)

Use Squash and Merge, subject to repository support, to preserve canonical linear
history and produce one identifiable release commit M. The release guard rejects
merge commits; do not alter that guard or repository settings to bypass it.
Record M, verify GitHub main and its required CI, then verify the existing Vercel
Production deployment is READY and sourced from M. Check health/catalog, static
assets, unknown-API 404, disabled hosted execution/AI and the interactive workflow
where authorized access is available. State separately any verification blocked
by access restrictions. Never claim local tests prove Production behavior.

## Rollback procedure (prepared only)

1. On an approved release failure, record the failing M/deployment and preserve
   logs. With owner authorization, restore the recorded P0 deployment in the
   SAME Vercel project using its supported rollback workflow. Verify identity,
   alias and safe smoke checks. Do not create infrastructure or weaken protection.
2. Reconcile source history before subsequent releases: fetch current main,
   create a short-lived rollback branch, and revert the actual squash commit M
   with `git revert M`. Never revert the old feature head instead of M. If other
   commits intervened, inspect conflicts and preserve them; do not reset main.
3. Run all required gates on the revert, review and obtain owner release approval,
   then integrate normally and verify the resulting Production deployment.
   A platform rollback alone does not change Git; retain both identities.
4. Preserve browser research, account/audit files and credentials. No schema
   migration is introduced here. Never delete locks, rewrite financial state or
   automatically reconcile Issue #18 audit failures as a rollback shortcut.

No force push, history reset, automatic financial approval, merge or Production
mutation has been performed by preparing this checklist.
