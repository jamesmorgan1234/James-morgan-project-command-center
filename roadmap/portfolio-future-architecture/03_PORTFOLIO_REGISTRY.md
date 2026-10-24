# Portfolio Registry Design

**Status:** PLANNED / DESIGN NOW / 107+ OPEN-ENDED  
**Version:** `CC-PORTFOLIO-REGISTRY-v2.0.0`  
**Owner / final authority:** James Morgan

## Purpose

Provide one durable, versioned, queryable registry describing every future company without merging company state into Command Center core code or collapsing independent company projects into one portfolio record.

The registry is metadata/control-plane state. It does not itself create a company, grant authority, provision infrastructure, create customers, launch production, authorize spending, perform outreach, or accept payments.

## Open-ended cardinality invariant

Current identified top-level company families: `107`.

Permanent maximum: `NONE`.

The registry must support dynamic `N` companies without schema redesign, route redesign or identity renumbering.

Companies 001–107 are the current known portfolio. Company 108+ records may be added only after the applicable James Morgan approval gate is satisfied for actual company creation/build beyond authorized roadmap/design work.

## Canonical record

Each portfolio company record should contain:

- `company_id` — immutable stable ID;
- `primary_project_id` — stable Command Center project ID;
- `canonical_name`;
- aliases;
- purpose/mission;
- portfolio status (`planned`, `proposed_pending_owner_approval`, `authorized_for_build`, `building`, `internal_alpha`, `controlled_beta`, `production`, `paused`, `blocked`, `retired`, `superseded`);
- truth state (`PLANNED`, `ARCHITECTURALLY_SUPPORTED`, `IMPLEMENTED`, `VERIFIED`, `PRODUCTION`);
- stage;
- autonomy maturity level 0–5;
- roadmap version;
- roadmap conformance state;
- exhaustive-pass state for all 28 passes;
- dimension state for all A–BZ dimensions;
- roadmap progress numerator;
- roadmap progress denominator;
- independently computed roadmap progress percent;
- unresolved roadmap branches;
- saturation-test state;
- Brain IDs and versions;
- Brain architecture class;
- Brain capability/evaluation refs;
- domain/industry/policy/security/evaluation/tool/workflow/integration pack refs;
- Agent IDs/archetypes/versions;
- deterministic service IDs;
- project detail/page registry refs;
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
- proven-capability dependencies;
- company-specific capabilities;
- external-dependency internalization candidates;
- blast-radius classifications;
- pending approvals/Needs Me;
- incident refs;
- KPI/metric refs;
- architecture version;
- authorized scope;
- activation state;
- kill/safe-mode state;
- created/updated/effective timestamps;
- owner/source/provenance;
- supersession history.

## Stable IDs

Human-readable external keys may use:

- `company:future:001`
- `company:future:002`
- …
- `company:future:107`
- `company:future:108`
- and so on without an upper bound.

Primary project external keys may use:

- `project:company:future:001`
- `project:company:future:002`
- …
- `project:company:future:107`
- `project:company:future:108`
- and so on dynamically.

Implementation may use UUIDs plus stable external keys. The invariant is that IDs are immutable, not derived from mutable names, and not limited by a 100- or 107-company schema.

## Company-to-project invariant

Every canonical company has exactly one first-class `primary_project_id` once the company record is created in Command Center.

That primary project owns the company’s independent:

- project button;
- project route;
- project detail/pages;
- progress/percentage;
- roadmap state;
- checkpoints/evidence;
- Brain/Agent state;
- Needs Me/approval state;
- incident/dependency state;
- lifecycle/truth state.

A company may later have supporting projects, but those appear in a project relationship registry. Supporting projects may never replace or absorb the primary company project.

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

## Portfolio category

Initial organizational category reference:

`portfolio-category:future-digital-companies`

Display label should reflect the open-ended model, for example `Future Companies / 107+ Portfolio`, while the stable category ID remains independent of company count.

Category changes are presentation/navigation metadata only and must not modify `company_id`, `primary_project_id`, independent progress, page state, or company history.

## Roadmap conformance model

A company roadmap is not considered exhaustive because a file exists.

Registry conformance must support independent tracking of:

- all 28 exhaustive passes;
- every required A–BZ dimension;
- adversarial missing-idea findings;
- saturation-pass iterations;
- unresolved branches;
- evidence/checkpoint refs;
- reverse-map dependencies;
- final conformance verdict.

Recommended states:

- `not_started`
- `seeded`
- `mapping`
- `adversarial_review`
- `saturation_in_progress`
- `exhaustively_mapped`
- `needs_reconformance`
- `superseded`

A percentage may be shown only when the denominator is defined and traceable. Otherwise the registry must expose an unknown/N/A state rather than fabricate progress.

