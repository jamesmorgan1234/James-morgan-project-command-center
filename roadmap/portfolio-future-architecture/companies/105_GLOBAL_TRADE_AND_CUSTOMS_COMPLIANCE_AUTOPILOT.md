# Company 105 — Global Trade & Customs Compliance Autopilot

**Company ID:** `company:future:105`  
**Primary project:** `project:company:future:105`  
**Roadmap version:** `COMPANY-105-v2.0.0`  
**Truth state:** PLANNED  
**Roadmap conformance:** EXHAUSTIVE 28-PASS / A–BZ MAPPED; saturation subject to portfolio reverse-map reconciliation  
**Authorization:** roadmap/architecture only; no customs filing, export declaration, restricted-party decision, tariff payment, broker instruction, shipment release, license application, paid data subscription, outreach, deployment or public launch.  
**First-class project requirement:** independent Command Center project button, independently computed percentage, independent project pages, Brain/Agent/service state, evidence/checkpoints, Needs Me, incidents, approvals, dependencies and lifecycle.

## Business identity

Purpose: automate intelligence and administrative workflows for lawful cross-border trade while preserving legal, customs-broker, export-control, sanctions, licensing and human-review boundaries.

Core problem: international trade requires product classification, valuation, origin, trade-agreement eligibility, duties/taxes, sanctions/restricted-party screening, export controls, licenses, documentation, broker coordination and constantly changing country-specific rules. Manual processes are fragmented across spreadsheets, brokers, government portals, ERP data and supplier attestations, creating cost, delay and compliance risk.

Value proposition: a versioned evidence-centered trade operating layer that turns product, party, supplier and shipment data into traceable classification/origin/landed-cost/compliance workflows, continuously monitors regulatory changes and escalates ambiguity or protected determinations to qualified personnel.

Non-goal: not autonomous legal advice, not a customs broker of record by default, not an exporter/importer of record, and not an unattended authority to release restricted goods, evade duties, bypass sanctions or misstate origin/value.

## Complete product tree

Product Master & Trade Data Hub; HS/HTS Classification Assistant; Classification Rationale/Evidence; Binding-Ruling/Decision Reference Manager; Commodity Code Crosswalk; Export Classification/ECCN Support; Dual-Use/Product Control Analysis; Country-of-Origin Engine; Rules-of-Origin Engine; Free-Trade-Agreement Qualification; Supplier Origin Solicitation; Bill-of-Materials Origin Analysis; Regional Value Content Calculator; Tariff/Duty Engine; Trade Remedy Engine; Anti-Dumping/Countervailing Duty Support; Quota/Embargo Rule Monitor; Customs Valuation Engine; Transfer-Price/Assist/Royalty Valuation Support; Landed Cost Calculator; VAT/GST/Import Tax Estimation; De Minimis Rules; Restricted/Denied Party Screening; Sanctions Screening; Embargo/Country Restriction Screening; End-Use/End-User Risk Support; Export License Requirement Support; License/Permit Workflow; Import Permit Workflow; Documentation Generator; Commercial Invoice/Packing/Origin Document Support; Declaration Data Pack; Broker Collaboration Portal; Shipment Compliance Gate; Customs Entry Audit; Post-Entry/Correction Support; Recordkeeping Vault; Drawback/Duty Recovery Support where applicable; Foreign Trade Zone/Bonded Workflow Support; Product Compliance Cross-Reference; Trade Policy Monitor; Regulatory Change Impact Engine; Supply-Chain Route/Trade Optimization; ERP/TMS/WMS Integration; Customs Broker API; Tariff API; Classification API; Landed-Cost API; Screening API; Enterprise Multi-Country Console; Private Deployment; White-Label/OEM Infrastructure.

## Complete feature tree

SKU/product identity; description; material/composition; function/use; manufacturing process; technical specifications; HS/HTS/ECCN candidate; rationale; evidence; jurisdiction; effective date; duty rate; additional duties/remedies; origin; substantial transformation facts; BOM/source countries; FTA rule; qualification evidence; valuation method; transaction value; assists; royalties; freight/insurance; currency; Incoterm; importer/exporter; consignee; end user; parties; screening result; license/permit; country restrictions; quota; shipment route; entry/declaration data; broker status; customs response; audit finding; correction; document version; regulatory source/version; human decision; confidence; expiry; audit trail.

