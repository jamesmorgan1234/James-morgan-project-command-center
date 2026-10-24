# 125 — Post-Audit 133-Control Register

**Owner / final authority:** James Morgan  
**Status:** ACCEPTED PLANNING REQUIREMENTS / IMPLEMENTATION AND PROOF VARY  
**Specification:** `17_SPECIFICATION_LOCK_V2_1.md`  
**P0.11 authority:** `16_P0_11_POST_LOCK_107PLUS_RECONCILIATION.md`  
**Control count:** `133`

## Register semantics

- A control being listed means it is an accepted roadmap/acceptance requirement, not that implementation is complete.
- Existing correct implementations must be verified before code is added or replaced.
- Group classification records current audit disposition; individual implementation truth must be proven by exact evidence.
- No control authorizes production change, paid service, company activation or other protected external action.
- The original unavailable CCR-00001–CCR-05825 ledger is not reconstructed or fabricated by this register.

## A01 — Authority, phase identity, source truth and requirement coverage

**Classification:** REQUIRED CORRECTION / HIGH  
**Owning phases/gates:** P0.1, P0.3, P0.7, P0.8, P0.10, P0.11; P1.6; P15.1

- **A01.1** — Resolve controlling authority/version and supersession links.
- **A01.2** — Crosswalk actual phase IDs against superseded transfer structures.
- **A01.3** — Derive phase counts from authoritative records and permit reviewed expansion.
- **A01.4** — Map every company requirement to capability, phase and proof.
- **A01.5** — Retain the missing original CCR ledger as unresolved; never fabricate it.
- **A01.6** — Generate one current resume pointer from reconciled records.
- **A01.7** — Define source authority and precedence policy.
- **A01.8** — Retain conflicting claims and apply explicit selection-or-abstention policy.
- **A01.9** — Represent effective time separately from observation/provider-modified/ingestion/processing time.
- **A01.10** — Maintain individual requirement-to-evidence closure records.

## A02 — Candidate qualification and acceptance-evidence integrity

**Classification:** REQUIRED CORRECTION / HIGH  
**Owning phases/gates:** P1.7; P15.1, P15.13, P15.14 and exact-candidate gates

- **A02.1** — Correct run 40099600448 SHA and failed overall conclusion.
- **A02.2** — Separate unit/model, adapter, staging, production and physical-device proof.
- **A02.3** — Preserve frozen historical release evidence without rewriting it.
- **A02.4** — Qualify changed runtime without bypassing mandatory gates.
- **A02.5** — Validate roadmap/spec/schema-only changes for consistency even when runtime CI is not triggered.
- **A02.6** — Bind reused evidence to proven runtime/config/schema equivalence.
- **A02.7** — Govern changes to tests, thresholds and acceptance criteria independently; a failing system may not weaken its own gate.

## A03 — Trusted environment/backend identity

**Classification:** OBSERVED IMPLEMENTATION DEFECT / HIGH  
**Owning phases/gates:** P1.8; P2.1; P3.5; P15 exact-candidate environment proof

- **A03.1** — Remove hardcoded production backend selection from reusable broker paths.
- **A03.2** — Validate trusted environment and auth issuer/audience/backend identity.
- **A03.3** — Reject staging/preview-to-production backend binding by default.
- **A03.4** — Include configuration/environment identity in release evidence.
- **A03.5** — Test refresh rotation/concurrency, clear and revocation separately.
- **A03.6** — Bound auth payload/time/resource usage without logging secrets.

## A04 — End-to-end company/project scope enforcement

**Classification:** FOUNDATION RETROFIT / HIGH  
**Owning phases/gates:** P1.1–P1.3; P2.6; P3.1; P5.1

- **A04.1** — Validate immutable company/project relationships.
- **A04.2** — Propagate trusted scope through APIs, workers and queues.
- **A04.3** — Scope caches, object storage, search and embeddings.
- **A04.4** — Resolve authority centrally from trusted registry data.
- **A04.5** — Test company/category changes without implicit rights changes.
- **A04.6** — Represent complete project detail sections without one giant shared record.

## A05 — Immutable protected execution intent and policy failure semantics

