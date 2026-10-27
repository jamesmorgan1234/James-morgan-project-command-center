# P9.8 — Financial-grade identity and isolation

Base `2dc3238d0d2fcc696a9ae3545f4dc28f6f1772a5`, tree `50103aa2e4e18da00dfffa59eddde7ccca55f4f4`, authorized branch `build/spec-lock-v2-clean-room`.

Authority: Roadmap 14 P9.8, retained by Roadmap 22. Scope: strongest applicable auth, RLS, secrets, audit, cross-company/personal separation, context minimization and incident containment. Gate: **Compromised non-financial domain cannot access or act on finance data.**

## Defects and repair

Existing finance table RLS checked owner membership alone. The pure isolation assertion trusted caller-supplied scopes and assurance, without revalidating a session. Added a trusted-server `FinancialAccessBoundary` composing the existing live `AuthSessionStore`, capability lookup and containment lookup. It requires exact owner, company, project and personal scope; verification and capability expiry; allowed data classes from the trusted capability; finance-specific read/write scopes; and fresh passkey assurance for writes. It never grants protected action authority. Unknown incident states and blank owner identity now fail closed. Secret-channel validation is reused for context metadata. No credential material is stored in capabilities or exposed by context decisions.

New migration `20261027220000_p9_8_finance_capability_boundary.sql` adds private server-managed record classification, scope catalog and per-session capabilities. RESTRICTIVE policies intersect existing owner policies on every current finance/credit table. Reads/inserts require current owner authorization, live Auth and unrevoked canonical owner session, passkey assurance, five-minute verification, explicit table permission, exact classified scope/company/project, and a non-contained unrevoked unexpired capability. Writes additionally require fresh assurance and write permission. Application roles cannot self-provision capabilities or mint financial action grants/execution history. All existing immutable history protections remain. Existing views already used security-invoker semantics; this is preserved and tested, not a newly discovered view defect.

Compatibility: no history is rewritten/deleted. Unclassified rows and sessions without server-issued capabilities are intentionally inaccessible. Trusted server provisioning must explicitly classify personal/company/project records and issue bounded capabilities after canonical verification. No consent or scope is inferred. Do not restore capabilities from historical backups. Recovery containment means revoke capabilities, not remove the restrictive policies. This is a server composition primitive and database enforcement, not a claim that a live finance endpoint/provider is deployed. Future adapters must use the boundary and may not distribute service credentials to domain modules. Trusted-server/admin credential compromise is outside the subordinate-domain threat model.

## Files and verification

Inspected: Roadmaps 14/22; finance isolation/providers/accounts/actions/recovery/index; security auth/types/secret-channels/protected gates; all nine P9 migrations and P9.7 evidence/tests; finance foundation tests; canonical Category 2 owner-session/authorization migrations. Changed: src/finance/access.ts, index.ts, isolation.ts; tests/p9-8-server-capability.test.mjs and p9-8-postgres-isolation.test.mjs; additive migration above; this evidence.

- `npm run typecheck`: PASS; `npm run build:modules`: PASS.
- Dedicated `node --test --test-reporter=spec clean-room/tests/p9-8-*.test.mjs`: **18 PASS / 0 FAIL / 0 skipped/cancelled**, parent test included.
- Adjacent P9/finance/Category 2/security-foundation tests: **192 PASS / 0 FAIL**, before final table allowlist/populated-view additions; included again in final full suite.
- `npm run check:legacy`, `npm run check:architecture`: PASS.
- Final `npm run build`: module and browser build PASS; **1,347 PASS / 0 FAIL / 0 skipped / 0 cancelled**.
- First archive-only full run: 1,340 PASS / 6 FAIL because snapshot lacked Git metadata. Exact-base metadata restored; rerun 1,346 PASS / 0 FAIL. Final run above includes final SQL table allowlist and populated-view tests. No test weakened.

Real isolated PostgreSQL tests prove denied owner-only read/insert, denied capability self-provisioning, allowed scoped read, denied ordinary write/authority minting, revocation/expiry/containment/company/project/table/session/owner substitution, populated-view denial, restrictive policies on every finance/credit table, and immutable audit. Auth functions are explicit fixtures, not hosted Supabase authentication proof. Adjacent provider-rebind and action tests preserve consent/scope/no-write and exact fresh authorization contracts.

Gate proven for repository models and isolated PostgreSQL application-role enforcement under this trusted-server threat model. No production migration, hosted Auth/RLS acceptance, live provider, physical-device or real financial action is claimed. Work runtime briefly disconnected during final test collection; recovered result was verified before this evidence. Automatic preview status is reported separately. Main, production, Supabase, auth, protected release assets unchanged; no merge, deployment/promotion, real account connection, money movement, paid services or spend. Category 10 not started. P9.7 preserved.
