# Company 098 — Data Sovereignty & Workload Routing Platform

**Company ID:** `company:future:098`  
**Primary project:** `project:company:future:098`  
**Roadmap version:** `COMPANY-098-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer workload migration, provider activation, region change or production routing.

## Business identity
Purpose: route storage, compute and AI workloads according to jurisdiction, residency, sovereignty, privacy, customer contract, security, latency, cost and provider constraints.

Problem: modern systems spread data through databases, backups, logs, AI inference, embeddings, analytics, agents and support tools; a single provider default can violate customer/region policies or make later sovereignty retrofits extremely expensive.

Value: machine-enforced regional placement, prohibited-region blocking, explainable routing, compliant failover and migration planning without assuming every workload may run everywhere.

## Complete product tree
Data/Workload Classifier; Jurisdiction/Residency Policy Registry; Provider/Region Capability Catalog; Storage Router; Database Router; Backup Router; AI Inference Router; Training/Batch Router; Analytics/ETL Router; Agent/Browser-Worker Router; Search/Embedding/Vector Router; Log/Telemetry Router; Support-Data Router; Regional Failover; Prohibited-Region Gate; Contract/Customer Policy Overlay; Topology Dashboard; Policy Simulator; Migration Planner; Evidence/Audit; API/SDK; Enterprise/Private Deployment; Sovereign-Cloud Packs.

## Feature/customer/vertical tree
Features: workload/data ID, company/customer/tenant, data/sensitivity class, jurisdiction, required/allowed/prohibited regions/providers, contract/policy version, encryption/KMS location, model/provider capability, storage class, latency/cost limits, failover regions, current placement, desired placement, decision reason, evidence and migration state.

Customers: enterprises, SaaS, AI/data platforms, regulated organizations, multinational businesses, government/public-sector systems, cloud/platform providers and MSPs.

Verticals: AI inference, healthcare admin, finance-adjacent, government, HR, consumer privacy, enterprise analytics, support/CRM, software telemetry and global SaaS.

## Brain capability tree / architecture
Brain may interpret contracts/policy text and propose topology/migration plans. Runtime routing must be deterministic from versioned policy and verified provider/region capabilities. Architecture: data/workload registry, jurisdiction/policy ontology, provider-region capability registry, deterministic constraint solver, sensitivity/retention metadata, network/topology model, routing decision ledger, failover policy, migration planner and audit.

## Agent tree
Workload Classifier; Policy Mapping Agent; Provider/Region Analyst; Topology Agent; Routing Planner; Sovereignty QA Agent; Failover Agent; Migration Planner; Cost/Latency Analyst; Incident Agent; Audit/Evidence Agent.

## Deterministic services
Policy precedence; region/provider allow-deny; data-class constraints; capability matching; KMS/encryption constraints; latency/cost ceilings; deterministic route ranking; failover eligibility; placement verification; migration checkpoints; immutable decision evidence.

## Workflow tree
Register workload/data → classify sensitivity/jurisdiction/customer contract → resolve exact policy version → enumerate eligible providers/regions → remove prohibited placements → rank remaining routes under latency/cost/security constraints → route/store/process → verify actual placement → on outage select only policy-compliant failover → reconcile drift → plan protected migration when policy/provider changes.

## Integrations / API / data
Cloud/storage/database providers, AI/model gateways, KMS/vault, data catalogs, ETL/analytics, vector/search systems, logging/observability, browser/agent runtimes and contract/customer policy systems. Data: workload metadata, policy, provider capabilities, placement and decision evidence; customer raw payload need not be centralized.

## Monetization / distribution
Workloads/data stores/regions/providers, routing decisions, seats, enterprise/private, sovereign-cloud packs, API and managed architecture. Distribution via cloud/data/AI/security/compliance ecosystems.

## Security/privacy/compliance
Fail closed when residency is unknown, never treat cost as stronger than legal/security constraint, regional credentials and encryption keys isolated, no silent cross-region failover, immutable evidence and explicit customer-contract precedence. Product supports policy implementation; legal interpretation may need qualified review.

## Failure / edge cases
Provider region outage, service unavailable in required region, policy conflict, customer changes residency requirement, backup replicated globally by default, support vendor accesses data cross-border, model route lacks regional guarantee, DNS/CDN/logging leak, encryption key hosted elsewhere, migration partially completed, data derived into embeddings/cache.

## Scale / overlap
Single workload router → enterprise sovereignty control plane → multi-cloud global workload policy fabric. Overlap #68 model routing, #76 PII classification, #78 retention, #94 lineage. #098 owns jurisdiction-aware placement/routing.

## Classification
**DESIGN NOW:** region/jurisdiction/provider/location metadata, workload/data classification, policy precedence, compliant failover, provider capability registry and placement evidence.  
**BUILD NOW:** Command Center provider/data/artifact/Brain/Agency contracts must carry region/residency constraints now or later retrofit will be expensive.  
**BUILD BEFORE FIRST COMPANY:** portfolio company deployment/data-store registry must require region/provider policy before public launch.  
**COMPANY-SPECIFIC LATER:** commercial multi-cloud routing/migration product.  
**SCALE-ONLY:** global multi-provider topology optimization and sovereign-cloud network.

# Mandatory 24-part completion block
1. Product Tree: classifier/policy/provider catalog/storage/DB/backup/AI/training/analytics/agents/search/logs/support/failover/gate/topology/simulation/migration/API.
2. Feature Tree: workload/company/customer/data class/jurisdiction/allowed-prohibited/provider/KMS/latency/cost/failover/placement/reason/evidence.
3. Customer Tree: enterprise/SaaS/AI-data/regulated/multinational/government/cloud/MSP.
4. Vertical Tree: AI/health admin/finance/government/HR/consumer privacy/analytics/support/telemetry/global SaaS.
5. Brain Tree: contract/policy interpretation and planning; runtime placement deterministic.
6. Agent Tree: classifier/policy/provider/topology/routing/QA/failover/migration/cost/incident/evidence.
7. Service Tree: precedence/allow-deny/class constraints/capability/KMS/ceilings/ranking/failover/placement/checkpoints/evidence.
8. Workflow Tree: classify→policy→eligible routes→filter→rank→route→verify→compliant failover→reconcile/migrate.
9. Integration Tree: cloud/storage/DB/models/KMS/catalog/ETL/vector/logging/agents/contracts.
10. Data Tree: workloads/policies/provider capabilities/placements/decisions/migrations/evidence.
11. API Tree: classify/evaluate route/place/verify/failover/simulate/migration/evidence.
12. Monetization Tree: workloads/stores/regions/providers/decisions/seats/enterprise/API/managed.
13. Distribution Tree: cloud/data/AI/security/compliance/OEM.
14. Automation Tree: route/verify/failover automatic only within hard regional policy; migrations protected.
15. Moat Tree: provider-region capability graph, policy packs, topology history, compliance evidence.
16. Platform Tree: router→sovereignty control plane→global policy-aware workload fabric.
17. Risk Tree: unlawful placement/silent failover/derived-data leakage/wrong policy/provider misrepresentation.
18. Scale Tree: workload→enterprise→global multi-cloud.
19. Spinoff Tree: AI residency router/backup sovereignty modules; model routing/data lineage remain adjacent.
20. Command Center Dependencies: provider registry, sensitivity/region metadata, deployment factory, resource governor, lineage, policy, audit.
21. Design-Now Requirements: every provider-backed resource and AI/context/artifact operation can declare allowed/prohibited regions/providers.
22. Build-Now Requirements: add residency/region policy fields to Command Center provider, data, artifact, model, worker and deployment contracts before later categories proliferate them.
23. Safe-to-Defer Requirements: commercial customer routing/topology/migration engine.
24. Autonomous Mature State: workloads stay in compliant locations and fail over only to eligible regions; humans handle policy/legal ambiguity and major migrations.

## Saturation result
Further branches converge into model routing, data classification/retention, lineage and deployment infrastructure already represented.