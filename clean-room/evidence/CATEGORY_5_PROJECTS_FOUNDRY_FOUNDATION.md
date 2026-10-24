# Category 5 — Projects / Portfolio / Roadmap / Checkpoints / Foundry

Status: P5.1–P5.14 BRANCH IMPLEMENTED / EXACT-HEAD CORE QA VERIFIED / PRODUCTION MIGRATION NOT APPLIED

## Authority

- canonical roadmap: `roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md`
- canonical persistence substrate: Category 3 `command_center_canonical_entities` / version history
- protected-action substrate: Category 2 fresh, single-use authorization gate
- UI authority: Category 4 approved phone-first Projects / Active / Next Up / Project Detail system
- production/main remains protected
- production Supabase remains unmodified by this Category 5 branch work

## Important live-state reconciliation

Read-only Supabase inspection found two pre-existing project stores:

- `public.projects`: 19 rows at inspection time
- `public.cc7_projects`: 31 rows at inspection time

No trigger was found synchronizing those two legacy stores. The old browser runtime also read `cc7_projects`, while a separate legacy `project_lineage_events` table permitted mutable owner CRUD.

Category 5 therefore does **not** create a third independent project truth source. Its durable project profile is anchored to the Category 3 canonical entity/version system. Legacy production tables are treated as migration/source inputs until an explicitly authorized migration/reconciliation phase is performed later.

No live rows were copied, merged, deleted, or rewritten during this audit.

## P5.1 — Project registry and generic project contract

Migration:

`supabase/migrations/20261024130000_category5_project_registry.sql`

Adds durable owner-scoped:

- `command_center_project_types`
- `command_center_project_profiles`
- `command_center_project_capabilities`
- `command_center_project_authorizations`

The project profile references the Category 3 canonical project entity. Project types own domain playbook keys, default capabilities, and detail-section relationships. Creation requires explicit owner-decision evidence. Browser roles receive SELECT-only access; mutation is through narrow authenticated owner RPCs.

A new project type can register without editing core project-engine code.

## P5.2 — Project lineage, rename, merge, and supersession

Migration:

`supabase/migrations/20261024131000_category5_project_lineage.sql`

TypeScript:

`clean-room/src/projects/lineage.ts`

Durable lineage is append-only to browser roles and records:

- created
- renamed
- mission changed
- alias added
- merged
- superseded
- forked
- branched
- reactivated
- retired

Non-creation lineage changes require owner-decision evidence. Rename/mission/alias history is preserved rather than overwriting the historical record.

## P5.3 — Roadmap and work-unit engine

Migrations:

- `20261024132000_category5_roadmap_engine.sql`
- `20261024132100_category5_roadmap_verification_gate_fix.sql`
- `20261024132200_category5_roadmap_authoring_rpc.sql`

Durable structures include:

- versioned project roadmap
- project/category/phase/work-unit identifiers
- dependencies
- gates
- acceptance criteria
- applicability
- structured work status
- completion evidence
- structure verification
- denominator-trust evidence

Governed authoring supports roadmap start/version advance, gate evidence, work-unit authoring, integrity validation, finalization, readiness, and state transitions.

Readiness fails closed unless the roadmap is current and structure-verified and all referenced dependencies/gates are satisfied. Verification rechecks dependencies/gates; a working state cannot become an escape hatch around a later-invalidated gate.

## P5.4 — Checkpoints, resume, and boundary persistence

Migration:

`20261024133000_category5_project_checkpoints.sql`

Durable checkpoints include:

- roadmap version
- exact next work-unit ID
- blocker
- required environment
- owner action
- verification method
- evidence refs
- SHA-256 resume-state hash

The exact next work unit must exist in the referenced roadmap version. Browser roles cannot directly insert/update/delete checkpoint evidence.

## P5.5 — Truthful progress engine

Migration:

`20261024134000_category5_truthful_project_progress.sql`

