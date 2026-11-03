# Canonical Logical Schemas, Datatypes, Requiredness, Validation, Relationships

## General conventions
- `ID`: immutable unique opaque identifier scoped to entity; use explicit foreign-key references.
- `STRING(n)`: UTF-8 bounded string; validation field-specific.
- `TEXT`: arbitrary bounded-at-implementation long text; untrusted unless sourced and verified.
- `BOOL`: true/false; `UNKNOWN` is distinct if tri-state needed.
- `INT64`: integer counts. Nonnegative inventory; strictly positive ordered quantity.
- `DECIMAL(38,8)`: exact arithmetic. Never binary floating-point for money.
- `PERCENT`: decimal 0..1 unless documented otherwise; require source/sample size for scored metrics.
- `MONEY`: pair (`DECIMAL(38,8)` amount, ISO three-letter currency). Never implicitly mix currencies.
- `TIMESTAMP_UTC`: timezone-aware event time; `DATE` separate.
- `ENUM`: explicit named allowed values, reject/quarantine unknown external values.
- `HASH`: cryptographic digest used for payload and audit integrity.
- `URI_REF`: a validated reference, not proof of truth.
- `JSON`: strictly for external extension/raw references; not substitute for modeled core fields.

## Shared metadata for all durable commerce records
| Field | Type | Required | Constraints |
|---|---|---|---|
| commerce_id | ID | Y | Unique, immutable |
| entity_type | ENUM | Y | Matches owning schema |
| schema_version | STRING(32) | Y | Supported version |
| record_version | INT64 | Y | >=1, monotonic CAS update |
| status | ENUM | Y | Valid state |
| scope_id | ID | Y | Commerce-local company/project segregation |
| created_at | TIMESTAMP_UTC | Y | Immutable |
| updated_at | TIMESTAMP_UTC | Y | >=created_at |
| source_type | ENUM | Y | API/feed/manual/calculated/model/import |
| source_reference | STRING(512) | N | Required if sourced externally |
| observed_at | TIMESTAMP_UTC | N | Acquisition observation |
| effective_at | TIMESTAMP_UTC | N | Source-effective time |
| expires_at | TIMESTAMP_UTC | N | > effective_at if present |
| confidence | DECIMAL(5,4) | N | 0..1; null means unknown |
| verification_state | ENUM | Y | UNVERIFIED/VERIFIED/CONFLICTING/REJECTED |
| correlation_id | ID | N | Workflow grouping |
| causation_id | ID | N | Causal event ID |
| audit_reference | ID | N | Audit trace |

## Core entity field definitions
Entries are written as `field : logical type [R=required | O=optional | C=conditional]`. Every foreign key must resolve within authorized company scope; every status must obey its state machine. Requiredness is stage-dependent when stated.

### Product
`product_id:ID[R]`, `canonical_title:STRING(500)[C:IDENTIFIED+]`, `brand_id:ID[O]`, `manufacturer_id:ID[O]`, `product_family:STRING(255)[O]`, `model_number:STRING(255)[O]`, `generation:STRING(128)[O]`, `product_type:STRING(255)[C:VERIFIED+]`, `category_id:ID[C:VERIFIED+]`, `condition_default:ENUM[O]`, `country_of_origin:STRING(2)[O]`, `material:STRING(512)[O]`, `color_family:STRING(128)[O]`, `age_min:DECIMAL[O]`, `age_max:DECIMAL[O]`, `hazard_class:ENUM[O]`, `fragile:BOOL[R]`, `oversized:BOOL[R]`, `expiration_sensitive:BOOL[R]`, `serialized:BOOL[R]`, `lot_tracked:BOOL[R]`, `recall_state:ENUM[R]`, `lifecycle_state:ENUM[R]`, `canonical_description:TEXT[O]`, `truth_completeness_score:PERCENT[C:VERIFIED+]`.
Rules: ACTIVE needs at least one verified variant, verified categories and eligibility; active recall blocks activation. `age_min <= age_max` if both. Physical truth needs evidence.
Relations: Product 1:N Variants, Identifiers, Evidence, marketplace item matches; N:1 Brand/Manufacturer/Category.

