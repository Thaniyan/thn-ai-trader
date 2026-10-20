> Integration update: the owner subsequently authorized source-only integration onto canonical main.
> This file preserves the independent candidate's implementation evidence. Its independent-ancestry
> and CI-blocker statements describe that earlier candidate, not the integrated branch.
> Current status and release controls: [docs/V7-RELEASE-READINESS.md](docs/V7-RELEASE-READINESS.md).

# v7.0 intelligence candidate — local only

Original product: `Thaniyan/thn-ai-trader`. Planned production website:
`https://thn-ai-trader.vercel.app/`. No new website, repository, remote branch,
database, background service, cloud resource or paid dependency was created.

## Source and lineage

Read-only Git fetch verified remote main at
`ddd13c298103d93ced74fdb8bbf8c43f4579369c`. That commit still descends through
legacy `50857df`; it cannot be merged into the independent sanitized root.
Only its reviewed public/server/test/script source was transferred onto the
existing clean candidate. `AUDIT_REPORT.md`, runtime records, credentials and
old Git parents were excluded. The prior sanitized release remains preserved
at `a0a75a493b565747d26fc0ef4bf9a22cffec33d6`; the original checkout was not reset.

The active research/opt-in local paper architecture follows v6.6. Earlier
Node/SQLite source and release history remain preserved, but are not silently
represented as the active v6.6 financial backend. Hosted execution stays off.

## Delivered

- Contextual EN/AR conversation in AI Intelligence, plus a Dashboard entry point.
  User/assistant messages, method labels, bounded device-local history, deletion,
  loading/error/retry/cancel, keyboard-scrollable log, mobile and theme support.
  History is unencrypted; corrupt storage is preserved until explicit deletion.
- Six deterministic specialist roles: technical/structure, quantitative, bull,
  bear, risk and manager. Simple questions use fewer roles. A single opposing-
  evidence critique is bounded; no autonomous conversation loop, invented voting
  probabilities, fake thinking animation, price target or execution tool exists.
- Server-created evidence snapshots bind symbol/timeframe, dataset hashes,
  source/provider symbols, availability timestamps, closed-frame indicators,
  causal structure events, quality/missing flags and engine versions. Current
  evaluation parameters and hypothetical plan inputs are recomputed by existing
  engines only when selected dataset identity matches. Late responses cannot
  replace newer symbol or dataset context. Explicit ticker conflicts are refused.
- Drill-down citations, chart navigation, structured evidence/brief export and
  explicit native Library comparison navigation. The existing quantitative
  comparison/replay engines remain authoritative; no LLM metric calculator exists.
- Committee research, personal thesis and declared horizon use the existing
  Research Library/backup codec and capacity/quota rules. Saved follow-ups are
  explicitly unverified and never fetch fresh providers or import later outcomes
  into old evidence. Imported data never gains provider authentication.
- Post-hoc review uses later genuine observations only after the original horizon;
  it rejects mismatched contexts, changed horizons, gaps and inadequate coverage.
  It appends a separate Library note and exports the original plus review. It
  reports observed direction, not investment success, strategy PnL or model learning.
- Optional local provider abstraction supports explicit OpenAI model selection,
  authenticated requests, structured JSON, citation/numeric rejection, abort/
  timeout, zero retries, bounded input/output and request/token reservation ceilings.
  Success identifies model/provider and vendor usage/latency. Rejection falls back
  transparently. The older unbudgeted automatic narrative path is disabled.

## Optional provider: not activated

No legitimate LLM connection was configured or used. Positive provider tests use
an injected mock transport, never a real key. Real generative HTTP access requires
owner-approved `THN_AI_ENABLED=1`, explicit `THN_AI_MODEL`, a server-only key and
`THN_AI_AUTH_TOKEN`, and all three ceilings: `THN_AI_MAX_REQUESTS` (1–20),
`THN_AI_MAX_OUTPUT_TOKENS` (32–800), `THN_AI_TOTAL_TOKEN_CEILING` (1–50000).
Maximum input is 12000 characters/byte-based token reservation; timeout is 12s.
These are conservative single-process request/token ceilings, not a durable
global dollar budget. They reset on restart. Never claim a production spend cap.

Hosted generative access is intentionally unavailable: shared public API keys
cannot be exposed without separately approved authentication and durable budget
coordination. The browser does not collect provider or ChatGPT credentials. The
current conversation always clearly identifies rule-based mode. Paid activation,
hosted auth and a public generative UI are outside this release's authorization.

## Validation and limitations

`npm test` covers the preserved v6.6 numerical/security/replay/library tests plus
v7 citation integrity, future-bar/event exclusion, stale/missing evidence, ticker
context, bounded roles, model schema/numeric rejection, missing credentials,
mock budget/auth behavior, Library import and reflection chronology. Build/lint
cover the original unbundled application plus the intelligence modules.

The v7 browser suites exercise nine sections across EN/AR, desktop/mobile and
dark/light, plus Library save/restore context, reflection append, late-response
rejection and corrupt history. The real-provider terminal suite verifies charts,
SMC, browser/CLI replay, cost changes, comparisons, outages, cancellation and
hypothetical risk. An inherited light-theme stale badge contrast defect was
fixed and the full terminal acceptance rerun passed.

Reproduce the frozen comparison with `node scripts/evaluate-intelligence.mjs`.
It compares the old deterministic brief and new committee on aligned/conflicting,
missing/stale/future and changed datasets. It measures citation/chronology behavior
and latency; it does not establish predictive superiority or semantic correctness.
There is no real-LLM arm, vendor token/cost measurement or learning claim.

Known limits: rule-based intent routing is not unrestricted semantic conversation.
Multi-case numerical comparison stays in the native Library rather than inventing
conversational performance claims. Reflections support manual thesis review, not
automatic success scoring or LLM backtesting. Retained committee metadata is a
bounded projection; snapshot IDs are source references, not authentication or a
replacement for the existing retained raw-candle/replay facility. Provider revisions,
gaps, delayed observations and browser-local storage limitations remain. No new
historical news/fundamental source or verified publication-time archive was added.
Numeric/citation validation cannot prove arbitrary generated prose is true.

## Publication blocker: existing CI is unchanged

The older sanitized branch has broad CI jobs tied to its earlier backend/server
startup, static adapters and browser contracts. They were not silently removed,
skipped, marked optional or retargeted to old code. Automatic approval review
rejected replacing those jobs with narrower v7 checks as a reduction of quality
gates. Current local v7 acceptance does not prove that legacy pipeline green.
A separately reviewed CI reconciliation retaining equivalent security, numerical,
browser and accessibility coverage is required before publication approval.

## Production and rollback references — no execution

Owner-provided original project: `prj_IFLYEB85CRNBjDEGO69xcW4O55Wd`.
Owner-provided current production rollback reference:
`dpl_88NMvmRTrt9EgcyF9frWNbWwjwiB`, source v6.6 `ddd13c2`.
Authenticated file-tree inspection returned 404; exact current deployment binding,
build packaging and rollback eligibility remain to be verified before any release.
No new deployment configuration, hosting setting or production domain was changed.

Do not force-push or merge legacy main into this clean branch. It is not a fast-
forward candidate for that remote main. After CI reconciliation and separate exact-
commit approval, preserve a clean release reference in the original repository and
use the existing original project's reviewed deployment process. Retain and verify
the preceding immutable production deployment; an explicitly authorized hosting
rollback restores that deployment without changing Git history or migrating data.
No production publication or rollback is authorized by this development task.
