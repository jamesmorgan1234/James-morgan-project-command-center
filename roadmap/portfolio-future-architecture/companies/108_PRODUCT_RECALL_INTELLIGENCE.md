# Company 108 — Product Recall Intelligence

**Company ID:** `company:future:108`  
**Primary project:** `project:company:future:108`  
**Proposed Brain:** `brain:company:future:108:v1`  
**Provisional roadmap version:** `COMPANY-108-DRAFT-v1.0.0`  
**Status:** PREPARED LOCALLY / NOT REGISTERED / NOT BUILT / NOT LAUNCHED  
**GitHub authority inspected:** `jamesmorgan1234/James-morgan-project-command-center` @ `build/spec-lock-v2-clean-room` (read-only snapshot 055b9dd7662c)  
**Conformance:** 28 narrative passes + 78 A–BZ evidence maps authored. Final repository conformance verification and external facts remain pending.  
**Authorization:** planning/files only. Do not write GitHub, Supabase or Vercel; do not launch, market, transact, connect accounts or spend.

## Business identity

Purpose: Give retailers, distributors, brand owners, and catalog operators accurate, evidence-linked, product-specific recall intelligence early enough for authorized people to act.

Core problem: Government safety notices are dispersed, updated over time, irregularly classified, and difficult to reconcile against real merchant SKUs, UPCs, brands, models, variants and sold-date ranges.

Value proposition: High-confidence catalog-to-recall matching with explicit uncertainty and amendment-aware alerts; distinguish recall discovery from safety/legal action.

Ideal first customer: Small and mid-market online sellers and multi-location retailers with catalogs but no dedicated recall-monitoring staff.

Monetization model hypothesis: Per-catalog tier, per monitored SKU band, per location or authorized API volume, with a limited free evaluation; no purchase or refund transactions executed by platform.

Non-goal and protected boundary: The system supplies source-backed recall signals; it cannot claim clearance, certify product safety, autonomously issue safety/legal instructions, initiate customer recalls, or automatically refund customers.

## First-class project and full company Brain

Immutable proposed company/project/Brain identities above; independent route, button, status, progression, Needs Me, risk, revenue, sources, versions, credentials and private state; company does not inherit anyone else’s actual revenue or completion. Brain authority is subordinate to Command Center.

No shared customer data, no unilateral spending, and no automatic scaling. Brain may evaluate, advise and propose; Agency may perform only actions authorized in its bounded task packet. Company owner remains James Morgan.

## Complete product tree

- Recall feed dashboard
- Catalog onboarding assistant
- SKU and identifier matching engine
- UPC/EAN/GTIN normalization
- Brand and model resolver
- Variant/lot/serial/date-range matcher
- Recall watchlists
- Seller-specific impact map
- Regulatory source registry
- Manufacturer notice monitor
- Recall amendments and remedy updates
- Multi-location stock-impact dashboard
- Sold-customer trace candidate reports
- Recall timeline visualization
- Recall source evidence bundle
- Safety severity display with official classification context
- Unclassified/uncertain notice queue
- Remedy and return-process reference sheet
- Affected-not-affected review workspace
- Product quarantine recommendation queue
- Merchant compliance task assignments
- Multi-jurisdiction recall coverage pack
- Executive/operations briefings
- Recall notification subscriptions
- API and webhooks
- ERP/catalog connector kits
- Marketplace catalog adapters
- Inventory and order-history matching
- Batch CSV and spreadsheet import
- Recall incident audit reports
- White-label retailer notification portal
- Supplier/brand diligence signals
- Coverage and freshness dashboard
- False-positive review workflow
- Optional category-specific rule packs
- Training and response playbooks


## Complete feature tree

- Official source timestamp and URL per assertion
- Per-source rate limit and ETag/cursor support
- Immutable source snapshot and change hash
- Notice supersession and version tracking
- Duplicate notice clustering
- Canonical entity registry
- Identifier checksum validation
- Lot/batch date interval algebra
- Fuzzy token and phonetic brand candidates
- Image/OCR model-number extraction only with uncertainty
- Multilingual notice normalization
- Conservative exact/fuzzy confidence levels
- Threshold tuning per product category
- Manual match approval, override with rationale
- Reviewed false-positive/false-negative corpus
- Inventory quantity estimates vs verified quantity separation
- Distinct stock, sold, returned and recalled status
- Bulk catalog feeds and delta sync
- Missing catalog field explanations
- Daily source freshness report
- Backfill and replay to historical catalog version
- Product family/variant inheritance with guardrails
- Region/locale/jurisdiction tagging
- Priority queue by officially stated hazard and actual exposure
- Escalation when regulator source unavailable
- Quarantine mode for corrupt feeds
- Duty/consent aware notification templates
- Customer communication draft only, never default send
- Deduplicated notice and alerts
- Emergency source override with evidence
- Release-note and backward-compatible APIs
- Accessibility/mobile view
- Multi-user RBAC with tenant isolation
- Source-coverage gaps clearly visible
- Export API with evidence refs
- Retention/legal hold support
- No claims of comprehensive recall coverage


## Complete customer tree

- Online retailers
- Independent distributors
- Multi-location hardware retailers
- Children’s product merchants
- Consumer electronics sellers
- Marketplace merchants
- Importers and brand owners
- Small catalog aggregators
- Retail compliance teams
- Retail operations and customer service managers


## Complete vertical tree

- Consumer goods
- Home improvement and hardware
- Baby and children’s goods
- Consumer electronics
- Home appliances
- Furniture and home goods
- Outdoor and recreation goods
- Automotive accessories excluding vehicle-safety-domain claims
- Cosmetics and OTC categories only with regulator-specific scope
- Food and medical device monitoring only behind domain-specific verification


## Specialized Brain capability tree

