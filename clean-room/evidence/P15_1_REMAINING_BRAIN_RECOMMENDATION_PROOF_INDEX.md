# P15.1 remaining Brain/recommendation exact proof index

## agency-foundation.test.mjs
- persistent Project Agent survives worker replacement
- Agency context packets are immutable/scoped and stale packets must revalidate
- Agent Auto excludes portfolio-disabled and book projects

## analytics-foundation.test.mjs
- cross-system traces retain correlation/evidence while redacting secrets
- portfolio analytics separates project progress from Agency progress and preserves unknown denominator
- recommendations record outcomes and cannot self-install
- build-history lessons become evidence-backed proposals, never silent mutation
- security analytics is evidence-backed, payload-minimized, and never an authorization path
- self-audit surfaces implemented-unverified, missing, broken and evidence-free claims truthfully
- analytics deduplication/recalculation is reproducible and privacy-safe

## books-foundation.test.mjs
- subtype QA blocks advancement on missing or failed required evidence
- owner approvals require explicit action evidence and supersession lineage
- publication/live requires provider evidence and test orders never count as sales
- book performance keeps projected/confirmed/settled truth and dedupes IDs
- Books remain excluded from portfolio Agent Auto and Work remains publishing-only
- Books recovery scales with provenance and unresolved missing assets stay explicit

## brain-foundation.test.mjs
- context builder minimizes by owner/project/relevance/sensitivity/freshness
- plans distinguish evidence-backed facts from uncertainty
- project workspace persists execution/evidence state independently of chat session
- owner precedent never inherits authorization and rejects material context differences

## category1-architecture-contract.test.mjs
- P1 architecture inventory assigns exactly one owner and one truth source to every core responsibility
- P1 architecture contracts reject missing truth ownership failure or verification semantics
- P1 core architecture coverage fails closed when even one responsibility is absent

## category1-authority-ledger.test.mjs
- P1.6 rule ledger persists ID, scope, source, version, effective date, precedence, and explicit supersession lineage
- P1.6 rule precedence cannot silently decrease while advancing the current rule
- P1.6 conflict resolution is explicit, auditable, scoped, and cannot bypass current-rule supersession
- P1.6 ledger rejects malformed rule metadata before it enters authority history

## category1-authority-source-lineage.test.mjs
- P15.1 A00 authority sources fail closed on unknown types, missing identity, inactive sources, and non-advancing revisions
- P15.1 A00 requirement lineage fails closed on intent-changing normalization, missing parents, and source-statement replacement

## category1-command-runtime-idempotency.test.mjs
- P1.4 deduplication scope includes command type so unrelated operations cannot collide on one idempotency key
- P1.4 command runtime fails closed for unknown command types without consuming event sequence or dedupe state
- P1.4 commands without an idempotency key execute independently instead of being silently deduplicated

## category1-controlled-side-effects.test.mjs
- P1 side-effect deduplication is scope-bound and operation ids cannot be rebound to a different intent
- P1 uncertain side-effect outcomes fail closed and cannot be retried before reconciliation
- P1 missing provider receipt is treated as unknown rather than falsely retryable failure
- P1 only explicit definitive failures are retryable and a later successful retry remains idempotent
- P1 operation journal rejects invalid lifecycle and temporal regressions

## category1-evidence-verification.test.mjs
- P1.7 evidence validation admits grounded records and rejects malformed truth inputs
- P1.7 completion claims require verified evidence of sufficient strength instead of attractive status text
- P1.7 verified requirement closure requires implementation plus positive negative failure-path tests and evidence
- P1.7 checkpoints are deterministic verified resume pointers with valid identity timestamp and evidence references
- P1.7 resume skips newer checkpoints with missing unverified weak or cross-subject evidence and falls back to the last verified checkpoint
- P1.7 resume requires every checkpoint evidence reference to qualify
- P1.7 resume has deterministic same-timestamp ordering and rejects ambiguous evidence identity
- P1.7 resume returns no pointer when no checkpoint is both valid and fully evidenced

## category1-governance-policy-broadening.test.mjs
- P1 governance permits only explicitly classified non-protected actions and fails closed on unknown action classes

## category1-module-isolation-fault-containment.test.mjs
- P1 module registry contains failed cyclic replacement and preserves the last valid record

## category1-p1-1-canonical-identifiers-lifecycle.test.mjs
- P1.1 canonical identifier schema fails closed on unknown kinds prefixes tokens and wrong-kind assertions
- P1.1 lifecycle vocabulary schema covers every roadmap-required state domain including lineages

## category1-p1-10-extension-contracts.test.mjs
- P1.10 extension removal fails closed for unknown or unsafe removals
- P1.10 architecture source policy passes the clean-room source and rejects representative patch patterns

## category1-p1-2-registry-capability-fabric.test.mjs
- P1.2 capability registry fails closed on duplicate invalid and stale lifecycle mutations

## category1-p1-3-module-ownership-lifecycle.test.mjs
- P1.3 module contracts require explicit ownership lifecycle failure and verification declarations
- P1.3 registry rejects duplicate ownership and hidden or unknown cross-module reach-in
- P1.3 dependency cycles are rejected on lifecycle contract replacement

## category1-p1-6-authority-ledger-governing.test.mjs
- P1.6 explicit revocation preserves source version reason and revocation lineage and leaves no governing rule

## category1-runtime-resilience-contracts.test.mjs
- P1 graceful degradation distinguishes healthy degraded and unavailable outcomes
- P1 feature flags default off and unsafe enablement or stale replacement fails closed
- P1 observability hooks require trace IDs and preserve correlated event evidence

## category1-universal-command-surface.test.mjs
- P1 universal command surface fails closed on malformed commands and unknown action types

## category1-version-lifecycle-contracts.test.mjs
- P1 capability and module lifecycle vocabularies are versioned explicit and fail closed on unknown states