### ProductVariant
`variant_id:ID[R]`, `product_id:ID[R]`, `variant_name:STRING(500)[R]`, `sku_basis:STRING(255)[O]`, `size:STRING(128)[O]`, `color:STRING(128)[O]`, `capacity_value:DECIMAL[O]`, `capacity_unit:STRING(32)[C if capacity]`, `pack_quantity:INT64[R;>=1]`, `unit_count:DECIMAL[O;>=0]`, `unit_measure:STRING(32)[C if unit_count]`, `weight_value:DECIMAL[O;>0]`, `weight_unit:ENUM[C if weight]`, `length_value:DECIMAL[O;>0]`, `width_value:DECIMAL[O;>0]`, `height_value:DECIMAL[O;>0]`, `dimension_unit:ENUM[C if dimensions]`, `package_weight_value:DECIMAL[O;>0]`, `package_dimension_fields:DECIMAL+unit[O]`, `condition:ENUM[R]`, `active:BOOL[R]`.
Rules: distinct variants must not share an identical verified attribute key unless intentionally aliased. Matching includes pack count, model generation, condition and regional compatibility.
Relations: N:1 Product; 1:N SupplierOffer, Listing, OrderLine.

### ProductIdentifier
`identifier_id:ID[R]`, `product_id:ID[C xor variant_id]`, `variant_id:ID[C xor product_id]`, `identifier_type:ENUM[R]`, `identifier_value:STRING(255)[R]`, `issuer:STRING(255)[O]`, `verified:BOOL[R]`, `verification_method:ENUM[O]`, `valid_from:TIMESTAMP[O]`, `valid_to:TIMESTAMP[O]`.
Validation: type-specific format/checksum; conflicting one-to-many mappings become IDENTITY_CONFLICT, not auto-merged.

### Brand
`brand_id:ID[R]`, `canonical_name:STRING(255)[R]`, `normalized_name:STRING(255)[R]`, `website_reference:URI_REF[O]`, `trademark_risk_state:ENUM[R]`, `marketplace_restriction_state:ENUM[R]`, `authorization_required:BOOL[R]`, `active:BOOL[R]`.
Relations: 1:N Product, BrandAuthorizationEvidence.

### Manufacturer
`manufacturer_id:ID[R]`, `legal_name:STRING(255)[R]`, `display_name:STRING(255)[O]`, `country:STRING(2)[O]`, `official_domain:URI_REF[O]`, `contact_reference:ID[O]`, `verification_state:ENUM[R]`.

### Supplier
`supplier_id:ID[R]`, `legal_name:STRING(255)[R]`, `display_name:STRING(255)[R]`, `domain:URI_REF[O]`, `country:STRING(2)[O]`, `supplier_type:ENUM[R]`, `verification_state:ENUM[R]`, `approval_state:ENUM[R]`, `operational_state:ENUM[R]`, `blind_shipping_supported:BOOL[O]`, `marketplace_compatible:BOOL[O]`, `minimum_order_value:MONEY[O]`, `default_currency:CURRENCY[R]`, `payment_terms_text:TEXT[O]`, `return_policy_reference:URI_REF[O]`, `cancellation_policy_reference:URI_REF[O]`, `catalog_feed_type:ENUM[O]`, `api_available:BOOL[R]`, `edi_available:BOOL[R]`, `sftp_available:BOOL[R]`, `webhook_available:BOOL[R]`, `last_verified_at:TIMESTAMP[O]`, `reliability_score:PERCENT[O]`, `data_quality_score:PERCENT[O]`, `stock_accuracy_score:PERCENT[O]`, `price_accuracy_score:PERCENT[O]`, `tracking_quality_score:PERCENT[O]`, `late_shipment_rate:PERCENT[O]`, `cancellation_rate:PERCENT[O]`, `defect_rate:PERCENT[O]`, `return_rate:PERCENT[O]`.
Rules: ACTIVE requires VERIFIED and APPROVED, valid terms/evidence; metrics carry sample sizes and confidence. No supplier activation or order commitment authorized in current planning mode.
Relations: 1:N Warehouse, SupplierOffer; N:M BrandAuthorization.

### SupplierWarehouse
`warehouse_id:ID[R]`, `supplier_id:ID[R]`, `warehouse_code:STRING(128)[R]`, `country:STRING(2)[R]`, `region:STRING(128)[O]`, `postal_region:STRING(32)[O]`, `timezone:STRING(64)[R]`, `active:BOOL[R]`, `supports_returns:BOOL[R]`, `supports_blind_shipping:BOOL[O]`, `handling_time_min_hours:DECIMAL[O;>=0]`, `handling_time_max_hours:DECIMAL[O;>=min]`.

