# Specialized Brain — Industrial Maintenance & Downtime Intelligence (Company 117)

**Proposed identity:** `brain:company:future:117:v1` subordinate to Command Center. **Truth:** design pack, not evidence of an installed AI model/agent or provider. All runtime capabilities are unknown until inspected/tested.

## Purpose, capabilities and customer value

Reduce avoidable industrial equipment downtime through evidence-backed maintenance data cleaning, failure-pattern analytics, preventive work prioritization, and carefully validated predictive recommendations—without unsafe machine control.

Turn existing CMMS/work-order/spare-parts/shift-log data into credible risk priorities, recurring-failure explanations and maintenance decision support; no guarantee of preventing failures.

**Owner-only protected boundary:** No direct PLC/SCADA/OT commands, equipment startup/shutdown, remote control, safety-system bypass, LOTO instruction replacement, calibration or repair instructions beyond manufacturer-approved documentation reviewed by qualified personnel. No claim of predictive maintenance from inadequate data. Private operational data must remain isolated. No paid sensors, gateway devices, site visits or integrations without explicit approval.

## Brain cognition and abstention capabilities

1. **Asset identity and taxonomy reasoner.** Input: approved records and dated source evidence for `Facility`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No operating-hours denominator cannot compute supported MTBF`. Never issue external writes.
2. **Maintenance log quality auditor.** Input: approved records and dated source evidence for `Site`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No sensor calibration cannot claim predictive accuracy`. Never issue external writes.
3. **Failure mode and symptom clusterer.** Input: approved records and dated source evidence for `EquipmentAsset`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Sensor trend cannot trigger PLC or equipment action`. Never issue external writes.
4. **Root-cause hypothesis generator.** Input: approved records and dated source evidence for `AssetHierarchy`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Authorized employee retains LOTO control`. Never issue external writes.
5. **Preventive vs reactive work analyst.** Input: approved records and dated source evidence for `OEMReference`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Missing spare part inventory produces UNKNOWN not zero`. Never issue external writes.
6. **Maintenance calendar optimization advisor.** Input: approved records and dated source evidence for `Part`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Work order duplicate not counted twice in failures`. Never issue external writes.
7. **Asset criticality contextualizer.** Input: approved records and dated source evidence for `PartBOM`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Backtest forbids look-ahead leakage`. Never issue external writes.
8. **Work backlog priority reasoner.** Input: approved records and dated source evidence for `SpareStock`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Production secrets never placed in customer report`. Never issue external writes.
9. **Spare part stockout/risk forecaster.** Input: approved records and dated source evidence for `SpareLeadTime`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Report cannot claim savings without verified measured outcome`. Never issue external writes.
10. **MTBF/MTTR methodology critic.** Input: approved records and dated source evidence for `WorkOrder`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No operating-hours denominator cannot compute supported MTBF`. Never issue external writes.
11. **Predictive model evidence eligibility classifier.** Input: approved records and dated source evidence for `WorkOrderEvent`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No sensor calibration cannot claim predictive accuracy`. Never issue external writes.
12. **Uncertainty and confidence calibrator.** Input: approved records and dated source evidence for `MaintenancePlan`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Sensor trend cannot trigger PLC or equipment action`. Never issue external writes.
13. **Shift and seasonality confounder analyst.** Input: approved records and dated source evidence for `PMOccurrence`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Authorized employee retains LOTO control`. Never issue external writes.
14. **Technician note semantic retrieval.** Input: approved records and dated source evidence for `FailureEvent`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Missing spare part inventory produces UNKNOWN not zero`. Never issue external writes.
15. **OEM source trust critic.** Input: approved records and dated source evidence for `FailureCode`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Work order duplicate not counted twice in failures`. Never issue external writes.
16. **Safety risk classifier and LOTO boundary watchdog.** Input: approved records and dated source evidence for `FailureMode`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Backtest forbids look-ahead leakage`. Never issue external writes.
17. **Event anomaly and duplicate classifier.** Input: approved records and dated source evidence for `RootCauseHypothesis`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Production secrets never placed in customer report`. Never issue external writes.
18. **Repair vs replacement scenario reasoner.** Input: approved records and dated source evidence for `DowntimeEvent`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Report cannot claim savings without verified measured outcome`. Never issue external writes.
19. **Performance counterfactual evaluator.** Input: approved records and dated source evidence for `UptimeWindow`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No operating-hours denominator cannot compute supported MTBF`. Never issue external writes.
20. **Drift and operational improvement proposer.** Input: approved records and dated source evidence for `OperatingHours`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `No sensor calibration cannot claim predictive accuracy`. Never issue external writes.
21. **Source freshness and leak checker.** Input: approved records and dated source evidence for `ShiftCalendar`. Output: proposed score, explanation, source links, uncertainty and STOP/review status. Independent check: `Sensor trend cannot trigger PLC or equipment action`. Never issue external writes.

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

- **CMMS Import Agent:** bounded to Equipment and asset list; return Repeating failure clusters with evidence; negative fixture: Missing operating hours; no spending or unapproved external writes.
- **Asset Registry Agent:** bounded to Manufacturer/model/serial only as required; return Verified downtime trend with evidence; negative fixture: False downtime incident classification; no spending or unapproved external writes.
- **Work Order Normalization Agent:** bounded to Operating hours logs; return MTBF/MTTR table with denominator explanation with evidence; negative fixture: A maintenance recommendation causes safety issue; no spending or unapproved external writes.
- **Fault Ontology Agent:** bounded to Historical fault and reason codes; return Backlog and overdue PM ranking with evidence; negative fixture: Missing LOTO safeguards; no spending or unapproved external writes.
- **Downtime Event Agent:** bounded to Maintenance schedules; return Asset criticality recommendations with evidence; negative fixture: Unauthorized machine control; no spending or unapproved external writes.
- **Preventive Maintenance Audit Agent:** bounded to Work completion timestamps; return Spare-part shortage watchlist with evidence; negative fixture: Sensitive production data leak; no spending or unapproved external writes.
- **Reliability Analyst Agent:** bounded to Technician labor effort; return Read-only weekly reliability report with evidence; negative fixture: Customer CMMS access expires; no spending or unapproved external writes.
- **Failure Pattern Agent:** bounded to Spare parts inventory/lead time; return Cost/downtime scenario with confidence with evidence; negative fixture: API costs begin; no spending or unapproved external writes.
- **Spare Part Analyst Agent:** bounded to Customer asset criticality; return Predictive model NO-GO when data insufficient with evidence; negative fixture: False predictive certainty; no spending or unapproved external writes.
- **Technician Note Agent:** bounded to Planned and unplanned outage records; return Owner-reviewed work-order draft with evidence; negative fixture: False maintenance causal inference; no spending or unapproved external writes.
- **Capacity/Backlog Planner Agent:** bounded to Approved customer provided cost estimates; return Safety specialist escalation with evidence; negative fixture: Parts inventory shortage missed; no spending or unapproved external writes.
- **Critical Asset Reviewer Agent:** bounded to OEM manuals where lawful and licensed; return Source freshness warning with evidence; negative fixture: Work order duplicates; no spending or unapproved external writes.
- **Safety Boundary Agent:** bounded to Operator inspection checklist; return Change log and comparison with evidence; negative fixture: Inaccurate technician identity; no spending or unapproved external writes.
- **OEM Evidence Agent:** bounded to Optional calibrated sensor readings; return Customer export with reproducible analysis with evidence; negative fixture: Shift and timezone mixup; no spending or unapproved external writes.
- **Forecast Eligibility Agent:** bounded to Facility timezone/shift calendar; return Maintenance data-quality gap report with evidence; negative fixture: Poor work order quality; no spending or unapproved external writes.
- **Independent Prediction QA Agent:** bounded to Safety work permit status as metadata only; return Repeating failure clusters with evidence; negative fixture: Wrong serial/model; no spending or unapproved external writes.
- **Customer Report Agent:** bounded to Management approved reporting metrics; return Verified downtime trend with evidence; negative fixture: Asset fault code mapping mistake; no spending or unapproved external writes.
- **Customer Consent Agent:** bounded to Authorized work order export; return MTBF/MTTR table with denominator explanation with evidence; negative fixture: Catastrophic false negative; no spending or unapproved external writes.
- **Incident/Recovery Agent:** bounded to Equipment and asset list; return Backlog and overdue PM ranking with evidence; negative fixture: OT network intrusion via connector; no spending or unapproved external writes.
- **Domain Expansion Agent:** bounded to Manufacturer/model/serial only as required; return Asset criticality recommendations with evidence; negative fixture: Employee privacy in maintenance notes; no spending or unapproved external writes.

## Independence, trust and evaluations

- Domain evaluation datasets use synthetic/lawfully provided data only and have no leaked customer information.
- Safety tests probe prompt injection in every external record, fabricated evidence, duplicate actions, stale sources, missing costs and company isolation.
- Deterministic outputs and human judgments are labeled separately; do not fabricate certainty from model confidence.
- Record model version, prompt/config hash, source version, expected outcome, observed outcome, reviewer, rollback and drift alerts.
- Every active executor must be demonstrably installed, claim jobs and write actual signed/verified outcomes; unknown/failed runner stays **Brain unavailable / Agency blocked** rather than healthy.
- Cross-company reusable methods require repeated independent proof on at least three companies before approved broader reuse; isolated domain methods remain local.

## Brain milestones: truthful status

`PACK_AUTHORED` → `RUNTIME_REFERENCES_PACK` → `EVALUATOR_PASSES` → `SCOPED_EXECUTOR_VERIFIED` → `AUTHORIZED_PROPOSALS_WORK` → `DOMAIN_OUTPUT_ACCEPTED`. Do not call the Brain available until a real invocation works in the live environment and results are checked.
