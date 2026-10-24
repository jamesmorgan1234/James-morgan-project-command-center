# Company 026 — License & Certification Tracker

**Company ID:** `company:future:026`  
**Primary project:** `project:company:future:026`  
**Roadmap version:** `COMPANY-026-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no filing, renewal payment or regulatory representation.

## Business identity

Purpose: track licenses, certifications, continuing-education requirements and renewal readiness across people, companies, equipment, locations and jurisdictions.

Problem: expirations and renewal requirements are fragmented across regulators, employers, files and spreadsheets.

Value: verified credential inventory, deadline tracking, requirement checklists, evidence and employer/professional readiness views.

## Product tree

Professional License Tracker; Company/Business License Tracker; Facility/Location License; Equipment/Vehicle Certification; Employee Credential Matrix; CE/Training Requirement Tracker; Renewal Calendar; Requirement Checklist; Document/Evidence Vault; Verification/Status Checks; Jurisdiction Rule Packs; Employer Compliance Dashboard; Individual Professional Portal; Readiness Score; Expiration/Gap Alerts; Renewal Workflow Preparation; API/OEM; Vertical Packs.

## Feature/customer/vertical tree

Fields: credential ID/type, holder/entity, jurisdiction, issuer, issue/expiry, renewal window, CE hours/categories, prerequisites, documents, status/source/freshness, verification URL/result, supervisor/employer, reminders, exceptions, audit. Customers: employers, professionals, contractors, healthcare/admin organizations, trades, education, transportation, property/service businesses, staffing, government vendors. Verticals: healthcare credentials, trades/construction, insurance/financial licenses, education, transportation, food/hospitality, real estate/property, security professions, equipment/operators; legal specialist review for regulated details.

## Brain / architecture

Brain interprets requirement text, maps holder/jurisdiction to checklists, identifies missing evidence and explains readiness; it cannot assert licensure or submit renewals without verified source/policy. Deterministic deadline/recurrence/CE calculations, document registry, source verification, rules/pack versions; LLM/RAG for requirement extraction with citations.

## Agents

Credential Intake Agent, Jurisdiction Requirement Agent, Expiration Monitor, CE/Training Agent, Verification Agent, Document Evidence Agent, Readiness Analyst, Employer Matrix Agent, Renewal Prep Agent, Exception/Compliance Agent, Source Change Monitor.

## Deterministic services

Credential registry; holder/entity graph; rules/requirement packs; date/recurrence; CE ledger; document hash/store; source verification connector; alert/scheduler; workflow/checklist; audit/export; protected renewal/f payment gate.

## Workflow

Register credential → identify source/jurisdiction → import/verify status → apply requirement pack → track CE/evidence → forecast renewal readiness → alert gaps/windows → prepare renewal packet → owner/professional executes protected filing/payment → verify renewed status → archive history.

## Integrations / API / data

Regulator/public verification sources, HRIS/LMS, document storage, calendar/tasks, employer systems, training providers, credentialing platforms. APIs for credential/status/requirements/readiness/expiration/evidence.

Data moat: normalized credential/jurisdiction ontology, requirement version history, verification adapters and reviewed checklist mappings.

## Monetization / distribution

Per credential/person/location/company, employer seats, vertical packs, API, enterprise/private, professional subscription, OEM. Distribution via HR/compliance/training/industry associations/employer platforms.

## Security/legal/failure

Protect personal IDs/documents; source provenance; no false credential claims; jurisdiction changes; inactive/suspended status; name changes; grace periods; CE exceptions; ambiguous renewal windows; source outage. Use explicit status/freshness/unknown and human/regulator verification.

## Scale / overlap

Individual → employer portfolio → multi-jurisdiction credential platform. Overlap #62 credentialing autopilot; #026 tracks lifecycle/readiness, #62 handles application/onboarding workflows.

## Classification

**DESIGN NOW:** entity/credential IDs, temporal requirements, source/provenance, document privacy, protected filing/payment actions.  
**BUILD NOW:** generic temporal/evidence pack interfaces after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** rules-pack/source adapter framework, company isolation, scheduler.  
**COMPANY-SPECIFIC LATER:** jurisdiction data/product/integrations.  
**SCALE-ONLY:** global regulatory adapter network.

# Mandatory 24-part completion block

1. Product Tree: professional/company/location/equipment/employee/CE/renewal/checklist/docs/verification/rules/employer/professional/readiness/alerts/prep/API/packs.
2. Feature Tree: IDs/holders/jurisdiction/issuer/dates/windows/CE/prereqs/docs/status/freshness/verification/reminders/audit.
3. Customer Tree: employers/professionals/contractors/health admin/trades/education/transport/property/staffing/government vendors.
4. Vertical Tree: healthcare, trades, insurance/finance, education, transport, hospitality, real estate, security, equipment.
5. Brain Tree: requirement interpretation/readiness reasoning with cited source; no false licensure.
6. Agent Tree: intake/jurisdiction/expiration/CE/verification/evidence/readiness/employer/renewal prep/exception/source monitor.
7. Service Tree: registry/entity/rules/date/CE/docs/verify/alerts/workflow/audit/export.
8. Workflow Tree: register→verify→requirements→evidence→readiness→alert→prepare→human file/pay→verify renewal.
9. Integration Tree: regulator sources/HRIS/LMS/docs/calendar/training/employer/credential platforms.
10. Data Tree: credentials/holders/rules/requirements/CE/evidence/status/history.
11. API Tree: credential/status/requirements/readiness/expiration/evidence.
12. Monetization Tree: credential/person/location/company/seats/packs/API/enterprise/professional/OEM.
13. Distribution Tree: HR/compliance/training/associations/employer platforms.
14. Automation Tree: monitoring/checklists/evidence/reminders/readiness; filing/payment gated.
15. Moat Tree: requirement ontology/version history/verification adapters.
16. Platform Tree: tracker→employer compliance→multi-jurisdiction credential infrastructure.
17. Risk Tree: privacy, stale source, jurisdiction ambiguity, false status, missed deadlines.
18. Scale Tree: individual→employer→enterprise/global.
19. Spinoff Tree: #62 covers application credentialing; no new duplicate.
20. Command Center Dependencies: temporal/scheduler, docs/provenance, source packs, policy/payment gate, isolation.
21. Design-Now: versioned requirements/source/status contracts.
22. Build-Now: shared pack/scheduler/evidence seams after reverse-map.
23. Safe-to-Defer: actual regulatory sources/portals/pricing.
24. Autonomous Mature State: status/evidence/CE/readiness monitoring is automatic; professionals handle protected filings/payments and exceptional interpretations.

## Saturation result

Further branches are vertical requirement packs or Company 062 credentialing workflow features.