## category13-authoritative-acceptance.test.mjs
- P13.1 cognitive/ecosystem health keeps missing data unknown and provenance/uncertainty explicit
- P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply

## category13-durable-governance-evidence.test.mjs
- C13 durable evidence covers metrics traces health outcomes learning security governance and evaluators
- P13.2 trace fabric retains ordered pipeline evidence classes
- P13.6 separates predicted actual process decision and transfer outcomes
- P13.7 learning evidence keeps local scope and explicit promotion state

## category13-operating-readiness.test.mjs
- P13.3 core journey instrumentation emits measurable starts and outcomes for every required journey
- P13.7 launch rehearsal catalog covers all eight required incidents and validates evidence

## category14-authoritative-acceptance.test.mjs
- P14.4 replacement default-denies unavailable paid/unknown or incompatible candidates
- P14.5 historical recovery keeps unavailable CCR evidence visible
- P14.12 long-horizon lifecycle leaves no orphan authority/data and never labels simulation as real

## category14-durable-recovery-lifecycle.test.mjs
- P14.1-P14.5 recovery migration replacement and historical evidence are durable
- P14.6 scale evidence includes 10x and 100x exercises
- P14.12 long-horizon drift external reality causal and replacement audits are explicit
- C14 durable evidence is immutable and Command Center authorized

## category15-a00-p1-10-architecture-contracts.test.mjs
- A00 P1.10 architecture ownership and extension rows are strictly grounded to canonical authority and exact-head evidence
- resolved A00 closure retains architecture-contract verification while later clusters remain append-only

## category15-a00-p1-4-command-runtime.test.mjs
- A00 P1.4 command-runtime idempotency and deduplication rows are strictly grounded
- resolved A00 closure retains the two evidenced P1.4 rows as later clusters are added

## category15-a00-p1-4-controlled-side-effects.test.mjs
- A00 P1.4 controlled-side-effect cluster is strictly grounded to canonical authority and exact-head evidence

## category15-a00-p1-7-evidence-verification.test.mjs
- A00 P1.7 completion-truth cluster is strictly grounded to canonical authority and exact-head evidence
- resolved A00 closure retains the four evidenced P1.7 rows as later clusters are added

## category15-a00-p1-foundation-version-lifecycle.test.mjs
- A00 P1 foundation version/lifecycle rows are strictly grounded to canonical authority and exact-head evidence
- connection-gated provider lifecycle remains unpromoted until its activation prerequisite is actually satisfied

## category15-a00-p1-recovery-observability.test.mjs
- A00 P1 recovery and observability rows are strictly grounded to canonical authority and exact-head evidence

## category15-a00-p1-runtime-resilience.test.mjs
- A00 P1 runtime resilience rows are strictly grounded to canonical authority and exact-head evidence

## category15-a00-requirement-traceability.test.mjs
- P15.1 A00 effective rows cannot become VERIFIED without strict row-level closure evidence

## category15-a00-source-grounding.test.mjs
- A00 grounding rejects missing row-level source provenance

## category15-p15-2-partial-preservation.test.mjs
- Task 3 invariant: P15.2 is PARTIAL unless exact-head semantic every-file evidence is complete
- Task 3 current state: P15.2 stays PARTIAL while the semantic review evidence is absent

## category15-pwa-harness.test.mjs
- P15.14 lifecycle harness uses explicit loopback DevTools probing instead of Chrome profile-file discovery

## category15-release-artifact-audit.test.mjs
- Category 15 release artifact audit preserves clean-room runtime ownership and protected-asset fail-closed behavior

## category15-requirement-traceability-builder.test.mjs
- P15.1 validator rejects VERIFIED rows with empty implementation/test/evidence closure
- P15.1 validator requires evidence-backed justification for NOT_APPLICABLE rows

## category15-rev3-requirement-traceability.test.mjs
- P15.1 REV3 traceability never treats incomplete categorized evidence as VERIFIED

## category2-adversarial-recovery.test.mjs
- adversarial: policy downgrade and unknown protected actions are denied
- adversarial: CI supply-chain seam is pinned and lifecycle scripts are disabled

## category2-p24-precondition-audit.test.mjs
- P2.4 unknown session is also audited once under the protected resource owner

## category2-p25-provider-replacement.test.mjs
- P2.5 provider replacement revokes the old reference and activates only reference metadata for the new provider
- P2.5 provider replacement preserves purpose and rejects reference metadata containing secret material

## category2-p25-secret-channels.test.mjs
- P2.5 redaction removes recognized secret values while preserving non-secret context

## category2-p28-incident-drill.test.mjs
- P2.8 incident drill yields append-only suspicious, containment, recovery, and resolution evidence
- P2.8 incident and alert lifecycle timestamps cannot move backward

## category3-asset-validation.test.mjs
- asset replacement validates original state identity provenance and time before changing registry

## category3-canonical-lifecycle.test.mjs
- canonical lifecycle rejects backwards writes atomically and preserves verified zero
- truth decoding rejects ambiguity and preserves explicit zero unknown and N/A

## category3-canonical-platform.test.mjs
- P3 canonical platform persists entities, provenance, assets, graph, and providers
- knowledge truth state preserves known zero versus unknown and N\/A with storage-level provenance integrity
- locked assets require explicit owner evidence and the Category 2 protected gate

## category3-context-exchange-persistence.test.mjs
- P3.10 persists immutable scoped context snapshots and artifact manifests
- P3.10 artifact exchange verifies canonical identity and never exports secret artifacts

## category3-context-snapshot-boundaries.test.mjs
- context cannot broaden company account environment or purpose scope by omission
- context exchange ceiling cannot permit secret material