### SupplierOffer
`supplier_offer_id:ID[R]`, `supplier_id:ID[R]`, `variant_id:ID[R]`, `supplier_sku:STRING(255)[R]`, `warehouse_id:ID[O]`, `unit_cost:MONEY[R]`, `minimum_order_quantity:INT64[R;>=1]`, `case_quantity:INT64[R;>=1]`, `available_quantity_reported:INT64[O;>=0]`, `available_quantity_verified:INT64[O;>=0]`, `inventory_timestamp:TIMESTAMP[O]`, `cost_timestamp:TIMESTAMP[R]`, `handling_time_min_hours:DECIMAL[O]`, `handling_time_max_hours:DECIMAL[O]`, `shipping_cost_estimate:MONEY[O]`, `shipping_confidence:PERCENT[O]`, `map_price:MONEY[O]`, `promotion_price:MONEY[O]`, `promotion_expires_at:TIMESTAMP[O]`, `orderability_state:ENUM[R]`, `data_freshness_state:ENUM[R]`, `supplier_offer_status:ENUM[R]`.
Rules: cost>=0; zero cost must be verified; promotion expires at declared time; supplier and product match scopes consistent; stock not assumed reliable merely because present.

### Marketplace
`marketplace_id:ID[R]`, `name:STRING(128)[R]`, `region:STRING(64)[R]`, `country:STRING(2)[R]`, `currency:CURRENCY[R]`, `marketplace_type:ENUM[R]`, `connector_id:ID[O]`, `fulfillment_services:JSON/ENUM_SET[O]`, `api_version_active:STRING(64)[O]`, `webhooks_supported:BOOL[R]`, `rate_limit_profile_id:ID[O]`, `policy_profile_id:ID[O]`, `fee_profile_id:ID[O]`, `operational_state:ENUM[R]`.

### MarketplaceCatalogItem
`catalog_item_id:ID[R]`, `marketplace_id:ID[R]`, `external_item_id:STRING(255)[R]`, `product_id:ID[R]`, `variant_id:ID[O]`, `match_state:ENUM[R]`, `match_confidence:PERCENT[O]`, `marketplace_title:STRING(500)[O]`, `marketplace_brand:STRING(255)[O]`, `category_external:STRING(255)[O]`, `category_internal:ID[O]`, `attribute_snapshot:JSON[O]`, `last_seen_at:TIMESTAMP[R]`, `active_state:ENUM[R]`.
Rules: uncertain matches are not auto-eligible; catalog item is not equivalent to seller listing.

### Listing
`listing_id:ID[R]`, `marketplace_id:ID[R]`, `catalog_item_id:ID[R]`, `variant_id:ID[R]`, `channel_sku:STRING(255)[R]`, `fulfillment_method:ENUM[R]`, `price:MONEY[R;>=0]`, `advertised_quantity:INT64[R;>=0]`, `listing_state:ENUM[R]`, `suppression_state:ENUM[R]`, `policy_state:ENUM[R]`, `economic_state:ENUM[R]`, `content_version_id:ID[R]`, `shipping_profile_reference:ID[O]`, `last_successful_sync:TIMESTAMP[O]`, `last_failed_sync:TIMESTAMP[O]`, `external_listing_id:STRING(255)[O]`, `marketplace_response_version:STRING(64)[O]`.
Rules: ACTIVE requires product identity, policy, economics, quantity and authorization gates; active is external-confirmed, not merely locally requested.

### ListingVersion
`listing_version_id:ID[R]`, `listing_id:ID[R]`, `version_number:INT64[R]`, `title:STRING(500)[R]`, `bullets:LIST[O]`, `description:TEXT[O]`, `attributes:JSON[O]`, `search_terms:LIST[O]`, `media_references:LIST[O]`, `generated_by:ENUM[R]`, `source_evidence_set:LIST[O]`, `validation_state:ENUM[R]`, `created_at:TIMESTAMP[R]`, `superseded_at:TIMESTAMP[O]`.
Rules: versions immutable, source-backed claims.

