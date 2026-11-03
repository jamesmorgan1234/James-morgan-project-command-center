# Project-local data model — conceptual specification

**Status:** planning design only; not a deployed schema, no database migrations, no shared Command Center schemas. Required fields and constraints are *proposed project-local implementation requirements*, not evidence of implementation.

## Common data types
- `UUID`: unique row identifier.
- `TEXT`: UTF-8 string; apply field-specific length and normalization.
- `MONEY`: integer minor currency units (USD cents), never float.
- `DECIMAL`: fixed point numeric, precision configured per business field.
- `TRISTATE`: `YES|NO|UNKNOWN`; default UNKNOWN, never silently false.
- `DATE`, `TIMESTAMP`: ISO 8601 date, UTC for persisted instant.
- `ENUM`: constrained set of values; define schema version.
- `JSON`: versioned evidence-only where stable structure isn't viable.
- `HASH`: SHA-256 or suitable cryptographic digest of evidence/documents.
- `URI`: source locator; may be missing for paper sources.
- `PERCENT`: decimal [0,1]; reject out-of-bounds values.
- `RANGE_MONEY`: low/likely/high cents; require low <= likely <= high.
- `PHONE`: normalized E.164 when confidently known; never make up digits.
- `EMAIL`: syntactic validation is not consent or proof of identity.

## Common entity envelope
Each persisted, consequential entity: `record_id UUID required unique immutable`, `record_version INTEGER >=1 required`, `created_at/updated_at TIMESTAMP required`, `created_by ENUM(system,James,imported,professional,external_source) required`, `status ENUM required`, `verification_status ENUM(unverified,machine_verified,manually_verified,professional_verified,conflicted) required`, `source_observation_ids UUID[] optional`, `supersedes_record_id UUID optional FK same entity`, `content_hash HASH required where attached documents/evidence exist`, `notes TEXT optional`. Corrections are versioned; protected actions are append-only audited.

## Canonical entities

### PROPERTY
`property_id UUID PK`; `canonical_address TEXT nullable when unavailable`; `address_status ENUM(verified,probable,conflicting,unknown) required`; `property_type ENUM(single_family,duplex,triplex,fourplex,condo,townhouse,manufactured,land,other,unknown) required`; `residential_unit_count INTEGER 0..4 or UNKNOWN`; `latitude/longitude DECIMAL nullable`; `county/state TEXT required`; `zip_code TEXT nullable`; `occupancy_signal ENUM(owner_occupied,tenant_occupied,vacant,mixed,unknown)`; `condition_signal ENUM(good,moderate,distressed,severe,unknown)`; `active_listing_signal TRISTATE`; `property_status ENUM(active,sold,demolished,combined,split,unknown)`.
Relations: 1:N PARCEL; 1:N OPPORTUNITY over time.

### PARCEL
`parcel_id_internal UUID PK`; `property_id UUID FK required`; `jurisdiction_parcel_number TEXT required`; `county TEXT required`; `legal_description TEXT optional`; `lot_size/building_sqft DECIMAL optional`; `year_built INT optional`; `bedrooms/bathrooms DECIMAL optional`; `assessed_value MONEY optional`; `taxing_district TEXT optional`; `parcel_status ENUM(active,retired,split,combined,unknown)`; unique indexed (`county`,`jurisdiction_parcel_number`,`version/identity namespace`) to handle jurisdiction ID reuse.

### OWNER
`owner_id UUID PK`; `owner_type ENUM(person,trust,estate,LLC,corporation,partnership,government,other,unknown)`; `recorded_name TEXT required`; `normalized_name TEXT required`; `mailing_address TEXT optional`; `identity_confidence PERCENT required`; `deceased_signal TRISTATE`; `entity_active_signal TRISTATE` where relevant. Do not infer protected/sensitive attributes.

### OWNERSHIP_INTEREST
`ownership_interest_id UUID PK`; `property_id UUID FK required`; `owner_id UUID FK required`; `interest_type ENUM(record_owner,co_owner,trustee,estate_interest,entity_interest,possible_interest,unknown)`; `interest_percentage DECIMAL optional`; `effective_date DATE optional`; `recorded_instrument_id UUID FK optional`; `authority_to_sell TRISTATE required`; `authority_evidence UUID[] optional`; `status ENUM(current,historical,disputed,unknown)`. M:N owner/property via this table.

