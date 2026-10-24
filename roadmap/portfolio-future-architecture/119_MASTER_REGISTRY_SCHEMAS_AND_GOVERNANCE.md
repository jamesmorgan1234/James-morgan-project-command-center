# 119 — Master Registry Schemas & Governance

**Status:** DESIGN NOW

## Registry invariants
All registry records use stable IDs, semantic versions, owner/company/project scope, status, source/decision provenance, created/updated timestamps, compatibility, security classification and supersession/deprecation. Registries are canonical metadata, not hidden mutable configuration.

## Portfolio Registry
Already established for the known future companies. Required fields: company ID, canonical name, aliases, primary project ID, purpose, lifecycle/status/stage, category, roadmap version, authorized scope, Brain IDs/versions, Agent IDs, services, repositories, environments, domains, integrations, data stores, secret refs, customer/tenancy model, billing model, cost center, KPI refs, incidents, security/compliance class, dependencies and pending approvals.

## Capability Registry
Fields: capability ID, canonical name, family, description, companies requiring it, shared/company-specific, owner layer (`CommandCenter|Brain|Agent|Service|Company`), implementation type (`AI|deterministic|hybrid`), lifecycle/status, DESIGN NOW/BUILD NOW/BUILD BEFORE FIRST COMPANY/company-specific/scale-only classification, scale trigger, security class, data classes, resource classes, interfaces/contracts, provider dependencies and evaluation pack.

## Integration Registry
Fields: integration ID, provider/product/protocol, capability family, companies using it, account/environment/region, direction (`inbound|outbound|bidirectional`), read/write/action classes, schema/contract version, credential reference, scopes, rate/quota, webhook/event support, health, data sensitivity/residency, replacement alternatives, free/paid state, compatibility/deprecation and evidence.

## Source / Conversation Registry
Shared source ingestion, including all-chat incremental refresh, uses stable provider-scoped source identity and never a mutable title/name as canonical identity.

Minimum fields for a chat/conversation source record:
- source/chat ID and provider/account/project scope;
- mutable current title plus title-history reference;
- created/updated/provider-version metadata;
- message count and provider-reported size when available;
- latest message ID/cursor or equivalent delta checkpoint;
- last-seen/full-read/incremental-read timestamps;
- last processed message/cursor;
- whole-content and segment fingerprint refs;
- hash/canonicalization, parser, indexer and source-schema versions;
- access/tombstone/integrity state;
- sensitivity/trust classification;
- provenance root and last error/incident reference.

Source records must preserve rename continuity, explicit tombstones/access loss, idempotent checkpoints, provenance and compatibility state. A source is never considered unchanged from byte size alone. Detailed behavior is governed by `122_ALL_CHAT_INCREMENTAL_SOURCE_REFRESH_ARCHITECTURE.md`.

## Brain Registry
Fields: Brain ID/type/version/manifest hash, owner company/project, architecture class, domain/industry/policy/security/tool/workflow/eval pack refs, model-routing policy, deterministic-core refs, memory namespaces, data/sensitivity/region scope, Agent IDs, budgets/quotas, health, autonomy ceiling, safe-mode/kill state, deployment/environment and compatibility/migration state.

## Agent Registry
Fields: Agent ID/type/version, Brain/company/project, archetype, capabilities, tools/providers, memory/data scope, permissions/action classes, delegation ceiling, cost/resource budgets, concurrency, input/output schemas, verifier requirements, lifecycle/health, worker/runtime assignments, evaluation pack and migration/retirement state.

## Service Registry
Fields: service ID/type/version, shared/company-local, owner, API/event/data contracts, deterministic/AI/hybrid, dependencies, data classes, storage, provider/environment/region, credentials, rate/quota, SLO, health, incidents, cost center, security/retention and compatibility.

## Dependency Graph
Typed nodes: company/project/Brain/Agent/service/provider/integration/data store/domain/environment/model/tool/artifact/contract/policy/source. Edge types: `requires`, `calls`, `reads`, `writes`, `publishes`, `consumes`, `authenticates_with`, `billed_by`, `deployed_to`, `backed_up_by`, `monitored_by`, `governed_by`, `verifies`, `derived_from`, `supersedes`, `refreshes`, `indexes`. Every edge includes scope/version/evidence and must be acyclic where lifecycle dependency requires it.

## Shared Component Matrix
Rows = shared component/capability; columns = companies or company families; cell values: `required`, `optional`, `prohibited`, `company-local-implementation`, `shared-control-plane-only`. Runtime state sharing is never inferred from component sharing.

## Spinoff Registry
Fields: spinoff candidate ID, source company/modules, purpose, independent value thesis, overlap with existing companies, why not a top-level company now, trigger for reconsideration, architecture dependency, data/IP isolation, commercial hypothesis and status. The current known top-level portfolio remains 107 until James expands it; architecture itself has no fixed maximum.

## Retrofit Risk Register
Fields: risk ID, future requirement, companies affected, current Command Center surfaces, redesign domains, severity, probability, DESIGN NOW requirement, BUILD NOW change, safe defer scope, acceptance test and resolution status.

## Version/change control
Each registry publishes immutable snapshots with portfolio-roadmap version and change log. Record additions, renames, merges/splits, supersession and owner corrections without reusing IDs. Source-ingestion version changes additionally record whether they require metadata migration, reparse, reindex, bounded reconciliation or full reread.

## BUILD NOW
Implement registry contracts for company/capability/Brain/Agent/service/dependency/source metadata in Command Center architecture. Current future-company entries remain PLANNED metadata only and do not activate runtime resources. Source-registry architecture does not imply the current provider exposes enumeration/delta primitives or that every chat has already been read.

## Acceptance
A future company can be added to registry planning with stable IDs and dependencies, but no Brain/Agent/service/account/environment is activated until lifecycle/authorization transitions explicitly permit it. A renamed chat remains the same source identity, a same-size edit can be detected by version/fingerprint, and an inaccessible/deleted chat is represented explicitly rather than silently disappearing.