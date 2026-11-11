# PR20 browser CI environment correction

## Confirmed infrastructure failure

At `38b195733c9830aeed081072894a17a2da74b15f`, push run `43034386815`
and PR run `43034401383`, including attempt 2, failed before browser tests started.
The owner independently retrieved all four retry job logs: Playwright 1.62.0
Python wheels installed, but `playwright install --with-deps chromium` exited 100
because the hosted runner could not resolve `azure.archive.ubuntu.com` while
installing Ubuntu font packages. This is an OS dependency setup failure, not a
browser assertion failure. Evidence:
https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6799261470 .
No further retries of that unchanged setup are requested.

## Supported replacement

Only the browser jobs use Microsoft's official Playwright Python Noble image:

`mcr.microsoft.com/playwright/python:v1.62.0-noble@sha256:aa81288e738725378becba5b3e06cb0f3a7f012a610e87e8d767a090ea3f740d`

The registry returned that index digest, independently confirmed by hashing the
response bytes. Its Linux amd64 manifest is
`sha256:51d31fdfacb0cff99a1a724152e34ae408d2bd4e7da310ff157450f49261cc59`.
The image bakes browsers and all upstream OS dependencies, including fonts,
during Microsoft's image build. Browser jobs no longer install OS packages or
depend on the runner's Azure Ubuntu mirror. Image acquisition still requires a
working Microsoft registry; this removes one demonstrated failure source, not
every possible infrastructure outage.

Upstream references, inspected at the exact 1.62.0 tag:

