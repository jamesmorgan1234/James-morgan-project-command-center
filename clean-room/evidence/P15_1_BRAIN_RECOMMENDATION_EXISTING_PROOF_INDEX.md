# P15.1 existing Brain/context/recommendation proof index

## agency-foundation.test.mjs
- persistent Project Agent survives worker replacement
- executor registry is extensible and obeys capability/project/risk/free-first
- task claim fencing technically rejects stale worker commit
- dependency scheduler exposes only ready work and safe stealing respects capability/anti-affinity
- Agency context packets are immutable/scoped and stale packets must revalidate
- Project Auto activation becomes real Working or a specific blocker, never indefinite queued fiction
- Agent Auto excludes portfolio-disabled and book projects
- Work ladder escalates only on capability/complexity and never on quota/provider/user/protected blockers
- dynamic lead assembly uses capability/authority/workload rather than hard-coded org chart
- high-risk executor cannot self-certify
- Shift Manager detects stale worker without falsely calling it active
- atomic stop increments generation and prevents stale late response resurrection
- protected preflight enforces project lock, health, fresh authorization, and credential scope

## analytics-foundation.test.mjs
- portfolio analytics separates project progress from Agency progress and preserves unknown denominator
- recommendations record outcomes and cannot self-install
- build-history lessons become evidence-backed proposals, never silent mutation
- analytics deduplication/recalculation is reproducible and privacy-safe

## books-foundation.test.mjs
- publication/live requires provider evidence and test orders never count as sales
- publishing providers are replaceable and expose truthful Work boundaries
- book performance keeps projected/confirmed/settled truth and dedupes IDs
- Books remain excluded from portfolio Agent Auto and Work remains publishing-only
- Books recovery scales with provenance and unresolved missing assets stay explicit

## brain-foundation.test.mjs
- Brain core separates intelligence output from canonical write authority
- AI routing preserves free-first/privacy/health and can replace providers
- context builder minimizes by owner/project/relevance/sensitivity/freshness
- plans distinguish evidence-backed facts from uncertainty
- specialist Brains and shared patterns remain registry-driven and scoped
- project workspace persists execution/evidence state independently of chat session
- owner precedent never inherits authorization and rejects material context differences

## category1-authority-ledger.test.mjs
- P1.6 rule ledger persists ID, scope, source, version, effective date, precedence, and explicit supersession lineage
- P1.6 rule precedence cannot silently decrease while advancing the current rule
- P1.6 conflict resolution is explicit, auditable, scoped, and cannot bypass current-rule supersession
- P1.6 ledger rejects malformed rule metadata before it enters authority history

## category1-authority-source-lineage.test.mjs
- P15.1 A00 stable source identity proves CCR-01901 CCR-01902 and CCR-01905 across provider repository and schema relocation

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

## category1-governance-policy-broadening.test.mjs
- P1 protected policy cannot broaden silently through missing or mismatched authorization

## category1-module-isolation-fault-containment.test.mjs
- P1 module isolation rejects duplicate canonical data and capability ownership without partial registration

## category1-p1-1-canonical-identifiers-lifecycle.test.mjs
- P1.1 lifecycle vocabulary schema covers every roadmap-required state domain including lineages

## category1-p1-10-extension-contracts.test.mjs
- P1.10 sample module, provider, and project type install and remove without cross-registry mutation
- P1.10 architecture source policy passes the clean-room source and rejects representative patch patterns

## category1-p1-2-registry-capability-fabric.test.mjs
- P1.2 capability fabric registers discovers enables disables and unregisters an extensible capability
- P1.2 capability registry fails closed on duplicate invalid and stale lifecycle mutations
- P1.2 capability discovery is data driven rather than hard coded to one capability key

## category1-p1-3-module-ownership-lifecycle.test.mjs
- P1.3 module contracts require explicit ownership lifecycle failure and verification declarations
- P1.3 declared dependency permits only explicitly declared cross-module data and capability access
- P1.3 dependency cycles are rejected on lifecycle contract replacement

## category1-p1-5-owner-governance.test.mjs
- P1.5 final owner authority and newest-instruction precedence fail closed for mismatched stale or conflicting authority
- P1.5 protected actions require fresh exact owner project account and resource authorization

## category1-p1-6-authority-ledger-governing.test.mjs
- P1.6 explicit revocation preserves source version reason and revocation lineage and leaves no governing rule
- P1.6 revocation and ledger state validation fail closed on malformed or stale authority mutations

## category1-runtime-resilience-contracts.test.mjs
- P1 graceful degradation distinguishes healthy degraded and unavailable outcomes
- P1 coherent cache rejects stale writes and never serves a mismatched source version
- P1 feature flags default off and unsafe enablement or stale replacement fails closed

## category1-version-lifecycle-contracts.test.mjs
- P1 capability and module lifecycle vocabularies are versioned explicit and fail closed on unknown states
- P1 install enable disable uninstall contracts enforce module policy and version advancement

## category13-authoritative-acceptance.test.mjs
- P13.1 cognitive/ecosystem health keeps missing data unknown and provenance/uncertainty explicit
- P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply

## category13-durable-governance-evidence.test.mjs
- C13 durable evidence covers metrics traces health outcomes learning security governance and evaluators
- P13.6 separates predicted actual process decision and transfer outcomes

## category13-operating-readiness.test.mjs
- P13.3 core journey instrumentation emits measurable starts and outcomes for every required journey
- P13.6 kill switches fail closed for required capabilities and rollback playbooks are defined

## category14-authoritative-acceptance.test.mjs
- P14.2 restore enforces current revocation privacy policy
- P14.5 historical recovery keeps unavailable CCR evidence visible
- P14.9 synthetic public fork excludes private credentials and owner policy and never publishes
- P14.10 future interface seam reuses canonical intent policy data and removes cleanly
- P14.12 long-horizon lifecycle leaves no orphan authority/data and never labels simulation as real

## category14-durable-recovery-lifecycle.test.mjs
- P14.1-P14.5 recovery migration replacement and historical evidence are durable
- P14.7 dormant state requires current-policy and revocation revalidation

## category15-a00-p1-4-command-runtime.test.mjs
- A00 P1.4 command-runtime idempotency and deduplication rows are strictly grounded

## category15-a00-p1-compatibility-module-isolation-policy-governance.test.mjs
- A00 compatibility, module-isolation and anti-policy-broadening rows are strictly grounded
- resolved A00 closure retains compatibility-isolation-policy verification while later clusters remain append-only

## category15-a00-p1-foundation-version-lifecycle.test.mjs
- A00 P1 foundation version/lifecycle rows are strictly grounded to canonical authority and exact-head evidence
- connection-gated provider lifecycle remains unpromoted until its activation prerequisite is actually satisfied

## category15-a00-source-grounding.test.mjs
- A00 grounding rejects missing row-level source provenance

## category15-nonproduction-contract-acceptance.test.mjs
- P15.14 composes real clean-room contracts in isolated nonproduction state without production providers

## category15-performance-load-soak.test.mjs
- Category 15 claim fencing soak rejects every stale worker generation

## category15-pwa-harness.test.mjs
- P15.14 lifecycle harness uses explicit loopback DevTools probing instead of Chrome profile-file discovery

## category15-release-artifact-audit.test.mjs
- Category 15 release artifact audit preserves clean-room runtime ownership and protected-asset fail-closed behavior

## category2-adversarial-recovery.test.mjs
- adversarial: privilege confusion and cross-owner/project access are denied
- adversarial: policy downgrade and unknown protected actions are denied
- adversarial: CI supply-chain seam is pinned and lifecycle scripts are disabled

