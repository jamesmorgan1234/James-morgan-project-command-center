# Company 037 — Internal Policy Autopilot

**Company ID:** `company:future:037`  
**Primary project:** `project:company:future:037`  
**Roadmap version:** `COMPANY-037-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no policy publication, employee attestation, legal acceptance or disciplinary action.

## Business identity

Purpose: maintain internal company policies as versioned, source-backed operational controls tied to regulations, business processes, employee acknowledgments, training and exception workflows.

Problem: policies go stale, conflict with one another, fail to map to actual systems/workflows and become disconnected from new regulations or business changes.

Value: one governed policy lifecycle from draft through review, communication, acknowledgment, exception and evidence.

## Product tree

Policy Library; Drafting/Template Studio; Policy Versioning/Supersession; Conflict/Overlap Detection; Regulation/Control Mapping; Procedure/Workflow Mapping; Owner/Reviewer Registry; Review Calendar; Employee/Role Applicability; Acknowledgment Tracking; Training Linkage; Exception/Waiver Management; Policy Q&A with Citations; Change Summaries; Employee Portal; Audit/Evidence Export; Policy Analytics; API/OEM; Vertical/Framework Packs.

## Feature/customer/vertical tree

Features: policy ID/title/type, effective/retire dates, scope/roles/locations, source/regulatory refs, owner/reviewer, version/diff, approval state, required acknowledgment, training dependency, exception reason/expiry, conflict status, linked procedures/controls/systems, review frequency, citations, audit, localization/accessibility.

Customers: HR, legal ops, compliance, security, privacy, IT, operations, SMB through enterprise, nonprofits, public contractors, SaaS platforms embedding policy workflows.

Verticals: information security, privacy, HR/workplace, finance controls, acceptable use, AI use, procurement/vendor, incident response, data retention, healthcare admin, public contracting. Legal/regulatory interpretation remains specialist-owned.

## Brain / architecture

Brain compares policy versions, detects contradictions, maps requirements to procedures and drafts revisions/change summaries with citations. It cannot make law, bind employees, publish policy or approve exceptions without authority.

Architecture: policy/version registry, source/control graph, search/RAG, document diff, rules for applicability/reviews, workflow/approval, acknowledgment/training links, exceptions, LLM drafting grounded in approved sources.

## Agent tree

Policy Draft Agent, Conflict Agent, Regulation Mapping Agent, Procedure Mapping Agent, Review Calendar Agent, Acknowledgment Agent, Training Link Agent, Exception/Waiver Agent, Policy Q&A Agent, Change Communication Draft Agent, Evidence/Audit Agent, Localization Agent.

## Deterministic services

Policy registry/versioning; diff; source/control graph; review scheduler; applicability engine; approval workflow; acknowledgment ledger; training status; exception expiry; notification; audit/export; protected publish gate.

## Workflow

Trigger (new rule/periodic review/business change) → identify affected policies → source/impact map → draft diff → conflict/control review → owner/legal/security approval → protected publish → acknowledgment/training → exception handling → evidence → next review.

## Integrations / API / data

HRIS, LMS, identity/roles, GRC/compliance, knowledge bases, ticketing/workflows, regulation monitor, e-sign/acknowledgment, document storage. APIs for policies/versions/applicability/acknowledgments/exceptions/reviews.

Data moat: policy-control-procedure graph, reviewed change corpus, vertical templates and exception patterns; customer policies isolated.

## Monetization / distribution

Users/employees/policies/framework packs, enterprise/private, API/OEM, managed policy operations, premium change monitoring. Distribution through HR/GRC/security/privacy/knowledge ecosystems and consultants.

## Security/privacy/legal

Policies can reveal security and legal posture. Strict access/role scope, privileged policy handling, no unsupported legal advice, protected publication/attestation, immutable history, retention/legal holds.

## Failure / edge cases

Conflicting approved policies, retroactive effective date, role/location mismatch, unreviewed legal wording, exception outliving policy, training linked to superseded version, employee on leave, translation drift. Use exact versions/effective dates and explicit applicability.

## Scale/overlap

Small handbook → enterprise policy governance platform. Overlap #12 compliance, #16 regulation, #28 knowledge base, #75 access review. #037 owns internal policy lifecycle.

## Classification

**DESIGN NOW:** decision/rule/version/scope/effective-date/supersession records, citations, approval/publish boundaries.  
**BUILD NOW:** Command Center already has rule/decision ledgers; reverse-map policy-pack/applicability contracts.  
**BUILD BEFORE FIRST COMPANY:** company tenant policy namespaces, acknowledgment/training/exception abstractions.  
**COMPANY-SPECIFIC LATER:** customer policy product/templates/integrations.  
**SCALE-ONLY:** global regulatory/policy pack ecosystem.

# Mandatory 24-part completion block

1. Product Tree: library/drafting/version/conflict/regulation/procedure/owners/reviews/applicability/ack/training/exceptions/Q&A/change summaries/portal/audit/analytics/API/packs.
2. Feature Tree: identity/scope/dates/sources/owners/diffs/approval/ack/training/exceptions/links/reviews/citations/audit/localization.
3. Customer Tree: HR/legal/compliance/security/privacy/IT/ops/SMB-enterprise/nonprofit/public/SaaS platforms.
4. Vertical Tree: security/privacy/HR/finance/acceptable use/AI/procurement/incidents/retention/health admin/public contracting.
5. Brain Tree: cited compare/conflict/map/draft; legal approval/publishing prohibited.
6. Agent Tree: draft/conflict/regulation/procedure/review/ack/training/exception/Q&A/comms/evidence/localization.
7. Service Tree: registry/version/diff/graph/scheduler/applicability/approval/ack/training/exceptions/notify/audit/publish gate.
8. Workflow Tree: trigger→impact→draft→review→approve→publish→ack/train→exception→evidence→review.
9. Integration Tree: HRIS/LMS/IAM/GRC/knowledge/tickets/regulation/e-sign/docs.
10. Data Tree: policies/versions/sources/controls/procedures/applicability/approvals/acks/exceptions/training.
11. API Tree: policy/version/applicability/ack/exception/review.
12. Monetization Tree: users/employees/policies/packs/enterprise/private/API/OEM/managed.
13. Distribution Tree: HR/GRC/security/privacy/knowledge/consultant ecosystems.
14. Automation Tree: monitoring/diffs/conflict/review reminders/drafts; publication/attestation gated.
15. Moat Tree: policy-control-procedure graph, reviewed changes, vertical templates.
16. Platform Tree: policy library→continuous policy governance→enterprise control framework.
17. Risk Tree: legal error, security disclosure, stale/conflicting policy, bad applicability, false acknowledgment.
18. Scale Tree: handbook→multi-department→global enterprise policy plane.
19. Spinoff Tree: adjacent #12/#16/#28/#75 already cover compliance/regulation/knowledge/access.
20. Command Center Dependencies: rule/decision ledgers, policy packs, docs/provenance, scheduler, identity, audit.
21. Design-Now Requirements: versioned scoped effective-date rule/policy contract.
22. Build-Now Requirements: strengthen Command Center policy-pack and applicability seams after reverse-map.
23. Safe-to-Defer Requirements: customer policy product/templates/employee portal/pricing.
24. Autonomous Mature State: review monitoring/conflict detection/draft preparation/ack tracking run automatically; authorized people approve material policies/exceptions.

## Saturation result

Further branches are compliance/knowledge/training/access modules already represented or policy-pack variants.
