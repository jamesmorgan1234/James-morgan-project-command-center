# Specialized Brain — Contract Opportunity Discovery & Matching (Company 115)

**Proposed identity:** `brain:company:future:115:v1` subordinate to Command Center. **Truth:** design pack, not evidence of an installed AI model/agent or provider. All runtime capabilities are unknown until inspected/tested.

## Purpose, capabilities and customer value

Continuously discover, verify, classify and match legitimately accessible public and authorized private contract opportunities to business eligibility, capabilities, geography and capacity, with evidence-backed actionable alerts.

Avoid missed qualified bidding opportunities while reducing false alerts and wasted proposal effort. Different from responding to an RFP already in hand.

**Owner-only protected boundary:** Do not bid, sign, submit a proposal, certify vendor status, claim set-aside eligibility, create official registration, scrape gated systems, contact contracting officers, spend on opportunity access, or impersonate procurement agencies. API keys and data-provider terms require user action/authorization. The service sells intelligence, not government endorsement.

## Brain cognition and abstention capabilities

1. **Opportunity type and solicitation context classifier.** Input: approved records and dated source evidence for `ProcurementSource`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `API-key-required source does not silently claim free access`. Never issue external writes.
2. **Procurement terminology interpreter.** Input: approved records and dated source evidence for `SourceTerms`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Cancelled notice cannot be recommended as active`. Never issue external writes.
3. **Notice vs amendment entity resolver.** Input: approved records and dated source evidence for `SourceCredentialRef`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Bid deadline UTC/local DST correctly distinguished`. Never issue external writes.
4. **NAICS/PSC domain mapping reasoner.** Input: approved records and dated source evidence for `Notice`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Set-aside unknown cannot become eligible PASS`. Never issue external writes.
5. **Vendor capability and past-performance fit.** Input: approved records and dated source evidence for `NoticeVersion`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Customer lacking bonding evidence gets conditional/not fit`. Never issue external writes.
6. **Eligibility evidence sufficiency assessor.** Input: approved records and dated source evidence for `NoticeAmendment`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Duplicate cross-portal solicitation generates one alert`. Never issue external writes.
7. **Bonding/insurance and geographic fit critic.** Input: approved records and dated source evidence for `Solicitation`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Later amendment invalidates earlier match and triggers correction`. Never issue external writes.
8. **Set-aside evidence uncertainty classifier.** Input: approved records and dated source evidence for `SolicitationAttachment`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No unsolicited email or bid action`. Never issue external writes.
9. **Deadline parsing and timezone critic.** Input: approved records and dated source evidence for `BuyerAgency`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `API-key-required source does not silently claim free access`. Never issue external writes.
10. **Bid/No-Bid opportunity ranker.** Input: approved records and dated source evidence for `Jurisdiction`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Cancelled notice cannot be recommended as active`. Never issue external writes.
11. **Competitive/incumbent signal contextualizer.** Input: approved records and dated source evidence for `NAICSCode`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Bid deadline UTC/local DST correctly distinguished`. Never issue external writes.
12. **Renewal prediction uncertainty analyst.** Input: approved records and dated source evidence for `PSCCode`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Set-aside unknown cannot become eligible PASS`. Never issue external writes.
13. **Source trust and freshness critic.** Input: approved records and dated source evidence for `OpportunityCategory`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Customer lacking bonding evidence gets conditional/not fit`. Never issue external writes.
14. **Procurement ethics and official status classifier.** Input: approved records and dated source evidence for `SolicitationDeadline`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Duplicate cross-portal solicitation generates one alert`. Never issue external writes.
15. **False-positive review and threshold calibration.** Input: approved records and dated source evidence for `EligibilityRule`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Later amendment invalidates earlier match and triggers correction`. Never issue external writes.
16. **Industry vertical pack proposal engine.** Input: approved records and dated source evidence for `CertificationRequirement`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No unsolicited email or bid action`. Never issue external writes.
17. **Customer matching rationale generator.** Input: approved records and dated source evidence for `VendorCustomer`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `API-key-required source does not silently claim free access`. Never issue external writes.
18. **Deadline-risk and workload scheduler.** Input: approved records and dated source evidence for `VendorCapability`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Cancelled notice cannot be recommended as active`. Never issue external writes.
19. **Proposal-handoff readiness critic.** Input: approved records and dated source evidence for `VendorGeography`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Bid deadline UTC/local DST correctly distinguished`. Never issue external writes.
20. **Cost/quality impact evaluator.** Input: approved records and dated source evidence for `VendorCredentialEvidence`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Set-aside unknown cannot become eligible PASS`. Never issue external writes.
21. **Domain improvement hypothesis proposer.** Input: approved records and dated source evidence for `CapacityConstraint`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Customer lacking bonding evidence gets conditional/not fit`. Never issue external writes.

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