- Regulator source classifier and official-source reliability assessment
- Cross-source recall entity resolution and clustering
- Catalog ontology and attribute extraction
- Manufacturer alias/brand lineage reasoning
- GTIN/UPC/lot/model ambiguity assessment
- Confidence calibration and selective abstention
- Hazard terminology normalization without changing official language
- Official amendment and supersession tracking
- Product impact reasoning with candidate explanations
- Historical date-range eligibility reasoning
- Seller relevance scoring with evidence not assumed sales
- Jurisdiction and product-category classifier
- Incident investigation preparation
- Source freshness and blind-spot reasoning
- False-positive/false-negative root cause learning
- Human reviewer feedback incorporation
- Safety language critique and policy escalation
- Vendor change anomaly analysis
- Portfolio-wide aggregated learning only via privacy-safe validated signals
- Evaluation-set drift detection
- Domain roadmap improvement proposals


## Brain architecture

A specialized company domain Brain (not the Command Center Brain): input/source context → evidence retrieval → task-domain reasoning → deterministic validation → confidence/abstention → policy/owner gate → recommendation to scoped Agency or Needs Me → independent evaluation → versioned feedback.

Domain sources: CPSC Recalls REST API; openFDA enforcement APIs; official manufacturer/regulator notices; source updates may precede or follow classification.

Protected boundary: The system supplies source-backed recall signals; it cannot claim clearance, certify product safety, autonomously issue safety/legal instructions, initiate customer recalls, or automatically refund customers.

Every tool invocation carries immutable `owner_id`, `company_id`, `project_id`, `task_id`, capability, source version, execution budget ceiling **$0**, and authorized action scope; stale or unknown provenance fails closed.

## Complete Agent tree

- Source connector agent
- Official source normalization agent
- Notice deduplication agent
- Catalog import mapping agent
- Identifier resolution agent
- Candidate matching agent
- Confidence calibration agent
- Impact report agent
- Alert proposal agent
- Customer support summarizer
- Supplier notice reconciliation agent
- Privacy and safety verifier
- Independent recall accuracy QA agent
- Source coverage auditor
- Evaluation/benchmark agent
- Incident and recovery agent
- Domain improvement proposal agent


## Deterministic / non-agent services

- Source polling scheduler
- Official-source connector adapters
- Feed integrity/ETag/cursor store
- Structured notice schema validator
- Identifier checksum validator
- Catalog/notice temporal graph
- Exact-match service
- Calibrated fuzzy matching service
- Immutable evidence/artifact storage
- Alert state machine with dedupe
- Notification intent and consent gate
- Tenant RBAC and source scopes
- Impact and timestamp calculation service
- Review/approval queue
- Webhook and signed payload sender only after destination authorization
- Batch export engine
- Audit/replay engine
- Incident kill switch
- Retention and export/delete service
- Usage and zero-cost governor


## Input tree

- Official recall notice feed
- Recall amendment/status
- Regulator hazard description
- Product/brand/model identifiers
- UPC/EAN/GTIN
- Lot/batch/serial rules
- Manufacture/sale date window
- Merchant SKU catalog
- Optional inventory snapshot
- Optional authorized sale history
- Merchant location/market
- Product images with permission
- Support ticket signals as supplemental evidence
- Customer-defined notification contacts
- Source/tenant agreement and retention controls


## Output tree

- Evidence-backed new recall item
- Potential catalog match with confidence
- Confirmed match after reviewer approval
- No-match with no safety-clearance claim
- Match reason/attributes
- Impacted SKU/version/location report
- Suggested stock-control workflow
- Review task and escalation
- Alert with official source and timestamps
- Recall amendments history
- Source freshness/coverage dashboard
- Audit export
- Correction/retraction notice
- API/webhook event
- Merchant performance report


## Workflow tree

- Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring
- Poll official source → normalize → version/dedupe → tag freshness
- Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold
- Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt
- Ambiguous match → Needs Me/reviewer with source evidence and abstention
- Recall updated/retracted → re-evaluate prior matches → issue correction notices to authorized destinations
- Merchant inventory/order records updated → recompute impact → link state to prior report
- Source outage or schema drift → halt affected feed → mark stale coverage → retry/incident
- Quarterly false-positive audit → adjust calibrators after adversarial test and rollback plan
- Customer offboarding → export evidence and purge per retention/legal hold policies


## Integration tree (not activated)

- CPSC Recalls REST API
- openFDA enforcement APIs
- FDA official recall site and official warnings
- Manufacturer public recall URLs
- Ecommerce CSV export
- Shopify catalog API only with tenant consent and approved account
- WooCommerce catalog adapter
- BigCommerce catalog adapter
- Retail ERP/PIM inventory adapters
- Authorized order-history connector
- Email or webhook notifications with verified sender
- Supplier master data feeds
- Optional UPC/GTIN reference data via lawful sources
- CRM/helpdesk ticket handoff
- SIEM/audit export


## API / developer ecosystem

Plan versioned company-scoped read APIs, least-privilege service tokens, signed inbound webhooks, opt-in outbound callbacks, idempotency, cursor pagination, predictable 429 behavior, schema/version negotiation, optional SDKs, audit tracing, compatible migrations and complete API deprecation policy. No public keys/secrets in source or customer data.

## Data architecture / source provenance

- Recall: official ID, agency, status, effective date, published/modified timestamps
- Notice source lineage and immutable source snapshot
- Manufacturer/brand/alias entities
- Product class/taxonomy
- Identifier entities with type/check digit
- Affected lot/serial/date predicates
- Catalog SKU/version/location links
- Source confidence vs match confidence
- Tenant-specific decision approvals
- Official hazard and remedy text immutable
- Notification intent/send status history
- Affected-stock/sales estimates and verified values separate
- Source coverage and staleness state
- False-positive/negative adjudications
- Rights/consent logs
- Versioned matching algorithms/models
- Deletion/hold/export semantics


## Data moat / IP / differentiation

- Catalog-to-notice human-labeled matching corpus
- Official amendment timeline graph
- Merchant-specific coverage graph and feedback
- Category-specific identifiers and alias intelligence
- Audit-ready evidence bundle quality
- Calibrated abstention and transparent matching
- Source freshness reliability and amendment response


