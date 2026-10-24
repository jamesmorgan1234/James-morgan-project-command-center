# Company 088 — Commission Calculation & Audit Engine

**Company ID:** `company:future:088`  
**Primary project:** `project:company:future:088`  
**Roadmap version:** `COMPANY-088-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no payroll, payout, compensation-plan change or financial commitment.

## Business identity
Purpose: deterministically calculate and audit sales, partner, affiliate, marketplace and channel commissions under versioned compensation rules.

## Product tree
Comp Plan Registry; Quota/Territory Registry; Deal/Revenue Attribution; Commission Calculator; Tier/Accelerator Engine; Splits/Credits; Renewals/Expansion; Bonus Rules; Clawbacks; Draws/Guarantees; Partner/Affiliate/Channel Commission; Marketplace Commission; Dispute Workflow; Historical Recalculation; Forecasting; Rep/Manager/Finance Dashboards; Payroll/Payout Export Proposal; Audit/Evidence; API/SDK; Enterprise/Private Deployment; Vertical Packs.

## Feature/customer/vertical tree
Features: participant/role, plan/version/effective dates, quota/territory, source transaction/deal, eligible revenue, crediting rules, tiers, accelerators, splits, bonuses, clawbacks, caps/floors, currency, calculated amount, adjustment, approval, dispute and evidence.
Customers: SaaS sales teams, enterprises, agencies, affiliate programs, marketplaces, channel programs, broker-like networks where lawful and finance/revenue operations.
Verticals: B2B SaaS, subscriptions, services, channel resale, marketplaces, affiliates, account-based sales and partner ecosystems.

## Brain capability / architecture
Brain may explain plan language, identify likely attribution conflicts and help model scenarios; calculation must be deterministic from approved plan/version and source transactions. Architecture: plan DSL/version registry, participant/org graph, source transaction ledger, attribution engine, calculation service, audit trail, dispute/adjustment ledger, forecasting and protected payout/payroll export boundary.

## Agent tree
Plan Interpretation Agent; Attribution Agent; Calculation QA Agent; Split/Territory Agent; Clawback Agent; Forecast Agent; Dispute Investigator; Rep Explanation Agent; Finance Audit Agent; Plan Migration Agent.

## Deterministic services
Plan expression engine; effective-date rules; tier/accelerator arithmetic; split allocation; quota attainment; clawback logic; currency/version; immutable adjustments; recalculation; balancing; reconciliation.

## Workflow
Load approved comp plan/version → ingest verified deals/revenue/eligibility → resolve participant/territory → apply credit/split rules → calculate commission → independent arithmetic audit → publish statement/review → dispute/adjustment through append-only record → approved payroll/payout export separately → reconcile actual payout.

## Integrations / API / data
CRM, billing/revenue systems, ERP/accounting, HRIS/identity, payroll/payout systems, partner/affiliate platforms, marketplaces and data warehouses. Data: plans, participants, quotas, transactions, attribution, calculations, adjustments, disputes and payouts/evidence.

## Monetization / distribution
Participants, plans, transactions, calculations, seats, enterprise/private, API, partner-program edition and managed comp operations. Distribution via CRM/revops/payroll/partner ecosystems.

## Security/privacy/compliance
Compensation data is sensitive. Role-based visibility, source/provenance, deterministic calculation, plan approval/versioning, no retroactive hidden changes, protected payroll/payout export and dispute transparency.

## Failure / edge cases
Backdated deal, split changes after close, territory transfer, quota reset, cancellation/refund, clawback months later, multi-currency, plan change mid-period, duplicate CRM opportunity, manual override, employee termination, partner hierarchy and historical recalculation.

## Scale / overlap
Team calculator → enterprise incentive compensation → commission infrastructure. Overlap #69 billing, #85 leakage, #86 reconciliation. #088 owns compensation calculation/audit.

## Classification
**DESIGN NOW:** versioned rule/plan engine, source financial provenance, immutable adjustments, effective dates, explainable deterministic calculations.  
**BUILD NOW:** Command Center rule/decision ledger and Financial Governor should support versioned formulas/metrics without silent retroactivity.  
**BUILD BEFORE FIRST COMPANY:** customer plan DSL, source connectors and participant hierarchy.  
**COMPANY-SPECIFIC LATER:** payroll/CRM connectors, UI/pricing.  
**SCALE-ONLY:** global compensation programs/multi-entity currencies.

# Mandatory 24-part completion block
1. Product Tree: plans/quotas/territories/attribution/calculator/tiers/splits/renewals/bonuses/clawbacks/partner/marketplace/disputes/recalc/forecast/API.
2. Feature Tree: participant/plan/version/dates/quota/territory/transaction/revenue/credit/tier/split/bonus/clawback/currency/adjustment/evidence.
3. Customer Tree: SaaS/enterprise/agency/affiliate/marketplace/channel/revops/finance.
4. Vertical Tree: B2B SaaS/subscription/services/resale/marketplace/affiliate/partner.
5. Brain Tree: plan explanation/conflict detection; calculation deterministic.
6. Agent Tree: plan/attribution/calculation QA/split/clawback/forecast/dispute/explanation/audit/migration.
7. Service Tree: DSL/effective dates/tier math/splits/quota/clawback/currency/adjustments/recalc/balance.
8. Workflow Tree: plan→source revenue→attribute→calculate→audit→statement→dispute/adjust→protected payout export→reconcile.
9. Integration Tree: CRM/billing/ERP/HR/payroll/partners/marketplaces/warehouse.
10. Data Tree: plans/participants/quotas/transactions/attribution/calculations/adjustments/disputes/payouts.
11. API Tree: plans/participants/calculations/statements/disputes/forecast/evidence.
12. Monetization Tree: participants/plans/transactions/seats/enterprise/API/managed.
13. Distribution Tree: CRM/revops/payroll/partner/OEM.
14. Automation Tree: calculation/audit/forecast automatic; plan changes/payouts protected.
15. Moat Tree: plan DSL, attribution resolution, recalculation correctness, integration breadth.
16. Platform Tree: calculator→incentive compensation OS→commission infrastructure.
17. Risk Tree: wrong pay/plan drift/private comp data/retroactive changes/attribution conflict.
18. Scale Tree: team→enterprise→global multi-plan.
19. Spinoff Tree: attribution/plan simulator modules; billing/reconciliation remain adjacent.
20. Command Center Dependencies: finance, rule versioning, identity/org graph, evidence, protected payouts.
21. Design-Now Requirements: formulas/rules require effective versions and replayable calculation evidence.
22. Build-Now Requirements: reusable rule/version/metric engine should avoid silent retroactive reinterpretation.
23. Safe-to-Defer Requirements: customer payroll/CRM connectors/comp UI.
24. Autonomous Mature State: calculations/audits/forecasts run continuously; humans approve plan changes and resolve attribution/dispute exceptions.

## Saturation result
Further branches converge into revenue systems, reconciliation and partner ecosystems already represented.