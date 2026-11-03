# Specialized Brain — Building Permit & Inspection Intelligence (Company 116)

**Proposed identity:** `brain:company:future:116:v1` subordinate to Command Center. **Truth:** design pack, not evidence of an installed AI model/agent or provider. All runtime capabilities are unknown until inspected/tested.

## Purpose, capabilities and customer value

Help contractors, homeowners, architects and builders navigate jurisdiction-specific permit requirements and inspection preparation with verified official sources, completeness checks and deadlines, without impersonating licensed designers or municipal officials.

Reduce administrative resubmittals and avoid avoidable missed documents or inspection readiness gaps through source-backed municipal checklists.

**Owner-only protected boundary:** No stamping design, structural calculations, legal interpretations, acting as licensed architect/engineer, representing municipal approval, guarantee, booking municipal inspection, filing forms, paying fees, or signing owner/contractor certifications absent role verification and action-specific authorization. Building, planning and zoning requirements may vary block-to-block and require official confirmation.

## Brain cognition and abstention capabilities

1. **Jurisdiction and scope disambiguation reasoner.** Input: approved records and dated source evidence for `Jurisdiction`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Township/city boundary uncertainty must HOLD permit classification`. Never issue external writes.
2. **Permit type suitability classifier.** Input: approved records and dated source evidence for `JurisdictionBoundary`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Outdated municipal form cannot pass source freshness`. Never issue external writes.
3. **Official code and form provenance critic.** Input: approved records and dated source evidence for `SiteAddress`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `AI must not claim building code compliance`. Never issue external writes.
4. **Project type to requirement graph reasoner.** Input: approved records and dated source evidence for `ParcelRef`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Professional seal required cannot be AI generated`. Never issue external writes.
5. **Building/zoning overlap interpreter.** Input: approved records and dated source evidence for `ZoningOverlay`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Public portal status UNKNOWN never becomes APPROVED`. Never issue external writes.
6. **Document completeness critic.** Input: approved records and dated source evidence for `Project`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Correction letter supersedes prior packet version`. Never issue external writes.
7. **Plan correction classifier.** Input: approved records and dated source evidence for `ProjectScope`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Fee estimate cannot become payable invoice`. Never issue external writes.
8. **Professional-stamp detection and refusal.** Input: approved records and dated source evidence for `BuildingUse`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Unapproved filing or inspection booking impossible`. Never issue external writes.
9. **Special review trigger classifier.** Input: approved records and dated source evidence for `PermitType`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Township/city boundary uncertainty must HOLD permit classification`. Never issue external writes.
10. **Inspection predecessor and timing planner.** Input: approved records and dated source evidence for `PermitRequirement`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Outdated municipal form cannot pass source freshness`. Never issue external writes.
11. **Portal status evidence critic.** Input: approved records and dated source evidence for `AdoptedCodeEdition`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `AI must not claim building code compliance`. Never issue external writes.
12. **Municipal code change impact analyst.** Input: approved records and dated source evidence for `FormTemplate`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Professional seal required cannot be AI generated`. Never issue external writes.
13. **Missing field Q&A assistant.** Input: approved records and dated source evidence for `FormVersion`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Public portal status UNKNOWN never becomes APPROVED`. Never issue external writes.
14. **Fee/source discrepancy explainer.** Input: approved records and dated source evidence for `ContractorCredential`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Correction letter supersedes prior packet version`. Never issue external writes.
15. **Customer task-priority advisor.** Input: approved records and dated source evidence for `ProfessionalReviewRequirement`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Fee estimate cannot become payable invoice`. Never issue external writes.
16. **Citable checklist writer.** Input: approved records and dated source evidence for `PlanSheet`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Unapproved filing or inspection booking impossible`. Never issue external writes.
17. **Confidence and abstention classifier.** Input: approved records and dated source evidence for `PlanRevision`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Township/city boundary uncertainty must HOLD permit classification`. Never issue external writes.
18. **Source coverage gap discoverer.** Input: approved records and dated source evidence for `RequiredDocument`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Outdated municipal form cannot pass source freshness`. Never issue external writes.
19. **Jurisdiction pack QA critic.** Input: approved records and dated source evidence for `DocumentCompleteness`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `AI must not claim building code compliance`. Never issue external writes.
20. **High-risk construction work escalation.** Input: approved records and dated source evidence for `OfficialSource`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Professional seal required cannot be AI generated`. Never issue external writes.
21. **Domain expansion suggestion engine.** Input: approved records and dated source evidence for `RuleVersion`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Public portal status UNKNOWN never becomes APPROVED`. Never issue external writes.

## Internal architecture — does not redefine Command Center

1. **Context intake:** typed company-scoped record, owner policy and immutable data/source snapshot. Reject cross-tenant/company access.
2. **Domain analysis:** retrieval of authorized domain facts and deterministic calculators; any model's text is an untrusted hypothesis.
3. **Multiple candidate methods:** deterministic rules, statistical forecast, retrieval-backed reasoner, independent critic; prefer simpler verified method when uncertainty is material.
4. **Gate precedence:** legal, safety, evidence, zero-cost, exact owner approval, idempotency, and availability before optional confidence/ROI scoring; no score overrides a hard BLOCKED gate.
5. **Recommendation assembly:** user-visible options with confidence and conservative downside; no facts invented to fill gaps.
6. **Independent evaluation:** golden-case fixtures, regression, negative/boundary tests, calibration, precision/false positives, unsupported claims. Critic cannot overrule deterministic invariants.
7. **Agency handoff:** only a **proposal** to the currently verified scoped runner, with exact project/task/version and explicit action authority. No direct global router or shared-memory writes.
8. **Feedback loop:** actual outcome compared with expectation; corrections stay domain-local, versioned and reversible. Upward knowledge promotion only through verified Command Center policy, if it exists.

