# 105 — Multi-Company / Multi-Brain Orchestration & Isolation

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION

## 1. Portfolio scale targets

Architecture must support 1, 5, 10, 25, 50, 100 and 100+ companies without assuming all are active or equally resourced. Scale is primarily logical isolation + asynchronous durable orchestration; expensive dedicated infrastructure is deferred until justified.

## 2. Hierarchy

`James Morgan → Command Center → Portfolio Category → Independent Company Project → Company Brain(s)/Deterministic Cores → Company Agents → Workers/Tools/Providers → Products/Customers`.

ARO remains a separate high-intelligence system. Command Center is leader/orchestrator, not the universal domain Brain.

## 3. Independent company boundary

Every company has separate:
- company/project identity and button;
- roadmap/version/authorized scope;
- Brain/Agent IDs and versions;
- customer/tenant namespace;
- databases/data stores or explicit isolated schemas/namespaces;
- memory/search/vector namespaces;
- object/artifact prefixes/buckets;
- repositories/environments/deployments;
- provider accounts/integration instances;
- credential/secret refs;
- domains/DNS/certificates;
- email/social/communication identities;
- billing/customer/subscription records;
- financial cost center/revenue ledger;
- logs/metrics/traces/incidents;
- support/customer records;
- privacy/retention/residency policies.

Shared ownership by James never implies shared runtime data.

## 4. Shared platform access

A shared service is consumed through a versioned contract with explicit `company_id`, `project_id`, tenant/customer scope where applicable, capability/action, data sensitivity/region, resource budget and correlation/evidence IDs. Shared services cannot use an implicit global company context.

## 5. Isolation levels

### Level A — Logical namespace
Appropriate for low-risk internal metadata: company key, RLS/owner/company constraints, separate indexes/partitions, cost center and audit.

### Level B — Isolated schema/store
For sensitive company/customer data, memory, vectors, documents, operational state and tenant data.

### Level C — Isolated account/environment
For provider credentials, external accounts, domains, communication identities, production environments, high-risk integrations and money surfaces.

### Level D — Dedicated infrastructure
Scale/high-risk/compliance trigger only: separate project/account/network/compute/storage/keys where measurable requirements justify it.

The company manifest declares required isolation level per resource class.

## 6. No-cascade rule

One company failure must not cascade portfolio-wide. Required mechanisms:
- per-company queues/concurrency ceilings;
- bulkheads/resource quotas;
- rate limits;
- circuit breakers;
- provider/account isolation;
- memory/data isolation;
- deployment isolation;
- incident containment;
- kill company / pause company controls;
- background work preemption;
- global safe mode that can stop execution without corrupting state.

## 7. Global scheduling

Portfolio scheduler input includes company priority, project priority, task priority, risk, SLA, resource need, cost budget, provider quota, region, active incidents and fairness debt.

Policy:
- owner/emergency/security/recovery work can preempt background optimization;
- no company monopolizes shared free-tier capacity indefinitely;
- paid capacity is never activated without authorization;
- fairness does not override urgent safety/recovery;
- queue pressure yields explicit delayed/backpressured state, never fake Working.

## 8. Global Resource Governor interface

Resources: CPU, RAM, GPU, disk/object storage, bandwidth, model tokens, inference calls, API calls, browser workers, queues, database connections, event throughput, scheduled jobs and external-provider quotas.

Per resource: hard ceiling, soft budget, reserved emergency capacity, current usage, forecast, priority weight, preemption class, backoff, provider reset window and runaway threshold.

## 9. Brain orchestration

Command Center may ask an independent company Brain for analysis/plans/results through a typed Brain protocol. It receives versioned outputs/evidence and cannot directly read the Brain's private memory store. Cross-company reasoning uses explicitly exported sanitized artifacts or shared capability metadata—not unrestricted memory federation.

## 10. Inter-company workflows

Default: prohibited.

If James later authorizes a cross-company connection, create an explicit Integration Contract containing source/destination companies, purpose, exact data/actions, fields, sensitivity, region, frequency, retention, customer consent/legal basis where relevant, authority, verification, revocation and audit. No transitive sharing.

## 11. Portfolio Operations Center

Per company display:
- project button/status/stage;
- Brain/Agent health;
- active jobs/queues;
- customers/usage if live;
- revenue/cost/margin truth states;
- model/API/compute usage;
- incidents/security/compliance;
- deployment version/health;
- automation percentage;
- human intervention rate;
- pending approvals/Needs Me;
- resource budget/pressure;
- isolation/region status.

Portfolio aggregates cannot leak customer-sensitive details and distinguish verified actuals from estimates.

## 12. Scaling stages

### 1–5 companies
Shared free-first platform with strong namespaces and isolated external accounts; low concurrency.

### 10–25
Dedicated per-company queues/budgets, stronger schema/store isolation, portfolio scheduler, central cost telemetry and incident bulkheads.

### 50–100
Automated capacity planning, weighted fairness, per-company Brain/Agent health, regional placement, partitioned telemetry, stronger provider quota management and disaster-recovery drills.

### 100+
Sharded/federated control/data planes where needed, dedicated infrastructure for high-risk/high-volume companies, hierarchical schedulers and regional control planes. Only activate when metrics justify it.

## 13. DESIGN NOW

- first-class `company_id` separate from project/customer/tenant IDs;
- navigation-only portfolio categories;
- company manifest/resource/isolation policy;
- company-aware RLS/data contracts;
- company context required in all shared service calls;
- per-company secrets/providers/accounts/domains/cost centers;
- queue/resource/budget scopes;
- cross-company sharing default deny;
- failure bulkheads and company kill switch;
- region/residency metadata;
- portfolio metrics truth model.

## 14. BUILD NOW

Refine Command Center project/provider/data/Agency/Brain contracts so company identity and isolation are first-class even though no future company is launched. Add a test dummy company pair proving data/memory/secret/tool/queue isolation and independent pause/kill.

## 15. BUILD BEFORE FIRST PORTFOLIO COMPANY

Customer tenancy, billing/entitlements, actual company environments/accounts/domains, company Brain deployment, isolated runtime data, production portfolio scheduler and Portfolio Operations Center.

## 16. Acceptance

Two dummy companies can coexist using shared platform services while attempts to cross-read data, memory, credentials, tools, customers, artifacts, logs or queues fail closed; one can be overloaded/paused/killed/recovered without changing the other's verified state.