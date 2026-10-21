# Public widget bootstrap evidence

- `real-browser.json`: actual clean Chromium request outcomes for isolated modern embed, isolated legacy widget and local candidate; external requests use the mandatory proxy. All three fail before iframe creation.
- `minimal.png`, `legacy.png`, `candidate.png`: actual local real-network screenshots, **no TradingView candles verified**.
- `terminal-results.json`: protocol and 24 desktop/tablet/mobile EN/AR dark/light geometry/accessibility cases. The external script is explicitly replaced with a toolbar-only offline fixture for these tests.
- `browser.log`: initial full 15-suite run: 14 pass, one new test fails on an incorrect two-independent-fetch assumption. `targeted-rerun.log`: that suite passes after its test covers shared in-flight fetches and late-generation events. The failure is retained; no numerical or readiness assertion was waived.
- `gates.json`, `logs/`: build, lint, numerical/integration, security, system, workflow, source and dependency results.
- `package-result.json`, `runtime-manifest.json`, `artifact-manifest.json`, `integrity.json`: production artifact inventory; no fixtures, documentation or private runtime data included.
- `evidence-manifest.json`: evidence SHA-256 inventory, excluding itself.

The preceding remediation remains available unchanged in `../trading-remediation-evidence/`. This follow-up does not convert its protocol results into real-market success. See [the diagnosis and unresolved acceptance gate](../TRADINGVIEW-OFFICIAL-EMBED.md).
