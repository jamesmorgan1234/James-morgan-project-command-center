from __future__ import annotations
import json, re, textwrap, hashlib, pathlib, datetime
ROOT=pathlib.Path('/mnt/data/five_company_preparation_2026-11-03')
ROSTER_REF='055b9dd7662c9ece73e393f604a81ff76227bb6c'
DATE='2026-11-03'

PASS_NAMES=[
'Core Business','Product Expansion','Customer Expansion','Industry / Vertical Expansion','Specialized Brain','Agent Decomposition','Deterministic Services','Data Products','API / Developer Products','White Label / OEM / Embedded','Enterprise','Marketplace / Platform','Monetization','Distribution','Automation','Human-Intervention Elimination','Moats','Security','Privacy','Compliance','Failure / Edge Cases','Internationalization','Scale','Future Technology','Cross-Company Synergy','Spinoffs','Adversarial Missing-Idea Pass','Saturation Pass']
DIMENSIONS=[
('A','Business Identity'),('B','Complete Product Tree'),('C','Complete Feature Tree'),('D','Complete Customer Tree'),('E','Complete Vertical Tree'),('F','Complete Brain Capability Tree'),('G','Brain Architecture'),('H','Complete Agent Tree'),('I','Deterministic Services'),('J','Input Tree'),('K','Output Tree'),('L','Workflow Tree'),('M','Integration Tree'),('N','API/Developer Ecosystem'),('O','Data Architecture'),('P','Data Moat'),('Q','IP'),('R','Monetization'),('S','Packaging'),('T','Distribution'),('U','Acquisition Automation'),('V','Customer Lifecycle'),('W','Support'),('X','Customer Success'),('Y','Automation Maximum'),('Z','Human-Intervention Minimum'),('AA','Operations'),('AB','Administration'),('AC','Security'),('AD','Privacy'),('AE','Compliance'),('AF','Legal'),('AG','Abuse/Misuse'),('AH','Reliability'),('AI','Observability'),('AJ','Incident Response'),('AK','Testing'),('AL','Brain Evaluations'),('AM','Deployment'),('AN','Scale'),('AO','Performance'),('AP','Cost'),('AQ','Financial Metrics'),('AR','Moat'),('AS','Network Effects'),('AT','Platform'),('AU','White Label/OEM'),('AV','Internationalization'),('AW','Accessibility'),('AX','Mobile'),('AY','Voice'),('AZ','Multimodal'),('BA','Marketplace'),('BB','Developer Ecosystem'),('BC','Partners'),('BD','Training/Certification'),('BE','Community'),('BF','Content/Knowledge'),('BG','Experimentation'),('BH','Continuous Improvement'),('BI','Spinoffs'),('BJ','Cross-Sell'),('BK','Bundling'),('BL','Failures'),('BM','Edge Cases'),('BN','Kill/Safe Mode'),('BO','Exit/Portability'),('BP','Scale Vision'),('BQ','Autonomous Mature State'),('BR','Command Center Dependencies'),('BS','Retrofit Risk'),('BT','Phased Roadmap'),('BU','Reuse Candidates'),('BV','Proven Capability Dependencies'),('BW','Company-Specific Capabilities'),('BX','External Dependencies to Internalize'),('BY','Blast-Radius Requirements'),('BZ','Version/Compatibility Requirements')]
assert len(PASS_NAMES)==28 and len(DIMENSIONS)==78

def S(t): return [x.strip() for x in t.strip().split('|') if x.strip()]
def L(seq): return '\n'.join(f'- {v}' for v in seq)
def section(title,seq): return f'## {title}\n\n'+L(seq)+'\n\n'
def bullets(items):return L(items)+'\n'
def title(s):return s.title()

common={
 'global_governance':[
  'James Morgan is final human authority. Command Center is the permanent top-level AI/control authority; company Brains are subordinate; Agency/agents have narrower delegated scopes.',
  'No external outgoing financial transaction of any kind is autonomously authorized, including purchase, paid upgrade, payout, refund, transfer, settlement, tax payment, advertising, subscription, reinvestment, or chargeable trial; automatic spending limit is $0.',
  'An owner authorization for a specific outgoing financial intent must identify amount/ceiling, recipient/provider, purpose, source company/account, timing/expiration and revocation. General approval of a roadmap or build is not financial authorization.',
  'Automation of business logic does not create authorization to send unsolicited communications, accept contracts, publish content, create regulated decisions, access third-party accounts, or modify protected infrastructure.',
  'All company/customer/account/credential/data/IP/revenue boundaries are isolated by default, including from VeloClip, CrowdSkein, RevoCapture, Morgancommerce, KDP and the other 107 companies.',
  'Never mark simulated outcomes, test orders, opportunity value, queued refunds, or estimated savings as realized sales, realized cash, or actual recovered funds.',
  'Reuse only proven shared capabilities after version-compatible cross-company regression, privacy and security review; preserve forkability and blast-radius limits; follow the existing prove-three-companies rule before broad code reuse.',
  'A failed or unavailable vendor/source/AI provider cannot create fabricated success, coverage, safety clearance, published work, customer messages, or zero-percent progress.',
  'Roadmap planning is not permission to deploy, launch, onboard, contact customers, publish, pay, or mutate Supabase/GitHub.'
 ],
 'baseline_dependencies':[
  'Authenticated and scoped Command Center Project Registry, first-class project route/button, independent lifecycle/progress/checkpoint and Needs Me controls.',
  'Company Brain manifest and domain capability pack registered beneath Command Center; evidence-linked recommendations, explicit unknown state, versioned memory and evaluations.',
  'Agency task DAG with independent work packets, resource-limited dispatch, idempotent retries, evidence-producing acceptance, integrated dependency gates, rollback and pause/stop/kill.',
  'Company-local account registry, least privilege, source provenance, consent, secrets references (never raw secrets in project files), audit/event ledger and cost telemetry.',
  'Staged deliverable gates: architecture contract → no-cost sample → customer validation → secure beta → owner-approved launch → capacity evaluation.',
  'Protected financial action gate that forbids automated money out, even when payment revenue or credits are available.'
 ],
 'generic_non_goals':[
  'No promise of guaranteed profit, instant autonomous revenue, or legal/compliance certification.',
  'No cross-company sharing of raw customer files or private reasoning/memory.',
  'No speculative infrastructure purchases or free-trial enrollments.',
  'No creation or operation of a live business just because a roadmap has been produced.'
 ]
}

