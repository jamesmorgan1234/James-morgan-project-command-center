# Command Center — Current Build Authority

**Owner / final authority:** James Morgan

## Active implementation authority

- **Authoritative implementation branch:** `build/spec-lock-v2-clean-room`
- **Current integrated roadmap:** `roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md`
- **Current machine phase index:** `roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json`
- **Historical canonical requirement ledger:** **5,852 requirements**
- **Current phase count:** **199**
- **Clean implementation root:** `clean-room/`

Before any build, audit, acceptance, or resume work, refetch the authoritative branch and verify its live HEAD. Live branch state outranks stale chat, old checkpoints, and superseded roadmap files.

## Branch authority rule

`main` is the protected production line and is **not** the active clean-room build authority before the applicable Category 15 production authorization gate.

Until the repository default-branch setting is deliberately changed, GitHub code search that implicitly searches the default `main` branch is **non-authoritative for clean-room build decisions**. Use explicit branch/ref reads against `build/spec-lock-v2-clean-room` instead.

Old `cc-*`, `checkpoint/*`, temporary `build/*`, repair, staging, and backup branches are historical evidence unless the live current roadmap or a newer explicit owner instruction names one as current authority. They must not silently override the authoritative implementation branch.

Do not merge, fast-forward, deploy, publish, or otherwise promote the clean-room branch to production `main` before the applicable Category 15 authorization gate.

## Roadmap precedence

The current 199-phase roadmap is the integrated roadmap view. Historical baseline artifacts including `14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md` and `15_SPECIFICATION_LOCK_V2.md` remain preserved historical authority for their locked baseline content, but older phase counts, pause statements, and superseded resume pointers do not override the current integrated roadmap, amendments, or newer explicit owner instructions.

## Verified completion boundary

Category 1 / P1.1–P1.10 and Category 2 / P2.1–P2.9 are verified complete in the clean-room branch.

Canonical evidence:

- Category 1: `clean-room/evidence/CATEGORY_1_KERNEL_ACCEPTANCE.md`
- Category 2: `clean-room/evidence/CATEGORY_2_SECURITY_FOUNDATION.md`

The next roadmap category is Category 3, beginning at P3.1. Do not infer Category-3-or-later completion from existence of source files or historical evidence; resume from the earliest genuinely unfinished requirement/phase proven by current evidence and the current roadmap.

## Safety / cost / truth

- $0/free-first; no paid action without explicit owner authorization.
- No production deployment, merge, provider mutation, destructive cleanup, or protected-asset replacement without the applicable authorization gate.
- Completion requires evidence; implementation alone is not completion.
- Historical conversation and branches are evidence, not automatic current truth.
