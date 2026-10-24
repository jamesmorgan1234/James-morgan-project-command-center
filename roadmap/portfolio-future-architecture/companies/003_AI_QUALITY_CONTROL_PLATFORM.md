# Company 003 — AI Quality-Control Platform

**Company ID:** `company:future:003`  
**Primary project:** `project:company:future:003`  
**Roadmap version:** `COMPANY-003-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: continuously test and verify AI prompts, models, RAG systems, agents, tool use and autonomous workflows before and after release.

Problem: AI quality is probabilistic, regressions can be silent, agent/tool failures can cause real side effects, and teams lack reusable evaluation infrastructure spanning accuracy, safety, policy, security, reliability, cost and latency.

Value: evidence-backed release gates, regression detection, benchmark management, adversarial testing and production quality monitoring.

Delivery: developer SaaS, CI/CD API, SDK/CLI, private/VPC/self-hosted runner, enterprise governance console, embedded/OEM evaluation service, managed red-team/evaluation packs.

## Product tree

1. Prompt Evaluation — golden datasets, rubric scoring, pairwise comparisons, regression.
2. Model Evaluation — task benchmarks, quality/cost/latency/reliability, model replacement analysis.
3. Agent Evaluation — planning, tool selection, task completion, policy, recovery, memory, delegation, side-effect safety.
4. RAG/Retrieval Evaluation — recall, precision, grounding, source quality, freshness, citation/provenance, context contamination.
5. Tool-Use Evaluation — schema adherence, permission scope, error recovery, idempotency, protected-action handling.
6. Safety/Policy Evaluation — prohibited content/actions, policy adherence, privacy, data leakage, authorization boundaries.
7. Hallucination/Grounding Evaluation — unsupported claims, contradiction, confidence calibration, source traceability.
8. Adversarial/Red-Team Studio — prompt injection, jailbreaks, malformed inputs, context poisoning, malicious tool outputs, agent loops.
9. Data/Distribution Drift — evaluation-set drift, production input change, outcome degradation.
10. Regression CI Gate — compare release candidate to stable baseline and block regressions.
11. Production Quality Monitor — sampled/live traces, drift, failure clusters, policy violations, human escalations.
12. Evaluation Pack Registry — domain, policy, security, accessibility, localization, compliance packs.
13. Benchmark Marketplace — optional curated public/private benchmark packs with provenance/licensing.
14. Human Review Workspace — blinded review, adjudication, rubric calibration, reviewer consistency.
15. Synthetic Test Generator — edge/adversarial scenario generation with human/policy constraints.
16. Cost/Performance Benchmarks — quality-per-dollar, latency, token/compute usage, retries, throughput.
17. Agent Simulation Lab — deterministic/synthetic environments for action/recovery tests with no real protected effects.
18. Release Certification — evidence bundles proving required gates passed; not a legal certification unless qualified.
19. Evaluation Analytics — failure taxonomy, root cause, trend, model/prompt/tool/provider comparison.
20. Developer Platform — evaluation API, SDKs, CLI, CI plugins, webhooks, custom evaluator framework.

## Feature tree

Dataset/version management; test cases; expected outcomes; rubric DSL; deterministic and model-judge evaluators; multi-judge consensus; human review; confidence intervals; variance/repeat runs; seed/time/provider capture; trace ingestion; tool-call capture; source/context capture with redaction; baseline/candidate comparison; threshold gates; severity; flake detection; test sharding; parallelism; cost caps; caches; offline replay; reports; audit; export; custom metrics; role/tenant permissions; retention; legal hold; private runners; regional processing.

## Customer tree

AI startups; SaaS/product teams; enterprises; ML/AI platform teams; security/governance teams; agent builders; model providers; RAG/search vendors; support/automation vendors; regulated sectors; consultancies/integrators; QA/testing firms; research/education.

## Vertical tree

Software coding agents; customer support; finance operations; legal/compliance assistance; healthcare administrative AI; ecommerce/catalog; content/media; cybersecurity; HR; public-sector workflow AI. Each vertical requires domain-specific truth sources, rubrics, harmful-failure definitions and escalation standards.

## Brain capability tree

Know evaluator history, benchmark versions, failure taxonomies, model/provider/tool versions, policies. Understand task intent, expected behavior, severity and nondeterminism. Reason about evaluator validity, confounders, false positives/negatives. Plan test portfolios and minimal reproductions. Predict regression risk and production impact. Optimize test coverage/cost/time. Recommend release/block, remediation and test expansion. Execute test/simulation runs within isolated policy. Monitor drift. Learn only from verified adjudicated evidence. Verify results/statistics/provenance. Escalate ambiguous high-impact failures.

Production release decision may be recommended; actual protected deploy remains separately authorized.

## Brain architecture

Hybrid evaluator engine: deterministic assertions first; statistical metrics; classical anomaly/drift detection; domain rules; LLM judges only where semantic evaluation is needed, with judge-model/version evidence and calibration; simulation/state machines for agents; graph for failure dependencies; search/RAG over specs/policies/test history; model routing for cost/quality. Never use one LLM judge as unquestioned truth.

## Agent tree

- Eval Planner — coverage/risk test plan.
- Test Generator — edge cases, constrained synthetic inputs.
- Grounding Auditor — source/citation correctness.
- Tool-Use Auditor — tool/schema/permission behavior.
- Security Red-Team Agent — adversarial input generation in sandbox.
- Policy Auditor — rules/authorization/privacy checks.
- Regression Analyst — baseline/candidate deltas.
- Flake/Variance Analyst — nondeterminism/repeatability.
- Human Review Coordinator — samples/adjudication, no reviewer impersonation.
- Production Drift Monitor — trace sampling/anomaly clusters.
- Cost/Latency Optimizer — evaluation economics.
- Root-Cause Agent — traces failures to prompt/model/tool/data/version changes.
- Release Evidence Agent — evidence bundle; cannot deploy.

## Deterministic services

Test runner; dataset registry; evaluator registry; metric engine; statistical comparison; trace ingestion; artifact hashing; experiment scheduler; CI gate; sandbox environment; synthetic fixture service; redaction; cost meter; result DB; event/webhook service; report generator; private-runner coordinator; audit ledger.

## Inputs / outputs / workflows

Inputs: specs, policies, prompts, models, tools, datasets, production traces, human labels, known incidents, provider metadata.

Outputs: pass/fail/uncertain evidence, metric distributions, regressions, failure clusters, benchmark reports, remediation recommendations, release gate result, audit bundle.

Workflow: define risk/spec → version dataset/evaluators → run deterministic + semantic tests → repeat/variance → human adjudication if needed → compare baseline → evaluate thresholds → block/recommend release → monitor production → add verified failures to regression suite.

## Integration tree

GitHub/GitLab/CI; model gateways/providers/local models; agent frameworks; observability/tracing; RAG/vector/search; ticketing; test management; data warehouses; security/SIEM; deployment platforms; feature flags; human review systems; issue trackers; eval frameworks.

## API/developer ecosystem

Submit evaluation run; register dataset/evaluator; ingest trace; query results; compare candidates; gate CI; custom evaluator SDK; plugin framework; CLI; CI actions; webhook; private runner protocol; benchmark import/export.

## Data architecture / moat

Versioned datasets/rubrics/evaluator code; result distributions; trace metadata; failure taxonomy; adjudications; model/provider/tool versions; production incident links; cost/latency. Potential moat: high-quality evaluation packs, calibrated failure corpus, cross-version benchmark history and root-cause knowledge. Never pool confidential customer prompts/data without explicit privacy-safe aggregation.

## Monetization / packaging

Free developer tier; usage by runs/cases/traces; seats; CI project count; enterprise/private runner; evaluation/security packs; managed red-team; benchmark subscriptions; API; premium retention/compliance; support. Avoid “pass” guarantees beyond measured evidence.

## Distribution

Developer/ML communities, CI integrations, model/agent framework partnerships, open benchmark tools, security/QA partnerships, cloud marketplaces, technical content. No live acquisition now.

## Security/privacy/compliance

Test data may be highly sensitive. Require redaction, scoped traces, customer-controlled retention, no evaluator training on customer data by default, private runners, regional processing, least privilege, signed artifacts, supply-chain controls, sandboxed malicious-input testing, legal-hold/export/deletion support.

## Failure / edge cases

Bad benchmark, contaminated test data, judge bias, model-judge self-preference, flaky provider, hidden nondeterminism, overfitting to benchmark, production/test mismatch, malicious trace content, prompt injection inside RAG samples, high variance, leaked secrets, metric gaming. Use multi-method evaluation, blind/human calibration, immutable versions, independent judges, deterministic checks and explicit uncertainty.

## Scale

Micro: hundreds of cases/release.  
~$100K ARR: multi-project CI, reusable packs.  
~$1M: enterprise traces/private runners/domain packs.  
~$10M: high-volume production sampling/global regions/benchmark ecosystem.  
~$100M+: industry-standard evaluation marketplace/control plane and certified private infrastructure.

## Moats / network effects / platform

Moats: evaluation corpus, calibrated rubrics, failure taxonomy, version history, CI/agent integrations. Network effects through benchmark/evaluator ecosystem and anonymized aggregate trends only with explicit privacy controls. Platform transition: testing tool → AI quality control plane → evaluation standard/marketplace.

## Spinoffs / overlap

Overlap with #65 autonomous QA, #66 runtime security, #67 injection firewall, #89 support-QA, #95 AI ROI. Keep Company 003 focused on AI-system quality/evaluation across domains. Specialized evaluator packs may be products, not new companies.

## Classification

**DESIGN NOW:** versioned evidence/evaluation contracts, immutable model/tool/provider refs, trace provenance, independent verification, replay/test sandbox seams.  
**BUILD NOW:** Command Center should preserve evaluation-pack/evidence interfaces because Brain/Agency already require them.  
**BUILD BEFORE FIRST COMPANY:** evaluation registry/runner abstraction, tenant isolation, cost meter/private runner seam.  
**COMPANY-SPECIFIC LATER:** external product portal, benchmark marketplace, paid packs.  
**SCALE-ONLY:** global private runner fleet, large trace sampling, certification ecosystem.

# Mandatory 24-part completion block

1. **Complete Product Tree:** prompt/model/agent/RAG/tool/safety/hallucination/adversarial/drift/regression/production/eval packs/benchmarks/human review/synthetic/cost/simulation/certification/analytics/dev platform.
2. **Complete Feature Tree:** versioning, rubrics, deterministic/model judges, human calibration, variance, trace, replay, CI gates, reports, private runners, admin/security.
3. **Complete Customer Tree:** builders, SaaS, enterprise, ML/security teams, agent/RAG/model vendors, integrators, regulated/public/research.
4. **Complete Vertical Tree:** coding, support, finance ops, legal/compliance, healthcare admin, ecommerce, content, cyber, HR, government.
5. **Complete Brain Capability Tree:** test planning, evaluator validity, regression risk, root cause, cost optimization, evidence verification/escalation.
6. **Complete Agent Tree:** planner, generator, grounding/tool/security/policy auditors, regression/flake/human/drift/cost/root-cause/evidence agents.
7. **Complete Service Tree:** runners, registries, metrics/statistics, traces, scheduler, sandbox, redaction, meter, reports, audit.
8. **Complete Workflow Tree:** test design→run→adjudicate→compare→gate→monitor→regression update.
9. **Complete Integration Tree:** source control/CI, models/agents, observability, RAG/data, tickets, security, deployment/flags/review.
10. **Complete Data Tree:** datasets/rubrics/results/traces/failures/adjudications/versions/incidents/cost.
11. **Complete API/Developer Tree:** eval/dataset/evaluator/trace/compare/gate/custom SDK/CLI/CI/webhook/private runner.
12. **Complete Monetization Tree:** runs/cases/traces/seats/projects/enterprise/private/packs/managed red-team/benchmarks/API/retention/support.
13. **Complete Distribution Tree:** dev/ML, CI/framework partners, OSS, QA/security partners, marketplaces/content.
14. **Complete Automation Tree:** test generation/run/gating/drift/root cause/reporting; high-impact ambiguity escalates.
15. **Complete Moat Tree:** curated eval packs, calibrated labels, failure corpus, history, integrations.
16. **Complete Platform Tree:** eval suite → CI quality gate → production AI-QC control plane → benchmark/evaluator ecosystem.
17. **Complete Risk Tree:** judge bias, benchmark gaming, contamination, privacy, nondeterminism, test-prod mismatch, adversarial traces.
18. **Complete Scale Tree:** local/CI → enterprise/private → global high-volume evaluation → industry ecosystem.
19. **Complete Spinoff Tree:** prefer existing #65/#66/#67/#89/#95; domain packs remain products.
20. **Command Center Dependencies:** evidence/versioning, Brain/Agent registries, sandbox/replay, security/isolation, model routing, observability.
21. **Design-Now Requirements:** immutable version/provenance/eval interfaces and independent verifier separation.
22. **Build-Now Requirements:** generic evaluation-pack and evidence hooks after reverse-map; no Company 003 customer product.
23. **Safe-to-Defer Requirements:** marketplace, public benchmark subscriptions, managed service, global runners.
24. **Autonomous Mature State:** evaluation planning/runs/regression/drift operate continuously; production releases receive evidence-based gates; James handles policy/strategy/protected exceptions.

## Saturation result

Remaining branches map to specialized evaluation products or neighboring QA/security/ROI companies. No materially distinct additional top-level company emerges from this pass.
