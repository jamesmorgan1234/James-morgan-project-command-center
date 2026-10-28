# Category 14 — Recovery / Migration / Scale / Dormant Future

Status: **PASS_ISOLATED_RECOVERY** — P14.1–P14.12.

Certification boundary: repository implementation, synthetic/copied isolated runtime,
and isolated PGlite migration/database enforcement. This is not production backup,
restore, migration, scale, provider, owner, release, or physical-device acceptance.
Category 15 was not implemented, repaired, waived or certified.

## Authority and executable closure

`category14-acceptance-matrix.json` enumerates all twelve exact Roadmap 22 phase
names, retained Roadmap 14 scopes/exits, 61 execution requirements, and all 115
unique Amendment 20 atoms assigned to C14 by ownership file 24 (169 phase mappings).
Each row identifies implementation, phase-specific tests, shared security/database
proof, migration chain, executable command and later-category boundaries.
Reconciliation 21 assigns intelligence recovery, dependency/version recovery, drift,
shadow/simulation/counterfactual infrastructure, revalidation/migration and scale/soak
to this category. Existing PIF, C2, data, Agency and specialist canonical owners remain
in control; these modules add neither competing canonical registries nor grants.

The historical 506-requirement category count is not a claim that Category 15's full
canonical-ledger-to-every-file traceability is closed. That downstream obligation
remains separate. Exact roadmap and amended C14 acceptance is exercised here.

`npm run gate:category14` compiles modules, validates phase/scope/exit/citation/atomic
coverage and required implementation/test/migration presence, then actually executes
all mandatory tests. Missing phases/requirements/evidence, failed/skipped/cancelled
tests fail the gate. `--validate-only` explicitly cannot certify execution.

## P14.1 — Backup architecture and policy, including intelligence-state artifacts

Extends `backup.ts` rather than replacing its legacy advisory contract. AES-256-GCM
with independent SHA-256 policy/content/envelope identities protects fifteen explicit
classes: canonical data, assets, methods, routing, calibration, promotions, evaluators,
procedures, specialists, negative knowledge, revalidation, canary state, configuration,
capabilities and shadow state. Policy pins scope, identity/version, cadence, maximum
age, retention, count budget, protected/excluded refs and compatibility identity.

Nonextractable 256-bit keys are caller-held; only key references persist. Credentials,
sessions, grants and private-key/token material are rejected even inside encrypted
payloads. IVs are generated cryptographically and header metadata is authenticated.
Independent verification decrypts and checks counts/classes/dependencies/content,
wrong keys, tampering, stale/superseded policy and incomplete/protected-asset omissions.
The scoped retention RPC deletes expired encrypted payloads exactly once and keeps
immutable nonsecret source-digest/header audit evidence; active/legacy evidence is
not mutable. No production backup or key service was configured.

## P14.2 — Disaster restore and known-good recovery, including governed intelligence state

Actual decryption stages every record in `IsolatedRecoveryWorkspace`. Existing
`data/recovery.ts` remains the current authorization/privacy/key/application/source/
purpose/retention revalidation owner. Invalid/unknown/expired/revoked/superseded/
invalidated/deleted states remain historical. Dependency rejection propagates;
missing/cyclic dependencies and changing current authority reject before commit.
Workspace scope is immutable and commits use expected revision.

Only currently revalidated data/config/assets become usable isolated data. Restored
intelligence always requires its existing canonical owner to revalidate; backup
state never reissues permissions or activates PIF/specialist/evaluator/procedure
registries. RTO/RPO measurements are isolated candidates, not production SLOs.

## P14.3 — Schema/data/intelligence-state migration and rollback framework

