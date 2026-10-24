# Company 081 — Open-Source License Compliance API

**Company ID:** `company:future:081`  
**Primary project:** `project:company:future:081`  
**Roadmap version:** `COMPANY-081-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no legal determination, repository change or software release.

## Business identity
Purpose: inventory open-source components and map license obligations, incompatibilities, attribution/notice needs and policy risks into developer workflows.

## Product tree
License/SBOM Scanner; Repository/Lockfile Scanner; Container Scanner; Transitive License Graph; License Identification; Compatibility/Policy Rules; Copyleft/Source-Distribution Flagging; Attribution/Notice Generator; Obligation Tracker; License Change Monitor; CI/CD Gate; Developer Guidance; Exception/Legal Review Queue; Acquisition/Portfolio Scan; API/SDK/CLI; Enterprise/Private Deployment; Policy Packs.

## Feature/customer/vertical tree
Features: component/version/source/hash, direct/transitive path, declared/detected license, confidence, license text hash, obligations, distribution mode, linking/use context, policy classification, incompatibilities, exception approval, notices, source-offer requirement flags and evidence.
Customers: software vendors, enterprises, SaaS, embedded/device companies, agencies, open-source-heavy teams, legal/compliance and DevSecOps.
Verticals: cloud/SaaS, mobile, desktop, firmware/embedded, libraries/SDKs, containers, AI software, developer tools.

## Brain capability / architecture
Brain may summarize licenses and flag questions; deterministic policy mapping can identify known obligations, but legal conclusions require qualified review. Architecture: component/SBOM graph, license corpus/versioning, text/fingerprint matcher, policy/compatibility engine, usage/distribution metadata, notice generator, CI gate and evidence ledger.

## Agent tree
Inventory Agent; License Identification Agent; Policy Mapping Agent; Compatibility Agent; Notice/Attribution Agent; Change Monitor; Developer Guidance Agent; Legal-Review Router; Audit Agent.

## Deterministic services
SBOM/lock parsing; package/source hashes; license text fingerprints; SPDX-like identifiers; dependency graph; policy rules; obligation templates; notice aggregation; version/change tracking; CI pass/fail by company policy.

## Workflow
Scan exact build/source → resolve components/transitives → identify license/evidence → map usage/distribution context → evaluate organization policy/compatibility → generate obligations/notices → route ambiguity/high-risk to legal review → gate release under approved policy → preserve build-specific compliance evidence → monitor dependency/license changes.

## Integrations / API / data
Git/CI, package registries, SBOM, containers, build systems, dependency risk platform, artifact registry and legal/compliance systems. Data: components, licenses, texts/hashes, dependency paths, policies, decisions, notices and evidence.

## Monetization / distribution
Repos/builds/components, seats, enterprise/private, API, policy/legal-workflow packs and managed inventory. Distribution via Git/CI/DevSecOps/legal-tech ecosystems.

## Security/privacy/compliance
Source/dependency metadata may be confidential. Keep code private, scan minimal metadata/content, tenant isolate, version evidence. Product supports compliance workflow and does not replace legal advice.

## Failure / edge cases
Missing/incorrect package metadata, dual licensing, custom licenses, vendored code, copied snippets, generated code, license changed between versions, dependency path differs by platform, static/dynamic linking ambiguity, SaaS-only vs distributed software distinctions.

## Scale / overlap
Repo scanner → enterprise compliance → component/license intelligence infrastructure. Overlap #080 dependency risk and #053 release. #081 owns license obligations/policy.

## Classification
**DESIGN NOW:** dependency/artifact provenance, license metadata slot, policy/evidence, build identity and legal-review state.  
**BUILD NOW:** Command Center dependency/artifact registry should retain license/source metadata for future portfolio builds.  
**BUILD BEFORE FIRST COMPANY:** license corpus, scanner and policy engine.  
**COMPANY-SPECIFIC LATER:** commercial legal packs/customer repos/UI/pricing.  
**SCALE-ONLY:** large cross-ecosystem license intelligence graph.

# Mandatory 24-part completion block
1. Product Tree: SBOM/repo/container/transitive/identify/policy/copyleft/notices/obligations/change/CI/guidance/review/API.
2. Feature Tree: component/version/source/hash/path/license/confidence/text/obligations/distribution/policy/exceptions/notices/evidence.
3. Customer Tree: software/enterprise/SaaS/device/agency/OSS-heavy/legal/DevSecOps.
4. Vertical Tree: cloud/mobile/desktop/embedded/SDK/container/AI/devtools.
5. Brain Tree: summarization/question flagging; legal conclusions human-qualified.
6. Agent Tree: inventory/identify/policy/compatibility/notices/change/guidance/review/audit.
7. Service Tree: SBOM/lock parsers/hashes/fingerprints/IDs/graphs/rules/templates/aggregation/versioning/CI.
8. Workflow Tree: scan→identify→context→policy→obligations→review→release gate→evidence→monitor.
9. Integration Tree: Git/CI/registries/SBOM/containers/build/dependency/artifact/legal.
10. Data Tree: components/licenses/texts/paths/policies/decisions/notices/evidence.
11. API Tree: scan/components/licenses/policy/notices/evidence.
12. Monetization Tree: repos/builds/components/seats/enterprise/API/managed.
13. Distribution Tree: Git/CI/DevSecOps/legal-tech/OEM.
14. Automation Tree: inventory/mapping/notices automatic; ambiguous legal determinations routed.
15. Moat Tree: license corpus/fingerprints, policy mappings, ecosystem coverage.
16. Platform Tree: scanner→license compliance OS→software rights infrastructure.
17. Risk Tree: false legal conclusion/missed component/private code exposure/stale license.
18. Scale Tree: repo→enterprise→cross-ecosystem graph.
19. Spinoff Tree: notice generator/license-change feed; dependency risk remains separate.
20. Command Center Dependencies: dependency registry, artifacts, build identity, policy, evidence.
21. Design-Now Requirements: license/source/provenance fields in reusable component manifests.
22. Build-Now Requirements: add license metadata hooks to Command Center build/dependency provenance.
23. Safe-to-Defer Requirements: legal corpus/customer scanners/commercial workflow.
24. Autonomous Mature State: inventories/notices/policy checks run continuously; humans review ambiguous licenses and approve legal exceptions.

## Saturation result
Further branches converge into dependency risk, release and legal-review workflow rather than new portfolio companies.