## Monetization candidate tree

- SKU-based monthly monitoring tiers
- Per-location tiers
- Premium amendment/priority alerts
- Multi-region data coverage packs
- Historical exposure reports
- Supplier risk snapshots
- Catalog integration/onboarding fee only if owner authorizes outgoing setup expenses
- API usage metering with customer entitlements
- Enterprise audit export
- White-label merchant notice widgets
- Vertical-specific modules
- Service-provider/OEM licensing


## Packaging and product tiers

- Starter: limited-SKU alerts and manual import
- Merchant: catalog sync, confidence review and historical feed
- Multi-location: stock/sales impact and role-based review
- Enterprise: API, audit, policies, region packs and private integrations
- Advisory-only source watchlists for trials


## Distribution and acquisition channels (planning only)

- Inbound educational recall-monitoring examples
- Free anonymized sample report
- Merchant safety/compliance communities
- Ecommerce app integrations after policy approval
- Retail associations and consultants
- Auditable ROI calculator without claimed prevented losses
- Product-led catalog sample matching
- Supplier ecosystems
- Partner referral program with no unapproved payouts
- Organic search and official-feed educational content


## Customer lifecycle, support and success

Customer states: discovered → qualified → consent/contract/owner authorization → trial/test → live delivery → acceptance → verified paid outcome (if any) → support/corrections → renewal/retention → export/offboard. First real customer is a separate user-controlled activation gate. Support agent classes: Source connector agent, Official source normalization agent, Notice deduplication agent, Catalog import mapping agent, Identifier resolution agent, Candidate matching agent.

## Automation maximum / human intervention minimum

- Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring
- Poll official source → normalize → version/dedupe → tag freshness
- Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold
- Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt
- Ambiguous match → Needs Me/reviewer with source evidence and abstention
- Recall updated/retracted → re-evaluate prior matches → issue correction notices to authorized destinations
- Merchant inventory/order records updated → recompute impact → link state to prior report
- Source outage or schema drift → halt affected feed → mark stale coverage → retry/incident
- Quarterly false-positive audit → adjust calibrators after adversarial test and rollback plan
- Customer offboarding → export evidence and purge per retention/legal hold policies


## Operations / administration

Single-owner $0-first operations; source freshness, queue/capacity limits, customer support, quality and legal exception routing, company-specific audit and retention, exact customer billing truth, reconciliation, disaster restore, proof-oriented release checklist, approvals and no-spend enforcement.

## Security / privacy / compliance / legal / abuse

- Do not issue independent safety certifications, legal advice or product recall initiation
- Official text/hazard/classification must remain distinguishable from inference
- High-consequence matching ambiguous → escalate; never auto-clear
- Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law
- Do not scrape private consumer information from open reports
- If official sources unavailable, show STALE/UNKNOWN not NO RECALL
- Protect report distribution, customer sales history and source/notice integrity
- Verify agency links and provenance; no invented dates/status


## Reliability / failures / edge cases / incident response

- Official notice predates FDA classification
- UPC omitted or shared across variants
- Conflicting brand/manufacturer naming
- Lot number image misread
- Stale source or silent data gap
- Duplicate notice ID with changed remedy
- Recall not covered by selected source
- Recalled only in other jurisdiction
- Catalog incomplete/incorrect
- Wrong timezone for effective date
- Product relabeled/private label
- False positive triggering needless panic
- False negative missing hazardous product
- Leaked sale/customer PII
- Merchant disables safety-critical alerts
- Source site changes rate limits/terms
- Bad source translation changes severity
- Customer mistakenly treats no match as safety clearance
- Supplier contradicts regulator
- Unauthorized customer notification or refund


## Observability / KPIs / economic measurements

- Source publication-to-detection latency
- Recall coverage by source/category
- Official-feed freshness and missing-source hours
- Precision/recall and calibration on reviewer-labeled cases
- False-negative critical severity
- Reviewer workload per 1k notices
- Time-to-first-relevant-alert
- Customer match acceptance and override rate
- SKU monitoring cost
- MRR/retention/churn only from actual billing
- Support incidents and staleness
- Affected units only when evidence-backed


## Testing / independent verification / Brain evaluations

Require unit, contract/schema, integration, end-to-end, accessibility, negative/abuse, privacy-isolation, authorization, no-spend, idempotency/retry, outage recovery, drift, benchmark and stress tests; model or heuristic evaluation must include a realistic domain-labeled corpus and threshold/abstention gates. A passed mock is not proof of live operation.

Critical acceptance examples: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap, Duplicate notice ID with changed remedy, Recall not covered by selected source, Recalled only in other jurisdiction, Catalog incomplete/incorrect, Wrong timezone for effective date.

## Deployment / scale / performance / cost

Local/free-first validated implementation; only propose paid hosting/API/GPU/communication resources for owner consideration if actual demand and quality/capacity measurements warrant. No automatic paid activation or reinvestment. Exact release identity, tested rollback, per-company resource quotas, incident safe mode, accessible responsive UX.

## Future-technology and strategic expansion candidates

- Barcode/mobile scan support
- Official imagery and product label OCR
- Supplier attestations and signed risk feeds
- Multi-country regulatory ontologies
- Recall-related workflow simulation
- POS and warehouse linkage
- Multilingual consumer-safe draft templates
- Privacy-preserving fleetwide false-positive lessons
- Differential data quality analytics
- Zero-trust product data exchange
- AI source-change anomaly discovery
- Enterprise procurement and supplier governance adjacency


## Cross-company synergy and reuse *candidates*

- Existing company #055 Product Catalog Intelligence for candidate identifier parser only after proof
- Existing company #016 Regulation Change Monitor only for source polling patterns
- Existing company #035 Warranty / Claims for response workflows, not safety decisions
- Existing company #079 Authenticity for provenance contracts
- Existing company #028 Knowledge Base for retrieval core only
- Command Center shared identity/event/evaluation contracts after three-company proof