companies=[]
companies.append(dict(
 n=108,slug='product-recall-intelligence',name='Product Recall Intelligence',label='Product Recall Intelligence — working name',
 mission='Give retailers, distributors, brand owners, and catalog operators accurate, evidence-linked, product-specific recall intelligence early enough for authorized people to act.',
 problem='Government safety notices are dispersed, updated over time, irregularly classified, and difficult to reconcile against real merchant SKUs, UPCs, brands, models, variants and sold-date ranges.',
 differentiator='High-confidence catalog-to-recall matching with explicit uncertainty and amendment-aware alerts; distinguish recall discovery from safety/legal action.',
 economic='Per-catalog tier, per monitored SKU band, per location or authorized API volume, with a limited free evaluation; no purchase or refund transactions executed by platform.',
 ideal='Small and mid-market online sellers and multi-location retailers with catalogs but no dedicated recall-monitoring staff.',
 boundary='The system supplies source-backed recall signals; it cannot claim clearance, certify product safety, autonomously issue safety/legal instructions, initiate customer recalls, or automatically refund customers.',
 source='CPSC Recalls REST API; openFDA enforcement APIs; official manufacturer/regulator notices; source updates may precede or follow classification.',
 buyers=S('Online retailers|Independent distributors|Multi-location hardware retailers|Children’s product merchants|Consumer electronics sellers|Marketplace merchants|Importers and brand owners|Small catalog aggregators|Retail compliance teams|Retail operations and customer service managers'),
 verticals=S('Consumer goods|Home improvement and hardware|Baby and children’s goods|Consumer electronics|Home appliances|Furniture and home goods|Outdoor and recreation goods|Automotive accessories excluding vehicle-safety-domain claims|Cosmetics and OTC categories only with regulator-specific scope|Food and medical device monitoring only behind domain-specific verification'),
 products=S('Recall feed dashboard|Catalog onboarding assistant|SKU and identifier matching engine|UPC/EAN/GTIN normalization|Brand and model resolver|Variant/lot/serial/date-range matcher|Recall watchlists|Seller-specific impact map|Regulatory source registry|Manufacturer notice monitor|Recall amendments and remedy updates|Multi-location stock-impact dashboard|Sold-customer trace candidate reports|Recall timeline visualization|Recall source evidence bundle|Safety severity display with official classification context|Unclassified/uncertain notice queue|Remedy and return-process reference sheet|Affected-not-affected review workspace|Product quarantine recommendation queue|Merchant compliance task assignments|Multi-jurisdiction recall coverage pack|Executive/operations briefings|Recall notification subscriptions|API and webhooks|ERP/catalog connector kits|Marketplace catalog adapters|Inventory and order-history matching|Batch CSV and spreadsheet import|Recall incident audit reports|White-label retailer notification portal|Supplier/brand diligence signals|Coverage and freshness dashboard|False-positive review workflow|Optional category-specific rule packs|Training and response playbooks'),
 features=S('Official source timestamp and URL per assertion|Per-source rate limit and ETag/cursor support|Immutable source snapshot and change hash|Notice supersession and version tracking|Duplicate notice clustering|Canonical entity registry|Identifier checksum validation|Lot/batch date interval algebra|Fuzzy token and phonetic brand candidates|Image/OCR model-number extraction only with uncertainty|Multilingual notice normalization|Conservative exact/fuzzy confidence levels|Threshold tuning per product category|Manual match approval, override with rationale|Reviewed false-positive/false-negative corpus|Inventory quantity estimates vs verified quantity separation|Distinct stock, sold, returned and recalled status|Bulk catalog feeds and delta sync|Missing catalog field explanations|Daily source freshness report|Backfill and replay to historical catalog version|Product family/variant inheritance with guardrails|Region/locale/jurisdiction tagging|Priority queue by officially stated hazard and actual exposure|Escalation when regulator source unavailable|Quarantine mode for corrupt feeds|Duty/consent aware notification templates|Customer communication draft only, never default send|Deduplicated notice and alerts|Emergency source override with evidence|Release-note and backward-compatible APIs|Accessibility/mobile view|Multi-user RBAC with tenant isolation|Source-coverage gaps clearly visible|Export API with evidence refs|Retention/legal hold support|No claims of comprehensive recall coverage'),
 brain=S('Regulator source classifier and official-source reliability assessment|Cross-source recall entity resolution and clustering|Catalog ontology and attribute extraction|Manufacturer alias/brand lineage reasoning|GTIN/UPC/lot/model ambiguity assessment|Confidence calibration and selective abstention|Hazard terminology normalization without changing official language|Official amendment and supersession tracking|Product impact reasoning with candidate explanations|Historical date-range eligibility reasoning|Seller relevance scoring with evidence not assumed sales|Jurisdiction and product-category classifier|Incident investigation preparation|Source freshness and blind-spot reasoning|False-positive/false-negative root cause learning|Human reviewer feedback incorporation|Safety language critique and policy escalation|Vendor change anomaly analysis|Portfolio-wide aggregated learning only via privacy-safe validated signals|Evaluation-set drift detection|Domain roadmap improvement proposals'),
 agents=S('Source connector agent|Official source normalization agent|Notice deduplication agent|Catalog import mapping agent|Identifier resolution agent|Candidate matching agent|Confidence calibration agent|Impact report agent|Alert proposal agent|Customer support summarizer|Supplier notice reconciliation agent|Privacy and safety verifier|Independent recall accuracy QA agent|Source coverage auditor|Evaluation/benchmark agent|Incident and recovery agent|Domain improvement proposal agent'),
 services=S('Source polling scheduler|Official-source connector adapters|Feed integrity/ETag/cursor store|Structured notice schema validator|Identifier checksum validator|Catalog/notice temporal graph|Exact-match service|Calibrated fuzzy matching service|Immutable evidence/artifact storage|Alert state machine with dedupe|Notification intent and consent gate|Tenant RBAC and source scopes|Impact and timestamp calculation service|Review/approval queue|Webhook and signed payload sender only after destination authorization|Batch export engine|Audit/replay engine|Incident kill switch|Retention and export/delete service|Usage and zero-cost governor'),
 inputs=S('Official recall notice feed|Recall amendment/status|Regulator hazard description|Product/brand/model identifiers|UPC/EAN/GTIN|Lot/batch/serial rules|Manufacture/sale date window|Merchant SKU catalog|Optional inventory snapshot|Optional authorized sale history|Merchant location/market|Product images with permission|Support ticket signals as supplemental evidence|Customer-defined notification contacts|Source/tenant agreement and retention controls'),
 outputs=S('Evidence-backed new recall item|Potential catalog match with confidence|Confirmed match after reviewer approval|No-match with no safety-clearance claim|Match reason/attributes|Impacted SKU/version/location report|Suggested stock-control workflow|Review task and escalation|Alert with official source and timestamps|Recall amendments history|Source freshness/coverage dashboard|Audit export|Correction/retraction notice|API/webhook event|Merchant performance report'),
 workflows=S('Connect catalog → map fields → validate identifiers → snapshot provenance → start scoped monitoring|Poll official source → normalize → version/dedupe → tag freshness|Compare notice to catalog → exact candidate matching → fuzzy candidates → explain uncertainty → human review threshold|Confirmed match → merchant-specific impact → urgent notification intent → permitted send → receipt|Ambiguous match → Needs Me/reviewer with source evidence and abstention|Recall updated/retracted → re-evaluate prior matches → issue correction notices to authorized destinations|Merchant inventory/order records updated → recompute impact → link state to prior report|Source outage or schema drift → halt affected feed → mark stale coverage → retry/incident|Quarterly false-positive audit → adjust calibrators after adversarial test and rollback plan|Customer offboarding → export evidence and purge per retention/legal hold policies'),
 integrations=S('CPSC Recalls REST API|openFDA enforcement APIs|FDA official recall site and official warnings|Manufacturer public recall URLs|Ecommerce CSV export|Shopify catalog API only with tenant consent and approved account|WooCommerce catalog adapter|BigCommerce catalog adapter|Retail ERP/PIM inventory adapters|Authorized order-history connector|Email or webhook notifications with verified sender|Supplier master data feeds|Optional UPC/GTIN reference data via lawful sources|CRM/helpdesk ticket handoff|SIEM/audit export'),
 data=S('Recall: official ID, agency, status, effective date, published/modified timestamps|Notice source lineage and immutable source snapshot|Manufacturer/brand/alias entities|Product class/taxonomy|Identifier entities with type/check digit|Affected lot/serial/date predicates|Catalog SKU/version/location links|Source confidence vs match confidence|Tenant-specific decision approvals|Official hazard and remedy text immutable|Notification intent/send status history|Affected-stock/sales estimates and verified values separate|Source coverage and staleness state|False-positive/negative adjudications|Rights/consent logs|Versioned matching algorithms/models|Deletion/hold/export semantics'),
 monetization=S('SKU-based monthly monitoring tiers|Per-location tiers|Premium amendment/priority alerts|Multi-region data coverage packs|Historical exposure reports|Supplier risk snapshots|Catalog integration/onboarding fee only if owner authorizes outgoing setup expenses|API usage metering with customer entitlements|Enterprise audit export|White-label merchant notice widgets|Vertical-specific modules|Service-provider/OEM licensing'),
 distribution=S('Inbound educational recall-monitoring examples|Free anonymized sample report|Merchant safety/compliance communities|Ecommerce app integrations after policy approval|Retail associations and consultants|Auditable ROI calculator without claimed prevented losses|Product-led catalog sample matching|Supplier ecosystems|Partner referral program with no unapproved payouts|Organic search and official-feed educational content'),
 metrics=S('Source publication-to-detection latency|Recall coverage by source/category|Official-feed freshness and missing-source hours|Precision/recall and calibration on reviewer-labeled cases|False-negative critical severity|Reviewer workload per 1k notices|Time-to-first-relevant-alert|Customer match acceptance and override rate|SKU monitoring cost|MRR/retention/churn only from actual billing|Support incidents and staleness|Affected units only when evidence-backed'),
 failure=S('Official notice predates FDA classification|UPC omitted or shared across variants|Conflicting brand/manufacturer naming|Lot number image misread|Stale source or silent data gap|Duplicate notice ID with changed remedy|Recall not covered by selected source|Recalled only in other jurisdiction|Catalog incomplete/incorrect|Wrong timezone for effective date|Product relabeled/private label|False positive triggering needless panic|False negative missing hazardous product|Leaked sale/customer PII|Merchant disables safety-critical alerts|Source site changes rate limits/terms|Bad source translation changes severity|Customer mistakenly treats no match as safety clearance|Supplier contradicts regulator|Unauthorized customer notification or refund'),
 safety=S('Do not issue independent safety certifications, legal advice or product recall initiation|Official text/hazard/classification must remain distinguishable from inference|High-consequence matching ambiguous → escalate; never auto-clear|Do not auto-send consumer recall instructions, stop-sale instructions or refunds without customer authority and applicable law|Do not scrape private consumer information from open reports|If official sources unavailable, show STALE/UNKNOWN not NO RECALL|Protect report distribution, customer sales history and source/notice integrity|Verify agency links and provenance; no invented dates/status'),
 reuse=S('Existing company #055 Product Catalog Intelligence for candidate identifier parser only after proof|Existing company #016 Regulation Change Monitor only for source polling patterns|Existing company #035 Warranty / Claims for response workflows, not safety decisions|Existing company #079 Authenticity for provenance contracts|Existing company #028 Knowledge Base for retrieval core only|Command Center shared identity/event/evaluation contracts after three-company proof'),
 moat=S('Catalog-to-notice human-labeled matching corpus|Official amendment timeline graph|Merchant-specific coverage graph and feedback|Category-specific identifiers and alias intelligence|Audit-ready evidence bundle quality|Calibrated abstention and transparent matching|Source freshness reliability and amendment response'),
 future=S('Barcode/mobile scan support|Official imagery and product label OCR|Supplier attestations and signed risk feeds|Multi-country regulatory ontologies|Recall-related workflow simulation|POS and warehouse linkage|Multilingual consumer-safe draft templates|Privacy-preserving fleetwide false-positive lessons|Differential data quality analytics|Zero-trust product data exchange|AI source-change anomaly discovery|Enterprise procurement and supplier governance adjacency'),
 packages=S('Starter: limited-SKU alerts and manual import|Merchant: catalog sync, confidence review and historical feed|Multi-location: stock/sales impact and role-based review|Enterprise: API, audit, policies, region packs and private integrations|Advisory-only source watchlists for trials'),
 phases=[
 ('P0','Authority and demand validation','Confirm distinct company scope; validate three retailer pain scenarios using publicly available recalls and synthetic catalogs.','Source/license review, no-cost prototype, documented customer assumptions, no customer outreach without authorization.'),
 ('P1','Identity, source and safety foundation','Company/project/Brain boundaries, official-source adapters, normalized recall schema, staleness/versioning, tenant isolation.','Source fixtures, schema drift tests, explicit unknown; no sensitive data or outbound alerts.'),
 ('P2','Catalog matching core','SKU import, exact GTIN/model matching, lot/date predicates, confidence and explanation, manual review queue.','Labeled evaluation set; high-consequence false negatives measured; ambiguous cases abstain.'),
 ('P3','Evidence alerts and operations','Source-linked alert workflow, correction/retraction tracking, audit exports, notifications with consent and dedupe.','Safe dry-run, zero duplicate sends, notification approval tests and outage handling.'),
 ('P4','First paid customer validation','Customer authorization, trial-to-paid evidence, merchant workflow fit, retention and support cost measurement.','Real customer opt-in and verified payment; no synthetic revenue.'),
 ('P5','Coverage and vertical depth','CPSC/FDA category packs, manufacturer notices, multilingual notices and multi-location rules.','Per-source completeness and legal review, calibrated match performance.'),
 ('P6','Integrations, API, OEM','Catalog/ERP/PIM connectors, signed customer webhooks, reusable scopes, white label.','Connector permissions, sandbox tests, backpressure and version contract.'),
 ('P7','Scaling, recovery, improvement','Multi-customer operating evidence, data lifecycle, drift monitoring, horizontal capacity and approved future innovation.','SLO and restoration drills; cost proposal only; no automatic paid scale.')]
))
companies.append(dict(
 n=109,slug='shipping-exception-recovery',name='Shipping Exception & Refund Recovery',label='Shipping Exception & Refund Recovery — working name',
 mission='Help eligible merchants identify delivery exceptions, reconcile carrier promises and policies, and prepare evidence-backed shipping-credit/refund claims without initiating unauthorized financial transactions.',
 problem='Carrier tracking events and service commitments are fragmented; merchants miss customer service issues and potentially eligible claims because evidence and deadlines are scattered.',
 differentiator='Carrier/service-specific entitlement determination with explicit unknowns, human approval of claims, robust evidence trails and merchant/customer experience automation.',
 economic='Subscription by monitored parcel band, verified recovery report service, eligible-claim preparation fee, optional capped percentage of actually credited value only with lawful contract and owner approval.',
 ideal='Small-mid direct-to-consumer shippers and fulfillment teams who ship enough parcels to face repetitive exception and refund-case work.',
 boundary='No carrier claim is assumed recoverable; no automatic financial transfer, refund to consumer, fee collection, carrier contract acceptance, or shipping purchase. Customer/owner authorization and carrier policy apply.',
 source='USPS Developer Portal and carrier-published guarantees/claim processes; eligibility and credit deadlines require current verification for each service and account.',
 buyers=S('Ecommerce merchants|Subscription-box retailers|Wholesale shippers|3PL fulfillment operators|Small warehouse teams|Shopify/WooCommerce shipping operations|Cross-border sellers with verified carrier terms|Marketplace merchants with own carrier agreements|Merchants with high delivery volume|Customer experience/returns managers'),
 verticals=S('DTC ecommerce|Apparel/beauty/home goods|Subscription products|Specialty retail|B2B spare parts|Local maker brands shipping nationally|Multi-warehouse operations|Cross-border parcel tracking when licensed|High-service merchant delivery experience'),
 products=S('Carrier tracking unification|Shipment import and dedupe|Carrier-service rule registry|Delivery exception dashboard|Lost/stalled parcel detection|Late-delivery eligibility assessment|Guaranteed-service eligibility check|Preliminary refund/credit opportunity queue|Claims evidence packet generator|Claim submission approval workflow|Claim deadline and clock monitor|Carrier credit ledger reconciliation|Shipping invoice audit|Customer support response drafting|Warehouse/escalation task routing|Delivery promise/ETA deviation analytics|Address correction exception analyzer|Damage claim evidence intake|Proof-of-delivery management|Insurance/declared-value evidence manager|Return-to-sender workflows|Carrier dispute timeline|Carrier account/contract registry|Carrier-specific terms versioning|Package-not-received triage|Duplicate shipment/claim detection|Carrier feed outage alert|Authorized webhook/API notifications|Store/3PL connectors|Support desk handoff|Customer communication preference gate|Operational analytics and carrier scorecards|Shipping label cost audit only with evidence|Cost-per-shipment and net-recovery dashboards|Cohort/root-cause analysis|Private-label carrier exception dashboard|Multi-carrier reconciliation export'),
 features=S('Event normalization with source event IDs|Out-of-order and delayed event handling|Tracking number checksum/format validation|Shipment/carrier/account identity pinning|Canonical status state machine with terminal state monotonicity|Multi-package/multi-piece shipment linkage|Merchant order/parcel mapping|Carrier service class and guarantee versioning|Delivery promises vs service standards separation|Timezone/holiday/weekend calendar logic|Different missing-scan detection windows by service|Exceptions: delay, damage, refusal, address, customs, weather, attempted delivery|Exception code translation with raw event preserved|Reroute/hold/redelivery flags|ETA uncertainty ranges not invented guarantees|Carrier service advisories and exclusions|Guarantee suspension detection|Case evidence requirements per carrier|Invoice/charge line-item matching|Deadline from carrier rules with source URL/date|Prepare-draft-only default|Owner/client approval and identity before submissions|Idempotency token for claim attempts|Carrier claim status updates and reconciliation|Denial reason taxonomy|Recoveries shown only as verified credits/refunds|Customer refund ledger distinct from carrier credits|Data sensitivity/PII minimization|No automatic label purchase or surcharge payment|Dormant credential and account revocation monitoring|Rate-limit/cost governor|Customer suppression and quiet hours|Operational drill-down and downloadable export|Abuse/fraud and false-delivery-claim screening'),
 brain=S('Carrier event sequence interpretation with raw-evidence grounding|Service-level commitment classifier|Policy/eligibility explanation from currently verified rule version|Shipping exception triage and prioritization|Customer-impact classification|Pattern and carrier performance analysis|Claim completeness guidance|Deadline confidence and abstention|Invoice line-item matching and discrepancies|Duplicate/suspicious claim detection|Carrier outage vs shipment issue differentiation|Refund opportunity estimate with no assertion of recoverability|Root-cause and warehouse suggestions|Support draft tone and factuality guard|Policy-change monitor with escalation|Human correction learning|Carrier adapter drift detection|Failure-mode and rerun planning|Economic unit margin analysis without acting on payments|Domain-specific continuous improvement proposals'),
 agents=S('Carrier connector agent|Tracking event reconciler|Service policy research agent|Eligibility evaluator|Claim evidence builder|Deadline watch agent|Exception escalation agent|Invoice matching agent|Customer support draft agent|Carrier-account verifier|Claim-review queue agent|Recovery verification agent|Financial truth reconciler|Fraud/abuse verifier|Independent claim-rule QA agent|SLA/incident coordinator|Domain Brain improvement proposer'),
 services=S('Carrier connector SDK|Tracking event ingestion queue|Idempotent event journal|Shipment state machine|Tracking/cost rate limiter|Service policy version store|Holiday/timezone engine|Carrier advisory import|Evidence document vault|Deadline rules engine|Claims approval gate|Protected outgoing-money gate|Merchant organization RBAC|Claim submission intent registry|Reconciliation ledger|Charge/credit parser|PII redaction/export|Email notification gate|Exception routing|Observability and resilience|Customer offboarding export/delete'),
 inputs=S('Merchant shipment manifest|Tracking numbers|Carrier identity|Service class|Ship date and label purchase date|Promised vs estimated delivery date|Tracking event feed|Carrier service advisories|Contract/guarantee policies|Order/recipient data with consent|Shipment invoice/charges|Delivery proof|Damage/photo evidence authorized by merchant|Claim feedback/denials|Carrier credit memo/statement|Customer refund records as separate read-only data'),
 outputs=S('Canonical shipment status and source link|Exception alert|Eligibility assessment with rules version|Claim evidence packet|Submission approval request|Deadline watch queue|Missing evidence report|Claim/credit status with provenance|Verified credited amount only after reconciliation|Estimated opportunity explicitly not cash|Support response draft|Carrier performance scorecard|Customer service case handoff|Monthly operational report|Audit/replay export'),
 workflows=S('Import shipments → bind merchant/carrier account → verify consent → normalize tracking → track|Receive event → dedupe/order → evaluate exception rules → attach raw evidence|Evaluate guarantee → check latest carrier policy/service/advisory/exclusions → eligible/unknown/ineligible reason|Build claim packet → missing evidence validation → owner/client approval → permitted submission only after explicit separate action authorization|Track claim status → denial/appeal draft → verified credit memo receipt → reconcile and report realized value|Support triage → approved customer messaging without inferring compensation|Carrier outage → preserve last event time → mark stale → pause eligibility claims|Claim deadline nearing → reminder without paying/submitting|Cancellation or customer exit → revoke keys and export/delete|Recompute affected claims after policy correction using exact historical rules'),
 integrations=S('USPS developer tracking APIs when supported|UPS tracking/claims only under appropriate account/license|FedEx tracking/claims only under appropriate account/license|DHL tracking/claims only under appropriate account/license|ShipStation/Shippo/EasyPost via authorized customer integrations|Shopify/WooCommerce order feeds|3PL/WMS CSV and webhook intake|Customer helpdesk CRM|Carrier invoice or statement CSV|Merchant accounting ledger export|Email notification gateway with verified sender|Customer-owned cloud files|Calendar for claim deadlines'),
 data=S('Tenant carrier account identifier|Shipment and package stable IDs|Service level and its rule effective dates|Raw timestamped tracking events|Normalized state with correction ledger|Merchant order pointer with minimal PII|Delivery promise vs estimate classification|Claims eligibility input and rule citations|Claim intent, approval and attempt history|Carrier portal acceptance evidence|Claim denial reason and appeal history|Invoice charge line items|Credit/refund settlement evidence|Merchant customer-refund events separate|Incident/timezone/holiday context|Connector rate limits and provider terms snapshots|PII retention/erasure and case legal-hold refs'),
 monetization=S('Subscription by tracked package volume|Carrier anomaly dashboard package|Claims preparation subscription add-on|Proof-of-delivery incident bundle|Shipping invoice audit|Premium carrier comparison reports|API usage tier after authorized commercialization|Account onboarding service if legitimate and economically viable|Enterprise multi-warehouse tier|Per-recovered-credit success fee only by agreement and never by unsupported estimated value|Reconciliation exports|Partner/OEM fulfillment integration'),
 distribution=S('Organic educational guides about shipping exceptions|Anonymized sample parcel exception report|Merchant communities and fulfillment operators|Authorized ecommerce integration ecosystems|Operations consultants|3PL referral arrangements subject to approval|Customer support workflow examples|Public verified guarantee policy explainers|SEO: late package, exception reconciliation, carrier invoices|Self-serve CSV proof-of-value demo'),
 metrics=S('Tracked package event freshness|Late delivery exception precision|Eligible claim identification accuracy vs current policies|Claim packet completeness|Claim acceptance/denial rate|Carrier-credit verified actuals|Missed deadlines|Customer service resolution time|Credit reconciliation error|Duplicate attempted claims prevented|Service cost per tracked package|False savings or false cash claims = zero tolerance|Merchant churn and real recurring revenue'),
 failure=S('Carrier suspended delivery guarantee|Carrier does not provide free tracking on chosen tier|No supported carrier claims API|Tracking number reused across years|Packages with multiple pieces|Mis-scanned proof of delivery|Weather/holiday exclusion|Wrong merchant carrier account|Carrier event timezone ambiguity|Carrier data lag|Claim filed after deadline|Duplicate claim accepted in portal|Unsupported delivery-date inference|Missing original shipping charge|Customer already credited|Carrier issues partial credit|Refund appears in different accounting period|Customs delay excluded|Fraudulent parcel not received assertion|Recipient data leak|Automated charge to carrier account|Automatic consumer refund without approval'),
 safety=S('Never claim a refund guarantee; use currently verified carrier policy by exact service/account/date|Claims may carry contractual representations, so human approval before any submission|No money out under any execution path|Protect carrier credentials and customer PII; provide minimized exports|Do not auto-accept carrier terms, disputes or releases|Separate expected recovery and realized credit|Avoid hidden costs from premium tracking providers or high-frequency polling|Observe carrier API terms and rate limits|No unauthorized modifications to shipments, label purchase, rerouting or return orders'),
 reuse=S('Existing company #087 Marketplace Payout Reconciliation for ledger concepts only|Existing company #085 Revenue Leakage Detection for anomaly baseline after proof|Existing company #086 Payment Reconciliation for settlement matching after financial-scope review|Existing company #071 Webhook Reliability for connector patterns|Existing company #030 Invoice/Payment Recovery must stay separate from carrier credit eligibility|Command Center durable events, identity, audit and financial governor interfaces only'),
 moat=S('Versioned per-carrier policy corpus with expiry checking|Real carrier claim outcome/denial calibration without cross-customer leakage|Shipment event state accuracy|Verified credit reconciliation and audit traceability|Carrier exception taxonomy|Root-cause accuracy and merchant workflow integrations'),
 future=S('Natural-language carrier policy questions with citations|Multimodal package damage assessment as suggestion only|Shipment risk forecasting with uncertainty|Support intent automation with consent|Tracking webhook failover and event broker|Multi-country customs handoff|Customer-side estimated delivery communication templates|Multi-carrier package insurance comparison only as recommendations|Warehouse pick/pack root-cause linkage|Contract negotiation evidence reports|Privacy-preserving industry benchmarks|Smart carrier-route selection suggestions without label purchases|Signed claim evidence exports'),
 packages=S('Starter: CSV tracking and exception reports|Operations: multi-carrier feeds and exception notifications|Recovery: eligibility/claim packet preparation with approvals|Finance: verified credit reconciliation and audit exports|Enterprise: warehouses, APIs, private adapters and SSO'),
 phases=[
 ('P0','Carrier/market feasibility','Choose carrier and service under known free/licensed access; document guarantee policies and actual account eligibility.','No code relies on unverified API/refund eligibility; synthetic examples only.'),
 ('P1','Shipment/event state foundation','First-class project/Brain; shipping entity and event journal; idempotent tracking adapter; authorization boundaries.','Out-of-order/replayed tracking tests and no credential exposure.'),
 ('P2','Exception classification','Service-specific exception logic, delivery clocks, advisory versions, evidence and uncertainty.','False-positive case evaluation and time-zone/holiday tests.'),
 ('P3','Eligibility/claim preparation','Current carrier policy citations, deadline system, evidence packet and separate claim approval gate.','No automatic filing or financial action; policy change rejects stale rules.'),
 ('P4','Actual-credit reconciliation','Claim receipt tracking, credits verified against statements, distinct customer refunds, accurate reporting.','Zero synthetic revenue, zero duplicate claim IDs and equal-credit reconciliation.'),
 ('P5','First merchant validation','Authorized merchant trial with shipment volume, exception burden, policy eligibility and service value evidence.','Actual operator feedback and first real paid evidence before scaling.'),
 ('P6','Carrier and platform expansion','More account-scoped carrier adapters, ecommerce and 3PL connectors, support desk integration.','Each carrier has separate legality, credentials, replay/coverage and financial gates.'),
 ('P7','Optimization and scale','Versioned event analytics, policy drift, enterprise dashboards, recovery/migration, low-cost capacity design.','Measured unit economics; capacity cost proposals only, never auto-spend.')]
))
companies.append(dict(
 n=110,slug='book-formatting-publishing-preparation',name='Book Formatting & Publishing Preparation',label='Book Formatting & Publishing Preparation — working name',
 mission='Turn an author’s completed, lawfully provided manuscript into polished, validated, accessible, edition-specific publishing deliverables without taking over the author’s account, rights or publishing decisions.',
 problem='Independent authors face print-layout rejection, ebook navigation/accessibility errors, cover/spine sizing, mismatched edition metadata, inconsistent typography and rework when preparing files across distribution platforms.',
 differentiator='Author-controlled, style-preserving conversion with traceable layout checks, real print/ebook QA, preflight evidence, and consistent multi-format releases at an affordable fixed scope.',
 economic='Per title and format packages, series/volume discount, revision allowances, expedited turnaround only if resources allow, optional recurring imprint catalog maintenance with no hidden paid provider dependencies.',
 ideal='Independent authors and micro-publishers who own manuscripts but want professional files without learning production tools.',
 boundary='Not a vanity publisher, literary agent, copyright lawyer, plagiarism-certification agency, ghostwriting commitment, book distributor, or autonomous KDP uploader. All final content, rights, cover, metadata, pricing, publishing and platform acceptance decisions stay with customers.',
 source='Current official Amazon KDP manuscript/trim/bleed/cover guidance; EPUB standards and retailer-specific requirements must be versioned and verified before each delivery.',
 buyers=S('Self-publishing fiction authors|Nonfiction writers|Indie poetry authors|Micro-publishers and small presses|Workbook/low-content creators with accurate structure|Educators publishing lawful original work|Authors converting print to digital|Series authors with multiple volumes|Authors with publishing backlog|Editorial service providers outsourcing formatting'),
 verticals=S('Fiction|Nonfiction|Children’s picture books when rights and illustration files clear|Poetry|Memoir|Business books|Technical how-to|Cookbooks with photo quality and accurate recipes|Workbooks/planners|Academic writing only when citation/rights clearance performed|Large print editions|Accessible reading editions'),
 products=S('Manuscript intake and readiness review|Style-guide intake|DOCX-to-EPUB conversion|DOCX-to-print-PDF conversion|EPUB reflowable typography|Fixed-layout assessment and separate quote|Paperback interiors|Hardcover interiors|KDP-compliant cover mechanical sizing|Customer-supplied cover preflight|Chapter and heading hierarchy repair|Navigation table of contents|Front/back matter templates|Page numbering and running heads|Widow/orphan control|Paragraph styles and scene breaks|Poetry stanza handling|Footnotes/endnotes conversion|Hyperlink/URL/reference checks|Image placement and caption management|Table and list formatting|Illustration bleed and image quality checks|Workbook form/line layout|Cookbook recipe page templates|Large-print accessibility format|EPUB accessibility report|KDP dry-run preflight checklist|Edition/format metadata consistency|Version/revision history|Page proof generation|Print-ready single-page PDF validation|Bibliography/citation formatting as separate scoped service|Series template packs|Publisher imprint template pack|Multi-retailer export profiles|Font/license and embedding checks|Color space and resolution inspection|Orphaned asset detection|Print-spine/back cover mechanical template|Metadata/ISBN ownership checklist|Files delivery portal|Author correction/revision workflow|Author approval/signoff packet|Final source/archive export|Bulk series edition processing|Human-reviewed complex layout option|White-label formatting for editors'),
 features=S('Input malware and file integrity scan|Author-owned source and rights attestation|Text structure and heading inference with review|Preserve original prose; no silent substantive rewrites|Source-to-output paragraph/bookmark trace|Unified semantic manuscript model|Page-template versioning|Typography/kerning/leading preset library|Multilingual/hyphenation/language tag controls|Right-to-left and complex script feasibility check|Book trim/bleed/gutter selection|Page count-driven gutter sizing|Paperback/hardcover difference recognition|Single-page print PDFs not printer spreads|Embed fonts and license validation|Print graphic 300-DPI check where required|Transparency flattening where needed|Color and black-ink mode check|No comments/crop marks/invisible objects in final PDFs|Precise spine width based on current specs and paper selection|Cover art and title legibility preflight|EPUB 3 manifest/TOC/nav landmarks|Alt-text request workflow for illustrations|ARIA/semantic headings and reading order|Footnotes and math accessibility|Automated epubcheck and PDF structural checks|Manual visual rendering sample checks|Proofbook review and approval|Real word/page count and metadata sync|Missing copyright/permissions warning|Customer-controlled publishing credentials excluded|Project per edition/format with stable ID|Corrections diff report with rollback|File hash and deterministic build receipts|Deliver signed off final package and reversible source|Error classification and client-friendly remediation|No platform acceptance guarantee|Private client data per project|Secure deletion/retention policies|Client editor comments separate from published output|Layout performance budget on local laptop'),
 brain=S('Manuscript genre/layout classifier|Semantic heading/chapter interpretation|Style-preserving typography recommender|Complex-layout risk triage|EPUB navigation and accessibility critic|Print trim/gutter/bleed reasoning with official source versions|Illustration/table/image quality assessment|Metadata consistency verifier|Series design consistency reasoning|Citation/footnote structure verifier|Multilingual typography assessment|Rights/permissions question generator|Human approval escalation|Error clustering from retailer rejections|Diff-aware revision planner|Evaluation rubric for clean page hierarchy|Quote and turnaround scope estimator without promising throughput|Customer preference memory per client only|Production workflow optimizer|Market and format guidance with uncertainty|Design system improvement proposals'),
 agents=S('Manuscript intake agent|Source security/rights verifier|Semantic structure agent|Typography/layout agent|Print-PDF build agent|EPUB build agent|Cover mechanical preflight agent|Metadata consistency agent|Accessibility QA agent|Proof renderer agent|Customer revision organizer|File integrity/packager agent|Independent print and digital QA agents|Platform spec change auditor|Quote and cost analyzer|Customer support agent|Domain improvements proposer'),
 services=S('Sandboxed document parser|DOCX/ODT/Markdown/HTML canonicalizer|EPUB3 builder|PDF layout renderer|LaTeX/Typst optional engine|EPUBCheck runner|PDF preflight runner|Font license/embedding check|Image inspect/recompress and color profile check|Trim/bleed/gutter deterministic calculator|Table-of-contents/nav generator|Cross-reference/footnote engine|Template/style registry|Edition version/rebuild pipeline|Diff/hash evidence service|Client-owned file vault|Customer approval state machine|Local job queue/worker|Asset licensing registry|QC rubric service|Secure export/delete|Zero-cost resource governor'),
 inputs=S('Original manuscript DOCX/ODT/Markdown/plain text|Author-owned cover art with license|Author title/subtitle/series/order|Author or imprint metadata|Genre and style guide|Target trim/paper/ink/bleed preferences|Retailer/edition selection|Image rights and print-resolution inputs|ISBN assigned by customer if applicable|Back-cover copy and price where supplied|Author correction notes|Language/reading-direction requirements|Platform rejection notice for fix|Desired bibliography/reference style|Accepted revision scope'),
 outputs=S('Validated EPUB file|Validated paperback interior PDF|Validated hardcover interior PDF|Cover mechanical layout proof|Cover preflight report|Style/format/edition manifest|Retailer-specific upload checklist|Fonts/images/rights checklist|Proof renders and sample pages|Navigation and accessibility report|Tracked revision change summary|Client approval record|Rebuildable source/asset archive|Delivery hash/checksum manifest|Customer-readable missing-input report|Explicit unsupported/needs-manual-design flags'),
 workflows=S('Author submits file → consent/right-to-process → malware/file check → intake scope and style approval|Parse semantic structure → detect sections/illustrations/tables → human review if ambiguous|Generate normalized manuscript model → build EPUB/print editions from same source with version pins|Print interior → trim/gutter/bleed/images/fonts → render page proofs → preflight|EPUB → nav/semantics/links/accessibility → epubcheck → visual sample QA|Cover source → platform current size formula → proof → customer design approval|Independent QA → detect content/layout mismatch → rerender → QA gate|Customer corrections → scoped diff/revisions → version bump → fresh regression|Client final approval → checksum/manifest package → secure delivery (no upload/publish)|Post-delivery feedback → classify rejections → propose engine correction with test fixtures'),
 integrations=S('Amazon KDP official documentation and templates (not customer account automation)|EPUB 3/EPUBCheck toolchain|Calibre command-line validation (license checked)|Pandoc where suitable and test-verified|LibreOffice headless converter when safe|Typst or LaTeX for specific print flows|PDF inspection/Poppler|Fontconfig and licensed free fonts|Google Drive/Dropbox via customer-provided authorized export only|Gutenberg/public-domain sample texts for internal QA|Customer-owned file upload/download provider|Optional IngramSpark specs as separately verified export profile|Adobe PDF guidelines as reference only'),
 data=S('Client project/workspace ID|Customer-owned manuscript revision and hash|Original asset ownership/consent refs|Canonical chapter/section semantic tree|Image asset metadata/DPI/license refs|Edition configuration and versions|Retailer spec effective date/version|Font licensing and embedding state|Proof render signatures|Automated preflight test results|Human proof check signoff|Author change requests and responses|Final package hash and delivery receipt|Rights/identity and retention metadata|Price/ISBN as customer data only|No cross-author training on manuscripts by default'),
 monetization=S('Ebook-only formatting|Paperback interior formatting|Hardcover interior formatting|Multi-format bundle|Series uniform-style bundle|Correct-and-resubmit package|Complex layout custom quote|Children’s illustrated layout specialized quote|Workbook/poetry/recipe add-on|Accessibility/alt-text review optional|Existing manuscript cleanup optional separate authorization|White-label subcontracting|Series maintenance and future editions|Customer-selected expedited processing subject to verified capacity'),
 distribution=S('Portfolio of original public-domain/owned sample before-after layouts|Targeted organic author education|Author associations and writing communities|Upwork/Fiverr profiles subject to account permission|Direct referrals from independent editors|Micropress partnerships|How-to checklists explaining trim/bleed/rejections|Sample style gallery|Word-of-mouth and documented customer testimonials|Clear fixed-scope price pages'),
 metrics=S('First-pass EPUB validation rate|First-pass PDF preflight rate|Critical layout defects per 100 pages|Client-reported retailer rejection rate|Revision count and cause|Layout fidelity errors|Customer hours saved only when measured|Processing time and laptop throughput|Manual QA minutes per title|Gross margin after actual attributable expenses|Paid jobs/return customers|Customer satisfaction and refund requests|On-time delivery against promised milestones'),
 failure=S('Low-resolution licensed images|Fonts without commercial embedding rights|Unlicensed cover art|Complex math/RTL scripts unsupported|Footnote crosslink corruption|Widows/orphans and page-break bugs|Cookbook images or recipes unverified|Wrong bleed for print interior|Wrong hardcover vs paperback cover geometry|Missing original manuscript|Source comment leakage|Hidden track changes included in print|ISBN mismatch across formats|Customer requests silent substantive rewrites|KDP changes trim/page constraints|EPUB navigation broken on reader|False assurance that all files will be accepted|Corrupt zip/EPUB package|Client data mixed between authors|Output contains placeholder or prompt text|Customer authorization to publish assumed from file delivery'),
 safety=S('Never publish or change customer KDP/publishing accounts without separate explicit authorization; default is delivery-only|No unauthorized substantive edit to manuscripts; changes tracked and author approved|No claiming manuscript rights, exclusivity, plagiarism clearance or copyright legal advice|Never reuse customer manuscripts or covers for another client or training without explicit consent|Screen sample art/license and no prohibited piracy or counterfeits|Verify retailer specs on delivery date; platform accepts/rejects independently|Keep client billing and all outgoing money protected behind owner approval|Protect unpublished manuscripts with private local storage, access logs and retention rules'),
 reuse=S('Existing Command Center book-format QA architecture as contract/evaluation inspiration only|Existing KDP projects retain James Morgan author assets, accounts and IP; do not copy client manuscripts into personal books|Existing company #009 Document-to-Workflow for parsing interfaces after proven compatibility|Existing company #065 Autonomous QA for generic test orchestration after proof|Existing company #079 Provenance for version/hash concepts|No sharing of customer proprietary manuscript or publishing identities'),
 moat=S('High-quality versioned layout and style templates|Reliable retailer-specific preflight evidence|Source-to-page traceability and rerender diff checks|Genre-specialized typography and accessibility QA|Customer trust from no silent content rewriting|Reusable author-approved series style systems|Real rejection-case test fixtures'),
 future=S('Print-on-demand retailer profile library|Accessible audiobook script exports only with rights|Automated indexes and concordance proposals with author review|Collaborative structured author proof annotations|Language-specific hyphenation packs|Illustrated book screen/print parity previews|Color proof simulations with caveats|Reference/footnote cross-platform auditing|Series template consistency AI|Book typography A/B proof proposals|Secure client self-service status portal|Print economics calculator as recommendation only|Publisher editorial workflow handoffs|Multilingual typesetting and translation-ready packaging'),
 packages=S('Ebook ready|Print interior ready|Paperback + hardcover|All formats edition bundle|Series consistency pack|Fix rejected file package|Complex-layout/custom design with explicit manual acceptance|White-label editor partner tier'),
 phases=[
 ('P0','Evidence, product and demo','Verify current KDP/EPUB requirements and author scope; generate sample public-domain book and sample QA report.','Real source formats verified, customer ownership rules and free tools licensed.'),
 ('P1','Secure intake and semantic engine','Client isolation, source scanning, structure tree, metadata, style presets, versioning and author approval.','Source diff preserves 100% original text except approved changes.'),
 ('P2','EPUB workflow','EPUB3 generation, navigation, accessibility, image/footnote validation and device proof set.','EPUBCheck passing and independent visual QA.'),
 ('P3','Print production workflow','Trim/bleed/gutter, typography, paperback/hardcover interior PDF, image/font QC, mechanical cover check.','Current KDP rules, no trim/bleed violations and manual proof pass.'),
 ('P4','Customer production workflow','Quote/scope, revision approvals, secure delivery, source rebuild receipts and support.','One complete mock customer order, secure file separation and no auto-publishing.'),
 ('P5','First authorized paid customers','Validate quality, price, turnaround, rework/refund policy and customer satisfaction.','Actual payment and final deliverables; no fabricated sales.'),
 ('P6','Expanded genre and channel profiles','Workbooks, cookbooks, poetry, picture books, large-print, additional retailers with official specs.','Each profile independently accepted with realistic specimen tests.'),
 ('P7','Automation and scale','Background job queue, genre QA/evals, author portal, series templates, no-cost capacity/recovery.','Demand/cost/quality evidence; owner approves any paid scaling separately.')]
))
companies.append(dict(
 n=111,slug='contractor-websites-online-booking',name='Contractor Websites & Online Booking',label='Contractor Websites & Online Booking — working name',
 mission='Provide independent trades and local service businesses with fast, trustworthy, accessible websites and practical owner-controlled online inquiry/appointment workflows at clear fixed scope.',
 problem='Many local contractors have outdated mobile sites, incomplete service-area information, weak contact forms, and disconnected inquiry calendars; custom agency delivery is often slow and expensive.',
 differentiator='Trade-specialized production templates, verified mobile UX, real lead capture delivery, clear ownership/portability and isolated customer-owned domains and contact accounts.',
 economic='One-time template build and configuration service, optional recurring update/maintenance package, optional approved integrations, no paid hosting/provider dependency mandatory to prepare an initial site.',
 ideal='Solo tradespeople and small service companies who want a professional website and reliable inquiry intake without owning a complex marketing stack.',
 boundary='Company designs/builds websites and lead-capture infrastructure; RevoCapture remains independent and owns recovery/follow-up products. No default CRM/SMS campaigns, no invented reviews or search ranking guarantees, no company-wide shared client contact identity.',
 source='HTML/CSS/JS, free static site hosting, accessibility standards, Google Business Profile policy, customer-owned domain and consent-aware form provider; all external providers version/terms must be checked.',
 buyers=S('Garage-door installers|HVAC technicians|Plumbers|Roofers|Electricians|Painters|Remodeling crews|Landscapers|Tree-service operators|Mobile mechanics|Cleaning services|Handyman services|Fence/deck builders|Appliance repair businesses|Independent local service startups'),
 verticals=S('Garage-door service|HVAC|Plumbing|Roofing|Painting|Remodeling|Landscaping|Tree care|Electrical|Cleaning|Mobile auto repair|Appliance service|General trades/field service'),
 products=S('One-page starter website|Two-to-five-page business website|Mobile-first design system|Trade-specific home/service templates|Location/service-area pages|Contact and estimate-request forms|Appointment request wizard|Business hours and holiday schedule|Call/text/email link buttons|Portfolio and before-after galleries|Photo upload with rights authorization|Customer-supplied testimonials|Accessible navigation and forms|FAQ/knowledge base section|Service pricing explanation sections|Emergency-service inquiry prompt with safety disclaimers|Customer review platform link|Customer-owned domain connection instructions|Free subdomain launch option|Owner edit/update interface|Basic structured-data markup|XML sitemap and robots basics|Privacy/terms template review boundary|Spam-resistant forms|Accessible thank-you pages|Calendar availability display integration|Reschedule/cancel request flows|Lead-delivery status log|Spam and bot filtering|Secure form-to-email routing|Estimate request qualification fields|Service area zip/radius rules|Performance/Core Web Vitals report|Basic search-engine indexing checklist|Image optimization and alt text|Social account links|Google Business Profile link integration|Basic local search information consistency report|Multi-language/translation-ready pages|ADA/WCAG improvement checks without certification|Maintenance monitor and backup|Template revision/update manager|Independent customer handoff bundle|RevoCapture optional opt-in integration seam|White-label contractor site packages'),
 features=S('Semantic HTML and appropriate headings|Color contrast validation|Keyboard navigation and visible focus|Responsive typography and image srcset|Largest-contentful-paint and CLS optimization|Content security policy and HTTP headers where host supports|Form input validation server-side and client-side|Honeypot and rate limiting|CAPTCHA only when a suitable free privacy-respecting option exists|Consent checkbox and purpose-specific form retention|Timezone and operating-hours selection|No fake availability: request ≠ confirmed booking|Calendar conflict detection for connected read-only schedule|Explicit provider token scope and tenant isolation|Accurate service-area and licensing claims supplied by owner|Review authenticity and attribution|Photos before/after ownership releases|Image geo metadata removal|Business license/insurance claims only if substantiated|Alternate contact when third-party form is down|Delivery proof/log without exposing lead PII|Per-customer deployment pipeline and rollback|Preview/customer approval gate|Client-owned content and exportable source|SEO sitemap/robots/canonical link validation|Redirect and broken-link checker|Analytics only after appropriate consent|Access level: editor vs site owner vs support|No cross-business message or domain reuse|Customer document/credentials not mixed with Morgan’s Garage Doors|Machine-readable forms schema and configurable custom fields|Local preview before customer-approved publication|Page backup and version restore|Automatic free hosting quota awareness and graceful hold'),
 brain=S('Trade category/service taxonomy and field requirements|Template selection and gap analysis|Service-area/jurisdiction content checks|Customer content extraction with factual confidence|Mobile UX and accessibility reviewer|Factual claims and testimonial authenticity checker|Inquiry form field suggestion|Lead quality vs friction analysis|Navigation and service page architecture planner|SEO recommendations that distinguish guidance from ranking guarantees|Photo usage/license verification assistant|Brand consistency reasoning|Calendar availability semantics critic|Privacy/data-minimization review|Performance and cost optimizer|Template regression root cause learner|Customer change request planner|Upsell opportunity recommender without contacting or charging customers|Cross-template shared improvements only via verified release packs|Domain-specific continuous improvement'),
 agents=S('Customer intake and requirements agent|Trade taxonomy/content planner|Brand/style compiler|Static site generator agent|Responsive UI QA agent|Accessibility test agent|Form workflow builder agent|Calendar adapter agent|SEO metadata/structured data agent|Privacy/consent reviewer|Security scan agent|Deployment dry-run agent|Customer content proof agent|Change request and backup agent|Independent visual/functional QA agent|Maintenance/incident watcher|Domain improvement proposal agent'),
 services=S('Template and component registry|Static build pipeline|Schema-based form generator|Spam rate-limit and request audit|Customer-owned submission handler|Consent/retention engine|Calendar read adapter with safe permission|Appointment-request finite state machine|Domain/DNS configuration verifier|Environment config secrets references|Per-customer content repository isolation|Preview environment and screenshots|Accessibility/performance lint runner|Image optimizer and responsive image pipeline|URL route/sitemap/redirect validator|Deployment and rollback receipts|Backups/export and offboarding|Email deliverability status monitor|Submission/delivery status ledger|Optional RevoCapture permission-scoped webhook adapter'),
 inputs=S('Customer company identity and factual business description|Official service area/service list|Hours and emergency availability|Customer contact/booking destination|Customer-owned imagery and usage rights|Logo/brand palette preferences|Business license/credential claims where applicable|Customer supplied reviews/testimonials|Sample jobs/projects|Form fields and data retention preferences|Customer-owned calendar read permissions|Host/domain ownership|Accessibility language requirements|Client approval of public copy|Privacy and contact-consent terms'),
 outputs=S('Preflight website preview|Mobile/desktop responsive site|Working inquiry/appointment-request form|Client contact routing receipt|Performance/accessibility test reports|Search metadata/sitemap|Customer edit and maintenance instructions|Source archive and assets inventory|Deployment and rollback instructions|Business-hours/service-area configuration|Customer approval and publish authorization log|Form privacy policy review list|Customer-owned account handoff package'),
 workflows=S('Client intake → permissions and media proof → confirm service scope → project spec → estimate|Select trade template → produce copy from customer evidence → flag unverified claims|Build pages and forms → responsive preview → automated accessibility/security/performance QA|Connect contact destination and optional calendar with least privilege → send controlled synthetic test → verify delivery|Customer approves site content/design → separate authorization to publish → deploy only to authorized account|Customer submits appointment request → store minimal data → forward to verified owner → confirmation only when owner/calendar confirms|Third-party delivery fails → store pending signal securely → owner alert → no fake success|Maintain site → identify broken links/outdated facts/form errors → propose controlled update|Offboard → export complete source/assets/lead data → revoke provider access and delete after retention|Optional explicit RevoCapture enrollment → consent and company-isolated connector'),
 integrations=S('Free static hosting provider when suitable and verified (customer-owned when live)|GitHub Pages or free equivalent for preview where terms permit|Customer-owned DNS registrar and domain (no auto-purchase)|Free email or form receiver with consent and quotas|Google Calendar/Outlook Calendar customer-owned integration|Google Business Profile public link, no unauthorized editing|Google Search Console with owner permission|OpenStreetMap-based map links avoiding unapproved API spend|Optional Stripe customer-owned payment link for quotes only with explicit financial action boundaries|RevoCapture opt-in connector and separate workspace credentials|Business phone/text href links|Photo/gallery storage with licensed customer uploads|Accessibility testing tools like axe-core and Lighthouse|Search and social open graph tags'),
 data=S('Customer site/project stable IDs|Tenant-owned source/content/assets|Credential references never plaintext|Client-approved claims and copy versions|Photo rights and license metadata|Service location and business hours|Form schema version and consent text|Appointment-request status vs confirmed appointment|Inquiry PII and delivery status|Destination email/calendar scopes|Deployment/build identity|Preview/customer approval receipts|Structured data and SEO metadata versions|Analytics consent and event aggregates|Deletion/export/retention policy|Error logs scrubbed of sensitive lead content'),
 monetization=S('One-page site setup|Standard trade website bundle|Service area multi-page bundle|Booking/inquiry workflow add-on|Custom copy/layout/photography integration|Site update/maintenance retainer|Form and uptime monitoring service|Appointment calendar integration|Accessibility improvement pass|Performance cleanup for existing site|Migration/portability package|Regional multi-location expansion|White-label build for agencies|Brand refresh/seasonal page add-ons with opt-in'),
 distribution=S('First-party owned demonstration using synthetic business example|Trade-focused before-after portfolio|Organic local contractor referrals|Business networks and field-service communities|Legitimate contact only when separately authorized|Local SEO educational examples|Partnership with service software consultants|Website health free sample report only with lawful access|Transparent fixed packages|Trade-vertical case studies from real outcomes'),
 metrics=S('Form submit-to-owner delivered rate|Lead delivery failures|Real appointments confirmed by owner|Mobile page speed and CWV|Accessibility audit defects|Spam submission rate|Client handoff/ownership completion|First-pass client approval rate|Hours per site and site cost|Customer retention and recurring maintenance revenue|Verified conversion only where consented and measured|Customer support requests and outage time'),
 failure=S('Customer domain credentials unavailable|Email delivery provider quota reached|Form fails silently|Booking conflicts with real calendar|Lead sent to wrong company|Stale service area/business hours|Invented licensing/reviews|Photos lack commercial license|Insecure form exposes customer PII|Accessibility contrast/keyboard failure|Client site contains another client’s branding|Stale DNS/cache masks launch|Free hosting exceeds limits|Customer expects booking confirmed when only request received|Broken call-to-action on mobile|Unlicensed font/assets|Customer payment link points to wrong merchant|Unauthorized subscription added to client account|RevoCapture and website data mixed|Search ranking promise not met'),
 safety=S('No implicit RevoCapture merger or access to existing contractor leads|No fabricated reviews, certifications, licenses, emergency guarantees, business hours or job photos|Booking request is NOT an appointment confirmation|Customer owns domain/content/account; no cross-client account/identity sharing|Form PII private and minimized; secure delivery and retention|No customer domain purchase, email upgrade, campaign spend or automatic outgoing payment|Site publication and public messaging remain gated by approved deployment scope|Provide accessibility testing, not blanket legal ADA certification'),
 reuse=S('Morgan’s Garage Doors existing approved live two-page site may inspire functionality but must not be copied, modified or deployed without specific authorization|RevoCapture provides optional independent recovery integration only after explicit scopes|Existing company #029 Vertical Business OS Generator is architecturally adjacent; no default product or brand merger|Existing company #083 DNS/SSL Autopilot only after proven customer-scoped integration|Existing company #033 Accessibility Compliance Monitor may supply checks after validation|Existing #050 AI Front-Desk and #045 customer support remain separate offerings'),
 moat=S('Trade-specific conversion-ready content and forms|Measurably fast mobile sites with clear owner control|High-quality repeatable accessible templates|Reliable verified inquiry delivery|Efficient customer handoff and revision workflow|Vertical playbooks for factual service-area content|Portfolio of proven independent site outcomes'),
 future=S('Customer-editable CMS with no vendor lock-in|Read-only capacity and scheduling availability integrations|Multi-location dispatch/booking routes|Consent-based web chat|Voice intake as separately controlled domain capability|Multilingual service sites|Accessible progressive-web-app features only where useful|Local SEO structured data refinements|Seasonal service page automation|Real booking conversion optimization|Trade-specific quote configuration modules|Customer portal for updates and status|Performance anomaly monitoring|Multi-device visual regression|Analytics attribution with real evidence|Agency white label distribution'),
 packages=S('Starter: one-page website + contact form|Standard: 3–5 pages + services/gallery|Booking: inquiry and appointment-request configuration|Growth: multi-location, performance and updates|Maintenance: consented recurring updates and monitoring|White-label delivery'),
 phases=[
 ('P0','Demand and scope','Validate contractor niches, client willingness to pay, separate from RevoCapture and existing #029.','Clear owner-approved product boundaries and owned demo data.'),
 ('P1','Template/data/privacy foundation','One static trade template, intake schema, approved content/image rights, per-client site isolation.','Zero unintended use of garage company assets or data; access and mobile QA.'),
 ('P2','Contact and booking request workflow','Functional form, secure receiver, request status, calendar read integration optional, anti-spam.','End-to-end synthetic lead delivered to correct owner; never fake confirmed appointment.'),
 ('P3','Multi-device and public readiness QA','Accessibility, performance, HTTPS, responsive screenshots, SEO markup, content truth, backup.','Automated + human functional/visual checklist passes.'),
 ('P4','First customer service delivery','Client quote/approval, template customization, deploy under authorized account, handoff source and docs.','Real client signoff, no unauthorized domain purchase or spend.'),
 ('P5','Maintenance and analytics','Broken forms/links monitors, approved updates, consented analytics, routine incident recovery.','Verified maintenance run with owner notification on failure.'),
 ('P6','Cross-vertical and optional integrations','Expand to 5+ trades, multi-location, CRM/read-only booking, RevoCapture opt-in.','No scope/credential leakage and reuse tests for each trade pack.'),
 ('P7','Agency/operator scale','Independent customer build jobs, bounded concurrent builds, release governance, customer offboarding.','Measured quality/support effort and free-tier capacity; owner-only spending decisions.')]
))
companies.append(dict(
 n=112,slug='automated-video-repurposing',name='Automated Video Repurposing',label='Automated Video Repurposing — working name',
 mission='Turn customers’ owned or licensed long-form footage into reviewable, accessible, platform-ready short video deliverables with strong quality, traceable rights, and local-first processing.',
 problem='Podcasters, educators and businesses have hours of recorded video but limited time and budget to locate valuable highlights, edit vertical clips, add readable captions and deliver consistent high-quality content.',
 differentiator='Reliable source-to-clip traceability, genuinely useful topic/context preservation, strong quality and caption review, platform-specific packaging, and private local-first processing rather than generic volume output.',
 economic='Customer video-hour or clip-bundle fees, optional recurring production plans, optional premium human QC and brand kits; do not depend on paying for compute/stock/music APIs until explicit owner authorization.',
 ideal='Podcasters, educators and small business content teams with lawful recorded footage and regular needs for accessible short-form clips.',
 boundary='Separate from personal-only VeloClip and creator/clipper campaign platform CrowdSkein. New business makes and delivers edited files; no automatic third-party channel uploads or creator payout/referral schemes by default.',
 source='Customer-owned/licensed files; FFmpeg/local speech recognition; YouTube original/reused-content and commercial rights policies for guidance; destination platform specs must be verified.',
 buyers=S('Podcasters|Interview shows|Course instructors|Consulting firms with owned webinars|Small trade businesses with demonstration videos|Educators and trainers|Nonprofit organizations with rights-cleared content|Coaches with owned recordings|Product demo teams|B2B software firms with webinars|Independent conference organizers with rights|Small media teams'),
 verticals=S('Podcast clipping|Business education|Recorded webinars|Interviews|Tech explainers|Product demonstrations|How-to videos|Local service demonstration|Customer testimonials with releases|Event highlights with rights|Corporate internal training snippets|Short social marketing content'),
 products=S('Source upload or authorized file import|Rights/intake questionnaire|Source transcoding|Speech-to-text transcript|Speaker diarization|Language identification|Semantic topic chapter detection|Highlight candidate mining|Question-and-answer clip detection|Hook and context scoring|Clip boundary editing|Silence and dead-air cleanup|Remove filler words only with customer approval and sense checks|Vertical 9:16 reframing|Square 1:1 reframing|Landscape 16:9 clips|Smart face/speaker tracking with consent|Multi-person split-layout framing|Subtitle generation and styling|Word-level timing correction|Profanity policy configurable per client|Caption readability/contrast checks|Brand logo/lower third overlays|Audio denoise and leveling|Noise/music separation optional and tested|Pause/breath naturalness guard|B-roll import from customer-owned assets|Graphic overlays from client library|Client-approved licensed music|Intro/outro templates|Brand style kit and safe margins|Thumbnail still extraction|Short title/description suggestions|Multi-platform output profiles|Clip package delivery with filename convention|Client revision/proof portal|Transcript and caption sidecars|Burned-in versus separate captions|Text-only quote/social caption pack|Background processing queue|Private workspace/retention control|Performance/failure report|Metadata/clip manifest|Batch project processing|Long-form to newsletter/blog outline only as optional related derivative|Optional review-and-publish staging, no auto-publication|Client-approved language translation/subtitles|Video accessibility support|No customer analytics fabricated|Portfolio and before-after examples using owned footage|Customer request tracking and support'),
 features=S('Probe source codecs/frame rates/rotation/colorspaces|Check media license and source publication permission|No extraction from unauthorized livestreams|Video size and duration limits configurable|Resume interrupted upload with integrity hash|Audio/video sync validator|Frame-level edit decision list|Timecode traceability source-to-output|Speaker and topic boundaries preserved|No misleading quote splices|Speaker identification cannot infer real identities without permission|Transcription confidence and uncertain words flagged|Word-level caption manual edit|Automatic profanity/copyright flagging as heuristic not legal clearance|Vertical crop subject tracking with fallback|Face blur/redaction with subject rights and consent|Sensitive info/nameplate/plate screening|Graphic safe zones and overlays|Text overlap safe area QA|Caption max lines/speed readable per device|Loudness normalization and peak clipping guard|Audio intelligibility preservation|Avoid watermark removal and deceptive edits|Duplicate clip semantic similarity detection|Highlight diversity vs repetitions scoring|Customer target-audience and tone settings|Source clip quality minimum|Thumbnail legibility and frame choice|Render profiles versioned per platform|CPU/GPU capability autodetection, CPU fallback|Local processing queue and concurrency cap|Disk quota/retention cleanup approvals|Checkpoint/restart after power loss|No pay-per-token or paid speech API by default|Multiple audio languages when model supported|Review and approve before client delivery by default|Brand template versions and isolated customer assets|No automatic customer channel access|Email/download delivery links with expiry/access control|Portal disabled until owner approves hosting|Privacy and data export/delete|Provenance/watermark where useful not fake authorship|QC sampling all critical sections and selected frames|AI-voice/deepfake features excluded unless separate lawful scope'),
 brain=S('Source topic/story arc extraction|Highlight semantic value scoring|Context completeness and quote faithfulness critic|Clip hook selection with no sensational misrepresentation|Speaker turn boundary analysis|Caption error/confidence evaluation|Multimodal composition and subject focus reasoning|Audio quality and intelligibility assessment|Platform-target format guidance|Brand/tone constraint matching|Scene/speaker continuity reasoning|Safety/PII sensitive footage detection|Rights/use-purpose review prompts|Non-repetitive output diversity|Editorial relevance QA and abstention|Engagement hypothesis proposals not invented view forecasts|Local resource/queue prioritization within $0 budget|Customer revision learning within tenant|Algorithm drift evaluation|Provenance and clip edit explanation|Cross-client model improvements only from consented non-private labels|Video format modernization roadmap proposals'),
 agents=S('Source rights intake agent|Ingest/transcode inspector|Transcript agent|Speaker/topic segmentation agent|Highlight scout agent|Editorial/context QA agent|Auto-reframe agent|Caption timing agent|Audio processing agent|Brand packaging agent|Thumbnail/title draft agent|Privacy/redaction verifier|Video encoder scheduler|Render QA agent|Independent semantic/factual QA agent|Customer revision agent|Secure delivery agent|Incident/recovery agent|Brain improvement proposal agent'),
 services=S('Local source-file hash vault|FFmpeg decode/transcode wrapper|Local speech recognition model adapter|Scene/speaker segmenter|EDL/timecode renderer|Crop/tracking geometry engine|Caption SRT/VTT generator|Audio loudness and waveform checker|Quality scoring and metrics service|Media probe and codec validator|Render preset registry|Local worker pool and bounded resource scheduler|Disk quota and cleanup service|Tenant-private file and key isolation|Rights attestation registry|Review/approval state machine|Checksum delivery manifest|Secure expiration links (when hosting separately approved)|Observability/codec failure diagnostics|Cache and idempotent restart|Dedupe and revision graph|No-spend capacity governor'),
 inputs=S('Customer-owned/licensed source video|Separate source audio if provided|Customer commercial rights and third-party releases|Source transcript and glossary optional|Language and caption style preferences|Brand kit/logo/approved music|Desired platforms/aspect ratios|Target audience and content objectives|Prohibited content/phrases policy|Preferred highlights or timecodes|Client review feedback|Client asset license evidence|Delivery location authorized by customer|Retention/privacy requirements'),
 outputs=S('Short edited clip MP4 with matching codec/profile|Portrait/square/landscape variants|SRT and VTT caption files|Burned-caption version|Optional clean-caption version|Thumbnail image|Suggested title/description/hashtags explicitly drafts|Source-to-output timecode/edit map|Client brand style receipt|Audio quality and caption QA report|Rights/intake provenance record|Rejected/ambiguous segments list|Deliverables checksum and file index|Customer review package and revision history|Secure delivery receipt'),
 workflows=S('Customer uploads lawful media → verify ownership, subject releases and source licensing → file sandbox and hash|Probe codecs/corruption → extract audio → local transcription → language confidence|Segment topics/speakers → candidate highlights → relevance/context score → human review thresholds|Make timecode EDL → enforce no misleading splice → select portrait crop/speaker focus|Generate captions → inspect uncertain words/profanity → style to client brand|Render visual/audio profile → check clipping, dropped frames, black frames, A/V sync, caption safe areas|Independent clip/context rights QA → client review packet → approval/revision|Client approves selected cuts → package variants/sidecars and deliver to private destination|Crash/power loss → checkpoint resume from job and exact build parameters|Client asset deletion/offboarding after retention/legal hold; no silent training reuse'),
 integrations=S('FFmpeg and FFprobe local executables|Whisper/faster-whisper or compatible offline ASR after license and hardware validation|Optional open-source diarization models with tested hardware limits|Local filesystem and external storage with owner authorization|Customer-approved video file transfer service|Customer-owned licensed asset library|Kdenlive/Shotcut/other free editor as manual fallback|Video thumbnail and caption libraries|Optional customer-owned cloud storage link|YouTube/Instagram/TikTok published spec references only, not upload authority|Optional Adobe/Premiere XML/EDL interchange if supported|Internal VeloClip shared contract *only* after prove-three / isolation / express authorization (not assumed)'),
 data=S('Project/client tenant ID|Source video checksum and legal rights attestation|Source frame/timebase/codec metadata|Speech transcript with source segment IDs|Speaker aliases (not real identity claim)|Highlights and scores/confidence|Edit decision list/timecode lineage|Clip rendering profile version|Caption text/timing/reviewer corrections|Brand asset refs and license records|Customer approval and delivery receipts|Local CPU/disk performance metrics|Failed tasks and retry state|Retention/export/deletion and legal hold refs|No raw customer training data in portfolio Brain'),
 monetization=S('One video to multiple short clips package|Tiered clips per source-hour bundle|Recurring monthly clip production capacity plan|Podcast episode package|Corporate webinar highlights|Vertical-specific training/demo cuts|Subtitling/accessibility add-on|Brand style kit configuration|Complex manual editorial QC add-on|Language localization add-on only when verified|Thumbnail/post copy add-on|White-label agency media production|Rush processing only with measured available hardware capacity'),
 distribution=S('Own public-domain or self-recorded demo videos|Before-after approved customer portfolio with release|Podcast host and videographer partnerships|Business creator communities|Transparent per-video/per-clip package pricing|Free sample from licensed demo source only|Referral partners with owner-authorized terms|Organic educational editing guides|Client testimonials only when genuine|Cross-service customer interest without sharing identities/data automatically'),
 metrics=S('Percent clips passing first render QA|Caption word error rate on representative samples|Transcript confidence calibration|A/V synchronization defects|Misleading splice findings|Client accepted clips per package|Average human QA minutes per clip|Local throughput and queue time|Disk use and crash/restart recovery|Client paid orders and repeat clients|Real contribution margin not revenue projections|Rights/PII incident count|Return/refund requests|Customer delivery completeness and on-time rate'),
 failure=S('Rights to footage unclear|Creator does not own background music|Low audio quality yields incorrect captions|Real-person face consent missing|Speaker diarization mislabels|Clip loses crucial context|Quote splice changes meaning|AI summarization invents facts|Language unsupported locally|CPU thermal throttling/low RAM|Disk fills mid-render|Power loss interrupts client job|Video corrupt/VFR sync drift|Portrait reframing cuts key visual|Captions overlap platform UI|Customer logo/music asset unlicensed|Source contains private info|Clip production accidentally publishes to client account|Multiple customers’ video assets cross-contaminate|Unreconciled delivery claims|Client expects 24/7 portal while PC off|Caption translation introduces wrong technical term'),
 safety=S('No CrowdSkein campaign matching, creator marketplace, performance payouts or proxy distribution|VeloClip remains personal-only and unmodified; separate customer service code/assets/workspaces|Only source media with valid processing/commercial rights; do not assume public video is free to reuse|Client reviews final cuts, and ambiguous rights/edits must be escalated|Protect likeness/voice/privacy; no celebrity impersonation, voice cloning or deceptive edits|No automatic uploads/publishing to customer social accounts without later separate scope authorization|Local machine may be offline; never sell 24/7 availability before verification|No outgoing money or automatic cloud/server upgrades'),
 reuse=S('FFmpeg/media concept transferable only after independent license/IP review and prove-three-company reuse rule|VeloClip personal-only locked: no shared accounts/keys/customer data and no unapproved code imports|CrowdSkein clipper-campaign management and distribution remains separate|Existing company #054 Localization Autopilot provides optional interface concepts, not customer data|Existing company #090 Content Moderation for public content checks only after trusted compatibility|Command Center project/Brain/Agency/evaluation and local worker contracts'),
 moat=S('Context-faithful highlight quality and client-specific style|Versioned local-first production recipes|Low-cost reliable automation with evidence|Rights/source-to-output traceability|Caption timing/error eval corpus|Editorial quality over content spam|Reproducible private processing and crash recovery|Trusted client revisions and delivery'),
 future=S('Scene-aware multicamera podcast cuts|Automatic speaker-focused split layouts|More robust offline multilingual ASR|Source-based fact checking via provided material|Customer-approved animated graphics|Customer-approved accessible descriptions|Internal frame-based cut suggestions|Transcript-based search/editor UI|Customer self-service review with controlled hosting|Consent-based subject redaction|Brand kit per social platform|Asset licensing automation|Long-form video trailer packages|Semantically diverse clip batches|Robust local GPU acceleration when hardware available|Caption language/translation packs|Queue distributed to separately approved compute|Selective human-in-loop review only where confidence warrants|Client analytics via separately authorized read-only links'),
 packages=S('Starter: one recording → a few clips|Podcast: episode highlight batch|Business: webinar/education clip pack|Recurring: monthly capacity reservation subject to tested throughput|Premium: manual editorial/caption QA|White-label: studio or agency file-delivery service'),
 phases=[
 ('P0','Scope/rights/hardware feasibility','Company isolation, owned demo footage, legal processing consent; inspect laptop CPU/RAM/disk and no-cost tools.','One full sample can be processed locally without server or spend.'),
 ('P1','Local media ingestion and transcription','FFprobe/FFmpeg, checksum vault, offline ASR and transcript/timecode trace.','Hardware benchmark, corrupt/multiple format tests, no file leakage.'),
 ('P2','Highlight and editorial selection','Topic/speaker segmentation, hook/context scoring, reviewable candidate clips, no misleading splice.','Human-labeled clip rubric and high-confidence abstain cases.'),
 ('P3','Video/caption render and QA','Aspect ratio reframing, captions/audio, platform profiles, encoder/retry, automated visual/audio QC.','SRT accuracy, caption legibility, A/V sync, no clipping/black frames.'),
 ('P4','Client delivery and service operation','Package design, review/revisions, private delivery, consent/rights receipts, customer support.','One synthetic client order end-to-end and clean offboarding.'),
 ('P5','First authorized paid customers','Validate repeat demand and real deliverable quality on existing laptop within capacity.','Verified payments, customer approval and no manual workload overclaim.'),
 ('P6','Local automation and vertical templates','Queue/recovery/scheduled tasks, client style kits, podcast/webinar/education/commerce variants.','Continuous regression with no performance/quality regression or paid features.'),
 ('P7','Optional approved infrastructure scale','Serverless/cloud/hardware alternatives evaluated only after real demand; optional client portal and capacity.','Cost/quality proposal to owner; no purchase, deployment or paid action automatically.')]
))
# Domain-specific material is written once and cross-linked into every roadmap,
# Brain design, phased implementation, and 106-check conformance review.

