# 117 — Portfolio Operations Center

**Status:** DESIGN NOW / BUILD BEFORE FIRST PORTFOLIO COMPANY

## Purpose
Give James and Command Center one truthful operating surface over independent companies without flattening their identities or leaking private company/customer data.

## Portfolio summary
Show:
- total registered companies and lifecycle counts;
- active/paused/blocked/planned companies;
- verified revenue and expense totals separated from estimates/forecasts;
- customer counts only where live/verified;
- portfolio resource use/capacity;
- model/API/compute use and cost;
- active incidents/security findings;
- deployment health;
- automation/human-intervention rates;
- pending owner approvals/Needs Me;
- top growth/risk/maintenance using explicit metric definitions;
- company autonomy levels and evidence freshness.

## Company card/project button
Every company button opens its independent Project Detail. Card may show:
company name/ID, status/stage, project verification, Brain health, Agent health, queue/workload, current checkpoint, next action, blockers, Needs Me, resource pressure, financial health, incidents and last verified activity.

A category/portfolio surface may group these buttons but never substitute for them.

## Company detail operational regions
1. Mission/product state.
2. Roadmap/spec version.
3. Brain(s): identity/version/health/evals/degraded state.
4. Agents/workers: active/waiting/blocked/failure.
5. Customers/tenants: counts/health only within company authorization.
6. Financial: verified revenue, expenses, commitments, margins, unit economics.
7. Resources: quota/usage/backpressure.
8. Deployments/environments/releases.
9. Integrations/providers/accounts health.
10. Data/privacy/residency status.
11. Security/compliance posture.
12. Incidents/recovery.
13. Support/usage.
14. Automation/human-intervention metrics.
15. Pending approvals/Needs Me.
16. History/evidence.

## Truth rules
Unknown = N/A/Unknown, not zero. Planned company has no fake customers/revenue/health. A model forecast never appears as actual. Last verified timestamp/source displayed for changing metrics.

## Command controls
Future controls may include pause company, resume, safe mode, kill execution, adjust non-financial priority/quota, open incident, inspect queues, inspect costs and review approvals. Protected actions route to Policy Governor. Company card itself has no implicit side-effect authority.

## Portfolio health
Composite health is decomposed: availability, execution, security, privacy, financial, provider, data quality, deployment, support. Avoid opaque single score unless components remain visible.

## Alerts
Portfolio alerts are deduplicated/correlated; one root incident should not create hundreds of company alerts. Severity includes blast radius and root/shared-provider correlation while preserving company isolation.

## Scale behavior
At 1–10 companies list directly. 25–50 adds filters/grouping/priority views. 100+ adds search, saved views, incident/resource heatmaps, hierarchical categories and pagination/virtualization. Never collapse companies into one generic aggregate.

## DESIGN NOW
Company operational snapshot contract, truth-state metadata, project-button navigation, health dimensions, Needs Me/incident/resource/financial refs and evidence freshness.

## BUILD NOW
Ensure current Command Center Home/Projects/portfolio snapshot models can represent a company/project subtype and category/group without changing core renderer for each company. Do not add 100 live buttons until company project records are deliberately registered in the current portfolio state.

## BUILD BEFORE FIRST COMPANY
Portfolio Ops UI, per-company runtime telemetry, customer/billing/support/resource/deployment summaries and owner controls.

## Acceptance
A synthetic 100-company dataset can render/search/group 100 independent project buttons with truthful planned/active states, no metric fabrication and no cross-company customer/private detail leakage.