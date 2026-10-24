# Company 028 — AI Knowledge-Base Maintainer

**Company ID:** `company:future:028`  
**Primary project:** `project:company:future:028`  
**Roadmap version:** `COMPANY-028-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer content publishing.

## Business identity

Purpose: keep internal/customer knowledge bases current, noncontradictory, source-linked and useful as products/systems change.

Problem: docs become stale, duplicated and inconsistent; ownership is unclear; AI assistants amplify obsolete answers.

Value: continuous source synchronization, contradiction/staleness detection, gap discovery, draft updates, review workflows and knowledge quality analytics.

## Product tree

Source Sync; Knowledge Inventory; Staleness Detector; Contradiction Detector; Missing-Topic/FAQ Gap Analyzer; Duplicate/Overlap Resolver; Draft Update Generator; Documentation/FAQ Generator; Provenance/Citation Manager; Version/Release Alignment; Permissions/Visibility Auditor; Review/Approval Workflow; Knowledge Analytics; Search/RAG Quality Monitor; Employee KB Pack; Customer Help Center Pack; Developer Docs Pack; Policy/Procedure Pack; API/OEM.

## Feature/customer/vertical tree

Features: source-of-truth ranking, owners, effective dates, product/version tags, citations, dependency graph, freshness SLA, semantic duplicate/contradiction, broken links, unsupported answers, gap queries, draft diffs, approval, publishing status, access control, localization, accessibility, analytics/search success.

Customers: SaaS, enterprise internal knowledge, support teams, developer platforms, HR/IT, operations, regulated organizations, agencies, ecommerce/service businesses.

Verticals: product/support docs, developer/API docs, employee SOP, compliance/policy, onboarding/training, customer FAQ, field service, healthcare administrative knowledge. Sensitive domains require stricter source and review gates.

## Brain / architecture

Brain understands document/source hierarchy, semantic relationships, version context and user question patterns. It detects stale/contradictory material, proposes reconciled drafts and identifies gaps; it cannot overwrite canonical source or publish without policy.

Architecture: source connectors, content graph, search/vector/RAG, relational metadata, document versions/hashes, contradiction/staleness rules, usage/query analytics, LLM drafting/comparison with citations, review workflow.

## Agents

Source Sync Agent, Knowledge Librarian, Staleness Agent, Contradiction Agent, Gap/FAQ Agent, Duplicate Resolver, Drafting Agent, Citation/Provenance Agent, Permissions Agent, Localization Agent, Search Quality Agent, Review Coordinator, Analytics Agent.

## Deterministic services

Connectors; version/hash; source priority; index/search; link checker; freshness scheduler; permission sync; workflow/approval; publish connector gate; analytics; export/backup/retention.

## Workflow

Register sources → ingest/version/classify → assign canonical precedence → index/link → detect stale/conflict/gap → draft proposed change with citations/diff → reviewer approves → publish through protected connector → reindex → monitor search/support outcomes.

## Integrations / API / data

Docs/wiki/help centers, Git repositories, ticketing/support, product release systems, CMS, Slack/Teams authorized content, HRIS/LMS, API specs, storage. APIs for sources/content/issues/drafts/approval/search-quality/provenance.

Data moat: knowledge dependency graph, change/review corpus, gap/query patterns, domain templates, citation reliability; customer knowledge isolated.

## Monetization / distribution

Sources/pages, seats, query volume, connectors, enterprise/private, localization packs, developer-docs pack, API/OEM, managed maintenance. Distribution via docs/CMS/support/developer/enterprise knowledge ecosystems.

## Security/privacy

Permission inheritance, secret scanning/redaction, no cross-space leakage, source-level ACLs, private indexing, no training on customer content by default, audit, retention/delete/export, protected publishing.

## Failure / edge cases

Conflicting official sources, stale-but-still-applicable legacy docs, product version split, private note indexed publicly, prompt injection in source docs, broken permissions, circular references, hallucinated reconciliation. Use source authority, citations, explicit uncertainty and review.

## Scale/overlap

Single KB → multi-source enterprise knowledge → knowledge-governance platform. Overlap #37 policy autopilot, #45 support, #94 lineage; #028 focuses on content knowledge maintenance.

## Classification

**DESIGN NOW:** knowledge provenance/version/permissions, source priority, untrusted content, review/publish gates.  
**BUILD NOW:** Command Center Brain/knowledge layer should preserve these contracts after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** permission-aware source connectors and retention/index boundaries.  
**COMPANY-SPECIFIC LATER:** customer KB product/connectors/UI/pricing.  
**SCALE-ONLY:** massive enterprise graph/global localization.

# Mandatory 24-part completion block

1. Product Tree: sync/inventory/stale/contradiction/gaps/dedup/drafts/docs/provenance/version/permissions/review/analytics/RAG/employee/customer/dev/policy/API.
2. Feature Tree: source rank/owners/dates/version/citations/dependencies/freshness/semantic conflicts/links/gaps/diffs/approvals/access/localization/analytics.
3. Customer Tree: SaaS/enterprise/support/dev/HR/IT/ops/regulated/agencies/commerce/services.
4. Vertical Tree: product/support/dev/SOP/compliance/onboarding/FAQ/field/health admin.
5. Brain Tree: semantic/source/version reasoning, cited drafts; no silent canonical rewrite/publish.
6. Agent Tree: sync/librarian/stale/conflict/gap/dedupe/draft/citation/permissions/localization/search/review/analytics.
7. Service Tree: connectors/version/source priority/search/link/freshness/permissions/workflow/publish gate/analytics/export.
8. Workflow Tree: ingest→rank→index→detect→draft→review→publish→reindex→measure.
9. Integration Tree: docs/wiki/help/Git/support/release/CMS/comms/HR/LMS/API specs/storage.
10. Data Tree: sources/content/versions/links/issues/drafts/approvals/query analytics/provenance.
11. API Tree: sources/content/issues/drafts/approval/search-quality/provenance.
12. Monetization Tree: pages/sources/seats/queries/connectors/enterprise/private/packs/API/OEM/managed.
13. Distribution Tree: docs/CMS/support/developer/knowledge ecosystems.
14. Automation Tree: sync/staleness/conflict/gaps/drafts/reindex; publishing gated.
15. Moat Tree: dependency graph, correction corpus, gap/query patterns, domain templates.
16. Platform Tree: KB maintenance→knowledge governance→enterprise knowledge intelligence.
17. Risk Tree: permission leakage, source conflict, prompt injection, hallucinated edits, overpublication.
18. Scale Tree: one KB→multi-source enterprise→global knowledge platform.
19. Spinoff Tree: adjacent #37/#45/#94 already cover policy/support/lineage.
20. Command Center Dependencies: Brain knowledge, provenance/search, policy/security, connectors, company isolation.
21. Design-Now: versioned permission-aware knowledge/provenance contract.
22. Build-Now: strengthen Command Center Brain source/provenance interfaces after reverse-map.
23. Safe-to-Defer: external KB product/connectors/pricing/localization service.
24. Autonomous Mature State: sync/quality/gap/draft generation runs continuously; reviewers approve material changes; James sees strategic knowledge decisions only.

## Saturation result

Further branches resolve into documentation packs or policy/support/lineage companies already present.
