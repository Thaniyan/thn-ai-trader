# v7.0 responsive shell correction

Base: b6fc887a65ea5fc63215cdc4b75c4c54b5a20f03 (released v7.0).
The paused v7.1 work is preserved separately at 5664ca651938c58954a8269ca304116b6b4a6572,
branch feature/v7.1-local-generative-pilot. No pilot modules or package changes
are included here. Recovery files: /workspace/work/v71-pause-evidence.

## Cause and correction

The legacy max-width:1280px rule makes navigation a five-column grid. The later
workstation stylesheet restores a 200/236px sidebar but did not restore its
single-column navigation. Labels therefore painted outside their tiny cells.
The top header also retained a single flex row with competing branding, session
badges and account/language controls; its brand mark could shrink below its text.
The brand lockup retained a 74px grid track despite a 48px image.

The shell now explicitly uses one navigation column above 760px, keeps a
scrollable full-height sidebar, matches the logo track to its image, and gives
header groups shrink-safe wrapping rows. On mobile the horizontal navigation
remains scrollable, branding is visible, and the header is in normal document
flow so it cannot stick underneath the navigation. Keyboard focus scrolls mobile tabs fully into view. Light-theme status labels and
the UTC clock use readable contrasting surfaces. No domain logic changes.

## Reproduction and regression

`tests/browser_layout.py` runs against the actual production package with offline
provider fixtures. It measures sibling intersection, text-range containment,
viewport overflow, sidebar/header intersection and mobile keyboard navigation.
The matrix is 10 display widths (320–1920), EN/AR, light/dark and 80/100/125/150/200%
emulated browser zoom, plus scrolled mobile cases. CDP changes CSS viewport width
and device scale inversely; this tests page-zoom reflow rather than merely scaling
a screenshot. It is Chromium emulation, not manual operating-system zoom testing.
Eight WCAG A/AA shell scans cover both languages, themes and desktop/mobile.
All ten existing browser suites remain; the layout suite is an additional CI gate.

Evidence is retained at /workspace/work/layout-fix-evidence, including screenshots
of unmodified v7.0 and the corrected package. These are actual local Chromium
captures using deterministic offline data, not screenshots of the live domain.
No publication or deployment is performed. Production remains unchanged until
separate exact-commit approval.

## Final validation

All required local gates passed: build, lint, reproducible production packaging,
119 unit/integration/numerical tests, 10 legacy system assertions, 5 security tests,
workflow lint, source exclusions/ancestry/numerical parity and dependency audit
(no advisories). All 10 existing browser suites plus the new layout suite passed.
Geometry: 202 cases, zero failures (baseline: 102 failures in 200 cases).
Shared-shell WCAG A/AA scans: 8, zero violations. Mobile keyboard checks cover
all nine tabs in EN and AR. Zoom is Chromium viewport/DPR emulation as described
above; no claim is made about manual OS zoom or testing other browser engines.
