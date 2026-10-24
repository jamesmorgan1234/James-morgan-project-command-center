# Company 101 — Healthcare Administrative Automation OS

**Company ID:** `company:future:101`  
**Primary project:** `project:company:future:101`  
**Roadmap version:** `COMPANY-101-v2.0.0`  
**Truth state:** PLANNED  
**Roadmap conformance:** EXHAUSTIVE 28-PASS / A–BZ MAPPED; saturation subject to portfolio reverse-map reconciliation  
**Authorization:** roadmap/architecture only; no healthcare operations, patient contact, payer submissions, clinical decisions, billing submissions, protected-data processing, customer onboarding, deployment, spending or public launch.  
**First-class project requirement:** independent Command Center project button, independent progress percentage, independent project pages, Brain/Agent/service state, Needs Me, incidents, dependencies, approvals and lifecycle.

## Business identity

Purpose: automate major portions of healthcare administration and revenue-cycle operations while preserving professional, privacy, legal, payer, contractual and human-review boundaries.

Core problem: healthcare administration is fragmented across EHRs, practice-management systems, payer portals, clearinghouses, fax/email/document workflows and payer-specific rules. Staff repeatedly re-key information, verify eligibility, chase authorization, correct claims, manage denials, reconcile payments and interpret changing administrative requirements.

Value proposition: reduce administrative burden, shorten cycle time, improve submission completeness, surface reimbursement variance, preserve evidence/provenance and route high-impact or ambiguous decisions to authorized human reviewers rather than pretending administrative automation is clinical judgment.

Non-goal: this company is not an autonomous physician, diagnostician, prescriber, utilization-review clinician or legal substitute. Clinical decisions and other legally/professionally reserved judgments remain outside unattended automation.

## Complete product tree

Healthcare Admin Control Center; Eligibility & Benefits Verification; Coverage Discovery; Prior Authorization Intake; Electronic Prior Authorization; Authorization Rules Engine; Authorization Evidence Pack Builder; Authorization Status Monitor; Referral Administration; Referral Network Routing; Claim Preparation; Claim Scrubbing; Coding Support/Validation; Documentation Completeness Review; Charge Capture Support; Claim Submission Orchestration; Claim Status Tracking; Rejection Correction; Denial Classification; Denial Root-Cause Analytics; Denial Work Queues; Appeal Draft/Evidence Builder; Appeal Deadline Manager; Payment Posting; ERA/EOB Parsing; Contractual Adjustment Validation; Payment Variance Detection; Underpayment Detection; Reimbursement Benchmarking; A/R Follow-up; Payer Portal Automation; Payer Policy Monitor; Payer Rule Knowledge Base; Fee Schedule Intelligence; Patient Financial Administration; Patient Estimate Support; Financial Assistance Workflow Support; Statement/Payment-Plan Administration; Refund/Credit-Balance Workflow; Credentialing/Enrollment Integration; Revenue-Cycle Analytics; Operational Benchmarking; Audit/Evidence Vault; Healthcare Admin API; Embedded SDK; White-Label RCM Infrastructure; Multi-Entity Enterprise Console; Specialty Packs; Payer Packs; State/Jurisdiction Packs; Interoperability Gateway.

## Complete feature tree

Patient/member identity matching; provider/facility identity; payer/plan identification; effective dates; benefits/deductible/copay/coinsurance/out-of-pocket capture; service/procedure context; referral requirements; authorization requirement detection; authorization question/criteria extraction; required-document checklist; clinical-document reference without independent diagnosis; evidence provenance; payer submission status; deadlines; claim edits; coding-rule checks; modifier checks; bundling/edit checks where licensed/authorized; documentation completeness; diagnosis/procedure linkage validation support; claim lifecycle; rejection reason normalization; denial taxonomy; appeal evidence; payment/adjustment normalization; contract/rate expectation comparison; aging; follow-up cadence; portal-session state; communication history; audit log; confidence; human-review gate; source freshness; payer-rule version; effective date; supersession; data-retention state; consent/authorization state; tenant; role; security classification.

## Complete customer tree

Independent practices; physician groups; specialty practices; clinics; ambulatory surgery centers; hospitals; health systems; dental/vision where domain packs fit; behavioral-health administrative organizations without clinical-decision automation; laboratories; imaging centers; DME suppliers where lawful; home-health/hospice administrative teams; RCM companies; medical billing companies; coding-support organizations; management-service organizations; provider networks; payers for administrative workflows; healthcare software vendors; EHR/practice-management vendors; clearinghouses; revenue-cycle consultancies; authorized government/health administration programs where procurement and law permit.

## Complete vertical tree

