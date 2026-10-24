# Category 7 — Agency durable reconciliation — 2026-10-24

Status: **IMPLEMENTED BUT EXACT-HEAD QA REQUIRED / PRODUCTION NOT APPLIED**

This evidence reconciles the canonical Category 7 roadmap against the isolated branch `build/spec-lock-v2-clean-room`. The SQL migrations and tests described here are branch artifacts only. They do not prove production Supabase application, deployment, protected-action execution, Work launch, spending, communication, or owner/Samsung acceptance.

## Canonical phase map

A numbering drift was discovered during implementation. Earlier commits labeled several durable layers one phase too early because the canonical P7.1 durable run/job/task state model had not yet been accounted for. Git history is preserved; the functional canonical map is:

- P7.1 — `20261024152500_category7_run_job_task_state.sql`
- P7.2 — `20261024153000_category7_project_agent_state.sql`
- P7.3 — `20261024153500_category7_executor_registry.sql`
- P7.4 — `20261024154000_category7_scheduler_leadership.sql`
- P7.5 — `20261024154500_category7_task_claims.sql`
- P7.6 — `20261024155000_category7_resource_claims.sql`
- P7.7 — `20261024155500_category7_dependency_scheduler.sql`
- P7.8 — `20261024160000_category7_context_packets.sql`
- P7.9 — `20261024160500_category7_project_auto.sql`
- P7.10 — `20261024161000_category7_agent_auto_portfolio.sql`
- P7.11 — `20261024161500_category7_boundary_office.sql`
- P7.12 — `20261024162000_category7_work_ladder.sql`
- P7.13 — `20261024162500_category7_dynamic_organization.sql`
- P7.14 — `20261024163000_category7_autonomy_decision_rights.sql`
- P7.15 — `20261024163500_category7_delegation.sql`
- P7.16 — `20261024164000_category7_independent_verification.sql`
- P7.17 — `20261024164500_category7_integration_arbitration.sql`
- P7.18 — `20261024165000_category7_shift_manager.sql`
- P7.19 — `20261024165500_category7_pause_stop_kill.sql`
- P7.20 prerequisite — `20261024165900_category7_context_packet_owner_key.sql`
- P7.20 — `20261024170000_category7_protected_preflight.sql`
- P7.21 — `20261024170500_category7_deterministic_replay.sql`
- P7.22 — `20261024171000_category7_canary_rollout.sql`
- P7.23 — `20261024171500_category7_recovery_failover.sql`
- P7.24 — `clean-room/tests/category7-agency-adversarial.test.mjs`

## P7.1 — Agency state model

Durable runs/jobs/tasks/state events with stable IDs, explicit lifecycle states, generation, objective/control mode, risk, cost, environment, capability, retry count, blockers, checkpoint/evidence, idempotency and verification references. Completion requires verification evidence rather than UI inference.

## P7.2 — Project Agents

Server-authoritative Project Agent state is versioned/generation-fenced and checkpoint-scoped. Mission, queue reference, context/policy versions, state hash and immutable version history survive client/browser loss.

## P7.3 — Executor registry

Durable executor registry is capability/environment/project-type/account/permission/cost/health/risk/verification/version driven. Executors can be added/retired without orchestration-core edits.

## P7.4 — Scheduler control plane

Transactional leader lease with monotonically increasing term/fencing token. Competing live leaders and stale fencing tokens fail closed; leadership events are append-only evidence.

## P7.5 — Task leases/claims

Claims persist worker/generation/fencing/heartbeat/expiry/retry/idempotency. Expired work is reclaimable; stale workers cannot heartbeat/release/commit; task commit is exactly-once with idempotency evidence.

## P7.6 — Shared-resource serialization

Shared/exclusive resource bundles acquire transaction-scoped advisory locks in globally sorted resource-key order. Conflicting credentials/accounts/files/providers/datasets serialize without deadlock cycles; disjoint/shared work remains parallel.

## P7.7 — Dependency DAG / parallel scheduling

Durable task graph requires dependencies already exist in the same project graph and prohibits self-dependency. Readiness requires every dependency verified/skipped. Worker candidates are capability and anti-affinity filtered and returned in deterministic priority/sequence order.

## P7.8 — Immutable context packets

Packets freeze project/run/task, Project Agent generation, goal/spec/owner-instruction versions, authorization scope, checkpoint, dependency/provider evidence, artifacts/hashes, source versions/hashes/sensitivity and freshness. Wrong project/task/generation or stale packets cannot commit.

## P7.9 — Project Auto

Project Auto binds exactly one project/run/latest verified checkpoint/Project Agent generation, obtains one project lock, selects a dependency-ready task and a free-first eligible executor, and returns either `working` or a specific blocker. A post-save field mismatch against `command_center_project_profiles.type_key` was corrected before any production application.

## P7.10 — Agent Auto portfolio

Portfolio selection uses stored project priority plus active lifecycle, verification state, explicit `project-auth:agent-auto` authorization, Project Agent availability, concurrency and project-lock state. Books are structurally excluded from portfolio auto unless a newer owner rule changes that policy.

## P7.11 — Boundary Office

