# Category 3 — Canonical Data / Knowledge / Command Graph / Provider Platform

Status: P3.1–P3.12 IMPLEMENTED / EXACT-HEAD CORE QA VERIFIED ON ISOLATED BRANCH / PRODUCTION APPLY AND LIVE-PROVIDER ACCEPTANCE NOT CLAIMED

## Branch-implemented and verified scope

- **P3.1 — Canonical schema:** durable owner-scoped canonical entities, immutable version history, schema/version contracts, tombstones, optimistic version checks, and explicit known/unknown/not-applicable truth semantics.
- **P3.2 — Knowledge/provenance:** durable knowledge claims with confidence/truth state, advancing supersession, no inferred-as-verified shortcut, and storage-level unique/nonblank provenance references.
- **P3.3 — Asset/lost-artifact registry:** durable hash/version/sensitivity/original-state/approval-state records, missing/reconstruction truth, and Category 2 protected authorization for locked-asset replacement.
- **P3.4 — Command Graph:** owner-scoped graph nodes/edges with aliases, renames, merges, supersession, dependencies, source refs, and active-alias uniqueness.
- **P3.5 — Provider platform:** replaceable versioned provider contracts with auth mode, credential references, capabilities/scopes, freshness, cost, health, verification, failure mode, and secret-shaped configuration rejection.
- **P3.6 — Sync/reconciliation:** durable sync events, cursors, conflict queue, derived canonical projection, stale/duplicate/equal-version conflict detection, version-gap handling, deterministic next-version application, and explicit reconciliation evidence.
- **P3.7 — Portability:** durable import batches/items, dry-run classification, duplicate/conflict detection, secret redaction, canonical-before snapshots, no silent overwrite, protected single-use commit/rollback, and rollback refusal when canonical truth has advanced.
- **P3.8 — Historical export staging:** durable ChatGPT-export batch/conversation/node staging with secret-shaped-content redaction enforcement and explicit zero canonical/project activation during staging.
- **P3.9 — Historical graph/lineage:** every staged mapping node and parent→child edge is retained; parent/child inconsistencies and orphans fail closed; branch points, `conversation_template_id` container membership, and standalone candidates remain distinct.
- **P3.10 — Context/artifact exchange:** immutable owner/project/sensitivity-scoped context snapshots with version/content hashes, explicit verification state, canonical asset manifests, secret exclusion, and read-only consumer access.
- **P3.11 — Protocol seams:** durable versioned MCP/A2A/custom adapter registry with capability lists, security-route keys, optional registered-provider references, health, provenance, and confidential-material rejection.
- **P3.12 — Recovery/scale:** derived-projection rebuild from canonical truth, durable success/failure evidence, failure-safe projection preservation, provider-replacement/free-first validation without switching providers, 5,000-event rebuild coverage, 2,000-record import conflict coverage, and late-stream gap failure tests.

## Security / mutation boundaries

- Browser roles receive owner-scoped **SELECT-only** direct table access for the Category 3 evidence/platform tables; canonical mutation uses narrow authenticated SECURITY DEFINER RPCs.
- Protected asset modification and canonical import commit/rollback consume the Category 2 single-use protected-action gate.
- Historical staging cannot create or activate projects and cannot mutate canonical truth.
- Context snapshots and artifact manifests are immutable exchange evidence; they cannot write through to source truth.
- Raw confidential provider/protocol credentials are not accepted into ordinary configuration payloads.

## Exact-head automated evidence

- Branch: `build/spec-lock-v2-clean-room`
- Exact verified head for this Category 3 core-QA checkpoint: `ff9ac0d0652eb8f38e4f37a44ae0938b58f547ce`
- GitHub Actions workflow: `.github/workflows/spec-lock-v2-clean-room-qa.yml`
- Run: `40101624787` (run #147)
- Typecheck: **PASS**
- Exact-head core QA and release gates: **PASS**
- Repository every-file audit inside the core gate: **PASS**
- Category 3 persistence, recovery and representative scale tests: **PASS inside core QA**
- Later PWA/final Category 15 stages are separate release/acceptance gates and are not used here to fabricate Category 3 production acceptance.

## Correct remaining boundaries

The following are **not** claimed complete by this evidence:

- Category 3 branch migrations have **not** been applied to production Supabase; production mutation is not currently authorized.
- The real two-part historical conversation export has not been ingested into the new staging tables; fixture/contract behavior is verified, not live historical reconciliation.
- A physical multi-device/live-provider replacement drill has not been performed against production-connected providers.
- Production realtime transport and live cross-device acceptance are not claimed merely because deterministic sync/reconciliation contracts pass.
- Brain/Agency live consumers of the new durable context exchange are later-category integration work.

No production database, provider connection, secret, deployment, protected asset, or canonical external state was changed by this Category 3 branch work.
