# Command Center — 100-Company Portfolio Future-Architecture Interlock

**Owner:** James Morgan  
**Authority:** `15_100_COMPANY_PORTFOLIO_BRAIN_FACTORY_FUTURE_ARCHITECTURE_MASTER_DIRECTIVE.md`  
**Status:** ACTIVE ROADMAP-PLANNING INTERLOCK — CURRENT BUILD PROGRESSION PAUSED  
**Implementation checkpoint held:** `caa57ecc8220655b50ee44ba065472ac91b2c8e0` on `build/spec-lock-v2-clean-room`  
**Last build position:** Category 7 close gate. Category 8 implementation must not begin until this interlock is reconciled.

## Controlling owner correction — first-class project identity

Every one of the 100 future companies is a **first-class Command Center project**.

Each company must have:

- its own stable project ID;
- its own project record;
- its own project button / project entry surface;
- its own project detail view;
- its own roadmap/version/checkpoint/evidence state;
- its own Brain/domain-pack references;
- its own Agent/Agency state;
- its own data/security/integration/billing/deployment/observability references;
- its own status, health, priorities, blockers, Needs Me state, approvals, incidents and authorization scope.

A portfolio umbrella/category may group the 100 for navigation exactly like the Books pattern, but the umbrella is **organizational only**. It must never replace, merge, flatten, or hide the independent project identity of any company.

Canonical analogy: the existing Books correction explicitly states that an umbrella/category is organizational only while each title remains its own project. The future-company portfolio must follow the same identity principle.

Recommended UI model:

`Projects → Future Companies / 100-Company Portfolio → [100 individual company project buttons]`

The grouping name is presentation metadata and may be changed later without rewriting project identity.

This is a **DESIGN NOW** requirement because the current `ProjectRecord` supports an optional `companyId` but does not yet expose an explicit organizational container/category relationship. The architecture must add grouping as metadata/relationship rather than modeling the portfolio as one giant project.

## Why this interlock exists

James’s 100-company directive materially expands the architectural foresight requirement. Command Center must be able to lead an isolated ecosystem of many specialized brains/companies without later reconstructing project identity, tenancy, registries, authorization, queues, Agency, Brain, billing, deployment, observability, recovery or resource governance.

The purpose is not to build the companies now. It is to discover which architectural contracts must exist now so the current Command Center build remains extensible and safe.

## Relationship to the existing 188-phase plan

The existing 188 implementation phases remain the numbered implementation baseline during this planning interlock.

Do not renumber phases prematurely.

After exhaustive portfolio mapping:

1. classify every discovered capability as DESIGN NOW / BUILD NOW / BUILD BEFORE FIRST COMPANY / COMPANY-SPECIFIC LATER / SCALE-ONLY / OPTIONAL;
2. reverse-map DESIGN NOW and BUILD NOW into Categories 0–15;
3. add or expand implementation phases only where genuinely necessary;
4. preserve existing phase IDs/lineage where possible;
5. record supersession/change history;
6. rerun roadmap dependency/security/recovery/QC;
7. resume implementation from the earliest architecture seam actually affected, not automatically from Category 8.

## Mandatory planning work packages

### PFA-1 — Authority/versioning/portfolio baseline
Lock the canonical 100, supersede earlier 65/90/partial portfolio directives, establish roadmap/architecture/company/brain/agent/capability versioning, decision log and change log, preserve Command Center/ARO/VeloClip/Coupon AutoPilot separation, and verify no company launch/spend/outreach authority is created.

### PFA-2 — First-class project model and portfolio grouping
Define each future company as an independent project. Add an organizational portfolio/category relationship that can group projects without changing their stable IDs, records, histories, checkpoints, authorization or Agency/Brain boundaries. Define project-button navigation, portfolio filtering/search, and group-level rollups without collapsing project identity.

### PFA-3 — Portfolio registry and strict isolation model
Design registry fields for company/project identity, aliases, purpose/status/stage, Brain/Agent/services/repos/environments/domains/integrations/data stores/secret refs/customer/billing/cost/KPIs/incidents/security/compliance/dependencies/approvals/roadmap/authorized scope. Model isolation of accounts, credentials, customers, DBs, memory, payments, email, domains, analytics, repos, branding, social identities, legal entities, infrastructure and IP.

