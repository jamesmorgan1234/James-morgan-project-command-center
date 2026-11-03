# Company 109 — Shipping Exception & Refund Recovery

**Company ID:** `company:future:109`  
**Primary project:** `project:company:future:109`  
**Proposed Brain:** `brain:company:future:109:v1`  
**Provisional roadmap version:** `COMPANY-109-DRAFT-v1.0.0`  
**Status:** PREPARED LOCALLY / NOT REGISTERED / NOT BUILT / NOT LAUNCHED  
**GitHub authority inspected:** `jamesmorgan1234/James-morgan-project-command-center` @ `build/spec-lock-v2-clean-room` (read-only snapshot 055b9dd7662c)  
**Conformance:** 28 narrative passes + 78 A–BZ evidence maps authored. Final repository conformance verification and external facts remain pending.  
**Authorization:** planning/files only. Do not write GitHub, Supabase or Vercel; do not launch, market, transact, connect accounts or spend.

## Business identity

Purpose: Help eligible merchants identify delivery exceptions, reconcile carrier promises and policies, and prepare evidence-backed shipping-credit/refund claims without initiating unauthorized financial transactions.

Core problem: Carrier tracking events and service commitments are fragmented; merchants miss customer service issues and potentially eligible claims because evidence and deadlines are scattered.

Value proposition: Carrier/service-specific entitlement determination with explicit unknowns, human approval of claims, robust evidence trails and merchant/customer experience automation.

Ideal first customer: Small-mid direct-to-consumer shippers and fulfillment teams who ship enough parcels to face repetitive exception and refund-case work.

Monetization model hypothesis: Subscription by monitored parcel band, verified recovery report service, eligible-claim preparation fee, optional capped percentage of actually credited value only with lawful contract and owner approval.

Non-goal and protected boundary: No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply.

## First-class project and full company Brain

Immutable proposed company/project/Brain identities above; independent route, button, status, progression, Needs Me, risk, revenue, sources, versions, credentials and private state; company does not inherit anyone else’s actual revenue or completion. Brain authority is subordinate to Command Center.

No shared customer data, no unilateral spending, and no automatic scaling. Brain may evaluate, advise and propose; Agency may perform only actions authorized in its bounded task packet. Company owner remains James Morgan.

## Complete product tree

- Carrier tracking unification
- Shipment import and dedupe
- Carrier-service rule registry
- Delivery exception dashboard
- Lost/stalled parcel detection
- Late-delivery eligibility assessment
- Guaranteed-service eligibility check
- Preliminary refund/credit opportunity queue
- Claims evidence packet generator
- Claim submission approval workflow
- Claim deadline and clock monitor
- Carrier credit ledger reconciliation
- Shipping invoice audit
- Customer support response drafting
- Warehouse/escalation task routing
- Delivery promise/ETA deviation analytics
- Address correction exception analyzer
- Damage claim evidence intake
- Proof-of-delivery management
- Insurance/declared-value evidence manager
- Return-to-sender workflows
- Carrier dispute timeline
- Carrier account/contract registry
- Carrier-specific terms versioning
- Package-not-received triage
- Duplicate shipment/claim detection
- Carrier feed outage alert
- Authorized webhook/API notifications
- Store/3PL connectors
- Support desk handoff
- Customer communication preference gate
- Operational analytics and carrier scorecards
- Shipping label cost audit only with evidence
- Cost-per-shipment and net-recovery dashboards
- Cohort/root-cause analysis
- Private-label carrier exception dashboard
- Multi-carrier reconciliation export


## Complete feature tree

- Event normalization with source event IDs
- Out-of-order and delayed event handling
- Tracking number checksum/format validation
- Shipment/carrier/account identity pinning
- Canonical status state machine with terminal state monotonicity
- Multi-package/multi-piece shipment linkage
- Merchant order/parcel mapping
- Carrier service class and guarantee versioning
- Delivery promises vs service standards separation
- Timezone/holiday/weekend calendar logic
- Different missing-scan detection windows by service
- Exceptions: delay, damage, refusal, address, customs, weather, attempted delivery
- Exception code translation with raw event preserved
- Reroute/hold/redelivery flags
- ETA uncertainty ranges not invented guarantees
- Carrier service advisories and exclusions
- Guarantee suspension detection
- Case evidence requirements per carrier
- Invoice/charge line-item matching
- Deadline from carrier rules with source URL/date
- Prepare-draft-only default
- Owner/client approval and identity before submissions
- Idempotency token for claim attempts
- Carrier claim status updates and reconciliation
- Denial reason taxonomy
- Recoveries shown only as verified credits/refunds
- Customer refund ledger distinct from carrier credits
- Data sensitivity/PII minimization
- No automatic label purchase or surcharge payment
- Dormant credential and account revocation monitoring
- Rate-limit/cost governor
- Customer suppression and quiet hours
- Operational drill-down and downloadable export
- Abuse/fraud and false-delivery-claim screening


## Complete customer tree

- Ecommerce merchants
- Subscription-box retailers
- Wholesale shippers
- 3PL fulfillment operators
- Small warehouse teams
- Shopify/WooCommerce shipping operations
- Cross-border sellers with verified carrier terms
- Marketplace merchants with own carrier agreements
- Merchants with high delivery volume
- Customer experience/returns managers


## Complete vertical tree

- DTC ecommerce
- Apparel/beauty/home goods
- Subscription products
- Specialty retail
- B2B spare parts
- Local maker brands shipping nationally
- Multi-warehouse operations
- Cross-border parcel tracking when licensed
- High-service merchant delivery experience


## Specialized Brain capability tree