## category2-database-hardening.test.mjs
- protected actions use server-owned policy and single-use session-bound authorization
- passkey removal consumes the canonical critical authorization before provider deletion

## category2-p21-auth-recovery.test.mjs
- P2.1 recovery requires an explicit provider recovery capability

## category2-p21-auth-risk.test.mjs
- P2.1 risky sessions fail closed until passkey-verified clearance
- P2.1 risk timestamps cannot move session time backward

## category2-p22-passkey-contract.test.mjs
- P2.2 unsupported WebAuthn never silently bypasses verification and fallback requires explicit provider sign-in

## category2-p24-policy-audit.test.mjs
- P2.4 allowed protected action appends exactly one auditable policy decision
- P2.4 policy denial is audited once before the protected action fails

## category2-p24-precondition-audit.test.mjs
- P2.4 revoked-device precondition failure still produces exactly one fail-closed auditable decision

## category2-p25-provider-replacement.test.mjs
- P2.5 provider replacement revokes the old reference and activates only reference metadata for the new provider
- P2.5 provider replacement preserves purpose and rejects reference metadata containing secret material

## category2-p25-secret-channels.test.mjs
- P2.5 restricted channels reject secret-bearing URL parameters even when the value is provider-agnostic
- P2.5 redaction removes recognized secret values while preserving non-secret context

## category2-p26-boundary-adversarial.test.mjs
- P2.6 canonical boundary allows the exact authorized owner/project/company/business/account/environment scope

## category2-p26-rls-contract.test.mjs
- P2.6 exposes only narrow authenticated boundary/project RPCs and keeps anon out

## category2-p27-protected-side-effects.test.mjs
- P2.7 stale verification blocks the protected side effect before authorization consumption

## category2-p28-incident-drill.test.mjs
- P2.8 incident and alert lifecycle timestamps cannot move backward

## category2-p29-adversarial-security.test.mjs
- P2.9 privilege confusion and unavailable policy both fail closed
- P2.9 prompt-injection or model content cannot be registered as protected authority
- P2.9 offline recovery cannot silently bypass provider recovery capability

## category2-policy-compatibility.test.mjs
- server policy preserves exact Sol Medium protected approval semantics

## category3-asset-validation.test.mjs
- asset replacement validates original state identity provenance and time before changing registry

## category3-canonical-lifecycle.test.mjs
- canonical lifecycle rejects backwards writes atomically and preserves verified zero

## category3-canonical-platform.test.mjs
- P3 canonical platform persists entities, provenance, assets, graph, and providers
- knowledge truth state preserves known zero versus unknown and N\/A with storage-level provenance integrity
- provider registry is replaceable metadata only and rejects raw secret-shaped configuration

## category3-context-exchange-persistence.test.mjs
- P3.10 persists immutable scoped context snapshots and artifact manifests
- P3.10 enforces owner, project, privacy and content-hash boundaries
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

## category3-historical-secret-boundary.test.mjs
- historical staging redacts secret text even when caller policy asks to keep it

## category3-historical-staging-persistence.test.mjs
- P3.8 historical export staging persists inventory without canonical activation
- P3.8 secret-shaped historical content must be redacted before storage
- P3.9 keeps project-container membership and standalone candidates distinct
- historical staging evidence is owner-readable and immutable to browser roles

## category3-lineage-validation.test.mjs
- historical graph validation detects cycles duplicate identities and incomplete bidirectional lineage

## category3-portability-validation.test.mjs
- portable round-trip freezes independent snapshots and rejects ambiguous provenance and sensitivity

## category3-post-audit-source-platform.test.mjs
- source registry uses stable provider identity and historical/untrusted content cannot grant instruction authority
- provenance separates observed effective and ingested time and preserves correction/retraction lineage
- derived lifecycle traces provenance and source invalidation deletes or restricts held derivatives
- paginated enumeration fails closed on cursor drift, source duplication, or changing provider snapshots
- provider capability drift is evidence-backed and regressions/pricing uncertainty fail visibly
- context snapshots exclude retracted, stale, cross-company/account/environment and wrong-purpose sources

## category3-postgres-execution.test.mjs
- canonical version conflict rollback zero and tombstone history
- ambiguous knowledge and failed inference leave verified truth current
- projection rebuild reconstructs canonical tombstones and rejects duplicate run identity
- asset originals remain missing and provider/protocol registries preserve versions
- branched historical staging preserves every node and container without canonical activation
- context snapshot checks content hash and owner and leaves canonical source untouched

## category3-privacy-restore-persistence.test.mjs
- derived payload material is durably separated from metadata-only audit history
- restricted and erased payloads cannot leak through the authenticated read policy

## category3-privacy-restore.test.mjs
- derived payload erasure preserves metadata-only audit history while removing payload material
- restore denies revoked missing expired or stale-policy authorization
- restricted restore cannot emit an active projection

## category3-provider-validation.test.mjs
- provider substitution preserves domain independence and malformed contracts fail before mutation

## category3-recovery-boundaries.test.mjs
- recovery rejects empty event identity and unknown-cost replacement while deterministic replay is stable

## category3-recovery-persistence.test.mjs
- projection recovery rebuilds only derived state and preserves prior projection on failure
- provider replacement validation honors capability and free-first gates without switching provider

## category3-refresh-recovery-persistence.test.mjs
- refresh checkpoint history preserves generations instead of overwriting recovery truth
- expectation capture derives exact downstream obligations from provenance after invalidation
- derived invalidation acknowledgement is exact evidence-backed and state-checked
- recovery blocks missing snapshots and pending acknowledgements before allowing resume

## category3-refresh-recovery.test.mjs
- changed refresh cannot complete until every dependent derived invalidation is acknowledged
- worker replacement cannot bypass pending derivative acknowledgements and resumes only after closure
- derived acknowledgements must match exact expected observation and resulting state
- acknowledgement evidence is required, unique and cannot predate the source checkpoint
- exact acknowledgement replay is idempotent while conflicting replay is rejected
- missing or unsuccessful checkpoints restart and stale checkpoint generations fail closed

## category3-scale-recovery.test.mjs
- P3.12 representative high-volume projection rebuild preserves exact sequence coverage
- P3.12 projection recovery fails closed on a gap even near the end of a large stream

## category3-source-persistence.test.mjs
- Category 3 retrofit persists source identity, provenance, derived lifecycle, provider drift, and refresh state
- source identity is stable, scoped, versioned, and historical or untrusted content stays data-only
- provider capability snapshots preserve verified capability truth and visibly classify breaking or unknown-pricing drift
- refresh leases use persisted generations and reject stale, expired, or conflicting commits while allowing exact lost-response replay

## category3-sync-reconciliation.test.mjs
- P3.6 persists sync events, conflicts, cursors, and a derived projection
- reconciliation never lets stale or ambiguous state silently overwrite newer truth

## category4-browser-navigation-runtime.test.mjs
- P4.3 shipped navigation owner controls history pushes and post-render restoration

## category4-browser-navigation.test.mjs
- P4.3 back captures outgoing scroll and delegates to browser history when available
- P4.3 restoration only accepts matching Command Center history state
- P4.3 no-history fallback remains absolute and deterministic
- location keys preserve query state and malformed history state fails closed

## category4-home-registry.test.mjs
- P4.4 a future Home tile registers through the context registry without changing renderer internals

## category4-project-detail-structure.test.mjs
- P4.8 approved book-specific Project Detail authority remains explicitly registered
- P4.8 generic Project Detail preserves shared approved structure without forcing book-only regions
- P4.8 approved Project Detail visual regions retain dedicated phone-first styling

