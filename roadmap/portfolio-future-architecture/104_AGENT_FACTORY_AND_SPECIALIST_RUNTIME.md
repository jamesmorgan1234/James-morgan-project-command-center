# 104 — Agent Factory & Specialist Runtime

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION

## 1. Agent Factory principle

Agents are not prompts with names. Each Agent is a governed logical worker role with identity, capabilities, tools, authority, state, budgets, evaluations, recovery and lifecycle. Disposable runtime workers may execute an Agent assignment, but the logical Agent identity and evidence survive worker loss.

## 2. Required Agent manifest

- stable `agent_id` and `agent_type`;
- owning Brain/company/project;
- purpose/mission boundaries;
- capability list;
- supported project/company/domain types;
- required deterministic services;
- tool schemas + providers;
- data/memory scopes;
- sensitivity/residency limits;
- permission/action classes;
- delegated-authority ceiling;
- cost/token/API/browser/compute budgets;
- concurrency/delegation depth/fan-out;
- input/output contracts;
- evidence/completion contract;
- verifier requirement;
- health/heartbeat/lease contract;
- retry/idempotency/checkpoint behavior;
- incident/escalation behavior;
- evaluation pack;
- version/compatibility/migration/retirement.

## 3. Reusable archetypes

Planner • Researcher • Analyst • Collector • Classifier • Document Agent • Browser Agent • API Agent • Workflow Agent • Code/Build Agent • Data Agent • Optimization Agent • Forecast Agent • Support Agent • Onboarding Agent • Billing/Finance Agent • Compliance Agent • Security Agent • QA Agent • Independent Verifier • Integration Agent • Deployment Agent • Incident Agent • Localization Agent • Monitor/Watch Agent • Knowledge Agent • Human-Boundary/Needs-Me Agent.

Company-specific Agents should normally instantiate these archetypes with domain packs instead of forking orchestration core.

## 4. Authority and delegation

- Child scope must be a strict subset/equal subset of parent authorized scope.
- Agent cannot self-grant tools, data, accounts, budget, protected actions or higher autonomy.
- Delegation has bounded depth/fan-out and no cycles.
- Every assignment freezes goal/spec/policy/context versions.
- Protected action authority remains separate and one-time/fresh where required.
- Agent conversation or incoming content never broadens authority.

## 5. Runtime worker separation

Logical Agent ≠ runtime worker.

Worker record includes runtime/provider/environment/version, lease, generation/fencing token, health, resources and current assignment. Worker replacement cannot change the Agent's mission, authority or evidence requirements.

## 6. Context packet

Every task packet must contain:
- company/project/run/task IDs;
- Agent identity + generation;
- goal/spec/owner-instruction/policy versions;
- exact authorization scope;
- current checkpoint;
- dependency outputs/evidence;
- allowed data/memory scopes;
- sensitivity/residency;
- provider/tool refs;
- artifact refs/hashes;
- budgets/deadline;
- freshness/stale-after;
- expected output schema and verification.

Stale/wrong-project/wrong-company packets fail closed.

## 7. Scheduling/resource model

Scheduler considers capability, priority, company/project importance, cost, risk, required environment, locality/residency, provider health, concurrency, shared-resource locks, rate limits and anti-affinity. Global Resource Governor can throttle/preempt background Agents but cannot expand their authority.

## 8. Verification

High/critical-risk work requires independent verifier identity. Executor evidence alone cannot satisfy independent verification. Completion state requires required artifacts/evidence and accepted verifier result.

## 9. Failure/recovery

Agent runtime supports leases, heartbeats, stale-worker fencing, orphan reclaim, checkpoint resume, exactly-once commits, late-response suppression, provider failover, dependency retry limits, safe mode and incident escalation. Recovery preserves mission/authority/queue/checkpoint.

## 10. Multi-Agent communication

Inter-Agent messages are typed artifacts/events with sender/receiver identity, company/project scope, sensitivity, intent, payload schema, provenance, correlation ID and authorization relevance. Free-form messages cannot become hidden authority channels.

## 11. Lifecycle

`REGISTERED → READY → ASSIGNED → WORKING → WAITING/BLOCKED → VERIFYING → COMPLETED` with `PAUSED`, `DEGRADED`, `SUSPENDED`, `FAILED`, `RETIRED` as explicit states.

## 12. Factory output

Factory composes archetype + company/domain pack + Brain/tool/workflow/policy/eval packs into a versioned Agent manifest. It validates dependencies, runs tests, registers the Agent, and supports disable/remove without unrelated core edits.

## 13. BUILD NOW

Current Agency already implements much of worker fencing, delegation, verification, context packets and recovery. Reverse-map requirement is to generalize this into an explicit reusable Agent Factory/manifest system and connect it to machine identity, Brain packages, company/project isolation, region/resource budgets and portfolio registries.

## 14. BUILD BEFORE FIRST PORTFOLIO COMPANY

Company Agent pack builder; deployment/runtime worker pools; company-specific budgets/quotas; isolated logs/memory/tool accounts; portfolio Agent health UI; scale tests at 100+ logical companies.

## 15. Acceptance

A dummy company can register several Agents from shared archetypes, run safe isolated tasks, delegate only subset scopes, survive worker replacement, independently verify output, hit quota/backpressure, enter safe mode, be version-upgraded and removed without exposing another company or changing orchestration core.