- Carrier event sequence interpretation with raw-evidence grounding
- Service-level commitment classifier
- Policy/eligibility explanation from currently verified rule version
- Shipping exception triage and prioritization
- Customer-impact classification
- Pattern and carrier performance analysis
- Claim completeness guidance
- Deadline confidence and abstention
- Invoice line-item matching and discrepancies
- Duplicate/suspicious claim detection
- Carrier outage vs shipment issue differentiation
- Refund opportunity estimate with no assertion of recoverability
- Root-cause and warehouse suggestions
- Support draft tone and factuality guard
- Policy-change monitor with escalation
- Human correction learning
- Carrier adapter drift detection
- Failure-mode and rerun planning
- Economic unit margin analysis without acting on payments
- Domain-specific continuous improvement proposals


## Brain architecture

A specialized company domain Brain (not the Command Center Brain): input/source context → evidence retrieval → task-domain reasoning → deterministic validation → confidence/abstention → policy/owner gate → recommendation to scoped Agency or Needs Me → independent evaluation → versioned feedback.

Domain sources: USPS Developer Portal and carrier-published guarantees/claim processes; eligibility and credit deadlines require current verification for each service and account.

Protected boundary: No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply.

Every tool invocation carries immutable `owner_id`, `company_id`, `project_id`, `task_id`, capability, source version, execution budget ceiling **$0**, and authorized action scope; stale or unknown provenance fails closed.

## Complete Agent tree

- Carrier connector agent
- Tracking event reconciler
- Service policy research agent
- Eligibility evaluator
- Claim evidence builder
- Deadline watch agent
- Exception escalation agent
- Invoice matching agent
- Customer support draft agent
- Carrier-account verifier
- Claim-review queue agent
- Recovery verification agent
- Financial truth reconciler
- Fraud/abuse verifier
- Independent claim-rule QA agent
- SLA/incident coordinator
- Domain Brain improvement proposer


## Deterministic / non-agent services

- Carrier connector SDK
- Tracking event ingestion queue
- Idempotent event journal
- Shipment state machine
- Tracking/cost rate limiter
- Service policy version store
- Holiday/timezone engine
- Carrier advisory import
- Evidence document vault
- Deadline rules engine
- Claims approval gate
- Protected outgoing-money gate
- Merchant organization RBAC
- Claim submission intent registry
- Reconciliation ledger
- Charge/credit parser
- PII redaction/export
- Email notification gate
- Exception routing
- Observability and resilience
- Customer offboarding export/delete


## Input tree

- Merchant shipment manifest
- Tracking numbers
- Carrier identity
- Service class
- Ship date and label purchase date
- Promised vs estimated delivery date
- Tracking event feed
- Carrier service advisories
- Contract/guarantee policies
- Order/recipient data with consent
- Shipment invoice/charges
- Delivery proof
- Damage/photo evidence authorized by merchant
- Claim feedback/denials
- Carrier credit memo/statement
- Customer refund records as separate read-only data


## Output tree

- Canonical shipment status and source link
- Exception alert
- Eligibility assessment with rules version
- Claim evidence packet
- Submission approval request
- Deadline watch queue
- Missing evidence report
- Claim/credit status with provenance
- Verified credited amount only after reconciliation
- Estimated opportunity explicitly not cash
- Support response draft
- Carrier performance scorecard
- Customer service case handoff
- Monthly operational report
- Audit/replay export


## Workflow tree

- Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track
- Receive event → dedupe/order → evaluate exception rules → attach raw evidence
- Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason
- Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization
- Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value
- Support triage → approved customer messaging without inferring compensation
- Carrier outage → preserve last event time → mark stale → pause eligibility claims
- Claim deadline nearing → reminder without paying/submitting
- Cancellation or customer exit → revoke keys and export/delete
- Recompute affected claims after policy correction using exact historical rules


## Integration tree (not activated)

- USPS developer tracking APIs when supported
- UPS tracking/claims only under appropriate account/license
- FedEx tracking/claims only under appropriate account/license
- DHL tracking/claims only under appropriate account/license
- ShipStation/Shippo/EasyPost via authorized customer integrations
- Shopify/WooCommerce order feeds
- 3PL/WMS CSV and webhook intake
- Customer helpdesk CRM
- Carrier invoice or statement CSV
- Merchant accounting ledger export
- Email notification gateway with verified sender
- Customer-owned cloud files
- Calendar for claim deadlines


## API / developer ecosystem

Plan versioned company-scoped read APIs, least-privilege service tokens, signed inbound webhooks, opt-in outbound callbacks, idempotency, cursor pagination, predictable 429 behavior, schema/version negotiation, optional SDKs, audit tracing, compatible migrations and complete API deprecation policy. No public keys/secrets in source or customer data.

## Data architecture / source provenance

- Tenant carrier account identifier
- Shipment and package stable IDs
- Service level and its rule effective dates
- Raw timestamped tracking events
- Normalized state with correction ledger
- Merchant order pointer with minimal PII
- Delivery promise vs estimate classification
- Claims eligibility input and rule citations
- Claim intent, approval and attempt history
- Carrier portal acceptance evidence
- Claim denial reason and appeal history
- Invoice charge line items
- Credit/refund settlement evidence
- Merchant customer-refund events separate
- Incident/timezone/holiday context
- Connector rate limits and provider terms snapshots
- PII retention/erasure and case legal-hold refs


## Data moat / IP / differentiation

- Versioned per-carrier policy corpus with expiry checking
- Real carrier claim outcome/denial calibration without cross-customer leakage
- Shipment event state accuracy
- Verified credit reconciliation and audit traceability
- Carrier exception taxonomy
- Root-cause accuracy and merchant workflow integrations


## Monetization candidate tree

