# Audit evidence index

Reports dated 21 October 2026; source SHA
`fad7fe6d03f799bc699401e9fc31004e9b6c1087`.

- [Structured findings and measurements](evidence.json): established gates,
  dependency-tool resolution, targeted API probes, real local provider retrieval,
  settled accessibility scans, storage fault injection and evidence hashes.
- `*.log.txt`: unchanged copied output from the completed established gates.
  `dependencies.log.txt` records the initial missing-tool failure;
  `dependencies-supported-tool.log.txt` records the successful supported-tool rerun.
- [Desktop Dashboard](dashboard-1440-en-dark.png),
  [desktop Risk Desk](risk-1440-en-dark.png),
  [Arabic mobile light Risk Desk](risk-390-ar-light.png),
  [settled Arabic mobile Broker Accounts](brokers-390-ar-light-stable.png).

Screenshots show the real packaged UI running locally with synthetic provider data.
They are not Production screenshots, before/after fixes or evidence that live
account/broker/model services work. No fixes were implemented in this audit.

Detailed raw scripts/logs and the full initial 18-screenshot set remain preserved
in `/workspace/work/core-audit-20261020/`. Temporary paper account state was
disposable synthetic test data; it is not included here. No real credentials,
customer/account records, private SQLite database or authentication bypass link
is part of these documents.

The source and dependency gates passed; supplemental tests intentionally exposed
failures outside the narrower established assertions. Both results must be retained.
Production functional/POST/browser checks remain blocked by managed network policy;
READY/source/alias observations are platform metadata only. No real model ran.