- **Public Opportunity Discovery Agent:** bounded to Official state procurement portal; return Customer-specific match score and reason with evidence; negative fixture: Missing bonding requirement; no spending or unapproved external writes.
- **Procurement Source Reliability Agent:** bounded to Official municipal bid portals; return Mandatory eligibility checklist with evidence; negative fixture: Award mistaken for solicitation; no spending or unapproved external writes.
- **Procurement Notice Parser Agent:** bounded to Authorized vendor solicitation email; return No-go reason and missing evidence with evidence; negative fixture: Amendment alters deadline; no spending or unapproved external writes.
- **Amendment and Supersession Agent:** bounded to Customer NAICS and service capabilities; return Deadline and amendment calendar with evidence; negative fixture: Expired notice offered as live; no spending or unapproved external writes.
- **NAICS/PSC Taxonomy Agent:** bounded to Customer service geography; return Source URL and last observed timestamps with evidence; negative fixture: Grant confused with bid; no spending or unapproved external writes.
- **Customer Capability Intake Agent:** bounded to Customer certifications, licenses and expiry; return Award not guaranteed caveat with evidence; negative fixture: Keyword false positive; no spending or unapproved external writes.
- **Eligibility Evidence Agent:** bounded to Capacity and staff availability as customer-provided; return Weekly qualified opportunity shortlist with evidence; negative fixture: Provider API key unavailable; no spending or unapproved external writes.
- **Business Match and Explanation Agent:** bounded to Insurance/bonding constraints; return Cancelled/changed opportunity alert with evidence; negative fixture: Paid portal fee surprise; no spending or unapproved external writes.
- **Deadline Calendar Agent:** bounded to Historical won/lost contracts only when authorized; return Customer approved notification draft with evidence; negative fixture: Customer capacity misstatement; no spending or unapproved external writes.
- **Source Freshness Agent:** bounded to Industry keywords and exclusions; return RFP response handoff packet for #036 with evidence; negative fixture: Gated data scraping violation; no spending or unapproved external writes.
- **Rebid/Recurring Contract Watch Agent:** bounded to Verified mandatory dates and amendments; return Renewal and rebid watchlist with evidence; negative fixture: Source copyright/licensing breach; no spending or unapproved external writes.
- **Incumbent Research Agent:** bounded to Contract contact/agency public fields; return Sector market insight with evidence; negative fixture: Stale official source; no spending or unapproved external writes.
- **False Positive QA Agent:** bounded to Customer subscription and alert consent; return Public provenance and source outage report with evidence; negative fixture: Vendor privacy leak; no spending or unapproved external writes.
- **Alert Review Agent:** bounded to Disclosed source terms/licensing limits; return Export and API event with evidence; negative fixture: Fraudulent procurement notice; no spending or unapproved external writes.
- **Bid/No-Bid Briefing Agent:** bounded to Public federal SAM.gov notices and download files; return Verified opportunity profile with evidence; negative fixture: Phishing file attachment; no spending or unapproved external writes.
- **Industry Pack Agent:** bounded to Official state procurement portal; return Customer-specific match score and reason with evidence; negative fixture: Government endorsement misrepresentation; no spending or unapproved external writes.
- **Customer Feedback Agent:** bounded to Official municipal bid portals; return Mandatory eligibility checklist with evidence; negative fixture: Wrong timezone/DST; no spending or unapproved external writes.
- **Privacy/Terms Agent:** bounded to Authorized vendor solicitation email; return No-go reason and missing evidence with evidence; negative fixture: False promise to win a bid; no spending or unapproved external writes.
- **Incident/Recovery Agent:** bounded to Customer NAICS and service capabilities; return Deadline and amendment calendar with evidence; negative fixture: Customer unsubscribed but contacted; no spending or unapproved external writes.
- **Independent Evaluation Agent:** bounded to Customer service geography; return Source URL and last observed timestamps with evidence; negative fixture: Duplicate alert spam; no spending or unapproved external writes.

## Independence, trust and evaluations

- Domain evaluation datasets use synthetic/lawfully provided data only and have no leaked customer information.
- Safety tests probe prompt injection in every external record, fabricated evidence, duplicate actions, stale sources, missing costs and company isolation.
- Deterministic outputs and human judgments are labeled separately; do not fabricate certainty from model confidence.
- Record model version, prompt/config hash, source version, expected outcome, observed outcome, reviewer, rollback and drift alerts.
- Every active executor must be demonstrably installed, claim jobs and write actual signed/verified outcomes; unknown/failed runner stays **Brain unavailable / Agency blocked** rather than healthy.
- Cross-company reusable methods require repeated independent proof on at least three companies before approved broader reuse; isolated domain methods remain local.

## Brain milestones: truthful status

`PACK_AUTHORED` → `RUNTIME_REFERENCES_PACK` → `EVALUATOR_PASSES` → `SCOPED_EXECUTOR_VERIFIED` → `AUTHORIZED_PROPOSALS_WORK` → `DOMAIN_OUTPUT_ACCEPTED`. Do not call the Brain available until a real invocation works in the live environment and results are checked.
