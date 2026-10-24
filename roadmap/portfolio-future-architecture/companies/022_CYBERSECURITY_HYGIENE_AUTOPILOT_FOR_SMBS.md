# Company 022 — Cybersecurity Hygiene Autopilot for SMBs

**Company ID:** `company:future:022`  
**Primary project:** `project:company:future:022`  
**Roadmap version:** `COMPANY-022-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no scanning of unauthorized systems, credential changes, remediation, insurance claims or security representations.

## Business identity

Purpose: give small and midsize businesses continuous visibility and prioritized remediation for everyday security hygiene without requiring a full security team.

Problem: SMBs miss MFA, stale accounts, exposed services, unpatched software, weak backups, overbroad SaaS permissions and access-review tasks.

Value: low-friction posture inventory, prioritized risk, evidence, guided remediation and recurring hygiene automation.

Delivery: SaaS dashboard, lightweight connectors/agents, API, MSP console, private/self-hosted option, insurance-readiness reports, vertical packs.

## Product tree

Identity/MFA Posture; Account/Permission Review; External Exposure Inventory; Patch/Vulnerability Hygiene; SaaS Security Posture; Backup/Recovery Posture; Device Security Posture; Password/Credential Hygiene; Phishing/Email Security Readiness; Cloud/IAM Basics; Access Review Calendar; Employee Offboarding Checks; Security Score; Remediation Playbooks; Evidence/Insurance Readiness; Vendor/SaaS Risk Lite; Incident Readiness Checklist; API/MSP Console; Vertical Packs.

## Feature/customer/vertical tree

Features: asset/account inventory, connector health, MFA coverage, stale/dormant users, admin roles, external ports/domains/certs, patch age, endpoint/security flags, backup freshness/restore evidence, SaaS sharing, email DNS, risk priority, remediation owner, due date, evidence, exceptions, recurring scans, alerts, accessible reports.

Customers: SMBs, nonprofits, professional services, local/multi-location businesses, agencies, ecommerce, healthcare-adjacent admin, contractors, MSPs/IT consultants. Verticals with high regulatory burden require specialist packs and do not treat a hygiene score as compliance certification.

## Brain / architecture

Brain interprets posture, prioritizes likely business risk and explains remediation; deterministic checks own evidence. It may draft remediation steps but cannot execute credential/security changes without explicit protected policy. Architecture: connector registry, asset graph, rules/controls, vulnerability/reference feeds, risk scoring, event scheduler, evidence store, LLM explanation only with cited observations.

## Agents

Asset Inventory Agent, Identity/MFA Agent, Permission Review Agent, Exposure Monitor, Patch/Vulnerability Agent, SaaS Posture Agent, Backup Agent, Email Security Agent, Risk Prioritizer, Remediation Planner, Evidence Agent, Offboarding Agent, MSP Portfolio Agent, Incident Readiness Agent.

## Deterministic services

Connectors; asset/account registry; posture rules; vulnerability/version matching; DNS/cert checks; backup freshness/restore evidence; scheduler; alerting; risk calculation; evidence/audit; remediation task tracking; protected action gate.

## Workflow

Connect authorized systems → inventory → run noninvasive posture checks → calculate evidence-backed findings → prioritize by exposure/business impact → assign remediation → owner/IT approves action → external systems remediate → recheck/verify → close evidence → recurring review.

## Integrations / API / data

Identity suites, cloud, endpoint/MDM, SaaS admin, backup, email/DNS, password manager metadata, ticketing, HR/offboarding, vulnerability/security feeds. APIs for assets/findings/evidence/remediation/status/score.

Data moat: SMB-normalized control library, remediation outcomes, asset/identity relationship models and connector coverage; customer security data remains strictly isolated.

## Monetization / distribution

Per company/user/device/domain/connector, MSP multi-tenant, premium evidence/recovery drills, enterprise/private, vertical packs, managed security-hygiene service. Distribution through MSPs, insurers/brokers where appropriate, IT consultants, accounting/business-service ecosystems and cloud marketplaces.

## Security/privacy/legal

The platform is security-sensitive: strict least privilege, secret refs, no raw password storage, authorized targets only, safe/non-destructive checks by default, no false “secure/compliant” claims, audit, regional privacy, protected remediation/credential actions.

## Failure / edge cases

Connector outage, stale inventory, false vulnerable version, managed device offline, intentional legacy exception, shared admin account, backup appears healthy but never restored, phishing simulation misuse, external scan mistaken as attack. Use evidence timestamps, confidence, exceptions, restore tests and explicit unknown status.

## Scale/platform/overlap

Single SMB → MSP portfolios → enterprise-lite security posture platform. Adjacent #73 secret rotation, #74 permissions, #75 access reviews, #82 backup integrity, #83 domain/DNS, #84 deliverability. Keep #022 as broad SMB hygiene umbrella.

## Classification

**DESIGN NOW:** security action classes, connector/asset identity, evidence/truth states, company isolation, safe read-only posture checks.  
**BUILD NOW:** Command Center security/evidence/provider interfaces should support this pattern after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company security namespace, connector/secret isolation, audit/incident framework.  
**COMPANY-SPECIFIC LATER:** actual posture checks/connectors/customer portal/pricing.  
**SCALE-ONLY:** MSP/global multi-tenant fleet and advanced automated remediation.

# Mandatory 24-part completion block

1. Product Tree: identity/MFA, permissions, exposure, patch, SaaS, backup, devices, credentials, phishing/email, cloud, reviews, offboarding, score, remediation, evidence, vendor-lite, incident, API/MSP/packs.
2. Feature Tree: inventory, coverage, stale roles, exposure, patch age, backup/restore, sharing, DNS, risk, tasks, evidence, exceptions, scans/alerts.
3. Customer Tree: SMB/nonprofit/services/local/multi-location/agencies/commerce/health admin/contractors/MSPs.
4. Vertical Tree: general SMB plus regulated vertical packs with stronger specialist review.
5. Brain Tree: evidence-backed risk prioritization/explanation; remediation execution protected.
6. Agent Tree: inventory/identity/permissions/exposure/patch/SaaS/backup/email/risk/remediation/evidence/offboarding/MSP/incident.
7. Service Tree: connectors/assets/rules/vulnerability/DNS/backup/scheduler/alerts/risk/evidence/tasks/policy gate.
8. Workflow Tree: connect→inventory→check→prioritize→assign→approve→remediate→verify→repeat.
9. Integration Tree: IAM/cloud/endpoint/SaaS/backup/email/DNS/password metadata/tickets/HR/security feeds.
10. Data Tree: assets/accounts/findings/evidence/exceptions/remediation/incidents/connector health.
11. API Tree: assets/findings/evidence/remediation/status/score.
12. Monetization Tree: companies/users/devices/domains/connectors/MSP/evidence/private/packs/managed.
13. Distribution Tree: MSP/IT consultants/insurance/business-service/cloud ecosystems.
14. Automation Tree: posture scans/prioritization/reminders/rechecks; destructive remediation gated.
15. Moat Tree: SMB control/remediation corpus, connectors, asset graph, trusted evidence.
16. Platform Tree: hygiene checklist→continuous posture→MSP security operations layer.
17. Risk Tree: unauthorized scan, stale/false findings, secret exposure, destructive remediation, false assurance.
18. Scale Tree: single SMB→MSP portfolios→large multi-tenant platform.
19. Spinoff Tree: existing #73/#74/#75/#82/#83/#84 cover deep specialist products.
20. Command Center Dependencies: security/policy, provider/connector registry, evidence, isolation, incidents, resource governor.
21. Design-Now: safe security action/evidence/connector isolation contracts.
22. Build-Now: shared security/evidence seams after reverse-map.
23. Safe-to-Defer: actual security product/connectors/remediation/pricing.
24. Autonomous Mature State: posture monitoring/reminders/rechecks run continuously; low-risk approved fixes may automate; James/customer handles high-risk security decisions.

## Saturation result

Deep specialist branches map to existing portfolio security companies; no extra top-level company is required.
