# Company 013 — Competitive Intelligence Subscription

**Company ID:** `company:future:013`  
**Primary project:** `project:company:future:013`  
**Roadmap version:** `COMPANY-013-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no live competitor outreach, deceptive access or restricted-data acquisition.

## Business identity

Purpose: continuously organize lawful public/licensed competitor signals into source-backed alerts, battlecards, timelines, strategy summaries and market intelligence.

Problem: competitor information is scattered across sites, docs, pricing pages, public hiring, releases, reviews, partnerships and filings; teams miss changes and overreact to anecdotes.

Value: normalized historical intelligence with provenance, change context and confidence.

Delivery: subscription dashboard/newsletter/alerts, analyst reports, API/feed, executive brief, sales battlecards, enterprise private watchlists, OEM/embed.

## Product tree

- Competitor Registry & Profiles.
- Pricing/Product/Packaging Monitor.
- Website/Documentation/Changelog Monitor.
- Public Hiring & Organization-Signal Monitor.
- Partnership/Ecosystem Tracker.
- Review/Sentiment Intelligence.
- Marketing/Positioning/Message Archive.
- Public Filing/Announcement Tracker.
- Release/Feature Timeline.
- Battlecard Generator.
- Executive Strategy Briefs.
- Market Landscape / Category Map.
- Win/Loss Signal Import and Analysis from customer-authorized data.
- Historical Competitor Archive.
- Alert/Watchlist Rules.
- CI API/Feed/OEM.
- Industry Packs / Analyst Workspaces.

## Feature/customer/vertical trees

Features: entity/brand matching, source provenance, snapshots/diffs, taxonomy, timeline, alerts, confidence, sentiment/topic classification, price normalization, comparison matrices, saved watchlists, notes/evidence, team collaboration, permissions, export/API, historical replay, accessible/localized output.

Customers: founders/executives, product/strategy, sales/revops, marketing, research/analyst teams, agencies/consultants, investors where terms permit, enterprise business units.

Verticals: SaaS, ecommerce/retail, consumer products, developer tools, cybersecurity, fintech-adjacent public-market signals, healthcare technology, logistics, marketplaces, media, professional services. Source/legal constraints differ by vertical/jurisdiction.

## Brain capability tree / architecture

Brain understands entities, products, messaging, chronology, source reliability and strategic hypotheses. It compares changes, detects patterns, proposes implications and battlecard updates, but labels inference separately from verified fact.

Architecture: source registry, website/change collectors, public APIs/feeds, document extraction, search/RAG over snapshots, entity graph, temporal store, classification/sentiment/topic models, LLM for synthesis with citations, rules for alerts and provenance.

## Agent tree

Source Monitor, Entity Resolver, Product/Pricing Analyst, Messaging Analyst, Hiring/Org Signal Analyst, Review Analyst, Partnership Analyst, Filing/Announcement Analyst, Battlecard Agent, Strategy Synthesizer, Source QA/Fact Checker, Alert Curator, Archive/Timeline Agent, Compliance/Source-Terms Agent.

## Deterministic services

Collectors/crawlers where authorized; robots/terms controls; snapshot/diff; document parser; entity resolver; price/unit normalizer; source hash/provenance; search/index; alert engine; timeline DB; feed/API; dedupe; retention.

## Workflow

Register competitor → register lawful sources → collect/snapshot → diff → classify/extract → provenance/quality → link entity/product/topic → compare history → alert/summarize → human/customer use → archive correction.

## Integrations / API / data

Websites/docs/changelogs/RSS/public APIs/filings/review platforms/job/public partnership data, CRM win/loss, sales enablement, Slack/email alerts, BI/data warehouse. APIs for entities, observations, changes, timelines, comparisons, alerts, evidence.

Data moat: long historical snapshots, entity/product graph, normalized pricing/packaging, source reliability, taxonomy and analyst corrections. No credentialed/private competitor access.

## Monetization / distribution

Watchlist/competitor count, seats, vertical pack, historical depth, API/feed, executive reports, enterprise, OEM. Distribution through product/strategy/sales communities, integrations, consultants, analyst content and developer APIs.

## Security/legal/privacy

Respect source terms, robots/legal boundaries, no impersonation/pretexting, no bypass of access controls, no stolen/confidential data. Public employee/hiring signals handled conservatively; customer win/loss data isolated. Fact vs inference labels mandatory.

## Failure / edge cases

Website redesign mistaken for strategy, stale pricing, geo/personalized pages, A/B tests, duplicate brands, acquisition/rename, bot blocks, poisoned reviews, misleading job postings, incomplete filings. Preserve screenshots/source/time and confidence; avoid unsupported conclusions.

## Scale / platform / overlap

Micro: narrow watchlists. ~$100K ARR: vertical CI subscriptions. ~$1M: enterprise/private workspaces/API. ~$10M: broad category archive/partner ecosystem. ~$100M+: intelligence data platform if source rights/economics support.

Overlap #14 website changes, #6 data subscriptions, #7 pricing, #25 niche research. #013 remains competitor/entity strategy intelligence.

## Classification

**DESIGN NOW:** source/provenance/fact-vs-inference, company isolation, temporal entity graph, untrusted-content handling.  
**BUILD NOW:** generic provenance/search/source contracts after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** source registry, isolation, alert/notification abstraction.  
**COMPANY-SPECIFIC LATER:** competitor sources/watchlists/customer product.  
**SCALE-ONLY:** broad global historical archive and analyst ecosystem.

# Mandatory 24-part completion block

1. **Product Tree:** registry, pricing/product, website/docs, hiring, partnerships, reviews, messaging, filings, releases, battlecards, briefs, landscape, win/loss, archive, alerts, API/packs.
2. **Feature Tree:** entity matching, snapshots/diffs, provenance, taxonomy, timeline, confidence, sentiment, comparison, watchlists, collaboration, export/API.
3. **Customer Tree:** exec/product/strategy/sales/marketing/research/agencies/consultants/investor/enterprise.
4. **Vertical Tree:** SaaS, commerce, consumer, dev tools, cyber, fintech-adjacent, health tech, logistics, marketplace, media/services.
5. **Brain Capability Tree:** compare/synthesize/predict implications with explicit fact-vs-inference and source confidence.
6. **Agent Tree:** monitors/resolvers/pricing/product/messaging/hiring/reviews/partnerships/filings/battlecard/strategy/QA/alerts/archive/compliance.
7. **Service Tree:** collectors, diff, parsers, entity/price normalization, provenance, search, alerts, timeline, API, dedupe.
8. **Workflow Tree:** register→collect→diff→classify→verify→link→compare→alert/summarize→archive.
9. **Integration Tree:** sites/docs/RSS/APIs/filings/reviews/jobs/CRM/sales enablement/alerts/warehouse.
10. **Data Tree:** entities/products/sources/snapshots/changes/timelines/taxonomy/comparisons/alerts/customer notes.
11. **API/Developer Tree:** entity/observation/change/timeline/comparison/alert/evidence feeds.
12. **Monetization Tree:** competitors/seats/packs/history/API/feed/reports/enterprise/OEM.
13. **Distribution Tree:** strategy/product/sales ecosystems, integrations, consultants, analyst content/API.
14. **Automation Tree:** collection, diff, classification, alerting, evidence-linked summaries; novel interpretations reviewable.
15. **Moat Tree:** historical archive, entity/product graph, normalized pricing, taxonomy/source reliability.
16. **Platform Tree:** watchlists → CI workspace → market intelligence archive/API.
17. **Risk Tree:** unlawful collection, false inference, personalized/stale pages, source manipulation, confidentiality.
18. **Scale Tree:** narrow vertical → enterprise → broad category/global archive.
19. **Spinoff Tree:** existing #14/#6/#7/#25 absorb adjacent businesses.
20. **Command Center Dependencies:** source/provenance, search/knowledge graph, notifications, isolation, Brain/evaluation.
21. **Design-Now Requirements:** fact/inference/provenance and untrusted-source boundaries.
22. **Build-Now Requirements:** shared source/evidence/search seams after reverse-map.
23. **Safe-to-Defer Requirements:** actual competitor data/product/pricing/customer UI.
24. **Autonomous Mature State:** monitors/alerts/history update continuously; Brain produces cited insights; James handles strategy/high-impact interpretation.

## Saturation result

Additional competitor signals fit existing product modules or neighboring website/pricing/research companies; no new top-level company appears.
