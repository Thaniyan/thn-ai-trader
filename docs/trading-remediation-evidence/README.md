# Trading remediation evidence

All screenshots are actual **local Chromium** captures. They are not Production images. Market evidence is supplied by the explicitly offline CI provider fixture; displayed prices are not live observations.

- `before-research.png`, `before-tradingview.png`: unmodified released workstation package at `ab910a5...`; the latter shows the locally unavailable external library, not a reproduction of the owner's actual toolbar/spinner.
- `after-research.png`, `after-unavailable.png`: candidate's owned chart and immediate external failure recovery.
- `profiles/research-*.png`: final candidate across desktop/tablet/mobile, EN/dark and AR/light.
- `profiles/manual-*.png`: **toolbar-only protocol frame**, deliberately no candles. These validate layout/recovery; they do not validate TradingView chart data.
- `baseline.json`: actual Chromium failures reaching Production and TradingView through the required managed proxy.
- `baseline-lifecycle.json`: released-source wrong-context reset and eight widget constructions. `reproduce-lifecycle.py` documents the local source-route harness, with only trusted first-party baseline files substituted; no financial/TradingView data is fabricated as live.
- `browser.log`: all 15 suites passed. Final affected-suite logs and `final-browser-gates.json` record follow-up checks after script retry and generation isolation were completed. Other full-suite boundaries were unchanged.
- `validation.json`, `terminal-results.json`, `professional-results.json`: counts and explicit external verification limit.
- `logs/`: raw numerical/security/system/build/source/workflow/dependency results.
- `artifact-manifest.json`, `runtime-manifest.json`: packaged application hashes. Documentation and fixtures are excluded from the production artifact.
- `evidence-manifest.json`: SHA-256 inventory of this evidence directory, excluding itself.

No actual TradingView candle-rendering success, provider data-feed success, live Production browser validation or deployment is claimed. Acceptance of full TradingView remediation remains pending real-browser feed verification on an authorized network. See [the remediation report](../TRADING-EXPERIENCE-REMEDIATION.md).
