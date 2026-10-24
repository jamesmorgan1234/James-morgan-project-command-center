# Company 006 — Data Subscription Company

**Company ID:** `company:future:006`  
**Primary project:** `project:company:future:006`  
**Roadmap version:** `COMPANY-006-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: create lawful, provenance-rich, continuously maintained data products that customers can consume as files, feeds, APIs, dashboards, reports, alerts and embedded datasets.

Customer problem: public/licensed/first-party data is fragmented, stale, inconsistent, difficult to normalize and expensive to maintain internally.

Value: dependable cleaned datasets with known source lineage, freshness, quality, change history and licensing terms.

Delivery: subscription datasets, API/feed, historical archive, dashboard/report, alerts, custom slices, private feed, embedded/OEM data, benchmark/index products, marketplace where justified.

## Product tree

- Dataset subscriptions: entity, market, operations, pricing, compliance/public records, technology/developer, ecommerce/catalog, geographic, industry-specific.
- Change feeds: entity/status/pricing/product/regulation/website/source-change streams.
- Historical archives and point-in-time snapshots.
- Enrichment APIs and batch enrichment.
- Benchmark datasets and proprietary indices.
- Research reports and executive dashboards derived from data.
- Alert products on threshold/change/anomaly.
- Private customer-specific feeds and managed data pipelines.
- Embedded/OEM datasets licensed into software products.
- Data marketplace/catalog across internal products when rights permit.
- Data-quality/freshness metadata product.
- Developer SDK/query tools.
- Synthetic/derived datasets only where provenance and rights are clear.

## Feature/customer/vertical expansion

Features: schema/versioning, source provenance, field definitions, quality score, freshness SLA, historical revision, point-in-time query, filters, joins, bulk export, incremental sync, API/webhook, alert rules, saved queries, lineage, license/use restrictions, customer org/roles, usage/metering, data residency, deletion/correction handling where applicable.

Customers: analysts, developers, startups, SMB/enterprise ops, investors/researchers where legal, ecommerce, SaaS, consultants, agencies, marketplaces, education/nonprofit/public sector, OEM platforms.

Verticals: ecommerce/catalog/pricing; SMB/business records; software/developer ecosystem; real estate/property public data where lawful; supply chain/logistics; compliance/regulation; labor/credential public data; public procurement; market/competitor intelligence; environmental/geographic; finance-adjacent public/reference data. Each vertical requires source-rights review and data-sensitivity classification.

## Brain capability tree and architecture

Brain knows source contracts, schemas, entity resolution, quality/freshness, customer use cases and anomalies. It reasons about source conflicts, coverage, missingness and product opportunities; predicts freshness failures and demand; recommends new fields/sources/indices; never invents unknown facts. Deterministic ETL/entity resolution rules, relational/object/search stores, provenance graph, anomaly/statistical quality, scheduled/event ingestion; LLM only for semantic extraction/classification/research summaries with source evidence.

Actions: READ/ANALYZE/RECOMMEND broadly on authorized data; automated ingestion/normalization within source terms; new source acceptance, licensing, customer-specific sensitive processing and public publication require policy/approval.

## Agent tree

Source Discovery Analyst (no unauthorized scraping), Source Contract/Licensing Reviewer, Ingestion Monitor, Schema/Taxonomy Agent, Entity-Resolution Analyst, Data Quality Agent, Freshness Monitor, Anomaly Agent, Index/Benchmark Analyst, Customer Data Product Planner, Documentation Agent, Support/Data Diagnostics Agent, Privacy/Compliance Agent, Cost/Storage Optimizer.

## Deterministic services

Connectors/ingestors; schedulers; ETL/ELT; schema registry; entity resolution; dedupe; validation; quality/freshness engine; provenance/lineage; change-data capture; snapshot/version store; API/query gateway; alert engine; cache/search; usage/meter; license-policy enforcement; export packaging; retention/deletion workflows.

## Inputs / outputs / workflows

Inputs: public/licensed/owner-authorized sources, customer-authorized data, schema definitions, source terms, correction events, quality tests.

Outputs: datasets, snapshots, APIs/feeds, alerts, reports, dashboards, indices, provenance/quality metadata.

Workflow: source register → rights/sensitivity classification → ingest → validate → normalize/entity-resolve → compare/conflict → quality/freshness score → version/snapshot → publish authorized product → monitor corrections/drift → notify/rebuild.

## Integrations / developer ecosystem

Cloud/object stores, databases/warehouses/lakes, API sources, SFTP/files, webhooks, data catalogs, BI tools, notebooks, SDKs, SQL endpoints, Git/schema CI, billing/entitlement, customer ETL tools. Developer APIs for dataset catalog/schema/query/export/change-feed/quality/provenance.

## Data architecture / moat

Raw source zone where legally permitted, normalized canonical entities, source-event ledger, provenance graph, point-in-time history, quality/freshness metrics, correction lineage, customer entitlements. Moats: difficult source integration, normalization/entity graph, long history, quality reputation, proprietary indices and customer integration—not unlawful exclusivity or copied restricted data.

## Monetization / distribution

Per dataset, seats, API/records, feed frequency, historical depth, premium freshness, alerts, benchmarks, custom/private feeds, OEM licenses, enterprise commitments, reports, managed enrichment. Distribution via developer docs/API marketplaces, analyst/industry content, partners/integrators, embedded OEM and data catalogs; no marketing execution now.

## Security/privacy/compliance

Rights/licensing registry, source terms, purpose restrictions, PII classification, correction/deletion workflows, regional rules, encrypted storage, scoped exports, customer isolation, no secret/private data republishing, source attribution, legal review flags where needed.

## Failure/edge cases

Source disappears/changes terms, schema drift, duplicate entities, conflicting sources, stale feed, retroactive correction, poison/malicious input, scraping blocks, rate limits, license revocation, derived-data ambiguity, customer misuse. Require source quarantine, explicit confidence, rollback/rebuild, lineage, stale markers, rights shutdown and export revocation where contractually required.

## Scale / platform / spinoffs

Micro: one/few datasets. ~$100K ARR: automated pipelines/quality/support. ~$1M: multiple verticals, historical depth, enterprise feeds. ~$10M: large source graph, regional processing, OEM. ~$100M+: data platform/marketplace/indices if rights/economics justify.

Overlap with #11 benchmarking, #13 competitive intelligence, #14 website changes, #16 regulation, #94 lineage. Keep #006 focused on reusable paid data products.

## Classification

**DESIGN NOW:** provenance/source-rights metadata, versioned data contracts, company isolation, provider/source abstraction, quality/freshness truth states.  
**BUILD NOW:** generic Command Center provenance/data-contract/provider interfaces after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** data-source registry, isolation, metering/entitlement, retention/export contracts.  
**COMPANY-SPECIFIC LATER:** actual datasets/sources/licensing/pricing.  
**SCALE-ONLY:** marketplace/global regional data plane.

# Mandatory 24-part completion block

1. **Complete Product Tree:** datasets, APIs, feeds, history, alerts, dashboards/reports, enrichment, benchmarks/indices, private/OEM, marketplace, quality metadata.
2. **Complete Feature Tree:** schema/version/provenance/quality/freshness/history/query/export/change/alerts/roles/usage/rights/residency.
3. **Complete Customer Tree:** developers, analysts, startups, enterprise, ecommerce/SaaS, consultants/agencies, marketplaces, public/education/OEM.
4. **Complete Vertical Tree:** commerce, business records, developer ecosystem, property/public, logistics, regulation, credentialing, procurement, market intelligence, geo/environment.
5. **Complete Brain Capability Tree:** source conflict/quality/product reasoning, forecast, anomaly, recommendation, provenance verification; no invented facts.
6. **Complete Agent Tree:** source, licensing, ingestion, schema, entity, quality, freshness, anomaly, benchmark, product, docs/support/privacy/cost.
7. **Complete Service Tree:** connectors, ETL, schema, entity/dedupe, quality/freshness, lineage, CDC, snapshots, API, alerts, cache/search, meter, rights/export/retention.
8. **Complete Workflow Tree:** register source→rights→ingest→normalize→resolve→verify→version→publish→monitor/correct.
9. **Complete Integration Tree:** sources, storage/warehouse/lake, files/webhooks, BI/notebooks/catalogs, SDK/SQL, billing/ETL.
10. **Complete Data Tree:** source/raw, canonical entities, provenance, history, quality/freshness, corrections, entitlements.
11. **Complete API/Developer Tree:** catalog/schema/query/export/change/quality/provenance SDKs/feeds.
12. **Complete Monetization Tree:** dataset/API/record/frequency/history/freshness/alert/benchmark/custom/OEM/enterprise/report/managed.
13. **Complete Distribution Tree:** docs/marketplaces/industry content/integrators/OEM/catalogs.
14. **Complete Automation Tree:** ingestion, normalization, quality, freshness, versioning, alerts, correction rebuilds.
15. **Complete Moat Tree:** source graph, normalized entities, long history, quality, indices, integrations.
16. **Complete Platform Tree:** dataset product → multi-data subscription → embedded/OEM → optional marketplace/index platform.
17. **Complete Risk Tree:** licensing, privacy, stale/conflict, source loss, malicious input, derived-rights ambiguity.
18. **Complete Scale Tree:** few datasets → vertical portfolio → enterprise/OEM → regional marketplace.
19. **Complete Spinoff Tree:** existing #11/#13/#14/#16/#94 cover adjacent specialist businesses.
20. **Command Center Dependencies:** data/provenance/provider/capability registries, isolation, billing/entitlements, observability, retention.
21. **Design-Now Requirements:** source/provenance/version/quality/right-to-use contracts.
22. **Build-Now Requirements:** only shared data/provider interfaces after reverse-map.
23. **Safe-to-Defer Requirements:** source acquisition, specific datasets, customer portal/pricing/OEM/marketplace.
24. **Autonomous Mature State:** pipelines/quality/freshness/alerts/support diagnostics operate automatically; Brain recommends new products/sources; James handles licensing/strategy/protected exceptions.

## Saturation result

Additional branches are specialized datasets/vertical packs or existing neighboring intelligence businesses, not new top-level companies.
