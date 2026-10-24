# Company 069 — Usage Billing Infrastructure

**Company ID:** `company:future:069`  
**Primary project:** `project:company:future:069`  
**Roadmap version:** `COMPANY-069-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no charging, invoicing, refunding, payment-method mutation or customer financial action.

## Business identity
Purpose: meter modern software/AI consumption and deterministically convert verified usage into pricing, balances, invoices, limits and revenue evidence.

## Product tree
Event Metering API; Usage Ledger; Meter/Dimension Registry; Aggregation Engine; Pricing Catalog; Tier/Volume/Graduated Rules; Credits/Prepaid Balances; Quotas/Caps; Minimum Commitments; Bundles; Trials/Promotions; Overage Engine; Entitlement Sync; Invoice Line Builder; Usage Dashboard; Customer Alerts; Forecasting; Billing Reconciliation; Revenue/Accounting Export; Webhooks; SDKs; Developer Portal; Enterprise Contract Rules; Multi-Currency/Tax Handoff; Private Deployment.

## Feature/customer/vertical tree
Features: event ID/idempotency, account/org/customer identity, meter/dimension/version, quantity/unit, timestamps, corrections, source/evidence, aggregation windows, pricing version, credits, commitments, caps, alerts, invoice periods, dispute/reconciliation and immutable adjustments.
Customers: SaaS, AI/API vendors, infrastructure companies, agent platforms, data products, marketplaces, developer tools and enterprises with internal chargeback/showback.
Verticals: tokens/models, API calls, compute, storage, bandwidth, documents, workflows, agents, devices, messages, minutes and transactions.

## Brain capability / architecture
Billing math and enforcement must be deterministic. Brain may explain bills, forecast spend, detect anomalies and suggest pricing changes but cannot invent meter events or alter charges. Architecture: append-only metering ledger, schema/version registry, stream/batch aggregation, pricing DSL, balance/credit ledger, invoice calculator, reconciliation, entitlement adapter, alerting, audit and protected financial actions.

## Agent tree
Meter Integrity Agent; Usage Anomaly Agent; Pricing Analyst; Forecast Agent; Reconciliation Agent; Invoice QA Agent; Customer Explanation Agent; Contract Configuration Agent; Revenue Ops Agent; Incident Agent.

## Deterministic services
Idempotent event ingest; meter schema validation; unit conversion; window aggregation; pricing functions; balance arithmetic; credit consumption; caps/quotas; late-event/correction handling; invoice calculation; immutable adjustments; reconciliation hashes.

## Workflow
Usage event → authenticate/source verify → idempotency/schema check → append ledger → aggregate → apply exact pricing version/contract → update credits/quotas → notify thresholds → period close → reconcile raw-to-aggregate-to-invoice → generate invoice lines/financial handoff → disputes/corrections via append-only adjustment → preserve evidence.

## Integrations / API / data
Applications, APIs, model gateways, cloud/compute systems, subscription/billing processors, accounting/ERP, tax engines, entitlement systems, data warehouses and notifications. Data: meters/events/aggregates/prices/contracts/credits/quotas/invoice lines/adjustments/reconciliation evidence.

## Monetization / distribution
Events/meters/customers/revenue volume, enterprise/private, developer plan, premium forecasting/reconciliation, managed implementation. Distribution via SaaS/AI developer ecosystems, billing/payment partners and FinOps/revenue-ops channels.

## Security/privacy/compliance
Financial integrity, signed/source-authenticated usage, tenant isolation, clock/timestamp controls, append-only adjustments, dual control for pricing changes, audit, tax handoff rather than unsupported tax advice, no hidden retroactive repricing.

## Failure / edge cases
Duplicate events, late events, clock skew, meter schema change, pricing version change mid-period, credits expiring, refunds, negative corrections, usage replay, provider outage, missing events, estimated usage, contract overrides, currency rounding, invoice dispute. Every correction must preserve lineage.

## Scale / overlap
Startup metering → enterprise billing → high-volume usage-finance infrastructure. Overlap #70 entitlements, #85 revenue leakage, #95 ROI. #069 owns measured usage→charge evidence.

## Classification
**DESIGN NOW:** stable event/idempotency IDs, append-only usage ledger, pricing/version identity, cost-center/meter dimensions, reconciliation.  
**BUILD NOW:** Command Center needs internal resource/cost telemetry and budgets even before customer billing; use compatible meter concepts now.  
**BUILD BEFORE FIRST COMPANY:** customer/tenant meter registry, pricing DSL, credits and billing reconciliation.  
**COMPANY-SPECIFIC LATER:** payment/invoice integrations and commercial pricing.  
**SCALE-ONLY:** massive streaming aggregation and multi-region billing ledgers.

# Mandatory 24-part completion block
1. Product Tree: metering/ledger/meters/aggregation/pricing/credits/quotas/commitments/bundles/trials/overage/entitlement/invoices/dashboard/alerts/forecast/reconcile/API.
2. Feature Tree: event/idempotency/customer/meter/unit/time/correction/evidence/window/price version/credits/caps/invoice/dispute.
3. Customer Tree: SaaS/AI/API/infra/agent/data/marketplace/devtools/internal chargeback.
4. Vertical Tree: tokens/API/compute/storage/bandwidth/docs/workflows/agents/devices/messages/minutes/transactions.
5. Brain Tree: explain/forecast/anomaly/recommend; math and charges deterministic.
6. Agent Tree: integrity/anomaly/pricing/forecast/reconcile/invoice QA/explanation/contracts/revenue ops/incident.
7. Service Tree: ingest/schema/units/aggregation/pricing/balances/credits/caps/corrections/invoices/hashes.
8. Workflow Tree: event→verify→ledger→aggregate→price→quota/alert→close→reconcile→invoice/adjust.
9. Integration Tree: apps/APIs/models/cloud/billing/accounting/tax/entitlements/warehouse/notifications.
10. Data Tree: meters/events/aggregates/prices/contracts/credits/quotas/invoice lines/adjustments.
11. API Tree: events/meters/usage/pricing/balance/forecast/invoice/reconcile.
12. Monetization Tree: events/meters/customers/volume/enterprise/private/managed.
13. Distribution Tree: SaaS/AI developer/billing/payment/FinOps/revenue ops.
14. Automation Tree: metering/aggregation/pricing/reconciliation automated; money movement separately protected.
15. Moat Tree: reliable event ledger, pricing DSL, correction/reconciliation engine, integrations.
16. Platform Tree: metering API→usage billing→revenue infrastructure.
17. Risk Tree: overcharge/undercharge/duplicates/missing events/rounding/retroactive rules/data leak.
18. Scale Tree: startup→enterprise→global high-volume ledger.
19. Spinoff Tree: pricing experimentation/credits/forecasting modules; entitlements and leakage remain separate.
20. Command Center Dependencies: event bus, IDs, financial governor, telemetry, tenant isolation, audit.
21. Design-Now Requirements: generic metering/cost-center/event lineage interfaces.
22. Build-Now Requirements: add resource/model/API usage telemetry compatible with future billing factory.
23. Safe-to-Defer Requirements: customer pricing/invoices/payment processors/tax/multi-region scale.
24. Autonomous Mature State: usage is metered, priced, reconciled and forecast automatically; humans approve pricing/contracts and financial exceptions.

## Saturation result
Further branches converge into entitlements, revenue leakage, pricing intelligence and payment systems already represented.