# Category 13 — Analytics / Observability / Recommendations / Self-Audit

Status: **CERTIFIED COMPLETE — ISOLATED CATEGORY 13 ANALYTICS**.
P13.1–P13.10 are PASS at the repository/isolated runtime/database boundary.
This is not production, provider/live, owner, physical-device, Category 14 or Category 15 acceptance.

## Authority and executable acceptance

Controlling sources under `roadmap/master-build-plan-owner-review`:

- `22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md`, all ten C13 phase definitions and C13 distributed intelligence extensions.
- `14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md`, retained P13.1–P13.10 scope and exit gates.
- `20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT.md`, particularly §§11, 16–22, 26, 30–35, 38–41.
- `21_ECOSYSTEM_INTELLIGENCE_ROADMAP_RECONCILIATION_2026-10-25.md`, Category 13 distribution.

`category13-acceptance-matrix.json` contains all ten phases, their exact source-line
citations, detailed obligations, implementation, migration and test paths, gate,
status and deliberate later-category exclusions. It supersedes older partial
Category 13 receipts as the current acceptance register without changing roadmap authority.

`npm run gate:category13` builds modules, validates every phase/citation/evidence
location and executes all new P13 tests, existing Category 13 tests, analytics
foundation and relevant PIF.7/8/9 regressions. Missing phases, non-PASS rows,
missing files, failed/skipped/cancelled mandatory tests fail the gate. Its
`--validate-only` mode explicitly reports `STRUCTURE_ONLY_NOT_CERTIFICATION`;
structural validation cannot claim runtime acceptance. The gate itself has
adversarial tests for false/missing acceptance rows and citations.

## Per-phase results

All implementation paths below are under `clean-room/src/analytics`; all named
P13 tests are under `clean-room/tests`. The JSON matrix provides full paths.

| Phase / authoritative exit | Implementation and observed proof | Status |
|---|---|---|
| P13.1: No number without meaning/source/freshness; add calibration/ecosystem health | Existing `MetricRegistry` now retains immutable exact versions and declared semantics, units, formula, aggregation, ranges, windows, event/processing time, applicability, lifecycle/supersession and dependencies. Observation validation distinguishes known zero, unknown, absent, N/A, deleted, stale and conflicting values. Unit/window/version/scope/benchmark mixing and identity collisions reject. Historical recalculation pins the old formula; `semanticMetricView` exposes stale history with null current value. Fourteen ecosystem-health definitions register semantics only, never observations. `p13-1-semantic-metrics`, health and calibration tests execute positive/negative cases. | PASS |
| P13.2: End-to-end privacy-safe cross-system trace | `ScopedAnalyticsTrace` extends the existing governed PIF.9 owner with exact-version correlation/parent links through request, context, policy, router, specialist, method, tool/provider, evidence, verifier, state, outcome, learning/promotion, transfer, procedure, rollback and metrics. Only allowlisted metadata is retained; no payload/message/credential logging. Parent scope/version/time, idempotency and retention are checked. Durable SQL rechecks parent identity and scope. Existing consent/redaction instrumentation is preserved. | PASS |
| P13.3: Identify measured failure domains, not generic red/false healthy | Scoped reliability separates observed, estimated and unknown signals, dependency versions, freshness/revalidation and SLO candidate references. Existing drift classification now covers ontology/architecture/configuration/specialist/capability/transfer as well as provider/model/method/data/policy/evaluator. Health calculations preserve absent/zero-denominator uncertainty. Calibration measures actual supplied predictions/outcomes, not invented intelligence scores. | PASS |
| P13.4: Evidence-backed progress, distinct from Agency work | `evidencePortfolio` reuses canonical requirement-closure validation, checks current scoped evidence and canonical dependencies, and requires a verified denominator. Outputs include project versus Agency progress, cycle/block/owner-wait time, deduplicated intervals, throughput window, blockers/dependencies, milestones, risks and unknown resource capacity. Portfolio rollups authorize each underlying scope and expose metadata only. | PASS |
| P13.5: Evaluate workers/routing without task-content leakage | Scoped Agency telemetry handles worker/lead state, utilization, claims, queues/age, lease loss, stale-write blocks, conflicts, verifier rejects, stealing/fairness/backpressure, retries/failover, durations/resources and unknown budgets. Shared queue snapshots count once; absent/stale telemetry is unknown. Routing uses alternatives and evidence available at decision time, pinned utility semantics and paired input/environment/benchmark comparisons. Predicted regret stays distinct from benchmark regret and unexecuted causal outcomes. | PASS |
| P13.6: Recommendations measured, never self-install | Prediction/outcome analysis links recommendation, exact metric unit/version, decision snapshot, forecast/confidence, actual outcome, process criteria, external/controllable factors, confounders and lesson. It rejects hindsight evidence and incompatible outcomes. Process quality remains separate from luck. Calibration reports sample-bounded Brier/gap/drift; transfer measurements preserve source/recipient/method-version baseline and discoverable regressions, with no causal/global-promotion inference. | PASS |
| P13.7: Evidence/version-backed lessons become proposals | Failure projections preserve class, version, precursor/impact, root-cause confidence, recovery/detection timing, recurrence/prevention and affected promotions. They reference existing canonical PIF.8 negative knowledge. Procedure analytics resolve exact P12.8 procedure decisions and retain version/outcome/applicability history; they do not create a competing procedure owner. Failures remain discoverable; compiler input and improvement proposals do not self-apply. Exhaustive retrospective remains deliberately postponed per the original phase. | PASS |
| P13.8: Security analytics neither authorize nor leak | Scoped security/trust reporting covers auth/protected-action/scope/privacy/integrity/provider/permission/export/deploy/publish/evaluator/dependency/recommendation/promotion/transfer/rollback categories. Correlation detection discounts any shared source/provider/model/benchmark/assumption/derived artifact transitively rather than counting a shared-source cluster as independent agreement. Reports contain metadata and never issue authorization or automatic responses. | PASS |
| P13.9: Truthful self-audit and bounded critic/optimizer proposals | Critic compares implementation/evidence, intended/observed versions, dependencies, duplicate ownership, coupling, authorized divergence and drift. Declared versioned routing/calibration/method/correlation/resource/cost/latency/transfer criteria generate evidence-backed findings and bounded optimizer proposals. Missing observations remain unknown. Proposals expire/revoke, retain requirements/evidence/versions/dependencies and cannot execute, promote or mutate policy/runtime. Documentation is generated only from canonical findings/proposals. | PASS |
| P13.10: Reproducible privacy-safe analytics at representative scale | Existing canonical PIF.7 evaluator registry is extended with immutable protocols: target/criterion, benchmark/version, environment, bounds, bias/data rules, repeats/samples and revalidation triggers. Invalid/duplicate/nonfinite observations, stale versions, prohibited data and fake production classes reject. Mixed benchmark scores cannot manufacture production acceptance; self-evaluation cannot control acceptance. Tests include 100,000 synthetic events, duplication/delay/collision/overflow, historical replay, redaction, retention/export, exact C2/Brain scope, concurrent write attempts and actual isolated PostgreSQL chains for all durable owners. | PASS |

