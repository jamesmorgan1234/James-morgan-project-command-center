# Company 023 — Contract Obligation Tracker

**Company ID:** `company:future:023`  
**Primary project:** `project:company:future:023`  
**Roadmap version:** `COMPANY-023-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; not legal advice and no contract acceptance/termination.

## Business identity

Purpose: turn executed contracts and amendments into a reliable obligation/deadline/renewal system with source-linked evidence and owner-controlled workflows.

Problem: notice periods, renewals, price escalators, deliverables, insurance requirements, SLAs and obligations are buried in documents and forgotten.

Value: structured contract repository, obligations calendar, risk alerts, compliance evidence and negotiation intelligence.

Delivery: SaaS, document ingestion/API, calendar/workflow integration, private deployment, enterprise repository, embedded/OEM contract-obligation module.

## Product tree

Contract Repository; Metadata/Party Extraction; Obligation/Deliverable Tracker; Renewal/Notice Calendar; Pricing/Escalator Tracker; SLA/Service-Credit Tracker; Insurance/Certificate Requirement Tracker; Compliance/Reporting Obligation; Clause Library; Amendment/Supersession Graph; Risk/Exception Register; Contract-to-Invoice/Usage Reconciliation; Negotiation/Benchmark Intelligence; Approval/Review Workflow; Contract Health Dashboard; Search/Q&A with citations; API/SDK/OEM; Vertical Packs.

## Feature/customer/vertical tree

Features: parties/entity IDs, effective/expiry/notice dates, renewal type, clauses, obligation owner, frequency, conditions, evidence required, deliverables, pricing schedules, thresholds, SLA measurements, amendment hierarchy, citations/page locations, confidence, legal-review status, reminders, escalation, audit, access controls, retention/hold.

Customers: SMB/enterprise legal ops, procurement, finance, vendor management, sales ops, property/service businesses, SaaS, agencies, manufacturers, nonprofits, public contractors.

Verticals: SaaS/vendor contracts, customer/MSA/SOW, leases/property, construction/subcontract, procurement, logistics, professional services, licensing, insurance/vendor compliance. Highly specialized legal domains need counsel review.

## Brain / architecture

Brain extracts and explains clauses/obligations, maps amendments, detects conflicts and suggests tasks/negotiation questions with citations. It cannot interpret law conclusively or accept/terminate/modify contracts.

Architecture: document parser/OCR, clause/obligation ontology, relational contract graph, temporal calendar, search/RAG with exact citations, deterministic deadline/recurrence/price calculations, workflow/evidence store.

## Agents

Contract Intake Agent, Clause/Obligation Extractor, Date/Renewal Agent, Amendment Resolver, Pricing/SLA Analyst, Obligation Monitor, Evidence Collector, Risk Agent, Invoice/Usage Reconciliation Agent, Negotiation Prep Agent, Search/Q&A Agent, Legal-Review Coordinator.

## Deterministic services

Document ingestion; hash/version; OCR/parser; entity resolver; date/recurrence; amendment graph; obligation scheduler; reminders; SLA calculators; pricing schedule engine; workflow/approval; search/index; audit/export/retention.

## Workflow

Ingest executed doc → verify version/parties → extract metadata/clauses/obligations with citations → human/legal review thresholds → activate calendar/tasks → collect evidence → alert notice/renewal/SLA/price → reconcile amendments → prepare action → protected legal/financial decision outside tracker → archive supersession.

## Integrations / API / data

DMS/e-sign, email/storage, procurement/vendor systems, accounting/AP/AR, CRM/CPQ, calendar/tasks, insurance/COI, usage/SLA monitoring, BI. APIs for contracts/clauses/obligations/deadlines/renewals/evidence/search.

Data moat: clause/obligation ontology, reviewed extraction corpus, amendment-resolution patterns, contract lifecycle evidence and benchmark metadata where lawfully aggregated.

## Monetization / distribution

Contracts/users/entities, extraction/document pages, vertical packs, enterprise/private, API/OEM, premium analytics/benchmarking, managed migration. Distribution via legal/procurement/finance ecosystems, e-sign/DMS marketplaces, consultants/integrators.

## Security/privacy/legal

Contracts are confidential. Strong access/isolation, encrypted storage, no model training on documents by default, legal holds, retention/export/delete, citation requirements, privileged-material controls, protected acceptance/termination/financial actions.

## Failure / edge cases

Bad scan, unsigned draft mistaken executed, amendment supersession ambiguity, timezone/notice rules, evergreen renewal, conflicting dates, partial termination, oral side agreement absent, legal entity rename, clause cross-references. Surface uncertainty and require human/legal review for material ambiguities.

## Scale/platform/overlap

Small repository → enterprise obligation operations → contract intelligence platform. Overlap #17 SaaS spend, #32 procurement, #52 COI, #85 leakage. #023 remains obligation lifecycle across contract types.

## Classification

**DESIGN NOW:** document provenance, temporal/recurrence, legal/protected-action classification, evidence citations, version/supersession.  
**BUILD NOW:** shared artifact/decision/scheduler patterns after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** confidential document isolation/retention, obligation scheduler, legal-review status.  
**COMPANY-SPECIFIC LATER:** contract product/extractors/integrations/pricing.  
**SCALE-ONLY:** large clause benchmark/enterprise repository network.

# Mandatory 24-part completion block

1. Product Tree: repository, extraction, obligations, renewals, pricing, SLA, insurance, compliance, clauses, amendments, risk, reconciliation, negotiation, workflows, health, cited search, API/packs.
2. Feature Tree: parties/dates/renewal/clauses/owners/conditions/evidence/pricing/SLA/amendments/citations/confidence/review/reminders/audit.
3. Customer Tree: legal/procurement/finance/vendor/sales/SMB-enterprise/service/SaaS/manufacturing/nonprofit/public contractors.
4. Vertical Tree: vendor/customer/lease/construction/procurement/logistics/services/licensing/insurance.
5. Brain Tree: cited extraction/conflict/obligation reasoning; legal decisions prohibited.
6. Agent Tree: intake/extract/date/amendment/pricing-SLA/monitor/evidence/risk/reconcile/negotiation/search/review.
7. Service Tree: ingest/hash/OCR/entity/date/graph/scheduler/SLA/pricing/workflow/search/audit/retention.
8. Workflow Tree: ingest→extract→review→activate→monitor→evidence→alert→protected decision→archive.
9. Integration Tree: DMS/e-sign/email/storage/procurement/accounting/CRM/calendar/COI/monitoring/BI.
10. Data Tree: contracts/versions/parties/clauses/obligations/deadlines/evidence/amendments/risks.
11. API Tree: contract/clause/obligation/deadline/renewal/evidence/search.
12. Monetization Tree: contracts/users/entities/pages/packs/enterprise/API/OEM/analytics/migration.
13. Distribution Tree: legal/procurement/e-sign/DMS/finance/integrator ecosystems.
14. Automation Tree: extraction/calendar/reminders/evidence; legal/financial actions gated.
15. Moat Tree: ontology, reviewed corpus, amendment graph, lifecycle evidence.
16. Platform Tree: tracker→obligation operations→contract intelligence.
17. Risk Tree: confidentiality, wrong version/date, legal ambiguity, overreliance on extraction.
18. Scale Tree: SMB→enterprise→large contract intelligence network.
19. Spinoff Tree: adjacent #17/#32/#52/#85 preferred.
20. Command Center Dependencies: documents/provenance, schedulers, policy/legal gate, isolation, search/RAG.
21. Design-Now: versioned cited document/obligation and protected legal action interfaces.
22. Build-Now: shared artifact/scheduler/provenance hooks after reverse-map.
23. Safe-to-Defer: customer contract platform/extractors/benchmarks/pricing.
24. Autonomous Mature State: intake/obligation monitoring/evidence/reminders run continuously; humans/counsel handle legal decisions.

## Saturation result

Additional contract niches are vertical packs or neighboring procurement/COI/revenue-leakage products, not a new company.