Primary care; cardiology; orthopedics; gastroenterology; dermatology; oncology administration; radiology/imaging; pathology/labs; surgery; anesthesia; physical/occupational therapy; behavioral-health administration; pediatrics; women’s-health administration; dental; vision; DME; home health; hospice administration; urgent care; multi-specialty groups; hospital outpatient; inpatient revenue-cycle administration; ambulatory surgery; specialty pharmacy administrative interfaces where lawful; payer/provider operations. Each vertical requires a bounded specialty pack with terminology, common payer workflows, documentation patterns and evaluation sets.

## Specialized Brain capability tree

The Healthcare Administrative Brain must know and reason over payer policies, eligibility, benefits, authorization, referrals, claim lifecycles, coding structures, reimbursement, denials, appeals, documentation completeness, payment variance, contractual rules, payer portals, administrative standards, interoperability standards and changing rule provenance.

Required capabilities: KNOW payer/plan/provider/admin vocabulary; UNDERSTAND administrative context and evidence; CLASSIFY workflow, denial, rejection, document, payer and risk; REASON about missing requirements and next administrative actions; PLAN multi-step work; PREDICT likelihood of administrative rejection/denial only as decision support; FORECAST queue/aging/workload; OPTIMIZE sequencing and staff attention; RECOMMEND next actions with evidence; DECIDE only within narrow pre-authorized administrative rules; EXECUTE low-risk administrative steps through governed tools; VERIFY submitted/received/reconciled state; EXPLAIN source/rule/rationale; ESCALATE uncertainty, high-impact exceptions and protected decisions.

The Brain must maintain strict distinction among: administrative fact; payer rule; source statement; inferred recommendation; clinician-authored content; human-approved decision. It must never silently convert an inference into a clinical fact.

## Brain architecture

Brain Factory base + healthcare administration domain pack + payer-policy retrieval layer + versioned rule/effective-date graph + specialty packs + workflow planner + confidence/evidence engine + deterministic validation services + human-review policy layer.

Memory: tenant-isolated operational memory; no cross-customer PHI learning by default; provenance-bound policy memory; expiry/freshness for payer rules; configurable retention; redaction/tokenization where appropriate.

Evaluations: authorization requirement detection; eligibility interpretation; claim-edit precision/recall; denial classification; payment variance accuracy; document-completeness accuracy; hallucination/source-faithfulness; stale-policy detection; PHI leakage; role/permission enforcement; high-impact decision refusal/escalation; portal-tool reliability; idempotency; duplicate-submission prevention.

## Complete Agent tree

Eligibility Agent; Benefits Verification Agent; Authorization Intake Agent; Authorization Evidence Agent; Authorization Status Agent; Referral Agent; Coding-Support Agent; Documentation Completeness Agent; Claim Preparation Agent; Claim Scrub Agent; Submission Agent; Rejection Agent; Claim Status Agent; Denial Triage Agent; Appeal Support Agent; Payment Posting Agent; Payment Variance Agent; Underpayment Agent; A/R Follow-up Agent; Payer Policy Monitor Agent; Portal Automation Agent; Patient-Financial-Administration Agent; RCM Analytics Agent; Integration Agent; Data Quality Agent; Security/Privacy Agent; Compliance Agent; Independent QA Agent; Incident/Reconciliation Agent.

Agents receive least-privilege scopes. High-impact actions, legal attestations, payer representations, clinical interpretations and protected external submissions require the appropriate authorization gate.

## Deterministic / non-agent services

FHIR/HL7 parsing; X12 transaction parsing/generation where appropriate; eligibility response normalization; ERA/EOB normalization; claim-schema validation; coding/table lookups under proper licensing; rule engines; deadline calculators; fee-schedule/rate tables; contract term evaluators; payment reconciliation; duplicate detection; patient/member/provider matching; document hashing; OCR/document extraction when authorized; redaction/tokenization; audit logging; idempotency keys; retry/dead-letter queues; portal session/replay state; consent/authorization state; encryption/key management; retention/deletion engine; metrics/tracing.

## Input tree

Patient/member demographics; insurance cards/plan identifiers; provider/facility data; appointment/service data; orders/referrals; clinician-authored notes/documents; authorization forms; payer policies; payer responses; claims; claim edits; clearinghouse acknowledgments; remittances; EOB/ERA; contracts/fee schedules; denial letters; appeal responses; correspondence; portal statuses; call notes; timestamps; billing ledgers; payment data; workflow rules; user approvals.

## Output tree

Eligibility/benefit summaries; authorization requirement findings; required-document checklists; submission-ready administrative packets; status alerts; claim-quality findings; corrected administrative claim candidates; denial reason classification; appeal draft/evidence pack; payment-posting candidates; variance/underpayment findings; A/R work queues; payer-policy change alerts; operational metrics; audit evidence; reconciliation reports; human-review tasks; API responses; exportable records.

