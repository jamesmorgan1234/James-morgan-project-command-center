# Company 010 — Subscription Revenue Recovery Platform

**Company ID:** `company:future:010`  
**Primary project:** `project:company:future:010`  
**Roadmap version:** `COMPANY-010-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no payment collection, customer communication or retention offer execution.

## Business identity

Purpose: recover otherwise-lost recurring revenue by detecting payment risk, coordinating compliant retries/dunning, reducing involuntary churn, identifying voluntary churn risk, and measuring verified recovered value.

Problem: recurring businesses lose revenue to failed payments, stale cards, poor retry timing, confusing communications, unnecessary cancellations and weak win-back workflows.

Value: deterministic payment-state orchestration plus predictive/behavioral assistance, with customer-respectful controls and clear recovery attribution.

Delivery: SaaS, billing-provider apps, API/SDK, managed recovery workflows, enterprise/private data mode, embedded/OEM retention modules.

## Product tree

- Payment Failure Monitor.
- Smart Retry Scheduler — provider/rule/issuer response-aware, bounded and compliant.
- Dunning Communications Orchestrator — email/SMS/in-app with consent/channel rules; execution protected.
- Payment Method Update Portal / hosted link integration.
- Involuntary Churn Prevention.
- Voluntary Churn Risk Signals — usage/engagement/support/plan context.
- Cancellation Save Flow — reason capture, pause/downgrade/options; no dark patterns.
- Retention Offer Engine — policy constrained, profitability/fairness-aware.
- Win-Back Campaign Planner — consent-aware, not spam.
- Revenue Recovery Analytics — recovered/at-risk/lost attribution.
- Segment/Benchmark Analytics — privacy-safe.
- Subscription Health API.
- Recovery Experimentation — retry/message/offer tests with guardrails.
- SaaS, memberships, media/subscription commerce vertical packs.
- Enterprise Multi-Brand/Entity Console.
- White-label/OEM recovery engine.

## Feature/customer/vertical trees

Features: payment event normalization, decline taxonomy, retry windows, card/account update status, grace periods, account state, contact consent, message templates, throttles, time zones, plan/value/margin, churn reason, usage health, experiment assignment, holdouts, customer journey, recovery attribution, refund/chargeback awareness, audit, approval, data export/delete.

Customers: SaaS, subscription ecommerce, media/membership, marketplaces with recurring fees, apps, service subscriptions, education/communities, enterprise recurring-revenue products.

Verticals: B2B SaaS, B2C apps, memberships, creator/community subscriptions, subscription boxes, media/content, recurring professional services. Highly regulated payments/credit/insurance require specialized constraints and may be unsuitable without compliance review.

## Brain capability tree / architecture

Brain knows account/subscription/payment/engagement/support context within allowed scope. It reasons about failure type and retention likelihood, predicts churn/recovery probability, optimizes retry/message/offer within hard limits, recommends save/win-back actions, monitors outcomes. It cannot move money, change contracts, send communications or grant discounts outside deterministic policy/authorization.

Architecture: payment event state machine, retry rules, subscription ledger, consent/notification engine, experimentation/causal analysis, churn models, time-series features, LLM for message draft/explanation/support signal extraction only, policy engine for offers/contact frequency/fairness.

## Agent tree

Payment Failure Analyst, Retry Optimizer, Dunning Planner, Churn Analyst, Retention Offer Analyst, Win-Back Planner, Experiment Agent, Customer Experience/Policy Agent, Revenue Attribution Agent, Integration Health Agent, Support Signal Agent, Privacy/Consent Agent, Finance Reconciliation Agent.

## Deterministic services

Payment webhook normalization; idempotent event ledger; retry scheduler; billing-provider connectors; entitlement/subscription state; consent/preferences; communication queue; offer/policy rules; experiment assignment; attribution engine; payment method update link/session; audit; rate/contact limiter; reconciliation.

## Inputs / outputs / workflows

Inputs: billing/payment events, subscription state, account value/margin, consent, usage/engagement, support signals, plan/contracts, owner policies.

Outputs: retry schedules, recommended messages/offers, account tasks, risk scores, recovered-revenue evidence, churn/retention analytics.

Involuntary workflow: failure event → classify → customer/account state → retry policy → retry/notification authorization → execute through billing/comms provider → verify state → recover/grace/cancel/escalate → attribution.

Voluntary workflow: risk → evidence/features → recommendation → permitted intervention/offer → customer choice → verify retention/churn → experiment attribution.

## Integrations / API

Stripe-like billing/payment providers, subscription platforms, app stores where data accessible, CRM, support, product analytics, email/SMS/in-app notification, accounting/BI, entitlement systems, data warehouses. API for subscription health, recovery state, retry recommendation, churn score, offer eligibility, recovery attribution.

## Data / moat

Payment/decline history, retry outcomes, subscription state, engagement features, consent, intervention/offer outcomes, experiment holdouts, support/churn reasons, recovery attribution. Moat from cross-provider retry/retention outcome knowledge and reliable attribution, with customer data isolated and aggregate benchmarks privacy-safe.

## Monetization / distribution

Subscription + recovered-revenue volume, percentage of verified recovered revenue (transparent), accounts/subscriptions monitored, events, enterprise, white-label/OEM, analytics benchmarks, managed optimization. Distribution through billing/payment marketplaces, SaaS ecosystems, revops/finance partners, subscription platforms.

## Security/privacy/compliance

Do not store raw card data unless certified/required; prefer provider tokens/refs. Consent and communication frequency rules. No manipulative cancellation traps. Secure account data, customer isolation, financial audit/reconciliation, protected discounts/refunds/plan changes. Regional consumer/subscription laws require policy packs and specialist review.

## Failure / edge cases

Duplicate payment webhooks, late success after cancellation, retry storms, provider outage, hard decline, fraud/chargeback, customer already paid elsewhere, plan change race, consent revoked, stale usage signal, unfair offer segmentation, attribution double-counting. Use idempotency, state locks, retry caps, provider reconciliation, holdouts and conservative policy.

## Scale / platform / spinoffs

Micro: hundreds subscriptions. ~$100K ARR: provider apps/automated dunning. ~$1M: multi-brand/enterprise analytics. ~$10M: cross-provider optimization/benchmarks. ~$100M+: subscription revenue operations platform if economics/compliance support.

Overlap #18 churn prevention, #85 revenue leakage, #86 payment reconciliation, #69 billing infrastructure. #010 stays focused on recurring-revenue recovery lifecycle.

## Classification

**DESIGN NOW:** financial-action classes, idempotent payment events, consent/comms policy hooks, evidence/attribution, cost/value metrics, billing-provider abstraction.  
**BUILD NOW:** Command Center finance/policy/event primitives after reverse-map only.  
**BUILD BEFORE FIRST COMPANY:** billing/entitlement integration seam, company financial isolation, communication consent abstraction.  
**COMPANY-SPECIFIC LATER:** retry/churn models, customer portal/messages/offers/pricing.  
**SCALE-ONLY:** cross-provider benchmarks and large enterprise orchestration.

# Mandatory 24-part completion block

1. **Complete Product Tree:** failure monitor, retries, dunning, payment update, involuntary/voluntary churn, cancellation save, offers, win-back, analytics/benchmarks, health API, experiments, vertical/enterprise/OEM.
2. **Complete Feature Tree:** event taxonomy, schedules, consent, messages, grace/account/plan, margin, churn/usage, experiments, attribution, audit/export.
3. **Complete Customer Tree:** SaaS, subscription commerce, media/membership, apps, recurring services/enterprise.
4. **Complete Vertical Tree:** B2B/B2C SaaS, memberships, communities, boxes, media, services; regulated sectors gated.
5. **Complete Brain Capability Tree:** recovery/churn prediction and constrained optimization; no unauthorized money/comms/discount execution.
6. **Complete Agent Tree:** payment/retry/dunning/churn/offers/winback/experiment/CX/attribution/integration/support/privacy/reconcile.
7. **Complete Service Tree:** webhook ledger, retry, billing connectors, subscription/entitlement, consent, communications, policy, experiments, attribution, update-session, audit/reconcile.
8. **Complete Workflow Tree:** failure→classify→retry/contact→verify→recover/cancel; risk→intervention→outcome→attribution.
9. **Complete Integration Tree:** billing/payment/subscription/CRM/support/analytics/comms/accounting/BI/entitlement/warehouse.
10. **Complete Data Tree:** payment/subscription/engagement/consent/intervention/offer/experiment/support/attribution.
11. **Complete API/Developer Tree:** health/recovery/retry/churn/eligibility/attribution APIs/webhooks.
12. **Complete Monetization Tree:** subscription, monitored accounts/events, recovered-value share, enterprise/OEM/benchmarks/managed.
13. **Complete Distribution Tree:** billing marketplaces, SaaS/revops/finance partners, subscription platforms.
14. **Complete Automation Tree:** event handling/retries/risk/offer recommendations/attribution/reconciliation; protected actions gated.
15. **Complete Moat Tree:** retry/outcome corpus, provider normalization, churn signals, attribution reliability.
16. **Complete Platform Tree:** dunning → retention/recovery → subscription revenue operations.
17. **Complete Risk Tree:** payment/PII, duplicate retries, unfair offers, consent, dark patterns, attribution errors, provider failures.
18. **Complete Scale Tree:** small subscriber base → multi-brand enterprise → cross-provider platform.
19. **Complete Spinoff Tree:** adjacent existing #18/#69/#85/#86 preferred.
20. **Command Center Dependencies:** finance/policy, event/idempotency, consent/comms, company isolation, billing/entitlement, analytics.
21. **Design-Now Requirements:** financial event/action and consent/attribution contracts.
22. **Build-Now Requirements:** generic billing/financial/communication policy seams after reverse-map.
23. **Safe-to-Defer Requirements:** customer recovery product, messages/models/offers/provider integrations/pricing.
24. **Autonomous Mature State:** failures/retries/risk/attribution run continuously within policy; customers self-update payment; James handles strategic/protected finance/comms decisions.

## Saturation result

Additional branches map to churn, revenue leakage, billing or reconciliation companies already present. No new top-level company is required.
