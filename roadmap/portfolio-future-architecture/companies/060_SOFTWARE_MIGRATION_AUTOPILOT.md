# Company 060 — Software Migration Autopilot

**Company ID:** `company:future:060`  
**Primary project:** `project:company:future:060`  
**Roadmap version:** `COMPANY-060-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer cutover, data mutation, credential use, migration execution or system shutdown.

## Business identity

Purpose: plan, rehearse, execute and verify migration of data/configuration/workflows from one software system to another with mappings, incremental sync, reconciliation and rollback.

Problem: migrations fail because hidden dependencies, dirty data, schema mismatch, missing attachments, identity ambiguity and cutover timing are discovered late.

Value: evidence-backed discovery, repeatable dry runs, explicit mapping/conflict decisions, lower downtime and provable source-to-target reconciliation.

## Complete product tree

Source/Target Discovery; Schema Profiler; Mapping Designer; Transformation Engine; Data Cleanup; Entity Resolution; Dependency Graph; Attachment/File Migrator; Permission/Identity Mapper; Configuration Migrator; Workflow/Automation Mapper; Dry-Run Sandbox; Validation/Reconciliation; Incremental/CDC Sync; Cutover Planner; Rollback Planner; Exception Workbench; Migration Evidence Pack; Connector SDK; Migration Template Marketplace; Enterprise/Private Deployment; Managed Migration Service; Vertical/System Packs.

## Feature/customer/vertical tree

Features: source/target versions, object types, field schemas, IDs, relationships, reference data, permissions, files, comments/history, mappings, transformations, defaults, invalid records, duplicates, conflicts, incremental cursors, checkpoints, counts/hashes, sampling, business-rule tests, downtime window, cutover/rollback state and evidence.

Customers: SaaS vendors, enterprises, agencies/integrators, MSPs, consultants, IT departments, acquisitions/consolidations, platform vendors and customers switching business software.

Verticals: CRM, ERP/accounting, helpdesk, project management, HRIS, ecommerce, CMS, data warehouses, collaboration, field service, industry SaaS. Each needs source/target-specific semantic mapping packs.

## Brain capability tree / architecture

Brain may infer candidate mappings, explain schema semantics, identify likely dependencies and propose transformations. Deterministic migration plans, constraints, validation and reconciliation own execution. Brain cannot silently choose destructive conflict resolution or cutover.

Architecture: connector registry, source snapshot/profiling, canonical intermediate model where useful, mapping DSL, transform engine, entity resolver, dependency DAG, checkpoint/idempotency system, incremental sync, validation/reconciliation, artifact storage, protected cutover/rollback gates and audit/provenance.

## Agent tree

Discovery Agent; Schema Analyst; Mapping Agent; Data Cleanup Agent; Entity Resolution Agent; Dependency Agent; Transformation Agent; File/Attachment Agent; Permission Agent; Dry-Run Coordinator; Incremental Sync Agent; Validation/Reconciliation Agent; Cutover Planner; Rollback Coordinator; Migration QA Agent.

## Deterministic services

Connector framework; schema introspection; mapping compiler; transform functions; dependency ordering; checkpointing; idempotent writes; cursor/CDC tracking; count/hash reconciliation; referential-integrity checks; quarantine/error queues; backup/export; rollback manifests.

## Workflow tree

Authorize migration planning → discover source/target → snapshot/profiling → map schemas/entities/permissions/files → clean/transform rules → dry run → validate counts/relations/business rules → resolve exceptions → repeat until acceptance → start incremental sync → freeze/cutover window → final delta → protected cutover → verify target/source reconciliation → rollback if gates fail → close with evidence.

## Integrations / API / data

Source/target SaaS APIs, databases, file/object stores, identity/IAM, webhooks, ETL, queues, export/import formats, audit/log systems. APIs for connectors, schemas, mappings, dry runs, errors, sync state, reconciliation and cutover evidence.

Data: source snapshots/metadata, mappings, transformations, identity maps, checkpoints, errors, reconciliation results, cutover/rollback plans and evidence. Customer data is highly isolated and retained minimally.

## Monetization / distribution

Per migration, records/objects, connectors, data volume, source-target pair, seats, managed migration, enterprise/private, API/SDK and certified migration packs. Distribution via SaaS vendors, marketplaces, agencies/integrators and MSPs.

## Security/privacy/compliance

Credentials scoped to source/target, read-only discovery by default, encrypted staging, tenant isolation, PII classification, no cross-customer training, signed migration plans, protected writes/cutover, full audit and deletion of temporary copies according to retention policy.

## Failure / edge cases

API limits, source changes during migration, deleted source records, target uniqueness constraints, missing relationships, attachments too large, unsupported history, permission model mismatch, timezone/encoding issues, duplicate identities, partial cutover, webhook races, rollback after target writes. Every unsupported field/object remains explicit.

## Scale / overlap

One-off SaaS migrations → repeatable connector marketplace → enterprise migration control plane. Overlap #20 data cleanup, #42 legacy browser worker, #100 legacy modernization. #060 moves state/data/config; #100 changes the software itself.

## Classification

**DESIGN NOW:** connector contracts, staging/provenance, versioned mappings, idempotency/checkpoints, conflict/reconciliation, protected cutover/rollback.  
**BUILD NOW:** Command Center data portability/recovery/provider abstractions already need these seams; reverse-map should preserve them.  
**BUILD BEFORE FIRST COMPANY:** connector SDK, mapping DSL, staging isolation, dry-run/reconciliation framework.  
**COMPANY-SPECIFIC LATER:** specific source-target connectors, migration packs, customer UI/pricing.  
**SCALE-ONLY:** massive connector marketplace and distributed migration execution.

# Mandatory 24-part completion block

1. Product Tree: discovery/schema/mapping/transform/cleanup/entity/dependency/files/permissions/config/workflows/dry run/validate/incremental/cutover/rollback/API/managed.
2. Feature Tree: versions/objects/fields/relations/files/permissions/mappings/conflicts/cursors/checkpoints/counts/hashes/tests/windows/evidence.
3. Customer Tree: SaaS/enterprise/integrator/MSP/consultant/IT/M&A/platform vendors.
4. Vertical Tree: CRM/ERP/helpdesk/project/HR/ecommerce/CMS/data/collaboration/field service/industry SaaS.
5. Brain Tree: mapping/semantic/dependency recommendations; destructive resolution/cutover gated.
6. Agent Tree: discovery/schema/mapping/cleanup/entity/dependency/transform/files/permissions/dry-run/sync/reconcile/cutover/rollback/QA.
7. Service Tree: connectors/introspection/compiler/transforms/DAG/checkpoints/idempotency/cursors/reconciliation/quarantine/rollback.
8. Workflow Tree: discover→profile→map→dry run→validate→resolve→incremental→cutover→verify/rollback→evidence.
9. Integration Tree: SaaS APIs/DB/files/IAM/webhooks/ETL/queues/export/audit.
10. Data Tree: metadata/snapshots/mappings/transforms/identity maps/checkpoints/errors/reconciliation/plans/evidence.
11. API Tree: connectors/schemas/mappings/dry runs/errors/sync/reconciliation/cutover.
12. Monetization Tree: migration/records/connectors/volume/pairs/seats/managed/enterprise/API/packs.
13. Distribution Tree: vendors/marketplaces/integrators/MSPs.
14. Automation Tree: discovery/mapping suggestions/dry-run/sync/reconcile automated; destructive cutover/rollback protected.
15. Moat Tree: connector library, mapping corpus, exception resolutions, source-target semantic packs.
16. Platform Tree: migration utility→migration OS→connector marketplace/control plane.
17. Risk Tree: data loss/wrong mapping/permission leak/duplicate writes/stale delta/failed rollback.
18. Scale Tree: one migration→many pairs→enterprise/global migration platform.
19. Spinoff Tree: connector SDK/mapping engine/reconciliation modules; cleanup and modernization remain separate companies.
20. Command Center Dependencies: portability, staging, provider registry, artifacts, identity, checkpoints, reconciliation, protected actions.
21. Design-Now Requirements: versioned import/export/staging/conflict/idempotency/rollback contracts.
22. Build-Now Requirements: preserve generic migration and recovery seams in Command Center canonical data platform.
23. Safe-to-Defer Requirements: customer connectors/templates/execution fleet/UI/pricing.
24. Autonomous Mature State: discovery/dry runs/incremental sync/reconciliation run automatically; humans approve ambiguous mappings and final protected cutover.

## Saturation result

Further branches converge into data cleanup, browser automation or legacy-software modernization already represented.