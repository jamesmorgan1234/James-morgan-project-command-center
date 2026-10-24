# Company 009 — Document-to-Workflow Engine

**Company ID:** `company:future:009`  
**Primary project:** `project:company:future:009`  
**Roadmap version:** `COMPANY-009-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: turn unstructured/semi-structured documents and attachments into verified structured data and downstream business workflows.

Problem: invoices, applications, contracts, claims, forms, scans, receipts and emailed documents create manual reading/data-entry/routing work; extraction-only tools stop before validation, reconciliation and action.

Value: document intake through extraction, validation, business rules, human exceptions, workflow execution and evidence.

Delivery: API, SaaS inbox/workspace, embedded SDK, batch ingestion, email/SFTP connectors, private runner, vertical document packs.

## Product tree

- Universal Document Intake — PDF/image/scan/Office/spreadsheet/email attachment/form.
- OCR/Layout Understanding — pages, tables, handwriting where viable, signatures/marks detection.
- Document Classification — type/subtype/source/priority/sensitivity.
- Structured Extraction — fields/tables/entities/clauses/line items.
- Validation Engine — schema, ranges, reference data, cross-field rules.
- Reconciliation Engine — compare PO/invoice, application/records, claim/policy, form/master data.
- Document Routing — queues, owners, systems, approvals.
- Exception Workspace — low-confidence/conflict/missing data/human correction.
- Document Generation — validated output forms, letters, reports, summaries.
- Form/Template Studio — schemas, extraction packs, rules, examples.
- Contract/Clause Pack; Invoice/AP Pack; Claims Pack; Application/Onboarding Pack; Receipt/Expense Pack; Compliance Evidence Pack; Logistics/Shipping Pack.
- Continuous Document Workflow — monitor inbound folders/email and trigger repeatable processes.
- API/SDK/OEM/Private Deployment.

## Feature/customer/vertical trees

Features: OCR, layout/table, rotation/quality, language, classification, field confidence, source bounding boxes, validation, reference lookup, duplicate detection, version comparison, signatures/checkboxes, redaction, document splitting/merging, attachment threading, human review, audit, retention, export, workflow builder, webhooks/API, batch, accessibility/localization.

Customers: finance/AP/AR, insurance/claims, legal/admin, healthcare admin, HR, procurement, government, logistics, property/construction, education/nonprofit, SaaS platforms, BPO/outsourcing, developers.

Verticals: accounts payable, insurance, credentialing, onboarding, lending/admin only with appropriate regulation, logistics/BOL/POD, construction submittals/COIs, legal contract intake, healthcare administrative forms, public applications, grant administration, ecommerce returns/warranty.

## Brain capability tree / architecture

Brain understands document type, semantic fields/clauses, workflow context, ambiguous text and exception reason. It can recommend mappings/rules, summarize, classify, detect likely inconsistencies. Deterministic schemas/rules/reconciliation own acceptance and protected downstream actions. Confidence must be explicit; low confidence escalates.

Architecture: OCR/CV/layout models, deterministic parser/schema validators, relational master/reference data, LLM/vision model for semantic extraction where needed, model routing, rules engine, entity resolution, workflow/state engine, object store, provenance/coordinate refs, human review queue.

## Agent tree

Intake Classifier, Extraction Agent, Table/Line-Item Agent, Clause Analyst, Validation Agent, Reconciliation Agent, Duplicate/Fraud Signal Agent, Routing Agent, Human-Review Coordinator, Template/Schema Agent, Privacy/Redaction Agent, Document Generation Agent, Integration Agent, QA Agent.

## Deterministic services

File ingestion/virus scan; MIME parser; OCR/layout; image preprocessing; schema registry; field validators; reference-data lookup; duplicate/hash service; reconciliation rules; confidence thresholds; object storage; retention; queue; workflow engine; human review state; export/webhook; audit.

## Inputs / outputs / workflows

Inputs: files/scans/images/email attachments, document schemas/templates, reference/master data, workflow rules, customer corrections.

Outputs: structured JSON/tables, validated records, routed tasks, downstream API calls, generated docs, exceptions, evidence.

Workflow: ingest → malware/type/quality scan → classify/split → OCR/layout/semantic extract → confidence/provenance → validate/reference → reconcile → exception/human review → approve structured record → trigger authorized workflow → verify downstream result → retain/delete/evidence.

## Integrations / API

Email, cloud drives, SFTP, scanners/mobile capture, accounting/ERP, CRM, claims/policy systems, HRIS, procurement, DMS, e-sign, databases/warehouses, workflow engines, ticketing, object storage. APIs for upload/job/status/result/schema/template/validation/review/webhook/export.

## Data / moat

Document templates/schemas, labeled examples, extraction corrections, field-coordinate provenance, validation/reconciliation rules, document-type ontology, confidence/calibration and vertical exception corpus. Customer documents remain isolated; training reuse opt-in only.

## Monetization / distribution

Per page/document/field/job, vertical pack, seats/reviewers, API, private deployment, dedicated models, enterprise retention/compliance, OEM, managed review. Distribution via accounting/insurance/HR/procurement/DMS partners, developer APIs, vertical integrators and marketplaces.

## Security/privacy/compliance

Documents may hold PII/financial/health/legal data. Virus/malware scan, encryption, least privilege, regional/private processing, redaction, short retention, no-training default, review access controls, audit, deletion/export, customer-specific keys optional, protected downstream actions.

## Failure / edge cases

Poor scan, handwriting, mixed languages, nested tables, wrong document type, duplicate/resubmitted doc, forged/altered content, prompt injection in document text, OCR hallucination, conflicting reference data, partial page, password/encrypted file, huge file, hidden attachments. Treat document content as untrusted data, not instructions; use confidence/provenance and deterministic validation.

## Scale / moat / platform

Micro: thousands docs/month. ~$100K ARR: vertical templates/review tooling. ~$1M: enterprise/private/custom packs. ~$10M: large multi-vertical processing and partner ecosystem. ~$100M+: document intelligence/workflow infrastructure with broad OEM/API use.

Overlap #8 general workflow, #31 business forms, #35 claims, #48 AP verification, #52 COI, #64 inbox. Company 009 stays document-centric extraction→validated workflow.

## Classification

**DESIGN NOW:** untrusted-content boundary, artifact/provenance refs, confidence/verification contracts, workflow/action gates, storage/retention interfaces.  
**BUILD NOW:** Command Center should treat documents as untrusted inputs and preserve provenance; generic artifact/workflow contracts after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company isolation/private processing seams, model routing, review/evaluation interfaces.  
**COMPANY-SPECIFIC LATER:** extraction packs/models/vertical connectors/UI/pricing.  
**SCALE-ONLY:** dedicated OCR/model fleets, broad marketplace.

# Mandatory 24-part completion block

1. **Complete Product Tree:** intake/OCR/classification/extraction/validation/reconciliation/routing/review/generation/template studio/vertical packs/API/private/OEM.
2. **Complete Feature Tree:** file handling, layout/table/language/confidence/provenance/rules/duplicates/version/redaction/review/audit/retention/workflow/API.
3. **Complete Customer Tree:** finance, insurance, legal/admin, health admin, HR, procurement, government, logistics, construction, education, SaaS/BPO/devs.
4. **Complete Vertical Tree:** AP, claims, credentialing, onboarding, logistics, COI, contracts, health forms, public/grant, returns/warranty.
5. **Complete Brain Capability Tree:** semantic extraction/classification/mapping/explanation; deterministic verification/action.
6. **Complete Agent Tree:** classifier/extractor/table/clause/validation/reconcile/duplicate/routing/review/template/privacy/generation/integration/QA.
7. **Complete Service Tree:** ingest/scan/OCR/schema/validation/reference/hash/reconcile/confidence/storage/retention/queue/workflow/review/export/audit.
8. **Complete Workflow Tree:** ingest→untrusted scan→extract→verify→review→structured record→authorized workflow→verification.
9. **Complete Integration Tree:** email/files/SFTP/mobile/accounting/ERP/CRM/claims/HR/procurement/DMS/e-sign/data/workflow/tickets.
10. **Complete Data Tree:** files, schemas, labels, corrections, provenance, reference, rules, exceptions, results.
11. **Complete API/Developer Tree:** upload/job/status/result/schema/template/validation/review/webhooks/export.
12. **Complete Monetization Tree:** pages/docs/fields/jobs/packs/seats/API/private/dedicated/retention/OEM/managed review.
13. **Complete Distribution Tree:** vertical integrations, marketplaces, developer/partner channels.
14. **Complete Automation Tree:** intake/classify/extract/validate/reconcile/route/generate; low confidence escalates.
15. **Complete Moat Tree:** template/correction corpus, calibration, vertical rules, integrations, reliable provenance.
16. **Complete Platform Tree:** extraction → validated document operations → vertical workflow platform.
17. **Complete Risk Tree:** sensitive docs, malicious content, OCR errors, forged docs, overretention, wrong action.
18. **Complete Scale Tree:** small queues → vertical enterprise → large multi-region/OEM.
19. **Complete Spinoff Tree:** existing #31/#35/#48/#52/#64 cover specialist products.
20. **Command Center Dependencies:** artifact/provenance, security, model routing, workflow/Agency, retention, company isolation.
21. **Design-Now Requirements:** untrusted content + confidence/provenance + deterministic action verification.
22. **Build-Now Requirements:** shared artifact/input-security contracts after reverse-map.
23. **Safe-to-Defer Requirements:** specific OCR/models/templates/connectors/review portal/pricing.
24. **Autonomous Mature State:** intake/extraction/validation/routing operate automatically; exceptions route to humans; James sees strategic/protected decisions only.

## Saturation result

Further document niches become vertical packs or existing specialist portfolio companies; no additional top-level company is needed.
