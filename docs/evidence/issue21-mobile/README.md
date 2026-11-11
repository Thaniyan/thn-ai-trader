# PR20 mobile chart acceptance correction

Owner evidence: [exact hosted failure](https://github.com/Thaniyan/thn-ai-trader/pull/20#issuecomment-6796997304).
Baseline: `1625b75f6637b5f2910418c3a7d346ef4ebd1d1b`. Existing PR20 branch only; no main integration or Production deployment.

## Reproduction and cause

The managed workspace has `/etc/fonts/conf.d/52-orbit-os.conf`, which strongly prefers OpenAI Sans. Its extra Noto fonts also differ from the Ubuntu runner. A **process-local** font configuration excluded that override and exposed the existing DejaVu/Liberation/FreeFont directories. No system font configuration or application font stack was changed. Pinned Chromium remains revision 1234, Chrome for Testing 151.0.7922.34.

With the original application package, the unchanged hierarchy suite reproduced the hosted assertion **exactly**: 390px, English, dark, chart Y `750.640625px`, height `420px`, visible height `249.359375px`. See [original failure](original-failure.txt).

The native Ubuntu-style top bar was `70.921875px` high, versus `66px` with the workspace's extra font selection. That 4.921875px growth propagated through the entire stack. The old layout had insufficient room for normal font variation.

The correction keeps natural header growth. On mobile, the confidence card's container now has its own 15px line box instead of inheriting the 23.1px body strut, and chart-header row gaps are 6px instead of 10px. Existing child text sizes, controls, source disclosures, confidence/grade information and 420px chart height remain. No essential content is hidden, moved off-screen or clipped. No financial behavior changes.

| Reproduced profile | Before chart Y | After chart Y | After visible height | Remaining margin |
| --- | ---: | ---: | ---: | ---: |
| Default / DejaVu · 390 EN dark | 750.640625 | 729.546875 | 270.453125 | 20.453125 |
| Liberation · 390 EN dark | 751.046875 | 729.953125 | 270.046875 | 20.046875 |

[Full 64-profile geometry](geometry.json) records 1440/768/390/320, English/Arabic and both themes under four requested font stacks. Noto Sans is unavailable in this restricted Ubuntu-style profile and correctly falls back to Liberation; actual measured fonts are recorded for the 390 EN dark cases. These are offline provider-fixture renders, not live-market or Production acceptance.

## Rendered evidence

- [Before: exact failing 390 EN dark profile](before-390-en-dark.png)
- [After: same native font profile](after-390-en-dark.png)
- [After: 390 Arabic RTL light, DejaVu regression profile](after-390-ar-light.png)

The original hierarchy test is byte-identical to the baseline; [hash proof](unchanged-assertions.json). Its assertions, thresholds and timeouts are unchanged. The existing font suite retains all 48 prior cases and adds 24 Dashboard cases using the original chart bounds, plus visibility checks for confidence/evidence. Complete current-source gate evidence is recorded separately in `verification.json` once finished.

## Reproducible font setup

Use a temporary `FONTCONFIG_FILE` with font directories `/usr/share/fonts/truetype/dejavu`, `/usr/share/fonts/truetype/liberation`, `/usr/share/fonts/truetype/liberation2` and `/usr/share/fonts/truetype/freefont`. Include the distribution's `/etc/fonts/conf.d/*.conf` files except the local `52-orbit-os.conf`, via a temporary config directory. This process-only profile requires no installation, deletion or global configuration change. `fc-match sans-serif` and `fc-match monospace` resolve to DejaVu Sans / DejaVu Sans Mono. Run the original suite, expanded font suite and entire existing two-shard browser gate with that environment. The unchanged baseline fails at the exact hosted coordinates above; the correction must pass the same bounds.

Hosted exact-head CI and the new matching Preview must still be checked after the branch push. Original guards, PR17 financial approval and owner-controlled main/Production release policy remain in force.
