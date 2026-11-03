# Commerce-Local Supplier and Marketplace Connector Contracts

These are **logical proposed adapter interfaces, not implemented APIs**. Each external provider requires separate official documentation/API verification, seller-account eligibility, scopes and future explicit authorization. This document defines no Command Center integration contract.

## Common adapter response envelope
All operations return a normalized result containing:
- `operation_id`, `connector_id`, `connector_version`, `request_id`, `correlation_id`.
- `status`: SUCCESS / REJECTED / PARTIAL / UNKNOWN_OUTCOME / RETRYABLE_READ_FAILURE / PERMANENT_FAILURE / RATE_LIMITED.
- `external_reference` (if known), `resource_version` (if known), `observed_at`, `source_timestamp`, `pagination_cursor`, `raw_payload_reference/hash`, `errors[]`, `warnings[]`.
- Read/write distinction, idempotency key, authority/check reference and full evidence/audit trace for consequential writes.
- UNKNOWN_OUTCOME is never silently interpreted as FAILURE or SUCCESS.

## Supplier adapter capability map
`get_capabilities()` returns catalog, cost, inventory, warehouse, volume tiers, MOQ, order creation/lookup, order cancellation, shipment, tracking, returns, documents, webhooks, regions, currencies, rate limits and version metadata as TRUE/FALSE/PARTIAL/UNKNOWN.

### `list_products(cursor?, filters?)`
Output: supplier SKUs, product identifiers, attributes, price offers, source timestamps, next cursor and hash. Requires pagination determinism and duplicate handling.

### `get_product(supplier_sku)`
Output: identity, variants, factual source attributes, raw evidence ref and change/version metadata. No unsupported product claims promoted to canonical truth.

### `get_offer(supplier_sku, warehouse?)`
Output: unit cost and currency, MOQ, volume tiers, promotions/expiry, supplier price timestamp, shipping assumptions, fulfillment and eligibility constraints. Missing required amount remains UNKNOWN.

### `get_inventory(supplier_sku, warehouse?)`
Output: stock quantity or UNKNOWN, warehouse, reported/verified distinction, timestamp, stock reliability profile and availability flags.

### `create_order(order_request, idempotency_key)`
Order request: correlation ID, supplier SKU/variant, quantity, shipping destination reference (privacy minimized), shipping/packaging requirement, expected price/currency, accepted substitution policy (normally NO), authority reference.
Possible result: ACCEPTED, REJECTED, UNKNOWN_OUTCOME; supplier external order ID if known; never auto-buy without explicit future authorization. If provider has no native idempotency, implement dedup via durable local operation record + external lookup/corroboration.

### `get_order(supplier_order_id)`
Return authoritative supplier state and line data.

### `cancel_order(supplier_order_id, idempotency_key)`
Return CANCELED / NOT_CANCELLABLE / UNKNOWN_OUTCOME, external confirmation, potential fees. Never assume canceled until verified.

### `get_shipments(supplier_order_id)`
Return packages, tracking, carriers, source/ship/delivery timestamps, evidence.

### `create_return(order_line_ref, quantity, reason, idempotency_key)`
Return supplier return authorization/rules/recovery amount or rejection; source policy may preclude use.

### `get_documents(order_ref, type)`
Invoices, brand authorization, compliance docs, packing slips. Verify suitability, packaging and seller-of-record rules.

## Marketplace adapter capability map
`get_capabilities()` returns catalog, listing, bulk listing, inventory, price, repricing, orders, shipment, returns/refunds, reports, policy/account-health, webhooks, analytics and country/seller support.

### `find_catalog_items(query, cursor?)`
Query: identifier, brand/MPN, title/attribute, region. Output external IDs, match evidence, pagination and freshness.

### `get_catalog_item(external_item_id)`
Output marketplace-specific catalog truth and category/attribute requirements; may conflict with manufacturer and require review.

### `create_listing(listing_payload, idempotency_context)`
Input: verified product mapping, marketplace taxonomy, channel SKU, source-backed content version, supplier/orderability, fulfillment plan, price economics, quantity, policy result and required authority.
Output SUCCESS/REJECTED/UNKNOWN_OUTCOME plus listing external ID; ACTIVE only after external confirmation.

### `update_listing`, `pause_listing`, `close_listing`
Version-aware writes; read-back and reconciliation on uncertain result; all idempotent where technically possible.

### `get_inventory(channel_sku)` / `set_inventory(channel_sku, quantity, idempotency_context)`
Quantity integer >=0, source version, desired channel allocation and freshness. Failed/unknown write must not increase total exposure blindly.

### `get_offer(channel_sku)` / `get_competitive_context(catalog_item_id)`
Returns seller offer, delivered price, shipping, competitors, featured offer where available; one competitor observation never establishes demand/price truth.

### `set_price(channel_sku, price, idempotency_context)`
Hard floor, applicable MAP/policy, currency, catalog/version, movement/bulk limits and cost-freshness checks are prerequisites. Unknown outcome read back before retry.

### `list_orders(updated_after, cursor?)` / `get_order(external_order_id)`
Use watermarks, pagination, delayed corrections and dedup; order states authoritative after reconciliation.

### `confirm_shipment(shipment_payload, idempotency_context)` / `update_tracking(...)`
Package carrier/tracking, timestamps and evidence; confirm only actual shipment.

### `list_returns`, `get_return`, `process_return_action`
Marketplace-specific allowed actions, customer rights, deadlines and idempotent refund constraints.

### `request_report`, `get_report`
Finance/settlement/health reports with asynchronous polling if required, verification of completeness and account/currency scopes.

### `verify_webhook`, `normalize_event`
Validate raw request signature, timestamp, nonce/replay, scope, payload schema. Dedup and reconcile out-of-order/missing events via polling.

### `get_account_health`
Capability optional and marketplace-specific; never invent an API endpoint if unsupported.

## Connector certification checklist
1. Identity/permissions, least privilege, read/write separation.
2. Country/currency and seller eligibility.
3. Exact product identity and data provenance.
4. Pagination/cursors/watermarks.
5. Throttle/rate limits and bounded backoff.
6. Webhook signature/replay, duplicate and out-of-order handling.
7. Stale feeds and schema drift/deprecations.
8. Unknown external write result reconciliation.
9. Safe cancellation, refund and supplier order semantics.
10. Kill switch, circuit breaker, full audit and scoped disable.
11. Sandbox or synthetic tests, then future certified shadow/canary with explicit approval.

## Disallowed assumptions
- Every seller is eligible for every marketplace.
- Every supplier provides blind shipping or acceptable invoices.
- Every provider supports create/update/refund via API.
- Any API endpoint or scope remains stable forever.
- A marketplace catalog item means the company has the right to sell it.
- A supplier listing means the product is authentic or in stock.
- Any external write is authorized by drafting this contract.
