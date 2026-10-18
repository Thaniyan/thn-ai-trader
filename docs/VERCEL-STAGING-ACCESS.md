# Access protection and Hobby eligibility — owner verification required

**Online deployment remains NO-GO until these gates pass.** This is not authorization to create a project, connect GitHub, change settings, deploy, buy an upgrade or obtain account secrets. No Vercel account/plan is visible in this environment. The private staging GitHub repository is not proof of website privacy.

## Current evidence and its limits

On2026-10-17 (Asia/Muscat), direct official Vercel documentation pages returned managed-proxy403: project configuration, Git configuration, rewrites, Hobby, deployment protection and Vercel for GitHub. No network-policy bypass was attempted. GitHub metadata API also returned Forbidden, so repository owner type is not independently verified; do not infer personal versus organization from the Thaniyan name.

Current official Vercel source was accessible: `vercel/vercel` commit `c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb`. The generated headers and rewrites pass its current routing schemas; Node24.x support appears in packages/build-utils/src/fs/node-version.ts. The project's protection command distinguishes passwordProtection, ssoProtection, gitForkProtection and protectionBypass. Its default enable mode is `prod_deployment_urls_and_all_previews`, **not proof that every production domain is protected**. These source observations do not establish user entitlement, pricing, Hobby numeric quotas or server-side acceptance of every platform-only field. The CLI's schema explicitly permits unknown platform properties; it cannot independently certify git.deploymentEnabled. See deployment/vercel-staging/research-evidence.json.

Official owner checks (not accessible here):

- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/deployment-protection
- https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/limits
- https://vercel.com/docs/rewrites
- https://vercel.com/docs/project-configuration

## Eligibility/protection matrix

| Item | Prepared choice / conservative expectation | Current verification required |
|---|---|---|
| Hobby usage | Personal/noncommercial usage only under historically published Hobby policy. Trading-platform business use cannot simply be labelled noncommercial. | Owner confirms current terms and intended use qualify; otherwise stop, no paid upgrade authorized. |
| Private personal GitHub repository | Historically supported when correctly linked to eligible personal owner account. This workflow does not require Git integration. | Owner checks repository owner.type, installation scope/permissions, private access and current Hobby rule. Keep repository PRIVATE. |
| Private organization repository | Historically restricted on Hobby/team collaborations; not assumed supported. | If unsupported, stop. Do not make public, transfer ownership, alter identity or use another scope to evade plan rules. Manual artifacts are not a claimed exemption from provider terms. |
| Commit author | Git-triggered deployments can require author email/GitHub account membership association with the deployment owner/team; automation authors may be ineligible. | Owner verifies exact future commit author association under current rules. No author/email rewrite, impersonation or auto-push. Manual artifact upload does not justify evading a denied author/plan rule. |
| Build/deployment limits | Static build needs no install, no functions, no worker and few resources. Existing repository server is not deployed on Vercel. | Verify current build duration/concurrency/rate, daily deployment count, bandwidth/request/image/assets and project quotas in account/docs. Numeric quotas are **unverified**, not promised. Stop on quota/charge prompts. |
| Automatic Git deployments | Generated vercel.json sets git.deploymentEnabled:false for all branches; preferred project has no Git connection/deploy hooks. | Verify current platform acceptance and Dashboard Git settings. No Git import wizard before protection. Do not assume config disables manually configured hooks/Actions. No GitHub Actions workflow introduced. |
| Vercel Authentication | Historically available with Standard protection across plans, covering previews/immutable deployment URLs under mode described above. **This is not a verified entitlement for this account.** | Owner confirms available free controls and exact URL/alias coverage, tests incognito denial, verifies it remains enabled. Need authenticated owner browser for QA. |
| Password/custom/full-domain protection | Some modes/features have historically required Pro/Enterprise/addons. | Do not assume available on Hobby or start a paid trial/upgrade. If required to protect intended URL and not free, deployment stays blocked. |
| Production domains/aliases | A separate project's “Production” hostname may be outside Standard protection even though preview URLs are protected. | Never expose an unprotected default/custom production alias. Verify every reachable URL, not only a protected immutable deployment URL. Do not use --prod in this workflow. |
| Browser automation access | Owner-authenticated private browser session, plus independent backend Basic credentials and real application tokens. | Owner may securely bootstrap a disposable Playwright browser state under available protection. It is a credential: never commit, log or share it. Do not mint bypass secrets or disable protection automatically. |

## Two independent perimeters

Vercel Authentication (or another **verified server-side equivalent**) protects the entire frontend and its API URLs. Backend Caddy Basic protects its separate public HTTPS host even if attackers bypass Vercel. Real application authentication then enforces account ownership and paper permission/risk. Staging shell/JavaScript gates are only availability UX; they provide no confidentiality. Build does not store secrets or synthesize cookies.

If Vercel cannot protect the intended Preview at the owner's actual free plan, keep the frontend undeployed. If external rewrites cannot forward native backend authentication and secure cookies correctly, keep connected mode blocked and review a separate gateway. Do not remove either perimeter, add public credentials to static files, rewrite Origin, cache API responses or disable TLS/CSRF.

## Explicit approval sequence

First owner verifies the non-secret eligibility/access facts above and selects the distinct project/scope/Preview URL policy. Then obtain separate approval for project creation and configuration, and another explicit approval for publication/deployment of the exact clean reviewed artifact/commit. No action is authorized by checking this document. Production and WSL2 remain excluded throughout.
