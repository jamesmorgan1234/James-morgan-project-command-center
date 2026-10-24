# Company 087 — Marketplace Payout Reconciliation Engine

**Company ID:** `company:future:087`  
**Primary project:** `project:company:future:087`  
**Roadmap version:** `COMPANY-087-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no marketplace account mutation, payout action, dispute filing or accounting post.

## Business identity
Purpose: verify marketplace/platform payouts against underlying orders, refunds, commissions, shipping, taxes, reserves, ads/deductions and adjustments.

## Product tree
Marketplace Settlement Ingest; Order-to-Payout Match; Fee/Commission Audit; Refund/Return Reconciliation; Shipping/Tax Reconciliation; Reserve/Hold Tracker; Advertising/Deduction Mapping; Adjustment/Credit Analyzer; Missing Payout Detector; Incorrect Fee Detector; Multi-Currency/FX; Settlement Forecast; Exception/Case Manager; Accounting Export Proposal; Recovery Evidence Pack; API/SDK; Agency/Multi-Store Edition; Enterprise/Private Deployment; Marketplace Packs.

## Feature/customer/vertical tree
Features: marketplace/account/store, order/line/SKU, gross sales, refunds, taxes, shipping, fees/commission, ads, reserves, credits/adjustments, settlement ID, payout date, bank deposit, currency, expected-vs-actual, discrepancy reason, evidence and recovery status.
Customers: marketplace sellers, ecommerce brands, agencies, aggregators, multi-store operators, manufacturers and finance teams.
Verticals: general marketplaces, app/digital marketplaces, delivery/platform payouts, creator/platform revenue and multi-channel commerce where settlement structures differ.

## Brain capability / architecture
Brain may explain marketplace-specific deductions and prioritize discrepancies. Deterministic order/settlement arithmetic owns expected payouts. Architecture: marketplace adapter registry, order/settlement ledger, fee/rule versioning, allocation engine, FX source, bank-match adapter, exception/recovery case store and evidence.

## Agent tree
Settlement Intake Agent; Order Matcher; Fee/Commission Agent; Refund/Returns Agent; Reserve Agent; Ads/Deduction Agent; Adjustment Agent; Missing Payout Agent; FX Agent; Recovery Case Agent; Accounting/Evidence Agent; QA Agent.

## Deterministic services
Order-line allocation; fee schedules; settlement batch math; refund/return linkage; reserve rollforward; ad deduction mapping; FX/version; bank deposit matching; idempotency; discrepancy thresholds; immutable adjustments.

## Workflow
Ingest orders/refunds/fees/settlements → normalize marketplace schema/version → calculate expected settlement → map deductions/reserves/adjustments → match payout/bank deposit → surface discrepancies → gather exact evidence → authorized recovery/dispute handled separately → reconcile marketplace correction/payment → accounting proposal and close evidence.

## Integrations / API / data
Marketplaces, ecommerce OMS, inventory/order systems, ad platforms, shipping, tax, banks/payment reconciliation, accounting/ERP and warehouses. Data: orders/lines/refunds/fees/ads/reserves/settlements/payouts/bank matches/discrepancies/evidence.

## Monetization / distribution
Stores/accounts, orders/settlements, revenue volume, marketplaces, seats, agency clients, enterprise/private, API, verified recovery share and managed reconciliation. Distribution via seller/ecommerce/accounting/agencies.

## Security/privacy/compliance
Marketplace credentials isolated; read-only by default; no automatic dispute or money movement; deterministic calculations and source evidence. Respect marketplace terms/API limits.

## Failure / edge cases
Split shipments, partial refund, reserve released months later, retroactive fee adjustment, negative settlement, ad charge from separate account, currency conversion, tax withheld, missing order API history, manual marketplace credit, payout account change, marketplace schema drift.

## Scale / overlap
Seller reconciliation → agency/multi-brand → marketplace financial truth platform. Overlap #86 generic payment reconciliation, #59 listings, #34 returns. #087 owns marketplace settlement semantics.

## Classification
**DESIGN NOW:** external provider/account isolation, financial source IDs, rule/version, expected-vs-actual, reconciliation/evidence.  
**BUILD NOW:** Command Center company portfolio finance model should support per-company marketplace/provider cost/revenue sources without mixing them.  
**BUILD BEFORE FIRST COMPANY:** marketplace/order/settlement connector abstraction and reconciliation ledger.  
**COMPANY-SPECIFIC LATER:** actual seller accounts/marketplace packs/recovery workflows.  
**SCALE-ONLY:** high-volume multi-marketplace settlement graph.

# Mandatory 24-part completion block
1. Product Tree: settlement/order match/fees/refunds/shipping-tax/reserves/ads/adjustments/missing payout/FX/forecast/cases/accounting/API.
2. Feature Tree: marketplace/account/order/SKU/sales/refunds/tax/shipping/fees/ads/reserves/settlement/payout/currency/discrepancy/evidence.
3. Customer Tree: sellers/brands/agencies/aggregators/multi-store/manufacturers/finance.
4. Vertical Tree: ecommerce/app/digital/delivery/creator/platform marketplaces.
5. Brain Tree: discrepancy explanation/prioritization; payout arithmetic deterministic.
6. Agent Tree: settlement/order/fee/refund/reserve/ads/adjustment/missing payout/FX/recovery/accounting/QA.
7. Service Tree: allocation/fee rules/batch math/refund links/reserve/ads/FX/bank match/idempotency/adjustments.
8. Workflow Tree: ingest→normalize→expected→deductions→payout match→discrepancy→evidence→recovery→reconcile/close.
9. Integration Tree: marketplace/OMS/ads/shipping/tax/bank/accounting/warehouse.
10. Data Tree: orders/refunds/fees/ads/reserves/settlements/payouts/matches/discrepancies.
11. API Tree: settlements/expected payouts/discrepancies/cases/evidence.
12. Monetization Tree: stores/orders/settlements/revenue/marketplaces/seats/agency/API/recovery share.
13. Distribution Tree: seller/ecommerce/accounting/agency ecosystems.
14. Automation Tree: reconciliation/detection automatic; disputes/recovery actions gated.
15. Moat Tree: marketplace fee semantics, historical adjustments, connector breadth, recovery outcomes.
16. Platform Tree: payout recon→seller finance assurance→marketplace settlement infrastructure.
17. Risk Tree: wrong payout claim/stale API/account mixup/fee rule drift/privacy.
18. Scale Tree: seller→agency→enterprise multi-marketplace.
19. Spinoff Tree: fee audit/reserve forecasting modules; generic reconciliation remains adjacent.
20. Command Center Dependencies: finance, provider/account registry, marketplace isolation, evidence, integrations.
21. Design-Now Requirements: per-company provider financial streams remain isolated/reconcilable.
22. Build-Now Requirements: portfolio finance registry should support provider-specific revenue/fee actuals and reconciled state.
23. Safe-to-Defer Requirements: marketplace connectors/customer disputes/pricing.
24. Autonomous Mature State: settlements reconcile and discrepancies prepare evidence automatically; humans handle marketplace disputes and accounting exceptions.

## Saturation result
Further branches converge into payment reconciliation, returns, listings and revenue leakage already represented.