# Command Center — Project Foundry Major Gap Audit

Status: **OWNER-REVIEW ROADMAP ADDITION — RECONCILIATION REQUIRED BEFORE SPECIFICATION LOCK v2**

Purpose: close macro-level gaps that a conversational idea-to-execution factory could otherwise leave implicit. This file adds **36 explicit Foundry lifecycle controls** covering existing-project modes, experience/prototype design, environment/release setup, provider/account onboarding, reusable blueprints, and post-launch operations.

These controls are clean-room requirements. They do not authorize reuse of legacy Command Center implementation code.

## A. Multiple project-entry modes — controls G1–G6

**G1. Greenfield build mode.** New project starts from owner idea/current research with no assumption that old software exists.

**G2. Clean rebuild mode.** Existing project may be rebuilt from requirements/verified data/approved assets while old implementation remains evidence only and is not reused unless a separate owner directive explicitly changes the global clean-room rule.

**G3. Rescue/recovery mode.** Foundry can recover a damaged, frozen, partially completed, or inconsistent project by identifying last verified state, protected assets, current external truth, corrupted/unverified work, and earliest safe resume/rebuild boundary.

**G4. Migration/port mode.** Existing project may move between frameworks, providers, repositories, databases, hosting, platforms, or device targets through explicit data/feature/behavior parity and migration/rollback plans.

**G5. Upgrade/modernization mode.** A working project may receive a controlled new architecture/version without treating redesign as an emergency patch stack; old production remains protected until replacement passes gates.

**G6. Reality-reconstruction mode.** For inherited/messy projects, Foundry can inspect authoritative repos, providers, databases, files, deployments, and owner decisions to build a truthful current-state model before planning changes.

## B. Product experience and prototype studio — controls G7–G12

**G7. User/problem/journey modeling.** Product projects identify intended users, jobs-to-be-done, critical journeys, edge cases, and failure paths rather than coding from a feature list alone.

**G8. Information architecture and interaction-flow design.** Screens, routes, states, navigation, forms, errors, empty states, onboarding, accessibility, and user-flow dependencies are designed before UI implementation where applicable.

**G9. Project-specific visual system.** New products can create a coherent visual language/design system or inherit an explicitly approved template; one-off screens must not evolve into conflicting styles.

**G10. Wireframe/mockup/prototype lane.** Foundry can create low/high-fidelity prototypes or functional proof-of-concepts when they materially reduce design/technical risk before full implementation.

**G11. Usability/accessibility review before lock.** Representative journeys and prototypes are reviewed for understandability, touch/keyboard behavior, responsiveness, accessibility, and owner goals before expensive implementation hardens bad UX.

**G12. Design provenance and protected-artifact lock.** Approved visual directions/assets become versioned protected project inputs; later workers cannot silently substitute or drift from them.

## C. Environment and release factory — controls G13–G18

**G13. Environment plan by project type.** Applicable software projects define development/test/staging/preview/production or an intentionally simpler equivalent; production is never the default test environment.

**G14. Environment-specific configuration/credentials/data.** Config, secrets, OAuth apps, database instances/schemas, test fixtures, domains, and provider endpoints remain intentionally separated where appropriate.

**G15. Reproducible build/release identity.** Every releasable build maps to exact source, dependencies, configuration class, migrations, artifacts, checksums, tests, and release metadata.

**G16. Preview/staging acceptance path.** Foundry can generate an exact or representative pre-production candidate for automated/manual/owner QA without falsely calling it production.

**G17. Migration/rollback choreography.** Schema/data/client changes define prechecks, ordering, compatibility, backup requirements, postchecks, and rollback/recovery before promotion.

**G18. Promotion pipeline.** Dev/test/staging/candidate/production promotion is an explicit governed state machine with required evidence and protected deployment authorization.

## D. Connection, credential, and account onboarding factory — controls G19–G24

**G19. Required-connections manifest.** Foundry identifies every provider/account/domain/repository/database/API/social/store/payment/analytics or other connection a project may need and classifies mandatory versus optional/dormant.

