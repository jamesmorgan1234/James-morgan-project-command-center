# Company 057 — Fraud Detection API

**Company ID:** `company:future:057`  
**Primary project:** `project:company:future:057`  
**Roadmap version:** `COMPANY-057-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer blocking, payment denial, account suspension or fraud accusation.

## Business identity

Purpose: provide real-time and batch risk scoring for suspicious transactions, signups, account activity, promotions, marketplace behavior, returns and identity/device patterns.

Problem: fraud signals are distributed across accounts, devices, transactions and behavior; simplistic rules create false positives while adaptive attackers exploit gaps.

Value: explainable risk scores, reusable signals, graph intelligence and policy-ready decisions while leaving irreversible enforcement behind explicit customer policy/authorization.

## Complete product tree

Transaction Risk API; Signup Risk API; Account-Takeover Detection; Device/Session Risk; Promotion/Abuse Detection; Bot/Automation Detection; Marketplace Fraud; Returns/Refund Abuse; Chargeback Risk; Identity/Entity Risk; Graph Risk Engine; Velocity Rules; Behavioral Anomaly Engine; Watchlist/Policy Rules; Case Management; Feedback/Labeling; Fraud Analytics; Simulation/Backtesting; Decision API; SDKs; Edge/Streaming Scoring; Enterprise/Private Deployment; Vertical Fraud Packs.

## Feature/customer/vertical tree

Features: identity/device/session/payment/account/entity features, IP/network context, velocity, geolocation consistency, graph relationships, behavioral sequences, transaction amount/currency, merchant/product/channel, historical outcomes, rule hits, model scores, confidence, reason codes, thresholds, challenge/review recommendations, feedback labels, drift and false-positive analysis.

Customers: ecommerce, fintech infrastructure, marketplaces, SaaS, subscription businesses, gaming, ticketing, delivery, travel, digital goods, loyalty/promotion programs, enterprise security teams and platform developers.

Verticals: payments/commerce, account security, marketplaces, digital content, travel, ticketing, gaming, subscriptions, advertising/promo systems. Each requires separate fraud taxonomies, labels and regulation/policy boundaries.

## Brain capability tree / architecture

Brain may analyze cases, synthesize evidence and recommend investigations. Core scoring should combine deterministic rules, graph algorithms, statistical/ML models and calibrated confidence. LLMs may summarize evidence but must not be sole fraud classifiers for high-impact decisions.

Architecture: low-latency feature service, event stream, identity/device/entity graph, rules engine, model registry/router, scoring service, case store, feedback labels, drift monitoring, simulation/backtest, privacy controls, decision policy adapter and audit/provenance.

## Agent tree

Signal Collector; Identity/Device Agent; Graph Analyst; Behavioral Analyst; Transaction Risk Agent; Promotion Abuse Agent; Case Investigator; Rule/Model QA Agent; Drift Agent; Feedback/Label Agent; Fraud Operations Assistant; Incident/Security Agent.

## Deterministic services

Feature extraction; velocity counters; graph traversal; duplicate/entity resolution; rule evaluation; thresholding; model serving; calibration; reason-code mapping; rate limiting; idempotency; streaming/batch scoring; feedback ingestion; retention; protected enforcement hooks.

## Workflow tree

Event/request → authenticate tenant → collect/derive allowed features → evaluate rules/graph/models → combine/calibrate score → produce reason codes + recommended action class → customer policy chooses allow/challenge/review/block → enforcement only through customer-authorized system → outcome/chargeback/appeal feedback → model/rule monitoring and retraining governance.

## Integrations / API / data

Payments, ecommerce, identity/auth, device intelligence, account systems, marketplace/order platforms, chargeback/returns systems, support/case management, data warehouses and event streams. APIs for score, batch score, features, cases, labels, rules, models and analytics.

Data: events, identities, devices, accounts, transactions, relationships, scores, rule hits, outcomes, appeals and labels. Sensitive personal/financial data requires minimization, jurisdiction controls and isolation.

## Monetization / distribution

Per API call/event, monthly active users/accounts, transactions, feature volume, enterprise/private, premium graph/device packs, case seats, managed fraud ops. Distribution through payment/ecommerce/identity marketplaces and developer/fintech ecosystems.

## Security/privacy/compliance

High-impact decisions require explainability, appeal/human review options where applicable, bias/fairness testing, privacy minimization and strict secret/tenant isolation. Do not label people criminals; score behavior/risk under customer policy. Regional consumer/financial rules must be respected.

## Failure / edge cases

New-user cold start, shared household/device, VPN/proxy, travel, accessibility automation, high-value legitimate purchase, synthetic identity, mule networks, coordinated marketplace rings, bot adaptation, feedback poisoning, label delay, concept drift, sparse data, provider outage. False-positive/false-negative tradeoffs must be explicit.

## Scale / overlap

Single API → multi-signal fraud platform → real-time risk infrastructure. Overlap #44 chargeback recovery, #57 owns detection/scoring, #66 AI runtime security, #91 identity/trust authority. Fraud-company data cannot casually feed other projects.

## Classification

**DESIGN NOW:** event identity, tenant isolation, confidence/reason codes, policy-vs-score separation, feedback/evaluation, privacy and model versioning.  
**BUILD NOW:** Command Center risk/security engines should preserve generic scoring/evidence hooks without importing customer fraud data.  
**BUILD BEFORE FIRST COMPANY:** low-latency feature/rules/model serving, graph, drift/evaluation and case infrastructure.  
**COMPANY-SPECIFIC LATER:** fraud models, data providers, vertical packs, customer enforcement connectors, pricing.  
**SCALE-ONLY:** global graph/stream infrastructure and privacy-safe consortium signals.

# Mandatory 24-part completion block

1. Product Tree: transaction/signup/ATO/device/promo/bot/marketplace/returns/chargeback/identity/graph/rules/behavior/cases/analytics/backtest/API.
2. Feature Tree: identity/device/network/velocity/graph/behavior/transaction/history/model/reasons/thresholds/feedback/drift.
3. Customer Tree: ecommerce/fintech/marketplace/SaaS/gaming/ticketing/delivery/travel/digital/subscription/enterprise.
4. Vertical Tree: payments/commerce/accounts/marketplaces/content/travel/tickets/gaming/subscriptions/promotions.
5. Brain Tree: evidence/case analysis; core scoring uses calibrated rules/graph/ML, not unsupported LLM judgment.
6. Agent Tree: signals/identity/graph/behavior/transaction/promo/case/QA/drift/feedback/ops/security.
7. Service Tree: features/velocity/graph/entity/rules/model/calibration/reasons/rate limit/idempotency/feedback.
8. Workflow Tree: event→features→score→reasons→policy decision→authorized enforcement→outcome feedback→monitor.
9. Integration Tree: payments/commerce/auth/device/account/marketplace/chargeback/returns/support/warehouse/streams.
10. Data Tree: events/identities/devices/accounts/transactions/relations/scores/outcomes/appeals/labels.
11. API Tree: score/batch/features/cases/labels/rules/models/analytics.
12. Monetization Tree: calls/events/MAU/transactions/features/enterprise/case seats/managed.
13. Distribution Tree: payments/ecommerce/identity marketplaces/developer/fintech partners.
14. Automation Tree: scoring/monitoring automated; high-impact enforcement remains customer-policy controlled.
15. Moat Tree: labeled outcomes, graph intelligence, calibrated models, vertical fraud packs, integration breadth.
16. Platform Tree: scoring API→fraud OS→real-time trust/risk infrastructure.
17. Risk Tree: bias/false positives/privacy leak/model drift/feedback poisoning/attacker adaptation.
18. Scale Tree: API→platform→global streaming graph.
19. Spinoff Tree: device intelligence/graph risk may become modules; identity/trust and chargeback products remain separate.
20. Command Center Dependencies: model/evaluation registry, privacy, risk policy, event bus, low-latency APIs, isolation, observability.
21. Design-Now Requirements: calibrated-score/reason/evidence/policy-separation and model-version interfaces.
22. Build-Now Requirements: preserve reusable risk-scoring/evaluation hooks in shared security/Brain infrastructure.
23. Safe-to-Defer Requirements: fraud datasets/models/provider connectors/customer enforcement/pricing.
24. Autonomous Mature State: signals/models/rules monitor and score continuously; humans focus on novel rings, appeals and policy changes.

## Saturation result

Further branches converge into identity/trust, runtime security, chargeback or specialized abuse modules already represented elsewhere.