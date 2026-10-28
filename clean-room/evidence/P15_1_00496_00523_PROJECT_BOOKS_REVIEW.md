# P15.1 Project/Books review CCR-00496..00523

Parent 80bd4d64149d8761ba6ae4c50d83ada52c864e5f / tree 295b2049985f1c74b1ebffede88f018d6fb9e189, refetched before mutation. Canonical wording inspected for all 28 rows. Existing code/tests only; no actual book assets, manuscripts, covers or publishing touched. Candidates are not certification before guarded qualification.

## A — 20 directly supported existing contracts

| ID | Exact requirement | Proof scope |
| --- | --- | --- |
| CCR-00496 | Duplicate-project detection | Existing mission-fingerprint overlap detector, provenance/threshold validation and owner-governed disposition tests. |
| CCR-00499 | Project archive foundation | Explicit lifecycle/archive filtering, generic archive bypass rejection, governed protected lifecycle RPC and owner-authorized archived revival. No actual project archived. |
| CCR-00501 | Book Registry | Hardened canonical owner/project/author/book hierarchy registry and substitution rejection. |
| CCR-00502 | Series Registry | Existing series/trilogy container/member hierarchy, explicit series fixture and hardened parent/sequence rejection; no competing truth owner. |
| CCR-00504 | Cover Registry | Book asset ledger binds cover identity/file/hash/provenance/approval with exact replacement gate. |
| CCR-00505 | Publication-format Registry | Existing canonical book/metadata format catalog with exact one-file-per-declared-format contract and negative missing mapping proof. |
| CCR-00506 | Rollout-order model | Contiguous owner-locked phase/book/format order; reordered/changed locks reject. |
| CCR-00507 | KDP-state model | Provider-bound uploaded/submitted/review/live history, receipt/timestamp requirements. |
| CCR-00508 | Manuscript-state model | Explicit protected approval lifecycle keyed to manuscript identity/version, with shared illegal/unauthorized transition rejection. |
| CCR-00509 | Interior-state model | Same declared lifecycle independently keyed to interior; not a claim of finished interior content. |
| CCR-00510 | Metadata-state model | Versioned scoped metadata plus independently keyed approval lifecycle. |
| CCR-00511 | Package-state model | Exact manifest/version-bound readiness assessment and explicit missing format/pricing blockers. |
| CCR-00512 | QC-state model | Scoped pass/missing/failed/mayAdvance/evidence state, exact profile/version and stale pass rejection. |
| CCR-00513 | Approval ≠ publication | Separate owner approval and provider receipt/live ledgers; neither manufactures the other. |
| CCR-00514 | File existence ≠ approval | Explicit owner action is required for protected approval; file/hash presence alone does not provide it. |
| CCR-00515 | Upload ≠ publication | Uploaded state is non-live; provider receipt/publication/time required for live truth; uploaded fixtures do not count as sales. |
| CCR-00516 | Book-specific quality gates | Exact scoped subtype/profile/book QA gates, failed/missing evidence blocks. |
| CCR-00518 | Protected-cover enforcement | Exact prior/replacement hashes, owner/book/kind and current expiring authorization; wrong or expired substitutions reject. |
| CCR-00522 | Explicit Books-target requirement for Agent | Exact target and declared project-agent scope required; missing target rejects. |
| CCR-00523 | Portfolio Agent exclusion rules | Portfolio Agent Auto explicitly excluded; project-specific scoped work does not inherit portfolio authority. |

Exact source and named executable positive/negative/failure proof in p15-1-reviewed-project-books-foundation-mappings.mjs. Shared evidence reused only for the stated semantics; no new runtime tests claimed. Same qualified source a66d5acc98387bb88f710250e96e574ce0082811, CI40787480238/job123164185374: two1630 PASS/0FAIL/0SKIP executions, final open-phase gate fails, production skipped.

## B — 8 insufficiently proven rows, remain UNVERIFIED

| ID | Requirement | Exact proof gap |
| --- | --- | --- |
| CCR-00497 | Project merge capability foundation | Merge lineage/disposition contracts exist; direct executable merge foundation preserving related project identities/evidence is not established by the reviewed tests. |
| CCR-00498 | Project split capability foundation | Fork/branch lineage exists; split foundation identity/relationship/execution proof is not established. |
| CCR-00500 | Books Platform separate from generic project presentation but built on Project Platform | Dedicated book renderer and project references exist; direct UI/Project Platform composition acceptance proof not established. |
| CCR-00503 | Collection Registry | Collection relationship kind is declared; direct registered collection/container member behavior test not established. |
| CCR-00517 | Series-specific quality gates | Individual-book continuity QA is not proof of cross-book series continuity/quality gates. |
| CCR-00519 | Material-change detection | Exact protected identity/hash replacement checks exist; complete material-change classification/impact semantics not established. |
| CCR-00520 | Affected-QC-only recheck | Versioned QA exists; direct change-to-affected-gate dependency invalidation/recheck proof not established. |
| CCR-00521 | No automatic full-book rebuild after unrelated change | No direct unaffected-book/unit preservation test established; absence of a rebuild function is not proof. |

No C/implementation-absence claims where only proof gaps established. All eight stay UNVERIFIED, never N/A. Prior parked rows/certifications and canonical meaning unchanged. P15.1 remains open; P15.2 untouched. Next coherent batch begins CCR-00524 provider adapter/sync contracts.