## Complete customer tree

Importers; exporters; manufacturers; ecommerce sellers; marketplaces; distributors; wholesalers; retailers; logistics providers; freight forwarders; customs brokers; 3PLs; supply-chain organizations; industrial companies; electronics; automotive; apparel; consumer goods; chemicals where lawful; medical-device manufacturers; food businesses; aerospace/defense-adjacent organizations where lawful and with stricter controls; software/hardware vendors; enterprise procurement; trade-compliance consultancies; ERP/TMS vendors.

## Complete vertical tree

Consumer goods; apparel/textiles; electronics; machinery; automotive; industrial components; chemicals; food/agriculture; medical devices; pharmaceuticals supply-chain administration; aerospace; energy; ecommerce parcels; marketplace imports; cross-border DTC; wholesale distribution; spare parts; luxury goods; raw materials; software/hardware bundles. Each vertical requires product ontology and regulatory/jurisdiction packs.

## Specialized Brain capability tree

The Global Trade Brain must KNOW HS/HTS structures, explanatory/reference materials where licensed/public, customs valuation concepts, origin/rules of origin, trade agreements, export controls, sanctions/restricted-party concepts, licenses, quotas, embargoes, import/export documentation and country-specific regulatory structures. It must UNDERSTAND product facts, supply chain, transaction context and rule effective dates; CLASSIFY products/parties/controls; REASON about classification/origin/valuation/FTA requirements; PLAN evidence collection and filing support; PREDICT duty/lead-time/risk as assistive analytics; OPTIMIZE lawful sourcing/routing/landed cost; RECOMMEND candidates with evidence; VERIFY rule/source/version; EXPLAIN rationale and uncertainty; ESCALATE ambiguous or high-impact determinations.

The Brain must distinguish candidate classification from approved classification, source law/regulation from guidance, deterministic screen match from identity uncertainty, and commercial optimization from legal eligibility.

## Brain architecture

Brain Factory base + global-trade domain pack + jurisdiction/country packs + product/commodity ontology + tariff/control-rule graph + trade-agreement/rules-of-origin graph + party/sanctions evidence layer + deterministic calculators/rule engine + regulatory source/effective-date registry + human trade-compliance approval layer.

Memory: company/tenant isolated product classification/origin history; versioned decision rationale; supplier evidence; no cross-customer confidential BOM/sourcing reuse by default.

Evaluations: HS/ECCN candidate accuracy; classification explanation/source faithfulness; origin/rules-of-origin reasoning; duty calculation; valuation completeness; screening match accuracy; regulatory freshness; unsupported legal claim rate; stale-rate detection; cross-tenant leakage; document/prompt injection; escalation correctness; landed-cost reconciliation.

## Complete Agent tree

Product Data Agent; Classification Agent; Export Classification Agent; Origin Agent; FTA Agent; Supplier Evidence Agent; Valuation Agent; Duty/Tariff Agent; Trade Remedy Agent; Landed Cost Agent; Restricted Party Agent; Sanctions Agent; Export Control Agent; License/Permit Agent; Documentation Agent; Broker Coordination Agent; Shipment Compliance Agent; Entry Audit Agent; Regulatory Change Agent; Recordkeeping Agent; Duty Recovery Agent; ERP Integration Agent; Security/Privacy Agent; Independent QA Agent.

No agent independently misdeclares goods, approves sanctions/export-control exceptions, signs customs declarations, instructs shipment release or commits funds without the appropriate authorization and qualified review.

## Deterministic / non-agent services

Tariff table lookup; rate/effective-date engine; currency conversion; duty/tax calculation; regional value content math; BOM aggregation; origin rule evaluation where codified; restricted-party exact/fuzzy matching; country embargo matrix; Incoterm cost allocation; valuation calculators; unit conversions; document schema validation; required-field checks; identifier normalization; country/code crosswalks; audit logging; record retention; idempotent workflow; deadline calendars; webhook/EDI transforms; data reconciliation.

## Input tree

Product descriptions; specifications; images/documents; material composition; BOM; part numbers; supplier data; manufacturing steps; origin attestations; purchase/sales transactions; prices; assists/royalties; Incoterms; freight/insurance; party identities; addresses; destination/origin countries; end-use/end-user data; sanctions/restricted lists; licenses; trade agreements; tariff/control tables; customs rulings/guidance; broker responses; shipment/entry records; regulatory updates.

