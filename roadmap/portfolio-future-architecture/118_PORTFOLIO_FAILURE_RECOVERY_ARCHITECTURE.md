# 118 — Portfolio Failure / Recovery Architecture

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION

## Threat/failure catalog
Provider outage • model outage • database outage • object/search/vector outage • queue/event outage • payment/billing outage • credential expiry/revocation • bad deployment • corrupt state • malformed/malicious input • rate limiting • runaway Agent • runaway spend/resource • duplicate execution • partial execution • storage exhaustion • network partition • synchronization conflict • stale external state • regional outage • dependency/supply-chain incident • DNS/certificate failure • backup corruption • failed restore • company Brain degradation • shared service failure.

## Recovery invariants
1. preserve canonical truth/evidence before derived caches;
2. idempotent retries and exactly-once commit where effect matters;
3. checkpoint before risky/long work;
4. stale workers/leases are fenced;
5. partial external effects are reconciled, not guessed;
6. rollback/compensation path declared before protected action;
7. provider fallback cannot violate privacy/region/authority/budget;
8. one company failure remains contained;
9. safe mode always available;
10. backups are not trusted until restore tested.

## Failure containment hierarchy
`task → workflow/run → Agent/worker → Brain → integration/provider → project → company → shared service → portfolio control plane`.

Contain the narrowest affected layer first. Escalate wider only when evidence shows shared-root impact.

## Retry policy
Classify transient vs persistent vs authorization/user vs data integrity vs security. Automatic retries require idempotency, bounded attempts, exponential backoff/jitter and no protected authorization expiry/replay. Security/integrity failures do not blind-retry.

## Checkpoints
Checkpoint includes company/project/run/task, state version/generation, context/data versions, artifacts/hashes, provider refs, policy/authorization state reference, completed effects/receipts, pending effects, resource budget and resume instructions.

## External-effect reconciliation
For ambiguous timeout/partial failure, query provider using stable idempotency/correlation key before retry. State can be `unknown_external_result` and block further effect until reconciled.

## Circuit breakers
Provider/company/shared-service breaker tracks error rate, latency, security incident and quota state. Open breaker routes to allowed fallback, degraded mode or blocker. Never silently reroute confidential data to an ineligible provider.

## Safe mode
Read-only/analysis-only where possible, no protected external effects, preserve access to status/evidence/export/recovery controls. Company safe mode independent from portfolio safe mode.

## Backup / restore
Canonical databases/config/roadmaps/evidence/artifact references have backup plan, RPO/RTO target and restore drill. Restore occurs into isolated validation environment first, with integrity/compatibility checks. Restore evidence includes missing dependencies and post-restore reconciliation.

## Disaster recovery
Document per shared service and per company: primary provider/region, fallback eligibility, data replication constraints, DNS/domain dependencies, secrets/KMS, queue/event recovery, manual boundary and communication plan. Scale-only multi-region active-active is not assumed now.

## Incident lifecycle
Detect → acknowledge → contain → investigate → recover → verify → resolve → postmortem/improvement. Recovery cannot skip verification. Security evidence append-only.

## Chaos suite
Inject provider failures, queue outage, stale leases, DB read/write errors, corrupted cache, expired credentials, model unavailability, region prohibition, duplicate events, delayed webhooks, partial transaction, disk/quota exhaustion and runaway Agent. Verify containment and no cross-company corruption.

## DESIGN NOW
Failure taxonomy, checkpoint schema, reconciliation state, retry/idempotency rules, circuit-breaker contract, containment hierarchy, safe-mode semantics, backup/restore evidence and provider-fallback policy.

## BUILD NOW
Connect current kernel recovery, Category 3 recovery, Brain outage mode, Agency leases/replay/canary/failover and future Resource/Security Governors into one recovery contract. Add cross-company failure-isolation and restore-drill tests before resuming broad later-category expansion.

## BUILD BEFORE FIRST COMPANY
Production company backups, provider-specific recovery runbooks, customer-facing status/communications, production DR exercises and company-specific RPO/RTO.

## Acceptance
A simulated Company A DB/provider/Agent failure can be contained/recovered from verified checkpoint while Company B continues; an ambiguous external side effect is reconciled before retry; a backup restore drill proves usable state; a prohibited-region fallback is rejected.