## category4-visual-regression.test.mjs
- P4.8 retrievable approved Projects visual asset remains byte-exact and dimension-exact
- P4.8 shared visual language, geometry and owner interaction rules have a deliberate regression fingerprint

## category5-contract-parity-hardening.test.mjs
- P5.1 runtime project type contract matches durable key and array constraints
- P5.1 referenced project types cannot be removed and canonical status is mandatory
- P5.1/P5.2 generic replacement cannot bypass governed identity, authorization, or protected lifecycle seams
- P5.2 lineage replay is deterministic by occurredAt even when historical events arrive out of order
- P5.10 discovery requires nonblank unique provenance and disposition-specific target semantics
- P5.14 project registry remains generic at many-project scale without a fixed project list

## category5-durable-project-system.test.mjs
- P5.9 detail registry is project-type/capability extensible without core surgery
- P5.14 recovery preserves lineage/decisions/checkpoints and consumes fresh authorization for lifecycle changes
- P5.3 in-memory DAG and P5.4 checkpoint models remain fail-closed

## category5-project-registry-lineage.test.mjs
- P5.1 durable project registry extends Category 3 canonical truth instead of legacy project tables
- P5.1 generic type registration owns capabilities and detail-section relationships
- P5.2 durable lineage is append-only to browser roles and owner-decision governed

## category5-project-room-shell.test.mjs
- P5.9 shared project detail registry contains every universal project-room region including conversation
- P5.9 shipped Project Detail renders the universal shell and scopes cross-surface links to the project
- P5.9 generic Project Detail no longer hardcodes book-only Series or Publication Status

## category5-project-ui.test.mjs
- P5.6 runtime project screen filters and groups generically without project-name hardcoding
- P5.6 browser exposes generic project search/filter/group controls and project metadata
- P5 project controls preserve 48px accessibility and offline shell support

## category5-runtime-truth.test.mjs
- P5.7 browser requires evidence-bearing live execution instead of lifecycle status
- P5.7 selector rejects stale or unclaimed activity

## category6-ai-outage-persistence.test.mjs
- P6.14 runtime survives AI outage only when every required deterministic capability remains available

## category6-ai-provider-routing.test.mjs
- P6.2 durable AI routes extend the canonical provider registry instead of creating a second provider authority
- P6.2 durable routing enforces capability, free-first, privacy, health and quota eligibility
- in-memory Brain routing matches free-first/privacy/health/quota policy and provider replacement semantics
- P6.2 fallback models use the same eligibility filters and deterministic policy order
- P6.2 leaves fallback models empty when no eligible primary route exists

## category6-brain-adversarial.test.mjs
- P6.15 stale, sensitive, low-relevance and cross-project context is excluded
- P6.15 prompt-like protected instructions remain classified as requests, not side effects
- P6.15 provider disagreement/outage degrades truthfully with privacy/free-first boundaries
- P6.15 context overflow is bounded and exact referent ambiguity fails closed
- P6.15 durable Brain tables are browser read-only and key no-side-effect invariants are structural

## category6-brain-pwa-cache.test.mjs
- P6.7/P6.12 Brain conversation and voice runtime are explicit offline shell assets

## category6-brain-runtime-view.test.mjs
- P6.7/P6.8/P6.13 managed owner runtime reads canonical Brain conversations, workspaces and improvements
- P6.13 owner improvement decision and scope conversion use governed RPCs and never direct roadmap mutation
- P6.7/P6.13 shipped Brain route uses dedicated conversation and Improvements Center surfaces

## category6-browser-voice.test.mjs
- P6.12 Brain composer requires review/edit before persistence and never auto-submits a final transcript

## category6-context-builder-persistence.test.mjs
- P6.4 durable context build binds selection evidence to immutable owner/project snapshot
- P6.4 Context Builder filters cross-project, stale, sensitivity and low-relevance candidates

## category6-improvement-decisions.test.mjs
- P6.13 governed improvement decision closes the proposed->accepted/rejected gap without mutating roadmap

## category6-improvements-persistence.test.mjs
- P6.13 runtime improvement proposals require evidence/confidence and never install automatically

## category6-memory-governance.test.mjs
- P6.3 retention governance requires evidence and policy-consistent expiry

## category6-owner-precedent-persistence.test.mjs
- P6.11 material account, risk or cost differences block precedent reuse

## category6-planner-persistence.test.mjs
- P6.5 durable planner keeps truth classes, evidence/confidence and proposed actions separate from execution

## category6-project-workspace-persistence.test.mjs
- P6.8 durable project workspace is owner/project scoped, versioned, and resumable
- P6.8 workspace resumes exact verified state across versions and rejects stale writes

## category6-specialist-brains-persistence.test.mjs
- P6.6 durable specialist registry keeps scope, provenance, versions and deprecation explicit

## category7-agency-adversarial.test.mjs
- P7.24 duplicate schedulers and stale worker generations fail closed
- P7.24 context leakage, sensitivity overflow and stale context fail closed
- P7.24 portfolio and Work rules cannot silently broaden project scope or execution environment
- P7.24 high-risk executor cannot self-verify and conflicting parallel outputs cannot last-write-win
- P7.24 protected preflight rejects stale authorization, unhealthy provider, and credential-scope mismatch
- P7.24 durable control plane encodes network/provider/crash/replay/duplicate-effect safety structurally

## category7-agent-auto-portfolio.test.mjs
- P7.10 runtime eligibility rejects excluded projects and Books

## category7-auto-execution-transition-hardening.test.mjs
- P7.9 Project Auto preserves canonical P7.1 run transition evidence

## category7-autonomy-rights-persistence.test.mjs
- P7.14 runtime autonomy cannot amplify authority and protected decisions require separate authorization

## category7-canary-rollout.test.mjs
- P7.22 durable shadow/canary evidence recommends rollback on protected, duplicate, success, or verification regression without deploying

## category7-context-packets-persistence.test.mjs
- P7.7 durable context packet freezes full execution envelope and blocks stale/wrong-scope commit
- P7.7 runtime packet rejects sensitivity overflow and stale use

## category7-control-containment.test.mjs
- P7.19 runtime pause preserves generation while stop fences stale responses

## category7-delegation-persistence.test.mjs
- P7.15 durable delegation is depth/fan-out bounded, capability matched and non-amplifying

## category7-dependency-scheduler-persistence.test.mjs
- P7.6 durable dependency scheduler requires same-project existing dependencies and stable readiness ordering
- P7.6 runtime scheduler unlocks only verified/skipped dependencies and safe stealing respects capability/anti-affinity

## category7-durable-provider-callback-hardening.test.mjs
- R4 callback signature binds provider bytes and callback metadata in one canonical envelope
- R4 process memory is not authoritative for callback dedupe or ordering
- R4 durable inbox serializes provider/account streams and survives process restart
- R4 lost or uncertain external effects reconcile from evidence instead of fabricated success

## category7-dynamic-organization.test.mjs
- P7.13 durable organization formation is capability/authority/risk/workload/project-type driven

## category7-executor-registry-persistence.test.mjs
- P7.2 runtime registry remains capability/risk/free-first driven and replaceable

## category7-independent-verification.test.mjs
- P7.16 durable verification enforces separation of duties for high/critical risk
- P7.16 runtime high-risk executor cannot self-certify

## category7-post-audit-distributed-work.test.mjs
- delegated authority binds identity and immutable scope, attenuates zero-budget resources, and revalidates current policy
- durable delegation authority keeps Command Center on top and blocks scope, spend, resource, and stale-policy amplification