- Subscription by tracked package volume
- Carrier anomaly dashboard package
- Claims preparation subscription add-on
- Proof-of-delivery incident bundle
- Shipping invoice audit
- Premium carrier comparison reports
- API usage tier after authorized commercialization
- Account onboarding service if legitimate and economically viable
- Enterprise multi-warehouse tier
- Per-recovered-credit success fee only by agreement and never by unsupported estimated value
- Reconciliation exports
- Partner/OEM fulfillment integration


## Packaging and product tiers

- Starter: CSV tracking and exception reports
- Operations: multi-carrier feeds and exception notifications
- Recovery: eligibility/claim packet preparation with approvals
- Finance: verified credit reconciliation and audit exports
- Enterprise: warehouses, APIs, private adapters and SSO


## Distribution and acquisition channels (planning only)

- Organic educational guides about shipping exceptions
- Anonymized sample parcel exception report
- Merchant communities and fulfillment operators
- Authorized ecommerce integration ecosystems
- Operations consultants
- 3PL referral arrangements subject to approval
- Customer support workflow examples
- Public verified guarantee policy explainers
- SEO: late package, exception reconciliation, carrier invoices
- Self-serve CSV proof-of-value demo


## Customer lifecycle, support and success

Customer states: discovered → qualified → consent/contract/owner authorization → trial/test → live delivery → acceptance → verified paid outcome (if any) → support/corrections → renewal/retention → export/offboard. First real customer is a separate user-controlled activation gate. Support agent classes: Carrier connector agent, Tracking event reconciler, Service policy research agent, Eligibility evaluator, Claim evidence builder, Deadline watch agent.

## Automation maximum / human intervention minimum

- Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track
- Receive event → dedupe/order → evaluate exception rules → attach raw evidence
- Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason
- Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization
- Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value
- Support triage → approved customer messaging without inferring compensation
- Carrier outage → preserve last event time → mark stale → pause eligibility claims
- Claim deadline nearing → reminder without paying/submitting
- Cancellation or customer exit → revoke keys and export/delete
- Recompute affected claims after policy correction using exact historical rules


## Operations / administration

Single-owner $0-first operations; source freshness, queue/capacity limits, customer support, quality and legal exception routing, company-specific audit and retention, exact customer billing truth, reconciliation, disaster restore, proof-oriented release checklist, approvals and no-spend enforcement.

## Security / privacy / compliance / legal / abuse

- Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date
- Claims may carry contractual representations, so human approval before any submission
- No money out under any execution path
- Protect carrier credentials and customer PII; provide minimized exports
- Do not auto-accept carrier terms, disputes or releases
- Separate expected recovery and realized credit
- Avoid hidden costs from premium tracking providers or high-frequency polling
- Observe carrier API terms and rate limits
- No unauthorized modifications to shipments, label purchase, rerouting or return orders


## Reliability / failures / edge cases / incident response

- Carrier suspended delivery guarantee
- Carrier does not provide free tracking on chosen tier
- No supported carrier claims API
- Tracking number reused across years
- Packages with multiple pieces
- Mis-scanned proof of delivery
- Weather/holiday exclusion
- Wrong merchant carrier account
- Carrier event timezone ambiguity
- Carrier data lag
- Claim filed after deadline
- Duplicate claim accepted in portal
- Unsupported delivery-date inference
- Missing original shipping charge
- Customer already credited
- Carrier issues partial credit
- Refund appears in different accounting period
- Customs delay excluded
- Fraudulent parcel not received assertion
- Recipient data leak
- Automated charge to carrier account
- Automatic consumer refund without approval


## Observability / KPIs / economic measurements

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


## Testing / independent verification / Brain evaluations

Require unit, contract/schema, integration, end-to-end, accessibility, negative/abuse, privacy-isolation, authorization, no-spend, idempotency/retry, outage recovery, drift, benchmark and stress tests; model or heuristic evaluation must include a realistic domain-labeled corpus and threshold/abstention gates. A passed mock is not proof of live operation.

Critical acceptance examples: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces, Mis-scanned proof of delivery, Weather/holiday exclusion, Wrong merchant carrier account, Carrier event timezone ambiguity, Carrier data lag.

## Deployment / scale / performance / cost

Local/free-first validated implementation; only propose paid hosting/API/GPU/communication resources for owner consideration if actual demand and quality/capacity measurements warrant. No automatic paid activation or reinvestment. Exact release identity, tested rollback, per-company resource quotas, incident safe mode, accessible responsive UX.

## Future-technology and strategic expansion candidates

- Natural-language carrier policy questions with citations
- Multimodal package damage assessment as suggestion only
- Shipment risk forecasting with uncertainty
- Support intent automation with consent
- Tracking webhook failover and event broker
- Multi-country customs handoff
- Customer-side estimated delivery communication templates
- Multi-carrier package insurance comparison only as recommendations
- Warehouse pick/pack root-cause linkage
- Contract negotiation evidence reports
- Privacy-preserving industry benchmarks
- Smart carrier-route selection suggestions without label purchases
- Signed claim evidence exports


## Cross-company synergy and reuse *candidates*

- Existing company #087 Marketplace Payout Reconciliation for ledger concepts only
- Existing company #085 Revenue Leakage Detection for anomaly baseline after proof
- Existing company #086 Payment Reconciliation for settlement matching after financial-scope review
- Existing company #071 Webhook Reliability for connector patterns
- Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility
- Command Center durable events, identity, audit and financial governor interfaces only


## Proven capability dependency, blast radius, version and compatibility

Before reuse: prove third-party licensing/IP permission, three-company production-proven maturity where required, compatibility with client schemas and domain safety, tenant boundaries, shadow/canary eval, performance envelope, fallback or fork, rollback, source/version pin and deletion/retention isolation. No broad inheritance merely because concepts are similar.

