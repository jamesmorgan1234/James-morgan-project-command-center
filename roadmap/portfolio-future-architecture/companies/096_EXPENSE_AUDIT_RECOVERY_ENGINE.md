# Company 096 — Expense Audit & Recovery Engine

**Company ID:** `company:future:096`  
**Primary project:** `project:company:future:096`  
**Roadmap version:** `COMPANY-096-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no refund request, cancellation, vendor contact, payment change or financial action.

## Business identity
Purpose: continuously inspect company expenses, contracts, bills and historical charges for recoverable errors, unused credits, duplicate charges, overpayments, pricing drift and preventable future waste.

## Product tree
Expense Feed Intake; Vendor Normalization; Contract/Rate Comparison; Invoice Audit; Duplicate Charge Detection; Subscription/SaaS Audit; Cloud/Telecom/Utility Audit; Shipping/Freight Audit; Professional-Service Audit; Credit/Refund Opportunity; Overpayment Detection; Hidden Price Increase Monitor; Discount/Credit Expiry; Bank/Fee Audit; Tax Error Flagging; Expense Policy Violations; Recovery Case Manager; Savings Verification; Prevention Rules; Forecast/Benchmarking; API/SDK; Enterprise/Private Deployment; Managed Recovery.

## Feature/customer/vertical tree
Features: vendor/account, contract/version/rate, invoice/transaction, line item, service period, expected vs actual, duplicate fingerprint, credit/refund eligibility, price-change history, discount expiry, fee, tax, policy, confidence, recovery status and realized vs estimated savings evidence.
Customers: SMBs, enterprises, finance/procurement, accounting firms, multi-location businesses, property operators, ecommerce, SaaS-heavy companies and managed service providers.
Verticals: software/SaaS, cloud, telecom, utilities, shipping/logistics, facilities/property, professional services, advertising and general vendor spend.

## Brain capability / architecture
Brain may interpret contract/invoice language and propose recovery paths; deterministic contract/rate arithmetic verifies monetary discrepancies. Architecture: expense ledger, vendor/entity normalization, contract/price registry, invoice parser, anomaly/duplicate engine, expected-cost calculator, recovery case workflow, realized-savings reconciliation and evidence.

## Agent tree
Expense Intake Agent; Vendor Normalization Agent; Contract Analyst; Invoice Audit Agent; Duplicate Agent; SaaS/Subscription Agent; Utility/Telecom Agent; Shipping Agent; Recovery Case Agent; Savings Verifier; Prevention Agent; Finance QA Agent.

## Deterministic services
Line-item normalization; duplicate hashes; rate/effective-date math; contract ceilings; credit tracking; fee/tax calculations; currency; idempotent cases; realized-savings reconciliation; source/evidence hashing.

## Workflow tree
Ingest expenses/contracts → normalize vendor/service → bind exact rate/period → calculate expected cost → detect duplicate/error/credit/price drift → classify verified vs possible opportunity → finance review → protected vendor/refund/cancel workflow if authorized → reconcile actual credit/refund/avoided future charge → record realized vs estimated savings → prevention rule.

## Integrations / API / data
Accounting/ERP, cards/banks read-only, AP, contracts/CLM, SaaS spend tools, cloud billing, telecom, utilities, shipping and vendor invoices. Data: vendors/contracts/rates/invoices/transactions/credits/cases/outcomes/evidence.

## Monetization / distribution
Expense volume, vendors/accounts, subscription, percentage of verified recovered savings where appropriate, enterprise/private, API and managed recovery. Distribution via accounting/procurement/FinOps/expense ecosystems.

## Security/privacy/compliance
Financial/vendor records confidential. Read-only first, deterministic evidence, no unauthorized cancellation/refund outreach, source-provenance, protected financial/vendor actions and transparent savings definitions.

## Failure / edge cases
Legitimate duplicate-looking charge, contract amendment, usage tier, prorated invoice, tax jurisdiction, currency, credit already pending, bundled invoice, annual prepaid allocation, volume discount, rate valid only for one entity, recovery fee exceeding value.

## Scale / overlap
SMB audit → enterprise spend assurance → expense recovery infrastructure. Overlap #17 SaaS spend, #43 cloud cost, #85 revenue leakage (opposite side), #48 AP verification. #096 owns paid-expense error/recovery.

## Classification
**DESIGN NOW:** verified/estimated savings distinction, contract/rate versioning, source financial provenance, recovery case evidence and protected vendor actions.  
**BUILD NOW:** Command Center financial governor must separate estimated opportunity, approved action and realized savings.  
**BUILD BEFORE FIRST COMPANY:** customer expense/contract connectors and reconciliation.  
**COMPANY-SPECIFIC LATER:** vendor-specific recovery playbooks/pricing.  
**SCALE-ONLY:** benchmark pricing/data network.

# Mandatory 24-part completion block
1. Product Tree: expense/vendor/contracts/invoice/duplicates/SaaS/cloud/telecom/utilities/shipping/services/credits/overpayments/price drift/fees/tax/recovery/API.
2. Feature Tree: vendor/contract/rate/invoice/transaction/period/expected-actual/duplicate/credit/price/discount/fee/tax/confidence/outcome.
3. Customer Tree: SMB/enterprise/finance/procurement/accounting/multi-location/property/ecommerce/MSP.
4. Vertical Tree: SaaS/cloud/telecom/utilities/shipping/property/services/ads/general spend.
5. Brain Tree: contract/invoice interpretation; money discrepancy arithmetic deterministic.
6. Agent Tree: intake/vendor/contract/invoice/duplicate/SaaS/utility/shipping/recovery/savings/prevention/QA.
7. Service Tree: normalization/hashes/rate math/ceilings/credits/fees-tax/currency/idempotency/reconcile/evidence.
8. Workflow Tree: ingest→normalize→expected cost→detect→verify→review→protected recovery→realized savings→prevent.
9. Integration Tree: accounting/cards/banks/AP/CLM/SaaS/cloud/telecom/utilities/shipping.
10. Data Tree: vendors/contracts/rates/invoices/transactions/credits/cases/outcomes/evidence.
11. API Tree: expenses/opportunities/cases/recovery/savings/evidence.
12. Monetization Tree: spend/vendors/subscription/recovery share/enterprise/API/managed.
13. Distribution Tree: accounting/procurement/FinOps/expense/OEM.
14. Automation Tree: detection/verification/reconciliation automatic; vendor/refund/cancel actions gated.
15. Moat Tree: vendor pricing history, contract/rate parsers, verified recovery outcomes.
16. Platform Tree: expense audit→recovery autopilot→spend assurance infrastructure.
17. Risk Tree: false recovery claim/cancel harm/contract misread/data leak/savings overstatement.
18. Scale Tree: SMB→enterprise→benchmark network.
19. Spinoff Tree: vendor benchmark/fee audit modules; SaaS/cloud optimization remain adjacent.
20. Command Center Dependencies: finance, contracts, provider/vendor identity, evidence, protected actions, analytics.
21. Design-Now Requirements: opportunities/approvals/realized savings must be distinct truth states.
22. Build-Now Requirements: Financial Governor and analytics must track expected vs verified realized economic outcomes.
23. Safe-to-Defer Requirements: customer spend connectors/recovery workflows/benchmark network.
24. Autonomous Mature State: expenses are continuously audited and verified opportunities prepared; humans authorize vendor-facing recovery/cancellation and strategic changes.

## Saturation result
Further branches converge into SaaS spend, cloud cost, procurement and AP products already represented.