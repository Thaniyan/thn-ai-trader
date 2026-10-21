# Professional workstation release evidence

Local candidate on `feature/professional-workstation`, based on Core Research Trust
`2ed5b20a465ccf524692e301ac7228d76490e4c6` and released v7.1
`fad7fe6d03f799bc699401e9fc31004e9b6c1087`. See the
[implementation and limitations](../PROFESSIONAL-WORKSTATION.md).

The interrupted session completed implementation and validation. Closeout preserved
those results instead of repeating the expensive browser runs. All 14 suites passed
in the [full browser log](logs/browser.log). Final follow-up numerical/security/system
logs are included as well. No unfinished mobile-layout experiment or new milestone
was added during closeout.

## Validation

| Gate | Result |
|---|---|
| Unit, integration, numerical and intelligence tests | 155 passed; 0 failed |
| Dedicated security tests | 21 passed; 0 failed (overlap with main test coverage) |
| Preserved legacy system assertions | 10 passed; 0 failed |
| Full browser suite | All 14 suites passed |
| Nine-view layout matrix | 288 checks; no tested collisions/page overflow |
| Nine-view accessibility matrix | 72 scans; no reported WCAG-tagged violations |
| Additional emulated zoom matrix | 64 checks; no tested collisions/page overflow |
| Shared-shell geometry | 202 cases passed |
| Selected mobile control touch checks | 72 view/profiles; no tested target below 24px |
| Browser errors | No uncaught page errors in the professional suite |
| Build, syntax lint, production packaging | Passed |
| Source/ancestry guard and frozen numerical-source parity | Passed |
| Workflow validation, frozen install, dependency audit | Passed; no dependency changes |

[Machine-readable summary](validation.json), [gate exits](gates.json),
[browser journeys and full matrix](browser-results.json),
[shared-shell geometry](shell-geometry.json) and
[shared-shell accessibility](shell-accessibility.json) preserve the detailed results.

The new matrix covers 1920, 1649, 1440, 1280, 1024, 768, 390 and 360 CSS-pixel widths,
English/Arabic, dark/light, LTR/RTL and all nine views. Additional desktop-page-zoom
emulation uses inverse viewport/DPR changes at 80%, 125%, 150% and 200% for the
1649px and 360px conditions. This is not a physical-device/pinch-zoom certification.
Broker accessibility scans explicitly expand the retained local-paper controls.

Complete local journeys cover bounded/cached market observations, source selection,
drawing restoration, chart keyboard controls, deterministic snapshots, Library records,
read-only journal inspection, client lost-response intent reuse and storage refusal.
Existing suites retain scenario/risk/overlay, causal evidence, historical replay,
comparison, bilingual intelligence, Library recovery and financial restriction coverage.
Eight new Node tests cover intent persistence, restart replay, conflict, uncertain
outcome blocking, corrupt storage, private atomic writes, preference refusal,
second-process refusal and orphaned writer markers (some cases share one test).

## Before / after screenshots

Baseline images are from the unmodified local Core Research Trust package, **not live
Production captures**. After images are from the actual packaged application under
Chromium. Provider histories are explicit offline fixtures, not real market observations.
No customer records, credentials or real brokerage accounts are used.

| View | Before · EN/dark desktop | After · EN/dark desktop | After · AR/light mobile |
|---|---|---|---|
| Dashboard | [Before](before/dashboard.png) | [After](after/dashboard-en-dark-1440.png) | [Mobile](after/dashboard-ar-light-390.png) |
| Markets | [Before](before/markets.png) | [After](after/markets-en-dark-1440.png) | [Mobile](after/markets-ar-light-390.png) |
| Trading Terminal | [Before](before/trading.png) | [After](after/trading-en-dark-1440.png) | [Mobile](after/trading-ar-light-390.png) |
| Intelligence | [Before](before/ai.png) | [After](after/ai-en-dark-1440.png) | [Mobile](after/ai-ar-light-390.png) |
| Risk Desk | [Before](before/risk.png) | [After](after/risk-en-dark-1440.png) | [Mobile](after/risk-ar-light-390.png) |
| Portfolio | [Before](before/portfolio.png) | [After](after/portfolio-en-dark-1440.png) | [Mobile](after/portfolio-ar-light-390.png) |
| Journal | [Before](before/journal.png) | [After](after/journal-en-dark-1440.png) | [Mobile](after/journal-ar-light-390.png) |
| Broker Accounts | [Before](before/brokers.png) | [After](after/brokers-en-dark-1440.png) | [Mobile](after/brokers-ar-light-390.png) |
| Settings | [Before](before/settings.png) | [After](after/settings-en-dark-1440.png) | [Mobile](after/settings-ar-light-390.png) |

The `after/` directory also includes EN/dark mobile, AR/light desktop and denied-storage
captures: 36 view/profile images plus one storage-refusal image. Manual inspection
covered the major-page overview, chart, market table, broker readiness and RTL/mobile
screens; automated assertions evaluate geometry rather than page-load success alone.

## Package integrity

Build Output API artifact: `.vercel/output` (local, deliberately untracked).
60 runtime source files; 64 inventoried artifact files plus the artifact manifest.

Artifact manifest SHA-256:
`25c17dc86eb0a4e6b5445c0125dc2517716e1ef098eceac2ea29183e582ceb8e`

[Artifact inventory](artifact-manifest.json) and [runtime source hashes](runtime-manifest.json)
contain hashes/paths only. Closeout checked every runtime source and packaged file
against those hashes with zero mismatches. No environment, account state, model weights,
credentials, test fixture, Git directory or deployment link is packaged.

## Remaining verification boundaries

- TradingView's real remote iframe is unverified here. The offline widget shim tests
  settings and routing only; it does not prove external availability or licensing.
- No candidate deployment, hosted CI run, real-model call or live broker integration
  was performed. Existing public finance/generation restrictions remain enabled.
- Private hosted persistence and continuous workers remain unavailable. Local paper
  recovery is fail-closed, not a claim of transactional exactly-once execution.
- Mobile charts retain vertically scrollable controls; no unfinished redesign was
  mixed into this completed candidate at closeout.
- Existing canonical Git history is preserved, not retroactively declared sanitized.
  New source and packaging exclusions are enforced by the existing release guard.

Publication, PR creation and Production release require separate exact-commit owner
approval and the existing hosted CI gates. No push, merge, deployment, resource creation,
paid API activation or hosting-setting change occurred during this milestone.
