# Company 110 Agency execution and dependency plan

**Project:** `project:company:future:110`

**State:** PREPARED / NO TASKS REGISTERED / NO EXECUTOR ACTIVATED

## Scheduler model

P0→P7 are ordered acceptance stages. Within a stage, design/domain/Brain/security may be split among different agents after the scope contract; independent QA integrates only after those tasks. A single agent handles dependent work when required. Every task has idempotent claim/lease/retry and durable evidence.

Resource governor caps concurrent tasks by actual workers, hardware and $0 limits. Never imply agents are unlimited or connected. Store unknown instead of guessing capacity.

## Stage gates

### P0 — Evidence, product and demo

Scope: Verify current KDP/EPUB requirements and author scope; generate sample public-domain book and sample QA report.

Acceptance: Real source formats verified, customer ownership rules and free tools licensed.

Work packets: `project:company:future:110:p0:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P1 — Secure intake and semantic engine

Scope: Client isolation, source scanning, structure tree, metadata, style presets, versioning and author approval.

Acceptance: Source diff preserves 100% original text except approved changes.

Work packets: `project:company:future:110:p1:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P2 — EPUB workflow

Scope: EPUB3 generation, navigation, accessibility, image/footnote validation and device proof set.

Acceptance: EPUBCheck passing and independent visual QA.

Work packets: `project:company:future:110:p2:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P3 — Print production workflow

Scope: Trim/bleed/gutter, typography, paperback/hardcover interior PDF, image/font QC, mechanical cover check.

Acceptance: Current KDP rules, no trim/bleed violations and manual proof pass.

Work packets: `project:company:future:110:p3:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P4 — Customer production workflow

Scope: Quote/scope, revision approvals, secure delivery, source rebuild receipts and support.

Acceptance: One complete mock customer order, secure file separation and no auto-publishing.

Work packets: `project:company:future:110:p4:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P5 — First authorized paid customers

Scope: Validate quality, price, turnaround, rework/refund policy and customer satisfaction.

Acceptance: Actual payment and final deliverables; no fabricated sales.

Work packets: `project:company:future:110:p5:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P6 — Expanded genre and channel profiles

Scope: Workbooks, cookbooks, poetry, picture books, large-print, additional retailers with official specs.

Acceptance: Each profile independently accepted with realistic specimen tests.

Work packets: `project:company:future:110:p6:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P7 — Automation and scale

Scope: Background job queue, genre QA/evals, author portal, series templates, no-cost capacity/recovery.

Acceptance: Demand/cost/quality evidence; owner approves any paid scaling separately.

Work packets: `project:company:future:110:p7:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

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

- Manuscript intake and readiness review
- Style-guide intake
- DOCX-to-EPUB conversion
- DOCX-to-print-PDF conversion
- EPUB reflowable typography
- Fixed-layout assessment and separate quote
- Paperback interiors
- Hardcover interiors
- KDP-compliant cover mechanical sizing
- Customer-supplied cover preflight
- Chapter and heading hierarchy repair
- Navigation table of contents
- Front/back matter templates
- Page numbering and running heads
- Widow/orphan control
- Paragraph styles and scene breaks
- Poetry stanza handling
- Footnotes/endnotes conversion
- Hyperlink/URL/reference checks
- Image placement and caption management
- Table and list formatting
- Illustration bleed and image quality checks
- Workbook form/line layout
- Cookbook recipe page templates
- Large-print accessibility format
- EPUB accessibility report
- KDP dry-run preflight checklist
- Edition/format metadata consistency
- Version/revision history
- Page proof generation
- Print-ready single-page PDF validation
- Bibliography/citation formatting as separate scoped service
- Series template packs
- Publisher imprint template pack
- Multi-retailer export profiles
- Font/license and embedding checks
- Color space and resolution inspection
- Orphaned asset detection
- Print-spine/back cover mechanical template
- Metadata/ISBN ownership checklist
- Files delivery portal
- Author correction/revision workflow
- Author approval/signoff packet
- Final source/archive export
- Bulk series edition processing
- Human-reviewed complex layout option
- White-label formatting for editors


## Future capability candidates — do not make launch blockers unless necessary

- Print-on-demand retailer profile library
- Accessible audiobook script exports only with rights
- Automated indexes and concordance proposals with author review
- Collaborative structured author proof annotations
- Language-specific hyphenation packs
- Illustrated book screen/print parity previews
- Color proof simulations with caveats
- Reference/footnote cross-platform auditing
- Series template consistency AI
- Book typography A/B proof proposals
- Secure client self-service status portal
- Print economics calculator as recommendation only
- Publisher editorial workflow handoffs
- Multilingual typesetting and translation-ready packaging


## Test suites and evidence

For every stage: contract/schema QA, unit, integration, tenant isolation, safety, source versioning, no-spend, negative/corner, actual environment smoke and rollback; run domain fixtures:

- Low-resolution licensed images
- Fonts without commercial embedding rights
- Unlicensed cover art
- Complex math/RTL scripts unsupported
- Footnote crosslink corruption
- Widows/orphans and page-break bugs
- Cookbook images or recipes unverified
- Wrong bleed for print interior
- Wrong hardcover vs paperback cover geometry
- Missing original manuscript
- Source comment leakage
- Hidden track changes included in print
- ISBN mismatch across formats
- Customer requests silent substantive rewrites
- KDP changes trim/page constraints
- EPUB navigation broken on reader
- False assurance that all files will be accepted
- Corrupt zip/EPUB package
- Client data mixed between authors
- Output contains placeholder or prompt text
- Customer authorization to publish assumed from file delivery


## Source truth

A completed roadmap file is a planning deliverable; it is not an implemented service or a verified project percentage. Progress must derive from accepted work-unit evidence and live scope denominator.
