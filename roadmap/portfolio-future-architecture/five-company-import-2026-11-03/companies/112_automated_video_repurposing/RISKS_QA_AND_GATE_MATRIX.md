# Company 112 — risk, legal, quality and acceptance matrix
**Status:** Draft planning controls; legal and provider specifics require fresh review before live use.
## Misuse, failure and ambiguity register
- **R01:** Rights to footage unclear. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R02:** Creator does not own background music. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R03:** Low audio quality yields incorrect captions. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R04:** Real-person face consent missing. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R05:** Speaker diarization mislabels. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R06:** Clip loses crucial context. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R07:** Quote splice changes meaning. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R08:** AI summarization invents facts. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R09:** Language unsupported locally. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R10:** CPU thermal throttling/low RAM. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R11:** Disk fills mid-render. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R12:** Power loss interrupts client job. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R13:** Video corrupt/VFR sync drift. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R14:** Portrait reframing cuts key visual. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R15:** Captions overlap platform UI. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R16:** Customer logo/music asset unlicensed. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R17:** Source contains private info. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R18:** Clip production accidentally publishes to client account. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R19:** Multiple customers’ video assets cross-contaminate. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R20:** Unreconciled delivery claims. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R21:** Client expects 24/7 portal while PC off. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.
- **R22:** Caption translation introduces wrong technical term. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.

## Protective controls and human gates
- No CrowdSkein campaign matching, creator marketplace, performance payouts or proxy distribution
- VeloClip remains personal-only and unmodified; separate customer service code/assets/workspaces
- Only source media with valid processing/commercial rights; do not assume public video is free to reuse
- Client reviews final cuts, and ambiguous rights/edits must be escalated
- Protect likeness/voice/privacy; no celebrity impersonation, voice cloning or deceptive edits
- No automatic uploads/publishing to customer social accounts without later separate scope authorization
- Local machine may be offline; never sell 24/7 availability before verification
- No outgoing money or automatic cloud/server upgrades

## KPI and test evidence
- Percent clips passing first render QA
- Caption word error rate on representative samples
- Transcript confidence calibration
- A/V synchronization defects
- Misleading splice findings
- Client accepted clips per package
- Average human QA minutes per clip
- Local throughput and queue time
- Disk use and crash/restart recovery
- Client paid orders and repeat clients
- Real contribution margin not revenue projections
- Rights/PII incident count
- Return/refund requests
- Customer delivery completeness and on-time rate

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