## category7-project-agent-persistence.test.mjs
- P7.1 durable Project Agent is server-authoritative, versioned, generation-fenced, and checkpoint scoped
- P7.1 runtime Project Agent state survives worker replacement semantics

## category7-project-auto-persistence.test.mjs
- P7.9 durable Project Auto binds one exact project/checkpoint/generation and returns working or truthful blocker
- P7.9 runtime Project Auto never drifts projects or fakes queued state

## category7-protected-preflight.test.mjs
- P7.20 runtime protected preflight rejects wrong project, stale auth, provider health and credential scope

## category7-resource-quota-usage-governor.test.mjs
- A10.3 reservations serialize a provider-specific bucket and atomically account reserved capacity
- fallback providers cannot share another provider
- A10.5 provider usage receipts have stable dedupe identity and reject changed receipt payloads
- A10.5 reconciliation aggregates provider receipts and only matched truth becomes reconciled

## category7-run-job-task-state.test.mjs
- P7.1 durable Agency state models make queued/working/completed semantics explicit

## category7-scheduler-leadership-persistence.test.mjs
- P7.3 runtime rejects split-brain leadership and stale fencing tokens

## category7-side-effect-outbox-inbox.test.mjs
- unknown external outcomes must reconcile to no-effect or succeeded before retry
- provider inbox deduplicates stable event identity and rejects changed payload scope or effect binding
- provider sequence regression is retained as out-of-order rather than auto-applied
- inbox application is idempotent and scoped to an owner project effect

## category7-task-claims-persistence.test.mjs
- P7.4 durable task claims reject stale/expired workers and enforce idempotent single commit
- P7.4 runtime task claim fencing rejects stale worker after reclaim

## category7-work-ladder-persistence.test.mjs
- P7.12 durable Work ladder only escalates capability/complexity within explicit scope and never auto-launches Work

## category8-postgres-execution.test.mjs
- P8.1 persists one occurrence, completes atomically once, and keeps immutable history
- P8.2 preserves provider identity and immutable reconciliation evidence
- P8.6 onboarding completion is pinned to exact project/spec requirement and immutable
- P8.7 search projections enforce owner-scoped RLS and durable provenance
- P8.8 notification acknowledgement history is immutable
- P8.10 watch observations are unique and transition history cannot authorize protected effects

## category8-runtime-integration.test.mjs
- Category 8 runtime closes P8.6 Foundry spec-to-manifest generation and early Needs Me projection
- Category 8 runtime closes P8.7 provider federation, index refresh boundary, permission/provenance filtering and conflict detection
- Category 8 runtime closes P8.8 shared preferences, cross-device acknowledgements and replaceable delivery

## current-authority-manifest.test.mjs
- current resume authority must record resumed R1 state and reject stale pause text

## current-requirement-classification.test.mjs
- CCR-00001 preserves F-0001 and historical A06 while current authority resolves it to A00
- current classification fails closed when historical provenance does not match the immutable overlay anchor
- effective A00 membership includes CCR-00001 without rewriting the 489-row historical A00 scope

## data-platform-foundation.test.mjs
- knowledge ledger requires provenance and explicit supersession and never treats inference as verification
- provider registry supports replaceable capability adapters without core surgery

## data-platform-recovery.test.mjs
- sync reconciliation rejects stale state and exposes equal-version conflicts
- P3.6 stale-record detection preserves current truth and ignores an exact replay
- historical export staging preserves every mapping node, branch point, and project-container identity
- context snapshots inherit scope and sensitivity and exclude cross-project/secret sources
- projection rebuild fails on gaps and provider replacement honors capability and free-first gates

## finance-foundation.test.mjs
- financial accounts normalize provider identity and reject duplicates
- credit facts identify provider/model/date and recommendations never forecast score
- financial provider recovery rejects stale/conflicting same-time snapshots

## finance-platform-foundation.test.mjs
- financial provider platform separates connection/consent/health/capability scopes
- financial scenarios separate verified inputs from assumptions and promise no outcome

## owner-auth-proxy-routing.test.mjs
- direct Supabase owner provider defaults to volatile storage and never touches localStorage

## owner-passkey-management-runtime.test.mjs
- passkey removal authorizes, consumes once, then deletes the provider credential

## owner-session-environment-binding.test.mjs
- project-ref mismatch and pinned configuration-digest mismatch fail before provider fetch
- issuer and audience returned by provider must match trusted binding

## p10-1-identity-hardening.test.mjs
- P10.1 rename/reconnect preserves canonical identity and immutable historical aliases/lineage
- P10.1 alternate account alias company/project invalid platform time and version cannot substitute
- P10.1 actual PostgreSQL prevents cross-version cross-brand substitution and retains immutable history

## p10-1-social-identity-map.test.mjs
- P10.1 identity map preserves explicit owner/entity/company/brand/project/account/platform lineage

## p10-2-connection-hardening.test.mjs
- P10.2 canonical provider account mismatch and secret-like credential metadata reject
- P10.2 PostgreSQL binds connection evidence to canonical identity and preserves recoverable history

## p10-2-social-connections.test.mjs
- P10.2 live status requires connected state available provider credential reference token fresh verification and scopes

## p10-3-draft-hardening.test.mjs
- P10.3 exact target history and time semantics preserve versions and isolate company/project
- P10.3 durable draft/asset/approval migrations execute with exact canonical scope and immutable history

## p10-3-social-drafts-assets.test.mjs
- P10.3 every source asset requires exact provenance and rights binding
- P10.3 publishing seam refuses stale approval after content/account drift
- P10.3 durable schema preserves immutable owner-scoped draft asset rights provenance and approval bindings

## p10-4-profile-hardening.test.mjs
- P10.4 provider constraint changes enforce metadata rights schedule and capabilities without changing core
- P10.4 unknown rules deprecated policies and owner key collisions fail closed
- P10.4 PostgreSQL profile policy cannot bind another platform adapter or mutate historical evidence

## p10-4-social-platform-profiles.test.mjs
- P10.4 historical adapter/profile versions remain reproducible
- P10.4 malformed adapter output fails closed against profile rules

## p10-5-publish-hardening.test.mjs
- P10.5 wrong target content stale/revoked authority policy and provider loss fail closed
- P10.5 revocation/provider loss/expiry during durable persistence prevents dispatch and retains fence

## p10-6-social-inbox.test.mjs
- P10.6 provider source replay cannot substitute a different message

## p10-7-analytics-hardening.test.mjs
- P10.7 collection of old observations does not manufacture freshness; zero differs from unknown partial conflicting
- P10.7 no confirmed revenue without exact independently verified non-test outcome or causal attribution proof
- P10.7 SQL rejects nonfinite values and unsupported revenue; test receipts cannot become real outcomes

## p10-7-social-analytics.test.mjs
- P10.7 metric evidence preserves identity provenance confidence and freshness policy
- P10.7 estimated revenue cannot masquerade as confirmed monetary outcome
- P10.7 snapshot keeps confirmed revenue separate from estimated outcomes

## p10-8-boundary-hardening.test.mjs
- P10.8 social access is minimal and cannot inherit another company/project/account or credentials
- P10.8 contained revoked stale expired and missing capability deny read/write

## p10-8-postgres-isolation.test.mjs
- one account capability reads one company and cannot read/mutate another company
- company/project/session/owner substitution expiry revocation and containment deny

## p10-8-social-recovery-isolation.test.mjs
- P10.8 social isolation prevents account/platform identity crossing company project or brand boundaries
- P10.8 provider outage waits for provider and never invents owner reconnect requirement