Versioned plans bind compatibility directions, source digest, backup/rollback refs,
precondition evidence and scope. Full transforms stage before one revision-fenced
commit, preserving ID/kind/scope/evidence/dependencies/epochs/truth and tombstones.
Failure at a late item leaves state unchanged. Competing migrations have one winner.
Recorded receipts resume idempotently without reapplying a transform. Migration
results remain historical pending fresh canonical revalidation. Rollback checks the
recorded original plan/source/target, preserves erasure and cannot restore current
authority. Superseded destinations reject rollback. Durable SQL partial-failure
transactions and reopened-store retries are exercised separately.

## P14.4 — Provider, model, method, evaluator, ontology, and dependency replacement

Reuses `ProviderRegistry`, `assertProviderReplacement` and PIF.9's dependency fabric.
AI/provider/storage/hosting/integration/model adapter/config replacement preserves
canonical provider key, requires expected advancing versions, capability compatibility,
free/available eligibility, explicit rollback refs and no permission-scope expansion.
Unavailable/retired/compromised/degraded/unknown-cost candidates fail closed or remain
local-degradation assessments. Method/specialist/evaluator/ontology/dependency plans
report stale dependents and return to their canonical owners; provider replacement
cannot activate these owners or grant execution. No live connector was called.

## P14.5 — Historical recovery completeness and migration audit

CCR-05852 report validation uses actual existing historical staging, message-graph
validation and lineage indexing. It checks exact fixture manifest digest and
conversation set, all nodes/branches/containers, privacy exclusions and source refs.
Candidates, conflicts, missing artifacts, unknowns and rename/merge/supersession
lineage remain explicit. Processed scope differs from all-artifacts-recovered.
An empty coverage object previously passed validation; all ten keys are now required.
Original-first recovery/reconstruction contracts remain unchanged. No owner's actual
historical import was performed or falsely claimed complete.

## P14.6 — 10× / 100× scale and capacity planning, including learning/evaluation infrastructure

Actual deterministic synthetic workloads exercise 10,000 and 100,000 units across
100 companies/1,000 projects and twelve classes: projects, businesses, books, accounts,
social channels, Agency jobs, knowledge records, learning packets, evaluations,
method histories, traces and cross-Brain routes. Existing capacity policy governs
admission; byte/count/per-scope budgets apply explicit backpressure with zero silent
loss. Reversed-input replay produces identical checkpoints. Degraded providers
backpressure all work. A 1,000-record failed migration preserves source before retry.
These are local bounded exercises; no production throughput/availability is claimed.

## P14.7 — Dormant capability/specialist/procedure aging and reactivation

Contract/data/provider changes require current policy/privacy/revocation/evidence/
cost/version revalidation. Ordered CONFIGURE → CONNECT → AUTHORIZE → ENABLE staging
hands off to the canonical owner. Revoked/archived/obsolete/stale/incompatible/paid
state stays inert. No module automatically enables a capability or issues a grant.

## P14.8 — Dormant future multi-user boundary

Pure synthetic tenant/principal/household/role/project contracts filter future views.
Owner-private and other-tenant data never appear. Unknown/admin/owner/wildcard
inheritance is rejected. No user is enrolled and no multi-user product is activated.

## P14.9 — Commercial/public fork boundary

An inert synthetic bundle selects public code/default configuration with source and
content identity. Private data/credentials/owner policy are excluded; mislabeled
public data, source mutation and duplicate identities reject. Nothing is published.

## P14.10 — Future device and interface seams

Extends existing `InterfaceRegistry`: desktop/mobile/voice/wearable/ambient/future
adapters must use exact canonical command/policy/data runtime keys. Intent previews
retain existing C2 intent binding, authorize no execution and produce no side effects.
Removing an adapter prevents subsequent use; competing runtimes/nonremovable
interfaces/ambiguous intents reject. No physical device was activated or certified.

## P14.11 — Distributed chaos, shadow ecosystem/digital twin, simulation, and control-plane failover

