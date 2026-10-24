# Company 033 — Accessibility Compliance Monitor

**Company ID:** `company:future:033`  
**Primary project:** `project:company:future:033`  
**Roadmap version:** `COMPANY-033-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no claim of legal compliance/certification.

## Business identity

Purpose: continuously detect accessibility defects across web, mobile, documents/PDFs and design systems, preserve regression evidence and guide remediation without pretending automated scans replace expert review.

Problem: accessibility regressions recur after releases; automated tools cover only part of real user barriers; teams lack one history linking issues to components/releases.

Value: continuous automated checks + structured human-review workflow + developer remediation evidence.

## Product tree

Web Scanner; Mobile/App Scanner; PDF/Document Accessibility Analyzer; Design-System Component Auditor; CI/CD Accessibility Gate; Visual/DOM Regression Monitor; Keyboard/Focus Analyzer; Semantic/ARIA Analyzer; Contrast/Typography Analyzer; Form/Error Accessibility; Media Caption/Transcript Checks; Human Review Workspace; Issue/Remediation Tracker; Design/Developer Guidance; Accessibility Statement/Evidence Pack; Multi-Site Portfolio Dashboard; API/SDK/CLI; Enterprise Private Runner; Vertical Packs.

## Feature/customer/vertical tree

Features: rule IDs/version, page/screen/component identity, severity, source location, affected user need, automated/manual status, screenshot/DOM evidence, reproduction, release attribution, duplicate grouping, regression history, exception/waiver review, owner/deadline, verification, issue integrations, accessible reports.

Customers: web/mobile teams, SaaS, ecommerce, government/public sector, education, healthcare-adjacent admin, financial-service software, agencies, enterprises, document-heavy organizations, design-system teams.

Verticals: ecommerce, SaaS, public services, education, healthcare portals, finance portals, media, travel, document-heavy government/legal/admin. Jurisdiction-specific legal obligations require specialist advice; platform focuses on technical evidence.

## Brain / architecture

Brain interprets issue context, groups likely root causes, explains remediation and generates test suggestions; deterministic accessibility rules/browser/mobile/document analyzers provide findings. Human review required for subjective/usability criteria.

Architecture: browser automation, accessibility rule engine, DOM/accessibility tree capture, screenshot/visual diff, document parser/tag-tree analysis, mobile automation adapters, design component registry, CI integration, evidence store, LLM explanation grounded in finding/rule/component context.

## Agent tree

Web Accessibility Agent, Mobile Accessibility Agent, Document/PDF Agent, Keyboard/Focus Agent, Semantic/ARIA Agent, Visual/Contrast Agent, Component/Design-System Agent, Human Review Coordinator, Remediation Agent, Regression Agent, CI Gate Agent, Evidence/Reporting Agent, Localization/RTL Accessibility Agent.

## Deterministic services

Crawler/browser runner; rule engine; accessibility-tree capture; contrast/color calculations; keyboard traversal; document parser; media metadata; issue dedupe; regression/version matcher; CI gate; artifact/evidence storage; ticketing integration; scheduler.

## Workflow

Register authorized target → baseline scan → automated checks → classify/cluster → human-review queue for nonautomatable criteria → remediation issue → developer change → CI/rescan → verify closure → monitor regression → produce evidence/report.

## Integrations / API / data

Git/CI, browser/mobile test farms, issue trackers, design tools/design-system repos, CMS, document stores, deployment platforms. APIs for scan/findings/rules/components/evidence/verification/gates.

Data moat: component-to-issue/remediation corpus, regression history, vertical rule/test packs, developer fix effectiveness. Customer source/content isolated.

## Monetization / distribution

Pages/screens/components/docs, projects, seats, CI runs, private runners, enterprise, vertical/document packs, API/OEM, managed expert-review coordination. Distribution through developer/QA/design/CMS/cloud ecosystems and accessibility partners.

## Security/privacy/legal

Authorized targets only; private-app credentials scoped; no source leakage; captured content may contain PII; retention controls. Product reports technical findings, not legal certification. Human accessibility expertise retained.

## Failure / edge cases

Dynamic content, shadow DOM, custom widgets, canvas, auth flows, localization/RTL, keyboard traps requiring interaction, screen-reader semantics not captured, false positives, PDF reading order, mobile platform differences. Explicit automated-vs-human coverage state required.

## Scale/platform/overlap

Single site → enterprise portfolio/design-system quality platform. Overlap #65 QA-as-a-Service, #53 release autopilot. #033 is specialist accessibility monitoring/evidence.

## Classification

**DESIGN NOW:** accessibility as cross-product quality gate, artifact/evidence and browser/device test interfaces.  
**BUILD NOW:** Command Center UI itself already needs accessibility gates; future testing factory should register accessibility evaluators after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** private target isolation, evaluator/version registry, CI/test-runner abstraction.  
**COMPANY-SPECIFIC LATER:** customer scanner/dashboard/rules packs/pricing.  
**SCALE-ONLY:** global mobile/browser farms and expert-review network.

# Mandatory 24-part completion block

1. Product Tree: web/mobile/docs/design-system/CI/visual/keyboard/semantic/contrast/forms/media/human review/remediation/evidence/portfolio/API/private/packs.
2. Feature Tree: rule/version/screen/component/severity/user need/evidence/repro/release/dedupe/regression/waiver/owner/verification.
3. Customer Tree: web/mobile/SaaS/commerce/public/education/health admin/finance/agencies/enterprise/docs/design systems.
4. Vertical Tree: commerce, SaaS, public, education, health, finance, media, travel, document-heavy sectors.
5. Brain Tree: root-cause/remediation/test explanation; deterministic findings and expert review retained.
6. Agent Tree: web/mobile/doc/keyboard/semantic/visual/component/review/remediation/regression/CI/evidence/localization.
7. Service Tree: runners/rules/tree/contrast/keyboard/docs/media/dedupe/regression/CI/evidence/tickets/scheduler.
8. Workflow Tree: baseline→scan→cluster→human review→remediate→CI/rescan→verify→monitor.
9. Integration Tree: Git/CI/test farms/issues/design/CMS/docs/deploy.
10. Data Tree: targets/rules/findings/components/evidence/reviews/remediations/releases.
11. API Tree: scans/findings/rules/components/evidence/verification/gates.
12. Monetization Tree: pages/screens/components/docs/projects/seats/CI/private/enterprise/packs/API/managed review.
13. Distribution Tree: dev/QA/design/CMS/cloud/accessibility partners.
14. Automation Tree: scans/dedupe/regression/gates/fix suggestions; subjective review human.
15. Moat Tree: remediation corpus, component mapping, regression history, vertical test packs.
16. Platform Tree: scanner→continuous quality gate→enterprise accessibility engineering platform.
17. Risk Tree: false compliance claims, private-content leakage, incomplete automated coverage, false positives.
18. Scale Tree: site→multi-project enterprise→global test infrastructure.
19. Spinoff Tree: #65/#53 cover general QA/release; no duplicate.
20. Command Center Dependencies: testing/evaluation factory, browser/device artifacts, accessibility UI contracts, evidence.
21. Design-Now Requirements: evaluator/version/evidence and human-review states.
22. Build-Now Requirements: accessibility evaluators in Command Center quality gates after reverse-map.
23. Safe-to-Defer Requirements: external customer scanner/mobile farms/pricing/marketplace.
24. Autonomous Mature State: continuous scans/regression/CI gates operate automatically; expert review handles subjective criteria; James sees only portfolio strategy/exceptions.

## Saturation result

Remaining branches fit document/mobile/design-system packs or general QA/release companies already represented.
