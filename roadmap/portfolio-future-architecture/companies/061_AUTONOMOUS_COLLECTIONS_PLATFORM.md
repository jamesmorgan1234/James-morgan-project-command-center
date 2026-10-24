# Company 061 — Autonomous Collections Platform

**Company ID:** `company:future:061`  
**Primary project:** `project:company:future:061`  
**Roadmap version:** `COMPANY-061-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no debtor contact, payment-plan agreement, legal escalation, credit reporting or collection action.

## Business identity

Purpose: orchestrate compliant receivables collections from delinquency detection through prioritization, communication planning, dispute handling, payment-plan workflows, escalation and cash forecasting.

Problem: collections teams use fragmented aging reports, manual outreach and inconsistent escalation; automation can create legal/reputational harm if jurisdiction, consent, dispute or hardship state is ignored.

Value: better prioritization, consistent documentation, reduced manual follow-up and clear exception handling while keeping regulated/high-impact actions behind policy and human authority.

## Complete product tree

Aging/Portfolio Intake; Account Prioritization; Contact Strategy Planner; Communication Drafting; Consent/Channel Preference Engine; Promise-to-Pay Tracker; Payment-Plan Workflow; Dispute Management; Hardship/Exception Routing; Settlement Recommendation Workspace; Escalation/Handoff; Legal/Agency Handoff Pack; Cash Forecasting; Customer Portal; Payment Link/Portal Adapter; Collector Workspace; Compliance Calendar; Analytics/Benchmarking; API/SDK; White-Label/OEM; Enterprise/Private Deployment; Jurisdiction/Industry Packs.

## Feature/customer/vertical tree

Features: debtor/account identity, balance, invoice/contract provenance, aging bucket, payment history, disputes, promises, contact history, consent/channel/time restrictions, jurisdiction, hardship, escalation stage, settlement/payment-plan policy, collector assignment, evidence, status and reconciliation.

Customers: B2B companies, SaaS, service firms, property/utility-adjacent organizations where lawful, healthcare administrative receivables, education/admin, lenders/servicers only under appropriate regulation, collection agencies, accounting firms and enterprise AR teams.

Verticals require distinct compliance packs. Consumer debt is materially different from B2B receivables; the product must not assume one rule set fits all.

## Brain capability tree / architecture

Brain may rank accounts, summarize history, recommend next compliant steps and draft communications. Deterministic policy must enforce jurisdiction/contact rules, dispute holds, consent, time windows, escalation authority and payment-plan constraints. Brain cannot threaten, misrepresent, harass, waive rights or create legal commitments.

Architecture: receivable ledger, policy/jurisdiction engine, contact/consent state, workflow state machine, prioritization/forecasting models, communication templates, dispute/exception queue, promise tracker, protected send/payment-plan/settlement/escalation gates, audit/evidence ledger.

## Agent tree

Portfolio Analyst; Prioritization Agent; Communication Draft Agent; Consent/Channel Agent; Promise Tracker; Dispute Agent; Payment-Plan Coordinator; Hardship/Exception Agent; Forecasting Agent; Escalation Coordinator; Compliance QA Agent; Reconciliation Agent.

## Deterministic services

Aging calculations; payment matching; contact cadence limits; quiet hours; consent/preferences; dispute hold; statute/jurisdiction rule adapters; promise scheduling; plan arithmetic; settlement ceilings; communication idempotency; immutable audit; protected send/commitment/legal-handoff gates.

## Workflow tree

Receivable becomes due → verify balance/provenance → classify customer/jurisdiction/rules → prioritize → select permitted next step → draft/approve communication → send only under authorized channel policy → capture response/payment/dispute/promise → update workflow → hold/escalate as required → reconcile payment/plan → close or authorized handoff with evidence.

## Integrations / API / data

Accounting/ERP, invoicing, CRM, payment processors, bank reconciliation, customer portals, email/SMS/voice providers, contract repositories, ticketing/case systems and legal/agency handoff where authorized. APIs for accounts, balances, contacts, promises, disputes, plans, payments, workflows and evidence.

Data: accounts, invoices, balances, contacts, consents, disputes, promises, plans, payments, jurisdiction state, communications and outcomes. Financial/personal data is highly sensitive and isolated.

## Monetization / distribution

Accounts/receivables volume, recovered amounts under compliant contracts, seats, channels, enterprise/private, API/OEM, managed collections-support software, industry packs. Distribution through accounting/ERP/AR ecosystems and finance consultants. Legal collection services are separate and jurisdiction-dependent.

## Security/privacy/compliance

Strong identity verification, consent/preferences, jurisdiction-aware communication, dispute/cease-contact holds, no harassment/deception, audit, access controls, retention and escalation. Product must not claim universal legal compliance or replace qualified counsel.

## Failure / edge cases

Wrong debtor, disputed invoice, partial payment, unapplied credit, bankruptcy/insolvency notice, cease-contact request, deceased customer, hardship, timezone, attorney representation, duplicate account, promised payment missed, payment received after queued message, chargeback/refund, fraud claim. Stale queues must reconcile before any contact.

## Scale / overlap

SMB AR → enterprise collections orchestration → regulated workflow infrastructure. Overlap #30 payment recovery, #86 reconciliation, #93 consent. #061 owns post-due collections lifecycle.

## Classification

**DESIGN NOW:** protected communications/financial commitments, consent/preferences, legal/jurisdiction policy packs, reconciliation/idempotency, evidence.  
**BUILD NOW:** Command Center communication/financial governance must remain able to represent jurisdictional/contact constraints and stale-state revalidation.  
**BUILD BEFORE FIRST COMPANY:** receivable workflow engine, policy adapters, consent/contact ledger, payment reconciliation.  
**COMPANY-SPECIFIC LATER:** customer channels, legal packs, portals, scoring models/pricing.  
**SCALE-ONLY:** large portfolio optimization and multi-jurisdiction operations.

# Mandatory 24-part completion block

1. Product Tree: aging/prioritization/comms/consent/promises/plans/disputes/hardship/settlement/escalation/forecast/portal/compliance/API.
2. Feature Tree: identity/balance/provenance/aging/history/dispute/promise/consent/jurisdiction/stage/policy/evidence/reconcile.
3. Customer Tree: B2B/SaaS/services/property-utility adjacent/health admin/education/lenders under rules/agencies/accounting/enterprise AR.
4. Vertical Tree: B2B, consumer-regulated only with specific packs, property, services, health admin, education, enterprise.
5. Brain Tree: prioritization/summary/recommendation/drafting; threats/legal commitments/regulated decisions restricted.
6. Agent Tree: portfolio/prioritize/comms/consent/promise/dispute/plan/hardship/forecast/escalation/compliance/reconcile.
7. Service Tree: aging/payments/cadence/quiet hours/consent/holds/rules/promises/arithmetic/ceilings/idempotency/audit.
8. Workflow Tree: due→verify→classify→prioritize→permitted action→response→reconcile→escalate/close.
9. Integration Tree: ERP/invoicing/CRM/payments/bank/contracts/comms/case/legal handoff.
10. Data Tree: accounts/invoices/balances/contacts/consents/disputes/promises/plans/payments/outcomes.
11. API Tree: accounts/balances/contacts/promises/disputes/plans/payments/workflows/evidence.
12. Monetization Tree: accounts/volume/recovery-share where lawful/seats/channels/enterprise/API/managed/packs.
13. Distribution Tree: accounting/ERP/AR consultants/finance ecosystems.
14. Automation Tree: prioritization/cadence/reconciliation automated; sends/settlements/legal escalation gated.
15. Moat Tree: outcome history, policy packs, dispute/repayment patterns, integrations.
16. Platform Tree: collections assistant→AR collections OS→receivables recovery infrastructure.
17. Risk Tree: unlawful contact/wrong debtor/stale balance/privacy leak/harassment/incorrect commitment.
18. Scale Tree: SMB→enterprise→multi-jurisdiction portfolio.
19. Spinoff Tree: consent/comms scoring modules; reconciliation/payment recovery remain adjacent companies.
20. Command Center Dependencies: financial governor, communications, consent, policy, evidence, reconciliation, identity.
21. Design-Now Requirements: jurisdiction/action-policy and stale-financial-state revalidation interfaces.
22. Build-Now Requirements: preserve protected communication/financial-commitment taxonomy in Command Center.
23. Safe-to-Defer Requirements: collection connectors, customer portals, legal packs, models, pricing.
24. Autonomous Mature State: routine prioritization, compliant cadence and reconciliation run continuously; humans handle disputes, hardship, legal escalation and protected commitments.

## Saturation result

Further branches converge into invoice recovery, consent management and payment reconciliation rather than new top-level scope.