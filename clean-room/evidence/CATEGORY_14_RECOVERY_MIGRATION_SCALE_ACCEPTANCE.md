# Category 14 — Recovery / Migration / Scale / Dormant Future

Status: IMPLEMENTED FOR ISOLATED BRANCH VERIFICATION

## P14.1–P14.3 — backup, restore, migration, rollback

Recovery artifacts preserve version/checksum/storage identity plus policy and revocation snapshots. Intelligence-state artifacts are first-class recovery material. Restore, migration and rollback exercises bind source/target versions, results and evidence; historical authority is never restored as broader current authority.

## P14.4 — dependency replacement

Replacement records cover provider, model, method, specialist, evaluator, ontology, library and service dependencies. Each replacement retains old/new identity, compatibility state, rollback reference, evidence and any required authorization. Replacement is not silently treated as equivalent.

## P14.5 — historical recovery completeness

Historical recovery is an explicit exercise/evidence class and composes with the existing recovery completeness/reporting implementation. Missing or reconstructed artifacts remain distinguishable from originals.

## P14.6 — 10× / 100× scale

Scale exercises explicitly distinguish 10× and 100× scenarios. Existing recovery/scale runtime suites remain responsible for queue, learning packet, evaluation, method-history, trace-volume and cross-Brain routing behavior; the durable record retains the exact exercised version/result/evidence.

## P14.7 — dormant aging/reactivation

Capabilities, specialists, procedures and promotions retain prior version, current policy/revocation snapshots and an explicit revalidation state. Dormant state cannot reactivate solely because it was valid historically.

## P14.8–P14.10 — future boundaries

Multi-user, commercial/public fork, device and interface seams remain explicit dormant/design boundaries until separately authorized. Durable boundary state enforces that future forks/interfaces do not inherit private state by default.

## P14.11 — chaos, shadow ecosystem, simulation, failover

Chaos/shadow/control-plane-failover exercises support deterministic replay references and enforce `production_side_effects = false` in the evidence contract. Simulation evidence cannot masquerade as a production side effect or current authority.

## P14.12 — long-horizon lifecycle and drift

Architecture drift, configuration drift, external-reality change, memory/dependency aging, replacement audit and causal validation are durable revalidation findings. Counterfactual exercises are separately identified so simulated alternatives cannot be confused with observed reality.

## Durable isolation

`supabase/migrations/20261026144000_p14_recovery_migration_scale_lifecycle.sql` supplies immutable, owner-isolated RLS evidence for recovery artifacts, exercises, dependency replacement, dormant reactivation, future boundaries and drift/revalidation. Every authenticated access path additionally requires `public.is_command_center_authorized()`.

## Verification inventory

- `clean-room/src/recovery/*`
- existing `clean-room/tests/recovery-scale-foundation.test.mjs`
- existing data-platform/recovery and Category 15 recovery tests
- `clean-room/tests/category14-durable-recovery-lifecycle.test.mjs`
- `supabase/migrations/20261026144000_p14_recovery_migration_scale_lifecycle.sql`

Full verification requires the exact commit containing these artifacts to pass the repository build/typecheck/test/audit workflow. This evidence does not authorize production, paid provider capacity, multi-user release, public commercialization, or physical-device acceptance.

## Current executable retrofit — checkpoint 1 (not Category 14 certification)

The earlier implemented-for-verification receipt is not a completed gate. The new
P14.1–P14.3 slice adds AES-256-GCM authenticated encrypted backups with SHA-256
content/policy/envelope identities, all fifteen explicit data/intelligence classes,
protected/excluded scope, cadence/age/retention, key references only, and credential
payload rejection. Independent decrypt/verify detects corruption/incomplete state.

Isolated restore stages every record with current canonical data restore revalidation;
intelligence is never activated by a restored snapshot. Historical/unknown/revoked/
invalidated/superseded/erased/expired state is not present-day authority. Dependencies
propagate rejection. Production workspaces are prohibited. Measured RTO/RPO are
isolated candidates only. No production claim is made.

Migration stages a full deterministic transform before expected-revision commit,
preserves identities/scope/history/epochs/tombstones, supports recorded-receipt resume,
and rejects stale/concurrent updates. Rollback preserves erasure and requires current
projection decisions. The C2 adapter reuses existing sessions, policy and owner-verified
grants; it cannot issue authority.

Executed: module compilation PASS; P14.1/P14.2/P14.3 focused tests 9 PASS, 0 FAIL,
0 SKIP. SQL persistence proof and the remaining nine phases are still pending.

## Checkpoint 2 — portable replacement, historical audit, scale and dormant seams

P14.4 reuses ProviderRegistry, assertProviderReplacement and the PIF.9 dependency
fabric: explicit adapter/config identity, free/available/compatible replacement,
unchanged scopes, pinned versions, rollback references and stale-dependent reports.
Methods/specialists/evaluators/ontology remain owned by their canonical registries.
P14.5 CCR-05852 audits the actual historical staging/branch graph against exact
manifest scope/count/digest/privacy exclusions. Missing/conflicting artifacts stay
explicit; processed fixture scope is separate from complete artifact recovery.
An empty coverage object previously passed; the validator now requires all ten keys.

P14.6 executes 10,000 and 100,000 synthetic units across twelve workload classes,
100 companies and 1,000 projects. Deterministic bounded admission applies explicit
backpressure, preserves every offered unit, and claims no production capacity.
A 1,000-record migration failure leaves its source unchanged before successful retry.
P14.7 stages ordered reactivation only after current policy/privacy/version/provider/
free-cost revalidation and returns to the canonical owner without issuing authority.
P14.8 filters synthetic tenant/user/household/role/project projections; P14.9 creates
an inert synthetic public code/default-config bundle with no private/credential/policy
copy; P14.10 reuses exact canonical intent/policy/data runtime bindings and removes
interfaces cleanly. No enrollment, publication, production interface or automatic
activation occurs.

The new scoped migration extends the six existing C14 tables, preserves legacy rows
as non-contract historical evidence, revokes raw client/service table access, and
exposes service-only private append/read functions. Current C2 and canonical source
receipts bind the exact runtime record digest; reads relabel invalidated receipts
historical. Transactions/locks enforce scoped idempotency; old immutable evidence
is not rewritten. PGlite executes the base+extension chain and tests all six owners,
30 representative classes, collision/missing/invalid/production/client-role denials.
Three durable tests PASS after correcting an inspection-role fixture error; permissions
were not weakened. P14.11/P14.12 and final certification remain pending.
