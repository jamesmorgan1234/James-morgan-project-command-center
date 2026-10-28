# Existing asset contract review: CCR-00196..00225

Parent 34d31e04661314d06300b3e2b3fb96a6eb5b819e / tree 2de8421ba77e4998a2dfef9efa1ea4069bf39978, refetched before mutation. Thirty canonical rows: 12 supported by existing named positive/negative tests, 16 unresolved, 2 previously VERIFIED preserved (CCR-00196 partial-migration recovery and CCR-00200 migration idempotency). No runtime, schema, migration, test, canonical wording or actual protected asset changes.

## Supported

| IDs | Requirement and proof |
| --- | --- |
| CCR-00206 | Asset Registry: registration/retrieval/versioned replacement and invalid transition rejection. |
| CCR-00207 | Stable asset IDs: registered identity persists across exact-version replacement, synthetic authority cannot substitute canonical scope. |
| CCR-00209 | Asset owner/project: explicit fields and negative wrong-owner/project replacement tests. |
| CCR-00210 | Asset checksum/hash: available originals require hash; malformed state remains rejected. |
| CCR-00211, CCR-00212 | Approval and protected/locked states: explicit approval state; nonboolean/blank authority cannot replace a locked fixture. |
| CCR-00213 | Current version: current lookup advances only through expected-version replacement; rejected replacement preserves version/hash. |
| CCR-00218 | Missing-asset detection: explicit missing original state; cannot masquerade as available without checksum; malformed replacement leaves missing truth intact. Not a filesystem-scanning claim. |
| CCR-00219 | Wrong-project-asset detection: replacement changing project fails even with explicit synthetic authorization. |
| CCR-00220 | Book-cover protection: exact owner/book/kind/prior/replacement-hash authorization with expiry rejects substitutions. |
| CCR-00224, CCR-00225 | Current authoritative file marker; no filename alone determines authority: canonical book-asset authority explanation includes file/hash/origin/approval/source/basis and protected replacement checks. |

Exact owning functions and executable test names are individually mapped in scripts/p15-1-reviewed-asset-contract-mappings.mjs. Do not extend these claims to unproven asset-family integration.

## Unverified with precise evidence gaps

| ID | Requirement | Missing proof |
| --- | --- | --- |
| CCR-00197 | Old-client/new-schema compatibility rules | Compatibility windows exist; explicit old-client/new-schema execution matrix not established in this review. |
| CCR-00198 | New-client/old-schema compatibility rules | Reverse compatibility matrix proof not established. |
| CCR-00199 | Feature activation only after required migration succeeds | Startup config and isolated migration tests do not alone prove migration-bound feature activation. |
| CCR-00201 | Migration verification queries | Digest validation exists; declared post-migration verification-query execution proof not established. |
| CCR-00202 | Data backfill tracking | Explicit backfill progress/restart proof not established. |
| CCR-00203 | No migration assumed complete because SQL returned success | Isolated workspace receipt validation is insufficient proof of the actual SQL completion decision path. |
| CCR-00204 | Backup checkpoint before major schema change | Plan requires backupRef; a verified enforced backup checkpoint before major schema change is not proved by a nonblank fixture reference. |
| CCR-00205 | Restore drill for important migrations | Rollback tests exist; important-migration restore-drill scope/acceptance proof not established. |
| CCR-00208 | Asset type | Book kinds exist; generic asset-type validation and adequate positive/negative proof not established. |
| CCR-00214 | Prior versions | Book ledger stores history; reviewed tests do not directly assert complete retained prior asset versions. Generic AssetRegistry keeps current state only. |
| CCR-00215 | Superseded versions | Explicit asset supersession-state/history executable proof not established. |
| CCR-00216 | Asset relationship graph | Generic graph capabilities do not prove asset-specific relationship indexing/traversal. |
| CCR-00217 | Duplicate detection | Registry ID collision checks exist; content-level duplicate asset semantics and sufficient row-specific proof not established. |
| CCR-00221 | Command Center icon protection | Synthetic icon/locked-asset tests prove mechanism; exact approved icon registration/binding/protection evidence not established here. |
| CCR-00222 | Screenshot-reference protection | Scoped screenshot reference registration/protection proof not established. |
| CCR-00223 | Final-package protection | Package kind declaration alone does not prove final-package protection integration. |

All gaps remain UNVERIFIED, not N/A and not definitive absence claims. CCR-01875/CCR-01908 remain unclaimed. Reuse unchanged qualifying source 4fd130ef299e4d4f5da0b1ec0756a9d78e3068ff and CI 40756163744/job 123055523038: 1627 pass/0 fail/0 skip twice; core/type/authority/release/PWA pass, open Category15 gate fails, production skipped. Guarded assembly checks referenced file/test existence, bindings and exact mapping. No fresh test success is claimed. P15.1 remains open; no P15.2 advancement.
