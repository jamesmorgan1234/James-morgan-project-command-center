# Company 073 — Secrets & Credential Rotation Autopilot

**Company ID:** `company:future:073`  
**Primary project:** `project:company:future:073`  
**Roadmap version:** `COMPANY-073-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no credential discovery against external systems, rotation, revocation or application configuration mutation.

## Business identity
Purpose: discover credential dependencies, track lifecycle and safely rotate/revoke API keys, passwords, OAuth credentials, certificates, SSH keys, tokens, webhook secrets, service accounts and machine/agent credentials.

## Product tree
Secret Inventory; Ownership Registry; Dependency Discovery; Expiration Monitor; Rotation Scheduler; Dual-Key/Overlap Rotation; Emergency Revocation; Certificate Renewal; OAuth Client Rotation; Database Credential Rotation; Cloud/Service Account Rotation; SSH Key Rotation; Webhook Secret Rotation; Agent Credential Lifecycle; Vault Integrations; Application Update Orchestrator; Verification/Rollback; Leak Response; Policy/Compliance; Audit; API/SDK; Enterprise/Private Deployment; Provider Packs.

## Feature/customer/vertical tree
Features: credential reference/type/provider/account, owner, consumers/dependencies, scopes, created/last-rotated/expires, rotation method, overlap window, new/old state, verification probes, rollback, compromise state, policy, evidence and revocation propagation.
Customers: software teams, enterprises, security/IT, MSPs, DevOps, agent platforms, SaaS vendors and regulated organizations.
Verticals: cloud, databases, SaaS APIs, payments, CI/CD, developer tooling, AI agents, internal services and infrastructure.

## Brain capability / architecture
Brain may map dependencies and propose safe rotation sequence. Secret values remain outside Brain/memory/logs. Deterministic orchestration owns rotate→update consumers→verify→revoke-old, with protected approval based on risk. Architecture: secret-reference inventory, dependency graph, provider adapters, rotation state machine, temporary overlap, verification probes, rollback, audit and break-glass path.

## Agent tree
Credential Inventory Agent; Dependency Mapper; Expiry Agent; Rotation Planner; Provider Adapter Agent; Application Update Coordinator; Verification Agent; Emergency Revocation Agent; Leak Response Agent; Audit/Policy Agent.

## Deterministic services
Secret refs/vault APIs; dependency graph; schedule; locks; provider-specific rotation primitives; dual-key windows; config update transactions; health probes; rollback; redaction; one-time protected authorization; audit.

## Workflow
Credential registered/discovered → map owners/consumers → classify risk/expiry → plan rotation order/overlap → protected authorization → create/rotate new credential via provider → update exact dependent systems → verify all consumers → revoke old credential → monitor → close evidence; on failure rollback/contain without exposing value.

## Integrations / API / data
Vaults, clouds, databases, SaaS APIs, OAuth providers, certificate authorities, CI/CD, hosting, Kubernetes, code/config systems, webhooks, agent runtimes and SIEM. Data contains references/metadata/dependencies/evidence, not secret plaintext.

## Monetization / distribution
Credentials/dependencies/providers, rotations, seats, enterprise/private, compliance packs, API and managed security. Distribution via cloud/security/DevOps ecosystems and MSPs.

## Security/privacy/compliance
Highest secret-handling standard: zero plaintext exposure to client/Brain/logs, ephemeral secret handling, strict least privilege, two-person/step-up where needed, break-glass audit, no automatic broad rotation when dependency completeness is uncertain.

## Failure / edge cases
Unknown consumer, provider only allows destructive rotation, dual-key unsupported, app update succeeds partially, rollback impossible, stale instance still uses old key, certificate chain issue, clock skew, secret leaked during transition, provider outage, emergency revocation breaks service. Dependency uncertainty must block routine destructive revocation.

## Scale / overlap
Small vault inventory → enterprise credential lifecycle → machine/agent credential control plane. Overlap #5 audit, #66 runtime security, #74 permissions, #91 agent identity. #073 owns credential lifecycle/rotation.

## Classification
**DESIGN NOW:** secret-reference-only architecture, dependency graph, rotation/version states, protected credential actions, redaction, audit/rollback.  
**BUILD NOW:** Command Center already needs P2.5 secret isolation; reverse-map confirms rotation/dependency metadata must be first-class.  
**BUILD BEFORE FIRST COMPANY:** external vault/provider adapters and customer dependency discovery.  
**COMPANY-SPECIFIC LATER:** commercial scanners/provider packs/pricing.  
**SCALE-ONLY:** global credential fleet and automated certificate/key infrastructure.

# Mandatory 24-part completion block
1. Product Tree: inventory/ownership/dependencies/expiry/scheduler/dual-key/revoke/certs/OAuth/DB/cloud/SSH/webhook/agent/vault/update/verify/leak/API.
2. Feature Tree: reference/type/provider/account/owner/consumers/scopes/dates/method/overlap/state/probes/rollback/compromise/evidence.
3. Customer Tree: software/enterprise/security/IT/MSP/DevOps/agents/SaaS/regulated.
4. Vertical Tree: cloud/DB/SaaS/payments/CI/devtools/AI/internal infra.
5. Brain Tree: dependency/sequence reasoning only; secret values prohibited.
6. Agent Tree: inventory/dependency/expiry/planner/provider/update/verifier/revocation/leak/audit.
7. Service Tree: vault refs/graph/scheduler/locks/rotation/config update/probes/rollback/redaction/auth/audit.
8. Workflow Tree: register→map→plan→authorize→rotate→update→verify→revoke→monitor/evidence.
9. Integration Tree: vault/cloud/DB/SaaS/OAuth/CA/CI/K8s/config/webhooks/agents/SIEM.
10. Data Tree: refs/owners/dependencies/scopes/lifecycle/verification/incidents/evidence.
11. API Tree: inventory/dependencies/plan/rotate status/verify/revoke/evidence.
12. Monetization Tree: credentials/providers/rotations/seats/enterprise/API/managed.
13. Distribution Tree: cloud/security/DevOps/MSP/OEM.
14. Automation Tree: expiry/planning/verification automatic; actual high-risk rotation protected.
15. Moat Tree: dependency graph/provider adapters/rotation reliability/outcome history.
16. Platform Tree: rotation tool→credential lifecycle OS→machine-identity infrastructure.
17. Risk Tree: secret leak/outage/orphan consumer/wrong revoke/rollback failure.
18. Scale Tree: vault→enterprise→global fleet.
19. Spinoff Tree: certificate automation/leak response; identity and permission products remain separate.
20. Command Center Dependencies: secret refs, provider registry, protected actions, health probes, incidents, audit.
21. Design-Now Requirements: every secret must have reference/owner/provider/lifecycle/dependency metadata.
22. Build-Now Requirements: extend Command Center secret registry toward safe rotation/revocation seams without exposing values.
23. Safe-to-Defer Requirements: customer discovery/provider fleet/commercial product.
24. Autonomous Mature State: expiry/dependency/rotation planning is continuous; authorized rotations execute with verification and rollback, humans handle incomplete dependency maps/emergencies.

## Saturation result
Further branches converge into agent identity, cloud permissions and runtime security already represented.