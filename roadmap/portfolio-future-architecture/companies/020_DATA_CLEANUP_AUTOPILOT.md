# Company 020 — Data Cleanup Autopilot

**Company ID:** `company:future:020`  
**Primary project:** `project:company:future:020`  
**Roadmap version:** `COMPANY-020-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer production-data mutation.

## Business identity

Purpose: continuously identify, explain and safely repair duplicate, malformed, inconsistent, incomplete and outdated business data across systems.

Problem: CRMs, ERPs, catalogs, spreadsheets and databases accumulate duplicates, format drift, conflicting records and taxonomy inconsistencies that corrupt automation and analytics.

Value: repeatable data hygiene with confidence, provenance, preview/rollback and survivorship rules.

Delivery: SaaS, batch/API, data-warehouse app, CRM/ERP plugins, private/self-hosted worker, embedded/OEM cleansing engine.

## Product tree

Duplicate Detection; Entity Resolution/Merge; Normalization/Standardization; Validation; Enrichment; Contact/Company Cleanup; Address/Phone/Email Normalization; SKU/Product Cleanup; Taxonomy/Category Cleanup; Reference/Master Data Matching; Missing-Value Repair Recommendations; Malformed Record Repair; Cross-System Reconciliation; Data Quality Score; Recurring Hygiene Monitor; Merge Preview/Simulation; Survivorship Rule Engine; Correction/Undo Ledger; API/SDK; Vertical Data Packs.

## Feature/customer/vertical tree

Features: exact/fuzzy/semantic matching, field weights, entity graph, confidence, golden record, source priority, recency, merge rules, split/unmerge, format/unit/locale normalization, domain/reference validation, duplicate clusters, bulk review, sampling, audit, provenance, data contracts, rule versioning, rollback, scheduled scans, alerts, import/export.

Customers: CRM/revops, ecommerce/catalog, finance ops, data/analytics, HR, support, logistics, nonprofits, agencies, integrators, enterprise MDM/data governance teams, SaaS platforms.

Verticals: contacts/accounts, product catalogs, supplier/vendor masters, property records, inventory/SKUs, credential/license records, support/customer records, finance master data. Sensitive/regulated data gets stricter rules.

## Brain / architecture

Brain understands entity semantics and conflicting evidence, proposes merge/survivorship rules and explains uncertain matches. Deterministic validation/normalization and transaction-safe merge/rollback own actual mutations. LLM/embeddings can assist semantic matching/category inference but cannot silently overwrite source truth.

Architecture: staging area, schema/data-profile engine, matching/blocking, entity graph, rules engine, reference services, change-set planner, transactional apply/rollback, lineage/provenance, quality metrics, scheduler.

## Agents

Data Profiler, Duplicate Cluster Agent, Entity Resolution Analyst, Survivorship Planner, Normalization Agent, Validation Agent, Enrichment Planner, Taxonomy Agent, Cross-System Reconciliation Agent, Data Quality Monitor, Merge QA Agent, Privacy Agent, Integration Agent.

## Deterministic services

Connectors; staging; schema profiler; hash/fuzzy matching; normalization libraries; reference validation; entity graph; merge engine; transaction/change set; rollback; audit; scheduler; quality score; data-contract validator; export.

## Workflow

Connect/read → profile → identify anomalies/duplicates → cluster/match → confidence + source/provenance → propose correction/merge → preview impact → policy/human approval threshold → transactional apply → verify constraints/reconcile → retain undo evidence → recurring scan.

## Integrations / API / data

CRM, ERP, ecommerce/PIM, databases/warehouses, spreadsheets/files, support, HRIS, accounting, MDM/data catalogs. API for profiling, matching, normalize, validate, merge proposal, apply/rollback (protected), quality score.

Data moat: entity matching models/rules, normalization/taxonomy packs, correction outcomes and source-quality profiles; customer data stays isolated.

## Monetization / distribution

Rows/records, connectors, scheduled jobs, seats, API, enterprise/private, vertical packs, managed cleanup, OEM. Distribution via CRM/data/warehouse marketplaces, integrators, data consultants, ecommerce ecosystems.

## Security/privacy

Production writes protected; staged previews; least privilege; field masking; PII classification; no enrichment from unlawful sources; retention/delete/export; irreversible merge prohibited without recoverable evidence where possible.

## Failure / edge cases

False duplicate, household/shared contact, renamed company, reused phone/email, product variant mistaken duplicate, locale address differences, conflicting authoritative sources, cyclic merge, downstream foreign-key impact, stale cache, concurrent edit. Use optimistic versions, confidence, merge locks, reversible change sets and post-apply verification.

## Scale/platform/overlap

Small CSV/CRM → recurring multi-system hygiene → enterprise MDM assistant → embedded data-quality engine. Overlap #55 catalog, #60 migration, #99 data contracts; #020 stays general cleanup/hygiene.

## Classification

**DESIGN NOW:** staging-before-mutation, provenance/version, reversible change sets, company data isolation, deterministic verification.  
**BUILD NOW:** Command Center canonical data/import/reconciliation should preserve these patterns after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company-specific connector/scoping and rollback/evidence interfaces.  
**COMPANY-SPECIFIC LATER:** cleanup product/connectors/models/customer UI.  
**SCALE-ONLY:** massive entity-resolution clusters/global reference data.

# Mandatory 24-part completion block

1. Product Tree: dedupe/entity/normalize/validate/enrich/contact/company/address/SKU/taxonomy/master/missing/malformed/reconcile/quality/monitor/preview/survivorship/undo/API/packs.
2. Feature Tree: exact/fuzzy/semantic, weights/graph/confidence/golden/source/merge/split/locale/rules/bulk/audit/provenance/rollback/scheduling.
3. Customer Tree: CRM/ecommerce/finance/data/HR/support/logistics/nonprofit/agencies/integrators/enterprise/platforms.
4. Vertical Tree: contacts/accounts/catalogs/vendors/property/inventory/credentials/support/finance masters.
5. Brain Tree: semantic entity reasoning and merge recommendations; deterministic protected mutation.
6. Agent Tree: profile/duplicate/entity/survivorship/normalization/validation/enrichment/taxonomy/reconcile/quality/QA/privacy/integration.
7. Service Tree: connectors/staging/profile/matching/normalize/reference/graph/merge/change-set/rollback/audit/schedule/quality/contracts.
8. Workflow Tree: read→profile→detect→cluster→propose→preview→approve→apply→verify→undo evidence→repeat.
9. Integration Tree: CRM/ERP/PIM/DB/warehouse/spreadsheets/support/HR/accounting/MDM/catalog.
10. Data Tree: schemas/profiles/entities/clusters/rules/proposals/change sets/quality/provenance.
11. API Tree: profile/match/normalize/validate/propose/apply/rollback/quality.
12. Monetization Tree: records/connectors/jobs/seats/API/enterprise/private/packs/managed/OEM.
13. Distribution Tree: CRM/data/warehouse marketplaces, integrators/consultants/commerce.
14. Automation Tree: profiling/detection/recommendation/normalization/validation; risky merges gated.
15. Moat Tree: match/normalization/taxonomy packs, correction outcomes, source quality.
16. Platform Tree: cleanup jobs→continuous data hygiene→MDM/data-quality infrastructure.
17. Risk Tree: destructive false merge, PII leakage, bad enrichment, source conflict, concurrent writes.
18. Scale Tree: files→multi-system→enterprise MDM→embedded global engine.
19. Spinoff Tree: adjacent #55/#60/#99 already cover catalog/migration/contracts.
20. Command Center Dependencies: canonical data/provenance, import staging, rollback, policy, isolation, connector registry.
21. Design-Now: reversible staged mutations and version/provenance contracts.
22. Build-Now: strengthen shared data reconciliation interfaces after reverse-map.
23. Safe-to-Defer: customer cleanup product/model/connectors/pricing.
24. Autonomous Mature State: scans/validation/low-risk normalization run continuously; ambiguous merges queue review; James handles only strategic/protected exceptions.

## Saturation result

Further branches are domain-specific cleanup packs or catalog/migration/data-contract products already in the portfolio.
