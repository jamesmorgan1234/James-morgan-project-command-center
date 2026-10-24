# Company 074 — Cloud Permission Optimizer

**Company ID:** `company:future:074`  
**Primary project:** `project:company:future:074`  
**Roadmap version:** `COMPANY-074-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no IAM policy change, privilege revocation or cloud mutation.

## Business identity
Purpose: continuously reduce excessive permissions across cloud, SaaS, databases, machine identities and agents while proving required functionality remains available.

## Product tree
IAM Inventory; Identity/Role Graph; Effective Permission Analyzer; Usage-Based Permission Evidence; Unused Privilege Detector; Privilege-Creep Monitor; Dormant Identity Detector; Least-Privilege Recommender; Policy Simulator; Blast-Radius Analyzer; Temporary Elevation; Access Request Workflow; Remediation Planner; Approved Auto-Remediation; Cross-Cloud/SaaS/DB Packs; Agent/Machine Identity Pack; Review/Audit Reports; API/SDK; Enterprise/Private Deployment.

## Feature/customer/vertical tree
Features: principal identity/type, roles/groups/policies, direct/inherited permissions, resources/scopes, last-used evidence, required operations, privilege age, risk, sensitive resources, temporary grants, simulator results, proposed delta, verification, rollback and audit.
Customers: enterprises, cloud teams, security/IAM, DevOps, MSPs, SaaS platforms and regulated organizations.
Verticals: cloud infrastructure, SaaS admin, databases, CI/CD, data platforms, AI/agent systems and enterprise apps.

## Brain capability / architecture
Brain may explain complex permission graphs and recommend least-privilege candidates. Deterministic graph/policy evaluation and provider simulation must determine effective access. Revocation requires policy, impact evidence and protected authorization.

Architecture: identity/resource graph, provider IAM adapters, policy parser/evaluator, access telemetry, risk classification, simulation, remediation plan, temporary elevation service, verification/rollback and immutable evidence.

## Agent tree
IAM Inventory Agent; Permission Graph Agent; Usage Analyst; Risk Agent; Least-Privilege Planner; Simulation Agent; Remediation Coordinator; Temporary Access Agent; Verification Agent; Audit/Compliance Agent.

## Deterministic services
Policy parsing; graph traversal; effective-permission calculation; last-used aggregation; sensitive-resource classification; proposed-policy diff; simulation; locks; change set/version; rollback; temporary expiry; evidence.

## Workflow
Inventory identities/policies/resources → calculate effective access → collect usage/required-action evidence → identify excess → simulate narrower policy → assess blast radius → recommend → protected approval → apply bounded change → verify workloads → rollback if failure → monitor drift/temporary grants → preserve audit.

## Integrations / API / data
Cloud IAM, SaaS directories, databases, Kubernetes, CI/CD, data platforms, secrets systems, identity providers, SIEM. Data: identities, policies, resources, permission graph, usage evidence, recommendations, simulations, changes and outcomes.

## Monetization / distribution
Identities/resources/accounts, cloud providers, scans, seats, enterprise/private, managed remediation and compliance packs. Distribution through cloud/security/IAM/MSP ecosystems.

## Security/privacy/compliance
Optimizer itself needs tightly scoped read access and separately authorized write access. Avoid lockouts, privilege escalation, policy confusion and cross-account mixing. Emergency access and rollback must be tested.

## Failure / edge cases
Rarely used permissions, disaster-recovery permissions, service account without telemetry, inherited wildcards, deny overrides, resource policy vs identity policy, organization policy, provider semantics, temporary incident access, application burst after months idle. Absence of observed use is not proof of safe removal.

## Scale / overlap
Cloud account → enterprise identity graph → cross-cloud least-privilege platform. Overlap #75 access review, #58 employee lifecycle, #73 secrets, #91 agent identity. #074 owns effective permission optimization.

## Classification
**DESIGN NOW:** explicit scopes/resources, permission provenance, temporary expiry, simulation/dry-run, reversible policy changes and identity graph.  
**BUILD NOW:** Command Center authorization/Agency delegation should already enforce subset-only authority and expiry; reverse-map strengthens simulation/explainability needs.  
**BUILD BEFORE FIRST COMPANY:** provider policy parsers, usage telemetry and remediation simulator.  
**COMPANY-SPECIFIC LATER:** cloud/SaaS connectors/customer policies/UI.  
**SCALE-ONLY:** organization-wide cross-cloud permission graph.

# Mandatory 24-part completion block
1. Product Tree: inventory/graph/effective access/usage/excess/creep/dormant/least privilege/simulation/blast radius/temp elevation/remediation/audit/API.
2. Feature Tree: principal/roles/policies/resources/inheritance/usage/required actions/age/risk/temp grants/diff/verify/rollback.
3. Customer Tree: enterprise/cloud/security/IAM/DevOps/MSP/SaaS/regulated.
4. Vertical Tree: cloud/SaaS/DB/CI/data/AI-agent/enterprise apps.
5. Brain Tree: graph explanation/recommendation; enforcement deterministic.
6. Agent Tree: inventory/graph/usage/risk/planner/simulation/remediation/temp access/verify/audit.
7. Service Tree: parsers/graph/effective calc/usage/sensitivity/diff/sim/locks/version/rollback/expiry.
8. Workflow Tree: inventory→calculate→evidence→identify→simulate→approve→change→verify/rollback→monitor.
9. Integration Tree: cloud/SaaS/DB/K8s/CI/data/secrets/IdP/SIEM.
10. Data Tree: identities/policies/resources/graph/usage/recommendations/simulations/changes/outcomes.
11. API Tree: inventory/effective access/recommend/simulate/changes/evidence.
12. Monetization Tree: identities/resources/accounts/providers/scans/seats/enterprise/managed.
13. Distribution Tree: cloud/security/IAM/MSP.
14. Automation Tree: inventory/simulation/drift automatic; privilege removal gated.
15. Moat Tree: cross-provider permission graph, safe-removal outcomes, policy semantics.
16. Platform Tree: optimizer→CIEM-like control→machine/human permission infrastructure.
17. Risk Tree: lockout/privilege escalation/false unused/cross-account error/rollback failure.
18. Scale Tree: account→enterprise→cross-cloud global.
19. Spinoff Tree: temporary elevation/policy simulator modules; access review remains adjacent.
20. Command Center Dependencies: authorization, identity, delegation, policy, audit, provider adapters.
21. Design-Now Requirements: authority must be explicit, scoped, expiring and simulatable.
22. Build-Now Requirements: keep Command Center authority/delegation subset-only with evidence and dry-run seams.
23. Safe-to-Defer Requirements: customer cloud connectors/remediation automation/UI/pricing.
24. Autonomous Mature State: excess permissions are continuously identified/simulated; low-risk approved changes verify automatically, humans handle uncertain/high-impact access.

## Saturation result
Further branches converge into access review, employee lifecycle, agent identity or secret rotation already represented.