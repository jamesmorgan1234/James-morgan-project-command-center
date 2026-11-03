# Company 108 — risk, legal, quality and acceptance matrix
**Status:** Draft planning controls; legal and provider specifics require fresh review before live use.
## Misuse, failure and ambiguity register
- **R01:** Official notice predates FDA classification. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R02:** UPC omitted or shared across variants. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R03:** Conflicting brand/manufacturer naming. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R04:** Lot number image misread. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R05:** Stale source or silent data gap. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R06:** Duplicate notice ID with changed remedy. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R07:** Recall not covered by selected source. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R08:** Recalled only in other jurisdiction. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R09:** Catalog incomplete/incorrect. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R10:** Wrong timezone for effective date. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R11:** Product relabeled/private label. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R12:** False positive triggering needless panic. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R13:** False negative missing hazardous product. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R14:** Leaked sale/customer PII. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R15:** Merchant disables safety-critical alerts. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R16:** Source site changes rate limits/terms. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R17:** Bad source translation changes severity. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R18:** Customer mistakenly treats no match as safety clearance. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R19:** Supplier contradicts regulator. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R20:** Unauthorized customer notification or refund. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.

## Protective controls and human gates
- Do not issue independent safety certifications, legal advice or product recall initiation
- Official text/hazard/classification must remain distinguishable from inference
- High-consequence matching ambiguous → escalate; never auto-clear
- Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law
- Do not scrape private consumer information from open reports
- If official sources unavailable, show STALE/UNKNOWN not NO RECALL
- Protect report distribution, customer sales history and source/notice integrity
- Verify agency links and provenance; no invented dates/status

## KPI and test evidence
- Source publication-to-detection latency
- Recall coverage by source/category
- Official-feed freshness and missing-source hours
- Precision/recall and calibration on reviewer-labeled cases
- False-negative critical severity
- Reviewer workload per 1k notices
- Time-to-first-relevant-alert
- Customer match acceptance and override rate
- SKU monitoring cost
- MRR/retention/churn only from actual billing
- Support incidents and staleness
- Affected units only when evidence-backed

## Kill/recovery and containment
Safe mode disables affected action/connector while retaining evidence, rollback candidate, retry lease and tenant-specific notification. Company failure does not propagate to unrelated companies. No automated financial action occurs during recovery.
## No false assurance
Provider data may be delayed, terms may change, QA samples may miss defects, and paid customer demand is not established by a roadmap. Every high-impact claim needs a source/effective date or an explicit unknown state.
## Relevance and saturation veto
- Improves verified customer outcome, reliability, safety, effectiveness, operating cost, accessibility or sustainable revenue for this exact company
- Is compatible with its legal/technical boundaries and with Command Center authority
- Has a documented business hypothesis and measurable acceptance criteria; no deceptive claims or fabricated demand
- Can be planned now and implemented later without breaking tested architecture; use plugin/contract seams instead of speculative build
- Avoids redundant features and unproven cross-company reuse; preserves source and private customer isolation
- All protected changes and outgoing money remain owner-authorized; no automatic reinvestment

## Evidence collection per real deployment
Commit/release ID; migration/candidate compatibility; test suite/log summary; source and tenant authorization; provider limits; performance/quality; actual financial state; incident/rollback checkpoint; customer authorization; operator signoff.
