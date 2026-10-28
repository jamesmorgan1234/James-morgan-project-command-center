# P15.1 existing entity/relationship proof review

Parent d33f38a4eafd6900dc12a433d42cfd7caa03f154 / tree 3437dfce72a9cce799a4396b27b70364ff557d3d. Canonical CCR-00156..00195 reviewed: 19 supported mappings, 20 remain unverified, CCR-00194 already verified and preserved. No implementation, test, migration or canonical wording change. Exact named tests and owning source locations are in scripts/p15-1-reviewed-entity-relationship-mappings.mjs; each closure note limits the claim to what that proof actually establishes.

## Supported existing proof

| IDs | Requirement and actual proof |
| --- | --- |
| CCR-00158 | Provider-account entity: FinancialAccountRegistry canonical identity, provider binding history and collision rejection. |
| CCR-00159, CCR-00176 | Asset entity and project-to-asset relationships: AssetRegistry identity/project association, immutable replacement fields and negative validation. |
| CCR-00164, CCR-00165, CCR-00167, CCR-00175 | Brand/entity, project/entity, account/entity and project/account associations: SocialIdentityMapRegistry explicit scoped fields and immutable lineage tests. Does not certify legal ownership or a standalone company registry. |
| CCR-00173 | Project/provider association: SourceRegistry immutable provider/scope identity; scope tuple collision/substitution tests. |
| CCR-00177 | Book/series relationship: ordered parent/container and trilogy membership, parent/order/overflow rejection. |
| CCR-00178 | Book/cover relationship: scoped book asset ledger, hash/provenance/approval and protected replacement rejection using fixtures. |
| CCR-00179 | Book/publication relationship: scoped current publication lookup, preserved history and provider substitution rejection. |
| CCR-00186, CCR-00187, CCR-00188 | Graph impact/dependent/affected queries: IntelligenceTraceFabric version-aware affectedDependents traverses dependents and downstream learning, excludes unrelated references and rejects stale compatibility. |
| CCR-00189 | Why-is-this-here query: explain resolves exact intent-to-learning reference lineage without private payload copies. No universal ingestion/UI claim. |
| CCR-00191 | Declared canonical schema version, explicit legacy-v1 omission interpretation, unsupported version rejection including isolated SQL enforcement. |
| CCR-00192 | Explicit client config/API/schema compatibility version and environment/release startup contract. |
| CCR-00193, CCR-00195 | Migration version history and rollback/recovery strategy: immutable digest/revision receipts, resume idempotency, historical rollback preserving erasure and concurrent-plan rejection. Isolated workspace only. |

## Unverified: precise missing proof, not an absence claim

| ID | Exact requirement | Reason not certified |
| --- | --- | --- |
| CCR-00156 | Product entity type | Dedicated canonical product entity contract and executable proof not established. |
| CCR-00157 | Domain entity type | Domain entity contract and executable proof not established. |
| CCR-00160 | Contract/agreement entity type | Legal contract/agreement entity proof not established by generic typed records. |
| CCR-00161 | Ownership relationship type | Social ownership evidence references do not prove a canonical ownership relationship contract. |
| CCR-00162 | Ownership percentage support | Numeric ownership semantics/validation proof not established. |
| CCR-00163 | Parent/subsidiary relationships | Book containers do not prove corporate parent/subsidiary relationships. |
| CCR-00166 | Revenue-source-to-entity relationships | Explicit relationship and executable linkage proof not established. |
| CCR-00168 | Business-bank-reference relationships without exposing secrets | Finance isolation alone does not prove this precise bank/entity relationship contract. |
| CCR-00169 | Historical ownership changes | Provider lineage/immutable social identity does not prove ownership transfer history. |
| CCR-00170 | Future entity types register through a contract instead of schema hacks | Project/book type registration alone does not establish the generic entity registration requirement. |
| CCR-00171 | Universal relationship graph underneath the system | Existing graph APIs do not prove all required domain families are indexed. |
| CCR-00172 | Project dependencies | Work-unit or intelligence dependency DAG is not proof of interproject dependency behavior. |
| CCR-00174 | Project-to-domain relationships | Explicit domain/project linkage proof not established. |
| CCR-00180 | Rule-to-project relationships | Scope strings alone insufficient; relationship lifecycle/query proof not established. |
| CCR-00181 | Decision-to-project relationships | Intelligence decision nodes alone insufficient; project linkage proof not established. |
| CCR-00182 | Decision-to-requirement relationships | Explicit requirement linkage proof not established. |
| CCR-00183 | Agent-run-to-project relationships | AgencyRun project field alone insufficient; row-specific linkage/isolation proof not reviewed to sufficiency. |
| CCR-00184 | Recommendation-to-project relationships | Explicit recommendation/project relationship proof not established. |
| CCR-00185 | Integration-to-project relationships | Provider/task candidates do not alone establish integration/project linkage. |
| CCR-00190 | Future relationship types register safely | Hardcoded relation unions alone do not prove safe future relationship registration. |

CCR-00194 forward migration tests was already VERIFIED; unchanged. CCR-01875 and CCR-01908 remain unclaimed. All insufficiently proven rows remain UNVERIFIED, not N/A. P15.1 closure and later-phase advancement remain blocked.

Reuse only actual source-bound CI 40756163744 / job 123055523038 at source 4fd130ef299e4d4f5da0b1ec0756a9d78e3068ff: 1627 PASS / 0 FAIL / 0 SKIP twice, core/type/authority/release/PWA pass, final Category15 gate fails, production skipped. No new test execution is claimed for metadata-only mapping. Native guarded assembly must confirm every referenced source/test digest and mapping before disposition changes are saved.