Blast-radius classification: critical for cross-company financial/credential leaks or unapproved outgoing money; high for domain harm, false claims, silent loss or misrouting; medium for recoverable user experience defects; low only for reversible scoped cosmetic changes. Shared changes require a regression matrix across all affected companies.

## White label / OEM / partners / community / training

Evaluate only if relevant and commercially validated: documented partner integrations, reseller contracts without auto-payouts, approved white-label packages, industry-specific onboarding, help center, sample reports and community education. Do not add an unrelated marketplace or divert the business into a generic platform.

## Internationalization, accessibility, mobile, voice, multimodal

Consider locale/timezone/currency and rights/consent rules, responsive mobile access, WCAG-aligned controls, language packs, text/speech/video inputs only where materially relevant. Safety/legal and accessibility claims must be evaluated against current standards and human review, not self-certified.

## Experimentation / continuous improvement

Each experiment: customer-relevant hypothesis, metric and baseline, independent test, sample limits, owner-approved exposure, versioned rollback and privacy safeguards. A domain Brain may suggest learning packets upward; Command Center validates and scopes any promotion. Do not silently share customer-private memories or models.

## Phased implementation roadmap (sequential gates; parallel work inside gates)

### P0 — Carrier/market feasibility

**Objective:** Choose carrier and service under known free/licensed access; document guarantee policies and actual account eligibility.

**Exit gate:** No code relies on unverified API/refund eligibility; synthetic examples only.

**Dependency:** None acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P0 gate.

**Planned task IDs:** `project:company:future:109:p0:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P1 — Shipment/event state foundation

**Objective:** First-class project/Brain; shipping entity and event journal; idempotent tracking adapter; authorization boundaries.

**Exit gate:** Out-of-order/replayed tracking tests and no credential exposure.

**Dependency:** P0 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P1 gate.

**Planned task IDs:** `project:company:future:109:p1:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P2 — Exception classification

**Objective:** Service-specific exception logic, delivery clocks, advisory versions, evidence and uncertainty.

**Exit gate:** False-positive case evaluation and time-zone/holiday tests.

**Dependency:** P1 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P2 gate.

**Planned task IDs:** `project:company:future:109:p2:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P3 — Eligibility/claim preparation

**Objective:** Current carrier policy citations, deadline system, evidence packet and separate claim approval gate.

**Exit gate:** No automatic filing or financial action; policy change rejects stale rules.

**Dependency:** P2 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P3 gate.

**Planned task IDs:** `project:company:future:109:p3:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P4 — Actual-credit reconciliation

**Objective:** Claim receipt tracking, credits verified against statements, distinct customer refunds, accurate reporting.

**Exit gate:** Zero synthetic revenue, zero duplicate claim IDs and equal-credit reconciliation.

**Dependency:** P3 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P4 gate.

**Planned task IDs:** `project:company:future:109:p4:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P5 — First merchant validation

**Objective:** Authorized merchant trial with shipment volume, exception burden, policy eligibility and service value evidence.

**Exit gate:** Actual operator feedback and first real paid evidence before scaling.

**Dependency:** P4 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P5 gate.

**Planned task IDs:** `project:company:future:109:p5:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P6 — Carrier and platform expansion

**Objective:** More account-scoped carrier adapters, ecommerce and 3PL connectors, support desk integration.

**Exit gate:** Each carrier has separate legality, credentials, replay/coverage and financial gates.

**Dependency:** P5 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P6 gate.

**Planned task IDs:** `project:company:future:109:p6:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P7 — Optimization and scale

**Objective:** Versioned event analytics, policy drift, enterprise dashboards, recovery/migration, low-cost capacity design.

**Exit gate:** Measured unit economics; capacity cost proposals only, never auto-spend.

**Dependency:** P6 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P7 gate.

**Planned task IDs:** `project:company:future:109:p7:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).


# Exhaustive 28-pass findings — planning evidence

**01. Core Business:** Carrier tracking events and service commitments are fragmented; merchants miss customer service issues and potentially eligible claims because evidence and deadlines are scattered. Carrier/service-specific entitlement determination with explicit unknowns, human approval of claims, robust evidence trails and merchant/customer experience automation. Buyer: Small-mid direct-to-consumer shippers and fulfillment teams who ship enough parcels to face repetitive exception and refund-case work.