## category3-derived-artifact-persistence.test.mjs
- artifact provenance is a direct canonical join to exact source observation/hash lineage
- canonical restriction/deletion propagates to every dependent artifact and active state never revives one
- direct artifact reactivation and lineage mutation are forbidden
- artifact registration is owner-authorized, active-canonical and provenance-gated
- artifact use revalidates current artifact canonical provenance and payload state
- artifact table is owner-readable only and mutation/use RPCs have no service-role authority shortcut

## category3-derived-artifacts.test.mjs
- all A08 derivative classes register only through active canonical derived provenance
- artifact registration rejects mismatched owner/derived identity, inactive canonical state and unsupported classes
- source correction/retraction invalidation propagates canonical deletion across summaries memories indexes vectors exports metrics and recommendations
- legal hold converts invalidated canonical derivatives and every dependent artifact to restricted without erasing lineage
- restricted/deleted artifacts are never silently reactivated when canonical state later appears active
- artifact use requires active canonical state, active artifact state and present payload
- artifact use fails closed when canonical provenance diverges from the registration snapshot
- duplicate artifact identity is rejected and listing remains scoped to canonical derived id

## category3-derived-hold-release.test.mjs
- legal hold placement requires a reason and release requires explicit authorization evidence

## category3-historical-staging-persistence.test.mjs
- historical staging evidence is owner-readable and immutable to browser roles

## category3-portability-persistence.test.mjs
- P3.7 durable portability stages before mutation and preserves conflict/redaction evidence
- P3.7 import evidence is owner-readable and directly immutable to browser roles

## category3-portability-validation.test.mjs
- portable round-trip freezes independent snapshots and rejects ambiguous provenance and sensitivity

## category3-post-audit-source-platform.test.mjs
- provenance separates observed effective and ingested time and preserves correction/retraction lineage
- derived lifecycle traces provenance and source invalidation deletes or restricts held derivatives
- provider capability drift is evidence-backed and regressions/pricing uncertainty fail visibly
- context snapshots exclude retracted, stale, cross-company/account/environment and wrong-purpose sources

## category3-postgres-execution.test.mjs
- context snapshot checks content hash and owner and leaves canonical source untouched

## category3-privacy-restore-persistence.test.mjs
- payload mutations are narrow authorized security-definer RPCs with evidence and no service-role shortcut

## category3-privacy-restore.test.mjs
- legal hold blocks payload erasure and audit events require unique evidence
- restore fails closed when current evidence is absent blank or duplicated

## category3-protocol-registry-persistence.test.mjs
- P3.11 adapter replacement is optimistic/versioned and core-independent

## category3-recovery-boundaries.test.mjs
- recovery rejects empty event identity and unknown-cost replacement while deterministic replay is stable

## category3-recovery-persistence.test.mjs
- P3.12 persists privacy-safe recovery evidence
- provider replacement validation honors capability and free-first gates without switching provider
- recovery evidence is owner-readable and directly immutable to browser roles

## category3-refresh-recovery-persistence.test.mjs
- expectation capture derives exact downstream obligations from provenance after invalidation
- derived invalidation acknowledgement is exact evidence-backed and state-checked
- recovery evidence tables are owner-readable but not directly writable

## category3-refresh-recovery.test.mjs
- worker replacement cannot bypass pending derivative acknowledgements and resumes only after closure
- acknowledgement evidence is required, unique and cannot predate the source checkpoint
- missing or unsuccessful checkpoints restart and stale checkpoint generations fail closed

## category3-source-persistence.test.mjs
- Category 3 retrofit persists source identity, provenance, derived lifecycle, provider drift, and refresh state
- provider capability snapshots preserve verified capability truth and visibly classify breaking or unknown-pricing drift

## category3-sync-reconciliation.test.mjs
- conflict resolution records evidence without mutating canonical truth
- sync evidence is owner-readable but directly immutable to browser roles

## category4-home-registry.test.mjs
- P4.4 a future Home tile registers through the context registry without changing renderer internals

## category4-startup-boundary.test.mjs
- P4.2 runtime root replacement keeps one rendered application tree

## category4-visual-regression.test.mjs
- P4.8 shared visual language, geometry and owner interaction rules have a deliberate regression fingerprint

## category5-contract-parity-hardening.test.mjs
- P5.1/P5.2 generic replacement cannot bypass governed identity, authorization, or protected lifecycle seams
- P5.3 roadmap runtime rejects evidence-free satisfied gates and malformed list contracts
- P5.10 discovery requires nonblank unique provenance and disposition-specific target semantics

## category5-durable-project-system.test.mjs
- P5.4 durable checkpoint requires exact roadmap/version/evidence/resume hash
- P5.13 prototype feedback is lineage evidence and cannot silently override protected design
- P5.14 recovery preserves lineage/decisions/checkpoints and consumes fresh authorization for lifecycle changes

## category5-project-registry-lineage.test.mjs
- P5.2 in-memory lineage preserves current name, mission and aliases with evidence

## category5-runtime-truth.test.mjs
- P5.7 browser requires evidence-bearing live execution instead of lifecycle status
- P5.8 browser requires evidence-bearing roadmap readiness instead of a loose next action
- P5.8 selector rejects readiness without evidence

## category6-ai-provider-routing.test.mjs
- P6.2 records truthful degraded or unavailable routing evidence and supports local/self-hosted seams
- in-memory Brain routing matches free-first/privacy/health/quota policy and provider replacement semantics

## category6-brain-adversarial.test.mjs
- P6.15 stale, sensitive, low-relevance and cross-project context is excluded
- P6.15 context overflow is bounded and exact referent ambiguity fails closed

## category6-context-builder-persistence.test.mjs
- P6.4 durable context build binds selection evidence to immutable owner/project snapshot
- P6.4 Context Builder filters cross-project, stale, sensitivity and low-relevance candidates

## category6-conversation-persistence.test.mjs
- P6.7 persistent conversation stores intent/redaction evidence without canonical-write authority

## category6-execution-snapshot-persistence.test.mjs
- P6.9 durable referent/snapshot evidence freezes exact version without execution