## Output tree

Classification candidates and approved record; ECCN/control candidate; origin determination support; FTA qualification/evidence pack; tariff/duty estimate; landed cost; valuation checklist/calculation; screening findings; license/permit requirement support; shipment compliance checklist; document/declaration data pack; broker instruction draft; audit exception; regulatory change alert; product impact list; recordkeeping bundle; management analytics; API responses.

## Workflow tree

Authorize company/jurisdiction → create product/trade master → collect product/BOM/supplier evidence → classify product → verify export controls → determine origin/FTA → establish valuation inputs → screen parties/countries/end use → determine permits/licenses → calculate duties/taxes/landed cost → assemble documents/declaration data → qualified review where required → broker/authorized filing handoff → monitor customs response/shipment → reconcile actual vs estimated duties/entry → handle correction/audit → retain evidence → monitor rule changes and re-evaluate affected products.

## Integration tree

ERP; PLM; PIM; procurement; supplier portals; TMS; WMS; ecommerce/marketplaces; order management; freight forwarders; customs brokers; EDI; government trade/customs portals/APIs where permitted; sanctions/restricted-party data sources; tariff databases; trade agreement sources; document management; finance/accounting; payment/tax systems; SSO; data warehouse/BI; SIEM; secure messaging.

## API / developer ecosystem

Classification API; tariff/rate API; origin/FTA API; valuation API; landed-cost API; party-screening API; export-control API; license workflow API; document/declaration-data API; regulatory-change API; audit/provenance API; connector SDK; sandbox product/shipment fixtures; webhook/event API; versioned jurisdiction packs.

## Data architecture

Tenant-isolated product/trade master; classification decision history; tariff/control rule graph; origin/BOM graph; supplier evidence store; party screening records; licenses/permits; shipment/entry events; document refs; regulatory source registry; effective-date/version metadata; immutable audit/evidence ledger; region/residency controls; secrets isolated from business data; backup/recovery.

## Data moat

Potential moat: normalized tariff/control/origin rule graph, product ontology, verified classification decision patterns, supplier evidence workflows, broker/customs interoperability, regulatory change mapping and de-identified authorized exception/accuracy benchmarks. Never pool confidential customer BOM/sourcing/party data without permission.

## IP

Trade rule/effective-date graph; product-to-classification evidence model; origin/BOM qualification engine; trade-change impact graph; valuation completeness engine; landed-cost reconciliation; jurisdiction pack framework; classification evaluation corpus; broker/document interoperability layer.

## Monetization

Per SKU/product classification; per shipment/entry; per screen; per landed-cost calculation; subscription; seats; enterprise/multi-country license; API usage; supplier module; audit/compliance module; private deployment; white-label/OEM; managed trade data operations where contractually appropriate. No revenue promise.

## Packaging

Tariff/classification starter; origin/FTA; screening/export control; landed cost/valuation; shipment/document compliance; trade audit; regulatory monitor; full global trade OS; enterprise multi-country; API/OEM/private deployment.

## Distribution

ERP/TMS/PLM partnerships; customs/logistics ecosystem; enterprise trade/compliance procurement; ecommerce platforms; brokers/forwarder technology partners; developer/API channels. No outreach authorized now.

## Acquisition automation

Future inbound qualification may map countries, product volume, categories, shipment volume, ERP/TMS and compliance scope to a technical fit. It may not provide binding legal classifications, commercial outreach, sign terms or initiate filings.

## Customer lifecycle

Trade-data assessment → jurisdiction/vertical mapping → integrations → product-master cleanup → sandbox classification/rule calibration → qualified review baseline → controlled rollout → shipment/document integration → audit/reconciliation → expansion to countries/modules → renewal/export/offboarding.

## Support / customer success

Classification disputes; rule/source questions; supplier-origin gaps; screening false positives; broker integration; customs response; duty variance; regulatory change; outage/incident; audit evidence. Success measures cycle time, data completeness, reconciliation, manual effort and exception reduction—not guaranteed customs clearance.

## Automation maximum / human-intervention minimum

Automate data ingestion, deterministic rate math, rule monitoring, evidence collection, screening triage, documentation assembly, supplier requests, impact analysis and routine reconciliation. Retain qualified humans for ambiguous classification/origin/valuation, sanctions/export-control decisions, legal interpretation, declarations/attestations, licenses and high-impact disputes.

