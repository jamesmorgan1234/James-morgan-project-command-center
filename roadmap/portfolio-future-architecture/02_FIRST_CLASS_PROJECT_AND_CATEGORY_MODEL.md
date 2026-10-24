# First-Class Company Project & Category Model

**Status:** PLANNED / DESIGN NOW / CANONICAL 107+ CONFORMANCE REQUIRED  
**Version:** `CC-PROJECT-CATEGORY-v2.0.0`  
**Owner / final authority:** James Morgan

## Owner invariant — absolute

Every canonical company is an independent first-class Command Center project.

Every one of Companies 001–107, and every later approved Company 108+, must have its own:

- immutable company identity;
- immutable primary project identity;
- project button;
- independent project route/detail experience;
- independent percentage/progress calculation;
- independent roadmap;
- independent pages/sections;
- independent checkpoints/evidence;
- independent Brain state;
- independent Agent/Agency state;
- independent service/integration state;
- independent Needs Me/approval state;
- independent blockers/incidents;
- independent dependency graph;
- independent security/compliance posture;
- independent lifecycle/truth state;
- independent version/change history;
- independent data, credential, deployment and authorization boundaries.

A portfolio/category may organize the projects for navigation and rollups only. It may never replace the 107+ project buttons, merge project identities, substitute one generic “portfolio project” for the individual companies, or make one company’s percentage/pages/state stand in for another company.

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
- `truth_state`;
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
- `roadmap_version`;
- `roadmap_conformance_state`;
- `roadmap_progress_numerator`;
- `roadmap_progress_denominator`;
- `roadmap_progress_percent`;
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
- roadmap conformance state;
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

## Canonical future-company navigation

Required logical structure:

- `Projects`
  - `Future Companies / 107+ Open-Ended Portfolio`
    - Company 001 project button
    - Company 002 project button
    - …
    - Company 107 project button
    - approved future Company 108+ project buttons appended dynamically

This container is navigation only.

There must never be an architectural assumption that the list ends at 107.

The project screen for each company must remain the standard Command Center project-detail experience, extended through registered company-specific sections. It must not be a special one-off portfolio page that bypasses normal project lifecycle, progress, Brain, Agent, checkpoint, authorization or incident machinery.

## Project button contract — one button per company

Every Company 001–107 must eventually render as its own project button. Every later approved company receives the same treatment.

Each project button must expose at minimum:

- canonical/display name;
- company/project identity;
- lifecycle/status;
- truth/verification state;
- priority;
- **independent project completion percentage** when a valid denominator exists;
- roadmap conformance indicator;
- Brain health/status;
- Project Agent/Agency state;
- Needs Me count;
- blocker/incident indicator;
- last verified activity/checkpoint;
- current phase / next milestone;
- cost/budget health indicator when later available;
- security/compliance/authorization warnings when relevant.

Tapping/selecting a company button opens that company’s independent project detail route using stable `project_id`.

No company project button may route to a shared generic detail page whose state is not scoped to that specific project.

## Independent progress / percentage contract

Every company must own its own progress model.

A company’s percentage must never be copied from:

- the portfolio average;
- another company;
- an arbitrary manually entered number;
- a raw task count that ignores roadmap requirements;
- the mere existence of a roadmap file.

For the future-company planning program, the roadmap percentage denominator must be traceable to the canonical acceptance standard, including:

- all 28 exhaustive passes;
- all required A–BZ dimensions;
- required Brain/Agent/service/integration/economics/security/scale branches;
- adversarial missing-idea review;
- saturation completion;
- required reverse-map outputs and project dependencies where applicable.

The UI may show summarized progress, but evidence must be drillable to the underlying roadmap items/checkpoints.

If a trustworthy denominator does not yet exist, display `N/A` or an explicit unknown/incomplete state rather than a fabricated percentage.

## Project detail / page contract

Every company project inherits the standard Command Center project-detail architecture plus company-specific registered pages/sections.

At minimum each company must be able to represent, either as distinct pages or stable registered detail sections where appropriate:

1. Overview / mission / business identity
2. Current state / truth state / lifecycle
3. Completion percentage / roadmap conformance
4. Roadmap / phased build plan
5. Products / feature tree
6. Customers / verticals / market segments
7. Brain / domain intelligence / capability tree
8. Brain architecture / evaluations / versioning
9. Agents / Agency / autonomy boundaries
10. Deterministic services
11. Inputs / outputs / workflows
12. Integrations / external dependencies
13. APIs / developer ecosystem
14. Data architecture / data moat / IP
15. Monetization / packaging / distribution
16. Acquisition / customer lifecycle / support / success
17. Operations / administration
18. Security / privacy / compliance / legal
19. Abuse / misuse controls
20. Reliability / observability / incidents / recovery
21. Testing / evaluation / deployment
22. Scale / performance / cost / financial metrics
23. Moat / network effects / platform / marketplace
24. White label / OEM / partners / training / community
25. Accessibility / mobile / voice / multimodal
26. Experimentation / continuous improvement
27. Spinoffs / cross-sell / bundling
28. Failures / edge cases / safe mode / exit-portability
29. Command Center dependencies / retrofit risk
30. Reuse candidates / proven capability dependencies
31. Company-specific capabilities
32. External dependencies to internalize
33. Blast-radius requirements
34. Version / compatibility requirements
35. Checkpoints / evidence / audit history
36. Next Up / Needs Me / approvals
37. Dependencies / shared components
38. Environments / deployments when later authorized
39. Billing/economics when later applicable
40. Version / change history

This is a minimum representational contract, not a ceiling. If a company’s exhaustive roadmap requires additional domain-specific pages, those pages must be registerable without rebuilding the Command Center project shell.

## A–BZ roadmap representation rule

The UI/data model must be capable of representing every canonical A–BZ dimension for each company independently. A dimension may be summarized into a logical project page, but the underlying roadmap/evidence model must preserve its independent state, findings, completion evidence, unresolved issues and version history.

No A–BZ dimension may disappear merely because several dimensions share a visible page.

## Brain representation rule

Each company must independently show whether its intelligence architecture is:

- full specialized Brain;
- Brain Factory base + domain pack;
- multiple specialized brains;
- reusable Brain modules;
- deterministic/rules/optimizer systems with no LLM brain;
- hybrid.

Brain status must distinguish planned architecture from implemented/verified/production state.

Every company Brain representation must support:

- capability tree;
- knowledge/domain packs;
- memory/provenance boundaries;
- tools/integrations;
- planning/reasoning/optimization responsibilities;
- evaluation suites;
- safety/policy boundaries;
- version/compatibility state;
- failure/degradation state;
- shared-vs-company-specific classification.

## Search/filter behavior

Projects must be independently discoverable by:

- name/alias;
- company ID/project ID;
- category;
- lifecycle;
- priority;
- percentage/conformance state;
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
- roadmap conformance distribution;
- progress distribution;
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

A portfolio percentage, if later displayed, must be explicitly defined as an aggregate and must never replace the 107+ individual percentages.

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
- progress evidence;
- evidence/checkpoint identity;
- Agency run identity;
- Brain memory provenance;
- credentials;
- customer identity;
- deployment identity;
- billing history.

## Multi-project company future seam

The canonical rule is one primary company project per company. Architecture must also permit later supporting projects linked to the same `company_id` without converting the primary company project into an umbrella that loses its own first-class state.

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

If project/category/company identity, progress or pages are conflated now, later support for 107+ companies would require rewriting project URLs, registries, percentages, roadmap state, Agent scoping, Brain memory, permissions, audit evidence, UI navigation, page routing, queues, billing/cost allocation, observability and deployment ownership.

Therefore this separation is DESIGN NOW and must be reverse-mapped into the earliest current Command Center build phase that owns project identity, routing, progress calculation, detail surfaces or registry contracts.

## Acceptance criteria for eventual implementation

1. Render Companies 001–107 as 107 independent company project buttons.
2. Verify every button resolves to a distinct immutable `project_id` and `company_id`.
3. Verify every company can show its own independently computed percentage/conformance state.
4. Verify every percentage traces to evidence and never fabricates completion.
5. Open two company project buttons and verify their detail/page state is independently scoped.
6. Verify all A–BZ roadmap dimensions can be represented and traced independently per company.
7. Verify company-specific pages can be registered without changing the shared project shell.
8. Move one company to another category; verify no project-state mutation except category membership/version evidence.
9. Rename a category; verify no project identity changes.
10. Disable one company; verify all other companies remain functional.
11. Revoke one company credential; verify no cross-company impact.
12. Query portfolio rollup; verify derived values trace to individual projects.
13. Attempt category-based cross-company secret/data access; fail closed.
14. Remove/re-add category membership; preserve project history.
15. Add a supporting project under one company; preserve primary project identity.
16. Add an approved Company 108 without schema, routing or navigation redesign.
17. Confirm no hard-coded 107 maximum exists in the registry, route model, page model, button model or progress model.
18. Confirm portfolio/category pages supplement but never replace the individual company projects.