## category6-improvements-persistence.test.mjs
- P6.13 runtime improvement proposals require evidence/confidence and never install automatically

## category6-memory-governance.test.mjs
- P6.3 durable memory migration supports full canonical memory vocabulary and append-only retention evidence
- P6.3 retention governance requires evidence and policy-consistent expiry

## category6-owner-precedent-persistence.test.mjs
- P6.11 material account, risk or cost differences block precedent reuse

## category6-planner-persistence.test.mjs
- P6.5 durable planner keeps truth classes, evidence/confidence and proposed actions separate from execution

## category6-specialist-brains-persistence.test.mjs
- P6.6 durable specialist registry keeps scope, provenance, versions and deprecation explicit

## category6-voice-interface-persistence.test.mjs
- P6.12 durable voice evidence cannot bypass shared intent/security gates

## category7-agency-adversarial.test.mjs
- P7.24 context leakage, sensitivity overflow and stale context fail closed
- P7.24 portfolio and Work rules cannot silently broaden project scope or execution environment
- P7.24 expired worker recovery preserves checkpoint/evidence and increments generation/fence

## category7-auto-execution-transition-hardening.test.mjs
- P7.9 Project Auto preserves canonical P7.1 run transition evidence

## category7-canary-rollout.test.mjs
- P7.22 durable shadow/canary evidence recommends rollback on protected, duplicate, success, or verification regression without deploying

## category7-context-packets-persistence.test.mjs
- P7.7 durable context packet freezes full execution envelope and blocks stale/wrong-scope commit

## category7-durable-provider-callback-hardening.test.mjs
- R4 process memory is not authoritative for callback dedupe or ordering
- R4 lost or uncertain external effects reconcile from evidence instead of fabricated success

## category7-post-audit-distributed-work.test.mjs
- expired resource recovery is evidence-backed, stable ordered, and does not reap live or already released claims
- durable resource recovery only reaps expired claims under stable locks and records immutable evidence

## category7-project-agent-persistence.test.mjs
- P7.1 runtime Project Agent state survives worker replacement semantics

## category7-recovery-failover.test.mjs
- P7.23 runtime recovery reaps only expired assignments and preserves checkpoint/evidence

## category7-resource-quota-usage-governor.test.mjs
- A10.1/A10.2 default to zero budget and deny unknown pricing
- positive monetary quota requires explicit paid-budget authorization evidence
- A10.5 provider usage receipts have stable dedupe identity and reject changed receipt payloads

## category7-side-effect-outbox-inbox.test.mjs
- side-effect claims are atomic, fenced, and exclude dispatched or unknown effects from retry
- unknown external outcomes must reconcile to no-effect or succeeded before retry
- provider inbox deduplicates stable event identity and rejects changed payload scope or effect binding

## category8-postgres-execution.test.mjs
- P8.2 preserves provider identity and immutable reconciliation evidence
- P8.7 search projections enforce owner-scoped RLS and durable provenance

## category8-runtime-integration.test.mjs
- Category 8 runtime closes P8.7 provider federation, index refresh boundary, permission/provenance filtering and conflict detection

## current-authority-manifest.test.mjs
- evidence receipts require exact phase, exact head, verified status and evidence

## current-requirement-classification.test.mjs
- current classification fails closed when historical provenance does not match the immutable overlay anchor

## data-platform-foundation.test.mjs
- truth values keep known zero distinct from unknown and not applicable
- knowledge ledger requires provenance and explicit supersession and never treats inference as verification
- asset registry preserves missing originals and gates locked replacement

## data-platform-recovery.test.mjs
- context snapshots inherit scope and sensitivity and exclude cross-project/secret sources
- projection rebuild fails on gaps and provider replacement honors capability and free-first gates

## finance-foundation.test.mjs
- money keeps unknown distinct from verified zero
- net worth reports known subtotal plus unknown accounts rather than fabricating a complete figure
- budget variance remains unknown when actual is unknown
- credit facts identify provider/model/date and recommendations never forecast score
- tax output remains explicitly an estimate grounded in verified evidence

## finance-platform-foundation.test.mjs
- detected recurrence is not contract truth until owner/contract evidence confirms it
- financial scenarios separate verified inputs from assumptions and promise no outcome

## kernel-foundation.test.mjs
- generic registry enforces uniqueness and optimistic version replacement
- module registry blocks unknown dependencies, cycles, and removal with dependents
- completion and checkpoints require verified evidence

## p10-1-identity-hardening.test.mjs
- P10.1 replacement is explicit new identity with retained predecessor, never a silent rebind

## p10-1-social-identity-map.test.mjs
- P10.1 ownership authorization and lineage evidence are mandatory
- P10.1 durable identity map is immutable owner-scoped and lineage-evidenced

## p10-2-connection-hardening.test.mjs
- P10.2 PostgreSQL binds connection evidence to canonical identity and preserves recoverable history

## p10-2-social-connections.test.mjs
- P10.2 disconnected expired revoked states require recoverable reconnect and owner action evidence

## p10-3-social-drafts-assets.test.mjs
- P10.3 every source asset requires exact provenance and rights binding
- P10.3 account/content revision invalidates prior approval while preserving asset evidence
- P10.3 approvals cannot predate revision and malformed evidence fails closed
- P10.3 durable schema preserves immutable owner-scoped draft asset rights provenance and approval bindings

## p10-4-profile-hardening.test.mjs
- P10.4 unknown rules deprecated policies and owner key collisions fail closed
- P10.4 PostgreSQL profile policy cannot bind another platform adapter or mutate historical evidence

## p10-4-social-platform-profiles.test.mjs
- P10.4 malformed adapter output fails closed against profile rules
- P10.4 durable profile/adapter evidence is immutable owner scoped and version linked

## p10-5-social-publishing.test.mjs
- P10.5 durable publishing evidence is immutable owner-scoped and enforces one public effect

