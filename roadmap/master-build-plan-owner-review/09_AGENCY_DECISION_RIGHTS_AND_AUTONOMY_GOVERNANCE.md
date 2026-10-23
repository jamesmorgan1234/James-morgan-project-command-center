# Command Center — THE AGENCY — Decision Rights & Autonomy Governance

Status: **OWNER-DIRECTED ROADMAP ADDITION — RECONCILIATION REQUIRED BEFORE SPECIFICATION LOCK v2**

Purpose: define exactly what The Agency may decide, propose, execute, escalate, or never self-authorize so autonomous operation is both useful and safe.

A capable autonomous Agency must not ask James about every trivial implementation choice, but it also must not treat broad instructions as unlimited authority. Decision rights are therefore a first-class system rather than scattered prompt wording.

The Agency is clean-room architecture. No historical Command Center Agent implementation code is reused.

## 42 explicit decision-rights and autonomy controls

### A. Autonomy levels — controls D1–D6

**D1. Configurable autonomy level by scope.** Projects, departments, capabilities, and mission types can use explicit autonomy levels rather than one global on/off switch.

**D2. OBSERVE mode.** Agency may read/analyze/report but may not create execution jobs or modify project state beyond permitted evidence/notes.

**D3. PROPOSE mode.** Agency may research, plan, draft, and propose roadmap/actions but waits for owner authorization before execution.

**D4. PREPARE mode.** Agency may complete all reversible/internal preparation and stop immediately before protected/external side effects.

**D5. EXECUTE mode.** Agency may carry out authorized project work through normal eligible boundaries, including delegation and verification, while protected actions retain their own gates.

**D6. CONTINUOUS mode.** Agency may keep an authorized mission/project/portfolio moving across checkpoints and time until completion, explicit stop, or genuine boundary; this does not grant new scope or protected permissions.

### B. Decision-rights matrix — controls D7–D12

**D7. Decision class registry.** Decisions are categorized by domain, reversibility, impact radius, externality, security/privacy class, financial consequence, reputational consequence, and owner sensitivity.

**D8. Allowed-self-decision class.** Low-risk reversible implementation choices inside locked scope may be decided by qualified leads/workers without owner interruption.

**D9. Approved-default class.** Agency may choose among previously owner-approved defaults/policies and record which default was applied.

**D10. Recommend-only class.** Material product, branding, business, scope, policy, or architectural choices may require an owner decision even when Agency can fully analyze/recommend them.

**D11. Protected-action class.** Spend, purchases, money movement, paid services, publishing, external communications, legal acceptance, destructive actions, account/credential/security changes, protected-asset changes, and other owner-protected actions cannot be self-authorized.

**D12. Prohibited class.** Agency may be permanently prohibited from specified actions/capabilities regardless of mission wording until James explicitly changes the governing rule.

### C. Owner preference and precedent engine — controls D13–D18

**D13. Owner preference registry.** Durable preferences such as quality over speed, $0/free-first, no Band-Aids, normal-chat-first, protected assets, design standards, and project-specific rules are available to decision policy.

**D14. Preference scope.** Every preference/rule declares whether it is global, company, project type, project, asset, account, capability, or one-time decision so precedent is not overgeneralized.

**D15. Newest-owner-instruction precedence.** Conflicting historical preferences never override a newer explicit James instruction in its applicable scope.

**D16. Precedent similarity threshold.** Agency may reuse a prior owner decision as a default only when the current case is sufficiently equivalent; materially different cases are not treated as pre-authorized.

**D17. Preference uncertainty handling.** When owner preference is unclear and the decision is materially consequential, Agency presents the smallest necessary decision rather than inventing a preference.

**D18. Owner correction propagation.** When James corrects a repeated Agency decision pattern, future equivalent decisions update through the preference/policy system with provenance and scope.

### D. Escalation and attention policy — controls D19–D24

**D19. Escalation threshold by impact.** Agency escalates decisions when risk/impact/irreversibility exceeds the mission’s decision envelope even if technically executable.

**D20. Escalation compression.** Multiple related decisions are bundled into one clear owner interaction where safe rather than generating worker-by-worker questions.

**D21. Options with recommendation.** When owner choice is needed, Agency provides relevant options, evidence, consequences, and a recommended default instead of handing James raw uncertainty.

