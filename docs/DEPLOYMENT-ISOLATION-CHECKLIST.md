# Original repository deployment isolation — read-only review

Decision: **NO-GO for repository-only publication**: automatic Preview is owner-verified
as enabled; external apps, other project/branch mappings and authentication exceptions remain unresolved. Checked 2026-10-17. No settings changes, push, deployment or test deployment.
This checklist concerns the ORIGINAL project, not the independently isolated staging
project. Do not disconnect or alter the running production project during this review.

## Verified facts

- Original visibility is independently confirmed PUBLIC from its GitHub repository
  page: HTTP200 and octolytics-dimension-repository_public=true. This public page
  does not expose private integration settings or establish hosting isolation.
- Original main: 50857dfc1e45a901515b56ffe2ed914d897671af; staging main:
  75110ec2ca317ae0a873268f42a577636f250dbd; both unchanged through read-only Git.
- Reviewed local candidate: c87af55bfa5c492fe017ab72220cd4d32216f905, two local
  commits on original history; no reconciliation was repeated.
- Neither original main nor candidate tracks Actions workflows or active root
  vercel.json, .vercel/project.json, netlify.toml or render.yaml.
- Local origin fetch identifies Thaniyan/thn-ai-trader; push URL remains /dev/null.
  Neither the current local branch name nor proposed review/reconciliation-c87af55
  exists as a remote branch when checked. No remote branch was created.
- Previously validated frontend ZIPs both still hash to
  f187eba3095a2f9968b72299b0e2a0d837a2255edddc31c5f34d118ac2f9f821.
  Application files and prior test evidence are unchanged; no suites were rerun.
- No authenticated Vercel connector/CLI/project metadata capability is available
  in this environment. No credential file or token was read or requested.

## Accessible GitHub metadata results

All of these `gh api repos/Thaniyan/thn-ai-trader/...` checks were Forbidden:
repository metadata, actions/workflows, actions/permissions, branches/main/protection,
rulesets, hooks, installations, environments and deployments. Raw responses/settings
are not copied into source; the sanitized check inventory is at
/workspace/reports/reconciliation/isolation-readonly-checks.json.

The owner evidence below resolves repository webhook, ruleset, Actions-default and
installed-app observations. App scope/behavior, legacy branch protection, deployment
records and production environment rules are not independently verified.
Forbidden does not confirm privacy, disabled automation or successful protection.
Static source inspection cannot establish external or organization automation.

## Consolidated owner-verified observations

These observations were personally checked by the owner; no settings were changed.
They are current owner evidence, not independent API verification. Earlier blocked
API checks remain historical access limitations, not contradictions of these facts.

| Setting | Owner-verified value |
|---|---|
| Original Vercel project / Git repository | thn-ai-trader / Thaniyan/thn-ai-trader |
| thn-ai-trader.vercel.app assignment | Production |
| Production Branch Tracking | main |
| Preview Branch Tracking | Enabled: All unassigned branches |
| Vercel Authentication | Enabled, Standard Protection |
| Vercel Deploy Hooks | None configured |
| Auto-assign Custom Production Domains | Enabled (prior owner observation) |
| GitHub repository Webhooks | None listed |
| GitHub Rulesets | None exist |
| GitHub Actions | Allowed; default GITHUB_TOKEN read-only |
| GitHub Apps listed | ChatGPT Codex Connector, Google AI Studio, Render, Vercel |

A new non-main branch is expected to trigger automatic Preview in the original
Vercel project. The observed main-only Production tracking and Production domain
assignment do not route that push directly to Production. They do not establish
isolation of every other project, custom environment, domain override or integration.

Standard Protection is owner-verified, so authentication is no longer wholly unknown.
It must not be described as All Deployments protection, proof of protection on every
alias/domain, or absence of exceptions. Actual coverage, bypass/share-link behavior
and any excluded domains remain unverified. Authentication does not stop deployment.
Auto-assign Custom Production Domains does not itself demonstrate a Preview-domain
assignment; retain the verified Production assignment while checking overrides.

**Confirmed blocker:** automatic Preview is enabled and has not been authorized.
Publication remains NO-GO even if every other integration proves inactive. Render
and Google AI Studio app presence is a potential external automation path, not proof
of an active deployment and not evidence that they are harmless. GitHub Apps can
receive installation events through app-level webhooks not listed under repository
Webhooks. Empty repository hooks therefore do not clear these integrations.

## Remaining minimum read-only owner checks

