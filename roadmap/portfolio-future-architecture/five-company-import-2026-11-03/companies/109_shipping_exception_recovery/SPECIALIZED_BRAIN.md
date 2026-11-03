# Company 109 specialized Brain — Shipping Exception & Refund Recovery
**Proposed Brain ID:** `brain:company:future:109:v1`; **Project:** `project:company:future:109`; **Truth:** NOT IMPLEMENTED
## Absolute authority and action contract
- James Morgan is final human authority. Command Center is the permanent top-level AI/control authority; company Brains are subordinate; Agency/agents have narrower delegated scopes.
- No external outgoing financial transaction of any kind is autonomously authorized, including purchase, paid upgrade, payout, refund, transfer, settlement, tax payment, advertising, subscription, reinvestment, or chargeable trial; automatic spending limit is $0.
- An owner authorization for a specific outgoing financial intent must identify amount/ceiling, recipient/provider, purpose, source company/account, timing/expiration and revocation. General approval of a roadmap or build is not financial authorization.
- Automation of business logic does not create authorization to send unsolicited communications, accept contracts, publish content, create regulated decisions, access third-party accounts, or modify protected infrastructure.
- All company/customer/account/credential/data/IP/revenue boundaries are isolated by default, including from VeloClip, CrowdSkein, RevoCapture, Morgancommerce, KDP and the other 107 companies.
- Never mark simulated outcomes, test orders, opportunity value, queued refunds, or estimated savings as realized sales, realized cash, or actual recovered funds.
- Reuse only proven shared capabilities after version-compatible cross-company regression, privacy and security review; preserve forkability and blast-radius limits; follow the existing prove-three-companies rule before broad code reuse.
- A failed or unavailable vendor/source/AI provider cannot create fabricated success, coverage, safety clearance, published work, customer messages, or zero-percent progress.
- Roadmap planning is not permission to deploy, launch, onboard, contact customers, publish, pay, or mutate Supabase/GitHub.

## Mission and scope
Help eligible merchants identify delivery exceptions, reconcile carrier promises and policies, and prepare evidence-backed shipping-credit/refund claims without initiating unauthorized financial transactions.
No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply.
## Brain capabilities
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

## Specialized reasoning architecture
1. Validate actor and company-scoped delegated authority. Deny on missing token, source, policy or cost authorization.
2. Retrieve task-specific, permission-checked, timestamped evidence and domain models; label source reliability and unknown states.
3. Apply domain ontology, rules and scoped inference. Never substitute model text for official source, legal acceptance, customer consent or deterministic financial data.
4. Produce a proposal object: objective, evidence refs, alternative paths, factual confidence, model/version, risk class, proposed next actions, expected nonbinding cost and safe fallback.
5. Deterministic services validate input schemas, policy, math, version/temporal predicates and no-spend. Escalate ambiguity to human or bounded expert reviewer.
6. A separate verifier runs domain-specific regression/eval; Agency may execute only explicitly delegated work, and never a protected external action by implication.
7. Store minimal company-local checkpoint/learning evidence. Send proposed generalized knowledge upward only after Command Center validates scope, provenance and privacy.
## Evidence schema (proposed; adapt to live schemas, do not assume this is deployed)
Fields: `company_id`, `project_id`, `brain_id`, `version`, `task_id`, `source_refs[]`, `source_observed_at`, `source_validity_state`, `input_hash`, `policy_version`, `hypothesis`, `decision`, `confidence`, `abstained`, `uncertainty`, `risk`, `outbound_money_required`, `proposed_next_step`, `verification_refs[]`, `human_approval_ref?`, `rollback_ref?`.
## Deterministic services
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

## Agents and orchestration
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

Independent agents receive separate work packets with bounded tools, scopes, finite CPU/concurrency/free-tier quota. No agent becomes Command Center. Parallelize only after shared schemas/contracts are stable; integrate behind project-specific verification gates.
## Evaluation matrix
Every Brain must be evaluated on all five axes: (1) domain result accuracy against curated examples; (2) correct abstention/uncertainty on unsupported claims; (3) evidence/provenance grounding and current source versions; (4) privacy/role/owner authorization; (5) failure behavior including source outage, duplicate inputs and no-spend.
Domain eval examples:
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

Escalation and protected actions:
- Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date
- Claims may carry contractual representations, so human approval before any submission
- No money out under any execution path
- Protect carrier credentials and customer PII; provide minimized exports
- Do not auto-accept carrier terms, disputes or releases
- Separate expected recovery and realized credit
- Avoid hidden costs from premium tracking providers or high-frequency polling
- Observe carrier API terms and rate limits
- No unauthorized modifications to shipments, label purchase, rerouting or return orders

## Improvement governance
Version improvements as proposal → isolated synthetic/shadow test → independent verifier → change-impact analysis → Command Center evaluation → owner gate if protected → canary with safe rollback. A result in one Brain cannot silently overwrite others.
## Lifecycle and deployment truth
Planned Brain only; no model providers, workers or credits are assumed connected. If an AI provider is unavailable, deterministic validated modules may run where sufficient; otherwise Brain returns unavailable/blocked without implying autonomous work completed.
## Non-overlap and isolation
- Existing company #087 Marketplace Payout Reconciliation for ledger concepts only
- Existing company #085 Revenue Leakage Detection for anomaly baseline after proof
- Existing company #086 Payment Reconciliation for settlement matching after financial-scope review
- Existing company #071 Webhook Reliability for connector patterns
- Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility
- Command Center durable events, identity, audit and financial governor interfaces only

