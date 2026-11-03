# Company 111 — risk, legal, quality and acceptance matrix
**Status:** Draft planning controls; legal and provider specifics require fresh review before live use.
## Misuse, failure and ambiguity register
- **R01:** Customer domain credentials unavailable. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R02:** Email delivery provider quota reached. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R03:** Form fails silently. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R04:** Booking conflicts with real calendar. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R05:** Lead sent to wrong company. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R06:** Stale service area/business hours. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R07:** Invented licensing/reviews. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R08:** Photos lack commercial license. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R09:** Insecure form exposes customer PII. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R10:** Accessibility contrast/keyboard failure. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R11:** Client site contains another client’s branding. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R12:** Stale DNS/cache masks launch. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R13:** Free hosting exceeds limits. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R14:** Customer expects booking confirmed when only request received. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R15:** Broken call-to-action on mobile. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R16:** Unlicensed font/assets. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R17:** Customer payment link points to wrong merchant. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R18:** Unauthorized subscription added to client account. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R19:** RevoCapture and website data mixed. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R20:** Search ranking promise not met. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.

## Protective controls and human gates
- No implicit RevoCapture merger or access to existing contractor leads
- No fabricated reviews, certifications, licenses, emergency guarantees, business hours or job photos
- Booking request is NOT an appointment confirmation
- Customer owns domain/content/account; no cross-client account/identity sharing
- Form PII private and minimized; secure delivery and retention
- No customer domain purchase, email upgrade, campaign spend or automatic outgoing payment
- Site publication and public messaging remain gated by approved deployment scope
- Provide accessibility testing, not blanket legal ADA certification

## KPI and test evidence
- Form submit-to-owner delivered rate
- Lead delivery failures
- Real appointments confirmed by owner
- Mobile page speed and CWV
- Accessibility audit defects
- Spam submission rate
- Client handoff/ownership completion
- First-pass client approval rate
- Hours per site and site cost
- Customer retention and recurring maintenance revenue
- Verified conversion only where consented and measured
- Customer support requests and outage time

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