def related_items(c,key,n=5):return ', '.join(c[key][:n])

def dimension_evidence(c,code,name):
    keys={
      'B':('products','Product areas'), 'C':('features','Behavior and controls'), 'D':('buyers','Customer groups'), 'E':('verticals','Vertical packs'),
      'F':('brain','Specialist reasoning'), 'G':('brain','Brain domain packs'), 'H':('agents','Agent specialisms'), 'I':('services','Deterministic components'),
      'J':('inputs','Accepted inputs'), 'K':('outputs','Produced outputs'), 'L':('workflows','Operational workflows'), 'M':('integrations','Connector surfaces'),
      'N':('integrations','Developer/API seams'), 'O':('data','Scoped schemas'), 'P':('moat','Defensible domain data'), 'Q':('moat','Ownable know-how'),
      'R':('monetization','Potential revenue models'), 'S':('packages','Offers'), 'T':('distribution','Distribution paths'), 'U':('distribution','Acquisition possibilities'),
      'V':('workflows','Customer journey'), 'W':('agents','Support functions'), 'X':('metrics','Customer success outcomes'),
      'Y':('workflows','Safe automation paths'), 'Z':('safety','Remaining human authority'),
      'AA':('services','Operation units'), 'AB':('services','Administration and evidence'), 'AC':('safety','Security-related boundaries'),
      'AD':('data','Privacy-scoped fields'), 'AE':('safety','Compliance boundaries'), 'AF':('safety','Legal and representation boundaries'),
      'AG':('failure','Abuse/misuse cases'), 'AH':('failure','Resilience cases'), 'AI':('metrics','Telemetry'), 'AJ':('failure','Incident playbook triggers'),
      'AK':('failure','Adversarial QA cases'), 'AL':('brain','Brain evaluations'), 'AM':('phases','Deployment gate topics'),
      'AN':('future','Scale options'), 'AO':('metrics','Performance measures'), 'AP':('economic','Zero-cost economics'),
      'AQ':('metrics','Financial metrics'), 'AR':('moat','Differentiators'), 'AS':('moat','Network/feedback effects'),
      'AT':('products','Platform path'), 'AU':('packages','OEM and white label decisions'), 'AV':('verticals','International markets'),
      'AW':('features','Accessibility requirements'), 'AX':('features','Mobile ergonomics'), 'AY':('future','Voice suitability'),
      'AZ':('inputs','Multimodal and structured media'), 'BA':('packages','Marketplace applicability'), 'BB':('integrations','API/SDK contracts'),
      'BC':('distribution','Partner paths'), 'BD':('future','Training and enablement'), 'BE':('distribution','Community relevance'),
      'BF':('source','Knowledge and sources'), 'BG':('metrics','Experimentation with control metrics'), 'BH':('brain','Continuous improvement'),
      'BI':('future','Potential spinoffs'), 'BJ':('reuse','Cross-sell boundaries'), 'BK':('packages','Bundling'),
      'BL':('failure','Failure catalog'), 'BM':('failure','Edge cases'), 'BN':('safety','Safe mode and kill'),
      'BO':('data','Export and portability'), 'BP':('future','Scale vision'), 'BQ':('workflows','Mature automation'),
      'BR':('reuse','Command Center dependencies'), 'BS':('failure','Retrofit and blast risks'), 'BT':('phases','Phased build'),
      'BU':('reuse','Reuse candidates'), 'BV':('reuse','Proof gates before reuse'), 'BW':('brain','Company-unique capabilities'),
      'BX':('integrations','External-to-internalize candidates'), 'BY':('failure','Blast radius'), 'BZ':('data','Versioned contracts')
    }
    if code=='A':return f"Mission: {c['mission']} Differentiation: {c['differentiator']} Boundary: {c['boundary']}"
    if code=='AP':return f"{c['economic']} Resource plans are proposals only. $0 automated spend ceiling; throughput and free-tier ceilings must be measured before a public commitment."
    if code=='AS':return f"Possible opt-in learning from verified, non-private evidence: {related_items(c,'moat',3)}. No assumed network effects and no pooling customer data."
    if code=='BA':return 'No unrelated marketplace. Consider a governed partner/referral marketplace only if relevant to this company, after customer proof and separate owner approval; not in initial implementation.'
    if code=='AY':return f"Optional voice interaction only when it improves core workflow, not a mandatory feature. Adjacent possibilities: {related_items(c,'future',2)}. No impersonation or audio without rights/consent."
    if code=='AE':return f"Company-specific legal and policy review must precede activation. {related_items(c,'safety',3)}. Never infer legal clearance from a software pass."
    if code=='AF':return f"Exact protected domain boundary: {c['boundary']} {related_items(c,'safety',2)}. Professional/legal acceptance stays human-controlled."
    if code=='Z':return f"Automate repeatable approved operations while requiring human approval for consequential actions. {related_items(c,'safety',3)}"
    if code=='BN':return f"Provide per-project and per-tenant pause, disable affected connector, queue hold, evidence-preserving incident mode. Do not pay or carry out protected actions in incident recovery. {related_items(c,'failure',2)}"
    if code=='BR':return 'Permanent authority chain: James Morgan > Command Center > this company Brain > its scoped Agency agents > deterministic tools. Isolated per-company state, independent progress, no outgoing spending.'
    if code=='BD':return f"Customer and staff guidance should teach safe and useful domain actions, such as {related_items(c,'workflows',2)}. No mandatory training marketplace."
    if code=='AV':return f"Plan locale, languages, region-specific rules and formats only when there is evidence of demand: {related_items(c,'verticals',3)}. Jurisdiction-specific legality is a protected expert review."
    key,label=keys[code]
    val=c[key]
    if isinstance(val,str): return f'{label}: {val}'
    if key=='phases': return f'{label}: '+', '.join(f'{v[0]} {v[1]}' for v in val[:5])+'.'
    return f'{label}: '+related_items(c,key,5)+'. Treat unbuilt items as planned capabilities; run relevant independent tests and explicit owner gates before activation.'