## p11-1-books-registry.test.mjs
- P11.1 registry preserves author project hierarchy title order and formats
- P11.1 canonical book lineage cannot silently substitute owner project author type hierarchy or role

## p11-10-book-recovery.test.mjs
- P11.10 missing artifacts remain explicit and cannot pretend to have file/hash evidence
- P11.10 reconstructed artifacts retain explicit reconstruction provenance
- P11.10 export/restore provider migration requires matching manifest and verification evidence
- P11.10 durable recovery/archive/export/migration evidence is immutable owner-scoped and provenance-preserving

## p11-10-book-restore-integrity.test.mjs
- P11.10 restore preserves compatibility provenance approvals publication and protected assets

## p11-2-book-assets.test.mjs
- P11.2 authoritative protected asset is explainable by exact file hash provenance and approval

## p11-3-book-qa.test.mjs
- P11.3 latest requirement evidence governs assessment and cannot be bypassed by stale pass

## p11-4-book-metadata-rollout.test.mjs
- P11.4 pricing recommendations require explicit evidence and package readiness blocks missing format pricing
- P11.4 metadata rollout and pricing cannot cross owner/project boundary

## p11-4-book-publication-metadata-details.test.mjs
- P11.4 recommendations are not approvals and approved prices require explicit approval lineage

## p11-5-book-approval-state-machine.test.mjs
- P11.5 discussion brainstorming and generated alternatives cannot mutate protected approval state
- P11.5 durable protected approval lifecycle is immutable owner-scoped and covers required states and kinds

## p11-6-book-publication-lifecycle.test.mjs
- P11.6 lifecycle exposes every locked publication state
- P11.6 live requires exact provider listing receipt publication ref timestamp and evidence
- P11.6 history begins not_prepared and fails closed on illegal jumps or listing substitution
- P11.6 durable lifecycle is immutable and owner-scoped

## p11-6-book-publication.test.mjs
- P11.6 submitted review and live states require provider receipts and lifecycle timestamps
- P11.6 publication history only advances through allowed evidence-backed states
- P11.6 invalid jumps and provider publication substitution fail closed
- P11.6 durable publication history is immutable owner-scoped and requires provider evidence for live truth

## p11-7-book-provider-connections.test.mjs
- P11.7 connected providers require credential references and expose format/capability contracts
- P11.7 provider replacement requires migration lineage
- P11.7 durable provider connection evidence is owner-scoped and immutable

## p11-7-book-providers.test.mjs
- P11.7 publishing providers are versioned adapters and can be replaced without Books core changes
- P11.7 provider health is truthful and unavailable providers are never routed
- P11.7 every capability must declare exact execution boundary
- P11.7 exact historical provider adapter version remains addressable
- P11.7 durable provider adapter history is immutable owner-scoped and boundary-explicit

## p11-8-book-performance-truth.test.mjs
- P11.8 dedupe prevents double counting imported provider rows
- P11.8 estimated/disputed/adjusted truth and exact edition/provider/marketplace scope validate

## p11-8-book-performance.test.mjs
- P11.8 performance metrics preserve source dates scope provider record and truth class
- P11.8 projected confirmed and settled metrics reconcile separately
- P11.8 performance summary never counts projected sales as confirmed and keeps projected royalties separate
- P11.8 durable performance evidence is immutable owner-scoped and preserves projected confirmed settled truth

## p11-9-book-boundary-coverage.test.mjs
- P11.9 portfolio Agent Auto remains excluded

## p11-9-book-execution-boundaries.test.mjs
- P11.9 portfolio Agent Auto remains excluded
- P11.9 project-specific Agent can work only inside declared exact scope
- P11.9 execution policy cannot cross owner/project scope
- P11.9 durable execution-boundary decisions are immutable owner-scoped and preserve Agent/Work rules

## p12-1-specialist-framework.test.mjs
- P12.1 generic specialist framework covers ownership data hooks surfaces metrics providers isolation and canonical authority
- P12.1 future specialist type registers without project-name core edits while remaining PIF.3 bound
- P12.1 missing ownership data/detail/provenance or canonical specialist reference fails closed

## p12-2-shopping-specialist.test.mjs
- P12.2 trip priority can prefer lowest cash today separately from lowest final cost

## p12-3-media-specialist.test.mjs
- P12.3 media source requires rights and provenance
- P12.3 autonomous worker boundary blocks portfolio-wide mode

## p12-4-commerce-specialist.test.mjs
- P12.4 store and supplier accounts are isolated per commerce project
- P12.4 product economics must use supplier bound to exact project
- P12.4 catalog supplier pricing fulfillment marketing and revenue state cannot cross project boundary
- P12.4 durable commerce evidence preserves store supplier project isolation and non-loss economics

## p12-5-digital-products-specialist.test.mjs
- P12.5 durable digital-product evidence preserves artifact identity delivery pricing and source evidence

## p12-6-service-business-specialist.test.mjs
- P12.6 service-business projects register generically without hard-coded company logic
- P12.6 CRM ownership remains isolated across service-business projects
- P12.6 lead-to-job state and linked records stay company/project scoped

## p12-6-service-business.test.mjs
- P12.6 service-business archetype registers without project-name hard coding
- P12.6 company/project data stays isolated

## p12-7-software-platform-specialist.test.mjs
- P12.7 software-platform projects register generically without hard-coded product identity
- P12.7 repository ownership remains isolated across software-platform projects
- P12.7 roadmap repository deployment provider analytics support and monetization state stay exact-project scoped
- P12.7 durable software-platform evidence preserves company source context and exact deployment binding

## p12-7-software-platform.test.mjs
- P12.7 software-platform archetype registers future software projects without Torevi-specific core
- P12.7 repository and company/project state remain isolated
- P12.7 deployment evidence binds exact repository provider commit and environment

## p12-8-canonical-authorization-postgres.test.mjs
- P12.8 actual PostgreSQL rejects malformed authorization in both durable history surfaces

## p12-8-interoperability-postgres.test.mjs
- P12.8 PostgreSQL durable decision adapter is immutable, scoped, replay-safe and unavailable to ordinary clients
- P12.8 canonical PostgreSQL model batches append PIF.3 lineage and roll back every row on conflict
- P12.8 PostgreSQL lifecycle versions reject invalid activation, identity substitution and recovery resurrection

## p12-8-interoperability.test.mjs
- P12.8 private project/company/owner learning cannot leak to unrelated recipients
- P12.8 persistence loss, concurrent revocation, stale restore and digest collisions never return acceptance
- P12.8 unsafe evolution rejects atomically: stale versions, duplicates, missing need, authority, ontology, scope and budget
- P12.8 canonical lifecycle rejects unsafe transitions and tuple-key collisions without mutation
- P12.8 lifecycle integrates exact C2 plan approval and cannot expand a project session
- P12.8 collaboration discovery selects compatible scoped specialists deterministically without private context
- P12.8 durable evolution storage failure leaves all canonical in-process models unchanged

## p12-8-specialist-lifecycle-isolation.test.mjs
- P12.8 canonical specialist truth cannot collide across projects
- P12.8 lifecycle mutations require exact action authorization and provider reactivation readiness
- P12.8 provider loss is isolated and does not silently rewrite project truth
- P12.8 durable lifecycle evidence is owner-isolated immutable recoverable and future-registration capable
- P12.8 canonical projection contract forbids project override of specialist truth owner and isolation class

## p12-8-specialist-lifecycle.test.mjs
- P12.8 new specialist types/projects register without kernel surgery
- P12.8 provider loss fails locally and does not alter unrelated specialists
- P12.8 rename and merge require exact owner/project/action authorization
- P12.8 dormant activation fails closed until required providers are available
- P12.8 all protected lifecycle transitions reject noncanonical evidence without mutating state