## Workflow tree

Authorize tenant/workflow → identify patient/provider/payer/service → verify coverage/benefits → determine referral/authorization requirements → collect required evidence → human/professional review where necessary → submit through approved channel → monitor status → update scheduling/revenue-cycle state → prepare/scrub claim → submit → track acknowledgments/status → normalize rejection/denial → correct or assemble appeal support → monitor adjudication → ingest remittance → post/reconcile → detect variance/underpayment → follow up → close with evidence → retain/delete under policy.

## Integration tree

EHR; practice management; scheduling; billing; clearinghouses; payer APIs; payer portals; FHIR endpoints; HL7 interfaces; X12 gateways; document management; secure fax/messaging; SFTP; identity/SSO; credentialing systems; payment systems; data warehouses; BI; support/ticketing; call-center systems where authorized; audit/SIEM; cloud/object storage; notification providers.

## API / developer ecosystem

Eligibility API; benefits API; authorization-requirement API; authorization workflow API; claim-quality API; denial-classification API; payment-variance API; payer-policy API; status/webhook API; evidence/provenance API; administrative workflow SDK; sandbox/test fixtures; versioned schemas; webhook replay/idempotency; tenant-scoped keys; enterprise private-connect patterns.

## Data architecture

Tenant-isolated patient/member/provider/payer/workflow records; normalized administrative event model; payer/plan graph; policy/rule graph with source/effective dates; claim/authorization/payment lifecycle events; immutable audit/evidence ledger; document references; role/consent/authorization records; feature/quality metrics; encrypted secrets separated from business data; configurable region/residency; backup/recovery; legal-retention controls.

## Data moat

Potential moat comes from de-identified/authorized aggregate operational patterns, payer-rule normalization, workflow outcome evidence, denial/rejection taxonomies, integration reliability patterns, specialty administrative packs and verified rule-to-outcome relationships. No moat may depend on unauthorized exploitation of PHI, cross-tenant private data or prohibited secondary use.

## IP

Versioned payer-rule normalization system; administrative event ontology; evidence/provenance model; specialty workflow packs; interoperability adapters; denial/appeal taxonomy; payment-variance engine; portal reliability layer; evaluation corpus; deterministic guardrails; human-review policy engine.

## Monetization

Subscription by organization/site/provider; usage by eligibility/authorization/claim/denial/payment workflow; modular product pricing; enterprise license; API usage; private deployment; white-label/OEM; managed administrative automation; specialty/payer packs; outcome-linked administrative recovery pricing only where lawful and contractually appropriate. No revenue promise.

## Packaging

Starter eligibility/benefits; authorization suite; claims quality suite; denial/appeals suite; payment/reconciliation suite; full RCM administrative OS; enterprise multi-entity; API-only; embedded OEM; private/regulated deployment; specialty editions.

## Distribution

Healthcare software partnerships; RCM/billing partners; EHR/practice-management ecosystems; clearinghouse relationships; specialty associations; enterprise health-system procurement; implementation partners; channel/OEM. No outreach is authorized by this roadmap.

## Acquisition automation

Future low-risk automation may qualify inbound leads, map requested workflows to product modules, generate non-binding technical fit assessments and prepare demos/sandboxes. It must not send marketing, sign agreements, quote binding terms or represent compliance without authorization.

## Customer lifecycle

Discover → security/compliance review → integration assessment → sandbox/pilot → workflow validation → human-review calibration → controlled rollout → adoption monitoring → QA → expansion → renewal → export/transition/termination.

## Support / customer success

Healthcare-aware support with incident severity, integration diagnostics, rule/source explanation, payer-workflow troubleshooting, audit evidence, release notes, change-impact alerts, customer-specific configuration validation and training. Customer success tracks automation rate, cycle time, error/denial reduction and staff burden without claiming clinical outcomes unless validated and appropriate.

## Automation maximum / human-intervention minimum

Automate deterministic parsing, data normalization, eligibility queries, status polling, document completeness, rule lookup, deadline tracking, claim edits, routine work-queue routing, reconciliation and low-risk portal steps. Minimize manual re-keying and repetitive status chasing.

Human/professional intervention remains for ambiguous/high-impact clinical context, attestations, medical-necessity judgments, legal/compliance interpretations, unusual payer disputes, major financial exceptions, sensitive patient communications, contract interpretation beyond encoded terms and protected external commitments.

## Operations / administration

Tenant provisioning; integration onboarding; credential/connection lifecycle; policy/rule ingestion; release management; queue monitoring; payer portal health; support; billing; vendor management; data-retention administration; audit requests; incident handling; change management; backup/recovery; customer offboarding/export.

## Security

