# Command Center — THE AGENCY — Exhaustive Hardening and Expansion Controls

Status: **OWNER-REVIEW ROADMAP ADDITION — RECONCILIATION REQUIRED BEFORE SPECIFICATION LOCK v2**

This file extends the 66 controls in `03_AGENCY_MULTI_AGENT_EXECUTION_FABRIC.md` with **54 additional controls**, bringing the current explicit Agency architecture inventory to **120 controls**.

These 120 controls are **not automatically 120 new canonical requirements**. Many refine or promote recovered requirements. Final canonical IDs/counts are assigned only after duplicate/lineage reconciliation.

The clean-room rule is absolute: these controls describe what the new Agency must do. They do not authorize reuse of legacy Command Center implementation code.

## L. Delegation, hierarchy, and bounded autonomy — controls 67–72

67. **Delegated authority cannot amplify.** A child job/worker may receive an equal or narrower permission/cost/resource/action envelope than its parent, never broader authority simply because work was delegated.
68. **Bounded delegation depth and breadth.** Scheduler enforces configurable limits on delegation depth, child count, fan-out width, and recursive task expansion so a worker cannot create an uncontrolled job explosion.
69. **Parent/child causal lineage.** Every delegated job records parent, root objective, creator, reason, plan version, inherited constraints, and result relationship so the full work tree is reconstructable.
70. **Cancellation and stop propagation policy.** Parent stop/cancel/pause behavior explicitly defines which children stop, finish safely, compensate, or remain independent.
71. **Child-failure / parent-close policy.** Parent jobs explicitly define whether child failure blocks, degrades, retries, substitutes, or is tolerated, and what happens to children when a parent completes/fails/stops.
72. **Delegation acceptance and return contract.** A delegated job is not considered transferred until the scheduler records an accepted claim; returned results must satisfy the parent’s typed evidence/acceptance contract.

## M. Liveness, contention, and coordination safety — controls 73–78

73. **Canonical resource-ordering / lock graph.** Multi-resource work follows declared ordering or transaction rules to reduce deadlock risk.
74. **Deadlock detection and recovery.** Scheduler detects claim/resource wait cycles and resolves them through deterministic victim selection, rollback/requeue, or owner escalation without corrupting work.
75. **Livelock and thrash detection.** Repeated claim/release/replan/retry cycles with no verified forward progress are detected and quarantined.
76. **Priority-inversion handling.** A low-priority job holding a resource needed by high-priority verified work cannot block it indefinitely; safe priority inheritance/controlled completion/preemption rules apply.
77. **Orphan reaper.** Jobs, claims, temporary workspaces, child jobs, partial integrations, and resource reservations whose owning worker/run disappeared are detected and reconciled safely.
78. **Stuck-progress watchdog.** Jobs with heartbeats but no legitimate progress/evidence beyond policy thresholds are diagnosed separately from healthy long-running work.

## N. Typed contracts, compatibility, and replay semantics — controls 79–84

79. **Typed job input/output schemas.** Every capability defines machine-readable input, output, error, evidence, and side-effect schemas rather than relying on free-form worker interpretation alone.
80. **Result validation and quarantine.** Invalid, incomplete, incompatible, unexpectedly large, malformed, or security-unsafe worker outputs are quarantined before canonical state or integration.
81. **Capability/protocol version negotiation.** Scheduler and workers negotiate supported job/capability/tool protocol versions and reject incompatible dispatch instead of guessing compatibility.
82. **Job/workflow schema evolution.** Durable jobs survive software upgrades through explicit versioned migration/compatibility paths; old jobs are never silently reinterpreted with changed meaning.
83. **Deterministic orchestration/replay primitives.** Recovery-sensitive decisions record time, randomness, selected provider/model, plan version, and external-decision results so replay does not accidentally choose a different path.
84. **Explicit delivery semantics.** Agency assumes tasks/messages may be delivered more than once and designs idempotency/reconciliation accordingly; it never claims magical exactly-once external side effects when underlying systems cannot guarantee them.

## O. Dry-run, simulation, chaos, and scale proof — controls 85–90

85. **Dry-run / no-side-effect execution mode.** Eligible workflows can exercise planning, routing, policy, resource acquisition, and validation without committing real external writes.
86. **Synthetic provider/test adapters.** Important provider classes support controlled success, latency, rate-limit, malformed-response, ambiguous-outcome, and failure simulation without touching real accounts.
87. **Deterministic test clock and randomness.** Tests can advance time, expiry, leases, deadlines, retries, schedules, and randomized choices deterministically.
88. **Workload record/replay harness.** Sanitized job/event traces can be replayed against new Agency versions to detect changed routing, state transitions, regressions, and concurrency behavior without replaying protected real-world side effects.
89. **Agency chaos/fault matrix.** Test combinations include worker death, scheduler death, DB disconnect, network partition, duplicate messages, delayed events, stale caches, provider outage, credential expiry, lock loss, partial deployment, and recovery.
90. **Load/soak benchmark suite.** Measure sustained and burst workloads across many projects/jobs/workers, long queues, large artifacts, repeated recovery, and mixed specialist work with explicit saturation/failure thresholds.

## P. Workspace, artifact, evidence, and data lifecycle — controls 91–96

