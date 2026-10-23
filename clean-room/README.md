# Command Center Clean-Room Implementation

This directory is the only new runtime/application implementation root created after Specification Lock v2.

Rules:

- No imports from historical Command Center runtime/application code.
- Historical code may be read only as evidence of prior requirements, failures, data shape, or migration needs.
- The locked authority is `roadmap/master-build-plan-owner-review/15_SPECIFICATION_LOCK_V2.md` and the 188-phase plan it references.
- Framework/provider choices remain replaceable behind contracts and registries.
- Completion claims require test/evidence gates; implemented-but-unverified is not complete.
- Production `main` remains protected until the applicable Category 15 authorization gate.
- Protected assets must retain exact identity; unresolved protected assets stay unresolved rather than being substituted.

Current implementation state spans the clean-room foundations through Category 14 plus active Category 15 integration/release-safety work. Evidence is not uniform across every category yet: dedicated Markdown evidence currently exists for Categories 1–9, while later categories are represented by implementation/tests and remain subject to requirement-level P15.1 closure. The strict release-candidate gate remains blocked by the unresolved exact protected Command Center icon until its bytes match the locked SHA-256.
