# Company 109 — risk, legal, quality and acceptance matrix
**Status:** Draft planning controls; legal and provider specifics require fresh review before live use.
## Misuse, failure and ambiguity register
- **R01:** Carrier suspended delivery guarantee. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R02:** Carrier does not provide free tracking on chosen tier. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R03:** No supported carrier claims API. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R04:** Tracking number reused across years. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R05:** Packages with multiple pieces. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R06:** Mis-scanned proof of delivery. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R07:** Weather/holiday exclusion. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R08:** Wrong merchant carrier account. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R09:** Carrier event timezone ambiguity. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R10:** Carrier data lag. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R11:** Claim filed after deadline. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R12:** Duplicate claim accepted in portal. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R13:** Unsupported delivery-date inference. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R14:** Missing original shipping charge. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R15:** Customer already credited. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R16:** Carrier issues partial credit. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R17:** Refund appears in different accounting period. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R18:** Customs delay excluded. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R19:** Fraudulent parcel not received assertion. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R20:** Recipient data leak. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R21:** Automated charge to carrier account. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R22:** Automatic consumer refund without approval. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.

## Protective controls and human gates
- Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date
- Claims may carry contractual representations, so human approval before any submission
- No money out under any execution path
- Protect carrier credentials and customer PII; provide minimized exports
- Do not auto-accept carrier terms, disputes or releases
- Separate expected recovery and realized credit
- Avoid hidden costs from premium tracking providers or high-frequency polling
- Observe carrier API terms and rate limits
- No unauthorized modifications to shipments, label purchase, rerouting or return orders

## KPI and test evidence
- Tracked package event freshness
- Late delivery exception precision
- Eligible claim identification accuracy vs current policies
- Claim packet completeness
- Claim acceptance/denial rate
- Carrier-credit verified actuals
- Missed deadlines
- Customer service resolution time
- Credit reconciliation error
- Duplicate attempted claims prevented
- Service cost per tracked package
- False savings or false cash claims = zero tolerance
- Merchant churn and real recurring revenue

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
