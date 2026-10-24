# Company 058 — Employee Onboarding / Offboarding Autopilot

**Company ID:** `company:future:058`  
**Primary project:** `project:company:future:058`  
**Roadmap version:** `COMPANY-058-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no employee account creation, permission change, payroll change, termination action or external communication.

## Business identity

Purpose: coordinate employee/contractor lifecycle tasks across HR, IT, security, payroll, facilities, training and managers with explicit authority, evidence and rapid revocation on departure.

Problem: onboarding/offboarding spans many systems and human owners; missed tasks create productivity delays, orphaned access, equipment loss and security/compliance gaps.

Value: one durable lifecycle workflow, least-privilege access plans, exact task ownership, verified completion and safe termination containment.

## Complete product tree

New-Hire Intake; Role/Access Plan; Account Provisioning Orchestrator; Equipment/Asset Workflow; Payroll/Benefits Checklist Adapter; Policy/Acknowledgment; Training/Certification; Manager Checklist; Facilities/Badge Workflow; Contractor Lifecycle; Transfer/Role-Change Workflow; Leave/Suspension Workflow; Offboarding; Access Revocation; Asset Return; Knowledge Handoff; Exit Evidence Pack; Lifecycle Analytics; API/SDK; HRIS/ITSM/IAM Integrations; Enterprise/Private Deployment; Industry Packs.

## Feature/customer/vertical tree

Features: person/worker identity, employment type, start/end dates, department/manager/location, role template, system access, group/role membership, equipment, policies, training, approvals, payroll/benefits handoffs, exceptions, termination urgency, revocation timestamps, asset return, shared-secret rotation triggers, audit and retention.

Customers: SMBs, enterprises, IT/HR/security teams, MSPs, staffing companies, distributed/remote companies, regulated organizations and franchises.

Verticals: technology, professional services, healthcare administration, finance-adjacent organizations, retail, hospitality, manufacturing, education, nonprofits and government. Packs vary by identity/compliance/equipment/training requirements.

## Brain capability tree / architecture

Brain may interpret role/job information, recommend access/equipment/training templates, detect missing steps and summarize exceptions. Deterministic HR/IAM policy owns authorization. Brain cannot grant privilege, alter payroll or terminate employment independently.

Architecture: worker identity registry, lifecycle state machine, role/access templates, system connector registry, task DAG, asset registry, policy/training records, approval engine, credential rotation hooks, audit/evidence ledger and protected account/communication actions.

## Agent tree

Lifecycle Coordinator; HR Data Agent; Access Planner; IAM Provisioning Agent; Equipment Agent; Training Agent; Policy Acknowledgment Agent; Manager Coordinator; Contractor Agent; Offboarding/Revoke Agent; Asset Return Agent; Knowledge-Handoff Agent; QA/Security Agent.

## Deterministic services

Identity linking; lifecycle dates; role/access matrix; approval rules; task scheduler; provisioning/deprovisioning adapters; group/role diff; asset custody; acknowledgment records; revoke-all workflow; idempotency; evidence; emergency kill switch.

## Workflow tree

Authorized lifecycle event → verify worker/role/date → build tasks/access plan → obtain approvals → provision accounts/equipment/training → verify each result → active lifecycle monitoring/changes → transfer/leave/offboarding event → freeze new privilege → revoke/disable at correct time → recover assets/rotate shared credentials → verify downstream removal → close with evidence.

## Integrations / API / data

HRIS, IAM/SSO, SaaS directories, cloud, email/collaboration, payroll/benefits handoff, ITSM, MDM/device inventory, badge/access, training/LMS, asset systems, ticketing. APIs for workers, lifecycle events, access plans, tasks, assets, acknowledgments and evidence.

Data: worker identities, roles, employment state, access assignments, approvals, tasks, assets, training, policy acknowledgments, revocations and evidence. Highly sensitive HR/security data remains isolated.

## Monetization / distribution

Employees/contractors, connected systems, lifecycle events, seats, enterprise/private, MSP/multi-client, premium compliance packs, API/OEM, managed operations. Distribution via HRIS/IAM/ITSM marketplaces, MSPs and HR/IT/security partners.

## Security/privacy/compliance

High identity/privacy impact. Least privilege, separation of duties, manager/HR authority, time-bound access, termination emergency path, no employment decision making by AI, audit, data minimization and retention controls.

## Failure / edge cases

Rehire, same-name identities, contractor-to-employee conversion, delayed termination, legal hold, shared account, unavailable HRIS, provisioning succeeds but callback fails, transfer across entities, leave of absence, device not returned, departed admin owns integrations, emergency suspension. Idempotency and reconciliation are mandatory.

## Scale / overlap

Small business checklist → enterprise identity lifecycle → workforce access orchestration. Overlap #62 credentialing, #73 credential rotation, #74 permission optimization, #75 access review. #058 owns employment lifecycle orchestration.

## Classification

**DESIGN NOW:** identity lifecycle, time-bound authority, task DAG, connector/reconciliation, emergency revocation, evidence.  
**BUILD NOW:** Command Center identity/Agency/account-isolation models should preserve actor lifecycle and revocation hooks.  
**BUILD BEFORE FIRST COMPANY:** HR/IAM connector abstractions, role templates, asset/task registries and reconciliation.  
**COMPANY-SPECIFIC LATER:** HR/payroll/device connectors, customer UI, industry packs/pricing.  
**SCALE-ONLY:** global workforce entities, complex multi-organization federation.

# Mandatory 24-part completion block

1. Product Tree: intake/access/equipment/payroll handoff/policy/training/manager/facilities/contractor/transfer/leave/offboard/revoke/assets/handoff/analytics/API.
2. Feature Tree: identity/type/dates/manager/location/role/access/assets/policies/training/approvals/revocation/audit.
3. Customer Tree: SMB/enterprise/HR/IT/security/MSP/staffing/remote/regulated/franchise.
4. Vertical Tree: tech/services/health admin/finance-adjacent/retail/hospitality/manufacturing/education/government.
5. Brain Tree: template/exception recommendations; privilege/payroll/employment decisions prohibited without authority.
6. Agent Tree: lifecycle/HR/access/IAM/equipment/training/policy/manager/contractor/revoke/assets/handoff/QA.
7. Service Tree: identity/lifecycle/role matrix/approvals/scheduler/connectors/assets/acknowledgments/idempotency/revoke-all.
8. Workflow Tree: event→plan→approve→provision→verify→monitor→offboard/revoke→reconcile→evidence.
9. Integration Tree: HRIS/IAM/SaaS/cloud/email/payroll/ITSM/MDM/badge/LMS/assets/tickets.
10. Data Tree: workers/roles/access/approvals/tasks/assets/training/policy/revocations/evidence.
11. API Tree: workers/events/access plans/tasks/assets/acknowledgments/evidence.
12. Monetization Tree: workers/systems/events/seats/enterprise/MSP/API/managed/packs.
13. Distribution Tree: HRIS/IAM/ITSM marketplaces/MSPs/HR-IT-security partners.
14. Automation Tree: task/provision/revoke/reconcile automated within policy; employment/privilege authority gated.
15. Moat Tree: connector breadth, lifecycle templates, reconciliation accuracy, exception patterns.
16. Platform Tree: lifecycle checklist→identity automation→workforce access control plane.
17. Risk Tree: orphaned privilege/wrong person/early termination/privacy leak/failed revoke/asset loss.
18. Scale Tree: SMB→enterprise→global multi-entity workforce.
19. Spinoff Tree: access planner/asset lifecycle modules; permission/access review remain separate companies.
20. Command Center Dependencies: identity, authorization, connectors, tasks, devices/assets, audit, incidents, secrets.
21. Design-Now Requirements: durable actor lifecycle and global revocation/reconciliation seams.
22. Build-Now Requirements: preserve identity/session/account lifecycle hooks across Command Center services.
23. Safe-to-Defer Requirements: HR/payroll/device connectors/customer UI/packs/pricing.
24. Autonomous Mature State: routine onboarding/transfers/offboarding execute as verified workflows; humans authorize employment/privilege exceptions and sensitive decisions.

## Saturation result

Further branches converge into credentialing, access reviews, permission optimization and secrets rotation already represented.