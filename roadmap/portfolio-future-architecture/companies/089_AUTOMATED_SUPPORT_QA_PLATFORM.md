# Company 089 — Automated Support-QA Platform

**Company ID:** `company:future:089`  
**Primary project:** `project:company:future:089`  
**Roadmap version:** `COMPANY-089-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no employee discipline, customer contact or production support action.

## Business identity
Purpose: evaluate human and AI customer-support interactions for correctness, policy, security, privacy, tone, resolution quality and operational outcomes at near-complete coverage.

## Product tree
Conversation Ingest; Rubric/Policy Builder; Correctness Evaluator; Policy/Compliance QA; Security/Privacy QA; Tone/Empathy QA; Resolution/First-Contact QA; Escalation QA; Hallucination/Promise Detection; Sentiment/Customer Effort; Handle-Time/Repeat-Contact Analytics; AI-vs-Human Comparison; Scorecards; Coaching Recommendations; Calibration Workspace; Dispute/Appeal; Workforce Analytics; QA Sampling/Full-Coverage; API/SDK; Enterprise/Private Deployment; Vertical Support Packs.

## Feature/customer/vertical tree
Features: channel, agent/human/model identity, queue/product, customer issue, policies/knowledge versions, actions/promises, citations, escalation, resolution outcome, sentiment, handling time, repeat contact, QA dimensions, confidence, evidence spans, reviewer calibration and appeal.
Customers: support organizations, SaaS, ecommerce, marketplaces, contact centers, BPOs, AI support vendors, enterprises and regulated service providers.
Verticals: software support, ecommerce, telecom-like service, financial/health administrative support, travel/hospitality, marketplaces and technical support.

## Brain capability / architecture
Evaluation may require LLM/judge models but must be grounded in exact knowledge/policy versions, calibrated against human review and separated from employment decisions. Deterministic checks should cover prohibited promises, missing disclosures, authentication steps and measurable metrics. Architecture: interaction store/ref, policy/KB snapshot, rubric registry, evaluator ensemble, deterministic rule checks, calibration set, appeals/review, analytics and provenance.

## Agent tree
Ingest Agent; Policy QA Agent; Correctness Agent; Security/Privacy Agent; Tone Agent; Resolution Agent; Escalation Agent; Hallucination Agent; Calibration Agent; Coaching Agent; Trend Analyst; QA Governance Agent.

## Deterministic services
PII redaction; channel normalization; policy/version binding; keyword/action rules; metric calculation; sampling; confidence thresholds; reviewer assignment; score versioning; appeal/recalculation; access control.

## Workflow
Interaction closes → redact/classify → bind exact policy/KB/rubric version → deterministic checks → model-based evaluated dimensions → confidence/calibration → score/evidence → route uncertain/high-impact cases to human reviewer → publish QA result/coaching → appeal/review if needed → aggregate trends without silently disciplining workers.

## Integrations / API / data
Helpdesk/contact-center systems, chat/email/voice transcripts, CRM, knowledge bases, policy stores, AI support platforms, workforce systems and analytics. Data: interactions, policy snapshots, evaluations, evidence spans, calibrations, appeals and trends.

## Monetization / distribution
Interactions/minutes, agents, channels, seats, enterprise/private, compliance packs, API and managed QA. Distribution via support/contact-center/BPO/AI-support ecosystems.

## Security/privacy/compliance
Support conversations contain sensitive customer data. Redaction, role-based access, retention, human review for employment/high-impact decisions, bias calibration and no secret customer data in model training without consent.

## Failure / edge cases
Wrong policy version, sarcastic language, ambiguous resolution, customer misinformation, multiple agents, transferred ticket, missing transcript segment, voice transcription error, regional policy variation, justified policy exception, customer sentiment not caused by agent, AI judge drift.

## Scale / overlap
Team QA → enterprise full-coverage QA → support-quality infrastructure. Overlap #45 autonomous support and #3 AI QC. #089 owns support-interaction quality.

## Classification
**DESIGN NOW:** evaluator versioning, policy/knowledge snapshot provenance, human calibration, confidence/evidence spans and high-impact decision separation.  
**BUILD NOW:** Command Center Evaluation Factory should already support judge/evaluator calibration and versioned reference truth.  
**BUILD BEFORE FIRST COMPANY:** customer transcript ingest, support rubrics and calibration infrastructure.  
**COMPANY-SPECIFIC LATER:** support connectors/vertical packs/workforce UI.  
**SCALE-ONLY:** massive real-time multimodal support QA.

# Mandatory 24-part completion block
1. Product Tree: ingest/rubrics/correctness/policy/security/tone/resolution/escalation/hallucination/sentiment/analytics/comparison/scorecards/coaching/calibration/API.
2. Feature Tree: channel/agent/issue/policy-KB version/actions/promises/citations/escalation/outcome/sentiment/time/repeat/evidence/calibration.
3. Customer Tree: support/SaaS/ecommerce/marketplace/contact center/BPO/AI support/enterprise/regulated.
4. Vertical Tree: software/commerce/telecom-like/finance admin/health admin/travel/marketplace/technical support.
5. Brain Tree: grounded evaluation; high-impact employment decisions excluded.
6. Agent Tree: ingest/policy/correctness/security/tone/resolution/escalation/hallucination/calibration/coaching/trends/governance.
7. Service Tree: redaction/normalize/version binding/rules/metrics/sampling/thresholds/reviewer/score version/appeal.
8. Workflow Tree: close→redact→bind truth→checks/eval→calibrate→review→score/coaching→appeal/trends.
9. Integration Tree: helpdesk/contact center/chat/email/voice/CRM/KB/policy/AI support/workforce.
10. Data Tree: interactions/policy snapshots/evals/evidence/calibration/appeals/trends.
11. API Tree: interactions/evaluate/scores/evidence/calibration/trends.
12. Monetization Tree: interactions/minutes/agents/channels/seats/enterprise/API/managed.
13. Distribution Tree: support/contact-center/BPO/AI-support/OEM.
14. Automation Tree: QA/coaching/trends automatic; high-impact HR/customer actions separate.
15. Moat Tree: calibrated QA corpus, vertical rubrics, policy-version grounding, multimodal coverage.
16. Platform Tree: QA scorecard→full coverage support QA→customer-service quality infrastructure.
17. Risk Tree: judge bias/wrong policy/privacy/employment harm/false hallucination/transcript error.
18. Scale Tree: team→enterprise→real-time multimodal fleet.
19. Spinoff Tree: coaching/calibration modules; general AI QC and support execution remain separate.
20. Command Center Dependencies: evaluations, policy/KB snapshots, redaction, identity, analytics, provenance.
21. Design-Now Requirements: evaluator outputs must carry model/rubric/reference versions and confidence/evidence.
22. Build-Now Requirements: Evaluation Factory should support independent calibrated judges and appeal/review states.
23. Safe-to-Defer Requirements: customer support connectors/workforce dashboards/commercial rubrics.
24. Autonomous Mature State: every interaction is evaluated and trends/coaching generated; humans calibrate rubrics and adjudicate uncertain/high-impact findings.

## Saturation result
Further branches converge into AI QC, autonomous support and general analytics already represented.