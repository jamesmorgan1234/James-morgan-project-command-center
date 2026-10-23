# Command Center — THE AGENCY — Multi-Agent Execution Fabric

Status: **OWNER-DIRECTED ROADMAP ADDITION — RECONCILIATION REQUIRED BEFORE SPECIFICATION LOCK v2**

Owner naming: **The Agency**

## Absolute clean-room implementation rule

Recovered Agent requirements, historical files, old runner code, queue code, scheduler code, database tables, claims, leases, heartbeats, retries, circuit breakers, dead-letter handling, checkpoints, or other legacy implementation artifacts are **not trusted implementation and are not reusable implementation**.

They may prove that an idea, control, requirement, failure mode, or owner expectation existed. They do **not** prove the old implementation worked correctly, and they do not authorize carrying its implementation forward.

The prior Command Center build repeatedly failed and became increasingly fragile as new capabilities were layered onto architecture that was not designed for them. Therefore:

- recovered requirements may be reconciled into the new specification;
- recovered code may be inspected only as historical/reference evidence of behavior, failures, or missing requirements;
- **no legacy Command Center Agent/Agency implementation code is reused in the authoritative rebuild**;
- every Agency behavior is independently re-derived from the current roadmap and owner rules;
- every Agency subsystem is newly designed and newly implemented inside the authoritative rebuild architecture;
- old Agent runtime/database state is not imported as proof of execution or completion;
- verified owner/project/business/book data and approved/protected assets may be preserved from their authoritative sources, but the old software mechanisms that stored, displayed, scheduled, or acted on them are not reused;
- no old database table, RPC, workflow, runner, queue, scheduler, lease, heartbeat, lock, retry loop, or status field is accepted as correct merely because it exists;
- extensibility is a correctness requirement: adding/removing a project type, worker type, provider, model, device, business, specialist department, or future capability must not require unrelated core-system surgery;
- Category 15 must prove the final Agency end-to-end under concurrency, crash, stale-worker, resource-collision, provider-failure, authorization, scale, extensibility, replacement, and recovery tests.

**Recovered scope is evidence. Protected/verified data may be preserved. Legacy implementation is not recycled. New implementation requires proof.**

## Owner directive

Command Center must not be limited to one overloaded Agent. The rebuild must support a scalable Agency: many project-isolated and specialist agents coordinated by a central scheduler/control plane, with safe parallel work, durable handoffs, independent verification, strict authorization, and elastic capacity rather than a fixed worker count.

The number of workers is **not a product constant**. Logical Agency capacity must scale with project/work demand and available zero-cost/authorized execution resources. A configured limit may exist for safety/resource control, but architecture must not require redesign if the owner later wants tens, hundreds, or more logical workers.

## Existing recovered scope promoted into first-class architecture

Historical requirements already anticipated cooperating agents, planner/executor/reviewer/security/finance/books/commerce/social/personal/deployment/research/QA agents, hierarchy, delegation, peer review, disagreement resolution, sandboxes, resource/time/financial budgets, provider quotas, workload scheduling, performance scoring, and capability evolution.

Those concepts are now promoted into the Agency architecture where technically buildable. Existing recovered reliability concepts such as durable jobs, claims, leases, heartbeats, idempotency, retries, circuit breakers, dead-letter handling, crash recovery, evidence, checkpoints, project locks, and protected-action gates are treated as **requirements to redesign, rebuild, and prove from scratch**, not legacy machinery to trust or reuse.

## Agency operating model

**James Morgan → Command Center / Brain → Agency Control Plane → Project Agents / Specialist Departments → Execution Workers → Verifiers / Integrators → Evidence / Checkpoint → Scheduler**

Parallelism is allowed only when dependencies, permissions, resource claims, and write scopes prove the work can safely proceed concurrently.

Workers share authorized canonical knowledge. They do **not** share uncontrolled mutable context.

## 66 explicit Agency architecture controls

These are the Agency controls that must be explicit in the build. Some promote or refine recovered requirements; others are new owner-directed detail. Final canonical requirement IDs/count reconciliation occurs before Specification Lock v2 rather than guessing a new total now.

### A. Clean-room reconstruction and proof — 6

1. **Zero legacy implementation reuse.** Historical Agent code, runners, queues, workflows, tables, RPCs, UI controls, schedulers, state machines, schemas, and runtime patterns are reference-only evidence and are not reused as Agency implementation.
2. **Behavior-first re-derivation.** Every Agency feature starts from owner rules, current roadmap, security policy, project boundaries, required observable behavior, failure modes, and future extensibility before implementation details are chosen.
3. **Fresh implementation contracts.** Scheduler, worker, job, claim, lease, heartbeat, lock, context, evidence, verifier, integration, recovery, and extension contracts are specified independently of legacy schemas and code.
4. **Fault-injection proof requirement.** Agency completion requires controlled crashes, stale workers, duplicate delivery, conflicting writes, lost heartbeats, retries, provider failures, partial handoffs, scale, replacement, and recovery tests—not happy-path demos.
5. **Legacy runtime-state quarantine.** Old Agent runtime state may be inspected for historical evidence only; it is not migrated as trusted execution/completion state. Current project/business/book truth must come from independently verified authoritative sources.
6. **No feature accepted because a table/control exists.** A visible button, database row, scheduled workflow, heartbeat row, queue item, passing unit test, or old deployment never proves an execution path works end-to-end.

