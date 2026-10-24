# Company 046 — Customer Onboarding Autopilot

**Company ID:** `company:future:046`  
**Primary project:** `project:company:future:046`  
**Roadmap version:** `COMPANY-046-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer messages, account changes, migration execution or external deployment.

## Business identity

Purpose: move new customers from signed-up/sold to successfully configured, migrated, trained and activated with the least human intervention while preserving secure account and data boundaries.

Problem: onboarding combines setup, data import, configuration, integrations, training and customer-specific blockers; delays increase churn and service cost.

Value: personalized readiness plans, automated setup/migration where safe, milestone tracking, risk detection and exception escalation.

## Product tree

Onboarding Plan Generator; Setup Checklist; Account/Workspace Provisioning Prep; Data Import/Migration Assistant; Configuration Wizard; Integration Setup; Personalized Product Tours; Training/Learning Paths; Milestone Tracker; Activation/Adoption Analytics; Customer Risk Monitor; Document/Data Collection; Implementation Project Workspace; Enterprise Multi-Team Onboarding; Customer Portal; Health/Success Handoff; Onboarding Benchmarking; API/OEM; Vertical Packs; Managed Onboarding Ops.

## Feature/customer/vertical tree

Features: customer/org identity, purchased plan/entitlements, goals/use cases, required data/integrations, owners/roles, tasks/dependencies, due dates, readiness, import validation, config version, training completion, milestone evidence, blockers, risk/confidence, communication preferences, approvals, handoff status, audit.

Customers: SaaS, enterprise software, fintech-adjacent admin products, ecommerce platforms, developer tools, data/analytics vendors, HR/IT software, services with software implementations, marketplaces.

Verticals: B2B SaaS, data migration-heavy systems, developer platforms, finance/admin, HRIS, ecommerce, field-service software, analytics/BI. Regulated customer data requires private/region-specific migration controls.

## Brain / architecture

Brain understands customer goals/plan/product configuration and proposes onboarding sequence, detects blockers and adapts guidance. Deterministic provisioning/import validation/entitlements own system truth. Brain cannot grant entitlements, modify billing, send external messages or migrate production data beyond authorized workflow.

Architecture: customer/project workspace, task DAG, entitlement/profile refs, integration registry, import staging/validation, training content, telemetry/activation metrics, communication/approval workflow, LLM planning/guidance grounded in product docs.

## Agent tree

Onboarding Planner, Requirements/Data Collection Agent, Setup Agent, Migration Agent, Configuration Agent, Integration Agent, Training Agent, Adoption Agent, Risk/Blocker Agent, Customer Communication Draft Agent, Enterprise Coordinator, Handoff/Success Agent, QA/Data Validation Agent.

## Deterministic services

Customer/org registry; entitlement lookup; task/dependency scheduler; import staging; schema validation; integration setup state; provisioning APIs; training completion; milestone/evidence; notification queue; analytics; audit; protected account/data-change gates.

## Workflow

Customer authorized → capture goals/plan → generate dependency plan → collect required data/access → stage/validate import → configure/test integrations → train → verify milestones/activation → resolve blockers/escalate → customer acceptance → handoff to success/support → retain onboarding evidence.

## Integrations / API / data

CRM, billing/entitlements, product/admin APIs, data import/storage, IdP/SSO, support, training/LMS, calendar/comms, analytics, ticketing/project systems. APIs for onboarding/status/tasks/readiness/migrations/milestones/risk/handoff.

Data moat: onboarding templates by product/vertical, migration mappings, blocker/resolution corpus, activation milestone/outcome patterns. Customer data remains isolated.

## Monetization / distribution

Customers onboarded, seats, migrations/GB/records, enterprise implementation projects, premium packs, managed onboarding, API/OEM. Distribution through SaaS platforms, implementation partners, CRM/CS ecosystems.

## Security/privacy

Production customer data migration requires staging, provenance, rollback, least privilege and explicit authorization. Entitlements/account roles protected; no secret exposure; customer communications policy/consent; delete temporary migration data.

## Failure / edge cases

Bad source data, schema mismatch, incomplete permissions, integration provider outage, SSO domain error, customer changes goals, partial import, duplicate records, timezone/role confusion, training skipped, billing entitlement mismatch. Use checkpoints, rollback/reconciliation and truthful blocker state.

## Scale/overlap

SMB self-service → enterprise implementation platform. Overlap #60 software migration, #20 cleanup, #45 support, #70 entitlements. #046 focuses customer activation lifecycle.

## Classification

**DESIGN NOW:** customer/org/project identities, entitlement refs, migration staging/rollback, task DAG, evidence/handoff, comms/account protected actions.  
**BUILD NOW:** Command Center Foundry/workspace/import/Needs Me patterns may generalize after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** customer tenant/auth/billing/entitlement and migration interfaces.  
**COMPANY-SPECIFIC LATER:** customer onboarding product/templates/integrations/pricing.  
**SCALE-ONLY:** enterprise multi-team implementation automation.

# Mandatory 24-part completion block

1. Product Tree: plans/checklists/provisioning/migration/config/integration/tours/training/milestones/adoption/risk/docs/workspace/enterprise/portal/handoff/benchmarks/API/packs/managed.
2. Feature Tree: identity/plan/goals/data/integrations/roles/tasks/deps/dates/readiness/import/config/training/evidence/blockers/comms/approval/audit.
3. Customer Tree: SaaS/enterprise/dev/data/HR/commerce/services/marketplaces.
4. Vertical Tree: B2B SaaS, data-heavy, dev platforms, finance admin, HRIS, commerce, field software, BI.
5. Brain Tree: sequence/personalization/blocker reasoning; entitlements/account/data changes gated.
6. Agent Tree: planner/data/setup/migration/config/integration/training/adoption/risk/comms/enterprise/handoff/QA.
7. Service Tree: customer/entitlement/tasks/staging/schema/integration/provisioning/training/evidence/notifications/analytics/audit.
8. Workflow Tree: goals→plan→collect→stage/validate→configure/integrate→train→verify activation→handoff.
9. Integration Tree: CRM/billing/product/import/IdP/support/LMS/calendar/comms/analytics/tickets.
10. Data Tree: customer/profile/goals/tasks/imports/config/integrations/training/milestones/blockers/outcomes.
11. API Tree: onboarding/status/tasks/readiness/migrations/milestones/risk/handoff.
12. Monetization Tree: customers/seats/migrations/implementation/packs/managed/API/OEM.
13. Distribution Tree: SaaS/implementation/CRM/CS ecosystems.
14. Automation Tree: planning/setup validation/migration prep/training/risk/handoff; protected account/data operations gated.
15. Moat Tree: templates/migration maps/blocker corpus/activation outcome data.
16. Platform Tree: onboarding assistant→implementation ops→customer activation platform.
17. Risk Tree: customer data corruption, entitlement errors, secrets, poor migration, overcommunication.
18. Scale Tree: self-service→enterprise implementations→multi-product onboarding platform.
19. Spinoff Tree: adjacent #60/#20/#45/#70 already cover migration/cleanup/support/entitlements.
20. Command Center Dependencies: project workspaces, data staging, customer/tenant isolation, entitlements, Agency, comms, evidence.
21. Design-Now Requirements: reversible customer-data migration and entitlement/account boundaries.
22. Build-Now Requirements: shared Foundry/import/Needs Me patterns after reverse-map.
23. Safe-to-Defer Requirements: external onboarding product/customer portals/pricing.
24. Autonomous Mature State: onboarding plans, checks, migration validation, guidance and risk monitoring run continuously; humans handle customer-specific/protected blockers.

## Saturation result

Additional branches are migration/support/entitlement components already represented.
