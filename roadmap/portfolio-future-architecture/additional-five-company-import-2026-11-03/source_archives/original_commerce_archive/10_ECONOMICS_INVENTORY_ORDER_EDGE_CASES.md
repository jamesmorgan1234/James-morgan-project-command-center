# Exact Economics, Pricing, Inventory and Order Safety — Edge Cases

## Economic data model and formula
Let `q` be units and all money share verified conversion into one calculation currency.
- `GMR = unit_sale_price × q`.
- `NMR = GMR - seller_funded_discount` (account for shipping revenues or taxes separately by declared treatment).
- `Acquisition = q × supplier_unit_cost`.
- `Landed = Acquisition + supplier_shipping + inbound_freight + duties + prep + other directly attributable supplier costs`.
- `MarketplaceCosts = referral + transaction + listing + fulfillment + storage + marketplace-specific charges`.
- `Outbound = postage + packaging + handling` not already included.
- `RiskReserve = expected net return loss + damage + cancellation + fraud + other direct loss (avoid double counting)`.
- `Marketing = attributable **authorized** marketing cost`.
- `Contribution = NMR - Landed - MarketplaceCosts - Outbound - RiskReserve - Marketing`.
- `ContributionMargin = Contribution / NMR` when NMR>0, else NOT_APPLICABLE.
- `CapitalROI = Contribution / cash_committed` when >0, else NOT_APPLICABLE.
- `BreakevenPrice` is price solving Contribution(price)=0 considering percentage-based referral fees, not merely sum of fixed costs.
- `PriceFloor = max(breakeven with required margin, permitted MAP floor, policy-specific configured lower bound)`, subject to applicable legal/marketplace price constraints.
- Prices and costs are saved as exact decimals with explicit currency and rounding policy. Unknown required cost → INCOMPLETE, not zero.

## Pricing/economics cases to model
1. Seller-funded coupon; 2. marketplace-funded coupon; 3. mixed coupon; 4. seller-paid free shipping; 5. shipping revenue; 6. partial refund; 7. full refund; 8. sales tax refunded; 9. shipping not refunded; 10. restocking fee; 11. supplier credit; 12. marketplace reimbursement; 13. delayed fee; 14. storage after sale; 15. long-term storage; 16. chargeback; 17. chargeback reversal; 18. exchange-rate movement; 19. multiple currencies; 20. quantity discount; 21. expiring supplier promo; 22. later rebate; 23. supplier promo shipping; 24. dimensional weight; 25. remote-area surcharge; 26. oversized fee; 27. hazmat fee; 28. seller-paid return shipping; 29. buyer-paid return shipping; 30. damaged write-off; 31. lost shipment reimbursement; 32. partial supplier reimbursement; 33. payout reserve withholding; 34. reserve release; 35. line-level rounding; 36. order-level rounding; 37. fee rounding; 38. fractional tax; 39. bundle cost allocation; 40. multiple suppliers; 41. multiple warehouses; 42. split shipment; 43. pre-fulfillment cancellation; 44. post-purchase cancellation; 45. unsellable return; 46. restocked/resold return; 47. ad attribution (only if future approved); 48. affiliate cost; 49. unknown cost; 50. stale cost.

## Pricing guardrails
- Never autonomously chase a $0.01 competitor, suspicious high/low price, zero quantity, stale reference or likely decimal error.
- Preserve policy ceilings and floors, MAP restrictions where applicable, profit/cash-risk limits and maximum per-interval percentage change.
- Repricing loops and abnormal bulk updates open circuit breaker; require read-after-write and reconciliation.
- No sale is good merely because it wins featured offer: it must satisfy risk, account-health and profit gates.

## Inventory invariants
- `ATP=max(0, verified_usable_stock - reservations - committed - buffer)` only after stock ownership/location semantics are established.
- Sum of concurrent channel allocations must not exceed allowable sellable supply; `advertised` channel values may require conservative distribution and rapid updates.
- Supplier-reported available stock is not the same as physically owned or verified units.
- Atomic compare-and-swap/serializable transactional reservations protect last-unit races.
- Each reservation version/ID consumed once. Expiration versus acceptance resolved transactionally, not by wall clock guesses.
- Quarantine, recalled, damaged or otherwise unavailable units excluded from ATP.
- External supplier stock refresh must not overwrite more recent reservations.
- Supplier fallback needs a fresh identity, economics, shipping, compliance and account-health check.

## Inventory race cases (30)
1. Atomic reservations; 2. consistent stock version; 3. last-unit single winner; 4. same idempotency key same result; 5. source refresh cannot erase reservation; 6. external stock cannot erase commitment; 7. return restock once; 8. cancellation release once; 9. expiry/acceptance atomic winner; 10. preserved ordering audit; 11. no negative quantity; 12. quarantine excluded; 13. allocation <= supply; 14. reliability buffer; 15. stale stock zero-out; 16. two-sided location transfers; 17. in-transit transfer state; 18. inbound not sellable without approval; 19. serial uniqueness; 20. shipment completion once; 21. duplicate return receipt once; 22. external marketplace quantity drift; 23. reasoned quantity correction; 24. bulk version checks; 25. timestamp reconciliation; 26. clock-skew robustness; 27. warehouse disappearance; 28. feed anomaly breaker; 29. no supplier stock pooling without ability to substitute; 30. immutable reservation history.

## Idempotency key semantics
- Same operation+same key+same payload → same logical outcome, no repeated side effect.
- Same key+different payload → hard conflict.
- Different key but same marketplace order+line → detected duplicate via business key.
- Supplier without native idempotency → local durable operation record, external lookup, uncertain-result hold.
- Never blind retry supplier purchase, cancellation, refund, order acceptance, tracking submission or other consequential write after timeout.
- Store operation state, `external_request_id`, hash, first submitted time, external response reference, latest reconciliation and terminal verified result.

## Order/refund special cases (40)
1. Duplicate webhook; 2. duplicate polling result; 3. webhook+polling same order; 4. delayed event; 5. out-of-order event; 6. external amendment; 7. repeated supplier timeout; 8. accepted purchase response lost; 9. supplier duplicate despite key; 10. cancellation while purchase pending; 11. cancellation after confirmation; 12. partial cancellation; 13. multi-line partial fulfillment; 14. partial refund; 15. multiple legitimate partial refunds; 16. refund after chargeback; 17. chargeback after refund; 18. return after refund; 19. marketplace auto-refund; 20. replacement order; 21. address change after fulfillment; 22. quantity change; 23. substitution request; 24. shipping upgrade; 25. marketplace deadline changes; 26. order after outage; 27. late import; 28. external ID collision; 29. crash retry; 30. commit succeeds, ack fails; 31. ledger succeeds, workflow crashes; 32. workflow succeeds, audit delayed; 33. contradictory marketplace/supplier cancellation; 34. duplicate shipment; 35. multi-tracking shipment; 36. split across suppliers; 37. FX refund; 38. external line merge; 39. external SKU mapping change; 40. recall after purchase.

## Expected vs actual profitability
- `Expected`: decision-time forecast (not sale, not revenue).
- `Realized`: posted transactions with actual known costs and returns.
- `Fully reconciled`: marketplace settlement + supplier payments + fee/reimbursement adjustments accounted for, with explicit unresolved exceptions.
- Test order #1001 or other historic business test transactions from unrelated projects must never be imported as commerce-platform revenue; company isolation mandatory.