Progress returns N/A unless the current roadmap denominator is explicitly trusted. When trusted, percentage is computed only from applicable verified/skipped work units. Scope expansion can therefore lower the displayed percentage without fabricating a static/fixed number.

The browser runtime now derives progress from this roadmap truth model rather than the prior legacy percentage metric.

## P5.6 — Projects screen

Runtime model:

`clean-room/src/runtime/project-screen.ts`

Browser:

`clean-room/src/runtime/browser.ts`

Styles:

`clean-room/public/project-system.css`

Projects now render from canonical Category 5 project profiles and support generic URL-driven:

- search
- lifecycle filter
- priority filter
- project-type filter
- company filter
- grouping by type/company/lifecycle/priority
- reset
- canonical total vs filtered count

Rows expose type/company/priority metadata without hard-coded project lists. Filtering/grouping logic is independent of any named project.

## P5.7 — Active / Live screen

The reusable selector and browser both require evidence-bearing live execution:

- working status
- claimed executor
- fresh heartbeat
- supporting evidence
- non-retired project lifecycle

Lifecycle/status alone is explicitly insufficient.

Read-only live schema inspection of `cc7_agent_runs` found no executor-claim or heartbeat fields. Therefore the current legacy production source cannot truthfully prove Active/Live under the P5.7 rule. The branch runtime deliberately leaves `liveExecution` unknown instead of calling a project live from project status.

The durable executor/claim/heartbeat source is a Category 7 Agency responsibility; Category 5 consumes that contract but does not fabricate it early.

## P5.8 — Next Up screen

Next Up requires a current structure-verified roadmap plus evidence-backed work-unit readiness. A loose `nextAction` string no longer qualifies a project.

The canonical runtime provider derives readiness from:

- applicable planned/ready work
- completed dependencies
- satisfied gates
- project priority
- persisted work-unit evidence

The browser sorts only verified-ready candidates.

## P5.9 — Project Details and project-room shell

Migration:

`20261024135000_category5_project_detail_registry.sql`

Runtime contract:

`RuntimeProjectDetailSection` in `clean-room/src/runtime/snapshot.ts`

Provider/browser consume:

- `command_center_project_detail_sections`
- `command_center_project_type_detail_sections`

A project type can bind new detail sections through the registry. Browser rendering loops registered sections generically; there is no project-type switch/case or DOM-injection path. Type-bound section content remains unknown/unavailable until a trusted source supplies it rather than being invented.

The locked Category 4 core Project Detail regions remain preserved.

## P5.10 — Project discovery and duplicate guard

Migration:

`20261024136000_category5_project_discovery.sql`

Durable evidence includes:

- project candidates
- duplicate/similarity signals
- source/evidence refs
- explicit owner disposition

Supported dispositions include ADD/MERGE/PARK/REJECT/RESEARCH plus keep-separate/ignore equivalents. Even an owner `merge` disposition does not itself mutate canonical project identity; the actual governed merge/lineage action remains a separate execution path.

## P5.11 — Project Foundry governed lifecycle

Migration:

`20261024137000_category5_foundry_lifecycle.sql`

Durable governed sequence:

`idea → research → ultimate_spec → architecture → roadmap → owner_authorization → agency_execution → evidence → acceptance`

Transitions are sequential and evidence-backed. `owner_authorization → agency_execution` must match the project’s stored `project-auth:agent-access` owner decision; a caller-supplied string alone cannot unlock execution.

The existing TypeScript Foundry model remains covered by the acceptance suite and preserves requirement/decision/artifact lineage end to end.

## P5.12 — Ultimate Spec and domain completeness compiler

Migrations:

- `20261024138000_category5_ultimate_spec.sql`
- `20261024138100_category5_spec_authoring_rpc.sql`

The durable compiler supports playbook-driven dimensions across functional/nonfunctional/security/privacy/data/operations/recovery/cost/monetization/maintenance/testing/accessibility/future-dormant/domain concerns, with explicit:

- evidence
- assumptions
- unknowns
- exclusions with reason
- future/dormant references