## p13-1-semantic-metrics.test.mjs
- P13.1 semantic registry preserves zero versus unknown/absent/N/A/deleted/stale/conflicting
- P13.1 versions prevent semantic collision and historical replay pins the original formula
- P13.1 rejects stale/future/incompatible unit/window/scope/benchmark and conflicting duplicate observations

## p13-10-adversarial-scale.test.mjs
- P13.10 semantic display exposes stale history explicitly and cannot render it as a current number
- P13.10 real C2 session/policy and exact Brain capability govern reads/exports, never analytics confidence

## p13-10-evaluator-accuracy.test.mjs
- P13.10 synthetic/replay/production scores cannot be blended to manufacture production acceptance

## p13-2-scoped-trace.test.mjs
- P13.2 cross-company/project/Brain parents, payloads, id collisions and stale retention fail closed

## p13-5-agency-routing.test.mjs
- P13.5 routing regret distinguishes decision-time quality from later luck and excludes unavailable alternatives

## p13-7-failure-procedure.test.mjs
- P13.7 failure/negative knowledge retains scope/version/recurrence sources and proposes without applying

## p13-8-security-correlation.test.mjs
- P13.8 agreement sharing any source/provider/model/benchmark/assumption/artifact is discounted transitively

## p13-9-governance-critic.test.mjs
- P13.9 critic finds duplicate ownership, missing dependencies, stale versions and unverified claims

## p13-durable-analytics.test.mjs
- P13.2/P13.6–P13.10 all durable projections preserve version/scope/benchmark and reject unsafe payloads
- P13.10 canonical evaluator registration/results reuse PIF.7, reject stale versions and preserve immutable history

## p14-1-encrypted-backup.test.mjs
- P14.1 credentials, cross-project, duplicate, denied, missing evidence, stale and superseded policies reject

## p14-10-canonical-interface.test.mjs
- P14.10 competing command/policy/data runtimes, nonremovable/unknown interfaces and ambiguous intent fail closed

## p14-11-shadow-chaos.test.mjs
- P14.11 twelve actual isolated fault injections fence stale workers/leaders and resume a serialized verified checkpoint to baseline truth

## p14-12-long-horizon-revalidation.test.mjs
- P14.12 actual data/module/project, provider and Agency-role lifecycles preserve failure/recovery/migration/removal with no orphan state
- P14.12 counterfactual infrastructure separates observed facts/correlations/assumptions/interventions/sensitivity from simulated outcomes and unproven causality

## p14-2-isolated-restore.test.mjs
- P14.2 revoked/expired/superseded/privacy/deleted/invalid evaluator states remain historical; rejection leaves workspace unchanged

## p14-3-transactional-migration.test.mjs
- P14.3 transactional forward migration preserves identity/history, restart is idempotent, rollback keeps erasures historical
- P14.3 partial failure, stale source, bad compatibility, authority/scope changes leave canonical staging unchanged

## p14-4-portable-replacement.test.mjs
- P14.4 provider/AI/storage/hosting/integration/model replacement preserves canonical registry identity and exposes stale PIF dependencies
- P14.4 paid/unknown/unavailable/retired/compromised/incompatible/scope/stale/permission expansion rejects before mutation

## p14-6-capacity-under-load.test.mjs
- P14.6 actual 10x/100x workloads preserve all twelve workload classes across 100 companies/1000 projects with deterministic budget backpressure
- P14.6 degraded provider backpressures all units; duplicates/invalid budgets fail instead of loss; migration under load remains atomic

## p14-7-dormant-revalidation.test.mjs
- P14.7 aged capability/specialist/procedure/promotion re-enters ordered stages with canonical-owner handoff, never automatic activation
- P14.7 revoked/archived/obsolete/stale/private/incompatible/paid/disconnected/out-of-order state stays inert

## p14-8-future-tenant.test.mjs
- P14.8 synthetic tenant/household/user/role/project filters preserve owner privacy without enrollment

## p14-9-synthetic-fork.test.mjs
- P14.9 source mutation, mislabeled public data/credential/policy, real private refs and duplicate identities reject

## p14-durable-recovery.test.mjs
- P14.1 durable representative encrypted artifact executes migration chain, source binding and idempotent scoped storage
- P14.1/P14.6 expired encrypted backup retention purges scoped payload exactly once while preserving immutable metadata history

## p14-security-boundaries.test.mjs
- P14 real C2 current session/policy and exact owner grant control recovery; no confidence or historical grant bypass

## p15-1-auth-session-resume.test.mjs
- P15.1 valid session survives a fresh provider instance without duplicate authentication
- P15.1 expired refresh returns to authentication and successful retry resumes without frozen state
- P15.1 expired session with provider outage cannot load private data and later retry recovers
- P15.1 simultaneous authentication retries share one prompt and session establishment

## p15-1-auth-shell-privacy.test.mjs
- P15.1 public shell is route independent and strips all disconnected private projections
- P15.1 new loads clear prior projections and discard older completions and thrown provider errors

## p15-1-authority-traceability-boundary.test.mjs
- P15.1 single architecture authority accepts the current integrated roadmap and preserves historical classification
- P15.1 competing historical missing or owner-mismatched architecture authorities fail closed

## p15-1-current-traceability.test.mjs
- P15.1 current corrections repair three stale references without rewriting historical fragment evidence

## p15-1-feature-safety-boundary.test.mjs
- P15.1 valid feature flags retain explicit safe enablement stale-write rejection and unknown-off defaults

## p15-1-financial-runtime-boundary.test.mjs
- P15.1 financial runtime rejects truthy flags, duplicate/blank accounts, empty provider and duplicate evidence without mutating caller state

## p15-1-governance-runtime-boundary.test.mjs
- P15.1 malformed authorization timestamps return a denied decision without executing operations

## p15-1-ledger-value-isolation.test.mjs
- P15.1 authority ledger snapshots caller values before recording history
- P15.1 unserializable authority values reject before changing governing or conflict history

## p15-1-module-contract-isolation.test.mjs
- P15.1 module registration snapshots caller-owned reference arrays before authority decisions
- P15.1 module read surfaces cannot mutate ownership dependencies permissions or lifecycle evidence
- P15.1 module lifecycle flags must be explicit booleans before registration or replacement

## p15-1-protected-asset-authority.test.mjs
- P15.1 locked synthetic asset accepts only an explicit true snapshot with a nonblank decision reference
- P15.1 synthetic asset authorization cannot change owner project creation identity or stale version rules

## p15-1-startup-watchdog.test.mjs
- P15.1 startup watchdog fails hung initialization once without private readiness and ignores stale deadlines
- P15.1 Recovery renders and retries with no Brain Agent Analytics integrations or owner-data mutation

## p8-1-personal-tasks.test.mjs
- P8.1 completion history survives restart and exact occurrence cannot complete twice
- P8.1 rejects noncanonical execution identity and cross-owner/project persisted rows
- P8.1 task search stays owner/project scoped and preserves priority/due-date truth

## p8-10-condition-watches.test.mjs
- P8.10 duplicate and stale verified observations cannot trigger effects
- P8.10 safe-action policy still cannot authorize a protected action

## p8-11-privacy-recovery.test.mjs
- P8.11 restore dry-run preserves completed histories and never grants replay/action authority
- P8.11 owner/project/domain/sensitivity/integrity/provenance boundaries fail closed
- P8.11 historical, revoked, expired/stale, or embedded authority cannot resurrect
- P8.11 provider loss, offline/stale state, time boundaries, and rollback idempotency defer safely
- P8.11 durable schema stores immutable provenance/history with owner-scoped RLS and no action authority

