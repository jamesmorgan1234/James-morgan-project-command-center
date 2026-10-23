# Command Center VNext — Architecture Branches

The clean-room rebuild is organized into these authoritative branches:

- A00 Owner Authority / Governance
- A01 Core Kernel / Lifecycle
- A02 Registries / Capability Fabric
- A03 Identity / Authentication / Sessions / Devices
- A04 Authorization / Policy / Risk / Approval
- A05 Secrets / Credential References
- A06 Data / Knowledge / Provenance / Assets
- A07 Command Graph / Entity Relationships
- A08 Command Bus / Event Bus / Workflow Runtime
- A09 Provider / Adapter Platform
- A10 Brain / AI Intelligence
- A11 Agent / Execution Infrastructure
- A12 Projects / Portfolio / Roadmaps / Progress
- A13 Personal Operations
- A14 Finance / Banking / Credit
- A15 Social / Communications / Publishing Accounts
- A16 Books / Publishing Platform
- A17 Commerce / Shopping / Coupon Orchestration
- A18 Media / Content / VeloClip Orchestration
- A19 Search / Notifications / Needs Me
- A20 Automation / Scheduling / Triggers
- A21 Analytics / Metrics / Recommendations / Self-Audit / Evidence
- A22 Security / Privacy / Trust / Incident Response
- A23 Recovery / Backup / Migration / Disaster Recovery
- A24 Client Shell / UX / PWA / Offline / Multi-device
- A25 Deployment / Release / Provenance / Rollback
- A26 Interoperability / MCP / A2A / Future Protocols
- A27 Dormant Future Multi-user / Commercial Fork Boundary

## Cross-cutting invariants

1. One canonical owner for each capability and data domain.
2. UI consumes contracts; UI is never canonical business truth.
3. Brain proposes; Agent executes; neither bypasses owner/security policy.
4. Provider-specific payloads normalize at adapters.
5. Protected mutations carry authorization, correlation, evidence, verification, and idempotency where relevant.
6. Optional/dormant modules cannot take down the core shell.
7. Every module declares failure, recovery, disable, and removal behavior.
8. Every critical state change is traceable to source/evidence.
9. No feature activates through Core Kernel surgery; dormant activation follows CONFIGURE -> CONNECT -> AUTHORIZE -> ENABLE.
10. James's private instance remains isolated from any future commercial/public fork.

## Release gates

G0 scope/authority; G1 source/protected assets; G2 build/type/schema; G3 unit; G4 contract/integration; G5 permission/security; G6 migration/recovery; G7 performance/resilience; G8 UX/accessibility/visual/device; G9 evidence/provenance; G10 category regression; G11 preview/staging; G12 production authorization; G13 live verification; G14 physical-device acceptance.

A failed gate blocks advancement.
