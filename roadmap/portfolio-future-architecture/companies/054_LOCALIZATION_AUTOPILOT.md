# Company 054 — Localization Autopilot

**Company ID:** `company:future:054`  
**Primary project:** `project:company:future:054`  
**Roadmap version:** `COMPANY-054-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no external publishing or customer content changes.

## Business identity

Purpose: continuously localize software, websites, documentation, catalogs, support content, subtitles and speech while preserving terminology, product meaning, formatting and locale quality.

Problem: localization becomes fragmented across files, translators, repositories and product teams; strings drift, terminology conflicts and releases ship with missing or culturally inappropriate content.

Value: synchronized localization pipelines, translation memory, terminology governance, automated QA, source-change detection and human review only where confidence/risk requires it.

## Complete product tree

Translation Management System; Continuous Localization Pipeline; Translation Memory; Terminology/Glossary Registry; Locale Style Guides; UI/String Localization; Website/CMS Localization; Docs/Knowledge Localization; Product Catalog Localization; Support Content Localization; Subtitle/Caption Localization; Speech/Dubbing Orchestration; Image/Text-in-Image Localization; Marketing Adaptation; Locale QA; Pseudolocalization; Developer CLI/SDK/API; Git/CI Integration; Vendor/Translator Portal; White-Label/OEM; Enterprise/Private Deployment; Industry/Brand Packs.

## Feature/customer/vertical tree

Features: source/target locale, string keys, context/screenshots, placeholders, plural/gender rules, ICU formats, HTML/markdown preservation, terminology, forbidden terms, brand voice, legal strings, translation memory, fuzzy matches, confidence, human review, locale completeness, visual overflow, RTL, date/number/currency formats, accessibility, release synchronization and rollback.

Customers: SaaS, ecommerce, marketplaces, mobile apps, game/software publishers, documentation teams, support organizations, agencies, enterprises, content/media platforms and developer-tool vendors.

Verticals: software, ecommerce/catalog, gaming, media/subtitles, education, travel/hospitality, healthcare administrative interfaces, fintech UI, legal/compliance documentation, customer support. Regulated/legal strings require specialist review.

## Brain capability tree / architecture

Brain may translate/adapt, reason about terminology/context/tone and identify ambiguity. Deterministic validators own placeholders, formats, locale completeness, prohibited mutations and source/target version alignment. Brain cannot silently reinterpret legal/regulatory text or publish without the project's release policy.

Architecture: source-content registry, locale/version graph, translation memory, terminology ontology, provider/model router, deterministic format validators, visual-layout QA, human review queue, provenance, release synchronization and rollback.

## Agent tree

Source Sync Agent; Translation Agent; Terminology Agent; Context/Brand Agent; Locale QA Agent; Visual Layout Agent; Subtitle/Timing Agent; Speech/Dubbing Coordinator; Human Review Router; Release Sync Agent; Regression Agent; Analytics Agent.

## Deterministic services

String extraction; key/version registry; placeholder/ICU validation; file format parsers; locale fallback; completeness calculation; terminology enforcement; RTL/pseudolocalization checks; source-diff detection; translation-memory retrieval; content hashing; release gates.

## Workflow tree

Source change → extract/version content → classify risk/context → retrieve memory/terminology → translate/adapt → deterministic format/placeholder/terminology QA → visual/locale QA → route low-confidence/high-risk text to review → approve → package exact locale version → release under protected publishing/deployment policy → monitor issues → correct with lineage preserved.

## Integrations / API / data

Git/CI, CMS, app stores/build systems, ecommerce catalogs, documentation platforms, support/KB, design tools, subtitle/video systems, speech providers, translation vendors. APIs for sources, strings, locales, translations, memory, terminology, QA and release packages.

Data: content units, source/target versions, locales, memory segments, terminology, approvals, QA findings, provider/model provenance and release identity. Customer content stays isolated.

## Monetization / distribution

Words/characters/strings, locales, projects/repos, seats, provider usage, enterprise/private, API/OEM, premium QA/voice/video packs, managed localization. Distribution through developer/CMS/ecommerce/support ecosystems and localization agencies.

## Security/privacy/compliance

Private source content may contain secrets or PII. Pre-translation redaction/classification, provider privacy routing, tenant isolation, restricted legal strings, retention controls and audit. Accessibility and locale-specific legal requirements must be modeled without pretending the system replaces local counsel.

## Failure / edge cases

Ambiguous source, placeholders corrupted, source key removed, string reused in different context, dialect differences, RTL layout failure, font coverage, plural edge cases, legal wording, brand names, product names, subtitles exceeding timing, speech pronunciation, offensive/culturally inappropriate adaptation, source changes during review. Version pinning prevents stale localization from overwriting newer source.

## Scale / overlap

Single app → multi-product enterprise → embedded continuous localization infrastructure. Overlap #28 knowledge-base maintainer, #45 support, #53 release autopilot, #55 catalog intelligence. #054 owns cross-locale transformation/quality.

## Classification

**DESIGN NOW:** content/version/provenance contracts, provider privacy routing, artifact localization lineage, release identity and locale metadata.  
**BUILD NOW:** Command Center Brain/Artifact/Deployment abstractions should remain locale-aware and provider-neutral.  
**BUILD BEFORE FIRST COMPANY:** translation memory/terminology registries, locale QA, source sync and isolation.  
**COMPANY-SPECIFIC LATER:** customer connectors, translation providers, UI, industry packs and pricing.  
**SCALE-ONLY:** global vendor network, large-scale speech/video localization and cross-product terminology graphs.

# Mandatory 24-part completion block

1. Product Tree: TMS/pipeline/memory/terminology/style/UI/web/docs/catalog/support/subtitle/speech/image/marketing/QA/pseudo/API/vendor/enterprise.
2. Feature Tree: locales/keys/context/placeholders/plurals/formats/terminology/voice/memory/confidence/review/RTL/accessibility/release.
3. Customer Tree: SaaS/ecommerce/marketplace/apps/games/docs/support/agencies/enterprise/media/devtools.
4. Vertical Tree: software/catalog/gaming/media/education/travel/health admin/fintech UI/legal docs/support.
5. Brain Tree: translation/adaptation/context reasoning; high-risk legal/publishing decisions gated.
6. Agent Tree: sync/translation/terminology/brand/locale QA/layout/subtitle/speech/review/release/regression.
7. Service Tree: extract/registry/validators/parsers/fallback/completeness/terminology/RTL/memory/hash/release gates.
8. Workflow Tree: change→extract→memory→translate→validate→review→package→release→monitor/correct.
9. Integration Tree: Git/CI/CMS/app/ecommerce/docs/support/design/video/speech/vendors.
10. Data Tree: content units/versions/locales/memory/terms/approvals/QA/provider provenance/releases.
11. API Tree: sources/strings/locales/translations/memory/terminology/QA/packages.
12. Monetization Tree: words/strings/locales/projects/seats/provider/API/enterprise/managed/packs.
13. Distribution Tree: developer/CMS/ecommerce/support/localization agencies/OEM.
14. Automation Tree: sync/translation/QA/package automated; ambiguous/high-risk/publish gated.
15. Moat Tree: translation memory, domain terminology, evaluated locale QA, connector breadth.
16. Platform Tree: localization tool→continuous localization OS→embedded multilingual content infrastructure.
17. Risk Tree: mistranslation/legal drift/secret exposure/layout break/stale overwrite/cultural harm.
18. Scale Tree: one app→portfolio→global enterprise platform.
19. Spinoff Tree: speech dubbing/visual localization may become modules; release/catalog/support stay adjacent companies.
20. Command Center Dependencies: artifact/version registry, provider routing, privacy, release controls, evaluations, memory.
21. Design-Now Requirements: content/locale/version/provenance and provider-routing metadata.
22. Build-Now Requirements: ensure Command Center artifacts/UI/Brain can represent locale and translation lineage without redesign.
23. Safe-to-Defer Requirements: customer locale packs/connectors/providers/UI/pricing.
24. Autonomous Mature State: low-risk content continuously localizes and validates; humans handle ambiguity, brand/legal nuance and final protected publishing decisions.

## Saturation result

Further branches converge into catalog, support, release or media-specific localization modules rather than new top-level companies.