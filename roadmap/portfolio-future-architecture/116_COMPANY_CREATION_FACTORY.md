# 116 — Company Creation Factory

**Status:** DESIGN NOW / BUILD-BEFORE-FIRST-COMPANY / NO COMPANY CREATION AUTHORIZED BY THIS FILE

## Intended future flow

`JAMES AUTHORIZES COMPANY → COMMAND CENTER LOADS APPROVED ROADMAP → CREATES FIRST-CLASS COMPANY PROJECT → ALLOCATES ISOLATED COMPANY ID/DATA/ACCOUNT BOUNDARIES → SELECTS PRODUCT TEMPLATE → SELECTS BRAIN FACTORY TEMPLATE → ATTACHES DOMAIN/POLICY/SECURITY/EVAL/TOOL/WORKFLOW/INTEGRATION PACKS → FORMS AGENT ORGANIZATION → BUILDS → TESTS → SECURITY/PRIVACY/COST CHECK → OWNER/POLICY GATES → DEPLOYS → MONITORS → OPERATES → IMPROVES`.

This is a future capability; none of the 100 companies are authorized to enter this flow now.

## Required company manifest

- stable company/project IDs and canonical name/aliases;
- purpose/mission/product class;
- owner and lifecycle/status/stage;
- authorized scope and owner decision reference;
- roadmap/spec version;
- company category/navigation placement;
- required Brain type/package/version;
- Agent pack IDs;
- deterministic service dependencies;
- shared service dependencies;
- customer/tenancy model;
- data/security/privacy/residency classes;
- repositories/build/deployment environment requirements;
- provider/integration refs;
- secret namespace;
- domain/communication/brand identities;
- billing/entitlement model;
- cost center/resource budget;
- KPIs/evaluations;
- support/incident/recovery policy;
- legal/compliance classification;
- pending owner approvals;
- decommission/export plan.

## Creation phases

1. **Authorization intake** — exact owner scope; no inferred project creation.
2. **Roadmap/spec validation** — company roadmap saturated and current.
3. **Identity allocation** — company and first-class project IDs/button.
4. **Isolation plan** — data/store/accounts/secrets/domains/providers/resources.
5. **Architecture assembly** — shared services + company-specific modules.
6. **Brain/Agent assembly** — only if justified by company analysis.
7. **Deterministic core implementation** — authoritative calculations/rules/workflows.
8. **Product build** — isolated repo/environment.
9. **Testing/evaluation** — company test/eval packs.
10. **Security/privacy/compliance** — mandatory gates.
11. **Financial/resource check** — free-first, budget, cost model.
12. **Launch-readiness evidence** — no live launch implied.
13. **Owner/protected launch authorization** — separate future decision.
14. **Controlled deployment** — canary/rollback.
15. **Operations** — health/support/billing/resource/incident telemetry.
16. **Autonomy graduation** — Level 0→5 only by evidence and policy.
17. **Retirement/spinoff** — export/deletion/archive and dependency cleanup.

## Templates vs cloning

Factory produces manifests/code/config from versioned templates and registries. It must never clone another company's runtime data, credentials, customer records, memory or provider accounts. Shared code remains parameterized and versioned.

## First-class project/button invariant

Creation creates exactly one primary independent Command Center project for the company. Optional subprojects may later exist, but the company cannot be represented only as a category row. Portfolio category is navigation-only.

## Guardrails

- owner-authorized creation only;
- $0/free-first until explicit spend approval;
- no automatic legal entity/domain/account/financial setup;
- no customer acquisition or public launch from factory itself;
- every external side effect separately protected;
- no cross-company credential/data reuse;
- no Brain unless domain actually benefits from one;
- deterministic service preferred where AI is unnecessary.

## DESIGN NOW
Company manifest schema, project/category relationship, isolation policy, pack/template interfaces, lifecycle states, factory workflow, decommission contract and creation authorization class.

## BUILD NOW
Implement only the generic manifest/registry/project-isolation/factory interfaces needed to prove future extensibility. A synthetic dummy company may be created in tests only.

## BUILD BEFORE FIRST COMPANY
Real company provisioning orchestrator, environment/repo/data-plane templates, Brain/Agent package assembly, billing/tenancy/support templates and portfolio operations binding.

## Acceptance
A dummy company can be generated entirely in test mode as its own project/button with unique identities/namespaces, reusable Brain/Agent/service manifests, test/evaluation/deployment plans and clean uninstall—without creating any external account, domain, paid resource or customer record.