# Dashboard correction — 2026-11-03

The owner's screenshot exposed a scope mistake: the previous release restored the
Intelligence view, but left the opening Dashboard largely unchanged. A successful
Git push was not proof of a visible Dashboard improvement or a verified live deployment.

The landing page now has a THN masthead, a prominent confidence ring, consensus,
setup grade and school count, observed close with its source currency, independent
timeframe coverage, historical-validation state and direct confidence-test access.
The hero has a stronger teal/cyan treatment and distinct card hierarchy. All values
use the existing confidence model, selected snapshot and numerical engines; missing
or mismatched analysis shows an unavailable score rather than another market's score.
School-inspection and confidence-test buttons navigate to the existing surfaces.
There is still exactly one shared chart and one analysis engine.

The landing page now prioritizes confidence and evidence. The visual-refinement
and Recovery regressions check the opening confidence panel, then verify that the Dashboard
chart remains accessible by scrolling. The Terminal's existing first-screen chart
visibility requirement is retained. A new regression covers Dashboard values,
context changes, navigation, chart ownership and 24 EN/AR/theme/width profiles.

Direct read-only requests to the production Vercel domain were blocked by this
managed environment's outbound network policy (proxy HTTP 403). The GitHub
read-only deployment page returned 404. Neither establishes the live deployment's
commit or status. Deployment must not be claimed verified from a Git push alone.
The repository enables main-branch Vercel deployment in vercel.json; no project
settings, credentials, paid services or separate deployment commands were changed.

The owner subsequently confirmed that the live Intelligence page contains the
restored confidence heading and ring. That confirms the previous interface update
reached production; the unchanged Dashboard was a scope error, not evidence of a
failed Git push. This correction targets the actual landing page.

## Timeout investigation and recovery verification

Recovery branch: `feature/dashboard-confidence-recovery-20261103`, based on
`dd4c9f48eff6d72e9713a6991e04453738f8e17a`. The recovered application files and
browser suite list were preserved byte-for-byte. No numerical engine, financial
endpoint, dependency manifest or deployment configuration was changed.

The initial full browser run stopped publication when Maturity exceeded its
existing 240-second limit (exit 124). Its output file was empty because the test
prints its result at the end. A research backup was written 71.5 seconds after
suite start; the original log cannot locate the subsequent stall. That backup and
the isolated diagnostic backup both reproduce development and holdout metrics
exactly through the unchanged offline replay CLI.

Core, security, system, audit and integrity commands had finished at least 216
seconds before the original Maturity run started. Their parallel execution is
therefore not an evidenced cause. Memory and disk were ample, and the container
has no PID cap. Zombie Chromium entries were observed, but they consume no CPU;
there is no evidence that they caused the timeout. The exact original browser,
server or subprocess stall could not be reconstructed from the empty log.

An isolated diagnostic retained every original Maturity assertion and the same
240-second limit; it passed in approximately 102 seconds. A fresh complete browser
sequence then ran in the original order, against one packaged fixture server,
without concurrent verification jobs. Maturity passed in 107.478 seconds. It
verified offline replay, Library migration/backup/import, quota and injection
safeguards, 23 accessibility scans and 18 mobile layouts with no page errors.
Passive resource sampling recorded at least 32,253 MiB available during this run.
A diagnostic stack watchdog was armed before the existing deadline; no deadline,
assertion or browser test was disabled or raised to obtain this result.

The passing full-sequence reproduction does not establish the root cause of the
historical timeout. It provides evidence against a deterministic application or
shared-test-state regression; intermittent browser/process scheduling remains an
unconfirmed possibility. Original failure evidence is retained separately from
subsequent passing results.

The recovered visual regression was strengthened to retain its original 200/350
pixel visibility thresholds after scrolling to the Dashboard chart. Recovery still
requires 400 pixels of chart visibility. The expanded Dashboard regression checks
consensus, grade, school count, observed close, timeframe coverage and actual
historical-validation updates, in addition to navigation and responsive/themed
EN/AR coverage. Its source-currency assertion binds the exact symbol, timeframe
and provider-reported currency: the offline fixture reports USD metadata for all
Yahoo symbols, so assuming JPY for its synthetic USDJPY observation was incorrect.
The application continues to display the actual source currency without assuming
native-quote equivalence.

## Earlier verification blockers (2026-11-03)

The renewed browser run recorded 26 passes (including Evolution), three failures,
and did not complete the expanded Dashboard suite. Trading remediation failed its
18.05-second unverified-phase assertion. Visual Identity timed out after 30 seconds
in page.goto waiting for load. Confidence timed out clicking the first
[data-cockpit=test] element because it was not visible. These are unresolved gates,
not accepted exceptions. The run was stopped after recurring timeout evidence.
Local server probes returned HTTP 200 for health and the root document.

Installed Chromium is 154.0.8037.57, whereas pinned Playwright 1.62.0 expects
151.0.7922.34. This difference is confirmed but not proven causal. Installing the
matching browser from the official Playwright CDN failed with HTTP 403, Domain
forbidden. A cloud-environment configuration draft adds official download hosts
and uses the bundled browser; it requires user review/publication before further
verification. No timeout, assertion or financial safeguard was weakened.

No release-verification claim, commit, push, merge or Production deployment was
made. Evidence is retained under the ignored work/dashboard-correction/
timeout-resolution-20261103 directory.

## Confidence lifecycle locator correction

The approved environment update successfully installed Playwright 1.62.0's
matching Chromium revision 1234 (Chrome for Testing 151.0.7922.34). The official
CDN redirected to the already approved storage.googleapis.com host. Dependency
manifests and lockfiles are unchanged. Trading Remediation, Visual Identity and
the expanded Dashboard suite passed using this browser.

The former global [data-cockpit=test] locator matched four buttons. Its first
match was the hidden Dashboard control while Intelligence was active. The intended
Intelligence action has an exact accessible name, Confidence test, within the
uniquely identified analysisCockpit panel. The correction scopes the role/name
locator to that panel inside #view-ai.view-active. Strict locator resolution
requires one matching button; it uses no first(), forced click or added sleep.
Only this test locator changed: production behavior, all subsequent lifecycle
assertions, numerical checks and timeout values remain intact. The complete
Confidence Lifecycle suite passed, including 48 responsive profiles.

## Final verification

The unchanged complete browser gate passed all 30 suites using Chromium
151.0.7922.34, including Maturity, Evolution, Trading Remediation, Visual
Identity, Confidence Lifecycle (48 profiles), and Dashboard confidence (24
profiles). No suite, assertion, timeout, security boundary or financial safeguard
was removed, disabled or weakened in this final locator correction. The original
Maturity stall's root cause remains unproven; it did not recur in this full run.

Fresh non-browser gates passed build, lint, 191 unit/integration/numerical tests,
10 system checks, 21 security tests, production packaging (75 runtime files),
workflow validation, dependency audit (zero advisories), Git integrity and
source/numerical parity. Audit required the existing Bun tooling directory on
PATH; the source guard required its Git subprocess outside the command sandbox.
Neither required changing tests, dependencies or project configuration.

The final review includes nine files: the eight recovered Dashboard/test/docs
files plus the one-line Confidence Lifecycle locator correction. No runtime
records, credentials, diagnostic artifacts or unrelated files are included.
Delivery is restricted to the development branch; no main merge or Production
deployment is authorized. Browser fixtures verify local packaged behavior, not
live provider availability or a Production deployment.
