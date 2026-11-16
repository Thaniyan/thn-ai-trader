# PR #20 responsive regression investigation

The original candidate is `0dba503477ea33dac30dc3294b5dfd36869f7394`.
Its earlier local pass remains historical evidence, not proof of hosted CI success.

Push run 42829641756 failed three unchanged browser assertions: Confidence and
Unified Workspace overflow at 160px EN/dark Portfolio, and Workspace Hierarchy
Intelligence height 2554px at 768px EN/dark (required below 2500).
The newer PR run 42831570451 reached a final CANCELLED conclusion before edits:
its browser job exceeded the existing 30-minute job limit. Source/dependency jobs
passed. The browser shard job limit and all suite timeouts/assertions remain unchanged.

## Reproduction and correction

The managed workstation resolves system fonts to OpenAI Sans, masking wider
fallback metrics. A diagnostic-only DejaVu Sans body override reproduces the exact
2554px failure and 162px document width at the 160px viewport. This establishes a
font-metric-sensitive layout defect; it does not prove the hosted runner's exact
installed font. Production font configuration is unchanged.

The validation caption shrank to 3.3px, less than one glyph; nowrap confidence
verdicts overflowed their assigned rows. At narrow widths these captions and
verdicts now have full-width wrapping rows; very narrow inputs use one column.
Empty assistant logs/status paragraphs no longer reserve blank margins. Consistent
heading/action spacing reduces tablet height; mobile validation has a readable
label/result/explanation/action layout, equal-width assistant actions, and compact
panel spacing. No evidence/control is removed and no overflow clipping is added.

The supplemental browser suite adds 48 profiles across default, DejaVu Sans and
Liberation Sans, EN/AR, dark/light, 768/390px Intelligence and 390/160px Lab.
All original page-height limits remain. It also checks readable captions/verdicts,
all ten findings, original evaluation and dataset identity, no page errors, and
disabled live/paper execution. Existing suites retain their fonts and assertions.
DejaVu Intelligence height after correction: 2468px at 768px EN; 3452px at 390px EN.
Arabic: 2146px and 3108px respectively. Both themes agree.

Before images/JSON are captured from the unchanged original candidate using that
font profile; after images/JSON use the corrected package. These are offline
fixture renders, not Production or interactive Vercel acceptance. The 160px image
is an extreme inherited overflow stress profile, not a recommended phone width.

## Complete browser scheduling

The default local gate still runs all 35 suites serially. Hosted CI runs the same
authoritative roster in two isolated jobs with disjoint index partitions and
`fail-fast: false`, retaining the 30-minute budget in each job. A final check named
`Browser and accessibility` (the original check name) fails unless every shard
succeeds, including cancellation/skipping. A core regression proves coverage and
uniqueness for 1/2/3/35 shards and rejects incomplete/out-of-range configuration.
No suite can be silently omitted by an invalid shard setting. This addresses whole-
job budget pressure without enlarging timeouts or weakening any browser assertion;
it is not a claim that the hidden cancelled-job logs establish its slowest suite.

## Verification and access limits

See the correction verification JSON for completed final gate results. Do not infer
hosted CI success from these local results. The cancelled hosted run's exact
slowest step remains unavailable: detailed GitHub logs require sign-in and the
supported API endpoint is blocked by workspace CONNECT 403. No timeout increase,
assertion weakening, test skipping or security-policy change was made.

At original head, the existing unique Preview was
https://thn-ai-trader-78z2y7zjh-s139354s-projects.vercel.app/ .
GitHub's deployment metadata and owner independent verification associated READY
with `0dba503...`; this is not proof for a subsequent correction commit. The owner
reported safe GET smoke tests passing there. Our direct Preview health request
received proxy CONNECT 403 before origin. A new head needs its own exact-SHA CI and
Preview verification. Release controls: `../../PR20-RELEASE-ACCEPTANCE.md`.

The runner also prints each suite name before starting and its elapsed time after
completion. Future hosted job cancellation can therefore identify the active
suite without depending solely on a local per-suite log that disappears with the
runner. No financial or provider implementation is changed.
