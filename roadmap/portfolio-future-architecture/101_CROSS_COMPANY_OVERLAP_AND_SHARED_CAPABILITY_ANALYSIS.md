# 101 — Cross-Company Overlap & Shared Capability Analysis

**Status:** PORTFOLIO-WIDE DESIGN ANALYSIS — PLANNED  
**Owner:** James Morgan  
**Scope:** Companies 001–100 plus the Command Center/ARO/VeloClip/Coupon AutoPilot separation rules.

This document deduplicates repeated infrastructure discovered across the 100 company roadmaps without merging the companies themselves. Company identity/product ownership remains separate. Shared components are reusable contracts/services only.

## A. Shared infrastructure families

### 1. Identity, organization, tenant and actor fabric
Needed across essentially every company. Distinct actor classes must include owner, company, customer organization, customer user, employee/contractor, vendor/supplier, merchant, professional, developer/app, machine/service, Brain, Agent, worker/runtime and external provider.

Key companies reinforcing this: 2, 4, 21, 24, 40, 45, 47, 50, 58, 62, 63, 66, 70, 74, 75, 91, 92, 93.

Shared primitive: stable IDs + aliases + lifecycle + ownership + organization membership + scoped authority. Identity does not imply permission.

### 2. Authentication / authorization / delegation / risk
Strong overlap: 2, 4, 5, 22, 42, 58, 66, 73, 74, 75, 91, 92. Required concepts: least privilege, explicit resources/actions, delegated subset authority, expiry, revocation, step-up, session/device binding, risk class, approval, evidence and kill switches.

### 3. Untrusted-input security
Strong overlap: 9, 28, 42, 45, 50, 64, 66, 67, 76, 77, 89, 90. Required: external content is data, not authority; provenance/trust zones; attachment/file scanning; prompt-injection filtering; malware/DLP; redaction; structured parsing; quarantines.

### 4. Secrets / credentials / keys
Companies 5, 22, 42, 58, 63, 66, 71, 73, 74, 83, 91, 92. Shared needs: server-side refs, KMS/vault abstraction, lifecycle, owner/provider, scopes, dependencies, expiry, rotation, revocation, break-glass, redaction and audit.

### 5. Provider / integration / protocol registry
Nearly universal. Provider record must support stable provider ID, company/account/environment, capability/version, compatibility range, health, quota, cost, privacy/residency, credential reference, scopes, region, rate limit, status and replacement/deprecation path. Reinforced especially by 1, 8, 28, 41, 42, 43, 49, 53, 54, 60, 66, 68, 71, 72, 73, 83, 84, 98.

### 6. Durable command / event / workflow fabric
Needed by most operational products: idempotent command IDs, outbox/inbox, durable events, state machine, retries, backoff, timeout, DLQ, compensation/rollback, checkpoints, cancellation and evidence. Strongest overlap: 8, 9, 10, 30, 35, 41, 42, 45, 46, 49, 53, 58, 60, 61, 63, 64, 69, 71, 78.

### 7. Queue / scheduler / worker control plane
Companies 8, 41, 42, 43, 49, 51, 53, 54, 60, 65, 71, 78, 98, 100. Shared: priority, fair scheduling, leases/fencing, concurrency, anti-affinity, resource claims, rate limits, backpressure, pause/stop/kill, retries, orphan recovery and deterministic resume.

### 8. Canonical data / entity / provenance layer
Universal. Stable entity IDs, versions, source provenance, conflicts, inferred-vs-verified truth, unknown-vs-zero-vs-N/A, lineage, reversible supersession and immutable evidence. Strong examples: 5, 6, 20, 28, 39, 55, 60, 76, 79, 85, 94, 99, 100.

### 9. Data sensitivity / privacy / retention / sovereignty
Companies 47, 64, 66, 67, 76, 77, 78, 90, 93, 94, 98, 99. Shared record metadata must support sensitivity, privacy class, purpose, allowed processors, region/residency, retention, deletion, legal hold, redaction/tokenization state and downstream derived copies.

### 10. Document / file / multimodal ingestion
Companies 9, 23, 28, 31, 35, 36, 38, 48, 52, 62, 63, 64, 67, 76, 77. Reusable pipeline: file identity/hash, source, virus/malware scan, MIME/format parser, OCR/vision where needed, extraction schema, confidence, provenance, redaction, quarantine, review and artifact storage.

### 11. Search / RAG / knowledge / graph
Companies 13, 15, 25, 28, 40, 45, 50, 94, 99, 100 and most brains. Shared: scoped search, structured+semantic retrieval, source citations, version/freshness, graph relationships, privacy filters and context budget.

