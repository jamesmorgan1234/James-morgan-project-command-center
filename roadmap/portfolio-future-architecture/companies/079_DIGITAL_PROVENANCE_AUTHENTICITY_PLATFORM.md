# Company 079 — Digital Provenance / Authenticity Platform

**Company ID:** `company:future:079`  
**Primary project:** `project:company:future:079`  
**Roadmap version:** `COMPANY-079-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no public certificate issuance, legal attestation or external publication.

## Business identity
Purpose: record and verify who/what created, modified, approved and transformed digital artifacts across documents, media, code, datasets and AI/agent outputs.

## Product tree
Artifact Identity Registry; Hash/Timestamp Service; Creator/Agent/Model Identity Binding; Edit/Transformation History; Approval/Attestation Chain; Chain-of-Custody; Signature/Certificate Service; Tamper Detection; AI-Generation Provenance; Dataset/Model Provenance; Code/Build Provenance; Contract/Record Provenance; Media Authenticity; Public Verification Page/API; Embedded Verification SDK; Evidence Export; Legal-Hold Integration; Enterprise Private Ledger; Cross-Organization Trust Adapter.

## Feature/customer/vertical tree
Features: artifact ID/version/hash, parent/derived refs, creator/owner, agent/model/runtime/version, source inputs, transformation tool/version, timestamp, signature, approval, policy, location/environment, evidence, revocation/supersession and verification result.
Customers: enterprises, media, AI vendors, software teams, legal/compliance, data companies, marketplaces, creators and government/public-sector record systems.
Verticals: media/news, enterprise documents, AI output, software supply chain, research/data, contracts, regulated records and digital assets.

## Brain capability / architecture
Brain may explain lineage and flag suspicious inconsistencies; authenticity must be established through cryptographic hashes/signatures, trusted identity and provenance records—not model opinion. Architecture: immutable append-only provenance graph, artifact store references, signing/KMS adapter, timestamping, identity/trust registry, verification engine, revocation/supersession, public/private proof views.

## Agent tree
Provenance Collector; Artifact Identity Agent; Signature Coordinator; Lineage Agent; Tamper Analyst; AI Provenance Agent; Chain-of-Custody Agent; Verification Agent; Evidence Export Agent; Incident/Revocation Agent.

## Deterministic services
Content hashing; Merkle/graph links; signatures; timestamp verification; certificate validation; lineage traversal; version/supersession; immutable append; proof packaging; privacy-aware disclosure.

## Workflow
Artifact created/imported → compute identity/hash → bind creator/runtime/model/source → append transformation/approval events → sign/timestamp as policy requires → downstream transformation references parent → verification recomputes hashes/signatures/chain → return proof/status → revoke/supersede compromised claims without erasing history.

## Integrations / API / data
Document/media systems, source control/build systems, AI gateways, data catalogs, asset stores, KMS/signing, identity/trust systems, marketplaces and compliance archives. Data: provenance metadata, hashes, signatures, identities and lineage; raw artifact may remain in source storage.

## Monetization / distribution
Artifacts/proofs/verifications/signatures, storage/retention, enterprise/private, API/SDK, public verification, compliance packs. Distribution via AI/media/software/data/legal ecosystems.

## Security/privacy/compliance
Do not expose private lineage publicly by default; proof disclosures scoped, signing keys protected, revocation supported, timestamps/identities trustworthy, no claim that provenance proves truth of artifact content—only origin/chain assertions.

## Failure / edge cases
Hash canonicalization, mutable formats/metadata, key compromise, copied artifact without provenance, offline creation, missing ancestor, clock issues, identity compromise, model alias drift, partial chain across companies, redacted source, proprietary input that cannot be disclosed.

## Scale / overlap
Artifact signing → enterprise provenance graph → cross-organization authenticity infrastructure. Overlap #5 AI audit, #94 data lineage, #91 agent identity. #079 owns artifact authenticity/chain-of-custody.

## Classification
**DESIGN NOW:** stable artifact IDs/hashes, immutable lineage, creator/agent/model/runtime refs, supersession/revocation and evidence disclosure boundaries.  
**BUILD NOW:** Command Center already depends on artifact hashes/evidence; reverse-map says provenance should be unified rather than per-module.  
**BUILD BEFORE FIRST COMPANY:** signing/trust/public proof layers.  
**COMPANY-SPECIFIC LATER:** public verification/commercial certificate products.  
**SCALE-ONLY:** federated global provenance network.

# Mandatory 24-part completion block
1. Product Tree: registry/hash/timestamp/identity/edit/approval/custody/sign/tamper/AI/data/code/contracts/media/public verify/SDK/evidence/private ledger.
2. Feature Tree: artifact/version/hash/parents/creator/agent/model/source/tool/time/signature/approval/policy/env/revocation/status.
3. Customer Tree: enterprise/media/AI/software/legal/data/marketplace/creators/public sector.
4. Vertical Tree: media/docs/AI/software/research/contracts/regulated records/digital assets.
5. Brain Tree: lineage explanation/anomaly flagging; proof cryptographic/deterministic.
6. Agent Tree: collector/identity/signature/lineage/tamper/AI provenance/custody/verify/export/revoke.
7. Service Tree: hashing/graph/signatures/timestamps/cert validation/lineage/version/append/proof/disclosure.
8. Workflow Tree: create→hash/bind→append→sign→derive→verify→prove→revoke/supersede.
9. Integration Tree: docs/media/Git/build/AI/data catalogs/storage/KMS/identity/marketplaces/archives.
10. Data Tree: provenance metadata/hashes/signatures/identities/lineage/revocations.
11. API Tree: register/append/sign/verify/lineage/proof/revoke.
12. Monetization Tree: artifacts/proofs/verifications/signatures/retention/enterprise/API.
13. Distribution Tree: AI/media/software/data/legal/OEM.
14. Automation Tree: capture/hash/verify automatic; legal/public attestations governed.
15. Moat Tree: provenance graph, interoperability, trust integrations, verification ubiquity.
16. Platform Tree: provenance service→authenticity network→digital trust infrastructure.
17. Risk Tree: key/identity compromise/privacy leakage/false trust/missing lineage/canonicalization errors.
18. Scale Tree: artifact→enterprise graph→federated network.
19. Spinoff Tree: public verification/signing modules; agent identity/data lineage remain adjacent.
20. Command Center Dependencies: artifact registry, evidence, identity, Brain/Agency model refs, KMS, audit.
21. Design-Now Requirements: one canonical provenance envelope for artifacts, AI outputs, decisions and builds.
22. Build-Now Requirements: unify Command Center artifact/evidence lineage and immutable hashes before further factories depend on them.
23. Safe-to-Defer Requirements: public trust network/signature commercial service.
24. Autonomous Mature State: provenance capture/verification is invisible and automatic; humans manage trust roots, key incidents and public/legal attestations.

## Saturation result
Further branches converge into AI audit, data lineage or agent identity companies already represented.