PASS_KEY={
1:'problem',2:'products',3:'buyers',4:'verticals',5:'brain',6:'agents',7:'services',8:'data',9:'integrations',10:'packages',11:'packages',12:'boundary',13:'monetization',14:'distribution',15:'workflows',16:'safety',17:'moat',18:'safety',19:'data',20:'safety',21:'failure',22:'verticals',23:'future',24:'future',25:'reuse',26:'future',27:'failure',28:'future'
}
def pass_evidence(c,i,p):
    k=PASS_KEY[i]
    x=c[k]
    evidence=x if isinstance(x,str) else related_items(c,k,7)
    if i==1: return f"{c['problem']} {c['differentiator']} Buyer: {c['ideal']}"
    if i==16:return f"Remove manual repetition only for permissioned routines. Protected human-only decisions: {related_items(c,'safety',6)}."
    if i==23:return f"Scale by measured real workload; avoid automatic paid infrastructure. Future paths: {related_items(c,'future',6)}."
    if i==25:return f"Potential compatibility only, not authorization to mix credentials or assets: {related_items(c,'reuse',6)}."
    if i==27:return f"Adversarial counterexamples and missing branches: {related_items(c,'failure',10)}. Treat every case as a test/acceptance or explicit controlled exclusion, not an automatic feature."
    if i==28:return f"Saturation draft outcome: domain list, risks, future packs and boundary reviewed. Additional material ideas must pass relevance, business value, compatibility, economic, safety and source verification: {related_items(c,'future',8)}. Independent reviewer signoff is still required."
    return f"{evidence}. Work units, inputs, outcomes, relevant compliance and truth states must be tracked independently."

