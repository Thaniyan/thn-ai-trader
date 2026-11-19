# Native Bitcoin USD and spot gold — engineering review, proposals only

Owner scope: PR23 comment7015373102. No new data route, network access, provider,
subscription, account, quote conversion or financial permission is enabled.
These are engineering proposals for independent data/financial owner review,
not verified vendor licenses or approved admission changes. Accepted UI is retained.

## Decision1 — native Bitcoin USD

Current measured path: BTCUSD selection requests Binance BTCUSDT; observed currency
is USDT and native product metadata is absent. Clean999-bar histories do not make
that USD Bitcoin. Keep source/currency/proxy guards and WAIT reasons unchanged.

Preferred first investigation, requiring explicit owner approval: a read-only
qualification capture of the **existing** Yahoo BTC-USD adapter route, in isolation
from the Binance-first fallback. This is a proposed diagnostic route, not implemented
here. The existing adapter's availability is not independently proven native-USD
or a commercial data license. Do not silently alter current provider precedence.

Before any route change, record actual returned symbol/product/USD quote identity,
source timestamps and bar-open/close conventions, all three interval histories,
quality exclusions, calendar/maintenance behavior, provider rights, usage limits,
region availability and local/hosted failure behavior. Verify whether this source
is a vendor composite or a named venue. Expose that provenance rather than calling
it authenticated exchange execution pricing. Bind every frame and cached response
to the same instrument/source/currency policy. A future native-USD path must fail
unavailable rather than falling through to a USDT response labelled USD.

Alternative proposal: explicitly distinct BTCUSDT research. This needs its own
catalog/source identity, USDT quote units, applicable contract specifications,
account valuation/cost assumptions and financial approval. USD capital, stablecoin
valuation, depeg risk and FX conversion cannot be silently assumed. Any required
new conversion or financial calculation needs separate explicit formula approval.
No proxy removal or execution entitlement follows from simply renaming a label.

If the existing USD route fails rights or quality review, the owner may separately
select and approve a licensed venue/vendor. No new provider is selected, installed,
queried or presumed free in this milestone.

## Decision2 — genuine spot XAUUSD research

Measured source GC=F is Yahoo FUTURE/USD. Continuous gold futures are not spot
bullion, a specified deliverable futures expiry, or a broker's XAUUSD contract.
Keep current futures/proxy warnings and block spot Ticket qualification.

Required product decision before provider selection: spot bullion vendor/composite
quotes in USD per troy ounce, or an explicitly named broker CFD. These are different
products. If genuine spot is required, broker CFD quotes cannot be relabelled as
physical/OTC spot without the source's actual specification. There is no universal
single exchange OHLC tape for all OTC spot gold. Identify the source and whether
bars represent bid, ask, midpoint, indicative quotes or transactions.

Owner/data review must establish redistribution/local/hosted rights and choose a
licensed existing entitlement or separately approved vendor. Require XAU/USD spot
product confirmation, units, quote side, bar construction for15m/1h/1d, source and
receipt timestamps, timezone/session boundary, historical coverage, holidays and
exceptional/maintenance gaps, quality limits, availability/rate limits and outage
behavior. Do not manufacture candles from a periodic benchmark or splice futures
history into spot. Any hypothetical broker contract must be separately specified;
research quote availability alone never supplies an execution or sizing contract.

The existing Exness read-only module fetches account configuration and snapshots;
it is **not** an existing historical OHLC/spot-price feed. Extending its endpoints,
permissions or private-data scope requires separate approval and cannot be assumed
from an existing read-only account integration. No credentials are requested here.

Keeping GC=F as explicitly named futures research is a separate scope proposal,
not a substitute for the owner's spot requirement. Delivery/roll/expiry effects,
quote/source rights and any contract specification would require separate review.

## Common approval checklist and release order

|Gate|Evidence required|Current status|
|---|---|---|
|Product identity|Exact provider symbol, asset/product, base/quote units, venue/composite, quote side|Current USDT/futures incompatibilities verified; replacement unselected|
|Rights and access|License terms and permitted research/storage/redistribution, geography, local/hosted restrictions|Unverified; no access or purchase authorized|
|Data contract|Closed-bar timing, all intervals, alignment, null/geometry/gap breakdown, provider clock vs request/kline time|Deeper diagnostic collector implemented; replacement observations pending|
|Calendar contract|Applicable licensed historical schedule, timezone/version/coverage, exceptions and vendor-specific bars|Not supplied; no generic calendar accepted|
|Financial review|Source/contract/account currency and costs, hypothetical-only interpretation, independent source matching|Pending separate explicit owner sign-off|
|Engineering change|Isolated read-only investigation first; later source routing/admission change as a separately reviewable diff|Not implemented; current eligibility unchanged|
|Acceptance|Real owner-device evidence, regression/security/EN/AR gates, precise Preview identity and independent walkthrough|Software gates do not qualify real market data or approve release|

Order: review the new Windows aggregates; obtain source/calendar rights and
specifications; approve a bounded read-only qualification experiment; measure it;
then request specific approval for routing/admission changes. No automatic removal
of genuine geometry/missing-data blockers, no conversion, price repair or default
fallback across currencies/products. Financial engines, execution restrictions,
model policy, main and Production remain unchanged.

Useful authoritative reference **types**, not verified calendars/licenses imported
by this milestone: IANA timezone rules describe civil time, not trading sessions;
CME contract/schedule documents describe relevant futures, not OTC spot gold or
Yahoo FX bars; bullion benchmark methodologies describe their benchmark, not an
intraday bid/ask/OHLC feed. A named source's own licensed instrument/history
contract must establish which calendar and prices actually apply.
