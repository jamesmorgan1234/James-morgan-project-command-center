# Company 109 Agency execution and dependency plan

**Project:** `project:company:future:109`

**State:** PREPARED / NO TASKS REGISTERED / NO EXECUTOR ACTIVATED

## Scheduler model

P0→P7 are ordered acceptance stages. Within a stage, design/domain/Brain/security may be split among different agents after the scope contract; independent QA integrates only after those tasks. A single agent handles dependent work when required. Every task has idempotent claim/lease/retry and durable evidence.

Resource governor caps concurrent tasks by actual workers, hardware and $0 limits. Never imply agents are unlimited or connected. Store unknown instead of guessing capacity.

## Stage gates

### P0 — Carrier/market feasibility

Scope: Choose carrier and service under known free/licensed access; document guarantee policies and actual account eligibility.

Acceptance: No code relies on unverified API/refund eligibility; synthetic examples only.

Work packets: `project:company:future:109:p0:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P1 — Shipment/event state foundation

Scope: First-class project/Brain; shipping entity and event journal; idempotent tracking adapter; authorization boundaries.

Acceptance: Out-of-order/replayed tracking tests and no credential exposure.

Work packets: `project:company:future:109:p1:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P2 — Exception classification

Scope: Service-specific exception logic, delivery clocks, advisory versions, evidence and uncertainty.

Acceptance: False-positive case evaluation and time-zone/holiday tests.

Work packets: `project:company:future:109:p2:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P3 — Eligibility/claim preparation

Scope: Current carrier policy citations, deadline system, evidence packet and separate claim approval gate.

Acceptance: No automatic filing or financial action; policy change rejects stale rules.

Work packets: `project:company:future:109:p3:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P4 — Actual-credit reconciliation

Scope: Claim receipt tracking, credits verified against statements, distinct customer refunds, accurate reporting.

Acceptance: Zero synthetic revenue, zero duplicate claim IDs and equal-credit reconciliation.

Work packets: `project:company:future:109:p4:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P5 — First merchant validation

Scope: Authorized merchant trial with shipment volume, exception burden, policy eligibility and service value evidence.

Acceptance: Actual operator feedback and first real paid evidence before scaling.

Work packets: `project:company:future:109:p5:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P6 — Carrier and platform expansion

Scope: More account-scoped carrier adapters, ecommerce and 3PL connectors, support desk integration.

Acceptance: Each carrier has separate legality, credentials, replay/coverage and financial gates.

Work packets: `project:company:future:109:p6:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P7 — Optimization and scale

Scope: Versioned event analytics, policy drift, enterprise dashboards, recovery/migration, low-cost capacity design.

Acceptance: Measured unit economics; capacity cost proposals only, never auto-spend.

Work packets: `project:company:future:109:p7:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

## Customer-protected or financial actions

- James Morgan is final human authority. Command Center is the permanent top-level AI/control authority; company Brains are subordinate; Agency/agents have narrower delegated scopes.
- No external outgoing financial transaction of any kind is autonomously authorized, including purchase, paid upgrade, payout, refund, transfer, settlement, tax payment, advertising, subscription, reinvestment, or chargeable trial; automatic spending limit is $0.
- An owner authorization for a specific outgoing financial intent must identify amount/ceiling, recipient/provider, purpose, source company/account, timing/expiration and revocation. General approval of a roadmap or build is not financial authorization.
- Automation of business logic does not create authorization to send unsolicited communications, accept contracts, publish content, create regulated decisions, access third-party accounts, or modify protected infrastructure.
- All company/customer/account/credential/data/IP/revenue boundaries are isolated by default, including from VeloClip, CrowdSkein, RevoCapture, Morgancommerce, KDP and the other 107 companies.
- Never mark simulated outcomes, test orders, opportunity value, queued refunds, or estimated savings as realized sales, realized cash, or actual recovered funds.
- Reuse only proven shared capabilities after version-compatible cross-company regression, privacy and security review; preserve forkability and blast-radius limits; follow the existing prove-three-companies rule before broad code reuse.
- A failed or unavailable vendor/source/AI provider cannot create fabricated success, coverage, safety clearance, published work, customer messages, or zero-percent progress.
- Roadmap planning is not permission to deploy, launch, onboard, contact customers, publish, pay, or mutate Supabase/GitHub.


## Domain build candidates for optional task decomposition

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


## Future capability candidates — do not make launch blockers unless necessary

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


## Test suites and evidence

For every stage: contract/schema QA, unit, integration, tenant isolation, safety, source versioning, no-spend, negative/corner, actual environment smoke and rollback; run domain fixtures:

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


## Source truth

A completed roadmap file is a planning deliverable; it is not an implemented service or a verified project percentage. Progress must derive from accepted work-unit evidence and live scope denominator.