**G20. Least-privilege permission plan.** Required scopes, roles, OAuth permissions, tokens, service accounts, and secrets are defined before connection; broad access is not requested merely for convenience.

**G21. Owner setup/Needs-Me plan.** User-only login/MFA/CAPTCHA/KYC/domain/payment/legal/provider setup steps are grouped, ordered, explained, and surfaced only when they actually unblock work.

**G22. Connection verification.** A connection is not considered ready because credentials were entered; Foundry verifies identity, scope, read/write capability, environment, health, freshness, and intended account/project binding.

**G23. Credential lifecycle and rotation/revocation.** Projects define expiry, refresh, rotation, revocation, lost-account recovery, provider compromise, and cleanup for connected credentials.

**G24. Provider/account replacement path.** Replacing an account/provider preserves canonical project identity and data lineage without silently crossing business/project identities or losing verified history.

## E. Reusable blueprints and platform extraction — controls G25–G30

**G25. Verified project-blueprint registry.** Mature project architectures/workflows can become reusable blueprints only after evidence shows they are genuinely reusable and not project-specific accidents.

**G26. Blueprint parameterization.** Templates expose explicit variables for brand, project type, provider, data model, environments, feature modules, assets, and rules rather than encouraging copy/paste forks.

**G27. No-secret/no-private-state cloning.** New projects created from blueprints never inherit credentials, private customer/user data, production IDs, approvals, financial records, or mutable state by default.

**G28. Shared component/capability extraction.** Reusable code/services/capabilities may be promoted into supported shared modules after review, tests, ownership assignment, versioning, and dependency contracts.

**G29. Blueprint versioning and migrations.** Projects record which blueprint/capability version they used; later template improvements do not mutate existing projects silently.

**G30. Anti-copy-paste architecture rule.** High-volume project creation must multiply through registries, generators, templates, packages, and adapters—not manual duplicated project code that diverges immediately.

## F. Launch, operations, maintenance, and end-of-life — controls G31–G36

**G31. Launch-readiness checklist generated from project type.** Security, performance, accessibility, data, legal/compliance, provider, domain, backup, monitoring, release, support, and owner-acceptance requirements are assembled from actual project scope.

**G32. Operational observability from day one.** Applicable projects launch with health, error, job/provider, resource, security, update, and business/usage metrics appropriate to their risks rather than bolting monitoring on after failure.

**G33. Maintenance and dependency lifecycle.** Foundry creates update, vulnerability, provider/API deprecation, credential, certificate/domain, backup, data-retention, and recurring-health responsibilities where relevant.

**G34. Incident/recovery playbook.** Important projects define containment, emergency stop, restore/rollback, credential revocation, evidence preservation, communication boundaries, and return-to-service procedures before incidents occur.

**G35. Ownership/documentation handoff.** Final project includes architecture, operating runbook, setup/recovery instructions, key decisions, environment map, providers, data ownership, and current roadmap in owner-readable form.

**G36. Archive/sunset/replace lifecycle.** Projects can be paused, archived, decommissioned, replaced, exported, or resurrected later without leaving unsafe credentials, orphan infrastructure, broken dependencies, or false “active” status.

## Gap-audit conclusion

A complete Project Foundry must support more than **new idea → code**. It must support:

- new builds;
- clean rebuilds;
- rescue/recovery;
- migrations/ports;
- modernization;
- truthful reconstruction of existing systems;
- product/UX design and prototypes;
- environment/release setup;
- external connection onboarding;
- reusable blueprints;
- production operations and maintenance;
- retirement/replacement.

## Architecture inventory update

- Agency execution fabric: 66 controls.
- Agency hardening/expansion: 54 controls.
- Project Foundry: 48 controls.
- Conversational Project Studio: 48 controls.
- Foundry major gap audit: 36 controls.
- **Current combined architecture-review inventory: 252 explicit controls.**

This is not the canonical requirement total or final phase count. Final deduplication, lineage, category placement, phase decomposition, and acceptance mapping occur before Specification Lock v2.
