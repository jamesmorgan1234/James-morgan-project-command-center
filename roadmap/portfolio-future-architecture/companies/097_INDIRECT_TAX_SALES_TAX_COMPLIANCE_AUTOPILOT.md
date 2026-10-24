# Company 097 — Indirect Tax / Sales-Tax Compliance Autopilot

**Company ID:** `company:future:097`  
**Primary project:** `project:company:future:097`  
**Roadmap version:** `COMPANY-097-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no tax filing, registration, remittance, customer tax change or legal/tax attestation.

## Business identity
Purpose: provide deterministic infrastructure for indirect-tax determination, evidence, reconciliation, registration tracking and filing preparation across jurisdictions while routing ambiguous classifications to qualified review.

Problem: sales tax, VAT, GST and related indirect taxes depend on jurisdiction, nexus/thresholds, product/service classification, customer exemptions, marketplace rules, place-of-supply and rapidly changing rates/rules.

Value: accurate tax determination inputs, explainable jurisdiction/classification evidence, cleaner reconciliation and deadline control without pretending software replaces tax professionals.

## Complete product tree
Nexus/Threshold Monitor; Jurisdiction Registry; Product/Service Taxonomy; Taxability Classification; Rate Engine Adapter; Exemption Certificate Manager; Customer Tax Status; Place-of-Supply Engine; Marketplace-Facilitator Rules; Invoice Tax Calculator; Refund/Credit Adjustment; VAT/GST/Digital-Service Packs; Registration Tracker; Filing Calendar; Return Preparation Workspace; Tax Reconciliation; Audit Evidence; Rule/Rate Change Monitor; Scenario Simulator; API/SDK; White-Label/OEM; Enterprise/Private Deployment; Regional/Industry Packs.

## Feature/customer/vertical tree
Features: seller/entity, jurisdiction, registration/status, threshold period, transaction/customer/product/service, tax category, exemption, place of supply, rate source/version, taxable base, tax amount, marketplace responsibility, invoice/refund refs, filing period, reconciliation, assumption/confidence, evidence and review state.

Customers: ecommerce, SaaS/digital services, marketplaces, multi-state/multi-country businesses, manufacturers/distributors, accounting/tax firms, ERP/billing providers and enterprises.

Verticals: physical goods, digital products, SaaS, services, subscriptions, marketplaces, food/grocery, manufacturing, telecom-like services and cross-border digital services. Each needs separate validated packs.

## Brain capability tree / architecture
Brain may interpret product descriptions, surface candidate classifications and explain ambiguous rules. Tax calculation/enforcement must use validated deterministic rule/rate sources. Brain cannot make unsupported legal nexus determinations or submit filings.

Architecture: jurisdiction/rule registry, entity/registration graph, tax-category ontology, transaction normalization, deterministic calculation adapter, exemption store, threshold/nexus tracker, marketplace responsibility rules, filing-period ledger, reconciliation engine, provenance/evidence and protected filing/remittance gates.

## Agent tree
Jurisdiction Monitor; Nexus/Threshold Agent; Product Classification Agent; Exemption Agent; Marketplace Rule Agent; Tax Calculation QA Agent; Registration Tracker; Filing Prep Agent; Reconciliation Agent; Change Monitor; Audit/Evidence Agent; Tax-Professional Review Router.

## Deterministic services
Jurisdiction/date rules; threshold arithmetic; rate/version lookup; taxable-base calculation; exemption validation; place-of-supply rules; marketplace responsibility; rounding; refund adjustments; filing-period aggregation; reconciliation hashes; deadline scheduler.

## Workflow tree
Ingest entity/registration/product/customer/transaction facts → resolve jurisdiction/place of supply → verify tax category/exemption → apply exact rule/rate version → calculate tax → record evidence → reconcile invoice/payment/refund/marketplace data → monitor thresholds/registration need → prepare return/workpaper → route ambiguity to qualified review → filing/remittance only through separately authorized workflow → preserve receipt/evidence.

## Integrations / API / data
Billing/checkout, ecommerce/marketplaces, ERP/accounting, payments, product catalogs, customer/exemption systems, tax-rate/rule providers, government portals via lawful interfaces, document storage and calendars. Data: entities, registrations, jurisdictions, products/categories, customers/exemptions, transactions, rates/rules, calculations, filings/workpapers and evidence.

## Monetization / distribution
Transactions, jurisdictions, entities, registrations, filings/workpapers, seats, enterprise/private, API/OEM, regional packs and managed preparation support. Distribution through ecommerce/billing/ERP/accounting/tax ecosystems.

## Security/privacy/compliance
Financial/customer data is sensitive. Rule sources/versioning, no fabricated tax certainty, qualified review for ambiguity, auditability, role separation, protected submissions/remittances, jurisdiction-specific privacy/retention and no claim to replace tax professionals.

## Failure / edge cases
Threshold changes, retroactive rules, marketplace facilitator split responsibility, mixed bundles, subscriptions across periods, exemption expiry, customer location ambiguity, tax-inclusive pricing, currency/rounding, refunds after filing, cross-border place-of-supply, digital-service rules, registration pending, tax-engine outage. Unknown classification must remain explicit.

## Scale / overlap
Single-region tax helper → multi-jurisdiction compliance platform → global indirect-tax infrastructure. Overlap #69 usage billing, #85 revenue leakage, #86 payment reconciliation, #99 data contracts. #097 owns tax determination/compliance workflow.

## Classification
**DESIGN NOW:** jurisdiction/region metadata, versioned rule sources, deterministic financial calculations, legal/tax review state, deadlines, protected filing/remittance classes and evidence lineage.  
**BUILD NOW:** Command Center financial/policy architecture should support jurisdiction-aware rule packs and keep calculated tax, filed tax and paid tax as separate truth states.  
**BUILD BEFORE FIRST COMPANY:** validated tax-rule provider abstraction, jurisdiction/entity registry, product-taxonomy hooks and deadline/reconciliation engine.  
**COMPANY-SPECIFIC LATER:** commercial tax packs, government/provider connectors, customer workflow and pricing.  
**SCALE-ONLY:** global rule/rate graph and high-volume multi-region computation.

# Mandatory 24-part completion block
1. Product Tree: nexus/jurisdictions/classification/rates/exemptions/place-of-supply/marketplace/invoice/refund/VAT-GST/registration/calendar/filing/reconcile/audit/API.
2. Feature Tree: entity/jurisdiction/registration/threshold/transaction/customer/product/category/exemption/rate version/tax/marketplace/period/evidence.
3. Customer Tree: ecommerce/SaaS/marketplace/multiregion/manufacturer/accounting/ERP/enterprise.
4. Vertical Tree: goods/digital/SaaS/services/subscriptions/marketplaces/grocery/manufacturing/telecom-like/cross-border.
5. Brain Tree: classification/explanation; tax calculation and filing rules deterministic/qualified-review backed.
6. Agent Tree: jurisdiction/nexus/classification/exemption/marketplace/calculation QA/registration/filing/reconcile/change/evidence/review.
7. Service Tree: rules/threshold/rates/tax base/exemption/place-of-supply/rounding/refunds/aggregation/reconcile/deadlines.
8. Workflow Tree: facts→jurisdiction→classification→calculate→evidence→reconcile→threshold/registration→prepare→review→authorized filing.
9. Integration Tree: billing/ecommerce/ERP/payments/catalog/customers/tax providers/portals/docs/calendar.
10. Data Tree: entities/registrations/jurisdictions/products/customers/transactions/rules/calculations/workpapers/evidence.
11. API Tree: classify/calculate/nexus/status/reconcile/workpapers/evidence.
12. Monetization Tree: transactions/jurisdictions/entities/filings/seats/enterprise/API/packs/managed.
13. Distribution Tree: ecommerce/billing/ERP/accounting/tax/OEM.
14. Automation Tree: determination/reconciliation/deadlines automatic; legal classification ambiguities and submissions/remittance gated.
15. Moat Tree: validated rule packs, classification corpus, jurisdiction graph, reconciliation accuracy.
16. Platform Tree: tax engine→indirect-tax OS→global tax infrastructure.
17. Risk Tree: wrong tax/late filing/legal overclaim/data leak/rule staleness/duplicate remittance.
18. Scale Tree: jurisdiction→multiregion enterprise→global.
19. Spinoff Tree: exemption-certificate/registration intelligence modules; billing/reconciliation remain adjacent.
20. Command Center Dependencies: financial governor, jurisdiction/policy packs, product/catalog metadata, evidence, protected actions, scheduler.
21. Design-Now Requirements: jurisdiction, effective-version and regulated-review metadata reusable across portfolio systems.
22. Build-Now Requirements: financial truth model must distinguish calculated, reported/filed, payable and paid/remitted states.
23. Safe-to-Defer Requirements: commercial tax content/government filing connectors/global rate network.
24. Autonomous Mature State: routine tax determination, threshold monitoring and reconciliation run continuously; qualified humans resolve ambiguous classification and authorize filings/remittances.

## Saturation result
Further branches converge into billing, reconciliation, product classification and regulatory monitoring already represented.