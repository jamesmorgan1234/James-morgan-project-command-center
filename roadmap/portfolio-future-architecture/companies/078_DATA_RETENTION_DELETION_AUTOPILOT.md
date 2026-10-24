# Company 078 — Data Retention & Deletion Autopilot

**Company ID:** `company:future:078`  
**Primary project:** `project:company:future:078`  
**Roadmap version:** `COMPANY-078-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer deletion, retention change, legal-hold release or production data mutation.

## Business identity
Purpose: enforce defined data lifecycles across databases, files, logs, analytics, backups, embeddings, agent memory and third-party systems with legal holds, exceptions and deletion evidence.

## Product tree
Retention Policy Registry; Data Inventory Link; Lifecycle Classifier; Expiry Scheduler; Deletion Orchestrator; Archive/Tiering; Legal Hold; Customer/Account Deletion Workflow; Backup Retention Tracker; Log/Telemetry Retention; Vector/Embedding Deletion; Agent/AI Memory Deletion; Vendor/Subprocessor Deletion; Restore-Window Manager; Exception/Approval Queue; Deletion Verification/Reconciliation; Evidence Certificate; Policy Simulator; API/SDK; Enterprise/Private Deployment; Jurisdiction/Industry Packs.

## Feature/customer/vertical tree
Features: data object/class, owner, subject/account/project/company, source system, purpose, creation/last-use, policy/version, retention period, expiry, hold, exception, backup copy, derived copy, vendor copy, deletion task/result, verification, restore window and evidence.
Customers: enterprises, SaaS, privacy/security/data governance, AI platforms, MSPs and regulated organizations.
Verticals: consumer apps, HR, health admin, finance-adjacent, support, analytics, ecommerce, data/AI systems and enterprise records.

## Brain capability / architecture
Brain may map ambiguous data to retention policy and explain exceptions. Deterministic policy/version and inventory lineage own expiry/deletion eligibility. No AI may release legal holds or delete uncertain data autonomously.

Architecture: data inventory/lineage, policy/version registry, lifecycle scheduler, legal-hold registry, system connector registry, deletion DAG, tombstone/verification records, backup/derived-data tracking, vendor tasks, reconciliation, audit and protected deletion gate.

## Agent tree
Policy Mapping Agent; Data Lifecycle Agent; Expiry Agent; Legal Hold Agent; Deletion Coordinator; Backup Agent; Derived-Data Agent; Vendor Deletion Agent; Reconciliation Agent; Evidence Agent; Privacy/Compliance QA Agent.

## Deterministic services
Retention arithmetic; policy precedence; hold checks; immutable tombstones; deletion idempotency; dependency/lineage traversal; backup expiration tracking; retries/DLQ; deletion receipts; restoration-window rules; evidence hashing.

## Workflow
Inventory/classify data → bind exact policy/version → compute expiry → hold/exception evaluation → schedule → protected deletion/archival plan → execute per-system tasks → collect receipts → follow derived/vendor/backup copies → reconcile unresolved remnants → certify outcome or explicit exception → retain minimal evidence.

## Integrations / API / data
Databases, object/file storage, logs, warehouses, SaaS, backups, vector stores, model/agent memory, analytics, vendors/subprocessors, data catalogs and privacy systems. Data: policies, inventory refs, lifecycle states, holds, tasks, receipts, exceptions and evidence.

## Monetization / distribution
Data sources/objects/GB, deletion tasks, policies, connectors, seats, enterprise/private, managed governance and jurisdiction packs. Distribution via privacy/data-governance/security ecosystems.

## Security/privacy/compliance
Deletion is destructive and legally sensitive. Strong authority, legal holds, immutable evidence, no over-deletion, privacy-preserving proof, backup limitations, vendor reconciliation, regional rules and restore/safe windows where appropriate.

## Failure / edge cases
Legal hold added during deletion, eventual-consistency replicas, backup restore reintroduces deleted data, derived embeddings/models, shared records for multiple subjects, partial vendor deletion, system offline, retention conflict, audit records themselves requiring retention, account merge/split. Explicit exception states are mandatory.

## Scale / overlap
Single policy → enterprise lifecycle → global retention/deletion control plane. Overlap #47 DSAR, #76 discovery, #77 redaction, #94 lineage. #078 owns lifecycle enforcement.

## Classification
**DESIGN NOW:** retention/expiry/hold/exception metadata, deletion tombstones, lineage/dependency refs, protected destructive action, backup/derived-data awareness.  
**BUILD NOW:** Command Center memory/artifact/log/history systems need explicit retention/deletion semantics now to avoid retrofit.  
**BUILD BEFORE FIRST COMPANY:** external connector/deletion orchestration and customer policy registry.  
**COMPANY-SPECIFIC LATER:** jurisdiction packs/customer UI/pricing.  
**SCALE-ONLY:** global distributed deletion and massive backup/vendor reconciliation.

# Mandatory 24-part completion block
1. Product Tree: policy/inventory/lifecycle/expiry/delete/archive/hold/account delete/backups/logs/vectors/memory/vendors/restore/exceptions/verify/API.
2. Feature Tree: object/class/owner/subject/source/purpose/dates/policy/expiry/hold/backup/derived/vendor/result/evidence.
3. Customer Tree: enterprise/SaaS/privacy/security/data/AI/MSP/regulated.
4. Vertical Tree: consumer/HR/health admin/finance/support/analytics/commerce/AI/records.
5. Brain Tree: policy mapping/explanation; legal hold release/destructive delete deterministic/protected.
6. Agent Tree: policy/lifecycle/expiry/hold/delete/backup/derived/vendor/reconcile/evidence/QA.
7. Service Tree: arithmetic/precedence/holds/tombstones/idempotency/lineage/backups/retry/receipts/restore/evidence.
8. Workflow Tree: inventory→policy→expiry→hold check→plan→delete→receipts→derived/vendor/backups→reconcile→certify.
9. Integration Tree: DB/files/logs/warehouse/SaaS/backups/vector/memory/analytics/vendors/catalog/privacy.
10. Data Tree: policies/inventory/lifecycle/holds/tasks/receipts/exceptions/evidence.
11. API Tree: policies/status/holds/tasks/verify/evidence.
12. Monetization Tree: sources/objects/GB/tasks/policies/connectors/seats/enterprise/managed.
13. Distribution Tree: privacy/data/security/GRC/OEM.
14. Automation Tree: expiry/scheduling/reconciliation automatic; destructive deletion protected.
15. Moat Tree: connector deletion semantics, lineage coverage, proof/reconciliation quality, policy packs.
16. Platform Tree: retention tool→lifecycle OS→enterprise deletion infrastructure.
17. Risk Tree: over-delete/under-delete/hold violation/backup resurrection/vendor failure/privacy leak.
18. Scale Tree: app→enterprise→global data estate.
19. Spinoff Tree: backup reconciliation/AI memory deletion modules; discovery/redaction remain separate.
20. Command Center Dependencies: memory, artifacts, logs, lineage, privacy, protected actions, recovery.
21. Design-Now Requirements: retention/hold/delete metadata must exist across all durable Command Center stores.
22. Build-Now Requirements: retrofit current memory/evidence/artifact/log schemas before more categories build on them if missing.
23. Safe-to-Defer Requirements: commercial connectors/jurisdiction packs/customer UI.
24. Autonomous Mature State: retention schedules and safe deletions reconcile continuously; humans control legal holds, ambiguous shared data and destructive exceptions.

## Saturation result
Further branches converge into DSAR, discovery, redaction, backup and lineage systems already represented.