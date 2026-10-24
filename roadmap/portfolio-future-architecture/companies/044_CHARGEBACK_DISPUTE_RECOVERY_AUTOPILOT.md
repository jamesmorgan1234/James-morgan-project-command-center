# Company 044 — Chargeback & Dispute Recovery Autopilot

**Company ID:** `company:future:044`  
**Primary project:** `project:company:future:044`  
**Roadmap version:** `COMPANY-044-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no dispute filing, financial action or customer communication.

## Business identity

Purpose: organize transaction disputes/chargebacks, assemble evidence, map reason codes and deadlines, recommend prevention actions and measure verified recovery outcomes.

Problem: merchants lose valid revenue because evidence is scattered, deadlines are short and reason-code requirements differ.

Value: complete dispute packets, evidence provenance, readiness checks and root-cause prevention.

## Product tree

Dispute Intake; Reason-Code Normalizer; Deadline Calendar; Transaction/Order Linkage; Customer Communication Evidence; Delivery/Fulfillment Evidence; Usage/Login/Service Evidence; Contract/Policy Evidence; Evidence Packet Builder; Filing Readiness; Response Draft; Outcome/Recovery Tracker; Fraud/Abuse Signals; Prevention Analytics; Merchant/Processor Benchmarking; Alerting; API/OEM; Vertical Packs; Managed Dispute Ops.

## Feature/customer/vertical tree

Features: processor/network, dispute ID, reason code/version, amount/currency, transaction/order/customer, deadline/timezone, evidence requirements, source hash/provenance, delivery/usage/refund status, prior contact, terms accepted, fraud signals, packet completeness, outcome, fee/recovery attribution, audit.

Customers: ecommerce, SaaS/digital services, marketplaces, travel/hospitality, subscription businesses, online services, merchants/agencies, enterprise payment teams.

Verticals: physical goods, digital goods, SaaS/subscriptions, marketplaces, bookings/travel, services. Rules/evidence differ by processor/network/jurisdiction.

## Brain / architecture

Brain maps reason codes to evidence requirements, identifies gaps and drafts concise evidence narratives grounded in records. Deterministic deadlines/packet rules and processor schemas own readiness. It cannot fabricate evidence or file disputes without authorization.

Architecture: payment/dispute event ledger, reason-code registry, transaction/order graph, artifact/evidence store, document renderer, rules/checklist, scheduler, fraud analytics, LLM for cited narrative drafting, outcome analytics.

## Agent tree

Dispute Intake Agent, Reason-Code Agent, Evidence Collector, Fulfillment Agent, Usage Evidence Agent, Communication Evidence Agent, Narrative Draft Agent, Readiness QA Agent, Deadline Agent, Fraud/Abuse Agent, Outcome/Reconciliation Agent, Prevention Analyst, Processor Integration Agent.

## Deterministic services

Processor/webhook connectors; transaction/dispute registry; reason-code rules; deadline scheduler; evidence hash/store; packet generator; completeness validator; filing adapter gate; reconciliation; fraud rules; audit.

## Workflow

Dispute event → normalize reason/deadline → link transaction/order/account → collect verified evidence → validate requirements → draft packet → QA → protected filing → monitor processor status → reconcile outcome/fees → attribute recovered amount → feed prevention analytics.

## Integrations / API / data

Payment processors, ecommerce/OMS, shipping/carriers, CRM/support, auth/usage analytics, subscription billing, document storage, fraud systems, accounting. APIs for disputes/evidence/readiness/deadlines/outcomes/prevention.

Data moat: reason/evidence mappings, outcome corpus, processor requirements/version history, fraud/prevention patterns. Customer transaction data isolated.

## Monetization / distribution

Disputes/transactions, recovered-value share, subscription, seats, enterprise/private, API/OEM, managed ops. Distribution through payment/ecommerce/merchant ecosystems and agencies.

## Security/legal/privacy

Payment/customer evidence sensitive. No card secrets, false evidence or harassment; protect PII; processor terms; filing protected; financial reconciliation exact; audit/retention.

## Failure / edge cases

Reason-code change, duplicate dispute, refund already issued, lost tracking, digital service partial use, customer identity mismatch, deadline timezone, evidence not admissible, processor outage, overturned outcome. Use versioned requirements, evidence confidence and reconciliation.

## Scale/overlap

Merchant tool → enterprise dispute operations. Overlap #57 fraud, #86 payment reconciliation, #92 commerce gateway. #044 focuses merchant dispute evidence/recovery.

## Classification

**DESIGN NOW:** financial event IDs, evidence/provenance, deadline/version, protected filing, reconciliation.  
**BUILD NOW:** generic finance/evidence/protected-action seams after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** processor adapters, financial isolation, document/evidence packaging.  
**COMPANY-SPECIFIC LATER:** dispute rules/customer UI/pricing.  
**SCALE-ONLY:** cross-processor benchmark network.

# Mandatory 24-part completion block

1. Product Tree: intake/reasons/deadlines/linkage/comms/delivery/usage/policy/evidence packets/readiness/drafts/outcomes/fraud/prevention/benchmarks/API/packs/managed.
2. Feature Tree: processor/reason/amount/order/deadline/evidence/refund/contact/terms/fraud/completeness/outcome/fees/audit.
3. Customer Tree: ecommerce/SaaS/marketplaces/travel/subscriptions/services/merchant teams.
4. Vertical Tree: physical/digital/SaaS/marketplace/bookings/services.
5. Brain Tree: reason/evidence/gap/narrative reasoning with no evidence fabrication/filing.
6. Agent Tree: intake/reason/evidence/fulfillment/usage/comms/draft/QA/deadline/fraud/outcome/prevention/integration.
7. Service Tree: connectors/registry/rules/scheduler/evidence/packet/validator/filing gate/reconcile/fraud/audit.
8. Workflow Tree: dispute→normalize→link→collect→validate→draft→QA→file→monitor→reconcile→prevent.
9. Integration Tree: payment/commerce/shipping/CRM/auth/analytics/billing/docs/fraud/accounting.
10. Data Tree: disputes/transactions/orders/evidence/reasons/deadlines/packets/outcomes/fees.
11. API Tree: dispute/evidence/readiness/deadline/outcome/prevention.
12. Monetization Tree: disputes/transactions/recovery-share/subscription/seats/enterprise/API/managed.
13. Distribution Tree: payment/ecommerce/merchant/agencies.
14. Automation Tree: intake/evidence/checklist/draft/status/reconcile; filing gated.
15. Moat Tree: processor reason/evidence corpus and outcomes.
16. Platform Tree: dispute assistant→merchant recovery operations→payment dispute intelligence.
17. Risk Tree: false evidence, PII/payment leakage, missed deadlines, reconciliation errors.
18. Scale Tree: merchant→enterprise→cross-processor platform.
19. Spinoff Tree: adjacent #57/#86/#92 already cover fraud/reconciliation/commerce.
20. Command Center Dependencies: finance/evidence/scheduler/policy, integrations, isolation.
21. Design-Now Requirements: exact financial/evidence/deadline/protected filing contracts.
22. Build-Now Requirements: shared finance/evidence seams after reverse-map.
23. Safe-to-Defer Requirements: processor/customer product/pricing.
24. Autonomous Mature State: evidence collection/readiness/outcome monitoring run automatically; humans authorize filings and exceptional narratives.

## Saturation result

Additional branches map to fraud/reconciliation/payment infrastructure already represented.
