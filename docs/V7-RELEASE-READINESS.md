# Integrated v7 release readiness — LOCAL ONLY

## Provenance and recovery

Canonical main was independently read through Git at `ddd13c298103d93ced74fdb8bbf8c43f4579369c`.
The branch `release/v7-integrated` starts directly from that commit. Reviewed source
changes were copied by an explicit file allowlist from independent candidate
`9a7342d116d14354498898c8f7ae0b0d7c6a6086`; no original candidate Git objects,
parents, refs, runtime records, node_modules, environment files or cloud links were copied.
`v7-port.json` records source SHA, destination baseline and per-file source hashes
before necessary packaging/test compatibility changes. The original independent
checkout/branch and its unchanged CI remain available as recovery references.
The original working checkout was not reset or switched.

This integrated branch preserves ORIGINAL history, as newly requested. It is not
an independently sanitized history and must never be described as such. Existing
historical audit/state objects are not erased by deleting their current paths.
The current source tree removes AUDIT_REPORT.md and metadata.json; production
packaging uses only an explicit runtime-source allowlist, never Git history.
No unrelated-history merge, cherry-pick of an unrelated root, rebase, force update,
replace ref, graft or history rewrite is used.

## Complete functionality retained

- Contextual EN/AR deterministic conversation, cancellation/retry, bounded history and deletion.
- Technical, bullish, bearish, quantitative, risk and manager research roles.
- Snapshot identity, provider/timestamp/dataset citations, future/stale/missing evidence safeguards.
- Existing quantitative/evaluation and hypothetical-risk context, opposing arguments and invalidation.
- Library save, validated backups/import preview, saved-context follow-ups, thesis and horizon.
- Append-only horizon-aware reflection, immutable original evidence, no automatic learning/profit claim.
- Explicitly authenticated, bounded optional local LLM adapter, disabled without configuration and on Vercel.
- All nine views, charts/SMC/drawings, numerical replay, research comparison, EN/AR/RTL/themes/mobile.
- Existing opt-in local paper engine. Public/hosted accounts and financial mutations stay unavailable.

All six core numerical files remain byte-identical to canonical v6.6: research,
backtest, evaluation, decision, replay and browser research-chart modules.

## CI reconciliation and coverage

Canonical main has NO tracked GitHub workflow. The failing workflow belongs to
the independent candidate; it is preserved unchanged there (SHA-256
`9c2bc27822b830b842ac88cd9191d473d58965ce35dce3bbc0834282be732a27`).
Its verify job assumes an independent sanitized root and older SQLite/session API;
its legacy analysis harness times out waiting for an obsolete startup message.
Consequently browser `needs: verify` would not run. This is not a hosted Actions result.
The current branch adds a read-only workflow against the actual canonical application.

| Existing quality boundary | Integrated gate and compatibility treatment |
|---|---|
| Source/history exclusions | release-guard enforces canonical ancestry, linear added history, current and ALL newly added blob exclusions; original adversarial guard and dependency-policy tests retained |
| Dependency integrity | Same frozen bun.lock, scripts disabled; unchanged fail-closed high/critical audit; errors block |
| Unit/research/numerical correctness | EVERY canonical unit/integration test retained, new intelligence and guard tests added; byte-identical numerical parity enforced |
| Isolated system job | All ten independent system assertions retained byte-for-byte in system-checks.js; SHA-256 e62592d9203674c1539e83af7d52c0d1aea621eaa71fd6dadd1b162c40f79c20; tested against CURRENT packaged local engine, not archived code |
| Hosted finance/non-disclosure | Additive package tests deny every financial route even with local opt-in, expose no accounts/audits/state, reject malformed/oversized/cross-origin intelligence requests |
| Browser and accessibility | All EIGHT canonical suites plus BOTH v7 suites, against actual package; no suite skipped or continue-on-error |
| Storage/import security | Existing Library quota/corruption/multi-tab/backup tests plus v7 memory/cancellation checks |
| Optional provider | Existing provenance/outage/staleness and v7 authentication/schema/citation/budget tests; no paid/provider credentials required |

Obsolete assertions are updated explicitly, never silently dropped: older market and
AI controls are opened through the retained disclosure UI; risk results assert the
actual server plan and exact stop/margin values instead of a removed CSS class;
v6.2 research export checks the stronger current development/holdout schema and
strict chronology; notes use the preserved notebook disclosure; v6.4 imports now
assert the Library's preview does NOT write before owner confirmation, then verify
unverified status, credential stripping and escaped HTML after confirmation.
Browser launch/tool/output selectors are portable. No numerical/security assertion
is removed to make a run pass.

