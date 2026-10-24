# Company 070 — Entitlement Management API

**Company ID:** `company:future:070`  
**Primary project:** `project:company:future:070`  
**Roadmap version:** `COMPANY-070-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer provisioning, plan change, feature activation or account mutation.

## Business identity
Purpose: deterministically decide which customer, organization, user, device or agent may use which product feature, capacity, quota and contract benefit at a given moment.

## Product tree
Entitlement API; Plan/Feature Catalog; Organization/Account Hierarchy; Seat/Role Entitlements; Usage Quotas; Credits/Add-ons; Trials/Promotions; Enterprise Overrides; Grandfathering; Regional/Contract Rules; Beta/Feature Access; API/Developer Entitlements; Time-Bound Access; Delegated Admin; Provisioning/Revocation; Billing Sync; Feature-Flag Bridge; Audit/Explainability; SDKs; Edge Cache; Enterprise/Private Deployment; Migration/Versioning Tools.

## Feature/customer/vertical tree
Features: subject/account/org, product, plan/version, feature, resource scope, seat/role, limits, credits, effective/expiry, source contract/order, overrides, hierarchy inheritance, region, environment, beta cohort, usage state, decision reason, cache/version and audit.
Customers: SaaS, APIs, AI services, developer platforms, marketplaces, enterprise software, device/IoT vendors and multi-product companies.
Verticals: seat SaaS, usage-based AI/API, enterprise contracts, marketplace sellers/buyers, device fleets, multi-location businesses and internal platform services.

## Brain capability / architecture
Enforcement is deterministic. Brain may help configure complex contracts, explain entitlement conflicts and propose migration plans, but runtime allow/deny must come from versioned rules. Architecture: subject/org registry, product/feature catalog, entitlement ledger, policy evaluator, usage/quota adapter, billing sync, cache/invalidation, audit and migration/version layer.

## Agent tree
Contract Mapping Agent; Plan Configuration Agent; Entitlement QA Agent; Migration Agent; Usage/Quota Analyst; Support Explanation Agent; Drift/Reconciliation Agent; Incident Agent.

## Deterministic services
Subject resolution; hierarchy traversal; feature lookup; effective-date logic; quota arithmetic; credit consumption; override precedence; plan versioning; deterministic allow/deny; cache invalidation; idempotent provision/revoke; reconciliation.

## Workflow
Contract/order/billing event → map to exact plan/version → compute subject/org entitlements → persist effective/expiry/source → runtime request → resolve subject/resource → evaluate deterministic entitlement + quota → allow/deny with reason/version → consume quota if appropriate → reconcile against billing/contract changes → revoke/expire safely.

## Integrations / API / data
Billing/subscriptions, usage metering, CRM/contracts, auth/IAM, feature flags, API gateways, application backends, customer portals and analytics. Data: plans/features, accounts/orgs, grants, overrides, limits, usage references, decisions and audit.

## Monetization / distribution
MAU/accounts/orgs, entitlement checks, features/products, enterprise/private, SDK/API, premium contract/migration tooling. Distribution via SaaS developer ecosystems, billing/payment integrations and enterprise platform teams.

## Security/privacy/compliance
Fail closed on unknown subject/feature; no client-side authority; signed/server decisions, least privilege, immutable source refs, time-bound overrides, audit, revocation propagation and tenant isolation.

## Failure / edge cases
Billing lag, plan downgrade mid-cycle, grandfathered feature, overlapping enterprise contract, expired override, org merge/split, seat reassignment, offline cache, stale quota, multi-region cache drift, trial conversion, refunds, suspended account, API outage. Cache must not outlive revocation guarantees.

## Scale / overlap
App-level permissions → multi-product entitlement service → shared commercial access control plane. Overlap #4 AI permissions for agent actions, #69 billing, #95 ROI. #070 owns customer/product entitlement.

## Classification
**DESIGN NOW:** stable subject/resource/feature IDs, versioned policy, source/effective/expiry, deterministic reasons, cache invalidation and revocation.  
**BUILD NOW:** Command Center capability lifecycle/registries should use compatible entitlement/feature-flag concepts for future multi-product portfolio.  
**BUILD BEFORE FIRST COMPANY:** customer/org tenant hierarchy, commercial plan catalog, billing sync and runtime entitlement service.  
**COMPANY-SPECIFIC LATER:** customer-facing product/contract integrations.  
**SCALE-ONLY:** global edge entitlement network.

# Mandatory 24-part completion block
1. Product Tree: API/catalog/hierarchy/seats/quotas/credits/trials/overrides/grandfathering/regional/beta/developer/time-bound/admin/provision/billing/flags/audit/SDK.
2. Feature Tree: subject/org/product/plan/version/feature/scope/seat/limits/credits/effective/expiry/source/override/inheritance/decision/audit.
3. Customer Tree: SaaS/API/AI/devplatform/marketplace/enterprise/device/multi-product.
4. Vertical Tree: seats/usage AI/API/contracts/marketplaces/device fleets/multi-location/internal platforms.
5. Brain Tree: configuration/explanation only; runtime enforcement deterministic.
6. Agent Tree: contract mapping/plan config/QA/migration/usage/support/reconciliation/incident.
7. Service Tree: subject/hierarchy/feature/date/quota/credits/precedence/version/allow-deny/cache/provision/reconcile.
8. Workflow Tree: source event→plan/version→grants→runtime check→allow/deny→quota→reconcile/revoke.
9. Integration Tree: billing/metering/CRM/contracts/auth/flags/API gateways/apps/portal/analytics.
10. Data Tree: plans/features/accounts/orgs/grants/overrides/limits/usage refs/decisions/audit.
11. API Tree: evaluate/grants/plans/features/usage/reconcile/provision/revoke.
12. Monetization Tree: MAU/accounts/checks/features/products/enterprise/API/tooling.
13. Distribution Tree: SaaS dev/billing/enterprise platform/OEM.
14. Automation Tree: grant/revoke/check/quota automated; contract interpretation changes reviewed.
15. Moat Tree: contract mapping, migration tooling, low-latency correctness, integration breadth.
16. Platform Tree: entitlement API→commercial access plane→portfolio product-control infrastructure.
17. Risk Tree: over-entitlement/under-entitlement/stale cache/revocation lag/cross-tenant leak.
18. Scale Tree: app→portfolio→global edge.
19. Spinoff Tree: plan migration/feature catalog modules; usage billing stays separate.
20. Command Center Dependencies: IDs, policy, capability registry, cache, events, billing factory, tenant isolation.
21. Design-Now Requirements: reusable feature/capability entitlement schema and revocation semantics.
22. Build-Now Requirements: make Command Center capability activation/permissions compatible with future portfolio entitlements.
23. Safe-to-Defer Requirements: customer billing/contract hierarchy/edge network.
24. Autonomous Mature State: entitlement changes propagate and reconcile automatically; humans configure contracts and resolve exceptional commercial rules.

## Saturation result
Further branches converge into usage billing, feature flags, IAM or policy governance already represented.