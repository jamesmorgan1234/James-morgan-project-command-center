# Company 045 — Autonomous Customer Support Company

**Company ID:** `company:future:045`  
**Primary project:** `project:company:future:045`  
**Roadmap version:** `COMPANY-045-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer messaging, refunds, account changes or public support operation.

## Business identity

Purpose: operate customer support across authorized channels using policy-grounded AI and deterministic workflows, escalating exceptions while continuously measuring correctness and customer outcomes.

Problem: support is repetitive, multilingual, knowledge-intensive and costly, yet wrong AI answers can create privacy, billing, security or reputational harm.

Value: high-coverage Tier 0/1 automation with strict identity, knowledge, action and QA boundaries.

## Product tree

Omnichannel Intake; AI Chat Support; Email Support; Voice Support; SMS/Authorized Social Support; Tier 0 Self-Service; Tier 1 Resolution; Technical Troubleshooting; Billing Support; Returns/Order Support; Account/Access Support; Knowledge Search; Case/Ticket Management; Escalation/Handoff; Customer Identity Verification; Approved Action Tools; Refund/Credit Request Preparation; Multilingual Support; Sentiment/Urgency; QA/Coaching; Workforce/Queue Analytics; Incident/Broadcast Support; Customer Portal/Bot; API/OEM; Vertical Packs; Managed Support Operations.

## Feature/customer/vertical tree

Features: channel identity, customer/account scope, consent, conversation state, ticket priority, intent, knowledge citations, policy version, allowed actions, auth level, sensitive-data redaction, SLA, sentiment, escalation reason, response approval mode, translation, attachments, fraud/security flags, QA score, resolution verification, audit.

Customers: SaaS, ecommerce, marketplaces, subscription businesses, apps, services, travel/hospitality, utilities/admin, enterprise internal support desks, platforms embedding support.

Verticals: ecommerce/returns, SaaS/technical, subscriptions/billing, travel/bookings, financial-service customer support only with strict regulated packs, healthcare administrative support, telecom, education, home services. High-risk sectors restrict autonomous actions.

## Brain capability tree / architecture

Support Brain knows authorized customer/product/account context, knowledge sources, policies and prior case history. It classifies intent, reasons through troubleshooting, recommends/executes only allowed low-risk actions, detects uncertainty/security risk and escalates. It must not invent policy, expose another customer, issue unauthorized financial adjustments or bypass identity verification.

Architecture: omnichannel adapters, customer identity/session, ticket/case state machine, permission/action tools, knowledge RAG with source/version, rules/policy, fraud/security hooks, translation/speech, LLM/model routing, QA/evaluation, workflow engine, audit.

## Agent tree

Intake/Triage Agent, Knowledge Answer Agent, Technical Troubleshooting Agent, Billing Agent, Order/Returns Agent, Account Access Agent, Identity Verification Coordinator, Sentiment/Urgency Agent, Escalation Agent, Multilingual Agent, Voice Agent, QA/Policy Agent, Security/Abuse Agent, Incident Support Agent, Knowledge Gap Agent, Customer Recovery Agent, Workforce Analytics Agent.

## Deterministic services

Channel gateway; ticket/case store; customer/account resolver; auth/verification; knowledge retrieval; action/tool gateway; refund/credit policy rules; queue/SLA routing; translation/speech provider abstraction; attachment scanning; redaction; rate/abuse limits; QA sampling; audit; protected send/financial/account-action gate.

## Workflow

Inbound message/call → treat content as untrusted → identify channel/account → authenticate as needed → classify intent/risk → retrieve cited knowledge/policy → answer or propose allowed action → verify tool result → customer confirmation where appropriate → close with resolution evidence or escalate with full context → QA sample → feed knowledge gaps.

## Integrations / API / data

Helpdesk/CRM, ecommerce/order, billing/payment, identity/auth, product telemetry, status/incident, knowledge/CMS, email/SMS/voice/social, shipping/returns, scheduling, ticketing. APIs for conversations/cases/knowledge/action eligibility/escalation/QA.

Data moat: verified resolution corpus, policy/knowledge mappings, intent/error taxonomy, action outcome evidence, multilingual support patterns—customer conversations remain isolated and privacy-controlled.

## Monetization / distribution

Conversations/tickets/minutes, resolved cases, seats, channels, enterprise/private, voice usage, vertical packs, managed support, API/OEM. Distribution through helpdesk/CRM/ecommerce/SaaS marketplaces and support/BPO partners.

## Security/privacy/compliance

Inbound messages are untrusted; prompt-injection defense; identity verification; least-privilege tools; PII/PCI/health-related data boundaries; no secret exposure to model; protected refunds/account changes/sends; consent/call-recording rules; abuse/harassment safety; retention/delete/export.

## Failure / edge cases

Customer impersonation, ambiguous account, outage causing mass contacts, incorrect KB, policy conflict, emotional/escalated customer, unsupported language, malicious attachment, prompt injection, duplicate refund, tool partial failure, identity provider outage, voice transcription error. Use safe fallback, verification, rate limits and human handoff.

## Scale/platform/overlap

Small support bot → enterprise omnichannel support operations → autonomous support company/platform. Overlap #28 KB maintainer, #46 onboarding, #50 front desk, #89 support-QA. #045 owns active customer support operations.

## Classification

**DESIGN NOW:** untrusted communications, account/identity scope, knowledge provenance, tool/action authorization, channel/brand isolation, QA/evaluation.  
**BUILD NOW:** Command Center communication/tool security and Brand Account identity seams likely affected after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** customer identity/tenant boundaries, comms/voice adapters, support action policy and QA.  
**COMPANY-SPECIFIC LATER:** external support product/channels/knowledge/customer workflows.  
**SCALE-ONLY:** global multilingual voice/contact-center infrastructure.

# Mandatory 24-part completion block

1. Product Tree: omnichannel/chat/email/voice/SMS/social/T0/T1/technical/billing/returns/account/knowledge/cases/escalation/identity/actions/multilingual/QA/analytics/incidents/API/packs/managed.
2. Feature Tree: channel/account/consent/state/priority/intent/citations/policy/auth/redaction/SLA/sentiment/escalation/translation/attachments/security/QA/evidence.
3. Customer Tree: SaaS/commerce/marketplace/subscription/apps/services/travel/enterprise/platforms.
4. Vertical Tree: commerce/SaaS/subscription/travel/regulated support/health admin/telecom/education/home services.
5. Brain Tree: intent/troubleshooting/cited knowledge/action reasoning with identity/policy boundaries.
6. Agent Tree: triage/knowledge/technical/billing/order/account/identity/sentiment/escalation/multilingual/voice/QA/security/incident/gap/recovery/workforce.
7. Service Tree: channels/cases/customer/auth/knowledge/actions/policy/queues/speech/scan/redaction/rate/QA/audit/gates.
8. Workflow Tree: inbound→untrusted scan→identity→intent→knowledge/action→verify→resolve/escalate→QA.
9. Integration Tree: helpdesk/CRM/commerce/billing/auth/product/status/knowledge/comms/shipping/scheduling.
10. Data Tree: customers/cases/messages/intents/knowledge/policies/actions/outcomes/QA/escalations.
11. API Tree: conversations/cases/knowledge/action eligibility/escalation/QA.
12. Monetization Tree: conversations/tickets/minutes/resolutions/seats/channels/enterprise/private/packs/managed/API.
13. Distribution Tree: helpdesk/CRM/commerce/SaaS marketplaces/BPO/support ecosystems.
14. Automation Tree: triage/answers/troubleshooting/routing/QA; money/account/public actions gated.
15. Moat Tree: resolution corpus, knowledge-policy mapping, action outcomes, multilingual patterns.
16. Platform Tree: support assistant→omnichannel autonomous support→support operating platform.
17. Risk Tree: privacy, identity failure, hallucination, unauthorized refund/account action, malicious input, reputational harm.
18. Scale Tree: bot→team→enterprise/global contact-center platform.
19. Spinoff Tree: #28/#46/#50/#89 cover knowledge/onboarding/front desk/QA.
20. Command Center Dependencies: communications/brand identity, Brain/RAG, untrusted-input security, policy, customer isolation, voice, evaluation.
21. Design-Now Requirements: channel/account identity and protected action/tool contracts.
22. Build-Now Requirements: shared communication/untrusted-input/tool-gating seams after reverse-map.
23. Safe-to-Defer Requirements: external support product/channels/customer accounts/pricing.
24. Autonomous Mature State: most routine support resolves automatically with cited knowledge and verified tools; humans handle novel, emotional, high-risk and protected cases.

## Saturation result

Further support branches are onboarding/front-desk/QA/knowledge products already represented.