## Proven capability dependency, blast radius, version and compatibility

Before reuse: prove third-party licensing/IP permission, three-company production-proven maturity where required, compatibility with client schemas and domain safety, tenant boundaries, shadow/canary eval, performance envelope, fallback or fork, rollback, source/version pin and deletion/retention isolation. No broad inheritance merely because concepts are similar.

Blast-radius classification: critical for cross-company financial/credential leaks or unapproved outgoing money; high for domain harm, false claims, silent loss or misrouting; medium for recoverable user experience defects; low only for reversible scoped cosmetic changes. Shared changes require a regression matrix across all affected companies.

## White label / OEM / partners / community / training

Evaluate only if relevant and commercially validated: documented partner integrations, reseller contracts without auto-payouts, approved white-label packages, industry-specific onboarding, help center, sample reports and community education. Do not add an unrelated marketplace or divert the business into a generic platform.

## Internationalization, accessibility, mobile, voice, multimodal

Consider locale/timezone/currency and rights/consent rules, responsive mobile access, WCAG-aligned controls, language packs, text/speech/video inputs only where materially relevant. Safety/legal and accessibility claims must be evaluated against current standards and human review, not self-certified.

## Experimentation / continuous improvement

Each experiment: customer-relevant hypothesis, metric and baseline, independent test, sample limits, owner-approved exposure, versioned rollback and privacy safeguards. A domain Brain may suggest learning packets upward; Command Center validates and scopes any promotion. Do not silently share customer-private memories or models.

## Phased implementation roadmap (sequential gates; parallel work inside gates)

### P0 — Authority and demand validation

**Objective:** Confirm distinct company scope; validate three retailer pain scenarios using publicly available recalls and synthetic catalogs.

**Exit gate:** Source/license review, no-cost prototype, documented customer assumptions, no customer outreach without authorization.

**Dependency:** None acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P0 gate.

**Planned task IDs:** `project:company:future:108:p0:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P1 — Identity, source and safety foundation

**Objective:** Company/project/Brain boundaries, official-source adapters, normalized recall schema, staleness/versioning, tenant isolation.

**Exit gate:** Source fixtures, schema drift tests, explicit unknown; no sensitive data or outbound alerts.

**Dependency:** P0 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P1 gate.

**Planned task IDs:** `project:company:future:108:p1:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P2 — Catalog matching core

**Objective:** SKU import, exact GTIN/model matching, lot/date predicates, confidence and explanation, manual review queue.

**Exit gate:** Labeled evaluation set; high-consequence false negatives measured; ambiguous cases abstain.

**Dependency:** P1 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P2 gate.

**Planned task IDs:** `project:company:future:108:p2:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P3 — Evidence alerts and operations

**Objective:** Source-linked alert workflow, correction/retraction tracking, audit exports, notifications with consent and dedupe.

**Exit gate:** Safe dry-run, zero duplicate sends, notification approval tests and outage handling.

**Dependency:** P2 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P3 gate.

**Planned task IDs:** `project:company:future:108:p3:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P4 — First paid customer validation

**Objective:** Customer authorization, trial-to-paid evidence, merchant workflow fit, retention and support cost measurement.

**Exit gate:** Real customer opt-in and verified payment; no synthetic revenue.

**Dependency:** P3 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P4 gate.

**Planned task IDs:** `project:company:future:108:p4:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P5 — Coverage and vertical depth

**Objective:** CPSC/FDA category packs, manufacturer notices, multilingual notices and multi-location rules.

**Exit gate:** Per-source completeness and legal review, calibrated match performance.

**Dependency:** P4 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P5 gate.

**Planned task IDs:** `project:company:future:108:p5:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P6 — Integrations, API, OEM

**Objective:** Catalog/ERP/PIM connectors, signed customer webhooks, reusable scopes, white label.

**Exit gate:** Connector permissions, sandbox tests, backpressure and version contract.

**Dependency:** P5 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P6 gate.

**Planned task IDs:** `project:company:future:108:p6:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).

### P7 — Scaling, recovery, improvement

**Objective:** Multi-customer operating evidence, data lifecycle, drift monitoring, horizontal capacity and approved future innovation.

**Exit gate:** SLO and restoration drills; cost proposal only; no automatic paid scale.

**Dependency:** P6 acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the P7 gate.

**Planned task IDs:** `project:company:future:108:p7:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).


# Exhaustive 28-pass findings — planning evidence

**01. Core Business:** Government safety notices are dispersed, updated over time, irregularly classified, and difficult to reconcile against real merchant SKUs, UPCs, brands, models, variants and sold-date ranges. High-confidence catalog-to-recall matching with explicit uncertainty and amendment-aware alerts; distinguish recall discovery from safety/legal action. Buyer: Small and mid-market online sellers and multi-location retailers with catalogs but no dedicated recall-monitoring staff.