### B. Identity, roles, and control plane — 6

7. **Persistent logical Project Agent identity.** Every eligible project may have a stable logical Agency identity tied to project ID, rules, roadmap, protected assets, checkpoints, and queue. It is not required to be a permanently running process.
8. **Ephemeral execution-worker identity.** Compute workers may start, stop, and recycle independently of project identity while every claim/result remains attributable.
9. **Specialist Department Registry.** Research, coding, database, UI, security, QA, Books, finance, social, commerce, media, recovery, deployment, opportunity scouting, maintenance, and future specialist roles register capabilities instead of being hard-coded.
10. **Capability and worker-version registry.** Worker capabilities, tool access, model/provider compatibility, version, policy class, health, verification strategy, and required environment are machine-readable.
11. **Central scheduler/control-plane authority with failover.** One authoritative scheduling contract owns assignment and claims. If replicated scheduler processes exist, leader election/fencing prevents split-brain scheduling.
12. **Immutable job/run manifest.** Every dispatch freezes job ID, project ID, objective, plan version, policy/rule snapshot, permission envelope, allowed resources, context snapshot ID, worker version, acceptance tests, and idempotency identity.

### C. Scheduling, parallelism, and queue intelligence — 6

13. **Dependency-DAG and critical-path scheduling.** Scheduler understands prerequisites, fan-out, fan-in, blockers, and critical path rather than treating work as a flat queue.
14. **Safe fan-out / fan-in primitives.** One parent job can create bounded independent child jobs and wait for verified child evidence before synthesis/integration.
15. **Capability-aware work stealing.** Idle compatible workers may claim eligible unowned work without crossing project/resource/authorization boundaries.
16. **Priority, deadline, fairness, and aging.** Scheduling supports owner priority, urgency, deadlines, starvation prevention, and fairness while preserving protected work.
17. **Preemption and controlled requeue.** Safe preemptible work may pause/requeue for higher-priority work; non-preemptible/protected operations require reconciliation-safe boundaries.
18. **Queue partitioning, sharding, affinity, and anti-affinity.** Work can be partitioned by project/domain/provider/resource; scheduler can keep useful warm affinity or force separation where collision/security risk exists.

### D. Isolation, resource ownership, and concurrency correctness — 6

19. **Job-isolated workspace/sandbox.** Mutable files/runtime state are isolated per job or in a declared shared workspace with explicit ownership.
20. **Declared read/write set.** Jobs declare allowed file paths, database resources, provider resources, accounts, branches, assets, deployments, and other mutable targets before execution.
21. **Shared/exclusive resource claims.** Read-only shared claims and exclusive write claims prevent workers from mutating the same protected resource concurrently without coordination.
22. **Lease plus fencing-token protection.** Lease expiration alone is insufficient: stale workers must be unable to commit after a newer owner acquires the resource.
23. **Optimistic version/concurrency checks.** A worker verifies source version/hash/revision before commit; stale writes are rejected and reconciled.
24. **Integration/merge arbitration queue.** Parallel branches/artifacts converge through a controlled integrator rather than last-writer-wins behavior.

### E. Context, memory, and artifact fidelity — 6

25. **Immutable task context packet.** Each worker receives only the rules, project state, dependencies, files/data, protected assets, tools, constraints, and acceptance criteria needed for its job.
26. **Context freshness, TTL, and resume diff.** Before continuing old work, workers compare the prior snapshot with current canonical state and refresh affected context.
27. **Context compaction.** Long-running work externalizes completed history into durable summaries/evidence so workers resume without carrying giant conversational transcripts.
28. **Content-addressed artifact store.** Significant outputs persist independently with stable IDs/hashes rather than existing only inside messages.
29. **Artifact-first handoff.** Workers pass structured references, changed files, evidence, tests, decisions, blockers, and checksums instead of lossy chain-of-conversation relays.
30. **Canonical-knowledge write review.** Workers may propose knowledge/decision updates; canonical truth writes obey provenance/policy rules and cannot silently turn worker inference into fact.

### F. Verification, review, and integration quality — 6

