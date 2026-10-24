# 110 — Shared Portfolio Platform: Identity, Tenancy & Data Governance

**Status:** DESIGN NOW / PARTIAL BUILD NOW FOUNDATION

## Shared-but-isolated principle

The platform may reuse code, schemas, control-plane services and contracts. It must not implicitly share company/customer runtime data, credentials, memory, payments or identities.

## Identity hierarchy

`owner → company → project → customer organization/tenant → user/actor` plus machine identities for Brain, Agent, worker, service, integration and deployment.

Every identity has stable ID, type, owner, lifecycle, aliases, organization relationships, verification/assurance, region where relevant and evidence. Customer/user identities are never reused across companies unless a future explicit federation contract authorizes it.

## Tenant model

Future customer-facing companies can declare tenancy model:
- single-user/consumer;
- organization with members;
- parent/child organizations;
- reseller/MSP hierarchy;
- marketplace multi-sided participants;
- device/agent fleet.

Tenant boundary includes data, search/vector namespace, object storage, sessions, entitlements, billing, customer memory, communications and audit.

## Data classes

`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `SENSITIVE_PERSONAL`, `FINANCIAL`, `CREDENTIAL`, `SECRET`, `REGULATED`, `PROTECTED_ASSET` plus domain extensions. Every durable data/artifact/context record can attach classification, purpose, owner/company/project/tenant, region/residency, retention, legal hold, source/provenance and allowed-processing policy.

## Data truth

Truth classes: `VERIFIED_SOURCE`, `OWNER_DECISION`, `OBSERVED`, `DERIVED_DETERMINISTIC`, `MODEL_INFERENCE`, `ASSUMPTION`, `ESTIMATE`, `FORECAST`, `RECOMMENDATION`, `UNKNOWN`, `N_A`, `SUPERSEDED`.

Verified zero remains different from unknown. Inference cannot silently become verified source.

## Data lifecycle

Create/ingest → classify → provenance → validate → store/index → authorize access → transform with lineage → retain/archive → legal hold/exception → delete/tombstone → verify deletion and derived copies. Backups and embeddings/vector indexes are part of lifecycle scope.

## Shared storage abstraction

Registry declares relational, object, vector, graph, search, cache, queue/event and archive capabilities with provider/environment/region, company/tenant isolation, encryption, backup/restore and retention support. Company resource manifests choose logical/schema/account isolation levels.

## Cross-company data sharing

Default denied. Explicit contract must name source/destination, purpose, exact fields/artifacts, sensitivity, legal/consent basis if relevant, retention, region, transform/redaction, frequency, revocation and audit. No onward/transitive sharing unless separately authorized.

## Data contracts

Every shared service/event/API/context exchange has machine-readable versioned contract: producer, consumers, schema/semantics, quality/freshness, sensitivity, purpose, retention, compatibility and owner. Contract violations fail closed or quarantine according to policy.

## Data lineage

Material data/output links source → transform → dataset/artifact/context → model/Brain → Agent/decision → action/result. Verified and inferred edges remain distinct.

## DESIGN NOW
Identity hierarchy, company/tenant scope, sensitivity/truth/region/retention metadata, storage capability registry, cross-company deny default, data-contract schema and lineage edge contract.

## BUILD NOW
Reconcile current Command Center canonical data, project/company identity, context/artifact exchange, memory, Agency packets and evidence records to these metadata contracts before later categories add more durable stores.

## BUILD BEFORE FIRST COMPANY
Customer organization/tenant service, production RLS/isolation templates, customer auth/entitlements/billing bindings and isolated company data-plane provisioning.

## Acceptance
A dummy Company A/Tenant A dataset cannot appear in Company B/Tenant B retrieval, context, memory, logs or exports; its lineage, retention and region policy remain intact through every allowed transformation.