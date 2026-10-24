# 102 — Brain vs Module vs Service Analysis

**Status:** PORTFOLIO-WIDE ARCHITECTURE CLASSIFICATION — PLANNED

Principle: do not create fake AI. Each company receives the smallest intelligence architecture that can safely solve its domain. Deterministic enforcement/calculation always outranks probabilistic AI where correctness is machine-verifiable.

## Classification vocabulary

- **FULL DOMAIN BRAIN:** persistent domain intelligence with reasoning/planning/memory/evaluation and multiple specialist agents.
- **SHARED BRAIN + DOMAIN PACK:** uses reusable Brain Factory reasoning/retrieval/planning with a company-specific ontology, policy, tools and eval pack.
- **HYBRID BRAIN + DETERMINISTIC CORE:** domain reasoning surrounds a deterministic engine that owns high-impact calculations/enforcement.
- **DETERMINISTIC SERVICE + ASSISTIVE AI:** mostly conventional software; AI explains/classifies/recommends at edges.
- **DETERMINISTIC SERVICE:** AI optional/nonessential.

## Full domain brains

These benefit from persistent, multi-capability domain cognition rather than a thin classifier:

- **008 Business Workflow Autopilot** — workflow synthesis/replanning across heterogeneous tools.
- **015 Business Intelligence Autopilot** — KPI trees, causal investigation, forecasting, scenario reasoning.
- **029 Vertical Business OS Generator** — industry/domain modeling and product/workflow generation.
- **032 AI Procurement Assistant** — requirements, supplier/quote/contract reasoning under policy.
- **041 Autonomous Micro-SaaS Factory** — product/foundry/portfolio lifecycle cognition.
- **045 Autonomous Customer Support Company** — conversation, product knowledge, troubleshooting, escalation.
- **049 Cloud/Software Reliability Autopilot** — incident context, topology reasoning, recovery planning.
- **055 Product Catalog Intelligence Engine** — product ontology/entity/variant/compatibility intelligence.
- **060 Software Migration Autopilot** — semantic mapping/dependency/cutover planning.
- **066 AI Runtime Security Gateway** — contextual runtime risk reasoning plus deterministic enforcement.
- **091 AI Agent Identity & Trust Authority** — trust/delegation reasoning around cryptographic identity.
- **100 Legacy Software Modernization Autopilot** — architecture/code/business-rule understanding and transformation planning.

These are candidates for independent specialized brains produced by the Brain Factory. They remain subordinate to Command Center as portfolio leader.

## Shared Brain + domain pack

These need substantial reasoning but do not justify a wholly separate cognitive substrate:

001 API-as-a-Business Factory; 002 AI Agent Control Center; 003 AI Quality-Control Platform; 006 Data Subscription Company; 007 Pricing Intelligence; 009 Document-to-Workflow; 011 Benchmarking; 012 AI Compliance; 013 Competitive Intelligence; 016 Regulation Monitor; 018 Churn Prevention; 023 Contract Obligations; 024 Vendor Risk; 025 Niche Research; 027 Reputation Autopilot; 028 Knowledge-Base Maintainer; 030 Invoice/Payment Recovery; 031 Form Automation; 034 Returns Intelligence; 035 Warranty/Claims; 036 RFP/Tender Intelligence; 037 Internal Policy; 038 Grant Management; 039 Digital Asset Marketplace; 040 Digital Estate Organizer; 046 Customer Onboarding; 047 DSAR; 050 Front Desk; 054 Localization; 056 Synthetic Data; 057 Fraud Detection; 058 Employee Lifecycle; 059 Marketplace Listing; 061 Collections; 062 Credentialing; 063 Vendor Onboarding; 064 Business Inbox; 065 QA-as-a-Service; 089 Support QA; 090 Content Moderation; 092 Agentic Commerce; 095 AI ROI; 096 Expense Audit.

These should load a shared reasoning/planning/memory substrate with domain ontology, tools, security policy and evaluations rather than fork Brain core.

## Hybrid Brain + deterministic core

High-impact domains where AI may interpret/explain but deterministic systems own truth/action:

004 AI Permission/Governance — policy engine owns allow/deny.  
005 AI Audit-Trail — immutable evidence ledger owns history.  
010 Subscription Revenue Recovery — billing/payment state machine owns money facts.  
014 Website Change Intelligence — capture/diff engine owns observed change.  
017 SaaS Spend Autopilot — entitlement/license/contract arithmetic owns savings evidence.  
019 Inventory Forecasting — forecasting/optimization engine owns reorder recommendations under constraints.  
020 Data Cleanup — deterministic normalization/merge constraints own canonical writes.  
021 Lead Qualification — scoring/routing policy owns operational classification.  
022 Cybersecurity Hygiene — security checks/config evidence own posture.  
026 License/Certification Tracker — requirement/expiry state owns readiness.  
033 Accessibility Compliance — rule engines own objective checks, human review handles semantics.  
042 Legacy Browser Worker — state verification/browser automation owns execution.  
043 Cloud Cost Optimization — billing/usage arithmetic and constraint optimizer own cost evidence.  
044 Chargeback Recovery — transaction/reason/evidence rules own case truth.  
048 AP Verification — deterministic matching/financial controls own approval evidence.  
051 Data Pipeline Watchdog — data contracts/quality rules own pass/fail.  
052 COI Autopilot — requirement/coverage rules own deficiency state.  
053 Release Autopilot — release gates and health criteria own promotion state.  
068 AI Cost/Model Routing — constrained optimization and measured evals own route choice.  
074 Cloud Permission Optimizer — policy graph/simulation owns effective permissions.  
075 Identity Access Review — access graph/review decisions own certification state.  
076 PII Discovery — detectors/classifiers with calibrated metadata; remediation governed.  
077 Redaction/Tokenization — transform policy owns output.  
078 Retention/Deletion — lifecycle/hold policy owns deletion eligibility.  
079 Provenance/Authenticity — cryptographic hashes/signatures own proof.  
080 Dependency Risk — package graph/advisories/build tests own gates.  
081 OSS License Compliance — license corpus/policy owns known obligations, legal review resolves ambiguity.  
082 Backup Integrity — actual isolated restore tests own verification.  
083 Domain/DNS/SSL — DNS/TLS observations own state.  
084 Email Deliverability — DNS/provider telemetry owns health.  
085 Revenue Leakage — contract/pricing arithmetic owns verified leakage.  
086 Payment Reconciliation — ledger math owns matching/balance.  
087 Marketplace Payout Reconciliation — settlement arithmetic owns discrepancy.  
088 Commission Engine — versioned plan calculator owns commission result.  
093 Consent/Preferences — user-originated consent ledger owns enforcement.  
094 Data Lineage — evidence-backed graph owns canonical lineage.  
097 Indirect Tax — validated tax rules/rates own calculations.  
098 Sovereignty Routing — deterministic constraint solver owns eligible placement.  
099 Data Contracts — exact contract/version validators own enforcement.

## Deterministic service + assistive AI

Companies where a full brain would be overbuilding:

071 Webhook Reliability; 072 API Contract Drift; 073 Secret Rotation; 069 Usage Billing; 070 Entitlements; 083 Domain/DNS/SSL; 084 Email Deliverability; 086 Payment Reconciliation; 088 Commission Calculation; 097 Indirect Tax; 099 Data Contracts.

Their AI should be optional explanation, mapping and exception handling. The platform remains useful with models disabled.

## Deterministic-service-dominant candidates

- **069 Usage Billing** — append-only metering + pricing arithmetic.
- **070 Entitlements** — deterministic subject/resource/feature policy.
- **071 Webhook Reliability** — queue/idempotency/retry/signing.
- **073 Secret Rotation** — provider state machine + verification.
- **078 Retention/Deletion** — policy/lifecycle/deletion orchestration.
- **079 Provenance/Authenticity** — hashes/signatures/lineage.
- **082 Backup Integrity** — restore/drill/verifier.
- **083 Domain/DNS/SSL** — standards/probes/state diff.
- **086 Payment Reconciliation** — financial ledger/reconciliation.
- **088 Commission Calculation** — versioned deterministic formulas.
- **093 Consent/Preference** — versioned choice ledger + enforcement.
- **097 Indirect Tax** — validated rule/rate engine.
- **098 Sovereignty Routing** — policy constraints and placement solver.
- **099 Data Contracts** — machine-readable validation/enforcement.

AI may improve usability but must never be a hard runtime dependency for core correctness.

## Portfolio Brain architecture conclusion

The portfolio should not create 100 Brain codebases. Use:

1. **Brain Factory Core** — identity, memory, context, retrieval, reasoning/planning, model routing, tools, policy, evaluation, observability and recovery.
2. **Domain Packs** — ontology/taxonomy, domain knowledge, terminology, constraints, prompts/strategies, search sources and domain evaluations.
3. **Policy Packs** — action classes, permissions, approvals, risk limits, jurisdiction/company rules.
4. **Tool/Integration Packs** — provider-neutral tool contracts and adapters.
5. **Workflow Packs** — reusable state-machine/workflow definitions.
6. **Evaluation Packs** — golden cases, regression, adversarial, policy, cost/quality/performance tests.
7. **Deterministic Cores** — calculators, rules engines, optimizers, graphs, schedulers, ledgers and cryptographic services that remain authoritative when AI is unavailable.

## Command Center reverse-map

**DESIGN NOW:** Brain identity/version/manifest; domain/policy/tool/workflow/evaluation pack interfaces; model-independent context/memory; deterministic-core adapter; health/cost/privacy telemetry; capability declaration; migration/compatibility/deprecation.

**BUILD NOW:** reusable Brain Factory interfaces around existing Command Center Brain, specialist registry and model routing; avoid hardcoding current Brain as the only intelligence layer. Command Center must orchestrate external specialized brains as separate governed systems.

**BUILD BEFORE FIRST PORTFOLIO COMPANY:** instantiate packaged domain brains, pack registry, brain deployment isolation and company-specific memory/data boundaries.

**SAFE TO DEFER:** customer-facing brain marketplaces, public pack ecosystem and cross-company learned models.

## Saturation conclusion

Additional portfolio intelligence types now reduce to combinations of reusable Brain Factory modules, domain packs and deterministic cores. A new independent Brain should only be created when domain reasoning/memory/evaluation requirements are materially distinct enough to justify its own lifecycle and deployment boundary.