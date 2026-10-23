# Command Center — Specification Lock v2

**Lock date:** 2026-10-23  
**Owner:** James Morgan  
**Status:** **LOCKED FOR CLEAN-ROOM IMPLEMENTATION**  
**Canonical requirement total:** **5,852**  
**Build phases/work packages:** **188**  
**Controlling roadmap:** `14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md`

## Owner authorization

At the owner-review boundary, the prior assistant explicitly stated that the only remaining roadmap gate was James's approval/correction of the complete 5,852-requirement / 188-phase plan and that plain authorization was sufficient. James then instructed:

> **“Continue from where you froze.”**

Under the standing rule that plain authorization counts and no magic phrase is required, this instruction authorizes continuation through the exact next locked sequence step: **Specification Lock v2 and clean implementation**. It does not authorize unrelated protected actions such as spending, publishing, external communications, production deployment, account/security changes, legal acceptance, or physical Samsung acceptance.

## Locked authority stack

1. James Morgan's newest explicit instruction always overrides older conflicting owner instructions.
2. This Specification Lock v2 governs the clean implementation baseline unless James explicitly changes or reopens scope.
3. `14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md` is the controlling phase decomposition.
4. `Command_Center_Canonical_Owner_Additions_REV3.json` supplies canonical `CCR-05826–CCR-05852`.
5. `13_AGENCY_FOUNDRY_HISTORICAL_RECONCILIATION_PASS2.md` records reconciliation logic for the expanded scope.
6. `01_OWNER_ADDITIONS_BIOMETRIC_SECURITY_AND_UPDATES.md` remains binding clarification of existing canonical requirements.
7. Approved screenshots/assets are literal visual authority only for structures they actually show and for the shared visual language.
8. Historical implementation code is **reference/evidence only** and is not implementation authority.
9. Verified current live state outranks stale historical conversation for mutable external/provider/runtime state.

## Locked clean-room rule

The rebuilt Command Center must be implemented from the beginning using the locked requirements and architecture. Historical Command Center implementation code, old UI/runtime layers, old Agent machinery, old queues/schedulers, old database/RPC designs, CSS/DOM patches, and prior architectural shortcuts may **not** be copied or treated as the new foundation.

Verified project/business/book data and approved/protected assets may be migrated through newly built mechanisms with provenance and validation.

## Locked architecture invariants

- One canonical owner/governance path.
- One typed command/event/workflow model.
- One source of truth per responsibility.
- Registry/adapter/contract-based extensibility.
- No hidden legacy runtime dependency.
- No Band-Aids, monkey patches, competing startup/router/renderer/scroll owners, or fake state.
- Agency workers share scoped canonical knowledge/context, not uncontrolled mutable conversation history.
- Persistent logical Project Agents are separate from disposable workers.
- Protected actions remain centrally gated and require the applicable current authorization.
- `$0/free-first` remains controlling unless James explicitly authorizes spending for a specific action.
- Normal Chat performs all work it reasonably can; Work is never initiated automatically.
- Project creation remains owner-governed.
- Historical conversation is evidence, not automatic current truth.
- Sensitive/private/secret historical material is classified and isolated.
- Owner/Samsung acceptance remains Category 15 only.

## Locked canonical counts

- Pre-expansion canonical baseline: **5,825**.
- Genuinely new Agency/Foundry/Historical-Recovery requirements: **27**.
- New canonical range: **CCR-05826–CCR-05852**.
- Biometric/update clarifications: **0 additional IDs**.
- Specification Lock v2 canonical total: **5,852**.

## Locked phase plan

The implementation is organized into **188 phases/work packages** across Categories 0–15.

Category 0 planning/specification work is complete through P0.10 by this lock. Clean implementation begins at **Category 1 / P1.1** and proceeds according to dependency/gate readiness rather than blindly by numeric order.

Category 15 alone contains final every-file audit, security/privacy red team, exact visual/device acceptance, historical-import acceptance, Agency concurrency/failover acceptance, release candidate, production deployment, owner acceptance, and physical Samsung acceptance.

## Change control after lock

A new James instruction may alter scope after this lock. Any material change must:

1. identify affected canonical requirements/phases;
2. preserve unaffected verified work;
3. update requirement/decision lineage;
4. update dependencies/acceptance criteria if needed;
5. rerun affected QC/gates;
6. never silently rewrite the locked baseline.

Minor implementation decisions that stay inside locked requirements and decision rights do not require re-locking the entire specification.

## Implementation branch rule

Implementation must occur on a dedicated clean-room build branch derived from this locked roadmap commit. Production `main` remains untouched until Category 15 production authorization.

The implementation branch may carry roadmap/specification documents for provenance, but new runtime/application code must live under a clearly isolated clean-room implementation root and must not import or depend on historical runtime code.

## Immediate next action

Create the dedicated clean-room implementation branch and begin **P1.1 — Canonical identifiers and lifecycle vocabulary**, followed by Category 1 kernel/governance phases as dependencies permit.

**Specification Lock v2 is now the implementation authority.**
