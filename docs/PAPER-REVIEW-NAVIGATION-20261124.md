# Paper-review disclosure navigation correction — 24 November 2026

Owner evidence: [PR23 comment7142514875](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7142514875).
Baseline: `685bc89b53816ec7ac79c22ba3d35f4f5349462a`.
Push run45417383599, browser shard0/job138528328224 failed in
`browser_paper_review.py`: the eligible review control resolved but remained
hidden for the original30-second locator deadline. The same head's PR workflow
passed; that does not cancel the push failure.

## Confirmed application race

The original legacy tools expand off Dashboard. Returning from Risk Desk left
Advanced Chart open synchronously, then the workspace animation-frame render
restored the user's closed Dashboard preference. A caller inspecting disclosure
ancestors during that interval could correctly find them open, only to have the
button hidden by the queued render. This is a navigation/disclosure race, not
evidence that an ineligible paper plan should become eligible.

An actual packaged-app probe with synthetic upstream reproduced open immediately
after navigation and closed after two animation frames. The corrected app is
closed at both checkpoints. State restoration now happens in the navigation
event's capture listener; queued rendering no longer changes that route preference.
The existing native toggle handler continues to own the user's preference.

## Scope and evidence

- Original paper eligibility, account/risk guards and preparation callback unchanged.
- No financial engine, source admission, provider, execution setting or API change.
- Original paper-review assertions, locator and30-second deadline unchanged.
- Added eight EN/AR,1440/390px, dark/light navigation profiles to the existing
  cohesive browser suite. Verify closed and open preferences synchronously and
  keyboard opening surviving queued rendering. No sleeps or forced clicks.
- [Before](evidence/paper-review-navigation/before.json),
  [after](evidence/paper-review-navigation/after.json) and
  [profile results](evidence/paper-review-navigation/navigation-profiles.json)
  are synthetic application-regression evidence, not real market, model or
  eligible research-Ticket qualification.

Local verification: build, lint,562 core tests,10 system checks,21 security tests,
production packaging, workflow/dependency/source-integrity checks, frozen install
and Git fsck passed. All51 original browser/accessibility suites passed
(26+25 shards), including the expanded eight-profile regression and original
paper-review suite. Pinned Chromium151.0.7922.34 / Playwright1.62.0 revision1234.
The browser-tested source remained frozen; [gate evidence](evidence/paper-review-navigation/local-gates.json).

The original isolated paper-review harness checks draft preparation, over-budget
blocking and zero submitted orders. It does not enable execution in the hosted
application. Full release-gate and exact-head hosted results must be reported
separately; no main merge or Production deployment is authorized.

The [WAIT investigation](WAIT-ROOT-CAUSE-REVIEW-20261124.md) and its independent
source/model qualification blockers remain unchanged. Real eligible Ticket and
real model acceptance remain unverified; this fix does not establish operational GO.
