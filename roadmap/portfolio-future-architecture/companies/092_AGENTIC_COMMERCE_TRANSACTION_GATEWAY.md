# Company 092 — Agentic Commerce Transaction Gateway

**Company ID:** `company:future:092`  
**Primary project:** `project:company:future:092`  
**Roadmap version:** `COMPANY-092-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no purchase, card/payment issuance, merchant commitment, refund or financial transaction.

## Business identity
Purpose: allow autonomous agents to initiate commerce only inside explicit identity, delegation, budget, merchant, item, price, quantity, tax, fraud and approval constraints with receipts and reconciliation.

## Product tree
Agent Buyer Identity Adapter; Merchant Identity/Trust; Purchase Intent Schema; Budget/Spend Policy; Merchant/SKU Allow-Deny; Quote Comparison; Machine-Readable Offer/Cart; Approval Thresholds; Virtual/Scoped Payment Credential Adapter; Transaction Authorization Gateway; Receipt/Invoice Capture; Subscription/Renewal Controls; Refund/Return Workflow; Dispute Workflow; Tax/Shipping Handoff; Procurement Mode; Travel/Expense Mode; Digital/API Purchase Mode; Recurring Purchase Scheduler; Reconciliation; Audit/Provenance; API/SDK; Enterprise/Private Deployment; Merchant Agent Protocol.

## Feature/customer/vertical tree
Features: agent/owner/company identity, delegation chain, purchase purpose/task, merchant identity, product/SKU/service, quote/version, price/currency/tax/shipping, quantity, budget/cost center, allowed categories, recurring terms, approval threshold, payment credential ref, transaction ID, receipt, refund/dispute and evidence.
Customers: enterprises, agent platforms, procurement systems, travel/expense platforms, API/software buyers, marketplaces and machine-to-machine commerce providers.
Verticals: office/business supplies, SaaS/API purchasing, cloud/compute, travel booking, procurement, marketplace/digital goods and replenishment. High-risk/regulatory categories may be prohibited.

## Brain capability / architecture
Brain may search/compare offers and recommend purchases; deterministic policy must enforce budget, merchant/SKU/category, quantity, price ceiling and approval. Money movement is never inferred from conversational intent alone. Architecture: agent identity/delegation, merchant/product offer schema, budget ledger, purchase-intent record, policy/risk/fraud gate, approval broker, payment-provider abstraction, receipt/provenance ledger and reconciliation.

## Agent tree
Purchase Planner; Quote Comparison Agent; Merchant Trust Agent; Budget Agent; Procurement Agent; Subscription/Renewal Agent; Receipt Agent; Refund/Return Coordinator; Dispute Agent; Reconciliation Agent; Fraud/Security Agent; QA/Compliance Agent.

## Deterministic services
Budget arithmetic; cost-center limits; merchant/category/SKU rules; price/quantity ceilings; recurring commitment parser; one-time authorization; idempotent purchase intent/transaction; payment credential token refs; receipt matching; refund/chargeback state; audit.

## Workflow tree
Task needs purchase → create immutable purchase intent → verify agent identity/delegation → discover/compare eligible offers → freeze merchant/SKU/price/terms → policy/budget/fraud/tax/shipping checks → step-up approval if required → create scoped payment authorization → execute once through provider → capture receipt/order → verify fulfillment → reconcile ledger → handle return/refund/dispute under separate authority.

## Integrations / API / data
Agent identity, procurement catalogs, merchants/marketplaces, payment processors/virtual-card providers, billing/expense systems, tax/shipping, order/fulfillment, accounting and fraud services. Data: intents, offers, policies, budgets, approvals, transaction refs, receipts, fulfillment and reconciliation; raw payment secrets never stored in normal app state.

## Monetization / distribution
Transaction/gateway fees, agent/company subscriptions, purchase volume, enterprise/private, API/SDK, merchant integrations and compliance/security packs. Distribution through agent platforms, procurement/payment ecosystems and merchants.

## Security/privacy/compliance
Extremely high financial risk. Hard spend limits, merchant/category controls, no hidden subscriptions, explicit recurring terms, fraud checks, scoped credentials, separation of requester/approver where required, no purchase from untrusted content alone, full audit and emergency kill switch. Financial/licensing/regulatory obligations vary by role and jurisdiction.

## Failure / edge cases
Price changes after approval, partial fulfillment, duplicate transaction, merchant fraud, counterfeit item, tax/shipping changes, subscription auto-renew, unavailable SKU substitution, agent retries after timeout, refund to wrong instrument, card credential leak, cross-company purchase, ambiguous product, dynamic travel fares.

## Scale / overlap
Internal agent purchasing → enterprise agent commerce → potential agentic financial rails. Overlap #4 permissions, #66 security gateway, #69 billing, #91 identity/trust, #32 procurement. #092 owns autonomous transaction gateway.

## Classification
**DESIGN NOW:** immutable action/purchase intents, agent/delegation identity, budget/cost-center scopes, one-time authorization, receipts/reconciliation, merchant/resource identity, recurring-commitment class.  
**BUILD NOW:** Command Center Financial/Policy Governors and protected-action gate should support exact purchase intents and budgets even though spending remains unauthorized.  
**BUILD BEFORE FIRST COMPANY:** external merchant/payment adapters and customer procurement policies.  
**COMPANY-SPECIFIC LATER:** transaction product, merchant network and regulated payment rails.  
**SCALE-ONLY:** global agent-commerce protocol/network.

# Mandatory 24-part completion block
1. Product Tree: identity/merchant/intent/budget/SKU rules/quotes/offers/approval/payment/receipts/subscriptions/refunds/disputes/tax/procurement/travel/API.
2. Feature Tree: agent/delegation/purpose/merchant/SKU/offer/price/tax/quantity/budget/terms/approval/payment ref/receipt/evidence.
3. Customer Tree: enterprise/agent platform/procurement/travel/API buyers/marketplace/M2M.
4. Vertical Tree: supplies/SaaS-API/cloud/travel/procurement/digital/replenishment.
5. Brain Tree: search/compare/recommend; spending enforcement deterministic and approval-bound.
6. Agent Tree: planner/quotes/merchant trust/budget/procurement/subscription/receipt/refund/dispute/reconcile/security/QA.
7. Service Tree: budgets/rules/ceilings/terms/idempotency/one-time auth/payment refs/receipt match/refund state/audit.
8. Workflow Tree: need→intent→identity→offers→freeze→policy/budget→approve→execute once→receipt→fulfill/reconcile.
9. Integration Tree: identity/catalogs/merchants/payments/expense/tax/shipping/orders/accounting/fraud.
10. Data Tree: intents/offers/policies/budgets/approvals/transactions/receipts/fulfillment/reconciliation.
11. API Tree: intents/offers/authorize/execute status/receipts/refunds/reconcile.
12. Monetization Tree: transactions/volume/agents/companies/enterprise/API/merchant integrations.
13. Distribution Tree: agents/procurement/payments/merchants/OEM.
14. Automation Tree: comparison/policy/receipts automatic; money movement approval-bound.
15. Moat Tree: merchant/product schemas, risk controls, transaction outcome graph, agent interoperability.
16. Platform Tree: purchase gateway→agent commerce rails→machine commerce network.
17. Risk Tree: unauthorized spend/duplicate/subscription trap/fraud/wrong item/cross-company leak/regulatory exposure.
18. Scale Tree: company purchasing→enterprise→cross-merchant agentic network.
19. Spinoff Tree: purchase-intent standard/merchant trust/receipt reconciliation; identity and procurement remain separate.
20. Command Center Dependencies: machine identity, financial governor, protected actions, resource governor, secrets, reconciliation, incidents.
21. Design-Now Requirements: purchase/spend intents must be exact, immutable, scoped, budgeted and separately authorized.
22. Build-Now Requirements: add generic budget/cost-center/purchase-intent semantics to Command Center governance without enabling spend.
23. Safe-to-Defer Requirements: payment rails/merchant network/virtual cards/regulated operations.
24. Autonomous Mature State: agents source and prepare compliant purchases automatically; money executes only inside hard budgets/policies/approval classes and reconciles automatically.

## Saturation result
Further branches converge into procurement, identity/trust, runtime security, billing and payment reconciliation already represented.