**02. Product Expansion:** Recall feed dashboard, Catalog onboarding assistant, SKU and identifier matching engine, UPC/EAN/GTIN normalization, Brand and model resolver, Variant/lot/serial/date-range matcher, Recall watchlists. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**03. Customer Expansion:** Online retailers, Independent distributors, Multi-location hardware retailers, Children’s product merchants, Consumer electronics sellers, Marketplace merchants, Importers and brand owners. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**04. Industry / Vertical Expansion:** Consumer goods, Home improvement and hardware, Baby and children’s goods, Consumer electronics, Home appliances, Furniture and home goods, Outdoor and recreation goods. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**05. Specialized Brain:** Regulator source classifier and official-source reliability assessment, Cross-source recall entity resolution and clustering, Catalog ontology and attribute extraction, Manufacturer alias/brand lineage reasoning, GTIN/UPC/lot/model ambiguity assessment, Confidence calibration and selective abstention, Hazard terminology normalization without changing official language. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**06. Agent Decomposition:** Source connector agent, Official source normalization agent, Notice deduplication agent, Catalog import mapping agent, Identifier resolution agent, Candidate matching agent, Confidence calibration agent. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**07. Deterministic Services:** Source polling scheduler, Official-source connector adapters, Feed integrity/ETag/cursor store, Structured notice schema validator, Identifier checksum validator, Catalog/notice temporal graph, Exact-match service. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**08. Data Products:** Recall: official ID, agency, status, effective date, published/modified timestamps, Notice source lineage and immutable source snapshot, Manufacturer/brand/alias entities, Product class/taxonomy, Identifier entities with type/check digit, Affected lot/serial/date predicates, Catalog SKU/version/location links. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**09. API / Developer Products:** CPSC Recalls REST API, openFDA enforcement APIs, FDA official recall site and official warnings, Manufacturer public recall URLs, Ecommerce CSV export, Shopify catalog API only with tenant consent and approved account, WooCommerce catalog adapter. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**10. White Label / OEM / Embedded:** Starter: limited-SKU alerts and manual import, Merchant: catalog sync, confidence review and historical feed, Multi-location: stock/sales impact and role-based review, Enterprise: API, audit, policies, region packs and private integrations, Advisory-only source watchlists for trials. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**11. Enterprise:** Starter: limited-SKU alerts and manual import, Merchant: catalog sync, confidence review and historical feed, Multi-location: stock/sales impact and role-based review, Enterprise: API, audit, policies, region packs and private integrations, Advisory-only source watchlists for trials. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**12. Marketplace / Platform:** The system supplies source-backed recall signals; it cannot claim clearance, certify product safety, autonomously issue safety/legal instructions, initiate customer recalls, or automatically refund customers.. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**13. Monetization:** SKU-based monthly monitoring tiers, Per-location tiers, Premium amendment/priority alerts, Multi-region data coverage packs, Historical exposure reports, Supplier risk snapshots, Catalog integration/onboarding fee only if owner authorizes outgoing setup expenses. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**14. Distribution:** Inbound educational recall-monitoring examples, Free anonymized sample report, Merchant safety/compliance communities, Ecommerce app integrations after policy approval, Retail associations and consultants, Auditable ROI calculator without claimed prevented losses, Product-led catalog sample matching. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**15. Automation:** Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring, Poll official source → normalize → version/dedupe → tag freshness, Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold, Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt, Ambiguous match → Needs Me/reviewer with source evidence and abstention, Recall updated/retracted → re-evaluate prior matches → issue correction notices to authorized destinations, Merchant inventory/order records updated → recompute impact → link state to prior report. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**16. Human-Intervention Elimination:** Remove manual repetition only for permissioned routines. Protected human-only decisions: Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference, High-consequence matching ambiguous → escalate; never auto-clear, Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law, Do not scrape private consumer information from open reports, If official sources unavailable, show STALE/UNKNOWN not NO RECALL.


**17. Moats:** Catalog-to-notice human-labeled matching corpus, Official amendment timeline graph, Merchant-specific coverage graph and feedback, Category-specific identifiers and alias intelligence, Audit-ready evidence bundle quality, Calibrated abstention and transparent matching, Source freshness reliability and amendment response. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**18. Security:** Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference, High-consequence matching ambiguous → escalate; never auto-clear, Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law, Do not scrape private consumer information from open reports, If official sources unavailable, show STALE/UNKNOWN not NO RECALL, Protect report distribution, customer sales history and source/notice integrity. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**19. Privacy:** Recall: official ID, agency, status, effective date, published/modified timestamps, Notice source lineage and immutable source snapshot, Manufacturer/brand/alias entities, Product class/taxonomy, Identifier entities with type/check digit, Affected lot/serial/date predicates, Catalog SKU/version/location links. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**20. Compliance:** Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference, High-consequence matching ambiguous → escalate; never auto-clear, Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law, Do not scrape private consumer information from open reports, If official sources unavailable, show STALE/UNKNOWN not NO RECALL, Protect report distribution, customer sales history and source/notice integrity. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**21. Failure / Edge Cases:** Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap, Duplicate notice ID with changed remedy, Recall not covered by selected source. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**22. Internationalization:** Consumer goods, Home improvement and hardware, Baby and children’s goods, Consumer electronics, Home appliances, Furniture and home goods, Outdoor and recreation goods. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**23. Scale:** Scale by measured real workload; avoid automatic paid infrastructure. Future paths: Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation, POS and warehouse linkage.


**24. Future Technology:** Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation, POS and warehouse linkage, Multilingual consumer-safe draft templates. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**25. Cross-Company Synergy:** Potential compatibility only, not authorization to mix credentials or assets: Existing company #055 Product Catalog Intelligence for candidate identifier parser only after proof, Existing company #016 Regulation Change Monitor only for source polling patterns, Existing company #035 Warranty / Claims for response workflows, not safety decisions, Existing company #079 Authenticity for provenance contracts, Existing company #028 Knowledge Base for retrieval core only, Command Center shared identity/event/evaluation contracts after three-company proof.


**26. Spinoffs:** Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation, POS and warehouse linkage, Multilingual consumer-safe draft templates. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently.


**27. Adversarial Missing-Idea Pass:** Adversarial counterexamples and missing branches: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap, Duplicate notice ID with changed remedy, Recall not covered by selected source, Recalled only in other jurisdiction, Catalog incomplete/incorrect, Wrong timezone for effective date. Treat every case as a test/acceptance or explicit controlled exclusion, not an automatic feature.


**28. Saturation Pass:** Saturation draft outcome: domain list, risks, future packs and boundary reviewed. Additional material ideas must pass relevance, business value, compatibility, economic, safety and source verification: Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation, POS and warehouse linkage, Multilingual consumer-safe draft templates, Privacy-preserving fleetwide false-positive lessons. Independent reviewer signoff is still required.


# A–BZ 78-dimension conformance candidate map

Every dimension below has company-specific proposed evidence, but independent verification has **not** occurred and no percent is earned. Final statuses belong to the exact-head Command Center conformance audit.