High-sensitivity architecture: encryption in transit/at rest; least privilege; strong tenant isolation; SSO/MFA; role/attribute-based access; secrets vault; just-in-time access; audited privileged actions; network restrictions; secure integration gateway; malware/file scanning; DLP; prompt-injection defenses for untrusted documents; model/tool egress controls; redaction; key rotation; vulnerability management; signed artifacts; security logging; incident response; vendor-risk assessment.

## Privacy

PHI/PII minimization; purpose limitation; configurable retention; patient/member matching controls; consent/authorization representation; access accounting; data export/deletion where applicable; region/residency controls; de-identification when appropriate; no training on customer PHI by default; privacy impact assessment; subprocessor inventory; breach/incident procedures.

## Compliance

Design for HIPAA/HITECH obligations where applicable, payer/clearinghouse contractual rules, healthcare transaction standards, state privacy/health-data requirements, records obligations, security frameworks and customer-specific controls. Compliance claims require actual validated controls and legal/compliance review; roadmap labels do not create certification.

## Legal

BAA/contract requirements, data-use limitations, payer portal terms, coding/content licenses, clearinghouse agreements, records retention, intellectual property, professional-practice boundaries, indemnity/liability, audit rights, subcontractor terms and jurisdiction-specific restrictions must be modeled. No agreement is signed by roadmap work.

## Abuse / misuse

Prevent fraudulent claims, fabricated documentation, unauthorized code changes, upcoding assistance, identity misuse, improper access to patient records, duplicate submission, unauthorized benefit queries, portal abuse, denial manipulation and extraction of restricted payer/customer data. Detect suspicious patterns and route to authorized review.

## Reliability

Idempotent submissions; durable queues; retries/backoff; dead-letter handling; transaction state machines; exactly-once-effect design where external semantics permit; portal/API failover strategies; source freshness; reconciliation; duplicate protection; degraded safe mode; manual fallback; backup/restore; disaster recovery; time-zone/deadline correctness.

## Observability

Per-tenant and per-workflow metrics: query/submission success; latency; queue age; portal/API health; authorization cycle time; claim rejection/denial categories; payment variance; automation rate; manual-review rate; model confidence; rule freshness; error rate; security events; cost per workflow; incident state. Trace every external action to source, actor, version and approval.

## Incident response

Severity model for PHI exposure, unauthorized access, wrong-patient matching, duplicate/incorrect submission, payer portal credential compromise, stale-rule use, payment posting errors, widespread integration outage and model/tool failures. Containment, suspend affected automation, preserve evidence, reconcile impacted records, notify authorized stakeholders, restore from known-good state, postmortem and control update.

## Testing

Unit; schema; integration; contract; sandbox payer/clearinghouse; portal replay; synthetic/de-identified fixtures; golden workflow; regression; security; privacy; permission; adversarial document/prompt; idempotency; duplicate-submission; disaster recovery; load/performance; data reconciliation; human-review calibration.

## Brain evaluations

Source faithfulness; payer-rule freshness; eligibility interpretation; authorization requirement recall/precision; documentation completeness; denial classification; payment variance; unsupported inference rate; escalation correctness; PHI leakage; cross-tenant leakage; prompt injection resistance; action authorization; tool-use reliability; explanation/provenance completeness.

## Deployment

Isolated dev/test/staging/production; regulated-data separation; region controls; infrastructure as code; signed releases; change approvals; canary/feature flags; rollback; schema migration gates; secret rotation; environment-specific integrations; customer pilot rings. No production deployment is authorized now.

## Scale

Prototype with synthetic/de-identified data → first controlled administrative workflow → specialty practice → multi-site group → RCM partner → health-system/enterprise scale → multi-payer/multi-region platform. Scale queue partitioning, rule freshness, integration pools, audit storage, model routing and support independently.

## Performance

Latency budgets vary by use: interactive eligibility/status seconds; batch claim/payment work minutes; policy ingestion asynchronous. Avoid blocking patient scheduling or billing operations on fragile AI calls; cache only within correctness/freshness bounds; use deterministic fast paths for known rules.

## Cost

Major drivers: model inference, document extraction, portal/browser automation, transaction fees, clearinghouse/payer connectivity, data storage, audit retention, support/security/compliance. Track per-workflow cost, vendor cost, model route, retry waste and internalization candidates. $0/free-first applies to Command Center build work; future commercial infrastructure requires authorization.

## Financial metrics

ARR/MRR if later real; gross/contribution margin; cost per eligibility/authorization/claim/denial/payment workflow; recovered underpayment where contractually measured; implementation cost; support cost; retention; expansion; automation rate; days in A/R; denial/rejection rate; cycle time. Never treat test data as revenue.

## Moat

