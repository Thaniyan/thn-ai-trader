# Trading experience remediation

Local-only follow-up to released workstation `ab910a5cb7d46e52a08421b688f8caee7130fc29`. No push, deployment, cloud configuration, dependency addition or financial/LLM activation.

## Diagnosis and acceptance boundary

The owner reports an actual Production widget toolbar with black candle area and perpetual spinner. That observation is accepted. Its external chart-feed cause is **not established** here: the managed proxy denies the original Production domain, `s3.tradingview.com` and `www.tradingview.com`; actual Chromium navigations return `ERR_TUNNEL_CONNECTION_FAILED`. No successful widget feed/WebSocket trace or real candle screenshot was obtained. This is an environment limitation, not evidence that the owner's browser has the same restriction.

A separate integration defect is reproducible in the exact released source. A constructor-recording browser fixture selects GBPUSD from Markets: the first request is `FX:GBPUSD`, then a delayed `switchView` callback calls the old `loadChart()` and replaces it with `FX:EURUSD` from earlier analysis. Three unchanged returns produce eight constructions. The old renderer clears its container on every call, including language/theme and hidden-view calls; the terminal's signature guard does not cover these direct callers. See `baseline-lifecycle.json`. This explains wrong-context resets and repeated initialization, **not conclusively the persistent black external feed**.

The old widget also requests RSI, MACD, ATR, Bollinger Bands, details, hotlist and calendar on startup. These were removed from default initialization to reduce external work. There is no evidence that any particular study caused the Production failure. No repository CSP prohibits the external frame; X-Frame-Options DENY protects THN from being embedded, not outbound child frames. Live provider/header overrides could not be inspected through the blocked origin. Existing security headers are unchanged.

## Implemented

- All historical `loadChart` callers now use the terminal's selected context. Widget creation is visible-only and keyed by mapped symbol, interval, locale and theme. No reload for unchanged navigation, metadata, or switching away and back. Each generation has its own child container, preventing late initialization from targeting the next widget. Explicit retry remains available.
- Minimal official public widget configuration, UTC candlesticks and mapped 15-minute/hour/day timeframes. No proprietary Advanced Charts package, private widget methods, iframe data extraction, spoofed prices or custom TradingView datafeed.
- Immediate THN Research fallback and official external chart link with the requested symbol/interval. Missing script/constructor errors collapse the empty chart area. A bounded 18-second message explains unverified external candle availability even if an internal widget spinner persists.
- Explicit retry can reload the official script once, with an 18-second bound and duplicate-click lock. Delayed script availability initializes the current context. Unknown mappings remove the previous frame and reset the external link.
- Iframe loading is recorded separately from UI and candle readiness. No public event, iframe load, forged message, toolbar-only protocol frame, or timeout marks candles verified. No fake automatic success indicator.
- Shared instrument selector gains catalog suggestions; it retains its existing global research-context behavior. The terminal has direct actions for original instrument analysis, evidence/scenarios, hypothetical Risk Desk and the existing Research Library.
- Selected research evidence shows provider, closed-candle timestamp and dataset identity. It distinguishes matching scenarios from unavailable context. Existing authoritative plan validation, entry/stop/target overlays, drawings, deterministic committee and saved snapshot/replay contracts are reused.
- EN/AR fallback, status, links and workflow labels; RTL, mobile wrapping and keyboard-accessible fallback with focus return.

TradingView selections remain independent from THN. Provider prices are not claimed identical. Validated overlays stay on the owned chart. Hosted accounts, financial execution and generative inference remain disabled.

## Verification

See the adjacent evidence index and raw gate logs for completed results. Offline widget protocol tests deliberately cannot establish actual TradingView price data. They cover GBPUSD wrong-context reset, EURUSD/GBPUSD/XAUUSD/BTCUSDT mappings at three timeframes, unchanged navigation, explicit retry, delayed/missing scripts, constructor errors, unknown mappings, untrusted readiness messages, bounded status and immediate fallback. The deterministic HTTP risk plan and saved-research paths are tested against the packaged application with explicitly offline provider fixtures.

The final delayed-script test caught a retry guard that treated a loading status as an existing widget; reuse now requires a constructed widget. The test was rerun successfully, without waiving its assertions. The preserved journal journey now explicitly completes original analysis before saving instead of racing startup.

Before/after screenshots are actual local Chromium captures, not Production screenshots. THN prices in these captures come from offline CI fixtures, not live quotes. Any toolbar-only frame is a labeled test fixture, not a TradingView candle success.

## Official integration references

- [Public Advanced Chart widget configuration](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/) — minimal public configuration, distinct from the licensed charting library.
- [Widget data FAQ](https://www.tradingview.com/widget-docs/faq/data/) — exchange availability, widget-only restrictions and no custom provider feed.
- [Widget languages](https://www.tradingview.com/widget-docs/faq/languages/) — Arabic is supported; actual external rendering remains unverified here.

## Remaining release gate

**Do not describe TradingView as fully fixed.** Actual external candles remain unverified for all four requested instruments. Before a claim of full TradingView remediation, test the exact candidate in an authorized normal browser/network: EURUSD, GBPUSD, XAUUSD and supported crypto, including requested timeframes, repeated navigation, EN/AR and both themes. Inspect real frame screenshot and chart-data requests/errors, not iframe existence alone. If the feed remains blank, capture a redacted HAR and console trace to identify provider, entitlement or network failure; do not weaken security or buy services as a workaround.

The local candidate may be reviewed as a lifecycle, recovery and workflow improvement. Publication requires separate exact-commit approval. No source or canonical history rewrite is required.
