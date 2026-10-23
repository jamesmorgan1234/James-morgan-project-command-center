# Command Center — Agency / Project Foundry / Historical Recovery — Reconciliation Pass 2

Status: **MASTER RECONCILIATION RESULT FOR OWNER-REVIEW ROADMAP**  
Date: 2026-10-23  
Baseline before this pass: **5,825 canonical requirements**  
Specification Lock v2: **NOT YET LOCKED**

## Purpose

Resolve the 45 Class-C candidates from Pass 1 plus the 54 historical-export recovery controls against recovered Command Center scope, without inflating the canonical count for obligations that already existed.

This pass uses recovered source lineage including Foundation/Core/PE/FO/inventories, Pass-2/3/4 candidate evidence, the corrected owner additions, and the complete historical export recovery.

## Controlling reconciliation rules

1. A more detailed acceptance/test statement does not automatically become a new feature requirement when an existing canonical obligation already requires the behavior.
2. A genuinely distinct owner-required behavior gets a new canonical ID even if it sits beside an older broad capability.
3. Biometric/fingerprint and reliable-update clarifications remain mapped to existing canonical requirements and do not consume new IDs.
4. Historical implementation code is not requirement authority and is not reused.
5. New IDs begin at `CCR-05826`, because the reconciled baseline ends at `CCR-05825`.
6. New owner-review canonical requirements are not Specification Locked until James approves/corrects the final roadmap.

---

# A. RESOLUTION OF PASS-1 CLASS-C CANDIDATES

## Reclassified to existing / strengthened canonical scope — 24

The following Pass-1 candidates are retained as stronger acceptance/architecture detail but do **not** create a new canonical ID:

| Pass-1 # | Candidate | Resolution / recovered lineage |
|---:|---|---|
| 2 | Elastic worker pools / no fixed count | Existing multiple cooperating Agents, hierarchy/delegation, limited parallelism, concurrency policy, cross-project/resource-aware scheduling, many-project scale. Strengthened to require elastic logical capacity. |
| 4 | Per-job read/write resource sets | Existing permission envelopes, project/task/provider/cost scopes, resource locking, least privilege, future-feature read/write declarations. |
| 8 | Context compaction | Existing long-horizon summaries, durable memory, Context Builder, project encyclopedia/history, model-context minimization. |
| 9 | Artifact-first handoff | Existing controlled executor handoff, evidence/artifact registries, checkpoints, provenance, Shared Intelligence Library. Artifact-first is the required implementation interpretation. |
| 10 | Transactional outbox/inbox | Already explicit in recovered data/event requirements: critical outbox pattern + inbox deduplication. |
| 11 | Saga / compensation | Already explicit recovered distributed transaction / compensation requirements. |
| 13 | Typed Agent schemas / protocol compatibility | Existing typed commands/events/configuration, executor capability/permission versions, adapter contracts and compatibility/version requirements. |
| 16 | Synthetic provider adapters | Existing provider adapter contracts, fixture/synthetic/shadow testing, provider-isolation and integration-test requirements. |
| 19 | Research Lead + research swarm | Existing Research Agent, multiple cooperating Agents, hierarchy, delegation, peer review and research/synthesis capabilities. New organizational wording does not add a separate feature. |
| 20 | Independent QA/Security/Integration/Release separation | Existing Reviewer/Security/QA/Deployment agents, independent QA layers, security gating and integration verification. Strengthened to require independence appropriate to risk. |
| 21 | Lead separation of duties | Existing agent hierarchy, specialist agents, least privilege and QA/security independence. Lead titles are organizational expression, not separate count-bearing features. |
| 25 | Delegated authority cannot amplify | Already explicit: authorization cannot silently broaden; project/task/provider/cost scopes; least privilege; protected-action gates. |
| 27 | Anti-goal-hacking / scope drift | Existing project/objective hard locks, no hidden scope expansion, owner scope/rule change invalidates stale plan, exact-project Project Auto. Strengthened with drift detection. |
| 32 | Ultimate-Spec completeness matrix | Existing requirement coverage, roadmap compliance, category/evidence mapping, project templates and acceptance-gate system. |
| 33 | High-volume idea inbox | Existing Brainstorm, project discovery/proposals, recommendations, project-creation proposals, many-project scale. Strengthened with incubation semantics. |
| 34 | Portfolio activation waves / capacity-aware activation | Existing cross-project scheduling, resource-aware/budget-aware/time-window-aware scheduling and portfolio priority state. |
| 35 | Domain playbook registry | Existing software/ecommerce/publishing/media/service/SaaS/digital-product/personal/financial project templates plus custom template builder and specialist architecture. |
| 36 | Greenfield/rebuild/rescue/migration/modernization modes | Existing project recovery/migration, provider replacement, clean rebuild rules, migration lifecycle and project templates. Foundry exposes these as explicit entry modes. |
| 39 | Project-blueprint registry | Existing project templates, clone/fork/merge, Shared Intelligence patterns and extension SDK. Blueprint cloning inherits existing no-secret/private-state boundaries. |
| 40 | Executive portfolio brief / Agency capacity view | Existing Portfolio Overview, Agent UI, priority state, metrics, recommendations and workload/resource scheduling. |
| 41 | Validation stage gates | Existing G0–G14-style gate system, requirement/architecture/security/evidence gates, owner review and release gates. |
| 42 | Outcome / feedback / experiment loop | Existing recommendation outcome measurement, analytics, self-audit, experimentation concepts and roadmap proposal loop. |
| 43 | Dynamic mission teams / mission contracts | Existing multiple cooperating Agents, hierarchy, delegation, project/objective hard locks, permission envelopes and dynamic specialist selection. Mission contract becomes the implementation form. |
| 45 | More logical projects than active workers scale test | Existing many-project/10×/100× scale, concurrency policy, workload scheduling and project isolation. This is an explicit acceptance test of existing scale scope. |

