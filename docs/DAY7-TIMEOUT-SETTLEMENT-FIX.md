# Day7 — timeout/cancellation evidence race

Owner evidence: PR23 comment7082434418; PR run45045870816, job137280231907,
step10, original phase2-performance.test.mjs:174. The generation-state assertion
observed settled instead of unsettled. Push source/tests passed at the same head.
No original assertion, timeout, deadline or financial/provider rule was changed.

## Established mechanism

The generation timing measure settles its JavaScript/HTTP promise in finally when
cancellation rejects it. That settlement event is not evidence that the external
model completed or returned a response. The worker's inner request deadline and
the parent's independent absolute watchdog can settle in either order. Previously,
the parent normalized only its own timer path; a settled transport event could
also be retained in that path. Thus the same unfinished generation could be
reported differently depending on which message/timer was observed first.

A deterministic synthetic worker reproduces settled-before-timeout without HTTP,
weights or inference. Before the fix, it reproduces the exact settled/unsettled
failure. It additionally demonstrates that an early worker timeout with a response
could incorrectly retain runtimeSettlementVerified=true.

## Corrected reporting contract

- Parent and worker timeout evidence are distinguished. Parent deadlineExceeded
  continues to describe the independent parent watchdog; workerTimedOut records
  the worker's TIMEOUT result. Neither extends or renews the original12s ceiling.
- generationTransportSettled states whether transport cleanup was observed.
  Without a received response, generation remains unsettled on either timeout
  path. A started stage is required; missing work is never invented.
- A response actually received can retain generation settled, even if later
  validation times out. The attempt still fails closed, claims/citations counts
  are zeroed and runtimeSettlementVerified remains false for a timed-out attempt.
- Requested/worker-confirmed settings, privacy, worker termination and original
  fallback behavior remain. No arbitrary sleep, retry, relaxed assertion or extra
  model/provider permission was introduced.

Three deterministic regressions cover worker-timeout-first, received-response
then timeout, and parent-timeout-after-transport-cleanup. The complete original
EN/AR HTTP timeout/performance/CLI suites remain required.

## Scope and verification

Only scripts/pilot-supervisor.mjs and new synthetic regression files change
behavior in this correction. All production application/runtime files and the
Build Output artifact manifest are byte-identical to d0203266, whose complete
49-suite canonical browser gate passed. The fresh source-only package manifest is
032739b291e98fef5865f24edc645ee8c5402314836b7c50a42cad5df41aac42.
The full core/security/system/build/lint/packaging/dependency/integrity gates are
rerun for this correction; fresh exact-head hosted workflows must both succeed.

A separate local repeat correctly rejected a runtime key left inside the build
artifact by the manually launched diagnostic server. The normal source-only
package command removed that ephemeral diagnostic state before all final gates;
no integrity assertion was removed and no runtime state is included in source or
artifact manifests. This was separate from the hosted timeout-state failure.

All generation here is synthetic protocol/worker evidence. Real model acceptance
remains NOT_VERIFIED and the prior owner12003ms/no-response trial remains NO_GO.
PR23 stays draft; no main merge, Production, model installation/activation,
paid/hosted inference, source-admission change or financial execution.