RELEVANCE_TESTS=[
 'Improves verified customer outcome, reliability, safety, effectiveness, operating cost, accessibility or sustainable revenue for this exact company',
 'Is compatible with its legal/technical boundaries and with Command Center authority',
 'Has a documented business hypothesis and measurable acceptance criteria; no deceptive claims or fabricated demand',
 'Can be planned now and implemented later without breaking tested architecture; use plugin/contract seams instead of speculative build',
 'Avoids redundant features and unproven cross-company reuse; preserves source and private customer isolation',
 'All protected changes and outgoing money remain owner-authorized; no automatic reinvestment'
]

RESEARCH={
 'recall':[
  {'title':'CPSC Recalls API','url':'https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information','note':'CPSC provides machine-readable recall notices; source freshness and the exact product identifiers available vary.'},
  {'title':'CPSC Recalls Dataset','url':'https://www.cpsc.gov/Recalls','note':'CPSC notes weekly recall listings and changing remedy data; product identification is not universal.'},
  {'title':'FDA Enforcement Reports','url':'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/enforcement-reports','note':'FDA explicitly warns that firms often warn customers before formal report classification; do not claim this API alone gives earliest warning.'}],
 'shipping':[
  {'title':'USPS Developer Portal status','url':'https://devs.usps.com/status','note':'Tracking API exists but each carrier, account, guarantee and eligibility requires current review; live server status is not a pricing guarantee.'}],
 'books':[
  {'title':'KDP Prepare Your Manuscript','url':'https://kdp.amazon.com/en_US/help/topic/G202187840','note':'Paperback and hardcover interiors may use same source interior, but cover files differ; exact current specifications must be followed.'},
  {'title':'KDP Trim Bleed Margins','url':'https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6/','note':'Correct trim, bleed and page-dependent gutter are necessary; future retailer changes require revalidation.'},
  {'title':'KDP Paperback Submission Guidelines','url':'https://kdp.amazon.com/en_US/help/topic/G201857950','note':'KDP provides PDF/font/image requirements and publishing review; file validator cannot guarantee retailer acceptance.'}],
 'website':[
  {'title':'W3C WCAG 2.2','url':'https://www.w3.org/TR/WCAG22/','note':'Accessibility design and audits do not confer legal certification.'},
  {'title':'FTC Endorsements FAQ','url':'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking','note':'Do not fabricate testimonials or reviews, and endorsements/disclosures must be truthful.'}],
 'video':[
  {'title':'YouTube Monetization Original Content','url':'https://support.google.com/youtube/answer/2490020?hl=en','note':'Video commercial use needs rights to both audio and visual materials; uploading/public availability alone does not grant clipping rights.'},
  {'title':'FFmpeg','url':'https://ffmpeg.org/','note':'Local open-source media processing framework; licensing must be checked for chosen binary/build and redistribution.'}]
}
KEY_FOR_ID={108:'recall',109:'shipping',110:'books',111:'website',112:'video'}

