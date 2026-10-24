# Company 039 — Digital Asset Licensing Marketplace

**Company ID:** `company:future:039`  
**Primary project:** `project:company:future:039`  
**Roadmap version:** `COMPANY-039-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no marketplace launch, seller onboarding, payment, royalty, public listing or legal commitment.

## Business identity

Purpose: provide a trustworthy marketplace/infrastructure for licensing reusable digital assets with clear provenance, rights, permitted uses, royalties and buyer/seller tooling.

Problem: digital assets are copied, relicensed and remixed without consistent provenance or machine-readable rights; buyers struggle to verify ownership and permitted use.

Value: rights-aware discovery, transaction evidence, licensing metadata and creator/enterprise workflows.

## Product tree

Asset Marketplace; Asset Registry; Seller Studio; Buyer Workspace; License Template/Policy Engine; Provenance/Authenticity Verification; Rights/Ownership Evidence; Royalty/Revenue Split Ledger; Search/Discovery; Bundles/Collections; Subscription Libraries; Enterprise Team Licensing; White-label/OEM Marketplace; API/SDK; Asset Delivery/CDN; Version/Update Rights; Takedown/Dispute Workflow; Fraud/Copy Detection; Usage/Entitlement Verification; Marketplace Analytics; Partner/Affiliate Layer; Private Enterprise Asset Exchange.

Asset classes: graphics/templates, code/components, prompts/workflows, agent packs, datasets, video/audio, 3D/models, educational assets, document templates, localization packs, evaluation packs. Each class needs specific rights/safety checks.

## Feature/customer/vertical tree

Features: seller identity, asset ID/version/hash, source/provenance, ownership evidence, license type, permitted/prohibited uses, commercial/seat/project/territory/duration limits, attribution, derivative rights, AI-training/use flags, exclusivity, pricing, royalties, tax/payment metadata refs, download/entitlement, update history, reporting, dispute/takedown, ratings/reviews, accessibility.

Customers: creators, developers, agencies, businesses, educators, designers, AI/agent builders, enterprises, marketplaces/platforms, OEM/resellers.

Verticals: design, software, AI prompts/agents/evals, data, media/audio/video, education, business templates, localization, gaming/3D. Legal/licensing model differs substantially by asset class.

## Brain / architecture

Brain helps classify assets, detect metadata gaps/possible duplicates, recommend licensing/packaging language and assist discovery. It cannot determine legal ownership conclusively, grant rights the seller lacks, adjudicate disputes or alter payment/royalty terms without authority.

Architecture: asset/provenance registry, object storage/CDN, search/vector/metadata index, entitlement/license policy engine, seller/buyer orgs, billing/payment abstraction, royalty ledger, fraud/hash/similarity service, moderation, audit, dispute workflow, LLM for metadata/search assistance with deterministic rights enforcement.

## Agent tree

Asset Intake Agent, Metadata Agent, Provenance Agent, License Configuration Agent, Similarity/Fraud Agent, Content/Safety Review Agent, Search/Discovery Agent, Bundle/Packaging Agent, Seller Support Agent, Buyer Support Agent, Dispute Intake Agent, Royalty/Reconciliation Agent, Enterprise Licensing Agent, Analytics Agent.

## Deterministic services

Asset registry; hashing/signatures; object delivery; identity/orgs; license/entitlement rules; billing/transaction events; royalty ledger; search/index; download token; usage/quota; moderation queues; dispute/takedown; tax/payment refs; audit/export.

## Workflow

Seller registers → identity/evidence → upload/hash/version → metadata/classification → rights/license configuration → safety/fraud checks → protected publish → buyer discovers → license/price entitlement → protected transaction → delivery token → usage/entitlement evidence → royalty/reconciliation → updates/disputes/takedowns.

## Integrations / API / data

Payment/billing, storage/CDN, developer Git/package ecosystems, design tools, learning platforms, media tooling, provenance/authenticity, tax systems, support/identity. APIs for assets/search/license/entitlement/download/version/provenance/royalty/status.

Data moat: trusted asset/provenance graph, machine-readable license ontology, transaction/entitlement history, similarity fingerprints and curated creator ecosystem. Private enterprise exchanges remain isolated.

## Monetization / distribution

Marketplace commission, seller subscription, buyer library subscription, enterprise seats, asset storage/delivery, premium verification, OEM/white-label, API, promoted placement only if transparent, partner/affiliate commission. No payments activated by roadmap.

## Security/privacy/legal

Copyright/IP ownership, trademarks, privacy/likeness, dataset rights, open-source license conflicts, stolen assets, malware in code/files, explicit content/moderation, tax/payment compliance. Strong takedown/dispute evidence, seller identity, no claim to legal adjudication.

## Failure / edge cases

Stolen asset, multiple claimants, open-source code relicensed improperly, derivative work ambiguity, malicious package, version revoked, buyer downloads after refund, territory conflict, AI-generated ownership uncertainty, chargeback, creator account takeover. Use immutable provenance, entitlement checks, quarantine, takedown and dispute holds.

## Scale/platform/overlap

Niche asset marketplace → multi-asset licensing infrastructure → API/OEM/private enterprise exchanges. Overlap #79 provenance, #81 open-source licensing, #69 billing/#70 entitlements. #039 owns commercial asset exchange/licensing.

## Classification

**DESIGN NOW:** asset/provenance/license/entitlement/version identities, rights metadata, protected publish/financial actions, company/customer isolation.  
**BUILD NOW:** Command Center artifact/provenance/entitlement interfaces after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** billing/entitlement/asset delivery/moderation/dispute abstractions.  
**COMPANY-SPECIFIC LATER:** marketplace/customer/seller product/licensing packs/pricing.  
**SCALE-ONLY:** large creator network/CDN/global tax/rights operations.

# Mandatory 24-part completion block

1. Product Tree: marketplace/registry/seller/buyer/licenses/provenance/rights/royalties/search/bundles/subscriptions/enterprise/OEM/API/delivery/versions/disputes/fraud/entitlements/analytics/partners/private exchange.
2. Feature Tree: identity/asset/version/hash/rights/license restrictions/attribution/derivatives/AI flags/pricing/royalties/entitlement/disputes/reviews.
3. Customer Tree: creators/developers/agencies/businesses/education/design/AI builders/enterprise/platforms/resellers.
4. Vertical Tree: design/code/AI/data/media/education/templates/localization/gaming-3D.
5. Brain Tree: metadata/discovery/similarity/licensing assistance; ownership/legal decisions gated.
6. Agent Tree: intake/metadata/provenance/license/fraud/safety/search/packaging/support/dispute/royalty/enterprise/analytics.
7. Service Tree: asset/hash/storage/identity/license/entitlement/billing/royalty/search/download/moderation/dispute/audit.
8. Workflow Tree: register→verify→upload→rights→checks→publish→license→transact→deliver→reconcile→update/dispute.
9. Integration Tree: payment/storage/Git/design/learning/media/provenance/tax/support/IAM.
10. Data Tree: assets/versions/provenance/licenses/owners/transactions/entitlements/downloads/royalties/disputes.
11. API Tree: asset/search/license/entitlement/download/version/provenance/royalty/status.
12. Monetization Tree: commission/subscriptions/seats/storage/delivery/verification/OEM/API/affiliate.
13. Distribution Tree: creator/developer/design/AI/education ecosystems, integrations, OEM/private exchanges.
14. Automation Tree: metadata/checks/search/entitlement/delivery/reconciliation; publish/pay/disputes protected.
15. Moat Tree: provenance graph, license ontology, creator trust, entitlement history, similarity fingerprints.
16. Platform Tree: marketplace→licensing infrastructure→cross-platform rights/entitlement network.
17. Risk Tree: IP theft, malicious assets, ownership ambiguity, payment/tax, moderation, account takeover.
18. Scale Tree: niche→multi-asset→enterprise/OEM→global ecosystem.
19. Spinoff Tree: adjacent #79/#81/#69/#70 already cover provenance/license compliance/billing/entitlements.
20. Command Center Dependencies: asset registry, provenance, identity, billing/entitlements, policy/security, moderation, company isolation.
21. Design-Now Requirements: immutable asset/version/provenance/rights/entitlement contracts.
22. Build-Now Requirements: generic artifact/provenance and entitlement seams after reverse-map.
23. Safe-to-Defer Requirements: marketplace/customer accounts/payments/CDN/pricing/creator network.
24. Autonomous Mature State: catalog/provenance/search/entitlements/delivery/reconciliation operate automatically; humans handle rights disputes, protected publishing/financial and policy decisions.

## Saturation result

Additional branches are asset-class packs or existing provenance/licensing/billing/entitlement companies; no new top-level company is needed.
