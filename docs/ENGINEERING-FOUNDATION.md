# Development, CI and controlled release foundation

Status: LOCAL ONLY, 18 October 2026. CI is implemented; CD is a design requiring
separate approval. No publication, infrastructure or deployment is authorized.
This document supersedes historical no-workflow guidance for validation CI only.

Later local isolation change: VERCEL-DEVELOP-ISOLATION.md documents the authorized
root Git deployment gate and current owner observations. Its root-config and Render
findings supersede the corresponding historical absence/uncertainty statements below.

## Architecture and deployment baseline

Original Thaniyan/thn-ai-trader main was rechecked at
50857dfc1e45a901515b56ffe2ed914d897671af; remote develop is absent. The original
checkout remains on work. Sanitized source is
30a45ea767117afc27580829f482b728e273eaf7, seven commits with independent root
2d6b1cf115b5faff87b57fb9c17ad2f8d52d2ae2. The local feature/ci-cd-foundation branch
descends from that tip; no legacy main objects or parents are imported.

The app remains browser HTML/CSS/JS plus persistent Node24, server identity/risk,
market providers and paper worker, and single-writer SQLite WAL/FULL persistence.
No framework, application, dependency declaration, lockfile or hosting change is
needed for this foundation. Existing legacy production remains dependent on its
current main, original Vercel project/build settings, domains, environment values
and backend/provider bindings. Actual hosted backend/data/key/recovery state cannot
be established from source; inventory it before any production migration.

Recorded owner evidence: Vercel Production tracks main, production domain belongs
to Production, Preview tracks All unassigned branches, Standard Protection enabled.
A develop/feature push is expected to create Preview. Authentication does not stop
deployment. Render services/branches/previews, other Vercel projects/custom targets,
domain overrides, protection exceptions and Google AI Studio automation remain
unverified. Empty repository hooks do not disable app-level event subscriptions;
read-only GITHUB_TOKEN defaults do not limit installed-app credentials. Failed
metadata reads never establish absent integration. Original main and candidate
have no active root deployment configuration; inactive templates cannot isolate
the original connected project. This feature adds only validation Actions.

## Branching and protections (proposal, not installed)

Clean develop becomes the original repository's only active integration branch.
feature/*, fix/* and docs/* descend from it and PR back; release/* descends from
a reviewed clean tip. Keep legacy main as existing production until a separately
approved cutover. Never merge unrelated roots, rebase/cherry-pick sanitized work
onto legacy main, or merge legacy hotfix ancestry into develop. Port reviewed
source edits without legacy parents, then scan/retest. Private staging becomes a
recovery/provenance archive, not another development main.

Propose PR-required protection on develop/release branches: one independent review,
dismiss stale approvals, review latest push, resolve conversations, require checks
`Source and tests`, `Browser and accessibility`, `Dependency audit`, require current
base before merge, restrict direct pushes/admin bypass, forbid force pushes/deletion.
Bootstrap publication needs a narrowly recorded owner exception if protection blocks
initial creation. A sole maintainer cannot independently review their own work;
record/approve any temporary exception. Merge queue needs a separately implemented
merge_group trigger before enabling. Choose same-lineage merge or squash policy;
do not mandate linear history while expecting merge commits.

CODEOWNERS should protect .github/, scripts/ci/, dependency/tool pins, auth/risk/
storage/encryption, deployment and release docs. Owner must supply eligible
write-access reviewer/team before adding the file and requiring code-owner reviews;
no invented or ineffective placeholder owner is installed. Guards/workflows are
editable branch code, so independent review of their changes remains necessary.

Enable available platform secret scanning and push protection after reviewing scope;
patterns here cannot certify all secrets. Dependency updates should be reviewed,
bounded weekly PRs targeting develop, no auto-merge. Confirm Bun lock support before
installing an update bot; otherwise use a scheduled maintainer task. No Dependabot
config is installed while default main remains legacy and tool support is unknown.
Protect immutable v*/rc-* tags from replacement/deletion. Keep approvals, SHA/digest,
check results, runtime, backup reference and rollback outcome in sanitized release
records. Provider secrets and operational backups never belong in those records.

## Implemented CI

.github/workflows/ci.yml has three read-only jobs on clean branch pushes and PRs
targeting develop/release. No main/tag deployment trigger, cloud environment,
secrets, OIDC, write permission, privileged PR event or deployment step. No caches,
self-hosted runners, stored checkout credentials, PR comments or artifact uploads.
Use disposable hosted runners; never attach production credentials to this workflow.
Public fork code remains untrusted even when it passes tests.

