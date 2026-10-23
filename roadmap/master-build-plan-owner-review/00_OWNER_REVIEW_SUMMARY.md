# COMMAND CENTER — MASTER BUILD PLAN — OWNER REVIEW SUMMARY

**Status:** OWNER-REVIEW DRAFT — AGENCY RECONCILIATION IN PROGRESS  
**Specification Lock v2:** NOT YET LOCKED  
**Owner/Samsung acceptance:** NOT APPLICABLE UNTIL CATEGORY 15

## Controlling clean-room rule

The authoritative rebuild is built from the beginning. Historical Command Center implementation code is not recycled into the new build.

Old code, Agent runners, queues, schedulers, database tables, RPCs, UI layers, workflows, leases, heartbeats, retries, patches, and other runtime machinery may be inspected only as evidence of old ideas, failures, behavior, or requirements. They are not implementation authority and are not reused as the rebuild foundation.

Verified owner/project/business/book data and approved/protected assets may be preserved from their authoritative sources. The old software mechanisms that stored, displayed, scheduled, or acted on them are not preserved as implementation.

**Recovered requirements may inform the specification. Legacy implementation does not survive the clean rebuild.**

## Why the architecture changes now

The previous build became fragile because capabilities were added and changed on architecture that was not designed to expand cleanly. The rebuild therefore treats extensibility as a correctness requirement.

Adding or removing a project type, Agency worker class, specialist department, provider, model, device, business, integration, book type, or future capability must occur through registries/adapters/contracts and must not require unrelated core-system surgery.

## Current corrected scope state

- Reconciled canonical requirement baseline before current Agency owner additions: **5,825**.
- Biometric/fingerprint-backed WebAuthn security and reliable application updates are clarified/recovered existing scope and do not inflate that baseline by themselves.
- Previous detailed roadmap baseline: **147 phases/work packages**.
- James has now directed a first-class scalable multi-agent system named **The Agency**.
- Agency architecture specification: `03_AGENCY_MULTI_AGENT_EXECUTION_FABRIC.md`.
- Current Agency specification contains **66 explicit architecture controls**.
- The old **147-phase** count is now a pre-Agency baseline, not a final target.
- Final phase count and any genuinely new canonical requirement IDs remain pending Agency duplicate/lineage reconciliation.
- Quality and completeness, not preservation of old numbers, determine the final roadmap.

## Category sequence

The Category 0–15 owner-facing sequence remains the organizing framework, but Category 7 and cross-cutting Agency dependencies must be expanded before Specification Lock v2:

- **Category 0 — AUTHORITY / RECOVERY / ROADMAP / SPECIFICATION BASELINE**
- **Category 1 — CORE KERNEL + GOVERNANCE**
- **Category 2 — IDENTITY + SECURITY FOUNDATION**
- **Category 3 — CANONICAL DATA / KNOWLEDGE / COMMAND GRAPH / PROVIDER PLATFORM**
- **Category 4 — APPLICATION SHELL / VISUAL SYSTEM / PWA / DEVICE**
- **Category 5 — PROJECTS / PORTFOLIO / ROADMAP / CHECKPOINTS / PROGRESS**
- **Category 6 — BRAIN / AI INTELLIGENCE ECOSYSTEM**
- **Category 7 — THE AGENCY / MULTI-AGENT EXECUTION PLATFORM**
- **Category 8 — PERSONAL OPERATIONS / SEARCH / NEEDS ME / NOTIFICATIONS / AUTOMATION**
- **Category 9 — FINANCE / BANKING / CREDIT / OBLIGATIONS**
- **Category 10 — SOCIAL / COMMUNICATIONS / BRAND ACCOUNT IDENTITY**
- **Category 11 — BOOKS / PUBLISHING PLATFORM**
- **Category 12 — SPECIALIST PROJECT ORCHESTRATION + INTEROPERABILITY**
- **Category 13 — ANALYTICS / OBSERVABILITY / RECOMMENDATIONS / SELF-AUDIT**
- **Category 14 — RECOVERY / MIGRATION / SCALE / DORMANT FUTURE**
- **Category 15 — FINAL INTEGRATION / EVERY-FILE AUDIT / RELEASE / PRODUCTION / SAMSUNG ACCEPTANCE**

## Agency clean-room requirement

Recovered concepts such as claims, leases, heartbeats, idempotency, retries, circuit breakers, dead-letter handling, checkpoints, and project locks remain useful requirement evidence. Their old implementation is not trusted or reused.

The Agency must newly design, implement, and prove:

- scheduler/control plane;
- project-agent identities;
- elastic worker pools;
- specialist departments;
- immutable job manifests;
- isolated workspaces;
- declared read/write sets;
- resource claims/locks;
- lease plus fencing-token correctness;
- optimistic concurrency;
- dependency-DAG scheduling;
- fan-out/fan-in;
- work stealing;
- verifier/integration workers;
- artifact-first handoffs;
- context snapshots/compaction;
- durable messaging;
- dead-letter/poison-job containment;
- compensation/uncertain-outcome reconciliation;
- hierarchical stop/pause;
- resource/backpressure governance;
- $0/free-first routing;
- worker performance/evaluation;
- canary/shadow Agency upgrades;
- Boundary Office / Needs Me routing;
- owner-visible Agency topology and tracing;
- future local/remote/federated worker seams.

## Specialist architecture resolution

MarginCraftTools, Morgan's Garage Doors, and Torevi do not force one-off hard-coded Agent branches. They remain first known instances of reusable specialist archetypes:

- digital-products specialist;
- service-business specialist;
- software-platform specialist.

Agency departments/workers may serve those project types through registered capabilities while project state, credentials, accounts, assets, and mutable work remain isolated.

## Non-negotiable execution sequence

1. Complete Agency requirement/lineage reconciliation against the canonical baseline and recovered Future/Optional Agent requirements.
2. Expand the phased Master Build Plan wherever Agency architecture requires explicit build/test phases.
3. Run final roadmap completeness/dependency/security/dormant-capability/extensibility audit.
4. Present the complete reconciled owner-facing roadmap to James.
5. Create Specification Lock v2 only after owner review/approval.
6. Build Categories 1–14 cleanly from scratch under the locked specification.
7. Do not perform premature Samsung/owner acceptance.
8. Category 15 performs requirement-to-evidence mapping, every-file audit, architecture/security/visual/recovery/Agency concurrency/extensibility audits, exact release candidate, production deployment, then owner/Samsung acceptance.

## Current provisional implementation

The deployed VNext scaffold and all historical Command Center Agent/runtime machinery are **NON-AUTHORITATIVE / PROVISIONAL / REFERENCE ONLY** and are not recycled into the clean rebuild.

## Review principle

Owner review is about defining the complete system correctly before implementation. Quality, clean-room construction, modularity, expandability, and future-safe architecture control the final requirement and phase counts—not historical numbers.