### 12. Brain/model routing and evaluation
Companies 2, 3, 15, 18, 28, 41, 45, 49, 54, 56, 65, 66, 67, 68, 89, 90, 95, 100. Shared: model registry/version, task capability, quality/latency/cost/privacy, local/hosted routing, deterministic fallback, evals, judge calibration, uncertainty and no unsupported certainty.

### 13. Agent registry / lifecycle / delegation
Companies 2, 41, 45, 66, 91, 92 and all AI-heavy systems. Shared: logical Agent identity separate from disposable workers, capabilities/tools, memory/state, authority, budgets, health, lifecycle, delegation depth/fan-out, evidence and termination.

### 14. Policy / rules / approvals
Universal in high-impact systems. Versioned rules and policies with scope/effective time/source/precedence, deterministic evaluation, decision reason, owner review, exceptions and supersession. Especially 4, 12, 16, 22, 24, 37, 47, 52, 58, 61, 66, 70, 74, 75, 78, 90, 92, 93, 97, 98, 99.

### 15. Audit / evidence / provenance / replay
Companies 3, 4, 5, 12, 23, 24, 35, 36, 47, 48, 53, 60, 66, 69, 71, 73, 79, 81, 82, 91, 92, 94, 99, 100. Shared evidence envelope should include source, actor, action, version, inputs/outputs refs, decision/policy, timestamps, hashes, verification and correlation IDs.

### 16. Notifications / communications
Companies 10, 18, 26, 27, 30, 35, 45, 46, 50, 52, 61, 64, 84, 93. Provider-neutral email/SMS/push/voice abstraction, consent/preference checks, sender identity, rate limits, drafts vs sends, templates/versioning, delivery receipts and protected outbound action.

### 17. Billing / entitlements / commercial configuration
Companies 1, 10, 17, 41, 45, 69, 70, 85, 88, 92, 95. Shared: usage metering, plan/features, credits/quotas, pricing versions, invoices, customer/org hierarchy, entitlements, effective dates, refunds/adjustments and reconciliation. Money movement remains separate.

### 18. Financial truth / reconciliation
Companies 7, 10, 17, 30, 32, 43, 44, 48, 61, 69, 85, 86, 87, 88, 92, 95, 96, 97. Shared financial truth model must distinguish estimates, expected values, commitments, invoices, transactions, settlements, balances, filed/reported amounts, paid/remitted amounts and verified realized outcomes.

### 19. Domain / account / communication identity
Companies 41, 45, 50, 59, 64, 83, 84. Each company must own isolated domain, DNS, certificate, sender, mailbox, social and external provider account references. Shared platform may manage metadata but never casually share accounts.

### 20. Testing / evaluation / QA factory
Companies 3, 12, 33, 53, 54, 56, 65, 80, 89, 90, 100. Shared: unit/contract/integration/e2e/visual/accessibility/security/load/chaos/evals, synthetic fixtures, regression corpus, independent verifier, exact candidate identity and evidence.

### 21. Deployment / release / environment factory
Companies 41, 43, 49, 53, 65, 80, 82, 83, 98, 100. Shared: repo/build/artifact identity, environment registry, secrets, config, migrations, preview/staging/prod, canary, health gates, rollback and release evidence.

### 22. Observability / incident / reliability
Companies 2, 3, 14, 15, 22, 41, 43, 49, 51, 53, 65, 66, 68, 71, 82, 83, 84. Shared logs/metrics/traces/events, health registry, alert correlation, incident state, containment, recovery, postmortem, SLO/SLA, provider health and safe mode.

### 23. Backup / recovery / portability
Companies 40, 41, 42, 49, 53, 60, 78, 82, 98, 100. Shared backups must be tested restorable; include migration, export/import, provider replacement, checkpoints, rollback and disaster recovery.

### 24. Localization / accessibility / multimodal
Companies 33, 45, 50, 54, 65, 89, 90. Shared locale, language, timezone, currency/unit, accessibility and multimodal interfaces should be platform contracts, not product-specific hacks.

### 25. Customer support / success / onboarding
Companies 18, 27, 28, 45, 46, 50, 64, 89. Reusable support identity, KB, case/ticket, escalation, customer health, onboarding and success primitives.

## B. Shared Brain module families