## Operations / administration

Jurisdiction/source updates; product/rule data quality; supplier evidence; broker/provider credentials; integration health; screening lists; license calendars; records retention; audit support; billing; support; incident response; backup/recovery; vendor/source licensing; model/rule versioning.

## Security

Protect supplier, BOM, pricing, party and shipment data; tenant isolation; encryption; least privilege; SSO/MFA; secrets vault; secure broker/government connections; signed rule/source updates; DLP; egress controls; document scanning; model/tool permission limits; audit; key rotation; incident response; supply-chain security.

## Privacy

Minimize personal party/contact data; purpose limitation; retention; sanctions screening evidence controls; cross-border data transfer/residency; access logging; deletion/export where lawful; no unauthorized reuse of supplier/customer data.

## Compliance

Adapt to customs, import/export, sanctions, export controls, trade remedies, product-specific restrictions, recordkeeping and jurisdiction requirements. Actual legal obligations vary by country/product/party and require qualified review. Roadmap work does not establish broker status or regulatory certification.

## Legal

Customs broker/importer/exporter-of-record responsibilities; tariff/classification law; export-control/sanctions law; trade agreements; licenses; product regulation; data-source licenses; broker terms; recordkeeping; confidentiality/IP; liability; audit; government portal terms. Legal determinations remain governed.

## Abuse / misuse

Prevent deliberate misclassification, undervaluation, origin laundering, sanctions evasion, export-control circumvention, false supplier attestations, document fabrication, shipment splitting intended to evade rules, restricted-party probing, credential misuse and rule-source tampering.

## Reliability

Versioned tariff/control sources; effective-date correctness; idempotent calculations/workflows; deterministic math; source freshness alarms; provider/broker outage handling; retries/dead letters; reconciliation actual vs predicted; manual fallback; no auto-clearance on missing rule data; backup/restore; DR.

## Observability

Product classifications; unresolved classifications; rule freshness; screening results; supplier evidence age; FTA qualification; duty estimates vs actual; landed-cost variance; document completeness; broker/API health; shipment exceptions; license deadlines; model confidence; human overrides; cost per transaction; security incidents.

## Incident response

Critical incidents: stale/misapplied tariff/control rule at scale, false sanctions clear, cross-tenant product/BOM leak, wrong mass classification, valuation error, compromised broker/government credential, duplicate/incorrect declaration support. Stop affected automation, preserve evidence, identify impacted products/shipments, notify authorized owners, recalculate/rescreen, rollback rule/model version and remediate.

## Testing

Known classification/ruling corpus; tariff effective-date tests; origin/FTA scenarios; BOM/RVC calculations; valuation cases; sanctions/restricted-party matching; country/control rules; document schemas; broker/API contract tests; idempotency; source outage/staleness; permission/isolation; prompt/document injection; DR; load/performance; reconciliation against known entries.

## Brain evaluations

Classification candidate precision/recall; rationale/source citation; origin reasoning; FTA rule interpretation; valuation completeness; export-control support; screening identity match; regulatory freshness; unsupported legal conclusion rate; escalation; leakage; tool-use authorization; landed-cost accuracy.

## Deployment

Isolated dev/test/staging/production; jurisdiction/data-source version pinning; signed releases; feature flags; canary by country/customer/product family; schema migration gates; rollback; private enterprise options; region controls. No production deployment authorized now.

## Scale

Single importer/product catalog → multi-country enterprise → global supply chain → broker/marketplace embedded infrastructure. Scale product graph, rule engine, screens, supplier workflow, shipment events and document generation independently.

## Performance

Interactive classification/screen/landed-cost seconds when data ready; large catalogs and regulatory re-evaluation asynchronous; shipment gates predictable. Cache tariff/control data only with effective-date/freshness correctness.

## Cost

Licensed tariff/screening/regulatory data; model inference; document extraction; integrations; storage/audit; screening volume; support/compliance. Track cost per SKU/screen/shipment/entry and repeated paid dependencies for internalization analysis; no spend authorized now.

## Financial metrics

ARR/MRR if later real; revenue per SKU/shipment/screen/API; source/vendor cost; gross margin; classification/support labor; implementation cost; duty variance/recovery where legitimately measured; retention/expansion. No test revenue.

## Moat