Do not repeat domain assignment, main/Preview tracking, Standard Protection toggle,
empty hook lists, absent rulesets or Actions default-permission checks. Do not share
secret values, hook URLs, bypass tokens or environment-variable contents.

1. **Render dashboard → services/static sites/Blueprints using Thaniyan/thn-ai-trader
   → Settings → Build & Deploy:** report whether any exist, their tracked branch,
   Auto-Deploy setting, PR Preview/preview-environment behavior and build filters.
   If the service UI places previews separately, read its Previews/PR Previews
   section. Identify which, if any, serves production. App installation alone does
   not establish that a Render service exists; fixed-main auto-deploy is different
   from wildcard/preview behavior. No PR will be created in this task.
2. **Vercel dashboard → every OTHER project connected to the original repository
   → Settings → Git / Environments → Branch Tracking; original and other projects
   → Settings → Domains → environment/Git Branch assignment:** report additional
   project/custom-environment triggers and branch-specific aliases/overrides. The
   already verified original Production domain/main tracking need no repetition.
3. **Original Vercel project → Settings → Deployment Protection → Standard Protection
   details and applicable exceptions:** report coverage for the proposed Preview
   deployment URL/custom aliases and whether protection exceptions, shareable links
   or automation bypass can expose it. Report presence/scope only, never secret URLs
   or values. Do not change the Standard Protection setting.
4. **Original GitHub repository → Settings → Integrations → GitHub Apps → Configure
   (read only):** report deployment/write scope for Google AI Studio, Render and
   Vercel; check whether any Google AI Studio app/project linked to this repository
   has automatic sync/build/publish configured. **Actions → workflows**: identify
   any actual deployment/promotion workflow. Read-only default GITHUB_TOKEN does
   not prevent cloud actions using other credentials/app tokens or explicit workflow
   permissions. Legacy Settings → Branches protections and Production environment
   approval gates remain a governance gap for later integration/promotion; absent
   rulesets does not prove those older controls are absent.

All project/service links, tracked branches and automation settings must be matched
to the exact proposed review ref before any publication decision. No deployment,
trial push, PR or webhook invocation is an acceptable discovery check here.

## Distinguish the outcomes

- **Production deployment:** a push to the configured Production branch or a matching
  custom production target may deploy to production; promotion/alias automation can
  also affect the live site. Never infer the branch is main from the repository name.
- **Preview deployment:** a connected Vercel project commonly builds non-production
  branches as Preview. It normally does not replace the Production deployment, but
  it is still a deployment and can use Preview-scoped settings/integrations.
- **Protection:** Vercel Authentication controls access; it does not stop deployments.
- **Generated configuration:** git.deploymentEnabled:false in the standalone staging
  artifact is not root configuration in this branch and does not isolate the original
  project's Git connection. A local /dev/null push guard has no hosting effect.

## Explicit decision criteria

**GO for a future repository-only push** requires evidence covering every connected
project and external trigger that the exact target ref cannot create Production OR
Preview/custom-environment deployments, cannot promote/alias a deployment to live
domains, and cannot invoke another deployment app/hook. Recheck remote main, branch
absence, exact reviewed SHA, public-source sensitive-file review and applicable
branch/ruleset requirements, then obtain separate explicit publication approval.
GO is not deployment approval. Applicable protection gaps must be resolved or explicitly
accepted for the exact isolated review publication; no settings changes occur here.

**NO-GO** if any trigger remains unknown, the ref can reach Production/live domains,
or it automatically creates a Preview without separate deployment authorization.
Default non-main Preview behavior is not “no deployment”. If defaults are enabled,
the owner must separately authorize a targeted isolation change or separately approve
that protected Preview scope before publication can be reconsidered; neither is
approved or performed by this task. Do not disable all production integration as an
unreviewed shortcut. Do not test isolation with a push, PR, hook call or deployment.

## Safe next step

Owner supplies only the remaining observations above. Then resolve the confirmed
Preview trigger through a separately authorized targeted isolation change, or a
separately authorized protected Preview scope after its protection/other risks are
verified. Neither action is authorized here. Update this evidence record and resolve
the gate. Then seek approval naming one exact source SHA, original repository
and absent non-main destination ref. Keep the local push guard until that operation
is explicitly authorized. No push command is approved by this document. Verify exact
remote ref and unchanged main afterward; hosted deployment/activity checks require
accessible metadata or direct owner observation. No WSL2 action is needed.
