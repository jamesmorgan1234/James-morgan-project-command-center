# 111 — Billing & Entitlement Factory

**Status:** DESIGN NOW / BUILD BEFORE FIRST PORTFOLIO COMPANY  
**Current financial authorization:** none.

## Purpose
Provide reusable commercial infrastructure so future companies do not each invent incompatible subscriptions, usage metering, credits, quotas, invoices, entitlements and revenue evidence.

## Core services

1. Customer/organization billing identity.
2. Product/plan/price catalog with immutable versions/effective dates.
3. Meter registry for API calls, tokens, workflows, documents, storage, compute, seats, agents, transactions, messages, devices and domain-specific units.
4. Append-only usage ledger with idempotency/source evidence.
5. Aggregation engine.
6. Pricing rules: flat, tiered, volume, graduated, per-seat, per-location, per-transaction, prepaid credit, minimum commitment, bundles and overages.
7. Trial/promotion/discount registry.
8. Credit/prepaid balance ledger.
9. Quota/cap/alert engine.
10. Entitlement service.
11. Invoice-line builder and external billing-provider adapter.
12. Refund/credit/adjustment workflow.
13. Dunning/payment-state adapter.
14. Revenue/accounting export.
15. Reconciliation from usage → rated usage → invoice → payment/settlement.
16. Customer usage/billing portal contract.
17. Audit/evidence and dispute history.

## Entitlement contract

Subject + organization + company/product + plan/version + feature/resource + scope + quantity/limit + effective/expiry + source contract/order + override + decision reason/version. Unknown feature/account fails closed.

## Separation of concerns

- Billing determines commercial amount/state.
- Entitlements determine allowed product access.
- Resource Governor determines physical/service capacity.
- Policy Governor determines protected authority.
- Payment provider moves money only through future authorized integration.

No one subsystem can silently substitute for another.

## Provider abstraction

Payment/subscription providers are adapters. Canonical product/plan/meter/entitlement/customer state stays in Command Center/company platform. Provider-specific IDs and receipts are references, preventing vendor lock-in.

## Pricing experiments

Future capability may test price/packaging, but active customer price changes require explicit policy/contract rules and immutable effective dates. No retroactive hidden repricing.

## Free-first platform rule

Current portfolio architecture itself incurs no new paid billing provider. Build interfaces and deterministic ledger first; connect external processors only before a company launch and only when authorized.

## DESIGN NOW
Stable product/plan/meter/entitlement IDs, usage-event schema, effective-dated pricing, adjustment lineage, quota/credit semantics, provider abstraction and reconciliation.

## BUILD NOW
Use the same usage/cost telemetry shapes inside Resource and Financial Governors so later customer billing does not require a second incompatible meter system. Do not build customer checkout/payment flows now.

## BUILD BEFORE FIRST COMPANY
Customer/org billing identity, entitlements, usage ledger, plan catalog, provider adapter, invoice/payment-state reconciliation and customer usage portal.

## Acceptance
A synthetic future company can define a plan with seats + API usage + credits, meter idempotent usage, calculate charges, expose entitlements and reconcile a simulated external invoice/payment without moving real money or changing another company's billing state.