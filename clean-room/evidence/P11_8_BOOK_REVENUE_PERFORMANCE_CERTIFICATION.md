# P11.8 — Book Revenue and Performance — Repair and Certification Evidence

Scope/exit gate: title/edition/format/provider/marketplace metrics keep projected, estimated, confirmed, settled, disputed and adjusted truth separate; source dates/freshness/reconciliation remain explainable; no fake or duplicated revenue; unknown is not zero.

Inspected inherited `performance.ts` and current P11.8 roadmap. Existing commit `ef63a42e539253875d20cfe67304f8db7029cc1b` already separated projected/confirmed/settled values, validated reporting windows, required settlement evidence and deduplicated metric IDs. Current gap: edition/provider/marketplace, units/refunds/pages/performance, estimated/disputed/adjusted truth, freshness/reconciliation and explicit unknown-vs-verified-zero semantics.

Repair adds `performance-truth.ts`, focused reconciliation/adversarial tests and repository-only migration `20261027235000_p11_8_book_performance_truth.sql`. Provider record identity is unique across exact provider/marketplace/metric/truth scope to prevent double counting. `null` remains unknown; numeric zero is verified zero.

No provider finance account was read, no revenue was fabricated or changed, no test order was counted, no production migration/spend/publication occurred, and Category 12 was not started.
