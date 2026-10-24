# Company 080 — Software Dependency Risk Autopilot

**Company ID:** `company:future:080`  
**Primary project:** `project:company:future:080`  
**Roadmap version:** `COMPANY-080-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no dependency update, patch merge or production release.

## Business identity
Purpose: continuously evaluate software dependencies for vulnerabilities, malicious packages, abandonment, license issues, maintainer/supply-chain risk, breaking changes and upgrade compatibility.

## Product tree
Dependency/SBOM Inventory; Vulnerability Monitor; Malicious Package Detection; Typosquat/Dependency-Confusion Monitor; Maintainer/Ownership Change Monitor; Package Health/Abandonment Score; License Risk Link; Version Drift; Breaking-Change Analyzer; Upgrade Planner; Compatibility Test Generator; Auto-Patch Candidate Builder; Container/Image Scan; Repository/Lockfile Scan; Policy/CI Gate; Incident Response; Dependency Graph/Blast Radius; API/SDK/CLI; Enterprise/Private Deployment; Ecosystem Packs.

## Feature/customer/vertical tree
Features: package/component ID, ecosystem/source, current/target version, direct/transitive, hash/signature, dependency parents, advisories, severity/exploitability, maintainer/registry changes, release cadence, license, compatibility constraints, usage/import reachability, policy, proposed upgrade, test evidence and rollout state.
Customers: software teams, enterprises, SaaS, open-source-heavy orgs, security/DevSecOps, agencies, platform vendors and regulated engineering teams.
Verticals: JavaScript, Python, JVM, .NET, Go, Rust, containers/OS packages, mobile and other ecosystems; packs encode toolchain semantics.

## Brain capability / architecture
Brain may summarize advisories/changelogs, infer likely breaking surfaces and plan upgrades. Deterministic package resolution, hashes, advisories, policy and test evidence own gates. Architecture: SBOM/dependency graph, registry/advisory collectors, package identity, risk scoring, reachability hints, compatibility analyzer, sandbox test runner, patch generator, CI gate and evidence ledger.

## Agent tree
Inventory Agent; Vulnerability Agent; Supply-Chain Threat Agent; Package Health Agent; Changelog/Breaking-Change Agent; Upgrade Planner; Compatibility Test Agent; Patch Agent; License Liaison Agent; Incident Agent; QA/Security Agent.

## Deterministic services
Lockfile/SBOM parsing; dependency graph; version semantics; hash/signature checks; advisory matching; policy rules; allowed registry/source; patch isolation; reproducible install; test execution; change diff; rollback.

## Workflow
Inventory exact lock/build → resolve graph → ingest advisories/registry changes → classify risk/reachability → identify safe target → inspect breaking changes → build isolated patch candidate → run tests/security/build → produce evidence/risk → authorized merge/release handled separately → monitor deployment and rollback path.

## Integrations / API / data
Git/CI, package registries, advisory feeds, SBOM systems, container registries, source repos, issue trackers, release systems and license scanners. Data: packages/versions/hashes/graphs/advisories/maintainers/risks/patches/tests/evidence.

## Monetization / distribution
Repos/apps/dependencies/scans, seats, enterprise/private, API, ecosystem/compliance packs and managed upgrade programs. Distribution through Git/CI/security/devtool ecosystems.

## Security/privacy/compliance
Scanning code/dependencies is sensitive. No untrusted package execution outside sandbox, lifecycle scripts restricted, registry/source pinning, provenance, signed artifacts, least privilege and no auto-merge of high-risk updates without evidence/authorization.

## Failure / edge cases
Compromised maintainer, malicious new version, advisory false positive, unreachable vulnerable code, lockfile generated per platform, package yanked, transitive conflict, native build, optional peer deps, emergency patch unavailable, license changes, test gaps, hidden runtime plugin.

## Scale / overlap
Repo monitor → enterprise dependency control → software supply-chain platform. Overlap #53 release, #81 license compliance, #72 API drift. #080 owns dependency risk/upgrade lifecycle.

## Classification
**DESIGN NOW:** immutable dependency/build identity, package source/provenance, lifecycle-script safety, policy gates, sandboxed update testing and rollback.  
**BUILD NOW:** Command Center already pinned Actions/TypeScript after P2.9; reverse-map says a general supply-chain policy should be first-class.  
**BUILD BEFORE FIRST COMPANY:** dependency graph/advisory collectors/sandbox patch runner.  
**COMPANY-SPECIFIC LATER:** ecosystem feeds/customer repos/UI/pricing.  
**SCALE-ONLY:** huge cross-ecosystem package intelligence graph.

# Mandatory 24-part completion block
1. Product Tree: SBOM/vulns/malware/typosquat/maintainer/health/license/version drift/breaking changes/upgrade/tests/patch/container/repo/CI/incident/API.
2. Feature Tree: package/ecosystem/version/direct-transitive/hash/parents/advisory/severity/maintainer/license/compatibility/reachability/tests.
3. Customer Tree: software/enterprise/SaaS/security/DevSecOps/agencies/platform vendors/regulated.
4. Vertical Tree: JS/Python/JVM/.NET/Go/Rust/container/mobile/OS packages.
5. Brain Tree: advisory/changelog/upgrade reasoning; resolution/provenance/gates deterministic.
6. Agent Tree: inventory/vulnerability/supply-chain/health/changelog/upgrade/test/patch/license/incident/QA.
7. Service Tree: parsers/graph/semver/hash/signatures/advisory/policy/sandbox/install/tests/diff/rollback.
8. Workflow Tree: inventory→risk→target→analyze→patch sandbox→test→evidence→governed merge/release.
9. Integration Tree: Git/CI/registries/advisories/SBOM/container/issues/releases/license tools.
10. Data Tree: packages/versions/hashes/graphs/advisories/maintainers/risks/patches/tests/evidence.
11. API Tree: inventory/risk/advisories/upgrade/patch/test/evidence.
12. Monetization Tree: repos/dependencies/scans/seats/enterprise/API/packs/managed.
13. Distribution Tree: Git/CI/security/devtools/OEM.
14. Automation Tree: inventory/risk/patch candidate/testing automated; merge/release protected.
15. Moat Tree: package graph, maintainer/incident history, compatibility outcomes, ecosystem breadth.
16. Platform Tree: scanner→dependency autopilot→software supply-chain control plane.
17. Risk Tree: malicious execution/false safe/compatibility break/license miss/test gaps/supply-chain poisoning.
18. Scale Tree: repo→enterprise→cross-ecosystem global graph.
19. Spinoff Tree: package health/upgrade compatibility modules; license compliance remains separate.
20. Command Center Dependencies: build/release identity, CI, sandbox, policy, artifacts, security/evidence.
21. Design-Now Requirements: dependencies/actions/images must be version/hash/source-addressable and testable in isolation.
22. Build-Now Requirements: formalize Command Center dependency/supply-chain gate beyond current point fixes.
23. Safe-to-Defer Requirements: commercial advisory graph/customer repos/ecosystem packs.
24. Autonomous Mature State: dependency risks and safe patches are continuously prepared/tested; humans approve risky ecosystem/major-version changes and releases.

## Saturation result
Further branches converge into license compliance, release automation and API drift products already represented.