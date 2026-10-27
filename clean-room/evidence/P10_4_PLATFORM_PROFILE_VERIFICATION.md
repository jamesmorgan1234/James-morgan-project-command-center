# P10.4 — Platform transformation and compliance profiles

Authority: Roadmap 14 P10.4 / Roadmap 22. Exit: **Provider rule changes update profiles/adapters rather than core workflows.** Base `0e5ddc0ea633b53c5ac65a9a6a095f3ded1a4015`, tree `9a3f659615b153eba6e4f54d6eeb6ac1b3560cf7`.

Inspected existing profiles.ts registry/adapter contracts, P10.4 tests and profile/adapter SQL. Reused versioned registries and exact historical adapters, not provider-specific rules in publishing core. Existing tests already prove changing profile/adapter versions changes transformed caption/disclosures while old versions remain reproducible.

Gaps: rule-driven adapter ignored providerConstraints; cross-owner delimiter keys could collide; deprecation/policy identity absent; SQL profile adapter FK did not bind platform. Repairs: tuple keys; optional declared policy version/deprecation; reject deprecated or time-unverified profile use; generic adapter enforces declared media count/dimensions/aspect/duration, links/hashtags, rights evidence, schedule timing/capability and publishing availability. Missing measurements, invalid rule values and unknown constraints fail closed and require a capable new adapter. No invented current provider policy defaults: profiles/tests are synthetic, sourced versioned contracts. A provider change updates profile/adapter, not core publishing logic.

Additive migration adds policy/deprecation declarations and serializes profile lineage checks: exact owner/platform/adapter linkage, increasing version/observation time, nonblank policy/evidence/media/disclosure values, immutable historical records. Existing views and history preserved; real publishing must select a current nondeprecated profile through trusted registry/storage, not caller-provided profile data. Historical reproducibility is not current publishing permission.

Changed: src/social/profiles.ts; tests/p10-4-profile-hardening.test.mjs; tests/helpers/social-postgres.mjs (phase-4 migrations); supabase/migrations/20261027230000_p10_4_profile_policy_guards.sql; this evidence.

Executed: strict TypeScript PASS; module build PASS; `node --test --test-reporter=spec clean-room/tests/p10-4-*.test.mjs clean-room/tests/social-foundation.test.mjs`: **16 PASS / 0 FAIL / 0 skipped/cancelled** (8 P10.4, 8 adjacent). Tests exercise changed constraints without core rewrites, reproducibility, unsupported/deprecated profiles, owner-key collisions, real PostgreSQL wrong-platform/version denial and immutable history. `git diff --check` PASS.

Gate proven for registry/adapter/schema contracts, not verification of live provider policy or real uploads. Measured metadata and rights require trusted source evidence before actual dispatch; no network policy data or compliance certification invented. Final whole-category suite pending. No posts/messages/accounts, main/production/Supabase/auth/protected assets, Category 9/15 repair, paid services or spend. Category 11 not started.
