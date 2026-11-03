# Pre-Build Readiness, Naming Glossary, Quality Standards

## Architecture/specification gate
- [ ] Exact local scope and no-spend boundary checked.
- [ ] Command Center remains controlling superior; all shared seams blank and HOLD.
- [ ] Canonical entities, types, required/optional fields and constraints documented; no missing key domain relationships.
- [ ] Legal transitions, rejected transitions and reversals are complete for every transactional state machine.
- [ ] All critical errors have containment, escalation, reconciliation and retry classification.
- [ ] Product matching false positives and product/brand/compliance risks handled.
- [ ] Exact-decimal economics handles taxes, fees, shipping, currency, costs and unknowns.
- [ ] Inventory concurrency, reservations, partial shipments/cancellations and refunds modeled.
- [ ] Supplier and marketplace connector capabilities, versions, rate limits and event semantics specified.
- [ ] Severe failure simulations, red-team, audit and proof of recovery planned.
- [ ] Documentation, dashboard and exception requirements consistent with operations.
- [ ] Specific PASS/FAIL acceptance gates, per capability, ready for later implementation.

## Future code/build gate — not currently authorized
- [ ] User explicitly authorizes execution beyond chat planning.
- [ ] Actual project location/account verified; protected assets preserved.
- [ ] Local vs Command Center-dependent scope rechecked.
- [ ] Free/local resource path chosen; no paid activation.
- [ ] Test-first small canary plan; rollback and idempotency mechanisms.
- [ ] No missing user-only identity/account/financial authorization.

## Future live-production gate — not currently authorized
- [ ] Seller eligibility and brand/marketplace fulfillment rules verified using official documentation.
- [ ] Supplier verified, approved and order fulfillment suitable for selling channel.
- [ ] Complete and exact fee/cash economics, no unapproved cash exposure.
- [ ] Product truth and policy evidence current.
- [ ] Read-only shadow mode and synthetic certification pass.
- [ ] Account-health, order, inventory, refund and fraud kill switches proven.
- [ ] Real-world canary explicitly authorized, small scope and auditable.
- [ ] No Command Center seam integrated until final audit and separate authorization.

## Naming conventions
- Internal durable identifiers end `_id`; external identifiers prefixed `external_`, `marketplace_` or `supplier_`.
- Times ending `_at` are timestamps with UTC semantics; `_date` is date-only.
- Exact money fields use purpose-specific names (`unit_cost`, `sale_price`, `refund_amount`) plus currency; money never binary float.
- Quantities end `_quantity`; scores end `_score` with declared direction; boolean state names positive (`active`, `serialized`).
- State enums in `UPPER_SNAKE_CASE`; error codes use `DAT-`, `IDN-`, `SUP-`, `MKT-`, `INV-`, `PRC-`, `ORD-`, `FUL-`, `RET-`, `FIN-`, `POL-`, `SEC-`, `AIX-`, `SYS-`.

## Glossary
- **ATP:** Available to Promise = verified usable supply minus commitments/reservations and buffer.
- **Canonical Product:** Product identity independent of supplier and marketplace.
- **Marketplace Catalog Item:** Channel's product record; not the seller's actual offer.
- **Listing:** Seller's channel-specific offer.
- **Supplier Offer:** Source-specific SKU, cost, warehouse, stock and shipping terms.
- **Evidence:** Timestamped, sourced support for a claim.
- **Provenance:** Traceable chain from source to data value and decision.
- **Confidence:** Calibrated uncertainty about a claim/forecast; not permission to act.
- **Truth Layer:** Verified product facts; distinct from marketing/presentation.
- **Idempotency:** Retry cannot duplicate an external effect.
- **Reconciliation:** Compare internal state to external authoritative results.
- **Circuit Breaker:** Automatic isolation of dangerous subsystem behavior.
- **Kill Switch:** Stop mechanism for all or selected action capabilities.
- **Shadow Mode:** Observe/decide, no live writes.
- **Canary:** Very small, monitored, previously authorized production exposure.
- **Blast Radius:** Set of objects/accounts/actions potentially affected by failure.
- **Invariant:** Condition that must never be violated (e.g. no double refund).
- **Contribution Profit:** Revenue less directly attributable acquisition/fulfillment/fees/reserves/authorized marketing under declared calculation convention.
- **Reconciled Profit:** Profit after matching actual settlements, supplier expense, refunds and adjustments, with explicit unresolved items.
- **Decision Proposal:** Commerce-local recommendation plus evidence, alternatives, risks and authority requirements; never an execution authorization.
- **PIF.1–PIF.10:** Current Command Center post-integration audit decisions that may govern ecosystem contracts; not defined by this project.

## Engineering quality standards
Type-safe contracts where practical; exact decimals for money; strict schema validation; immutable historical decisions/financial postings; transactional reservations; external action journals; bounded retries; explicit UNKNOWN states; observability with PII redaction; reproducible builds; tested migration/rollback; no secret in code/logs; no silent errors; local scope isolation; critical synthetic testing before live exposure; no unstated paid actions.