Payer-rule/effective-date graph; specialty packs; normalized administrative event model; verified workflow outcomes; integration reliability; audit/provenance; evaluation corpus; enterprise trust; accumulated compatibility knowledge.

## Network effects

Possible non-private effects: broader payer-rule coverage, more integration adapters, better de-identified benchmark ranges, improved denial taxonomy and workflow reliability. Never require pooling identifiable patient/customer data.

## Platform

Can evolve from point solutions into a healthcare administrative operating layer coordinating data, policies, workflows, agents, deterministic services, audit evidence and third-party applications.

## White label / OEM

EHRs, practice-management vendors, RCM firms, clearinghouses and healthcare platforms may embed scoped modules through APIs/SDKs. Tenant ownership, branding, support, audit, model behavior and responsibility boundaries must remain explicit.

## Internationalization

Country-specific healthcare systems, payer models, coding/transaction standards, privacy rules, languages, currencies and reimbursement structures require separate domain packs. Do not assume US payer logic generalizes globally.

## Accessibility

WCAG-aligned admin interfaces; keyboard operation; screen-reader semantics; high-contrast/text scaling; accessible forms/tables/statuses; non-color-only alerts; understandable error explanations; accessible training/support materials.

## Mobile

Mobile is appropriate for status review, approvals, alerts, document capture where secure, and limited work queues; avoid forcing dense revenue-cycle work into phone-only UX. Strong device/session controls and remote logout required.

## Voice

Voice can support authenticated call summarization, payer-call notes and hands-free status queries only with consent, recording-law compliance and strong identity controls. Never fabricate payer statements; preserve transcript/source evidence.

## Multimodal

Documents, scans, cards, forms, EOBs, letters, portal screenshots and voice transcripts may be inputs. Extraction must preserve source regions/confidence and route ambiguity to review.

## Marketplace

Potential future marketplace for verified specialty packs, payer connectors, workflow templates and integration modules. No unreviewed third-party module receives patient-data/tool permissions by default.

## Developer ecosystem

Versioned APIs/SDKs; test sandboxes; synthetic fixtures; connector certification; schema registry; webhook contracts; developer portal; scoped credentials; sample apps; integration QA; deprecation policy.

## Partners

EHR/PMS vendors; clearinghouses; RCM companies; interoperability firms; security/compliance vendors; specialty consultants; implementation partners. Partnerships are architecture possibilities only, not authorized outreach.

## Training / certification

Role-based operator training; administrator training; integration certification; workflow pack certification; human-review calibration; security/privacy training; release/change training. Certification branding requires actual program definition later.

## Community

Future customer/operator community can share non-sensitive workflow practices, integration lessons and feature requests under moderation and confidentiality controls. No patient/customer data sharing.

## Content / knowledge

Versioned payer/admin knowledge library; source links; effective dates; specialty playbooks; integration runbooks; release notes; troubleshooting; policy change summaries; audit documentation; developer docs.

## Experimentation

Offline/sandbox evaluation first; synthetic/de-identified data where possible; shadow mode; A/B only where ethically/contractually appropriate; no silent experimentation on protected submissions or high-impact workflows; pre-defined success/safety metrics; rollback.

## Continuous improvement

Learn from incidents, manual overrides, denials/rejections, integration failures, customer configuration and rule changes. Update evaluation sets and compatibility profiles. Self-improvement remains governed: no uncontrolled model/prompt/rule promotion to production.

## Spinoffs

Potential modules/spinoffs: payer-policy intelligence, prior-auth infrastructure, denial intelligence, payment variance, healthcare portal automation, healthcare admin interoperability. Do not split merely to increase company count; classify against the new-company test.

## Cross-sell

Potential overlap with credentialing, document workflow, compliance, data quality, payment reconciliation, privacy/DSAR, security and workflow automation companies. Cross-sell may exist later but companies remain distinct.

## Bundling

Eligibility + authorization; claims + denial; payment + underpayment; full RCM admin suite; enterprise integration/security bundle; specialty editions. Bundling does not merge project identities.

## Failures

Wrong patient/member match; stale payer rule; missing authorization requirement; duplicate submission; incomplete evidence; wrong portal state; claim edit false positive/negative; denied appeal due deadline; payment mispost; integration timeout; credential expiry; rate limit; payer outage; model hallucination; document OCR error; cross-tenant leak; unauthorized action; rollback/reconciliation failure.

## Edge cases

Multiple coverages; retroactive eligibility; plan changes; coordination of benefits; emergency/exception workflows; secondary/tertiary claims; corrected/void claims; partial authorization; peer-to-peer requirement; payer portal unavailable; paper/fax-only workflows; conflicting policy sources; ambiguous EOB; capitation/value-based arrangements; provider enrollment gaps; mergers/TIN changes; unusual specialty rules; split billing; patient identity duplicates.