### PFA-4 — Exhaustive company saturation program
Run the 26 mandatory passes and full A–BT dimensions for Companies 1–100. Each company ends with the mandatory 24-section completion block and saturation test.

### PFA-5 — Brain Factory and brain-vs-module architecture
Deduplicate domain intelligence into reusable Brain Factory contracts while determining whether each company needs a full brain, multiple brains, shared brain + domain pack, deterministic engine, rules/optimization service, agent set, or hybrid.

### PFA-6 — Agent Factory and deterministic-service split
Deduplicate agent roles; define purpose/tools/inputs/outputs/permissions/memory/state/limits/cost/evals/escalation. Separately catalogue work that should be deterministic code/workers/queues/cron/events/DB triggers/ETL/rules/stream/scheduler/cache/search/optimizers.

### PFA-7 — Shared Portfolio Platform
Map reusable identity/auth/MFA/SSO/RBAC/ABAC, tenants/orgs, entitlements, billing/metering, notifications, gateways, queues/schedulers/workflows/events, storage/search/cache, observability, support/docs/admin/developer portals, feature flags, CI/CD/QA/security/privacy, backup/DR/export/delete/audit/cost/unit economics.

### PFA-8 — Multi-company / multi-brain orchestration
Model 1, 5, 10, 25, 50, 100, and 100+ companies with durable async queues, priority/fairness, concurrency, backpressure, CPU/GPU/model/API/browser/memory/storage quotas, tenant/company/credential/secret/network/fault/deployment isolation, incident containment and emergency preemption.

### PFA-9 — Global governors and reusable factories
Design Resource Governor, Financial Governor, Security Governor, Policy/Authorization Governor, Billing Factory, Deployment Factory, Testing/Evaluation Factory, Customer Support Factory, Growth Factory and Company Creation Factory without activating future paid/external behavior.

### PFA-10 — Cross-company overlap, capability and integration registries
Create the deduplicated capability registry, integration registry, shared-component matrix, Brain capability matrix, shared-agent/service map, bundle/consolidation candidates and spinoff registry without auto-merging companies.

### PFA-11 — Retrofit-risk audit
For every significant future requirement determine whether deferral would force major reconstruction of project identity, DB, auth, queues, Brain, Agency, billing, deployment, integrations, secrets, audit, telemetry, tenancy or APIs. Mark DESIGN NOW whenever the foundation/interface must exist today.

### PFA-12 — Reverse-map into current Command Center
Produce the Command Center Future Capability Superset. Only DESIGN NOW and BUILD NOW requirements alter the current build. BUILD BEFORE FIRST COMPANY becomes an explicit pre-launch gate. Company-specific and scale-only work remains deferred.

### PFA-13 — Roadmap reconciliation and resume point
Update the canonical roadmap, dependency DAG, phase counts only if required, QC package and change/supersession record. Determine the earliest affected current build phase and resume from there.

## Required durable output family

At minimum: Master Index; Portfolio Architecture; Future Capability Superset; Brain Factory; Agent Factory; Shared Services; Multi-Company Orchestration; Multi-Brain Orchestration; Resource/Financial/Security/Policy Governance; Identity/Tenant Architecture; Data Governance; Billing/Deployment/Testing/Evaluation/Support/Growth Factories; Observability; Incident/DR; Portfolio/Capability/Integration/Brain/Agent Registries; Dependency Graph; Shared-Component Matrix; Brain Capability Matrix; Company Isolation Model; Retrofit-Risk Register; Design-Now/Build-Now/Build-Before-First-Company/Scale-Only registers; Spinoff Registry; and 100 individual exhaustive company roadmaps.

## Current implementation hold

Until PFA-1 through PFA-13 determine the correct retrofit-safe architecture:

- do not continue Category 8 implementation;
- do not launch/build any portfolio company;
- do not create production customer/company accounts;
- do not spend money or activate paid infrastructure;
- do not merge/deploy/promote production merely for this planning program.

Existing verified Command Center work remains preserved. The interlock changes future planning/architecture authority, not the truth of already verified branch implementation.