**02. Product Expansion:** Carrier tracking unification, Shipment import and dedupe, Carrier-service rule registry, Delivery exception dashboard, Lost/stalled parcel detection, Late-delivery eligibility assessment, Guaranteed-service eligibility check. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**03. Customer Expansion:** Ecommerce merchants, Subscription-box retailers, Wholesale shippers, 3PL fulfillment operators, Small warehouse teams, Shopify/WooCommerce shipping operations, Cross-border sellers with verified carrier terms. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**04. Industry / Vertical Expansion:** DTC ecommerce, Apparel/beauty/home goods, Subscription products, Specialty retail, B2B spare parts, Local maker brands shipping nationally, Multi-warehouse operations. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**05. Specialized Brain:** Carrier event sequence interpretation with raw-evidence grounding, Service-level commitment classifier, Policy/eligibility explanation from currently verified rule version, Shipping exception triage and prioritization, Customer-impact classification, Pattern and carrier performance analysis, Claim completeness guidance. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**06. Agent Decomposition:** Carrier connector agent, Tracking event reconciler, Service policy research agent, Eligibility evaluator, Claim evidence builder, Deadline watch agent, Exception escalation agent. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**07. Deterministic Services:** Carrier connector SDK, Tracking event ingestion queue, Idempotent event journal, Shipment state machine, Tracking/cost rate limiter, Service policy version store, Holiday/timezone engine. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**08. Data Products:** Tenant carrier account identifier, Shipment and package stable IDs, Service level and its rule effective dates, Raw timestamped tracking events, Normalized state with correction ledger, Merchant order pointer with minimal PII, Delivery promise vs estimate classification. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**09. API / Developer Products:** USPS developer tracking APIs when supported, UPS tracking/claims only under appropriate account/license, FedEx tracking/claims only under appropriate account/license, DHL tracking/claims only under appropriate account/license, ShipStation/Shippo/EasyPost via authorized customer integrations, Shopify/WooCommerce order feeds, 3PL/WMS CSV and webhook intake. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**10. White Label / OEM / Embedded:** Starter: CSV tracking and exception reports, Operations: multi-carrier feeds and exception notifications, Recovery: eligibility/claim packet preparation with approvals, Finance: verified credit reconciliation and audit exports, Enterprise: warehouses, APIs, private adapters and SSO. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**11. Enterprise:** Starter: CSV tracking and exception reports, Operations: multi-carrier feeds and exception notifications, Recovery: eligibility/claim packet preparation with approvals, Finance: verified credit reconciliation and audit exports, Enterprise: warehouses, APIs, private adapters and SSO. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**12. Marketplace / Platform:** No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply.. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**13. Monetization:** Subscription by tracked package volume, Carrier anomaly dashboard package, Claims preparation subscription add-on, Proof-of-delivery incident bundle, Shipping invoice audit, Premium carrier comparison reports, API usage tier after authorized commercialization. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**14. Distribution:** Organic educational guides about shipping exceptions, Anonymized sample parcel exception report, Merchant communities and fulfillment operators, Authorized ecommerce integration ecosystems, Operations consultants, 3PL referral arrangements subject to approval, Customer support workflow examples. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**15. Automation:** Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track, Receive event → dedupe/order → evaluate exception rules → attach raw evidence, Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason, Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization, Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value, Support triage → approved customer messaging without inferring compensation, Carrier outage → preserve last event time → mark stale → pause eligibility claims. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**16. Human-Intervention Elimination:** Remove manual repetition only for permissioned routines. Protected human-only decisions: Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission, No money out under any execution path, Protect carrier credentials and customer PII; provide minimized exports, Do not auto-accept carrier terms, disputes or releases, Separate expected recovery and realized credit.


**17. Moats:** Versioned per-carrier policy corpus with expiry checking, Real carrier claim outcome/denial calibration without cross-customer leakage, Shipment event state accuracy, Verified credit reconciliation and audit traceability, Carrier exception taxonomy, Root-cause accuracy and merchant workflow integrations. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**18. Security:** Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission, No money out under any execution path, Protect carrier credentials and customer PII; provide minimized exports, Do not auto-accept carrier terms, disputes or releases, Separate expected recovery and realized credit, Avoid hidden costs from premium tracking providers or high-frequency polling. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**19. Privacy:** Tenant carrier account identifier, Shipment and package stable IDs, Service level and its rule effective dates, Raw timestamped tracking events, Normalized state with correction ledger, Merchant order pointer with minimal PII, Delivery promise vs estimate classification. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**20. Compliance:** Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission, No money out under any execution path, Protect carrier credentials and customer PII; provide minimized exports, Do not auto-accept carrier terms, disputes or releases, Separate expected recovery and realized credit, Avoid hidden costs from premium tracking providers or high-frequency polling. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**21. Failure / Edge Cases:** Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces, Mis-scanned proof of delivery, Weather/holiday exclusion. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**22. Internationalization:** DTC ecommerce, Apparel/beauty/home goods, Subscription products, Specialty retail, B2B spare parts, Local maker brands shipping nationally, Multi-warehouse operations. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**23. Scale:** Scale by measured real workload; avoid automatic paid infrastructure. Future paths: Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker, Multi-country customs handoff.


**24. Future Technology:** Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker, Multi-country customs handoff, Customer-side estimated delivery communication templates. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**25. Cross-Company Synergy:** Potential compatibility only, not authorization to mix credentials or assets: Existing company #087 Marketplace Payout Reconciliation for ledger concepts only, Existing company #085 Revenue Leakage Detection for anomaly baseline after proof, Existing company #086 Payment Reconciliation for settlement matching after financial-scope review, Existing company #071 Webhook Reliability for connector patterns, Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility, Command Center durable events, identity, audit and financial governor interfaces only.


**26. Spinoffs:** Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker, Multi-country customs handoff, Customer-side estimated delivery communication templates. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**27. Adversarial Missing-Idea Pass:** Adversarial counterexamples and missing branches: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces, Mis-scanned proof of delivery, Weather/holiday exclusion, Wrong merchant carrier account, Carrier event timezone ambiguity, Carrier data lag. Treat every case as a test/acceptance or explicit controlled exclusion, not an automatic feature.


**28. Saturation Pass:** Saturation draft outcome: domain list, risks, future packs and boundary reviewed. Additional material ideas must pass relevance, business value, compatibility, economic, safety and source verification: Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker, Multi-country customs handoff, Customer-side estimated delivery communication templates, Multi-carrier package insurance comparison only as recommendations. Independent reviewer signoff is still required.


# A–BZ 78-dimension conformance candidate map

Every dimension below has company-specific proposed evidence, but independent verification has **not** occurred and no percent is earned. Final statuses belong to the exact-head Command Center conformance audit.

