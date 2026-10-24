# Company 021 — Lead Qualification Infrastructure

**Company ID:** `company:future:021`  
**Primary project:** `project:company:future:021`  
**Roadmap version:** `COMPANY-021-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no outbound messaging, list purchasing, scraping behind access controls or sales contact.

## Business identity

Purpose: verify, enrich, score, route and explain inbound/authorized lead records so companies can distinguish real potential customers from spam, fraud, duplicates and low-fit submissions.

Problem: lead systems mix incomplete identities, bots, duplicate contacts, invalid companies and weak intent signals; sales teams waste time and automation can amplify junk.

Value: trustworthy lead identity/fraud/fit/intent decisions with source provenance and configurable routing.

Delivery: API, batch enrichment, form/webhook gateway, CRM plugin, real-time scoring, private/enterprise deployment, embedded/OEM.

## Product tree

Lead Verification; Email/Phone/Domain Validation; Person/Company Enrichment; Firmographic Fit; Intent Signal Intake; Spam/Bot/Fraud Detection; Duplicate/Entity Resolution; Lead Scoring; Routing/Assignment; Account Matching; ICP/Segment Rules; Batch Cleanup; Real-Time Form Gateway; Conversion Feedback Learning; Lead Source Quality Analytics; Lead Privacy/Consent Metadata; Developer API/SDK; Vertical Packs.

## Feature/customer/vertical tree

Features: identity confidence, source attribution, opt-in/consent flags, company/domain matching, employee/size/industry/location where lawfully sourced, duplicate clusters, bot/device/rate signals, form quality, historical conversion features, configurable scorecards, ML scores, reason codes, routing rules, SLA, quarantine, audit/export, privacy deletion.

Customers: B2B SaaS, agencies, services, marketplaces, ecommerce high-value inquiries, enterprise sales, franchises, recruiting/education inquiry workflows where lawful, CRM/marketing platforms embedding qualification.

Verticals: B2B SaaS, professional/home services, agencies, industrial, logistics, software/dev tools, education inquiries, marketplaces. Regulated credit/insurance/employment decisions require separate compliance and may prohibit certain signals.

## Brain / architecture

Brain understands fit/intent context, source reliability and conversion history, recommends score/routing changes and explains uncertain records. Deterministic validation/fraud/routing rules own real-time gates; ML predicts fit/conversion; LLM only interprets free-form inquiry text with prompt-injection isolation.

## Agents

Identity/Enrichment Agent, Company Resolver, Fit Analyst, Intent Analyst, Spam/Fraud Agent, Duplicate Resolver, Scorecard Optimizer, Routing Agent, Source Quality Agent, Privacy/Consent Agent, Conversion Attribution Agent, Data Quality Agent.

## Deterministic services

Validation APIs; rate/bot controls; entity resolver; enrichment connectors; consent metadata; scoring engine; routing rules; CRM/webhook connectors; quarantine; audit; deletion; attribution feedback.

## Workflow

Lead event → validate source/consent → identity/company resolution → fraud/spam → enrich authorized fields → compute fit/intent → score with reasons/confidence → route/quarantine → downstream team acts → conversion/outcome feedback → recalibrate with fairness/privacy review.

## Integrations / API / data

Forms, CRM, marketing automation, product analytics, webhooks, email verification, public/licensed data providers, customer data warehouse, scheduling, support. API for verify/enrich/score/route/source-quality and batch jobs.

Data moat: entity matching, source-quality history, conversion-calibrated scores, industry ICP templates and fraud patterns; no unauthorized personal-data collection.

## Monetization / distribution

Per record/API, batch, seats, CRM plugin, enterprise/private, premium enrichment, OEM. Distribution through CRM/form/marketing marketplaces, sales ops agencies/integrators, developer APIs.

## Security/privacy/legal

Data minimization, source rights, consent, regional privacy, deletion/export, no protected-class profiling, no prohibited eligibility decisions, untrusted form text isolation, rate/bot abuse prevention.

## Failure / edge cases

Shared domains, consultants using personal emails, stealth startups, VPNs, duplicate aliases, fraudulent enrichment, stale employer data, high-fit low-intent leads, new market cold start. Use confidence/reasons and never discard solely on opaque model score when business risk warrants review.

## Scale / overlap

Small form gateway → enterprise lead decision service → embedded qualification infrastructure. Adjacent #20 cleanup, #57 fraud, #13 intelligence; keep #021 focused on authorized lead qualification.

## Classification

**DESIGN NOW:** untrusted-input, identity/provenance/privacy, model/evidence, routing-policy interfaces.  
**BUILD NOW:** generic intake/security/identity interfaces after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** company/customer-data isolation, consent metadata, connector registry.  
**COMPANY-SPECIFIC LATER:** enrichment providers/models/CRM products.  
**SCALE-ONLY:** broad identity network/benchmarking.

# Mandatory 24-part completion block

1. Product Tree: verify, enrich, fit, intent, spam/fraud, dedupe, scoring, routing, matching, ICP, batch, form gateway, analytics, privacy, API.
2. Feature Tree: identity/source/consent/firmographics/device/form/history/score/reasons/rules/SLA/quarantine/audit/delete.
3. Customer Tree: B2B SaaS/services/agencies/marketplaces/enterprise/franchises/platforms.
4. Vertical Tree: SaaS, services, industrial, logistics, dev tools, education inquiries, marketplaces.
5. Brain Tree: fit/intent/source-quality reasoning and score explanations; prohibited uses constrained.
6. Agent Tree: identity/company/fit/intent/fraud/dedupe/score/routing/source/privacy/attribution/quality.
7. Service Tree: validation, rate/bot, entity, enrichment, consent, scoring, routing, connectors, quarantine, audit/delete.
8. Workflow Tree: ingest→consent→resolve→fraud→enrich→score→route→outcome→recalibrate.
9. Integration Tree: forms/CRM/marketing/analytics/webhooks/data/scheduling/support/providers.
10. Data Tree: leads/entities/sources/consent/enrichment/scores/routes/outcomes/quality.
11. API Tree: verify/enrich/score/route/source/batch.
12. Monetization Tree: record/API/batch/seats/plugins/enterprise/private/OEM.
13. Distribution Tree: CRM/form marketplaces, agencies/integrators, APIs.
14. Automation Tree: validation/enrichment/scoring/routing/quarantine; sensitive decisions reviewable.
15. Moat Tree: entity/source/conversion/fraud/ICP corpus.
16. Platform Tree: lead API→decision gateway→embedded qualification layer.
17. Risk Tree: privacy, bias, bad enrichment, false rejection, prohibited eligibility use, malicious input.
18. Scale Tree: forms→enterprise→embedded infrastructure.
19. Spinoff Tree: adjacent #20/#57; no duplicate new company.
20. Command Center Dependencies: identity/privacy, untrusted-input security, model/eval, connectors, company isolation.
21. Design-Now: provenance/consent/reasoned scoring/routing contracts.
22. Build-Now: shared intake/security/model hooks after reverse-map.
23. Safe-to-Defer: external enrichment/CRM/product/pricing.
24. Autonomous Mature State: inbound leads auto-verify/score/route within privacy/risk policy; humans handle ambiguous/high-value exceptions.

## Saturation result

Further branches become sales/marketing workflows, fraud or cleanup modules already covered elsewhere.
