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
