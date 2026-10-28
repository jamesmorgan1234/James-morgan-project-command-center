# Category 12 — Specialist orchestration and interoperability acceptance

Status: **CERTIFIED COMPLETE — ISOLATED CATEGORY 12 FOUNDATION**.
This closes P12.1–P12.8 at the repository/isolated runtime/database boundary.
It is not production, deployment, provider, owner, physical-device or Category 15 acceptance.
No P13.1 implementation is included.

## Controlling authority and scope

- `roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md`, C12 phase list and C12 specialist-orchestration extensions.
- `20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT.md`, sections 19–26 (and PIF contracts retained from sections 4–7).
- `21_ECOSYSTEM_INTELLIGENCE_ROADMAP_RECONCILIATION_2026-10-25.md`, Category 12 distribution.
- `14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md`, P12.1–P12.8 original scopes and exit gates, retained and expanded by Roadmap 22.

The machine-readable, per-phase and expanded-requirement acceptance matrix is
`clean-room/evidence/category12-acceptance-matrix.json`. Each row names authority,
individual obligations, implementation, tests, database enforcement and later-category
ownership. `npm run gate:category12` validates all eight phase rows and all seven
expanded foundation rows, then actually executes every P12 test and the specialist,
PIF.3, PIF.4 and PIF.8 regression suites. It rejects missing evidence locations,
failed, cancelled or skipped tests. The matrix is not a replacement for executable proof.

## P12.1–P12.8 acceptance matrix

Paths below are relative to `clean-room/src/specialists` and `clean-room/tests`;
the JSON matrix carries full repository paths and all migration locations.

| Phase | Implemented requirement / exit evidence | Implementation | Executed tests | Status |
|---|---|---|---|---|
| P12.1 | Generic ownership, data/Brain/Agency/detail/metric/provider/isolation contracts; exact canonical PIF.3 reference; new type without core rewrite | `framework.ts`, `contracts.ts` | `p12-1-specialist-framework.test.mjs` | PASS |
| P12.2 | Shopping truth remains specialist-owned; offer/list/trip/rebate/provider/privacy semantics | `shopping.ts` | `p12-2-shopping-specialist.test.mjs` | PASS |
| P12.3 | Media ownership, rights/provenance, publishing authorization and provider/worker boundaries | `media.ts` | `p12-3-media-specialist.test.mjs` | PASS |
| P12.4 | Commerce contracts, no-loss economics and supplier/store/account isolation | `commerce.ts` | `p12-4-commerce-specialist.test.mjs` | PASS |
| P12.5 | Generic digital-product project/artifact/delivery/storefront/price/promotion/support/provider contracts and durable artifact evidence | `digital-products.ts` | `p12-5-digital-products-specialist.test.mjs` | PASS |
| P12.6 | Generic service pipeline, lead/estimate/contract/job/schedule/payment lineage and company isolation | `service-business.ts` | both `p12-6-*.test.mjs` files | PASS |
| P12.7 | Generic software domains, repository/provider ownership, exact deployment evidence and company/source history | `software-platform.ts` | both `p12-7-*.test.mjs` files | PASS |
| P12.8 | Local failure, canonical isolation, lifecycle/recovery/future registration plus all seven expanded foundations below | `lifecycle.ts`, `interoperability.ts`, `evolution.ts`; existing Brain/PIF owners | all `p12-8-*.test.mjs` files | PASS |

## Expanded P12.8 requirements: implementation and proof

| Authority | Requirement and implementation | Executable evidence / database | Result |
|---|---|---|---|
| AM20 §20; Roadmap 22 P12.8 | `SpecialistInteroperability.decide/skill` binds source/destination, owner/company/project, exact packet/promotion/model/method/capability versions, current PIF.4 validation/promotion, ontology, privacy, canonical evidence strength, applicability, evaluation evidence, risk-triggered shadow evidence, measurable acceptance criteria, rollback and monitoring/revalidation handoff. No global broadcast or source payload copying. | `p12-8-interoperability.test.mjs`: governed transfer, all incompatibility denials, private boundaries, C2 exact-digest approval and revocation. PostgreSQL decision adapter test executes immutable scoped audit persistence. | PASS |
| AM20 §19–20 | Existing PIF.8 `assessTransfer` is reused; recipient domain/company type/project/task/environment/provider-model/data/resource/dependency/tool/prerequisite/policy/operating constraints are checked. Current negative knowledge and local contraindications can reject transfer; alternatives remain local and no rejected transfer mutates a registry. | Runtime transfer matrix, private/local reuse and negative-knowledge tests; `pif8-negative-knowledge-transfer.test.mjs`; durable accepted/rejected decision history. | PASS |
| AM20 §23 | `inherit` emits only applicable validated method/capability/version/evidence metadata, bounded by the recipient's canonical authority ceiling. Private discoveries, actions, source payloads, unrelated project state and permissions are not copied or installed. | Positive inheritance, private-scope rejection, exact lineage, incompatibility, unchanged-state and replay tests. | PASS |
| AM20 §24; original P12.8 | Existing PIF.3 remains canonical model owner. `applySpecialistEvolution`, `commitSpecialistEvolution`, `SpecialistBrainRegistry.applyModelBatch` and existing lifecycle registry cover create/evolve/split/merge/suspend/retire plus project rename/dormant/reactivate/replace/archive. Need/nonduplication, ontology, scope, permission/budget, evaluation/fallback/retirement and C2 approval are required. Batches prevalidate all members; durable batches compare versions and append canonical PIF.3 history. Recovery never reactivates old authority. | Dynamic lifecycle, C2 lifecycle and rejected-batch/storage-failure tests; actual PostgreSQL model-batch rollback/history tests; actual lifecycle transition/version/identity/recovery tests. | PASS |
| AM20 §25 | `discoverSpecialistCollaboration` selects compatible scoped candidates deterministically. Composition identifies participants and task decomposition, pins contracts/versions, checks dependency DAG and input/output schema compatibility, preserves permission ceilings and evidence handoff, declares Command Center arbitration, verification, failure/cancellation and zero shared data. Rejected composition is atomic. | Discovery, valid composition, incompatible schemas, cycles/missing dependencies, permission/scope rejection and no-mutation tests. | PASS |
| AM20 §26 | `procedure` retains canonical method identity/version, distinct verified source runs, repeatability threshold, PIF.4 promotion, prerequisites, ordered step representation, decision points, failure handling, variation, verification, permissions, scope and rollback. Execution history alone is insufficient. | Procedure positive/negative/run-isolation tests, followed by compilation of the learned procedure representation. Procedure artifacts are immutable durable decision data. | PASS |
| AM20 §22; Roadmap 22 P12.8 | Version-1 compiler interoperability produces evidence-linked, scoped, versioned, expiring, testable and reversible procedure/inheritance/composition artifacts. It consumes PIF.1/2/3/4/8 contracts and validates the existing Agency `ScheduledTask`/DAG contract. Unsupported fields/constructs fail closed. Output tasks remain **blocked**, requiring fresh Agency/C2 admission; compilation is not authorization. Existing valid specialist contracts remain compatible. | Deterministic compile/roundtrip tests, unsupported construct/version/schema/authority rejection, old specialist suites, durable decision tests. | PASS |

