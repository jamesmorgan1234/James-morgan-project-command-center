# Company 063 — Vendor Onboarding Autopilot

**Company ID:** `company:future:063`  
**Primary project:** `project:company:future:063`  
**Roadmap version:** `COMPANY-063-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no vendor approval, bank-detail acceptance, tax setup, purchasing or contract execution.

## Business identity

Purpose: orchestrate vendor onboarding from request and identity through tax, banking, contract, insurance, security, compliance, ERP setup, approvals and renewal.

Problem: supplier onboarding crosses procurement, finance, legal, security and operations; incomplete/duplicated records and fraudulent bank changes create payment and compliance risk.

Value: one verified vendor profile, reusable evidence, faster approval, less duplicate entry and stronger separation between collection, verification and protected approval.

## Complete product tree

Vendor Request Portal; Supplier Identity/Entity Resolution; Tax Form Collection; Banking/Payment Setup Workflow; Bank-Change Verification; Contract Intake; COI/Insurance Integration; Security/Privacy Questionnaire; Certification/License Collection; Sanctions/Compliance Adapter; Procurement Category Setup; ERP/Accounting Provisioning; Approval Matrix; Vendor Portal; Renewal/Revalidation; Risk/Health Dashboard; Supplier Master Cleanup; API/SDK; White-Label/OEM; Enterprise/Private Deployment; Vertical Packs.

## Feature/customer/vertical tree

Features: legal entity, DBA/aliases, tax IDs, addresses, contacts, ownership, bank/payee references, payment terms, tax forms, contracts, insurance, security/compliance evidence, certifications, category, departments/entities served, approvals, exceptions, source verification, renewal dates, ERP/vendor IDs and audit history.

Customers: SMBs, procurement teams, enterprises, accounting/finance, vendor-risk teams, marketplaces, property/construction organizations, franchise groups, healthcare administrative organizations, education/nonprofit and managed service providers.

Verticals: construction/property, manufacturing, retail, logistics, professional services, healthcare administration, education, hospitality, government contracting and technology. Requirement packs vary by vendor type/risk.

## Brain capability tree / architecture

Brain may classify vendor type, map collected evidence to requirements, identify missing/conflicting information and recommend review priority. Deterministic rules/verified sources own identity, bank-change, tax and approval checks. Brain cannot approve vendors or authorize banking/payment changes.

Architecture: vendor identity graph, onboarding requirement/version registry, evidence/document vault, workflow DAG, approval matrix, risk adapters, bank verification workflow, ERP connector, renewal scheduler, audit/provenance and protected vendor/master/payment actions.

## Agent tree

Vendor Intake Agent; Entity Resolution Agent; Tax Document Agent; Banking Verification Coordinator; Contract Agent; Insurance Agent; Security/Privacy Agent; Certification Agent; Risk/Compliance Agent; Approval Coordinator; ERP Provisioning Agent; Renewal Agent; Supplier Master QA Agent.

## Deterministic services

Vendor dedup/entity resolution; document hashing; requirement rules; bank-change holds; tax field validation; sanctions/risk connector abstraction; approval routing; ERP idempotency; renewal dates; evidence; protected master-data and payment-setting gates.

## Workflow tree

Vendor request → identify entity/duplicates → classify type/risk → load requirements → collect documents/tax/banking/contracts/insurance/security → verify sources → flag exceptions → route approvals → protected vendor master/ERP creation → verify downstream IDs → active monitoring/renewals → protected changes reverified → offboard/archive with evidence.

## Integrations / API / data

ERP/accounting, procurement, CLM/contracts, banking/payment providers, tax collection, COI, vendor risk, security questionnaires, certification sources, identity/SSO, email/doc storage and ticketing. APIs for vendors, requirements, evidence, approvals, risk, renewals and provisioning status.

Data: vendors/entities, contacts, tax/bank references, documents, contracts, insurance, risk results, certifications, approvals, system IDs, changes and evidence. Sensitive banking/tax data must remain isolated and secret-bearing fields protected.

## Monetization / distribution

Vendors onboarded/active, connected systems, entities, seats, verification transactions, enterprise/private, API/OEM, managed onboarding and vertical packs. Distribution through procurement/ERP/AP/vendor-risk marketplaces and consultants/MSPs.

## Security/privacy/compliance

Bank-detail fraud and identity impersonation are primary risks. Dual verification, out-of-band checks, cooling periods where appropriate, no raw banking secrets in client state, least privilege, immutable changes, sanctions/compliance adapters and strict audit.

## Failure / edge cases

Vendor mergers/name changes, duplicate suppliers, factoring/payment agents, bank-change email compromise, tax form expiration, multi-entity vendor, one supplier serving many subsidiaries, provisional approvals, emergency vendor, missing COI, security exception, ERP duplicate, vendor reactivation. Explicit exception/temporary state rather than silent approval.

## Scale / overlap

SMB supplier setup → enterprise vendor lifecycle → embedded onboarding infrastructure. Overlap #24 vendor risk, #48 AP verification, #52 COI, #73 credential rotation. #063 owns vendor creation/activation lifecycle.

## Classification

**DESIGN NOW:** entity identity, evidence reuse, protected bank/master-data changes, approval state, cross-system IDs, tenant/company isolation.  
**BUILD NOW:** Command Center identity/registry/protected action architecture should support external organization identities without conflating them with projects.  
**BUILD BEFORE FIRST COMPANY:** vendor registry, requirement engine, document evidence, bank verification, ERP connector/reconciliation.  
**COMPANY-SPECIFIC LATER:** vendor portals, customer connectors, risk/tax providers, vertical packs/pricing.  
**SCALE-ONLY:** supplier network/portable verified vendor passport if legally and commercially viable.

# Mandatory 24-part completion block

1. Product Tree: request/entity/tax/bank/contracts/insurance/security/certifications/compliance/procurement/ERP/approvals/portal/renewal/API.
2. Feature Tree: legal identity/tax/bank/payment/contracts/insurance/security/category/approvals/exceptions/verification/system IDs/history.
3. Customer Tree: SMB/procurement/enterprise/finance/vendor risk/marketplaces/property/franchise/health admin/education/MSP.
4. Vertical Tree: construction/manufacturing/retail/logistics/services/health admin/education/hospitality/government/technology.
5. Brain Tree: classification/gap/risk prioritization; vendor/bank approval remains deterministic/protected.
6. Agent Tree: intake/entity/tax/bank/contracts/insurance/security/certification/risk/approval/ERP/renewal/QA.
7. Service Tree: dedup/hash/requirements/bank holds/tax validation/risk adapters/approvals/ERP idempotency/renewals/evidence.
8. Workflow Tree: request→identify→requirements→collect→verify→exceptions→approve→provision→monitor/change/offboard.
9. Integration Tree: ERP/accounting/procurement/CLM/banking/tax/COI/risk/security/certification/SSO/docs/tickets.
10. Data Tree: vendors/contacts/tax-bank refs/docs/contracts/insurance/risk/certs/approvals/system IDs/changes/evidence.
11. API Tree: vendors/requirements/evidence/approvals/risk/renewals/provisioning.
12. Monetization Tree: vendors/systems/entities/seats/verifications/enterprise/API/managed/packs.
13. Distribution Tree: procurement/ERP/AP/vendor-risk marketplaces/consultants/MSPs.
14. Automation Tree: collection/validation/routing/provision reconciliation automated; vendor/bank approval gated.
15. Moat Tree: vendor identity/evidence reuse, requirement packs, connector breadth, exception patterns.
16. Platform Tree: onboarding tool→vendor lifecycle OS→supplier identity/evidence infrastructure.
17. Risk Tree: fraud/wrong vendor/bank hijack/tax error/privacy leak/duplicate master record.
18. Scale Tree: SMB→enterprise multi-entity→supplier network.
19. Spinoff Tree: vendor passport/bank-verification modules; risk/COI/AP remain adjacent companies.
20. Command Center Dependencies: entity identity, documents, secrets, approvals, protected financial changes, connectors, audit.
21. Design-Now Requirements: external-organization identity and verified change/provisioning contracts.
22. Build-Now Requirements: preserve generic external entity/evidence/approval seams in shared registries.
23. Safe-to-Defer Requirements: customer portals/provider integrations/vertical packs/pricing.
24. Autonomous Mature State: vendor evidence collection, validation, renewal and provisioning coordination run continuously; people authorize exceptions and sensitive bank/master-data changes.

## Saturation result

Further branches converge into vendor risk, AP verification, COI, contract obligations and credentialing already represented.