## Kill / safe mode

Per-tenant, per-integration, per-agent and per-workflow kill switches; read-only mode; stop external submissions while preserving status retrieval; force human review; disable model generation while deterministic services continue; revoke credentials; quarantine documents; rollback rule/model version; pause affected payer.

## Exit / portability

Export normalized administrative records, audit/evidence, configuration, policy/rule history, workflow state and customer-owned documents in documented formats; revoke integrations; delete/retain under contract/law; ensure customer can continue operations outside platform.

## Scale vision

Prototype → one administrative workflow → specialty-practice OS → multi-site provider groups → RCM infrastructure → enterprise health-system administrative platform → embedded infrastructure used by other healthcare software. Revenue-scale scenarios may be modeled but never promised.

## Autonomous mature state

Most repetitive administrative data movement, rule lookup, status monitoring, queue prioritization, reconciliation and document assembly run automatically. Brain/agents continually verify evidence and confidence. Humans focus on exceptions, professional judgment, high-impact disputes, policy/legal decisions and protected commitments. Every external action remains traceable, reversible where possible and bounded by authorization.

## Command Center dependencies

First-class Project Registry/button/detail/progress; Brain Factory; Agent Factory; Capability Registry; Proven Capability Profiles; Integration Registry; Identity/Tenant; Data Governance; Security/Privacy/Authorization Governors; Resource/Financial Governors; Testing/Evaluation Factory; Deployment/Recovery; Observability/Incident; Document intelligence; browser/portal workers; secrets/credential management; audit/provenance; versioning; approval/Needs Me.

## Retrofit risk

If Command Center lacks dynamic project identity, regulated-data isolation, per-company Brain/Agent scopes, versioned capability contracts, provenance, human-review gates, integration health, external-action idempotency and durable audit before this company exists, retrofitting healthcare-grade boundaries later would be expensive and unsafe.

## Phased roadmap

Phase 0 architecture/evaluation only → Phase 1 synthetic/de-identified eligibility/benefit normalization → Phase 2 controlled authorization/document workflows → Phase 3 claim quality/status → Phase 4 denial/appeal support → Phase 5 payment reconciliation/variance → Phase 6 multi-module RCM admin OS → Phase 7 enterprise/embedded/private deployment → Phase 8 continuous governed optimization/internalization.

Each phase requires explicit authorization before real customer/protected-data/production use.

## Reuse candidates

Project/tenant identity; audit/provenance; document extraction; workflow engine; human-review/approval; browser automation; integration adapters; queues; notifications; policy/version graphs; rule engine; redaction/tokenization; observability; incident/recovery; evaluation harness; billing/entitlement when later proven.

## Proven capability dependencies

No shared capability is automatically trusted merely because another company uses it. Critical shared infrastructure must reach the required proof maturity, pass healthcare-specific compatibility/security/privacy evaluations and preserve rollback/fork options before adoption.

## Company-specific capabilities

Healthcare administrative ontology; payer/plan/policy graph; FHIR/HL7/X12 healthcare adapters; authorization/claim/denial/payment domain logic; specialty packs; regulated-data controls; healthcare-specific evaluation suites; payer-portal behaviors.

## External dependencies to internalize

Repeated dependency candidates: document/OCR, browser automation, policy monitoring, workflow/rule engine, data validation, redaction/tokenization, integration reliability and model routing. Clearinghouses, payer networks and licensed coding/content sources may remain external where economics/legal access make internalization impractical.

## Blast-radius requirements

Critical: wrong-patient/cross-tenant access, mass incorrect submission, credential compromise, stale rule applied broadly, payment posting corruption, PHI leak. High-blast shared services require isolation, canaries, per-tenant limits, reconciliation, rollback and multi-company proof before standardization.

## Version / compatibility requirements

Version every API/schema, payer rule, specialty pack, Brain, agent policy, deterministic rule set, integration adapter and workflow. Track effective dates and customer configuration. Candidate releases require contract/regression/security/privacy/performance evaluation, staged rollout, migration plan and rollback.

# Exhaustive 28-pass findings