**A — Business Identity:** Mission: Give retailers, distributors, brand owners, and catalog operators accurate, evidence-linked, product-specific recall intelligence early enough for authorized people to act. Differentiation: High-confidence catalog-to-recall matching with explicit uncertainty and amendment-aware alerts; distinguish recall discovery from safety/legal action. Boundary: The system supplies source-backed recall signals; it cannot claim clearance, certify product safety, autonomously issue safety/legal instructions, initiate customer recalls, or automatically refund customers.


**B — Complete Product Tree:** Product areas: Recall feed dashboard, Catalog onboarding assistant, SKU and identifier matching engine, UPC/EAN/GTIN normalization, Brand and model resolver. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**C — Complete Feature Tree:** Behavior and controls: Official source timestamp and URL per assertion, Per-source rate limit and ETag/cursor support, Immutable source snapshot and change hash, Notice supersession and version tracking, Duplicate notice clustering. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**D — Complete Customer Tree:** Customer groups: Online retailers, Independent distributors, Multi-location hardware retailers, Children’s product merchants, Consumer electronics sellers. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**E — Complete Vertical Tree:** Vertical packs: Consumer goods, Home improvement and hardware, Baby and children’s goods, Consumer electronics, Home appliances. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**F — Complete Brain Capability Tree:** Specialist reasoning: Regulator source classifier and official-source reliability assessment, Cross-source recall entity resolution and clustering, Catalog ontology and attribute extraction, Manufacturer alias/brand lineage reasoning, GTIN/UPC/lot/model ambiguity assessment. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**G — Brain Architecture:** Brain domain packs: Regulator source classifier and official-source reliability assessment, Cross-source recall entity resolution and clustering, Catalog ontology and attribute extraction, Manufacturer alias/brand lineage reasoning, GTIN/UPC/lot/model ambiguity assessment. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**H — Complete Agent Tree:** Agent specialisms: Source connector agent, Official source normalization agent, Notice deduplication agent, Catalog import mapping agent, Identifier resolution agent. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**I — Deterministic Services:** Deterministic components: Source polling scheduler, Official-source connector adapters, Feed integrity/ETag/cursor store, Structured notice schema validator, Identifier checksum validator. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**J — Input Tree:** Accepted inputs: Official recall notice feed, Recall amendment/status, Regulator hazard description, Product/brand/model identifiers, UPC/EAN/GTIN. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**K — Output Tree:** Produced outputs: Evidence-backed new recall item, Potential catalog match with confidence, Confirmed match after reviewer approval, No-match with no safety-clearance claim, Match reason/attributes. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**L — Workflow Tree:** Operational workflows: Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring, Poll official source → normalize → version/dedupe → tag freshness, Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold, Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt, Ambiguous match → Needs Me/reviewer with source evidence and abstention. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**M — Integration Tree:** Connector surfaces: CPSC Recalls REST API, openFDA enforcement APIs, FDA official recall site and official warnings, Manufacturer public recall URLs, Ecommerce CSV export. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**N — API/Developer Ecosystem:** Developer/API seams: CPSC Recalls REST API, openFDA enforcement APIs, FDA official recall site and official warnings, Manufacturer public recall URLs, Ecommerce CSV export. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**O — Data Architecture:** Scoped schemas: Recall: official ID, agency, status, effective date, published/modified timestamps, Notice source lineage and immutable source snapshot, Manufacturer/brand/alias entities, Product class/taxonomy, Identifier entities with type/check digit. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**P — Data Moat:** Defensible domain data: Catalog-to-notice human-labeled matching corpus, Official amendment timeline graph, Merchant-specific coverage graph and feedback, Category-specific identifiers and alias intelligence, Audit-ready evidence bundle quality. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**Q — IP:** Ownable know-how: Catalog-to-notice human-labeled matching corpus, Official amendment timeline graph, Merchant-specific coverage graph and feedback, Category-specific identifiers and alias intelligence, Audit-ready evidence bundle quality. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**R — Monetization:** Potential revenue models: SKU-based monthly monitoring tiers, Per-location tiers, Premium amendment/priority alerts, Multi-region data coverage packs, Historical exposure reports. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**S — Packaging:** Offers: Starter: limited-SKU alerts and manual import, Merchant: catalog sync, confidence review and historical feed, Multi-location: stock/sales impact and role-based review, Enterprise: API, audit, policies, region packs and private integrations, Advisory-only source watchlists for trials. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**T — Distribution:** Distribution paths: Inbound educational recall-monitoring examples, Free anonymized sample report, Merchant safety/compliance communities, Ecommerce app integrations after policy approval, Retail associations and consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**U — Acquisition Automation:** Acquisition possibilities: Inbound educational recall-monitoring examples, Free anonymized sample report, Merchant safety/compliance communities, Ecommerce app integrations after policy approval, Retail associations and consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**V — Customer Lifecycle:** Customer journey: Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring, Poll official source → normalize → version/dedupe → tag freshness, Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold, Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt, Ambiguous match → Needs Me/reviewer with source evidence and abstention. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**W — Support:** Support functions: Source connector agent, Official source normalization agent, Notice deduplication agent, Catalog import mapping agent, Identifier resolution agent. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**X — Customer Success:** Customer success outcomes: Source publication-to-detection latency, Recall coverage by source/category, Official-feed freshness and missing-source hours, Precision/recall and calibration on reviewer-labeled cases, False-negative critical severity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**Y — Automation Maximum:** Safe automation paths: Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring, Poll official source → normalize → version/dedupe → tag freshness, Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold, Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt, Ambiguous match → Needs Me/reviewer with source evidence and abstention. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**Z — Human-Intervention Minimum:** Automate repeatable approved operations while requiring human approval for consequential actions. Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference, High-consequence matching ambiguous → escalate; never auto-clear