## Genuinely new owner-directed canonical requirements — 21

The following remained materially unmatched after source-level reconciliation and therefore receive new canonical IDs in REV3:

1. `CCR-05826` — Persistent logical Project Agent identity distinct from disposable execution-worker instances.
2. `CCR-05827` — Highly available Agency control plane with scheduler leadership/failover and single-authority coordination.
3. `CCR-05828` — Monotonic fencing-token protection preventing stale workers from committing after claim/lease loss.
4. `CCR-05829` — Controlled integration/merge arbitration queue for conflicting or parallel Agency outputs.
5. `CCR-05830` — Immutable task-context packet with source versions, freshness/TTL rules, authorization snapshot and resume diff.
6. `CCR-05831` — Agency coordination fault detection for deadlock, livelock, priority inversion, orphaned work and stuck/no-progress execution.
7. `CCR-05832` — Deterministic orchestration replay record capturing time/randomness/provider/model/policy/plan choices needed to reproduce decisions.
8. `CCR-05833` — Workload record/replay regression harness for Agency scheduler/execution behavior.
9. `CCR-05834` — Canary/shadow rollout for new worker versions, executors and routing policies before full Agency adoption.
10. `CCR-05835` — Dynamic logical lead registry for portfolio/project/department/mission leadership assignments.
11. `CCR-05836` — Agency Shift Manager / incident-command function for workload health, stalled work, incidents and handoff continuity.
12. `CCR-05837` — Configurable autonomy levels: OBSERVE / PROPOSE / PREPARE / EXECUTE / CONTINUOUS, bounded by project and action policy.
13. `CCR-05838` — Formal decision-rights registry distinguishing self-decidable, approved-default, recommend-only, protected and prohibited choices.
14. `CCR-05839` — Owner-precedent similarity control preventing historical decisions from being overgeneralized to materially different situations.
15. `CCR-05840` — Exact conversational referent-to-execution snapshot for phrases such as “go ahead with that,” binding execution to the agreed version.
16. `CCR-05841` — Live conversational steering of active Agency work with impact analysis, stale-plan invalidation and safe replanning.
17. `CCR-05842` — Durable project-specific conversational workspace that carries project context, decisions, execution and verified results across sessions.
18. `CCR-05843` — Project Foundry lifecycle as one governed idea → research → Ultimate Spec → architecture → roadmap/DAG → Agency → evidence → acceptance pipeline.
19. `CCR-05844` — Integrated prototype/wireframe/usability-validation lane before expensive implementation where the project type benefits from it.
20. `CCR-05845` — Foundry-generated provider/account onboarding manifest with consolidated Needs-Me setup dependencies and unlock impact.
21. `CCR-05846` — Logical lead failover so portfolio/project/department/mission leadership survives model/process/worker failure without losing mission state.

---

# B. HISTORICAL EXPORT RECOVERY CONTROLS ER-01–ER-54

The 54 ER controls were checked against Import Center, project discovery, project merge/lineage, Brain durable memory, rules/decisions, provenance/confidence, asset/checkpoint registries, privacy/trust inventories, project recovery, Shared Intelligence/lessons, Agent durability and existing resume/boundary contracts.

## Existing / strengthened canonical scope — 48

The following ER controls remain mapped to existing canonical scope and do not add IDs:

- ER-02 complete conversation inventory;
- ER-05 artifact-reference recovery;
- ER-07 standalone-project discovery;
- ER-08 forgotten-project detection;
- ER-09 rename detection;
- ER-10 merge/supersession detection;
- ER-11 project-state classification;
- ER-12 no silent activation;
- ER-13 provenance on recovered assertions;
- ER-14 fact versus proposal separation;
- ER-15 newer-owner-decision precedence;
- ER-16 current-live-state precedence;
- ER-17 conflict registry;
- ER-18 confidence tiers;
- ER-19 canonical decision ledger;
- ER-20 canonical rule ledger;
- ER-21 canonical artifact ledger;
- ER-22 canonical checkpoint ledger;
- ER-23 historical requirement extraction;
- ER-24 no assistant-proposal auto-promotion;
- ER-25 privacy classification before persistence;
- ER-26 private-personal-data isolation;
- ER-27 lesson extraction without unnecessary private copying;
- ER-28 project isolation;
- ER-29 secret/credential exclusion;
- ER-30 user-visible provenance/correction;
- ER-32 reconstruction labeling;
- ER-33 protected-asset preservation;
- ER-34 historical build-package recovery;
- ER-35 owner-governed project resurrection;
- ER-37 build-history lesson registry;
- ER-38 failure-class taxonomy;
- ER-39 positive-pattern registry;
- ER-40 evidence-required lesson promotion;
- ER-41 post-operational retrospective gate;
- ER-42 improvement proposal, not self-mutation;
- ER-43 recurrence-to-known-lesson linkage;
- ER-44 lesson expiration/revalidation;
- ER-45 mission lineage;
- ER-46 scope-drift detection;
- ER-47 new-project duplicate guard;
- ER-48 rename preserves history;
- ER-49 clean rebuild versus project identity;
- ER-50 historical comparison view;
- ER-51 conditional-resume lineage;
- ER-52 resume from verified checkpoint;
- ER-53 boundary persistence;
- ER-54 no chat-session dependency.

Key recovered lineage includes:

- Core Import Center validation/dry-run/conflict/duplicate/provenance/rollback/no-silent-overwrite/provider-independent migration requirements;
- rules and decisions centers with current/superseded state and history;
- project discovery from conversations/imported files/connected systems with duplication warning and owner ADD/MERGE/PARK/REJECT/RESEARCH control;
- entity duplicate detection and history-preserving merge;
- historical timeline/decision reconstruction, conflicting-source comparison and outdated-fact detection;
- project/architecture/incident/lessons/provider encyclopedias;
- durable Agent runs/checkpoints/blockers/resume independent of one UI interaction;
- private/sensitive/secret classification, context minimization, cross-project privacy and default deny.

## Genuinely new historical-recovery canonical requirements — 6

22. `CCR-05847` — Native historical conversation-export ingestion adapter for supported ChatGPT export structures, with import-batch identity and safe migration into canonical recovery staging.
23. `CCR-05848` — Historical conversation import must process the complete message graph rather than only titles, final messages, indexed search hits or known project conversations.
24. `CCR-05849` — Historical branch-aware message lineage must preserve divergent conversation branches and prevent false flattened chronology.
25. `CCR-05850` — Historical project-container/template identity must be imported and retained as lineage evidence linking conversations that originally belonged to the same project container.
26. `CCR-05851` — Lost-artifact locator must preserve missing historical artifact references and attempt authorized original-source recovery before any reconstruction; reconstruction can never masquerade as the original.
27. `CCR-05852` — Every historical recovery/import must produce a machine-readable completeness report covering processed scope, conflicts, candidate projects, missing artifacts, rename/merge/supersession lineage and unresolved unknowns.

---

# C. CANONICAL COUNT RESULT

Baseline: **5,825**  
New distinct Agency/Foundry requirements: **21**  
New distinct historical-recovery requirements: **6**  
Biometric/update clarifications: **0 new IDs**  

## Owner-review canonical requirement total: **5,852**

New canonical range: **CCR-05826–CCR-05852**

This count is the reconciled owner-review total for the roadmap. It does not imply Specification Lock v2; James still must review/correct the final phased Master Build Plan.

---

# D. REQUIRED ROADMAP CONSEQUENCES

The 147-phase pre-Agency plan is superseded as the final phase decomposition.

The expanded plan must explicitly cover at least:

- new Project Agent / worker identity split;
- Agency control plane and fencing;
- context packets and replay;
- multi-worker arbitration and coordination-fault handling;
- canary/shadow worker rollouts;
- dynamic lead registry, Shift Manager and lead failover;
- autonomy levels and decision-rights registry;
- exact conversation-to-execution snapshot;
- live steering and durable project conversation;
- complete Foundry lifecycle;
- prototype/usability lane;
- onboarding manifest / Needs Me unlock grouping;
- historical conversation export ingestion/message graph/branch/project-container lineage;
- lost-artifact recovery;
- recovery completeness reporting;
- final Agency concurrency, recovery, privacy, Foundry and historical-import acceptance.

All strengthened existing controls remain mandatory even where they do not create new canonical IDs.

---

# E. NEXT STEP

1. Persist the canonical owner additions for `CCR-05826–CCR-05852`.
2. Generate the complete expanded phase plan against **5,852** requirements.
3. Update category counts/mapping, dependency graph, supersession record, manifest, QC and coverage verification.
4. Run final completeness/dependency/security/privacy/extensibility/dormant/failure/recovery audit.
5. Present the owner-review Master Build Plan.
6. Only after James approves/corrects it, create Specification Lock v2 and begin clean implementation.