PR checkout uses the explicit head SHA, not the synthetic merge commit. Verify job
starts shallow then fetches ONLY that SHA's ancestry with --unshallow, --no-tags,
--no-recurse-submodules. Never fetch all refs/main/tags to satisfy a test. Subsequent
credential-free fetch assumes this intended PUBLIC repository remains readable.
The guard requires the sanitized root/anchor, rejects identified sensitive objects
even if unreachable, scans all committed trees for runtime artifacts and all blobs
for strong secret patterns. It does not scan untracked files or discover all unknown
secret formats. Run it after committing the reviewed change too. PR head testing
does not prove a merge against a moving base; update from current CLEAN develop
and require fresh checks before merge.

Source and tests: Node24.19.0, Bun1.4.3 frozen install with lifecycle scripts disabled,
build/lint, full serial Node regressions and isolated system tests. Existing suites
cover auth/CSRF, provider identity/freshness/outages, risk, paper worker, ledger,
concurrency, key failure, SQLite recovery and static/release integrity tampering.
New tests cover deleted runtime artifacts, foreign ancestry and audit fail-closed
behavior. Bun1.3 cannot read the existing version-2 lock; 1.4.3 was tested without
regeneration. Full action SHAs were resolved from release tags during preparation.
actionlint1.7.7 checks YAML/expressions using a TLS-download with pinned SHA-256.

Browser and accessibility: Python3.12.14, Playwright1.62.0 with pinned, SHA-256-checked
Linux/CPython3.12 wheels and Chromium, axe-core4.10.3 outside source. Broad CSP, release,
workspace, static routing and EN/AR dark/light accessibility suites use disposable
loopback fixtures and block external browser traffic. No provider credentials.
No QA screenshots/state are uploaded. Tool installation requires network; all
versions are reviewed pins, but hosted runner images and registry availability
remain external dependencies. Automated accessibility needs manual review too.

Dependency audit: Bun public advisory lookup of bun.lock. High/critical block;
moderate/low/info are reported and need documented triage before production release.
Network/tool/schema failures and unknown severities block. No continue-on-error or
permanent bypass. Any future exception needs specific advisory, rationale, expiry,
compensating controls and separately reviewed implementation. Empty advisory output
is point-in-time evidence. Audit does not cover vendored public/d3.min.js or every
external tool; review their provenance/advisories separately. Unused declared SDK
cleanup is outside scope. No lifecycle scripts are enabled to make install succeed.

Local source/test equivalent, with pinned tooling installed outside source:

```sh
bun install --frozen-lockfile --ignore-scripts
node scripts/ci/source-guard.mjs
python3 scripts/ci/check-workflow.py
node scripts/ci/dependency-audit.mjs
npm run build
npm run lint
node --test --test-concurrency=1 tests/*.test.mjs
node tests/run-system.mjs
```

Run browser commands in QUALITY-STANDARDS with fresh output paths; use both
ACCESSIBILITY_THEME values. Local simulation is not a hosted Actions run. No hosted
CI success, real providers, protected HTTPS or production behavior is claimed.

## Protected full-application staging (design only)

Prefer a dedicated persistent Linux Node24 service serving existing frontend and API
on the same gateway-protected HTTPS origin. Reverse proxy terminates TLS; backend
port is private. This preserves same-origin cookies/CSRF/CSP. If frontend is later
split, route API under the same protected origin to the persistent backend and
test forwarded headers/cookies. Static offline Preview is never full-app evidence.

One unprivileged writer, dedicated durable local volume and SQLite WAL/FULL with
existing writer lock/transactions; no serverless filesystem, shared network SQLite
or multiple workers. Horizontal scaling requires a future auth/persistence design.
Restrict gateway access and retain application owner authorization. Use exact HTTPS
public origin and Secure/HttpOnly cookies. Separate staging tokens, encryption key,
origin, volume, provider quotas and backups from production; CI gets none. Start
from synthetic/new paper state, no production accounts or copied confidential data.
External adapters stay disabled; paid AI/provider connections off by default.

Use existing consistent SQLite backup tooling, encryption/access controls and keys
held outside source. Proposed initial objectives: daily and pre-release backup,
7 daily/4 weekly copies, 24h RPO/4h RTO, subject to owner approval and restore drill.
Source recovery is not database/key recovery. Restore must verify checksum/integrity,
correct key, schema, balances/ledger and lock exclusion on a disposable instance.