## p10-6-social-inbox.test.mjs
- P10.6 durable inbox evidence is immutable owner-scoped and keeps external text non-authoritative

## p10-7-analytics-hardening.test.mjs
- P10.7 collection of old observations does not manufacture freshness; zero differs from unknown partial conflicting
- P10.7 no confirmed revenue without exact independently verified non-test outcome or causal attribution proof
- P10.7 SQL rejects nonfinite values and unsupported revenue; test receipts cannot become real outcomes

## p10-7-social-analytics.test.mjs
- P10.7 metric evidence preserves identity provenance confidence and freshness policy
- P10.7 estimated revenue cannot masquerade as confirmed monetary outcome
- P10.7 snapshot keeps confirmed revenue separate from estimated outcomes
- P10.7 durable analytics evidence is immutable owner-scoped and separates confirmed/estimated truth

## p10-8-social-recovery-isolation.test.mjs
- P10.8 durable recovery/isolation/paid-action assessment evidence is immutable and owner scoped

## p11-10-book-recovery.test.mjs
- P11.10 missing artifacts remain explicit and cannot pretend to have file/hash evidence
- P11.10 reconstructed artifacts retain explicit reconstruction provenance
- P11.10 series continuity detects missing sequence and missing continuity evidence
- P11.10 export/restore provider migration requires matching manifest and verification evidence
- P11.10 durable recovery/archive/export/migration evidence is immutable owner-scoped and provenance-preserving

## p11-10-book-restore-integrity.test.mjs
- P11.10 restore preserves compatibility provenance approvals publication and protected assets
- P11.10 durable restore evidence is immutable and owner-scoped

## p11-2-book-assets.test.mjs
- P11.2 authoritative protected asset is explainable by exact file hash provenance and approval
- P11.2 replacement authorization is exact and cannot be reused for another hash book kind or expired action
- P11.2 durable asset lineage stores hashes approvals reconstruction and exact protected replacement authorization

## p11-3-book-qa.test.mjs
- P11.3 visual subtypes require image QA and fail closed when image evidence is missing
- P11.3 failed required evidence blocks advancement even when all gates have evidence
- P11.3 QA evidence binds exact owner-scoped profile version and known requirement
- P11.3 latest requirement evidence governs assessment and cannot be bypassed by stale pass
- P11.3 durable QA evidence is immutable owner-scoped versioned and blocks advancement on missing or failed gates

## p11-4-book-metadata-rollout.test.mjs
- P11.4 pricing recommendations require explicit evidence and package readiness blocks missing format pricing

## p11-4-book-publication-metadata-details.test.mjs
- P11.4 recommendations are not approvals and approved prices require explicit approval lineage

## p11-5-book-approval-state-machine.test.mjs
- P11.5 durable protected approval lifecycle is immutable owner-scoped and covers required states and kinds

## p11-5-book-approvals.test.mjs
- P11.5 durable approval and protected-change evidence is immutable owner-scoped and lineage-bound

## p11-6-book-publication-lifecycle.test.mjs
- P11.6 lifecycle exposes every locked publication state
- P11.6 live requires exact provider listing receipt publication ref timestamp and evidence
- P11.6 blocked changes/rejection require error or correction evidence
- P11.6 durable lifecycle is immutable and owner-scoped

## p11-6-book-publication.test.mjs
- P11.6 submitted review and live states require provider receipts and lifecycle timestamps
- P11.6 publication history only advances through allowed evidence-backed states
- P11.6 blocked publication requires explicit reason or error evidence
- P11.6 durable publication history is immutable owner-scoped and requires provider evidence for live truth

## p11-7-book-provider-connections.test.mjs
- P11.7 provider replacement requires migration lineage
- P11.7 durable provider connection evidence is owner-scoped and immutable

## p11-8-book-performance-truth.test.mjs
- P11.8 unknown remains unknown and verified zero remains zero
- P11.8 dedupe prevents double counting imported provider rows
- P11.8 settled values require settlement evidence

## p11-8-book-performance.test.mjs
- P11.8 settled royalties require settlement evidence and currency
- P11.8 durable performance evidence is immutable owner-scoped and preserves projected confirmed settled truth

## p11-9-book-boundary-coverage.test.mjs
- P11.9 normal chat owns metadata recovery and evidence before publishing boundary
- P11.9 portfolio Agent Auto remains excluded

## p11-9-book-execution-boundaries.test.mjs
- P11.9 portfolio Agent Auto remains excluded
- P11.9 durable execution-boundary decisions are immutable owner-scoped and preserve Agent/Work rules

## p12-1-specialist-framework.test.mjs
- P12.1 missing ownership data/detail/provenance or canonical specialist reference fails closed

## p12-2-shopping-specialist.test.mjs
- P12.2 trip priority can prefer lowest cash today separately from lowest final cost
- P12.2 durable shopping evidence preserves truth timing privacy specialist ownership and practical travel evidence

## p12-3-media-specialist.test.mjs
- P12.3 media source requires rights and provenance
- P12.3 autonomous worker boundary blocks portfolio-wide mode
- P12.3 publishing route requires canonical protected-action authorization evidence
- P12.3 durable media evidence preserves specialist ownership rights workflow worker boundaries and publish authorization

## p12-4-commerce-specialist.test.mjs
- P12.4 durable commerce evidence preserves store supplier project isolation and non-loss economics

## p12-5-digital-products-specialist.test.mjs
- P12.5 durable digital-product evidence preserves artifact identity delivery pricing and source evidence

## p12-6-service-business-specialist.test.mjs
- P12.6 durable service-business evidence preserves company scope sources immutability and recovery

## p12-7-software-platform-specialist.test.mjs
- P12.7 durable software-platform evidence preserves company source context and exact deployment binding

## p12-7-software-platform.test.mjs
- P12.7 deployment evidence binds exact repository provider commit and environment