1. **Core Business:** coherent healthcare-administration OS; excludes clinical practice automation.
2. **Product Expansion:** point modules expand into full administrative/RMC infrastructure and embedded APIs.
3. **Customer Expansion:** provider, RCM, payer and software-vendor customers without collapsing different responsibility models.
4. **Industry / Vertical Expansion:** specialty packs required; no assumption one workflow fits all medicine.
5. **Specialized Brain:** full healthcare-administration domain Brain justified.
6. **Agent Decomposition:** specialized least-privilege agents mapped for each lifecycle segment.
7. **Deterministic Services:** transaction parsing, rule validation, reconciliation and identity matching must remain deterministic where possible.
8. **Data Products:** de-identified benchmark/rule intelligence possible only under authorization and privacy constraints.
9. **API / Developer Products:** modular APIs/SDKs are first-class product family.
10. **White Label / OEM / Embedded:** strong fit for EHR/PMS/RCM/clearinghouse embedding.
11. **Enterprise:** multi-entity, SSO, private connectivity, audit, residency and governance required.
12. **Marketplace / Platform:** connector/workflow-pack marketplace possible later with strict certification.
13. **Monetization:** subscription, usage, enterprise, API, OEM, managed modules; no revenue promise.
14. **Distribution:** partnerships/ecosystems/procurement; outreach remains unauthorized.
15. **Automation:** repetitive administrative steps highly automatable with evidence and idempotency.
16. **Human-Intervention Elimination:** remove re-keying/status chasing, not professional/legal judgment.
17. **Moats:** policy graph, specialty packs, verified outcomes, integration reliability, evaluation corpus.
18. **Security:** regulated/high-sensitivity controls are core architecture, not add-ons.
19. **Privacy:** PHI/PII minimization and tenant isolation mandatory.
20. **Compliance:** healthcare/admin/transaction/privacy obligations require versioned compliance packs and actual validation before claims.
21. **Failure / Edge Cases:** patient identity, payer state, duplicates, stale rules and partial external effects dominate failure design.
22. **Internationalization:** separate country healthcare/payer packs required.
23. **Scale:** shard by tenant/payer/workflow; preserve per-company and per-customer isolation.
24. **Future Technology:** improved interoperability, confidential computing, local/private models and better structured payer APIs may reduce friction.
25. **Cross-Company Synergy:** substantial reusable infrastructure, but no shared private healthcare data.
26. **Spinoffs:** several modules could later qualify; no automatic split.
27. **Adversarial Missing-Idea Pass:** added coordination-of-benefits, patient financial admin, specialty packs, portal safe mode, rule effective dates, regulated evaluation, portability and provider/payer responsibility separation.
28. **Saturation Pass:** remaining material branches are captured as specialty/payer/country packs, integrations, shared-capability candidates or explicit adjacent-company overlaps; no new top-level branch currently justifies changing Company 101 identity.

# A–BZ conformance map

