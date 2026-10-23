# Command Center — THE AGENCY — Leadership & Autonomous Operations

Status: **OWNER-DIRECTED ROADMAP ADDITION — RECONCILIATION REQUIRED BEFORE SPECIFICATION LOCK v2**

Purpose: turn The Agency from a worker pool into a governed autonomous organization that can plan, research, delegate, execute, review, integrate, maintain, and continuously advance authorized work with minimal owner interruption.

The Agency may operate autonomously only inside owner-authorized missions, project rules, project/account boundaries, $0/free-first constraints, security policy, and protected-action gates. Autonomy never means self-authorized spending, publishing, external communication, legal acceptance, destructive action, account changes, scope expansion, or other protected actions.

The Agency is clean-room architecture. No historical Command Center Agent implementation code is reused.

## Organizational model

**James Morgan — Final Owner / Authority**

↓

**Command Center / Brain — Intelligence, context, decisions, planning**

↓

**Agency Control Plane — Scheduler, policy, resources, claims, evidence**

↓

**Agency Leadership Layer — portfolio leads, project leads, department leads, mission leads**

↓

**Specialist Departments — research, architecture, implementation, data, UI, security, QA, integration, Books, finance, social, commerce, media, recovery, deployment, maintenance, scouts, future departments**

↓

**Execution Workers / Verifiers / Integrators / Support Workers**

The hierarchy is registry-driven and dynamic. Command Center must not hard-code one permanent org chart that later becomes another architectural trap.

## 48 explicit Leadership & Autonomous Operations controls

### A. Autonomous mission model — controls L1–L6

**L1. Mission contract.** Every autonomous effort has a durable mission containing objective, project/portfolio scope, allowed capabilities, priorities, constraints, protected boundaries, completion definition, evidence requirements, and stop conditions.

**L2. Bounded autonomy.** Agency may independently plan, sequence, research, delegate, verify, and continue eligible work inside the mission contract but may not expand the mission’s authority envelope on its own.

**L3. Mission decomposition.** Leadership agents may convert a mission into programs, projects, workstreams, phases, jobs, and specialist requests using the canonical dependency/roadmap system.

**L4. Mission continuity.** Autonomous work survives worker/session replacement through durable plans, checkpoints, job state, evidence, and context snapshots rather than one long model conversation.

**L5. Mission stop conditions.** Missions explicitly stop or enter Needs Me at completion, owner-only decision, Work-only boundary, payment/legal/login/device boundary, unrecoverable ambiguity, safety/security condition, or unavailable required capability.

**L6. Mission reauthorization.** If new work materially exceeds the original mission scope, authority, risk, cost, or protected boundaries, leadership must surface the scope change rather than silently treating it as already authorized.

### B. Dynamic leadership structure — controls L7–L12

**L7. Portfolio Lead role.** A portfolio-level lead can coordinate multiple authorized projects, priorities, cross-project dependencies, shared resources, and critical paths without directly owning project mutable state.

**L8. Project Lead role.** Each active project may have a logical Project Lead that understands the project roadmap, current state, blockers, protected assets, dependencies, Agency queue, and completion definition.

**L9. Department Lead role.** Registered departments may have logical leads responsible for quality, capability selection, workload distribution, escalation, and domain-specific review.

**L10. Mission Lead role.** Temporary cross-department missions can appoint a lead responsible for coordinating a specific outcome without permanently changing project ownership.

**L11. Lead failover.** Leadership identities are logical and durable; if a specific model/process fails, another compatible worker can resume the lead role from canonical state.

**L12. Lead authority cannot exceed policy.** Lead status never grants implicit permission to spend, communicate externally, publish, alter protected assets, change accounts, or bypass owner/security rules.

### C. Research organization — controls L13–L18

**L13. Research Lead.** A Research Lead can decompose a research question into independent source, market, technical, provider, security, legal/compliance, product, and competitor investigations where relevant.

**L14. Research swarm.** Multiple research workers may investigate in parallel with source provenance, freshness, conflict detection, and deduplication.

**L15. Evidence synthesis.** Research Lead produces a structured synthesis identifying verified facts, conflicting evidence, assumptions, unknowns, implications, and recommended next actions.

**L16. Research quality review.** High-impact research may receive independent verification before it becomes a project design assumption or owner recommendation.

**L17. Research freshness policy.** Time-sensitive research expires or requires refresh based on domain-specific freshness rather than remaining permanently trusted.

**L18. Research-to-execution boundary.** Research findings can create proposals, requirements, or work items, but they do not automatically authorize protected real-world actions.

### D. Architecture, planning, and program leadership — controls L19–L24

**L19. Architecture Lead.** Major projects/missions may appoint an Architecture Lead responsible for system boundaries, ownership, extensibility, provider seams, security, recovery, and future-scale consistency.

**L20. Planning Lead.** A Planning Lead converts approved scope into roadmap/DAG, identifies critical path, parallel work, resources, specialist requirements, risks, and owner gates.

**L21. Cross-plan consistency check.** Leads verify that subsystem plans do not create competing routers, renderers, state stores, Agent stacks, visual systems, schemas, or other duplicate architectural owners.

**L22. Plan challenge review.** Important plans may be challenged by an independent reviewer before broad execution to find missing dependencies, unsafe assumptions, or unnecessary complexity.

**L23. Replanning on evidence.** Leadership may adjust sequencing and implementation strategy when verified evidence changes, while preserving scope lineage and owner decisions.

**L24. No silent architectural drift.** Material architecture changes discovered during execution must update the canonical design/roadmap and relevant verification scope rather than remaining hidden in worker code.

### E. Build and implementation organization — controls L25–L30

**L25. Build Lead.** A Build Lead coordinates implementation workers, shared resources, integration timing, and project-specific coding/build standards.

