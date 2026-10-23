# Command Center — Agency / Project Foundry Reconciliation — Pass 1

Status: **IN PROGRESS — NO FINAL CANONICAL COUNT ASSIGNED**

Purpose: reconcile the 390-control Agency/Foundry architecture-review inventory against the last verified 5,825 canonical requirement baseline and recovered Future/Optional scope without inflating the canonical count for ideas that already existed.

This is a lineage/classification pass, not Specification Lock v2.

## Controlling corrections

- Last verified reconciled canonical baseline before current Agency/Foundry additions: **5,825**.
- Historical continuation text that later said **5,827** is stale on this point.
- Biometric and reliable-update work are existing-scope clarifications, not two new count-bearing canonical IDs.
- `Command_Center_Canonical_Owner_Additions_REV2.json` is the controlling correction for that issue.
- The pre-Agency 147-phase plan is retained only as a baseline and is not the final roadmap.
- No legacy Command Center implementation code is reused.

## Reconciliation classes

### CLASS A — Explicitly recovered scope

These concepts are directly present in recovered requirement/roadmap evidence and therefore should normally retain/attach to existing canonical lineage rather than receive new IDs merely because The Agency now describes them more completely.

Examples include:

- multiple cooperating agents;
- Planner Agent;
- Executor Agent;
- Reviewer Agent;
- Security Agent;
- Finance Agent;
- Books Agent;
- Commerce Agent;
- Social Agent;
- Personal Assistant Agent;
- Deployment Agent;
- Research Agent;
- QA Agent;
- agent hierarchy;
- agent delegation;
- agent peer review;
- agent disagreement resolution;
- agent sandboxing;
- agent resource budgets;
- agent time budgets;
- agent financial budgets;
- agent provider quotas;
- agent workload scheduling;
- agent performance scoring;
- agent capability evolution;
- Brain durable memory;
- Brain brainstorm workspace;
- Brain Context Builder;
- Brain Planner;
- conversational Brain;
- Agent handoff;
- project discovery/proposals;
- project-creation proposals;
- roadmap proposals;
- workflow proposals;
- integration proposals;
- owner-input capture;
- rule updates;
- decision capture;
- natural text conversation;
- voice as a first-class Brain interface;
- immediate owner-triggered Agent dispatch;
- Project Auto;
- Agent Auto;
- Next Step / Until Work / To Work Barriers;
- pause / resume / stop;
- protected-action boundaries;
- capability/executor registries;
- project type registration;
- project recovery/scale;
- expansion SDK/contracts;
- provider replaceability;
- many-project scale;
- provider loss/retirement/paid-state handling;
- no-AI/self-hosted future operation;
- build-dormant-not-absent;
- CONFIGURE → CONNECT → AUTHORIZE → ENABLE lifecycle;
- one owner / one contract / one source of truth / one extension path / one verification path principle.

### CLASS B — Recovered scope that is now strengthened / operationalized

These areas clearly existed historically but the new Agency/Foundry adds production-grade detail that must be mapped into the existing canonical requirements and may require splitting/strengthening their acceptance evidence rather than automatically creating a new feature requirement.

Examples include:

- durable worker claims → lease + fencing-token correctness;
- heartbeat/stale-worker concepts → explicit stale-commit prevention;
- retry concepts → multi-level circuit breaking and poison-job quarantine;
- Agent sandbox → job-isolated mutable workspaces;
- Agent resource budgets → explicit CPU/RAM/disk/network/browser/DB/GPU governors;
- provider quotas → backpressure and quota-aware routing;
- workload scheduling → dependency-DAG, critical-path, fan-out/fan-in, affinity/anti-affinity, work stealing, fairness/aging;
- peer review/reviewer Agent → independent verifier workers, adversarial review, risk-tier verification quorum;
- disagreement resolution → explicit lead/reviewer disagreement evidence and decision policy;
- project checkpoints → immutable job/run manifests, context snapshots, resume diffs, artifact-first handoffs;
- provenance/evidence → content-addressed artifacts, evidence immutability, machine-readable acceptance contracts;
- protected actions → least-privilege job permissions, scoped credentials, hierarchical emergency stop, decision-rights matrix;
- Agent Auto / portfolio orchestration → elastic logical Project Agents, portfolio lead/critical-path allocation, safe same-project parallelism;
- Brain conversation + Agent handoff → exact conversation-to-execution snapshot and immediate Agency dispatch;
- Needs Me / Work barriers → centralized Boundary Office and owner-attention unlock scoring;
- recommendations/improvements → opportunity scouts, maintenance scouts, organizational lessons;
- expansion SDK → extensibility acceptance tests for add/remove worker/project/provider/domain capabilities;
- recovery/migration → deterministic replay, orphan reaping, graceful drain/restart, rolling worker replacement;
- many-project scale → high-volume idea intake, portfolio incubation, project concurrency ceilings;
- project types/specialists → domain playbooks and composable project-type completeness matrices;
- lifecycle/failure testing → explicit chaos/fault matrix and load/soak benchmarking.

### CLASS C — Candidate genuinely new owner-directed scope requiring exact CCR matching

These items appear materially more explicit than the recovered descriptions seen so far. They must be searched against the exact canonical register before receiving new IDs. **Do not call them new canonical requirements yet.**

Candidate areas:

1. Persistent logical **Project Agent identity** distinct from transient execution workers.
2. Elastic worker-pool architecture with no fixed worker-count ceiling as a first-class product contract.
3. Central Agency control plane with scheduler failover/leader fencing semantics.
4. Declared per-job read/write resource set plus shared/exclusive claims across files, DB, providers, accounts, branches, assets, and deployments.
5. Explicit **fencing token** requirement preventing stale workers from committing after lease loss.
6. Dedicated controlled **integration/merge arbitration queue** and Integration Lead role for parallel outputs.
7. Immutable task-context packets with TTL/freshness/resume-diff behavior.
8. Context compaction specifically for long-running multi-worker continuity.
9. Artifact-first inter-worker handoff as a mandatory coordination contract rather than conversation relay.
10. Transactional outbox/inbox semantics for cross-worker state/events.
11. Saga/compensation/uncertain-outcome reconciliation as an Agency-wide external-side-effect contract.
12. Deadlock, livelock, priority inversion, orphan, and stuck-progress detection as explicit Agency coordination requirements.
13. Typed Agent job input/output/error/evidence/side-effect schemas with protocol-version negotiation.
14. Deterministic orchestration/replay including recorded time/randomness/provider/model/plan-version choices.
15. Workload record/replay harness for Agency regression testing.
16. Agency-specific dry-run/no-side-effect execution mode.
17. Synthetic provider adapters specifically required across major provider classes for Agency testing.
18. Agency canary/shadow worker/routing-policy rollout.
19. Project/department/mission lead registry as explicit dynamic organizational hierarchy.
20. Research Lead + research swarm + evidence-synthesis organization.
21. QA/Security/Integration/Release lead separation-of-duties model.
22. Agency Shift Manager / internal incident-command role.
23. Configurable autonomy levels OBSERVE / PROPOSE / PREPARE / EXECUTE / CONTINUOUS.
24. Formal decision-rights registry separating self-decidable, approved-default, recommend-only, protected, and prohibited decision classes.
25. Delegated authority cannot amplify and must narrow/equal parent authority.
26. Explicit owner-precedent similarity rule so a past decision is not overgeneralized.
27. Anti-goal-hacking and scope-drift detection as Agency governance controls.
28. Natural conversational referent resolution specifically for execution phrases such as “go ahead with that,” tied to exact execution snapshot.
29. Live conversational steering of active multi-agent work with impact reconciliation for mid-build changes.
30. Project-specific conversational workspace that returns verified completion to the same durable project conversation.
31. Project Foundry as a formal **idea → research → Ultimate Spec → architecture → roadmap/DAG → Agency execution → evidence → acceptance** pipeline.
32. Ultimate-Spec completeness matrix applied by project type.
33. High-volume idea inbox/incubation capable of holding many more logical projects than active workers.
34. Portfolio waves/capacity-aware project activation and opportunity-cost visibility.
35. Domain playbook registry and composable playbooks for software/AI/commerce/service/books/media/personal tools.
36. Greenfield / clean rebuild / rescue / migration / modernization / reality-reconstruction entry modes as explicit Foundry workflows.
37. Prototype/wireframe/usability lane integrated into Foundry before expensive build where useful.
38. Provider/account onboarding manifest and grouped Needs-Me setup workflow as a Foundry-generated artifact.
39. Verified project-blueprint registry with no-secret/no-private-state cloning.
40. Executive portfolio brief / Agency capacity view specifically tied to autonomous operations.
41. Project/idea validation stage gates that preserve an Ultimate Spec while allowing evidence-appropriate staged execution.
42. Outcome/feedback/experiment loop feeding verified evidence back into roadmaps without ad-hoc patching.
43. “Agency as organization” mission contracts with dynamic temporary teams per project/mission.
44. Portfolio/project/department/mission logical lead failover independent of a specific model process.
45. High-volume portfolio acceptance test proving more logical projects than simultaneously active workers without context leakage.

This candidate-new list is intentionally conservative: exact canonical matching may move many of these into Class A or B.

## CLASS D — Explicitly not new requirements

The following are not new features and must not inflate count:

- naming the multi-agent system **The Agency**;
- example worker counts such as 5, 200, or any other number;
- example department/team compositions;
- rewording “Agent” concepts into organizational language where behavior is unchanged;
- biometrics/fingerprint clarification;
- reliable-update clarification;
- the existence of additional roadmap documents themselves;
- phase-count expansion caused by decomposing a requirement into safer implementation/test work packages.

## First-pass conclusions

1. The Agency/Foundry work is **not a 390-requirement addition**.
2. A large amount of it promotes long-standing recovered scope that was previously too vague or too future-labeled.
3. The main genuinely new value appears to be in:
   - production-grade multi-worker concurrency semantics;
   - explicit autonomous organizational leadership;
   - formal decision-rights governance;
   - conversation-to-execution snapshots and live steering;
   - Project Foundry as one connected lifecycle;
   - high-volume idea/portfolio incubation;
   - project-type domain playbooks;
   - stronger simulation/replay/chaos and integration semantics.
4. Exact canonical-ID assignment remains blocked until candidate Class C items are matched against the full 5,825 register, not merely summary documents.

## Next reconciliation work

- Find exact canonical entries covering each Class C candidate.
- Reclassify candidates into A/B where an existing canonical requirement already covers the behavior.
- Create new IDs only for unmatched material owner requirements.
- Build a requirement-lineage table linking every new/strengthened control to canonical IDs.
- Then regenerate category/phase mapping and the expanded Master Build Plan.

No final canonical total is asserted by this pass.