### InventoryLocation
`inventory_location_id:ID[R]`, `location_type:ENUM[R]`, `supplier_id:ID[O]`, `warehouse_id:ID[O]`, `marketplace_fulfillment_reference:STRING[O]`, `internal_location_name:STRING[O]`, `country:STRING(2)[O]`, `region:STRING[O]`, `active:BOOL[R]`.

### InventoryBalance
`inventory_balance_id:ID[R]`, `variant_id:ID[R]`, `inventory_location_id:ID[R]`, `reported_quantity:INT64[O;>=0]`, `verified_quantity:INT64[O;>=0]`, `reserved_quantity:INT64[R;>=0]`, `committed_quantity:INT64[R;>=0]`, `damaged_quantity:INT64[R;>=0]`, `quarantine_quantity:INT64[R;>=0]`, `inbound_quantity:INT64[R;>=0]`, `returned_quantity:INT64[R;>=0]`, `safety_buffer_quantity:INT64[R;>=0]`, `available_to_promise:INT64[R;>=0]`, `source_timestamp:TIMESTAMP[O]`, `freshness_state:ENUM[R]`.
Rules: ATP <= verified usable stock - reservations - commitments - safety buffer. Supplier-reported stock may be unreliable; distinguish physically owned vs supplier-available.

### InventoryReservation
`reservation_id:ID[R]`, `variant_id:ID[R]`, `order_line_id:ID[R]`, `location_id:ID[R]`, `quantity:INT64[R;>0]`, `reservation_state:ENUM[R]`, `created_at:TIMESTAMP[R]`, `expires_at:TIMESTAMP[O]`, `consumed_at:TIMESTAMP[O]`, `released_at:TIMESTAMP[O]`, `idempotency_key:STRING(255)[R]`.
Rules: atomic, one consumption, terminal states cannot consume.

### CustomerReference
`customer_reference_id:ID[R]`, `marketplace_id:ID[R]`, `external_customer_token:STRING[O]`, `shipping_address_reference:ID[O]`, `contact_channel_reference:ID[O]`, `retention_class:ENUM[R]`, `redaction_state:ENUM[R]`.
Rules: minimize personal data; customer details not needlessly copied into AI context.

### Order
`order_id:ID[R]`, `marketplace_id:ID[R]`, `external_order_id:STRING(255)[R]`, `customer_reference_id:ID[O]`, `order_state:ENUM[R]`, `order_time:TIMESTAMP[R]`, `currency:CURRENCY[R]`, `gross_merchandise_total:MONEY[R]`, `discount_total:MONEY[R]`, `tax_total:MONEY[R]`, `shipping_revenue:MONEY[R]`, `marketplace_fee_estimate:MONEY[O]`, `fraud_risk_state:ENUM[R]`, `fulfillment_state:ENUM[R]`, `financial_state:ENUM[R]`, `reconciliation_state:ENUM[R]`, `idempotency_root:STRING[R]`.
Rules: unique `(marketplace_id, external_order_id, account_scope)`; lifecycle explicit; external corrections recorded, not overwritten.

### OrderLine
`order_line_id:ID[R]`, `order_id:ID[R]`, `listing_id:ID[R]`, `variant_id:ID[R]`, `quantity:INT64[R;>0]`, `unit_sale_price:MONEY[R]`, `discount_allocated:MONEY[R]`, `tax_allocated:MONEY[R]`, `supplier_offer_selected:ID[O]`, `expected_supplier_cost_snapshot:MONEY[O]`, `expected_shipping_snapshot:MONEY[O]`, `expected_fee_snapshot:MONEY[O]`, `expected_profit_snapshot:MONEY[O]`, `realized_profit:MONEY[O]`, `line_state:ENUM[R]`.
Rules: snapshots immutable, order/line totals reconcile; supplier choice must be approved.

### FulfillmentPlan
`fulfillment_plan_id:ID[R]`, `order_line_id:ID[R]`, `fulfillment_type:ENUM[R]`, `primary_source_reference:ID[R]`, `backup_source_reference:ID[O]`, `expected_cost:MONEY[R]`, `expected_delivery_date:DATE[O]`, `reliability_score:PERCENT[O]`, `plan_state:ENUM[R]`, `selected_reason:TEXT[R]`, `decision_reference:ID[R]`.