**AA — Operations:** Operation units: Source polling scheduler, Official-source connector adapters, Feed integrity/ETag/cursor store, Structured notice schema validator, Identifier checksum validator. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AB — Administration:** Administration and evidence: Source polling scheduler, Official-source connector adapters, Feed integrity/ETag/cursor store, Structured notice schema validator, Identifier checksum validator. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AC — Security:** Security-related boundaries: Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference, High-consequence matching ambiguous → escalate; never auto-clear, Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law, Do not scrape private consumer information from open reports. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AD — Privacy:** Privacy-scoped fields: Recall: official ID, agency, status, effective date, published/modified timestamps, Notice source lineage and immutable source snapshot, Manufacturer/brand/alias entities, Product class/taxonomy, Identifier entities with type/check digit. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AE — Compliance:** Company-specific legal and policy review must precede activation. Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference, High-consequence matching ambiguous → escalate; never auto-clear. Never infer legal clearance from a software pass.


**AF — Legal:** Exact protected domain boundary: The system supplies source-backed recall signals; it cannot claim clearance, certify product safety, autonomously issue safety/legal instructions, initiate customer recalls, or automatically refund customers. Do not issue independent safety certifications, legal advice or product recall initiation, Official text/hazard/classification must remain distinguishable from inference. Professional/legal acceptance stays human-controlled.


**AG — Abuse/Misuse:** Abuse/misuse cases: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AH — Reliability:** Resilience cases: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AI — Observability:** Telemetry: Source publication-to-detection latency, Recall coverage by source/category, Official-feed freshness and missing-source hours, Precision/recall and calibration on reviewer-labeled cases, False-negative critical severity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AJ — Incident Response:** Incident playbook triggers: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AK — Testing:** Adversarial QA cases: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AL — Brain Evaluations:** Brain evaluations: Regulator source classifier and official-source reliability assessment, Cross-source recall entity resolution and clustering, Catalog ontology and attribute extraction, Manufacturer alias/brand lineage reasoning, GTIN/UPC/lot/model ambiguity assessment. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AM — Deployment:** Deployment gate topics: P0 Authority and demand validation, P1 Identity, source and safety foundation, P2 Catalog matching core, P3 Evidence alerts and operations, P4 First paid customer validation.


**AN — Scale:** Scale options: Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AO — Performance:** Performance measures: Source publication-to-detection latency, Recall coverage by source/category, Official-feed freshness and missing-source hours, Precision/recall and calibration on reviewer-labeled cases, False-negative critical severity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AP — Cost:** Per-catalog tier, per monitored SKU band, per location or authorized API volume, with a limited free evaluation; no purchase or refund transactions executed by platform. Resource plans are proposals only. $0 automated spend ceiling; throughput and free-tier ceilings must be measured before a public commitment.


**AQ — Financial Metrics:** Financial metrics: Source publication-to-detection latency, Recall coverage by source/category, Official-feed freshness and missing-source hours, Precision/recall and calibration on reviewer-labeled cases, False-negative critical severity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AR — Moat:** Differentiators: Catalog-to-notice human-labeled matching corpus, Official amendment timeline graph, Merchant-specific coverage graph and feedback, Category-specific identifiers and alias intelligence, Audit-ready evidence bundle quality. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AS — Network Effects:** Possible opt-in learning from verified, non-private evidence: Catalog-to-notice human-labeled matching corpus, Official amendment timeline graph, Merchant-specific coverage graph and feedback. No assumed network effects and no pooling customer data.


**AT — Platform:** Platform path: Recall feed dashboard, Catalog onboarding assistant, SKU and identifier matching engine, UPC/EAN/GTIN normalization, Brand and model resolver. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AU — White Label/OEM:** OEM and white label decisions: Starter: limited-SKU alerts and manual import, Merchant: catalog sync, confidence review and historical feed, Multi-location: stock/sales impact and role-based review, Enterprise: API, audit, policies, region packs and private integrations, Advisory-only source watchlists for trials. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AV — Internationalization:** Plan locale, languages, region-specific rules and formats only when there is evidence of demand: Consumer goods, Home improvement and hardware, Baby and children’s goods. Jurisdiction-specific legality is a protected expert review.


**AW — Accessibility:** Accessibility requirements: Official source timestamp and URL per assertion, Per-source rate limit and ETag/cursor support, Immutable source snapshot and change hash, Notice supersession and version tracking, Duplicate notice clustering. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AX — Mobile:** Mobile ergonomics: Official source timestamp and URL per assertion, Per-source rate limit and ETag/cursor support, Immutable source snapshot and change hash, Notice supersession and version tracking, Duplicate notice clustering. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**AY — Voice:** Optional voice interaction only when it improves core workflow, not a mandatory feature. Adjacent possibilities: Barcode/mobile scan support, Official imagery and product label OCR. No impersonation or audio without rights/consent.


**AZ — Multimodal:** Multimodal and structured media: Official recall notice feed, Recall amendment/status, Regulator hazard description, Product/brand/model identifiers, UPC/EAN/GTIN. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BA — Marketplace:** No unrelated marketplace. Consider a governed partner/referral marketplace only if relevant to this company, after customer proof and separate owner approval; not in initial implementation.


**BB — Developer Ecosystem:** API/SDK contracts: CPSC Recalls REST API, openFDA enforcement APIs, FDA official recall site and official warnings, Manufacturer public recall URLs, Ecommerce CSV export. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BC — Partners:** Partner paths: Inbound educational recall-monitoring examples, Free anonymized sample report, Merchant safety/compliance communities, Ecommerce app integrations after policy approval, Retail associations and consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BD — Training/Certification:** Customer and staff guidance should teach safe and useful domain actions, such as Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring, Poll official source → normalize → version/dedupe → tag freshness. No mandatory training marketplace.


**BE — Community:** Community relevance: Inbound educational recall-monitoring examples, Free anonymized sample report, Merchant safety/compliance communities, Ecommerce app integrations after policy approval, Retail associations and consultants. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BF — Content/Knowledge:** Knowledge and sources: CPSC Recalls REST API; openFDA enforcement APIs; official manufacturer/regulator notices; source updates may precede or follow classification.


