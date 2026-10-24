# Company 094 — Enterprise Data Lineage & Provenance Graph

**Company ID:** `company:future:094`  
**Primary project:** `project:company:future:094`  
**Roadmap version:** `COMPANY-094-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer-system scanning or production data mutation.

## Business identity
Purpose: map how enterprise data originates, moves, transforms and influences downstream datasets, models, agents, reports, exports and actions.

## Product tree
Source/Asset Catalog; Field/Table/Dataset Lineage; File/Document Lineage; ETL/ELT Transformation Graph; Warehouse/Lake/Lakehouse Lineage; Dashboard/BI Lineage; Model/Feature Lineage; Prompt/RAG Lineage; Agent/Decision/Action Lineage; Export/Partner Lineage; Ownership/Stewardship; Sensitivity/Policy Overlay; Freshness/Quality Overlay; Impact/Blast-Radius Analysis; Root-Cause Analysis; Change Alerts; Data Catalog; Governance; API/SDK; Enterprise/Private Deployment; Connector Packs.

## Feature/customer/vertical tree
Features: node ID/type/system/owner, source-to-target edges, field mappings, transform code/version, timestamps, dataset versions, model/prompt/agent refs, sensitivity, quality, freshness, policies, consumers, downstream actions, incidents and evidence.
Customers: enterprises, data platforms, analytics/AI teams, privacy/governance, software companies, regulated organizations and data providers.
Verticals: finance data, health admin, retail/commerce, manufacturing/IoT, marketing analytics, SaaS telemetry, research/data products and agentic systems.

## Brain capability / architecture
Brain may explain complex lineage and infer candidate missing edges; canonical edges require observed/declared evidence. Architecture: typed graph store, connector/metadata collectors, transformation parser, schema registry, provenance event ingestion, graph versioning, sensitivity/quality overlays, impact traversal, evidence and policy integration.

## Agent tree
Source Discovery Agent; Metadata Collector; Transformation Parser; Lineage Resolver; Model/Prompt Lineage Agent; Agent/Action Lineage Agent; Ownership Agent; Sensitivity Agent; Impact Analyst; Root-Cause Agent; Drift Agent; Governance QA Agent.

## Deterministic services
Stable node/edge IDs; schema/field mapping; parser-derived transforms; event links; versioned graph snapshots; cycle/consistency checks; graph traversal; blast-radius query; change diff; provenance evidence refs.

## Workflow tree
Register systems/assets → ingest metadata/transform/event evidence → create versioned nodes/edges → validate mappings → enrich ownership/sensitivity/quality → query upstream/downstream impact → detect change/drift → alert affected owners/consumers → reconcile missing/conflicting lineage → preserve graph history.

## Integrations / API / data
Databases, warehouses, lakes, ETL/ELT, orchestration, BI, ML platforms, feature stores, AI gateways/RAG, agent systems, files/docs, APIs and data catalogs. Data: metadata/graphs/evidence rather than unnecessary raw business data.

## Monetization / distribution
Assets/nodes/edges, sources/connectors, queries, seats, enterprise/private, API and governance packs. Distribution via data/AI/governance ecosystems.

## Security/privacy/compliance
Lineage metadata can expose sensitive topology. Role-scoped graph views, tenant isolation, sensitivity labels, no raw-data copying by default, secure connector credentials, immutable evidence and purpose-limited queries.

## Failure / edge cases
Dynamic SQL, opaque SaaS transformation, manual spreadsheet export, missing event, undocumented copy, derived embedding, model training snapshot, prompt assembled dynamically, cross-region replication, data deleted but lineage retained, false inferred edge. Inferred and verified lineage must be distinct.

## Scale / overlap
Data catalog → enterprise dependency graph → organization-wide provenance nervous system. Overlap #51 pipeline watchdog, #79 artifact provenance, #99 data contracts. #094 owns enterprise data dependency graph.

## Classification
**DESIGN NOW:** stable typed lineage references across datasets/artifacts/models/agents/decisions/actions, verified-vs-inferred edges, versioned graph and sensitivity overlays.  
**BUILD NOW:** Command Center canonical graph should expand to represent data→Brain→Agent→decision→action lineage before factories proliferate.  
**BUILD BEFORE FIRST COMPANY:** customer connector/graph ingestion platform.  
**COMPANY-SPECIFIC LATER:** commercial catalog/connector packs.  
**SCALE-ONLY:** massive federated enterprise graphs.

# Mandatory 24-part completion block
1. Product Tree: catalog/field-table-dataset/file/ETL/warehouse/BI/model/prompt/agent/action/export/ownership/sensitivity/impact/RCA/API.
2. Feature Tree: node/type/system/owner/edges/mappings/transform version/time/dataset/model/prompt/agent/sensitivity/quality/consumer/evidence.
3. Customer Tree: enterprise/data/analytics/AI/privacy/governance/software/regulated/data provider.
4. Vertical Tree: finance data/health admin/commerce/manufacturing/marketing/SaaS/research/agentic.
5. Brain Tree: explanation/inference candidate edges; canonical lineage evidence-based.
6. Agent Tree: discovery/metadata/parser/resolver/model-prompt/agent-action/ownership/sensitivity/impact/RCA/drift/QA.
7. Service Tree: IDs/schema mapping/parsers/events/version snapshots/consistency/traversal/diff/evidence.
8. Workflow Tree: register→ingest→graph→validate→overlay→query→drift/alert→reconcile/history.
9. Integration Tree: DB/warehouse/lake/ETL/BI/ML/AI/RAG/agents/files/APIs/catalogs.
10. Data Tree: nodes/edges/versions/ownership/sensitivity/quality/evidence.
11. API Tree: assets/lineage/upstream/downstream/impact/changes/evidence.
12. Monetization Tree: assets/nodes/edges/sources/queries/seats/enterprise/API.
13. Distribution Tree: data/AI/governance/OEM.
14. Automation Tree: metadata/impact/drift automatic; inferred edges confidence-labeled.
15. Moat Tree: comprehensive dependency graph, connector coverage, historical change graph.
16. Platform Tree: lineage tool→enterprise graph→data/AI provenance infrastructure.
17. Risk Tree: sensitive topology leak/missing edges/false inference/stale graph/cross-tenant leakage.
18. Scale Tree: team→enterprise→federated graph.
19. Spinoff Tree: impact analysis/model lineage modules; artifact provenance/data contracts remain adjacent.
20. Command Center Dependencies: canonical graph, data/artifact provenance, Brain/Agency events, sensitivity, analytics.
21. Design-Now Requirements: every reusable output/action should expose upstream source and transformation lineage refs.
22. Build-Now Requirements: extend Command Center command/data graph contracts to support end-to-end data→decision→action provenance.
23. Safe-to-Defer Requirements: enterprise connectors/commercial catalog/federation.
24. Autonomous Mature State: lineage updates continuously and impact is instantly queryable; humans resolve opaque/unverifiable transformations and stewardship decisions.

## Saturation result
Further branches converge into pipeline quality, digital provenance and data contracts already represented.