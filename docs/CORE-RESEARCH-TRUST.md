# Core Research Trust — local implementation

Baseline: canonical main `fad7fe6d03f799bc699401e9fc31004e9b6c1087`, fetched and
verified before branching to `feature/core-research-trust`. The completed audit
was first preserved in local commit `2c91a42`. No remote operation other than
read-only fetch was performed. This candidate is for owner review, not a release.

## Root causes and corrected behavior

| Boundary | Cause | Correction |
|---|---|---|
| Saved analysis | Legacy `saveJournal` assigned WIN, target exit and risk × target reward without execution | A versioned research idea contains hypothetical levels, but no realized PnL, outcome or exit |
| Classification | Plain historical rows and editable WIN/LOSS buttons implied execution | Central read-only classifier distinguishes ideas/scenarios, paper records, reported closed outcomes and unknown records; cycling cannot promote outcomes |
| Manual/CSV data | Missing date, direction, entry, exit, risk, PnL and grade were invented; price differences were converted using an arbitrary multiplier | Explicit bounded dated USD reported outcome fields are required; incomplete imports are rejected before commit; no inferred price-to-dollar profit |
| Performance | Ideas/manual/imported/paper records shared one ledger; $10k capital and PF 9.99 were invented | Default verified-source view is unavailable; optional paper/manual/import sources are separately selected and prominently unverified; no authenticated capital return/drawdown %, undefined PF/payoff stays unavailable |
| Dashboard | Falsey unavailable account balance fell back to $50k | Account balance/equity/margin/daily PnL display unavailable when account is unavailable |
| Analytical history | Legacy analysis/scanner/quotes used raw/forming candles, different alias histories from independent research | One validation adapter canonicalizes analytical aliases to 15m/1h/1d and uses ordered, closed provider candles, observation cutoffs and shared hash identity |
| Event chronology | Structure confirmation time is a bar-open label, but committee references treated it as immediately available | Committee event references become available at confirmation-bar close; source algorithms and their bar labels stay unchanged |
| Missing provider time | Yahoo metadata could fall back to server now | Missing observation time makes analytical evidence unavailable; server time is not manufactured as provider time |

## Files and contracts

- `public/research-records.js`: pure record classification, bounded CSV/JSON
  interpretation, source selection and bilingual labels. Browser fields cannot
  authenticate execution, including a field claiming `verified`.
- `public/app.js`: journal writes/exports/import preview, manual entry, source
  filtering, outcome metrics, dashboard unavailable state and safe labels.
  Chart legends/tooltips also clear unavailable data and derive reported R from
  reported PnL/risk; the old falsey-zero fallback invented -1R for breakeven.
- `public/index.html`: record helper loaded before legacy app, explicit manual
  risk input, no prefilled forecast exits/profits, append-only import controls.
- `server/market-evidence.js`: validates interval/provider time and applies the
  existing `prepareSeries` closed-candle contract at the analytical data boundary.
- `server.js`: chart/brief/MTF/analysis/scanner/quotes/evaluation/committee/reflection
  use that boundary. Financial execution/close still use their original raw-price
  path; no paper execution semantics changed.
- `server/intelligence.js`: event availability metadata correction only.
- `package.json`: additive syntax checks; no dependency change.
- `scripts/ci/run-browsers.py`: original twelve suites plus additive trust suite.
- `tests/trust*.mjs`, `tests/browser_trust.py`: record, chronology, actual packaged
  HTTP, known paper retry and browser/import/accessibility tests. One existing
  intelligence fixture moves its valid confirmation bar back one interval to match
  the documented bar-open convention; every original assertion remains.

The authoritative research/backtest/evaluation/planning/replay/chart modules remain
byte-identical to canonical numerical baseline. No trading formula or strategy
selection was changed. A stricter data eligibility boundary can intentionally
produce different legacy signals when its old inputs contained a forming bar.
Legacy paper-adapter timestamp fallback is preserved for scope compatibility;
an explicit provider-time presence marker prevents that fallback from entering
analytical evidence. This is not a silent paper-engine price-policy change.
The browser paper monitor uses `/api/broker/paper-quotes`, behind the existing
opt-in local financial gate, to retain its previous raw-observation marks.
Public research quotes are closed bars. Hosted access to the internal marks route
is denied; a dedicated fixture test proves the separation. No order protocol,
fill/close algorithm or idempotency behavior was changed.

## Record and migration policy

`THN-RECORD-1` explicitly separates `research_idea`, `hypothetical_scenario`,
`paper_trade`, `executed_trade`, `closed_trade` and `unknown`. The executed category
does not grant verified status: no broker-verification mechanism exists, so browser
execution claims remain unknown/unverified and are excluded by default.

Reported closed outcomes require symbol, BUY/SELL, nonfuture unambiguous date,
positive finite entry/exit/initial risk, finite reported PnL and explicit USD
currency. These fields support an unverified report, not proof of execution.
Paper receipts additionally require matching simulation ticket/volume/result
fields; they are never broker-verified. No user-provided token/receipt can enable
live execution or turn a forecast into a verified outcome.

