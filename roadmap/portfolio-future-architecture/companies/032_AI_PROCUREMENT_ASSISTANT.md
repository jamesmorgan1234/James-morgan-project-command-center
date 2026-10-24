# Company 032 — AI Procurement Assistant

**Company ID:** `company:future:032`  
**Primary project:** `project:company:future:032`  
**Roadmap version:** `COMPANY-032-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no purchases, supplier commitments, contracts, payments or external negotiation.

## Business identity

Purpose: help organizations define purchase requirements, compare suppliers/quotes/contracts, enforce budgets/approvals and prepare procurement decisions.

Problem: purchasing requests are fragmented, specifications unclear, quote comparison manual, vendor data inconsistent and approvals disconnected from spend policy.

Value: structured sourcing packets, normalized quote analysis, supplier/risk context, savings scenarios and traceable approvals.

## Product tree

Purchase Request Intake; Requirement/Specification Builder; Catalog Search/Match; Supplier Registry; Quote/RFQ Comparison; Total-Cost-of-Ownership Analyzer; Contract/Terms Comparison; Budget/Cost-Center Check; Approval Routing; Supplier Scoring; Negotiation Prep; Purchase Recommendation; PO Draft/ERP Handoff; Procurement Calendar/Renewals; Spend Analytics; Preferred Supplier/Item Catalog; Procurement Policy Engine; API/OEM; Vertical Packs; Enterprise/Private Deployment.

## Feature/customer/vertical tree

Features: requesters, cost centers, quantities, specs, must/should criteria, approved vendors, quote line normalization, shipping/tax/fees, delivery lead time, warranty/support, terms, risk/compliance, scoring weights, alternatives, approvals, budget availability, split orders, exceptions, evidence, audit, accessible/localized workflows.

Customers: SMB/midmarket/enterprise procurement, finance, IT, operations, facilities, manufacturing, construction, hospitality, nonprofits/education, SaaS/tech purchasing, agencies, multi-location organizations.

Verticals: IT/SaaS, MRO/industrial, construction/materials, office/facilities, hospitality/food-service supplies, logistics, professional services, marketing procurement, healthcare administrative supplies, education/nonprofit. Regulated procurement/public-sector rules require specialized packs and human review.

## Brain capability tree / architecture

Brain translates business need into requirements, compares quote/contract tradeoffs, suggests alternatives and negotiation points, predicts supplier/lead-time/cost risk and explains recommendations. Deterministic policy/budget/vendor eligibility owns approval gates. It cannot place orders, accept contracts or move funds without protected authorization.

Architecture: supplier/item/catalog registry, quote/document parser, normalization/TCO calculator, rules/policy engine, vendor-risk integration, budget/finance reference, optimization/constraint solver, LLM for requirements/terms comparison with citations, workflow/approval state.

## Agent tree

Requirement Agent, Catalog/Alternative Agent, Supplier Analyst, Quote Normalization Agent, TCO Agent, Contract Comparison Agent, Budget/Policy Agent, Vendor-Risk Liaison, Negotiation Prep Agent, Approval Coordinator, PO Draft Agent, Spend Analyst, Procurement QA Agent, Integration Agent.

## Deterministic services

Request registry; supplier/item master; quote parser; unit/currency normalization; TCO calculator; budget checker; approval workflow; policy engine; vendor eligibility; scoring/constraint optimizer; PO draft service; audit; protected purchase/contract gate; reconciliation hooks.

## Workflow

Request → clarify requirements → identify approved/eligible sources → collect authorized quotes → normalize/TCO/risk → score alternatives → budget/policy check → recommendation → approval → protected PO/purchase/contract action in external system → verify receipt/price → record outcome/supplier performance.

## Integrations / API / data

ERP/procurement, accounting/budget, vendor catalogs, contract systems, vendor risk, inventory, AP, expense/cards, supplier portals, e-sign, logistics/receiving. APIs for requests/requirements/suppliers/quotes/comparisons/recommendations/approvals.

Data moat: normalized item/supplier/quote graph, TCO history, supplier performance, negotiated-term patterns, requirement templates and verified savings outcomes; customer spend isolated.

## Monetization / distribution

Seats, spend under management, requests/quotes, supplier count, enterprise/private, API/OEM, premium benchmarks/managed procurement, verified-savings share where transparent. Distribution through ERP/accounting/procurement marketplaces, consultants/integrators, vertical supplier ecosystems.

## Security/legal/privacy

Confidential pricing/contracts/budgets; supplier fairness; no collusion; protected purchase/contracts; separation of duties; audit; no hidden kickback ranking; regional procurement/public contracting rules; financial controls.

## Failure / edge cases

Non-comparable quotes, hidden shipping/terms, supplier capacity change, counterfeit/unauthorized seller, budget race, currency volatility, sole-source exception, emergency purchase, wrong quantity/unit, tax handling, contract conflict, late delivery. Require normalized evidence and explicit exceptions.

## Scale / overlap

Team purchasing → enterprise sourcing/procurement intelligence. Overlap #17 SaaS spend, #23 contracts, #24 vendor risk, #48 AP verification, #63 onboarding. #032 owns requirement-to-purchase-decision workflow.

## Classification

**DESIGN NOW:** protected purchasing/contract actions, finance/cost-center refs, vendor identity, evidence/TCO/approval interfaces.  
**BUILD NOW:** generic policy/finance/vendor/approval contracts after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company budget/resource governor, vendor registry/isolation, purchase authorization interface.  
**COMPANY-SPECIFIC LATER:** supplier catalogs/quote models/customer portal/pricing.  
**SCALE-ONLY:** large benchmark/supplier network and autonomous preapproved purchasing.

# Mandatory 24-part completion block

1. Product Tree: requests/specs/catalogs/suppliers/quotes/TCO/contracts/budgets/approvals/scoring/negotiation/recommendation/PO/renewals/spend/preferred catalogs/policy/API/packs.
2. Feature Tree: quantities/specs/criteria/vendors/line normalization/fees/lead/warranty/terms/risk/weights/alternatives/budget/exceptions/evidence/audit.
3. Customer Tree: procurement/finance/IT/ops/facilities/manufacturing/construction/hospitality/nonprofit/education/tech/agencies/multi-location.
4. Vertical Tree: IT/SaaS, MRO, construction, facilities, hospitality, logistics, services, marketing, health admin, education/public packs.
5. Brain Tree: requirements/comparison/TCO/risk/negotiation reasoning; purchase/contract prohibited without approval.
6. Agent Tree: requirements/catalog/supplier/quote/TCO/contract/budget/risk/negotiation/approval/PO/spend/QA/integration.
7. Service Tree: request/supplier/item/quote normalize/TCO/budget/approval/policy/eligibility/optimizer/PO/audit/gates.
8. Workflow Tree: request→spec→quotes→normalize→risk/TCO→budget→recommend→approve→purchase→verify.
9. Integration Tree: ERP/accounting/catalogs/contracts/vendor risk/inventory/AP/cards/supplier/e-sign/receiving.
10. Data Tree: requests/specs/suppliers/items/quotes/terms/budgets/approvals/PO refs/outcomes/performance.
11. API Tree: request/requirements/supplier/quote/comparison/recommendation/approval.
12. Monetization Tree: seats/spend/requests/quotes/vendors/enterprise/private/API/OEM/benchmarks/managed/savings-share.
13. Distribution Tree: ERP/procurement/accounting marketplaces, integrators, supplier ecosystems.
14. Automation Tree: requirement drafting/normalization/comparison/risk/budget/approval prep; purchases gated.
15. Moat Tree: normalized supplier/item/quote graph, TCO/performance/terms/savings corpus.
16. Platform Tree: procurement assistant→sourcing control plane→preapproved procurement automation.
17. Risk Tree: confidential pricing, biased ranking, wrong specs/units, fraud/counterfeit, budget/contract error.
18. Scale Tree: team→enterprise→multi-entity sourcing platform.
19. Spinoff Tree: adjacent #17/#23/#24/#48/#63 already cover specialist functions.
20. Command Center Dependencies: finance/policy, vendor/integration registry, docs, approvals, isolation, resource governor.
21. Design-Now Requirements: protected purchase/contract and vendor/budget/evidence contracts.
22. Build-Now Requirements: generic policy/finance/vendor seams after reverse-map.
23. Safe-to-Defer Requirements: customer procurement product/suppliers/catalogs/pricing.
24. Autonomous Mature State: requirements/quote comparison/risk/budget workflows run automatically; preapproved low-risk purchasing may later execute within hard limits; James handles material commitments.

## Saturation result

Additional branches map to vendor risk/onboarding/contracts/AP or vertical procurement packs already represented.