**Classification:** FOUNDATION RETROFIT / HIGH  
**Owning phases/gates:** P1.5–P1.6; P2.4; P2.7; P7 protected execution

- **A05.1** — Freeze canonical action intent before protected execution.
- **A05.2** — Bind approval to exact resource/parameters/account/artifact.
- **A05.3** — Bind subject, company/project, environment and limits.
- **A05.4** — Revalidate expiry, revocation and policy epoch at effect time.
- **A05.5** — Consume authorization atomically and record operation identity.
- **A05.6** — Reject modified intents while reconciling legitimate identical retries.
- **A05.7** — Fail protected effects closed when required policy/control-plane authority cannot be established.

## A06 — Durable execution, callbacks, dependency liveness and uncertain outcomes

**Classification:** FOUNDATION INTEGRATION / HIGH  
**Owning phases/gates:** P1.4; P7.1, P7.4–P7.7, P7.19, P7.21; P14.11

- **A06.1** — Identify authoritative persistent runtime adapters.
- **A06.2** — Persist monotonic fencing across process restart.
- **A06.3** — Prove atomic claim and resource contention semantics.
- **A06.4** — Connect durable outbox/inbox and deduplication.
- **A06.5** — Reconcile unknown external effects before retries.
- **A06.6** — Test crash, cancellation, duplicate delivery and stale commits.
- **A06.7** — Reconcile legitimate duplicate and out-of-order webhook/provider events without repeated or regressive effects.
- **A06.8** — Detect dependency cycles and deadlocks and enter explicit diagnostic blocked states.
- **A06.9** — Define lock acquisition order and recover orphaned claims after worker loss without bypassing fencing/authority.
- **A06.10** — Prevent starvation and provide bounded escalation for indefinitely blocked jobs.

## A07 — All-chat/source coverage and provider feasibility

**Classification:** IMPLEMENTATION + EXTERNAL FEASIBILITY GATE / HIGH  
**Owning phases/gates:** P3.5, P3.6, P3.8, P3.9; P14.5

- **A07.1** — Verify provider enumeration/edit/delete capability truthfully.
- **A07.2** — Account for complete bootstrap coverage and unreadable sources.
- **A07.3** — Handle stable pagination and changes during enumeration.
- **A07.4** — Detect same-size edits without byte-size shortcuts.
- **A07.5** — Guarantee fairness for old and new source work.
- **A07.6** — Recover source checkpoints and derived projection acknowledgements.

## A08 — Privacy, provenance, retention and derived-data lifecycle

**Classification:** FOUNDATION CONTRACT / HIGH  
**Owning phases/gates:** P2.6; P3.1–P3.3, P3.10; P6.3; P14.1–P14.2

- **A08.1** — Propagate scope/trust/purpose/retention labels.
- **A08.2** — Define hold precedence and authorized hold release.
- **A08.3** — Trace derived summaries, indexes, vectors and exports.
- **A08.4** — Delete/restrict derived access without silent residual copies.
- **A08.5** — Separate durable audit metadata from erasable sensitive payload.
- **A08.6** — Prevent restore from resurrecting forbidden access.
- **A08.7** — Propagate source correction/supersession/retraction into dependent summaries, memories, indexes, metrics and recommendations while preserving history.

## A09 — Capability maturity, compatibility, delegation and provider drift

**Classification:** STRONG FOUNDATION REQUIREMENT / HIGH  
**Owning phases/gates:** P1.2, P1.8; P6.1–P6.2, P6.15; P7.3, P7.14–P7.15; P14.4

- **A09.1** — Register capability maturity and independently scoped proofs.
- **A09.2** — Version input/output/error/compatibility contracts.
- **A09.3** — Preserve company pinning, forks and downgrade/rollback rules.
- **A09.4** — Bind delegated identities to parent/task/scope/expiry.
- **A09.5** — Attenuate authority, fanout, resource and cost ceilings.
- **A09.6** — Revalidate delegation and policy at actual use.
- **A09.7** — Detect provider/model/API schema and behavioral drift with version evidence where available.
- **A09.8** — Constrain fallback eligibility by scope, privacy, residency, security, quality and compatibility.
- **A09.9** — Invalidate incompatible caches/context/evaluations after material provider/model/schema/policy changes.

