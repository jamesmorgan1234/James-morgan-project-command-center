# Company 007 — Pricing Intelligence Engine

**Company ID:** `company:future:007`  
**Primary project:** `project:company:future:007`  
**Roadmap version:** `COMPANY-007-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: help businesses observe market pricing, understand margin/elasticity/context, test pricing strategies and recommend policy-constrained prices without allowing opaque or unlawful autonomous price manipulation.

Problem: pricing data is fragmented; costs/promotions/channel fees/competitor changes interact; teams lack trustworthy elasticity and governance; manual repricing is slow and error-prone.

Value: evidence-backed price intelligence, margin guardrails, experimentation and decision support.

Delivery: SaaS dashboard, pricing API, ecommerce/marketplace plugin, B2B quote intelligence, enterprise data platform, white-label/OEM pricing module.

## Product tree

- Competitor Price Monitor — SKU/service matching, historical changes, availability/promo context.
- Margin & Landed-Cost Engine — COGS, shipping, fees, tax inputs, rebates, fulfillment, return cost.
- Dynamic Pricing Recommender — policy-bounded recommendations, not uncontrolled collusion/algorithmic abuse.
- Elasticity & Demand Analyzer — experiment/observational estimates with uncertainty.
- Promotion/Discount Optimizer — coupons, bundles, markdowns, time/channel constraints.
- MAP/Price-Policy Monitor — policy/compliance observation; legal interpretation flagged.
- B2B Quote Intelligence — quote bands, margin/risk, win/loss evidence.
- SaaS Pricing Lab — plans, seats, usage, bundles, feature packaging, grandfathering simulation.
- Regional/International Pricing — FX, purchasing-power, tax/channel considerations.
- Marketplace Pricing — fees, ranking/stock context, repricing guardrails.
- Ecommerce Pricing — product variants, inventory/seasonality/promo feeds.
- Pricing Experiment Platform — A/B/multi-arm with ethics/legal/segment controls.
- Price Governance — floors/ceilings, approvals, protected segments, explainability, rollback.
- Price Benchmark Data/API — anonymized/rights-cleared industry benchmarks.
- Executive Pricing Analytics — margin/revenue/customer impact and scenario models.

## Feature/customer/vertical trees

Features: product/entity matching, channel mapping, price normalization, unit/package conversion, landed cost, margin floors, price bands, competitor context, inventory/demand signals, elasticity confidence, experiment design, promo calendar, approval workflow, audit, rollback, alerting, forecast/scenario, API, import/export, role permissions, accessible dashboards, localization/currency/tax display.

Customers: ecommerce sellers, retailers, brands/manufacturers, marketplaces, SaaS, distributors/wholesalers, B2B sales teams, subscription businesses, hospitality/travel only where lawful, agencies/consultants, enterprise pricing teams.

Verticals: retail/ecommerce, consumer goods, automotive parts, industrial distribution, SaaS, digital products, services, hospitality/travel, marketplaces, B2B quoting. Vertical packs must account for legal restrictions, MAP/antitrust, channel rules and customer fairness.

## Brain capability tree / architecture

Brain knows product matches, cost structures, competitors, inventory, demand, historical prices, promotions and business policy. It reasons about tradeoffs and uncertainty, predicts demand/margin scenarios, optimizes within hard constraints, recommends tests and bands, monitors anomalies. It must not coordinate prices among competitors or infer/execute unlawful discriminatory pricing.

Architecture: deterministic margin/constraint engine; time-series/forecasting; causal/experiment analysis; optimization; entity matching; relational/data warehouse; price history; LLM for explaining scenarios/product match review, not price-setting authority; policy engine enforces floors/ceilings/segments/approval.

## Agent tree

Market Price Collector/Normalizer, Product Match Analyst, Cost/Margin Agent, Elasticity Analyst, Promotion Planner, B2B Quote Analyst, SaaS Packaging Analyst, Experiment Agent, Pricing Governance Agent, Anomaly Monitor, Regional Pricing Analyst, Executive Reporting Agent, Integration/Data Quality Agent.

## Deterministic services

Price ingestion; SKU/entity resolution; unit/currency normalization; landed-cost calculator; margin engine; price rule engine; experiment assignment; forecast/optimization service; inventory connector; price history; alert scheduler; approval workflow; audit; rollback/version service; API/webhook.

## Inputs / outputs / workflows

Inputs: own prices/costs/fees/inventory/sales/quotes, competitor/public/licensed prices, promo calendars, policy/approval, currency/tax reference data.

Outputs: normalized market history, margin bands, recommendations, experiments, alerts, quote guidance, forecasts, audit/evidence.

Workflow: ingest → normalize/match → validate provenance → compute cost/margin → estimate demand/context → apply legal/business constraints → recommend/test → approval if needed → downstream price update only if separately authorized → verify sales/margin → rollback/learn.

## Integrations / API / data

Commerce platforms, marketplaces, ERP/PIM, inventory/WMS, accounting, CRM/CPQ, subscription billing, analytics/warehouse, ad/promo systems, tax/FX sources, public/licensed competitor data. APIs for price observations, cost, recommendation/scenario, policy validation, alerts and experimentation.

Data moat: product-match graph, historical price/promo/inventory/demand outcomes, vertical elasticity priors, channel fee/cost models and experiment evidence. Customer data remains isolated; benchmark products require privacy-safe aggregation.

## Monetization / distribution

Per SKU/product/location/channel, API usage, seats, enterprise data volume, premium history/benchmarks, B2B quote volume, SaaS pricing module, white-label/OEM, verified-savings/value pricing only if transparent. Distribution through ecommerce app stores, ERP/PIM/CPQ integrators, pricing consultancies, SaaS finance/revops partners and developer APIs.

## Security/legal/privacy

Protect confidential cost/margin/quote data. No cross-customer leakage. Antitrust/competition-law risk requires strong separation and no coordinated competitor actions. Avoid protected-class discriminatory pricing. Preserve experiment consent/ethics and regional consumer-pricing rules. Legal interpretation remains specialist review.

## Failure / edge cases

Bad product match, stale competitor price, hidden shipping/fees, stockout distorting elasticity, promo confounding, demand shock, cost lag, FX volatility, bot/poisoned competitor feed, legal/MAP conflict, price loop between automated sellers, unit conversion error. Use confidence, holdouts, hard floors/ceilings, rate-of-change bounds, anomaly quarantine, human approval for material changes, rollback.

## Scale / moat / platform

Micro: hundreds SKUs; ~$100K ARR: thousands/shops; ~$1M: multi-channel/enterprise; ~$10M: large catalogs/regions/quote/SaaS modules; ~$100M+: broad pricing data/optimization platform subject to legal constraints.

Moats: match graph, historical outcomes, cost/channel normalization, trusted governance, experiment corpus. Platform potential: pricing intelligence layer with APIs/vertical packs, not an uncontrolled autonomous collusion engine.

## Spinoffs / overlap

#13 competitive intelligence supplies broader signals; #55 catalog intelligence improves product matching; #19 inventory forecasting supplies demand/stock; #95 ROI measures value; #6 data subscription may distribute benchmark data. Keep distinct contracts.

## Classification

**DESIGN NOW:** cost/financial action classification, company data isolation, optimization-policy interface, evidence/provenance, approval/protected-action hooks.  
**BUILD NOW:** generic policy/cost/evidence hooks only after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** financial-governor interface, customer/tenant isolation, experiment/evaluation framework seam.  
**COMPANY-SPECIFIC LATER:** product matching, feeds, pricing models, integrations, customer UI.  
**SCALE-ONLY:** global benchmarks, advanced causal models, massive catalog processing.

# Mandatory 24-part completion block

1. **Complete Product Tree:** competitor, margin, dynamic recommender, elasticity, promotions, MAP, B2B quotes, SaaS pricing, regional, marketplace/ecommerce, experiments, governance, benchmarks, executive analytics.
2. **Complete Feature Tree:** matching/normalization/cost/margin/constraints/history/inventory/demand/elasticity/experiments/approvals/audit/rollback/scenario/API/localization.
3. **Complete Customer Tree:** sellers/retail/brands/manufacturers/marketplaces/SaaS/distributors/B2B/subscriptions/enterprise/consultants.
4. **Complete Vertical Tree:** retail, CPG, auto parts, industrial, SaaS, digital/services, hospitality/travel, marketplaces, B2B quoting.
5. **Complete Brain Capability Tree:** pricing/context reasoning, forecast/optimize/recommend/monitor with hard legal/business constraints.
6. **Complete Agent Tree:** collector, matcher, cost, elasticity, promo, quote, SaaS packaging, experiment, governance, anomaly, regional, reporting, data quality.
7. **Complete Service Tree:** ingestion, resolution, normalization, cost/margin, policy, experiments, forecast/optimizer, inventory, history, alerts, approvals, audit/rollback/API.
8. **Complete Workflow Tree:** observe→normalize→cost→model→constrain→recommend/test→approve→verify/rollback.
9. **Complete Integration Tree:** commerce/marketplace/ERP/PIM/inventory/accounting/CRM/CPQ/billing/analytics/promo/tax/FX/data.
10. **Complete Data Tree:** price/promo/cost/inventory/demand/quote/experiment/policy/history/match graph.
11. **Complete API/Developer Tree:** observations/cost/scenario/recommendation/policy/experiment/alert APIs.
12. **Complete Monetization Tree:** SKU/channel/location/API/seat/enterprise/history/benchmarks/quotes/modules/OEM/value pricing.
13. **Complete Distribution Tree:** app stores, ERP/PIM/CPQ partners, consultancies, SaaS revops, APIs.
14. **Complete Automation Tree:** collection, matching, normalization, forecasts, alerts, constrained recommendations, experiment analysis.
15. **Complete Moat Tree:** match graph, history, cost/channel models, experiment corpus, trusted governance.
16. **Complete Platform Tree:** monitoring→decision support→constrained optimizer→vertical pricing platform.
17. **Complete Risk Tree:** antitrust, discrimination, bad match/data, feedback loops, cost errors, legal/MAP, volatility.
18. **Complete Scale Tree:** small catalogs→multi-channel→enterprise/regions→large pricing platform.
19. **Complete Spinoff Tree:** adjacent existing #6/#13/#19/#55/#95 preferred.
20. **Command Center Dependencies:** isolation, finance/policy governors, data/provenance, integrations, evaluation, protected actions.
21. **Design-Now Requirements:** deterministic constraints/evidence/approval around optimization and financial actions.
22. **Build-Now Requirements:** generic governors/interfaces only after portfolio reverse-map.
23. **Safe-to-Defer Requirements:** feeds/models/customer portal/pricing/benchmarks/integrations.
24. **Autonomous Mature State:** data collection/modeling/alerts/tests run automatically; constrained recommendations or preapproved changes execute within hard limits; James handles strategy/legal/protected exceptions.

## Saturation result

Further ideas resolve into vertical pricing packs, benchmark/data products, or existing adjacent portfolio companies; no additional top-level company is required.