- [Official Docker usage](https://playwright.dev/python/docs/docker)
- [Python image build](https://github.com/microsoft/playwright-python/blob/v1.62.0/utils/docker/Dockerfile.noble)
- [OS/font dependency list](https://github.com/microsoft/playwright/blob/v1.62.0/packages/playwright-core/src/server/registry/nativeDeps.ts)

Node 24.19.0, Python 3.12.14, hash-verified Playwright 1.62.0 wheels and axe 4.10.3
remain pinned. The image does not substitute its build-time Python environment
for the project's hashed requirements. `--init` reaps processes and `--ipc=host`
is the documented Chromium container setting; neither bypasses network policy.

Before tests, `check-browser-environment.py` requires Ubuntu 24.04, the exact
Python/package versions, Chromium revision 1234 / version 151.0.7922.34 and the
image-owned executable. It checks every upstream font package (Noto emoji,
Unifont, Cyrillic/scalable X fonts, Liberation, IPA Gothic, WenQuanYi, Loma and
FreeFont), Arabic glyph availability, a real browser launch and Arabic/RTL DOM
rendering. It binds all later suites to that checked executable. Missing fonts,
version drift, unavailable binaries or launch errors fail the job.
Arabic character maps are inspected through the already-required `libfontconfig1`,
including configured fallback fonts, rather than assuming an optional Fontconfig
CLI is installed. Native checks passed with both the workspace's Noto Sans Arabic
fallback and the hosted-style DejaVu Sans fallback; no package was added.

All 36 browser suites, both disjoint shards, EN/AR, RTL, responsive/font profiles,
themes, axe checks, assertions and timeouts remain unchanged. The aggregate
browser gate still requires every shard to succeed. No application, financial
formula, execution guard, dependency or lockfile changed.

## Separately diagnosed browser synchronization failure

The first local full run passed 35 suites but exposed a race at the final context
transition in `browser_command_center.py`. The test waited for fresh single-frame
analysis, then asserted a candidate before the independent three-frame brief had
necessarily arrived. A controlled diagnostic held only the new GBPUSD brief:
fresh analysis was true, the brief was null, the verdict was WAIT and the candidate
was null with `incomplete_frames` / `scenario_unavailable`. Releasing the matching
brief produced the expected GBPUSD fixture candidate with the same dataset hash.
The application's missing-evidence guard was correct throughout.

The test now deliberately holds that response, asserts WAIT/no candidate and
unchanged saved records, then waits for the matching symbol/interval/dataset brief
before making the original candidate assertion. Every original assertion remains;
coverage is expanded rather than skipped. No sleep, forced click, timeout increase,
threshold change or production behavior change is used. Evidence contains controlled
synthetic positive fixtures, not live signals or predictive-performance claims.

## Verification and access boundary

Final local gates: 322 numerical/core/unit/integration tests, 10 system tests,
21 security tests, all 36 browser suites in both shards, 48 retained plus 24
Dashboard font profiles, build, lint, production package, frozen install,
dependency audit, actionlint, source/numerical integrity and Git fsck passed.
The corrected Command Center suite passed independently and in the full gate.
AST comparison confirms all 46 original assertions plus five additional checks.

Reproducible results, durations, source fingerprints and scope:
[verification JSON](evidence/issue21-ci/verification.json).
The first failed run and controlled diagnostic are separately recorded in
[transition evidence](evidence/issue21-ci/transition-diagnostic.json).
These are local results; exact-head hosted CI is verified separately after push.

Local verification uses the existing pinned Playwright/Chromium and process-only
Ubuntu-style font configuration that reproduced the earlier hosted viewport
failure. It does not prove execution inside the new image.

The local Docker daemon is healthy. The registry index and platform manifest are
accessible, but image blobs redirect to `centralus.data.mcr.microsoft.com`, which
the workspace proxy rejects with CONNECT 403. Docker reports image configuration
download `Forbidden`. Network policy, credentials and protections were not changed;
the container preflight must be verified by the new exact-head hosted jobs.

Release remains blocked until those jobs pass and the owner approves the complete
PR20 candidate. Main and Production are not modified by this correction. Rollback
of this CI-only change is a normal revert of its commit on the candidate branch,
not a reset, force push or change to production settings. Reverting would restore
the known failing setup and does not constitute a verified release.

## DejaVu-specific follow-up

The exact-head runs at `d4856d224e0517d8acc00216ed721038c42f7a6c` completed
browser setup and passed shard 0, but both failed `browser_evidence_workflow.py:61`.
The owner retrieved the trace: Chromium used `Liberation Sans` / `LiberationSans-Bold`
when the original assertion explicitly required DejaVu. Evidence:
https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6801043623 .
The nine upstream Playwright font packages do not guarantee this additional
suite-specific family. The earlier preflight checked Arabic coverage but missed
the explicitly requested DejaVu font. No application regression is established
by this substitution, and the original font assertion is preserved byte-for-byte.

`install-test-fonts.py` supplements the same pinned image with the official
[DejaVu 2.37 TTF release](https://github.com/dejavu-fonts/dejavu-fonts/releases/tag/version_2_37),
SHA-256 `fa9ca4d13871dd122f61258a80d01751d603b4d3ee14095d65453b4e846e17d7`.
All 22 fonts and the upstream license are retained in a job-private temporary
directory. A process-scoped Fontconfig file includes the complete existing
configuration and adds that directory. It removes no fonts, adds no aliases,
changes no application CSS, and requires no APT, root access or new dependency.
The installer rejects a mismatched checksum before writing fonts and never
extracts arbitrary archive paths. Download and checksum errors remain blocking.

The existing preflight now also inspects actual Chromium glyph rendering with
`CSS.getPlatformFontsForNode`: DejaVu Sans / DejaVuSans and DejaVuSans-Bold,
non-custom fonts, positive glyph counts, EN/AR, dark/light and 240/160 widths
(16 combinations). Liberation substitution, missing glyphs, wrong styles or web
font substitution fail preflight before the original full regression gate runs.

Local controlled diagnosis exposed only Liberation in the base font configuration,
reproduced substitution, then added the verified fonts while preserving that same
base. All 16 actual renderer profiles passed afterward. The complete original
Evidence Workflow suite also passed, including its eight fallback profiles and axe
checks. This is distinct from exact Docker execution, which remains locally
proxy-blocked; the new hosted exact-head run must verify the image plus supplement.

Final follow-up verification passed: 323 core/numerical/unit/integration tests,
10 system, 21 security, all 36 browser suites (994.47 seconds), 72 responsive font
profiles, build, lint, production packaging, frozen install, dependency audit,
actionlint, source/numerical integrity and Git fsck. Every original browser file,
suite selection, assertion and timeout is byte-identical to the `d4856d2` baseline.
The separate controlled diagnostic reproduced the exact reported
`LiberationSans-Bold`, non-custom, 11-glyph result before supplementation.

- [Actual Chromium before/after font records](evidence/issue21-ci/dejavu-renderer.json)
- [Full local verification and source fingerprints](evidence/issue21-ci/dejavu-verification.json)

These records describe local gates before commit. The release report must also
record the new exact-head hosted conclusions and matching Preview association;
neither this local evidence nor an earlier deployment substitutes for those gates.
