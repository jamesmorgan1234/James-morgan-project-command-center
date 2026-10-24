# First-Class Company Project & Category Model

**Status:** PLANNED / DESIGN NOW  
**Version:** `CC-PROJECT-CATEGORY-v1.0.0`

## Owner invariant

Every canonical future company is an independent Command Center project with its own project button. Organizational grouping may resemble Books, but must never collapse identity or authority.

## Stable identities

### Project

Required logical fields:

- `project_id` — immutable stable ID;
- `owner_id`;
- `project_type_key`;
- `company_id` when business/company-backed;
- `canonical_name`;
- `display_name`;
- `mission`;
- `lifecycle`;
- `verification_state`;
- `priority`;
- `version`;
- `created_at` / `updated_at`;
- `protected`;
- `agent_access_enabled`;
- `portfolio_auto_enabled`;
- `primary_category_id` optional;
- `authorized_scope_ref`;
- `current_checkpoint_ref`;
- `roadmap_ref`;
- `brain_ref` / `brain_pack_refs`;
- `project_agent_ref`;
- `security_classification`;
- `cost_center_ref`;
- `data_boundary_ref`;
- `deployment_boundary_ref`.

### Company

Required logical fields:

- `company_id` immutable;
- `canonical_name`;
- aliases;
- purpose;
- conceptual/business status;
- stage;
- `primary_project_id`;
- autonomy maturity;
- customer model;
- billing model;
- compliance/security class;
- roadmap version;
- authorized scope;
- activation state.

A company record may exist as `PLANNED` before a production business is launched. That does not authorize operations.

### Category / organizational container

Required logical fields:

- `category_id` immutable;
- `label` mutable;
- `description`;
- `parent_category_id` optional;
- `sort_order`;
- display/icon metadata;
- `archived`;
- no execution authority;
- no credential/data inheritance.

### Membership

`project_category_membership`

- project ID;
- category ID;
- relationship type (`primary`, `secondary`, `tagged`);
- sort order;
- effective date;
- provenance/owner-decision reference.

Changing membership may change navigation only; it must not rewrite project IDs or project history.

## Initial future-company navigation

Recommended initial structure:

- `Projects`
  - `Future Companies / 100-Company Portfolio`
    - Company 001 project button
    - Company 002 project button
    - …
    - Company 100 project button

The project screen itself must remain the normal Command Center project detail experience, not a special one-off portfolio page that bypasses standard project lifecycle machinery.

## Project button contract

Every authorized/created company project button should expose at minimum:

- canonical/display name;
- lifecycle/status;
- verification state;
- priority;
- progress when denominator is known, otherwise N/A;
- Brain health/status;
- Project Agent/Agency state;
- Needs Me count;
- blocker/incident indicator;
- last verified activity/checkpoint;
- cost/budget health indicator when later available;
- security/authorization warning when relevant.

Tapping/selecting opens the independent project detail route using stable `project_id`.

## Project detail contract

Every future company project inherits the standard Command Center project-detail architecture plus company-specific registered sections.

Core sections should include:

- mission/purpose;
- current state;
- roadmap;
- checkpoints/evidence;
- Next Up / Needs Me;
- Brain/domain intelligence;
- Agency/agents;
- products/services;
- integrations;
- data boundaries;
- security/compliance;
- deployment/environments;
- billing/economics when applicable;
- observability/incidents;
- autonomy maturity;
- dependencies/shared components;
- approvals/authorization;
- version/change history.

Company-specific sections register through project-type/detail-section contracts rather than hard-coded browser surgery.

## Search/filter behavior

Projects must be independently discoverable by:

- name/alias;
- company ID/project ID;
- category;
- lifecycle;
- priority;
- health;
- Brain/Agent state;
- incident/security state;
- autonomy level;
- stage;
- integration/provider dependency;
- Needs Me state;
- cost/budget state where applicable.

## Portfolio rollups

Portfolio/category totals are derived from individual projects:

- count by status/stage;
- health distribution;
- incidents;
- Needs Me;
- compute/model/API usage;
- costs/revenue/margin when later implemented;
- autonomy maturity;
- deployment state;
- Brain/Agent health;
- security/compliance posture.

Rollups do not become the source of truth for individual projects.

## Permissions

Category membership alone grants nothing.

Any user/agent/service authorization must resolve against:

- owner;
- project ID;
- company ID where required;
- action/resource;
- explicit scope;
- current security/risk policy;
- fresh authorization when protected.

## Isolation guarantees

A category query may enumerate project metadata authorized for the caller, but it must never implicitly join/expose:

- secrets;
- private Brain memory;
- customer records;
- financial transactions;
- credentials;
- raw incident evidence;
- private integration data;
- cross-company model context.

## Rename/reorganization guarantees

Renaming a company or moving it to another category must not rewrite:

- `project_id`;
- `company_id`;
- evidence/checkpoint identity;
- Agency run identity;
- Brain memory provenance;
- credentials;
- customer identity;
- deployment identity;
- billing history.

## Multi-project company future seam

Although the initial canonical rule is one primary project per company, architecture must permit later supporting projects linked to the same `company_id` without converting the primary project into an umbrella.

Examples: major product build, migration, acquisition integration, large research program, infrastructure modernization.

Supporting projects remain independent Command Center projects with explicit relationship types.

## Relationship types worth designing now

- `primary_company_project`;
- `supports`;
- `depends_on`;
- `supersedes`;
- `migrates`;
- `researches_for`;
- `product_of`;
- `shared_platform_for`;
- `integration_for`.

Relationships convey topology, not authorization.

## Retrofit risk if omitted

If project/category/company identity is conflated now, later support for 100 companies would require rewriting project URLs, registries, Agent scoping, Brain memory, permissions, audit evidence, UI navigation, queues, billing/cost allocation, observability, and deployment ownership.

Therefore the identity/category separation is DESIGN NOW and likely BUILD NOW once the portfolio reverse-map is approved into the active implementation plan.

## Acceptance criteria for eventual implementation

1. Create two company projects in the same category; verify distinct stable IDs/state.
2. Move one to another category; verify no project-state mutation except category membership/version evidence.
3. Rename category; verify no project identity changes.
4. Disable one company; verify the other remains functional.
5. Revoke one company credential; verify no cross-company impact.
6. Query portfolio rollup; verify derived values trace to individual projects.
7. Attempt category-based cross-company secret/data access; fail closed.
8. Remove/re-add category membership; preserve project history.
9. Add a supporting project under one company; preserve primary project identity.
10. Render every company as an independent project button using standard project route contracts.
