# P15.1 Agency breaker / dead-letter closure — 2026-10-30

Scope: close only the three explicitly parked Agency retry/recovery rows identified by the live repository. This record does not close P15.1 globally, start P15.2, authorize production changes, or reopen unrelated Category 7 work.

## Exact rows closed

The live gap register `clean-room/evidence/P15_1_AGENCY_RETRY_RECOVERY_UNRESOLVED_GAPS.md` identified exactly:

- `CCR-00422` — circuit-breaker intelligence;
- `CCR-00423` — project / portfolio breakers;
- `CCR-00424` — dead-letter queues / blocked-task management.

Nearby retry, failover, Shift Manager, Boundary Office, and outbox controls were preserved but were not treated as proof for these rows.

## Source implementation

Source qualification commit:

`ec4719a5c2a4caeb637b3aab5af49168648d0ebc`

Added implementation:

- `clean-room/src/agency/resilience.ts`
- `clean-room/src/agency/index.ts` export
- `supabase/migrations/20261030030000_category7_circuit_breaker_dead_letter.sql`
- `clean-room/tests/category7-circuit-breaker-dead-letter.test.mjs`
- explicit reviewed mappings in `clean-room/scripts/p15-1-reviewed-agency-retry-recovery-mappings.mjs`

### Circuit-breaker contract

The branch now has explicit project and portfolio breaker scope with:

- `closed -> open -> half_open -> closed/open` lifecycle;
- positive safe-integer failure threshold and cooldown;
- evidence-backed, versioned state;
- one half-open probe at a time;
- cooldown denial while open;
- successful probe recovery;
- failed half-open probe reopens and refreshes cooldown;
- invalid configuration and unpermitted transitions fail closed;
- open/blocked state never masquerades as successful execution.

### Dead-letter / blocked-task contract

The branch now has explicit durable states:

- `dead_letter` for retry-exhausted or permanent failures;
- `blocked` for blockers requiring resolution;
- governed `requeued` / `resolved` management outcomes.

Records retain exact owner/project/run/task identity, attempt count, reason, timestamps, evidence, version, and transition history. Scope mismatch, stale transition time, malformed disposition/failure-class combinations, and repeated management transitions fail closed.

`taskCompletionAuthorized` is structurally false, including after requeue or resolution, so dead-letter management cannot fabricate task completion.

### Durable persistence boundary

The new Category 7 migration is branch-only and was not applied to production. It uses the existing Agency durability pattern:

- owner-scoped RLS;
- direct browser-table mutation revoked;
- authenticated direct table access limited to SELECT;
- narrow `SECURITY DEFINER` RPCs;
- `is_command_center_authorized()` checks;
- exact project/run/task validation where applicable;
- evidence-required transitions;
- version conflict protection;
- dead-letter creation blocks the Agency run rather than completing it.

## Executable proof

Focused named tests cover:

1. project breaker threshold/open/cooldown/half-open/recovery;
2. failed half-open probe reopening and cooldown refresh;
3. independent portfolio breaker scope;
4. invalid breaker configuration and unpermitted transitions;
5. dead-letter versus blocked failure classification;
6. evidence-backed requeue/resolution while preserving non-completion;
7. scope mismatch, stale time, and repeated-transition rejection;
8. durable migration owner scope, read-only browser boundary, and evidence-gated mutation contract.

## Exact-head qualification

Guarded workflow:

- workflow: `P15.1 Reviewed Mapping Requalification`
- run: `40993961625`
- source head: `ec4719a5c2a4caeb637b3aab5af49168648d0ebc`
- core QA: **SUCCESS**
- authority validation: PASS
- typecheck: PASS
- legacy exclusion: PASS
- architecture source gate: PASS
- repository audit: PASS
- module build: PASS
- browser build: PASS
- exact-head module tests: PASS
- artifact audit: PASS
- release-candidate audit: PASS
- P15.14 nonproduction PWA lifecycle: PASS
- guarded assemble/qualification: **SUCCESS**
- stale-branch refusal gate: PASS
- guarded ledger promotion: PASS

The guarded promotion produced live commit:

`dd23141eabd42fde620f0dee66b537cc6ea26553`

with commit message:

`chore: requalify P15.1 reviewed mappings (595 -> 598)`

Therefore exactly the three repaired rows were newly accepted: reviewed/verified count **595 -> 598**.

## Closure decision

`CCR-00422`, `CCR-00423`, and `CCR-00424` are now source-bound and executable-proof-qualified in the current P15.1 traceability set.

No production database migration, deployment, external provider call, paid action, real Agency execution, owner/device acceptance, or protected external side effect was performed.

P15.1 remains OPEN globally. P15.2 remains NOT STARTED.
