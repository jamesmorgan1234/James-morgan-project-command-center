# Company 002 — AI Agent Control Center

**Company ID:** `company:future:002`  
**Primary project:** `project:company:future:002`  
**Roadmap version:** `COMPANY-002-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** architecture/roadmap only; no customer deployment, external agent fleet connection, paid infrastructure or production control.

## Business identity

Purpose: provide a vendor-neutral control plane for discovering, registering, governing, routing, observing, evaluating, budgeting, coordinating and safely stopping fleets of AI agents and autonomous workers.

Customer problem: agent fleets fragment across frameworks/providers, lack consistent identity/permissions/budgets/evaluations, produce opaque cost/risk, and become difficult to supervise at scale.

Value: one auditable operational layer over heterogeneous agent runtimes without forcing one model or framework.

Delivery: SaaS control plane, private/VPC deployment, self-hosted enterprise package, API/SDK, embedded/OEM control plane, managed operations.

## Product tree

1. Agent Registry & Inventory — logical agents, instances, versions, owners, teams, tools, capabilities, environments.
2. Agent Identity & Session Console — runtime identity, credentials refs, active sessions, trust/revocation integration.
3. Permissions & Policy Console — scopes, tool/data/action rights, expiration, protected actions, decision rights.
4. Agent Health & Operations — heartbeat, queue, leases, errors, stuck work, stale workers, incidents.
5. Routing & Dispatch — capability/risk/cost/latency-aware task-to-agent/executor routing.
6. Budget & Cost Control — model/API/compute/browser/tool budgets, quotas, alerts, halt policy.
7. Agent Team / Hierarchy Builder — leads, specialists, delegation, fan-out/depth, verification roles.
8. Evaluation Center — task quality, tool correctness, policy, regression, adversarial, reliability, cost/performance.
9. Memory Visibility & Governance — memory sources, scopes, retention, provenance, deletion, cross-agent isolation.
10. Inter-Agent Messaging & Event Fabric — typed messages, contracts, correlation, delivery, replay, audit.
11. Simulation / Sandbox — dry-run agent teams, synthetic workloads, failure injection, policy simulation.
12. Incident Command — contain, pause, drain, kill, replace, rollback, recover, forensic timeline.
13. Audit & Replay — decisions, routes, model/provider/tool choices, approvals, state transitions, deterministic replay where possible.
14. Certification / Trust Score — enterprise policy/evaluation packs and evidence-based agent readiness labels.
15. Benchmarking — agent/framework/model/executor performance/cost/reliability benchmarks.
16. Marketplace/Registry — optional future vetted agents/tools/policy/evaluation packs, not an unrestricted code marketplace.
17. Enterprise Governance — SSO/SCIM/orgs, RBAC/ABAC, tenant isolation, legal/compliance reports.
18. Developer Platform — APIs, SDKs, CLI, adapters for agent frameworks/tool protocols/event buses.
19. OEM/Embedded — control-plane components inside other platforms.
20. Managed AgentOps — future managed operations/incident/evaluation service.

## Feature tree

Fleet overview, search/filter/tags, logical-vs-runtime identity, manifests/versioning, capability/tool schemas, health, queues, leases, budgets, cost attribution, rate/concurrency limits, dependencies, team topology, run traces, state snapshots, checkpoint/resume, approvals, protected-action gates, kill switches, policy simulation, audit export, incident timelines, memory provenance, model/provider routing, canaries, rollout, analytics, SLA/error budgets, accessibility, localization, API/webhook administration.

Power/enterprise: private regions, BYO model/provider, customer-managed keys, VPC/private networking, retention/legal holds, policy packs, custom evaluators, custom agent protocols, audit signing, delegated org admins, separation of duties.

## Customer tree

AI-native startups; enterprises building internal agents; SaaS vendors embedding agents; developer platforms; agencies/integrators; security/governance teams; data/ML platform teams; support/ops automation vendors; regulated organizations; research labs; government/education where policy permits; MSP/managed AI operators.

## Vertical tree

Cross-industry core with domain packs for finance operations, support, software engineering, healthcare-adjacent administrative use, legal/compliance operations, ecommerce, logistics, HR/IT, cybersecurity, public sector, research. High-stakes verticals require stricter human approval/evaluation/compliance packs and may prohibit autonomous actions.

## Brain capability tree

Know fleet topology, capabilities, policies, run history, evaluator results, provider health/cost, incidents. Understand task intent/risk and agent suitability. Reason about routing/team formation/authority boundaries. Predict capacity, failure, cost and quality. Optimize dispatch, model/provider, concurrency and budgets. Recommend policy/team changes. Execute only low-risk internal routing/containment within explicit policy. Monitor/learn from verified outcomes. Remember fleet decisions/provenance, not unrestricted raw customer data. Verify evaluator/health/policy evidence. Escalate protected actions, ambiguous authority, incidents, budget/security anomalies.

Action classes: observe/analyze broadly; route/delegate within policy; policy/permission/budget expansion requires approval; financial/public/destructive actions remain separately gated; impersonation or authority self-amplification prohibited.

## Brain architecture

Hybrid deterministic control plane plus reasoning layer. State machines for runs/leases/delegation; policy engine; graph for topology/dependencies/authority; time-series metrics; event stream; relational registry; object store for evidence; optional vector/search for run/evaluation retrieval; LLM/small model for analysis/planning/explanation, never sole authorization; optimization for scheduling/resource allocation; anomaly detection for behavior/cost.

## Agent tree

- Fleet Planner — topology/capacity/team recommendations.
- Routing Optimizer — candidate scoring, no authority expansion.
- Policy Analyst — identifies permission/policy conflicts; cannot self-grant.
- Evaluation Agent — builds/runs test packs.
- Reliability Monitor — health/stall/failure detection.
- Incident Agent — containment recommendations and safe preauthorized actions.
- Cost Agent — budgets/unit economics/cost anomalies.
- Security Agent — unusual tool/data/action behavior.
- Memory Governance Agent — provenance/retention/scope review.
- Integration Agent — adapter health/version compatibility.
- Rollout Agent — canary/shadow analysis; promotion protected.
- Audit/Replay Agent — reconstructs run decisions.
- Support/Diagnostics Agent — customer fleet troubleshooting.

## Deterministic services

Agent registry; identity/session store; policy evaluator; authorization gateway; task/queue scheduler; leases/fencing; resource locks; event bus; telemetry collectors; budget meter; rate/concurrency limiter; checkpoint store; evaluator runner; audit ledger; rollout/canary engine; notification/incident rules; adapter registry; secret-reference service.

## Inputs / outputs / workflows

Inputs: agent manifests, task requests, policies, tool schemas, provider/model data, runtime health/events, budgets, evaluator evidence, owner/admin decisions.

Outputs: route/team decisions, policy decisions, health/incident state, cost/evaluation metrics, checkpoints, audit/replay records, notifications, safe stop/recovery commands.

Core workflow: task → classify scope/risk → policy → dependency/capability match → budget/resource check → select executor/team → issue scoped assignment → heartbeat/checkpoint → independent verification → integrate result → evidence/cost → close or escalate.

Incident: detect → scope blast radius → freeze affected authority/claims → preserve evidence → replace/recover from checkpoint → verify → reopen.

## Integration tree

Agent frameworks/protocols, model gateways, tool/MCP-like servers, cloud/serverless/Kubernetes, Git/CI, ticketing, messaging, observability, IAM/SSO/SCIM, secret vaults, DB/queues, browsers, code sandboxes, billing/cost systems, security SIEM/SOAR, data catalogs, support systems.

## API/developer ecosystem

Agent registration/manifests; task dispatch; policy decision; lease/checkpoint; telemetry ingest; evaluation APIs; incident/kill APIs; audit export; adapters/SDKs; CLI; Terraform/provider later; webhooks/events; framework plugins; evaluator/policy pack SDK.

## Data architecture / moat

Agent/version registry; capability graph; authority/delegation graph; run/task event log; health/time series; model/provider/tool performance; evaluation corpus; incident/recovery history; cost metrics; memory provenance metadata. Moat may emerge from cross-framework interoperability, evaluator corpus, routing reliability and operational history—without pooling confidential customer data.

## Monetization / packaging

Free dev tier with small agent count; Pro by agents/runs/events; enterprise by org/scale/features; usage metering; private/VPC/self-hosted license; premium evaluation/security packs; managed AgentOps; OEM; support/SLA. Avoid charging in ways that obscure runaway agent cost.

## Distribution / lifecycle

Developer integrations, framework plugins, OSS SDKs, technical docs, security/governance partnerships, cloud marketplaces, integrators. Lifecycle: connect sandbox agents → observe → enforce policy → add evaluations/budgets → enable routing → expand teams → enterprise controls → export/retire.

## Security/privacy/compliance

Deny-by-default scopes; immutable identities/versions; no secret exposure; signed events; tenant/company/project isolation; protected-action gates; fresh verification; separation of duties; prompt-injection/untrusted tool-output handling; sandboxing; supply-chain controls; audit/retention/deletion; regional/privacy policies; kill switches.

## Failure / edge cases

Split-brain scheduler, stale workers, replayed tasks, duplicate side effects, runaway delegation, prompt injection, tool compromise, model outage, provider throttling, bad evaluator, policy drift, cost spike, memory leakage, queue partition, heartbeat loss, malicious agent, corrupted checkpoint. Use fencing, idempotency, bounds, independent verification, circuit breakers, quarantine, safe mode, deterministic recovery.

## Scale

Micro: tens of agents.  
~$100K ARR: hundreds/thousands managed events, standard adapters.  
~$1M: enterprise orgs, HA scheduler, regional/tenant isolation.  
~$10M: many enterprise fleets, dedicated control planes, sophisticated policy/evaluation marketplace.  
~$100M+: global multi-region/federated control, standards ecosystem, agent identity/trust integration.

## Moats / network effects / platform

Framework neutrality, deep operational evidence, policy/evaluation library, agent capability graph, secure adapter ecosystem, reliability/cost benchmarks. Network effects from compatible adapters/packs/benchmarks, but isolation/privacy prevents raw customer fleet pooling. Platform potential high: AgentOps control plane and governance marketplace.

## Spinoffs / overlap

Strong overlap but distinct from #4 permissions, #5 audit, #66 runtime security, #68 routing optimizer, #91 agent identity/trust, #95 ROI. These should integrate through contracts, not be merged automatically. New spinoffs: agent simulation/testing pack marketplace, fleet reliability benchmark—record only if independently valuable.

## Classification

**DESIGN NOW:** agent identity/version/capability contracts; scoped authorization; durable run/task/checkpoint/event primitives; resource/cost governors; company/project isolation; evaluator evidence; kill/recovery interfaces.  
**BUILD NOW:** Command Center already needs many analogous Agency primitives; reverse-map shared interfaces, not Company 002 product UI.  
**BUILD BEFORE FIRST COMPANY:** portfolio-scale company/tenant isolation, shared Brain/Agent factories, metering/billing abstractions, provider adapters.  
**COMPANY-SPECIFIC LATER:** external customer fleet connectors, enterprise portal, marketplace, pricing.  
**SCALE-ONLY:** federated/global control planes and dedicated customer clusters.

# Mandatory 24-part completion block

1. **Complete Product Tree:** registry, identity, permission, health, routing, budgets, team builder, evals, memory governance, messaging, simulation, incidents, audit/replay, certification, benchmarks, marketplace, enterprise, developer/OEM/managed.
2. **Complete Feature Tree:** fleet inventory through kill/recovery, policy/eval/cost/health/audit/rollout/admin/accessibility/localization.
3. **Complete Customer Tree:** AI startups, SaaS, enterprise, platforms, integrators, security/governance, regulated/public/research operators.
4. **Complete Vertical Tree:** cross-industry plus high-stakes domain packs with stricter controls.
5. **Complete Brain Capability Tree:** topology/risk/routing/capacity/cost/quality/policy reasoning with no self-authority.
6. **Complete Agent Tree:** fleet/routing/policy/eval/reliability/incident/cost/security/memory/integration/rollout/audit/support.
7. **Complete Service Tree:** registry/identity/policy/scheduler/leases/locks/events/telemetry/budgets/checkpoints/evals/audit/rollout/adapters/secrets.
8. **Complete Workflow Tree:** task dispatch, team formation, verification/integration, incident/recovery, rollout/deprecation.
9. **Complete Integration Tree:** frameworks/models/tools/cloud/Git/observability/IAM/secrets/DB/queue/browser/billing/security/support.
10. **Complete Data Tree:** agents/capabilities/authority/runs/events/health/evals/incidents/cost/memory provenance.
11. **Complete API/Developer Tree:** registration/dispatch/policy/lease/checkpoint/telemetry/eval/incident/audit/adapter/SDK/CLI/events.
12. **Complete Monetization Tree:** tiers, agents/runs/events, enterprise, private/self-hosted, packs, managed ops, OEM, SLA.
13. **Complete Distribution Tree:** plugins/SDKs/docs/OSS/cloud marketplaces/integrators/security partners.
14. **Complete Automation Tree:** registry, routing, health, evaluation, cost, containment, recovery, rollout analysis.
15. **Complete Moat Tree:** interoperability, eval corpus, policy library, adapter ecosystem, operational benchmarks/trust.
16. **Complete Platform Tree:** fleet dashboard → control plane → governance/evaluation ecosystem → agent infrastructure platform.
17. **Complete Risk Tree:** authority amplification, leakage, prompt/tool attacks, split brain, stale workers, duplicate effects, cost runaway.
18. **Complete Scale Tree:** tens → thousands → enterprise HA → multi-region/federated global fleets.
19. **Complete Spinoff Tree:** existing #4/#5/#66/#68/#91/#95 preferred; simulation/benchmark packs recorded only if distinct.
20. **Command Center Dependencies:** Agency primitives, policy/security, registries, governors, observability, Brain Factory, isolation.
21. **Design-Now Requirements:** portable agent manifest/identity/capability/authority/run/eval/health/cost/recovery contracts.
22. **Build-Now Requirements:** reuse/strengthen Command Center Agency foundations after reverse-map; no customer product build.
23. **Safe-to-Defer Requirements:** external framework marketplace, enterprise fleet portal, pricing, managed service, global federation.
24. **Autonomous Mature State:** customer fleets self-register/operate within policies; routing/evals/health/cost/containment run automatically; Command Center supervises Company 002; James handles strategic/protected exceptions.

## Saturation result

Remaining coherent branches resolve into the product/control-plane modules above or neighboring portfolio companies for permission, audit, runtime security, routing, trust and ROI. No new top-level company is required by this pass.
