# Actual application — paired visual evidence

Baseline: canonical main `fb92c9604d16d0df45d3a13096c2f84a6d66546b`.
Candidate: `feature/integrated-research-workstation-issue19-20261110`.
These are screenshots of the real packaged application, **not a prototype**.
They use the same frozen synthetic closed-bar fixture, parameters, review,
validated hypothetical plan, saved report and retained candle snapshot.
There are no real prices, fills, accounts or model outputs in this evidence.

All pairs use dataset
`19bfc603fe439a092588e6cbd70e57aeb6af7197dfa5375a774e40dab9dc5701`.
Each image is a 1000px-high viewport; page height and chart position are measured
separately. Personal-note disclosure remains open in these populated captures.
Default-page height tests are a separate regression gate. The topbar clock is
browser wall time; market observation times and the fixture clock are identical.

| Real application view | 1440px · English · dark | 768px · English · dark | 390px · Arabic RTL · light |
|---|---|---|---|
| Dashboard | [Before](before/dashboard-1440-en-dark.png) · [After](after/dashboard-1440-en-dark.png) | [Before](before/dashboard-768-en-dark.png) · [After](after/dashboard-768-en-dark.png) | [Before](before/dashboard-390-ar-light.png) · [After](after/dashboard-390-ar-light.png) |
| Trading Terminal | [Before](before/trading-1440-en-dark.png) · [After](after/trading-1440-en-dark.png) | [Before](before/trading-768-en-dark.png) · [After](after/trading-768-en-dark.png) | [Before](before/trading-390-ar-light.png) · [After](after/trading-390-ar-light.png) |
| AI Research | [Before](before/ai-1440-en-dark.png) · [After](after/ai-1440-en-dark.png) | [Before](before/ai-768-en-dark.png) · [After](after/ai-768-en-dark.png) | [Before](before/ai-390-ar-light.png) · [After](after/ai-390-ar-light.png) |
| Historical Lab | [Before](before/portfolio-1440-en-dark.png) · [After](after/portfolio-1440-en-dark.png) | [Before](before/portfolio-768-en-dark.png) · [After](after/portfolio-768-en-dark.png) | [Before](before/portfolio-390-ar-light.png) · [After](after/portfolio-390-ar-light.png) |
| Research Library | [Before](before/journal-1440-en-dark.png) · [After](after/journal-1440-en-dark.png) | [Before](before/journal-768-en-dark.png) · [After](after/journal-768-en-dark.png) | [Before](before/journal-390-ar-light.png) · [After](after/journal-390-ar-light.png) |
| Hypothetical Risk Desk | [Before](before/risk-1440-en-dark.png) · [After](after/risk-1440-en-dark.png) | [Before](before/risk-768-en-dark.png) · [After](after/risk-768-en-dark.png) | [Before](before/risk-390-ar-light.png) · [After](after/risk-390-ar-light.png) |

## Reproduce the real-app captures

Use the pinned Playwright/Chromium environment. Build the production package first.
Choose one `TEST_SNAPSHOT_TIME` (milliseconds) and use it for both worktrees.

```sh
npm run build
npm run package:production
CAPTURE_OUTPUT=/tmp/thn-after TEST_SNAPSHOT_TIME=YOUR_FIXED_MILLISECONDS CHROMIUM_PATH=/path/to/pinned/chrome python3 scripts/qa/capture-research-studio.py
```

For the canonical baseline, create a detached worktree at the baseline SHA, package
it, then invoke this candidate's same script with `CAPTURE_ROOT` set to that
worktree. Its fixture import defaults to the candidate's test-only fixture.
Nothing is copied into the baseline application or original Git history.

`measure-research-studio.py` similarly accepts `PERF_ROOT`, `PERF_OUTPUT`, the same
fixture time and Chromium path. It measures three cold browser pages, actual
resource bytes/counts and elapsed evaluation/planning interactions. Those are
local synthetic measurements, not Internet or Production benchmarks.

