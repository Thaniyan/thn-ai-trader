# Day8 — actual application evidence

All positive BUY/SELL captures use explicitly controlled **SYNTHETIC** admission
and original engine prices/risk results. They do not qualify a real source,
model, prediction or Ticket. No image editing was performed. Source timestamps
are generated independently in each capture run; these are matched fixtures,
contexts and profiles, not claims of identical retained dataset hashes.

Before: immutable Day7 `19d47f8011b958d58cb77337d90a7efc6af44b6d`.
After: this commit's actual packaged application. The original12 profiles are
repeated for each direction (24 total), all with axe checks. Full original
regression coverage remains; see local-verification.json. Exact-head hosted CI
and Preview interaction must be checked separately after push.

The real EURUSD/1h observation in real-wait.json is separate: existing routes
returned503 MARKET_DATA_UNAVAILABLE and actual UI showed WAIT with no candidate.
This does not diagnose an upstream OHLC defect or qualify a live source. No raw
source rows, owner records, token or model answer are included.

## Matched rendered viewport captures

|Instrument|Width|Language / theme|Before|After|
|---|---:|---|---|---|
|GBPUSD|1440|en / dark|[Before](screenshots/before-GBPUSD-1440-en-dark.png)|[After](screenshots/after-GBPUSD-1440-en-dark.png)|
|GBPUSD|1440|en / light|[Before](screenshots/before-GBPUSD-1440-en-light.png)|[After](screenshots/after-GBPUSD-1440-en-light.png)|
|GBPUSD|1440|ar / dark|[Before](screenshots/before-GBPUSD-1440-ar-dark.png)|[After](screenshots/after-GBPUSD-1440-ar-dark.png)|
|GBPUSD|1440|ar / light|[Before](screenshots/before-GBPUSD-1440-ar-light.png)|[After](screenshots/after-GBPUSD-1440-ar-light.png)|
|GBPUSD|768|en / dark|[Before](screenshots/before-GBPUSD-768-en-dark.png)|[After](screenshots/after-GBPUSD-768-en-dark.png)|
|GBPUSD|768|en / light|[Before](screenshots/before-GBPUSD-768-en-light.png)|[After](screenshots/after-GBPUSD-768-en-light.png)|
|GBPUSD|768|ar / dark|[Before](screenshots/before-GBPUSD-768-ar-dark.png)|[After](screenshots/after-GBPUSD-768-ar-dark.png)|
|GBPUSD|768|ar / light|[Before](screenshots/before-GBPUSD-768-ar-light.png)|[After](screenshots/after-GBPUSD-768-ar-light.png)|
|GBPUSD|390|en / dark|[Before](screenshots/before-GBPUSD-390-en-dark.png)|[After](screenshots/after-GBPUSD-390-en-dark.png)|
|GBPUSD|390|en / light|[Before](screenshots/before-GBPUSD-390-en-light.png)|[After](screenshots/after-GBPUSD-390-en-light.png)|
|GBPUSD|390|ar / dark|[Before](screenshots/before-GBPUSD-390-ar-dark.png)|[After](screenshots/after-GBPUSD-390-ar-dark.png)|
|GBPUSD|390|ar / light|[Before](screenshots/before-GBPUSD-390-ar-light.png)|[After](screenshots/after-GBPUSD-390-ar-light.png)|
|EURUSD|1440|en / dark|[Before](screenshots/before-EURUSD-1440-en-dark.png)|[After](screenshots/after-EURUSD-1440-en-dark.png)|
|EURUSD|1440|en / light|[Before](screenshots/before-EURUSD-1440-en-light.png)|[After](screenshots/after-EURUSD-1440-en-light.png)|
|EURUSD|1440|ar / dark|[Before](screenshots/before-EURUSD-1440-ar-dark.png)|[After](screenshots/after-EURUSD-1440-ar-dark.png)|
|EURUSD|1440|ar / light|[Before](screenshots/before-EURUSD-1440-ar-light.png)|[After](screenshots/after-EURUSD-1440-ar-light.png)|
|EURUSD|768|en / dark|[Before](screenshots/before-EURUSD-768-en-dark.png)|[After](screenshots/after-EURUSD-768-en-dark.png)|
|EURUSD|768|en / light|[Before](screenshots/before-EURUSD-768-en-light.png)|[After](screenshots/after-EURUSD-768-en-light.png)|
|EURUSD|768|ar / dark|[Before](screenshots/before-EURUSD-768-ar-dark.png)|[After](screenshots/after-EURUSD-768-ar-dark.png)|
|EURUSD|768|ar / light|[Before](screenshots/before-EURUSD-768-ar-light.png)|[After](screenshots/after-EURUSD-768-ar-light.png)|
|EURUSD|390|en / dark|[Before](screenshots/before-EURUSD-390-en-dark.png)|[After](screenshots/after-EURUSD-390-en-dark.png)|
|EURUSD|390|en / light|[Before](screenshots/before-EURUSD-390-en-light.png)|[After](screenshots/after-EURUSD-390-en-light.png)|
|EURUSD|390|ar / dark|[Before](screenshots/before-EURUSD-390-ar-dark.png)|[After](screenshots/after-EURUSD-390-ar-dark.png)|
|EURUSD|390|ar / light|[Before](screenshots/before-EURUSD-390-ar-light.png)|[After](screenshots/after-EURUSD-390-ar-light.png)|

## Expanded original-engine risk review

- [1440 / en / dark](screenshots/after-GBPUSD-1440-en-dark-risk-viewport.png)
- [1440 / ar / light](screenshots/after-GBPUSD-1440-ar-light-risk-viewport.png)
- [390 / ar / light](screenshots/after-GBPUSD-390-ar-light-risk-viewport.png)

## WAIT / no released Ticket

- [Synthetic WAIT: 1440 / en / dark](screenshots/after-WAIT-1440-en-dark.png)
- [Synthetic WAIT: 390 / ar / light](screenshots/after-WAIT-390-ar-light.png)

Before-regression.json reproduces the separate-entry Eligible-label defect for
both directions. Browser-integration.json verifies the new Conditional/separate
plan treatment, exact engine levels, one-target availability,18 blank assumption
refusals, source-hash invalidation, immutable Library roundtrip and keyboard return.
Original Day7 AI grounding/cancellation and all prior negative suites remain.
Real model/source/Ticket acceptance is NOT_VERIFIED; PR23 remains draft.