31. **Independent verifier workers.** Material execution is checked by a worker/process independent of the executor where practical.
32. **Risk-tier verification quorum.** Higher-risk work may require multiple independent checks or specialized security/integration approval before checkpoint acceptance.
33. **Adversarial reviewer role.** Selected jobs receive a reviewer instructed to find omissions, unsafe assumptions, regressions, and false completion rather than merely confirm the worker.
34. **Dedicated integration workers.** Integrators combine compatible parallel outputs, resolve conflicts using source/evidence rules, and run cross-module tests.
35. **Machine-readable acceptance contract per job.** Success criteria, tests, evidence types, tolerances, and protected invariants are declared before execution where feasible.
36. **Self-report never outranks external evidence.** Worker claims remain provisional when repository/provider/database/device/test evidence can independently verify the result.

### G. Reliability, messaging, and recovery — 6

37. **Heartbeat and stale-worker reclaim.** Newly designed and newly implemented lease/heartbeat behavior applies across all Agency worker types and pools and is independently fault-tested.
38. **Bounded retry and multi-level circuit breaking.** Retry policy can operate by task, capability, provider, project, department, and Agency-wide failure domains.
39. **Dead-letter and poison-job quarantine.** Repeatedly failing/corrupt/malicious jobs are isolated so they cannot consume the whole Agency or create infinite retry loops.
40. **Transactional outbox/inbox for durable cross-worker events.** Important messages and state transitions survive crashes without duplicated or lost delivery.
41. **Saga/compensation and uncertain-outcome reconciliation.** Multi-step external side effects define compensation/reconciliation instead of blind rollback or duplicate replay where atomic transactions are impossible.
42. **Graceful drain, restart, and rolling worker replacement.** Workers can stop accepting new work, finish/reconcile safe in-flight work, checkpoint, restart/upgrade, and resume without losing queue state.

### H. Security, trust, and untrusted-input containment — 6

43. **Least-privilege job permissions.** Worker permissions are job-specific and expire/revoke when the job/lease ends.
44. **Ephemeral scoped credentials.** Where supported, workers receive short-lived references/tokens limited to exact provider/resource/action instead of broad persistent secrets.
45. **Tool/network egress policy.** Jobs can be restricted to approved tools, domains, providers, repositories, databases, or network access appropriate to scope.
46. **Data classification and context minimization.** Sensitive finance, personal, credential, customer, book, business, or account data is included only when needed and permitted.
47. **Untrusted-content / prompt-injection containment.** Web pages, emails, documents, tool output, provider data, and other untrusted text cannot redefine Agency rules, permissions, or objectives.
48. **Hierarchical emergency stop.** Owner can stop one job, worker, project lane, department/provider lane, or the entire Agency; stale responses cannot resurrect stopped work.

### I. Resource, quota, and $0/free-first governance — 6

49. **Concurrency quotas by project/provider/model/tool/resource.** Logical capacity is elastic, but simultaneous execution respects safe limits.
50. **Resource reservation/governor.** CPU, RAM, disk, network, browser sessions, database connections, local models, media rendering, and future GPU resources can be reserved/queued to prevent overload.
51. **Backpressure.** Queue intake/dispatch automatically slows when downstream failures, latency, resource pressure, quota, or provider health indicate overload.
52. **$0/free-first budget governor.** No worker may activate a paid path, trial, usage billing, advertisement, paid infrastructure, or spend merely to increase throughput.
53. **Quota/rate-limit-aware routing.** Scheduler uses provider health and remaining authorized capacity and distinguishes quota failure from capability/reasoning failure.
54. **Elastic capacity without fixed worker count.** The pool can scale up/down to available safe capacity; numbers such as 5 or 200 are examples/configuration, never architectural limits.

### J. Routing intelligence, evaluation, and controlled evolution — 6

55. **Capability-based dispatch.** Jobs route by required capabilities, environment, tools, risk class, data class, project type, and verification needs—not generic availability alone.
56. **Complexity/model/provider routing.** Reasoning/model choice follows policy, quality evidence, free-first restrictions, and approved escalation ladders rather than using the largest model everywhere.
57. **Verified worker-performance matrix.** Command Center tracks success, rework, defects, latency, reliability, and resource use by worker configuration/job class without treating raw speed as quality authority.
58. **Continuous Agency eval suite.** Routing, handoff, tool selection, context fidelity, policy adherence, parallelism, conflict handling, and verification are evaluated with fixed regression cases.
59. **Canary and shadow execution for Agency changes.** New worker versions/routing policies can run on safe test/shadow workloads before promotion; canaries roll back on regression.
60. **Selective speculative execution.** For difficult/high-value tasks, multiple isolated approaches may run intentionally and be compared by a verifier when the expected benefit justifies duplicated resource use.

### K. Owner interaction, observability, operations, and future expansion — 6

