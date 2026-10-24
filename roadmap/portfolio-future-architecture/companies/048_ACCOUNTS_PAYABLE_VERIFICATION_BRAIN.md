# Company 048 — Accounts-Payable Verification Brain

**Company ID:** `company:future:048`  
**Primary project:** `project:company:future:048`  
**Roadmap version:** `COMPANY-048-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no payment, vendor, bank-account, accounting or approval action.

## Business identity

Purpose: verify accounts-payable obligations before money leaves a business by reconciling invoices, vendors, purchase orders, receiving evidence, contracts, tax treatment, approval authority and anomaly/fraud signals.

Problem: AP teams face duplicate invoices, vendor impersonation, bank-detail changes, pricing errors, missing PO/receipts, tax mismatches, unauthorized spend and fragmented approval evidence.

Value: higher payment accuracy, faster exception handling, lower fraud/error risk, stronger audit evidence and better cash visibility without turning probabilistic AI into payment authority.

## Complete product tree

Invoice Verification Workspace; Vendor Master Validation; PO/Invoice/Receipt Matching; Contract/Rate Verification; Duplicate Invoice Detection; Bank-Change Risk Gate; Tax/VAT/Sales-Tax Check Adapter; Approval Matrix; Exception Queue; Fraud/Anomaly Scoring; Cash-Timing Recommendations; Payment-Run Preflight; Supplier Portal; AP Inbox Ingestion; Document Extraction; Accounting/ERP Connectors; Audit/Evidence Pack; API/SDK; Batch Verification API; Managed AP Verification; Enterprise/Private Deployment; Industry Packs; Benchmark/Analytics Product.

## Feature/customer/vertical tree

Features: invoice OCR/structured intake, supplier identity, remit-to/bank-change history, invoice/PO/receipt/contract line matching, tolerances, quantity/unit/price/tax/currency validation, duplicate/fuzzy duplicate detection, credit memo handling, approval routing, segregation of duties, exception explanations, payment-date recommendations, confidence/evidence, immutable decision history, export/reconciliation and human-review queues.

Customers: SMB finance teams, controllers, AP departments, multi-entity groups, accounting firms, outsourced bookkeeping/AP providers, procurement teams, marketplaces, franchise groups, enterprises.

Verticals: retail/ecommerce, construction, manufacturing, logistics, hospitality, professional services, healthcare administration, property management, nonprofits, education, multi-location businesses. Each may need specialized PO/receiving/tax/workflow packs.

## Brain capability tree / architecture

Brain should understand invoice semantics, supplier history, contract language, normal purchasing patterns, discrepancy context and likely root cause. It may ANALYZE and RECOMMEND approval/hold/investigate/payment timing. It may never autonomously authorize payment, bank-detail change or override financial controls.

Architecture: deterministic matching/rules engine, supplier/entity graph, document extraction pipeline, AP ledger, contract/PO/receipt adapters, anomaly models, policy engine, confidence scoring, explainable evidence graph, LLM for grounded exception interpretation, protected financial-action gate.

## Agent tree

Invoice Intake Agent; Supplier Verification Agent; PO/Receipt Match Agent; Contract Rate Agent; Duplicate/Fraud Agent; Tax Classification Assistant; Approval Coordinator; Exception Investigator; Cash-Timing Analyst; Supplier Communication Draft Agent; Evidence/Audit Agent; Reconciliation Agent; QA/Finance-Control Agent.

## Deterministic services

Invoice parser; line-item matcher; tolerance engine; duplicate fingerprinting; vendor master service; bank-change hold service; approval matrix; tax adapter; accounting sync; idempotency keys; payment-run preflight; immutable evidence ledger; protected payment/bank-change gates.

## Workflow tree

Invoice received → malware/document validation → extract → resolve supplier → compare vendor master/bank state → match PO/receipt/contract → tax/currency/totals checks → duplicate/anomaly/fraud checks → route exception or approval recommendation → required human/authorized approval → payment-run preflight → downstream accounting/payment system action only through protected authority → reconcile settlement → preserve audit evidence.

## Integrations / API / data

ERP/accounting, procurement, banking/payment providers, tax engines, vendor portals, email/document intake, contract repositories, inventory/receiving, identity/SSO, audit/GRC. APIs for invoice ingest, verification, exceptions, supplier risk, approval state, preflight and evidence.

Data: invoices, line items, suppliers, PO/receipts, contracts, bank-change events, approvals, exceptions, payment outcomes, credits/refunds, fraud signals. Sensitive financial/vendor data stays company isolated.

## Monetization / distribution

Per invoice/document, AP volume tiers, supplier count, entities, seats, managed service, API usage, enterprise/private deployment, premium fraud/contract/tax packs, verified savings/recovery share where legally and contractually appropriate.

Distribution: accounting/ERP marketplaces, finance consultants, AP automation partners, accounting firms and direct enterprise finance channels.

## Security/privacy/compliance

High financial risk. Least privilege, dual control, bank-change cooling/verification, no AI payment authority, encrypted documents, immutable approvals, supplier impersonation controls, sanctions/compliance adapters where applicable, regional financial-record retention. Product does not replace accountants, tax professionals or legal counsel.

## Failure / edge cases

Partial receipts, split POs, blanket POs, recurring invoices, credit memos, currency conversion, early-pay discounts, duplicate supplier entities, bank mergers, legitimate bank change, invoice number reuse, tax-inclusive pricing, disputed goods, prepayments, intercompany invoices, no-PO spend, manual journals, malicious PDFs. Unknowns must become explicit exceptions rather than guessed matches.

## Scale / overlap

Micro business AP verification → multi-entity enterprise controls → verification API/control plane. Overlap #30 invoice/payment recovery, #32 procurement, #63 vendor onboarding, #73 secret/credential changes, #85 revenue leakage, #86 payment reconciliation. #048 owns pre-payment obligation verification.

## Classification

**DESIGN NOW:** protected financial-action model, supplier/entity identity, evidence/provenance, immutable approvals, idempotency, bank-detail change isolation.  
**BUILD NOW:** Command Center financial/protected-action and cross-company isolation interfaces may need reverse-map reinforcement.  
**BUILD BEFORE FIRST COMPANY:** customer tenancy, ERP/payment connector abstraction, supplier graph, deterministic match/tolerance engine.  
**COMPANY-SPECIFIC LATER:** AP UI, accounting connectors, fraud models, vertical packs, pricing.  
**SCALE-ONLY:** global supplier intelligence, cross-customer benchmark signals with privacy-safe aggregation.

# Mandatory 24-part completion block

1. Product Tree: workspace/vendor/3-way match/contracts/duplicates/bank gate/tax/approval/exceptions/fraud/cash/preflight/portal/inbox/API/managed/enterprise/analytics.
2. Feature Tree: extract/vendor/bank/PO/receipt/contract/tax/currency/totals/duplicates/approvals/evidence/exceptions/reconcile.
3. Customer Tree: SMB/controllers/AP/accounting firms/procurement/marketplaces/franchise/enterprise.
4. Vertical Tree: retail/construction/manufacturing/logistics/hospitality/services/health admin/property/nonprofit/education.
5. Brain Tree: invoice/supplier/context analysis and recommendations; payment/bank authority prohibited without separate protected authorization.
6. Agent Tree: intake/vendor/match/contract/duplicate-tax/approval/investigation/cash/comms/evidence/reconciliation/QA.
7. Service Tree: parser/matcher/tolerance/fingerprint/vendor master/bank hold/approval/tax/accounting/idempotency/preflight/audit.
8. Workflow Tree: ingest→verify supplier→match→validate→risk→exception/approval→protected action→settlement reconciliation.
9. Integration Tree: ERP/accounting/procurement/banking/tax/contracts/receiving/email/identity/audit.
10. Data Tree: invoices/lines/suppliers/PO/receipts/contracts/bank events/approvals/exceptions/payments/outcomes.
11. API Tree: ingest/verify/exceptions/supplier/preflight/evidence.
12. Monetization Tree: document/volume/suppliers/entities/seats/API/managed/enterprise/packs/savings share.
13. Distribution Tree: ERP marketplaces/accounting firms/finance consultants/AP partners/direct enterprise.
14. Automation Tree: extraction/matching/risk/routing/reconciliation automated; payment/bank changes gated.
15. Moat Tree: supplier history, discrepancy patterns, connector breadth, verified exception outcomes.
16. Platform Tree: verifier→AP control plane→financial obligation assurance infrastructure.
17. Risk Tree: fraud/wrong payment/bank spoof/tax error/duplicate/false match/data leakage.
18. Scale Tree: micro AP→multi-entity→enterprise/global verification API.
19. Spinoff Tree: supplier identity/risk and payment preflight could become modules; adjacent companies already cover procurement/vendor onboarding/reconciliation.
20. Command Center Dependencies: financial governance, identity, protected actions, evidence, connector registry, company isolation, secrets.
21. Design-Now Requirements: money-action taxonomy, supplier/account identity, dual-control/evidence and idempotency contracts.
22. Build-Now Requirements: preserve reusable financial/protected-action and tenant boundaries after portfolio reverse-map.
23. Safe-to-Defer Requirements: AP UI/connectors/fraud models/customer billing/vertical packs.
24. Autonomous Mature State: routine invoices are verified/routed/reconciled automatically; people handle ambiguous suppliers/exceptions and authorize protected financial actions.

## Saturation result

Further coherent branches either become procurement/vendor onboarding/payment reconciliation/revenue-leakage products already represented elsewhere or specialized AP modules under this company.