CI uses pinned actions, Node24.19, Bun1.4.3, hashed Python tooling and axe4.10.3.
Only the tested head and its ancestry are fetched; no deployment steps, deployment
credentials, environments, OIDC or write permission. PRs to main/develop/release
and pushes to main/develop/feature/fix/release trigger validation. Owner should
require Source and tests, Browser and accessibility, and Dependency audit before
merging. No repository settings have been changed.

Browser fixtures are SYNTHETIC AND OFFLINE. The original unit/system fixture is
unchanged. The additional browser fixture deliberately includes oscillation and a
confirmed directional ending so tests exercise nonzero trades, changed-cost
mismatch, scenario-to-risk transfer and all existing assertions. It is excluded
from the production artifact. Passing synthetic checks is not live market or
predictive-performance validation. Prior real-provider evidence remains historical.

## Production package

The original authenticated Vercel project is `prj_IFLYEB85CRNBjDEGO69xcW4O55Wd`,
name thn-ai-trader, framework node, Node24.x. Its READY production deployment
`dpl_88NMvmRTrt9EgcyF9frWNbWwjwiB` reports source ddd13c2 and the original
thn-ai-trader.vercel.app alias. This is read-only metadata, not a deployment action.

Root vercel.json prepares a Build Output API v3 package using npm run build and
npm run package:production. No runtime dependencies are imported; installCommand
therefore installs nothing. The existing declared SDK remains frozen and audited.
The package is .vercel/output with a single Node24 function, no background worker,
no external storage and no paid resource. Every request goes to the same current
HTTP server, including homepage, modules/static assets and API routes. Imported
server.js exports the HTTP server without listening; npm start still listens on
loopback locally. All transitive server/public modules are copied, including the
optional adapter. No model/credential configuration is needed for module loading.

Root Git gates keep develop=false and main=true and add release/v7-integrated=false.
These are local source controls, not evidence about all external integrations.
Cloud settings were not changed. Local package launch validates runtime/routing;
it is not a claim that a Vercel-hosted build, quota or deployment has been tested.
Any dashboard override conflict must fail the authorized hosted build rather than
silently target another project. No linked .vercel/project.json is used.

## Release and rollback gate

Publication, merging and Production deployment are NOT authorized by conditional
candidate approval. After exact-commit approval, recheck remote main and all
required CI. This linear candidate can be fast-forwarded or normally PR-merged
onto ddd13c2 without unrelated history or force. If main advances, stop and review
its new changes rather than resetting it. A future publication of main may trigger
Vercel automatically and needs explicit production authorization.

The existing production deployment is the rollback reference above. On approved
release failure, restore/promote that deployment in the SAME original project;
do not create another project, reset Git or automatically revert this entire
source cleanup (which would restore excluded audit/metadata files).

Hosted paper execution/durable account storage remain unavailable. Local paper
state follows the canonical v6.6 implementation; it is not multi-tenant hosted
SQLite. The old SQLite/Sprint1 source is still preserved in the independent
recovery history, not misrepresented as active hosted functionality. LLM service
is optional/local/inactive, no real LLM call or token spend occurred; process-local
budgets are not a durable public spending cap. Browser storage is device-local,
imports are unverified and reflection does not authenticate submitted observations.

## Recorded local result

All ten current browser suites pass (nine in the full packaged run plus a focused
research rerun after its compatibility fix). No suite was skipped. See
v7-integrated-validation.json for exact counts and external log paths. Initial
obsolete-selector/schema failures remain in diagnostic logs, not hidden by skips.
The original system assertion file is unchanged; all ten pass. Workflow linter,
frozen dependencies and fail-closed advisory audit pass. Local unit/integration/
guard/package tests and hosted-security tests pass. Deterministic repeated package
builds produce the same manifest. No real LLM or hosted deployment was tested.

Artifact: `.vercel/output`; complete artifact-manifest.json SHA-256:
`dfa4420a1b08e32296582421456328c06585080815ca38318c7189c2e7e54e5f`.
The manifest covers all 51 generated files other than itself; 47 are runtime source.
The launcher disables platform body helpers to preserve raw request streams and
application-owned JSON/body limits. Required owner approval remains publication
and release of the final exact commit; no cloud or Git mutation has occurred.
