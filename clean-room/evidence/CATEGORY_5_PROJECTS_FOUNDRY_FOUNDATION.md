# Category 5 — Projects / Portfolio / Roadmap / Checkpoints / Foundry

Status: P5.1–P5.14 CLEAN-ROOM FOUNDATION IMPLEMENTED / UNIT-VERIFIED / RENDERED-LIVE INTEGRATION ACCEPTANCE NOT YET CLAIMED

Implemented and unit-verified:

- P5.1 generic project type registry and stable project contract with ownership/lifecycle/verification/priority/authorization flags
- P5.2 append-only project lineage for rename/merge/supersession/fork/reactivation/retirement; owner-decision evidence gates identity-changing transitions
- P5.3 Project→Category→Phase→Work Unit DAG model with dependency-cycle validation, gates, acceptance criteria, and readiness checks
- P5.4 durable checkpoint history with roadmap version, exact next work unit, blocker, required environment, owner action, verification method, evidence, and resume-state hash
- P5.5 project progress computed only from verified applicable work/trusted denominator and kept distinct from Agency-run progress
- P5.6 Projects view selector driven by canonical project records and truthful progress
- P5.7 Active / Live selector that requires real executor claim + working state + fresh heartbeat; stale/unclaimed activity is excluded
- P5.8 Next Up selector that requires dependency/gate readiness plus evidence-backed priority input
- P5.9 extensible project-detail section registry; type-specific sections add/remove without renderer injection
- P5.10 provenance-required project candidate discovery and deterministic mission-similarity duplicate signals with owner-governed disposition
- P5.11 governed Project Foundry stage machine; Agency execution blocked without exact owner authorization reference
- P5.12 Ultimate Spec completeness compiler requiring every applicable dimension addressed or explicitly excluded with reason
- P5.13 prototype/usability feedback lineage with protected-design override requiring owner authorization
- P5.14 recovery/rescue/migration/rebuild/revival/retirement plans preserving lineage/decisions/checkpoints and owner-governed archived reactivation

Automated evidence:

- GitHub Actions workflow: `.github/workflows/spec-lock-v2-clean-room-qa.yml`
- Run: `40005647800`
- Head: `048d694a8eb2a87915c654566ce16fecd08afdf6`
- Typecheck: PASS
- Build and tests: PASS

Still mandatory before final Category 5 acceptance:

- real canonical database persistence/RLS and live sync
- actual rendered Projects/Active/Next Up/Project Detail screens against owner-approved references
- full production-sized project registry/import and scale testing
- Foundry integration with Brain and Agency Categories 6–7
- historical-export discovery/duplicate recovery at full evidence scale

No production deployment, merge, project creation, provider mutation, paid action, or protected asset change was performed.
