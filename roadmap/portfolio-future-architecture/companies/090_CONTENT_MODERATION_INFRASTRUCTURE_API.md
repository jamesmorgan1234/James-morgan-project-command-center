# Company 090 — Content Moderation Infrastructure API

**Company ID:** `company:future:090`  
**Primary project:** `project:company:future:090`  
**Roadmap version:** `COMPANY-090-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no user-content enforcement, account sanction or live platform moderation.

## Business identity
Purpose: provide configurable real-time and batch content-policy classification, routing, human review and appeal infrastructure for platforms handling user-generated text, images, video and audio.

## Product tree
Text Moderation API; Image Moderation; Video Moderation; Audio/Voice Moderation; Live Stream Sampling; URL/Link Scanner; Profile/Username/Metadata Checks; Spam/Scam Detection; Harassment/Abuse; Sexual/Violence/Illegal-Content Taxonomies; Platform Custom Policy Builder; Age/Regional Policy Packs; Confidence/Threshold Engine; Human Review Queue; Appeal Workflow; Case Management; Audit/Transparency Reports; Batch Moderation; SDK/Edge Gateway; Enterprise/Private Deployment; Reviewer Tooling.

## Feature/customer/vertical tree
Features: content ID/version/source, creator/account ref, modality, language/region, policy taxonomy/version, label probabilities, severity, context, confidence, threshold, automated/human decision, reviewer, appeal, evidence, action recommendation and enforcement receipt reference.
Customers: marketplaces, communities, social platforms, games, creator platforms, messaging services, education/community tools and enterprise user-content products.
Verticals vary heavily by audience, age, jurisdiction and product policy. Policies must be platform-owned and versioned.

## Brain capability / architecture
Multimodal ML/LLM/classifiers may assist labeling; deterministic policy maps labels/confidence/context to review/action classes. High-impact/account sanctions need appeal/review controls. Architecture: ingestion, multimodal classifier router, policy taxonomy/version registry, context service, threshold engine, human-review queue, appeal/case ledger, evaluation/calibration and privacy controls.

## Agent tree
Content Classifier; Spam/Scam Agent; Harassment Agent; Safety Taxonomy Agent; Context Agent; Human Review Router; Appeal Agent; Policy QA Agent; Model Calibration Agent; Incident/Abuse Trend Agent; Transparency Reporting Agent.

## Deterministic services
Hash/dedup; media preprocessing; age/region/policy resolution; thresholds; rate limits; review assignment; decision versioning; action recommendation schema; appeal state; retention; audit and model/evaluator versioning.

## Workflow
Content event → validate/source bind → preprocess → run modality classifiers → apply exact platform policy/version + context → auto-allow/review/restrict recommendation according to threshold → human review for required classes → downstream platform enforcement separately authorized → user appeal if offered → re-review → feed calibrated evaluation and transparency metrics.

## Integrations / API / data
Platforms, storage/CDN, identity/account systems, human-review vendors, trust/safety case tools, law-enforcement/legal workflows only where lawfully authorized, analytics and SIEM. Data: content refs/hashes, labels, policies, decisions, reviews, appeals and metrics; minimize retention of harmful/private raw content.

## Monetization / distribution
Requests/items/minutes/GB, reviewer seats, policy packs, enterprise/private, API/SDK and managed moderation operations. Distribution via platform/dev/security ecosystems.

## Security/privacy/compliance
Avoid overcollection, child/minor privacy risks, reviewer exposure, classifier bias and unsupported legal claims. Strong access controls, reviewer safety, audit, regional policy, appeals, transparency and prohibition on abusive censorship tooling beyond customer/platform lawful policy.

## Failure / edge cases
Satire/quotation, reclaimed slurs, educational/news context, multilingual slang, coded language, image-text combinations, live latency, adversarial cropping, false positives, coordinated brigading, appeals, minors, local law conflicts, platform-specific allowed content, model drift.

## Scale / overlap
API → platform trust/safety stack → multimodal moderation infrastructure. Overlap #57 fraud, #67 injection firewall, #89 support QA. #090 owns user-content policy moderation.

## Classification
**DESIGN NOW:** policy/version, confidence/evidence, human review/appeal, model/evaluator version, tenant isolation and action-vs-classification separation.  
**BUILD NOW:** Command Center Evaluation/Policy engines can reuse generic classification→policy→review patterns but must not import customer content.  
**BUILD BEFORE FIRST COMPANY:** multimodal classifiers, policy builder, review/appeal infrastructure.  
**COMPANY-SPECIFIC LATER:** customer policy packs/reviewer operations/pricing.  
**SCALE-ONLY:** global low-latency multimodal moderation and reviewer networks.

# Mandatory 24-part completion block
1. Product Tree: text/image/video/audio/live/link/profile/spam/harassment/safety/custom policy/age-region/confidence/review/appeal/cases/audit/API.
2. Feature Tree: content/source/modality/language/region/policy version/labels/severity/context/confidence/threshold/review/appeal/evidence.
3. Customer Tree: marketplaces/community/social/games/creator/messaging/education/enterprise UGC.
4. Vertical Tree: platform-specific/age/jurisdiction/user-content classes.
5. Brain Tree: multimodal classification/context; policy/enforcement separation deterministic.
6. Agent Tree: classifier/spam/harassment/safety/context/review/appeal/policy QA/calibration/trends/reporting.
7. Service Tree: hash/preprocess/policy resolution/threshold/rate/reviewer/decision/appeal/retention/audit/versioning.
8. Workflow Tree: ingest→classify→policy→auto/review recommendation→human where needed→enforcement ref→appeal→calibrate.
9. Integration Tree: platform/storage/identity/review vendors/case tools/analytics/SIEM.
10. Data Tree: refs/hashes/labels/policies/decisions/reviews/appeals/metrics.
11. API Tree: moderate/batch/policies/review/appeal/evidence/metrics.
12. Monetization Tree: requests/items/minutes/GB/review seats/packs/enterprise/API/managed.
13. Distribution Tree: platform/dev/security/OEM.
14. Automation Tree: classification/routing automatic; high-impact enforcement/review policy-controlled.
15. Moat Tree: calibrated multimodal models, policy tooling, appeal outcomes, language/context coverage.
16. Platform Tree: moderation API→trust/safety stack→content-governance infrastructure.
17. Risk Tree: bias/overmoderation/undermoderation/privacy/reviewer harm/legal mismatch/model drift.
18. Scale Tree: API→platform→global multimodal network.
19. Spinoff Tree: reviewer tooling/appeal service; injection/fraud/support QA stay separate.
20. Command Center Dependencies: policy/evaluations/model routing/privacy/human review/evidence.
21. Design-Now Requirements: generic confidence/review/appeal/evaluator-version model useful beyond moderation.
22. Build-Now Requirements: Evaluation Factory should support human escalation and appeal/re-review rather than one-shot model verdicts.
23. Safe-to-Defer Requirements: customer classifier fleet/reviewer network/policy marketplace.
24. Autonomous Mature State: routine content is classified/routed instantly; humans handle contextual/high-impact cases and policy evolution.

## Saturation result
Further branches converge into fraud, injection security and evaluation systems already represented.