- Existing journal bytes are never rewritten on read. Old WIN/profit values remain
  available under **Original record**, labeled unknown, and are excluded from metrics.
- New writes append without silent count trimming. At 500 records/1.8 MB, unreadable
  storage or quota failure, the write is refused and previous data remains.
- Explicit user deletion/reset still exists; automatic interpretation never deletes.
- JSON export `THN-RECORDS-1` preserves all original journal records. Corrupt raw
  storage can be downloaded as recovery text, never silently replaced by an empty
  journal. Lack of storage access reports failure instead of claiming success.
- JSON restoration (up to 2.1 MB) creates new append-only unverified records, preserving each
  original as data. Ideas remain ideas; old/paper/execution claims do not regain
  authority through import. Supported closed reports become imported/unverified.
- CSV has exact header aliases, quoted/multiline parsing, 1 MB/500-row bounds and
  row-specific validation reasons. An explicit record kind is required; merely
  supplying legacy WIN/PnL fields cannot promote an unknown record into an outcome.
  Malformed/partial files cannot commit a partial
  successful subset. Missing fields are not invented. Raw accepted CSV values are
  retained with the record. Formula-like text is neutralized in optional CSV export;
  actual finite numeric negatives remain numeric for loss round trips.
- New file reads invalidate old previews; cancellation/close/error cannot reuse a
  previously valid pending import. Replacement mode is disabled; restore appends.
- Existing Research Library formats, snapshots, backups, replay and numerical
  compatibility modules are unchanged. No local/cloud/account data migration ran.

## Candle and available-at policy

Analytical aliases map to their actual independent interval and cache entry:
scalp→15m, intraday→1h, swing/position→1d. Timestamps are provider bar-open labels;
a bar enters evidence only if `open + interval <= min(requestAsOf, providerTime)`.
Unordered/duplicate/inconsistent data, invalid interval/cadence, missing timestamps
and materially future provider observation times fail closed. Up to five seconds
of provider clock skew is tolerated, without admitting future bars.

The existing engine validates/derives all indicators; hashes identify the exact
eligible candles. The adapter discloses requested cutoff, provider observation,
latest available-at, excluded unclosed bars and timestamp convention. Adjacent
requests can still acquire revised histories at different times; hash mismatch is
an explicit different snapshot, not guaranteed shared realtime market state.

Committee structure references use confirmation-bar close for available-at. No
future bar or unfinished confirmation event can enter the research snapshot.
Saved historical records retain original labels; they are not retroactively
rewritten. This does not add exchange calendars, licensed tick data or corporate
action/futures-roll adjustment. Daily bars still follow the established fixed
interval convention; exchange-specific finalization belongs to market-data work.

## Paper-order assessment (not fixed in this milestone)

Independently reproduced with the actual packaged opt-in local engine and synthetic
provider data: same key returns the original ticket; same order with a newly
generated key creates a distinct ticket and a second position. The client creates
a new key each invocation; the server keys its five-minute RAM cache by account
and key, not durable logical intent. Restart also loses this cache.

`tests/trust.test.mjs` deliberately records this known limitation in a named
assessment test, not as proof that duplicate prevention works. This is confined
to the explicitly opted-in local single-operator engine. Hosted account/order
mutations remain disabled and are tested. No immediate public/live execution
exposure was found, so order behavior was not silently changed here.

Recommended separate fix: persist a client logical-intent ID through pending and
uncertain responses, offer status/recovery before resubmission, and transactionally
store account/fingerprint/result with settlement and durable uniqueness. Different
valid intended orders must remain distinct; heuristically deduplicating all equal
payloads is unsafe. Add restart/crash/concurrency/lost-response tests before widening
paper availability. This belongs to local-paper ledger scope, not research records.

## Verification and release boundary

Full gate results and screenshots are recorded in `docs/core-trust-evidence/`
after final validation; raw diagnostic runs remain under
`/workspace/work/core-trust-evidence/`. Initial diagnostics are not hidden or
counted as passing final gates. Synthetic provider/protocol tests do not establish
live-market, real-model or broker performance.

Remaining limitations: no authentic broker execution source, durable multi-user
account ledger or hosted financial operations; browser-controlled reports remain
unverified. Local paper uncertain-response duplication remains known. The prior
Broker Accounts contrast/scroll issues and global denied-storage startup issue
are separate audited M2 work; no unrelated UI redesign was made. Real-model quality
is still pending and hosted inference remains disabled. Production was not changed
or interactively tested by this task.

Only local review is authorized. A later exact-SHA release requires separate owner
approval, hosted mandatory CI and actual Production verification where access
permits. No push, PR, merge, deployment, paid API/resource or model activation was
performed.

Final validation: 147 unit/integration/numerical tests, 21 security tests, 10
system assertions; all 13 browser suites passed, followed by focused final
revalidation of the rebuilt trust interface and 12 expanded/populated outcome
accessibility profiles. The 202-case responsive shell gate passed. See the
evidence index for exact gate timing, final artifact hash, screenshots and the
distinction between full-suite and final focused checks.
