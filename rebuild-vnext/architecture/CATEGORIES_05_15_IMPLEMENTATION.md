# Categories 5–15 — Implementation checkpoint

Implemented in the clean-room runtime:

- Category 5 Projects / Portfolio / Roadmap / Progress: stable project IDs, evidence-only verified progress, dependency/gate enforcement, checkpoint ancestry/resume, lineage, separate projections.
- Category 6 Brain: provider-independent memory/context/proposal contracts; Brain output never authorizes protected action.
- Category 7 Agent: durable runs/tasks, real executor claim before work, dependency/evidence gates, deterministic resume point.
- Category 8 Personal/Search/Notifications/Automation: private personal items, permission-aware search, lock-screen redaction/quiet hours, automations that cannot imply authorization.
- Category 9 Finance/Banking/Credit foundation: provider/account/transaction truth with read/calculation separate from protected money actions.
- Category 10 Social/Communications: entity-bound accounts, draft/publish separation, protected publication descriptor.
- Category 11 Books/Publishing: series/books/formats with publication evidence required before `published` truth.
- Category 12 Specialist/Interop: specialist capability registration plus sandboxed, versioned protocol adapters.
- Category 13 Analytics/Observability: evidence/provenance-preserving observation ledger.
- Category 14 Recovery/Migration/Dormant Future: known-good snapshot registry with explicit verification evidence.
- Category 15 Release/Production Acceptance: G0–G14 release manager; passing a gate requires evidence; production readiness does not imply owner/device acceptance.

All are additive clean-room modules. None import the legacy root runtime or `authoritative-v7` implementation.
