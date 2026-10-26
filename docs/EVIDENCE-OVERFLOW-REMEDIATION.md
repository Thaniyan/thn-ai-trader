# PR #11 — evidence dialog overflow correction

Parent: `d8835bd3efe064fa3aba61db210cd4dfc38b0b43`.
Same branch: `feature/research-evidence-workflow`. Local correction only.

## Confirmed defect

Both original hosted browser jobs failed the evidence dialog's width assertion.
Their logs did not identify the viewport/theme, so the exact hosted profile is
unverified. All other 23 browser suites passed in each hosted run. No rerun,
merge or Production deployment was used to get past the failure.

Local Chromium 151.0.7922.173 reproduces the same assertion at 160 CSS pixels with
installed DejaVu Sans (available on the Ubuntu runner): scrollWidth 126 versus
clientWidth 124. The local system font did not expose this outer overflow. Hosted
Chrome was 151.0.7922.34; a fresh hosted run on the corrected SHA is still required.
This is a real font-sensitive layout defect, not established test nondeterminism.

The context panel only wrapped paragraph text; its bold instrument heading could
outgrow the available inline space. Adding wrapping to the whole context panel
alone changes the measured dialog from 126/124 to 124/124. Separately, two-column
metric rows left some labels only 2.375 pixels wide, producing vertical letters
and text spill. These were not safe simply because the outer page fit.

## Minimal correction and stronger regression

- Context content wraps at any necessary character boundary, with no clipping.
- Metric labels and values stack at 340 CSS pixels and below, retaining every value.
- Existing dialog width, exact-value, EN/AR, keyboard, cancellation, classification
  and financial safeguards remain. No overflow hiding, sleeps, timeout increase,
  assertion removal or production-font replacement.
- Failure diagnostics now save the language/theme/viewport, browser version,
  client/scroll widths and offending elements, plus a native screenshot.
- The original 16 profiles additionally require context and metric-cell containment.
  Eight extra EN/AR/theme/240–160px profiles exercise DejaVu Sans. CDP verifies
  that the font was actually used. All original functional assertions remain.

## Evidence

[Before context](evidence-overflow-remediation/before-context-160.png) ·
[After context](evidence-overflow-remediation/after-context-160.png) ·
[Before metrics](evidence-overflow-remediation/before-metrics-160.png) ·
[After metrics](evidence-overflow-remediation/after-metrics-160.png).

All images are native local captures with frozen provider data; 160 pixels is an
extreme zoom-equivalent width, not a claim about normal phone presentation.
[Font-probe before](evidence-overflow-remediation/before-font-probe.json),
[after](evidence-overflow-remediation/after-font-probe.json) and
[wrapping-only isolation](evidence-overflow-remediation/wrap-only-probe.json).
No actual model was run, no endpoint/financial engine changed, and no new service,
paid resource, security setting or hosting configuration was introduced.

## Completed validation

- Three consecutive focused runs passed: 16 original profiles plus 8 wider-font
  profiles each, with no browser errors or automatic inference requests.
- Full final-package browser run: all 24 suites passed, including all existing
  numerical/research, TradingView, Journal, layout, accessibility and paper workflows.
- 174 unit/integration tests, 21 security tests and 10 system assertions passed.
- Build/lint, workflow/source guards, Git integrity and dependency audit passed;
  zero advisories. The final package matches the first corrected manifest exactly.
- Protected numerical modules, server gates, chart/Journal behavior, data formats,
  workflow permissions, dependencies and hosting configuration are unchanged.

[Exact validation record](evidence-overflow-remediation/validation.json) ·
[Comparison](evidence-overflow-remediation/comparison.html) ·
[Standard desktop](evidence-overflow-remediation/corrected-desktop-en.png) ·
[Standard Arabic mobile](evidence-overflow-remediation/corrected-mobile-ar.png).

Original failed hosted jobs remain recorded: [push](https://github.com/Thaniyan/thn-ai-trader/actions/runs/40287592538/job/121455051898),
[PR](https://github.com/Thaniyan/thn-ai-trader/actions/runs/40287638292/job/121455189458).
Neither was rerun or bypassed. Corrected hosted results are pending approval to
update the existing PR. Production remains on the previously approved release.