## Durable ownership, source integrity and authorization

The new migration `supabase/migrations/20261028030000_p13_scoped_analytics_contracts.sql`
extends the existing eight C13 tables plus the existing PIF.7 evaluator owner.
No duplicate metric, evaluator, procedure, promotion or authorization owner is introduced.

`AnalyticsRepository`, `PostgresAnalyticsStore`, `PostgresEvaluatorStore` and
`registerDurableEvaluator` provide an actual scoped storage path. New records
require canonical verified evidence whose subject and digest bind exact record
identity/version/scope/benchmark/payload/temporal/retention metadata. Analytics
cannot mint its own source receipt or relabel synthetic evidence as production.
Repeated exact writes return the original record; collisions reject under a
transaction/advisory lock. Evaluator registration compares expected versions and
appends immutable canonical PIF.7 history before updating its process registry.

Observation SQL rechecks canonical metric version/unit/applicability, window/time,
range/type, current versus historical state and explicit missing-value semantics.
Unknown health/procedure confidence can remain null instead of being fabricated as zero.
Legacy reference slots for append-only projection events are version-qualified;
`record_ref`/`record_version` preserve stable logical identity. Existing rows are
not rewritten. Existing unscoped in-memory helpers remain compatibility primitives;
new canonical observations and server projections use the stricter boundary.

Raw analytics/PIF evaluator tables are server-only. Ordinary clients cannot
bypass company/project/Brain filtering via owner-wide table reads. Scoped reads
and exports enforce current C2 sessions/policies and an explicit Brain capability;
exports additionally require an exact owner-verified grant. Neither confidence,
a favorable evaluator result nor an optimizer proposal grants execution rights.
Service-role connections remain privileged trusted-server resources and must
never be given to browsers or subordinate specialists.

Telemetry retention is explicit and bounded. Expired records are hidden from
reads/exports and can be purged only through the private exact-scope retention
path. Active evidence and canonical evaluator history remain immutable. Historic
metric facts are explicitly labelled and cannot render as current numbers. Read
views also recheck source-receipt validity/digest: revoked, expired or changed
evidence remains auditable as historical/unverified, while current metric values
become null. Read-only history never restores current truth or authorization.
Rollback is code/schema-compatible: retain immutable history and use prior
readers or a corrective migration; do not reopen unscoped raw reads or delete
active evidence to undo a release. No production migration was attempted.

## Verification and observed failures

Executed commands include module build, focused P13 suites, Category 13 executable
gate, Category 12 regression gate, strict typecheck, architecture/legacy checks,
authority/repository audits, full build/test suite, artifact audit, exact-commit
release-candidate audit and `git diff --check`. Final exact counts and observed
CI run/job/HEAD/tree are in the normal-chat handoff rather than a self-referential
commit hash here.

The representative metric/observation path was tested before extending the
storage pattern to the remaining owners. A PL/pgSQL retention CASE expression
initially caused a parser error; parenthesizing it fixed the migration, after
which the real PIF.7 → C13 → new-guard chain passed. Local working-directory
command errors were recovered without publishing partial work. No test was
weakened or skipped to pass a gate.

These tests use isolated free PostgreSQL/PGlite and explicit fixture auth/evidence.
Synthetic fixtures and scale results are not live production measurements,
provider performance claims, actual revenue or owner acceptance.

## Remaining owners and protected boundaries

Category 13 closes its analytics behavior at this isolated boundary. Continuous
operational monitoring will mature as authorized real observations arrive;
unknown live data remains unknown. Later C14 advanced backup/recovery/migration/
chaos/scale/dormant-future work and C15 every-file/traceability/final integration,
production/live/owner/physical-device acceptance remain separate. A P15-specific
red gate is reported truthfully and is neither waived nor reclassified as a C13
failure unless it identifies a real C13 defect.

Category 14 was not started. Main, production, production Supabase/authentication,
protected release assets and workflows were untouched. No merge, production
deploy/promotion/publication, paid API/service/trial or spending occurred.

James Morgan retains final human authority. Command Center remains the permanent
top-level Brain/control plane; ARO and other specialists remain subordinate.