## p12-8-canonical-authorization-postgres.test.mjs
- P12.8 invalid immutable legacy rows block migration atomically without rewriting evidence

## p12-8-interoperability-postgres.test.mjs
- P12.8 PostgreSQL lifecycle versions reject invalid activation, identity substitution and recovery resurrection

## p12-8-interoperability.test.mjs
- P12.8 revoked promotion, unresolved negative evidence and local alternatives prevent propagation
- P12.8 canonical lifecycle rejects unsafe transitions and tuple-key collisions without mutation
- P12.8 lifecycle integrates exact C2 plan approval and cannot expand a project session
- P12.8 collaboration discovery selects compatible scoped specialists deterministically without private context

## p12-8-specialist-lifecycle-isolation.test.mjs
- P12.8 lifecycle mutations require exact action authorization and provider reactivation readiness
- P12.8 durable lifecycle evidence is owner-isolated immutable recoverable and future-registration capable

## p12-8-specialist-lifecycle.test.mjs
- P12.8 replacement preserves specialist type and explicit authorization
- P12.8 all protected lifecycle transitions reject noncanonical evidence without mutating state
- P12.8 canonical evidence permits archive but cannot bypass exact scope action or target

## p13-1-semantic-metrics.test.mjs
- P13.1 semantic registry preserves zero versus unknown/absent/N/A/deleted/stale/conflicting

## p13-10-evaluator-accuracy.test.mjs
- P13.10 synthetic/replay/production scores cannot be blended to manufacture production acceptance

## p13-10-gate-integrity.test.mjs
- P13.10 acceptance gate rejects missing phases/evidence/claims and structural mode never certifies tests

## p13-3-health-observability.test.mjs
- P13.1/P13.3 all fourteen ecosystem signals preserve unknown denominators and observed zero

## p13-4-portfolio-evidence.test.mjs
- P13.4 progress comes from verified closure evidence and trusted denominator, not prose or Agency counters

## p13-5-agency-routing.test.mjs
- P13.5 queue snapshots are not multiplied by worker count and empty telemetry is unknown

## p13-6-outcome-calibration.test.mjs
- P13.6 calibration measures Brier/gap with sample and temporal/evidence/benchmark safeguards

## p13-8-security-correlation.test.mjs
- P13.8 agreement sharing any source/provider/model/benchmark/assumption/artifact is discounted transitively

## p13-9-governance-critic.test.mjs
- P13.9 optimizer proposals are evidence-backed, revocable, bounded and never execute or promote
- P13.9 measured routing/calibration/method/correlation weaknesses produce bounded proposals; absent evidence stays unknown

## p13-durable-analytics.test.mjs
- P13.1 durable representative metric/observation path proves source binding, idempotency, unknown/zero and exact scoped reads

## p14-1-encrypted-backup.test.mjs
- P14.1 credentials, cross-project, duplicate, denied, missing evidence, stale and superseded policies reject

## p14-10-canonical-interface.test.mjs
- P14.10 competing command/policy/data runtimes, nonremovable/unknown interfaces and ambiguous intent fail closed

## p14-12-long-horizon-revalidation.test.mjs
- P14.12 actual data/module/project, provider and Agency-role lifecycles preserve failure/recovery/migration/removal with no orphan state
- P14.12 architecture/config/external/memory/dependency drift distinguishes every AM20 class and emits subordinate documentation
- P14.12 counterfactual infrastructure separates observed facts/correlations/assumptions/interventions/sensitivity from simulated outcomes and unproven causality

## p14-2-isolated-restore.test.mjs
- P14.2 unknown, invalidated learning and changed versions cannot become current; dependency denial propagates

## p14-4-portable-replacement.test.mjs
- P14.4 provider/AI/storage/hosting/integration/model replacement preserves canonical registry identity and exposes stale PIF dependencies
- P14.4 paid/unknown/unavailable/retired/compromised/incompatible/scope/stale/permission expansion rejects before mutation

## p14-durable-recovery.test.mjs
- P14.1 durable representative encrypted artifact executes migration chain, source binding and idempotent scoped storage
- P14 durable direct-RPC missing/ambiguous evidence, production, plaintext, forged scope and client-role access fail closed
- P14.3/P14.11 durable exercise failure rolls back partial evidence; restart and competing retries preserve one immutable checkpoint

## p15-1-auth-session-resume.test.mjs
- P15.1 expired refresh returns to authentication and successful retry resumes without frozen state

## p15-1-authority-traceability-boundary.test.mjs
- P15.1 single architecture authority accepts the current integrated roadmap and preserves historical classification
- P15.1 competing historical missing or owner-mismatched architecture authorities fail closed

## p15-1-current-traceability.test.mjs
- P15.1 repository evidence rejects fabricated source/proof/refs, copied VERIFIED/N/A claims and changed runtime/test bindings
- P15.1 current corrections repair three stale references without rewriting historical fragment evidence

## p15-1-feature-safety-boundary.test.mjs
- P15.1 unsafe feature replacement cannot use truthy safety text or consume its current version
- P15.1 valid feature flags retain explicit safe enablement stale-write rejection and unknown-off defaults

## p15-1-financial-runtime-boundary.test.mjs
- P15.1 financial runtime rejects unknown action kinds and ambiguous consumed state before producing an execution envelope
- P15.1 financial runtime rejects truthy flags, duplicate/blank accounts, empty provider and duplicate evidence without mutating caller state

## p15-1-governance-runtime-boundary.test.mjs
- P15.1 unknown governance instruction or surface and blank owner fail closed while optional defaults remain compatible

## p15-1-module-contract-isolation.test.mjs
- P15.1 module read surfaces cannot mutate ownership dependencies permissions or lifecycle evidence
- P15.1 module lifecycle flags must be explicit booleans before registration or replacement

