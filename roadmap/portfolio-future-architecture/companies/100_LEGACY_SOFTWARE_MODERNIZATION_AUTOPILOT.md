# Company 100 — Legacy Software Modernization Autopilot

**Company ID:** `company:future:100`  
**Primary project:** `project:company:future:100`  
**Roadmap version:** `COMPANY-100-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer code transformation, migration, deployment, cutover or production mutation.

## Business identity
Purpose: analyze aging software and automate as much of its safe understanding, documentation, modernization planning, transformation, verification and staged cutover as technology and evidence permit.

Problem: legacy systems hide business rules inside old code, schemas, runtime behavior and undocumented integrations; rewriting without behavioral evidence loses critical functionality while endless patching compounds risk.

Value: evidence-backed system understanding, explicit modernization choices, reusable compatibility tests, incremental transformation and safer cutover/rollback.

## Complete product tree
Repository/System Discovery; Architecture Reconstruction; Dependency Inventory; Runtime/Environment Discovery; Database/Data-Flow Mapping; External Integration Discovery; Code/Call/Control/Data Graph; Business-Rule Extraction; User-Journey Reconstruction; Documentation Generator; Technical-Debt/Risk Assessment; Modernization Strategy Planner; Refactor Assistant; Modularization/Service Extraction; Strangler-Pattern Planner; API Extraction; Containerization; Dependency/Framework Upgrade; Language/Framework Transformation; Frontend Modernization; Database Modernization; Compatibility Adapter Generator; Test/Golden-Master Generator; Migration Script Builder; Behavior Comparison; Performance/Security Comparison; Parallel-Run/Canary Controller; Cutover/Rollback Planner; Continuous Modernization Monitor; API/SDK; Enterprise/Private Deployment; Language/Framework/Industry Packs.

## Feature/customer/vertical tree
Features: system/repo/build/runtime IDs, language/framework/version, dependencies, modules, calls/data flows, schemas, integrations, business rules, user journeys, criticality, risk, test coverage, observed behavior, target architecture, modernization option/rationale, transformation version, compatibility evidence, performance/security baseline, cutover state and rollback point.

Customers: enterprises, governments, software vendors, banks/insurers where appropriate, healthcare administrative systems, manufacturers, logistics firms, universities, utilities, agencies/integrators and organizations with long-lived internal software.

Verticals: mainframe/enterprise apps, old web monoliths, desktop software, internal line-of-business systems, legacy APIs, old database platforms, unsupported language/framework stacks and poorly documented custom systems. Every vertical/language needs bounded capability packs.

## Brain capability tree / architecture
Brain may infer architecture/business-rule hypotheses, generate documentation, propose modernization strategies and create code transformation candidates. It cannot treat inferred behavior as verified truth. Deterministic/static analysis, runtime traces, golden tests, schema/data reconciliation and controlled experiments establish acceptance.

Architecture: repository/artifact ingestion sandbox, multi-language parser adapters, code/call/data graph, runtime trace ingest, dependency/SBOM registry, business-rule evidence model, target-architecture planner, transformation workspace, compatibility layer generator, isolated build/test environments, golden-master/replay harness, migration/reconciliation and protected release/cutover control.

## Agent tree
Discovery Agent; Architecture Analyst; Dependency Agent; Data/Schema Agent; Integration Agent; Business-Rule Analyst; Documentation Agent; Modernization Strategist; Refactor Agent; API/Service Extraction Agent; Database Modernization Agent; Test/Golden-Master Agent; Security Agent; Performance Agent; Migration Agent; Parallel-Run Comparator; Cutover/Rollback Agent; Independent QA Agent.

## Deterministic services
Language parsers; AST/call/data-flow analysis; dependency/SBOM; build reproduction; runtime tracing; schema diff; behavior snapshot/replay; golden test fixtures; deterministic code transforms where safe; compiler/static analysis; compatibility matrix; performance benchmarks; data reconciliation; artifact hashing; canary/rollback state.

## Workflow tree
Authorize discovery → inventory source/build/runtime/data/integrations → reconstruct architecture/behavior with verified-vs-inferred labels → generate docs/risk map → choose modernization strategy → freeze target/spec/version → create isolated transformation increment → build/test/security/performance compare → preserve golden behavior or explicitly approve intentional change → stage parallel/strangler/canary rollout → protected migration/cutover → verify/reconcile → rollback if gates fail → continue incremental modernization with evidence.

## Integrations / API / data
Git/source archives, artifact/package registries, CI/build systems, runtime/APM/observability, databases, queues, file systems, legacy APIs, browsers/desktop automation, cloud/container platforms, issue/document systems and release/deployment tools. Data: source metadata/code refs, graphs, schemas, traces, rules/evidence, modernization plans, transformed artifacts, tests and comparison results. Customer source stays isolated.

## Monetization / distribution
Applications/repos/LOC or complexity bands, analysis/modernization projects, compute/test usage, seats, enterprise/private, language/framework packs, API, managed modernization and outcome/milestone pricing where contractually appropriate. Distribution via enterprise engineering, consultancies/integrators, cloud migration partners and software vendors.

## Security/privacy/compliance
Legacy code often contains secrets, old credentials and regulated data. Sandbox ingestion, secret scanning/redaction, isolated builds, no dependency execution before trust checks, least-privilege runtime probes, protected migrations/deployments, IP/confidentiality controls and complete provenance are mandatory.

## Failure / edge cases
No source code, unbuildable environment, undocumented external system, dynamic/reflection-heavy code, generated code, hardware dependency, unsupported database, proprietary library, hidden batch jobs, manual operator process, race/timing dependency, production-only behavior, incomplete test data, stale docs, intentional bug relied on by users, performance regression, data conversion mismatch.

## Scale / overlap
Assessment tool → modernization factory → continuous legacy transformation platform. Overlap #60 Software Migration Autopilot moves data/config; #100 upgrades/rebuilds software. Also overlaps #42 legacy browser worker, #53 release, #65 QA, #80 dependency risk. #100 owns software-understanding/transformation lifecycle.

## Classification
**DESIGN NOW:** artifact/source provenance, isolated execution environments, code/data/dependency graphs, verified-vs-inferred truth labels, reproducible builds, golden/replay evidence, versioned transformations, migration/cutover/rollback contracts.  
**BUILD NOW:** Command Center Foundry/Agency/Testing/Deployment/Recovery should be able to coordinate multi-stage modernization without core surgery; reverse-map confirms generic project factories need code-analysis and sandbox capability interfaces, not a legacy-specific implementation now.  
**BUILD BEFORE FIRST COMPANY:** reusable secure code-ingestion sandbox, multi-language analysis plugin interface, transformation/test artifact pipeline and compatibility harness.  
**COMPANY-SPECIFIC LATER:** actual modernization product, language/framework packs, customer systems and commercial execution.  
**SCALE-ONLY:** large distributed code-analysis/transformation fleets and ecosystem-specific model/tooling networks.

# Mandatory 24-part completion block
1. Product Tree: discovery/architecture/dependencies/runtime/data/integrations/code graph/rules/docs/risk/strategy/refactor/modularize/strangler/API/container/dependency-language-frontend-DB modernization/adapters/tests/migrations/comparison/canary/rollback/API.
2. Feature Tree: system/repo/build/runtime/language/deps/modules/flows/schema/integrations/rules/journeys/risk/tests/behavior/target/transforms/evidence/cutover.
3. Customer Tree: enterprise/government/software/banks-insurers/health admin/manufacturing/logistics/education/utilities/integrators.
4. Vertical Tree: mainframe/monolith/desktop/internal tools/APIs/DB/old languages/frameworks/custom systems.
5. Brain Tree: architecture/rule hypotheses/strategy/code candidates; verified behavior comes from static/runtime/tests/reconciliation.
6. Agent Tree: discovery/architecture/dependency/data/integration/rules/docs/strategy/refactor/API/DB/tests/security/performance/migration/comparator/cutover/QA.
7. Service Tree: parsers/AST/graphs/SBOM/build reproduction/tracing/schema diff/replay/golden tests/transforms/compiler/compatibility/perf/reconciliation/hashes/rollback.
8. Workflow Tree: discover→understand→document→strategize→transform increment→test/compare→stage→protected cutover→verify/rollback→repeat.
9. Integration Tree: Git/artifacts/CI/APM/DB/queues/files/legacy APIs/browser-desktop/cloud/issues/docs/releases.
10. Data Tree: source refs/graphs/schemas/traces/rules/plans/artifacts/tests/comparisons/evidence.
11. API Tree: discovery/graph/rules/plans/transforms/tests/comparison/migration/evidence.
12. Monetization Tree: apps/repos/complexity/projects/compute/seats/enterprise/packs/API/managed/milestones.
13. Distribution Tree: enterprise engineering/consultancies/cloud migration/software vendors/OEM.
14. Automation Tree: discovery/docs/test generation/safe transforms automated; architectural intent, destructive migration and cutover governed.
15. Moat Tree: cross-language behavior graph, modernization outcomes, compatibility corpus, verified transformation patterns.
16. Platform Tree: assessment→modernization factory→continuous software transformation infrastructure.
17. Risk Tree: lost behavior/IP leak/secret exposure/bad transform/data loss/performance/security regression/rollback failure.
18. Scale Tree: one app→enterprise estate→large modernization fleet.
19. Spinoff Tree: architecture reconstruction/golden-master/compatibility adapters can be modules; data migration/browser/release/QA remain adjacent companies.
20. Command Center Dependencies: Foundry, Agency, code/tool sandbox, artifact/provenance, Testing Factory, deployment/recovery, dependency security, resource governor.
21. Design-Now Requirements: generic sandboxed code-analysis/build/test capability and verified-vs-inferred evidence model must fit Command Center contracts.
22. Build-Now Requirements: Foundry/Agency tool capability registry should support code graph, build/test sandbox, artifact lineage and multi-stage migration projects without core changes.
23. Safe-to-Defer Requirements: language-specific analyzers, modernization models, customer environments, commercial transformation workers.
24. Autonomous Mature State: discovery, documentation, compatibility testing and low-risk transformations run continuously; humans approve target architecture, intentional behavior changes and protected cutovers.

## Saturation result
Additional branches converge into software migration, browser automation, release, QA, dependency risk, data contracts and recovery already represented elsewhere. Company 100 remains the coherent top-level owner of legacy software understanding and modernization.