### Structured proposal example (domain semantics, NOT a confirmed live API)

`decision_id`, `company_id`, `project_id`, `brain_version`, `subject_id`, `source_hashes`, `facts_verified`, `unknowns`, `source_freshness`, `options`, `chosen_option`, `expected_financial_effect`, `risk_class`, `confidence`, `status: PROPOSED|BLOCKED|NEEDS_ME`, `required_owner_action`, `reason_codes`, `evaluator_result_id`.

The adapter to currently implemented Command Center's Brain schema must be generated from the live repository; this example must not be installed as a competing global contract.

## Specialist Agent protocol

- **Municipal Source Agent:** bounded to Project address/parcel and verified jurisdiction; return Jurisdiction rule/source list with evidence; negative fixture: Address borderline township/city; no spending or unapproved external writes.
- **Jurisdiction Resolver Agent:** bounded to Work plans and drawing index supplied with permission; return Missing prerequisite and license checklist with evidence; negative fixture: Outdated code edition; no spending or unapproved external writes.
- **Permit Scope Intake Agent:** bounded to Contractor license/registration data; return Project-specific form and plan checklist with evidence; negative fixture: Zoning overlay overlooked; no spending or unapproved external writes.
- **Work Category Agent:** bounded to Official municipal form and fee pages; return Official portal navigation guide with evidence; negative fixture: Structural engineering assumed safe; no spending or unapproved external writes.
- **Zoning Overlay Agent:** bounded to Zoning and overlay maps; return Fee and submission note with timestamps with evidence; negative fixture: Work requires registered trade; no spending or unapproved external writes.
- **Document Checker Agent:** bounded to Adopted code editions; return Submission readiness status not approval status with evidence; negative fixture: Unlicensed advice; no spending or unapproved external writes.
- **Contractor Credential Agent:** bounded to Official submittal standards; return Correction response task matrix with evidence; negative fixture: Expired form; no spending or unapproved external writes.
- **Code Edition Agent:** bounded to Reviewer correction letters; return Inspection prerequisites and readiness checklist with evidence; negative fixture: Permit fee changed; no spending or unapproved external writes.
- **Fee/Deadline Agent:** bounded to Inspection type/status; return Professional review required alert with evidence; negative fixture: Portal public data stale; no spending or unapproved external writes.
- **Form Package Agent:** bounded to Official portal reference; return Permit expiration/renewal reminders with evidence; negative fixture: Missing signed owner document; no spending or unapproved external writes.
- **Correction Notice Agent:** bounded to Plan revision notes; return Site-specific photo evidence packet with evidence; negative fixture: Wrong revision of plans; no spending or unapproved external writes.
- **Inspection Scheduler Proposal Agent:** bounded to Professional seal evidence only for verification; return Audit-ready version history with evidence; negative fixture: False inspection approval; no spending or unapproved external writes.
- **Site Readiness Agent:** bounded to Owner contact preferences; return Customer approval queue with evidence; negative fixture: Premature start of construction; no spending or unapproved external writes.
- **Plan Version Agent:** bounded to Municipal holiday/calendar data; return Permit applicability report with explicit uncertainty with evidence; negative fixture: Land-use variance required; no spending or unapproved external writes.
- **Legal/Professional Boundary Agent:** bounded to Customer work description; return Jurisdiction rule/source list with evidence; negative fixture: Historic district signoff; no spending or unapproved external writes.
- **Document Privacy Agent:** bounded to Project address/parcel and verified jurisdiction; return Missing prerequisite and license checklist with evidence; negative fixture: Fire/accessibility scope missed; no spending or unapproved external writes.
- **Human Reviewer Coordination Agent:** bounded to Work plans and drawing index supplied with permission; return Project-specific form and plan checklist with evidence; negative fixture: Professional seal fabricated; no spending or unapproved external writes.
- **QA Benchmark Agent:** bounded to Contractor license/registration data; return Official portal navigation guide with evidence; negative fixture: Inspection booking without owner consent; no spending or unapproved external writes.
- **Incident and Recovery Agent:** bounded to Official municipal form and fee pages; return Fee and submission note with timestamps with evidence; negative fixture: Credit card transaction triggered; no spending or unapproved external writes.
- **Jurisdiction Pack Agent:** bounded to Zoning and overlay maps; return Submission readiness status not approval status with evidence; negative fixture: Access control bypass; no spending or unapproved external writes.

## Independence, trust and evaluations

- Domain evaluation datasets use synthetic/lawfully provided data only and have no leaked customer information.
- Safety tests probe prompt injection in every external record, fabricated evidence, duplicate actions, stale sources, missing costs and company isolation.
- Deterministic outputs and human judgments are labeled separately; do not fabricate certainty from model confidence.
- Record model version, prompt/config hash, source version, expected outcome, observed outcome, reviewer, rollback and drift alerts.
- Every active executor must be demonstrably installed, claim jobs and write actual signed/verified outcomes; unknown/failed runner stays **Brain unavailable / Agency blocked** rather than healthy.
- Cross-company reusable methods require repeated independent proof on at least three companies before approved broader reuse; isolated domain methods remain local.

## Brain milestones: truthful status

`PACK_AUTHORED` → `RUNTIME_REFERENCES_PACK` → `EVALUATOR_PASSES` → `SCOPED_EXECUTOR_VERIFIED` → `AUTHORIZED_PROPOSALS_WORK` → `DOMAIN_OUTPUT_ACCEPTED`. Do not call the Brain available until a real invocation works in the live environment and results are checked.
