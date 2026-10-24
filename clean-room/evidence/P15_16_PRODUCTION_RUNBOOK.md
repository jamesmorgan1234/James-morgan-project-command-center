# P15.16 production deployment and live-verification runbook

State: PREPARED / NO PRODUCTION MUTATION AUTHORIZED.

Exact release candidate: `e0a4ade6bbe26fbec1cc091c3818241b29ce1295`.
Current protected Git production baseline: `855a06b43d152df1bc3c7574cc3f584bf1b51892`.
P15.14 exact-head evidence run: `40042995928`.
Preview deployment evidence: `dpl_BfR5nzueza7PmcZYdLEsoB9usjjw`.

Before any production write, verify from the actual live serving platform: current production deployment identity, rollback target, exact candidate identity, schema/runtime/cache/controller state, and whether a migration is required.

If the owner later explicitly permits production mutation, deploy only the exact candidate; do not rebuild or repack it. Verify live identity, startup, auth/security, core routes, Agency/Foundry, Books contracts, PWA controller/offline/update state, and rollback readiness. Any failed mandatory check requires containment or rollback and reopens the relevant phase.

The current owner instruction still prohibits merge, production deployment, and production-data modification, so this runbook is preparation only.

P15.1 remains `BLOCKED_SOURCE_ARTIFACT`: the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent.
