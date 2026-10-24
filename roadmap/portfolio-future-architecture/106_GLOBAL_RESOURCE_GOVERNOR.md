# 106 — Global Resource Governor

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION

## Purpose
One portfolio-wide control plane accounts for and constrains scarce resources while preserving per-company isolation, priority, fairness and $0/free-first policy. It schedules capacity; it does not grant business authority.

## Governed resources
CPU • RAM • GPU/accelerator • local disk • object storage • database storage/connections/IO • bandwidth • model tokens • inference requests • API calls • browser workers • code/build runners • queues • event throughput • scheduled jobs • vector/search capacity • file/OCR/media processing • email/SMS/voice provider quotas • external-provider rate limits.

## Resource record
`resource_id`, class, provider/environment/region, company/project, hard ceiling, soft budget, free-tier allowance, current/reserved usage, reset window, unit/cost reference, concurrency ceiling, priority weight, emergency reserve, preemption class, health, degradation mode, backpressure threshold, runaway threshold, evidence timestamp.

## Policy hierarchy
1. security/recovery/emergency containment;
2. explicit owner-critical work;
3. protected deadline/SLA work;
4. active customer-facing work when later authorized;
5. normal project execution;
6. maintenance/optimization;
7. speculative/background work.

A lower tier cannot starve emergency capacity. A higher tier cannot silently spend money or cross a company authority boundary.

## Scheduling
Use durable queues and weighted fair scheduling. Inputs: company/project/task priority, required capability/environment/region, deadline, resource size, estimated duration, risk, cost budget, provider health/quota, shared-resource locks, fairness debt and backpressure state.

States: `ready`, `admitted`, `running`, `throttled`, `backpressured`, `waiting_quota`, `waiting_resource`, `preempted`, `degraded`, `blocked`, `completed`.

## Runaway protection
Detect token/API loops, duplicate retries, browser-worker explosions, storage growth, queue storms, recursive delegation and unexpected cost acceleration. Controls: per-run ceilings, rate limits, timeout, depth/fan-out caps, circuit breakers, kill task/project/company/Agency, and global safe mode.

## Free-first
Every provider/resource declares free allowance and billable threshold. Crossing into paid usage is a protected financial action and is never automatically authorized by Resource Governor. When free capacity is exhausted, degrade, defer, reroute to free/local alternatives or surface Needs Me.

## Region/residency
Resource eligibility includes allowed/prohibited provider/region and sensitivity. Cheaper capacity cannot override sovereignty/security policy.

## Telemetry
Per company/project/Brain/Agent/workflow/task: resource units, cost estimate, actual provider usage where available, queue delay, throttle/preempt events, utilization, failures and efficiency. Portfolio views aggregate without exposing customer-sensitive payloads.

## Capacity planning
Forecast free-tier exhaustion, provider quota resets, storage growth, peak concurrency and high-risk shared bottlenecks. Scale triggers must be measurable: sustained utilization, queue delay, error rate, customer SLA, or cost efficiency—not hypothetical growth alone.

## DESIGN NOW
Resource IDs/scopes, usage-event schema, budgets/ceilings, queue admission contract, backpressure state, region/provider eligibility, preemption semantics, emergency reserve and kill controls.

## BUILD NOW
Connect existing Agency leases/scheduler, Brain model usage, provider health and future portfolio company IDs to one resource-accounting contract. Add test simulations for two-company fairness, runaway task containment and free-tier exhaustion.

## BUILD BEFORE FIRST COMPANY
Production-grade per-company quotas, portfolio capacity dashboard, provider quota adapters and company-specific reserve policies.

## Acceptance
A background company workload can saturate its quota without blocking another company's critical task; free-tier exhaustion becomes truthful throttled/blocked state rather than paid spillover; a runaway agent is killed without corrupting other company queues.