1. Research/retrieval/provenance module — 6, 13, 15, 16, 25, 28, 36, 38, 94, 100.
2. Classification/extraction module — 9, 20, 31, 35, 48, 52, 55, 64, 76, 90, 97.
3. Planning/task decomposition module — 8, 32, 41, 46, 53, 60, 66, 92, 100.
4. Forecasting module — 7, 15, 18, 19, 30, 43, 49, 85, 95.
5. Optimization/constraint-solving module — 7, 17, 19, 32, 43, 68, 74, 92, 98.
6. Anomaly/risk module — 17, 18, 22, 24, 34, 43, 48, 49, 51, 57, 66, 68, 76, 80, 85, 96.
7. Document understanding module — 9, 23, 31, 35, 36, 38, 48, 52, 62, 63, 64, 77.
8. Code/software understanding module — 42, 53, 65, 72, 80, 81, 100.
9. Conversation/communication module — 27, 45, 46, 50, 61, 64, 84, 89.
10. Evaluation/judge module — 3, 33, 53, 54, 65, 89, 90, 95.
11. Financial reasoning/explanation module — 7, 17, 30, 32, 43, 48, 61, 69, 85–88, 92, 95–97; deterministic calculators remain separate.
12. Compliance/policy interpretation module — 12, 16, 22–24, 26, 33, 37, 47, 52, 58, 62, 63, 66, 75, 78, 81, 90, 93, 97–99.

## C. Shared deterministic service families

Identity/auth • policy engine • rules engine • workflow/state machine • queue/scheduler • event/outbox/inbox • durable ledger • document parser • schema/contract registry • graph • search/index • cache • notification router • billing/metering • entitlement evaluator • financial calculator • reconciliation • rate limiter • idempotency • KMS/vault adapter • deployment/release • test runner • backup/restore • telemetry • incident manager • audit/provenance • localization • file/object storage • data retention/deletion • regional routing.

## D. Shared integration families

Identity/IAM • email/SMS/voice/push • calendars • CRM • ERP/accounting • billing/payment/banking • ecommerce/marketplaces • procurement/vendor • document/file/storage • cloud/hosting/K8s • source control/CI/CD • model/AI providers • data warehouses/lakes/ETL/streams • observability/SIEM • support/ticketing • tax/regulatory • HRIS/payroll • PIM/catalog • shipping/logistics • DNS/domain/certificate • KMS/vault • browser/legacy portals • mobile/desktop • analytics/BI.

## E. Shared data primitives

`Actor`, `Organization`, `Company`, `Project`, `Customer`, `ExternalEntity`, `Provider`, `Account`, `CredentialRef`, `Capability`, `Resource`, `Artifact`, `Document`, `DataAsset`, `Contract`, `Policy`, `Rule`, `Decision`, `Authorization`, `Consent`, `Task`, `Workflow`, `Event`, `Command`, `Agent`, `Worker`, `Brain`, `Model`, `Tool`, `ActionIntent`, `Approval`, `Evidence`, `Incident`, `Notification`, `UsageEvent`, `CostEvent`, `RevenueEvent`, `Entitlement`, `Invoice`, `Transaction`, `Reconciliation`, `Deployment`, `Release`, `Backup`, `LineageEdge`, `Evaluation`, `Metric`, `Experiment`, `RoadmapVersion`.

## F. Bundling possibilities without merging company identities

- **AI Trust & Governance bundle:** 2, 3, 4, 5, 66, 67, 68, 91, 95.
- **Data Governance bundle:** 20, 28, 47, 51, 76, 77, 78, 94, 98, 99.
- **Revenue/Finance Assurance bundle:** 10, 17, 30, 43, 44, 48, 61, 69, 85–88, 95–97.
- **Vendor/Compliance Operations bundle:** 12, 23, 24, 26, 37, 52, 62, 63, 75, 81.
- **Software Engineering Operations bundle:** 42, 49, 53, 60, 65, 71, 72, 73, 80–83, 100.
- **Commerce Operations bundle:** 7, 19, 34, 55, 57, 59, 87, 92.
- **Customer Operations bundle:** 18, 27, 45, 46, 50, 64, 84, 89, 93.

Bundles are packaging possibilities only. They do not authorize consolidation or shared customer/account data.

## G. Future consolidation candidates to monitor, not execute

Potential module-level convergence: #071 webhook delivery into broader integration platform; #072 API drift into data-contract/dependency graph; #076/#077 privacy gateway; #079/#094 provenance/lineage; #083/#084 internet/email infrastructure; #086/#087 reconciliation core; #089 as support-specific eval pack on a general Evaluation Factory.

These remain distinct top-level company roadmaps until James explicitly changes the canonical 100.

## H. Saturation conclusion

Material cross-company infrastructure now converges into a finite shared foundation: identity/authority, contracts/registries, workflow/events, security/privacy, data/provenance, Brain/Agent factories, resource/financial governance, integrations, testing/deployment/recovery and observability. Further broad shared primitives increasingly duplicate these families or belong to company-specific domain packs.