**BG — Experimentation:** Experimentation with control metrics: Source publication-to-detection latency, Recall coverage by source/category, Official-feed freshness and missing-source hours, Precision/recall and calibration on reviewer-labeled cases, False-negative critical severity. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BH — Continuous Improvement:** Continuous improvement: Regulator source classifier and official-source reliability assessment, Cross-source recall entity resolution and clustering, Catalog ontology and attribute extraction, Manufacturer alias/brand lineage reasoning, GTIN/UPC/lot/model ambiguity assessment. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BI — Spinoffs:** Potential spinoffs: Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BJ — Cross-Sell:** Cross-sell boundaries: Existing company #055 Product Catalog Intelligence for candidate identifier parser only after proof, Existing company #016 Regulation Change Monitor only for source polling patterns, Existing company #035 Warranty / Claims for response workflows, not safety decisions, Existing company #079 Authenticity for provenance contracts, Existing company #028 Knowledge Base for retrieval core only. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BK — Bundling:** Bundling: Starter: limited-SKU alerts and manual import, Merchant: catalog sync, confidence review and historical feed, Multi-location: stock/sales impact and role-based review, Enterprise: API, audit, policies, region packs and private integrations, Advisory-only source watchlists for trials. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BL — Failures:** Failure catalog: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BM — Edge Cases:** Edge cases: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BN — Kill/Safe Mode:** Provide per-project and per-tenant pause, disable affected connector, queue hold, evidence-preserving incident mode. Do not pay or carry out protected actions in incident recovery. Official notice predates FDA classification, UPC omitted or shared across variants


**BO — Exit/Portability:** Export and portability: Recall: official ID, agency, status, effective date, published/modified timestamps, Notice source lineage and immutable source snapshot, Manufacturer/brand/alias entities, Product class/taxonomy, Identifier entities with type/check digit. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BP — Scale Vision:** Scale vision: Barcode/mobile scan support, Official imagery and product label OCR, Supplier attestations and signed risk feeds, Multi-country regulatory ontologies, Recall-related workflow simulation. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BQ — Autonomous Mature State:** Mature automation: Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring, Poll official source → normalize → version/dedupe → tag freshness, Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold, Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt, Ambiguous match → Needs Me/reviewer with source evidence and abstention. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BR — Command Center Dependencies:** Permanent authority chain: James Morgan > Command Center > this company Brain > its scoped Agency agents > deterministic tools. Isolated per-company state, independent progress, no outgoing spending.


**BS — Retrofit Risk:** Retrofit and blast risks: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BT — Phased Roadmap:** Phased build: P0 Authority and demand validation, P1 Identity, source and safety foundation, P2 Catalog matching core, P3 Evidence alerts and operations, P4 First paid customer validation.


**BU — Reuse Candidates:** Reuse candidates: Existing company #055 Product Catalog Intelligence for candidate identifier parser only after proof, Existing company #016 Regulation Change Monitor only for source polling patterns, Existing company #035 Warranty / Claims for response workflows, not safety decisions, Existing company #079 Authenticity for provenance contracts, Existing company #028 Knowledge Base for retrieval core only. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BV — Proven Capability Dependencies:** Proof gates before reuse: Existing company #055 Product Catalog Intelligence for candidate identifier parser only after proof, Existing company #016 Regulation Change Monitor only for source polling patterns, Existing company #035 Warranty / Claims for response workflows, not safety decisions, Existing company #079 Authenticity for provenance contracts, Existing company #028 Knowledge Base for retrieval core only. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BW — Company-Specific Capabilities:** Company-unique capabilities: Regulator source classifier and official-source reliability assessment, Cross-source recall entity resolution and clustering, Catalog ontology and attribute extraction, Manufacturer alias/brand lineage reasoning, GTIN/UPC/lot/model ambiguity assessment. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BX — External Dependencies to Internalize:** External-to-internalize candidates: CPSC Recalls REST API, openFDA enforcement APIs, FDA official recall site and official warnings, Manufacturer public recall URLs, Ecommerce CSV export. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BY — Blast-Radius Requirements:** Blast radius: Official notice predates FDA classification, UPC omitted or shared across variants, Conflicting brand/manufacturer naming, Lot number image misread, Stale source or silent data gap. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


**BZ — Version/Compatibility Requirements:** Versioned contracts: Recall: official ID, agency, status, effective date, published/modified timestamps, Notice source lineage and immutable source snapshot, Manufacturer/brand/alias entities, Product class/taxonomy, Identifier entities with type/check digit. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.


## Adversarial missing-idea and saturation conclusion — provisional

A relevance-based red-team pass examined 20 failure modes, 12 future capability candidates, 36 product candidates, 21 Brain capabilities, and 17 Agent roles for this domain.

Any new idea must be tested against these gates:
- Improves verified customer outcome, reliability, safety, effectiveness, operating cost, accessibility or sustainable revenue for this exact company
- Is compatible with its legal/technical boundaries and with Command Center authority
- Has a documented business hypothesis and measurable acceptance criteria; no deceptive claims or fabricated demand
- Can be planned now and implemented later without breaking tested architecture; use plugin/contract seams instead of speculative build
- Avoids redundant features and unproven cross-company reuse; preserves source and private customer isolation
- All protected changes and outgoing money remain owner-authorized; no automatic reinvestment


This is an exhaustive **planning candidate** at the present snapshot, not proof that all possible future inventions have been discovered, all 106 checks are accepted, or a working company exists.

## Explicit exclusions / not-now
- No promise of guaranteed profit, instant autonomous revenue, or legal/compliance certification.
- No cross-company sharing of raw customer files or private reasoning/memory.
- No speculative infrastructure purchases or free-trial enrollments.
- No creation or operation of a live business just because a roadmap has been produced.


## Final truth and authorization statement

Company is proposed only. No GitHub write, Supabase migration, project button, registered Brain/Agent, external customer operation, account activation, deployment, publishing, purchase, financial transfer, refund, reinvestment, marketing send or customer outreach has been performed or authorized by this document.
