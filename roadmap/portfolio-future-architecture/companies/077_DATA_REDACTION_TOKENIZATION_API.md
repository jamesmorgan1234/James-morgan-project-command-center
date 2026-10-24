# Company 077 — Data Redaction / Tokenization API

**Company ID:** `company:future:077`  
**Primary project:** `project:company:future:077`  
**Roadmap version:** `COMPANY-077-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer content processing or token vault deployment.

## Business identity
Purpose: remove, mask, pseudonymize or tokenize sensitive information before data is stored, shared, analyzed, logged or sent to AI systems.

## Product tree
Text Redaction API; Structured Field Tokenization; Database Proxy/Transformer; Document/PDF Redaction; Image/Screenshot Redaction; Log Redaction; Support/Conversation Redaction; Prompt/Output Privacy Gateway; Test-Data Pseudonymization; Reversible Token Vault; Irreversible Masking; Format-Preserving Transformation; Policy/Field Rules; Regional Policy Packs; Quality Verification; Batch/Streaming; SDK/CLI; Private/Self-Hosted; Enterprise Gateway.

## Feature/customer/vertical tree
Features: detected data class, field/path/region, transform policy, reversible/irreversible mode, token namespace, format-preserving rules, key/vault reference, output hash, coverage/confidence, missed-sensitive-data tests, false-redaction review, retention and audit.
Customers: SaaS, enterprises, AI platforms, support vendors, analytics teams, developers, privacy/security teams and regulated organizations.
Verticals: health admin, finance-adjacent, HR, support, analytics, software logs, ecommerce and AI/RAG workflows.

## Brain capability / architecture
Brain may identify ambiguous sensitive context; transformation should be deterministic once policy/class is known. Architecture: classifier/detector interface, policy engine, transform library, tokenization vault/HSM adapter, namespace/key management, document/image processors, quality evaluator, audit/provenance and regional routing.

## Agent tree
Policy Mapping Agent; Redaction Agent; Tokenization Agent; Document/Image Agent; QA/Coverage Agent; False-Positive Review Agent; Privacy Gateway Agent; Key/Vault Coordinator; Incident Agent.

## Deterministic services
Mask/hash/token functions; format preservation; vault lookup; key/reference isolation; structured path selectors; OCR/image boxes; reversible mapping ACL; batch/stream idempotency; quality tests; secure deletion of temporary plaintext.

## Workflow
Input authorized → detect/classify sensitive fields → select policy/purpose/region → transform/tokenize → verify expected classes removed/protected → emit sanitized artifact + evidence → downstream use → detokenize only for explicitly authorized purpose/actor → audit access → rotate/delete tokens per policy.

## Integrations / API / data
PII discovery, databases, ETL, logs, support, AI gateways, warehouses, test environments, document/image pipelines, vault/KMS. Data: policy metadata, token mappings where reversible, hashes, quality findings and audit; raw plaintext minimized.

## Monetization / distribution
Records/characters/GB, token-vault entries, API calls, connectors, enterprise/private, policy packs and managed privacy gateway. Distribution via privacy/security/data/AI ecosystems.

## Security/privacy/compliance
Token vault is critical infrastructure: strong encryption, split access, key rotation, regional isolation, no logs with plaintext, least privilege and purpose-bound detokenization. Redaction is not proof of anonymization unless evaluated for the use case.

## Failure / edge cases
Missed entity, over-redaction, nested JSON, free text, OCR error, structured IDs embedded in images, token collision, format-preserving weakness, key loss, wrong namespace, reversible token exposed, downstream join requirements, deletion request, regional migration.

## Scale / overlap
API → privacy gateway → data transformation infrastructure. Overlap #76 discovery, #78 retention, #98 sovereignty. #077 owns transformation/protection.

## Classification
**DESIGN NOW:** sensitivity labels, transform policy metadata, secret/key refs, purpose-bound access, reversible/irreversible distinction and provenance.  
**BUILD NOW:** Command Center should have standard redaction/tokenization seams before historical/external data enters Brain/Agency/logs.  
**BUILD BEFORE FIRST COMPANY:** token vault, data transformers and customer gateway.  
**COMPANY-SPECIFIC LATER:** connectors/policy packs/customer billing.  
**SCALE-ONLY:** globally distributed regional token vaults.

# Mandatory 24-part completion block
1. Product Tree: text/structured/DB/docs/images/logs/support/AI/test data/token vault/masking/format preserving/policy/QA/batch/private.
2. Feature Tree: class/path/region/policy/mode/namespace/key ref/hash/coverage/confidence/retention/audit.
3. Customer Tree: SaaS/enterprise/AI/support/analytics/dev/privacy/security/regulated.
4. Vertical Tree: health admin/finance/HR/support/analytics/logs/commerce/AI.
5. Brain Tree: ambiguous detection only; transformation deterministic.
6. Agent Tree: policy/redact/tokenize/doc-image/QA/review/gateway/vault/incident.
7. Service Tree: mask/hash/token/format/vault/key refs/selectors/OCR/idempotency/quality/secure deletion.
8. Workflow Tree: classify→policy→transform→verify→sanitized output→authorized detokenize→audit/rotate/delete.
9. Integration Tree: discovery/DB/ETL/logs/support/AI/warehouse/tests/docs/vault.
10. Data Tree: policies/tokens/hashes/quality/audit with minimal plaintext.
11. API Tree: redact/tokenize/detokenize/verify/policy/audit.
12. Monetization Tree: records/chars/GB/tokens/calls/connectors/enterprise/packs.
13. Distribution Tree: privacy/security/data/AI/OEM.
14. Automation Tree: transform/verify automatic; detokenization tightly authorized.
15. Moat Tree: accuracy, format coverage, policy packs, vault reliability.
16. Platform Tree: redaction API→privacy gateway→data protection infrastructure.
17. Risk Tree: missed PII/over-redaction/token leak/key loss/weak pseudonymization/region violation.
18. Scale Tree: API→enterprise gateway→regional global vaults.
19. Spinoff Tree: token vault/image redaction modules; discovery/retention remain separate.
20. Command Center Dependencies: sensitivity, secrets/KMS refs, privacy, artifacts, provider routing, audit.
21. Design-Now Requirements: standardized redaction/pseudonymization metadata and purpose-bound access.
22. Build-Now Requirements: ensure Command Center ingest/log/context paths can apply deterministic redaction before AI exposure.
23. Safe-to-Defer Requirements: commercial vault/connectors/global regions.
24. Autonomous Mature State: sensitive data is transformed at ingress by policy; humans manage exceptional classifications and privileged detokenization.

## Saturation result
Further branches converge into discovery, retention, sovereignty or privacy-request products already represented.