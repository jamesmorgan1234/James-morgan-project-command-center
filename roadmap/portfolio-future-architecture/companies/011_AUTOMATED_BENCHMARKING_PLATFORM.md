# Company 011 — Automated Benchmarking Platform

**Company ID:** `company:future:011`  
**Primary project:** `project:company:future:011`  
**Roadmap version:** `COMPANY-011-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: produce trustworthy peer benchmarks across financial, operational, sales, marketing, support, product, engineering, AI, HR and industry metrics while protecting customer confidentiality.

Problem: companies lack context for KPIs; public averages are stale, incomparable or poorly segmented; internal teams waste time collecting peer data and normalizing definitions.

Value: normalized benchmark definitions, cohorting, confidence, trend, peer recommendations and proprietary indices.

Delivery: SaaS dashboards, benchmark reports, API, embedded analytics, industry packs, private peer groups, white-label/OEM benchmark modules.

## Product tree

- Financial Benchmarks — revenue growth, margins, spend mix, runway/cash efficiency, unit economics where comparable.
- Operational Benchmarks — cycle time, throughput, utilization, quality, service levels.
- Sales/RevOps Benchmarks — pipeline, conversion, velocity, retention/expansion.
- Marketing Benchmarks — channel efficiency, conversion, CAC-related measures where definitions align.
- Support Benchmarks — volume, resolution, repeat contact, satisfaction, QA.
- Product Benchmarks — activation, engagement, retention, feature adoption.
- Engineering Benchmarks — delivery, reliability, incident/change metrics.
- AI Benchmarks — model/agent quality/cost/latency/reliability/ROI.
- HR/People Benchmarks — hiring/retention/training metrics with privacy controls.
- Industry/Geographic/Size Cohorts.
- Proprietary Indices and composite scores.
- Peer Recommendation Engine.
- Benchmark API/Embedded BI.
- Executive Benchmark Reports.
- Private Consortium/Peer Group Benchmarking.
- Data Definition Registry and Metric Translation Service.
- Benchmark Experiment/Scenario Tools.

## Feature/customer/vertical trees

Features: metric definitions, mappings, cohort filters, minimum cohort size, anonymization, winsorization/outlier policy, time periods, currency/unit normalization, confidence intervals, percentile bands, trend, peer selection, data-quality scores, source provenance, private cohorts, export/API, alerts, comparisons, scenario targets, role access, accessible/localized dashboards.

Customers: SMB/midmarket/enterprise leaders, finance/ops/revops/product/engineering/support/AI teams, consultants, PE/VC operating teams where lawful, associations, franchises, multi-location businesses, SaaS platforms embedding benchmarks.

Verticals: SaaS, ecommerce/retail, agencies/services, field service, construction/home services, logistics, support centers, software/AI, healthcare admin, nonprofit, education, franchise/multi-location. Vertical packs must standardize definitions before comparison.

## Brain capability tree / architecture

Brain understands metric semantics, cohort comparability, missingness, confounders and distribution. It reasons about whether a benchmark is meaningful, identifies drivers and recommends realistic improvement ranges. It must not invent peer data or reveal identifiable competitors.

Architecture: deterministic metric registry/normalization, privacy thresholding, statistical engine, time-series, cohort query layer, data warehouse, anomaly/outlier handling; LLM for mapping messy customer metric labels and explaining results, always grounded in metric definitions and aggregate evidence.

## Agent tree

Metric Ontology Agent, Data Mapping Agent, Cohort Analyst, Statistical QA Agent, Privacy Threshold Agent, Benchmark Insight Agent, Industry Pack Agent, Index Designer, Data Quality Agent, Executive Report Agent, API/Integration Agent, Customer Success Diagnostics Agent.

## Deterministic services

Metric schema registry; ingest/ETL; normalization; identity/tenant isolation; anonymization/aggregation; minimum cohort enforcement; statistical percentile/confidence engine; cohort query; time-series; index calculator; data-quality scoring; API/cache; audit; export.

## Inputs / outputs / workflows

Inputs: customer-authorized metrics, public/licensed benchmark data, metric schemas, cohort attributes, time periods, currencies/units.

Outputs: percentiles, peer bands, indices, trend, gaps, recommendations, reports, API responses.

Workflow: ingest → validate definitions → map/normalize → quality/privacy checks → assign eligible cohorts → aggregate → statistical validation → publish benchmark → monitor sample drift → revise definitions/cohorts with version evidence.

## Integrations / API

Warehouses, BI, accounting, CRM, support, analytics, HRIS, engineering/devops, AI observability, spreadsheets, data platforms. API for metric definitions, submissions, cohort eligibility, percentile/benchmark lookup, trend and index values.

## Data / moat

Metric ontology, normalization mappings, historical aggregate distributions, cohort models, industry packs, quality and comparability evidence. Moat from broad normalized coverage and trusted privacy methodology, not access to identifiable customer records.

## Monetization / distribution

Subscription by benchmark packs/seats/company size, API usage, embedded/OEM, premium historical depth, private peer groups, industry reports, enterprise custom cohorts, data licenses where permitted. Distribution via associations, consultants, SaaS/BI partners, finance/ops communities, embedded integrations.

## Security/privacy/compliance

Strict tenant isolation, minimum cohort size, disclosure controls, differential privacy where appropriate, no raw peer exposure, sensitive HR/financial metrics classified, opt-in data contribution, contractual use limits, deletion/export, regional constraints.

## Failure / edge cases

Tiny cohort, survivorship bias, definition mismatch, seasonality, bad data, outlier domination, gaming, stale cohort, currency/accounting differences, reidentification risk, selection bias. Surface confidence/sample limits and refuse misleading comparisons.

## Scale / platform

Micro: curated public/licensed datasets. ~$100K ARR: SaaS/SMB cohorts. ~$1M: multi-industry/embedded. ~$10M: large benchmark network/indices. ~$100M+: benchmark data infrastructure/standards if trust and participation compound.

Overlap #6 data subscriptions, #15 BI autopilot, #95 AI ROI. Keep #011 as normalized peer benchmarking.

## Classification

**DESIGN NOW:** metric/provenance/version contracts, privacy-safe aggregation, company isolation, truth/confidence states.  
**BUILD NOW:** generic metric registry/evidence hooks only after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** privacy/aggregation interface, tenant isolation, analytics/warehouse adapter seams.  
**COMPANY-SPECIFIC LATER:** cohort data, indices, customer dashboard/pricing.  
**SCALE-ONLY:** large benchmark network/private consortia.

# Mandatory 24-part completion block

1. **Complete Product Tree:** financial/ops/sales/marketing/support/product/engineering/AI/HR, industry cohorts, indices, peer recommendations, API/embedded, reports/private groups/metric registry/scenarios.
2. **Complete Feature Tree:** definitions/mappings/cohorts/privacy/outlier/unit/time/confidence/percentiles/trends/quality/API/alerts/export.
3. **Complete Customer Tree:** business functions, executives, consultants, investors/operators, associations, franchises, platforms.
4. **Complete Vertical Tree:** SaaS, commerce, services, field/construction, logistics, support, software/AI, healthcare admin, nonprofit/education/franchise.
5. **Complete Brain Capability Tree:** comparability/cohort/confounder reasoning, recommendations, uncertainty; no invented/reidentified peer data.
6. **Complete Agent Tree:** ontology, mapping, cohort, stats QA, privacy, insight, industry, index, quality, report, integration, success.
7. **Complete Service Tree:** registry/ETL/normalize/isolation/privacy/stats/cohort/time-series/index/quality/API/audit/export.
8. **Complete Workflow Tree:** ingest→map→normalize→privacy→cohort→aggregate→validate→publish→monitor.
9. **Complete Integration Tree:** warehouses/BI/accounting/CRM/support/analytics/HR/devops/AI/spreadsheets.
10. **Complete Data Tree:** metric definitions, mappings, aggregates, cohorts, indices, history, quality/provenance.
11. **Complete API/Developer Tree:** definitions/submission/cohort/benchmark/trend/index APIs.
12. **Complete Monetization Tree:** packs/seats/API/OEM/history/private cohorts/reports/custom/data license.
13. **Complete Distribution Tree:** associations, consultants, SaaS/BI partners, communities, embedded products.
14. **Complete Automation Tree:** mapping/normalization/cohorting/stats/quality/reporting with human review for ambiguous definitions.
15. **Complete Moat Tree:** ontology, historical distributions, cohort coverage, privacy trust, embedded reach.
16. **Complete Platform Tree:** benchmark reports → live peer analytics → embedded benchmark network/standards.
17. **Complete Risk Tree:** reidentification, bias, bad definitions/data, gaming, misleading small samples.
18. **Complete Scale Tree:** curated → network cohorts → multi-industry embedded → benchmark standard.
19. **Complete Spinoff Tree:** adjacent #6/#15/#95; vertical benchmark packs remain products.
20. **Command Center Dependencies:** data/provenance, analytics/metrics registry, isolation/privacy, billing/API, observability.
21. **Design-Now Requirements:** versioned metric semantics and privacy-safe aggregation interfaces.
22. **Build-Now Requirements:** shared metric/evidence contracts after reverse-map.
23. **Safe-to-Defer Requirements:** actual peer datasets, indices, customer portal, monetization/network.
24. **Autonomous Mature State:** ingestion/normalization/cohorting/quality/reporting run continuously; Brain explains and recommends; James handles strategy/privacy-sensitive partnerships.

## Saturation result

Remaining branches are industry packs or existing data/BI/ROI companies; no new top-level company emerges.
