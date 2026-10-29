# P15.1 recovery/test inventory CCR-00608..00647

Parent0e8f79469866aab2be2e1bfb37cfded0fe65c2b7 / tree56c2c6cbe0944922df9bafdaba7b056891e70ef1, refetched before mutation. Forty exact rows reviewed:21 A existing proof candidates,18 B insufficient proof, existing CCR-00633 migration tests VERIFIED preserved. No implementation/test/schema/migration or protected asset changes. Candidate mappings require native guarded qualification.

## A — direct existing proof

| IDs | Exact requirement | Proof scope |
| --- | --- | --- |
| CCR-00608 | Known-good release pointer | Immutable release identity, PWA knownGood and service-worker restore/query contract. |
| CCR-00609 | Rollback path | Explicit known-good shell rollback and protected-traffic exclusion. No production rollback authorization implied. |
| CCR-00620 | Interrupted sync recovery | Exact checkpoint/generation and pending derivative acknowledgements survive worker replacement; stale/unsuccessful checkpoints reject/restart. |
| CCR-00622 | Interrupted Agent recovery | Expired-worker takeover preserves task/checkpoint/queue/evidence and advances fence; live lease/missing checkpoint reject. |
| CCR-00626 | Unit tests | Actual positive/negative canonical lifecycle tests executed in mandatory suite. |
| CCR-00627 | Contract tests | Actual module manifest/snapshot/required-field contract tests. |
| CCR-00628 | State-machine tests | Actual Agency allowed/illegal/stop/pause transition tests. |
| CCR-00629 | Module-boundary tests | Ownership conflict/cyclic replacement rejection and unchanged valid registry state. |
| CCR-00631 | Database tests | Actual isolated PGlite migration/RPC execution with invalid schema/truth and transaction/history assertions. |
| CCR-00632 | RLS tests | Actual authenticated PostgreSQL role, owner-visible/other-owner-hidden rows and denied direct deletes. |
| CCR-00634 | Rollback tests | Executed isolated migration rollback/erasure/history/repeat rejection tests. |
| CCR-00635 | Integration adapter tests | Executed provider substitution/replacement and malformed contract rejection. |
| CCR-00639 | Brain context tests | Owner/project/relevance/sensitivity/freshness minimization and excluded cross-scope/stale input. |
| CCR-00640 | Brain recommendation tests | Brain proposal cannot write; recommendation cannot self-install; measured outcomes require evidence. |
| CCR-00641 | Rule-conflict tests | Explicit conflict detection/resolution/current supersession and invalid lineage rejection. |
| CCR-00642 | Visual regression tests | Approved reference SHA/PNG identity plus frozen visual contract fingerprint. Asset/contract tests, not rendered pixel-parity acceptance. |
| CCR-00643 | Geometry tests | Reference941x1672 dimensions and approved geometry contract fingerprint. Does not claim live device bounding-box acceptance. |
| CCR-00644 | Interaction tests | Navigation transition interactions through controlled fixtures and shipped runtime wiring. |
| CCR-00645 | Back-navigation tests | Captures outgoing scroll and delegates browser history; deterministic no-history fallback. |
| CCR-00646 | Scroll-restoration tests | Matching Command Center history state only; foreign/malformed state cannot restore. |
| CCR-00647 | Startup tests | Actual watchdog/hung/late completion/recovery regressions against shipped startup wiring. |

Exact implementation and named positive/negative/failure tests in p15-1-reviewed-recovery-test-coverage-mappings.mjs. A test-category row certifies actual executed tests exist and enforce stated cases; it does not certify all later acceptance or owner/device experience.

## B — insufficient direct proof; keep UNVERIFIED

| ID | Exact requirement | Precise gap |
| --- | --- | --- |
| CCR-00610 | Database backup policy | Scoped artifact backup policy exists; concrete database snapshot/export backup policy integration proof not established. |
| CCR-00611 | Database restore procedure | Isolated encrypted workspace restore exists; actual database restore procedure/drill proof not established. |
| CCR-00612 | Project-state export | Generic portable records exist; complete current project registry/lineage/state extraction and roundtrip proof not established. |
| CCR-00613 | Brain-state export | Representative intelligence backup classes exist; complete current Brain-state extraction/roundtrip integration proof not established. |
| CCR-00614 | Rules export | Generic canonical backup does not directly prove current rule/authority/conflict history export. |
| CCR-00615 | Roadmap export | Generic export does not directly prove complete roadmap DAG/version/evidence extraction/roundtrip. |
| CCR-00616 | Checkpoint export | History/backup records exist; complete checkpoint identity/ancestry/hash export proof not established. |
| CCR-00617 | Asset manifest export | Asset registry/backup class exists; exact manifest/protected authority/current/prior asset export proof not established. |
| CCR-00618 | Full portability package | Partial generic packaging/encryption exists; whole declared application-state completeness/roundtrip proof not established. |
| CCR-00619 | Partial database failure recovery | Atomic rejection/rollback tests exist; partial database failure/restart recovery acceptance drill not established. |
| CCR-00621 | Interrupted deployment recovery | PWA rollback exists; interrupted deployment/promotion recovery drill not established. No deployment authorized. |
| CCR-00623 | Corrupt-cache recovery | Known-good shell recovery exists; corrupt cache byte/manifest rejection/restoration drill not sufficiently established. |
| CCR-00624 | Broken-module isolation | Registry failure containment exists; actual failed module execution/render isolation acceptance proof not established. |
| CCR-00625 | Disaster recovery runbook | Recovery acceptance record exists; complete stepwise disaster recovery runbook/drill proof not established. |
| CCR-00630 | Dependency-direction tests | Cycles/ownership are tested; explicit architecture-layer direction rejection proof not established. |
| CCR-00636 | Agent dispatcher tests | Scheduler/claim/outbox tests exist; direct dispatcher selection-to-dispatch acceptance proof not sufficiently established. |
| CCR-00637 | Agent executor tests | Executor registry/preflight tests exist; executor operation/result/failure acceptance proof not sufficiently established. |
| CCR-00638 | Agent end-to-end tests | Individual durable seams exist; complete goal/plan/run/task/verification end-to-end proof not established by reviewed tests. |

All18 B stay UNVERIFIED, not N/A or definitive absence claims. Existing00633 preserved. Source/runtime/test bytes unchanged from a66d5acc98387bb88f710250e96e574ce0082811, actual CI40787480238/job123164185374 two1630PASS/0FAIL/0SKIP; final open-phase gate fails, production skipped. No fresh test execution claimed. Protected screenshot only read for existing proof, never altered. No P15.2. Next batch starts CCR-00648 test/device/load acceptance contracts.
