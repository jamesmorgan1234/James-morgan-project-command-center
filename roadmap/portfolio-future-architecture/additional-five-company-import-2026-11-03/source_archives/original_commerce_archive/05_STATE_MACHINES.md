# State Machines — Legal/Illegal Transitions and Recovery

## General transition contract
Every state change requires: `(entity_id, expected_record_version, from_state, to_state, cause, correlation_id, evidence, time, actor/service, verification_result)`. If current version/state differs, reject with concurrency conflict and reconcile. All prohibited transitions return an error and never partially mutate related systems. External state is not inferred from a requested local transition. Terminal states require a new documented lifecycle for reopening. Audits are append-only.

## Product
States: DISCOVERED, IDENTIFIED, VERIFIED, EVALUATING, ELIGIBLE, APPROVED, STAGED, ACTIVE, WATCH, PAUSED, RESTRICTED, RECALLED, RETIRED, REJECTED.
Legal: DISCOVERED→IDENTIFIED/REJECTED; IDENTIFIED→VERIFIED/REJECTED/WATCH; VERIFIED→EVALUATING/WATCH; EVALUATING→ELIGIBLE/REJECTED/WATCH; ELIGIBLE→APPROVED/WATCH; APPROVED→STAGED/PAUSED; STAGED→ACTIVE/PAUSED; ACTIVE→PAUSED/RESTRICTED/RECALLED/RETIRED; WATCH→EVALUATING; PAUSED→EVALUATING; RESTRICTED→EVALUATING after evidence of resolution; RECALLED→RETIRED; nonterminal→RECALLED after verified recall; pre-activation nonterminal→REJECTED if definitively unfit.
Illegal: DISCOVERED→ACTIVE; IDENTIFIED→ACTIVE; REJECTED→ACTIVE; RECALLED→ACTIVE; RETIRED→ACTIVE without new onboarding. Recovery: freeze affected downstream, restore last verified state, re-run identity/compliance/economics, retain incident audit.

## Supplier
States: CANDIDATE, VERIFYING, VERIFIED, APPROVED, ACTIVE, WATCH, DEGRADED, SUSPENDED, BLOCKED, RETIRED.
Legal: CANDIDATE→VERIFYING; VERIFYING→VERIFIED/BLOCKED; VERIFIED→APPROVED/WATCH; APPROVED→ACTIVE; ACTIVE→DEGRADED/SUSPENDED; DEGRADED→ACTIVE/SUSPENDED; SUSPENDED→VERIFYING; nonterminal→RETIRED; any→BLOCKED on severe confirmed issue.
Illegal: CANDIDATE→ACTIVE; BLOCKED→ACTIVE before re-verification; RETIRED→ACTIVE directly. Recovery: isolate supplier, avoid new commitments, reconcile existing orders before alternative routing.

## Listing
States: DRAFT, VALIDATING, READY, SUBMITTED, ACTIVE, REJECTED, ERROR, SUPPRESSED, PAUSED, CLOSED.
Legal: DRAFT→VALIDATING; VALIDATING→READY/REJECTED; READY→SUBMITTED; SUBMITTED→ACTIVE/ERROR; ACTIVE→SUPPRESSED/PAUSED/CLOSED; SUPPRESSED→VALIDATING; PAUSED→READY/CLOSED.
Illegal: DRAFT→ACTIVE; REJECTED→ACTIVE; CLOSED→ACTIVE without new lifecycle. Recovery: unknown write result → read external listing state before retry; keep local and external statuses separate; never claim ACTIVE on submission alone.

## Inventory Reservation
States: REQUESTED, RESERVED, REJECTED, CONSUMED, RELEASED, EXPIRED.
Legal: REQUESTED→RESERVED/REJECTED; RESERVED→CONSUMED/RELEASED/EXPIRED. EXPIRED requires new REQUESTED record if reconsidered.
Illegal: RELEASED→CONSUMED; EXPIRED→CONSUMED; CONSUMED→RELEASED. Recovery: compare transactional reservation history with stock ledger, do not increment stock twice.

## Order
States: RECEIVED, VALIDATING, VALIDATED, INVENTORY_RESERVED, ACCEPTED, FULFILLMENT_PENDING, FULFILLMENT_CONFIRMED, SHIPPED, DELIVERED, CLOSED, REJECTED_DATA, CANCELLED, PARTIALLY_CANCELLED, CANCELLATION_REQUESTED, CANCELLATION_EXCEPTION, FULFILLMENT_EXCEPTION, DELIVERY_EXCEPTION, RETURN_REQUESTED, RETURNED, REFUNDED, DISPUTED.
Normal: RECEIVED→VALIDATING→VALIDATED→INVENTORY_RESERVED→ACCEPTED→FULFILLMENT_PENDING→FULFILLMENT_CONFIRMED→SHIPPED→DELIVERED→CLOSED.
Branches: VALIDATING→REJECTED_DATA; VALIDATED/INVENTORY_RESERVED→CANCELLED; ACCEPTED→CANCELLATION_REQUESTED; FULFILLMENT_PENDING→FULFILLMENT_EXCEPTION; FULFILLMENT_CONFIRMED→CANCELLATION_EXCEPTION; SHIPPED→DELIVERY_EXCEPTION; DELIVERED→RETURN_REQUESTED; CLOSED→DISPUTED where allowed; partial cancellation only where line quantities and external platform states reconcile.
Illegal: RECEIVED→SHIPPED; CANCELLED→FULFILLMENT_CONFIRMED; DELIVERED→INVENTORY_RESERVED; CLOSED→ACCEPTED.
Recovery: compare last verified internal order, marketplace order, supplier order, reservation, tracking, and financial postings; do not repeat purchase blindly.

