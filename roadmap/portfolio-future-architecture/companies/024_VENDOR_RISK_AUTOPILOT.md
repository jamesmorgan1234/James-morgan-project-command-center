# Company 024 — Vendor Risk Autopilot

**Company ID:** `company:future:024`  
**Primary project:** `project:company:future:024`  
**Roadmap version:** `COMPANY-024-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no vendor acceptance/rejection, contracting or payments.

## Business identity

Purpose: continuously assess vendor security, privacy, financial, operational, compliance and concentration risk with evidence-backed scoring and recurring reassessment.

Problem: vendor reviews are questionnaire-heavy, point-in-time and disconnected from contracts/incidents/certifications.

Value: normalized vendor profiles, evidence, risk scoring, exceptions, remediation, renewals and continuous monitoring.

Delivery: SaaS, vendor portal, questionnaires, API, enterprise/private deployment, industry packs, managed review support.

## Product tree

Vendor Registry; Intake/Classification; Security Review; Privacy Review; Compliance/Certification Review; Financial/Operational Risk; Concentration/Dependency Risk; Insurance Review; Questionnaire Engine; Evidence/Document Repository; External Incident/Change Monitoring; Risk Scoring; Exception/Remediation; Renewal/Reassessment Calendar; Contract/Obligation Integration; Vendor Graph/Dependency Map; Executive Risk Dashboard; Vendor Portal; API/OEM; Industry Packs.

## Feature/customer/vertical tree

Features: vendor tiering, service/data access, criticality, subprocessors, geography, certifications/expiry, evidence provenance/freshness, questionnaire templates, conditional questions, automated evidence reuse, risk factors/weights, compensating controls, exceptions, owner approvals, remediation deadlines, incident links, renewal triggers, audit/export.

Customers: procurement, security, privacy, GRC, IT, finance/ops, enterprise vendor management, regulated organizations, SaaS, MSPs/consultants.

Verticals: SaaS/cloud, finance operations, healthcare admin, public contractors, ecommerce, education, manufacturing/supply chain. Framework/risk packs vary.

## Brain / architecture

Brain classifies vendor criticality, summarizes evidence, maps questionnaire responses, identifies contradictions/gaps and recommends risk/remediation. Deterministic evidence/freshness/risk-policy rules own status. It cannot approve contracts or certify vendors autonomously.

Architecture: vendor/entity registry, evidence store, document parser, questionnaire/rules engine, risk model, external monitoring feeds, dependency graph, scheduler, search/RAG with citations, audit.

## Agents

Vendor Intake Agent, Questionnaire Agent, Security Reviewer, Privacy Reviewer, Compliance Evidence Agent, Financial/Operational Analyst, Concentration Analyst, Insurance Agent, Evidence Freshness Agent, Remediation Agent, Incident Monitor, Renewal Agent, Risk QA Agent.

## Deterministic services

Vendor registry; tiering rules; questionnaire workflow; evidence hash/version; certification expiry; risk calculator; dependency graph; scheduler; remediation tasks; incident hooks; portal access; audit/export.

## Workflow

Register vendor/service → classify data/access/criticality → request/collect evidence → validate/freshness → questionnaire/risk checks → calculate risk + uncertainty → exception/remediation → owner acceptance decision → monitor incidents/expiry → periodic/renewal reassessment.

## Integrations / API / data

Procurement/ERP, contracts/DMS, security/GRC, IAM/SaaS inventory, insurance/COI, compliance sources, ticketing, incident feeds, finance/vendor master. APIs for vendor/profile/evidence/questionnaire/risk/remediation/renewal.

Data moat: vendor/service graph, evidence normalization, questionnaire answer mappings, incident/remediation history and vertical risk packs, while customer-specific vendor decisions stay isolated.

## Monetization / distribution

Vendors assessed, seats, questionnaires/evidence, enterprise/private, packs, vendor portal, API/OEM, managed review. Distribution through procurement/security/GRC ecosystems, consultants/MSPs, insurance/compliance partners.

## Security/privacy/legal

Vendor evidence is confidential/security-sensitive. Access isolation, no unauthorized sharing, redaction, retention, audit, time-limited vendor portal access, no false certification, protected acceptance/contract actions.

## Failure / edge cases

Outdated certification, questionnaire self-report mismatch, parent/subsidiary confusion, vendor rebrand/acquisition, unknown subprocessor, service scope changes, incident after approval, concentration hidden through resellers, financial-data uncertainty. Preserve source/freshness/confidence and require owner/security judgment for material ambiguity.

## Scale / overlap

Small vendor list → enterprise continuous third-party risk → dependency/risk network. Overlap #12 compliance, #17 SaaS spend, #23 contracts, #52 COI, #63 vendor onboarding. #024 remains risk assessment/monitoring.

## Classification

**DESIGN NOW:** vendor/entity/integration identities, evidence/freshness, risk/truth states, dependency graph, company isolation.  
**BUILD NOW:** shared provider/integration health and evidence contracts after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** vendor portal/isolation, document/evidence interfaces, scheduler.  
**COMPANY-SPECIFIC LATER:** questionnaires/risk models/external feeds/customer product.  
**SCALE-ONLY:** broad vendor intelligence network.

# Mandatory 24-part completion block

1. Product Tree: registry/intake/security/privacy/compliance/financial/ops/concentration/insurance/questionnaire/evidence/monitor/risk/remediation/renewal/contracts/graph/dashboard/portal/API/packs.
2. Feature Tree: tiering/access/criticality/subprocessors/geo/certs/freshness/questions/reuse/scoring/exceptions/incidents/renewals/audit.
3. Customer Tree: procurement/security/privacy/GRC/IT/finance/enterprise/regulated/MSPs.
4. Vertical Tree: SaaS/cloud, finance ops, health admin, public contractors, commerce, education, manufacturing/supply chain.
5. Brain Tree: evidence/contradiction/risk/remediation reasoning with no autonomous vendor approval.
6. Agent Tree: intake/questionnaire/security/privacy/compliance/financial/concentration/insurance/freshness/remediation/incident/renewal/QA.
7. Service Tree: registry/tiering/questionnaire/evidence/expiry/risk/graph/scheduler/tasks/portal/audit.
8. Workflow Tree: register→classify→collect→verify→risk→remediate→owner decision→monitor→reassess.
9. Integration Tree: procurement/contracts/GRC/IAM/SaaS/insurance/compliance/tickets/incidents/finance.
10. Data Tree: vendors/services/evidence/questions/risks/exceptions/incidents/dependencies/renewals.
11. API Tree: vendor/profile/evidence/questionnaire/risk/remediation/renewal.
12. Monetization Tree: vendors/seats/questions/evidence/enterprise/private/packs/API/managed.
13. Distribution Tree: procurement/security/GRC/consultants/MSPs/insurance/compliance.
14. Automation Tree: evidence reuse/freshness/scoring/reminders/monitoring; acceptance gated.
15. Moat Tree: vendor graph, normalized evidence, questionnaire mappings, risk/remediation history.
16. Platform Tree: vendor reviews→continuous third-party risk→dependency intelligence.
17. Risk Tree: false assurance, stale/self-reported evidence, confidentiality, vendor identity errors.
18. Scale Tree: SMB lists→enterprise→large vendor graph/network.
19. Spinoff Tree: adjacent #12/#17/#23/#52/#63 already cover specialist functions.
20. Command Center Dependencies: integration/vendor registry, evidence, security/policy, docs, scheduler, isolation.
21. Design-Now: explicit third-party identity/dependency/evidence/health contracts.
22. Build-Now: provider/integration evidence hooks after reverse-map.
23. Safe-to-Defer: vendor product/questionnaires/feeds/portal/pricing.
24. Autonomous Mature State: evidence/expiry/incidents/reassessments continuously update; Brain prioritizes risk; humans decide material vendor acceptance/exceptions.

## Saturation result

Further branches are onboarding/compliance/contract/insurance modules already represented elsewhere.