## A10 — Zero-budget and resource admission

**Classification:** REQUIRED EARLY FOUNDATION GATE / HIGH  
**Owning phases/gates:** P1.4, P1.5, P1.8; P7 scheduler/resources; P9/P13 deeper reporting

- **A10.1** — Default monetary execution budget to zero.
- **A10.2** — Deny unknown pricing or billable overflow.
- **A10.3** — Reserve shared quotas atomically across concurrent jobs.
- **A10.4** — Cap retries, queue depth, time and resource consumption.
- **A10.5** — Reconcile receipts and provider usage against reservations.
- **A10.6** — Stop admissions safely without automatic paid scaling.
- **A10.7** — Forbid fallback paths from incurring unauthorized spend, selecting paid service, or exceeding approved resource ceilings.

## A11 — Complete isolated cross-module proof and measurable acceptance

**Classification:** STRONG RECOMMENDATION / HIGH  
**Owning phases/gates:** Cross-category exit gate after P1–P3 prerequisites; P15 final integrated acceptance

- **A11.1** — Define one complete cross-module end-to-end scenario.
- **A11.2** — Apply isolated migrations from clean and prior supported schemas.
- **A11.3** — Exercise browser/API/SQL/worker boundaries together.
- **A11.4** — Prove unauthorized and cross-company negative cases.
- **A11.5** — Inject failures and validate rollback/recovery.
- **A11.6** — Record exact code/config/schema/environment scope and remaining blockers.
- **A11.7** — Give each relevant acceptance gate a declared workload, environment, threshold, measurement method and evidence; unmeasured targets remain unverified.

## A12 — Extensibility without premature infrastructure

**Classification:** OPTIONAL OPTIMIZATION / MEDIUM  
**Owning phases/gates:** P1.3, P1.8; P13.3; P14.6

- **A12.1** — Keep clear modular contracts before infrastructure expansion.
- **A12.2** — Avoid assuming one service/model/database per company.
- **A12.3** — Measure 107+ registry and navigation behavior.
- **A12.4** — Define extraction and partition thresholds from measured need.
- **A12.5** — Preserve portability and independently scoped domain runtimes.
- **A12.6** — Defer new infrastructure until justified and separately authorized.

## A13 — Deterministic time, scheduling and replay

**Classification:** STRONG REQUIREMENT / MEDIUM-HIGH  
**Owning phases/gates:** P1.1, P1.4; P7 scheduler; P8 automation; relevant domain phases

- **A13.1** — Use trusted UTC instants plus intended IANA recurrence zone.
- **A13.2** — Specify DST skip/repeat and local-date semantics.
- **A13.3** — Assign durable schedule-occurrence identities.
- **A13.4** — Define bounded catch-up and missed-run behavior.
- **A13.5** — Handle clock skew and effective policy boundaries.
- **A13.6** — Require current authorization for replayed occurrences.

## A14 — Financial truth, entitlement and owner authority

**Classification:** CURRENT PRIMITIVES + FUTURE LAUNCH GATE / HIGH  
**Owning phases/gates:** P1 truth primitives; P3 provenance; P9 Finance; P11.8 Books revenue; company launch gates

- **A14.1** — Model amount/currency/precision and truth-state explicitly.
- **A14.2** — Deduplicate source events and portfolio snapshots.
- **A14.3** — Keep corrections/refunds/test transactions distinct.
- **A14.4** — Separate actual, estimated, forecast, invoiced and settled values.
- **A14.5** — Separate tenant/customer entitlement from owner authorization.
- **A14.6** — Invalidate expired/revoked entitlement caches.

## A15 — Hostile artifacts, callbacks, credentials, egress and supply chain

**Classification:** SECURITY FOUNDATION REQUIREMENT / HIGH  
**Owning phases/gates:** P2.5, P2.9; P3.3, P3.5; P7 tools/workers; P15.4

