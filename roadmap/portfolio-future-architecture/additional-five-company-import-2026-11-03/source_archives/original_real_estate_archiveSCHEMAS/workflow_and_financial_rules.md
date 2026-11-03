# Local workflow and financial rules

## Main state progression
`DISCOVERED` -> `IDENTIFIED` -> `ENRICHED` -> `PRELIMINARY_SCREEN` -> `UNDERWRITTEN` -> `ADVERSARIAL_REVIEW` -> `COMPLIANCE_CLEARED` -> `OUTREACH_ELIGIBLE` -> `SELLER_ENGAGED` -> `OFFER_READY` -> `OWNER_APPROVAL_REQUIRED` -> `CONTRACT_PENDING` -> `CONTRACTED` -> `TITLE_AND_BUYER_MATCHING` -> `ASSIGNMENT_READY` -> `ASSIGNED` -> `CLOSING_READY` -> `CLOSING_SCHEDULED` -> `CLOSED_PENDING_FUNDS` -> `FUNDS_CLEARED` -> `OUTCOME_LEARNING`.

Exceptions/recovery: `REJECTED`, `MONITOR`, `STALE_DATA`, `MANUAL_REVIEW`, `LEGAL_REVIEW_REQUIRED`, `COMPLIANCE_HOLD`, `TITLE_HOLD`, `BUYER_FAILED`, `SELLER_WITHDREW`, `CONTRACT_EXPIRED`, `CLOSING_FAILED`, `CANCELLED`.

All transitions default-deny unless positively permitted by evidence/authorization. Recovery to the previous valid stage requires fresh evidence, never blindly repeat a protected action.

## Sample transition guards
| From → To | Minimum evidence / gate |
|---|---|
| DISCOVERED → IDENTIFIED | Unique parcel/property candidate |
| IDENTIFIED → ENRICHED | Data/ownership retrieval attempted and documented |
| ENRICHED → PRELIMINARY_SCREEN | Minimum evidence completeness |
| PRELIMINARY_SCREEN → UNDERWRITTEN | Pricing, property, buyer and condition evidence sufficient |
| UNDERWRITTEN → ADVERSARIAL_REVIEW | Expected, conservative, stress scenarios available |
| ADVERSARIAL_REVIEW → COMPLIANCE_CLEARED | No unresolved hard deal-killer; compliance evaluated |
| COMPLIANCE_CLEARED → OUTREACH_ELIGIBLE | Channel-specific legal eligibility and suppression clearance |
| OUTREACH_ELIGIBLE → SELLER_ENGAGED | Real seller engagement evidence |
| SELLER_ENGAGED → OFFER_READY | Walkaway ceiling and refreshed economics |
| OFFER_READY → OWNER_APPROVAL_REQUIRED | Terms fully specified |
| OWNER_APPROVAL_REQUIRED → CONTRACT_PENDING | Specific James approval for protected steps |
| CONTRACT_PENDING → CONTRACTED | Required disclosure, valid signatures, assignability and professional review |
| CONTRACTED → TITLE_AND_BUYER_MATCHING | Start title and buyer work in parallel |
| TITLE_AND_BUYER_MATCHING → ASSIGNMENT_READY | Suitable title work and qualified buyer |
| ASSIGNMENT_READY → ASSIGNED | Explicit assignment approval and valid documents |
| ASSIGNED → CLOSING_READY | Title, docs, funds, conditions verified |
| CLOSING_READY → CLOSING_SCHEDULED | Closing agent confirms |
| CLOSING_SCHEDULED → CLOSED_PENDING_FUNDS | Executed settlement confirmed |
| CLOSED_PENDING_FUNDS → FUNDS_CLEARED | Actual cleared deposit confirmed |
| FUNDS_CLEARED → OUTCOME_LEARNING | Closing financial reconciliation |

Prohibited bypasses: DISCOVERED→CONTRACTED; COMPLIANCE_HOLD→OFFER; TITLE_HOLD→CLOSING_READY; CONTRACTED→FUNDS_CLEARED; approval proposal→spent; UNKNOWN title/authority→verified; missing disclosure→covered contract.

## Core arithmetic (amounts in integer cents)
- `gross_assignment_spread = expected_end_buyer_price − seller_contract_price`.
- `net_assignment_proceeds = gross_assignment_spread − James_borne_transaction_costs`.
- `conservative_spread = conservative_end_buyer_price − seller_contract_price − James_borne_transaction_costs`.
- `stress_spread = stress_end_buyer_price − seller_contract_price − James_borne_transaction_costs`.
- `cash_at_risk = max credible nonrecoverable transaction cash personally exposed on failure`, with contract/civil liabilities represented separately.
- `approved_optional_service_cost` = a separate expense ledger, not automatically deal-side capital exposure.
- `maximum_seller_contract_price = conservative_buyer_price − required_assignment_margin − James_borne_transaction_costs − additional_risk_reserve`.
- `expected_value_illustrative = P(close) * net_proceeds_if_close − (1−P(close)) * deal_side_loss_if_fail − planned_approved_service_costs`.

Probability adjustment is a ranking aid, never sufficient to override minimum spread, $0 preference, no-loss/compliance gates. Closing probability is uncertain and must be calibrated using observed data, never advertised as guaranteed.

## Approval hard gate
Any protected action must match `action_type`, hash of exact approved request, expiry, `max_amount`, intended entity, and one-time consumption. If final price > approved cap or provider substitutes subscription for one-time purchase, block and request fresh approval. Never auto-sign, auto-wire, auto-bid, auto-purchase, or auto-subscribe. James is the final human authority for those protected acts.

## Source/evidence requirement
For each material fact store `value`, `source`, `retrieved_at`, `effective_at` if relevant, `confidence`, `verification_status`, `freshness_deadline`, `record_hash` and conflicting observations. No clear title solely from county record searches, and no negative claim from absence of records.
