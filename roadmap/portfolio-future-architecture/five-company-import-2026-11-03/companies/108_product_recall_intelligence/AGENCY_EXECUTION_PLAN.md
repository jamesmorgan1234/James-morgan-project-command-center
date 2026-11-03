# Company 108 Agency execution and dependency plan

**Project:** `project:company:future:108`

**State:** PREPARED / NO TASKS REGISTERED / NO EXECUTOR ACTIVATED

## Scheduler model

P0→P7 are ordered acceptance stages. Within a stage, design/domain/Brain/security may be split among different agents after the scope contract; independent QA integrates only after those tasks. A single agent handles dependent work when required. Every task has idempotent claim/lease/retry and durable evidence.

Resource governor caps concurrent tasks by actual workers, hardware and $0 limits. Never imply agents are unlimited or connected. Store unknown instead of guessing capacity.

## Stage gates

### P0 — Authority and demand validation

Scope: Confirm distinct company scope; validate three retailer pain scenarios using publicly available recalls and synthetic catalogs.

Acceptance: Source/license review, no-cost prototype, documented customer assumptions, no customer outreach without authorization.

Work packets: `project:company:future:108:p0:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P1 — Identity, source and safety foundation

Scope: Company/project/Brain boundaries, official-source adapters, normalized recall schema, staleness/versioning, tenant isolation.

Acceptance: Source fixtures, schema drift tests, explicit unknown; no sensitive data or outbound alerts.

Work packets: `project:company:future:108:p1:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P2 — Catalog matching core

Scope: SKU import, exact GTIN/model matching, lot/date predicates, confidence and explanation, manual review queue.

Acceptance: Labeled evaluation set; high-consequence false negatives measured; ambiguous cases abstain.

Work packets: `project:company:future:108:p2:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P3 — Evidence alerts and operations

Scope: Source-linked alert workflow, correction/retraction tracking, audit exports, notifications with consent and dedupe.

Acceptance: Safe dry-run, zero duplicate sends, notification approval tests and outage handling.

Work packets: `project:company:future:108:p3:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P4 — First paid customer validation

Scope: Customer authorization, trial-to-paid evidence, merchant workflow fit, retention and support cost measurement.

Acceptance: Real customer opt-in and verified payment; no synthetic revenue.

Work packets: `project:company:future:108:p4:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P5 — Coverage and vertical depth

Scope: CPSC/FDA category packs, manufacturer notices, multilingual notices and multi-location rules.

Acceptance: Per-source completeness and legal review, calibrated match performance.

Work packets: `project:company:future:108:p5:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P6 — Integrations, API, OEM

Scope: Catalog/ERP/PIM connectors, signed customer webhooks, reusable scopes, white label.

Acceptance: Connector permissions, sandbox tests, backpressure and version contract.

Work packets: `project:company:future:108:p6:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P7 — Scaling, recovery, improvement

Scope: Multi-customer operating evidence, data lifecycle, drift monitoring, horizontal capacity and approved future innovation.

Acceptance: SLO and restoration drills; cost proposal only; no automatic paid scale.

Work packets: `project:company:future:108:p7:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

## Customer-protected or financial actions

- James Morgan is final human authority. Command Center is the permanent top-level AI/control authority; company Brains are subordinate; Agency/agents have narrower delegated scopes.
- No external outgoing financial transaction of any kind is autonomously authorized, including purchase, paid upgrade, payout, refund, transfer, settlement, tax payment, advertising, subscription, reinvestment, or chargeable trial; automatic spending limit is $0.
- An owner authorization for a specific outgoing financial intent must identify amount/ceiling, recipient/provider, purpose, source company/account, timing/expiration and revocation. General approval of a roadmap or build is not financial authorization.
- Automation of business logic does not create authorization to send unsolicited communications, accept contracts, publish content, create regulated decisions, access third-party accounts, or modify protected infrastructure.
- All company/customer/account/credential/data/IP/revenue boundaries are isolated by default, including from VeloClip, CrowdSkein, RevoCapture, Morgancommerce, KDP and the other 107 companies.
- Never mark simulated outcomes, test orders, opportunity value, queued refunds, or estimated savings as realized sales, realized cash, or actual recovered funds.
- Reuse only proven shared capabilities after version-compatible cross-company regression, privacy and security review; preserve forkability and blast-radius limits; follow the existing prove-three-companies rule before broad code reuse.
- A failed or unavailable vendor/source/AI provider cannot create fabricated success, coverage, safety clearance, published work, customer messages, or zero-percent progress.
- Roadmap planning is not permission to deploy, launch, onboard, contact customers, publish, pay, or mutate Supabase/GitHub.


## Domain build candidates for optional task decomposition

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


## Future capability candidates — do not make launch blockers unless necessary

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


## Test suites and evidence

For every stage: contract/schema QA, unit, integration, tenant isolation, safety, source versioning, no-spend, negative/corner, actual environment smoke and rollback; run domain fixtures:

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


## Source truth

A completed roadmap file is a planning deliverable; it is not an implemented service or a verified project percentage. Progress must derive from accepted work-unit evidence and live scope denominator.
