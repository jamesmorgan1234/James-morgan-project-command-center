# Company 086 — Payment Reconciliation Autopilot

**Company ID:** `company:future:086`  
**Primary project:** `project:company:future:086`  
**Roadmap version:** `COMPANY-086-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no bank/payment/accounting mutation or money movement.

## Business identity
Purpose: reconcile payments, invoices, processor settlements, fees, refunds, chargebacks, taxes and bank deposits into deterministic financial evidence.

## Product tree
Payment Feed Ingest; Invoice Match; Bank Deposit Match; Processor Settlement Match; Fee Reconciliation; Refund/Reversal Reconciliation; Chargeback Reconciliation; Subscription Payment Match; Marketplace/Platform Settlement Adapter; Tax/Withholding Reconciliation; Multi-Currency/FX; Partial/Split Payment Handling; Unmatched Queue; Auto-Match Rules; Month-End Close Pack; Accounting Journal Proposal; Evidence/Audit; Cash Forecast; API/SDK; Enterprise/Private Deployment; Vertical Packs.

## Feature/customer/vertical tree
Features: transaction IDs, provider/account, customer/payee, invoice/order/subscription, gross/net/fee/tax/refund/chargeback, settlement batch, bank reference, timestamps, currency/FX, expected vs actual, match confidence, rule/version, exception, accounting mapping and evidence.
Customers: SaaS, ecommerce, marketplaces, subscription businesses, enterprises, accountants/bookkeepers, finance teams and payment platforms.
Verticals: card payments, ACH/bank transfer, wallets, marketplaces, subscriptions, ecommerce, multi-currency and service businesses.

## Brain capability / architecture
Brain may explain unmatched items and propose mappings; arithmetic/matching/accounting evidence is deterministic. Architecture: immutable transaction ledger, provider adapters, entity/reference resolver, matching engine, settlement graph, fee/tax rules, FX source/version, exception queue, reconciliation state and accounting export.

## Agent tree
Payment Intake Agent; Invoice Matcher; Settlement Agent; Fee Agent; Refund/Chargeback Agent; Bank Match Agent; FX Agent; Exception Investigator; Accounting Mapping Agent; Close/Evidence Agent; QA Agent.

## Deterministic services
ID/reference matching; amount/date tolerances; split/partial allocation; settlement batch math; fee rules; currency conversion with source/version; duplicate detection; idempotency; balancing; immutable adjustments; reconciliation hashes.

## Workflow
Ingest provider/bank/invoice state → normalize exact IDs/currency → match direct references → deterministic fuzzy/tolerance match → allocate splits/partials → reconcile fees/refunds/chargebacks/taxes → route unmatched/ambiguous → approved accounting proposal → verify debits/credits and settlement totals → close period with evidence; never move money.

## Integrations / API / data
Payment processors, banks/open banking where authorized, billing/subscription, ecommerce/order systems, ERP/accounting, tax engines, marketplaces and warehouses. Data: transactions, invoices, settlements, fees, refunds, disputes, bank deposits, FX, matches, exceptions and evidence.

## Monetization / distribution
Transactions/settlements/accounts, entities, currencies, seats, enterprise/private, API, managed reconciliation. Distribution via accounting/payment/ecommerce/finance ecosystems.

## Security/privacy/compliance
Read-only bank/payment access by default, credential isolation, financial data encryption, deterministic totals, no AI money movement, protected accounting posts, full audit and source/version retention.

## Failure / edge cases
Settlement lag, processor netting, reserve holds, partial refunds, chargeback reversals, duplicate bank feeds, timezone cutoffs, FX differences, tax withheld, transfer fees, merged invoices, cash/check, provider correction after close, negative payouts.

## Scale / overlap
Small business reconciliation → enterprise multi-processor close → payment truth infrastructure. Overlap #87 marketplace payout, #48 AP verification, #85 revenue leakage. #086 owns cash/transaction settlement reconciliation.

## Classification
**DESIGN NOW:** financial event IDs, source/account/provider refs, verified vs expected state, immutable adjustment/reconciliation, currency/version metadata.  
**BUILD NOW:** Command Center financial governor should adopt source-addressed actuals and reconciliation semantics.  
**BUILD BEFORE FIRST COMPANY:** customer payment/bank adapters and matching ledger.  
**COMPANY-SPECIFIC LATER:** banking connectors/customer accounting mappings/UI.  
**SCALE-ONLY:** global high-volume multi-currency reconciliation.

# Mandatory 24-part completion block
1. Product Tree: payment/invoice/bank/settlement/fees/refunds/chargebacks/subscriptions/marketplace/tax/FX/partial/unmatched/close/accounting/API.
2. Feature Tree: IDs/provider/customer/invoice/gross-net-fee-tax/refund/batch/bank/time/currency/expected-actual/confidence/evidence.
3. Customer Tree: SaaS/ecommerce/marketplace/subscription/enterprise/accounting/finance/payment platforms.
4. Vertical Tree: cards/ACH/wallets/marketplaces/subscriptions/commerce/multi-currency/services.
5. Brain Tree: explain/propose; arithmetic and matches deterministic.
6. Agent Tree: intake/invoice/settlement/fee/refund/bank/FX/exception/accounting/close/QA.
7. Service Tree: ID matching/tolerances/splits/batch math/fees/FX/dedup/idempotency/balancing/adjustments.
8. Workflow Tree: ingest→normalize→match→allocate→reconcile→exceptions→accounting proposal→verify→close.
9. Integration Tree: processors/banks/billing/ecommerce/ERP/tax/marketplace/warehouse.
10. Data Tree: payments/invoices/settlements/fees/refunds/disputes/deposits/FX/matches/evidence.
11. API Tree: transactions/matches/exceptions/settlements/close/evidence.
12. Monetization Tree: transactions/accounts/entities/currencies/seats/enterprise/API/managed.
13. Distribution Tree: accounting/payment/ecommerce/finance/OEM.
14. Automation Tree: matching/reconciliation automatic; money movement/accounting posts protected.
15. Moat Tree: provider settlement semantics, matching outcomes, exception patterns, integrations.
16. Platform Tree: recon tool→payment truth layer→financial reconciliation infrastructure.
17. Risk Tree: wrong match/financial misstatement/data leak/stale feed/FX error/duplicate.
18. Scale Tree: SMB→enterprise→global multi-provider.
19. Spinoff Tree: fee audit/FX reconciliation modules; marketplace payout remains separate specialization.
20. Command Center Dependencies: finance, provider/account isolation, evidence, currency, audit, protected actions.
21. Design-Now Requirements: actual financial records require source IDs, reconciliation and correction lineage.
22. Build-Now Requirements: financial governor must distinguish balances, transactions, invoices, settlements and projections.
23. Safe-to-Defer Requirements: bank/payment customer connectors/accounting exports/commercial UI.
24. Autonomous Mature State: transactions reconcile continuously and exceptions arrive pre-explained; humans resolve ambiguous mappings and authorize accounting corrections.

## Saturation result
Further branches converge into marketplace payout, revenue leakage, AP and collections products already represented.