Monitor readiness, disk/WAL growth, writer failures, backup age, auth failures and
provider timeout/429/cooldown/freshness. Liveness must not restart the app merely for
provider degradation. Emit sanitized correlation IDs; never tokens/account content.
Market diagnostics show source, instrument match, quote age and honest unavailable
states. Fixtures do not establish feed licensing, quotas or real latency.

Future staging CD requires separate approval: reviewed clean SHA plus source/artifact
SHA-256 manifest, isolated allowlist build, dedicated staging-only deploy identity,
protected environment and serial deploys. No Git objects, runtime data or copied
node_modules in artifacts. Credential-bearing deployment must not execute unreviewed
PR code. Verify digest, snapshot/verify backup, stop writer and switch versioned
service. CI implemented here cannot deploy and gets no deployment identity.

Hosted smoke must check protected anonymous denial, identity/CSRF/session behavior,
nine-view EN/AR mobile loading, honest provider outage, paper idempotency, restart
durability, ledger consistency and restore. Test actual HTTPS/protection exceptions.
Record SHA/digest, environment, approval, backup/key references and result without
secret values. Failed rollout retains previous artifact/data; no automatic promotion.

## Clean-lineage production migration and rollback

1. Maintain existing production/main unchanged while full staging is demonstrated.
   Inventory actual service/data/keys and credential revocation needs. Clean develop
   does not erase legacy public main, caches, forks or old clones.
2. Separately approve a clean production branch, e.g. production-clean, descending
   ONLY from a reviewed clean release. Never merge legacy main into it or force
   update main. Owner approves branch binding/default-branch/domain changes and
   any coordinated GitHub sensitive-history cleanup separately. No cleanup command
   is part of this implementation.
3. Build immutable release from exact approved SHA with digest provenance; approve
   protected immutable tag. Signing/attestation publication is a future trust/permission
   design, not implemented. Existing CI does not deploy on tags.
4. Rehearse cutover and rollback in staging. Approve production window, exact service/
   domain operations and restore points. Stop writers and capture consistent state.
   Operational data migration remains confidential and outside public Git/artifacts.
5. Promote only reviewed artifact through a separate human-gated deploy; keep prior
   service/artifact and compatible backup. Switch routing after smoke; monitor and
   record. This requires no connection to legacy Git ancestry.
6. Rollback uses previous verified artifact/service/domain configuration. Restore a
   backup only when schema compatibility requires it and owner accepts loss of later
   writes. Never use old code against incompatible data or regenerate encryption
   keys. Serialize writer, verify health and ledger, then reopen access. A source
   transition fixture is not proof of actual production data recovery.

## Remaining gates and minimum owner actions

NO-GO for develop publication until owner supplies missing current integration
mapping, authorizes a narrow change preventing all automatic deployments (or
separately approves exact protected Preview scope), verifies resulting isolation,
confirms provider credential review/revocation where applicable and reviews this
public-source/CI diff. Known exclusions and bounded scans support source selection,
not exhaustive unknown-secret certification or remediation of prior exposure.

Confirm eligible reviewers/protection expectations and any bootstrap exception;
recheck destination absence/main and approve the NEW feature tip for
Thaniyan/thn-ai-trader:refs/heads/develop. Approval of sanitized 30a45ea alone does
not include this CI commit. Hosting settings, protections, default-branch changes,
staging provisioning, credentials, CD and production cutover are separate approvals.
No pushes, deployments, cloud changes, paid services or live trading occur here.

## Local verification evidence

Preparation on Node24.19.0/Python3.12.14: build and lint PASS (18 existing syntax
targets plus explicit CI script syntax checks); 89/89 Node tests including three
new CI guard/policy regressions; 10/10 system tests; broad CSP browser PASS;
137/137 workspace, 11/11 release browser and 130/130 static routing checks;
36 dark/light EN/AR accessibility scans with no configured violations. Frozen
Bun1.4.3 install preserves package.json/bun.lock, audit reports zero advisories,
actionlint validates the workflow and pinned Python wheel hashes verify. No
application/server/public files changed. Logs remain outside source under
/workspace/work/thn-migration-20261018/foundation-validation.

Local browser evidence uses existing /usr/bin/chromium; CI will use Playwright's
downloaded Chromium on ubuntu-24.04. Hosted setup/actions/browser compatibility is
not yet exercised. A final committed-history guard and a disposable shallow clone
fetch rehearsal verify the feature tip before reporting readiness. See the final
local report for exact commit; this document does not embed its own future hash.
No claim of signed release provenance, live provider/HTTPS, Windows/WSL2, production
recovery or complete manual accessibility/security review is made.
