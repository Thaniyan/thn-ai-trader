# Develop Git deployment isolation — local preparation

18 October 2026. Source-only change descending from validated CI commit
649e675eadbdcbec5f7a10f20b9c5c9a9c4a8411. No push, deployment, remote main/branch,
project setting or credential change. This document governs the authorized root
Git gate; older statements that root hosting configuration is absent are historical.
Exact resulting commit is reported separately rather than embedded in itself.

## Evidence and narrow change

Owner confirms: original Vercel uses Thaniyan/thn-ai-trader, Production tracks main,
Preview all unassigned branches, Ignored Build Step Automatic. Render has no active
service, superseding prior active-service uncertainty. Independent protected project
thn-ai-trader-staging-frontend exists; existence alone does not establish its current
Git link/root or deployment trigger path.

Live Git: develop absent, main unchanged at
50857dfc1e45a901515b56ffe2ed914d897671af. Original checkout preserved. Candidate
contains no alternate Vercel root config or project link. GitHub workflow, hooks,
installation and deployment API reads remain forbidden; no Vercel account metadata
access is available. No credential value was read or requested.

Root vercel.json adds only schema and git.deploymentEnabled with develop:false and
main:true. No wildcards, build/install/output/runtime settings, routes, headers,
environment values, backend URL or project identity. .gitignore unignores only the
root file; private project links and generated nested configs remain excluded.

## Documented behavior and first publication

Vercel's [Git configuration reference](https://vercel.com/docs/project-configuration/git-configuration)
supports a Boolean branch map, with unlisted branches enabled. Any matching true
rule can permit deployment, so no overlapping wildcard true is used. This policy
denies develop and preserves main's enabled behavior. It does NOT suppress
feature/*, fix/*, release/* or other branches; keep those local until broader
isolation is approved. Remote main and its config are not changed.

The [static configuration reference](https://vercel.com/docs/project-configuration/vercel-json)
places the file in the project's root. The [Root Directory documentation](https://vercel.com/docs/builds/configure-a-build#root-directory)
explains that a project can select a repository subdirectory. Expected first-push
behavior: when the original Git integration resolves this incoming develop commit's
root file, the automatic Git deployment is suppressed on that first event. No
documented requirement to merge the file into main first was found; do not alter
main as a bootstrap workaround. The docs do not explicitly guarantee every first-
branch event/account combination. This is documented expectation/inference, not
observed hosted proof, and no trial deployment was attempted.

[Ignored Build Step Automatic](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step)
allows builds for otherwise initiated deployments; it is not documented as an
override of git.deploymentEnabled. Ignore commands act later in BUILDING and can
leave canceled deployment records; they are not equivalent to suppressing Git
deployment creation. No ignoreCommand or project setting is changed here.

The remaining material setting is effective root/config resolution: if original
Vercel uses public/ or another config source, repository-root vercel.json may not
be read. Owner must confirm repository root (empty or ./) and no alternate config
path/programmatic config/integration override. Dashboard build/output overrides
do not themselves document a bypass of this gate; alternate deployment sources
are a separate path. Local JSON tests cannot establish account-specific resolution.

## Independent staging and indirect triggers

The branch policy has no project-ID selector. Every Git-linked project resolving
this same root/develop file gets develop:false, including the independent staging
project if connected that way. It cannot simultaneously disable original-project
Git deployment and enable staging-project Git deployment from the identical root.

The existing generated staging artifact is unaffected. Its builder allowlists
frontend files and writes its OWN vercel.json from deployment/vercel-staging/policy.mjs,
retaining git.deploymentEnabled:false, CSP, no-store and strict integrity verification.
It never copies root vercel.json. Existing uploaded artifacts and protection are
not modified. Continue the separately approved manual/artifact staging path unless
a different project/root design is approved; do not weaken the verified artifact
policy to obtain automatic Preview. This gate does not prove online backend,
persistence, hosted authentication or HTTPS functionality.

Git suppression is not access control and does not establish manual/API/CLI,
redeploy, deploy-hook, promotion or other-app suppression. Verify trigger-specific
behavior instead of assuming those paths are blocked. CI stays read-only with no
deploy steps/credentials. Installed apps may receive independent subscriptions
despite empty repository hooks. No active Render service removes that known path;
Google AI Studio/other Vercel project automation is not thereby ruled out. Prior
empty hook observations need reconfirmation only if deployment automation changed.

## Expected actions and publication gate

Publish only the NEW commit containing this gate to
Thaniyan/thn-ai-trader:refs/heads/develop after separate approval; 649e675 alone
does not contain it. With documented config resolution, expected actions are:
GitHub Actions Clean development CI starts if enabled; original Vercel creates no
automatic develop Git deployment; legacy main is unchanged; no staging deployment
is promised or authorized. Vercel event/status bookkeeping is not hosted proof.

Minimum owner confirmations: original effective Root Directory/config source;
independent staging repo/root/manual-vs-Git mapping (accept the same gate applies
if it reads this root); no additional app/API/hook/project path deploying develop.
No secret values or hook URLs are required. If root resolution cannot be confirmed,
obtain Vercel support confirmation or separately authorize project-side isolation.
Do not use a trial push or modify main to resolve uncertainty.

Focused tests validate policy and ignore boundaries plus existing staging build,
tamper and privacy checks. They are not a Vercel Git-service emulator. NO-GO for
publication until remaining confirmations and exact-SHA/ref approval. Existing
provider credential review/public-source residual-risk signoff is still needed if
not already completed. Protected staging deployment needs separate authorization.
No production promotion or live broker execution is authorized by this rule.

Local focused validation: 10/10 checks pass across vercel-develop-isolation,
vercel-integrity, vercel-staging and sanitized-history suites. Generated artifacts
still reject enabled Git deployment, altered CSP/routes/caching and private files;
backend preflight/proxy isolation remains tested. CI, deployment templates/builders,
application/server/public files and dependency files are byte-identical to 649e675.
Full regression/browser suites were not repeated. Logs remain outside source in
/workspace/work/thn-migration-20261018/vercel-isolation-validation. Final committed
source guard/fsck is checked separately before reporting the exact tip.