## p8-2-calendar-reconciliation.test.mjs
- P8.2 reconciles newer provider edits, ignores stale snapshots, and surfaces equal-version conflict
- P8.2 refuses reconciliation across owner/provider/external identity boundaries
- P8.2 durable schema preserves provider identity, reconciliation evidence, and owner isolation

## p8-3-personal-operations.test.mjs
- P8.3 keeps specialist-owned shopping as a read-only projection
- P8.3 durable schema stores scoped projections without creating another specialist truth store

## p8-4-contacts-followup.test.mjs
- P8.4 recommendations never copy sensitive relationship context or authorize sends
- P8.4 durable schema keeps relationship context scoped and creates no send authority

## p8-5-needs-me.test.mjs
- P8.5 resolved needKey survives restart and duplicate blocker cannot reprompt

## p8-7-universal-search.test.mjs
- P8.7 query-time permissions, project/domain scope, provenance, and freshness all gate results
- P8.7 deletion propagation removes a previously searchable projection immediately at query time
- P8.7 legacy public projections remain searchable without a permission list
- P8.7 durable schema stores only owner-scoped search projections with permissions, freshness, provenance, and tombstones

## p8-8-notifications.test.mjs
- P8.8 flood routing preserves critical signal and bundles/dedupes within owner scope
- P8.8 acknowledged intents do not re-notify and acknowledgements require evidence
- P8.8 durable schema records intents, routing receipts, and immutable acknowledgements without sensitive payload duplication

## p8-9-scheduled-automation.test.mjs
- P8.9 catch-up is explicit, deduplicated, ordered, and bounded

## p9-1-account-provider-rebind.test.mjs
- rebind preserves canonical identity financial truth and immutable provider lineage
- target collisions and historical alias duplicate registration cannot split canonical accounts
- read rebind grants no action capability and copies no credential material
- provider loss or degradation and missing consent/scope cannot mutate canonical state
- owner mismatch stale versions and secret-bearing metadata fail before mutation

## p9-1-financial-data-foundation.test.mjs
- P9.1 canonical primitives carry provenance, freshness, confidence, and cannot authorize actions
- P9.1 provider-specific payload is consumed at the adapter boundary and not leaked to domain record
- P9.1 consent, reconnect, freshness, provider identity, and provenance are explicit
- P9.1 stale/disconnected state remains visible without destroying financial history
- P9.1 projected versus realized state is explicit and projected values require visible assumptions
- P9.1 durable foundation is append-only, owner-scoped, provenance-preserving, and exposes current/history separation

## p9-2-accounts-net-worth.test.mjs
- P9.2 pending and stale positions are visible but excluded from verified net worth
- P9.2 ownership, asset/liability class, currency and provenance are explicit and action-neutral
- P9.2 reconciliation accepts newer truth, rejects stale truth, dedupes exact replay, and surfaces same-time conflict
- P9.2 reconciliation cannot cross owner or canonical account/provider identity

## p9-3-transactions-cashflow.test.mjs
- P9.3 exact duplicate provider events dedupe while merging every raw-source lineage reference
- P9.3 pending-to-posted lifecycle selects one canonical current transaction without double-counting
- P9.3 owner correction changes classification projection without erasing original raw truth

## p9-3-transfer-dedup-cashflow.test.mjs
- P9.3 dedup and pending-posted reconciliation preserve raw-source lineage

## p9-4-recurring-obligations.test.mjs
- P9.4 corrections fail closed across owner/obligation scope and against stale correction time

## p9-5-credit-platform.test.mjs
- P9.5 every canonical score/factor/account carries provider model report date and report identity
- P9.5 report snapshot rejects cross-owner, cross-provider, cross-model, cross-date or cross-report children
- P9.5 credit refresh preserves pending/unavailable and derives fresh versus stale from report observation
- P9.5 credit data is isolated from unrelated contexts and cross-owner access
- P9.5 recommendations remain factor-evidenced and never forecast a score

## p9-6-goals-debt-scenarios.test.mjs
- P9.6 recommendations require verified evidence and never promise score/outcome changes
- P9.6 durable scenarios are append-only, owner-scoped and prohibit score/outcome promises

## p9-7-protected-financial-actions.test.mjs
- P9.7 analysis recommendation and automation cannot authorize money movement
- P9.7 stale consumed mismatched or replayed authorization fails closed
- P9.7 provider health must be available and immediately fresh
- P9.7 authorization is exact across owner kind provider accounts amount hash and reference

## p9-8-financial-identity-isolation.test.mjs
- P9.8 finance access requires owner/domain/scope/auth isolation and minimizes released context
- P9.8 context minimization fails closed when requested classes are not authorized

## p9-8-postgres-isolation.test.mjs
- revocation containment expiry company project and session substitution deny existing rows
- immutable audit survives denied mutation and capabilities confer no action authority

## p9-8-server-capability.test.mjs
- P9.8 server capability minimizes context and never grants action authority
- P9.8 compromised domain cannot self-assert finance scopes or borrow another session capability
- P9.8 personal company project and owner scopes are exact

## p9-9-durable-attempts.test.mjs
- provider receipt scope mismatch null fields and wrong account or amount cannot invent success
- provider unavailable timeout degradation compromise permission capability and credential loss block before reservation
- stale restored consumed mismatched amountless and recommendation authority fail closed
- partial success requires reconciliation; unchanged action hash cannot create a duplicate attempt

## p9-9-fault-injection.test.mjs
- P9.9 provider errors permission credential capability loss and compromise retain last known truth
- P9.9 provider loss and changed canonical identity cannot certify a relink
- P9.9 restoration revalidates live session/capability instead of trusting historical flags

## p9-9-finance-recovery-evidence.test.mjs
- P9.9 provider error stale balance partial sync duplicate and compromise fail closed
- P9.9 integrity or provenance failure rejects restore even when provider is healthy
- P9.9 restore requires verified evidence and available provider
- P9.9 uncertain protected action never replays and requires receipt/provider reconciliation

## personal-ops-foundation.test.mjs
- contact follow-up recommendations never authorize sends
- Needs Me dedupes one owner action across linked work and ranks unlock impact
- universal search enforces owner/domain/project/sensitivity and provenance
- notification routing dedupes, honors quiet, and minimizes sensitive content

## pif-integrated-hardening.test.mjs
- PIF hardening blocks cross-Brain memory leakage and private trace widening

## pif1-shared-intelligence-contracts.test.mjs
- PIF.1 validates one shared intelligence envelope without replacing the C3 knowledge claim
- PIF.1 rejects ambiguous identity, missing provenance, incompatible ontology, invalid causality, and unauthorized scope
- legacy KnowledgeLedger remains compatible and is not forced into PIF.1 metadata
- PIF.1 storage extends command_center_knowledge_claims instead of creating a second claim store
- canonical shared knowledge rejects non-finite confidence at exchange boundary

## pif10-improvement-recovery.test.mjs
- PIF.10 stale restore is blocked by current policy/revocation revalidation

## pif2-capability-method-portfolio.test.mjs
- PIF.2 keeps competing methods side by side and routes by current context instead of a universal default
- PIF.2 enforces applicability, prerequisites, contraindications, cost, privacy, resource and revalidation gates
- PIF.2 validates evidence, lifecycle, rollback, version replacement and fallback safety
- PIF.2 durable schema is a method portfolio under existing capability ownership

