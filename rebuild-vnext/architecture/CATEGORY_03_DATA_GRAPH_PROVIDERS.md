# Category 3 — Data / Knowledge / Command Graph / Provider Contracts

## Implemented contracts

- canonical record store with stable IDs, provenance, sensitivity, verification/authority state, versioning, history, soft delete/archive/restore;
- optimistic concurrency/lost-update protection;
- protected asset registry with SHA-256 version hashes, canonical marker seam, approval/protection state, and explicit protected-change path;
- Command Graph with stable typed nodes/edges, provenance, confidence, inferred-versus-verified distinction, dependency and impact queries;
- Provider Registry with adapter boundary, provider version/capabilities, normalized canonical payloads, and separate health state;
- provider-specific payloads do not leak directly into canonical domain contracts.

## Explicit non-goals

No live provider connection, Supabase schema mutation, external API write, production data migration, or deployment occurs in this category.

## Exit gates

- concurrency conflict test passes;
- state history survives delete/restore;
- protected asset mutation is denied without explicit path;
- inferred graph relation cannot silently become verified;
- provider normalization/health contracts pass;
- Categories 1–2 regressions remain green.