91. **Workspace lifecycle and safe cleanup.** Temporary job workspaces have ownership, TTL, cleanup, and quarantine rules; automated cleanup never deletes checkpoints, canonical sources, protected assets, final outputs, accepted evidence, provenance, or backups.
92. **Artifact retention / pinning / garbage collection.** Artifacts define retention class, project ownership, references, pinning, legal/protected state, and safe GC eligibility.
93. **Evidence immutability after acceptance.** Accepted evidence/checkpoint records are append-only or versioned; later corrections create new lineage rather than rewriting history silently.
94. **Artifact virus/malware/content safety boundary.** Files from workers/providers/untrusted sources are validated/scanned where applicable before wider reuse or execution.
95. **Large-artifact streaming/chunking.** Agency handles large media, archives, datasets, and model outputs without requiring giant in-memory shared context or fragile single-message transfer.
96. **Workspace-to-canonical promotion gate.** Temporary outputs become canonical project artifacts only after validation, verification, ownership checks, and required approvals.

## Q. Policy, configuration, and Agency change management — controls 97–102

97. **Policy snapshot/version per job.** Every job records the exact owner/security/cost/project policy version used so later policy changes do not create ambiguous historical decisions.
98. **Configuration-as-versioned-data.** Worker pools, limits, routing policies, departments, capability mappings, and resource rules are versioned, validated, reviewable, and rollback-capable.
99. **Feature-flag and rollout discipline.** New Agency capabilities can be disabled, canaried, rolled back, and scoped without branching the core into permanent alternate architectures.
100. **Backward-compatibility window.** During upgrades, old and new workers/contracts may coexist only through explicit compatibility rules; incompatible workers are drained rather than allowed to corrupt jobs.
101. **No silent policy drift.** Provider/model/tool/routing/security changes that materially affect behavior are surfaced, audited, and tested before promotion.
102. **Agency self-change is proposal-gated.** The Agency may identify and prepare improvements to its own architecture/routing, but it cannot silently expand its authority, policies, paid resources, or owner rules.

## R. Cross-project, portfolio, and dependency orchestration — controls 103–108

103. **Cross-project dependency graph.** Projects may declare real dependencies on shared assets, APIs, domains, libraries, deployments, legal decisions, or upstream projects without merging their mutable context.
104. **Shared-resource ownership registry.** Common repositories, domains, infrastructure, provider accounts, data stores, or brand assets have explicit owners and consumers so one project cannot casually mutate another project’s foundation.
105. **Portfolio critical-path optimization.** Scheduler can prefer work that unlocks many downstream projects while respecting owner priority and risk.
106. **Portfolio change-impact analysis.** Before modifying a shared component/resource, Agency identifies dependent projects/jobs and required regression scope.
107. **Coordinated shared-resource release windows.** Changes to high-impact shared resources can be staged/integrated through explicit maintenance/release coordination rather than opportunistic worker writes.
108. **Project cloning/templates without state leakage.** New projects may inherit approved architecture/templates/rules as templates, but never credentials, private data, approvals, or mutable state from the source project unless explicitly authorized.

## S. Learning, knowledge quality, and decision support — controls 109–114

109. **Lessons-learned capture.** Verified incidents, failures, successful patterns, provider behavior, and recovery outcomes can update durable guidance with provenance.
110. **Routing learning requires evidence.** Performance history may improve routing only through verified outcomes and cannot override owner policy or security constraints.
111. **Confidence/calibration tracking.** Planner/research/reviewer outputs may record confidence and later compare it with verified outcomes to detect overconfidence or weak domains.
112. **Disagreement handling.** When planners/reviewers/verifiers materially disagree, Agency records alternatives, evidence, and decision policy rather than averaging conflicting answers into nonsense.
113. **Known-bad-pattern registry.** Repeated architecture, tool, provider, or execution failure modes can be blocked or warned against across future jobs.
114. **Human feedback becomes governed evidence.** Owner corrections and acceptance/rejection feed future planning/routing with explicit scope and provenance rather than globally mutating behavior without control.

## T. Future expansion, portability, and operational resilience — controls 115–120

115. **Worker runtime portability contract.** Agency workers can move among supported local, container, remote, or future execution environments through defined runtime contracts rather than environment-specific core logic.
116. **Provider/model/tool hot replacement.** Removing or replacing one provider/model/tool does not require rewriting unrelated scheduler/project/verification logic.
117. **Agency state export/import.** Authorized export can capture project-agent identities, queues, manifests, policy versions, capability registry, evidence references, and configuration for disaster recovery or future migration without exporting secrets improperly.
118. **Degraded/no-AI Agency mode.** Deterministic scheduling, queues, checkpoints, resource governance, and eligible automation remain usable when AI providers are unavailable.
119. **Multi-region/multi-device future seam.** Agency contracts support future replicated execution/control-plane deployment with explicit consistency/fencing rules without requiring it now.
120. **Extensibility acceptance test.** Before final completion, demonstrate adding and removing representative new worker types, specialist departments, project types, providers, and capabilities through supported registries/adapters without unrelated core-system rewrites.

## Current Agency architecture count

- Core Agency execution fabric: **66 controls**.
- Exhaustive hardening/expansion: **54 controls**.
- Current explicit Agency architecture inventory: **120 controls**.

This number is an architecture-review count, not the canonical requirement total and not the final roadmap phase count.

## Required roadmap effect

Agency reconciliation must expand the old Category 7 and cross-cutting Categories 1, 2, 3, 5, 6, 8, 13, 14, and 15 wherever these controls need independent implementation or proof. Do not compress critical failure/concurrency/security behaviors into one giant phase simply to keep the phase count small.