**L26. Specialist team formation.** Scheduler/leadership can dynamically assemble a temporary team from registered specialties based on the work rather than forcing every project through one generalist worker.

**L27. Team-local work plan.** A temporary team may maintain its own subordinate task DAG, but it remains linked to the parent project/mission and cannot create an independent truth store.

**L28. Safe parallel implementation.** Build Lead may fan out independent work only after resource/dependency/write-scope analysis proves concurrency safe.

**L29. Incremental integration.** Parallel implementation outputs are integrated and regression-tested continuously enough to prevent long-lived incompatible branches.

**L30. Build completion requires verification.** Build Lead cannot mark a workstream complete solely from worker self-report; required tests/evidence/verifier acceptance remain mandatory.

### F. QA, security, integration, and release leadership — controls L31–L36

**L31. QA Lead.** QA Lead owns project test strategy, acceptance coverage, regression matrices, negative testing, edge cases, and evidence closure without owning implementation.

**L32. Security Lead.** Security Lead owns threat modeling, permission review, secret/data boundaries, protected-action checks, adversarial testing, incident concerns, and release security gates.

**L33. Integration Lead.** Integration Lead owns convergence of parallel outputs, shared-resource conflict resolution, contract compatibility, cross-module tests, and integration evidence.

**L34. Release Lead.** Release Lead prepares exact release candidate, migrations, rollback, provenance, environment promotion, and post-release verification but cannot self-authorize protected production deployment where owner authorization is required.

**L35. Independent separation of duties.** For high-risk work, implementation, verification, security review, and release approval roles must be sufficiently independent to avoid one worker approving its own high-impact changes.

**L36. Release rejection authority.** QA/Security/Integration/Release leads can block promotion when mandatory evidence fails; schedule pressure or worker count cannot override failed gates.

### G. Autonomous operations and self-management — controls L37–L42

**L37. Agency shift manager.** A logical operations lead can continuously evaluate queues, stalled work, resource pressure, provider health, worker health, and critical-path opportunities and rebalance eligible work.

**L38. Idle-capacity utilization.** When high-priority work is blocked, idle workers may take eligible maintenance, research, documentation, testing, cleanup, or scout work without expanding owner scope.

**L39. Automated blocker triage.** Leadership classifies blockers into recoverable technical issue, provider issue, resource contention, missing evidence, owner input, Work boundary, security issue, payment/legal/account boundary, or genuinely unrecoverable state.

**L40. Autonomous recovery attempts.** Agency may retry/replan/reassign/recover eligible technical work within bounded retry and safety policies before involving James.

**L41. Internal incident command.** Significant Agency failures may appoint a temporary incident lead coordinating containment, evidence preservation, recovery, root-cause analysis, and safe return to service.

**L42. No hidden endless autonomy.** Missions, retries, scouts, and maintenance loops have explicit cadence, expiry, resource limits, and stop/quiet rules so the Agency cannot spin forever without useful progress.

### H. Scouts, opportunity discovery, and organizational learning — controls L43–L48

**L43. Opportunity Scout department.** Scouts may search for owner-relevant project, business, automation, provider, workflow, security, cost-saving, product, content, or operational opportunities using governed research.

**L44. Scout proposals, not silent projects.** Agency-discovered opportunities remain proposals until James authorizes creation/building unless a standing owner rule explicitly authorizes that class of project creation.

**L45. Maintenance Scout department.** Scouts may identify stale dependencies, broken connections, provider changes, expiring credentials, security drift, missing backups, roadmap gaps, and other maintenance risks.

**L46. Organizational lessons registry.** Verified lessons from failures, incidents, reviews, successful patterns, provider behavior, project outcomes, and owner feedback are stored with provenance for future planning/routing.

**L47. Capability-gap detection.** Leads may identify missing worker skills/tools/providers and propose new capabilities or departments; capability gaps do not permit unauthorized paid procurement or silent architecture expansion.

**L48. Agency evolution under owner control.** The Agency may continuously recommend improvements to its own structure, routing, departments, tooling, and workflows, but material changes enter the same specification/change/verification process as any other system capability.

## Example autonomous organization for one major project

A complex software project could dynamically form:

- Project Lead
- Research Lead + several researchers
- Architecture Lead
- Planning Lead
- UI/UX lead + design workers
- Backend/Data lead + workers
- Frontend lead + workers
- Security Lead
- QA Lead + verifier workers
- Integration Lead
- Release Lead
- Boundary Office liaison

A book project might form an entirely different team. A commerce project might create supplier/research/pricing/content/QA/social specialists. The Agency organization must adapt to the mission instead of forcing every project into the same staff chart.

## Autonomous owner experience

James should be able to say things such as:

- “Take this project to completion until you genuinely need me.”
- “Put the Agency on these five projects.”
- “Research this idea from every angle, make the ultimate spec, and then execute it.”
- “Keep everything moving that can move without me.”
- “Prioritize anything that unlocks the most other work.”
- “Have Security and QA independently review this before release.”

The Agency then organizes the appropriate leadership and specialist structure automatically inside the authorized scope.

## Architecture inventory update

Previous combined Agency + Foundry + Conversational + Gap-Audit inventory: **252 controls**.

Leadership & Autonomous Operations: **48 controls**.

**Current combined architecture-review inventory: 300 explicit controls.**

This 300-control figure is an architecture-review inventory, not the final canonical requirement count or final phase count.

## Roadmap consequence

The final roadmap must include explicit implementation and verification phases for Agency leadership, mission contracts, department/lead registries, autonomous portfolio/project operations, research swarms, independent QA/security/integration leadership, incident command, scouts, and organizational learning. These must not be collapsed into a generic “multi-agent” checkbox.