### Shipment
`shipment_id:ID[R]`, `order_id:ID[R]`, `fulfillment_plan_id:ID[R]`, `carrier:STRING[R]`, `service_level:STRING[O]`, `origin_location:ID[O]`, `ship_time:TIMESTAMP[O]`, `expected_delivery:TIMESTAMP[O]`, `actual_delivery:TIMESTAMP[O]`, `shipment_state:ENUM[R]`, `tracking_number:STRING[O]`, `tracking_confidence:PERCENT[O]`, `external_shipment_reference:STRING[O]`.

### Package
`package_id:ID[R]`, `shipment_id:ID[R]`, `weight:DECIMAL[O]`, `dimensions:STRUCT[O]`, `package_type:ENUM[O]`, `tracking_number:STRING[O]`, `insured_value:MONEY[O]`, `contents:LIST[O]`.

### TrackingEvent
`tracking_event_id:ID[R]`, `shipment_id:ID[R]`, `carrier_event_code:STRING[R]`, `normalized_state:ENUM[R]`, `event_time:TIMESTAMP[R]`, `received_at:TIMESTAMP[R]`, `location_text:STRING[O]`, `raw_event_reference:URI_REF[O]`, `sequence_number:INT64[O]`, `dedup_hash:HASH[R]`.

### Return
`return_id:ID[R]`, `order_id:ID[R]`, `external_return_id:STRING[O]`, `return_state:ENUM[R]`, `reason_code:ENUM[R]`, `customer_reason_text:TEXT[O]`, `requested_at:TIMESTAMP[R]`, `authorized_at:TIMESTAMP[O]`, `received_at:TIMESTAMP[O]`, `disposition_state:ENUM[R]`, `refund_required:BOOL[R]`, `supplier_recovery_state:ENUM[R]`, `return_shipping_cost:MONEY[O]`.

### ReturnLine
`return_line_id:ID[R]`, `return_id:ID[R]`, `order_line_id:ID[R]`, `quantity:INT64[R;>0]`, `condition_received:ENUM[O]`, `disposition:ENUM[O]`, `recoverable_quantity:INT64[O;>=0]`, `supplier_claim_reference:STRING[O]`.

### Refund
`refund_id:ID[R]`, `order_id:ID[R]`, `return_id:ID[O]`, `refund_type:ENUM[R]`, `refund_amount:MONEY[R;>=0]`, `refund_currency:CURRENCY[R]`, `refund_state:ENUM[R]`, `external_refund_reference:STRING[O]`, `idempotency_key:STRING[R]`, `requested_at:TIMESTAMP[R]`, `confirmed_at:TIMESTAMP[O]`.
Rules: aggregate confirmed refunds <= refundable balance unless specifically explained marketplace correction, never blindly retry uncertain result.

### FinancialEvent
`financial_event_id:ID[R]`, `event_type:ENUM[R]`, `order_id:ID[O]`, `order_line_id:ID[O]`, `settlement_id:ID[O]`, `amount:DECIMAL[R]`, `currency:CURRENCY[R]`, `event_time:TIMESTAMP[R]`, `source:ENUM[R]`, `source_reference:STRING[R]`, `ledger_account:STRING[R]`, `counter_account:STRING[R]`, `reversal_of:ID[O]`, `correction_of:ID[O]`, `immutable_hash:HASH[R]`.
Rules: posted events are immutable; use compensation/reversal; double-entry reference consistency.

### Settlement
`settlement_id:ID[R]`, `marketplace_id:ID[R]`, `external_settlement_id:STRING[R]`, `period_start:TIMESTAMP[R]`, `period_end:TIMESTAMP[R]`, `gross_sales:MONEY[R]`, `fees:MONEY[R]`, `refunds:MONEY[R]`, `reserves:MONEY[R]`, `adjustments:MONEY[R]`, `expected_net:MONEY[R]`, `actual_net:MONEY[O]`, `difference:MONEY[O]`, `settlement_state:ENUM[R]`, `reconciliation_state:ENUM[R]`.
Rules: unresolved differences remain explicit and traceable.

### PolicyRule
`policy_rule_id:ID[R]`, `marketplace_id:ID[O]`, `supplier_id:ID[O]`, `country:STRING(2)[O]`, `category_id:ID[O]`, `rule_type:ENUM[R]`, `rule_text:TEXT[R]`, `source_reference:URI_REF[R]`, `effective_from:TIMESTAMP[R]`, `effective_to:TIMESTAMP[O]`, `verification_state:ENUM[R]`, `severity:ENUM[R]`, `action_if_violated:ENUM[R]`, `last_reviewed_at:TIMESTAMP[R]`.
Rules: local marketplace policies only; shared protected-action rules not defined.

