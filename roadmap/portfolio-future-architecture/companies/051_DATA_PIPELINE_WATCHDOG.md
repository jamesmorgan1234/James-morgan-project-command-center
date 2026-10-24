# Company 051 — Data-Pipeline Watchdog

**Company ID:** `company:future:051`  
**Primary project:** `project:company:future:051`  
**Roadmap version:** `COMPANY-051-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no production pipeline mutation, schema change or data deletion.

## Business identity

Purpose: continuously verify data pipelines for freshness, completeness, correctness, schema compatibility, lineage and downstream impact before bad data silently contaminates analytics, models, agents or business decisions.

Problem: data pipelines often fail partially rather than completely—late feeds, missing partitions, duplicate events, schema drift, distribution shifts and broken lineage can remain undetected until downstream systems are wrong.

Value: early anomaly detection, dependency-aware impact analysis, evidence-backed root cause, safe remediation guidance and trustworthy data-quality SLAs.

## Complete product tree

Freshness Monitor; Completeness/Volume Monitor; Schema Drift Monitor; Distribution/Statistical Drift; Duplicate/Uniqueness Checks; Null/Validity Rules; Referential Integrity Checks; Lineage Graph; Dependency Health; Data Contract Registry; Quality Scorecards; Incident Console; Root-Cause Assistant; Replay/Backfill Planner; Reconciliation Engine; CI/CD Data Tests; Warehouse/Lake/Lakehouse Packs; Streaming Packs; ML/AI Data Reliability Pack; API/SDK; Embedded Checks; Enterprise/Private Deployment; Managed Data Reliability.

## Feature/customer/vertical tree

Features: datasets/streams/tables/files, owners, schedules, expected arrival, SLAs, row/event counts, partitions, schema/version, field types, constraints, distributions, lineage, upstream/downstream dependencies, quality rules, incidents, quarantine, backfill plan, reconciliation, confidence/evidence and historical quality trends.

Customers: data teams, analytics teams, SaaS companies, enterprises, marketplaces, fintech/data-heavy platforms, ML teams, data vendors, ETL providers, consultants/MSPs.

Verticals: SaaS analytics, ecommerce, finance data infrastructure, ad/marketing data, logistics, IoT, healthcare administration, retail, marketplaces, research/data products. Sensitive/regulatory domains need stricter governance packs.

## Brain capability tree / architecture

Brain analyzes anomaly context, lineage and recent changes to rank likely causes and remediation paths. Deterministic contracts/rules own schema/quality enforcement, freshness SLAs and safe replay constraints. Brain cannot mutate production data, drop fields or backfill blindly.

Architecture: connector/collector layer, schema/data-contract registry, time-series quality metrics, lineage graph, rule engine, statistical anomaly service, incident state machine, replay/backfill planner, reconciliation engine, provenance ledger, LLM for grounded RCA and explanation.

## Agent tree

Pipeline Monitor Agent; Freshness Agent; Schema Agent; Distribution Agent; Lineage Agent; Dependency Impact Agent; Root-Cause Investigator; Contract Compliance Agent; Replay/Backfill Planner; Reconciliation Agent; Incident Agent; QA/Data Governance Agent.

## Deterministic services

Dataset registry; schema registry; data contracts; schedulers; quality rules; hash/count checks; uniqueness/null/reference validators; partition tracking; lineage ingestion; checkpointing; replay idempotency; quarantine; incident ledger; safe backfill controls.

## Workflow tree

Observe pipeline/dataset → validate schedule/freshness → run structural/semantic quality checks → compare schema/distribution/volume → update lineage impact → open incident when threshold/contract fails → isolate/quarantine if configured → investigate recent changes/upstream state → recommend or authorize bounded replay/backfill → verify reconciliation → close with evidence and updated reliability baseline.

## Integrations / API / data

Warehouses, lakes/lakehouses, ETL/ELT, orchestration tools, streaming systems, databases, object storage, BI, ML feature stores, model pipelines, Git/CI, incident/ticketing, catalogs. APIs for datasets, schemas, contracts, checks, incidents, lineage, replay plans and quality metrics.

Data: metadata and quality telemetry by default; raw customer payload access minimized and policy-controlled. Customer data isolation is mandatory.

## Monetization / distribution

Datasets/tables, pipeline runs, events/rows inspected, connectors, seats, retention, lineage nodes, enterprise/private, API, managed service, premium ML/streaming packs. Distribution through data-platform marketplaces, data engineering consultancies and developer ecosystems.

## Security/privacy/compliance

Metadata can reveal sensitive structure. Least privilege, metadata-first design, scoped sampling, secret redaction, row-level masking, tenant isolation, retention controls and explicit prohibition on unapproved destructive remediation.

## Failure / edge cases

Late but valid feeds, timezone/DST shifts, seasonal volume changes, intentional schema migration, partial partitions, source replay, duplicate delivery, eventual consistency, sampling bias, bad quality rule, lineage lag, silent semantic change, source outage, warehouse outage. Unknowns remain explicit and alerts need suppression/change-window context.

## Scale / overlap

Single warehouse → distributed data platform → multi-cloud data reliability control plane. Overlap #49 software reliability, #72 API contract drift, #94 data lineage, #99 machine-enforced data contracts. #051 owns runtime pipeline/data-quality health.

## Classification

**DESIGN NOW:** provenance/versioning, data contracts, lineage hooks, idempotent replay, incident/evidence model, isolation.  
**BUILD NOW:** Command Center canonical-data/provider layers should preserve version/provenance/quality hooks found in this reverse-map.  
**BUILD BEFORE FIRST COMPANY:** dataset registry, connector abstractions, quality-rule engine, lineage graph and replay safety.  
**COMPANY-SPECIFIC LATER:** customer connectors/UI/quality packs/pricing.  
**SCALE-ONLY:** massive streaming telemetry and cross-region data reliability fabric.

# Mandatory 24-part completion block

1. Product Tree: freshness/completeness/schema/drift/duplicates/rules/lineage/contracts/scorecards/incidents/RCA/replay/reconciliation/CI/API/managed.
2. Feature Tree: schedule/SLA/counts/partitions/schema/constraints/distributions/lineage/incidents/quarantine/backfill/evidence.
3. Customer Tree: data/analytics/SaaS/enterprise/marketplace/ML/data vendor/ETL/MSP.
4. Vertical Tree: SaaS/commerce/finance data/marketing/logistics/IoT/health admin/retail/research.
5. Brain Tree: anomaly/RCA/remediation reasoning; destructive mutation prohibited without protected controls.
6. Agent Tree: pipeline/freshness/schema/distribution/lineage/impact/RCA/contracts/replay/reconcile/incident/QA.
7. Service Tree: registry/schema/contracts/scheduler/validators/partitions/lineage/checkpoints/idempotency/quarantine.
8. Workflow Tree: observe→validate→detect→impact→incident→investigate→replay plan→verify→close.
9. Integration Tree: warehouses/lakes/ETL/orchestrators/streams/DB/object storage/BI/ML/Git/incidents/catalogs.
10. Data Tree: metadata/schemas/contracts/checks/quality metrics/lineage/incidents/replay evidence.
11. API Tree: datasets/schemas/contracts/checks/incidents/lineage/replay/quality.
12. Monetization Tree: datasets/runs/events/connectors/seats/retention/lineage/API/enterprise/managed.
13. Distribution Tree: data marketplaces/consultancies/developer platforms.
14. Automation Tree: monitoring/detection/impact/reconciliation automated; data-changing remediation gated.
15. Moat Tree: connector breadth, lineage graph, anomaly/outcome history, vertical quality packs.
16. Platform Tree: watchdog→data reliability OS→contract/lineage quality control plane.
17. Risk Tree: false positives, missed drift, destructive replay, sensitive data exposure, stale lineage.
18. Scale Tree: warehouse→enterprise data mesh→global streaming fabric.
19. Spinoff Tree: contract registry/lineage products overlap #94/#99; keep #051 focused on runtime quality.
20. Command Center Dependencies: provenance, versioning, events, incidents, provider registry, privacy, recovery, data contracts.
21. Design-Now Requirements: canonical version/provenance/quality hooks and idempotent replay semantics.
22. Build-Now Requirements: ensure Command Center data platform supports integrity/health evidence and lineage references.
23. Safe-to-Defer Requirements: customer connectors/streaming collectors/UI/pricing/vertical packs.
24. Autonomous Mature State: routine quality incidents detect, isolate and reconcile automatically; humans handle semantic ambiguity and high-risk backfills.

## Saturation result

Further coherent branches converge into data lineage, data contracts, API drift or broader software reliability companies already represented.