A Business Identity — healthcare administrative automation OS with non-clinical boundary.  
B Complete Product Tree — eligibility through payment/RCM/enterprise/API/OEM mapped.  
C Complete Feature Tree — identity, rules, documents, claims, denials, payments, audit/confidence mapped.  
D Complete Customer Tree — providers, RCM, payers, software/clearinghouse ecosystem mapped.  
E Complete Vertical Tree — specialty/provider-setting packs mapped.  
F Complete Brain Capability Tree — knowledge/reasoning/planning/optimization/verification/escalation mapped.  
G Brain Architecture — Brain Factory + healthcare domain/payer/specialty packs + deterministic guardrails.  
H Complete Agent Tree — lifecycle agents + QA/security/compliance/reconciliation mapped.  
I Deterministic Services — transaction parsers, rule engines, reconciliation, identity, audit mapped.  
J Input Tree — patient/provider/payer/service/docs/claims/remittance/policies/contracts mapped.  
K Output Tree — eligibility/auth/claim/denial/payment/work queues/evidence mapped.  
L Workflow Tree — coverage→authorization→claim→denial→payment→reconciliation mapped.  
M Integration Tree — EHR/PMS/payers/clearinghouses/FHIR/HL7/X12/docs/payments mapped.  
N API / Developer Ecosystem — modular APIs, SDK, sandbox, webhooks, versioning mapped.  
O Data Architecture — tenant isolation, event/rule graphs, audit/evidence, retention mapped.  
P Data Moat — authorized/de-identified operational intelligence only.  
Q IP — ontology, rule graph, packs, evaluation corpus, portal reliability mapped.  
R Monetization — subscription/usage/enterprise/API/OEM/managed mapped.  
S Packaging — modular suites/full OS/enterprise/private/OEM mapped.  
T Distribution — ecosystem/partner/procurement routes mapped.  
U Acquisition Automation — future fit/demo preparation only within authorization.  
V Customer Lifecycle — review→sandbox→pilot→rollout→QA→renewal/export mapped.  
W Support — healthcare-aware support/incident/evidence/change management mapped.  
X Customer Success — admin efficiency/quality metrics without false clinical claims.  
Y Automation Maximum — repetitive deterministic/low-risk admin automated.  
Z Human-Intervention Minimum — humans retained for exceptions/professional/protected decisions.  
AA Operations — provisioning, integrations, policies, queues, incidents, backup mapped.  
AB Administration — billing/vendor/config/retention/audit/offboarding mapped.  
AC Security — regulated-data controls, least privilege, isolation, DLP, secure tools mapped.  
AD Privacy — PHI/PII minimization, purpose, retention, residency, access accounting mapped.  
AE Compliance — healthcare transaction/privacy/contract frameworks and validation boundary mapped.  
AF Legal — BAAs, licenses, portal terms, liability, data use, practice boundaries mapped.  
AG Abuse / Misuse — fraud/upcoding/identity/portal/duplicate/unauthorized access controls mapped.  
AH Reliability — idempotency, queues, retries, reconciliation, safe mode, DR mapped.  
AI Observability — workflow/quality/cost/security/integration metrics and tracing mapped.  
AJ Incident Response — regulated severity/containment/reconcile/notify/postmortem mapped.  
AK Testing — unit through DR/adversarial/load/reconciliation mapped.  
AL Brain Evaluations — domain accuracy, source fidelity, safety, leakage and tool-use mapped.  
AM Deployment — isolated envs, canary, signed releases, migrations, rollback mapped.  
AN Scale — practice→enterprise/embedded progression mapped.  
AO Performance — interactive vs batch budgets and deterministic fast paths mapped.  
AP Cost — model/docs/browser/transaction/storage/support/compliance drivers mapped.  
AQ Financial Metrics — margin/workflow cost/automation/RCM quality metrics mapped.  
AR Moat — policy graph, specialty packs, outcomes, integration reliability mapped.  
AS Network Effects — non-private coverage/adapter/benchmark effects only.  
AT Platform — administrative operating layer mapped.  
AU White Label / OEM — EHR/PMS/RCM/clearinghouse embedding mapped.  
AV Internationalization — country-specific systems/standards/policies mapped.  
AW Accessibility — WCAG/keyboard/screen-reader/error accessibility mapped.  
AX Mobile — approvals/status/document capture with strong device controls mapped.  
AY Voice — consented payer-call/status workflows with evidence mapped.  
AZ Multimodal — documents/cards/forms/EOB/screenshots/transcripts with provenance mapped.  
BA Marketplace — certified connector/workflow packs potential mapped.  
BB Developer Ecosystem — APIs/SDK/sandbox/certification/deprecation mapped.  
BC Partners — healthcare technology/RCM/interoperability partners mapped, no outreach authorized.  
BD Training / Certification — role/admin/integration/security/workflow training mapped.  
BE Community — moderated non-sensitive customer/operator knowledge community mapped.  
BF Content / Knowledge — versioned payer/admin knowledge and runbooks mapped.  
BG Experimentation — offline/shadow/safe controlled experimentation mapped.  
BH Continuous Improvement — governed learning from incidents/overrides/outcomes mapped.  
BI Spinoffs — candidate modules identified; approval/new-company test required.  
BJ Cross-Sell — adjacent portfolio companies identified without merger.  
BK Bundling — authorization/claims/payment/full OS bundles mapped.  
BL Failures — identity/submission/policy/payment/integration/model/privacy failures mapped.  
BM Edge Cases — multi-coverage/retroactive/corrections/partial auth/portal/conflicting rules mapped.  
BN Kill / Safe Mode — tenant/integration/agent/workflow stop and read-only modes mapped.  
BO Exit / Portability — export/revoke/delete/retain/continue-operating requirements mapped.  
BP Scale Vision — point workflow→enterprise/embedded infrastructure mapped.  
BQ Autonomous Mature State — repetitive admin autonomous; protected judgments human-governed.  
BR Command Center Dependencies — registry/factories/governors/testing/deployment/audit/integration mapped.  
BS Retrofit Risk — regulated isolation/provenance/approval/idempotency must be designed early.  
BT Phased Roadmap — architecture through multi-module/enterprise progression mapped.  
BU Reuse Candidates — identity/audit/docs/workflow/browser/queues/rules/evals/etc mapped.  
BV Proven Capability Dependencies — proof maturity + healthcare-specific compatibility required.  
BW Company-Specific Capabilities — healthcare ontology/payer graph/standards/specialty packs mapped.  
BX External Dependencies to Internalize — repeated generic dependencies identified; payer/licensed networks may remain external.  
BY Blast-Radius Requirements — patient identity, PHI, submissions, payments and credentials classified critical/high.  
BZ Version / Compatibility Requirements — every rule/schema/Brain/agent/integration/workflow versioned with effective dates/rollback.

## Final saturation statement

Company 101 is now mapped as a first-class independent Command Center project under the canonical 107+ standard. The roadmap does not claim the business exists, operates or is production-ready. It is considered exhaustively mapped at the planning level only insofar as the 28 passes and A–BZ dimensions above currently yield no unrepresented material branch; later cross-company reverse mapping, new external requirements or James Morgan decisions may reopen conformance without erasing this version.