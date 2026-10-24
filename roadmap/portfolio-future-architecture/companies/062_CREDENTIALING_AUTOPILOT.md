# Company 062 — Credentialing Autopilot

**Company ID:** `company:future:062`  
**Primary project:** `project:company:future:062`  
**Roadmap version:** `COMPANY-062-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no application submission, licensure claim, professional approval or external credentialing action.

## Business identity

Purpose: orchestrate professional credentialing applications, document collection, verification, requirements, status, renewals and readiness across people, organizations and jurisdictions.

Problem: credentialing requires repeated evidence, forms, primary-source checks, deadlines and organization-specific rules; missing documents or stale credentials delay work and create compliance risk.

Value: one reusable credential profile, transparent readiness, fewer missing items, automated renewal monitoring and evidence-backed workflows.

## Complete product tree

Professional Profile Vault; Requirement/Jurisdiction Registry; Organization Credentialing Packs; Application Checklist; Document Collection; Primary-Source Verification Adapter; License/Certification Link; Education/Training Evidence; Work-History/Reference Module; Background/Identity Handoff; Form Autofill/Mapping; Attestation Workflow; Application Status Tracker; Renewal/Recredentialing; Expiration Monitor; Employer/Organization Dashboard; Professional Portal; Readiness Score; Audit/Evidence Pack; API/SDK; White-Label/OEM; Enterprise/Private Deployment; Industry Packs.

## Feature/customer/vertical tree

Features: identity, aliases, addresses, education, employment, licenses/certifications, training, references, documents, expirations, jurisdiction/organization requirements, verified source, attestation state, application version, fees reference, deadlines, deficiencies, status, renewals and evidence.

Customers: professionals, employers, staffing firms, credentialing organizations, healthcare administrative groups, education/training organizations, contractors, regulated service providers, associations and enterprises.

Verticals: healthcare professional credentialing, contractors/trades, education, financial/service licenses, security professions, transportation, insurance-related roles, government vendors and other regulated occupations. Each requires separate verified requirement packs.

## Brain capability tree / architecture

Brain may interpret requirement text, map evidence to requirements, identify gaps and draft explanations. Deterministic rules and verified source evidence own readiness. Brain may not claim someone is licensed/credentialed when source verification is absent or submit attestations without authority.

Architecture: professional/entity identity graph, requirement/version registry, document/provenance vault, verification adapters, checklist/DAG engine, form mapping, deadline/renewal scheduler, status/evidence ledger, policy packs and protected submission/attestation gates.

## Agent tree

Profile Agent; Requirement Research/Mapping Agent; Document Agent; Verification Coordinator; License/Certification Agent; Education/Employment Agent; Form Mapping Agent; Gap/Readiness Agent; Deadline/Renewal Agent; Status Agent; Employer Dashboard Agent; QA/Compliance Agent.

## Deterministic services

Identity linking; document hashes; requirement versioning; checklist dependencies; primary-source status; date/expiration logic; form field mappings; renewal recurrence; notification scheduling; audit; access control; protected submit/attest actions.

## Workflow tree

Create/verify profile → choose credentialing target/jurisdiction → load exact requirement version → collect/reuse evidence → primary-source verify where required → map evidence to checklist → flag missing/expired/ambiguous → authorized professional resolves/attests → submit only under explicit authority → track status/deficiencies → respond/renew → preserve evidence/history.

## Integrations / API / data

Licensing/credential databases where lawful, employer/HR systems, education/training providers, document storage, verification services, forms/portals/browser workers, email/ticketing and calendars. APIs for profiles, requirements, documents, verifications, applications, readiness, statuses and renewals.

Data: professional identities, requirements, documents, verifications, applications, statuses, deficiencies, expirations and attestations. Highly sensitive personal data requires strict isolation and retention.

## Monetization / distribution

Per professional/application, organization seats, verification transactions, renewals, enterprise/private, staffing/association edition, API/OEM, managed credentialing support, industry packs. Distribution through HR/staffing/association/vertical software ecosystems.

## Security/privacy/compliance

Sensitive identity/background/professional records. Least privilege, source provenance, explicit consent, no false credential status, immutable attestations, jurisdiction packs, document encryption and deletion/retention controls. Does not replace legal/regulatory judgment.

## Failure / edge cases

Name changes, conflicting primary sources, expired documents during review, verification source outage, different organization definitions, missing historical employer, application portal change, duplicated profile, renewal while new application pending, provisional status, reciprocal licenses, disciplinary disclosure requirements. Unknown status remains explicit.

## Scale / overlap

Individual professional → staffing/employer portfolio → credentialing infrastructure. Overlap #26 license/certification tracker, #31 form automation, #58 employee lifecycle, #75 access review. #062 owns application/readiness/verification orchestration.

## Classification

**DESIGN NOW:** identity/provenance, requirement versioning, reusable evidence, recurring expiry, protected attestation/submission, portal adapter isolation.  
**BUILD NOW:** Command Center project/forms/document/recovery architecture should preserve reusable evidence-to-requirement mapping seams.  
**BUILD BEFORE FIRST COMPANY:** requirement registry, document vault, verification adapters, checklist engine and renewal scheduler.  
**COMPANY-SPECIFIC LATER:** industry requirement packs, portal connectors, customer UX and pricing.  
**SCALE-ONLY:** global credential graph and large primary-source verification network.

# Mandatory 24-part completion block

1. Product Tree: profile/requirements/org packs/checklists/docs/source verification/licenses/education/work/forms/attestation/status/renewal/dashboard/API.
2. Feature Tree: identity/education/employment/licenses/docs/requirements/source/attestation/version/deadlines/deficiencies/status/renewals/evidence.
3. Customer Tree: professionals/employers/staffing/credentialing orgs/regulated providers/associations/enterprise.
4. Vertical Tree: healthcare/trades/education/financial-service/security/transport/insurance roles/government vendors.
5. Brain Tree: requirement/evidence mapping and gap explanation; credential claims/attestations require verified sources and authority.
6. Agent Tree: profile/requirements/docs/verification/license/education/form/gap/deadline/status/employer/QA.
7. Service Tree: identity/hash/requirement version/checklist/source status/dates/form maps/renewal/notifications/audit.
8. Workflow Tree: target→requirements→evidence→verify→gap→attest/submit→status→deficiency→renew.
9. Integration Tree: licensing sources/HR/education/docs/verification/portals/email/calendar.
10. Data Tree: identities/requirements/docs/verifications/applications/status/deficiencies/expirations/attestations.
11. API Tree: profiles/requirements/docs/verifications/applications/readiness/status/renewals.
12. Monetization Tree: professionals/apps/seats/verifications/renewals/enterprise/API/managed/packs.
13. Distribution Tree: HR/staffing/associations/vertical platforms/OEM.
14. Automation Tree: evidence collection/mapping/status/renewal automated; attest/submission/legal exceptions gated.
15. Moat Tree: requirement packs, evidence reuse graph, source integrations, deficiency patterns.
16. Platform Tree: credential checklist→credentialing OS→professional trust/evidence infrastructure.
17. Risk Tree: false credential/source error/privacy leak/stale requirement/wrong attestation/portal mismatch.
18. Scale Tree: individual→organization portfolio→global credential infrastructure.
19. Spinoff Tree: verification network/evidence vault could be modules; tracking/form automation remain adjacent companies.
20. Command Center Dependencies: identity, documents, provenance, forms/browser adapters, recurring scheduler, policy, protected actions.
21. Design-Now Requirements: evidence-to-requirement/version and protected-attestation contracts.
22. Build-Now Requirements: retain generic requirement/evidence mapping and portable document provenance in shared architecture.
23. Safe-to-Defer Requirements: source networks/industry packs/customer portal/pricing.
24. Autonomous Mature State: profiles, evidence mapping, status and renewals stay current automatically; people handle attestations, ambiguous sources and final submissions.

## Saturation result

Further branches converge into certification tracking, form automation or employee lifecycle products already represented.