# Written documentation is intentionally separate from implementation state and revenue claims.

def workgraph(c):
    pid=f"project:company:future:{c['n']:03d}"
    tasks=[]
    phase_ids=[]
    prev_gate=None
    for phase_code,label,detail,gate in c['phases']:
        root=f"{pid}:{phase_code.lower()}"
        phase_ids.append(root)
        families=[
          ('scope',f'Authorize scoped plan, source snapshots and threat/economics analysis for {label}', [prev_gate] if prev_gate else [], 'contract'),
          ('domain',f'Implement or document domain-specific {label}: {detail}',[root+':scope'],'domain'),
          ('brain',f'Build, test or prepare the specialist Brain’s decision support for {label}',[root+':scope'],'intelligence'),
          ('isolation',f'Validate access, data/source provenance, no-spend and abuse boundaries for {label}',[root+':scope'],'security'),
          ('tests',f'Independently evaluate domain behavior, privacy, failure cases and regressions for {label}',[root+':domain',root+':brain',root+':isolation'],'verification'),
          ('gate',f'Acceptance/owner authority review for {label}',[root+':tests'],'integration')
        ]
        for suffix,tit,deps,role in families:
            tasks.append({'id':root+':'+suffix,'project_id':pid,'phase':phase_code,'title':tit,'role':role,'dependency_ids':deps,'status':'planned','execution_authorized':False,'priority':'normal','acceptance_criteria':[
              detail if suffix in ('domain','brain') else gate,
              'Evidence must cite exact input, test scope and output version; unmet dependencies remain blocked, not reported as complete.',
              'Zero outgoing money; protected actions need owner-specific approval; customer/company assets isolated.'
            ],'verification':{'state':'pending','required':'independent test plus authoritative checkpoint and source links'}})
        prev_gate=root+':gate'
    for ix,feat in enumerate(c['products']+c['future'],start=1):
        is_future=ix>len(c['products'])
        id=f"{pid}:cap:{ix:03d}"
        dep=f"{pid}:p1:gate" if not is_future else f"{pid}:p4:gate"
        tasks.append({'id':id,'project_id':pid,'phase':'CAPABILITY_CANDIDATES','title':feat,'role':'feature','dependency_ids':[dep],'status':'planned','execution_authorized':False,'priority':'low' if is_future else 'normal','applicability':'future_candidate' if is_future else 'in_scope_candidate','acceptance_criteria':[
          'Write a company-specific requirement and business-value hypothesis; classify now/later/optional/exclude with rationale.',
          'Prove permissions, data isolation, failure handling, economic viability and acceptance on domain-specific fixtures.',
          'Do not ship solely because this candidate exists in the exhaustive roadmap.'
        ],'verification':{'state':'pending','required':'owner-governed domain evaluation and end-to-end QA'}})
    return tasks


def company_roadmap(c,tasks):
    n=c['n'];pid=f"project:company:future:{n:03d}"
    name=c['name']; brainid=f"brain:company:future:{n:03d}:v1"
    out=[f'# Company {n:03d} — {name}\n',
    f'**Company ID:** `company:future:{n:03d}`  ',f'**Primary project:** `{pid}`  ',
    f'**Proposed Brain:** `{brainid}`  ',
    f'**Provisional roadmap version:** `COMPANY-{n:03d}-DRAFT-v1.0.0`  ',
    f'**Status:** PREPARED LOCALLY / NOT REGISTERED / NOT BUILT / NOT LAUNCHED  ',
    f'**GitHub authority inspected:** `jamesmorgan1234/James-morgan-project-command-center` @ `build/spec-lock-v2-clean-room` (read-only snapshot {ROSTER_REF[:12]})  ',
    '**Conformance:** 28 narrative passes + 78 A–BZ evidence maps authored. Final repository conformance verification and external facts remain pending.  ',
    '**Authorization:** planning/files only. Do not write GitHub, Supabase or Vercel; do not launch, market, transact, connect accounts or spend.\n',
    '## Business identity\n',f'Purpose: {c["mission"]}\n',f'Core problem: {c["problem"]}\n',
    f'Value proposition: {c["differentiator"]}\n',f'Ideal first customer: {c["ideal"]}\n',f'Monetization model hypothesis: {c["economic"]}\n',
    f'Non-goal and protected boundary: {c["boundary"]}\n',
    '## First-class project and full company Brain\n',
    f'Immutable proposed company/project/Brain identities above; independent route, button, status, progression, Needs Me, risk, revenue, sources, versions, credentials and private state; company does not inherit anyone else’s actual revenue or completion. Brain authority is subordinate to Command Center.\n',
    'No shared customer data, no unilateral spending, and no automatic scaling. Brain may evaluate, advise and propose; Agency may perform only actions authorized in its bounded task packet. Company owner remains James Morgan.\n',
    section('Complete product tree',c['products']),
    section('Complete feature tree',c['features']),
    section('Complete customer tree',c['buyers']),
    section('Complete vertical tree',c['verticals']),
    section('Specialized Brain capability tree',c['brain']),
    '## Brain architecture\n',
    'A specialized company domain Brain (not the Command Center Brain): input/source context → evidence retrieval → task-domain reasoning → deterministic validation → confidence/abstention → policy/owner gate → recommendation to scoped Agency or Needs Me → independent evaluation → versioned feedback.\n',
    f'Domain sources: {c["source"]}\n',
    f'Protected boundary: {c["boundary"]}\n',
    'Every tool invocation carries immutable `owner_id`, `company_id`, `project_id`, `task_id`, capability, source version, execution budget ceiling **$0**, and authorized action scope; stale or unknown provenance fails closed.\n',
    section('Complete Agent tree',c['agents']),
    section('Deterministic / non-agent services',c['services']),
    section('Input tree',c['inputs']),
    section('Output tree',c['outputs']),
    section('Workflow tree',c['workflows']),
    section('Integration tree (not activated)',c['integrations']),
    '## API / developer ecosystem\n',
    'Plan versioned company-scoped read APIs, least-privilege service tokens, signed inbound webhooks, opt-in outbound callbacks, idempotency, cursor pagination, predictable 429 behavior, schema/version negotiation, optional SDKs, audit tracing, compatible migrations and complete API deprecation policy. No public keys/secrets in source or customer data.\n',
    section('Data architecture / source provenance',c['data']),
    section('Data moat / IP / differentiation',c['moat']),
    section('Monetization candidate tree',c['monetization']),
    section('Packaging and product tiers',c['packages']),
    section('Distribution and acquisition channels (planning only)',c['distribution']),
    '## Customer lifecycle, support and success\n',
    f'Customer states: discovered → qualified → consent/contract/owner authorization → trial/test → live delivery → acceptance → verified paid outcome (if any) → support/corrections → renewal/retention → export/offboard. First real customer is a separate user-controlled activation gate. Support agent classes: {related_items(c,"agents",6)}.\n',
    section('Automation maximum / human intervention minimum',c['workflows']),
    '## Operations / administration\n',
    'Single-owner $0-first operations; source freshness, queue/capacity limits, customer support, quality and legal exception routing, company-specific audit and retention, exact customer billing truth, reconciliation, disaster restore, proof-oriented release checklist, approvals and no-spend enforcement.\n',
    section('Security / privacy / compliance / legal / abuse',c['safety']),
    section('Reliability / failures / edge cases / incident response',c['failure']),
    section('Observability / KPIs / economic measurements',c['metrics']),
    '## Testing / independent verification / Brain evaluations\n',
    'Require unit, contract/schema, integration, end-to-end, accessibility, negative/abuse, privacy-isolation, authorization, no-spend, idempotency/retry, outage recovery, drift, benchmark and stress tests; model or heuristic evaluation must include a realistic domain-labeled corpus and threshold/abstention gates. A passed mock is not proof of live operation.\n',
    f'Critical acceptance examples: {related_items(c,"failure",10)}.\n',
    '## Deployment / scale / performance / cost\n',
    'Local/free-first validated implementation; only propose paid hosting/API/GPU/communication resources for owner consideration if actual demand and quality/capacity measurements warrant. No automatic paid activation or reinvestment. Exact release identity, tested rollback, per-company resource quotas, incident safe mode, accessible responsive UX.\n',
    section('Future-technology and strategic expansion candidates',c['future']),
    section('Cross-company synergy and reuse *candidates*',c['reuse']),
    '## Proven capability dependency, blast radius, version and compatibility\n',
    'Before reuse: prove third-party licensing/IP permission, three-company production-proven maturity where required, compatibility with client schemas and domain safety, tenant boundaries, shadow/canary eval, performance envelope, fallback or fork, rollback, source/version pin and deletion/retention isolation. No broad inheritance merely because concepts are similar.\n',
    'Blast-radius classification: critical for cross-company financial/credential leaks or unapproved outgoing money; high for domain harm, false claims, silent loss or misrouting; medium for recoverable user experience defects; low only for reversible scoped cosmetic changes. Shared changes require a regression matrix across all affected companies.\n',
    '## White label / OEM / partners / community / training\n',
    'Evaluate only if relevant and commercially validated: documented partner integrations, reseller contracts without auto-payouts, approved white-label packages, industry-specific onboarding, help center, sample reports and community education. Do not add an unrelated marketplace or divert the business into a generic platform.\n',
    '## Internationalization, accessibility, mobile, voice, multimodal\n',
    'Consider locale/timezone/currency and rights/consent rules, responsive mobile access, WCAG-aligned controls, language packs, text/speech/video inputs only where materially relevant. Safety/legal and accessibility claims must be evaluated against current standards and human review, not self-certified.\n',
    '## Experimentation / continuous improvement\n',
    'Each experiment: customer-relevant hypothesis, metric and baseline, independent test, sample limits, owner-approved exposure, versioned rollback and privacy safeguards. A domain Brain may suggest learning packets upward; Command Center validates and scopes any promotion. Do not silently share customer-private memories or models.\n',
    '## Phased implementation roadmap (sequential gates; parallel work inside gates)\n']
    for ix,(code,label,detail,gate) in enumerate(c['phases']):
        prev=c['phases'][ix-1][0] if ix else None
        out += [f'### {code} — {label}\n', f'**Objective:** {detail}\n',f'**Exit gate:** {gate}\n',
        f'**Dependency:** {prev} acceptance first; then scoped design/domain/Brain/security tasks may run concurrently, with integration/testing before the {code} gate.\n',
        f'**Planned task IDs:** `{pid}:{code.lower()}:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate` (full IDs and edges in `data/AGENCY_TASK_GRAPH.json`).\n']
    out += ['\n# Exhaustive 28-pass findings — planning evidence\n']
    for i,p in enumerate(PASS_NAMES,1):
        out.append(f'**{i:02d}. {p}:** {pass_evidence(c,i,p)}\n\n')
    out += ['# A–BZ 78-dimension conformance candidate map\n',
    'Every dimension below has company-specific proposed evidence, but independent verification has **not** occurred and no percent is earned. Final statuses belong to the exact-head Command Center conformance audit.\n']
    for k,name in DIMENSIONS:
        out.append(f'**{k} — {name}:** {dimension_evidence(c,k,name)}\n\n')
    out += ['## Adversarial missing-idea and saturation conclusion — provisional\n',
            f"A relevance-based red-team pass examined {len(c['failure'])} failure modes, {len(c['future'])} future capability candidates, {len(c['products'])} product candidates, {len(c['brain'])} Brain capabilities, and {len(c['agents'])} Agent roles for this domain.\n",
            'Any new idea must be tested against these gates:\n'+bullets(RELEVANCE_TESTS)+'\n',
            'This is an exhaustive **planning candidate** at the present snapshot, not proof that all possible future inventions have been discovered, all 106 checks are accepted, or a working company exists.\n',
            '## Explicit exclusions / not-now\n'+bullets(common['generic_non_goals'])+'\n',
            '## Final truth and authorization statement\n',
            'Company is proposed only. No GitHub write, Supabase migration, project button, registered Brain/Agent, external customer operation, account activation, deployment, publishing, purchase, financial transfer, refund, reinvestment, marketing send or customer outreach has been performed or authorized by this document.\n']
    return '\n'.join(out)


