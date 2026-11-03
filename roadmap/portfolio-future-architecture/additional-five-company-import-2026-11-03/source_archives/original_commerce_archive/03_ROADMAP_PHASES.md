# Roadmap, Classification and Exact Acceptance Intent

**Global constraint:** roadmap is future specification only. Commerce-local items are safe to design inside chat. Actual build/deploy/connection requires explicit authorization. Shared contracts remain held.

| Phase | Deliverable | Acceptance criterion (future verification) | Boundary |
|---|---|---|---|
| 0 | Architecture/spec lock | Domains, authority, isolation and local decisions coherently specified; no unresolved local structural blocker | SAFE WITH BOUNDARY |
| 1 | Core foundation | Local persistence/event/queue/workflow/logging/config/health primitives pass tests | SAFE WITH BOUNDARY |
| 2 | Universal data model | Core entity relationships and schema/migration tests pass | SAFE WITH BOUNDARY |
| 3 | Supplier ingestion | Synthetic supplier connector passes catalog, inventory, price and error tests | SAFE |
| 4 | Product matching | Zero catastrophic false-positive cases in critical suite; conflicts held | SAFE |
| 5 | Marketplace intelligence | Read-only synthetic marketplace connector; normalized data | SAFE |
| 6 | Economics | All reference Decimal, fee and uncertainty tests pass | SAFE |
| 7 | Policy/compliance | Restrictions/uncertainty prevent unsafe eligibility | SAFE WITH BOUNDARY |
| 8 | Commerce Brain v1 | Evidence-backed decision proposals, no self-authority | SAFE WITH BOUNDARY |
| 9 | Shadow opportunity engine | Reproducible recommendations, no marketplace writes | SAFE TO PLAN |
| 10 | Listing system | Synthetic listings validated and source-backed | SAFE |
| 11 | Inventory | Atomic reservation, stale-data and oversell tests pass | SAFE |
| 12 | Pricing | Floor, currency, anomaly and concurrency tests pass | SAFE |
| 13 | Orders | Durable states, idempotency and crash recovery pass | SAFE |
| 14 | Fulfillment | Supplier route and unknown-result recovery pass | SAFE |
| 15 | Returns/refunds | Partial/full returns, refunds, duplicate prevention pass | SAFE |
| 16 | Financial ledger | Immutable entries, settlement and discrepancy controls pass | SAFE |
| 17 | Account health | Seller-account risks detectable, mitigations scoped | SAFE |
| 18 | Security hardening | No critical open threat; least-privilege/red-team suite | SAFE WITH BOUNDARY |
| 19 | Failure/recovery | Replays and compensations avoid duplicate irreversible effects | SAFE WITH BOUNDARY |
| 20 | Simulation certification | Required synthetic scenario suite and invariants pass | SAFE |
| 21 | Shadow production | After separate authorization: live reads with writes technically disabled; predictions audited | NOT EXECUTABLE NOW |
| 22 | Live canary | After explicit authorization: 1 marketplace, 1 supplier, few products; real cycle and reconciled economics verified | NOT EXECUTABLE NOW |
| 23 | Controlled production | Capability-level certification, observed real results, kill switches | NOT EXECUTABLE NOW |
| 24 | Additional marketplaces | Each connector independently certified before activation | FUTURE |
| 25 | Additional suppliers | Each independently verified and certified | FUTURE |
| 26 | Commerce Brain v2 | Measurable improvement with no safety regression | SAFE TO PLAN |
| 27 | Validated learning | Local lessons evidence-based; global promotion disabled | SAFE WITH BOUNDARY |
| 28 | Self-optimization | Bounded, simulated, measurable, reversible, authority-gated | SAFE WITH BOUNDARY |
| 29 | Command Center integration | Read verified final shared contracts, adapt via minimal adapters, verify subordination/isolation | HOLD FOR COMMAND CENTER |
| 30 | Performance and scaling | Capacity targets met without invariant failure | FUTURE |
| 31 | Strategy and portfolio improvements | Backtested outcomes improve approved metrics | FUTURE |
| 32 | New channels/suppliers | Separate approval and certification | FUTURE |
| 33 | Advanced models | Local measured improvements, no authority expansion | FUTURE |
| 34 | International/warehouse extensions | Jurisdiction and operating prerequisites verified | FUTURE |
| 35 | Ecosystem reporting | Only through verified Command Center contract | HOLD |
| 36 | Continuous evolution | Versioned, tested, reversible capability updates | FUTURE |

## Dependency graph
Canonical types → IDs/time/money → database transactions & audit → event/idempotency/workflow → core entities → provenance/validation/matching → supplier & marketplace synthetic connectors → fee/economics/policy → inventory/price/listing → order/fulfillment/refund → finance/reconciliation → domain intelligence → simulation and certification → security/recovery → shadow (future approval) → canary (future approval) → production (future approval) → Command Center seam (audit first).

## Critical invariants
- All actions within current project must stay planning/chat-only.
- No activation without identity, compliance, economics, inventory and authority gates.
- No below-floor price action; no double supplier purchase; no double refund; no negative ATP; no historical financial mutation.
- No unknown required cost replaced with zero; no unverified fact promoted to truth.
- No shared Command Center contract invented.