**D22. Deadline-aware escalation.** Time-sensitive owner decisions surface with the actual deadline and what will happen if no action occurs; urgency is not fabricated.

**D23. Safe-default continuation.** If an owner decision is not required for other independent work, Agency keeps unaffected work moving instead of blocking the whole project.

**D24. No repeated resolved-question loop.** Once an owner decision is canonical and still applicable, workers/leads must not repeatedly ask James the same question.

### E. Objective alignment and anti-drift — controls D25–D30

**D25. Objective hierarchy.** Agency work traces from owner goals → mission → project outcome → roadmap requirement → work unit so local optimization cannot silently replace the actual objective.

**D26. Success metric hierarchy.** Speed, worker utilization, token/tool usage, or number of completed tasks are never allowed to outrank quality, correctness, owner goals, safety, or real-world outcome.

**D27. Anti-goal-hacking checks.** Workers/leads may not satisfy metrics by shrinking scope, redefining completion, skipping evidence, creating fake progress, or choosing easier substitute work.

**D28. Scope-drift detector.** Agency detects when accumulated small changes materially alter product purpose, user, architecture, business model, cost, or protected boundaries and routes the change through Foundry/owner review.

**D29. Local-vs-global optimization check.** A project/department optimization that harms another project, shared resource, security posture, budget rule, or portfolio objective is not accepted solely because the local team benefits.

**D30. Stop/kill criteria.** Missions/projects can define conditions under which Agency should recommend pause, redesign, archive, or termination rather than continuing to consume resources on a failing premise.

### F. Resource and portfolio governance — controls D31–D36

**D31. Portfolio allocation policy.** Agency can allocate worker capacity across authorized projects based on owner priority, critical path, deadlines, risk, opportunity, blocked-state, and available resources.

**D32. Capacity reserve.** Scheduler may reserve capacity for urgent incidents, security, verification, owner-priority work, or recovery instead of saturating every worker with low-priority tasks.

**D33. Project concurrency ceiling.** Each project can define safe maximum concurrent workstreams based on architecture/resource collision rather than assuming more workers always means faster completion.

**D34. Department quality ceiling.** A specialist department may throttle intake when verifier/reviewer capacity, provider limits, or defect rates indicate more work would reduce quality.

**D35. No unauthorized cost optimization.** Agency may optimize within free/authorized resources but cannot trade money for speed or quality without owner authorization.

**D36. Abandon/suspend resource release.** Paused/stopped/archived missions release claims, reservations, temporary workspaces, and eligible worker capacity without losing durable evidence/checkpoints.

### G. Temporary authority, emergency controls, and audit — controls D37–D42

**D37. Time-bounded delegated authority.** James may explicitly grant a narrower temporary exception for one project/action window; it expires automatically and cannot become a permanent precedent unless stated.

**D38. No authority inheritance across projects.** Permission granted to one project, business, account, or mission never automatically applies to another.

**D39. Emergency containment authority.** Security/reliability leads may take predefined reversible containment actions—such as pausing jobs or isolating a provider—when necessary to prevent active harm, while surfacing the incident to James.

**D40. Emergency authority is not recovery authority.** Containment does not automatically authorize destructive repair, payment, credential replacement, public communication, or production changes beyond the predefined emergency envelope.

**D41. Decision audit trail.** Material autonomous decisions record the decision class, policy version, evidence, lead/worker, options considered where relevant, and resulting action/effect.

**D42. Autonomy governance test suite.** Final QA must prove ordinary low-risk decisions proceed without unnecessary interruption while protected/high-impact decisions correctly escalate, with no permission amplification through delegation or conversational ambiguity.

## Intended behavior

The ideal Agency is neither:

- a timid system that asks James how to name every variable; nor
- an uncontrolled system that interprets “finish it” as permission to spend, publish, communicate, or change accounts.

It should make thousands of routine, reversible, evidence-grounded choices on its own while recognizing the comparatively small set of decisions that genuinely belong to James.

## Architecture inventory update

Previous combined architecture-review inventory: **300 controls**.

Decision Rights & Autonomy Governance: **42 controls**.

**Current combined architecture-review inventory: 342 explicit controls.**

This is not the final canonical requirement count or final phase count.
