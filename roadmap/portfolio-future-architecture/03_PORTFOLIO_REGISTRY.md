# Portfolio Registry Design

**Status:** PLANNED / DESIGN NOW  
**Version:** `CC-PORTFOLIO-REGISTRY-v1.0.0`

## Purpose

Provide one durable, versioned, queryable registry describing every future company without merging company state into Command Center core code.

The registry is metadata/control-plane state. It does not itself create a company, grant authority, provision infrastructure, create customers, or launch production.

## Canonical record

Each portfolio company record should contain:

- `company_id` — immutable stable ID;
- `primary_project_id` — stable Command Center project ID;
- `canonical_name`;
- aliases;
- purpose/mission;
- portfolio status (`planned`, `authorized_for_build`, `building`, `internal_alpha`, `controlled_beta`, `production`, `paused`, `blocked`, `retired`, `superseded`);
- truth state (`PLANNED`, `ARCHITECTURALLY_SUPPORTED`, `IMPLEMENTED`, `VERIFIED`, `PRODUCTION`);
- stage;
- autonomy maturity level 0–5;
- Brain IDs and versions;
- domain/industry/policy/security/evaluation/tool/workflow/integration pack refs;
- Agent IDs/archetypes/versions;
- deterministic service IDs;
- repositories;
- environments;
- domains;
- integrations;
- data-store refs;
- secret/credential references only;
- customer model;
- billing model;
- cost center;
- financial-governor policy ref;
- resource-governor policy ref;
- security classification;
- compliance classifications;
- data-sovereignty/residency classifications;
- dependencies;
- shared-component dependencies;
- pending approvals/Needs Me;
- incident refs;
- KPI/metric refs;
- roadmap version;
- architecture version;
- authorized scope;
- activation state;
- kill/safe-mode state;
- created/updated/effective timestamps;
- owner/source/provenance;
- supersession history.

## Stable IDs

Proposed human-readable canonical future IDs:

`company:future:001` through `company:future:100`

Primary projects:

`project:company:future:001` through `project:company:future:100`

These are design examples; implementation may use UUIDs plus stable external keys. The invariant is that IDs are immutable and not derived from mutable names.

## Registry boundaries

The registry must not contain:

- raw API secrets;
- raw customer PII;
- raw payment credentials;
- unrestricted Brain memory;
- private content payloads;
- arbitrary production logs;
- full deployment environment values.

Use references plus health/status metadata.

## Company-to-project invariant

Every canonical future company has exactly one `primary_project_id` once authorized/created.

A company may later have supporting projects, but those appear in a project relationship registry; the portfolio registry does not convert the company into a multi-project container.

## Portfolio category

Initial organizational category reference:

`portfolio-category:future-digital-companies`

This value is optional presentation metadata. Category changes must not modify `company_id` or `primary_project_id`.

## Brain references

Registry should support:

- no brain;
- one full specialized brain;
- several specialized brains;
- shared Brain Factory template + domain pack;
- deterministic/rules/optimizer system with no LLM brain;
- hybrid.

Fields should distinguish architecture intent from active production:

- `brain_architecture_class`;
- `brain_manifest_refs`;
- `active_brain_version` optional;
- `brain_health` optional;
- `brain_activation_state`.

## Agent references

Track desired vs active:

- required agent archetypes;
- allowed agent roles;
- active Agent IDs;
- project lead/Project Agent identity;
- allowed autonomy ceiling;
- per-company concurrency quota;
- delegated authority ceilings.

## Infrastructure references

Use provider-neutral references:

- repositories;
- deployments;
- regions;
- DBs/stores;
- object/vector/graph/search stores;
- queues/topics;
- browser-worker pools;
- model/provider routes;
- billing/payment providers;
- notification providers.

The registry must not force a single provider or shared account.

## Cost/economics references

Future fields:

- monthly fixed cost;
- variable cost categories;
- AI/model cost;
- compute/storage/network cost;
- API/provider cost;
- support cost;
- customer acquisition cost when later measured;
- revenue/MRR/ARR;
- gross/contribution margin;
- cost per customer/workflow/task;
- budget/alert/shutdown thresholds.

Planning may define fields; no spending or revenue claim is implied.

## Security/compliance fields

- data classification;
- customer-data sensitivity;
- credential class;
- financial-action class;
- regulated-data classes;
- jurisdiction exposure;
- required isolation tier;
- required audit retention;
- required security pack;
- required compliance packs;
- prohibited actions;
- incident severity thresholds.

## Versioning

Each registry mutation creates:

- new version;
- changed fields;
- reason;
- source/owner decision;
- effective timestamp;
- superseded version ref;
- impact assessment;
- whether architecture/build actions are required.

No in-place history destruction.

## Query views

Support derived views by:

- lifecycle/status;
- stage;
- priority;
- truth state;
- autonomy level;
- Brain architecture;
- security/compliance class;
- shared component;
- provider;
- region;
- cost center;
- incident state;
- approval/Needs Me;
- revenue/cost when later available;
- project category.

## Activation gates

Moving a planned company to `authorized_for_build` or later should eventually require an explicit owner decision record.

No planning/import operation may silently activate a company.

## Retirement/supersession

Retirement preserves:

- stable IDs;
- roadmaps;
- evidence;
- financial/audit history;
- incidents;
- Brain/Agent lineage;
- data-retention/deletion obligations;
- portability/export references.

## DESIGN NOW

- stable company/project identity link;
- versioned registry contract;
- company-scoped metadata/security/resource fields;
- provider-neutral refs;
- truth-state separation;
- activation authority gate;
- category as presentation relation only.

## BUILD BEFORE FIRST COMPANY

- actual durable registry persistence;
- activation RPC/workflow;
- company/project creation transaction;
- registry UI/admin view;
- per-company resource/security baseline creation;
- export/backup/recovery.

## COMPANY-SPECIFIC LATER

- specific Brain/Agent/service/product/integration/customer/billing records for each company.
