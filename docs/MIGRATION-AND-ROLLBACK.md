# Local reconciliation, future migration and rollback

## What was prepared

A new local branch based exactly on original main
50857dfc1e45a901515b56ffe2ed914d897671af reconciles reviewed source files from private
staging b05f070c1c9b289bc5b39f833e4591f0bdd8d8ac. No unrelated histories are merged.
Original commits remain ancestors; staging provenance and per-file hashes are
recorded in reconciliation/file-assessment.json and RECONCILIATION-MANIFEST.json.
Runtime JSON, prior staging publication metadata and obsolete audit claims are
excluded. Historical public Git objects are not rewritten or scrubbed by deletion.

The local checkout's origin fetch URL identifies the original repository, but its
push URL is /dev/null as an accidental-push guard. No remote branch was created.
This local guard is not a GitHub access-control policy and is not deployment isolation.

## Publication gate — no executable publication command authorized

Before any future push: establish original hosting branch/preview triggers and
GitHub apps/hooks, verify visibility and intended public contents, protect production
environments/secrets, choose a non-production branch, pin the reviewed local SHA,
recheck remote main, and obtain explicit owner authorization for that exact ref.
Do not infer these settings from private staging's separate project. A dry-run
push does not prove hosting isolation. Do not push all branches/tags or import
unrelated staging history. Do not deploy root source to a static-only project.

## Minimum remaining isolation evidence

Use [Deployment isolation checklist](DEPLOYMENT-ISOLATION-CHECKLIST.md), which records
the current API failures and exact owner UI paths. Confirm every original-repository
Vercel connection, Production/Preview/custom branch tracking, live-domain assignment,
GitHub/Vercel hooks/apps and required automation. Check applicable branch and
environment protections without modifying them. The independent staging project's
previous settings are not evidence for the original production project.

GO for repository-only publication requires no automatic deployment of the exact
review ref, including Preview; no production promotion/alias path; applicable rule
compliance; fresh SHA/remote/security checks; and separate publication approval.
Unknown metadata or default automatic Preview means NO-GO under the current scope.
Any needed isolation setting change or protected Preview requires a separate approval.
Do not use a trial push, PR or deployment to discover triggers. Existing candidate
c87af55 and reproducible artifacts remain local; no migration or rollback action
has been performed. This follow-up is documentation only.

### Latest owner evidence and readiness assessment

The owner verified thn-ai-trader.vercel.app is assigned to Production, Production
tracks main, Preview tracks All unassigned branches, and Vercel Authentication uses
Standard Protection. Vercel Deploy Hooks and GitHub repository Webhooks are empty;
no GitHub Rulesets exist. Actions are allowed with default GITHUB_TOKEN read-only.
Installed GitHub Apps are ChatGPT Codex Connector, Google AI Studio, Render and
Vercel. No settings changed. These observations supersede earlier broad statements
that the corresponding facts were wholly unknown; they are owner evidence, not API
verification. Prior auto-assign-custom-production-domain observation remains recorded.

A non-main push is expected to create Vercel Preview, not directly Production through
observed branch tracking. Publication remains NO-GO because that Preview is not
approved, and external integration behavior is unresolved. Standard Protection is
not All Deployments protection or proof against exceptions. Empty repository hooks
do not clear GitHub Apps: their own event subscriptions are separate. Default
read-only GITHUB_TOKEN does not restrict Render/Vercel app credentials or every
workflow's cloud access. No Rulesets does not establish legacy branch protection.

The remaining-only checklist covers Render service/branch/auto-deploy and preview
mapping, other Vercel project/custom-environment/domain overrides, Standard Protection
exceptions, and Google AI Studio/app/workflow automation. These need read-only owner
evidence because cloud metadata access is unavailable. No product code change is
needed to document the risk; completed tests remain applicable.

Minimum approval gates after verification: separately authorize either a narrowly
specified isolation change (no automatic deployments of the exact review ref) OR
explicitly authorize its verified protected Preview deployment scope. Then approve
one exact source SHA and absent non-main GitHub ref, with other services excluded
and Production promotion prohibited. Neither approval is provided by this task.
Candidate c87af55bfa5c492fe017ab72220cd4d32216f905 is unchanged; only local report
edits are prepared. No push, deployment, production change or test repetition.

## Review and promotion proposal

1. Review the complete original-base diff and provenance offline. Reproduce tests
   in a clean local clone without staging Git objects. Keep private data outside it.
2. After isolation and authorization, publish only the approved development ref.
   Require reviewed CI and protected staging before production promotion.
3. Promote a release candidate only via explicit reviewed release approval. Pin
   source commit, runtime, artifact checksum and config revision. Preserve original
   production deployment configuration until separately reviewed; it currently has
   no tracked Vercel configuration. This document changes no hosting setting.
4. Existing production Node18-era deployment is not compatible evidence for the
   Node24/SQLite backend. A durable service, access gates and data migration need
   separate design/rehearsal; no blind filesystem copy or implicit key generation.

## Rollback rules

Local candidate: keep the checkout/branch for review or discard the separate local
checkout after preserving review evidence. Original remotes and staging are unchanged;
there is no production rollback to perform for this task. Avoid destructive reset
commands in the owner's working checkout.

Future hosted frontend: preserve the previous approved deployment ID and artifact;
use the provider's separately authorized rollback to that immutable artifact, verify
protection, routes and no-store, then smoke-test. No rollback command is executed here.

Future backend/data: stop only the owned service and drain transactions; checkpoint
and verify SQLite; preserve the encryption key, credentials, certificates and complete
backup set separately from source. Rehearse restore with an integrity check and
ledger/account counts in an isolated copy. Code rollback requires schema compatibility;
restoring an old database after new fills loses transactions and must never happen
silently. Review any open positions/pending orders; do not generate synthetic exits.

Imported local-staging tools retain explicit approval/open-position/known-release
gates and reject unknown edits. Their fixture tests are not authorization or a
universal upgrade path. The owner's WSL2 instance requires a new inventory and
separate exact installation approval; it was not accessed.
