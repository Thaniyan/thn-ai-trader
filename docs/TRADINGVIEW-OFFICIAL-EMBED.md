# Official TradingView embed follow-up

Parent candidate: `2cec0458c8659c6c7f2d72da1a77f02ee895ad9d`. This is an additional local change; none of that candidate's terminal, risk, research, Library, layout or security work was discarded. Production was not modified.

## Owner observation and diagnosis boundary

The owner reports actual EURUSD candles on tradingview.com in the same Chrome browser, while THN Production shows widget toolbar/drawing UI and a black candle spinner. This narrows the problem to the embedded context or integration. It does **not** establish which frame endpoint, entitlement, third-party storage policy, extension, CSP directive or bootstrap behavior is responsible. The first-party chart and public widget can use different paths and permissions.

The prior candidate fixes a reproduced stale-analysis navigation reset. It was not deployed and therefore could not change the owner's existing Production behavior. Its old constructor bootstrap remained an integration difference worth removing.

| Aspect | Preserved candidate | Additional correction |
| --- | --- | --- |
| Bootstrap | Global `tv.js` then `new TradingView.widget` | Documented self-contained `embed-widget-advanced-chart.js` with JSON script body |
| Initialization | Global asynchronous library plus separate library retry | One script owned by each mounted, sized widget parent |
| Sizing | Unique full-height child | Official container/widget classes, explicit height, 32px attribution allowance |
| Studies | Already empty in previous candidate | Remain empty; no study load is required for candles |
| Symbol/timeframe | Explicit mappings, 15/60/D | Unchanged; no arbitrary provider substitution |
| Manual tools | Side toolbar and symbol selection | Explicit top/side toolbars, legend, volume, image save and public indicator controls |
| Lifecycle | Context signature and generation guard | Preserved; late detached script responses cannot alter current app state |
| Readiness | Iframe separate from candles | Script, iframe and provider-data status also distinguished; no automatic toolbar/candle success |

No unlicensed Advanced Charts library, private chart API, injected market data, new data proxy or custom TradingView datafeed is introduced. TradingView remains a separate manual surface; THN Research remains authoritative for validated closed candles and research overlays. No provider prices are asserted equal. Public widget attribution is retained.

## Real-browser experiments

`scripts/qa/probe-tradingview.py` serves the isolated minimal official embed and an isolated legacy comparison, then opens them and the existing local candidate in clean Playwright Chromium through the inherited proxy. It records request failures, safe response/header metadata and screenshots. No provider result is inferred from a canvas or toolbar. The standalone fixture is `tests/fixtures/tradingview-minimal.html`; it loads no THN scripts or studies. The legacy isolation mirrors the released four-study bootstrap; the preserved local candidate had already removed studies. These experiments fail before study settings can execute.

Observed in this environment:

| Experiment | Script | Iframe | Toolbar | Candles | Provider unavailable |
| --- | --- | --- | --- | --- | --- |
| Minimal official embed | Failed: proxy tunnel | Not created | Unverified | Unverified | Unverified |
| Isolated legacy tv.js | Failed: proxy tunnel | Not created | Unverified | Unverified | Unverified |
| Updated local candidate | Failed: proxy tunnel | Not created | Unverified | Unverified | Unverified |

Both script URLs return `net::ERR_TUNNEL_CONNECTION_FAILED`. Current managed policy is enforced and excludes TradingView hosts. No supported alternative browser tool with independent permitted access was available. Network controls were not bypassed or changed. These local failures do not reproduce or explain the owner's toolbar-visible frame, because this browser cannot reach that stage.

Local candidate response headers preserve `Referrer-Policy: no-referrer` and `X-Frame-Options: DENY`; no repository CSP or Permissions-Policy blocks an outbound child iframe. DENY prevents embedding THN itself. The isolated page has no THN headers and fails at the same external script boundary. Actual Production response/header overrides, Chrome third-party storage/cookie decisions, owner extensions, widget WebSocket/feed failures and embedded candle rendering remain unobserved. No security header, cookie policy, iframe protection or hosting setting was relaxed as an experiment.

The candidate's local API responses in the probe are CI fixture responses; they are not evidence of live market or TradingView connectivity.

## Regression and evidence

The preserved browser suite now intercepts the documented **external script request**, rather than shimming the removed global constructor. It still checks configuration, navigation, studies, source separation, risk overlays and saved research. The focused tests independently verify script-only, toolbar-only protocol frame, missing script, delayed script, bounded retry, unknown symbols, malicious readiness messages and late/shared script responses. The late-response test permits Chromium to coalesce identical asset requests; it still requires distinct containers and rejects old-generation readiness events. Neither a 200 script nor an iframe load marks market data ready.

Full gate results and screenshots are retained in [the evidence index](tradingview-embed-evidence/README.md). Protocol screenshots are labeled offline fixtures; real-network screenshots show an unavailable embed, not candles. No persistent widget failure is hidden or marked passed.

## Acceptance and reproduction

**The actual Production black-spinner cause remains unverified; the new public bootstrap is not a proven candle-feed fix.** Final acceptance requires a browser/network permitted to reach the widget's actual third-party dependencies. There is no remaining useful same-network retry here.

For independent minimal comparison, from the repository run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
# Open http://127.0.0.1:8000/tests/fixtures/tradingview-minimal.html
```

For read-only automatic diagnostics against an already running local candidate:

```sh
python3 scripts/qa/probe-tradingview.py --url http://127.0.0.1:PORT/#trading
```

On the permitted browser, compare minimal and candidate with a clean default Chrome profile without changing organization security policy. Capture real frame screenshots and redacted console/network failures for EURUSD, GBPUSD, XAUUSD and crypto, and repeat symbol/timeframe/view changes. A visible candlestick series must be reviewed; iframe or toolbar presence alone is insufficient. Do not export cookies, auth headers or tokenized requests in shared HAR evidence.

Publish only after separate exact-commit owner approval. Until real-widget verification, review this as a supported-bootstrap correction with a usable THN fallback, not a fully resolved TradingView feed incident.

## Official references

- [Public Advanced Chart widget](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/)
- [Official widget integration and container sizing](https://www.tradingview.com/widget-docs/tutorials/iframe/build-page/widget-integration/)
- [Public widget data limitations](https://www.tradingview.com/widget-docs/faq/data/)
