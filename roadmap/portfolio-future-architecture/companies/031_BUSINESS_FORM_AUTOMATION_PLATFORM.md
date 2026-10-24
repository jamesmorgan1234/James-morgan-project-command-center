# Company 031 — Business Form Automation Platform

**Company ID:** `company:future:031`  
**Primary project:** `project:company:future:031`  
**Roadmap version:** `COMPANY-031-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no form submission, signature, legal acceptance or external filing.

## Business identity

Purpose: turn repetitive forms into reusable, validated, source-linked profiles and workflow-ready submissions across web, PDF and document formats.

Problem: businesses repeatedly re-enter the same company/person/project information into changing forms and portals, causing errors, stale data and missed fields.

Value: canonical reusable data profiles, deterministic mapping/validation, document extraction, approval/signature routing and browser-assisted completion with full audit.

## Product tree

Reusable Business/Person Profiles; Field Dictionary & Semantic Mapping; PDF/Form Parser; Browser Form Mapper; Autofill Engine; Validation Rules; Conditional Question Logic; Attachment/Evidence Binder; Signature/Approval Routing; Version/Change Detection; Template Library; Form-to-Workflow Builder; Submission Readiness Checker; Browser Completion Assistant; Batch Form Generation; API/SDK/OEM; Vertical Form Packs; Enterprise Admin/Delegation; Private Runner.

## Feature/customer/vertical tree

Features: canonical fields, aliases, source/provenance, effective date, sensitive classification, required/optional fields, format/unit normalization, conditional sections, cross-field validation, attachment requirements, draft/save/resume, version diff, reviewer/approver, signature state, completion evidence, browser selector recovery, export/import, audit, accessibility/localization.

Customers: SMBs, enterprise ops, HR, procurement, grants/admin teams, vendor onboarding, credentialing, insurance/admin, construction, professional services, government contractors, developers embedding forms.

Verticals: vendor/customer onboarding, employment/admin, licensing/credentialing, grant administration, procurement, insurance/COI, construction/submittals, property/service applications, tax/admin forms, healthcare administrative intake, education/nonprofit. High-stakes legal/financial/government filing requires specialized review.

## Brain capability tree / architecture

Brain understands form semantics, maps questions to canonical fields, identifies missing/conflicting answers, explains ambiguous wording and proposes reusable templates. Deterministic mapping/validation owns actual field values; protected submission/signature/attestation never occurs from model inference alone.

Architecture: canonical profile store, field ontology, form/document parser, OCR/layout, browser DOM mapper, rules/validation, attachment registry, workflow/approval engine, version hashes, LLM for semantic mapping/explanation, browser worker for authorized portals.

## Agent tree

Form Intake Agent, Field Mapping Agent, Profile Reconciliation Agent, Validation Agent, Attachment/Evidence Agent, Browser Mapping Agent, Version Drift Agent, Readiness Agent, Approval/Signature Coordinator, Vertical Pack Agent, QA Agent, Privacy Agent, Integration Agent.

## Deterministic services

Profile registry; schema/field dictionary; parser/OCR; mapping rules; value normalization; validation; attachment/hash store; template/version service; browser form state; approval/signature state; audit; protected submit gate; scheduler/reminders.

## Workflow

Ingest form → parse/version → map fields to canonical profile → identify missing/conflict → retrieve approved evidence → validate → human/owner review where required → generate/fill draft → protected signature/submit boundary → capture receipt/status → update reusable mappings only from verified outcomes.

## Integrations / API / data

Document/PDF tools, browsers, e-sign, cloud storage, CRM/HRIS/procurement, credential/vendor systems, government/public portals where authorized, email, workflow/task systems. APIs for forms/schema/profile/mapping/validation/readiness/draft/status.

Data moat: field ontology, mapping templates, portal/form version history, validation/error corpus and reusable vertical packs; customer form contents remain isolated.

## Monetization / distribution

Forms/submissions/pages, profiles, seats, browser minutes, vertical packs, enterprise/private, API/OEM, managed setup. Distribution through onboarding/procurement/credentialing/HR/e-sign/document ecosystems and integrators.

## Security/privacy/legal

Forms can contain PII, tax, banking, identity and legal attestations. Encrypt/scoped access, secret/credential refs, no model training by default, protected signature/attestation/submission, source provenance, retention/export/delete, no bypass of portal controls.

## Failure / edge cases

Question wording changes, ambiguous aliases, stale profile value, conditional page hidden, CAPTCHA/user-presence requirement, upload size/type, signature authority, conflicting attachments, legal attestation, browser DOM drift. Fail closed on ambiguity and preserve exact submitted snapshot.

## Scale/platform/overlap

Single forms → recurring enterprise form library → cross-portal form infrastructure. Overlap #9 document-to-workflow, #38 grant management, #62 credentialing, #63 vendor onboarding, #42 browser workers. #031 focuses on reusable form completion/mapping.

## Classification

**DESIGN NOW:** canonical owner/company profile refs, field provenance, untrusted document/browser boundary, protected submit/signature action, version snapshots.  
**BUILD NOW:** shared owner-input/profile and browser/document contracts after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** secure profile vault interface, browser-worker isolation, approval/signature abstractions.  
**COMPANY-SPECIFIC LATER:** form library/portal mappings/customer product.  
**SCALE-ONLY:** large cross-portal mapping network.

# Mandatory 24-part completion block

1. Product Tree: profiles/dictionary/parser/browser mapper/autofill/validation/conditional/evidence/signature/version/templates/workflows/readiness/browser/batch/API/packs/admin/private.
2. Feature Tree: canonical fields/provenance/sensitivity/normalization/conditions/validation/attachments/drafts/version/review/signature/receipt/audit/accessibility.
3. Customer Tree: SMB/enterprise HR/procurement/grants/vendors/credentialing/insurance/construction/services/government/developers.
4. Vertical Tree: onboarding/employment/licensing/grants/procurement/insurance/construction/property/tax/health admin/education.
5. Brain Tree: semantic mapping/ambiguity/missing-data reasoning; attestations/submissions prohibited without approval.
6. Agent Tree: intake/mapping/profile/validation/evidence/browser/version/readiness/approval/vertical/QA/privacy/integration.
7. Service Tree: profile/schema/parser/mapping/normalize/validate/attachments/version/browser/approval/audit/submit gate/scheduler.
8. Workflow Tree: ingest→map→reconcile→validate→review→draft→protected submit→receipt→learn verified mapping.
9. Integration Tree: docs/browser/e-sign/storage/CRM/HR/procurement/credential/vendor/public portals/email/tasks.
10. Data Tree: profiles/fields/forms/versions/mappings/evidence/drafts/approvals/submission receipts.
11. API Tree: form/schema/profile/mapping/validation/readiness/draft/status.
12. Monetization Tree: forms/pages/profiles/seats/browser/packs/enterprise/private/API/OEM/managed.
13. Distribution Tree: HR/procurement/credential/document/e-sign ecosystems and integrators.
14. Automation Tree: mapping/validation/draft/prep/status; signatures/submissions gated.
15. Moat Tree: field ontology, mapping corpus, form version history, validation fixes, vertical packs.
16. Platform Tree: autofill→form ops→cross-portal business profile infrastructure.
17. Risk Tree: PII, wrong/stale values, false attestation, browser drift, unauthorized submission.
18. Scale Tree: individual forms→enterprise library→cross-portal infrastructure.
19. Spinoff Tree: adjacent #9/#38/#42/#62/#63 already cover specialist workflows.
20. Command Center Dependencies: owner-input/profile, docs/artifacts, browser workers, policy, identity, company isolation.
21. Design-Now Requirements: versioned canonical field/provenance and protected submission contracts.
22. Build-Now Requirements: shared profile/input/form interfaces after reverse-map.
23. Safe-to-Defer Requirements: external form mappings/product/pricing/private runners.
24. Autonomous Mature State: mappings/drafts/validation/evidence prep happen automatically; humans only attest/sign/resolve ambiguity/protected submissions.

## Saturation result

Further branches are vertical form packs or existing onboarding/credential/grant/browser/document companies, not a new top-level company.
