# Company Isolation Model

**Status:** PLANNED / DESIGN NOW  
**Version:** `CC-COMPANY-ISOLATION-v1.0.0`

## Principle

A shared Command Center control plane must never imply shared company trust, credentials, customers, memory, finances, branding, repositories, environments, or legal authority.

Each company is an independent security and operational boundary unless James explicitly authorizes a specific connection.

## Isolation dimensions

### Identity

Separate:

- company ID;
- project ID;
- customer organizations/users;
- machine/agent identities;
- service accounts;
- OAuth apps/clients;
- deployment/service identities.

Cross-company identity mapping requires explicit relationship/provenance and must never be inferred from common owner alone.

### Credentials/secrets

Per-company namespace/reference ownership for:

- API keys;
- OAuth tokens;
- DB credentials;
- cloud credentials;
- webhook secrets;
- signing keys;
- certificates;
- payment-provider credentials;
- email/SMS/voice provider credentials;
- agent/tool credentials.

Shared secret stores may be used only with hard company/project partitioning and least-privilege access.

### Data

Company-scoped ownership for:

- customer records;
- product data;
- analytics;
- support data;
- Brain memory;
- embeddings/vector data;
- knowledge bases;
- documents/assets;
- financial/billing records;
- audit/incident evidence;
- model/tool interaction logs;
- workflow state.

### Compute/runtime

Company-scoped limits and labels for:

- workers;
- browser sessions;
- queues;
- cron/scheduled work;
- model calls;
- GPU/CPU/RAM;
- storage;
- bandwidth;
- event streams;
- rate limits.

### Network

Design seam for:

- service/network identities;
- outbound domain allowlists;
- inbound endpoints;
- regional routing;
- private networks;
- egress controls;
- per-company webhook endpoints;
- cross-company service calls through authenticated contracts only.

### Repositories/code

Company-specific code may use shared packages/templates, but company repos remain distinct where operational separation benefits security/deployment/ownership.

Shared code updates must be versioned dependencies, not direct cross-company editing.

### Deployment/environments

Each company eventually needs explicit:

- dev/test/staging/prod environment identity;
- deployment target refs;
- config/secrets namespace;
- release/version chain;
- rollback state;
- health/incident state.

One company rollout must not implicitly deploy another.

### Financial/billing

Separate company cost centers and future revenue/billing ledgers. Shared payment infrastructure may exist only through deterministic tenant/company attribution and scoped credentials.

No company may spend another company’s budget because they share Command Center ownership.

### Communications/brand

Separate:

- domains;
- email identities;
- social accounts;
- sender reputation;
- brand assets;
- customer messaging rules;
- support channels.

### Legal/compliance

Separate legal-entity/classification/contract/jurisdiction/regulatory records. Shared compliance tooling may aggregate evidence but cannot blur legal obligations.

## Brain isolation

A company Brain may consume:

- company-scoped canonical knowledge;
- explicitly shared portfolio knowledge packs;
- approved cross-company benchmark/aggregate data where privacy permits;
- public/external knowledge.

It may not silently consume:

- another company’s customer memory;
- private credentials;
- confidential product strategy;
- raw support conversations;
- financial transactions;
- private analytics;
- private Agent memory.

Cross-company learning must use explicit sanitized/aggregated/approved artifacts with provenance and policy.

## Agent isolation

Every agent assignment carries:

- company ID;
- project ID;
- task/run ID;
- allowed capabilities;
- allowed tools;
- credential references;
- data scope;
- budget/cost ceiling;
- time/expiry;
- risk class;
- protected-action policy;
- evidence/checkpoint refs.

No worker may change company context mid-run without a new assignment/authorization envelope.

## Shared service isolation contract

Every shared service must receive explicit company/project context and enforce it at storage/action boundaries.

Required tests:

1. cross-company reads fail;
2. cross-company writes fail;
3. wrong-company credential use fails;
4. wrong-company queue claim fails;
5. wrong-company Brain memory retrieval fails;
6. cross-company asset IDs cannot be dereferenced without policy;
7. incidents remain scoped;
8. cost/resource usage is attributable;
9. one company disable/safe-mode does not stop unrelated companies;
10. one company corrupt input cannot poison global shared state.

## Shared-data exceptions

Allowed only through explicit classes:

- public data;
- owner-approved common templates;
- shared deterministic code packages;
- shared policy/security baseline;
- anonymized/aggregated benchmark data;
- reusable domain packs that contain no customer/company secrets;
- global provider metadata/health;
- global capability definitions.

Each exception needs provenance and a classification stating why sharing is safe.

## Incident containment

Containment levels:

- task;
- agent/worker;
- Brain;
- project;
- company;
- shared service;
- portfolio/global.

Default response should use the smallest blast radius that safely contains the incident.

## Kill switches

Design for:

- kill task;
- kill run;
- disable agent;
- disable Brain;
- pause project;
- pause company;
- block integration/provider;
- block outbound communications;
- block financial/protected actions;
- safe-mode company;
- global emergency stop for compromised shared substrate.

## Cross-company dependencies

Dependencies are explicit graph edges such as:

- shared platform dependency;
- data product dependency;
- API dependency;
- authorized service dependency;
- shared package dependency;
- contract/partner dependency.

A dependency never implies raw DB or credential access.

## Retrofit risk

Failure to design company isolation now would later require re-keying/shared-table redesign, queue/routing rewrites, secret migration, Brain memory reindexing, deployment separation, audit reconstruction, and potentially customer data remediation.

Therefore company/project partition context is DESIGN NOW even where physical dedicated infrastructure remains SCALE-ONLY.

## Scale tiers

### Micro / 1–5 companies
Logical isolation in shared free-tier infrastructure may be adequate if policy/RLS/namespace tests are strong.

### 10–25
Require quotas, cost attribution, automated isolation tests and stricter provider/account mapping.

### 50
Consider dedicated stores/queues/providers for high-risk/high-volume companies; automated blast-radius maps mandatory.

### 100+
Support federated/sharded control and data planes, regional sovereignty, isolated execution pools and company-specific provider/risk tiers where justified.
