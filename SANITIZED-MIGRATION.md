# Sanitized development candidate — local only

## Scope and identity

This local working copy prepares safe development source for eventual use of the
existing Thaniyan/thn-ai-trader repository. No new GitHub repository, remote branch,
PR, deployment, cloud-setting change or production modification was made. No new
product sprint was started. The original checkout and all recovery archives remain
unchanged at their existing locations.

Original source HEAD: 3b641fcfac6f4e0f326a0f056529620a2419616d.
Candidate branch: security/sanitized-development-3b641fc.
SANITIZATION-MAP.json maps six original reviewed milestones to reconstructed
commits. These are new, truthfully labeled snapshots authored by an automated local
sanitization identity; original human authorship is not impersonated. Git hashes,
parentage and metadata necessarily differ. No original parent/commit object is
imported. The root is the reconciled source snapshot, followed by the reviewed
reconciliation documentation, owner isolation assessment, UX and market/paper work.
Earlier product implementation is retained in that snapshot, not as unsafe ancestor
commits. The separate final remediation commit adds this policy, map and regression
checks. Original milestone hashes in documentation are text, not reachable objects.

## Sensitive-data findings and removal

The protected source history has 18 commits, 216 unique historical blobs and 130
paths. Structured review found nine legacy account/audit JSON versions. Deleted
broker_accounts.json contains populated password/token and personal/contact fields;
credential authenticity is unknown and was not tested. Historical account balances,
equity, trades and audit identifiers are confidential regardless of PAPER labels.
A credential-prefix scan alone missed these fields and cannot certify safety.

No version of broker_accounts.json, trading_accounts.json, audit_log.json or
AUDIT_REPORT.md is imported into this candidate. Their known blob IDs and original
ancestry must not be reachable from any proposed branch/tag. No backup refs,
reflogs from the original, shared object store, alternate, graft or replace ref is
used. The selected snapshots are sanitized before any blob is written into this
independent Git object store. No temporary credential-bearing publication commit
is created and then deleted.

All retained app snapshots remove legacy broker login/account-number defaults,
password fallbacks and fallback registration/contact values. Four account inputs
are blank with generic placeholders. Certificate contact fallbacks say Not provided.
No secret values or private contact details are copied into scan reports/tests.
Known historical broker field values are compared locally against every retained
blob; short values are matched as complete quoted literals to avoid confusing
ordinary numeric constants with identifiers. Sensitive JSON/report blobs are also
checked by identity. Generic server-created paper sandbox identity, synthetic test
tokens and explicitly simulated contract/financial fixtures remain operational;
they are not historical broker records. Their provenance is test/source code.
The brand preview PNG was visually reviewed as a product concept illustration,
not a private account screenshot; it is not performance or readiness evidence.

Security checks combine historical-tree inventory, structured record review,
known-value/object exclusion, configuration inspection and regression tests. This
is strong bounded evidence, not a guarantee against every unknown secret, personal
identifier, steganographic content or future commit. Provider-side review/revocation
of any genuine Exness/MT5, MT5-bridge and XTB/xStation credentials remains the owner's
responsibility. This local cleanup does not erase copies in existing public Git
history, forks, caches or confidential recovery bundles.

## Functional comparison

All existing backend, risk, authentication, persistence, quote/freshness, disabled
broker and paper-execution implementation files are byte-identical to the source
HEAD. Frontend implementation differs only in privacy-related defaults/placeholders
in public/app.js and public/index.html. There is no framework/dependency/lockfile
change, live-execution enablement, network endpoint addition or deployment config
change. Reconciliation, nine-view EN/AR/RTL UX and market/paper reliability features
are retained. New checks cover absent sensitive ancestry and blank broker inputs.
The per-file source comparison and full test evidence are under
/workspace/reports/sanitized-migration. No real-provider, paid AI, WSL2, protected
HTTPS or hosted deployment result is claimed from fixture tests.

The archived scripts/reconciliation/baseline-review.py requires the intentionally
excluded original baseline object. It is not runnable from this sanitized history
alone and must not fetch or reintroduce that history. If historical comparison is
needed, run it only in the protected original archive with disposable fixture state.
It is not part of the normal app/test workflow.

## Completed validation

Build and lint pass (18 syntax targets). Node regressions pass 86/86, including
84 existing and two new history/privacy cases; system tests pass 10/10. Broad CSP
browser regression, 137/137 EN/AR responsive workspace checks, 11/11 release-browser
checks and 130/130 static routing checks pass. Accessibility passes 36 configured
EN/AR scans across dark/light themes; manual accessibility review remains necessary.
No final tests failed or were skipped. These are local fixture/model results.
The initial remediation run caught a still-prefilled sandbox account input in the
new privacy assertion; the sanitizer was corrected and the unchanged requirement
passes. Full logs, including the initial failure, are retained outside source.

## Local recovery and validation

A new sanitized-only bundle is prepared outside the repository. This is a source
recovery artifact, not an operational database/credential backup. Use a fresh
private destination and the exact externally reported checksum and candidate SHA:

```sh
sha256sum -c SHA256SUMS
git clone --mirror sanitized-development.bundle restored.git
git -C restored.git remote set-url --push origin /dev/null
git -C restored.git bundle verify /absolute/path/to/sanitized-development.bundle
git -C restored.git fsck --full
git clone --no-local -b security/sanitized-development-3b641fc restored.git working
git -C working remote set-url --push origin /dev/null
cd working
git rev-parse HEAD
node --test tests/sanitized-history.test.mjs
npm run build
npm run lint
node --test --test-concurrency=1 tests/*.test.mjs
node tests/run-system.mjs
```

Use Node24.x >=24.5. Python/Playwright/Chromium and external axe-core are required
for browser/accessibility commands in docs/QUALITY-STANDARDS.md. Existing fixture
harnesses use temporary state; do not copy runtime data, keys or node_modules.
A mirror clone preserves the candidate refs; later working clones expose other
branches as remote-tracking refs. The candidate currently has one branch and no tags.

## Public migration is a separate approval

The candidate has independent ancestry. Pushing it to a new branch would not itself
attach old main, but would not purge the public repository's other refs either.
A normal merge, rebase onto old main or cherry-pick onto old main reconnects the
sensitive ancestry and defeats the history-clean publication boundary. An ordinary
fast-forward to current public main is impossible. Do not use an unrelated-history
merge, force push, tag update or automatic PR to work around this.

Before any remote action: (1) verify a recoverable copy outside this cloud workspace,
(2) complete provider-side credential review, (3) inventory and approve original
repository/ref cleanup and deployment isolation, including Vercel previews, Render,
Apps and workflows, and (4) approve the exact resulting commit/ref and operations.
An eventual whole-repository history replacement would require separate explicit
approval, collaborator coordination, GitHub sensitive-data/cached-object cleanup
where applicable, and independent verification. No such operation is authorized or
performed here. Do not provide an executable force-push command as this plan's
routine next step.

For local rollback, leave the sanitized checkout and return to
/workspace/thn-ai-trader-reconciled on feature/market-paper-reliability at the
original SHA above. It still has the original reconciliation/UX branches. Treat
its history and existing full-history bundles as confidential and potentially
credential-bearing; do not import or publish them from this candidate.

**This local sanitization is NOT a durable backup.** Both local copies and all local
bundles can vanish together on a Codex reset. Do not reset, discard or clean away
the original workspace until a separate recoverable copy has been exported through
a supported route and verified outside it. Full-history preservation still requires
owner-recipient encryption; the owner must keep the private key outside Codex.
No supported attachment/private-storage transfer is currently exposed in this
session. Downloadable-looking workspace links do not prove an actual export.
