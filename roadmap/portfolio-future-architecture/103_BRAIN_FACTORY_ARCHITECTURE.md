# 103 — Reusable Brain Factory Architecture

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION  
**Purpose:** produce isolated, versioned domain brains without cloning Command Center Brain or creating one universal intelligence monolith.

## 1. Factory output

A Brain Factory build produces a **Brain Package**, not merely a prompt. Every package has:

- stable `brain_id` and company/project ownership;
- `brain_type` and domain purpose;
- semantic version + compatibility range;
- immutable manifest hash;
- domain/industry/ontology/taxonomy packs;
- knowledge-source and provenance policy;
- model-routing policy;
- deterministic-core dependencies;
- memory classes/retention/deletion policy;
- tool/integration capability declarations;
- action/risk/approval policy pack;
- workflow packs;
- specialist/agent manifest;
- evaluation/regression/adversarial pack;
- cost/resource budgets;
- privacy/residency constraints;
- observability/health contract;
- recovery/safe-mode/kill-switch contract;
- migration/deprecation contract.

Brain package state: `draft → validated → internally_ready → enabled → degraded → safe_mode → suspended → retired`. Production/customer states remain future authorization.

## 2. Pack system

### Domain Pack
Terminology, ontology, entities, domain relationships, domain sources, rules-of-thumb, expertise boundaries, domain uncertainty vocabulary.

### Industry Pack
Industry workflows, regulations/compliance references, integrations, customer types, regional variation and specialized evaluation cases.

### Policy Pack
Allowed/prohibited actions, risk classes, limits, approval classes, escalation, required evidence, retention, residency and company-level overrides. Policy cannot broaden global Command Center limits.

### Security Pack
Sensitivity classes, threat model, prompt-injection handling, secrets rules, data egress, sandbox requirements, abuse/misuse controls and incident playbooks.

### Tool Pack
Typed tool schemas, capabilities, provider adapters, auth scopes, rate/cost limits, idempotency requirements, side-effect class and verification contract.

### Workflow Pack
Versioned state machines, triggers, checkpoints, retry/timeout/compensation, completion evidence and human-boundary states.

### Integration Pack
Provider/account/environment mapping, protocol/version, compatibility, credential refs, health, quotas, webhooks/events and replacement path.

### Evaluation Pack
Golden cases, domain correctness, uncertainty, tool use, hallucination, policy, adversarial, cost, latency, privacy, regression and downgrade tests.

## 3. Knowledge and memory architecture

Brain memory classes:

- working context — ephemeral, task scoped;
- semantic/domain knowledge — versioned source-backed knowledge;
- episodic — completed interaction/work evidence;
- company memory — isolated to one company;
- customer memory — isolated to exact tenant/customer where authorized;
- precedent — versioned decision/outcome evidence, never inherited authorization;
- rule/policy memory — canonical references, not uncontrolled natural-language memory;
- artifact memory — references/hashes, not arbitrary duplicate blobs.

Every memory record requires owner/company/project/tenant scope, source/provenance, sensitivity, region, retention/delete state, truth class, effective/superseded state and access policy. Customer/company memory must never leak across company brains.

## 4. Reasoning and deterministic-core boundary

Brain supports research, understanding, classification, reasoning, planning, prediction, recommendations, decomposition, uncertainty and escalation.

Deterministic cores remain authoritative for:
- permissions and entitlements;
- financial arithmetic;
- tax/rate calculations;
- billing/commission calculations;
- cryptographic proof;
- schema/data-contract validation;
- exact eligibility/constraint checks;
- idempotency/leases/locks;
- retention/legal hold;
- transaction/reconciliation ledgers;
- deployment/release gates;
- quotas/budgets.

A Brain may invoke/explain those cores but cannot substitute its own free-form answer for their result.

## 5. Model routing

Every Brain consumes the shared model gateway through declared requirements:
- modality;
- quality floor;
- task capability;
- context length;
- privacy/sensitivity;
- region/residency;
- latency ceiling;
- cost ceiling/budget;
- provider eligibility;
- local/self-hosted preference;
- fallback policy.

Routing uses measured evaluation/health/quota/cost evidence. Provider/model identity and version are attached to every material output. Deterministic fallback or truthful unavailability is mandatory.

## 6. Tool/action policy

Every tool has `READ`, `ANALYZE`, `RECOMMEND`, `EXECUTE_WITH_POLICY`, `EXECUTE_WITH_APPROVAL`, `AUTONOMOUS_WITHIN_HARD_LIMITS`, or `PROHIBITED` action classes.

Tool calls require exact actor/brain/agent/runtime identity, company/project/tenant scope, resource, action, policy version, context provenance, budget, idempotency key and verification method. Protected actions route through Command Center policy/security governor or a company-local gate that cannot weaken it.

## 7. Brain isolation

Each enabled company Brain has isolated:
- canonical memory namespace;
- vector/search namespace;
- data-store references;
- secrets/credential refs;
- tools/accounts;
- model privacy routing;
- logs/traces;
- artifacts;
- customer memory;
- budgets/quotas;
- incidents.

Shared packs are immutable/versioned templates; runtime state is never shared by default.

## 8. Evaluation and graduation

Brain maturity gates:
1. manifest/schema valid;
2. deterministic core dependencies available;
3. golden correctness passes;
4. hallucination/unsupported-certainty tests pass;
5. untrusted-input/prompt-injection tests pass;
6. policy/authorization tests pass;
7. privacy/cross-company leakage tests pass;
8. tool-use/idempotency tests pass;
9. cost/latency thresholds pass;
10. outage/degradation tests pass;
11. human-review calibration for high-impact judgment passes;
12. canary/shadow evidence passes before enabled scope expands.

## 9. Factory lifecycle

`DEFINE → ASSEMBLE PACKS → VALIDATE DEPENDENCIES → GENERATE MANIFEST → BUILD ISOLATED PACKAGE → RUN EVALS → SECURITY/PRIVACY GATE → COST/RESOURCE GATE → INTERNAL SHADOW → OWNER/POLICY ENABLE → MONITOR → IMPROVE → MIGRATE/RETIRE`.

No future company is enabled under this directive.

## 10. Compatibility and migration

Pack/API contracts are versioned. Brain upgrades carry migration plan, compatibility ranges, memory-schema migration, evaluation diff, rollback and retirement path. A Brain version cannot silently change policies, data scope or authority.

## 11. DESIGN NOW / BUILD NOW

### DESIGN NOW
- Brain manifest/package schema;
- pack interfaces;
- machine identity/version;
- company/project ownership and isolation;
- deterministic-core adapter interface;
- context/memory scope metadata;
- tool/action contract;
- evaluation pack contract;
- model-routing requirements;
- resource/cost budget contract;
- health/recovery/safe-mode interface;
- migration/deprecation.

### BUILD NOW
Evolve current Command Center Brain/specialist/model-routing architecture into the reusable factory interfaces **without** instantiating future company brains. Current Command Center must demonstrate that an external specialized Brain can register, be scoped, evaluated, disabled and removed without core surgery.

### BUILD BEFORE FIRST PORTFOLIO COMPANY
Brain package builder, isolated memory/search deployment, pack registry, company Brain deployment/health management and portfolio Brain dashboard.

### DEFER
Public brain-pack marketplace, cross-customer learning networks and paid hosted model infrastructure.

## 12. Acceptance criterion

A dummy domain Brain can be assembled from reusable packs, registered under a dummy company/project, run entirely inside isolated test data, pass security/evaluation gates, enter safe mode, be upgraded/rolled back and be removed—without editing unrelated Command Center kernel code and without seeing another company's memory, credentials or tools.