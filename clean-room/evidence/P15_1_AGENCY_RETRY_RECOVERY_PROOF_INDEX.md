# P15.1 Agency retry/recovery exact proof index

## agency-foundation.test.mjs
- Work ladder escalates only on capability/complexity and never on quota/provider/user/protected blockers

## category1-controlled-side-effects.test.mjs
- P1 uncertain side-effect outcomes fail closed and cannot be retried before reconciliation
- P1 missing provider receipt is treated as unknown rather than falsely retryable failure
- P1 only explicit definitive failures are retryable and a later successful retry remains idempotent

## category1-evidence-verification.test.mjs
- P1.7 closure truth states preserve implemented-but-unverified and require explicit blocked or not-applicable reasons

## category1-p1-4-command-event-workflow-runtime.test.mjs
- P1.4 retry inbox and transactional outbox semantics commit one result and replay safely

## category1-p1-9-kernel-recovery-shell.test.mjs
- P1.9 retry budget is bounded and fails closed after exhaustion

## category1-runtime-resilience-contracts.test.mjs
- P1 deterministic retry delays are reproducible bounded and fail when retry budget is exhausted

## category3-sync-reconciliation.test.mjs
- reconciliation never lets stale or ambiguous state silently overwrite newer truth

## category6-ai-provider-routing.test.mjs
- P6.2 durable routing enforces capability, free-first, privacy, health and quota eligibility
- in-memory Brain routing matches free-first/privacy/health/quota policy and provider replacement semantics

## category7-durable-provider-callback-hardening.test.mjs
- R4 lost or uncertain external effects reconcile from evidence instead of fabricated success

## category7-resource-quota-usage-governor.test.mjs
- positive monetary quota requires explicit paid-budget authorization evidence
- quota reservation is idempotent and rejects changed intent or scope
- A10.5 reconciliation aggregates provider receipts and only matched truth becomes reconciled
- late nonduplicate receipts reopen reconciliation while duplicates do not
- unchanged repeated matched reconciliation is idempotent
- reports and release gates fail closed on open usage mismatch or breached quota
- quota and usage tables are authenticated read-only; mutations remain RPC-gated

## category7-shift-manager-persistence.test.mjs
- P7.18 runtime classifies stalled/failed/blocked workers truthfully

## category7-side-effect-outbox-inbox.test.mjs
- side-effect claims are atomic, fenced, and exclude dispatched or unknown effects from retry
- dispatch is generation-bound and records external-effect possibility before any retry can occur
- unknown external outcomes must reconcile to no-effect or succeeded before retry

## category8-postgres-execution.test.mjs
- P8.2 preserves provider identity and immutable reconciliation evidence
- P8.9 scheduled occurrences survive persistence and duplicate cadence identity is blocked

## data-platform-recovery.test.mjs
- sync reconciliation rejects stale state and exposes equal-version conflicts
- P3.6 version gaps fail to reconciliation instead of overwriting canonical state

## finance-foundation.test.mjs
- money-moving actions require exact authorization, health, scope and duplicate reconciliation

## p10-5-social-publishing.test.mjs
- P10.5 lost response becomes uncertain and cannot retry before reconciliation

## p11-6-book-publication-lifecycle.test.mjs
- P11.6 blocked changes/rejection require error or correction evidence

## p11-6-book-publication.test.mjs
- P11.6 blocked publication requires explicit reason or error evidence

## p11-8-book-performance-truth.test.mjs
- P11.8 durable metrics preserve source date reconciliation and truth

## p11-8-book-performance.test.mjs
- P11.8 projected confirmed and settled metrics reconcile separately

## p15-1-auth-session-resume.test.mjs
- P15.1 expired refresh returns to authentication and successful retry resumes without frozen state
- P15.1 expired session with provider outage cannot load private data and later retry recovers
- P15.1 failed shared authentication clears its retry flight rather than retaining a rejected state

## p15-1-startup-watchdog.test.mjs
- P15.1 timed-out data initialization cannot overwrite Recovery on late completion or connectivity retry

## p8-10-condition-watches.test.mjs
- P8.10 backoff suppresses verified transitions until its bound expires
- P8.10 durable schema versions observations/transitions and persists bounded backoff without effect authority

## p8-2-calendar-reconciliation.test.mjs
- P8.2 reconciles newer provider edits, ignores stale snapshots, and surfaces equal-version conflict
- P8.2 refuses reconciliation across owner/provider/external identity boundaries
- P8.2 durable schema preserves provider identity, reconciliation evidence, and owner isolation

## p8-6-onboarding-manifests.test.mjs
- P8.6 exposes every known setup blocker before late execution, including dependency-blocked items

## p9-2-accounts-net-worth.test.mjs
- P9.2 reconciliation accepts newer truth, rejects stale truth, dedupes exact replay, and surfaces same-time conflict
- P9.2 reconciliation cannot cross owner or canonical account/provider identity
- P9.2 durable schema is append-only, owner-scoped, source-dated, state-explicit, and reconciliation-evidenced

## p9-3-transfer-dedup-cashflow.test.mjs
- P9.3 dedup and pending-posted reconciliation preserve raw-source lineage

## p9-9-durable-attempts.test.mjs
- P9.9 durable pre-dispatch reservation and exact reconciliation execute in PostgreSQL
- receipt reconciliation is idempotent and immutable without creating new money authority
- partial success requires reconciliation; unchanged action hash cannot create a duplicate attempt

## p9-9-fault-injection.test.mjs
- P9.9 partial interrupted missing duplicate and malformed pages never promote canonical truth

## p9-9-finance-recovery-evidence.test.mjs
- P9.9 uncertain protected action never replays and requires receipt/provider reconciliation

## pif10-improvement-recovery.test.mjs
- PIF.10 stale restore is blocked by current policy/revocation revalidation

## post-audit-retrofit.test.mjs
- unknown external operation must reconcile before retry and deduplicates in scope

## rev3-gap-closure.test.mjs
- CCR-05833 workload replay covers scheduler, dispatch, claim, retry, conflict, barrier and recovery with protected side effects disabled

## route-state-closure.test.mjs
- a newly declared but unmapped route is blocked instead of using a generic surface

