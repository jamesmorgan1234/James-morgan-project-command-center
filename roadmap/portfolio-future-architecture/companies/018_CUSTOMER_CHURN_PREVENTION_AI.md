# Company 018 — Customer Churn Prevention AI

**Company ID:** `company:future:018`  
**Primary project:** `project:company:future:018`  
**Roadmap version:** `COMPANY-018-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer messaging, discounts, account changes or retention offers executed.

## Business identity

Purpose: predict and explain customer churn risk, recommend timely interventions, coordinate experiments and measure retained value without manipulative retention practices.

Problem: churn signals are dispersed across usage, billing, support, sentiment and lifecycle data; teams react late or use generic discounts.

Value: risk prioritization, root-cause segmentation, intervention recommendation, experimentation and retention attribution.

Delivery: SaaS dashboard, risk API, CRM/customer-success integration, embedded/OEM health scoring, enterprise/private deployment, vertical packs.

## Product tree

Customer Health Score; Churn Risk Prediction; Usage Decline Monitor; Support/Sentiment Signals; Lifecycle Milestones; Renewal Risk; Expansion/Contraction Risk; Intervention Recommendation; Customer Success Playbooks; Retention Offer Eligibility; Win-Back Planner; Experimentation/Holdouts; Churn Reason Taxonomy; Cohort/Segment Analytics; Revenue-at-Risk Forecast; Account Prioritization; Executive Retention Dashboard; API/OEM; Vertical Packs.

## Feature/customer/vertical tree

Features: account/user/entity resolution, usage trends, engagement, tickets, CSAT/NPS, billing/payment state, plan/value, contract/renewal dates, lifecycle, product adoption, risk drivers, confidence, explanation, cohort baseline, action eligibility, contact frequency/consent, experiment assignment, attribution, fairness, audit, integrations.

Customers: SaaS, subscription apps, media/membership, ecommerce subscriptions, B2B services, marketplaces, education/community products, enterprise customer-success teams.

Verticals: B2B SaaS, B2C apps, memberships/communities, subscription boxes, digital media, recurring professional services. Highly regulated/essential services require stronger fairness/communications controls.

## Brain / architecture

Brain understands lifecycle/account context and combines usage, support, sentiment and payment signals; predicts risk with calibrated uncertainty; identifies likely drivers and recommends lowest-friction interventions. It cannot manufacture churn reasons or autonomously pressure customers.

Architecture: feature store, time-series/behavioral models, survival/churn models, segmentation, rules for consent/offer eligibility, experiment/causal analytics, LLM for ticket/sentiment summarization and explanation with evidence, relational account graph.

## Agents

Health Analyst, Usage Adoption Agent, Support Sentiment Agent, Renewal Risk Agent, Intervention Planner, Offer Eligibility Agent, Customer Success Playbook Agent, Win-Back Planner, Experiment Agent, Attribution Agent, Fairness/Policy Agent, Integration/Data Quality Agent.

## Deterministic services

Event ingest, identity resolution, feature computation, risk score service, contact/consent rules, account prioritization, experiment assignment, CRM task creation, offer-policy engine, attribution, alerts, audit.

## Workflow

Ingest account lifecycle → compute features/quality → score calibrated risk → explain drivers → check consent/value/policy → recommend intervention → customer-success/approved automation executes → record outcome → holdout/experiment attribution → update model only from verified outcomes.

## Integrations / API / data

Product analytics, CRM/CS, support/ticketing, billing/subscription, email/SMS/in-app, NPS/surveys, data warehouse, contract/renewal, entitlement systems. APIs for health/risk/drivers/recommendations/eligibility/attribution.

Data moat: longitudinal risk/outcome corpus, intervention effectiveness by segment/lifecycle, reason taxonomy and adoption patterns; customer data isolated.

## Monetization / distribution

Accounts/customers monitored, seats, revenue under management, API, enterprise/private, OEM, premium experimentation/forecasting, managed CS analytics. Distribution through CRM/CS marketplaces, subscription platforms, revops/customer-success communities.

## Security/privacy/ethics

Limit profiling to legitimate business purposes; respect consent/contact preferences; no protected-class discriminatory offers; avoid dark patterns; explanations and human override; sensitive support text protected; retention/delete/export.

## Failure / edge cases

Cold start, sparse usage, seasonal inactivity, false churn risk, account champion change, contractually locked customer, billing outage, support backlog causing false signal, segment bias, intervention fatigue, attribution bias. Use confidence, cohorts, holdouts, rate limits and human review for material interventions.

## Scale/platform/overlap

Micro risk API → customer-success workspace → enterprise retention intelligence → embedded lifecycle platform. Overlap #10 revenue recovery, #15 BI, #95 ROI. #018 focuses on customer churn/retention beyond payment failure.

## Classification

**DESIGN NOW:** customer/company isolation, consent/action policy, model/evidence/versioning, outcome attribution.  
**BUILD NOW:** generic analytics/evaluation/communication policy seams after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** customer identity/tenant privacy, experiment/evaluation interfaces, communication consent abstraction.  
**COMPANY-SPECIFIC LATER:** churn models/playbooks/customer UI/integrations.  
**SCALE-ONLY:** broad benchmark and automated multi-channel optimization.

# Mandatory 24-part completion block

1. Product Tree: health/risk/usage/support/lifecycle/renewal/expansion/interventions/playbooks/offers/winback/experiments/reasons/cohorts/forecast/prioritization/dashboard/API.
2. Feature Tree: identity/usage/tickets/sentiment/billing/lifecycle/adoption/drivers/confidence/cohorts/eligibility/consent/experiments/attribution/fairness.
3. Customer Tree: SaaS/apps/media/membership/subscription commerce/B2B services/marketplaces/communities/enterprise CS.
4. Vertical Tree: B2B/B2C SaaS, memberships, boxes, media, recurring services; high-stakes sectors gated.
5. Brain Tree: risk prediction/driver explanation/intervention recommendations with uncertainty/fairness.
6. Agent Tree: health/adoption/support/renewal/intervention/eligibility/playbook/winback/experiment/attribution/fairness/data quality.
7. Service Tree: event/identity/features/score/consent/prioritization/experiment/CRM/offer/attribution/alerts/audit.
8. Workflow Tree: ingest→score→explain→policy→recommend→act→measure→attribute→learn.
9. Integration Tree: analytics/CRM/support/billing/comms/surveys/warehouse/contracts/entitlements.
10. Data Tree: accounts/users/events/tickets/payment/lifecycle/risk/interventions/experiments/outcomes.
11. API Tree: health/risk/drivers/recommendations/eligibility/attribution.
12. Monetization Tree: accounts/seats/revenue/API/enterprise/private/OEM/experiments/managed.
13. Distribution Tree: CRM/CS marketplaces, subscription/revops ecosystems.
14. Automation Tree: scoring/prioritization/playbook tasks/experiment analysis; direct comms/offers gated.
15. Moat Tree: longitudinal outcomes, intervention effectiveness, lifecycle/reason taxonomy.
16. Platform Tree: churn score → CS intelligence → lifecycle retention platform.
17. Risk Tree: privacy/profiling, bias, false risk, overcontact, dark patterns, attribution error.
18. Scale Tree: small accounts→enterprise portfolio→embedded platform.
19. Spinoff Tree: adjacent #10/#15/#95 already cover payment/BI/ROI.
20. Command Center Dependencies: customer identity/isolation, consent/comms, analytics, model/evaluation, finance context.
21. Design-Now: scoped customer analytics, consent/action and attribution interfaces.
22. Build-Now: shared model/eval/consent hooks after reverse-map.
23. Safe-to-Defer: models/playbooks/customer product/pricing/integrations.
24. Autonomous Mature State: health/risk/prioritization/experiments run continuously; customer teams see best next actions; James handles strategic/protected changes.

## Saturation result

Further branches are payment recovery, BI or ROI modules already represented elsewhere; no new top-level company is needed.
