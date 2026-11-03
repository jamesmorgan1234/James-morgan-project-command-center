# Security, Dashboards, Exceptions and Recovery Runbooks

## Commerce-local security, not global Command Center policy
- Least privilege for each commerce service. Price proposals cannot purchase, refunds cannot modify supplier truth, AI reasoning cannot grant itself tool permissions.
- Credentials secret-managed, not in code/logs/prompts; rotate/revoke suspected compromised scopes; no payment or credential activations without explicit authorization.
- Marketplace/supplier/customer inputs are untrusted data, never instructions. Verify webhook signatures, replay windows, normalized payload schemas and account scope; avoid PII in reasoning contexts.
- Preserve immutable or tamper-evident action records, source timestamps, operation identifiers and financial ledger adjustments. Detect cross-company read/write leakage, cache/search/export leakage, and unsupported scope claims.
- Security red-team categories: stolen/expired/overprivileged tokens; cross-company token use; logging secrets; forged/replayed signed webhook; malicious large/malformed payload; SQL/command injection; SSRF; package tampering; prompt injection via titles, listings, customer messages, shipping data and policy documents; inappropriate tool invocation; ledger changes; duplicate refunds/purchases; unauthorized spend; audit tampering.

## Dashboards: required views
**Executive:** gross sales (not revenue projections), settled and unsettled cash, contribution vs fully reconciled profit, active orders, returns, fees, refunds, account risk, supplier health, inventory at risk, major incidents; every figure states its time window and source freshness.

**Products:** canonical identity, package/variant match, suppliers, offers, listings by marketplace, price/cost/fees, inventory, demand/competition, product truth and restrictions, audit history.

**Supplier:** approval, inventory accuracy, unit costs, lead times, shipping, API health, defects, returns, stock freshness, concentration exposure.

**Marketplace:** listing status, restrictions, suppressed offers, API/webhook/rate-limit state, orders, settlements, performance/health alerts, last successful reconciliation.

**Inventory:** ATP by source/location, reservations, safety buffers, marketplace allocations, stock confidence, drift and zero-out incidents.

**Order/Fulfillment:** state, idempotency state, source supplier, confirmed external order, packages, carrier tracking, late delivery, exception queue, returns/cancellations.

**Finance:** gross vs net, fee breakdown, supplier expense, refunds/reimbursements/chargebacks, currency, payout records, settlement discrepancy, unknown costs, historical snapshots.

**Brain:** decision proposals, assumptions, evidence chain, uncertainty/confidence, predicted vs actual outcomes, score calibration, blocked recommendations, guardrail failures. This is commerce-local only.

**Technical:** connectors, service/queue state, API quota, retries, dead-letter events, token expiry, incident blast radius and runbook link.

## Exception Inbox
All exceptions contain: `exception_id`, type, severity P0-P3, scope, impacted SKU/order, observed timestamp, evidence references, financial/customer/account exposure, uncertainty, proposed safe containment, owner, deadline, action state, linked incident and final verified resolution. Ordinary successful work should not generate urgent notifications. P0 protects money, account or customer safety; P1 urgent; P2 scheduled review; P3 optimization.

## Runbook R01 — Supplier outage
Confirm failed service and scope; stop new commitments to supplier; preserve accepted orders; refresh available alternate approved offers; recheck exact product identity, shipping eligibility, landed cost and risks; verify existing order outcomes before any alternate supplier purchase; canary recovery and restore; update supplier reliability.

## R02 — Supplier cost feed corruption
Detect sudden price shifts/zero costs/currency changes; quarantine feed; hold repricing/activation for dependent SKUs; preserve latest trusted cost with freshness warning; verify source; recompute unit economics; simulate corrected changes; canary before unlock; incident and regression fixture.

## R03 — Marketplace API/webhook outage
Scope connector; queue/dedup events; suspend unsafe writes; keep unaffected channels separate; after restoration reconcile order feeds, price, inventory, listings and reports using watermarks; verify unknown external results before replay; audit recovered operations.

## R04 — Price catastrophe
Open pricing kill switch; halt affected writes; freeze high-risk offers; identify erroneous prices and affected order exposures; verify pricing source, currency and calculations; apply controlled correction subject to marketplace rules; test with small canary; re-enable with monitoring.

## R05 — Inventory corruption
Stop affected quantity writes and new reservations; preserve committed orders; reconstruct using verified source stock minus transactional reservations; quarantine recalled/damaged stock; reduce advertised inventory conservatively; test concurrent last-unit reservations; reconcile channel quantities; reopen after verified safety.

## R06 — Duplicate supplier purchase
Never repeat uncertain submissions; lookup external supplier order(s); isolate duplicate, preserve invoice and idempotency chain; request cancellation only when independently authorized/allowed; reconcile supplier cost and marketplace order; fix external outcome verification; retest before reactivation.

## R07 — Product recall
Verify official recall and affected variants/lots; block new offers and commitments; quarantine inventory; enumerate affected open/delivered orders; follow marketplace and legal obligations for notifications/returns/refunds; preserve evidence; reinstate only on verified lawful clearance.

## R08 — Marketplace account warning
Capture warning, its exact date/rule and affected account; inspect contributing orders, suppliers, listings, tracking, cancellations and customer cases; stop the root-risk capability where justified; prepare compliant remediation and monitor official account metrics.

## R09 — Credential compromise
Disable connector; revoke token through approved user/account action; retain security evidence; evaluate potential reads/writes and PII; rotate credentials; reconcile external state; restore minimal scopes through canary; ensure any required notification decisions follow relevant obligations.

## R10 — Settlement discrepancy
Keep expected and actual immutable; import raw settlement and source fees; match order, refund, shipping, commission, reserve, reimbursement and supplier expenses; record unresolved difference explicitly; never force difference to zero; post correcting entries with preserved audit evidence.

## R11 — AI hallucination/prompt injection
Suspend affected AI action class; preserve untrusted input, model output and validator decision; determine whether external write occurred; reconcile/contain external changes if any; add adversarial fixture; re-certify factual claim evidence and authority checks before restoring.

## R12 — Shipping loss/delay
Confirm carrier tracking and marketplace deadline; identify customer exposure; do not fabricate tracking or delivery; escalate according to marketplace policy; coordinate with authorized supplier/carrier; determine refund/claim only via permitted workflow; capture outcome for reliability scores.

## R13 — Unexpected refund/chargeback
Inspect original order and all prior refunds/disputes, calculate refundable balance exactly, identify external automatic actions, prevent duplicate payments, reconcile ledger and case; escalate if financially material; close only on verified marketplace result.

## R14 — Database/queue disaster recovery
Freeze risk-bearing writes; establish last durable checkpoint; restore from tested backups; replay only deduplicated events; reconcile every uncertain external purchase/refund/update; verify all invariants; canary restore; record RPO/RTO and data gaps.

## R15 — Broad product/catalog mismatch
Stop listing and repricing the affected group; quarantine suspicious matches; sample exact GTIN/MPN/pack/variant; correct identity mapping by evidence; review impacted orders and listings; generate regression tests; reopen one certified unit before scaling.

## Operational targets (planning targets, not achieved performance)
- Zero software-caused duplicate supplier purchases or refunds in critical test suite.
- Zero permitted below-floor price writes in critical test suite.
- Zero unsafe product identity false positives in critical fixtures.
- 100% of material settlement items matched or explicitly unresolved; never invisible.
- 100% consequential decisions/actions have audit trace.
- Freshness/latency targets are configurable by marketplace/supplier capability and validated by measurement, not invented here.
