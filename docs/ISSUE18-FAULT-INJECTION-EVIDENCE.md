# Issue 18 — executable recovery investigation (independent main staging)

This candidate changes **tests only** at the paper persistence boundary. PR #17
remains unmerged. Account, adapter, intent, audit and order-route source are
byte-identical to main fb92c96. No automatic reconciliation or new-key recovery
policy is implemented. These are characterization diagnostics, **not financial
acceptance or a claim that all injected faults are safely resolved**.

## Lifecycle and failure model

The local financial POST gate takes an exclusive process writer marker before
route handling. A valid new key is fingerprinted; a durable reserved intent
precedes adapter execution and the in-memory account mutation. The account
JSON is atomically replaced, the audit logger writes its independent file, and
then intent completion is atomically replaced before returning success. There
is no encompassing transaction. Same-key completed replay and conflicting
fingerprint behavior remain covered by the existing professional tests. A new
key after completion is a new order, not an idempotent retry. Unknown reserved
outcomes block all new keys for that account.

Forced termination leaves the writer marker. The application never removes an
orphan automatically. All crash cases below restart against the **same untouched
disposable directory**; the matrix does not delete locks to manufacture recovery.
Every crash/I/O hook must emit its actual firing marker or its test fails.

## Actual matrix — 29 executed scenarios

Columns describe disk state immediately after injection, before restart. Audits
count ORDER_FILLED entries only. Temporary files and all account/audit payloads
are deleted after each case; no runtime data is included in source or packaging.

| Fault boundary | Injection | First HTTP | Positions | Intent | Filled audit | Restart retry | Finding |
|---|---|---:|---:|---|---:|---:|---|
| reserve | rename / before / crash | None | 0 | none | 0 | 409 | NO_ATOMICITY_CLAIM |
| account | rename / before / crash | None | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| audit | write / before / crash | None | 1 | reserved | 0 | 409 | CROSS_FILE_DIVERGENCE |
| completion | rename / before / crash | None | 1 | reserved | 1 | 409 | CROSS_FILE_DIVERGENCE |
| reserve | rename / after / crash | None | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| account | rename / after / crash | None | 1 | reserved | 0 | 409 | CROSS_FILE_DIVERGENCE |
| audit | write / after / crash | None | 1 | reserved | 1 | 409 | CROSS_FILE_DIVERGENCE |
| completion | rename / after / crash | None | 1 | completed | 1 | 409 | NO_ATOMICITY_CLAIM |
| reserve | write / before / ENOSPC | 409 | 0 | none | 0 | 200 | NO_ATOMICITY_CLAIM |
| account | write / before / ENOSPC | 500 | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| audit | write / before / ENOSPC | 200 | 1 | completed | 0 | 200 | AUDIT_FAILURE_SWALLOWED |
| completion | write / before / ENOSPC | 500 | 1 | reserved | 1 | 409 | CROSS_FILE_DIVERGENCE |
| reserve | write / before / EACCES | 409 | 0 | none | 0 | 200 | NO_ATOMICITY_CLAIM |
| account | write / before / EACCES | 500 | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| audit | write / before / EACCES | 200 | 1 | completed | 0 | 200 | AUDIT_FAILURE_SWALLOWED |
| completion | write / before / EACCES | 500 | 1 | reserved | 1 | 409 | CROSS_FILE_DIVERGENCE |
| reserve | fsync / before / EIO | 409 | 0 | none | 0 | 200 | NO_ATOMICITY_CLAIM |
| account | fsync / before / EIO | 500 | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| completion | fsync / before / EIO | 500 | 1 | reserved | 1 | 409 | CROSS_FILE_DIVERGENCE |
| reserve | rename / before / EIO | 409 | 0 | none | 0 | 200 | NO_ATOMICITY_CLAIM |
| account | rename / before / EIO | 500 | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| completion | rename / before / EIO | 500 | 1 | reserved | 1 | 409 | CROSS_FILE_DIVERGENCE |
| reserve-directory-fsync | fsync / before / EIO | 409 | 0 | reserved | 0 | 409 | NO_ATOMICITY_CLAIM |
| corrupt-intent |  | 409 | 0 | none | 0 | — | PAPER_RECOVERY_REQUIRED |
| corrupt-account |  | 500 | — | none | — | — | CLIENT_SAFE_RECOVERY_MESSAGE_NOT_IMPLEMENTED_IN_MAIN |
| corrupt-audit |  | 200 | 1 | completed | 1 | — | CORRUPT_AUDIT_REPLACED_NOT_RECOVERED |
| orphan-writer |  | 409 | 0 | none | 0 | — | PAPER_WRITER_RECOVERY_REQUIRED |
| concurrent-writer |  | 409 | 1 | completed | 1 | — | PAPER_WRITER_RECOVERY_REQUIRED |

| mismatched-owner | active marker replaced with a different owner | 409 | 1 | completed | 1 | — | PAPER_WRITER_RECOVERY_REQUIRED; marker preserved |

## Findings and release boundaries

- **Confirmed gap:** ENOSPC/EACCES audit writes are logged and swallowed. The
  route returns 200 with a completed intent and one durable position but no
  corresponding filled audit event. A same-key retry replays that completed
  response; it does not repair the audit.
- **Confirmed gap:** corrupt audit JSON is silently loaded as an empty list and
  replaced by a later event. Preserving/recovering those bytes requires a
  separately reviewed policy. No such change is hidden in this research PR.
- Crashes after account persistence and before audit/completion leave divergent
  stores. An account-save failure can also leave a reserved intent without a
  durable position. Existing writer/reservation gates prevent duplicate retries
  but cannot establish the business outcome. Manual forensic recovery remains
  required; atomicity/exactly-once is not provided.
- Failures **before** a durable reservation can retry successfully after graceful
  restart, creating one position. Failures after reservation remain blocked.
  The test distinguishes these outcomes rather than imposing a false universal
  409 expectation.
- Corrupt account JSON remains untouched and execution refuses with 500 on this
  main baseline. Startup is lazy; a listening HTTP process is not financial
  readiness. Client-safe recovery UX remains an unresolved M3 dependency.
- Corrupt intent data, orphan markers and a second writer are denied. The
  competing-process case leaves the original single position unchanged.
- Hosted execution denial, live-broker restrictions, quote/risk validation,
  same-key replay and changed-payload conflict are retained in existing gates.

**Acceptance recommendation:** review the research workstation independently.
Do not approve broader local-paper reliability claims until the owner reviews a
minimal audit failure/preservation policy and the separately gated M3 candidate.
Merely throwing after an audit failure would still leave a persisted position;
that is not a transaction fix and is intentionally not implemented here.

## Reproduce

```sh
FAULT_MATRIX_OUTPUT=/tmp/thn-paper-fault-evidence.json node --test --test-concurrency=1 tests/paper-fault-matrix.test.mjs
```

Uses only temporary directories, a synthetic provider and disposable local-paper
servers. The test preload is not in the production package. No real broker,
account, provider request or credentials are needed. This is process/I/O fault
injection, not physical power-loss or filesystem durability certification.

## Proposed separately reviewed follow-up (not implemented)

A minimal policy review can consider refusing financial operations on corrupt audit
storage while preserving its original bytes, and refusing success/completion when
an audit write fails. A post-account-write failure must remain an explicit unknown
outcome with the durable intent unresolved; it cannot safely retry automatically.
The owner must approve those execution/error and recovery semantics before source
changes. The review must retain the exact failure matrix and include operator UX
for preserved evidence, rather than adding lock deletion or automatic reconciliation.
