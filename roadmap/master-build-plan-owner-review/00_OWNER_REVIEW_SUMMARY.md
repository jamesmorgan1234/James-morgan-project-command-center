# COMMAND CENTER — MASTER BUILD PLAN — OWNER REVIEW SUMMARY

**Status:** OWNER-REVIEW DRAFT — AGENCY + PROJECT FOUNDRY + CONVERSATIONAL CONTROL RECONCILIATION IN PROGRESS  
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

- Reconciled canonical requirement baseline before current Agency/Foundry owner additions: **5,825**.
- Biometric/fingerprint-backed WebAuthn security and reliable application updates are clarified/recovered existing scope and do not inflate that baseline by themselves.
- Previous detailed roadmap baseline: **147 phases/work packages**.
- The 147-phase plan is now a **pre-Agency/Foundry baseline**, not the final roadmap.
- Final canonical requirement count and final phase count are **pending duplicate/lineage reconciliation**.

### New owner-directed architecture packages

- `03_AGENCY_MULTI_AGENT_EXECUTION_FABRIC.md` — **66 controls**.
- `04_AGENCY_EXHAUSTIVE_HARDENING_AND_EXPANSION.md` — **54 controls**.
- `05_PROJECT_FOUNDRY_IDEA_TO_ULTIMATE_SPEC.md` — **48 controls**.
- `06_CONVERSATIONAL_PROJECT_STUDIO_AND_EXECUTION_CONTROL.md` — **48 controls**.
- `07_PROJECT_FOUNDRY_MAJOR_GAP_AUDIT.md` — **36 controls**.

**Current architecture-review inventory: 252 explicit controls.**

This 252-control inventory is not the final canonical-requirement count. Some items promote/refine already recovered requirements; genuinely new scope will receive new canonical IDs only after reconciliation.

## Project Foundry / conversational owner experience

Command Center must support the following owner experience as a first-class product capability:

**James talks naturally with Command Center → Brain/Foundry develops the idea interactively → decisions/rules/specification are maintained behind the conversation → James says ordinary language such as “okay, go ahead and execute that” → the exact agreed version is snapshotted → The Agency dispatches eligible work in parallel → James can keep talking to ask, steer, change, pause, resume, or reprioritize → genuine owner boundaries surface through Needs Me / Boundary Office → verified completion returns to the same conversational workspace.**

This is not optional UI polish and must not be reduced to a chat box disconnected from Projects or The Agency.

The Foundry must also support:

- greenfield new builds;
- clean rebuilds;
- rescue/recovery;
- migrations/ports;
- upgrades/modernization;
- reality reconstruction of messy existing projects;
- product/UX journey design;
- mockups/prototypes where useful;
- environment/release setup;
- provider/account onboarding;
- reusable blueprints without private-state leakage;
- launch/operations/maintenance;
- archive/sunset/replacement.

## Category sequence

Category 0–15 remains the owner-facing organizing framework, but several categories must be re-expanded before Spec Lock v2:

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

The Agency must newly design, implement, and prove its scheduler/control plane, project-agent identities, elastic pools, specialist departments, isolated workspaces, resource claims/fencing, optimistic concurrency, dependency scheduling, fan-out/fan-in, verifiers, integrators, artifact handoffs, durable messaging, recovery, backpressure, $0/free-first governance, evaluations, Boundary Office, owner-visible topology, and future runtime portability.

## Non-negotiable execution sequence

1. Reconcile the 252-control Agency/Foundry/Conversational inventory against the 5,825 canonical baseline and recovered Future/Optional scope.
2. Assign new canonical IDs only for genuinely new owner requirements.
3. Expand the Master Build Plan wherever independent implementation/test phases are required.
4. Run completeness/dependency/security/dormant-capability/extensibility/conversational-workflow audit again.
5. Present the complete reconciled roadmap to James for owner review.
6. Create Specification Lock v2 only after James approves/corrects that roadmap.
7. Build Categories 1–14 cleanly from scratch.
8. Category 15 performs requirement-to-evidence mapping, every-file audit, architecture/security/visual/recovery/Agency concurrency/extensibility/conversational E2E audits, exact release candidate, production deployment, then owner/Samsung acceptance.

## Current provisional implementation

The deployed VNext scaffold and all historical Command Center Agent/runtime machinery are **NON-AUTHORITATIVE / PROVISIONAL / REFERENCE ONLY** and are not recycled into the clean rebuild.

## Review principle

Owner review is about defining the complete system correctly before implementation. Quality, clean-room construction, modularity, expandability, natural owner workflow, and future-safe architecture control the final requirement and phase counts—not historical numbers.