def brain_design(c):
    n=c['n'];name=c['name'];bid=f'brain:company:future:{n:03d}:v1'
    return '\n'.join([
      f'# Company {n} specialized Brain — {name}',
      f'**Proposed Brain ID:** `{bid}`; **Project:** `project:company:future:{n:03d}`; **Truth:** NOT IMPLEMENTED',
      '## Absolute authority and action contract',bullets(common['global_governance']),
      '## Mission and scope',c['mission'],c['boundary'],
      '## Brain capabilities',bullets(c['brain']),
      '## Specialized reasoning architecture',
      '1. Validate actor and company-scoped delegated authority. Deny on missing token, source, policy or cost authorization.',
      '2. Retrieve task-specific, permission-checked, timestamped evidence and domain models; label source reliability and unknown states.',
      '3. Apply domain ontology, rules and scoped inference. Never substitute model text for official source, legal acceptance, customer consent or deterministic financial data.',
      '4. Produce a proposal object: objective, evidence refs, alternative paths, factual confidence, model/version, risk class, proposed next actions, expected nonbinding cost and safe fallback.',
      '5. Deterministic services validate input schemas, policy, math, version/temporal predicates and no-spend. Escalate ambiguity to human or bounded expert reviewer.',
      '6. A separate verifier runs domain-specific regression/eval; Agency may execute only explicitly delegated work, and never a protected external action by implication.',
      '7. Store minimal company-local checkpoint/learning evidence. Send proposed generalized knowledge upward only after Command Center validates scope, provenance and privacy.',
      '## Evidence schema (proposed; adapt to live schemas, do not assume this is deployed)',
      'Fields: `company_id`, `project_id`, `brain_id`, `version`, `task_id`, `source_refs[]`, `source_observed_at`, `source_validity_state`, `input_hash`, `policy_version`, `hypothesis`, `decision`, `confidence`, `abstained`, `uncertainty`, `risk`, `outbound_money_required`, `proposed_next_step`, `verification_refs[]`, `human_approval_ref?`, `rollback_ref?`.',
      '## Deterministic services',bullets(c['services']),
      '## Agents and orchestration',bullets(c['agents']),
      'Independent agents receive separate work packets with bounded tools, scopes, finite CPU/concurrency/free-tier quota. No agent becomes Command Center. Parallelize only after shared schemas/contracts are stable; integrate behind project-specific verification gates.',
      '## Evaluation matrix',
      'Every Brain must be evaluated on all five axes: (1) domain result accuracy against curated examples; (2) correct abstention/uncertainty on unsupported claims; (3) evidence/provenance grounding and current source versions; (4) privacy/role/owner authorization; (5) failure behavior including source outage, duplicate inputs and no-spend.',
      'Domain eval examples:',bullets(c['failure'][:16]),
      'Escalation and protected actions:',bullets(c['safety']),
      '## Improvement governance',
      'Version improvements as proposal → isolated synthetic/shadow test → independent verifier → change-impact analysis → Command Center evaluation → owner gate if protected → canary with safe rollback. A result in one Brain cannot silently overwrite others.',
      '## Lifecycle and deployment truth',
      'Planned Brain only; no model providers, workers or credits are assumed connected. If an AI provider is unavailable, deterministic validated modules may run where sufficient; otherwise Brain returns unavailable/blocked without implying autonomous work completed.',
      '## Non-overlap and isolation',bullets(c['reuse'])
    ])+'\n'


def agency_doc(c):
    n=c['n'];pid=f'project:company:future:{n:03d}'
    out=[f'# Company {n} Agency execution and dependency plan',
      f'**Project:** `{pid}`',
      '**State:** PREPARED / NO TASKS REGISTERED / NO EXECUTOR ACTIVATED',
      '## Scheduler model',
      'P0→P7 are ordered acceptance stages. Within a stage, design/domain/Brain/security may be split among different agents after the scope contract; independent QA integrates only after those tasks. A single agent handles dependent work when required. Every task has idempotent claim/lease/retry and durable evidence.',
      'Resource governor caps concurrent tasks by actual workers, hardware and $0 limits. Never imply agents are unlimited or connected. Store unknown instead of guessing capacity.',
      '## Stage gates']
    for code,label,detail,gate in c['phases']:
        out.extend([f'### {code} — {label}',f'Scope: {detail}',f'Acceptance: {gate}',f'Work packets: `{pid}:{code.lower()}:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.'])
    out.extend(['## Customer-protected or financial actions',bullets(common['global_governance']),
                '## Domain build candidates for optional task decomposition',bullets(c['products']),
                '## Future capability candidates — do not make launch blockers unless necessary',bullets(c['future']),
                '## Test suites and evidence',
                'For every stage: contract/schema QA, unit, integration, tenant isolation, safety, source versioning, no-spend, negative/corner, actual environment smoke and rollback; run domain fixtures:',bullets(c['failure']),
                '## Source truth',
                'A completed roadmap file is a planning deliverable; it is not an implemented service or a verified project percentage. Progress must derive from accepted work-unit evidence and live scope denominator.' ])
    return '\n\n'.join(out)+'\n'


def threats_doc(c):
    return '\n'.join([
      f'# Company {c["n"]} — risk, legal, quality and acceptance matrix',
      '**Status:** Draft planning controls; legal and provider specifics require fresh review before live use.',
      '## Misuse, failure and ambiguity register',bullets([f'**R{i:02d}:** {v}. **Control:** use evidence-aware rule/abstention, tenant scope, domain fixture and independent QA; escalate severity and preserve event history.' for i,v in enumerate(c['failure'],1)]),
      '## Protective controls and human gates',bullets(c['safety']),
      '## KPI and test evidence',bullets(c['metrics']),
      '## Kill/recovery and containment',
      'Safe mode disables affected action/connector while retaining evidence, rollback candidate, retry lease and tenant-specific notification. Company failure does not propagate to unrelated companies. No automated financial action occurs during recovery.',
      '## No false assurance',
      'Provider data may be delayed, terms may change, QA samples may miss defects, and paid customer demand is not established by a roadmap. Every high-impact claim needs a source/effective date or an explicit unknown state.',
      '## Relevance and saturation veto',bullets(RELEVANCE_TESTS),
      '## Evidence collection per real deployment',
      'Commit/release ID; migration/candidate compatibility; test suite/log summary; source and tenant authorization; provider limits; performance/quality; actual financial state; incident/rollback checkpoint; customer authorization; operator signoff.' ])+'\n'

company_rows=[]; all_tasks=[]; all_brains=[]; all_checks=[];all_capabilities=[];all_phases=[]; research_rows=[]
for c in companies:
    n=c['n'];slug=c['slug'];id=f'company:future:{n:03d}';pid=f'project:company:future:{n:03d}';brainid=f'brain:company:future:{n:03d}:v1'
    dirname=f'{n:03d}_{slug.replace("-","_")}'
    outdir=ROOT/'companies'/dirname;outdir.mkdir(parents=True,exist_ok=True)
    path=f'roadmap/portfolio-future-architecture/companies/{n:03d}_{slug.upper().replace("-","_")}.md'
    tasks=workgraph(c)
    (outdir/'EXHAUSTIVE_COMPANY_ROADMAP.md').write_text(company_roadmap(c,tasks),encoding='utf-8')
    (outdir/'SPECIALIZED_BRAIN.md').write_text(brain_design(c),encoding='utf-8')
    (outdir/'AGENCY_EXECUTION_PLAN.md').write_text(agency_doc(c),encoding='utf-8')
    (outdir/'RISKS_QA_AND_GATE_MATRIX.md').write_text(threats_doc(c),encoding='utf-8')
    company_rows.append({
      'ordinal_proposed':n,'company_id_proposed':id,'primary_project_id_proposed':pid,'working_name':c['name'],
      'name_owner_confirmation_required':True,'slug':slug,'proposed_repo_company_roadmap_path':path,
      'source_preparation_file':f'companies/{dirname}/EXHAUSTIVE_COMPANY_ROADMAP.md',
      'source_sha256':hashlib.sha256((outdir/'EXHAUSTIVE_COMPANY_ROADMAP.md').read_bytes()).hexdigest(),
      'source_branch':'build/spec-lock-v2-clean-room','reference_repo_head_at_preparation':ROSTER_REF,
      'truth_state':'PLANNED_NOT_REGISTERED','execution_authorized':False,'autonomy_level':'planned_only',
      'customer_accounts_created':False,'money_out_limit_usd':0,'independent_button_required':True,'independent_page_required':True,
      'brain_id_proposed':brainid,'business_identity':c['mission'], 'non_goal':c['boundary'],
      'separate_company_and_customer_accounts':True,'independent_progress':True,
      'no_automatic_spending_or_reinvestment':True})
    all_tasks+=tasks
    all_brains.append({'brain_id_proposed':brainid,'company_id':id,'project_id':pid,'domain_brain_type':'specialized_domain_brain','status':'PLANNED_NOT_REGISTERED','parent_control_authority':'command-center','human_final_authority':'James Morgan','domain_mission':c['mission'], 'capability_tree':c['brain'],'agents':c['agents'],'deterministic_services':c['services'],'never_authorized_to_spend_or_reinvest':True,'max_automatic_outgoing_spend_usd':0,'source_files':[f'companies/{dirname}/SPECIALIZED_BRAIN.md'],'data_scope':'company-and-customer-isolated','protected_actions_need_owner_and_platform_authority':True})
    for ix,(code,label,detail,gate) in enumerate(c['phases']):
        all_phases.append({'project_id':pid,'phase':code,'title':label,'description':detail,'exit_gate':gate,'predecessor':c['phases'][ix-1][0] if ix else None,'state':'PLANNED'})
    for i,item in enumerate(c['products'],1):
        all_capabilities.append({'id':f'cap:company:{n:03d}:product:{i:03d}','company_id':id,'project_id':pid,'name':item,'tier':'candidate_now_or_later','require_relevance_economics_and_safety_review':True,'ready_to_execute':False})
    for i,item in enumerate(c['features'],1):
        all_capabilities.append({'id':f'cap:company:{n:03d}:feature:{i:03d}','company_id':id,'project_id':pid,'name':item,'tier':'candidate_now_or_later','require_relevance_economics_and_safety_review':True,'ready_to_execute':False})
    for i,item in enumerate(c['future'],1):
        all_capabilities.append({'id':f'cap:company:{n:03d}:future:{i:03d}','company_id':id,'project_id':pid,'name':item,'tier':'future_optional_relevance_gate','require_relevance_economics_and_safety_review':True,'ready_to_execute':False})
    for i,name in enumerate(PASS_NAMES,1):
        all_checks.append({'check_id':f'company:{n:03d}:pass:{i:02d}','project_id':pid,'group':'28_PASS','code':i,'name':name,'evidence':pass_evidence(c,i,name),'draft_status':'DRAFT_MAPPED_PENDING_INDEPENDENT_AUDIT','independent_verification':False,'source_file':f'companies/{dirname}/EXHAUSTIVE_COMPANY_ROADMAP.md'})
    for code,name in DIMENSIONS:
        all_checks.append({'check_id':f'company:{n:03d}:dimension:{code}','project_id':pid,'group':'A_BZ','code':code,'name':name,'evidence':dimension_evidence(c,code,name),'draft_status':'DRAFT_MAPPED_PENDING_INDEPENDENT_AUDIT','independent_verification':False,'source_file':f'companies/{dirname}/EXHAUSTIVE_COMPANY_ROADMAP.md'})
    for item in RESEARCH[KEY_FOR_ID[n]]:
        research_rows.append({**item,'company_id':id,'verified_requirement':'re-check current API, terms, law and platform specs at actual build/launch; a 2026-11-03 source read is not launch approval'})

# Data contracts are proposals for later Work import, never a claim the current database supports their field names.
def save_json(name,data):
    path=ROOT/'data'/name
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

save_json('COMPANY_REGISTRY_PROPOSALS.json',{'purpose':'Prepared-only; not repository records','reviewed_repo_head':ROSTER_REF,'proposed_company_count':len(company_rows),'current_registered_company_count':107,'expected_count_only_after_owner_authorized_import':112,'companies':company_rows})
save_json('SPECIALIST_BRAIN_PROPOSALS.json',{'parent_authority':'command-center','final_human_authority':'James Morgan','status':'NOT_REGISTERED','brain_count':len(all_brains),'brains':all_brains})
save_json('AGENCY_TASK_GRAPH.json',{'status':'PLANNED_NOT_REGISTERED','note':'Planning DAG only; full runnable native roadmap must be compiled against current exact-head interfaces and verified by live tests. Do not load these JSON objects directly into production without schema reconciliation.','tasks':all_tasks})
save_json('ROADMAP_PHASES.json',{'status':'PLANNED','phases':all_phases})
save_json('COMPANY_CAPABILITY_CATALOG.json',{'status':'PROPOSED_UNBUILT','capabilities':all_capabilities})
save_json('CONFORMANCE_106_CHECK_DRAFT.json',{'denominator_per_company':106,'passes_per_company':28,'dimensions_per_company':78,'count_as_completed':0,'note':'The evidence is a draft planning candidate; independent conformance review with source-specific supporting proof is required before declaring EXHAUSTIVELY_MAPPED or computing actual completed work.','checks':all_checks})
save_json('EXTERNAL_SOURCES_AND_VALIDATION.json',{'status':'PUBLIC_REFERENCE_SNAPSHOT','date':DATE,'sources':research_rows,'reference_repo':f'https://github.com/jamesmorgan1234/James-morgan-project-command-center/tree/{"build/spec-lock-v2-clean-room"}','repo_commit_sha':ROSTER_REF})

readme='''# Five-company preparation package — DRAFT FOR LATER AUTHORIZED IMPORT

Prepared: 2026-11-03. No GitHub, Supabase, Vercel, customer, domain, or financial changes performed.

## Five proposed additions

108 — Product Recall Intelligence
109 — Shipping Exception & Refund Recovery
110 — Book Formatting & Publishing Preparation
111 — Contractor Websites & Online Booking
112 — Automated Video Repurposing

**Working names only** until owner confirms public branding. Proposed company/project identifiers must be verified against the live branch before reserving or inserting any. Current authoritative company roster verified as 001–107 at read-only GitHub HEAD `055b9dd7662c9ece73e393f604a81ff76227bb6c`, branch `build/spec-lock-v2-clean-room`.

## Folder map

- `companies/NNN_*/EXHAUSTIVE_COMPANY_ROADMAP.md`: company-specific complete product/feature/Brain/Agent/service/data/workflow/monetization/security tree, 8 phases, 28-pass and A–BZ dimension maps.
- `companies/NNN_*/SPECIALIZED_BRAIN.md`: subordinate Brain architecture and evaluation.
- `companies/NNN_*/AGENCY_EXECUTION_PLAN.md`: parallel/sequential work packets and acceptance gates.
- `companies/NNN_*/RISKS_QA_AND_GATE_MATRIX.md`: adverse scenarios and test gates.
- `data/COMPANY_REGISTRY_PROPOSALS.json`: immutable ID proposal, company count, file hashes.
- `data/SPECIALIST_BRAIN_PROPOSALS.json`: proposed Brain registry.
- `data/AGENCY_TASK_GRAPH.json`: planning-only dependency graph, with work packets and capability backlog; NOT a native database migration.
- `data/ROADMAP_PHASES.json`: phased gates.
- `data/COMPANY_CAPABILITY_CATALOG.json`: broad relevance-screened feature candidates; not a command to ship every idea.
- `data/CONFORMANCE_106_CHECK_DRAFT.json`: explicit 28+78 draft evidence checks per company; independent audit still required.
- `data/EXTERNAL_SOURCES_AND_VALIDATION.json`: source URLs and fresh-verification requirements.
- `00_AUTHORITY_AND_PROTECTED_SCOPE.md`, `01_IMPLEMENTATION_AND_BUTTON_ACCEPTANCE.md`, `02_CROSS_PORTFOLIO_OVERLAP.md`, `03_RESEARCH_AND_VALIDATION.md`, `04_FUTURE_WORK_HANDOFF.md`.
- `scripts/validate.py`: local structural checks, 28-pass/78-dimension coverage, identity and DAG consistency.

## Truth labels

An authored plan is not built software. A registered project is not a live company. A test is not a sale. A planned capability is not available. No production status, rollout, payments, legal clearance, external account connection or running agent workers are claimed by this package.

## Absolute governance

James Morgan is final human authority; Command Center leads and controls every specialist Brain/Agency. **All outgoing money actions are owner-only with $0 automatic spend limit**, including automatic reinvestment. Default-to-free/local resources. No merging account/data/credentials between companies. No VeloClip SaaS/customer scope: it stays personal only. CrowdSkein remains creator campaign/distribution software, separate from Company 112. RevoCapture remains leads/calls/reputation recovery; Company 111 is independent websites and request forms.

## QA

Run `python scripts/validate.py` from this package root. After later authorized import, re-check current GitHub HEAD; generate database-native schemas and migrations from current code, apply only after separately authorized protected infrastructure gates, and verify each button and Brain through current production/preview requirements.

## What must happen later

When James authorizes the GitHub/Work addition, attach this ZIP to that Work task and use `04_FUTURE_WORK_HANDOFF.md` in full. Do not treat preparation as an authorization to deploy or publish. If Work cannot access this file from chat, explicitly attach the ZIP; do not assume environment synchronization.
'''
(ROOT/'README.md').write_text(readme,encoding='utf-8')

