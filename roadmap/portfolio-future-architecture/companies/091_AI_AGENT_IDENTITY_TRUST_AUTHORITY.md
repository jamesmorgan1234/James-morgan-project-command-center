# Company 091 — AI Agent Identity & Trust Authority

**Company ID:** `company:future:091`  
**Primary project:** `project:company:future:091`  
**Roadmap version:** `COMPANY-091-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no external identity issuance, credential provisioning, cross-company trust or machine authority grant.

## Business identity
Purpose: provide verifiable identity, credential, delegation, ownership and trust records for autonomous software agents and their runtime instances.

Problem: agentic systems need to answer who an agent is, who owns it, what exact version/runtime is acting, who delegated authority, what it may do, how long authority lasts and whether its trust has changed.

Value: machine-verifiable agent passports, scoped delegation, revocation, accountability and cross-system trust without treating a model name or API token as identity.

## Complete product tree
Agent Identity Registry; Organization/Owner Identity Binding; Agent/Brain/Model/Runtime/Version Identity; Instance/Session Identity; Task-Scoped Identity; Credential Issuance; Temporary/Scoped Credentials; Signed Assertions; Agent Certificates/Passports; Delegation Chain Engine; Authority Scope Registry; Spending/Tool/Data/Communication Limits; Expiry/Revocation; Reputation/Trust Score; Behavior/Incident History; Cross-Organization Trust Relationships; Authentication Gateway; Verification API; Developer SDK; Enterprise Private CA/Authority; Agent Marketplace Trust Profile; Lifecycle/Retirement; Federation/Interoperability.

## Feature/customer/vertical tree
Features: stable agent ID, owner/org, creator/build provenance, brain/model/version, runtime/environment, instance/session, parent/delegator, scope/resource/actions, budgets, time/region/task restrictions, credential refs, signatures, attestation, incidents, trust/reputation, revocation/suspension and lifecycle.
Customers: agent platforms, enterprises, AI SaaS, marketplaces, developer ecosystems, machine-to-machine platforms, security/IAM vendors and regulated organizations.
Verticals: software agents, financial-operation agents, browser agents, support agents, procurement agents, infrastructure agents and cross-company agent networks.

## Brain capability / architecture
Trust reasoning may analyze behavior/incident evidence, but identity/credential/delegation verification must be cryptographic/deterministic. Architecture: globally stable identifier scheme, ownership registry, certificate/assertion service, KMS/vault, delegation graph, policy/authority records, runtime attestation hooks, revocation service, trust/reputation event ledger and federation protocol.

## Agent tree
Identity Provisioning Agent; Ownership Verification Agent; Credential Lifecycle Agent; Delegation Auditor; Runtime Attestation Agent; Trust/Reputation Analyst; Incident/Revocation Agent; Federation Agent; Policy QA Agent; Developer Support Agent.

## Deterministic services
Identifier issuance; key/cert generation refs; signature verification; scope subset checks; delegation depth; expiry; nonce/replay prevention; credential rotation; revocation lists/status; chain validation; signed attestations; trust-event hashes.

## Workflow tree
Owner/org authorizes identity → create stable agent identity tied to build/brain/runtime metadata → issue scoped credential/attestation → parent delegates subset authority for exact task → verifier checks identity/chain/scope/expiry/revocation → agent acts only through downstream policy gate → outcomes/incidents append trust evidence → rotate/suspend/revoke/retire without rewriting history.

## Integrations / API / data
IAM/SSO, KMS/vault, agent frameworks, model gateways, runtime/security gateways, tool providers, marketplaces, billing/commerce gateways, audit/SIEM. Data: identity/delegation/certificate metadata, scopes, trust events and revocation; private keys remain protected outside normal app data.

## Monetization / distribution
Agent identities, verifications, credential operations, trust lookups, enterprise/private authority, federation, SDK/API and certification programs. Distribution through AI-agent/IAM/security/developer ecosystems.

## Security/privacy/compliance
Identity authority is critical root infrastructure. Strong key protection, owner verification, anti-impersonation, replay defense, revocation propagation, no trust score without explainable evidence, no uncontrolled cross-company correlation and strict separation between identity and permission decisions.

## Failure / edge cases
Cloned agent, compromised runtime, stolen credential, model upgraded without identity version change, owner org changes, delegation chain too deep, clock skew, offline verifier, key compromise, malicious reputation report, cross-company naming collision, retired agent resurrected, task credential reused.

## Scale / overlap
Single enterprise registry → federated agent identity → potential trust layer for agentic internet. Overlap #2 control center, #4 permissions, #66 security gateway, #73 credential rotation, #92 commerce. #091 owns agent identity/delegation/trust primitive.

## Classification
**DESIGN NOW:** stable agent/brain/model/runtime/instance IDs, owner/delegator provenance, subset-only scopes, expiry/revocation, credential refs and trust-event evidence.  
**BUILD NOW:** Command Center Agency already has logical Project Agent/worker identities; reverse-map says these need a unified machine-identity envelope now rather than later retrofit.  
**BUILD BEFORE FIRST COMPANY:** external/federated agent credentials and portable verification.  
**COMPANY-SPECIFIC LATER:** commercial authority/marketplace trust network.  
**SCALE-ONLY:** global federation/reputation network.

# Mandatory 24-part completion block
1. Product Tree: identity/org binding/brain-model-runtime/instance/task identity/credentials/assertions/certs/delegation/scopes/trust/revocation/gateway/API/federation.
2. Feature Tree: IDs/owner/creator/build/model/runtime/session/delegator/scopes/budgets/time/region/task/credentials/signatures/incidents/revocation.
3. Customer Tree: agent platforms/enterprise/AI SaaS/marketplaces/dev/security/IAM/regulated.
4. Vertical Tree: software/financial/browser/support/procurement/infra/cross-company agents.
5. Brain Tree: trust analysis; identity/delegation cryptographic/deterministic.
6. Agent Tree: provisioning/ownership/credential/delegation/attestation/trust/incident/federation/QA/support.
7. Service Tree: IDs/keys-signatures/scope subset/depth/expiry/replay/rotation/revocation/chain/attestation.
8. Workflow Tree: authorize identity→issue→delegate subset→verify→act via policy→append outcomes→rotate/revoke/retire.
9. Integration Tree: IAM/KMS/agents/models/security/tools/marketplaces/billing/audit.
10. Data Tree: identities/delegations/certs/scopes/trust events/revocations.
11. API Tree: issue/verify/delegate/revoke/attest/trust/lifecycle.
12. Monetization Tree: identities/verifications/credential ops/trust queries/enterprise/API/certification.
13. Distribution Tree: agent/IAM/security/dev/OEM/federation partners.
14. Automation Tree: verification/expiry/rotation monitoring automatic; authority grants owner/policy controlled.
15. Moat Tree: interoperability/trust graph/attestation standards/integration ubiquity.
16. Platform Tree: identity API→agent passport authority→federated machine trust infrastructure.
17. Risk Tree: impersonation/key compromise/replay/false trust/cross-company correlation/revocation lag.
18. Scale Tree: enterprise→ecosystem→global federation.
19. Spinoff Tree: runtime attestation/trust scoring/certificate service; permissions/security remain adjacent.
20. Command Center Dependencies: Agency identities, provider/model registry, secrets/KMS, authorization, audit, incidents.
21. Design-Now Requirements: canonical machine-identity envelope across Brain, Project Agent, worker, tool and future company agents.
22. Build-Now Requirements: reconcile existing Agent/worker identity fields with stable owner/delegator/runtime/version/credential-reference contract.
23. Safe-to-Defer Requirements: federation/public trust network/commercial authority.
24. Autonomous Mature State: every agent action is attributable to a verifiable identity/delegation chain; humans manage trust roots, authority policy and major incidents.

## Saturation result
Further branches converge into agent governance, runtime security, credential rotation and commerce already represented.