Closed local interpreter exercises DB/network/provider/cache/worker/scheduler/lead/
partition/stale-lease/duplicate-delivery/disk/resource failure scenarios. It invokes
existing Agency scheduler/claim/recovery/lead-failover owners, observes stale-worker
and stale-leader rejection, serializes/hash-verifies a checkpoint, recreates the
workspace and resumes to a baseline replay digest. Duplicate events are suppressed;
cache projections rebuild from the event stream. Source/version/privacy/budgets
are pinned. Synthetic and copied classifications differ; copied data requires
privacy approval. No production transport/effect callback exists. Controlled injected
failure confidence is not a claim about real-world root cause. PIF/compiler/governor
canonical owners remain subordinate and unchanged.

## P14.12 — Long-horizon lifecycle, external revalidation, architecture/config drift, counterfactual/causal support, and replacement audit

Actual isolated module/data/project/provider/Agency-role exercises traverse birth,
configure, use, failure, recovery, migration, disable, removal and replacement. Exact
source-bound evidence receipts cover observations, and final live probes reject
orphan data/claims. Existing historical validators remain advisory, not sole proof.

Revalidation distinguishes all nine AM20 architecture/config drift classes plus
external reality, memory/dependency aging and replacement audit. Missing/expired
source truth stays noncurrent; findings generate scoped documentation, not automatic
repair authority. Counterfactual support keeps observed facts, correlations,
assumptions, interventions, model identity, simulated outcome, unproven causal
hypothesis, unestimated confidence and sensitivity separate. No simulation becomes
an observed counterfactual or proven causal claim. Continuous revalidation and real
production scale/external validation mature under their existing governed owners.

## Durable ownership, migration and rollback safety

Existing six C14 tables remain owners. New migrations:

- `20261028081500_p14_scoped_recovery_contracts.sql`: scoped immutable record contracts,
  private service-only append/read, source-digest binding at runtime, exact scoped
  idempotency and metadata-only nonartifact evidence. Legacy rows stay historical.
- `20261028081600_p14_expired_backup_retention.sql`: tightly bounded expired-payload
  erasure preserving immutable metadata audit; ordinary immutable evidence unchanged.

The original `20261026144000_p14_recovery_migration_scale_lifecycle.sql` is unchanged.
PGlite executes the complete base → extension → retention chain. No production
Supabase/data/auth changes occurred. Server keys never enter clients. C2 access
reuses current sessions, policies and exact owner-verified grants, and denies
production operations. It never issues authority.

## Executed verification

- P14 focused suites: **37 PASS, 0 FAIL, 0 SKIP** (including five database tests).
- Category 14 gate: **120 PASS, 0 FAIL, 0 SKIP/CANCEL**.
- Category 13 gate: **85 PASS, 0 FAIL**.
- Category 12 gate: **123 PASS, 0 FAIL**.
- `npm run build`: module/browser builds PASS; **1,558 PASS, 0 FAIL, 0 SKIP**.
- Typecheck, architecture, legacy, authority audit, repository automated scan PASS.
  The repository semantic-every-file review flag remains false; no C15 claim.
- Artifact structural audit PASS. An unstamped local build initially failed the
  release-candidate immutable-identity check; rebuilding with `GITHUB_SHA` resolved
  that check. Exact published-commit browser/artifact/release checks are rerun after
  publication and their exact state is recorded in the normal-chat handoff/CI.
- `git diff --check` PASS before publication.

Development failures were fixed before advancing: readonly local projection typing;
restricted-service-role inspection fixture; an incorrectly named required regression
file; and the expected unstamped-local release-identity blocker. Tests/security
thresholds were not weakened, valid tests were not deleted/skipped, and no CI result
was invented. Final exact-head CI is reported separately from these local results.

## Protected boundaries

James Morgan retains final human authority. Command Center is the permanent top
Brain/control plane. ARO, specialists, backup, recovery, migration, simulation and
optimization remain subordinate. Main, production, production Supabase/data/auth,
protected release assets and unrelated projects were untouched. No merge, force push,
manual deployment/promotion/publication, financial operation, procurement, payment,
paid trial/service/API activation occurred. $0-first remains enforced.
