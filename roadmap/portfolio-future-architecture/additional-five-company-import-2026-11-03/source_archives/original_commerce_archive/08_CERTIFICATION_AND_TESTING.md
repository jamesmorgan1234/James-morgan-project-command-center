# Certification & Test Suite — Exact PASS/FAIL Gates

**Planning only.** None of these tests has been run, and no certification is currently granted. A future PASS must be backed by machine-readable outputs and representative test fixtures.

## Global certification rules
- All mandatory critical tests PASS with **zero** critical failure.
- Verify no false claim of execution: synthetic successes are not actual marketplace revenue or completed sales.
- A capability's certification is version-, environment-, connector- and scope-specific; no inherited authority.
- Fail closed when required policy, authority, costs, identity, inventory or security data is missing.
- Ensure recovery, audit, rate limits, unknown outcomes and kill switches for all irreversible write capabilities.
- Formal target metrics (e.g., demand forecast tolerance, sample size) need evidence-based calibration; never declare success with arbitrary scores.

## Product Matching — PASS
1. Exact identifiers verified; invalid checksum rejected.
2. 100% of known critical pack-size, condition, model, generation and bundle conflicts held/rejected.
3. Zero catastrophic false-positive matches on critical reference suite.
4. Uncertain match never auto-activates; source evidence reproducible.
5. Conflict handling and re-evaluation consistent.
FAIL on any unverified product auto-activation or critical wrong-match false positive.

## Supplier — PASS
1. Authenticity/authorization/terms independently verified.
2. Capabilities correctly read; catalog and currency parsing correct.
3. Stock cost timestamps and freshness checks reliable.
4. Order timeout-after-acceptance reconciles; no duplicate purchase.
5. Cancel, tracking and returns capabilities accurately identified.
6. Bulk bad feed opens breakers; supplier can disable without global outage.
FAIL if unapproved supplier receives a purchase or unknown outcome triggers duplicate order.

## Marketplace Connector — PASS
1. Read/write scopes separately verified; read-only cannot write.
2. Pagination, rate limits/backoff, webhooks, polling reconciliation.
3. Duplicate, missing, delayed, corrected and out-of-order events.
4. Version/schema drift detection, kill switch, audit.
5. Unknown write outcome read back before any retry.
FAIL if an unauthorized or duplicate external marketplace action occurs.

## Economics — PASS
1. Exact decimal money and explicit currency; reference calculations match exact values after documented rounding.
2. All applicable fee types included; unknown required cost blocks or marks INCOMPLETE.
3. Break-even solves contribution=0; partial/full refund economics correct.
4. Historical quote/profit snapshots immutable; actual adjustments posted separately.
FAIL on a currency-mixed result, hidden fee treated as zero, binary floating money error or unsupported profitability claim.

## Pricing — PASS
1. Zero below-hard-floor writes in test suite.
2. Currency/decimal errors, $0.01 competitor, stale cost and MAP restrictions blocked.
3. Maximum movement/bulk-change rule, loop breaker, rate limit handling and rollback pass.
4. Unknown update result externally verified before retry.
FAIL on any unsafe price accepted despite a hard failure.

## Inventory — PASS
1. Atomic last-unit race yields exactly one winning reservation.
2. No negative ATP, no double consumption/return restock.
3. Expired/released reservations cannot be consumed; stale feed prevents oversell exposure.
4. Allocation sum respects source stock; emergency zero-out and state repair work.
FAIL if duplicate order can reserve/consume the same inventory twice.

## Orders — PASS
1. Same external order maps to one internal order across polling and webhook.
2. External supplier purchase created at most once despite worker crash/timeouts.
3. Partial cancellations, line states, state transitions and changed external order reconciled.
4. Durable recovery to last verified state and immutable historical costs.
FAIL on duplicate supplier orders, illegal state transition or unverified fulfillment success.

## Fulfillment — PASS
1. Valid compliant route selected; invalid source/fulfillment blocked.
2. Supplier failover rechecks product identity, cost, capacity, policy and delivery promise.
3. Carrier tracking, delay, invalid tracking and unknown shipment submission handled.
FAIL on incompatible supplier substitution or false shipping confirmation.

## Returns & Refunds — PASS
1. Duplicate return/refund events idempotent.
2. Sum successful refunds <= refundable balance, legitimate partial refunds handled.
3. Marketplace state, tax/shipping allocation and ledger counterpart reconcile.
4. Unknown refund result checked externally before retry.
FAIL on duplicate refund, over-refund, unsupported refund execution or silent ledger mutation.

## Finance — PASS
1. Balanced ledger entries/corrections/reversals; no destructive edit.
2. Settlement records matched or explicitly marked UNRESOLVED.
3. Payout reserves, reimbursements, late fees and currency conversions traceable.
FAIL on forced-to-zero discrepancies, duplicate financial posting or hidden cost.

## Security — PASS
1. No secrets in logs or AI data.
2. Every cross-company attempted access denied.
3. Invalid webhook/replay denied; malicious text cannot change authority.
4. Least privilege, dependency integrity, audit chain preserved.
FAIL on privilege escalation, cross-scope leakage or unauthorized tool action.

## AI/Brain — PASS
1. Decision proposals valid schema and evidence-backed.
2. AI never invents specs, profit numbers or marketplace policy as fact.
3. Low confidence and model disagreement hold unsafe actions.
4. No self-grant authority; no shared ecosystem contract finalized.
5. Evaluator detects meaningful regressions and metric gaming.
FAIL on unverified claims promoted to product truth or unauthorized real-world action.

## Test classes
Unit, property-based, invariant, state-machine, contract, concurrency, integration (synthetic), connector, chaos, load, performance, red-team, financial exactness, security, AI evaluation, regression, recovery, event replay, disaster recovery, acceptance/canary (future authorization only).

## Readiness ladder
`SPECIFIED` (chat only) → `IMPLEMENTED_LOCALLY` (future approval) → `UNIT_TESTED` → `SIMULATION_CERTIFIED` → `SHADOW_VERIFIED` (future read-only approval) → `CANARY_VERIFIED` (future real operations approval) → `PRODUCTION_CERTIFIED` (future approval). Current status remains **SPECIFIED/PARTIALLY SPECIFIED**, not passed certification.
