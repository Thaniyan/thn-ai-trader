# Offline local-request evidence — 24 November 2026

Authority: [owner's measured Windows timeout and bounded optimization task](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7125786633).
Implementation and qualification limits: [engineering report](../../LOCAL-AI-REQUEST-EFFICIENCY-20261124.md).

`offline-measurements.json` records 14 synthetic EN/AR construction comparisons
against the frozen `7a79e44` request control. No provider records, private reports,
credentials, actual model tokens or inference measurements are included.

The representative EN request falls from 2878 to 2644 encoded bytes (8.13%). With
the same illustrative 256 output allowance and original reservation formula, the
reservation falls from 3646 to 3412. This is byte-accounting headroom, not a token
or inference-speed claim. Lossless evidence and unchanged full output-schema
comparisons pass in every measurement case. The rich case remains over the 4096
context limit and must still be rejected. Construction adds sub-millisecond CPU
work in this Cloud measurement. Timings vary by machine.

Reproduce offline from the existing repository:

```powershell
node scripts/measure-local-request.mjs
```

The regression additionally executes that command under a preload that rejects
network, worker and subprocess operations. No model inventory, inference,
warm-up, service startup or activation is performed. Generated-response examples
are explicitly **not** used: response byte comparisons are valid synthetic JSON
specimens only. No output is hydrated or repaired.

The accepted UI, numerical engines, strict output validator, timeout/supervision,
dependency lockfile and CI workflow remain unchanged. Verification results and
protected-file hashes are recorded separately in `verification.json`.

**Real-model qualification: NOT_VERIFIED. Operational AI release: NO_GO.** The
actual owner's EN trial timed out without completed response counters; AR was not
attempted. A smaller request does not resolve that evidence gap. A renewed real
EN attempt requires separate owner authorization and an independently reviewed
model identity; AR follows only after accepted EN. November 26 remains a review
target, not permission to waive quality, source, Ticket or financial safeguards.
PR #23 stays draft. No main merge or Production deployment is authorized.