Trade rule/effective-date graph; classification evidence corpus; product ontology; origin/BOM engine; supplier evidence network; broker interoperability; regulatory change impact; reconciliation accuracy.

## Network effects

More public rule mappings, connector coverage and non-private product-taxonomy evidence can improve service. Customer-specific classifications/BOMs stay isolated unless explicitly authorized for reuse.

## Platform

Can become a global trade operating layer coordinating product data, rules, parties, suppliers, shipments, brokers, documentation, audits and optimization.

## White label / OEM

ERP/TMS/ecommerce/logistics/customs technology providers may embed tariff, classification, landed-cost, screening and compliance modules. Responsibility and approved classification ownership remain explicit.

## Internationalization

Internationalization is foundational: country-specific tariff schedules, customs valuation nuances, origin rules, FTAs, taxes, export controls, sanctions, language, currencies, units, documentation and portals require versioned jurisdiction packs.

## Accessibility

Accessible classification/review/admin interfaces; keyboard/screen-reader use; clear source/rationale; non-color-only risk alerts; accessible documents and tables; understandable errors.

## Mobile

Mobile for shipment alerts, approvals, supplier evidence capture and status. Complex classification/audit work remains desktop-friendly; strong device/session controls required.

## Voice

Potential secure status/search/warehouse or broker-note capture. Never accept voice alone for protected declarations or high-impact legal determinations without governed authentication/approval.

## Multimodal

Product images, spec sheets, labels, certificates, invoices and shipment documents can enrich classification/evidence. Extracted attributes need source/confidence and human verification where material.

## Marketplace

Future certified jurisdiction packs, broker/logistics connectors, supplier evidence modules and product ontologies. Third-party modules require signing, sandboxing, data scopes and evaluation.

## Developer ecosystem

APIs/SDKs; sandbox SKUs/shipments; jurisdiction pack interface; connector SDK; rule-test harness; webhooks; versioned schemas; deprecation; certification.

## Partners

ERP/TMS/PLM vendors; customs brokers; freight/logistics platforms; tariff/screening data providers; trade consultants; ecommerce/marketplace platforms. Planning only, no outreach.

## Training / certification

Trade-data administrator; classification reviewer; origin/FTA analyst; broker integration; compliance/security; jurisdiction pack; API developer training. Any professional certification claims require actual program later.

## Community

Future non-confidential trade-data/product-classification community could contribute public references and integration knowledge under moderation. No customer proprietary trade data sharing by default.

## Content / knowledge

Jurisdiction guides; source/effective-date notes; classification methodology; origin/FTA playbooks; valuation checklists; export-control workflows; broker integration docs; audit/reconciliation runbooks; release/change notes.

## Experimentation

Historical/synthetic trade data first; shadow classifications; compare rule/model versions; human-reviewed experiments; never silently change approved classifications, sanctions thresholds or live filing data.

## Continuous improvement

Learn from customs/broker responses, reviewer overrides, duty variance, supplier evidence failures and regulation changes. Update evaluation sets and compatibility profiles; governed promotion only.

## Spinoffs

Tariff API; classification engine; landed-cost API; origin/FTA engine; trade-policy monitor; supplier-origin network; broker integration layer could become products or eventual companies only if new-company test passes.

## Cross-sell

Adjacent companies: KYC/KYB screening, logistics optimization, supplier risk, pricing intelligence, ecommerce, tax compliance, document automation, data lineage. Keep company projects distinct.

## Bundling

Classification + tariff; origin/FTA; export controls/screening; landed cost/valuation; shipment/document compliance; full trade OS; enterprise/private/OEM.

## Failures

Bad product data; wrong HS/ECCN; stale tariff; origin evidence missing; FTA misqualification; valuation omission; sanctions false negative/positive; license missed; quota/embargo change; wrong Incoterm allocation; currency error; broker API outage; government portal outage; duplicate data; document mismatch; rule conflict.

## Edge cases

Multi-function products; kits/sets; software+hardware; returned goods; repairs; temporary imports; samples; free-of-charge goods; assists/royalties; related-party valuation; transformation across many countries; mixed-origin BOM; tariff engineering; dual-use items; transshipment; special economic zones; drawback; bonded goods; country changes mid-shipment; retroactive rule changes.

## Kill / safe mode

Per country/source/rule/model/agent/shipment kill switch; freeze automated clearance recommendation; force human review; disable compromised screening source; stop document/declaration output; revert tariff/control dataset; revoke broker credential; read-only audit mode.

