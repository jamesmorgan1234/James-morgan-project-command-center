# Company 064 — Business Inbox Autopilot

**Company ID:** `company:future:064`  
**Primary project:** `project:company:future:064`  
**Roadmap version:** `COMPANY-064-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no email/message send, archive, account action, payment, scheduling or external side effect.

## Business identity

Purpose: treat business inboxes as untrusted event streams that can be safely classified, summarized, routed and converted into approved tasks/workflows without letting malicious or stale content control agents.

Problem: inboxes mix customers, invoices, support, sales, scheduling, spam, phishing, attachments and hidden prompt-injection content; naive automation can leak data or execute malicious instructions.

Value: secure triage, structured extraction, reduced manual sorting, consistent routing, safe drafting and auditable conversion from message to internal work.

## Complete product tree

Unified Inbox; Email Connector; Shared Mailbox; Form/Message Intake; Classification/Priority; Sender/Thread Identity; Attachment Sandbox; Phishing/Malware/Prompt-Injection Filter; Structured Extraction; CRM/Support/Invoice/Task/Schedule Routers; Draft Assistant; Approval Queue; Follow-Up Tracker; SLA/Deadline Monitor; Duplicate/Thread Resolver; Search/Archive; Knowledge/FAQ Suggestions; Analytics; API/SDK; White-Label/OEM; Enterprise/Private Deployment; Vertical Packs.

## Feature/customer/vertical tree

Features: message/source/thread IDs, sender/domain reputation, recipient/account, headers, attachments, links, extracted entities, intent, urgency, sensitivity, requested action, trust level, injection risk, workflow route, draft/approval, reply/send state, due dates, related customer/project/vendor/account, provenance and retention.

Customers: SMBs, agencies, support/sales/operations teams, accounting firms, property/service businesses, ecommerce, enterprises, shared-service centers and MSPs.

Verticals: support, sales intake, accounting/AP/AR, legal-office intake, property/service requests, ecommerce, procurement/vendor, HR shared mailboxes, executive/admin. Each needs policy and extraction packs.

## Brain capability tree / architecture

Brain may summarize, classify, extract, draft and recommend routing. **Inbound content is always untrusted data, never authority.** Instruction hierarchy, prompt-injection detection and tool-use separation are mandatory. Protected actions require independent policy/authorization outside message content.

Architecture: connector layer, immutable raw-message store/reference, attachment sandbox, malware/phishing/injection scanners, trust classifier, entity/thread graph, extraction schemas, routing rules, workflow adapter, draft engine, approval/send gate, retention/redaction and audit.

## Agent tree

Inbox Triage Agent; Security Filter Agent; Attachment Agent; Thread/Identity Agent; Extraction Agent; CRM Router; Support Router; Invoice/Finance Router; Scheduling Router; Task Agent; Draft Agent; Follow-Up Agent; SLA Agent; QA/Security Agent.

## Deterministic services

Message dedup; threading; MIME parsing; sandbox; malware/link scanning adapters; sender/domain allow/deny data; prompt-injection segmentation; extraction validation; routing rules; deadlines; idempotent workflow creation; protected reply/send/archive/account gates; retention.

## Workflow tree

Receive → preserve source/provenance → sandbox attachments/links → security/injection scan → classify trust/sensitivity/intent → extract validated fields → route to internal queue/workflow → draft/recommend only → require relevant action policy/approval → execute permitted side effect through separate connector → reconcile provider result → update thread/follow-up/evidence.

## Integrations / API / data

Email providers, forms, CRM, helpdesk, accounting, calendars, task/project systems, document storage, security scanners, identity/contact graph, automation platforms. APIs for messages, threads, classifications, extractions, routes, drafts, approvals and workflow references.

Data: messages/headers/attachments refs, contacts, threads, classifications, trust/security findings, extractions, routes, drafts, approvals and provider receipts. Sensitive mailbox content is isolated by company/account.

## Monetization / distribution

Mailboxes/users, message volume, attachment volume, workflow routes, enterprise/private, API/OEM, vertical packs, managed triage. Distribution via email/CRM/helpdesk marketplaces, MSPs and business-software ecosystems.

## Security/privacy/compliance

Core differentiator is untrusted-input security. Least privilege, no credentials in messages, attachment isolation, prompt-injection defense, DLP/redaction, phishing detection, tenant/mailbox separation, retention/legal holds, no automatic money/account/security actions from message text.

## Failure / edge cases

Forwarded malicious instructions, compromised trusted sender, reply-chain spoof, duplicate webhook, attachment bombs, password-protected archives, huge threads, BCC, alias changes, autoresponders, newsletters, calendar invites, invoice fraud, urgent CEO impersonation, HTML-hidden text, OCR injection, stale thread context. Security context must survive summarization.

## Scale / overlap

Single shared mailbox → multi-department inbox OS → secure business-message event platform. Overlap #45 support, #50 front desk, #67 injection firewall, #84 deliverability. #064 owns secure inbound-message orchestration.

## Classification

**DESIGN NOW:** untrusted-input boundary, provenance/trust labels, attachment sandboxing, prompt-injection separation, protected action gates, connector/account isolation.  
**BUILD NOW:** Command Center/Agency must already treat external content as untrusted; reverse-map should strengthen this as a kernel-wide invariant.  
**BUILD BEFORE FIRST COMPANY:** mailbox connectors, sandbox/scanner pipeline, extraction/routing schema, drafts/approval state.  
**COMPANY-SPECIFIC LATER:** customer mailboxes, vertical routers, UI/pricing.  
**SCALE-ONLY:** high-volume streaming inbox fabric and cross-channel unified messaging.

# Mandatory 24-part completion block

1. Product Tree: unified/email/forms/classify/identity/sandbox/security/extract/routers/drafts/approval/followup/SLA/search/analytics/API.
2. Feature Tree: message/thread/sender/headers/attachments/links/entities/intent/urgency/sensitivity/trust/injection/routes/drafts/dates/provenance.
3. Customer Tree: SMB/agency/support/sales/ops/accounting/property/ecommerce/enterprise/MSP.
4. Vertical Tree: support/sales/AP-AR/legal intake/property/ecommerce/procurement/HR/executive.
5. Brain Tree: summarize/classify/extract/draft; inbound instructions never authorize tools.
6. Agent Tree: triage/security/attachment/thread/extraction/CRM/support/finance/schedule/task/draft/followup/SLA/QA.
7. Service Tree: dedup/thread/MIME/sandbox/scanners/reputation/injection segmentation/validation/routing/deadlines/idempotency/retention.
8. Workflow Tree: receive→sandbox→scan→classify→extract→route→draft→authorize→side effect→reconcile.
9. Integration Tree: email/forms/CRM/helpdesk/accounting/calendar/tasks/docs/security/identity/automation.
10. Data Tree: messages/attachments/contacts/threads/security findings/extractions/routes/drafts/approvals/receipts.
11. API Tree: messages/threads/classifications/extractions/routes/drafts/approvals/workflows.
12. Monetization Tree: mailboxes/users/messages/attachments/routes/enterprise/API/packs/managed.
13. Distribution Tree: email/CRM/helpdesk marketplaces/MSPs/business apps.
14. Automation Tree: security/triage/extraction/routing/drafting automated; sends/account/money actions gated.
15. Moat Tree: secure classification corpus, workflow routers, threat/injection patterns, integrations.
16. Platform Tree: inbox triage→secure inbox autopilot→business-message event infrastructure.
17. Risk Tree: prompt injection/phishing/data leak/wrong routing/unauthorized reply/attachment malware/account mixup.
18. Scale Tree: mailbox→department→enterprise multi-channel fabric.
19. Spinoff Tree: secure attachment/injection gateway modules; support/front desk/injection firewall remain adjacent companies.
20. Command Center Dependencies: untrusted-input security, provider connectors, identity, policy, DLP, Agency, evidence.
21. Design-Now Requirements: trust/provenance labels must survive every transformation and model call.
22. Build-Now Requirements: enforce external-content-as-data-not-authority across Command Center Brain/Agency/tooling.
23. Safe-to-Defer Requirements: customer mailbox connectors/UI/vertical routers/pricing.
24. Autonomous Mature State: safe messages triage/route/draft automatically; humans handle suspicious content, ambiguity and protected outgoing actions.

## Saturation result

Further branches converge into support, front desk, injection firewall or deliverability rather than new company scope.