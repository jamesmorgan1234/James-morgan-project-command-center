# Company 014 — Website Change Intelligence

**Company ID:** `company:future:014`  
**Primary project:** `project:company:future:014`  
**Roadmap version:** `COMPANY-014-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no access-control bypass or unauthorized crawling.

## Business identity

Purpose: detect, archive, classify and explain meaningful changes across public/authorized web properties.

Problem: pricing, products, policies, jobs, documentation, legal pages, inventories and layouts change silently; simple page-diff tools generate noise and lose context.

Value: high-signal change monitoring with visual/text/structured-data history, provenance and alerts.

Delivery: SaaS watchlists, API/webhooks, browser extension, archive/timeline, enterprise private monitors, embedded/OEM change feed.

## Product tree

Text Change Monitor; Visual/Screenshot Diff; DOM/Structured Data Diff; Pricing/Product/Inventory Monitor; Job/Careers Monitor; Policy/Terms/Legal Page Monitor; Documentation/API Docs Monitor; Changelog/Release Monitor; SEO/Metadata/Schema Monitor; Image/Asset Change Monitor; Form/CTA/Flow Monitor; Accessibility-change monitor; Screenshot/Archive Vault; Change Classification/Priority; Alert/Rules Engine; Historical Timeline/Replay; Multi-site Enterprise Console; API/Feed/OEM; Compliance Evidence Pack.

## Feature/customer/vertical tree

Features: scheduled/event fetch, rendering, locale/device viewport, snapshots, text/DOM/image hashes, semantic diff, noise suppression, dynamic-region masks, structured extraction, confidence/severity, source/time/provenance, OCR, visual overlay, compare history, alert routing, API/webhook, retention, legal/source controls, accessibility.

Customers: product/strategy/CI teams, ecommerce/retail, compliance/legal ops, developer relations, security, marketing/SEO, procurement/vendor teams, researchers, regulators/public-interest monitors where lawful.

Verticals: SaaS/docs/pricing, ecommerce/catalog/inventory, regulation/policy, recruiting, security advisories, public-sector pages, marketplaces, healthcare/pharma public info with compliance review, travel/hospitality rates/terms.

## Brain capability tree / architecture

Brain distinguishes meaningful semantic change from boilerplate/noise, categorizes impact, links related changes and explains likely implications while preserving “observed change” vs “inferred meaning.” Deterministic snapshot/diff engine owns evidence.

Architecture: browser/render workers, HTTP fetch, screenshot/image diff, DOM parser, OCR, structured-data parser, temporal store, rules/noise filters, semantic model/LLM for classification/summarization, queue/scheduler, provenance archive.

## Agent tree

Source Monitor, Visual Diff Analyst, Semantic Change Classifier, Pricing/Product Extractor, Policy/Terms Analyst, Documentation/API Change Agent, Noise-Tuning Agent, Alert Curator, Archive Integrity Agent, Compliance/Source-Terms Agent, Integration Agent.

## Deterministic services

Scheduler; fetch/browser workers; robots/terms policy; snapshot/object store; DOM/text/image hash; diff engine; OCR; structured extractor; masks/selectors; dedupe; alert service; retention/archive; API/webhook; health/rate limits.

## Workflow

Register authorized target → configure cadence/view/regions → fetch/render → validate → snapshot/hash → text/DOM/image/structured diff → noise filter → classify/severity → alert with before/after evidence → archive → recalibrate if false positive.

## Integrations / API / data

Browsers, proxy/network abstractions where lawful, storage, email/chat/webhooks, CI/docs platforms, ecommerce/catalog systems, ticketing, BI/data warehouse. APIs for target/snapshot/change/diff/timeline/alert/export.

Data moat: long screenshot/DOM/text histories, change taxonomy, noise masks, rendering reliability and extracted structured timelines.

## Monetization / distribution

URLs/pages, checks, rendering minutes, retention, users, alerts, API, visual history, enterprise/private, OEM/data feed. Distribution through CI/DevRel/SEO/CI/compliance/ecommerce integrations and developer APIs.

## Security/legal/privacy

Public/authorized sources only; respect terms/robots/rate limits; no bypass of login/access controls; secrets/cookies isolated; captured PII minimized; retention/export/deletion; malicious page content treated as data, never instructions to agents.

## Failure / edge cases

A/B tests, personalization, geo/device variants, cookie banners, rotating ads, timestamps, dynamic IDs, bot challenges, CDN outage, page redesign, JS errors, malicious injection. Use deterministic masks, multi-sample confirmation, viewport/locale metadata, confidence, quarantine.

## Scale / platform / overlap

Micro: dozens URLs; ~$100K ARR: thousands pages/vertical packs; ~$1M: enterprise/history/API; ~$10M: large rendering fleet/data feeds; ~$100M+: broad web-change data infrastructure if legal/economic.

Overlap #13 competitive intelligence, #16 regulation, #72 API drift. #014 specializes in web evidence/change mechanics.

## Classification

**DESIGN NOW:** untrusted web-content isolation, browser-worker boundaries, source/provenance/snapshot contracts, resource quotas.  
**BUILD NOW:** Command Center browser/content ingestion should preserve untrusted-input and snapshot evidence seams after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** browser-worker isolation, target/source registry, artifact storage/retention.  
**COMPANY-SPECIFIC LATER:** monitoring fleet/customer UI/extractors/pricing.  
**SCALE-ONLY:** global render infrastructure and huge archive.

# Mandatory 24-part completion block

1. **Product Tree:** text/visual/DOM/structured/pricing/product/inventory/jobs/policy/docs/changelog/SEO/assets/forms/accessibility/archive/classification/alerts/API.
2. **Feature Tree:** fetch/render/snapshot/hash/diff/noise/masks/extract/confidence/evidence/history/alerts/retention/legal controls.
3. **Customer Tree:** CI/product/ecommerce/compliance/devrel/security/SEO/procurement/research/public monitors.
4. **Vertical Tree:** SaaS, commerce, regulation, hiring, security, government, marketplace, health public info, travel.
5. **Brain Capability Tree:** semantic classification/linkage/impact explanation with observation-vs-inference separation.
6. **Agent Tree:** monitor, visual, semantic, pricing, policy, docs, noise, alerts, archive, compliance, integration.
7. **Service Tree:** scheduler/fetch/browser/policy/store/hash/diff/OCR/extract/mask/dedupe/alerts/retention/API.
8. **Workflow Tree:** register→fetch→snapshot→diff→filter→classify→alert→archive.
9. **Integration Tree:** browsers/storage/comms/CI/docs/commerce/tickets/BI.
10. **Data Tree:** targets/snapshots/hashes/diffs/extracts/timelines/alerts/noise configs.
11. **API/Developer Tree:** target/snapshot/change/diff/timeline/alert/export/webhooks.
12. **Monetization Tree:** URLs/checks/render/retention/seats/alerts/API/history/private/OEM.
13. **Distribution Tree:** dev/CI/SEO/CI/compliance/commerce integrations and APIs.
14. **Automation Tree:** capture/diff/classify/alert/archive; ambiguity escalates.
15. **Moat Tree:** history, rendering, noise suppression, change taxonomy, evidence trust.
16. **Platform Tree:** monitoring → change archive/feed → vertical intelligence infrastructure.
17. **Risk Tree:** unauthorized access, dynamic noise, malicious pages, PII capture, bot/rate/legal issues.
18. **Scale Tree:** watchlists → enterprise → large render/archive → global feed.
19. **Spinoff Tree:** adjacent #13/#16/#72 already cover higher-level use cases.
20. **Command Center Dependencies:** browser workers, artifact/provenance, untrusted input, schedulers, quotas, isolation.
21. **Design-Now Requirements:** hostile web-content boundary and immutable snapshot metadata.
22. **Build-Now Requirements:** generic browser/artifact contracts after reverse-map.
23. **Safe-to-Defer Requirements:** actual monitoring infra, extractors, customer portal/pricing.
24. **Autonomous Mature State:** capture/diff/noise filtering/classification/alerts run unattended; James handles source/legal strategy and exceptional false-positive tuning.

## Saturation result

Additional web-monitoring niches are product/vertical packs or feed existing competitor/regulatory/API-drift companies; no new top-level company is needed.
