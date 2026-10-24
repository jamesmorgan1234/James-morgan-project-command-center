# Company 043 — Cloud Cost Optimization Autopilot

**Company ID:** `company:future:043`  
**Primary project:** `project:company:future:043`  
**Roadmap version:** `COMPANY-043-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no cloud changes, purchases/reservations or paid-resource activation.

## Business identity

Purpose: continuously attribute, forecast and reduce cloud/software-infrastructure cost while preserving reliability/security/performance requirements.

Problem: compute, storage, database, network, GPU and AI-model spend grows through idle resources, wrong sizes, poor scheduling and architecture drift.

Value: evidence-backed cost allocation, waste detection, optimization recommendations and policy-bounded remediation.

## Product tree

Cost Inventory/Allocation; Idle/Orphan Resource Detection; Rightsizing; Schedule/Shutdown Planner; Storage Tier/Lifecycle Optimization; Database Cost Optimizer; Network/Egress Analyzer; GPU/Accelerator Optimizer; AI Model/Inference Cost Analyzer; Reservations/Commitment Planner; Spot/Preemptible Planner; Kubernetes/Container Cost; Serverless Cost; Multi-Cloud Comparison; Budget/Forecast/Anomaly; Unit Economics; Architecture Recommendation; FinOps Chargeback; Savings Verification; Policy/Guardrails; API/OEM; Enterprise Private.

## Feature/customer/vertical tree

Features: account/project/company/tag allocation, resource type/region, utilization, SLA/latency, dependencies, reserved/spot eligibility, lifecycle, data class, egress, model tokens/requests, workload schedule, anomaly, budget, forecast, recommendation confidence, projected/verified savings, remediation risk, approval/audit.

Customers: startups/SMBs, SaaS, AI companies, enterprises, platform/SRE/FinOps teams, agencies/MSPs, data/ML teams. Verticals broad; AI/GPU, SaaS, ecommerce and data-heavy workloads need specialized packs.

## Brain / architecture

Brain reasons about workload intent/dependencies, tradeoffs and architecture alternatives; predicts capacity/cost and recommends changes. Deterministic billing/utilization math and policy own savings calculations. It cannot terminate/resize/purchase resources without approval.

Architecture: cloud billing/cost ingest, resource graph, metrics/time series, rightsizing rules, forecast/anomaly models, optimization/constraint solver, policy engine, simulation, LLM for architecture explanation only with source metrics.

## Agent tree

Cost Allocation Agent, Idle Resource Agent, Rightsizing Agent, Schedule Agent, Storage Agent, Database Agent, Network Agent, GPU/AI Cost Agent, Commitment Agent, Container Agent, Forecast/Anomaly Agent, Architecture Analyst, Savings Verification Agent, Policy/Risk Agent, Multi-Cloud Analyst.

## Deterministic services

Billing/usage connectors; resource inventory/graph; metric collectors; cost calculator; budget/forecast; anomaly; rightsizing rules; simulation; recommendation ledger; savings verification; policy/approval; protected cloud-action gate; audit.

## Workflow

Ingest bills/resources/metrics → allocate/tag → detect waste/anomaly → model dependencies/SLA → simulate recommendation → calculate risk/savings → approval/policy → protected change in provider → verify performance/cost → rollback if degraded → record realized savings.

## Integrations / API / data

Cloud providers, Kubernetes, observability, model gateways, DB/storage services, IaC/Git, finance/ERP, ticketing, CMDB, deployment platforms. APIs for costs/resources/recommendations/forecast/budgets/savings.

Data moat: normalized cloud resource/cost graph, workload patterns, verified optimization outcomes and cross-provider mappings; customer configs isolated.

## Monetization / distribution

Cloud spend percentage, resources/accounts, seats, verified savings share, enterprise/private, MSP, API/OEM. Distribution through cloud marketplaces, FinOps/SRE communities, MSPs/integrators, observability/IaC partners.

## Security/privacy

Cloud metadata can expose architecture. Least-privilege read-only default, secret refs, protected remediation, no credentials to model, audit, company isolation. Recommendations must respect resilience/security/data residency.

## Failure / edge cases

Unused-looking failover resource, seasonal capacity, reserved commitments, cold start, bursty workload, shared cost tags, egress surprise, storage retrieval fees, performance regression, GPU queue backlog, provider pricing change. Verify before and after; keep rollback and uncertainty.

## Scale/overlap

Single account → enterprise multi-cloud FinOps → autonomous constrained optimization. Overlap #68 AI routing optimizer, #95 ROI, Resource Governor. #043 focuses infrastructure/cloud economics.

## Classification

**DESIGN NOW:** cost/resource telemetry, provider-neutral resource IDs, budgets/quotas, protected infrastructure changes, savings evidence.  
**BUILD NOW:** Command Center Global Resource/Financial Governors need these seams after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** per-company cost centers, provider resource registry, budget/anomaly controls.  
**COMPANY-SPECIFIC LATER:** cloud connectors/customer product/optimizer.  
**SCALE-ONLY:** global multi-cloud optimizer/commitment marketplace.

# Mandatory 24-part completion block

1. Product Tree: allocation/idle/rightsizing/schedules/storage/DB/network/GPU/AI/commitments/spot/K8s/serverless/multicloud/budget/forecast/unit economics/architecture/chargeback/savings/policy/API.
2. Feature Tree: scope/resource/region/utilization/SLA/deps/eligibility/lifecycle/data/egress/tokens/schedules/anomaly/budget/savings/risk/audit.
3. Customer Tree: startups/SaaS/AI/enterprise/platform/SRE/FinOps/MSP/data teams.
4. Vertical Tree: AI/GPU, SaaS, ecommerce, data-heavy and general infrastructure.
5. Brain Tree: dependency/cost/performance reasoning and recommendations; resource changes gated.
6. Agent Tree: allocation/idle/rightsize/schedule/storage/DB/network/GPU/commitment/container/forecast/architecture/savings/policy/multicloud.
7. Service Tree: billing/resource/metrics/cost/budget/anomaly/rules/simulation/recommendations/savings/policy/audit.
8. Workflow Tree: ingest→allocate→detect→simulate→risk/savings→approve→change→verify/rollback.
9. Integration Tree: clouds/K8s/observability/model gateway/DB/storage/IaC/finance/tickets/CMDB/deploy.
10. Data Tree: resources/usage/cost/tags/dependencies/budgets/recommendations/actions/outcomes.
11. API Tree: cost/resource/recommendation/forecast/budget/savings.
12. Monetization Tree: spend/resources/accounts/seats/savings-share/enterprise/MSP/API/OEM.
13. Distribution Tree: cloud marketplaces/FinOps/SRE/MSPs/observability/IaC.
14. Automation Tree: allocation/anomaly/recommendations/verification; destructive/purchase changes gated.
15. Moat Tree: normalized resource graph, workload patterns, verified savings, provider mappings.
16. Platform Tree: cost visibility→FinOps optimizer→policy-bounded autonomous resource governor.
17. Risk Tree: reliability/security regression, wrong savings, commitments, data residency, credential exposure.
18. Scale Tree: account→enterprise multi-cloud→global optimization.
19. Spinoff Tree: adjacent #68/#95; shared Resource Governor remains Command Center capability.
20. Command Center Dependencies: Resource/Financial Governors, providers, observability, policy, company isolation.
21. Design-Now Requirements: provider-neutral resource/cost/budget/action interfaces.
22. Build-Now Requirements: resource/cost governors after reverse-map likely required.
23. Safe-to-Defer Requirements: commercial cloud optimizer/connectors/pricing.
24. Autonomous Mature State: cost/forecast/anomaly/recommendations operate continuously; preapproved low-risk optimizations execute within hard reliability/budget limits; strategic commitments escalate.

## Saturation result

Additional branches are cloud-service-specific packs or AI routing/ROI capabilities already represented.
