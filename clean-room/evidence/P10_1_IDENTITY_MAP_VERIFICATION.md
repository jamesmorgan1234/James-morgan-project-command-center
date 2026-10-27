# P10.1 — Entity, brand, platform, and account identity map

Authority: Roadmap 14 P10.1, retained in Roadmap 22. Scope: companies/brands/projects/social accounts/platform identities, ownership, aliases and authorization scopes. Exit: **No cross-brand/account substitution; identity lineage is explicit.**

Base `46ed21fa8a95910eebb17eb24e60a3210431f5d9`, tree `8ed450a5a411617ce0aef974c37b997a4f258b16`. Authorized branch `build/spec-lock-v2-clean-room`.

Inspected identity.ts, existing P10.1 tests and migration, social-foundation tests and adjacent connection/publish contracts. Existing SocialIdentityMapRegistry is retained as the canonical detailed map; BrandAccountRegistry remains compatibility API, not a new competing model.

Defects: SQL uniqueness was per-version, allowing cross-version identity/account substitution; TypeScript discarded historical records, allowed backward observation time and account-ID duplicates across map records. Platform keys used ambiguous delimiter concatenation. Runtime enum/evidence/version validation was incomplete.

Repairs: additive migration validates existing ambiguous mappings before installing serialized owner-level lineage guards; canonical company/project/entity/brand/account/platform binding immutable, versions sequential, observation time cannot regress, aliases/lineage retained, duplicates blocked across versions. No history rewritten. TypeScript mirrors those guards, keeps frozen historical versions, preserves rename aliases/lineage, adds owner-scoped history lookup and optional exact company/project/entity lookup. Explicit supersession creates a new canonical record with predecessor lineage and keeps the old identity; reconnect of the same underlying account advances its existing version. Different underlying account cannot silently replace it. Connection status and credential/provider health remain owned by P10.2 instead of duplicated in identity records. Compatibility registry additionally rejects invalid versions/platforms/secret-like metadata.

Executed: strict TypeScript PASS; module build PASS; `node --test --test-reporter=spec clean-room/tests/p10-1-*.test.mjs clean-room/tests/social-foundation.test.mjs` **18 PASS / 0 FAIL / 0 skipped/cancelled** (10 P10.1, 8 adjacent). Real isolated PostgreSQL executes both migrations and proves cross-brand/version/account substitution denied, rename lineage retained, immutable history. `git diff --check` PASS.

Changed: src/social/identity.ts; tests/p10-1-identity-hardening.test.mjs; supabase/migrations/20261027223000_p10_1_identity_lineage_guards.sql; this evidence. Existing detailed records retain compatibility; stricter invalid histories fail migration instead of being guessed/repaired. Rollback containment: deny writes/reconcile explicit history; never remove guards to accept ambiguity.

Exit proven for repository models and isolated PostgreSQL lineage enforcement, not live platform ownership verification, hosted Supabase auth, production or operational publishing. Auth fixtures are explicitly test-only. Whole Category 10 and final full build remain pending later phases. No real social account connected, post/message sent, money spent, paid service activated, main/production/Supabase/auth/protected assets changed. No Category 9 or 15 repair. Category 11 not started.