The full browser gate uses original live clocks and original assertions/timeouts;
fixture freezing is restricted to paired evidence captures/measurements.
Screenshots and local tests do not establish independent visual acceptance,
Vercel deployment identity, actual provider availability or Production behavior.

## Measured populated workflow
These profiles include a completed review, evaluation, plan, saved case and an
open personal-note disclosure. They are not default empty-page measurements.
| Profile / view | Before height | After height | Before chart top | After chart top |
|---|---:|---:|---:|---:|
| 1440 / dashboard | 2030px | 2202px | 624px | 600px |
| 1440 / trading | 1210px | 1439px | 499px | 532px |
| 1440 / ai | 4509px | 4589px | — | — |
| 1440 / portfolio | 5490px | 2563px | — | — |
| 1440 / journal | 1514px | 1686px | — | — |
| 1440 / risk | 2026px | 1681px | — | — |
| 768 / dashboard | 3611px | 3769px | 830px | 812px |
| 768 / trading | 2637px | 2845px | 615px | 648px |
| 768 / ai | 5457px | 5451px | — | — |
| 768 / portfolio | 6161px | 2708px | — | — |
| 768 / journal | 1772px | 2013px | — | — |
| 768 / risk | 2043px | 2222px | — | — |
| 390 / dashboard | 4007px | 4170px | 812px | 769px |
| 390 / trading | 2531px | 2771px | 609px | 643px |
| 390 / ai | 7703px | 8100px | — | — |
| 390 / portfolio | 7974px | 4101px | — | — |
| 390 / journal | 2115px | 2426px | — | — |
| 390 / risk | 2828px | 3285px | — | — |

Historical Lab becomes substantially shorter by promoting recorded windows/folds
and keeping the complete original audits in explicit native disclosures. Dashboard
chart placement improves modestly; Terminal tools consume about one toolbar row.
The populated mobile AI page is longer because the user has opened a detailed
report and the new evidence workflow. Default AI height is separately tested
against the original 2500px/3500px limits; those limits are unchanged.

## Actual interactive examples

- [Loaded-history candle inspector](interactive/studio-inspector.png).
- [Source-linked evidence notebook](interactive/studio-evidence.png).
- [Current unsaved research versus an immutable saved case](interactive/studio-current-saved-comparison.png).
- [Actual numerical reproduction from retained candles](interactive/studio-numerical-replay.png).

These additional screenshots are from the end-to-end browser test, not paired
baseline captures or independent Production acceptance.

## Measured request / resource audit

The baseline legacy focus panel independently fetched selected history during
shared-chart initialization. All four browser requests used the same EURUSD/1h
path. The candidate reuses the shared owner, clears unavailable/mismatched legacy
observations, and delegates explicit legacy refresh to the authoritative chart
refresh. No provider-cache TTL, quote permission, rate limit or financial engine
changed. This measures browser/API requests, **not upstream Yahoo call counts**.

| Local measurement | Before | After |
|---|---:|---:|
| Loaded resources | 70 | 70 |
| Encoded resource bytes | 2,340,621 | 1,771,905 |
| Selected-history requests | 4 | 1 |
| Selected-history response bytes | 839,028 | 209,757 |
| JavaScript source bytes | 1,160,149 | 1,199,408 |
| CSS source bytes | 244,428 | 265,724 |
| Median research-ready time | 584.41ms | 624.23ms |
| Median evaluation interaction | 238.16ms | 251.08ms |
| Median planning interaction | 245.24ms | 141.96ms |

Three cold browser pages per variant, same frozen synthetic observations and
1440px viewport; the server cache warms after its first sample. Timing samples
are small and mixed: there is no claimed general startup/evaluation speedup or
Production SLA. The defensible improvement is eliminating three redundant
selected-history responses: 629,271 response bytes avoided. Added UI assets
cost 60,555 bytes; total measured encoded bytes decrease 568,716 (24.3%).

Raw [before](performance-before.json) and [after](performance-after.json) samples
include exact request paths, bytes and all elapsed measurements. All paired
visual profiles also observe one selected-history request instead of four.
