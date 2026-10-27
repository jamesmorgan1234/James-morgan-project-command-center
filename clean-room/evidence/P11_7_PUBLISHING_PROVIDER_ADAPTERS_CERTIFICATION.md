# P11.7 — Publishing Provider Adapters — Repair and Certification Evidence

Scope/exit gate: KDP and future distributors remain replaceable providers behind health/capability/evidence contracts and truthful Normal Chat/Work/owner boundaries; provider changes must not rewrite Books core.

Inspected inherited `providers.ts` and P11.7 tests. Existing commit `c96b9405e01911fd923dc9e4d17900015071c3d7` already supplies versioned adapters, health, capability routing, exact versions and fail-closed execution-boundary truth. Gap against current roadmap: connection state, credential-reference identity, supported formats, explicit upload/submit/state-retrieval/receipt capabilities, owner-action state, error/receipt lineage and provider replacement migration were not one canonical provider-connection contract.

Repair adds `provider-connection.ts`, focused tests and repository-only migration `20261027234500_p11_7_publishing_provider_connections.sql`. It stores references only (no credential secrets), rejects connected providers without credential references, prevents owner-required actions from posing as Normal Chat, and requires migration lineage for replacements.

No real KDP/distributor connection, account/browser action, credential creation, upload, publication, production migration, spend, or Category 12 work occurred.
