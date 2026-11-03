# Dependency-Ordered Future Implementation Backlog — Planning Only

No item below is authorized for execution. Order means prerequisites and proposed small implementation units, not tasks that have been started.

## F. Foundation (F001–F020)
F001 project-local design repository (only after authorization); F002 environment templates; F003 configuration schema; F004 ID/time/currency types; F005 exact decimal money library; F006 record metadata/versioning; F007 data models; F008 migrations/rollback tests; F009 transactional persistence; F010 optimistic concurrency; F011 append-only event envelope; F012 correlation/causation; F013 audit append/verify; F014 idempotency journal; F015 operation-state store; F016 durable local queue; F017 workflow state and retries; F018 circuit breakers; F019 health/metrics; F020 synthetic fixture loader.

## C. Canonical data (C001–C028)
C001 Product; C002 Variant; C003 Identifier; C004 Brand; C005 Manufacturer; C006 Supplier; C007 SupplierWarehouse; C008 SupplierOffer; C009 Marketplace; C010 MarketplaceCatalogItem; C011 Listing; C012 ListingVersion; C013 InventoryLocation; C014 InventoryBalance; C015 InventoryReservation; C016 CustomerReference; C017 Order; C018 OrderLine; C019 FulfillmentPlan; C020 Shipment; C021 Package; C022 TrackingEvent; C023 Return/ReturnLine; C024 Refund; C025 FinancialEvent; C026 Settlement; C027 Evidence/PolicyRule; C028 Decision/Risk/Incident/Certification.

## D. Integrity/identity (D001–D016)
D001 attribute validation; D002 enum drift; D003 source timestamp/freshness; D004 evidence provenance; D005 per-field conflict; D006 dedup; D007 normalized identifier checking; D008 GTIN/UPC/EAN/ISBN; D009 MPN/model/brand; D010 quantity/package; D011 variants/condition; D012 bundles; D013 image similarity optional; D014 calibrated confidence; D015 false-match quarantine; D016 critical identity certification.

## E. Economics and policy (E001–E018)
E001 marketplace fee model; E002 supplier cost; E003 shipping/outbound; E004 shipping revenue; E005 promotions; E006 tax/duties data; E007 return/damage/fraud reserve; E008 storage; E009 currency conversion; E010 precision/rounding; E011 break-even floor; E012 margin/ROI; E013 unknown-cost blocking; E014 cost snapshot; E015 compliance/product eligibility rules; E016 policy evidence/freshness; E017 recall block; E018 economics/policy certification.

## K. Connectors (K001–K018)
K001 supplier capability contract; K002 synthetic supplier; K003 pagination/cursors; K004 stock/cost normalization; K005 supplier order idempotency; K006 supplier tracking; K007 supplier returns; K008 supplier certification; K009 marketplace capabilities; K010 synthetic marketplace; K011 catalog match; K012 listing/price/quantity; K013 orders/returns; K014 webhooks/signature/replay; K015 rate limits/backoff; K016 polling reconciliation; K017 deprecation/version registry; K018 marketplace certification.

## I. Inventory/pricing (I001–I019)
I001 ATP calculation; I002 transactional reservation; I003 expiration race; I004 multi-location; I005 supplier stock reliability buffer; I006 multi-channel allocation; I007 reconciliation; I008 emergency zero-out; I009 inventory certification; I010 price floor; I011 target pricing; I012 competitor observations; I013 price anomaly; I014 currency/decimal protection; I015 MAP/policy; I016 repricing loop protection; I017 bulk-change breaker; I018 price reconciliation; I019 pricing certification.

## O. Orders/fulfillment/returns (O001–O023)
O001 order ingestion; O002 business-key dedup; O003 order state transitions; O004 reservation integration; O005 partial cancellation; O006 order amendments; O007 external supplier purchase journal; O008 unknown outcome reconciliation; O009 split fulfillment; O010 carrier/tracking; O011 shipment exceptions; O012 supplier fallback with fresh economics; O013 fulfillment certification; O014 return eligibility; O015 return receipt; O016 disposition; O017 refund balance; O018 refund idempotency; O019 auto-refund reconciliation; O020 reimbursements; O021 returns/refund certification; O022 customer case model; O023 account health indicators.

## L. Finance/reliability/security (L001–L020)
L001 immutable financial event; L002 balanced internal ledger representation; L003 settlements; L004 fee/reimbursement matching; L005 disputed fees; L006 realized/reconciled profit; L007 finance certification; L008 scoped access; L009 secrets abstraction; L010 signature/webhook security; L011 input isolation; L012 PII minimization; L013 security tests; L014 degraded modes; L015 crash/replay; L016 backup/restore; L017 incident state; L018 observability; L019 resilience certification; L020 documentation/runbooks.

## A. Intelligence/evaluation/simulation (A001–A022)
A001 demand observation; A002 forecast confidence; A003 competitor changes; A004 opportunity score; A005 separate risk score; A006 eligibility-first decision gate; A007 proposal evidence; A008 supplier reliability features; A009 marketplace suitability; A010 AI facts grounding; A011 local specialist routing only; A012 eval metrics; A013 evaluator integrity; A014 synthetic scenario runner; A015 310 base failures; A016 property-based scenario expansion; A017 digital twin state; A018 shadow-mode design; A019 AI red-team; A020 capability test runner; A021 certification reports; A022 approved autonomous capability ladder (not activated).

## U. Future operations only with separate authorization (U001–U012)
U001 seller eligibility; U002 supplier identity/onboarding; U003 marketplace/supplier read-only access; U004 real shadow pipeline; U005 certification on live data; U006 actual canary; U007 verified settlement; U008 one marketplace expansion; U009 one supplier expansion; U010 one capability autonomy expansion; U011 capital/cash feasibility; U012 continuous reviewed operations.

## CC. All held (no implementation)
CC001 shared Brain contract; CC002 Agent registration; CC003 global routing; CC004 shared memory; CC005 shared learning/promotion; CC006 global permission/delegation; CC007 protected action authority; CC008 ecosystem company identity/isolation; CC009 shared provider/capability registries; CC010 shared provenance/evaluation; CC011 ecosystem recovery; CC012 PIF.1–PIF.10 reconciliation; CC013 Command Center integration.

## Ordering constraints
F before C/D/E/K; C+D before opportunity/listings; E+policy before pricing/listing activation; I before order fulfillment; O before live refunds/settlements; L required for all risky operations; A may run synthetic-only before live connectors. All external writes and CC steps remain blocked by the standing scope.
