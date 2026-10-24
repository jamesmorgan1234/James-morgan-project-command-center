# Company 036 — RFP / Tender Intelligence SaaS

**Company ID:** `company:future:036`  
**Primary project:** `project:company:future:036`  
**Roadmap version:** `COMPANY-036-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no live opportunity hunting, bidding, submission or external communication.

## Business identity

Purpose: help organizations analyze RFP/tender packages they already possess or are authorized to process, extract requirements, build compliance matrices and coordinate high-quality response preparation.

Problem: large solicitations contain scattered mandatory requirements, forms, attachments, deadlines and evidence; teams miss items and reuse stale responses.

Value: structured requirements, assignment, evidence-backed drafting, consistency checks and submission-readiness proof.

## Product tree

Solicitation Intake; Document/Attachment Parser; Requirement Extraction; Compliance Matrix; Deadline/Milestone Calendar; Eligibility/Go-No-Go Analysis; Response Outline Builder; Assignment/Collaboration; Response Library; Evidence/Reference Library; Drafting Assistant; Pricing Input Coordinator (not price setter); Form/Attachment Checklist; Consistency/Claim Verification; Page/Word/Format Validation; Security/Legal/Compliance Review Queues; Submission Readiness Gate; Post-Submission Archive; Debrief/Lessons Learned; API/OEM; Industry Packs.

## Feature/customer/vertical tree

Features: solicitation/version, issuing entity, deadlines/timezone, mandatory vs scored requirements, pass/fail criteria, evaluation factors, forms, certifications, clauses, references, evidence, owner/assignee, response status, source citation/page, dependencies, questions/clarifications, amendments, approved answer/version, word/page limits, final checklist, audit.

Customers: SMB/enterprise proposal teams, government contractors, B2B vendors, consultants, nonprofits/grant-adjacent procurement respondents, construction/engineering, IT/software/services, manufacturers, staffing, healthcare administrative suppliers.

Verticals: public procurement, enterprise sourcing responses, construction/engineering, technology, professional services, healthcare/admin vendors, education, defense-adjacent only within lawful nonclassified scope. Specialized legal/security packs required for sensitive sectors.

## Brain / architecture

Brain understands solicitation structure, requirements, evaluation criteria and response-library relevance; drafts cited responses and flags unsupported claims. Deterministic checklist/format/deadline/evidence rules own completeness. No live opportunity discovery under this directive; no submission without explicit authorization.

Architecture: document parser/OCR, requirement ontology, dependency graph, response/evidence search/RAG, deadline scheduler, workflow/assignment, LLM drafting with source citations, deterministic validation and version/amendment tracking.

## Agent tree

Solicitation Intake Agent, Requirement Extractor, Compliance Matrix Agent, Eligibility Analyst, Response Planner, Evidence Librarian, Drafting Agent, Consistency/Fact Checker, Amendment Monitor, Pricing Input Coordinator, Security/Compliance Reviewer, Format/Submission QA Agent, Debrief Agent.

## Deterministic services

Document/version store; parser/OCR; requirement registry; deadline/calendar; assignment workflow; response/evidence library; search; form/checklist validator; format/word/page checks; audit; protected submit/send gate.

## Workflow

Import authorized solicitation → verify package/version → parse/extract → classify requirements/deadlines → go/no-go recommendation → assign owners → retrieve approved evidence → draft/review → amendment diff → compliance/format/security QA → submission readiness evidence → owner-authorized submission outside system → archive/debrief/update approved library.

## Integrations / API / data

Document storage, task/project tools, CRM, proposal systems, e-sign, calendars, pricing/ERP inputs, security/compliance evidence, source control for technical responses. APIs for solicitations/requirements/matrix/assignments/evidence/readiness.

Data moat: requirement ontology, reviewed response/evidence mappings, amendment history, win/loss/debrief lessons and vertical packs. No confidential solicitation/customer data cross-sharing.

## Monetization / distribution

Solicitations/users/teams, response-library size, enterprise/private, vertical packs, API/OEM, managed proposal operations. Distribution via proposal/procurement ecosystems, consultants, government-contracting and B2B sales communities; no opportunity hunting now.

## Security/legal/privacy

Confidential bid data, pricing, customer references and security evidence require strict isolation. No fabricated credentials/capabilities, no classified data unless separately designed/authorized, no signature/submission/legal acceptance automation.

## Failure / edge cases

Amendment missed, duplicate conflicting requirement, ambiguous mandatory language, timezone deadline, stale evidence, hallucinated case study, pricing mismatch, form version wrong, attachment omitted, page limit overflow. Use exact source/version/citations, completeness matrix, hard validation and human review.

## Scale / overlap

Small proposal teams → enterprise proposal operations → response intelligence platform. Overlap #31 forms, #23 contracts, #12 compliance, #38 grants. #036 stays solicitation-response intelligence.

## Classification

**DESIGN NOW:** document/version/citation, deadline/dependency, evidence truth, protected submission/communication action.  
**BUILD NOW:** shared document/workspace/approval primitives after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** confidential workspace isolation, submission-gate and response-library interfaces.  
**COMPANY-SPECIFIC LATER:** customer proposal product/templates/packs/pricing.  
**SCALE-ONLY:** large enterprise response knowledge network.

# Mandatory 24-part completion block

1. Product Tree: intake/parser/requirements/matrix/deadlines/eligibility/outlines/assignment/library/evidence/drafting/pricing inputs/forms/consistency/reviews/readiness/archive/debrief/API/packs.
2. Feature Tree: versions/deadlines/mandatory/scored/evaluation/forms/certs/clauses/evidence/assignments/citations/dependencies/amendments/limits/audit.
3. Customer Tree: proposal teams/contractors/B2B/consultants/nonprofits/construction/IT/services/manufacturing/staffing/health admin suppliers.
4. Vertical Tree: public procurement, enterprise RFPs, construction/engineering, technology, services, health admin, education, sensitive sectors gated.
5. Brain Tree: requirement/evaluation/evidence/drafting reasoning with no opportunity hunting or unsupported claims.
6. Agent Tree: intake/extract/matrix/eligibility/planning/evidence/draft/fact-check/amendment/pricing/security/format/debrief.
7. Service Tree: docs/parser/requirements/calendar/assignments/library/search/checklists/format/audit/submit gate.
8. Workflow Tree: import→extract→classify→plan→assign→draft→amendment→QA→readiness→owner submit→debrief.
9. Integration Tree: docs/tasks/CRM/proposal/e-sign/calendar/ERP/security/Git.
10. Data Tree: packages/versions/requirements/deadlines/assignments/evidence/responses/reviews/readiness/debrief.
11. API Tree: solicitation/requirement/matrix/assignment/evidence/readiness.
12. Monetization Tree: solicitations/users/teams/library/enterprise/private/packs/API/OEM/managed.
13. Distribution Tree: proposal/procurement consultants and B2B ecosystems.
14. Automation Tree: parsing/matrix/assignment/draft/checks/readiness; external submission gated.
15. Moat Tree: requirement ontology, reviewed evidence mapping, response corpus, amendment/debrief history.
16. Platform Tree: compliance matrix→proposal workspace→response intelligence platform.
17. Risk Tree: confidentiality, stale/amended specs, fabricated claims, missed deadlines, legal/security sensitivity.
18. Scale Tree: small team→enterprise multi-proposal operations.
19. Spinoff Tree: adjacent #31/#23/#12/#38 already cover form/contract/compliance/grants.
20. Command Center Dependencies: docs/artifacts, project workspaces, Brain/RAG, scheduler, policy, evidence, isolation.
21. Design-Now Requirements: exact source/version/deadline/evidence and protected submission boundaries.
22. Build-Now Requirements: shared document/workspace/evidence seams after reverse-map.
23. Safe-to-Defer Requirements: proposal customer product/templates/vertical packs/pricing.
24. Autonomous Mature State: intake/matrix/draft/QA run automatically on authorized solicitations; humans own bid strategy/pricing/signature/submission.

## Saturation result

Remaining branches become form/compliance/contract/grant modules or vertical proposal packs already represented.
