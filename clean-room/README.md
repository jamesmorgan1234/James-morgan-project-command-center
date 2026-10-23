# Command Center Clean-Room Implementation

This directory is the only new runtime/application implementation root created after Specification Lock v2.

Rules:

- No imports from historical Command Center runtime/application code.
- Historical code may be read only as evidence of prior requirements, failures, data shape, or migration needs.
- The locked authority is `roadmap/master-build-plan-owner-review/15_SPECIFICATION_LOCK_V2.md` and the 188-phase plan it references.
- Framework/provider choices remain replaceable behind contracts and registries.
- Completion claims require test/evidence gates; implemented-but-unverified is not complete.

Current implementation scope: Category 1 kernel/governance, beginning with P1.1 canonical identifiers and lifecycle vocabulary and then the registry/module/command/governance/evidence/config/recovery/invariant foundations for P1.2–P1.10.
