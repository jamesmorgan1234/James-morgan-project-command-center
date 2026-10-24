# Company 005 — AI Audit-Trail Infrastructure

**Company ID:** `company:future:005`  
**Primary project:** `project:company:future:005`  
**Roadmap version:** `COMPANY-005-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: create tamper-evident, queryable, privacy-aware evidence of what AI systems saw, decided, generated, approved and changed, sufficient for debugging, compliance, forensics and trustworthy reconstruction without storing unnecessary secrets.

Problem: agentic systems combine prompts, models, retrieval, tools, approvals and side effects across providers. Ordinary app logs rarely preserve enough provenance to answer “what happened, why, under whose authority, using which version, with what evidence?”

Value: standardized evidence chain and timeline reconstruction across models/agents/tools/data/actions.

Delivery: event/evidence API, SDK, append-only ledger service, private/VPC/self-hosted store, audit explorer, compliance/export layer, embedded/OEM components, verification SDK/public certificate endpoints for nonsecret artifacts.

## Product tree

1. AI Event Ledger — immutable/tamper-evident event ingestion and versioned schema.
2. Prompt/Context Provenance — prompt template/version, context-source refs/hashes, redaction metadata.
3. Model/Provider Provenance — model/provider/version/route/parameters/cost/latency identity.
4. Agent/Run Audit — agent identity/version, assignment, delegation, run/task/checkpoint transitions.
5. Tool/Data Access Audit — tool/schema/version, resource scope, read/write intent, result hashes, sensitive-data class.
6. Authorization/Approval Audit — policy version, action/resource, risk, fresh verification, approval/consume/revoke evidence.
7. Side-Effect Evidence — pre/post state refs/hashes, idempotency keys, transaction/result/verification refs.
8. Artifact Provenance — documents/code/media/data/report hashes, generation/edit/approval chain.
9. Timeline Reconstruction — correlation graph from owner instruction through final verified result.
10. Forensic Search — incident/run/agent/resource/artifact/time/policy/model queries.
11. Tamper-Evidence & Signing — chain hashes, signatures, trusted timestamps, external anchoring optional.
12. Retention/Legal Hold — policy-based retention, deletion constraints, evidence preservation.
13. Privacy/Redaction Layer — fields/sensitivity, tokenization, selective disclosure, encrypted payload refs.
14. Compliance Export — evidence packages mapped to frameworks/controls without pretending legal certification.
15. Incident Investigation Workspace — diff, causal chains, timeline, containment evidence.
16. Replay Support — deterministic choice/evidence refs for simulation/debug, never replaying protected effects by default.
17. Audit Analytics — policy violations, recurring failures, source/model/tool/provider patterns.
18. Public/Partner Verification — verify nonsecret artifact certificate/hash/signature.
19. Developer Platform — schema SDKs, event collectors, middleware, tracing adapters, query/export API.
20. OEM/Embedded Ledger — libraries/sidecars for products that need internal audit evidence.

## Feature tree

Correlation/causation IDs; stable event IDs; monotonic/causal ordering; actor/subject/resource/action; project/company/customer scope; model/tool/provider/schema versions; source/provenance refs; risk/authorization; before/after hashes; idempotency; result/verification; sensitivity/redaction; retention/hold; signature/chain; region; storage tier; export; search; dashboards; anomaly/integrity alerts; access reviews; evidence bundles; schema evolution; clock-skew handling; offline buffering; backfill provenance; accessibility/localized explorer.

## Customer tree

AI builders, enterprises, agent platforms, SaaS vendors, security/compliance/audit teams, regulated organizations, legal/eDiscovery/forensics teams (with appropriate controls), model/agent providers, public-sector/research systems, OEM platforms.

## Vertical tree

Finance ops, healthcare admin, legal/compliance, cybersecurity, software deployment, customer support, commerce/procurement, HR/IT, public sector. Each vertical defines evidence retention, prohibited payloads, chain requirements, incident/escalation standards and jurisdiction constraints.

## Brain capability tree

Know schemas, event relationships, policy/version history, retention and redaction rules. Understand incident questions, causal chains and evidence sufficiency. Reason about missing/contradictory events and likely failure path. Plan forensic queries. Detect anomalies/tamper/gaps. Recommend additional instrumentation/retention. Never rewrite evidence. Execute only read/query/export operations within scope; deletion/hold changes are protected. Monitor integrity. Verify chain/signatures/provenance. Escalate gaps, tamper, secret exposure, legal-hold conflict.

## Brain architecture

Core must be deterministic append-only/event-sourced with cryptographic hashes/signatures. Relational/event/object storage for indexes/evidence; graph for causal lineage; search for investigation; anomaly detection for gaps; LLM optional for natural-language investigation summaries and control mapping, grounded in immutable evidence. Raw secrets/large payloads stored only where necessary, encrypted/scoped, preferably referenced by hash/location rather than duplicated.

## Agent tree

- Evidence Schema Agent — proposes schema/coverage changes, no destructive migration.
- Integrity Monitor — gap/hash/signature anomaly.
- Forensic Investigator — scoped timeline reconstruction.
- Privacy Auditor — overcollection/redaction/retention review.
- Compliance Mapping Agent — controls→evidence mapping.
- Incident Evidence Agent — containment/recovery evidence bundle.
- Instrumentation Agent — suggests missing event hooks.
- Retention Review Agent — policy/hold conflicts, no autonomous protected deletion.
- Export Agent — prepares scoped signed bundles.
- Replay Analyst — prepares safe deterministic replays excluding protected effects.

## Deterministic services

Event ingestion; schema registry; hash/signature chain; timestamp/correlation; append-only storage; indexing/search; graph lineage; encrypted object refs; redaction/tokenization; retention/hold engine; integrity verifier; export packager; access control; key-management interface; archival tiering; evidence checksum verification.

## Inputs / outputs / workflows

Inputs: structured events from models/agents/tools/policies/data/workflows/deployments, owner decisions, artifact hashes, verification results.

Outputs: immutable evidence, timelines, integrity status, signed exports, incident reconstruction, control evidence, retention/deletion records.

Event workflow: validate schema/scope → redact/classify → assign event/correlation IDs → hash/sign → append → index/graph → replicate/archive → verify integrity.

Investigation: scope/query → retrieve chain → verify signatures/hashes → identify gaps/conflicts → reconstruct causal path → produce cited summary/evidence bundle.

## Integration tree

Agent/model gateways; observability/OpenTelemetry-like systems; SIEM/SOAR; IAM/policy; Git/CI/deploy; data catalogs/lineage; secret/vault/KMS; object/DB stores; ticketing/incidents; compliance tools; eDiscovery/export; webhook/event buses.

## API/developer ecosystem

Event ingest; batch ingest; schema registry; query/search; lineage; verify; export; retention/hold; integrity status; SDK/middleware/sidecar; trace adapters; CLI; verification library; webhook integrity alerts.

## Data architecture / moat

Append-only event store, immutable schema versions, causal graph, artifact hash registry, policy/authorization refs, integrity proofs, retention/hold metadata. Moat: broad interoperable evidence schema, causal reconstruction accuracy, trusted integrity implementation and adapter ecosystem—not hidden customer data.

## Monetization

Events/retention/storage/query volume; enterprise/private; compliance/export packs; dedicated keys/regions; premium forensic analytics; OEM; managed investigation/support. Storage economics require transparent retention tiers and customer controls.

## Security/privacy/compliance

Audit systems can become sensitive data warehouses. Minimize payload capture; store hashes/refs; field-level classification; encryption; strict tenant/company/project access; immutable append semantics; protected retention/hold/deletion; KMS abstraction; signed exports; access audit; regional residency; secret scanning; legal/compliance specialist review.

## Failure / edge cases

Clock skew, duplicate/offline events, event loss, malicious event injection, compromised signer, schema drift, oversized payload, PII overcollection, missing source, hash collision assumptions, storage outage, partial replication, legal-hold deletion conflict, forged correlation IDs. Use authenticated producers, idempotency, sequence/watermarks, cryptographic integrity, quarantine, replication/checkpoints, integrity scans and explicit unknown/gap states.

## Scale

Micro: millions or fewer events/month.  
~$100K ARR: searchable retention/export.  
~$1M: enterprise private regions/legal holds/integrations.  
~$10M: high-volume multi-region ledgers/forensic ecosystem.  
~$100M+: cross-platform provenance standard with federated verification and enterprise evidence networks.

## Moat / network effects / platform

Evidence schema/adapters, integrity reputation, causal graph tooling, long-term version compatibility and forensic workflows. Network effect from standardized verification across vendors/partners, without sharing private event content. Platform potential as neutral AI/action provenance layer.

## Spinoffs / overlap

Integrates with #4 permissions, #66 runtime security, #79 digital provenance, #94 data lineage, #91 agent identity. Keep Company 005 focused on operational AI/action audit evidence; #79 broader artifact authenticity, #94 enterprise data lineage.

## Classification

**DESIGN NOW:** canonical event/evidence/provenance primitives, correlation IDs, immutable versions/hashes, privacy classification, retention refs.  
**BUILD NOW:** Command Center already needs evidence/checkpoints/security audit; ensure formats are extensible enough for future ledger adapters.  
**BUILD BEFORE FIRST COMPANY:** company partitioning, export/retention interfaces, evidence schema/adapter registry.  
**COMPANY-SPECIFIC LATER:** customer audit service/UI/storage/pricing/integrations.  
**SCALE-ONLY:** global/federated signed evidence infrastructure.

# Mandatory 24-part completion block

1. **Complete Product Tree:** ledger, prompt/model/agent/tool/auth/side-effect/artifact audit, timeline, forensics, signing, retention, privacy, compliance export, incidents, replay, analytics, verification, dev/OEM.
2. **Complete Feature Tree:** IDs/correlation/order/versions/scope/hash/idempotency/result/sensitivity/hold/signature/region/export/search/integrity/schema/offline.
3. **Complete Customer Tree:** AI builders/platforms, enterprise, security/compliance, regulated, forensic/legal/public/research/OEM.
4. **Complete Vertical Tree:** finance, health admin, legal, cyber, software, support, commerce, HR/IT, public.
5. **Complete Brain Capability Tree:** investigate/gap-detect/reconstruct/recommend/verify; never rewrite evidence.
6. **Complete Agent Tree:** schema, integrity, forensics, privacy, compliance, incident, instrumentation, retention, export, replay.
7. **Complete Service Tree:** ingest/schema/hash/sign/storage/index/graph/redaction/retention/integrity/export/access/key/archive.
8. **Complete Workflow Tree:** event append/integrity; investigation; export; retention/hold; incident reconstruction.
9. **Complete Integration Tree:** agents/models/observability/SIEM/IAM/Git/deploy/data lineage/secrets/storage/tickets/compliance/eDiscovery/events.
10. **Complete Data Tree:** events/schemas/causal graph/hashes/policy refs/integrity/retention/holds.
11. **Complete API/Developer Tree:** ingest/query/lineage/verify/export/retention/integrity/SDK/middleware/CLI/adapters.
12. **Complete Monetization Tree:** events, retention/storage/query, enterprise/private, packs/regions/analytics/OEM/support.
13. **Complete Distribution Tree:** developer/observability/security/compliance integrations, SDKs, enterprise partners.
14. **Complete Automation Tree:** integrity, indexing, retention, anomaly, evidence bundles, incident reconstruction assistance.
15. **Complete Moat Tree:** interoperable schema, adapter reach, integrity trust, causal reconstruction/version compatibility.
16. **Complete Platform Tree:** audit store → AI/action evidence platform → cross-vendor provenance verification layer.
17. **Complete Risk Tree:** overcollection, tamper, signer compromise, gaps, schema drift, legal hold, privacy/residency.
18. **Complete Scale Tree:** project ledger → enterprise private → multi-region high-volume → federated verification.
19. **Complete Spinoff Tree:** adjacent #79/#94/#91; specialized adapters/packs remain products.
20. **Command Center Dependencies:** evidence/provenance/checkpoints, security classification, policy/action IDs, company isolation, storage/retention interfaces.
21. **Design-Now Requirements:** universal evidence identity/correlation/version/hash and privacy-safe references.
22. **Build-Now Requirements:** preserve extensible evidence/audit primitives after reverse-map; no customer audit company.
23. **Safe-to-Defer Requirements:** external ledger service, legal-hold UI, enterprise signing/federation, pricing.
24. **Autonomous Mature State:** evidence capture/integrity/retention/forensic indexing operate automatically; investigators receive grounded reconstruction; James handles strategic/legal/protected exceptions.

## Saturation result

Further branches either deepen integrity/storage/investigation modules or align to broader provenance/data-lineage/identity companies already in the portfolio. No new top-level company is warranted.
