# Company 067 — Prompt-Injection Firewall API

**Company ID:** `company:future:067`  
**Primary project:** `project:company:future:067`  
**Roadmap version:** `COMPANY-067-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer traffic processing or production policy enforcement.

## Business identity
Purpose: detect, segment, score, sanitize or quarantine malicious instructions hidden inside content consumed by AI systems, while preserving useful data and instruction hierarchy.

## Product tree
Text Scan API; Email/Document/Webpage Scanner; PDF/OCR Scanner; Image-Text Scanner; Tool-Output Scanner; Search/RAG Gateway; Knowledge-Base Ingest Gate; Browser-Agent Shield; Email-Agent Shield; Sanitizer/Quarantine; Trusted-Untrusted Segmentation; Instruction-Hierarchy Analyzer; Encoding/Obfuscation Detector; Policy Packs; Threat Intel/Rules Feed; Developer SDK; Reverse Proxy/Sidecar; Enterprise Private Appliance; Red-Team Corpus; Evaluation Suite.

## Feature/customer/vertical tree
Features: source provenance, trusted/untrusted regions, direct/indirect injection, jailbreak patterns, hidden text/markup, encoded payloads, malicious links/attachments, instruction override attempts, tool-manipulation cues, suspicious data exfiltration requests, risk/confidence, sanitization diff, quarantine reason and model/tool context.
Customers: AI SaaS, RAG vendors, agent platforms, enterprises, browser/email agents, search/knowledge platforms, security vendors and developers.
Verticals: enterprise knowledge, support, finance-adjacent, healthcare admin, legal document systems, developer agents, ecommerce, research/search.

## Brain capability / architecture
Use layered deterministic parsing, heuristics/signatures, content provenance, structural analysis and specialized classifiers/models. Brain may classify ambiguous attacks but must never decide authority from the content itself. Architecture: source parser, trust-zone annotator, decoder/normalizer, threat rules, classifier ensemble, sanitizer, quarantine store, evaluation corpus, versioned policy and API gateway.

## Agent tree
Content Intake Agent; Normalization Agent; Injection Classifier; Obfuscation Agent; Trust-Segment Agent; RAG Guard Agent; Tool-Output Guard Agent; Sanitization Agent; Red-Team Agent; Threat-Rule Curator; QA/Evaluation Agent.

## Deterministic services
MIME/HTML/PDF parsing; encoding decode; Unicode normalization; hidden-content detection; trust labels; allow/deny patterns; schema-preserving sanitization; hash/version; rate limits; tenant isolation; signed scan receipt.

## Workflow
Content arrives → classify source/provenance → parse/decode/normalize → segment trusted system instructions from untrusted data → detect injection/obfuscation/tool-manipulation → score → allow with labels / sanitize / quarantine / block → return machine-readable receipt → downstream model/tool gateway must still enforce its own authorization → feedback/evaluation.

## Integrations / API / data
Email, browsers, web fetch/search, RAG pipelines, document ingestion, OCR, knowledge bases, agent frameworks, model gateways, security/SIEM. Data: scan metadata, hashes, findings, sanitized deltas, labels and feedback; minimize retention of customer raw content.

## Monetization / distribution
Per scan/token/document/MB, SDK/device, agent, enterprise/private, threat packs, managed policy feed. Distribution via AI security/developer ecosystems and embedded OEM partnerships.

## Security/privacy/legal
Do not become a data honeypot. Zero/short retention options, regional/private execution, secret/PII redaction, no cross-tenant training without consent, deterministic fail-safe if scanner is unavailable. This reduces risk but cannot guarantee complete attack prevention.

## Failure / edge cases
Novel injection, benign text discussing attacks, multilingual/encoded payloads, OCR errors, steganographic instructions, adversarial images, tool output containing legitimate commands, giant documents, nested archives, model-specific vulnerabilities, false sanitization that changes business meaning.

## Scale / overlap
SDK/API → gateway → security primitive embedded in agent stacks. Overlap #64 business inbox, #66 runtime gateway, #76 PII discovery, #90 moderation. #067 owns data-vs-instruction attack detection.

## Classification
**DESIGN NOW:** trusted/untrusted provenance, content labels that survive transformations, scanner contract before model/tool calls, fail-closed action policy.  
**BUILD NOW:** Command Center must use this concept internally for web/email/files/tool outputs; reverse-map should make it explicit across Brain/Agency.  
**BUILD BEFORE FIRST COMPANY:** scanner pipeline, evaluation corpus, private processing and SDK.  
**COMPANY-SPECIFIC LATER:** commercial API, customer policies, threat feeds.  
**SCALE-ONLY:** global high-throughput threat telemetry.

# Mandatory 24-part completion block
1. Product Tree: text/email/doc/web/PDF/OCR/image/tool/search/RAG/KB/browser/sanitizer/quarantine/SDK/proxy/appliance/evals.
2. Feature Tree: provenance/trust/direct-indirect injection/jailbreak/hidden/encoded/tool manipulation/exfiltration/risk/diff.
3. Customer Tree: AI SaaS/RAG/agents/enterprise/security/search/knowledge/developers.
4. Vertical Tree: enterprise knowledge/support/finance/health admin/legal/dev/commerce/research.
5. Brain Tree: attack classification only; authority never derived from content.
6. Agent Tree: intake/normalize/classify/obfuscation/trust/RAG/tool-output/sanitize/red-team/rule/QA.
7. Service Tree: parsers/decoders/Unicode/hidden detection/trust/schema-safe sanitize/hash/rate limits/receipts.
8. Workflow Tree: ingest→provenance→parse→segment→detect→score→allow/sanitize/quarantine→receipt.
9. Integration Tree: email/browser/web/RAG/docs/OCR/KB/agents/models/SIEM.
10. Data Tree: hashes/findings/labels/sanitization/feedback with minimal raw retention.
11. API Tree: scan/sanitize/quarantine/policy/evaluation/receipt.
12. Monetization Tree: scan/token/doc/MB/agent/enterprise/private/packs.
13. Distribution Tree: AI security/dev/OEM/cloud.
14. Automation Tree: scanning/sanitizing automatic; protected action remains separately authorized.
15. Moat Tree: evaluated attack corpus, multilingual/format coverage, low false-positive rates.
16. Platform Tree: scan API→content firewall→agent-input security layer.
17. Risk Tree: bypass/false positive/privacy leak/semantic corruption/scanner outage.
18. Scale Tree: SDK→enterprise gateway→global embedded service.
19. Spinoff Tree: OCR/image injection pack and threat feed; runtime gateway remains separate.
20. Command Center Dependencies: provenance, untrusted-input invariant, model/tool gateway, privacy, evaluations.
21. Design-Now Requirements: trust labels must persist through ingestion, retrieval, context and tool output.
22. Build-Now Requirements: insert scanner/segmentation seam before Command Center Brain/Agency consumes external content.
23. Safe-to-Defer Requirements: commercial threat feed/customer API/appliance.
24. Autonomous Mature State: content is screened and labeled invisibly; humans inspect novel/high-impact quarantines and tune policies.

## Saturation result
Further branches converge into broader runtime security, DLP/PII or moderation already represented.