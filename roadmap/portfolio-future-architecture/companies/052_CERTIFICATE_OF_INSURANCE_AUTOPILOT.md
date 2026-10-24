# Company 052 — Certificate-of-Insurance Autopilot

**Company ID:** `company:future:052`  
**Primary project:** `project:company:future:052`  
**Roadmap version:** `COMPANY-052-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no insurance acceptance, vendor approval, certificate issuance or contractual/legal determination.

## Business identity

Purpose: automate collection, extraction, verification, monitoring and evidence for certificates of insurance and related coverage requirements across vendors, contractors, tenants, partners and projects.

Problem: COIs arrive as inconsistent PDFs/emails, expire frequently, contain policy/limit/endorsement details that must be compared against contract requirements, and create operational exposure when missing or stale.

Value: continuous visibility into insurance compliance, faster vendor onboarding, automated reminders, structured exception handling and auditable proof without pretending software replaces insurance/legal judgment.

## Complete product tree

COI Intake Portal; Email/Attachment Ingestion; OCR/Extraction; Insured/Carrier/Producer Resolution; Policy/Limit Verification; Requirement Template Builder; Contract-to-Insurance Requirement Extractor; Endorsement Tracker; Expiration/Renewal Monitor; Vendor/Contractor Portal; Deficiency Queue; Reminder/Chase Automation; Project/Location Coverage Matrix; Additional-Insured/Waiver Evidence Tracker; Carrier/Policy Validation Adapter; Compliance Scorecard; Audit Package; API/SDK; White-Label/OEM; Broker/Agency Edition; Enterprise/Private Deployment; Industry Requirement Packs.

## Feature/customer/vertical tree

Features: named insured, certificate holder, producer/carrier, policy types/numbers, effective/expiration dates, limits, deductibles where relevant, occurrence/aggregate structure, additional-insured language/evidence, waiver/subrogation evidence, primary/non-contributory status, cancellation notice where present, project/location scope, contract requirement version, exceptions, renewals, reminder cadence, source document hash, review/approval and audit history.

Customers: construction/general contractors, property managers, landlords, facilities teams, procurement/vendor-risk teams, franchise groups, events, municipalities, staffing firms, logistics, brokerages, enterprises and compliance service providers.

Verticals: construction, real estate/property, facilities, events, logistics, hospitality, staffing, municipalities, healthcare administrative vendor management, education, energy/service contractors. Each uses different coverage requirements and terminology.

## Brain capability tree / architecture

Brain may understand policy/certificate language, map contract requirements to extracted fields, explain deficiencies and prioritize follow-up. Deterministic rules own required limits/dates/endorsement checks. Brain may not declare legal sufficiency, bind coverage, approve a vendor or interpret an insurance contract as final authority.

Architecture: document ingestion/extraction, insurer/producer/vendor entity graph, requirement template/version registry, deterministic coverage rules, contract clause extractor, expiration scheduler, exception state machine, communication draft workflow, provenance/evidence ledger and optional grounded LLM for document interpretation.

## Agent tree

COI Intake Agent; Document Extraction Agent; Entity Resolution Agent; Requirement Mapping Agent; Coverage Verification Agent; Endorsement Agent; Expiration/Renewal Agent; Vendor Follow-Up Draft Agent; Exception Coordinator; Contract Requirement Analyst; Evidence/Audit Agent; QA/Compliance Agent.

## Deterministic services

Document hash/virus scan; OCR/parser; field validation; date/limit/rule engine; requirement templates; vendor/project associations; expiration scheduler; duplicate detection; reminder idempotency; review state; immutable evidence; protected communications/vendor-status gates.

## Workflow tree

Requirement created/versioned → vendor/project assigned → COI requested → document received/validated → extract → resolve entities → compare policy types/limits/dates/endorsements to exact requirement version → flag deficiencies/unknowns → authorized reviewer resolves exceptions → reminders/renewals → updated certificate rechecked → compliance evidence retained → expiration reopens workflow.

## Integrations / API / data

Vendor management, procurement, contracts/CLM, property/construction platforms, ERP, CRM, email, document storage, broker/carrier services where available, ticketing, identity/SSO. APIs for requirements, vendors, documents, extracted coverage, compliance state, expirations and evidence.

Data: vendors, requirements/versions, certificates, extracted fields, carriers/producers, policies, endorsements, projects/locations, deficiencies, exceptions, reviews, reminders and evidence. Insurance documents are sensitive business records and remain isolated.

## Monetization / distribution

Vendors/contractors tracked, certificates processed, locations/projects, seats, enterprise/private, broker/reseller edition, API/OEM, managed compliance service, premium vertical packs. Distribution via construction/property/procurement/vendor-risk ecosystems and insurance brokers/consultants.

## Security/privacy/compliance

Protect policy/vendor data, least privilege, immutable original-document hashes, no fabricated endorsements, explicit unknown state, review separation, audit history and configurable retention. Product provides workflow/verification support, not insurance or legal advice.

## Failure / edge cases

Blurry scans, altered PDFs, multiple policies on one COI, blanket endorsements, missing endorsement forms, ambiguous entity names, policy renewal gap, carrier merger, project-specific limits, umbrella/excess layering, claims-made vs occurrence, cancelled policy, duplicate certificate, requirement changed after receipt, fraudulent document. Ambiguity must route to review.

## Scale / overlap

Small contractor program → enterprise vendor insurance control → broker/embedded compliance infrastructure. Overlap #24 vendor risk, #52 owns insurance-specific evidence, #63 vendor onboarding, #23 contract obligations. Integration should share contracts/vendor identity but keep insurance logic domain-specific.

## Classification

**DESIGN NOW:** versioned requirements, document provenance, vendor/entity isolation, recurring expiry workflows, evidence state and protected communication/status decisions.  
**BUILD NOW:** Command Center recurring obligations/document provenance/vendor-registry interfaces may need reverse-map support.  
**BUILD BEFORE FIRST COMPANY:** document pipeline, requirement engine, scheduler, vendor/project mapping, review/exception state.  
**COMPANY-SPECIFIC LATER:** carrier/broker connectors, customer portals, vertical packs, pricing.  
**SCALE-ONLY:** carrier/network verification, benchmark requirement libraries and global insurance packs.

# Mandatory 24-part completion block

1. Product Tree: intake/email/OCR/entity/policy verification/templates/contracts/endorsements/expiry/portal/deficiencies/reminders/matrix/carrier/audit/API/OEM.
2. Feature Tree: insured/holder/producer/carrier/policy/dates/limits/endorsements/project/requirements/exceptions/renewals/provenance/review.
3. Customer Tree: construction/property/facilities/procurement/franchise/events/government/staffing/logistics/brokers/enterprise.
4. Vertical Tree: construction/real estate/events/logistics/hospitality/staffing/municipal/health admin/education/energy services.
5. Brain Tree: document/contract mapping and explanations; legal/coverage sufficiency determination not autonomous.
6. Agent Tree: intake/extract/entity/requirements/coverage/endorsement/renewal/follow-up/exception/contract/evidence/QA.
7. Service Tree: hashing/OCR/validation/rule engine/templates/associations/scheduler/dedup/idempotency/review/audit.
8. Workflow Tree: requirement→request→receive→extract→compare→deficiency/review→renew→evidence→reopen on expiry.
9. Integration Tree: vendor/procurement/CLM/property/construction/ERP/CRM/email/docs/broker/ticketing/SSO.
10. Data Tree: vendors/requirements/certificates/coverage/carriers/policies/endorsements/projects/deficiencies/reviews/evidence.
11. API Tree: requirements/vendors/documents/coverage/status/expirations/evidence.
12. Monetization Tree: vendors/certificates/projects/seats/enterprise/broker/API/managed/packs.
13. Distribution Tree: construction/property/procurement/vendor-risk/broker/consultant ecosystems.
14. Automation Tree: extraction/rule comparison/expiry/reminders automated; ambiguous/legal approval gated.
15. Moat Tree: requirement packs, extraction accuracy, vendor/carrier normalization, deficiency outcome history.
16. Platform Tree: COI tracker→vendor insurance compliance→embedded evidence infrastructure.
17. Risk Tree: false compliance, altered docs, wrong entity, missing endorsement, privacy leak, stale requirement.
18. Scale Tree: SMB contractor list→enterprise network→broker/OEM platform.
19. Spinoff Tree: insurance-document verification modules may be embedded; vendor-risk/onboarding stay separate companies.
20. Command Center Dependencies: documents, provenance, vendor identity, recurring scheduler, policy rules, communications, evidence.
21. Design-Now Requirements: versioned obligation/requirement and document-evidence interfaces.
22. Build-Now Requirements: preserve generic recurring compliance/document verification primitives in Command Center.
23. Safe-to-Defer Requirements: carrier/broker networks, portal UX, vertical packs, pricing.
24. Autonomous Mature State: certificates ingest, validate, monitor and chase automatically; humans handle ambiguous endorsements, suspected fraud and final compliance exceptions.

## Saturation result

Further branches converge into vendor risk, vendor onboarding or contract obligation management; insurance-specific verification remains the coherent boundary for Company 052.