## Exit / portability

Export product/trade master, classification/origin rationale, source versions, supplier evidence, screening records, licenses, shipment/entry history, documents and audit trail in documented formats; revoke integrations; retain/delete per law/contract.

## Scale vision

Classification/landed-cost tool → importer/exporter trade OS → global enterprise trade platform → embedded customs/trade infrastructure for marketplaces/logistics/ERP ecosystems.

## Autonomous mature state

Routine data ingestion, rate math, source monitoring, supplier evidence collection, screening, document assembly and reconciliation run automatically. Qualified humans retain ambiguous classification/origin/valuation, export-control/sanctions, licensing, declarations and dispute authority. Every recommendation is versioned, sourced and auditable.

## Command Center dependencies

First-class project/button/progress/pages; Brain/Agent factories; Capability/Integration registries; identity/tenant; data governance; security/privacy/authorization; rule/effective-date engine; graph; document/multimodal intelligence; browser/API workers; secrets; testing/evaluation; observability/incident/recovery; resource/financial governors; approval/Needs Me; audit/provenance/versioning.

## Retrofit risk

If Command Center lacks source/effective-date versioning, deterministic rule/calculation services, jurisdiction packs, evidence/provenance, protected-action gates and large catalog re-evaluation, trade compliance would force costly retrofits later.

## Phased roadmap

Phase 0 architecture/public/synthetic corpus → Phase 1 tariff/classification + product master → Phase 2 origin/FTA + supplier evidence → Phase 3 valuation/landed cost → Phase 4 screening/export controls/license workflows → Phase 5 documents/broker/shipment/audit → Phase 6 enterprise multi-country → Phase 7 API/OEM/private → Phase 8 governed optimization/internalization.

## Reuse candidates

Identity/tenant; rule/effective-date engine; graph; document extraction; screening matcher; workflow/queues; source monitoring; audit/provenance; browser/API integration; data quality; currency/unit services; observability; incident/recovery; evaluation; versioning.

## Proven capability dependencies

Generic reusable components require trade-specific compatibility and regulatory evaluation. Critical screening/rule/calculation/document services need proof maturity, version pinning, staged rollout and rollback before broad sharing.

## Company-specific capabilities

HS/HTS/ECCN taxonomy; trade rule graph; origin/FTA/BOM engine; customs valuation; trade remedies/quotas; broker/declaration data model; jurisdiction packs; trade evaluation corpus.

## External dependencies to internalize

Generic candidates: document extraction, rules, source monitoring, screening matching, workflow, browser/API orchestration, data quality and landed-cost math. Official tariff/customs/sanctions/regulatory sources and licensed databases may remain external with portability and provenance.

## Blast-radius requirements

Critical/high: mass wrong classification/rate, sanctions/export-control false clearance, wrong valuation, compromised government/broker credential, shared stale rule source. Enforce tenant/country scoping, source pinning, canaries, reconciliation and kill/rollback.

## Version / compatibility requirements

Version tariff schedules, controls, sanctions lists, agreements, origin rules, valuation rules, Brain, agent, classification record, source, API, connector and document schema. Preserve effective dates and reproducibility of prior decisions.

# Exhaustive 28-pass findings

