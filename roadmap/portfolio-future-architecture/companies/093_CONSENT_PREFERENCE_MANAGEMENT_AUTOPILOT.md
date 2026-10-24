# Company 093 — Consent & Preference Management Autopilot

**Company ID:** `company:future:093`  
**Primary project:** `project:company:future:093`  
**Roadmap version:** `COMPANY-093-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer consent capture, communication or downstream data-processing change.

## Business identity
Purpose: maintain provable user/customer consent and communication/data preferences across channels, purposes, systems and jurisdictions, then synchronize those choices to downstream enforcement points.

## Product tree
Consent Ledger; Preference Center; Web/Cookie Consent; Mobile SDK; Email/SMS/Phone/Push Preferences; Marketing/Analytics/Advertising Consent; Data Sharing/Profiling/AI Processing Consent; Personalization/Location/Research Consent; Purpose Registry; Consent Receipt; Withdrawal/Reconsent; Expiration/Refresh; Age/Parental Consent Workflow; Regional Policy Packs; Downstream Sync/Enforcement; Conflict Detector; Audit/Proof; API/SDK/Widgets; Enterprise/Private Deployment; OEM/Embedded Consent Service.

## Feature/customer/vertical tree
Features: subject/account identity, purpose, data category, channel, controller/company, jurisdiction, policy/text version, lawful/consent basis reference, choice, source, timestamp, proof, expiry, withdrawal, parent/guardian relation, downstream processors, sync state and evidence.
Customers: SaaS, ecommerce, apps, marketplaces, media, enterprises, privacy/marketing teams, customer-data platforms and developers.
Verticals: consumer apps, commerce, marketing, analytics, health administrative communications, education/minors, finance-adjacent communications and AI/personalization products.

## Brain capability / architecture
Brain may interpret preference language and detect conflicts; deterministic policy must enforce purpose/channel decisions. Architecture: subject identity, purpose/data taxonomy, versioned consent ledger, policy/jurisdiction packs, preference UI/widget, downstream processor graph, sync/outbox, receipt/proof service, conflict engine and audit.

## Agent tree
Consent Intake Agent; Preference Agent; Policy Mapping Agent; Conflict Agent; Reconsent/Expiry Agent; Downstream Sync Agent; Processor Inventory Agent; Proof/Evidence Agent; Privacy QA Agent.

## Deterministic services
Choice recording; versioned text hash; effective/expiry; withdrawal precedence; channel/purpose checks; parental/guardian relation state; synchronization/retry; processor mapping; signed receipts; audit.

## Workflow tree
Present exact purpose/text/version → capture authenticated/allowed choice → issue receipt → store immutable history/current effective state → propagate to downstream systems → verify sync → runtime processing/communication checks consult current preference → withdrawal immediately supersedes prior grant → reconsent/expiry workflows as policy requires → evidence/reporting.

## Integrations / API / data
Web/mobile apps, CRM/CDP, email/SMS/push, analytics/ad systems, AI/personalization, data warehouses, preference centers and privacy/DSAR systems. Data: subjects, purposes, policies/text versions, choices, receipts, processor mappings and sync state.

## Monetization / distribution
MAU/profiles, consent events, domains/apps, processors/connectors, seats, enterprise/private, API/SDK and policy packs. Distribution through privacy/CDP/marketing/dev ecosystems.

## Security/privacy/compliance
Consent itself is sensitive evidence. No dark patterns, no fabricated consent, withdrawal must propagate, child/parent rules explicit, purpose limitation, data minimization, jurisdiction awareness and immutable proof. Product does not substitute for legal advice.

## Failure / edge cases
Anonymous-to-authenticated merge, shared household, duplicate profiles, offline mobile consent, policy text changed, processor sync failed, consent withdrawn during queued campaign, minors aging into adult status, conflicting account/channel preferences, global vs purpose-specific opt-out.

## Scale / overlap
Preference center → enterprise consent graph → cross-system preference enforcement. Overlap #47 DSAR, #78 retention, #84 deliverability. #093 owns current consent/preference state and proof.

## Classification
**DESIGN NOW:** purpose/action metadata, subject identity, versioned owner/user decisions, effective/expiry/supersession, downstream enforcement and proof.  
**BUILD NOW:** Command Center owner preferences/rules already need explicit scope/version/supersession; future customer data should use the same conceptual pattern without mixing identities.  
**BUILD BEFORE FIRST COMPANY:** customer subject/purpose/processor registry and consent synchronization.  
**COMPANY-SPECIFIC LATER:** widgets/SDK/customer systems/legal packs/pricing.  
**SCALE-ONLY:** massive regional processor graph.

# Mandatory 24-part completion block
1. Product Tree: ledger/preference/web/mobile/channels/marketing/analytics/sharing/AI/location/purpose/receipts/withdraw/reconsent/age/regional/sync/API.
2. Feature Tree: subject/purpose/data/channel/controller/jurisdiction/text version/choice/source/time/proof/expiry/withdraw/processor/sync.
3. Customer Tree: SaaS/commerce/apps/marketplace/media/enterprise/privacy/marketing/CDP/dev.
4. Vertical Tree: consumer/commerce/marketing/analytics/health admin/education/minors/finance comms/AI.
5. Brain Tree: language/conflict analysis; consent enforcement deterministic.
6. Agent Tree: intake/preference/policy/conflict/expiry/sync/processor/evidence/QA.
7. Service Tree: record/text hash/effective/withdraw precedence/channel-purpose checks/guardian/sync/receipts/audit.
8. Workflow Tree: present exact text→capture→receipt→persist→sync→runtime enforce→withdraw/reconsent→evidence.
9. Integration Tree: web/mobile/CRM-CDP/email-SMS-push/ads/analytics/AI/warehouse/privacy.
10. Data Tree: subjects/purposes/policies/choices/receipts/processors/sync.
11. API Tree: choices/effective state/receipts/purposes/processors/sync/audit.
12. Monetization Tree: profiles/events/apps/connectors/seats/enterprise/API/packs.
13. Distribution Tree: privacy/CDP/marketing/dev/OEM.
14. Automation Tree: sync/expiry/conflict automatic; consent capture remains user-originated and policy-valid.
15. Moat Tree: processor integrations, policy packs, proof/reconciliation, conflict handling.
16. Platform Tree: preference center→consent OS→cross-system purpose enforcement.
17. Risk Tree: fabricated consent/dark patterns/stale downstream state/child consent error/privacy leak.
18. Scale Tree: app→enterprise→global processor graph.
19. Spinoff Tree: consent receipts/processor sync modules; DSAR/retention remain separate.
20. Command Center Dependencies: identity, decision/rule ledgers, policy, communications, privacy, event/outbox.
21. Design-Now Requirements: scoped owner/user decisions need purpose/effective/version/supersession/proof semantics.
22. Build-Now Requirements: keep Command Center owner preferences and future customer preferences as separate but structurally compatible ledgers.
23. Safe-to-Defer Requirements: customer widgets/SDK/regional legal packs.
24. Autonomous Mature State: preferences propagate and reconcile continuously; humans/legal teams define purposes/policies while users control their own choices.

## Saturation result
Further branches converge into DSAR, retention, deliverability and privacy governance already represented.