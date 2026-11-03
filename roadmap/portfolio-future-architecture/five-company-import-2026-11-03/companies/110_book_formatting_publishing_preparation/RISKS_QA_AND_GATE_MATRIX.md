# Company 110 — risk, legal, quality and acceptance matrix
**Status:** Draft planning controls; legal and provider specifics require fresh review before live use.
## Misuse, failure and ambiguity register
- **R01:** Low-resolution licensed images. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R02:** Fonts without commercial embedding rights. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R03:** Unlicensed cover art. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R04:** Complex math/RTL scripts unsupported. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R05:** Footnote crosslink corruption. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R06:** Widows/orphans and page-break bugs. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R07:** Cookbook images or recipes unverified. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R08:** Wrong bleed for print interior. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R09:** Wrong hardcover vs paperback cover geometry. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R10:** Missing original manuscript. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R11:** Source comment leakage. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R12:** Hidden track changes included in print. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R13:** ISBN mismatch across formats. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R14:** Customer requests silent substantive rewrites. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R15:** KDP changes trim/page constraints. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R16:** EPUB navigation broken on reader. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R17:** False assurance that all files will be accepted. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R18:** Corrupt zip/EPUB package. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R19:** Client data mixed between authors. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R20:** Output contains placeholder or prompt text. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R21:** Customer authorization to publish assumed from file delivery. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.

## Protective controls and human gates
- Never publish or change customer KDP/publishing accounts without separate explicit authorization; default is delivery-only
- No unauthorized substantive edit to manuscripts; changes tracked and author approved
- No claiming manuscript rights, exclusivity, plagiarism clearance or copyright legal advice
- Never reuse customer manuscripts or covers for another client or training without explicit consent
- Screen sample art/license and no prohibited piracy or counterfeits
- Verify retailer specs on delivery date; platform accepts/rejects independently
- Keep client billing and all outgoing money protected behind owner approval
- Protect unpublished manuscripts with private local storage, access logs and retention rules

## KPI and test evidence
- First-pass EPUB validation rate
- First-pass PDF preflight rate
- Critical layout defects per 100 pages
- Client-reported retailer rejection rate
- Revision count and cause
- Layout fidelity errors
- Customer hours saved only when measured
- Processing time and laptop throughput
- Manual QA minutes per title
- Gross margin after actual attributable expenses
- Paid jobs/return customers
- Customer satisfaction and refund requests
- On-time delivery against promised milestones

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