## pif3-specialist-model-registry.test.mjs
- PIF.3 project projections cannot expand canonical project, data, capability, or permission authority
- PIF.3 durable schema extends the existing C6 specialist Brain owner instead of creating a competing identity table

## pif4-learning-promotion.test.mjs
- PIF.4 accepts evidence-rich scoped learning and emits non-executable promotion decisions
- PIF.4 never lets private, stale, contradicted, or not-yet-validated learning become global operational truth
- PIF.4 promotion is reversible and keeps immutable decision versions
- PIF.4 durable schema stores immutable packet versions and governed decisions without direct policy install

## pif5-epistemics.test.mjs
- PIF.5 newer low-authority evidence cannot erase higher-authority knowledge
- PIF.5 source confidence is bounded and invalid evidence confidence fails closed
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
- PIF.8 durable schema versions negative knowledge and transfer/revocation decisions

## pif9-trace-dependency.test.mjs
- PIF.9 exact dependency compatibility fails closed before stale versions are used

## post-audit-isolated-vertical-proof.test.mjs
- authorized protected action crosses live session, immutable intent, central policy, operation, worker fencing, and evidence closure
- protected path fails closed for cross-company scope, stale session, unavailable policy, stale revocation truth, and mutated intent
- duplicate request and lost provider response cannot create blind duplicate side effects

## post-audit-retrofit.test.mjs
- capability maturity requires real independent-company proof
- execution scope cannot widen across company/project/environment
- unknown external operation must reconcile before retry and deduplicates in scope
- protected action binds company account environment policy epoch and exact intent
- webhook gate rejects forged cross-account and stale callbacks and defers replay/order truth to durable persistence
- owner-session broker has no hardcoded production project and uses server-only identity config

## projects-foundation.test.mjs
- project types and projects register without project-engine surgery
- project progress and Agency progress remain separate and N/A when denominator is unknown
- project detail sections extend by registration without renderer injection
- project discovery flags near-duplicate missions and owner controls disposition

## r3-evidence-recovery-hardening.test.mjs
- R3: invented company labels cannot qualify portfolio maturity
- R3: correlated or stale evidence cannot qualify portfolio maturity
- R3: proof receipts must match exact capability version and declared companies

## recovery-scale-foundation.test.mjs
- provider/dependency loss degrades locally and replacement never requires core rewrite
- historical recovery cannot be called complete until machine-readable scope exactly closes
- dormant capability re-enters configure-connect-authorize-enable without kernel rewrite
- commercial/public fork excludes James private data, secrets and owner-specific policy
- future interfaces reuse canonical command/policy/data runtimes and remove cleanly
- distributed chaos requires fencing and verified checkpoint resume with no stale mutation
- long-horizon lifecycle covers birth through replacement without orphan authority/data

## rev3-categorized-agency-closure.test.mjs
- CCR-05826 persistent logical Project Agent identity survives worker replacement and rejects stale/unknown assignment
- CCR-05828 task-claim fencing rejects stale and expired commits while current owner remains eligible

## rev3-categorized-completion.test.mjs
- CCR-05830 immutable Agency context packet requires bounded tools/scope and rejects incomplete execution envelopes
- CCR-05839 owner precedent is bounded to same material context and never carries authorization

## rev3-categorized-gap-closure.test.mjs
- CCR-05838 decision-rights registry distinguishes self/default/recommend/protected/prohibited and never inherits protected authority
- CCR-05842 durable project workspace rejects stale or non-monotonic resume writes
- CCR-05845 Foundry onboarding manifest fails early on unknown/cyclic setup and groups valid unlock impact
- CCR-05847 historical export adapter stages supported exports, redacts by policy, and rejects malformed batches
- CCR-05848 complete historical graph import accounts for every available mapping node and refuses malformed entries
- CCR-05850 historical project-container lineage preserves container membership without converting standalone evidence into container truth

## rev3-gap-closure.test.mjs
- CCR-05830 full execution context freezes owner rules, protected assets, tools, scopes, dependencies, acceptance and authorization snapshot
- CCR-05835 and CCR-05846 logical lead registry shape supports all scopes and preserves mission, authority, decisions, evidence, dependencies and next action across handoff/failover
- CCR-05843 governed Foundry lifecycle reaches post-launch only through acceptance
- CCR-05851 lost-artifact recovery exhausts authorized originals before explicitly labeled reconstruction
- CCR-05852 completeness report explicitly covers scope, conflicts, projects, missing artifacts, rename/merge/supersession lineage, privacy, unknowns and evidence

## runtime-assembly.test.mjs
- canonical runtime assembler consumes clean-room project, roadmap, checkpoint and Needs Me state

## runtime-fetch-receiver.test.mjs
- default HTTP provider preserves the browser fetch invocation contract

## runtime-integration.test.mjs
- runtime exposes the locked major routes and resolves dynamic project paths
- disconnected runtime preserves unknown truth and never fabricates project totals
- HTTP provider fails closed to a disconnected snapshot

## runtime-surface-readers.test.mjs
- standard surface readers report registry facts without fabricating activity or balances
- configured-but-disconnected providers remain disconnected instead of looking active

## runtime-visual-structure.test.mjs
- browser runtime keeps approved Projects, Active / Live, Next Up and Project Detail as distinct structures
- owner-facing project navigation uses the whole card and no decorative chevron markup

## security-foundation.test.mjs
- session lifecycle fails closed for lock, expiry, and revocation
- session lifecycle rejects pre-creation and backward timestamps
- provider-backed sign-in/sign-out binds normalized sessions and fails closed on provider logout failure
- central policy is deny-by-default and enforces fresh verification
- protected action gate binds live session and device state to the central policy decision
- data boundaries deny cross-owner and cross-project access

## social-foundation.test.mjs
- drafts require rights/provenance/approval and account changes invalidate approval
- platform rules are versioned profiles rather than core workflow constants
- publishing binds exact account, explicit authorization, idempotency and provider receipt
- analytics preserves freshness/provenance and estimated revenue cannot masquerade as confirmed

## specialists-foundation.test.mjs
- generic specialist framework registers new project types without kernel rewrite
- specialist truth collisions fail closed and rename preserves canonical project identity
- dormant specialist reactivation requires all declared provider capabilities

## supabase-passkeys.test.mjs
- Supabase passkey registration forces platform UV even if provider options are weaker

## supabase-runtime-provider.test.mjs
- owner runtime prompts for a real authenticated session and loads canonical P5 project state plus durable P7 Agency truth

## task10-34-pif-family-authority-preservation.test.mjs
- Task 10: the canonical capability-family taxonomy remains exactly 34 families

## task13-a00-live-resolver-authority.test.mjs
- Task 13: unresolved A00 reporting consumes live resolver truth, not stale baseline counts

## task5-historical-authority-preservation.test.mjs
- Task 5: recovered historical authority identity is immutable
- Task 5: REV3 additions remain separate from and additive to the 5,825 historical baseline

## task6-rev3-verified-preservation.test.mjs
- Task 6 preservation: every VERIFIED REV3 row retains requirement-specific implementation, tests, evidence, and source provenance

## task8-current-199-phase-authority-preservation.test.mjs
- Task 8: the machine authority is the current 199-phase roadmap, not the historical 188-phase snapshot
- Task 8: all 188 historical phases are preserved and the only new phase IDs are P0.11 plus PIF.1-PIF.10
- Task 8: Category 15 qualification consumes the current machine authority rather than the historical snapshot

## ui-shell-foundation.test.mjs
- navigation coordinator is the single history and scroll owner
- PWA update lifecycle requires immutable candidate identity and preserves known-good rollback
- visual fixtures preserve approved structures under the current owner card rules