61. **Boundary Office.** Work barriers route to a dedicated service/department that classifies owner, Work, login/MFA/CAPTCHA/KYC, legal/payment, provider, device, security, or other real boundaries and prepares deterministic handoffs.
62. **Owner-attention unlock scoring.** Needs Me can prioritize actions by urgency/risk and how much verified work they unblock—for example one owner action may release many waiting jobs.
63. **Agency topology/control dashboard.** Owner can see project lanes, worker pools, active claims, queues, blocked work, verifiers, integrations, resource pressure, and truthful current state without exposing raw internal noise by default.
64. **End-to-end trace and replay debugger.** Authorized debugging can reconstruct scheduler decisions, handoffs, tool calls, evidence, worker versions, context snapshot identities, failure/retry history, and claim ownership.
65. **Future local/remote/federated worker seam.** Workers may later run locally, on free/authorized cloud resources, on additional owner devices, or through future execution providers without changing job/security contracts.
66. **Agency maintenance/scout operations.** Low-priority specialist agents can inspect stale projects, broken connections, expiring capabilities, security drift, maintenance needs, and new opportunities, producing governed tasks/proposals rather than silently changing scope.

## Project Agent model

A Project Agent is a **persistent logical identity**, not a forever-running chat/process. It owns the project's Agency queue and context boundary. Any compatible execution worker may service a job after acquiring a valid claim.

This allows dozens, hundreds, or future project identities to exist while only a safe number of workers execute simultaneously.

## Same-project parallelism

A single project may use multiple workers concurrently only if:

- roadmap/DAG work is independent or safely parallel;
- resource claims do not conflict;
- each worker has isolated mutable state;
- acceptance contracts are independent;
- shared integration occurs through controlled integration;
- protected actions retain owner/security gates.

## Specialist departments

Initial specialist role classes should include, without limiting future registration:

- Research / opportunity scouting
- Planning / architecture
- Coding / implementation
- Database / data
- UI / accessibility / visual QA
- Security / privacy / red team
- QA / verification
- Integration / merge
- Books / publishing preparation
- Finance / credit analysis
- Social / communications
- Commerce / suppliers / catalog
- Media / VeloClip
- Recovery / migration / backup
- Deployment / release
- Maintenance / health
- Boundary Office

A department may have zero, one, or many active workers depending on demand and available authorized capacity.

## Owner / Work boundary

The Agency does not weaken normal-chat-first / Work restrictions. A Boundary Office worker may prepare a complete Work handoff and track the blocked job, but it may not silently initiate Work where owner authorization is required. Clearing a barrier resumes the same durable job/project lineage where safe rather than fabricating a new project/run.

## No shared mutable-context rule

Workers may read authorized canonical state. They must not coordinate by sharing an uncontrolled mutable prompt/conversation buffer. Coordination occurs through durable jobs, events, artifacts, claims, evidence, checkpoints, and canonical state with version/concurrency control.

## Agency completion standard

The Agency is not production-complete merely because multiple workers can run. Category 15 must prove at minimum:

- multiple projects advancing concurrently;
- multiple independent jobs within one project advancing concurrently where safe;
- no cross-project context contamination;
- no conflicting writes escaping locks/fencing/version checks;
- stale worker unable to commit after lease loss;
- worker crash and replacement recovery;
- scheduler restart/re-election without duplicate ownership;
- duplicate dispatch/event delivery remains idempotent;
- provider outage/rate limit produces backpressure, not cascading failure;
- dead-letter quarantine works;
- pause/stop at job/project/department/Agency level works;
- Boundary Office handoff/resume preserves lineage;
- verifier/integrator can reject executor output;
- high-risk action cannot bypass owner/security authorization;
- resource governor prevents unsafe overload;
- $0/free-first blocks unapproved paid escalation;
- canary/shadow Agency upgrade rollback works;
- exact worker/context/artifact/evidence lineage is reconstructable;
- recovery from interruption resumes earliest unfinished/unverified work;
- adding a new project type, worker class, provider, model, or specialist capability through its registry/adapter contract does not require unrelated core rewrites;
- removal/replacement of one registered worker/provider/capability does not break unrelated Agency functions;
- owner sees truthful Agency state throughout.

## Roadmap reconciliation consequence

The previous **147-phase** roadmap is now superseded as a final phase-count target. Do not preserve 147 merely for convenience. Category 7 and cross-cutting Categories 1, 2, 3, 5, 6, 8, 13, 14, and 15 must be expanded/reconciled as needed to give the Agency proper clean-room implementation, extensibility, and test phases.

The corrected 5,825 canonical baseline also remains subject to owner-review reconciliation: existing requirements should be reclassified/promoted where they already cover Agency capability; genuinely new owner requirements receive new canonical IDs only after duplicate/lineage analysis.

**Quality, clean-room construction, extensibility, and architectural completeness control the final counts—not a historical number.**
