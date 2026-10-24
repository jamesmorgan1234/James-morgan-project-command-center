# 119 — Master Registry Schemas & Governance

**Status:** DESIGN NOW

## Registry invariants
All registry records use stable IDs, semantic versions, owner/company/project scope, status, source/decision provenance, created/updated timestamps, compatibility, security classification and supersession/deprecation. Registries are canonical metadata, not hidden mutable configuration.

## Portfolio Registry
Already established for the 100 future companies. Required fields: company ID, canonical name, aliases, primary project ID, purpose, lifecycle/status/stage, category, roadmap version, authorized scope, Brain IDs/versions, Agent IDs, services, repositories, environments, domains, integrations, data stores, secret refs, customer/tenancy model, billing model, cost center, KPI refs, incidents, security/compliance class, dependencies and pending approvals.

## Capability Registry
Fields: capability ID, canonical name, family, description, companies requiring it, shared/company-specific, owner layer (`CommandCenter|Brain|Agent|Service|Company`), implementation type (`AI|deterministic|hybrid`), lifecycle/status, DESIGN NOW/BUILD NOW/BUILD BEFORE FIRST COMPANY/company-specific/scale-only classification, scale trigger, security class, data classes, resource classes, interfaces/contracts, provider dependencies and evaluation pack.

## Integration Registry
Fields: integration ID, provider/product/protocol, capability family, companies using it, account/environment/region, direction (`inbound|outbound|bidirectional`), read/write/action classes, schema/contract version, credential reference, scopes, rate/quota, webhook/event support, health, data sensitivity/residency, replacement alternatives, free/paid state, compatibility/deprecation and evidence.

## Brain Registry
Fields: Brain ID/type/version/manifest hash, owner company/project, architecture class, domain/industry/policy/security/tool/workflow/eval pack refs, model-routing policy, deterministic-core refs, memory namespaces, data/sensitivity/region scope, Agent IDs, budgets/quotas, health, autonomy ceiling, safe-mode/kill state, deployment/environment and compatibility/migration state.

## Agent Registry
Fields: Agent ID/type/version, Brain/company/project, archetype, capabilities, tools/providers, memory/data scope, permissions/action classes, delegation ceiling, cost/resource budgets, concurrency, input/output schemas, verifier requirements, lifecycle/health, worker/runtime assignments, evaluation pack and migration/retirement state.

## Service Registry
Fields: service ID/type/version, shared/company-local, owner, API/event/data contracts, deterministic/AI/hybrid, dependencies, data classes, storage, provider/environment/region, credentials, rate/quota, SLO, health, incidents, cost center, security/retention and compatibility.

## Dependency Graph
Typed nodes: company/project/Brain/Agent/service/provider/integration/data store/domain/environment/model/tool/artifact/contract/policy. Edge types: `requires`, `calls`, `reads`, `writes`, `publishes`, `consumes`, `authenticates_with`, `billed_by`, `deployed_to`, `backed_up_by`, `monitored_by`, `governed_by`, `verifies`, `derived_from`, `supersedes`. Every edge includes scope/version/evidence and must be acyclic where lifecycle dependency requires it.

## Shared Component Matrix
Rows = shared component/capability; columns = companies or company families; cell values: `required`, `optional`, `prohibited`, `company-local-implementation`, `shared-control-plane-only`. Runtime state sharing is never inferred from component sharing.

## Spinoff Registry
Fields: spinoff candidate ID, source company/modules, purpose, independent value thesis, overlap with existing companies, why not a top-level company now, trigger for reconsideration, architecture dependency, data/IP isolation, commercial hypothesis and status. Top-level portfolio remains 100 until James expands it.

## Retrofit Risk Register
Fields: risk ID, future requirement, companies affected, current Command Center surfaces, redesign domains, severity, probability, DESIGN NOW requirement, BUILD NOW change, safe defer scope, acceptance test and resolution status.

## Version/change control
Each registry publishes immutable snapshots with portfolio-roadmap version and change log. Record additions, renames, merges/splits, supersession and owner corrections without reusing IDs.

## BUILD NOW
Implement registry contracts for company/capability/Brain/Agent/service/dependency metadata in Command Center architecture. Current future-company entries remain PLANNED metadata only and do not activate runtime resources.

## Acceptance
A future company can be added to registry planning with stable IDs and dependencies, but no Brain/Agent/service/account/environment is activated until lifecycle/authorization transitions explicitly permit it.