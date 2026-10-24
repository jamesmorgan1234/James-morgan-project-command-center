# Company 019 — Inventory Forecasting API

**Company ID:** `company:future:019`  
**Primary project:** `project:company:future:019`  
**Roadmap version:** `COMPANY-019-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no purchasing/reordering.

## Business identity

Purpose: forecast demand and inventory risk across products/locations and provide reorder, safety-stock and supplier-aware recommendations through API/embedded products.

Problem: stockouts lose sales; overstock ties cash; demand, promotions, supplier lead times and multi-location inventory are uncertain and fragmented.

Value: probabilistic demand forecasts and constrained replenishment recommendations with explainable inputs/uncertainty.

Delivery: forecasting API, batch feeds, dashboard, ecommerce/ERP plugins, embedded/OEM, private/enterprise deployment.

## Product tree

Demand Forecast API; Reorder Recommendation; Safety Stock Engine; Stockout Risk; Overstock/Obsolescence Risk; Lead-Time Forecast; Supplier Reliability; Promotion/Event Adjustment; Seasonality/Holiday Engine; New-SKU/Cold-Start Forecast; Multi-Location Allocation; Warehouse/Store Transfer Recommendations; Service-Level Optimization; Purchase-Order Scenario Planner; Cash/Working-Capital View; Inventory Health Dashboard; Alert/Exception Feed; Forecast Backtesting; Vertical Packs; SDK/OEM.

## Feature/customer/vertical tree

Features: SKU/location hierarchy, units/cases, on-hand/on-order/committed, lead times/MOQ/case packs, supplier calendars, service-level targets, seasonality, promotions, substitution/cannibalization, returns, stockout censoring, forecast intervals, model selection, backtests, overrides, scenario assumptions, confidence, API/webhook/export.

Customers: ecommerce, retail, distributors, wholesalers, manufacturers, marketplaces, restaurant/hospitality inventory, parts/service businesses, multi-location operators, ERP/WMS/POS vendors.

Verticals: consumer goods, apparel, grocery/perishables, parts, industrial distribution, beauty, pet, home goods, pharmacy-adjacent nonclinical inventory, restaurant supplies, spare parts. Perishables require shelf-life/waste logic.

## Brain / architecture

Brain explains demand drivers, anomalies and recommended policies; deterministic/statistical/ML forecasting and optimization should generate quantities. Methods: hierarchical time series, intermittent-demand models, causal promo/calendar features, probabilistic forecasts, optimization/constraint solvers for service/cash/capacity/MOQ. LLM only for interpreting notes/events and explaining results.

## Agents

Demand Analyst, Promotion/Event Agent, Supplier Lead-Time Agent, Inventory Health Agent, Allocation/Transfer Agent, Reorder Planner, Cold-Start Agent, Forecast QA/Backtest Agent, Data Quality Agent, Working-Capital Analyst, Exception Monitor, Integration Agent.

## Deterministic services

Sales/inventory ingest; SKU/location registry; feature pipeline; forecast ensemble; backtest/model selection; replenishment optimizer; safety stock; supplier/lead-time model; allocation solver; alert engine; scenario calculator; API/cache; audit/versioning.

## Workflow

Ingest sales/inventory/PO/supplier/event data → validate/normalize → estimate lost-sales/censoring → generate probabilistic forecast → backtest/select model → apply business constraints → recommend reorder/transfer/safety stock → approval/procurement system if authorized → verify actual demand/lead time → recalibrate.

## Integrations / API / data

ERP/WMS/POS/ecommerce/marketplaces/procurement/supplier portals/warehouse systems/accounting/BI. APIs for forecast, intervals, reorder, stock risk, transfer, supplier reliability, scenario/backtest.

Data moat: SKU/location histories, supplier lead-time/reliability outcomes, promo effects, stockout correction, vertical demand models. Customer inventory data isolated.

## Monetization / distribution

SKU-location count, API calls, forecast runs, locations, enterprise/OEM, vertical packs, premium optimization. Distribution via ERP/WMS/ecommerce marketplaces, inventory consultants, integrators and APIs.

## Security/privacy/financial boundaries

Inventory and purchasing economically sensitive. Purchase orders/spend are protected; API recommends but cannot buy by default. Supplier/contract data isolated. Financial/cash assumptions versioned.

## Failure / edge cases

Stockout-censored demand, product launch, discontinued SKU, substitution, promotion spike, supplier shutdown, extreme weather/event, data gaps, returns, negative inventory, unit mismatch, MOQ, perishable expiry. Use uncertainty, exception flags and override evidence.

## Scale/platform/overlap

Micro stores → multi-location retail → enterprise distribution/manufacturing → embedded forecasting platform. Overlap #7 pricing, #32 procurement, #55 catalog; integrate, do not merge.

## Classification

**DESIGN NOW:** optimization/forecast evidence interfaces, financial/procurement protected-action boundary, project/company data isolation.  
**BUILD NOW:** generic model/evaluation/resource interfaces after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** data connector/forecast model registry, company cost/resource attribution.  
**COMPANY-SPECIFIC LATER:** forecasting models/ERP connectors/UI/pricing.  
**SCALE-ONLY:** large hierarchical global forecasting/optimization clusters.

# Mandatory 24-part completion block

1. Product Tree: forecast/reorder/safety/stockout/overstock/lead/supplier/promo/season/cold-start/allocation/transfers/service/cash/scenario/health/alerts/backtests/packs/API.
2. Feature Tree: SKU/location/on-hand/on-order/lead/MOQ/service/promo/substitution/returns/censoring/intervals/backtest/overrides/scenarios.
3. Customer Tree: ecommerce/retail/distribution/wholesale/manufacturing/marketplace/hospitality/parts/multi-location/vendors.
4. Vertical Tree: CPG/apparel/grocery/parts/industrial/beauty/pet/home/restaurant/spares.
5. Brain Tree: explain/anomaly/recommend; quantitative forecast/optimization deterministic/ML.
6. Agent Tree: demand/promo/supplier/health/allocation/reorder/cold-start/QA/data/cash/exceptions/integration.
7. Service Tree: ingest/registry/features/forecast/backtest/optimizer/safety/lead/allocation/alerts/scenario/API/audit.
8. Workflow Tree: ingest→validate→forecast→backtest→constraints→recommend→approved action→verify/recalibrate.
9. Integration Tree: ERP/WMS/POS/commerce/marketplaces/procurement/supplier/accounting/BI.
10. Data Tree: sales/inventory/PO/lead/promo/events/forecasts/outcomes/overrides.
11. API Tree: forecast/reorder/risk/transfer/supplier/scenario/backtest.
12. Monetization Tree: SKU-locations/API/runs/locations/enterprise/OEM/packs/optimization.
13. Distribution Tree: ERP/WMS/commerce marketplaces, integrators/consultants/APIs.
14. Automation Tree: ingestion/features/forecast/backtest/alerts/recommendations; purchasing gated.
15. Moat Tree: histories, supplier outcomes, promo effects, vertical models, forecast calibration.
16. Platform Tree: forecast API→inventory optimization→embedded supply planning.
17. Risk Tree: bad data, censoring, shocks, overconfident forecast, purchase/cash impact.
18. Scale Tree: store→multi-location→enterprise→global embedded.
19. Spinoff Tree: adjacent #7/#32/#55 already cover pricing/procurement/catalog.
20. Command Center Dependencies: data/model/eval, finance/policy, integrations, company isolation, resource governor.
21. Design-Now: model/evidence/optimization and protected-procurement interfaces.
22. Build-Now: shared model/eval/governor hooks after reverse-map.
23. Safe-to-Defer: models/connectors/customer product/pricing.
24. Autonomous Mature State: forecasts/recommendations/alerts continuously update; routine preapproved replenishment may automate within hard budgets; James handles strategic/protected purchases.

## Saturation result

Further supply-planning branches become procurement/pricing/catalog modules or vertical packs; no new top-level company is needed.