**A — Business Identity:** Mission: Help eligible merchants identify delivery exceptions, reconcile carrier promises and policies, and prepare evidence-backed shipping-credit/refund claims without initiating unauthorized financial transactions. Differentiation: Carrier/service-specific entitlement determination with explicit unknowns, human approval of claims, robust evidence trails and merchant/customer experience automation. Boundary: No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply.


**B — Complete Product Tree:** Product areas: Carrier tracking unification, Shipment import and dedupe, Carrier-service rule registry, Delivery exception dashboard, Lost/stalled parcel detection. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**C — Complete Feature Tree:** Behavior and controls: Event normalization with source event IDs, Out-of-order and delayed event handling, Tracking number checksum/format validation, Shipment/carrier/account identity pinning, Canonical status state machine with terminal state monotonicity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**D — Complete Customer Tree:** Customer groups: Ecommerce merchants, Subscription-box retailers, Wholesale shippers, 3PL fulfillment operators, Small warehouse teams. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**E — Complete Vertical Tree:** Vertical packs: DTC ecommerce, Apparel/beauty/home goods, Subscription products, Specialty retail, B2B spare parts. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**F — Complete Brain Capability Tree:** Specialist reasoning: Carrier event sequence interpretation with raw-evidence grounding, Service-level commitment classifier, Policy/eligibility explanation from currently verified rule version, Shipping exception triage and prioritization, Customer-impact classification. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**G — Brain Architecture:** Brain domain packs: Carrier event sequence interpretation with raw-evidence grounding, Service-level commitment classifier, Policy/eligibility explanation from currently verified rule version, Shipping exception triage and prioritization, Customer-impact classification. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**H — Complete Agent Tree:** Agent specialisms: Carrier connector agent, Tracking event reconciler, Service policy research agent, Eligibility evaluator, Claim evidence builder. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**I — Deterministic Services:** Deterministic components: Carrier connector SDK, Tracking event ingestion queue, Idempotent event journal, Shipment state machine, Tracking/cost rate limiter. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**J — Input Tree:** Accepted inputs: Merchant shipment manifest, Tracking numbers, Carrier identity, Service class, Ship date and label purchase date. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**K — Output Tree:** Produced outputs: Canonical shipment status and source link, Exception alert, Eligibility assessment with rules version, Claim evidence packet, Submission approval request. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**L — Workflow Tree:** Operational workflows: Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track, Receive event → dedupe/order → evaluate exception rules → attach raw evidence, Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason, Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization, Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**M — Integration Tree:** Connector surfaces: USPS developer tracking APIs when supported, UPS tracking/claims only under appropriate account/license, FedEx tracking/claims only under appropriate account/license, DHL tracking/claims only under appropriate account/license, ShipStation/Shippo/EasyPost via authorized customer integrations. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**N — API/Developer Ecosystem:** Developer/API seams: USPS developer tracking APIs when supported, UPS tracking/claims only under appropriate account/license, FedEx tracking/claims only under appropriate account/license, DHL tracking/claims only under appropriate account/license, ShipStation/Shippo/EasyPost via authorized customer integrations. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**O — Data Architecture:** Scoped schemas: Tenant carrier account identifier, Shipment and package stable IDs, Service level and its rule effective dates, Raw timestamped tracking events, Normalized state with correction ledger. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**P — Data Moat:** Defensible domain data: Versioned per-carrier policy corpus with expiry checking, Real carrier claim outcome/denial calibration without cross-customer leakage, Shipment event state accuracy, Verified credit reconciliation and audit traceability, Carrier exception taxonomy. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**Q — IP:** Ownable know-how: Versioned per-carrier policy corpus with expiry checking, Real carrier claim outcome/denial calibration without cross-customer leakage, Shipment event state accuracy, Verified credit reconciliation and audit traceability, Carrier exception taxonomy. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**R — Monetization:** Potential revenue models: Subscription by tracked package volume, Carrier anomaly dashboard package, Claims preparation subscription add-on, Proof-of-delivery incident bundle, Shipping invoice audit. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**S — Packaging:** Offers: Starter: CSV tracking and exception reports, Operations: multi-carrier feeds and exception notifications, Recovery: eligibility/claim packet preparation with approvals, Finance: verified credit reconciliation and audit exports, Enterprise: warehouses, APIs, private adapters and SSO. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**T — Distribution:** Distribution paths: Organic educational guides about shipping exceptions, Anonymized sample parcel exception report, Merchant communities and fulfillment operators, Authorized ecommerce integration ecosystems, Operations consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**U — Acquisition Automation:** Acquisition possibilities: Organic educational guides about shipping exceptions, Anonymized sample parcel exception report, Merchant communities and fulfillment operators, Authorized ecommerce integration ecosystems, Operations consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**V — Customer Lifecycle:** Customer journey: Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track, Receive event → dedupe/order → evaluate exception rules → attach raw evidence, Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason, Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization, Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**W — Support:** Support functions: Carrier connector agent, Tracking event reconciler, Service policy research agent, Eligibility evaluator, Claim evidence builder. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**X — Customer Success:** Customer success outcomes: Tracked package event freshness, Late delivery exception precision, Eligible claim identification accuracy vs current policies, Claim packet completeness, Claim acceptance/denial rate. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**Y — Automation Maximum:** Safe automation paths: Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track, Receive event → dedupe/order → evaluate exception rules → attach raw evidence, Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason, Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization, Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**Z — Human-Intervention Minimum:** Automate repeatable approved operations while requiring human approval for consequential actions. Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission, No money out under any execution path


