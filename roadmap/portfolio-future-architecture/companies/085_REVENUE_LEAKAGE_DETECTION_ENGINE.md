# Company 085 — Revenue Leakage Detection Engine

**Company ID:** `company:future:085`  
**Primary project:** `project:company:future:085`  
**Roadmap version:** `COMPANY-085-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no invoice creation, customer charge, price change, collection, refund or accounting mutation.

## Business identity
Purpose: reconcile contracts, pricing, entitlements, usage, services delivered and invoices to find verified underbilling, missed billable activity, incorrect discounts and other preventable revenue loss.

## Product tree
Contract/Price Intake; Billing Configuration Audit; Usage-to-Bill Reconciliation; Entitlement-vs-Billing Audit; Service Delivery Audit; Discount/Promotion Audit; Renewal/Price-Increase Audit; Overage Detection; Missed Invoice/Line Detection; Credit/Refund Audit; Grandfathering Drift; Revenue Leak Case Manager; Recovery Workflow; Prevention Rules; Root-Cause Analytics; Forecasted Leakage; API/SDK; Enterprise/Private Deployment; Vertical Billing Packs.

## Feature/customer/vertical tree
Features: customer/account, contract/version, product/SKU, price/discount, effective dates, entitlement, usage/meter, delivered service, invoice/line, credits/refunds, billing rules, expected vs actual amount, confidence, evidence, recoverability, root cause and resolution.
Customers: SaaS, usage-based AI/API companies, telecom-like services, marketplaces, professional services, managed services, subscription businesses and enterprise revenue operations.
Verticals: seat SaaS, usage billing, API/token products, service contracts, marketplace fees, logistics/service charges and recurring memberships.

## Brain capability / architecture
Brain may interpret contracts and explain anomalies; deterministic pricing/metering/contract rules must calculate expected charges. Architecture: contract/price registry, usage/entitlement/billing connectors, normalized revenue event graph, expected-bill calculator, reconciliation engine, anomaly/case store, recovery workflow and evidence.

## Agent tree
Contract Analyst; Pricing Config Agent; Usage Reconciliation Agent; Entitlement Audit Agent; Invoice Audit Agent; Discount/Renewal Agent; Recovery Case Agent; Root-Cause Agent; Revenue Forecast Agent; Finance QA Agent.

## Deterministic services
Price/version arithmetic; usage aggregation; entitlement mapping; invoice matching; discount rules; contract effective dates; currency rounding; idempotent recovery case; expected-vs-actual reconciliation; evidence hashes.

## Workflow
Ingest contract/pricing/entitlements/usage/invoice state → normalize versions/effective dates → calculate expected billable state deterministically → compare actual billing → classify verified/possible/no leak → gather evidence → finance review → protected correction/recovery action if authorized → reconcile outcome → identify root cause/prevention rule.

## Integrations / API / data
CRM/CLM, billing/subscription platforms, usage meters, entitlement systems, ERP/accounting, invoices, payments, service-delivery systems and data warehouses. Data: contracts/prices/usage/entitlements/invoices/credits/cases/recovery and evidence.

## Monetization / distribution
Accounts/revenue volume, audits, SaaS subscription, percentage of verified recovered revenue where appropriate, enterprise/private, API and managed revenue assurance. Distribution via billing/revenue-ops/finance ecosystems and consultants.

## Security/privacy/compliance
Financial accuracy is critical. No AI-generated charge amounts without deterministic verification, no automatic customer charging, immutable source/evidence, protected financial corrections, contract confidentiality and tenant isolation.

## Failure / edge cases
Custom contract clauses, mid-cycle amendments, credits, refunds, waived usage, bundle allocations, minimum commitments, currency/FX, tax excluded/included, grandfathering, manual invoices, usage corrections, contract source mismatch, duplicate customer identities.

## Scale / overlap
Billing audit → revenue assurance → enterprise commercial truth graph. Overlap #69 usage billing, #70 entitlements, #86 payment reconciliation, #95 ROI. #085 owns expected revenue vs billed revenue.

## Classification
**DESIGN NOW:** cost/revenue event provenance, pricing/version identity, entitlement/usage interfaces, financial evidence and protected corrections.  
**BUILD NOW:** Command Center financial governor should model revenue/cost/unit economics separately from unverifiable estimates.  
**BUILD BEFORE FIRST COMPANY:** customer contract/billing/usage reconciliation layer.  
**COMPANY-SPECIFIC LATER:** customer connectors/recovery product/pricing.  
**SCALE-ONLY:** large commercial contract graph and portfolio revenue assurance.

# Mandatory 24-part completion block
1. Product Tree: contract/pricing/billing config/usage/entitlement/service/discount/renewal/overage/missed invoice/credits/cases/recovery/prevention/analytics/API.
2. Feature Tree: customer/contract/product/price/dates/entitlement/usage/service/invoice/credits/expected-actual/confidence/evidence/root cause.
3. Customer Tree: SaaS/AI-API/services/marketplaces/subscription/enterprise revops.
4. Vertical Tree: seats/usage/API/tokens/service contracts/marketplace/logistics/memberships.
5. Brain Tree: contract interpretation/anomaly explanation; charge math deterministic.
6. Agent Tree: contract/pricing/usage/entitlement/invoice/discount/recovery/root cause/forecast/QA.
7. Service Tree: pricing/usage aggregation/mapping/invoice matching/discount/date/currency/reconcile/evidence.
8. Workflow Tree: ingest→normalize→expected bill→compare→evidence→review→protected recovery→reconcile/prevent.
9. Integration Tree: CRM/CLM/billing/metering/entitlements/ERP/invoices/payments/service/warehouse.
10. Data Tree: contracts/prices/usage/entitlements/invoices/credits/cases/outcomes/evidence.
11. API Tree: expected revenue/leaks/cases/evidence/reconciliation.
12. Monetization Tree: accounts/revenue/audits/subscription/recovered share/enterprise/API/managed.
13. Distribution Tree: billing/revops/finance/consultants/OEM.
14. Automation Tree: detection/reconciliation automatic; customer financial correction gated.
15. Moat Tree: contract/billing reconciliation corpus, root-cause patterns, connector breadth.
16. Platform Tree: leakage detector→revenue assurance→commercial truth infrastructure.
17. Risk Tree: false charge claim/contract misread/privacy/customer harm/accounting error.
18. Scale Tree: SaaS→enterprise→portfolio revenue assurance.
19. Spinoff Tree: contract pricing auditor/billing config linter; billing/entitlement/reconciliation remain adjacent.
20. Command Center Dependencies: financial governor, usage telemetry, entitlements, contracts, evidence, protected actions.
21. Design-Now Requirements: separate expected/actual/verified revenue states and source/version lineage.
22. Build-Now Requirements: Command Center portfolio financial model must never conflate projections, estimates, invoices and cash received.
23. Safe-to-Defer Requirements: customer connectors/recovery workflows/commercial analytics.
24. Autonomous Mature State: leakage is continuously detected/reconciled and prevention rules update; humans approve contract interpretations and customer-facing financial corrections.

## Saturation result
Further branches converge into usage billing, payment reconciliation, contract obligation and pricing intelligence already represented.