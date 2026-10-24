# Portfolio Architecture — 100 First-Class Company Projects

**Status:** PLANNED / DESIGN ANALYSIS  
**Version:** `CC-PORTFOLIO-ARCH-v1.0.0`

## Architectural objective

Command Center must supervise an ecosystem in which each authorized future company is an independent project/system boundary while shared reusable infrastructure remains deduplicated behind explicit contracts.

The architecture must support growth from 1 to 100+ companies without turning Command Center into a monolithic company runtime or a universal brain.

## Hierarchy

`James Morgan → Command Center → Portfolio Category/Views → Individual Company Projects → Company Brain(s)/Domain Packs → Company Agents → Company Services/Workers/Tools → Products → Customers`

The portfolio/category layer is organizational and analytical. The project/company layers remain authoritative for state and execution.

## Core separation

### Command Center owns

- portfolio registry;
- project registry and navigation;
- global policy/authorization classes;
- cross-company resource governance;
- shared capability registry;
- shared Brain/Agent/Service registries;
- portfolio scheduling/prioritization;
- global security baseline;
- capacity/backpressure;
- portfolio observability;
- portfolio-level incident visibility;
- architecture/version/change control;
- approval/Needs Me routing;
- global cost and financial policy visibility.

### Individual company project owns

- company-specific mission/roadmap;
- company product tree;
- company-specific Brain/domain packs;
- company Agent organization;
- company data and customer boundaries;
- company integrations and credentials;
- company billing model and cost center;
- company deployments/environments;
- company incidents/security posture;
- company metrics/evidence/checkpoints;
- company approvals and authorization scope.

### Shared Platform owns reusable primitives

Examples: auth, tenant/org primitives, entitlement engine, billing-metering substrate, queue/event/workflow fabric, model gateway, storage/search abstractions, observability, support framework, CI/CD/evaluation harnesses, notification abstractions, secret-reference interfaces.

Shared does **not** mean shared mutable company data or shared credentials.

## First-class project identity rule

Each of the 100 companies maps to an independent Command Center project ID.

Project identity must survive:

- category changes;
- company rename;
- product expansion;
- Brain replacement;
- Agent replacement;
- repository migration;
- hosting/provider migration;
- billing-provider migration;
- legal-entity changes;
- reorganization of portfolio navigation.

Project identity must never be inferred solely from display name or category path.

## Organizational category model

A project may belong to one or more organizational views/tags, but one optional primary portfolio category may be used for navigation.

Proposed initial organizational category:

`portfolio-category:future-digital-companies`

Display label may be changed without project migration.

Category relations must not grant:

- data access;
- credential access;
- execution authority;
- billing authority;
- Brain memory access;
- customer access;
- deployment access;
- security-policy bypass.

## Company identity vs project identity

A company record and a project record are related but distinct:

- Project ID identifies the Command Center work/execution/roadmap unit.
- Company ID identifies the business/company conceptual entity.

For each canonical future company, the first authorized creation should establish exactly one **primary company project**. Future supporting projects may later exist (for migrations, major products, research, etc.) but they must reference the same company ID and never replace the primary-project lineage without an explicit owner decision.

## Portfolio views

Command Center should eventually provide:

- all-company grid/list;
- category view;
- health view;
- status/stage view;
- Brain-health view;
- Agent-health view;
- incident/risk view;
- budget/cost view;
- revenue/economic view;
- authorization/Needs Me view;
- capacity/quota view;
- dependency view;
- shared-component dependency view;
- deployment/release view;
- compliance/security view;
- autonomy-maturity view.

Every view derives from individual projects and registries rather than becoming another source of truth.

## Isolation domains

At minimum isolate by company/project:

- credentials/secrets;
- customer data;
- customer identity namespaces;
- memory;
- vector/search indexes where sensitive crossover is possible;
- databases or DB ownership scopes;
- object storage prefixes/buckets/namespaces;
- event streams/topics;
- queue namespaces;
- browser sessions;
- API keys/provider accounts;
- financial/billing records;
- domains/email/social identities;
- deployments/environments;
- audit logs and incident evidence;
- model/tool authorization envelopes.

## Shared-component admission rule

A component may be shared only if:

1. its interface is company-neutral;
2. company-scoped state is explicitly partitioned;
3. access is policy-enforced and auditable;
4. secret/customer data cannot cross boundaries by default;
5. one company failure cannot corrupt another;
6. capacity exhaustion can be bounded per company;
7. version/deprecation behavior is explicit;
8. migration away from the shared component is possible.

## Multi-company scheduling

Global scheduling must account for:

- owner priority;
- company/project priority;
- risk class;
- protected-action requirements;
- resource quotas;
- cost budgets;
- provider quotas;
- browser-worker limits;
- deadline/SLA class;
- incident/emergency priority;
- fairness/starvation prevention;
- background vs interactive work;
- company isolation;
- dependency readiness.

## Failure containment

A company-level failure must be containable without pausing all companies unless the shared substrate itself is compromised.

Containment primitives include:

- per-company circuit breaker;
- per-company safe mode;
- per-company queue pause;
- credential revoke/disable;
- deployment rollback;
- Brain/Agent disable;
- spend/cost halt;
- provider-route disable;
- network/tool restriction;
- incident escalation;
- evidence-preserving recovery.

## Scale stages

### 1–5 companies
Single shared control plane is acceptable if all company data/credentials/execution state are correctly partitioned.

### 10–25 companies
Require stronger quotas, per-company capacity accounting, standardized project templates, shared factory interfaces, registry-driven deployment/support/evaluation.

### 50 companies
Require durable fair scheduling, stronger portfolio observability, cost attribution, standardized Brain/Agent packaging, regional/provider abstractions, more automated incident containment.

### 100 companies
Require company-failure blast-radius controls, versioned factories, explicit shared-component dependency graph, portfolio-wide resource/financial governors, capacity forecasting, automated policy/evaluation enforcement, systematic deprecation/migration.

### 100+ companies
Require horizontal control-plane scaling, sharded/partitioned workload execution where justified, federation/region strategy, stronger tenant/company isolation verification, automated architecture conformance checks.

## DESIGN NOW implications

- first-class project/company/category identity split;
- registry-driven Brain/Agent/Service/provider architecture;
- company-scoped authorization context;
- company/project partition keys in shared services;
- secret-reference isolation;
- per-company cost/resource accounting hooks;
- versioned capability contracts;
- event/queue correlation with company/project identity;
- no company assumptions embedded in kernel code;
- kill/safe-mode boundaries at company level;
- portfolio aggregation as derived views only.

## Not BUILD NOW merely because this architecture exists

- customer billing systems;
- customer tenancy for companies not authorized;
- paid compute/GPU pools;
- production company deployment;
- domain/email/social provisioning;
- company-specific agents/brains/products;
- marketing/growth execution;
- customer support operations;
- financial-account/payment activation.