## p15-1-protected-asset-authority.test.mjs
- P15.1 locked synthetic asset rejects truthy nonboolean replacement authority without changing its identity
- P15.1 synthetic asset authorization cannot change owner project creation identity or stale version rules

## p15-1-recovered-source.test.mjs
- P15.1 exact recovered CSV archive is reproducible from repository evidence and retains all 5825 source rows without Library dependency

## p15-1-registry-version-boundary.test.mjs
- P15.1 replacement versions reject NaN Infinity fractions and unsafe integers without changing the current record

## p15-1-route-registration-boundary.test.mjs
- P15.1 route registry rejects unknown navigation and scroll ownership states before registration

## p15-1-startup-watchdog.test.mjs
- P15.1 Recovery diagnostic codes reject raw or unknown runtime values without exposing private details

## p8-11-privacy-recovery.test.mjs
- P8.11 owner/project/domain/sensitivity/integrity/provenance boundaries fail closed
- P8.11 durable schema stores immutable provenance/history with owner-scoped RLS and no action authority

## p8-2-calendar-reconciliation.test.mjs
- P8.2 durable schema preserves provider identity, reconciliation evidence, and owner isolation

## p8-4-contacts-followup.test.mjs
- P8.4 recommendations never copy sensitive relationship context or authorize sends
- P8.4 durable schema keeps relationship context scoped and creates no send authority

## p8-6-onboarding-manifests.test.mjs
- P8.6 rejects unknown dependencies, self-dependencies, cycles, and unknown completed ids
- P8.6 durable schema versions prerequisites and completion evidence without inventing execution authority

## p8-7-universal-search.test.mjs
- P8.7 query-time permissions, project/domain scope, provenance, and freshness all gate results
- P8.7 durable schema stores only owner-scoped search projections with permissions, freshness, provenance, and tombstones

## p8-8-notifications.test.mjs
- P8.8 flood routing preserves critical signal and bundles/dedupes within owner scope
- P8.8 acknowledged intents do not re-notify and acknowledgements require evidence

## p8-9-scheduled-automation.test.mjs
- P8.9 catch-up is explicit, deduplicated, ordered, and bounded

## p9-1-financial-data-foundation.test.mjs
- P9.1 canonical primitives carry provenance, freshness, confidence, and cannot authorize actions
- P9.1 consent, reconnect, freshness, provider identity, and provenance are explicit
- P9.1 durable foundation is append-only, owner-scoped, provenance-preserving, and exposes current/history separation

## p9-2-accounts-net-worth.test.mjs
- P9.2 ownership, asset/liability class, currency and provenance are explicit and action-neutral
- P9.2 reconciliation accepts newer truth, rejects stale truth, dedupes exact replay, and surfaces same-time conflict
- P9.2 durable schema is append-only, owner-scoped, source-dated, state-explicit, and reconciliation-evidenced

## p9-3-transactions-cashflow.test.mjs
- P9.3 exact duplicate provider events dedupe while merging every raw-source lineage reference
- P9.3 pending-to-posted lifecycle selects one canonical current transaction without double-counting

## p9-3-transfer-dedup-cashflow.test.mjs
- P9.3 dedup and pending-posted reconciliation preserve raw-source lineage

## p9-4-recurring-obligations.test.mjs
- P9.4 contract evidence or owner confirmation can establish confirmed obligation truth
- P9.4 owner correction changes expected truth with immutable lineage and owner evidence
- P9.4 durable recurring truth is append-only, owner-scoped, evidence-gated, correction-aware, and reminder-neutral

## p9-5-credit-platform.test.mjs
- P9.5 every canonical score/factor/account carries provider model report date and report identity
- P9.5 credit data is isolated from unrelated contexts and cross-owner access
- P9.5 recommendations remain factor-evidenced and never forecast a score

## p9-6-goals-debt-scenarios.test.mjs
- P9.6 verified data requires evidence and cannot hide sensitivity assumptions
- P9.6 recommendations require verified evidence and never promise score/outcome changes
- P9.6 durable scenarios are append-only, owner-scoped and prohibit score/outcome promises

## p9-7-protected-financial-actions.test.mjs
- P9.7 analysis recommendation and automation cannot authorize money movement

## p9-8-financial-identity-isolation.test.mjs
- P9.8 finance access requires owner/domain/scope/auth isolation and minimizes released context
- P9.8 context minimization fails closed when requested classes are not authorized

## p9-8-server-capability.test.mjs
- P9.8 server capability minimizes context and never grants action authority
- P9.8 containment verification expiry unknown incident and secret-like metadata fail closed

## p9-9-durable-attempts.test.mjs
- provider receipt scope mismatch null fields and wrong account or amount cannot invent success
- stale restored consumed mismatched amountless and recommendation authority fail closed
- partial success requires reconciliation; unchanged action hash cannot create a duplicate attempt

## p9-9-fault-injection.test.mjs
- P9.9 secret-like evidence cannot pass the ordinary recovery sync surface

## p9-9-finance-recovery-evidence.test.mjs
- P9.9 integrity or provenance failure rejects restore even when provider is healthy
- P9.9 restore requires verified evidence and available provider
- P9.9 rollback cannot be authorized from recovery evidence and requires new exact owner authorization
- P9.9 durable recovery evidence is immutable owner-scoped and forbids replay/rollback authority

## personal-ops-foundation.test.mjs
- contact follow-up recommendations never authorize sends
- Needs Me dedupes one owner action across linked work and ranks unlock impact
- universal search enforces owner/domain/project/sensitivity and provenance
- notification routing dedupes, honors quiet, and minimizes sensitive content
- scheduled automation execution is idempotent and evidence-backed

## pif-integrated-hardening.test.mjs
- PIF integrated acceptance chains PIF.1-10 with scoped exact-version evidence and downstream invalidation

## pif1-shared-intelligence-contracts.test.mjs
- PIF.1 rejects ambiguous identity, missing provenance, incompatible ontology, invalid causality, and unauthorized scope