### Evidence
`evidence_id:ID[R]`, `claim_type:ENUM[R]`, `entity_reference:ID[R]`, `source_type:ENUM[R]`, `source_reference:URI_REF[R]`, `observed_at:TIMESTAMP[R]`, `content_hash:HASH[R]`, `summary:TEXT[O]`, `confidence:PERCENT[O]`, `freshness_state:ENUM[R]`, `verification_state:ENUM[R]`, `supersedes_evidence_id:ID[O]`.

### DecisionProposal
`decision_id:ID[R]`, `decision_type:ENUM[R]`, `subject_reference:ID[R]`, `problem_statement:TEXT[R]`, `evidence_set:ID_SET[R]`, `assumptions:TEXT_LIST[R]`, `uncertainties:TEXT_LIST[R]`, `alternatives:LIST[R]`, `recommended_option:TEXT[R]`, `expected_outcome:TEXT[R]`, `confidence:PERCENT[O]`, `risk_score:PERCENT[O]`, `compliance_state:ENUM[R]`, `economics_state:ENUM[R]`, `required_authority_class:ENUM[R]`, `execution_state:ENUM[R]`.
**Final mapping to Command Center authority is intentionally blank.**

### RiskAssessment
`risk_assessment_id:ID[R]`, `subject_reference:ID[R]`, `risk_type:ENUM[R]`, `probability:PERCENT[O]`, `impact:ENUM[R]`, `detectability:ENUM[R]`, `risk_score:PERCENT[O]`, `mitigations:TEXT_LIST[R]`, `residual_risk:PERCENT[O]`, `evidence_set:ID_SET[R]`, `review_due:TIMESTAMP[O]`.

### Incident
`incident_id:ID[R]`, `severity:ENUM[R]`, `incident_type:ENUM[R]`, `detected_at:TIMESTAMP[R]`, `affected_entities:ID_SET[R]`, `blast_radius:TEXT[R]`, `financial_exposure:MONEY[O]`, `customer_impact:TEXT[O]`, `marketplace_impact:TEXT[O]`, `containment_state:ENUM[R]`, `recovery_state:ENUM[R]`, `root_cause_state:ENUM[R]`, `resolved_at:TIMESTAMP[O]`, `postmortem_reference:URI_REF[O]`.

### ConnectorDefinition
`connector_id:ID[R]`, `connector_type:ENUM[R]`, `external_system:STRING[R]`, `connector_version:STRING[R]`, `api_version:STRING[O]`, `authentication_type:ENUM[R]`, `read_capabilities:ENUM_SET[R]`, `write_capabilities:ENUM_SET[R]`, `rate_limit_profile:ID[O]`, `webhook_capabilities:ENUM_SET[R]`, `certification_state:ENUM[R]`, `operational_state:ENUM[R]`.

### CapabilityCertification
`certification_id:ID[R]`, `capability:ENUM[R]`, `version:STRING[R]`, `test_suite_version:STRING[R]`, `environment:ENUM[R]`, `tests_total:INT64[R]`, `tests_passed:INT64[R]`, `tests_failed:INT64[R]`, `critical_failures:INT64[R]`, `certification_state:ENUM[R]`, `certified_at:TIMESTAMP[O]`, `expires_at:TIMESTAMP[O]`.
Rules: `passed + failed == total` for terminal test run; PASS requires critical_failures=0 and all mandatory cases pass. Current plan has **no executed tests**.

## Referential integrity and company isolation
- All foreign keys must reference an authorized scope; no implicit cross-company joins.
- Unique external identifiers are namespaced by marketplace+seller account or supplier+supplier account, not globally assumed unique.
- SKU and GTIN are different identity levels; condition/pack size cannot be erased.
- All generated text/content that makes claims must reference product truth evidence.
- Order/financial history is append-only with corrections.
- No schema above defines the final Command Center identity, memory or interop contract.

## Intentional future implementation choices, not yet resolved
Physical DB, index definitions, precision/currency-specific rounding modes, max text sizes, retention schedules, source-of-truth priority per marketplace, exact confidence thresholds, and Command Center field mappings must be verified later. These are **design parameters**, not evidence of finished executable SQL migrations.
