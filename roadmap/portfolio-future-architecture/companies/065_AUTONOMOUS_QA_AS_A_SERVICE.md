# Company 065 — Autonomous QA-as-a-Service

**Company ID:** `company:future:065`  
**Primary project:** `project:company:future:065`  
**Roadmap version:** `COMPANY-065-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no production test execution against customer systems without explicit authorization and environment safeguards.

## Business identity

Purpose: provide continuous, evidence-backed quality assurance across web, mobile, desktop, API and workflow surfaces using synthetic users, deterministic assertions, visual checks, accessibility, compatibility, performance and controlled security testing.

Problem: product teams miss regressions because test coverage is fragmented, manual QA is slow, test data is brittle and release gates often verify only happy paths.

Value: broader automated coverage, faster bug reproduction, stable release evidence, reusable test packs and independent verification separated from the builder/executor.

## Complete product tree

Web QA; Mobile QA; API QA; Desktop QA; Workflow/E2E QA; Functional Tests; Visual Regression; Accessibility QA; Browser/Device Compatibility; Localization QA; Performance/Load; Resilience/Chaos Test Planning; Security Regression Checks; Synthetic User Journeys; Test Generation; Test Data/Synthetic Fixture Builder; Bug Reproduction; Evidence/Replay; Release Gate; Regression Pack Marketplace; API/SDK/CLI; CI/CD Integration; Managed QA; Enterprise/Private Deployment; Vertical QA Packs.

## Feature/customer/vertical tree

Features: requirements/spec links, test cases, fixtures, environments, browsers/devices, selectors/contracts, expected results, screenshots, traces/logs, accessibility rules, performance thresholds, retries, flake classification, deterministic replay, risk severity, bug evidence, test ownership/version, release candidate identity and independent verifier status.

Customers: startups, SaaS, agencies, enterprises, mobile/web teams, API providers, ecommerce, regulated software, QA consultancies, platform vendors and internal engineering groups.

Verticals: ecommerce checkout, finance-adjacent software, health administrative systems, accessibility-sensitive public services, B2B SaaS, mobile apps, marketplaces, developer platforms and legacy software. Domain packs encode workflows without weakening independent QA.

## Brain capability tree / architecture

Brain may infer test cases from specs/diffs, prioritize risk, interpret failures and propose reproduction steps. Deterministic test runners/assertions own pass/fail whenever possible. Visual/model judgments require confidence/evidence and should not replace explicit requirements.

Architecture: requirement/test registry, environment/device matrix, isolated runners, browser/mobile/API adapters, visual diff, accessibility engines, performance/load tools, fixture/synthetic data service, trace/artifact store, flake classifier, replay harness, release-gate policy and independent QA identity.

## Agent tree

Test Planner; Functional QA Agent; API QA Agent; Visual QA Agent; Accessibility Agent; Compatibility Agent; Performance Agent; Security Regression Agent; Localization QA Agent; Synthetic User Agent; Bug Reproducer; Flake Investigator; Evidence Agent; Independent Release Verifier.

## Deterministic services

Test runner orchestration; environment isolation; selector/contract validation; screenshot hashing/diff; accessibility rule engines; API schema assertions; load scheduling; retry/flake policy; artifact capture; test versioning; deterministic replay; release gate and pass/fail evidence.

## Workflow tree

Ingest requirements/diff/release candidate → build/update risk-based test plan → prepare isolated environment/fixtures → run deterministic suites in parallel → collect artifacts/traces → classify failures vs flakes → reproduce/minimize bug → route unresolved model-based judgments to review → rerun fixes → independent verifier confirms acceptance → issue release-gate evidence, never deployment authority.

## Integrations / API / data

Git/source control, CI/CD, issue trackers, design/screenshot references, browser/device farms, app builds, API schemas, observability, accessibility tools, test-management systems and release platforms. APIs for plans, tests, runs, artifacts, failures, reproductions and gate evidence.

Data: requirements, tests, fixtures, runs, environments, artifacts, screenshots, logs, failures, classifications, bugs, acceptance evidence and trend metrics. Customer test data stays isolated and secrets are reference-only.

## Monetization / distribution

Test runs/minutes, devices/browsers, suites, repositories/apps, concurrent runners, seats, load volume, enterprise/private, API/OEM, managed QA and premium vertical packs. Distribution via CI/devtool marketplaces, agencies and engineering consultancies.

## Security/privacy/compliance

Runners are sandboxed, credentials scoped to test environments, production testing disabled by default, no destructive chaos/security test without explicit authorization, data redaction, artifact retention policy and customer isolation. QA must remain independent from the implementation Agent for high-risk acceptance.

## Failure / edge cases

Flaky network/UI, nondeterministic animations, test pollution, shared-state races, captcha/2FA, third-party outage, browser version change, accessibility false positive, visual anti-aliasing drift, performance noisy neighbor, bad fixture, test passes wrong environment, synthetic user creates real side effect. Environment identity and cleanup are mandatory.

## Scale / overlap

Single repo regression suite → cross-platform QA service → autonomous quality-control infrastructure. Overlap #3 AI quality-control evaluates AI systems; #065 evaluates software/products broadly; #53 release autopilot consumes QA evidence; #56 synthetic data supplies fixtures.

## Classification

**DESIGN NOW:** independent verifier identity, test/evidence/artifact contracts, environment isolation, replay, synthetic side-effect fencing, quality-gate interfaces.  
**BUILD NOW:** Command Center already needs independent QA and evidence; reverse-map should formalize reusable Testing Factory seams.  
**BUILD BEFORE FIRST COMPANY:** isolated runner registry, environment matrix, artifact store, replay and test orchestration.  
**COMPANY-SPECIFIC LATER:** customer device/browser farms, connectors, vertical packs, billing.  
**SCALE-ONLY:** large distributed runner fleet and marketplace of evaluated test packs.

# Mandatory 24-part completion block

1. Product Tree: web/mobile/API/desktop/workflow/functional/visual/accessibility/compat/localization/performance/security/synthetic/repro/release gate/API.
2. Feature Tree: requirements/tests/fixtures/env/devices/assertions/screenshots/traces/a11y/perf/retries/flakes/evidence/versioning.
3. Customer Tree: startup/SaaS/agency/enterprise/mobile/web/API/ecommerce/regulated/QA consultancy/platform vendor.
4. Vertical Tree: commerce/finance-adjacent/health admin/public services/B2B/mobile/marketplace/devplatform/legacy.
5. Brain Tree: test generation/prioritization/failure interpretation; deterministic assertions dominate pass/fail.
6. Agent Tree: planner/functional/API/visual/a11y/compat/perf/security/localization/synthetic/reproducer/flake/evidence/verifier.
7. Service Tree: runners/isolation/assertions/diff/a11y/schema/load/retry/artifacts/version/replay/gates.
8. Workflow Tree: ingest→plan→prepare→run→capture→classify/reproduce→rerun→independent verify→evidence.
9. Integration Tree: Git/CI/issues/design/device farms/builds/APIs/observability/a11y/test management/releases.
10. Data Tree: requirements/tests/fixtures/runs/env/artifacts/failures/bugs/evidence/trends.
11. API Tree: plans/tests/runs/artifacts/failures/reproduction/gates.
12. Monetization Tree: runs/minutes/devices/suites/apps/concurrency/seats/load/enterprise/API/managed.
13. Distribution Tree: CI/devtool marketplaces/agencies/consultancies/OEM.
14. Automation Tree: planning/execution/reproduction/regression automated; ambiguous acceptance and destructive tests gated.
15. Moat Tree: test/repro corpus, vertical packs, runner reliability, cross-platform evidence.
16. Platform Tree: QA service→autonomous testing factory→software quality infrastructure.
17. Risk Tree: false pass/flaky failure/production side effect/secret leak/wrong environment/biased visual judgment.
18. Scale Tree: repo→portfolio→distributed global test fleet.
19. Spinoff Tree: visual QA/accessibility/repro runner modules; AI evaluation remains separate Company 003.
20. Command Center Dependencies: Agency, independent verification, artifacts, environments, resource governor, security, release gates.
21. Design-Now Requirements: test/evidence identities, independent verifier separation and side-effect-safe fixtures.
22. Build-Now Requirements: formalize Testing/Evaluation Factory primitives reusable by Command Center and future companies.
23. Safe-to-Defer Requirements: customer runner fleets/device farms/integrations/marketplace/pricing.
24. Autonomous Mature State: tests are generated, run, reproduced and regression-maintained continuously; humans resolve ambiguous requirements and approve high-risk release exceptions.

## Saturation result

Further branches converge into AI-specific evaluation, accessibility monitoring, release control or synthetic data products already represented.