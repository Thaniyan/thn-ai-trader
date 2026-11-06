# Milestone 4, increment 1 — Dashboard and Intelligence hierarchy

Baseline: `4ebd6e601cc8aca627b55d5c95854296c68c0ce9`, confirmed against original remote main before implementation. Candidate branch: `feature/m4-workspace-hierarchy-20261106`. This substantial presentation increment is for feature-branch/Preview acceptance, not automatic integration into main. The baseline remains the rollback reference.

## Behavior

The Dashboard keeps its confidence, consensus, grade, school count, market selection, analysis controls and the original shared chart. A compact three-column desktop summary replaces the tall introduction. The existing watchlist follows the chart on Dashboard; it still precedes the chart in Trading Terminal. On narrow screens the same evidence strip follows the chart, retaining its observed close, timeframe coverage, validation access and source audit. Confidence, selected context, deterministic-mode disclosure and source disclosure stay above the chart. No duplicate canvas or chart state is created.

Intelligence keeps a visible research summary, heuristic confidence disclaimer, historical-test status/action, matched timeframe availability and disagreement/missing-evidence status. Four native details groups expose the original schools, scenario playbook, source/opposing evidence and detailed brief/conclusion controls. Summary navigation opens and focuses the intended group. Chart evidence and evaluation-review entry points reveal their destination after existing navigation handlers. Original notes, listeners and analytical renderers remain attached to the same nodes. Disclosure choices survive owner rerenders and language changes; calculations and record formats are unchanged. The existing research assistant remains available without another disclosure.

This is hierarchy work, not a new research-record system. Broader Library discoverability, comparison summaries, reflection integration and shared-loader tracing remain subsequent increments.

## Measured local comparison

Pinned Playwright Chromium 151.0.7922.34, revision 1234; 1000px viewport height. The packaged application ran with hosted restrictions, generative AI disabled and synthetic offline provider fixtures. Screenshots are actual local renders, not Production quotes or browser acceptance of a hosted deployment. Measurements use the canvas bounding rectangle after navigation and a rendered animation frame. Useful chart coverage here means visible canvas height in the initial viewport; it is not a claim that every chart pane or control is visible.

English/dark profile values, rounded to the nearest pixel:

| Viewport width | Dashboard canvas top, before → after | Initially visible canvas height, before → after | Intelligence default page height, before → after |
| --- | --- | --- | --- |
| 1440 | 835 → 491 | 166 → 509 | 3938 → 1957 (50.3% shorter) |
| 768 | 899 → 692 | 101 → 308 | 5097 → 2307 (54.7% shorter) |
| 390 | 990 → 687 | 10 → 313 | 7410 → 2890 (61.0% shorter) |

The existing visual-refinement suite also measures a 390 × 844 phone viewport: approximately 157px of canvas is initially visible in English and 159px in Arabic, in both themes. Scrolling or Focus chart exposes the remaining plot.

The Dashboard's complete page is not necessarily shorter: evidence and watchlist remain available after the chart. Intelligence expands when users request the full supporting research. These measurements concern the default working hierarchy, not removal of content. Smaller viewport heights require additional scrolling; chart focus remains available.

All 24 matched view/language/theme/width measurement rows are retained in [before measurements](m4-workspace-hierarchy/before-measurements.json) and [after measurements](m4-workspace-hierarchy/after-measurements.json). Full precision and language differences are in those files.

## Representative screenshots

| Profile | Dashboard | Intelligence |
| --- | --- | --- |
| Desktop EN dark, before | [Before](m4-workspace-hierarchy/before-dashboard-1440-en-dark.png) | [Before](m4-workspace-hierarchy/before-ai-1440-en-dark.png) |
| Desktop EN dark, after | [After](m4-workspace-hierarchy/after-dashboard-1440-en-dark.png) | [After](m4-workspace-hierarchy/after-ai-1440-en-dark.png) |
| Tablet EN light, before | [Before](m4-workspace-hierarchy/before-dashboard-768-en-light.png) | [Before](m4-workspace-hierarchy/before-ai-768-en-light.png) |
| Tablet EN light, after | [After](m4-workspace-hierarchy/after-dashboard-768-en-light.png) | [After](m4-workspace-hierarchy/after-ai-768-en-light.png) |
| Mobile AR light, before | [Before](m4-workspace-hierarchy/before-dashboard-390-ar-light.png) | [Before](m4-workspace-hierarchy/before-ai-390-ar-light.png) |
| Mobile AR light, after | [After](m4-workspace-hierarchy/after-dashboard-390-ar-light.png) | [After](m4-workspace-hierarchy/after-ai-390-ar-light.png) |

Rendered inspection checked the representative Dashboard/Intelligence screenshots, including mobile RTL. Automated measurements and accessibility checks supplement that inspection; they do not establish subjective visual acceptance or a complete assistive-technology audit.

## Verification and release boundary

A new mandatory browser suite measures chart placement/coverage and Intelligence default length across 12 bilingual/theme/layout profiles. It exercises native Space/Enter disclosure behavior, focused destinations, all eight school cards, preserved drafts and disclosure state across language changes, the ten-check evaluator and hosted execution restrictions. Existing Confidence, Dashboard Confidence, Decision, Maturity, Terminal and Evolution suites open newly disclosed controls through visible summaries; their numerical and lifecycle assertions and timeout limits remain in place. Dashboard navigation now checks the intentionally opened school-summary focus, open state and all eight cards instead of the old overview-heading focus.

Final local release gate: **32/32 browser suites passed, exit code 0**, with pinned Chromium 151.0.7922.34 (revision 1234). Core/integration/numerical: **216 passed**; security: **21 passed**; isolated system: **10 passed**. Build, lint, packaging, workflow validation, frozen dependencies, zero-advisory audit, source integrity and Git object checks passed. All 77 packaged runtime hashes match the source. Full suite names, diagnostics and the complete changed-file inventory are in [verification.json](m4-workspace-hierarchy/verification.json).

The initial diagnostic run found Decision/Terminal steps accessing the newly collapsed brief after reload. Those steps now open visible summaries. A subsequent full run found Dashboard's old overview-heading focus expectation; it now checks the school-summary destination, open state and eight cards. Its entire suite passed independently, followed by a clean 32-suite gate from the beginning. No numerical/lifecycle assertion, timeout or suite was removed, disabled or bypassed.

Production and Vercel Preview identity/interactive behavior must be verified separately from Git and local tests. Workspace proxy restrictions and absent Vercel credentials must not be bypassed. A branch push does not establish a READY Preview. No main merge or Production deployment is part of this candidate release.
