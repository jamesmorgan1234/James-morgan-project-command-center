# Category 13 — Analytics / Observability / Recommendations / Self-Audit

Status: IMPLEMENTED FOR ISOLATED BRANCH VERIFICATION

## P13.1 — Metric registry and cognitive/ecosystem health

The analytics metric surface retains semantic definition/version, unit, aggregation, provenance requirements, and metric class. Durable health snapshots explicitly cover calibration drift, contradiction growth, stale-memory rate, evaluator health, routing regret, transfer outcomes, ecosystem-learning health, provider/model/method drift, and revalidation pressure.

## P13.2 — Trace and learning observability

Durable observability events retain a trace reference, predecessor linkage, event class, payload, evidence references, occurrence time, and owner/project/company scope. The event vocabulary covers the required context → policy → router → specialist → method → tool → evidence → verifier → state → outcome → learning → promotion chain without turning trace data into authorization.

## P13.3 — Reliability, performance, drift, and ecosystem health

Existing analytics reliability/accuracy/measurement modules supply runtime calculations and validation. Durable health snapshots retain the observed class/value/unit/threshold/evidence required to distinguish live evidence from inferred or stale health.

## P13.4 — Project, roadmap, and portfolio analytics

Existing portfolio and measurement-schema modules retain scoped project/portfolio analytics. Category 13 evidence remains owner/project/company scoped; analytics never create cross-company truth or permission.

## P13.5 — Agency analytics and routing regret

Existing Agency analytics retain queue/worker/routing measurements. Routing regret is explicitly represented as a health class; it measures routing effectiveness by context but cannot authorize a new route, worker, provider, tool, or protected action.

## P13.6 — Recommendations, decision quality, outcomes, and transfer effect

Decision-outcome evidence separates predicted outcome, actual outcome, process quality, decision quality, transfer effect, and luck-confounding state. Any execution authority remains separate and is referenced, not inferred. Transfer evidence is measurement only until the governed applicability/promotion path separately permits reuse.

## P13.7 — Lessons, failure intelligence, negative knowledge, and procedure learning

Durable learning lessons classify build-history evidence, failure intelligence, negative knowledge, and procedure learning. Scope is explicit (`project`, `company`, `domain`, or `ecosystem_candidate`). Confidence, applicability, promotion state, promotion authorization reference, and evidence are retained. Local success cannot silently become ecosystem truth.

## P13.8 — Security, trust, and correlated-error analytics

Security analytics explicitly distinguish security/trust findings from correlated-error, shared-source, shared-model, and shared-benchmark risk. Correlation references and evidence remain immutable and owner scoped.

## P13.9 — Self-audit / Architecture Critic / Ecosystem Optimizer

Governance findings distinguish self-audit, compliance, Architecture Critic, and Ecosystem Optimizer output. The durable schema enforces `may_self_mutate = false`. These components produce evidence-backed findings/proposals only and cannot mutate runtime, policy, authority, or protected state by themselves.

## P13.10 — Evaluator/benchmark accuracy, privacy, reproducibility, and scale

Evaluator results bind evaluator identity/version, benchmark identity/version, reproducibility reference, privacy class, sample count, calibration state, result, evidence, and time. Existing evaluator/accuracy/privacy instrumentation tests remain the semantic runtime acceptance layer; the durable schema supplies an owner-isolated evidence record rather than replacing those tests.

## Durable evidence and isolation

`supabase/migrations/20261026143000_p13_analytics_observability_governance.sql` creates append-only durable evidence for metrics, trace events, health snapshots, decision outcomes, learning lessons, security analytics, governance findings, and evaluator results. All tables enable RLS and require both `auth.uid() = owner_user_id` and `public.is_command_center_authorized()`. Evidence update/delete is rejected by database triggers.

## Verification inventory

- `clean-room/tests/category13-authoritative-acceptance.test.mjs`
- `clean-room/tests/category13-measurement-schema.test.mjs`
- `clean-room/tests/analytics-foundation.test.mjs`
- `clean-room/tests/analytics-optimization.test.mjs`
- `clean-room/tests/category13-durable-governance-evidence.test.mjs`
- `clean-room/src/analytics/*`
- `supabase/migrations/20261026143000_p13_analytics_observability_governance.sql`

Full verification requires the exact commit containing these artifacts to pass the repository build/typecheck/test/audit workflow. This document does not claim external provider operation, production deployment, or authority beyond current Command Center policy.
