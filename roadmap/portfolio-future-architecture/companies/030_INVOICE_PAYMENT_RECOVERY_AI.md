# Company 030 — Invoice / Payment Recovery AI

**Company ID:** `company:future:030`  
**Primary project:** `project:company:future:030`  
**Roadmap version:** `COMPANY-030-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer contact, payment-plan agreement, collections handoff or financial action.

## Business identity

Purpose: help businesses prioritize and recover overdue invoices through evidence-based account triage, respectful communication preparation, dispute tracking and cash forecasting.

Problem: AR teams manually chase invoices, miss disputes/promises, lack account prioritization and cannot distinguish process errors from real collection risk.

Value: organized receivables state, next-best-action recommendations, promise tracking, dispute resolution workflows and verified recovery attribution.

## Product tree

AR Aging Dashboard; Invoice/Account Priority Score; Payment Reminder Planner; Communication Drafts; Promise-to-Pay Tracker; Dispute Intake/Classification; Missing PO/Documentation Resolver; Payment Portal Links/Status; Account Health; Payment History; Cash Collection Forecast; Escalation Rules; Sales/Account-Manager Coordination; Partial Payment/Allocation Tracking; Payment Plan Workflow where lawful/authorized; Collection Handoff Package; Recovery Analytics; Root-Cause/Prevention Analytics; API/OEM; Vertical Packs.

## Feature/customer/vertical tree

Features: invoice balance/due date/terms, aging buckets, customer/entity hierarchy, contact preferences, invoice delivery/open status, dispute reason, PO/reference, promise amount/date, payment/credit/refund, notes/evidence, risk/confidence, communication cadence, legal/compliance flags, escalation, forecast, audit.

Customers: SMB/midmarket/enterprise B2B, agencies, professional services, wholesalers/distributors, contractors, SaaS with invoices, logistics, manufacturers, staffing, property/service businesses.

Verticals: construction/subcontract, agencies/services, wholesale, logistics, staffing, SaaS/B2B subscriptions, manufacturing, property/vendor services. Debt-collection laws and customer type/jurisdiction matter.

## Brain / architecture

Brain analyzes account history, dispute cause, promises and likely recovery path; predicts cash timing and recommends next action/message. Deterministic ledger/reconciliation and policy own balances/cadence. It cannot threaten, misstate debt, agree legal terms or move money.

Architecture: AR/invoice ledger import, customer/entity graph, rules/state machine, communication consent/policy, forecast/risk model, document/evidence integration, LLM for cited communication drafts/dispute summaries, deterministic payment reconciliation.

## Agents

AR Triage Agent, Reminder Planner, Communication Draft Agent, Dispute Agent, Documentation Resolver, Promise Tracker, Account Health Agent, Cash Forecast Agent, Escalation Agent, Sales Coordination Agent, Handoff Package Agent, Recovery Attribution Agent, Root-Cause Agent, Compliance/Policy Agent.

## Deterministic services

Invoice/payment import; reconciliation; aging engine; promise scheduler; dispute state; communication queue/limits; document/evidence store; payment status connector; forecast calculator; escalation rules; audit; protected send/financial/legal gate.

## Workflow

Invoice becomes due → reconcile payment/credits → classify delinquency/dispute → prioritize account → check contact/legal policy → prepare reminder/action → authorized send/task → track reply/promise/dispute → resolve documentation → verify payment → update cash forecast/attribution → escalate or close.

## Integrations / API / data

Accounting/ERP, payment processors/banks (read/status), invoicing, CRM, email/SMS, customer portals, document/PO systems, sales/project systems, collections/legal handoff providers only when authorized. APIs for aging/accounts/disputes/promises/recommendations/forecast/recovery.

Data moat: account payment behavior, dispute taxonomy, action/outcome history, recovery timing models and root-cause patterns. Customer financial/communications data isolated.

## Monetization / distribution

Invoices/accounts/AR volume, seats, subscription, verified-recovery share, enterprise/private, API/OEM, managed AR operations. Distribution through accounting/ERP/payment/CRM ecosystems, finance consultants/bookkeepers.

## Security/privacy/legal

Financial/customer data sensitive; no autonomous coercive communication; consent/channel/time rules; jurisdiction/debt-collection boundaries; protected payment plans/legal escalation/refunds/credits; no false balances; audit and evidence.

## Failure / edge cases

Payment received but not posted, credit memo pending, invoice disputed, wrong contact, invoice never delivered, duplicate invoice, customer insolvency, partial payment, multi-currency, tax withholding, promised payment missed, account under legal hold. Reconcile before outreach and surface unknown state.

## Scale/overlap

Small AR team → enterprise receivables operations. Overlap #10 subscription recovery, #61 autonomous collections, #85 revenue leakage, #86 payment reconciliation. #030 is pre-collections B2B invoice recovery.

## Classification

**DESIGN NOW:** financial truth/reconciliation, communication/legal protected actions, evidence, scheduling, company/customer isolation.  
**BUILD NOW:** finance/comms/policy/event primitives after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** accounting/payment connector abstractions, consent/contact policy, financial audit.  
**COMPANY-SPECIFIC LATER:** AR models/messages/customer portal/pricing.  
**SCALE-ONLY:** large enterprise portfolio forecasting/managed AR.

# Mandatory 24-part completion block

1. Product Tree: aging/priority/reminders/drafts/promises/disputes/docs/payment status/health/history/forecast/escalation/sales/partial/payment plans/handoff/analytics/prevention/API/packs.
2. Feature Tree: balances/terms/aging/hierarchy/preferences/delivery/disputes/PO/promises/payments/credits/evidence/risk/cadence/legal/forecast/audit.
3. Customer Tree: B2B SMB-enterprise/agencies/services/wholesale/contractors/SaaS/logistics/manufacturing/staffing/property.
4. Vertical Tree: construction, agencies, wholesale, logistics, staffing, SaaS, manufacturing, property services.
5. Brain Tree: account/dispute/recovery/cash reasoning and drafts; money/legal/comms actions gated.
6. Agent Tree: triage/reminder/draft/dispute/docs/promise/health/forecast/escalation/sales/handoff/attribution/root-cause/policy.
7. Service Tree: invoice/payment ingest/reconcile/aging/promises/dispute/comms/docs/payment connector/forecast/rules/audit.
8. Workflow Tree: due→reconcile→classify→prioritize→policy→action→track→resolve→verify payment→forecast/close.
9. Integration Tree: accounting/ERP/payment/invoice/CRM/comms/portal/docs/project/authorized collections.
10. Data Tree: invoices/payments/credits/accounts/disputes/promises/comms/evidence/forecasts/outcomes.
11. API Tree: aging/accounts/disputes/promises/recommendations/forecast/recovery.
12. Monetization Tree: invoices/accounts/AR/seats/recovery share/enterprise/private/API/OEM/managed.
13. Distribution Tree: accounting/ERP/payment/CRM/bookkeepers/finance consultants.
14. Automation Tree: reconciliation/aging/priority/reminders/tasks/forecast; sends/plans/legal escalation gated.
15. Moat Tree: payment/dispute/outcome history, recovery timing, root-cause corpus.
16. Platform Tree: AR assistant→recovery operations→receivables intelligence.
17. Risk Tree: wrong debt/contact, privacy, coercive messaging, legal boundaries, reconciliation errors.
18. Scale Tree: SMB→multi-entity enterprise→managed AR platform.
19. Spinoff Tree: adjacent #10/#61/#85/#86 already cover subscription/collections/leakage/reconciliation.
20. Command Center Dependencies: finance/reconciliation, communications policy, scheduler, docs/evidence, company isolation.
21. Design-Now: financial source-of-truth and protected communication/legal action boundaries.
22. Build-Now: shared finance/comms/evidence hooks after reverse-map.
23. Safe-to-Defer: customer AR product/messages/models/portal/pricing.
24. Autonomous Mature State: aging/reconciliation/prioritization/forecast/tasks run continuously; authorized routine reminders may automate; humans handle disputes/legal/financial exceptions.

## Saturation result

Further branches are collections, payment reconciliation or revenue leakage products already in portfolio.