- **A15.1** — Bound file size/archive expansion/parser time.
- **A15.2** — Validate media/type and quarantine unsafe artifacts.
- **A15.3** — Sandbox untrusted parsers/builds/worker code.
- **A15.4** — Enforce egress/internal-endpoint restrictions.
- **A15.5** — Keep secrets out of model context, logs and artifacts.
- **A15.6** — Record dependency hash/source/license and build provenance.
- **A15.7** — Verify webhook/provider sender, signature, timestamp, event identity and replay window.
- **A15.8** — Support signing-secret rotation with explicit overlapping validity windows and no unauthenticated fallback.
- **A15.9** — Track credential issue/expiry/rotation/emergency revocation and dependent-service impact.
- **A15.10** — Track encryption-key versions separately from data and enforce key-access separation.

## A16 — Operational containment, recovery, key-aware restore and policy recovery

**Classification:** REQUIRED OPERATIONAL GATE / HIGH  
**Owning phases/gates:** P1.9; P2.8; P4.6; P7.19; P14.1–P14.4, P14.11; P15

- **A16.1** — Define scoped safe mode, kill and incident objectives.
- **A16.2** — Instrument health, errors and in-flight uncertainty.
- **A16.3** — Test compatible browser/worker/schema update combinations.
- **A16.4** — Prohibit offline/stale authority from executing effects.
- **A16.5** — Perform isolated restore with key/privacy/application validation.
- **A16.6** — Prove rollback, RPO/RTO, decommission and cleanup outcomes.
- **A16.7** — Provide a separately constrained, temporary and auditable recovery authority path for legitimate policy/control-plane recovery without creating a standing bypass.
- **A16.8** — Restore using current credential revocation, key-version, authorization and privacy state so backups cannot resurrect revoked authority.

## A17 — Independent verification, provider/model quality and self-improvement integrity

**Classification:** STRONG REQUIREMENT / HIGH  
**Owning phases/gates:** P1.7; P4.7–P4.8; P6.13, P6.15; P7 verification; P13.6, P13.9; P15

- **A17.1** — Link rendered values and uncertainty to canonical evidence.
- **A17.2** — Evaluate semantic correctness and calibrated abstention.
- **A17.3** — Use independently scoped verification and appeal review.
- **A17.4** — Test keyboard/screen-reader/phone/locale behavior.
- **A17.5** — Keep voice/multimodal actions on the same intent/policy path.
- **A17.6** — Use approved shadow experiments with regression/rollback criteria.
- **A17.7** — Define provider/model regression thresholds and degrade/block or use only a qualified fallback when violated.
- **A17.8** — Prevent Brain/Agent/self-improvement systems from approving their own permission expansion, weakening owner rules, removing failing tests or changing acceptance criteria to declare success.
- **A17.9** — Retain failed-experiment evidence and require rollback/regression proof for promoted improvements.

## A18 — Company/customer/regulated-operation readiness

**Classification:** FUTURE OPERATING-COMPANY GATE / HIGH  
**Owning phases/gates:** P5.1, P5.9; P12.1–P12.8; company-specific pre-launch gates

- **A18.1** — Separate company existence, planning conformance, implementation, readiness, owner activation and live health.
- **A18.2** — Cross-reference all 107 source roadmaps plus conformance supplements/native verification.
- **A18.3** — Keep domain rules and sensitive customer data company-local.
- **A18.4** — Gate customer onboarding/billing and public communications.
- **A18.5** — Verify rights/jurisdiction/reviewer/consent/suppression needs.
- **A18.6** — Prove export/offboarding/revocation/sunset before relevant launch.

## Count verification

| Group | Controls |
|---|---:|
| A01 | 10 |
| A02 | 7 |
| A03 | 6 |
| A04 | 6 |
| A05 | 7 |
| A06 | 10 |
| A07 | 6 |
| A08 | 7 |
| A09 | 9 |
| A10 | 7 |
| A11 | 7 |
| A12 | 6 |
| A13 | 6 |
| A14 | 6 |
| A15 | 10 |
| A16 | 8 |
| A17 | 9 |
| A18 | 6 |
| **TOTAL** | **133** |

## Current resume dependency

This register is consumed by P0.11. After P0.11, apply only targeted affected Category 1 prerequisite amendments/proofs, then close only actual Category 2 retrofit gaps, then continue Category 3 source/provenance/contracts and the isolated cross-module proof before broad Brain/Agency expansion.