## Shipment
States: PLANNED, LABEL_CREATED, VOIDED, HANDED_TO_CARRIER, IN_TRANSIT, DELAYED, OUT_FOR_DELIVERY, DELIVERY_EXCEPTION, DELIVERED, LOST, RETURN_TO_SENDER, RETURNED.
Legal: PLANNED→LABEL_CREATED; LABEL_CREATED→HANDED_TO_CARRIER/VOIDED; HANDED_TO_CARRIER→IN_TRANSIT/DELAYED; IN_TRANSIT→OUT_FOR_DELIVERY/DELAYED/LOST/RETURN_TO_SENDER; OUT_FOR_DELIVERY→DELIVERED/DELIVERY_EXCEPTION; DELIVERY_EXCEPTION→IN_TRANSIT/RETURN_TO_SENDER; RETURN_TO_SENDER→RETURNED. Carrier correction may verify a previously LOST shipment delivered.
Illegal: PLANNED→DELIVERED; VOIDED→IN_TRANSIT; LOST→DELIVERED without verified carrier correction.

## Return
States: REQUESTED, ELIGIBILITY_CHECK, AUTHORIZED, DENIED, CANCELLED, IN_TRANSIT_BACK, LOST, RECEIVED, INSPECTED, DISPOSITIONED, REFUND_PENDING, SUPPLIER_CLAIM_PENDING, CLOSED.
Legal: REQUESTED→ELIGIBILITY_CHECK; ELIGIBILITY_CHECK→AUTHORIZED/DENIED; AUTHORIZED→IN_TRANSIT_BACK/CANCELLED; IN_TRANSIT_BACK→RECEIVED/LOST; RECEIVED→INSPECTED/REFUND_PENDING; INSPECTED→DISPOSITIONED/SUPPLIER_CLAIM_PENDING; disposition/refund/claim resolution→CLOSED when all obligations satisfied. Duplicate return events idempotent.

## Refund
States: REQUESTED, VALIDATING, READY, SUBMITTED, UNKNOWN_RESULT, FAILED_VERIFIED, REJECTED, CONFIRMED.
Legal: REQUESTED→VALIDATING; VALIDATING→READY/REJECTED; READY→SUBMITTED; SUBMITTED→CONFIRMED/UNKNOWN_RESULT; UNKNOWN_RESULT→CONFIRMED/FAILED_VERIFIED only after external reconciliation; FAILED_VERIFIED→READY if retry authorized and safe.
Illegal: CONFIRMED→SUBMITTED; REJECTED→CONFIRMED without fresh valid request. Recovery: external lookup before retry, ledger correction rather than duplicate refund.

## Settlement
States: RECEIVED, PARSED, INVALID, MATCHING, PARTIAL_MATCH, RECONCILING, DISCREPANCY, RECONCILED.
Legal: RECEIVED→PARSED; PARSED→MATCHING/INVALID; MATCHING→RECONCILING/PARTIAL_MATCH; RECONCILING→RECONCILED/DISCREPANCY; DISCREPANCY→RECONCILED after supported adjustment/correction; PARTIAL_MATCH→RECONCILING after new evidence. Never force balance.

## Incident
States: DETECTED, TRIAGED, CONTAINING, CONTAINED, RECOVERING, RECOVERED, ROOT_CAUSE_ANALYSIS, CLOSED.
Legal: sequential progress; return to CONTAINING on reoccurrence; critical incidents close only after verified restoration, root-cause status, blast radius and corrective-action record.

## Connector
States: UNCONFIGURED, CONFIGURED, TESTING, FAILED, CERTIFIED, ACTIVE, DEGRADED, DISABLED, DEPRECATED, RETIRED.
Legal: UNCONFIGURED→CONFIGURED→TESTING→CERTIFIED→ACTIVE; TESTING→FAILED; ACTIVE→DEGRADED/DISABLED/DEPRECATED; DEGRADED→ACTIVE/DISABLED; DEPRECATED→RETIRED. Failure of certification blocks activation; disabling must fence writes.

## FinancialEvent
POSTED is immutable. Reversals and corrections are *new* ledger events referencing the original; there is no destructive POSTED→EDITED state transition.

## Recovery precedence
1. Confirm authoritative external state and signed source payload.
2. Locate last verified local state/version.
3. Check idempotency result ledger/outbox.
4. Resolve missing, duplicated or out-of-order events.
5. Perform only safe compensating transaction with explicit authority.
6. Audit result and retest invariants.