### SOURCE_OBSERVATION
`source_observation_id UUID PK`; `source_adapter_id UUID required`; `jurisdiction TEXT required`; `source_authority ENUM(official_government,court,professional,seller,buyer,third_party,derived)`; `source_uri URI optional`; `retrieved_at TIMESTAMP required`; `effective_date DATE optional`; `raw_content_hash HASH required`; `parser_version TEXT required`; `field_name TEXT required`; `raw_value TEXT optional`; `normalized_value TYPED nullable on parse failure`; `confidence PERCENT required`; `freshness_deadline TIMESTAMP optional`; `status ENUM(current,stale,superseded,conflicted,parsing_error)`.

### TAX_SNAPSHOT
`tax_snapshot_id UUID PK`; `property_id UUID FK required`; `tax_year INTEGER required`; `current_tax_due/delinquent_tax_due/penalties_interest/total_due MONEY optional`; `payment_plan_signal/tax_sale_signal TRISTATE`; `effective_date DATE required`; `source_observation_id UUID FK required`. Never treat due taxes as purchase price.

### RECORDED_INSTRUMENT_SIGNAL
`instrument_id UUID PK`; `property_id UUID FK required`; `instrument_type ENUM(deed,mortgage,release,lien,assignment,easement,judgment_related,lease,other,unknown)`; `recorded_date DATE required`; `instrument_number TEXT optional`; `grantor_names/grantee_names TEXT[] optional`; `face_amount MONEY optional`; `release_status ENUM(open_signal,released_signal,partially_released,unknown)`; `source_observation_id UUID FK required`; `professional_title_verified BOOLEAN required default false`.

### COURT_CASE_SIGNAL
`court_case_signal_id UUID PK`; `property_id/owner_id UUID FK optional`; `court TEXT required`; `case_number TEXT required`; `case_type ENUM(foreclosure,probate,bankruptcy_signal,eviction,civil_judgment,other,unknown)`; `case_status TEXT required`; `next_known_date DATE optional`; `risk_level ENUM(low,moderate,high,critical,unknown)`; `professional_review_required BOOLEAN required`. Name match alone is not proof of case identity.

### CONTACT_CANDIDATE
`contact_id UUID PK`; `owner_id UUID FK required`; `channel ENUM(mail,phone,email,other)`; `value TEXT required`; `source TEXT required`; `confidence PERCENT required`; `permission_status ENUM(unchecked,eligible,restricted,suppressed,professional_review,unknown)`; `do_not_contact BOOLEAN required default false`; `entity_specific_opt_out BOOLEAN required default false`; `last_compliance_check TIMESTAMP optional`. Contact eligibility must be channel-specific.

### OPPORTUNITY
`opportunity_id UUID PK`; `property_id UUID FK required`; `discovery_reason_codes ENUM[] required`; `discovered_at TIMESTAMP required`; `workflow_state DEAL_STATE required`; `priority_tier ENUM(A,B,C,D,X)`; `current_owner_resolution ENUM(verified,probable,conflicted,unresolved)`; `data_completeness/data_freshness_score PERCENT required`; `next_required_action TEXT required`; `hard_block_count/soft_risk_count INTEGER >=0 required`.

### COMPARABLE_SALE
`comp_id UUID PK`; `subject_property_id UUID FK required`; `comp_property_identifier TEXT required`; `sale_date DATE required`; `sale_price MONEY required`; `distance DECIMAL optional`; `property_type_match PERCENT required`; `size_adjustment/condition_adjustment/time_adjustment/location_adjustment/other_adjustments MONEY optional`; `adjusted_value MONEY required`; `source_quality PERCENT required`; `comp_weight PERCENT required`.

### VALUATION_CASE
`valuation_case_id UUID PK`; `property_id UUID FK required`; `valuation_date DATE required`; `as_is_value RANGE_MONEY required`; `ARV RANGE_MONEY optional`; `conservative_cash_buyer_value RANGE_MONEY required`; `liquidation_value/rental_investor_value RANGE_MONEY optional`; `methods_used ENUM[] required`; `comp_ids UUID[] required unless documented exception`; `model_disagreement DECIMAL required`; `confidence PERCENT required`; `hard_stale_after TIMESTAMP required`.

### REPAIR_CASE
`repair_case_id UUID PK`; `property_id UUID FK required`; `estimate_date DATE required`; cost ranges optional by `roof,foundation,HVAC,electrical,plumbing,water_damage,kitchen,bathrooms,windows_doors,flooring_paint,exterior,cleanup,structural,other`; `total_repairs RANGE_MONEY required`; `inspection_basis ENUM(records_only,photos,seller_report,buyer_report,walkthrough,professional_inspection,mixed)`; `confidence PERCENT required`. Cost ranges are not contractor guarantees.