1. Core Business — coherent global trade/customs operating layer with professional/legal boundaries.
2. Product Expansion — classification, origin, valuation, screening, licenses, documents, audit, APIs and enterprise mapped.
3. Customer Expansion — importers/exporters/manufacturers/ecommerce/logistics/brokers/software mapped.
4. Industry / Vertical Expansion — product/industry packs and jurisdiction packs mapped.
5. Specialized Brain — full trade-domain Brain justified.
6. Agent Decomposition — classification/origin/valuation/screening/license/broker/audit agents mapped.
7. Deterministic Services — tariff math, RVC, rules, screening, currencies, schemas mapped.
8. Data Products — tariff/regulatory intelligence and non-private benchmarks possible.
9. API / Developer Products — tariff/classification/origin/landed-cost/screening APIs mapped.
10. White Label / OEM / Embedded — strong ERP/TMS/ecommerce/logistics fit.
11. Enterprise — multi-country, large catalog, SSO, private deployment, governance mapped.
12. Marketplace / Platform — certified country packs/connectors/product ontologies possible later.
13. Monetization — SKU/shipment/screen/subscription/API/enterprise mapped.
14. Distribution — ERP/logistics/broker/ecommerce/procurement channels mapped.
15. Automation — routine data/rules/docs/monitoring/reconciliation highly automatable.
16. Human-Intervention Elimination — reduce repetitive admin, retain ambiguous/protected determinations.
17. Moats — rule graph, classification evidence, origin/BOM, supplier interoperability, reconciliation mapped.
18. Security — sensitive supplier/pricing/party/credential controls mapped.
19. Privacy — party/contact/supplier-data minimization and cross-border data controls mapped.
20. Compliance — customs/export/sanctions/records framework adaptability mapped.
21. Failure / Edge Cases — special procedures, valuation, kits, returns, dual-use, retroactivity mapped.
22. Internationalization — foundational country-specific design mapped.
23. Scale — catalog/country/shipment/source partitioning mapped.
24. Future Technology — better digital customs APIs, product passports and machine-readable rules can deepen automation.
25. Cross-Company Synergy — screening, rule engine, docs, source monitoring, graph reusable.
26. Spinoffs — tariff/classification/origin/landed-cost/trade monitor candidates mapped.
27. Adversarial Missing-Idea Pass — added trade remedies, bonded/FTZ/drawback, related-party valuation, end-use, retroactive rules, customs audit/corrections.
28. Saturation Pass — remaining branches fit jurisdiction/product/procedure packs or adjacent companies; Company 105 remains coherent.

# A–BZ conformance map

