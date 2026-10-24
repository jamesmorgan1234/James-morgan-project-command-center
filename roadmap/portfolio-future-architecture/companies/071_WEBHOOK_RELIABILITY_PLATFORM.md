# Company 071 — Webhook Reliability Platform

**Company ID:** `company:future:071`  
**Primary project:** `project:company:future:071`  
**Roadmap version:** `COMPANY-071-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer event delivery or external endpoint mutation.

## Business identity
Purpose: make event delivery dependable through authenticated sending/receiving, retries, ordering, deduplication, replay, transformation and observable delivery evidence.

## Product tree
Inbound Webhook Gateway; Outbound Delivery Service; Signing/Verification; Endpoint Registry; Retry/Backoff; Dead-Letter Queue; Replay Console; Dedup/Idempotency; Ordering/Sequencing; Schema Registry; Event Versioning; Transform/Filter/Route; Fan-Out; Rate Limiting; Endpoint Health; Secret Rotation; Delivery Logs; Alerting; Sandbox/Event Simulation; Developer Portal; Connector/Event Marketplace; SDKs; Enterprise/Private Deployment.

## Feature/customer/vertical tree
Features: event ID/type/version, producer, tenant, payload hash, schema, sequence/partition, endpoint, signing key ref, attempt count, next retry, status, response code, latency, dedup key, retention, replay source, transform version and evidence.
Customers: SaaS, APIs, ecommerce, fintech infrastructure, marketplaces, developer platforms, integration vendors and enterprises.
Verticals: payment events, commerce/order events, identity/security events, AI/agent events, CRM/support, IoT and internal event-driven systems.

## Brain capability / architecture
Mostly deterministic. Brain may diagnose endpoint failures, recommend retry/routing changes and summarize delivery incidents. Architecture: durable event log, endpoint registry, schema/version registry, queue/scheduler, delivery workers, signer/verifier, retry policy, DLQ, idempotency store, ordering partitions, transform runtime, health/observability and secret-reference vault integration.

## Agent tree
Endpoint Health Agent; Delivery Incident Agent; Schema/Drift Agent; Retry Optimization Agent; Support/Diagnostic Agent; Connector Curator; Security QA Agent.

## Deterministic services
HMAC/signature verification; idempotency keys; ordered partitions; exponential backoff/jitter; retry ceilings; circuit breakers; DLQ; replay guards; rate limits; transform sandbox; secret rotation references; exact delivery receipts.

## Workflow
Event accepted → authenticate/validate schema → append durable event → assign partition/sequence → transform/filter → enqueue endpoint deliveries → sign/send → record response → retry with policy or DLQ → health/circuit-break as needed → operator/policy-approved replay → reconcile final status/evidence.

## Integrations / API / data
Producer apps, APIs, billing, commerce, identity, agent systems, queues/event buses, observability/SIEM. Data: events, schemas, endpoints, attempts, receipts, DLQ, health, transforms and secret references.

## Monetization / distribution
Events delivered, endpoints, retention, replay volume, transformations, enterprise/private, SDK/API and premium observability. Distribution via developer/integration ecosystems and cloud marketplaces.

## Security/privacy/compliance
Verify signatures, tenant isolate payloads, encrypt data, minimize retention, protect signing secrets, prevent SSRF/internal-address abuse, sanitize transformations, replay authorization and audit key rotations.

## Failure / edge cases
Endpoint timeout, 2xx with wrong semantics, duplicate producer event, out-of-order delivery, endpoint DNS/IP change, secret rotation overlap, schema change, poison event, replay storm, rate-limit cascade, regional outage, huge payload, receiver outage for days.

## Scale / overlap
App webhook helper → enterprise event delivery → webhook/event reliability infrastructure. Overlap Command Center event bus/outbox, #72 API drift, #73 secret rotation. #071 owns external event delivery semantics.

## Classification
**DESIGN NOW:** event IDs/versioning, idempotency, durable queue/outbox, retry/DLQ, signed receipts, secret refs, replay policy.  
**BUILD NOW:** Command Center command/event runtime should use these reliability patterns internally.  
**BUILD BEFORE FIRST COMPANY:** multi-tenant endpoint/worker platform and external developer API.  
**COMPANY-SPECIFIC LATER:** commercial UI/connectors/pricing.  
**SCALE-ONLY:** globally distributed event delivery network.

# Mandatory 24-part completion block
1. Product Tree: inbound/outbound/sign/endpoint/retry/DLQ/replay/dedup/order/schema/version/transform/fanout/rate/health/rotation/logs/sandbox/portal.
2. Feature Tree: event/type/version/producer/hash/schema/sequence/endpoint/key ref/attempt/retry/status/latency/dedup/retention/transform.
3. Customer Tree: SaaS/API/ecommerce/fintech/marketplace/devplatform/integration/enterprise.
4. Vertical Tree: payment/commerce/identity/security/AI/CRM/IoT/internal events.
5. Brain Tree: diagnostics/optimization only; delivery semantics deterministic.
6. Agent Tree: endpoint/delivery/schema/retry/support/connector/security QA.
7. Service Tree: signing/idempotency/order/backoff/circuit/DLQ/replay/rate/transform/receipts.
8. Workflow Tree: accept→validate→log→sequence→transform→queue→send→retry/DLQ→replay→evidence.
9. Integration Tree: apps/APIs/billing/commerce/identity/agents/queues/observability.
10. Data Tree: events/schemas/endpoints/attempts/receipts/DLQ/health/transforms.
11. API Tree: events/endpoints/replay/schemas/logs/health.
12. Monetization Tree: events/endpoints/retention/replay/transforms/enterprise/API.
13. Distribution Tree: developer/integration/cloud/OEM.
14. Automation Tree: delivery/retry/health automatic; replay/key changes controlled.
15. Moat Tree: reliability history, connector breadth, diagnostics and scale.
16. Platform Tree: webhook service→event delivery network→integration infrastructure.
17. Risk Tree: duplicates/loss/replay abuse/SSRF/secret leak/order errors/payload privacy.
18. Scale Tree: app→enterprise→global network.
19. Spinoff Tree: schema registry/event marketplace modules; API drift and secret rotation separate.
20. Command Center Dependencies: event bus, outbox/inbox, queues, secrets, observability, incidents.
21. Design-Now Requirements: exact event/retry/idempotency/replay contracts.
22. Build-Now Requirements: ensure Command Center internal/external events share durable reliability primitives.
23. Safe-to-Defer Requirements: customer endpoint platform/global workers/commercial UI.
24. Autonomous Mature State: delivery, retry, circuit-breaking and health run automatically; humans handle unusual replay/security incidents.

## Saturation result
Further branches converge into event bus, API drift, secret rotation and integration-platform capabilities.