A playbook with no required dimensions cannot falsely report complete. Every applicable required dimension must be addressed or explicitly excluded with reason before the spec can become complete.

## P5.13 — Prototype, wireframe, and usability lane

Migration:

`20261024139000_category5_prototype_lane.sql`

Prototype artifacts must be canonical project assets. Protected design references must be protected and approved/locked canonical assets. Feedback preserves requirement/decision/evidence lineage.

Prototype feedback is evidence only: it does not silently mutate the spec, prototype implementation, or protected design. A feedback record that proposes changing protected design requires an owner-authorization reference and still does not perform the mutation itself.

## P5.14 — Project recovery, rescue, migration, and scale

Migrations:

- `20261024140000_category5_project_recovery.sql`
- `20261024140100_category5_recovery_protected_gate.sql`

Recovery plans preserve lineage/assets/decisions/checkpoint references across greenfield, clean rebuild, rescue, migration, modernization, reality reconstruction, archived revival, and retirement modes.

Archived revival requires explicit owner reactivation evidence. Retirement/revival lifecycle mutations atomically update canonical entity version, project profile, lineage, and recovery evidence.

The actual lifecycle mutation is a Category 2 critical protected action:

`project.recovery.lifecycle`

It requires and consumes one fresh, live-session-bound, single-use authorization. The earlier ungated RPC signature is explicitly revoked and dropped so there is no parallel bypass route.

## Runtime provider reconciliation

`clean-room/src/runtime/supabase-owner-provider.ts` no longer uses `cc7_projects` as the project truth source or fallback. It requires the new canonical Category 5 sources:

- project profiles
- current roadmaps
- work units
- roadmap gates
- durable checkpoints
- detail-section registry/bindings

If these branch migrations are not present live, the provider fails closed instead of silently returning legacy project truth as canonical P5 state.

Unrelated legacy sources such as Brain/Automation/Analytics remain independently readable until their later roadmap categories are migrated/reconciled.

## PWA / accessibility integration

Category 5 project controls use the same `--cc-tap` 48px minimum and focus-visible contract as Category 4.

`clean-room/public/project-system.css` is linked by the production shell and included in the service worker’s verified shell cache, so the new Projects controls do not create an offline stylesheet gap.

## Automated acceptance evidence

Important tests:

- `clean-room/tests/category5-project-registry-lineage.test.mjs`
- `clean-room/tests/category5-runtime-truth.test.mjs`
- `clean-room/tests/category5-durable-project-system.test.mjs`
- `clean-room/tests/category5-project-ui.test.mjs`
- `clean-room/tests/supabase-runtime-provider.test.mjs`
- existing `clean-room/tests/projects-foundation.test.mjs`

Latest exact-head code QA before this evidence-only update:

Workflow: `Spec Lock v2 Clean Room QA`

Run: #183

Run ID: `40107680890`

Head: `92ac09a57dae9b2eac3ce5981901003d0423c814`

Results:

- Typecheck: PASS
- repository/core QA and release gates: PASS
- PWA lifecycle: PASS
- final Category 15 nonproduction frozen-candidate gate: EXPECTED FAIL because Categories 2–5 intentionally changed runtime/schema after the previous frozen release candidate

The Category 15 gate has not been weakened or falsified.

## Production/live boundary

All Category 5 SQL listed above is **branch-only** at this checkpoint. This evidence does not claim:

- Category 5 migrations are applied to production
- legacy `projects` / `cc7_projects` rows are already reconciled into the new canonical profile model
- a live Category 7 executor heartbeat exists
- owner/device/production acceptance has occurred

No production merge, deployment, Supabase mutation, secret/provider mutation, paid action, Edge Finder change, or protected icon replacement occurred in Category 5.

## Category 5 branch gate

P5.1–P5.14 are implemented on the isolated branch and the exact-head core/PWA acceptance suite is green. Remaining live data migration, executor heartbeat integration, final deployment, and physical/device acceptance belong to later authorized roadmap/release gates and are not fabricated here.
