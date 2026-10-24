# Company 075 — Identity Access Review Autopilot

**Company ID:** `company:future:075`  
**Primary project:** `project:company:future:075`  
**Roadmap version:** `COMPANY-075-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no access revocation, attestation submission or account mutation.

## Business identity
Purpose: automate recurring certification of human, contractor, vendor, service-account and AI-agent access across apps, cloud, databases, groups and privileged roles.

## Product tree
Access Inventory; Review Campaigns; Continuous Certification; Manager/Owner Attestation; Risk-Based Review; Dormant Account Review; Privileged Access Review; Service/Machine/Agent Identity Review; Application/Group/Role Review; Evidence Collector; Exception/Justification; Revocation Workflow; Reviewer Delegation; Review Escalation; Compliance Reports; API/SDK; Enterprise/Private Deployment; Framework/Industry Packs.

## Feature/customer/vertical tree
Features: subject identity/type/status, manager/owner, resource/app, role/group/permission, source of grant, last use, privilege/risk, review period, reviewer, decision, justification, exception/expiry, revocation state, evidence and audit.
Customers: enterprises, security/IAM/GRC teams, MSPs, regulated organizations and SaaS/platform operators.
Verticals: cloud/SaaS, finance-adjacent, healthcare admin, government, education, technology, data platforms and agentic systems.

## Brain capability / architecture
Brain may summarize why access exists, flag anomalous grants and recommend review priority. Deterministic identity/access data and policy drive certification. Brain cannot auto-attest that access is appropriate when evidence is insufficient.

Architecture: identity/resource/access graph, HR/vendor/machine lifecycle feeds, review campaign engine, risk rules, usage evidence, reviewer/ownership graph, decision/exception ledger, revocation adapter and compliance evidence.

## Agent tree
Access Inventory Agent; Campaign Planner; Ownership Resolver; Risk Reviewer; Dormant Access Agent; Privileged Access Agent; Machine/Agent Identity Reviewer; Evidence Agent; Exception Agent; Revocation Coordinator; Compliance Report Agent; QA Agent.

## Deterministic services
Access graph; campaign scheduler; reviewer assignment; due/escalation; last-use ingestion; risk flags; attestation state; exception expiry; idempotent revocation request; reconciliation; immutable evidence.

## Workflow
Snapshot current access → resolve identity/resource ownership → select campaign/risk scope → assign reviewers → present access + usage/provenance → retain/revoke/exception decision → require justification for risky retains → protected revocation workflow → verify downstream removal → reconcile unresolved items → close campaign with audit evidence; continuous mode opens targeted reviews on material change.

## Integrations / API / data
IdP/IAM, HRIS, vendor systems, cloud, SaaS directories, databases, PAM, agent identity registry, SIEM/GRC/ticketing. Data: identities, access grants, resources, ownership, usage, campaigns, reviews, exceptions, revocations and evidence.

## Monetization / distribution
Identities/apps/resources, review campaigns, seats, enterprise/private, compliance packs, API and managed certification. Distribution through IAM/GRC/security/MSP ecosystems.

## Security/privacy/compliance
Review data is security-sensitive. Least privilege, reviewer authorization, no cross-tenant views, decision provenance, tamper evidence and protected revocation. Avoid rubber-stamp AI recommendations; uncertain ownership/risk must remain visible.

## Failure / edge cases
Manager departed, orphaned service account, shared account, emergency access, nested groups, conflicting role owners, rarely used DR access, acquired company, contractor extended, account disabled but group persists, revocation fails downstream. Review completion requires reconciliation, not just reviewer clicks.

## Scale / overlap
Periodic spreadsheet review → continuous enterprise certification → identity governance service. Overlap #58 employee lifecycle, #74 permission optimization, #91 agent identity. #075 owns review/attestation lifecycle.

## Classification
**DESIGN NOW:** identity/resource ownership, access provenance, decision/exception expiry, revocation reconciliation and evidence.  
**BUILD NOW:** Command Center own device/session/agent/provider authorization should remain reviewable and owner-visible; reverse-map supports a generalized access inventory.  
**BUILD BEFORE FIRST COMPANY:** enterprise access graph/connectors/campaign engine.  
**COMPANY-SPECIFIC LATER:** customer IAM/GRC packs/UI/pricing.  
**SCALE-ONLY:** continuous global identity certification graph.

# Mandatory 24-part completion block
1. Product Tree: inventory/campaign/continuous/manager/risk/dormant/privileged/machine-agent/app-role/evidence/exceptions/revoke/reports/API.
2. Feature Tree: subject/status/owner/resource/role/source/last use/risk/reviewer/decision/justification/exception/revocation/evidence.
3. Customer Tree: enterprise/security/IAM/GRC/MSP/regulated/platform.
4. Vertical Tree: cloud/SaaS/finance/health admin/government/education/tech/data/agentic.
5. Brain Tree: summarize/prioritize/recommend; final attestation evidence-based and authorized.
6. Agent Tree: inventory/campaign/ownership/risk/dormant/privileged/machine/evidence/exception/revoke/report/QA.
7. Service Tree: graph/scheduler/assignment/escalation/usage/risk/attestation/expiry/revoke/reconcile/audit.
8. Workflow Tree: snapshot→scope→assign→review→decide→revoke/exception→verify→reconcile→close.
9. Integration Tree: IdP/HR/vendor/cloud/SaaS/DB/PAM/agent registry/SIEM/GRC/tickets.
10. Data Tree: identities/access/resources/ownership/usage/campaigns/reviews/exceptions/revocations.
11. API Tree: access/campaigns/reviews/evidence/revocations/reports.
12. Monetization Tree: identities/apps/resources/campaigns/seats/enterprise/API/managed.
13. Distribution Tree: IAM/GRC/security/MSP/OEM.
14. Automation Tree: inventory/risk/campaign/reconciliation automatic; attestation/revocation gated by policy.
15. Moat Tree: access/ownership graph, review outcomes, connectors, risk heuristics.
16. Platform Tree: review tool→continuous certification→identity-governance layer.
17. Risk Tree: wrong reviewer/rubber-stamp/lockout/stale access/failed revoke/privacy leak.
18. Scale Tree: campaign→enterprise continuous→global identity graph.
19. Spinoff Tree: ownership resolution/review analytics modules; optimizer/lifecycle/agent identity remain separate.
20. Command Center Dependencies: identity, authorization, Agent registry, audit, notifications, policy, provider connectors.
21. Design-Now Requirements: all authority grants need owner/source/effective/expiry/review metadata.
22. Build-Now Requirements: expose Command Center privileged grants/sessions/devices/agents/providers to durable review inventory.
23. Safe-to-Defer Requirements: customer IAM/GRC connectors/campaign UI/compliance packs.
24. Autonomous Mature State: access inventory/risk/campaigns/reconciliation run continuously; people attest exceptional/high-risk access and policy changes.

## Saturation result
Further branches converge into permission optimization, employee lifecycle and agent identity rather than new top-level scope.