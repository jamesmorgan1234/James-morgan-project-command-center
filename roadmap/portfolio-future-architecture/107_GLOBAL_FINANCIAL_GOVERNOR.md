# 107 — Global Financial Governor

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION  
**Execution boundary:** no spending, purchasing, transfers, refunds, subscriptions or paid infrastructure are authorized by this roadmap.

## Purpose
Provide one truthful portfolio financial control plane that tracks budgets, cost, revenue, margin and unit economics while keeping each company financially isolated and placing every money-moving action behind separate authorization.

## Truth-state vocabulary
Never conflate:
- forecast;
- scenario;
- estimate;
- expected/contractual amount;
- invoice/receivable/payable;
- authorized commitment;
- transaction initiated;
- settled cash;
- reconciled actual;
- realized savings/recovered value;
- disputed/uncertain amount.

Every financial figure carries source, currency, period, company/project/cost center, truth state, verification time and evidence.

## Budget hierarchy
Portfolio → company → project → Brain → Agent/workflow/run → provider/resource. Lower levels inherit ceilings and cannot amplify them.

Budget fields: hard spend ceiling, soft planning budget, free-tier allowance, committed amount, settled amount, forecast, variance, reset period, approved categories, prohibited merchants/providers, owner approval threshold and kill threshold.

## Cost model
Track model/token/inference, API, compute/GPU, storage, bandwidth, browser workers, SaaS/tools, domains, communication, payment processing, customer support, contractors/labor where later applicable, taxes/fees and incident/recovery cost.

## Revenue model
Track subscriptions, usage, seats, API, transactions, marketplace commissions, services, data licenses, recovery/savings-share and other company-specific models as separate source-addressed streams. ARR/MRR are derived metrics, never replacements for cash/transaction truth.

## Unit economics
Customer/project/task/workflow/agent/model/provider dimensions: cost per action, cost per successful verified action, revenue per customer, gross/contribution margin, support cost, refund/chargeback cost, model/API cost, automation/human-intervention cost and payback where meaningful.

## Protected financial actions
Spending, purchasing, paid API enablement, subscription/trial with billable risk, financial transfer, refund, payment, payout, billing-plan change, merchant/financial-account change, tax remittance and contractual financial commitment require exact immutable intent, budget check, current policy, fresh authorization and settlement/reconciliation evidence.

## Anomaly/runaway controls
Detect duplicate charges, unexpected usage, budget acceleration, pricing/provider changes, currency anomalies, missing reconciliation and repeated failed purchase attempts. Hard limits stop further financial action; Resource Governor can throttle the workload before money is spent.

## Portfolio view
Per company: verified revenue, cash, expense, committed spend, gross/contribution margin, unit economics, model/API/infra cost, outstanding obligations, anomalies, forecast and data freshness. Portfolio totals only aggregate compatible truth states/currencies after conversion source/version is explicit.

## $0/free-first
Current Command Center build remains zero-budget/free-first. Financial Governor models future paid options but treats transition from free to paid as a protected owner decision, never an automatic scale response.

## DESIGN NOW
Financial-event identity, company/cost-center dimensions, truth-state vocabulary, currency/source/version, budget hierarchy, protected spend intent, settlement/reconciliation, provider cost telemetry and actual-vs-estimated outcome semantics.

## BUILD NOW
Unify current finance/Agency/provider/model telemetry around the truth-state vocabulary and budget hierarchy. Add zero-budget hard policy so future Resource/Brain/Agent layers cannot accidentally activate billable capacity.

## BUILD BEFORE FIRST COMPANY
Customer billing/revenue streams, per-company operational budgets, commercial unit-economics dashboard and payment/billing provider abstractions.

## Acceptance
An estimated savings value can never appear as cash; an invoice can never appear as settled revenue; a provider quota cannot spill into paid usage; and a protected purchase cannot execute merely because Resource Governor says capacity is needed.