**AA — Operations:** Operation units: Carrier connector SDK, Tracking event ingestion queue, Idempotent event journal, Shipment state machine, Tracking/cost rate limiter. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AB — Administration:** Administration and evidence: Carrier connector SDK, Tracking event ingestion queue, Idempotent event journal, Shipment state machine, Tracking/cost rate limiter. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AC — Security:** Security-related boundaries: Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission, No money out under any execution path, Protect carrier credentials and customer PII; provide minimized exports, Do not auto-accept carrier terms, disputes or releases. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AD — Privacy:** Privacy-scoped fields: Tenant carrier account identifier, Shipment and package stable IDs, Service level and its rule effective dates, Raw timestamped tracking events, Normalized state with correction ledger. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AE — Compliance:** Company-specific legal and policy review must precede activation. Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission, No money out under any execution path. Never infer legal clearance from a software pass.


**AF — Legal:** Exact protected domain boundary: No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply. Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date, Claims may carry contractual representations, so human approval before any submission. Professional/legal acceptance stays human-controlled.


**AG — Abuse/Misuse:** Abuse/misuse cases: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AH — Reliability:** Resilience cases: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AI — Observability:** Telemetry: Tracked package event freshness, Late delivery exception precision, Eligible claim identification accuracy vs current policies, Claim packet completeness, Claim acceptance/denial rate. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AJ — Incident Response:** Incident playbook triggers: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AK — Testing:** Adversarial QA cases: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AL — Brain Evaluations:** Brain evaluations: Carrier event sequence interpretation with raw-evidence grounding, Service-level commitment classifier, Policy/eligibility explanation from currently verified rule version, Shipping exception triage and prioritization, Customer-impact classification. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AM — Deployment:** Deployment gate topics: P0 Carrier/market feasibility, P1 Shipment/event state foundation, P2 Exception classification, P3 Eligibility/claim preparation, P4 Actual-credit reconciliation.


**AN — Scale:** Scale options: Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AO — Performance:** Performance measures: Tracked package event freshness, Late delivery exception precision, Eligible claim identification accuracy vs current policies, Claim packet completeness, Claim acceptance/denial rate. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AP — Cost:** Subscription by monitored parcel band, verified recovery report service, eligible-claim preparation fee, optional capped percentage of actually credited value only with lawful contract and owner approval. Resource plans are proposals only. $0 automated spend ceiling; throughput and free-tier ceilings must be measured before a public commitment.


**AQ — Financial Metrics:** Financial metrics: Tracked package event freshness, Late delivery exception precision, Eligible claim identification accuracy vs current policies, Claim packet completeness, Claim acceptance/denial rate. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AR — Moat:** Differentiators: Versioned per-carrier policy corpus with expiry checking, Real carrier claim outcome/denial calibration without cross-customer leakage, Shipment event state accuracy, Verified credit reconciliation and audit traceability, Carrier exception taxonomy. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AS — Network Effects:** Possible opt-in learning from verified, non-private evidence: Versioned per-carrier policy corpus with expiry checking, Real carrier claim outcome/denial calibration without cross-customer leakage, Shipment event state accuracy. No assumed network effects and no pooling customer data.


**AT — Platform:** Platform path: Carrier tracking unification, Shipment import and dedupe, Carrier-service rule registry, Delivery exception dashboard, Lost/stalled parcel detection. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AU — White Label/OEM:** OEM and white label decisions: Starter: CSV tracking and exception reports, Operations: multi-carrier feeds and exception notifications, Recovery: eligibility/claim packet preparation with approvals, Finance: verified credit reconciliation and audit exports, Enterprise: warehouses, APIs, private adapters and SSO. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AV — Internationalization:** Plan locale, languages, region-specific rules and formats only when there is evidence of demand: DTC ecommerce, Apparel/beauty/home goods, Subscription products. Jurisdiction-specific legality is a protected expert review.


**AW — Accessibility:** Accessibility requirements: Event normalization with source event IDs, Out-of-order and delayed event handling, Tracking number checksum/format validation, Shipment/carrier/account identity pinning, Canonical status state machine with terminal state monotonicity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AX — Mobile:** Mobile ergonomics: Event normalization with source event IDs, Out-of-order and delayed event handling, Tracking number checksum/format validation, Shipment/carrier/account identity pinning, Canonical status state machine with terminal state monotonicity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AY — Voice:** Optional voice interaction only when it improves core workflow, not a mandatory feature. Adjacent possibilities: Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only. No impersonation or audio without rights/consent.


**AZ — Multimodal:** Multimodal and structured media: Merchant shipment manifest, Tracking numbers, Carrier identity, Service class, Ship date and label purchase date. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BA — Marketplace:** No unrelated marketplace. Consider a governed partner/referral marketplace only if relevant to this company, after customer proof and separate owner approval; not in initial implementation.


**BB — Developer Ecosystem:** API/SDK contracts: USPS developer tracking APIs when supported, UPS tracking/claims only under appropriate account/license, FedEx tracking/claims only under appropriate account/license, DHL tracking/claims only under appropriate account/license, ShipStation/Shippo/EasyPost via authorized customer integrations. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BC — Partners:** Partner paths: Organic educational guides about shipping exceptions, Anonymized sample parcel exception report, Merchant communities and fulfillment operators, Authorized ecommerce integration ecosystems, Operations consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BD — Training/Certification:** Customer and staff guidance should teach safe and useful domain actions, such as Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track, Receive event → dedupe/order → evaluate exception rules → attach raw evidence. No mandatory training marketplace.


**BE — Community:** Community relevance: Organic educational guides about shipping exceptions, Anonymized sample parcel exception report, Merchant communities and fulfillment operators, Authorized ecommerce integration ecosystems, Operations consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BF — Content/Knowledge:** Knowledge and sources: USPS Developer Portal and carrier-published guarantees/claim processes; eligibility and credit deadlines require current verification for each service and account.