Durable Next Step / Until Work / To Work Barriers / Manual Task / Project Checkpoint / Needs Me records preserve blocker, required owner action/environment, verification method, checkpoint, resume task/context and run generation. Work cannot auto-launch.

## P7.12 — Work ladder

Normal-chat-first ladder distinguishes genuine capability/complexity escalation from network/provider/quota/credential/input/user/protected/verification blockers. Transient network/timeout retries once. Requested scopes must remain a subset of authorized scopes. Work launch and protected-action authorization remain false.

## P7.13 — Dynamic organization

Lead registry and temporary mission organization select by capability, project type, authority scopes, workload, risk, health and concurrency. Team shape is auditable rather than hard-coded.

## P7.14 — Autonomy / decision rights

OBSERVE→CONTINUOUS autonomy is durable but cannot enlarge authority. Protected/spending authority are structurally false as autonomy-level side effects. Protected decisions remain behind the separate Category 2 gate.

## P7.15 — Delegation

Delegation is bounded by depth/fan-out/cycle/capability and `child_scopes <@ parent_scopes`; authority amplification is impossible by contract.

## P7.16 — Independent verification

Verification/QA/security reviews are durable. High/critical work requires verifier identity different from executor. Accepted independent verification is required before the Agency task becomes verified.

## P7.17 — Integration arbitration

Parallel artifact candidates are version/hash compared. Divergent overlapping outputs become explicit conflicts; last-write-wins is false. Conflict-free integration still requires cross-module test evidence.

## P7.18 — Shift Manager

Worker heartbeat/state/workload/resources persist. Stalled/failed/blocked/resource-pressure incidents become durable with contain/reroute/handoff/escalate-owner/resolve actions and exact owner need when attention is required.

## P7.19 — Atomic control/containment

Pause/resume/stop/kill-run/kill-project/kill-Agency/force-reclaim are durable control events. Stop/kill increases run generation, stops unfinished tasks, releases task/resource claims and Project Auto locks, drains workers, and records that late worker resurrection is disallowed.

## P7.20 — Protected-action preflight

Preflight reuses Category 2 authorization rather than creating parallel authority. It validates working run, Project Agent generation/run, project lock, immutable fresh context, exact action/resource authorization, authorization freshness/live session/device revocation, provider health, credential-reference scopes and artifact hashes. Preflight explicitly does not consume the authorization or execute the protected side effect; the real side-effect boundary consumes exactly once. `20261024165900_category7_context_packet_owner_key.sql` provides the owner-scoped unique key required by the P7.20 context-packet foreign key before P7.20 is applied.

## P7.21 — Deterministic replay

Scheduler/policy/model/provider/time/random/retry/conflict/barrier/recovery choices are sequence- and hash-addressed. Fixture replay rejects sequence/hash mismatch and structurally executes zero protected side effects.

## P7.22 — Canary/shadow rollout

Shadow/canary observations compare stable/candidate success and verification-failure rates plus protected-boundary violations and duplicate side effects. Unsafe candidates require rollback; safe candidates only receive promotion recommendation. Agency rollout evaluation does not deploy or promote production.

## P7.23 — Crash/network/provider recovery

Recovery keys are idempotent. Orphan task recovery refuses already-committed tasks and live leases, requires preserved project lock/checkpoint/Project Agent queue, increments claim generation/fencing token, marks old worker dead, assigns eligible same-project replacement, records whether context must be rebuilt, and prevents duplicate effects. Lead failover preserves mission, queue, checkpoint and authority scopes and selects an eligible replacement without authority expansion.

## P7.24 — Agency adversarial / scale / chaos suite

`clean-room/tests/category7-agency-adversarial.test.mjs` covers split-brain scheduler, stale workers, resource conflict, context sensitivity/staleness, Books/portfolio rules, false Work escalation, autonomy/delegation amplification, self-verification, integration conflicts, stop/late responses, protected preflight, deterministic replay, canary rollback, expired-worker recovery, thousands of ready tasks, and structural crash/network/provider/idempotency protections.

Phase-specific tests also exist under `clean-room/tests/category7-*.test.mjs` for the durable phases above.

## Security and persistence boundary

New Category 7 durable tables are RLS-enabled and owner-readable to authenticated browser roles. Ordinary browser roles do not receive direct INSERT/UPDATE/DELETE table grants. Mutation occurs through narrow authenticated RPCs. Agency planning, conversation, canary, replay and preflight layers do not themselves perform protected external side effects. Category 2 remains the canonical authorization authority.

## Not claimed

- These migrations are not claimed applied to production Supabase.
- No production deployment/promotion was performed.
- No protected side effect, payment, send, publish, credential mutation, or Work launch was performed by Category 7 branch implementation.
- No physical Samsung acceptance is claimed.
- Category 15 frozen-candidate/live-production gates must not be weakened because Category 7 changed the branch runtime/schema.

## Mandatory close gate

Category 7 may advance to Category 8 only after a fresh exact-head run confirms the mandatory typecheck/core QA/PWA gates or a newer equivalent run does so. If a real exact-head failure appears, repair it rather than weakening the test/gate.
