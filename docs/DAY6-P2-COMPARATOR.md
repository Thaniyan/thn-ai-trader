# Day 6/10 — executable offline source-case comparator

22 November 2026 (Asia/Muscat), existing draft PR23. Owner authorization:
[comment7079692557](https://github.com/Thaniyan/thn-ai-trader/pull/23#issuecomment-7079692557).
The final acceptance-review target is26 November, Day10; unresolved dependencies
can still require NO_GO. This is working operator code, not source activation.

## Run the one-page controlled demonstration now

```sh
node scripts/compare-source-cases.mjs --demo
```

No configuration, source access, model or service is required. The command uses
explicitly **controlled synthetic prices**, not the owner's original records or
invented real corrected vendor data. Expected results:

|Controlled case|Result|Case accounting|
|---|---|---|
|Valid declared fixture revision|PASS / requires source review|36 valid revision cases|
|Candidate absent|BLOCKED / NOT_VERIFIED|36 candidate-unavailable dispositions|
|Contract absent|NO_COMPARISON|36 contract-unavailable dispositions|
|Hash mismatch|BLOCKED|36 unverified-evidence dispositions|
|Rights pending|NO_COMPARISON|36 contract-unavailable dispositions|
|Quote/bar semantics changed|NO_COMPARISON|36 incompatible-semantics dispositions|
|Invalid records retained|FAIL|36 still-invalid dispositions|

Every result keeps sourceQualification NOT_VERIFIED, qualificationChanged false,
networkRequests0 and priceWrites0. Demo exit0 means the demonstration ran, not that
real market data, a model or a research Ticket qualified. Real operator CLI has
no fixture/hash-override switch. The test-only programmatic seam labels fixtures.

## Implemented behavior

The pure comparator [p2-source-cases.mjs](../scripts/p2-source-cases.mjs) and
[operator command](../scripts/compare-source-cases.mjs) have no network, inference,
application-route or financial-admission hook. Original numerical engines are
unchanged; per-row validation reuses the original validateCandles contract.

- Owner mode pins the exact attested P1 response hash
  `d0b0435ff1b685a250c60d208fda058d44aff8c69bab744f3074dc64b55add0d`.
  A matching SHA256 sidecar is required. Changed content or a different capture
  blocks comparison; matching counts do not substitute for identity.
- It identifies exactly36 current-capture geometry cases. Missing/invalid originals
  return BLOCKED with observedCases null and no fabricated record ledger.
- Once the original is verified, every case has one private disposition, including
  explicit blocked/no-comparison reasons when contract/candidate is unavailable.
- Matching uses exact recorded bar-open keys, never shifted times or row indices.
  Duplicate/ambiguous keys, missing coverage, incompatible quote side/timezone/
  session/adjustment conventions or absent revision attribution cannot pass.
- SOURCE_REVISION and INDEPENDENT_REFERENCE are different contract purposes.
  A valid reference is never labelled a Yahoo correction. Same/unknown upstream
  lineage cannot provide an independent-reference PASS.
- Rights and attribution are explicit **owner declarations**, not code-proven
  licensing or source authentication. Opaque evidence IDs stay out of public output.
- caseAssessment separates resolution of the36 cases from other snapshot defects.
  Even36 valid case records can coexist with overall FAIL due to other null/invalid
  records or ordering. All snapshot checks are OHLC/order checks, not source,
  cadence, freshness, calendar, rights or market-admission qualification.
- Original/candidate/contract content is size-bounded and hash-checked before and
  after processing. Inputs are opened read-only; original/candidate/sidecars must
  already be read-only. No snapshot is rewritten, copied, repaired or deleted.
- Only a private case ledger and redacted report are newly written, exclusively,
  in a unique owner-private directory outside Git. The ledger contains record
  timestamps/indices and dispositions, **no prices**. It must not be uploaded.
  Public stdout/report contains only closed states, counts, hashes and booleans.

Bounds:2MiB per snapshot;5000 rows;36 cases;32KiB contract;256-byte sidecar.
Private input symlinks, nonregular files, mutable evidence, repository paths and
unsafe POSIX output permissions are refused. Windows ACL privacy remains the
operator's responsibility; a read-only bit is not WORM or a license. No private
file, original row, individual timestamp, account or credential is requested here.

## Closed contract schema and deliberately pending example

- [Schema](contracts/THN-P2-CONTRACT-1.schema.json): additionalProperties false at
  every contract object. The runtime validator additionally enforces timezone
  validity, semantic equality, cross-field identity/attribution and hash equality.
- [Pending example](contracts/P2-CONTRACT-PENDING.example.json): intentionally
  invalid/pending until actual lawful semantics, rights, candidate hash and source
  revision/lineage evidence exist. Do not replace UNSET with guesses or treat the
  example as owner approval. No endpoint or credential belongs in this contract.

Yahoo originals/corrections use the existing chart response shape. An approved
independent private snapshot can use THN-P2-BARS-1, with a closed identity object
(sourceId, providerSymbol, instrument, product, base, quote, interval,
barSemanticsEvidenceId) and bars containing only time/open/high/low/close/volume.
Canonical times are epoch milliseconds; Yahoo epoch seconds use its existing
format mapping. The tool does not create canonical vendor prices or convert one
source's fields into another's record. Supply only lawfully available immutable
snapshots and a reviewed bar-construction contract.

## Real private workflow — blocked safely until lawful second input exists

The original P1 body and sidecar are already private on the owner's device. Do
not repeat the P1 fetch. In PowerShell, choose a private folder outside all Git
checkouts; use existing Node/dependencies only:

```powershell
$p2Private = Join-Path $env:LOCALAPPDATA 'THN-P2-Private'
New-Item -ItemType Directory -Force -Path $p2Private | Out-Null
node scripts/compare-source-cases.mjs --private-dir "$p2Private"
```

With no input this returns BLOCKED/ORIGINAL_REQUIRED, observedCases null and an
empty private ledger. Exit2 is expected; it is not a successful source comparison.
To account for the actual cohort without a candidate or contract, set the existing
private original path locally (never send that file here):

```powershell
node scripts/compare-source-cases.mjs --original "$p1Original" --original-sha-file "$p1Original.sha256" --private-dir "$p2Private"
```

If the private original matches the pinned P1 body and exact36-case cohort, this
returns NO_COMPARISON/CONTRACT_REQUIRED with all36 cases accounted for privately.
For an already approved correction/reference and contract, use:

```powershell
node scripts/compare-source-cases.mjs --original "$p1Original" --original-sha-file "$p1Original.sha256" --candidate "$approvedCandidate" --candidate-sha-file "$approvedCandidate.sha256" --contract "$approvedPrivateContract" --private-dir "$p2Private"
```

These variables refer to existing private files, not public upload requests or
permission to obtain new vendor data. Candidate contents are not read until the
closed rights/identity/semantics contract passes. No network request occurs.
Preserve originals/sidecars and private-case-ledger.json locally. Share only
redacted-report.json or stdout. The output path is not printed publicly.

Exit0 means comparison checks passed subject to human/source review; source and
Ticket qualification remain NOT_VERIFIED. Exit2 means FAIL/BLOCKED/NO_COMPARISON.
Exit1 is a private-input/contract safety rejection. A reference PASS never repairs
Yahoo; a revision PASS never erases missing rows, gaps or saved-record provenance.

## Day 6 status and Day 7 next gate

Working now: offline comparator, closed schema, immutable private-file workflow,
36-case accounting, redaction, synthetic demo and offline local-AI preparation
([handoff](LOCAL-AI-DAY6-PREPARATION.md)). Real P2 comparison remains NOT_VERIFIED:
no attributable corrected snapshot, approved independent input or complete lawful
contract has been supplied. Original private body is not present in Cloud.

Day7 (23 November): retain the existing strict12s/citation/context/fallback pipeline;
use the prepared owner-device single-shot handoff only with an already installed,
accessible and explicitly authorized local model. No Cloud HTTP inventory/model
activation was attempted on Day6. The last actual owner trial remains NO_GO at
12003ms with no model response. Full real model qualification, real admissible
Ticket and interactive Preview are independent gates, not inferred from this demo.
