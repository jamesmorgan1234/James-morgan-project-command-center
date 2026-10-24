# Company 038 — Grant Management Software

**Company ID:** `company:future:038`  
**Primary project:** `project:company:future:038`  
**Roadmap version:** `COMPANY-038-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no live grant hunting, application submission, certification, signature or spending.

## Business identity

Purpose: manage known/authorized grant programs from requirements and application preparation through milestones, budgets, evidence, reporting and closeout.

Problem: grant work involves complex eligibility, documents, deadlines, budget restrictions, deliverables and recurring reports; teams lose evidence or miss obligations.

Value: one structured grant lifecycle with cited requirements, task ownership, budget tracking and audit-ready evidence.

## Product tree

Grant/Program Registry; Requirement/Eligibility Matrix; Application Workspace; Deadline/Milestone Calendar; Document/Evidence Vault; Narrative Drafting Assistant; Budget Builder/Tracker; Collaboration/Assignments; Submission Readiness; Award/Contract Intake; Deliverable/Milestone Tracking; Expense/Budget Compliance; Evidence Collection; Progress/Outcome Reporting; Amendment/Change Request Tracker; Renewal/Continuation Planner; Closeout Checklist; Portfolio Dashboard; Funder/Program Portal (where appropriate); API/OEM; Vertical Packs.

## Feature/customer/vertical tree

Features: program/version/source, applicant entity, eligibility criteria, required forms/docs, deadline/timezone, questions/limits, budget categories, match requirements, restricted/unrestricted funds, deliverables, milestones, reporting cadence, evidence, approvals, amendment history, payment/reimbursement status refs, audit/export.

Customers: nonprofits, education, research/admin teams, local/public entities, community organizations, businesses managing awarded grants, foundations/funders for internal administration, consultants.

Verticals: nonprofit/community, education, research, workforce development, infrastructure, environmental, arts/culture, small-business programs, public health administration. Each program has legal/financial requirements requiring source and specialist review.

## Brain / architecture

Brain interprets program documents, maps requirements, drafts source-backed narratives and tracks gaps. It cannot hunt live grants under current rule, certify eligibility, sign or submit. Deterministic budgets/deadlines/compliance checks own arithmetic/readiness.

Architecture: program/document registry, requirement ontology, project workspace, scheduler, budget ledger, evidence/artifact store, search/RAG with citations, workflow/approval, reporting templates, LLM drafting with source-bound facts.

## Agent tree

Program Intake Agent, Requirement/Eligibility Agent, Application Planner, Narrative Draft Agent, Budget Agent, Document/Evidence Agent, Deadline Agent, Compliance Agent, Milestone Agent, Reporting Agent, Amendment Agent, Closeout Agent, QA/Fact Checker, Collaboration Coordinator.

## Deterministic services

Program/version registry; date scheduler; requirement matrix; document hash/store; budget calculator/ledger; approval workflow; task dependencies; evidence linking; report template engine; audit/export; protected signature/submit/spend gates.

## Workflow

Import authorized grant program → verify source/version → requirements/eligibility matrix → go/no-go owner decision → application plan/assignments → draft/evidence/budget → readiness QA → protected signature/submission → if awarded, create obligation/budget/milestone plan → evidence/expense tracking → report → amendment/renewal → closeout/archive.

## Integrations / API / data

Document storage, accounting, task/project tools, calendars, e-sign, grant portals where authorized, CRM/donor systems, data collection/reporting tools. APIs for programs/requirements/milestones/budgets/evidence/readiness/reports.

Data moat: program requirement ontology, reviewed application/report mappings, budget/closeout workflows and vertical templates. No cross-applicant confidential data sharing.

## Monetization / distribution

Organizations/programs/users, applications/awards, vertical packs, enterprise/private, API/OEM, managed administration/migration. Distribution via nonprofit/education/research ecosystems, consultants/accounting partners and grants-management associations. No opportunity hunting now.

## Security/legal/privacy

Applications can include tax/financial/personnel/beneficiary data. Strict isolation, citation, no fabricated outcomes, protected attestations/submissions, audit, retention, financial controls, role separation.

## Failure / edge cases

Program amendment, deadline extension, portal outage, eligibility ambiguity, restricted-cost misclassification, duplicate evidence, reimbursement vs advance confusion, indirect-cost rules, match source change, reporting metric drift, closeout deadline. Preserve program version and explicit uncertainty.

## Scale/overlap

Single organization → multi-program portfolio → enterprise/funder grant operations. Overlap #31 forms, #36 RFPs, #23 obligations, #97 tax only tangential. #038 owns grant lifecycle after a known program is in scope.

## Classification

**DESIGN NOW:** project/workspace, document provenance, temporal obligations, budget/financial controls, protected submission/signature.  
**BUILD NOW:** shared workspace/artifact/scheduler/finance-policy seams after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company financial isolation, reporting/evidence and portal connector interfaces.  
**COMPANY-SPECIFIC LATER:** grant program data/product/templates/pricing.  
**SCALE-ONLY:** large funder/applicant network and program marketplace.

# Mandatory 24-part completion block

1. Product Tree: registry/eligibility/application/deadline/docs/narrative/budget/collab/readiness/award/milestone/expense/evidence/report/amendment/renewal/closeout/portfolio/portal/API/packs.
2. Feature Tree: source/version/entity/criteria/forms/deadlines/limits/budget/match/fund restrictions/deliverables/reports/evidence/approvals/amendments/audit.
3. Customer Tree: nonprofit/education/research/public/community/business awardees/funders/consultants.
4. Vertical Tree: community, education, research, workforce, infrastructure, environment, arts, small business, public health admin.
5. Brain Tree: requirement/draft/gap reasoning with cited program facts; hunting/signing/submitting prohibited.
6. Agent Tree: intake/eligibility/planner/narrative/budget/evidence/deadline/compliance/milestone/report/amendment/closeout/QA/collab.
7. Service Tree: program/date/matrix/docs/budget/approval/tasks/evidence/report/audit/gates.
8. Workflow Tree: import→matrix→owner decision→prepare→QA→submit→award→track→report→closeout.
9. Integration Tree: docs/accounting/tasks/calendar/e-sign/authorized portals/CRM/data reporting.
10. Data Tree: programs/requirements/applications/budgets/evidence/milestones/expenses/reports/amendments.
11. API Tree: programs/requirements/milestones/budgets/evidence/readiness/reports.
12. Monetization Tree: org/program/user/application/award/packs/enterprise/private/API/managed.
13. Distribution Tree: nonprofit/education/research/consultant/accounting/association ecosystems.
14. Automation Tree: requirement matrix/scheduling/drafts/budget checks/evidence/report prep; submission/spend gated.
15. Moat Tree: requirement ontology, reviewed templates, lifecycle/budget/report corpus.
16. Platform Tree: application workspace→award operations→grant portfolio management.
17. Risk Tree: eligibility/legal/financial errors, fabricated claims, missed amendments/deadlines, sensitive data.
18. Scale Tree: one program→portfolio→enterprise/funder operations.
19. Spinoff Tree: adjacent #31/#36/#23 cover forms/tenders/contracts.
20. Command Center Dependencies: projects/workspaces, artifacts, scheduler, finance/policy, evidence, company isolation.
21. Design-Now Requirements: versioned program requirements, budget/evidence and protected submission contracts.
22. Build-Now Requirements: shared project/artifact/scheduler/finance seams after reverse-map.
23. Safe-to-Defer Requirements: external grant product/program templates/customer portals/pricing.
24. Autonomous Mature State: known grant requirements/tasks/evidence/reporting run continuously; humans own opportunity choice, attestations, submissions and material financial changes.

## Saturation result

Further branches are RFP/form/obligation modules or vertical grant packs already covered.