### BUYER_PROFILE
`buyer_id UUID PK`; `buyer_type ENUM(flipper,landlord,developer,fund,wholesaler,other)`; `identity_verified BOOLEAN required`; `proof_of_funds_status ENUM(not_requested,pending,verified,expired,rejected)`; `preferred_zips TEXT[] optional`; `property_types ENUM[] optional`; `minimum_price/maximum_price/maximum_repairs/minimum_ARV MONEY optional`; `target_rent_metrics JSON optional`; `closing_speed_days INTEGER optional`; `assignment_tolerance TRISTATE`; `reliability_score PERCENT required once enough observations`; `retrades_count/failed_closings_count/successful_closings_count INTEGER >=0 required`; `active_status BOOLEAN required`.

### BUYER_EVIDENCE
`buyer_evidence_id UUID PK`; `buyer_id UUID FK required`; `property_id UUID FK optional`; `evidence_type ENUM(bid,proof_of_funds,closing,failed_closing,retrade,communication,criteria_update)`; `amount MONEY optional`; `observed_at TIMESTAMP required`; `verified BOOLEAN required`; `source_observation_ids UUID[] required`.

### UNDERWRITING_CASE
`underwriting_id UUID PK`; `opportunity_id UUID FK required`; `seller_target_price MONEY optional`; `seller_walkaway_ceiling MONEY required before offer-ready`; `expected_buyer_price/conservative_buyer_price/stress_buyer_price MONEY required`; `expected_assignment_spread/conservative_assignment_spread/stress_assignment_spread MONEY required`; `approved_service_costs MONEY required default 0`; `deal_side_cash_at_risk MONEY required`; `estimated_days_to_close INTEGER >0 required`; `estimated_probability_of_close PERCENT required`; `title_risk_score/buyer_depth_score/valuation_confidence/repair_confidence/human_effort_score PERCENT required`; `economics_gate ENUM(pass,fail,manual_review)`; `no_loss_gate ENUM(pass,fail,approval_required)`.

### COMPLIANCE_CASE
`compliance_case_id UUID PK`; `opportunity_id UUID FK required`; `jurisdiction TEXT required`; `rule_pack_version TEXT required`; `wholesaler_disclosure_required TRISTATE required`; `wholesaler_disclosure_status ENUM(not_required,required_missing,delivered_unsigned,signed_valid,stale_invalid,professional_review)`; `outreach_channel_status JSON required`; `contract_review_status ENUM(not_started,pending,passed,failed,attorney_review_required)`; `licensing_review_status ENUM(not_evaluated,cleared_for_structure,professional_review_required)`; `unresolved_compliance_blocks TEXT[] required`; `last_rule_verification TIMESTAMP required`.

### OUTREACH_EVENT
`outreach_event_id UUID PK`; `opportunity_id/contact_id UUID FK required`; `channel ENUM(mail,phone,email,other)`; `event_type ENUM(prepared,approved,sent,delivered,responded,bounced,opted_out,suppressed)`; `timestamp TIMESTAMP required`; `content_hash HASH required for message`; `permission_evidence_id UUID optional`; `operator ENUM(system,James,approved_service)`.

### CONTRACT_CASE
`contract_case_id UUID PK`; `opportunity_id UUID FK required`; `template_version TEXT required`; `document_hash HASH required`; `purchase_price MONEY required`; `earnest_money_required MONEY required default 0`; `earnest_money_approved BOOLEAN required`; `assignability_status ENUM(explicitly_assignable,consent_required,prohibited,unclear)`; `inspection_deadline/title_objection_deadline/assignment_deadline DATE optional`; `closing_date DATE required`; `seller_signature_status/James_signature_status ENUM(missing,complete)`; `required_disclosure_status ENUM(missing,invalid,complete)`; `binding_status ENUM(draft,approval_required,executed,terminated,expired)`; `protected_action_approval_id UUID FK required before execution`.

### TITLE_CASE
`title_case_id UUID PK`; `opportunity_id UUID FK required`; `title_provider TEXT optional`; `professional_status ENUM(not_ordered,ordered,pending,clear,exceptions,uninsurable,cancelled)`; `record_owner_confirmed TRISTATE`; `mortgage_status/lien_status/judgment_status/tax_status ENUM(clear,payoff_required,unresolved,unknown)`; `probate_issue/bankruptcy_issue TRISTATE`; `other_exceptions TEXT[] required`; `estimated_cure_days INTEGER optional`; `estimated_cure_cost_borne_by_James MONEY required default 0`; `closing_eligible TRISTATE required`.

