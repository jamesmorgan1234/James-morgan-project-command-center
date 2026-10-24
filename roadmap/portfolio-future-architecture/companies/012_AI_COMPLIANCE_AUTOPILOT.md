# Company 012 — AI Compliance Autopilot

**Company ID:** `company:future:012`  
**Primary project:** `project:company:future:012`  
**Roadmap version:** `COMPANY-012-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; not legal/compliance advice or filing authority.

## Business identity

Purpose: continuously map controls, evidence, policies, reviews, vendor obligations and recurring compliance work against selected frameworks while preserving human/legal accountability.

Problem: compliance programs are document-heavy, repetitive, evidence-driven and difficult to keep current across systems/frameworks.

Value: evidence collection, control mapping, gap detection, recurring review, audit readiness and traceable remediation.

Delivery: SaaS, evidence API, private/VPC/self-hosted, framework packs, auditor portal, managed implementation assistance, embedded/OEM compliance module.

## Product tree

- Framework/Control Registry — SOC 2-like, ISO-like, privacy/security/internal frameworks as licensed/appropriate.
- Control Mapping Engine — many-to-many controls/evidence/policies/systems.
- Evidence Collection — APIs/files/screenshots/config snapshots/log refs, freshness.
- Policy Library & Drafting.
- Gap Analysis / Readiness Score.
- Compliance Calendar & Recurring Reviews.
- Vendor Compliance Evidence.
- Access/Permission Reviews.
- Training/Acknowledgment Tracking.
- Risk/Exception Register.
- Remediation Workflow.
- Audit Request Workspace / Auditor Portal.
- Evidence Package Export.
- Regulatory/Industry Pack adapters.
- Change Monitor integration.
- Continuous Control Monitoring.
- Compliance Analytics / Benchmarking.
- Developer API/SDK.

## Feature/customer/vertical trees

Features: control IDs/version, framework mappings, evidence requirements, source/provenance, freshness/expiry, owner, test procedure, exceptions, compensating controls, risk, remediation, review/approval, attestations, audit trail, report/export, retention/legal hold, role permissions, reminders, workflows, accessible/localized UI.

Customers: startups seeking audit readiness, SMB/midmarket, enterprise GRC/security/privacy teams, SaaS vendors, regulated-adjacent companies, MSPs/consultants, auditors as portal users, government contractors where framework scope permits.

Verticals: SaaS/cloud, ecommerce, finance operations, healthcare-adjacent admin, education, public contractors, HR platforms, data/AI vendors. Packs must not imply certification/legal interpretation.

## Brain capability tree / architecture

Brain knows framework/control versions, evidence types, system inventory and owner policies. It reasons about mappings/gaps/duplicate evidence and recommends remediation. It may draft policies/summaries but cannot certify compliance, accept legal terms or file regulatory submissions.

Architecture: relational control/evidence graph; rules engine for freshness/coverage; document/search/RAG over licensed framework text and owner policies; event connectors; evidence hashes; LLM for mapping/drafting/explanation with citations; deterministic status calculation and approval workflow.

## Agent tree

Control Mapping Agent, Evidence Collector, Evidence Freshness Monitor, Policy Drafting Agent, Gap Analyst, Remediation Planner, Vendor Evidence Agent, Access Review Agent, Training/Acknowledgment Agent, Audit Request Coordinator, Compliance Report Agent, Framework Change Analyst, Privacy/Security Agent.

## Deterministic services

Control registry; evidence registry; connector runners; file/artifact hashing; freshness scheduler; reminder/calendar; workflow/approval; mapping graph; exception/risk store; audit ledger; export packager; retention/hold; notification service.

## Inputs / outputs / workflows

Inputs: selected frameworks, controls, policies, system/config evidence, vendor documents, training/access records, owner decisions, audit requests.

Outputs: control status, evidence map, gaps, remediation tasks, policy drafts, audit packages, recurring reviews, alerts.

Workflow: select framework → map systems/controls → define evidence/tests → collect/verify → assess freshness/coverage → identify gap → remediate/approve → continuous monitoring → audit export.

## Integrations / API

Cloud/IAM, source control/CI, ticketing, HRIS, device/endpoint/security tools, SaaS admin, data stores, vendor management, training, document storage, SIEM, identity/access review, regulation monitoring. APIs for controls/evidence/gaps/exceptions/reviews/reports.

## Data / moat

Framework/control ontology, evidence-source mappings, reusable tests, control-to-system graph, remediation history, audit-request patterns. Moat is integration/mapping depth and trustworthy evidence provenance, not private compliance evidence reuse.

## Monetization / distribution

Framework/company/entity, seats, connectors, evidence volume, enterprise/private, framework packs, auditor portal, support/implementation, OEM. Distribution via security auditors/consultants/MSPs/cloud marketplaces/dev integrations.

## Security/privacy/legal

Compliance evidence may expose system/security details. Strict tenant/company isolation, least privilege, secret redaction, immutable audit, regional/private deployment, retention, auditor time-limited access, protected policy/attestation actions. Explicitly state not legal advice/certification; licensed framework content respected.

## Failure / edge cases

Stale evidence, misleading automated pass, framework version change, unavailable connector, screenshot without provenance, compensating control nuance, false control mapping, revoked vendor cert, audit scope change, missing owner approval. Status should be `unknown/needs review` rather than fabricated compliance.

## Scale / platform

Micro: one framework. ~$100K ARR: startup/SMB readiness. ~$1M: multiple frameworks/enterprise connectors. ~$10M: continuous compliance + partner ecosystem. ~$100M+: broad governance/compliance control plane subject to regulatory/legal boundaries.

Overlap #16 regulation monitor, #24 vendor risk, #37 internal policy, #47 DSAR, #75 access review. Keep #012 as cross-framework compliance operations.

## Classification

**DESIGN NOW:** evidence/provenance/control/version contracts, policy packs, role/approval, truth states, secret isolation.  
**BUILD NOW:** Command Center evidence/policy/evaluation registries should support compliance-pack patterns after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company isolation, framework pack/version interfaces, connector/evidence collector boundaries.  
**COMPANY-SPECIFIC LATER:** actual frameworks/customer evidence/auditor portal/pricing.  
**SCALE-ONLY:** large partner/auditor ecosystem and continuous global packs.

# Mandatory 24-part completion block

1. **Complete Product Tree:** frameworks, mapping, evidence, policies, gaps, calendar, vendors, access reviews, training, risks/exceptions, remediation, audit portal/export, change/continuous monitoring, analytics/API.
2. **Complete Feature Tree:** versions/mappings/evidence provenance/freshness/owners/tests/exceptions/risk/remediation/attestation/audit/report/retention/roles/reminders.
3. **Complete Customer Tree:** startups, SMB, enterprise GRC/security/privacy, SaaS, consultants/MSPs, auditors, contractors.
4. **Complete Vertical Tree:** SaaS/cloud, commerce, finance ops, health admin, education, public contractors, HR, data/AI.
5. **Complete Brain Capability Tree:** mapping/gap/remediation/drafting with cited evidence; certification/legal authority prohibited.
6. **Complete Agent Tree:** mapping/evidence/freshness/policy/gap/remediation/vendor/access/training/audit/report/change/privacy-security.
7. **Complete Service Tree:** registries/connectors/hash/freshness/calendar/workflow/mapping/risk/audit/export/retention/notifications.
8. **Complete Workflow Tree:** framework→map→collect→verify→gap→remediate→monitor→audit.
9. **Complete Integration Tree:** cloud/IAM/Git/CI/tickets/HR/endpoints/SaaS/data/vendor/training/docs/SIEM/access/regulation.
10. **Complete Data Tree:** controls/frameworks/evidence/tests/gaps/exceptions/risks/reviews/audit history.
11. **Complete API/Developer Tree:** control/evidence/gap/exception/review/report/connectors/webhooks.
12. **Complete Monetization Tree:** framework/entity/seats/connectors/evidence/enterprise/private/packs/portal/support/OEM.
13. **Complete Distribution Tree:** auditors/consultants/MSPs/cloud/dev/security ecosystem.
14. **Complete Automation Tree:** evidence/freshness/mapping suggestions/gap detection/reminders/report prep; human attestation retained.
15. **Complete Moat Tree:** mappings, connector depth, evidence tests, remediation/audit corpus, trusted provenance.
16. **Complete Platform Tree:** readiness tool → continuous compliance → governance ecosystem.
17. **Complete Risk Tree:** false pass, stale evidence, secret leakage, framework/license/legal ambiguity, connector gaps.
18. **Complete Scale Tree:** single framework → multi-framework enterprise → continuous global platform.
19. **Complete Spinoff Tree:** adjacent existing #16/#24/#37/#47/#75 preferred.
20. **Command Center Dependencies:** policy/evidence/pack registries, security, company isolation, integrations, scheduling/notifications, audit.
21. **Design-Now Requirements:** versioned policy/evidence pack interfaces and truthful unknown states.
22. **Build-Now Requirements:** shared evidence/policy extension hooks after reverse-map.
23. **Safe-to-Defer Requirements:** specific framework content, customer connectors/auditor portal/pricing.
24. **Autonomous Mature State:** evidence/freshness/review orchestration runs automatically; Brain flags gaps/remediation; humans retain attestation/legal decisions; James sees strategic/protected exceptions.

## Saturation result

Remaining branches are framework/industry packs or adjacent regulatory/vendor/policy/access products already represented in the portfolio.