A Business Identity — lawful global trade/customs automation with qualified decision gates.  
B Complete Product Tree — classification→origin→valuation→screening→documents→audit/API mapped.  
C Complete Feature Tree — product/rule/rate/origin/value/party/license/shipment/audit mapped.  
D Complete Customer Tree — import/export/manufacturing/ecommerce/logistics/broker/software mapped.  
E Complete Vertical Tree — consumer/industrial/electronics/apparel/food/medical/aero/etc mapped.  
F Complete Brain Capability Tree — trade classification/origin/valuation/control reasoning mapped.  
G Brain Architecture — domain/jurisdiction packs + rule graphs + deterministic calculators.  
H Complete Agent Tree — product/classification/origin/FTA/valuation/screening/license/docs/audit mapped.  
I Deterministic Services — tariffs/RVC/currency/screen/rules/schemas/reconciliation mapped.  
J Input Tree — product/BOM/supplier/transaction/party/rules/shipment mapped.  
K Output Tree — classifications/origin/FTA/duty/screen/docs/audit/alerts mapped.  
L Workflow Tree — product evidence→rules→shipment→broker→reconcile→monitor mapped.  
M Integration Tree — ERP/PLM/PIM/TMS/WMS/brokers/government/data sources mapped.  
N API / Developer Ecosystem — classification/tariff/origin/landed-cost/screen APIs mapped.  
O Data Architecture — tenant trade master/rule graphs/evidence/events/audit mapped.  
P Data Moat — normalized public/licensed rules + verified decision workflows, not proprietary pooling.  
Q IP — rule graph/classification evidence/origin engine/change impact mapped.  
R Monetization — SKU/shipment/screen/API/subscription/enterprise mapped.  
S Packaging — modular/full OS/enterprise/API/OEM/private mapped.  
T Distribution — trade/logistics/ERP/ecommerce ecosystems mapped.  
U Acquisition Automation — inbound technical fit only.  
V Customer Lifecycle — assessment→calibration→rollout→audit→expansion mapped.  
W Support — classification/source/broker/duty/audit/incident support mapped.  
X Customer Success — quality/cycle/reconciliation/manual effort metrics mapped.  
Y Automation Maximum — routine data/rules/docs/screening/reconciliation automated.  
Z Human-Intervention Minimum — qualified humans retain ambiguous/legal/protected determinations.  
AA Operations — sources/product data/supplier/broker/integration/support/DR mapped.  
AB Administration — billing/vendor/licenses/retention/audit/offboarding mapped.  
AC Security — BOM/pricing/party/credential isolation and secure integrations mapped.  
AD Privacy — party/contact/supplier data minimization/retention/cross-border mapped.  
AE Compliance — customs/export/sanctions/trade-remedy/records adaptability mapped.  
AF Legal — broker/importer/exporter roles, tariffs, controls, licenses, source terms mapped.  
AG Abuse / Misuse — misclassification/undervaluation/origin laundering/evasion controls mapped.  
AH Reliability — source freshness/effective dates/idempotency/reconciliation/fallback mapped.  
AI Observability — classification/rules/screening/shipment/variance/security/cost metrics mapped.  
AJ Incident Response — stale/wrong rules, false clear, leaks, credential/filing support incidents mapped.  
AK Testing — corpus/rules/origin/valuation/screens/docs/integrations/DR/load mapped.  
AL Brain Evaluations — classification/source/origin/FTA/valuation/control/escalation mapped.  
AM Deployment — isolated/version-pinned/canary/private/rollback mapped.  
AN Scale — importer→enterprise→embedded global infrastructure mapped.  
AO Performance — interactive screening/calculation + async catalog reevaluation mapped.  
AP Cost — licensed sources/models/docs/integrations/storage/support mapped.  
AQ Financial Metrics — unit economics per SKU/screen/shipment/API mapped.  
AR Moat — trade graph/classification evidence/origin/supplier/reconciliation mapped.  
AS Network Effects — non-private rule/connector/taxonomy coverage effects mapped.  
AT Platform — global trade operating layer mapped.  
AU White Label / OEM — ERP/TMS/ecommerce/logistics embedding mapped.  
AV Internationalization — tariff/control/tax/language/currency/unit/country packs mapped.  
AW Accessibility — accessible trade review/admin/docs mapped.  
AX Mobile — alerts/approvals/evidence capture mapped.  
AY Voice — secure status/note capture only, not protected declarations.  
AZ Multimodal — product images/specs/certificates/invoices with provenance mapped.  
BA Marketplace — certified country packs/connectors/ontologies mapped.  
BB Developer Ecosystem — APIs/SDK/sandbox/rule harness/certification mapped.  
BC Partners — ERP/logistics/broker/data providers mapped, no outreach authorized.  
BD Training / Certification — admin/classification/origin/integration/security mapped.  
BE Community — moderated non-confidential trade knowledge potential mapped.  
BF Content / Knowledge — jurisdiction/rule/classification/origin/valuation docs mapped.  
BG Experimentation — historical/synthetic/shadow, no silent approved-rule mutation mapped.  
BH Continuous Improvement — governed broker/reviewer/variance/regulatory learning mapped.  
BI Spinoffs — tariff/classification/origin/landed-cost/monitor candidates mapped.  
BJ Cross-Sell — KYC/logistics/supplier/pricing/tax/docs adjacent mapped.  
BK Bundling — classification/tariff/origin/screen/full OS bundles mapped.  
BL Failures — data/rule/origin/value/screen/license/broker/document failures mapped.  
BM Edge Cases — kits/returns/repairs/assists/related parties/dual-use/bonded/retroactive mapped.  
BN Kill / Safe Mode — country/source/rule/model/shipment freeze and manual review mapped.  
BO Exit / Portability — trade master/rationale/evidence/history/audit export mapped.  
BP Scale Vision — point tool→enterprise→embedded trade infrastructure mapped.  
BQ Autonomous Mature State — routine trade admin autonomous, protected determinations human-governed.  
BR Command Center Dependencies — registry/Brain/Agent/rules/docs/screening/integration/eval/audit mapped.  
BS Retrofit Risk — effective-date/source/provenance/jurisdiction architecture must be early.  
BT Phased Roadmap — classification→origin→value→controls→shipment→enterprise mapped.  
BU Reuse Candidates — rules/graph/docs/screening/workflow/source monitoring/currency/etc mapped.  
BV Proven Capability Dependencies — trade-specific compatibility/proof required.  
BW Company-Specific Capabilities — tariff/origin/valuation/control/broker/jurisdiction semantics mapped.  
BX External Dependencies to Internalize — generic engines vs official/licensed source dependencies mapped.  
BY Blast-Radius Requirements — mass rule/classification/sanctions/credential errors high/critical mapped.  
BZ Version / Compatibility Requirements — every source/rule/rate/agreement/model/agent/schema/connector versioned by effective date.

## Final saturation statement

Company 105 is mapped as an independent first-class Command Center project under the canonical 107+ standard. Planning completeness does not authorize customs/trade operations or protected legal/regulatory determinations. Cross-company reverse mapping, rule changes or James Morgan decisions may reopen conformance without erasing this version.