## pif2-capability-method-portfolio.test.mjs
- PIF.2 keeps competing methods side by side and routes by current context instead of a universal default
- PIF.2 enforces applicability, prerequisites, contraindications, cost, privacy, resource and revalidation gates
- PIF.2 validates evidence, lifecycle, rollback, version replacement and fallback safety
- PIF.2 durable schema is a method portfolio under existing capability ownership

## pif4-learning-promotion.test.mjs
- PIF.4 accepts evidence-rich scoped learning and emits non-executable promotion decisions

## pif5-epistemics.test.mjs
- PIF.5 newer low-authority evidence cannot erase higher-authority knowledge
- PIF.5 source confidence is bounded and invalid evidence confidence fails closed
- PIF.5 material same-authority disagreement abstains and preserves conflicting evidence
- PIF.5 stale evidence decays out of routing but remains visible
- PIF.5 uncertain states cannot manufacture certainty and high-impact routing raises threshold
- PIF.5 durable schema is an epistemic companion to canonical knowledge, with immutable versions and contradiction records

## pif6-memory-context.test.mjs
- PIF.6 context compiler prevents unrelated company/project leakage
- PIF.6 historical provenance remains visible but cannot be operationally reactivated
- PIF.6 compiled context carries scoped method, permission and budget references

## pif7-evaluator-outcomes.test.mjs
- PIF.7 synthetic result cannot become production outcome or acceptance evidence
- PIF.7 lucky outcome with unresolved confounders cannot prove causal/process quality
- PIF.7 durable schema keeps evaluator versions, runs, decision snapshots, and outcomes immutable

## pif8-negative-knowledge-transfer.test.mjs
- PIF.8 invalidated negative-knowledge evidence revokes dependent transfer
- PIF.8 scoped evidence can qualify a transfer without making it global

## post-audit-isolated-vertical-proof.test.mjs
- authorized protected action crosses live session, immutable intent, central policy, operation, worker fencing, and evidence closure
- expired worker is fenced out and recovery advances worker generation only with checkpoint and evidence

## post-audit-retrofit.test.mjs
- zero-budget admission blocks unknown or paid work and enforces resource ceilings
- unknown external operation must reconcile before retry and deduplicates in scope
- requirement closure cannot claim verified without implementation tests and evidence

## projects-foundation.test.mjs
- project progress and Agency progress remain separate and N/A when denominator is unknown
- Next Up includes only evidence-backed ready work

## r3-evidence-recovery-hardening.test.mjs
- R3: invented company labels cannot qualify portfolio maturity
- R3: correlated or stale evidence cannot qualify portfolio maturity
- R3: recovery grant is atomically single-use and records exactly one evidence receipt

## recovery-scale-foundation.test.mjs
- backup architecture is encrypted, integrity-addressed and independently evidenced
- provider/dependency loss degrades locally and replacement never requires core rewrite
- long-horizon lifecycle covers birth through replacement without orphan authority/data

## rev3-categorized-agency-closure.test.mjs
- CCR-05826 persistent logical Project Agent identity survives worker replacement and rejects stale/unknown assignment
- CCR-05835 and CCR-05846 logical leadership handoff/failover preserve authority while rejecting same-holder or evidence-free transitions

## rev3-categorized-completion.test.mjs
- CCR-05830 immutable Agency context packet requires bounded tools/scope and rejects incomplete execution envelopes
- CCR-05839 owner precedent is bounded to same material context and never carries authorization

## rev3-categorized-gap-closure.test.mjs
- CCR-05845 Foundry onboarding manifest fails early on unknown/cyclic setup and groups valid unlock impact
- CCR-05850 historical project-container lineage preserves container membership without converting standalone evidence into container truth

## rev3-gap-closure.test.mjs
- CCR-05830 full execution context freezes owner rules, protected assets, tools, scopes, dependencies, acceptance and authorization snapshot
- CCR-05835 and CCR-05846 logical lead registry shape supports all scopes and preserves mission, authority, decisions, evidence, dependencies and next action across handoff/failover
- CCR-05843 governed Foundry lifecycle reaches post-launch only through acceptance
- CCR-05851 lost-artifact recovery exhausts authorized originals before explicitly labeled reconstruction
- CCR-05852 completeness report explicitly covers scope, conflicts, projects, missing artifacts, rename/merge/supersession lineage, privacy, unknowns and evidence

## route-state-closure.test.mjs
- unknown and malformed paths fail safely and deterministically

## runtime-integration.test.mjs
- disconnected runtime preserves unknown truth and never fabricates project totals

## runtime-surface-readers.test.mjs
- standard surface readers report registry facts without fabricating activity or balances

## security-foundation.test.mjs
- session lifecycle fails closed for lock, expiry, and revocation
- session lifecycle rejects pre-creation and backward timestamps

## social-foundation.test.mjs
- drafts require rights/provenance/approval and account changes invalidate approval
- platform rules are versioned profiles rather than core workflow constants
- analytics preserves freshness/provenance and estimated revenue cannot masquerade as confirmed

## specialists-foundation.test.mjs
- ARO opportunity admission requires real/open/AI-allowed/economic/executable/payable evidence

## task10-34-pif-family-authority-preservation.test.mjs
- Task 10: PIF integration preserves all 34 families one-for-one without replacement or a competing taxonomy

## task6-rev3-verified-preservation.test.mjs
- Task 6 preservation: every VERIFIED REV3 row retains requirement-specific implementation, tests, evidence, and source provenance

## task9-amendment20-current-authority-preservation.test.mjs
- Task 9: Amendment 20 remains the current controlling architecture amendment

## ui-shell-foundation.test.mjs
- progress never invents percentages when denominator is unverified or unknown
- PWA update lifecycle requires immutable candidate identity and preserves known-good rollback
- visual fixtures preserve approved structures under the current owner card rules

