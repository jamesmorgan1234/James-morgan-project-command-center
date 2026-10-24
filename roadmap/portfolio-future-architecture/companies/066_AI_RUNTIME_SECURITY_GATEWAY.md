# Company 066 — AI Runtime Security Gateway

**Company ID:** `company:future:066`  
**Primary project:** `project:company:future:066`  
**Roadmap version:** `COMPANY-066-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no external gateway deployment, customer traffic interception or production policy enforcement.

## Business identity
Purpose: sit between AI agents/models and tools/data/actions to enforce identity, permissions, risk, content security, policy, DLP and real-time allow/challenge/block decisions.

## Product tree
Agent Firewall; Model Firewall; Tool-Call Gateway; API Proxy; Data-Access Gateway; Browser/Code/Infra Action Gate; Financial/Communication Gate; Identity/Delegation Verifier; Prompt-Injection Defense; Malware/DLP Scanner; Behavioral Anomaly Engine; Policy/Risk Engine; Quarantine; Approval/Step-Up; Audit/Replay; Shadow/Simulation; Red-Team Harness; SDK/Sidecar/Proxy; Enterprise Appliance; Industry Policy Packs.

## Feature/customer/vertical tree
Features: actor/model/tool/resource identity, request intent, input/output provenance, sensitivity, permissions, delegated scope, budget, action reversibility/blast radius, normal-behavior baseline, content threats, DLP classes, policy version, decision reason, approval state, execution receipt, replay and incident links.
Customers: agent platforms, enterprises, AI SaaS, developer platforms, regulated organizations, security teams, AI infrastructure vendors.
Verticals: finance-adjacent, healthcare admin, legal ops, enterprise IT, software engineering, ecommerce, support, procurement; each needs policy/data/action packs.

## Brain capability / architecture
AI may classify intent/threat/context and explain risk; deterministic deny-by-default policy owns enforcement. Architecture: identity/delegation service, policy engine, risk scorer, trusted/untrusted content segmentation, DLP/malware/injection scanners, tool schema registry, secure proxy, approval broker, behavior model, audit ledger, replay/simulation and kill switch.

## Agent tree
Policy Analyst; Runtime Monitor; Threat Classifier; Behavior Analyst; DLP Agent; Tool Schema Agent; Approval Coordinator; Incident Agent; Red-Team Agent; Audit/Forensics Agent; Policy QA Agent.

## Deterministic services
AuthN/AuthZ; scope subset checks; schema validation; rate/budget limits; action class/risk lookup; secret redaction; content quarantine; circuit breakers; one-time authorization consume; idempotency; signed receipts; policy versioning.

## Workflow
AI/tool request → authenticate actor/runtime → bind delegated authority → classify resource/action/content → scan threats/DLP/injection → evaluate policy/risk/budget → allow/challenge/block/quarantine → step-up if needed → execute only through scoped connector → verify receipt → update behavior/audit → incident/escalation if anomalous.

## Integrations / API / data
Agent frameworks, model gateways, MCP/A2A/custom tools, APIs, browsers, code runners, clouds, databases, file systems, communication/payment providers, SIEM/GRC. Data: identities, requests, policy versions, scans, decisions, receipts, incidents; never centralize raw secrets unnecessarily.

## Monetization / distribution
Per request/tool call/agent/protected app, seats, policy packs, enterprise/private appliance, SDK/API, managed security. Distribution through AI developer/security ecosystems, cloud marketplaces and enterprise security channels.

## Security/privacy/legal
This company is itself a security boundary: fail closed on unknown identity/policy, tamper-evident decisions, isolated tenants, no model-only enforcement, emergency global kill, policy rollback, privacy-preserving telemetry.

## Failure / edge cases
Prompt injection inside tool output, compromised trusted tool, confused deputy, replay, stale authorization, identity impersonation, model provider outage, scanner outage, policy conflict, oversized payload, encrypted/malformed content, time-of-check/time-of-use drift, partial action execution.

## Scale / overlap
Agent SDK → enterprise gateway → foundational agentic-security control plane. Overlap #4 governance, #5 audit trail, #67 injection firewall, #73 secrets, #91 agent identity. #066 owns real-time runtime enforcement.

## Classification
**DESIGN NOW:** central action taxonomy, identity/delegation, deny-default policy, trusted/untrusted provenance, one-time authorization, audit, kill switch, policy versioning.  
**BUILD NOW:** Command Center already requires most of these; reverse-map should treat its own protected-action boundary as the internal reference implementation.  
**BUILD BEFORE FIRST COMPANY:** external tenant/gateway SDK, secure proxy, customer policy packs.  
**COMPANY-SPECIFIC LATER:** commercial gateway/SDK/appliance.  
**SCALE-ONLY:** global low-latency enforcement fabric.

# Mandatory 24-part completion block
1. Product Tree: firewall/proxy/data/action/identity/injection/DLP/behavior/policy/quarantine/approval/audit/replay/red-team/SDK/appliance.
2. Feature Tree: identity/intent/provenance/sensitivity/scopes/budget/reversibility/blast radius/threats/policy/reasons/receipts.
3. Customer Tree: agent platforms/enterprise/AI SaaS/devplatform/security/regulated.
4. Vertical Tree: finance/health admin/legal/IT/engineering/commerce/support/procurement.
5. Brain Tree: classify/analyze/recommend; enforcement deterministic.
6. Agent Tree: policy/runtime/threat/behavior/DLP/schema/approval/incident/red-team/forensics/QA.
7. Service Tree: auth/scope/schema/rate/budget/risk/redaction/quarantine/circuit breaker/authorization/idempotency/signing.
8. Workflow Tree: request→identity→scan→policy→allow/challenge/block→execute→verify→audit/incident.
9. Integration Tree: agents/models/tools/APIs/browsers/cloud/DB/files/comms/payments/SIEM.
10. Data Tree: identities/requests/policies/scans/decisions/receipts/incidents.
11. API Tree: evaluate/authorize/scan/execute receipt/audit/simulate.
12. Monetization Tree: requests/agents/apps/seats/packs/enterprise/API/managed.
13. Distribution Tree: AI/security/cloud/enterprise/OEM.
14. Automation Tree: policy evaluation automatic; protected approvals separate.
15. Moat Tree: policy packs, behavior corpus, threat telemetry, integration breadth.
16. Platform Tree: gateway→agent firewall→agentic security infrastructure.
17. Risk Tree: bypass/confused deputy/false allow/false block/privacy/tamper.
18. Scale Tree: app→enterprise→global fleet.
19. Spinoff Tree: injection firewall/DLP/trust modules; adjacent companies already represented.
20. Command Center Dependencies: kernel/security/Agency/tool registry/evidence/incidents/secrets.
21. Design-Now Requirements: internal runtime security gateway contract should exist now.
22. Build-Now Requirements: unify Command Center tool/action enforcement around this architecture.
23. Safe-to-Defer Requirements: customer-facing proxy/appliance/billing/packs.
24. Autonomous Mature State: routine AI actions are continuously screened/enforced; humans handle exceptional/high-impact approvals and policy changes.

## Saturation result
Further branches resolve into specialized injection, identity, secrets, audit or governance companies already in the portfolio.