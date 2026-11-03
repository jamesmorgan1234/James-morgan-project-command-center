# Company 112 Agency execution and dependency plan

**Project:** `project:company:future:112`

**State:** PREPARED / NO TASKS REGISTERED / NO EXECUTOR ACTIVATED

## Scheduler model

P0→P7 are ordered acceptance stages. Within a stage, design/domain/Brain/security may be split among different agents after the scope contract; independent QA integrates only after those tasks. A single agent handles dependent work when required. Every task has idempotent claim/lease/retry and durable evidence.

Resource governor caps concurrent tasks by actual workers, hardware and $0 limits. Never imply agents are unlimited or connected. Store unknown instead of guessing capacity.

## Stage gates

### P0 — Scope/rights/hardware feasibility

Scope: Company isolation, owned demo footage, legal processing consent; inspect laptop CPU/RAM/disk and no-cost tools.

Acceptance: One full sample can be processed locally without server or spend.

Work packets: `project:company:future:112:p0:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P1 — Local media ingestion and transcription

Scope: FFprobe/FFmpeg, checksum vault, offline ASR and transcript/timecode trace.

Acceptance: Hardware benchmark, corrupt/multiple format tests, no file leakage.

Work packets: `project:company:future:112:p1:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P2 — Highlight and editorial selection

Scope: Topic/speaker segmentation, hook/context scoring, reviewable candidate clips, no misleading splice.

Acceptance: Human-labeled clip rubric and high-confidence abstain cases.

Work packets: `project:company:future:112:p2:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P3 — Video/caption render and QA

Scope: Aspect ratio reframing, captions/audio, platform profiles, encoder/retry, automated visual/audio QC.

Acceptance: SRT accuracy, caption legibility, A/V sync, no clipping/black frames.

Work packets: `project:company:future:112:p3:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P4 — Client delivery and service operation

Scope: Package design, review/revisions, private delivery, consent/rights receipts, customer support.

Acceptance: One synthetic client order end-to-end and clean offboarding.

Work packets: `project:company:future:112:p4:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P5 — First authorized paid customers

Scope: Validate repeat demand and real deliverable quality on existing laptop within capacity.

Acceptance: Verified payments, customer approval and no manual workload overclaim.

Work packets: `project:company:future:112:p5:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P6 — Local automation and vertical templates

Scope: Queue/recovery/scheduled tasks, client style kits, podcast/webinar/education/commerce variants.

Acceptance: Continuous regression with no performance/quality regression or paid features.

Work packets: `project:company:future:112:p6:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

### P7 — Optional approved infrastructure scale

Scope: Serverless/cloud/hardware alternatives evaluated only after real demand; optional client portal and capacity.

Acceptance: Cost/quality proposal to owner; no purchase, deployment or paid action automatically.

Work packets: `project:company:future:112:p7:scope`, `:domain`, `:brain`, `:isolation`, `:tests`, `:gate`.

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

- Source upload or authorized file import
- Rights/intake questionnaire
- Source transcoding
- Speech-to-text transcript
- Speaker diarization
- Language identification
- Semantic topic chapter detection
- Highlight candidate mining
- Question-and-answer clip detection
- Hook and context scoring
- Clip boundary editing
- Silence and dead-air cleanup
- Remove filler words only with customer approval and sense checks
- Vertical 9:16 reframing
- Square 1:1 reframing
- Landscape 16:9 clips
- Smart face/speaker tracking with consent
- Multi-person split-layout framing
- Subtitle generation and styling
- Word-level timing correction
- Profanity policy configurable per client
- Caption readability/contrast checks
- Brand logo/lower third overlays
- Audio denoise and leveling
- Noise/music separation optional and tested
- Pause/breath naturalness guard
- B-roll import from customer-owned assets
- Graphic overlays from client library
- Client-approved licensed music
- Intro/outro templates
- Brand style kit and safe margins
- Thumbnail still extraction
- Short title/description suggestions
- Multi-platform output profiles
- Clip package delivery with filename convention
- Client revision/proof portal
- Transcript and caption sidecars
- Burned-in versus separate captions
- Text-only quote/social caption pack
- Background processing queue
- Private workspace/retention control
- Performance/failure report
- Metadata/clip manifest
- Batch project processing
- Long-form to newsletter/blog outline only as optional related derivative
- Optional review-and-publish staging, no auto-publication
- Client-approved language translation/subtitles
- Video accessibility support
- No customer analytics fabricated
- Portfolio and before-after examples using owned footage
- Customer request tracking and support


## Future capability candidates — do not make launch blockers unless necessary

- Scene-aware multicamera podcast cuts
- Automatic speaker-focused split layouts
- More robust offline multilingual ASR
- Source-based fact checking via provided material
- Customer-approved animated graphics
- Customer-approved accessible descriptions
- Internal frame-based cut suggestions
- Transcript-based search/editor UI
- Customer self-service review with controlled hosting
- Consent-based subject redaction
- Brand kit per social platform
- Asset licensing automation
- Long-form video trailer packages
- Semantically diverse clip batches
- Robust local GPU acceleration when hardware available
- Caption language/translation packs
- Queue distributed to separately approved compute
- Selective human-in-loop review only where confidence warrants
- Client analytics via separately authorized read-only links


## Test suites and evidence

For every stage: contract/schema QA, unit, integration, tenant isolation, safety, source versioning, no-spend, negative/corner, actual environment smoke and rollback; run domain fixtures:

- Rights to footage unclear
- Creator does not own background music
- Low audio quality yields incorrect captions
- Real-person face consent missing
- Speaker diarization mislabels
- Clip loses crucial context
- Quote splice changes meaning
- AI summarization invents facts
- Language unsupported locally
- CPU thermal throttling/low RAM
- Disk fills mid-render
- Power loss interrupts client job
- Video corrupt/VFR sync drift
- Portrait reframing cuts key visual
- Captions overlap platform UI
- Customer logo/music asset unlicensed
- Source contains private info
- Clip production accidentally publishes to client account
- Multiple customers’ video assets cross-contaminate
- Unreconciled delivery claims
- Client expects 24/7 portal while PC off
- Caption translation introduces wrong technical term


## Source truth

A completed roadmap file is a planning deliverable; it is not an implemented service or a verified project percentage. Progress must derive from accepted work-unit evidence and live scope denominator.
