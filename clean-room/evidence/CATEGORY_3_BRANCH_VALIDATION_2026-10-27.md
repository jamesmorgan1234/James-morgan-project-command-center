# Category 3 isolated branch validation — 2026-10-27

This records repository/local proof, not production apply, live-provider integration, physical-device acceptance, or Category 15 completion. It does not adopt the older every-file semantic-review claim.

Authority: current Roadmap 22 retains the twelve Category 3 phases and the detailed definitions in Roadmap 14. Amendments 19–20 retain Command Center authority and privacy/applicability boundaries.

## Verified changes

Canonical schema v1 is distinct from independently advancing record versions. Missing runtime schemaVersion retains the original v1 contract; unsupported supplied versions fail closed. The branch-only compatibility migration constrains current/history schema versions to 1 and rejects known JSON null. Prior incompatible data blocks validation atomically; it is never silently rewritten. Future schema adoption requires a new explicit compatibility migration.

Explicit known values preserve zero/false and own deeply immutable finite JSON snapshots. Unknown and not-applicable do not carry values; absent/malformed states are rejected by the decoder. Restricted/deleted data remains governed by existing privacy and tombstone contracts, and stale/historical knowledge remains explicit in the existing temporal/provenance contracts.

Rejected writes leave current state unchanged. Tombstones cannot silently revive or repeat; update/deletion time cannot move backwards. Knowledge validation precedes supersession. Asset replacement shares registration invariants. Graph ownership, active aliases and temporal supersession are guarded. Provider/protocol runtime states fail closed. Sync temporal regression is an explicit conflict. Export snapshots own immutable data. Historical staging enforces detected-secret redaction and unique conversation identity. Message graph checks duplicate identities, cycles and reciprocal links. Context cannot broaden restricted scope by omission or exchange secret material. Recovery rejects empty event identity and unknown-cost replacements under free-first.

## Phase gate evidence

| Phase | Isolated branch proof |
|---|---|
| P3.1 | canonical lifecycle tests, schema compatibility/ambiguity tests, actual PostgreSQL version-conflict rollback and immutable version history |
| P3.2 | knowledge atomicity tests, canonical provenance/epistemic tests, SQL rejected-inference preservation and explicit truth-state rejection |
| P3.3 | asset validation tests, protected asset existing tests, SQL missing/available-hash constraints |
| P3.4 | graph boundary tests, alias/supersession fixtures, SQL cross-owner foreign-key rejection |
| P3.5 | provider substitution/disable/remove tests, existing capability-drift tests, SQL provider registration/version history |
| P3.6 | sync temporal/stale/conflict/gap tests and existing idempotency/transaction contract checks |
| P3.7 | immutable portability round-trip tests, actual SQL staging/no-activation, protected-fixture commit/rollback and preserved audit versions |
| P3.8 | historical secret-boundary tests and actual SQL complete staged node inventory without canonical activation |
| P3.9 | branch/container/standalone fixtures, cyclic/ambiguous graph rejection and actual SQL branched-container persistence |
| P3.10 | context scope/immutability tests, actual SQL hash/owner checks with rollback on rejected snapshot |
| P3.11 | protocol registration/removal tests, unsupported protocol rejection, actual SQL provider-neutral protocol registration |
| P3.12 | existing 5,000-event/2,000-record recovery/scale fixtures, deterministic replay tests and actual SQL projection reconstruction retaining tombstones |

The executable PostgreSQL suite uses pinned PGlite 0.5.12 with real pgcrypto and unmodified Category 3 foundation migrations. Authentication, project-existence and scoped single-use authorization are explicit isolated fixtures. This proves Category 3 SQL integration with those boundaries; it does not independently certify real Supabase Auth or replace Category 2 acceptance.

Validation: strict typecheck and module/browser build passed; full module suite 1,300 passed, 0 failed, 0 skipped, 0 cancelled. The PostgreSQL file contributes 12 passing test entries (parent plus eleven subtests). Architecture/no-legacy checks passed. Final commit CI must be independently inspected; this file is not a fabricated CI receipt.

## Migration and rollback boundary

No production migration was applied. New migration: `20261027174500_category3_declared_schema_compatibility.sql`. It changes constraints, not payloads, grants, authorization or ownership. Recovery from an incompatible pre-existing row is to preserve it and resolve compatibility explicitly, not delete it or bypass the constraint. A reviewed rollback may drop only the three added constraints; immutable entity history remains intact. Runtime rollback should use an exact earlier verified commit, coordinated with declared schema compatibility.

Category 15 traceability/semantic-review/receipt and protected release gates remain open and unchanged. No production deployment, production data mutation, merge, billing action or paid service is part of this record. Category 4 has not started.