## Durable enforcement and compatibility

- Existing PIF.3 canonical tables remain the sole specialist model owner. The new
  atomic batch RPC writes those tables and their version history; it does not
  introduce a competing identity/model registry.
- `20261028020000_p12_8_specialist_interoperability.sql`: immutable, owner/company/project-bound
  decision/artifact history, exact digest idempotency, nonexecutable artifacts,
  expiry/evidence checks. No ordinary client may read/mint these control-plane decisions.
- `20261028021000_p12_8_canonical_specialist_evolution.sql`: private service-only
  expected-version batch persistence and immutable canonical model history.
- `20261028022000_p12_8_lifecycle_transition_guards.sql`: protected lifecycle writes
  require the trusted server; history validates registration/version/time/identity,
  active/dormant transitions, live same-owner/type replacement targets and recovery
  non-resurrection. Current project projection updates atomically with history.
- The existing PIF.3 migration had one extra `text` argument in the registration
  function GRANT/REVOKE signatures. The two declarations now match the actual function.
  This minimal prerequisite was discovered by executing the real migration chain.
- The preceding canonical authorization repair is preserved:
  `assertIdentifierKind(reference, "evidence")`, strict no-surrounding-whitespace,
  `^evd_[a-z0-9]+(?:-[a-z0-9]+)*$`, exact action/scope/target checks and the
  `20261028010000` database constraints. No canonical evidence standard was replaced.
- `specialistC2Authorization` and `specialistEvolutionC2Authorization` reuse current
  C2 sessions/policies/owner-verified exact-intent grants and verified evidence.
  Low-level registries/stores remain trusted server primitives, not public issuers.
  A service-role connection is privileged and must never be provided to specialists or browsers.
- Persistence failure never returns an unaudited acceptance or mutates the model cache.
  A concurrent cache conflict after a durable commit requires canonical reload, not blind retry.
  Stored historical artifacts are not restored as grants; current authorization,
  promotion/evidence freshness and exact versions are rechecked before reuse.

All migration tests used free isolated PostgreSQL/PGlite with explicit mock auth
roles/dependency functions. They are not a production Supabase migration rehearsal.
No production migration or credential/account/provider operation occurred.

## Verification and certification boundary

The Category 12 gate and full repository build/test commands were actually executed.
The final normal-chat handoff records exact counts, commit/tree and observed CI
results, avoiding a self-referential commit hash in this file. Relevant commands:

- `npm run gate:category12` (module build plus complete Category 12/PIF regressions).
- `npm run typecheck`, `npm run check:architecture`, `npm run check:legacy`.
- `npm run audit:authority`, `npm run audit:repository`.
- `npm run build` (modules, browser and full test suite).
- `npm run audit:artifact`, exact-commit `npm run audit:release-candidate`.
- `git diff --check`.

Foundations above are complete; later owners retain their own work:

- C13: outcome effectiveness, calibration and cognitive/ecosystem health metrics,
  continuous outcome monitoring/analytics, advanced compiler synthesis/optimization.
  Category 12 supplies explicit criteria, provenance, monitoring obligations and
  expiring/revocable artifacts; it does not fabricate effectiveness measurements.
- C14: advanced intelligence-state recovery, migration, chaos/shadow and scale validation.
- C15: final requirement closure, integration/hardening, production/live verification,
  owner and physical Samsung acceptance. A P15-specific red gate is reported separately
  and cannot be represented as green or waived by Category 12 certification.

James Morgan retains final human authority. Command Center is the permanent top
Brain/control plane. Specialists, including ARO, remain subordinate. Useful intelligence
can be reused through governed scoped transfer; private context is not blindly generalized.
