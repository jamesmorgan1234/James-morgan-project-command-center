# Company 015 — Business Intelligence Autopilot

**Company ID:** `company:future:015`  
**Primary project:** `project:company:future:015`  
**Roadmap version:** `COMPANY-015-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: convert trusted operational/financial/product data into continuously updated KPI models, anomaly explanations, forecasts, scenarios and executive recommendations.

Problem: dashboards show metrics but require humans to notice changes, trace root causes and decide what to investigate; definitions are inconsistent and causal claims are often overstated.

Value: proactive, evidence-linked BI with semantic metric governance and explicit uncertainty.

Delivery: SaaS dashboard, natural-language analyst, scheduled briefs, embedded BI, alert API, private/VPC deployment, vertical KPI packs.

## Product tree

KPI/Metric Registry; Executive Dashboard; Natural-Language Analyst; Anomaly Detection; Driver/Root-Cause Explorer; KPI Trees; Forecasting; Scenario/What-If; Goal/Target Tracking; Automated Daily/Weekly/Monthly Briefs; Alert Center; Cross-System Reconciliation; Cohort/Segment Analysis; Funnel/Retention Analysis; Unit Economics; Operational Capacity; Embedded BI; Data Quality/Freshness; Recommendation/Action Queue; Vertical KPI Packs; API/SDK/OEM.

## Feature/customer/vertical tree

Features: semantic metric definitions, dimensions, time windows, data lineage, confidence, freshness, comparisons, annotations, forecasts, scenario assumptions, drill-down, correlations vs causal labeling, saved questions, scheduled reports, alert thresholds, access controls, row/column security, export, accessible/localized dashboards.

Customers: executives, finance, ops, sales/revops, marketing, product, support, engineering, HR, multi-location/franchise, SMB through enterprise, SaaS embedding analytics.

Verticals: SaaS, ecommerce/retail, services/agencies, field service, construction/home services, logistics, subscription, support centers, software/AI, nonprofit/education; each with metric ontology and benchmarks.

## Brain / architecture

Brain knows metric definitions, lineage, business goals, historical events and data quality. It explains anomalies, generates hypotheses, plans drill-downs, forecasts/scenarios and recommends actions, but labels assumptions and correlation/causality honestly.

Architecture: semantic metric layer, warehouse/query engine, lineage/provenance, time-series/statistics, anomaly/forecasting, experiment/causal tools where evidence permits, search/RAG over definitions/decisions, LLM for NL query/explanation, deterministic SQL/metric evaluation and access controls.

## Agents

Executive Analyst, Metric Ontology Agent, Data Quality Agent, Anomaly Agent, Root-Cause Investigator, Forecast Agent, Scenario Planner, Funnel/Cohort Agent, Unit Economics Agent, Goal/Target Agent, Briefing Agent, Recommendation QA Agent, Integration/Lineage Agent.

## Deterministic services

Connectors/ETL; semantic layer; query planner; metric engine; row/column policy; freshness/quality; anomaly/statistics; forecasting; scheduler; alerting; report renderer; lineage; cache; export; audit.

## Workflow

Connect source → define/version metrics → map lineage/access → validate freshness → compute → detect anomaly/goal variance → investigate dimensions/related events → generate evidence-linked explanation/hypotheses → forecast/scenario → recommend → owner/team acts through separately authorized systems → verify outcome.

## Integrations / data / APIs

Warehouses, DBs, spreadsheets, accounting, CRM, product analytics, support, ecommerce, marketing, HRIS, engineering/observability, finance. APIs for metrics, query, alerts, forecasts, scenarios, briefs, semantic definitions and lineage.

Data moat: metric ontology, semantic mappings, causal/incident annotations, verified recommendations/outcomes and vertical KPI packs. Customer raw data remains isolated.

## Monetization / distribution

Seats, data sources, query/compute, metric packs, alerts/briefs, embedded/OEM, private deployment, enterprise, premium forecasts/vertical packs, managed analytics. Distribution via data/warehouse/BI ecosystems, accounting/CRM/product integrations, consultants and PLG.

## Security/privacy/failure

Strict data access, PII classification, row-level security, secret refs, query sandboxing, no unsupported causal claims. Failures: stale data, definition drift, double-counting, missing late events, timezone/currency mismatch, Simpson’s paradox, anomaly noise, hallucinated SQL/explanation. Use deterministic metrics, lineage/freshness, query validation and uncertainty.

## Scale / platform

Micro dashboards → departmental BI → enterprise semantic layer → embedded analytical control plane → potential autonomous business-observation platform at large scale.

Overlap #11 benchmarking, #95 AI ROI. #015 remains internal/business analytics and decision intelligence.

## Classification

**DESIGN NOW:** metric/lineage/provenance/truth-state interfaces, data access isolation, event/evidence linkage.  
**BUILD NOW:** Command Center portfolio analytics/observability should use versioned metrics after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** tenant semantic layer, BI connector/query interfaces, cost/privacy controls.  
**COMPANY-SPECIFIC LATER:** customer analytics product/vertical packs/pricing.  
**SCALE-ONLY:** distributed query/embedded enterprise fleets.

# Mandatory 24-part completion block

1. Product Tree: registry/dashboard/NL/anomaly/root cause/KPI trees/forecast/scenario/goals/briefs/alerts/reconcile/cohort/funnel/unit economics/capacity/embedded/quality/recommendations/packs/API.
2. Feature Tree: definitions/lineage/freshness/confidence/drilldowns/forecast/assumptions/alerts/access/export/localization.
3. Customer Tree: executive/finance/ops/sales/marketing/product/support/engineering/HR/SMB-enterprise/platforms.
4. Vertical Tree: SaaS, commerce, services, field/construction, logistics, subscription, support, software/AI, nonprofit/education.
5. Brain Tree: analyze/explain/hypothesize/forecast/scenario/recommend with explicit uncertainty.
6. Agent Tree: executive/ontology/quality/anomaly/root-cause/forecast/scenario/cohort/economics/goals/briefing/QA/integration.
7. Service Tree: connectors/ETL/semantic/query/metric/policy/quality/anomaly/forecast/scheduler/alerts/render/lineage/cache/audit.
8. Workflow Tree: source→metric→validate→compute→detect→investigate→explain→forecast→recommend→verify.
9. Integration Tree: warehouse/DB/spreadsheet/accounting/CRM/product/support/commerce/marketing/HR/devops/finance.
10. Data Tree: metrics/definitions/lineage/source versions/results/alerts/scenarios/recommendations/outcomes.
11. API Tree: metric/query/alert/forecast/scenario/brief/definition/lineage.
12. Monetization Tree: seats/sources/compute/packs/alerts/OEM/private/enterprise/managed.
13. Distribution Tree: warehouse/BI/accounting/CRM/product ecosystems, consultants, PLG.
14. Automation Tree: refresh/quality/anomaly/investigation/briefs/forecasts/alerts/recommendations.
15. Moat Tree: semantic mappings, vertical KPI packs, outcome history, lineage trust.
16. Platform Tree: dashboard→autonomous BI→embedded decision intelligence.
17. Risk Tree: data leakage, stale/wrong metrics, false causality, query errors, cost runaway.
18. Scale Tree: team→department→enterprise→embedded/global.
19. Spinoff Tree: existing #11/#95 absorb benchmarking/AI value attribution.
20. Command Center Dependencies: data platform, metrics, provenance, Brain, observability, isolation, resource/cost governors.
21. Design-Now: semantic metric/truth/provenance and scoped data access.
22. Build-Now: portfolio metrics/analytics interfaces after reverse-map.
23. Safe-to-Defer: customer BI product/connectors/pricing/vertical packs.
24. Autonomous Mature State: data refresh/anomaly/root-cause/forecast/briefs run continuously; humans act on material decisions.

## Saturation result

Additional branches are vertical BI packs, benchmarking or AI ROI products already represented; no new top-level company emerges.
