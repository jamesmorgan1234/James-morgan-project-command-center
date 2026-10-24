# Company 004 — AI Permission / Governance Platform

**Company ID:** `company:future:004`  
**Primary project:** `project:company:future:004`  
**Roadmap version:** `COMPANY-004-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: define and enforce what AI systems, models, agents and automated workflows are allowed to read, infer, communicate, purchase, modify, delete, publish or delegate.

Problem: traditional RBAC/ACL systems are not enough for contextual, time-bound, task-bound autonomous actions; AI systems need explicit purpose, resource, risk, cost, data and delegation constraints with explainable decisions.

Value: central policy/decision infrastructure that keeps agentic systems useful without allowing hidden authority amplification.

Delivery: policy API/gateway, SDK, enterprise control plane, embedded library, private/self-hosted decision service, policy pack marketplace, governance reporting.

## Product tree

1. AI Authorization Decision Point — deterministic allow/deny/step-up decision API.
2. Policy Authoring Studio — human-readable + machine policy, simulation, linting, conflict detection.
3. Agent/Model Permission Registry — identities, tools, resources, actions, scopes, expiry.
4. Delegation Engine — parent/child authority, depth/fan-out, non-amplification, revocation.
5. Protected Action Gate — spending, publish, send, delete, deploy, security, legal, customer-data actions.
6. Data Access Governance — read/write/derive/export/use-purpose constraints and sensitivity.
7. Tool Permission Gateway — tool/schema/action parameter bounds.
8. Budget/Spend Authority Policy — limits, merchant/category/price/volume/time rules; no payment execution itself.
9. Communication Governance — channel/recipient/content/action boundaries.
10. Human Approval & Step-Up — fresh verification, multi-party/separation-of-duties, timed approvals.
11. Contextual Risk Engine — reversibility, blast radius, sensitivity, confidence, novelty, anomaly.
12. Policy Lifecycle — version, rollout, canary, expiry, review, supersession, rollback.
13. Governance Evidence — decision logs, rationale, policy refs, audit/export.
14. Regulatory/Industry Packs — configurable mappings, not legal advice.
15. Simulation / What-If — evaluate proposed policy against historical/synthetic workloads.
16. Access Review / Certification — who/what can do what, unused/overbroad authority.
17. Emergency Containment — revoke identity/tool/provider/action class/company/project.
18. Developer Platform — decision API, policy SDK/DSL, adapters, test harness, CI policy checks.
19. OEM/Embedded — policy engine inside agent platforms and products.
20. Managed Governance — enterprise policy design/review support where appropriate.

## Feature tree

Subjects/agents/users/services; resources; actions; attributes; context; purpose; task/run/project/company scope; time/expiry; geolocation/residency where lawful; risk class; cost limits; data classification; confidence; tool parameters; delegation chain; fresh verification; approval count; deny reasons; obligations; audit; simulation; policy test fixtures; policy lint; conflict/resolution; staged rollout; rollback; review campaigns; exceptions; accessibility/localized admin UI.

## Customer tree

AI platforms, enterprises, SaaS vendors, agent builders, financial/commerce operators, support automation, security teams, governance/compliance, developer platforms, public sector, regulated industries, MSP/integrators.

## Vertical tree

Finance operations; healthcare admin; legal/compliance; ecommerce/procurement; software deployment; customer communications; HR/IT automation; cybersecurity; public sector; data platforms. Each vertical needs its own protected-action catalog and decision-rights pack.

## Brain capability tree

Brain may understand natural-language intent/policy drafts, detect policy conflicts, map business rules to machine policy, simulate impact and recommend least privilege. Enforcement itself should be deterministic. Brain may not decide to self-grant authority. It can analyze/recommend; machine policy executes allow/deny/step-up within preapproved boundaries; owner/human approval required for protected authority changes.

Know identities/resources/actions/policies/delegation/history. Reason about conflicts, implied authority, blast radius. Predict impact of policy change. Optimize least privilege/approval burden. Monitor anomalies/unused rights. Verify decision provenance. Escalate ambiguous policy or safety/legal conflicts.

## Brain architecture

Deterministic policy engine plus graph/attribute evaluation; relational registry; append-only decision log; graph for delegation/resource relationships; rules/constraint solver; anomaly detection for behavior/permission creep; LLM only for policy translation/explanation/conflict discovery with machine validation and human review.

## Agent tree

- Policy Analyst — drafts/compares policies.
- Least-Privilege Agent — recommends scope reduction.
- Access Review Agent — recurring certification.
- Delegation Auditor — detects amplification/cycles.
- Risk Analyst — context/blast-radius scoring recommendations.
- Simulation Agent — replays workloads against candidate policy.
- Governance Evidence Agent — reports/audit bundles.
- Policy Migration Agent — schema/version transitions.
- Incident Containment Agent — proposes targeted revocations.
- Regulatory Mapping Agent — maps requirements to controls, never legal authority.

## Deterministic services

Policy decision point; policy information point; attribute resolver; subject/resource registry; delegation graph; authorization cache with revocation safety; expiry/revocation service; fresh-verification integration; approval workflow engine; audit ledger; policy compiler/linter; simulation runner; change rollout/rollback; emergency deny list.

## Workflows

Request → authenticate subject → resolve resource/action/context → load effective policy/version → evaluate deny-by-default → obligations/step-up/approval → issue bounded authorization decision/token → action boundary consumes/validates once → post-action verification/audit.

Policy change: draft → lint/conflict → simulation → reviewer/owner approval → canary → activate version → observe → rollback/retire.

## Integration tree

IAM/SSO/SCIM; agent control planes; API gateways; tools/MCP-like protocols; data catalogs; secrets/vaults; billing/spend systems; deployment platforms; messaging; DB/storage; SIEM/SOAR; device/session/passkey systems; ticketing/approval; cloud IAM.

## API/developer ecosystem

Decision API; policy CRUD/version APIs; simulation API; authorization/token introspection; revocation; delegation; review; audit export; SDKs; policy DSL; CI checker; adapters/middleware/proxies; test fixtures; webhook events.

## Data architecture / moat

Versioned policy graph, decision-rights registry, delegation graph, authorization decisions, access reviews, exceptions, simulations, incidents. Moat: mature cross-system action ontology, policy/testing corpus and integration ecosystem; customer policy remains isolated.

## Monetization

Per decision/request, agent/user/resource count, enterprise license, private/self-hosted, policy pack, audit/report retention, managed governance, OEM. Avoid monetizing approvals in a way that encourages unnecessary friction.

## Security/privacy/compliance

This product is itself critical infrastructure: signed/versioned policy, HA fail-closed behavior for protected actions, tamper-evident audit, strict admin step-up, separation of duties, no policy-by-prompt bypass, secret isolation, regional deployment, secure policy cache invalidation, supply-chain protection.

## Failure / edge cases

Policy conflict, stale cache, revocation race, clock skew, ambiguous subject/resource, context spoofing, forged task scope, replayed authorization, compromised admin, unavailable policy service, policy bug blocking business, overbroad natural-language translation. Use deny-default, signed versions, deterministic compilation, short-lived auth, revocation channels, break-glass with evidence, simulation/canary/rollback.

## Scale

Micro: one product/few agents.  
~$100K ARR: teams/orgs, reusable packs.  
~$1M: enterprise HA/private deployments/access reviews.  
~$10M: multi-region decision service, broad integration ecosystem.  
~$100M+: cross-platform authorization standard/gateway with global policy federation.

## Moat / platform

Action/resource ontology, policy compiler/test corpus, decision evidence, integration adapters, trusted enforcement reliability. Potential network effect from standardized packs/SDKs—not sharing private customer policies. High platform potential as agentic authorization layer.

## Spinoffs / overlap

Distinct but integrates with #2 control center, #5 audit, #66 runtime security, #70 entitlements, #74 cloud permission optimizer, #75 access review, #91 agent identity, #92 commerce gateway. Do not merge automatically.

## Classification

**DESIGN NOW:** central action/resource/risk vocabulary, scoped authority, non-amplifying delegation, fresh verification, single-use/revocable authorization, audit provenance.  
**BUILD NOW:** Command Center already needs equivalent protected-action policy contracts; reverse-map shared foundations.  
**BUILD BEFORE FIRST COMPANY:** company/tenant policy namespaces, policy pack interfaces, access review/activation contracts.  
**COMPANY-SPECIFIC LATER:** external policy product, enterprise integrations/pricing.  
**SCALE-ONLY:** global federated policy planes and large policy marketplace.

# Mandatory 24-part completion block

1. **Complete Product Tree:** decision point, authoring, registry, delegation, protected/data/tool/spend/comms gates, approvals, risk, lifecycle, evidence, packs, simulation, reviews, containment, dev/OEM/managed.
2. **Complete Feature Tree:** subjects/resources/actions/context/purpose/time/risk/cost/data/delegation/freshness/approvals/audit/simulate/version/rollback/review.
3. **Complete Customer Tree:** AI platforms, enterprise, SaaS, security/governance, regulated/public/integrators.
4. **Complete Vertical Tree:** finance, health admin, legal/compliance, commerce/procurement, software, communications, HR/IT, cyber, public/data platforms.
5. **Complete Brain Capability Tree:** translate/analyze/recommend/simulate/monitor; deterministic enforcement; self-grant prohibited.
6. **Complete Agent Tree:** policy, least privilege, review, delegation, risk, simulation, evidence, migration, incident, regulatory mapping.
7. **Complete Service Tree:** PDP/PIP, registries, graph, cache/revocation, approvals, audit, compiler/linter, simulation, rollout, emergency deny.
8. **Complete Workflow Tree:** authorize/consume/verify and policy draft→simulate→approve→canary→activate→rollback.
9. **Complete Integration Tree:** IAM, agents, gateways, tools, catalogs, secrets, spend, deployment, comms, data, security, devices, approvals, cloud IAM.
10. **Complete Data Tree:** policies, subjects/resources, delegation, decisions, reviews, exceptions, simulations/incidents.
11. **Complete API/Developer Tree:** decisions, policies, simulation, introspection, revocation, delegation, review, audit, SDK/DSL/CI/adapters.
12. **Complete Monetization Tree:** decisions/agents/resources, enterprise/private, packs, retention, managed, OEM.
13. **Complete Distribution Tree:** platform/framework adapters, security/IAM partnerships, OSS SDKs, enterprise integrators.
14. **Complete Automation Tree:** deterministic decisions, expiry/revoke, reviews, simulation, conflict detection, targeted containment.
15. **Complete Moat Tree:** ontology, policy compiler/test corpus, adapters, enforcement reliability/trust.
16. **Complete Platform Tree:** policy engine → governance control plane → cross-platform agentic authorization infrastructure.
17. **Complete Risk Tree:** stale/incorrect policy, cache/revocation race, spoofed context, replay, compromised admin, availability, overbroad translation.
18. **Complete Scale Tree:** local/embedded → enterprise HA → multi-region → federated/global standard.
19. **Complete Spinoff Tree:** existing #2/#5/#66/#70/#74/#75/#91/#92 cover adjacent businesses.
20. **Command Center Dependencies:** identity/security, policy engine, Agency scopes, company isolation, audit/evidence, Brain policy packs.
21. **Design-Now Requirements:** deterministic authority contracts and non-amplifying delegation.
22. **Build-Now Requirements:** strengthen shared Command Center policy boundary after reverse-map; no external Company 004 product.
23. **Safe-to-Defer Requirements:** customer policy studio, marketplace, private enterprise packaging, pricing.
24. **Autonomous Mature State:** deterministic policy handles routine decisions, AI analyzes policy/risk, access reviews and simulations run automatically, James handles protected policy/authority changes.

## Saturation result

Additional coherent governance branches are modules/packs or are already represented by adjacent identity/security/audit/entitlement companies. No new top-level company emerges.