**BG — Experimentation:** Experimentation with control metrics: Tracked package event freshness, Late delivery exception precision, Eligible claim identification accuracy vs current policies, Claim packet completeness, Claim acceptance/denial rate. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BH — Continuous Improvement:** Continuous improvement: Carrier event sequence interpretation with raw-evidence grounding, Service-level commitment classifier, Policy/eligibility explanation from currently verified rule version, Shipping exception triage and prioritization, Customer-impact classification. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BI — Spinoffs:** Potential spinoffs: Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BJ — Cross-Sell:** Cross-sell boundaries: Existing company #087 Marketplace Payout Reconciliation for ledger concepts only, Existing company #085 Revenue Leakage Detection for anomaly baseline after proof, Existing company #086 Payment Reconciliation for settlement matching after financial-scope review, Existing company #071 Webhook Reliability for connector patterns, Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BK — Bundling:** Bundling: Starter: CSV tracking and exception reports, Operations: multi-carrier feeds and exception notifications, Recovery: eligibility/claim packet preparation with approvals, Finance: verified credit reconciliation and audit exports, Enterprise: warehouses, APIs, private adapters and SSO. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BL — Failures:** Failure catalog: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BM — Edge Cases:** Edge cases: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BN — Kill/Safe Mode:** Provide per-project and per-tenant pause, disable affected connector, queue hold, evidence-preserving incident mode. Do not pay or carry out protected actions in incident recovery. Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier


**BO — Exit/Portability:** Export and portability: Tenant carrier account identifier, Shipment and package stable IDs, Service level and its rule effective dates, Raw timestamped tracking events, Normalized state with correction ledger. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BP — Scale Vision:** Scale vision: Natural-language carrier policy questions with citations, Multimodal package damage assessment as suggestion only, Shipment risk forecasting with uncertainty, Support intent automation with consent, Tracking webhook failover and event broker. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BQ — Autonomous Mature State:** Mature automation: Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track, Receive event → dedupe/order → evaluate exception rules → attach raw evidence, Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason, Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization, Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BR — Command Center Dependencies:** Permanent authority chain: James Morgan > Command Center > this company Brain > its scoped Agency agents > deterministic tools. Isolated per-company state, independent progress, no outgoing spending.


**BS — Retrofit Risk:** Retrofit and blast risks: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BT — Phased Roadmap:** Phased build: P0 Carrier/market feasibility, P1 Shipment/event state foundation, P2 Exception classification, P3 Eligibility/claim preparation, P4 Actual-credit reconciliation.


**BU — Reuse Candidates:** Reuse candidates: Existing company #087 Marketplace Payout Reconciliation for ledger concepts only, Existing company #085 Revenue Leakage Detection for anomaly baseline after proof, Existing company #086 Payment Reconciliation for settlement matching after financial-scope review, Existing company #071 Webhook Reliability for connector patterns, Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BV — Proven Capability Dependencies:** Proof gates before reuse: Existing company #087 Marketplace Payout Reconciliation for ledger concepts only, Existing company #085 Revenue Leakage Detection for anomaly baseline after proof, Existing company #086 Payment Reconciliation for settlement matching after financial-scope review, Existing company #071 Webhook Reliability for connector patterns, Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BW — Company-Specific Capabilities:** Company-unique capabilities: Carrier event sequence interpretation with raw-evidence grounding, Service-level commitment classifier, Policy/eligibility explanation from currently verified rule version, Shipping exception triage and prioritization, Customer-impact classification. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BX — External Dependencies to Internalize:** External-to-internalize candidates: USPS developer tracking APIs when supported, UPS tracking/claims only under appropriate account/license, FedEx tracking/claims only under appropriate account/license, DHL tracking/claims only under appropriate account/license, ShipStation/Shippo/EasyPost via authorized customer integrations. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BY — Blast-Radius Requirements:** Blast radius: Carrier suspended delivery guarantee, Carrier does not provide free tracking on chosen tier, No supported carrier claims API, Tracking number reused across years, Packages with multiple pieces. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BZ — Version/Compatibility Requirements:** Versioned contracts: Tenant carrier account identifier, Shipment and package stable IDs, Service level and its rule effective dates, Raw timestamped tracking events, Normalized state with correction ledger. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


## Adversarial missing-idea and saturation conclusion — provisional

A relevance-based red-team pass examined 22 failure modes, 13 future capability candidates, 37 product candidates, 20 Brain capabilities, and 17 Agent roles for this domain.

Any new idea must be tested against these gates:
- Improves verified customer outcome, reliability, safety, effectiveness, operating cost, accessibility or sustainable revenue for this exact company
- Is compatible with its legal/technical boundaries and with Command Center authority
- Has a documented business hypothesis and measurable acceptance criteria; no deceptive claims or fabricated demand
- Can be planned now and implemented later without breaking tested architecture; use plugin/contract seams instead of speculative build
- Avoids redundant features and unproven cross-company reuse; preserves source and private customer isolation
- All protected changes and outgoing money remain owner-authorized; no automatic reinvestment


This is an exhaustive **planning candidate** at the present snapshot, not proof that all possible future inventions have been discovered, all 106 checks are accepted, or a working company exists.

## Explicit exclusions / not-now
- No promise of guaranteed profit, instant autonomous revenue, or legal/compliance certification.
- No cross-company sharing of raw customer files or private reasoning/memory.
- No speculative infrastructure purchases or free-trial enrollments.
- No creation or operation of a live business just because a roadmap has been produced.


## Final truth and authorization statement

Company is proposed only. No GitHub write, Supabase migration, project button, registered Brain/Agent, external customer operation, account activation, deployment, publishing, purchase, financial transfer, refund, reinvestment, marketing send or customer outreach has been performed or authorized by this document.