(ROOT/'00_AUTHORITY_AND_PROTECTED_SCOPE.md').write_text('# Authority, spending and scope locks\n\n'+bullets(common['global_governance'])+'\n## Company-specific non-overlap\n\n'+ '\n'.join(f'- **{c["n"]} {c["name"]}:** {c["boundary"]}' for c in companies)+'\n\n## Relevance gates\n\n'+bullets(RELEVANCE_TESTS)+'\n',encoding='utf-8')

integration='''# Later-authorized repository, UI and Brain integration acceptance

**NO ACTIONS AUTHORIZED BY THIS FILE.** Prepared for an eventual separate Work authorization.

## Authority and exact-head prerequisite

Repository `jamesmorgan1234/James-morgan-project-command-center`.
Protected/allowed branch only `build/spec-lock-v2-clean-room`; do not alter `main`, unrelated branches, other Supabase projects, other Vercel projects, customer-facing accounts or current live services. Live HEAD at preparation was `055b9dd7662c9ece73e393f604a81ff76227bb6c`; refetch CURRENT HEAD before any later action and never assume this snapshot SHA is current.

## Staged implementation order (within later authorization)

1. Read current HEAD, repo company roster 001–107, current schema migrations, project UI registry, brains and Agency contracts. Inspect existing changes including any 108+ records that may have appeared; never blindly insert duplicates. Back up source state via version control; do not reset unrelated work.
2. Re-run `scripts/validate.py`, inspect all five company roadmaps and Brain/Agency/risk docs in this package. Reconcile owner naming and proposed IDs with actual roster; do not overwrite independently registered companies or resurrect retired identities.
3. Add five **company source roadmap** files to `roadmap/portfolio-future-architecture/companies/108_...md` through `112_...md` in canonical format, preserving 28-pass/A–BZ company-specific evidence and proposed status. Keep the separate detailed Brain, Agency and QA documents in a sensible scoped subfolder, with source paths recorded; do not flatten content into minimal boilerplate.
4. Update the central company/project registry and dynamic count from 107 to 112 **only if 108–112 are genuinely distinct**. Preserve company:future:001–107 unchanged and original 39 projects / 43 book records unaffected.
5. Use the exact current `clean-room/src/projects/types.ts` `ProjectRecord`/`ProjectTypeRegistry`, `clean-room/src/projects/planned-company-roadmap.ts`, native DB schema, and current migrations for actual persistent records. The proposal JSON is NOT directly compatible with database until adapted and independently reviewed. Ensure immutable `company:future:NNN`, `project:company:future:NNN`, company local Brain identity and provenance.
6. Each company has exactly one **visible independent button** in the existing Projects > Future Companies category, a stable route and non-generic scoped detail page. Button displays true planned status; independent progress N/A until legitimate implementation denominator, independent Brain, Agent/Agency, Needs Me, blockers, incidents, last checkpoint. Mobile phone viewport should never horizontally overflow.
7. Register the **five separate specialized Brains**, all subordinate to Command Center. Ensure each has an independent domain pack, evaluation source, tool restrictions, event/knowledge context and scoped memory; no auto actions or direct owner-financial rights. No one company Brain becomes the global leader.
8. Compile future executable task DAG with valid native work-unit schema, correct phase and dependencies, source hashes/requirements, independent tests and integration gates. Do not mark any generated code, planned tasks or imported source as completed production work; no live agent execution without authorization and actual workers.
9. Reconcile collision/overlap risks with existing #016, #035, #055, #085–087, #009, #029, RevoCapture, VeloClip, CrowdSkein, KDP and Morgan’s Garage Doors; preserve true legal and account separation. Shared code may be suggested but not cloned by assumption; prove-three independent companies prior to broad reuse where that operating rule applies.
10. Perform dry-run, typechecks, unit/integration/route/UI/mobile/Brain/Agency isolation tests, correct defects and re-run. Independently verify exact HEAD and source hashes for each new roadmap.
11. Create migration scripts only if required and explicitly authorized for the selected environment. Do NOT perform production Supabase DDL or paid deployments by implication. Actual production activation and aliases are OUT OF SCOPE unless future authorization explicitly names them. Zero outgoing money.
12. Return proof: final HEAD, paths/files created or edited, count of 112 *if actually committed*, 5 buttons live or preview status only if tested, results for every company Brain and project status, all tests and blockers, which operations were only planned, no-spend evidence, any user-only approvals.

## Acceptance tests for all five

- 107 originals unchanged except narrowly justified additive registry/count changes, no missing company identity and no duplicate IDs.
- Future company entries 108–112 each independent; cannot be mistaken for an original project/book or for VeloClip/CrowdSkein/RevoCapture.
- All five have roadmap source files, 28 passes and 78 A–BZ dimensions, Brain policy pack, bounded task DAG and relevant QA/risk corpus.
- Opening each phone-sized project button navigates to that company, not to a generic shared page or another company's state; buttons are correctly sorted and visible.
- Progress: `N/A` or valid evidence-derived percentage, never artificial 0%/100% merely from planning/import or label.
- Safe execution boundaries: `owner → Command Center → specialist Brain → scoped agents → tools`; no cross-tenant data, account or credential sharing; no agent can spend or reinvest automatically.
- Health views distinguish unavailable from healthy; routes and source freshness checked; no live agent/AI provider claims without exact worker/provider proof.
- Source audit captures references, versions, code/test evidence, both branch and deployment state if relevant.
- Idempotent import: repeated authorized import creates no duplicates, no erased existing data or double-counted companies.
- Revert/rollback route exists before any mutation; deployment and financial actions not performed without separate explicit authority.
'''
(ROOT/'01_IMPLEMENTATION_AND_BUTTON_ACCEPTANCE.md').write_text(integration,encoding='utf-8')

overlap='''# Cross-portfolio overlap, separation, reusable seams and spinoff checks

## Company 108 — Product Recall Intelligence

Adjacent: #055 Product Catalog Intelligence (catalog entity logic), #035 Warranty/Claims (authorized workflow only), #016 Regulation Change Monitor (monitor engine), #079 Provenance. New product specifically links official recall notices to merchant SKUs with safety-critical source freshness/ambiguity and customer impact. Never claim safety certification. It is not simply a renamed returns product. Validate separate demand and avoid double-charge for existing tools.

## Company 109 — Shipping Exception & Refund Recovery

Adjacent: #034 Returns Intelligence, #085 Revenue Leakage, #086 Payment Reconciliation, #087 Marketplace Payout Reconciliation, #071 Webhook Reliability. New product is carrier-shipment/service-policy/claim eligibility and verified credit recovery, not consumer return authorization or general debt collections. Distinct carrier policy and statement-ledger packs. Outgoing consumer refunds and carrier settlement actions remain human authorized.

## Company 110 — Book Formatting & Publishing Preparation

Adjacent: the James Morgan personal KDP book pipeline, #009 Document-to-Workflow, #065 Autonomous QA. It sells client-owned book interior/EPUB and cover mechanical preparation, not publishing James's books; no mixing personal author rights, KDP credentials, or commercial manuscript data. Customer must own and approve publishing/rights/content and any pricing. Reusable parsing/testing contracts only after proof and license evaluation.

## Company 111 — Contractor Websites & Online Booking

Adjacent: RevoCapture, #029 Vertical Business OS Generator, #050 AI Front-Desk, #083 Domain/DNS/SSL. New company provides sites and inquiry/appointment-request forms; RevoCapture handles missed call, lead follow-up and reputation rescue. Standalone website company has independent client assets, forms, contact deliverability and domains. Do not touch the already-approved Morgan’s Garage Doors site/contract except with a separate authorization.

## Company 112 — Automated Video Repurposing

Adjacent: VeloClip (locked personal-only media operation), CrowdSkein (creator/clipper campaign and distribution platform), #054 Localization and #090 moderation. Company 112 sells production of rights-cleared clips from customer-supplied footage, not multi-user VeloClip or CrowdSkein marketplace. It starts with local/free tools and a separate customer identity/asset pipeline. Any code sharing with protected projects needs explicit authorization, proof maturity, license review and isolation.

## Portfolio integration rules

Each company is an independently marketable offer with unique primary customer problem, buyer, product, pricing/economics, domain Brain and project/credential identity. All shared contracts are candidates, not proof of shared deployment or permission to merge projects. Domain-specific engines must be forkable and version-pinned. Business performance must be based on actual externally confirmed payments and expenses, not test events.
'''
(ROOT/'02_CROSS_PORTFOLIO_OVERLAP.md').write_text(overlap,encoding='utf-8')

sources='''# Public reference sources, verification gaps and research findings

The package uses the 2026-11-03 research snapshot and GitHub source authority. Official primary documentation takes precedence over marketing claims. The live environment/provider access cannot be assumed from a public API page.

## Official source citations

'''
for k in ['recall','shipping','books','website','video']:
    sources+=f'### {k.capitalize()}\n\n'
    for x in RESEARCH[k]:sources+=f'- **{x["title"]}** — {x["url"]}. {x["note"]}\n'
    sources+='\n'
sources+='''## Current remaining verification before market launch

- Verify actual customer demand/willingness-to-pay for each of five candidates; published freelancer jobs or software category size do not establish buyer commitment to this specific product.
- Verify official license/ToS, quotas, terms, pricing/free-tier, carrier-guarantee eligibility, regulatory-source latency, KDP current specs, social media platform ownership/rights, customer website consent and domain ownership.
- Establish business entity/merchant/account setup only through authorized user actions; nothing in this package asserts registered LLCs, trademark/name clearance, public sites, payment processing, or legal qualification.
- Security/privacy, financial, consumer safety and audiovisual rights issues need jurisdiction-specific expert review before regulated or consequential use.
- Proprietary future vendor APIs, distributed GPU and paid automation cannot be treated as free or connected without fresh tests and explicit owner authorization.
'''
(ROOT/'03_RESEARCH_AND_VALIDATION.md').write_text(sources,encoding='utf-8')

handoff='''# COPY-READY LATER WORK TASK — USE ONLY WHEN JAMES AUTHORIZES THE IMPORT

**Go to Work**

COMMAND CENTER — PREPARED FIVE-COMPANY IMPORT AND FIRST-CLASS PROJECT INTEGRATION ONLY

Use the attached file `FIVE_COMPANY_GITHUB_READY_PREPARATION_2026-11-03.zip` in its entirety. The ZIP was prepared in normal ChatGPT only. Do not assume it is already present in the Work environment; read it after it is attached. The attached five roadmaps, Brains, Agency plans, QA risk matrices, manifest, task graph and 106-check evidence are the authoritative candidate inputs for this specific task. Keep existing repo authority superior to package schema guesses, and newest explicit James Morgan instruction superior to the package.

Repository: `jamesmorgan1234/James-morgan-project-command-center`.
Authorized branch ONLY: `build/spec-lock-v2-clean-room`.
Last read-only checked HEAD at preparation: `055b9dd7662c9ece73e393f604a81ff76227bb6c` — FIRST ACTION refetch CURRENT HEAD, do not trust this saved SHA.

AUTHORIZED FUTURE SCOPE (ONLY IF THIS TEXT IS EXPLICITLY SUBMITTED AS A NEW WORK AUTHORIZATION): Add five proposed companies 108–112 as five independent planned company records with exhaustive source roadmaps, five subordinate specialized company Brains, scoped Agency work/dependency maps and five real independent Project buttons/routes/detail views using the EXISTING Command Center architecture. Update company count to 112 if and only if all five are distinct, authorized and actually registered. Preserve old companies 001–107, original projects, all 43 book records and all protected assets.

NAMES (WORKING, PENDING OWNER-FACING BRAND APPROVAL):
108 — Product Recall Intelligence
109 — Shipping Exception & Refund Recovery
110 — Book Formatting & Publishing Preparation
111 — Contractor Websites & Online Booking
112 — Automated Video Repurposing

READ FIRST: `README.md`, `00_AUTHORITY_AND_PROTECTED_SCOPE.md`, `01_IMPLEMENTATION_AND_BUTTON_ACCEPTANCE.md`, `02_CROSS_PORTFOLIO_OVERLAP.md`, `03_RESEARCH_AND_VALIDATION.md`, the FIVE `EXHAUSTIVE_COMPANY_ROADMAP.md` files, FIVE `SPECIALIZED_BRAIN.md`, FIVE `AGENCY_EXECUTION_PLAN.md`, FIVE `RISKS_QA_AND_GATE_MATRIX.md`, and all JSON files under `data/`. Run `scripts/validate.py` locally before source adaptation. Never shortcut the 28-pass + 78 A–BZ conformance into one generic paragraph.

STRICT RULES: James Morgan is final human authority; Command Center is always the top-level AI authority. All five company Brains operate beneath it. Agency agents only work within exact scoped and proven tool permissions and real execution capacity. All money-out actions are owner-only; auto-spend ceiling strictly $0 even after profit/revenue. NO automatic reinvestment, purchase, transfer, refunds, credit, hosting upgrade, paid API, paid trials, ad spending, payroll, merchant subscription, billable deployment or financial contract. No paid resources or external company operation. No mixing credentials, customer data, accounts, protected projects or financial identities. Preserve VeloClip personal-only; preserve CrowdSkein's campaign/clipper model; preserve RevoCapture's recovery model and Morgan’s Garage Doors approved assets. No unapproved outreach, sending, public publishing, live customer onboarding, payment configuration, account/OAuth grants, KDP publishing, domains or production changes. No changes to main/default/legacy branch. Do not expand unrelated P15 work.

IMPLEMENTATION ORDER: (1) verify exact branch HEAD and repository live schemas; (2) check collision with any existing 108+ and changed sources; (3) stage/copy five canonical source roadmaps and supporting artifacts with preserved source-to-check traceability; (4) integrate 5 company/project registry identities using the current native type and schema contracts, not direct JSON insertion; (5) ensure five independent visible, phone-fit project buttons and routes, truthful project status, progress N/A until evidential, Brain/Agent/Needs Me sections; (6) register five subordinate specialized Brain manifests in appropriate existing registries without falsely claiming providers/workers are active; (7) compile genuine task DAG/dependency gates with independent acceptance and evidence; (8) audit five 28-pass+A–BZ maps against the company-specific 106-check draft, correct gaps; (9) run existing repo full relevant tests (typecheck, unit, integration, UI/phone, security, Agency, Brain, duplicate import, no-spend, regression), fix defects; (10) verify all source identities/hashes and current HEAD, existing 107 preserved, button/route count and domain isolation. Include rollback/recovery. Do not infer production deployment or mutate production Supabase without later separate exact authorization; record a clear blocker if required.

Important: No dollar expense is authorized by this prompt. Do not force progress reports/checkpoints as permission requests, but stop any genuine payment, security, login, legal acceptance, protected production write, or missing-source boundary. Do not invent proof, sales, verified workers, or authorizations. Treat company roadmap as planning until implemented and verified. Use largest safe batches without compromising QA.

FINISH: provide exact HEAD, every changed file, IDs and companies, project buttons/routes/Brain status per company, exhaustive conformance proof by company, tests with results, remaining blockers/user-only actions, no-spend proof, and separate any requested deployment not performed.

End with **Go to normal chat**, followed by ONE complete return prompt containing the verified final state, precise repo/source locations, actions performed, files changed, branch+SHA, tests, failures/blockers, protected changes excluded, outstanding user actions, and next safe step. Never make James reconstruct or assemble anything.
'''
(ROOT/'04_FUTURE_WORK_HANDOFF.md').write_text(handoff,encoding='utf-8')

# Machine-readable manifest and fingerprint, with scope locked to no side effects.
files=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='PACKAGE_FILE_MANIFEST.json']
file_entries=[]
for p in sorted(files):file_entries.append({'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
save_json('PACKAGE_FILE_MANIFEST.json',{'artifact_scope':'LOCAL_DRAFT_ONLY','prepared_at':DATE,'source_repo_head_read_only':ROSTER_REF,'files':file_entries})
print(json.dumps({'companies':len(companies),'tasks':len(all_tasks),'capabilities':len(all_capabilities),'checks':len(all_checks),'phases':len(all_phases),'files':len(file_entries)+1},indent=2))