## Brain references

Registry must support:

- no brain;
- one full specialized brain;
- several specialized brains;
- shared Brain Factory template + company/domain pack;
- reusable Brain modules;
- deterministic/rules/optimizer system with no LLM brain;
- hybrid.

Fields must distinguish architecture intent from active production:

- `brain_architecture_class`;
- `brain_manifest_refs`;
- `brain_capability_tree_ref`;
- `brain_evaluation_suite_refs`;
- `brain_policy_refs`;
- `active_brain_version` optional;
- `brain_health` optional;
- `brain_activation_state`;
- `brain_compatibility_state`;
- `brain_shared_vs_company_specific_state`.

## Agent references

Track desired vs active independently per company:

- required agent archetypes;
- allowed agent roles;
- active Agent IDs;
- project lead/Project Agent identity;
- allowed autonomy ceiling;
- per-company concurrency quota;
- delegated authority ceilings;
- agent version/compatibility state;
- agent evaluation refs;
- agent incident refs.

## Project page/detail references

The registry must support company-specific project detail registration without hard-coding all companies into one shared page.

Each company may reference:

- overview page/section registry;
- roadmap page;
- products/features;
- customers/verticals;
- Brain pages;
- Agent/Agency pages;
- services/workflows;
- integrations/APIs;
- data/IP;
- economics;
- operations;
- security/privacy/compliance/legal;
- reliability/observability/incidents;
- testing/evaluation/deployment;
- scale/performance/cost;
- platform/marketplace/partners;
- accessibility/mobile/voice/multimodal;
- improvement/spinoff/cross-sell/bundling;
- failures/safe-mode/portability;
- Command Center dependencies/retrofit/reuse/versioning;
- checkpoints/evidence;
- approvals/Needs Me;
- domain-specific additional pages.

These references are independent per project even when they use shared page contracts/components.

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

## Proven capability / reuse fields

For each reusable dependency track:

- capability ID/version;
- company-specific fit evidence;
- proof maturity (`one_company`, `two_company_cross_proven`, `three_company_portfolio_proven`, `hardened_shared`);
- compatibility state;
- customization delta;
- blast radius;
- rollback strategy;
- required regression/security/performance tests;
- fallback/fork/build-new decision.

Shared capability does not mean shared private data.

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
- roadmap conformance state;
- progress percentage;
- autonomy level;
- Brain architecture;
- security/compliance class;
- shared component;
- proof maturity;
- provider;
- region;
- cost center;
- incident state;
- approval/Needs Me;
- revenue/cost when later available;
- project category.

## Activation / approval gates

A newly discovered Company 108+ concept may be roadmapped while in `proposed_pending_owner_approval`, but actual company creation/build beyond authorized roadmap/design work requires an explicit James Morgan approval record.

Moving any planned company to `authorized_for_build` or later requires an explicit owner decision record.

No planning/import operation may silently activate a company.

## Retirement/supersession

Retirement preserves:

- stable IDs;
- roadmaps;
- exhaustive-pass/dimension evidence;
- project history;
- financial/audit history;
- incidents;
- Brain/Agent lineage;
- data-retention/deletion obligations;
- portability/export references.

## DESIGN NOW

- dynamic N-company identity model;
- stable company/project identity link;
- versioned registry contract;
- independent project button/page/progress references;
- roadmap conformance tracking for 28 passes + A–BZ;
- company-scoped metadata/security/resource fields;
- provider-neutral refs;
- truth-state separation;
- approval/activation authority gate;
- category as presentation relation only;
- proof-maturity/reuse fields;
- open-ended Company 108+ support.

## BUILD BEFORE FIRST RELEVANT OPERATING COMPANY

- actual durable registry persistence;
- activation RPC/workflow;
- company/project creation transaction;
- project-button and project-detail registration;
- per-company progress computation/evidence links;
- registry UI/admin view;
- per-company resource/security baseline creation;
- export/backup/recovery.

## COMPANY-SPECIFIC LATER

- specific Brain/Agent/service/product/integration/customer/billing records for each company as that company is authorized and implemented.

## Acceptance criteria

1. Represent Companies 001–107 as 107 distinct company records with 107 distinct primary project IDs.
2. Add an approved Company 108 record without changing the schema.
3. Query one company and retrieve only its own progress/page/Brain/Agent/dependency metadata.
4. Compute portfolio rollups from individual company records rather than storing one authoritative aggregate in place of project truth.
5. Preserve independent roadmap conformance and percentage per company.
6. Fail closed on unauthorized cross-company sensitive data access.
7. Preserve identities and history through rename/category changes.
8. Verify no hard-coded `100` or `107` maximum controls registry capacity.