### ASSIGNMENT_CASE
`assignment_case_id UUID PK`; `contract_case_id UUID FK required`; `buyer_id UUID FK required`; `assignment_fee/buyer_price MONEY required`; `buyer_deposit MONEY optional`; `proof_of_funds_valid BOOLEAN required`; `backup_buyer_ids UUID[] optional`; `assignment_document_hash HASH optional`; `James_approval_id UUID FK required before execution`; `assignment_status ENUM(draft,approval_required,executed,buyer_failed,terminated)`.

### CLOSING_CASE
`closing_case_id UUID PK`; `opportunity_id UUID FK required`; `scheduled_close TIMESTAMP optional`; `seller_ready/buyer_ready/title_ready/documents_ready/funds_verified BOOLEAN required`; `closing_agent TEXT optional`; `settlement_statement_hash HASH optional`; `expected_assignment_proceeds MONEY required`; `actual_assignment_proceeds MONEY optional`; `close_status ENUM(not_ready,ready,scheduled,closed_pending_funds,failed,cancelled,funds_cleared)`; `funds_cleared_at TIMESTAMP optional`; `bank_receipt_verified BOOLEAN required default false`.

### EXPENSE_PROPOSAL
`expense_proposal_id UUID PK`; `opportunity_id UUID FK optional`; `service_name/purpose TEXT required`; `one_time_or_recurring ENUM(one_time,recurring)`; `exact_cost MONEY optional`; `maximum_cost MONEY required >=0`; `free_alternative_available BOOLEAN required`; `free_alternative_description TEXT optional`; `expected_information_gain TEXT required`; `required_or_optional ENUM(optional,transaction_blocking)`; `approval_status ENUM(pending,approved,skipped,expired)`; `approval_record_id UUID FK optional`. Actual cost exceeding approval cap must block.

### APPROVAL_RECORD
`approval_id UUID PK`; `action_type ENUM(service_purchase,contract_signature,deposit,money_movement,auction_bid,title_acquisition,recurring_subscription,other_protected_action)`; `action_description TEXT required`; `maximum_financial_exposure MONEY required >=0`; `approved_by` must resolve to James for protected actions; `approved_at TIMESTAMP required`; `expires_at TIMESTAMP optional`; `single_use BOOLEAN default true`; `consumed_at TIMESTAMP optional`; `request_hash HASH required`. Never reuse for changed action.

### AUDIT_EVENT
`audit_event_id UUID PK`; `entity_type TEXT required`; `entity_id UUID required`; `event_type TEXT required`; `previous_state/new_state TEXT optional`; `actor/reason TEXT required`; `evidence_ids UUID[] optional`; `approval_id UUID FK optional`; `timestamp TIMESTAMP required`; append only.

### OUTCOME_RECORD
`outcome_id UUID PK`; `opportunity_id UUID FK required`; `outcome ENUM(closed_profit,rejected,seller_declined,buyer_failed,title_failed,compliance_failed,expired,cancelled,other)`; `projected_fee_at_underwriting/projected_fee_at_assignment MONEY optional`; `actual_fee_received MONEY required default 0`; `approved_service_costs_total/deal_side_loss MONEY required default 0`; `days_discovery_to_contract/days_contract_to_close/days_discovery_to_funds INTEGER optional`; `prediction_errors JSON required`; `failure_reasons TEXT[] required`.

### LEARNING_CANDIDATE
`learning_candidate_id UUID PK`; `scope` must equal project_local until approved global contract exists; `source_outcome_ids UUID[] required`; `lesson_type ENUM(valuation,repair,buyer,source,outreach,closing,title,workflow,risk)`; `proposed_change TEXT required`; `evidence_strength PERCENT required`; `evaluation_status ENUM(proposed,testing,locally_approved,rejected)`; `promotion_to_Command_Center = HOLD/UNDEFINED`.

## Additional design corrections needed before coding
1. Conceptual fields marked `RANGE_MONEY` must become structured composite value columns/typed documents in the selected local persistence model.
2. `UUID[]` references require referential validation, or preferably proper junction tables at implementation.
3. Ensure legal authority and national/state permitted communications can represent UNKNOWN and professional review; do not hardcode all transactions as covered residential real estate.
4. Credentials, bank details and signatures are **never** stored in a shared project schema without precise human-approved access and compliance design.
5. Exact confidence thresholds and retention periods remain to be calibrated and legally reviewed, not guessed.
