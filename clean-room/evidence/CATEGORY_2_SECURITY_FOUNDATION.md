# Category 2 — Identity, Security, Permissions and Recovery

Status: **VERIFIED COMPLETE FOR CATEGORY-2 CLEAN-ROOM SCOPE**

Authority: the current integrated 199-phase roadmap, with the exact P2.1–P2.9 scope and exit gates inherited from `roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md`.

Authoritative branch: `build/spec-lock-v2-clean-room`

This acceptance closes Category 2 at the clean-room branch boundary. It does **not** claim or authorize a production migration, deployment/promotion, provider-setting mutation, main-branch merge, or physical Samsung/device acceptance. The roadmap explicitly reserves owner/Samsung acceptance for Category 15.

## Exact regression evidence before this evidence-only closure

Clean-room implementation/test head:

`074dc65888149e5d5b0a31a034b6fbc763591000`

GitHub Actions workflow:

`.github/workflows/spec-lock-v2-clean-room-qa.yml`

Run:

`41083938163`

The following gates passed on that implementation head:

- locked dependency installation;
- TypeScript typecheck;
- repository security audit (`820/820` files scanned, `0` secret findings, `0` policy violations);
- build;
- release-artifact audit (`20/20` files scanned, `0` secret findings, `0` policy violations);
- full `npm run test:modules` test gate (`tests/*.test.mjs`), including the Category-2 security, recovery, RLS, protected-action, and adversarial acceptance tests;
- strict architecture contract audit;
- protected-asset and release-candidate audits;
- PWA lifecycle checks; and
- isolated audit-script regression fixtures.

The workflow later failed only at `FINAL CATEGORY-15 NONPRODUCTION PHASE GATE`. That is an intentional later-category release/acceptance boundary and is not a Category-2 regression.

The branch then advanced to `143a2ff576e329ddfec26fe82dcb11ba3b5c8cac` only to add `CURRENT_BUILD_AUTHORITY.md`; that commit did not change `clean-room/` implementation or tests. Therefore the tested clean-room tree is the implementation basis for this Category-2 closure.

## P2.1 — Authentication architecture

Status: **PASS**

The authentication/session architecture fails closed for expired, revoked, risky, forged, mismatched, or otherwise non-live sessions. Recovery remains provider-mediated and cannot silently bypass authorization.

Primary acceptance coverage:

- `tests/category2-p21-auth-recovery.test.mjs`
- `tests/category2-p21-auth-risk.test.mjs`
- `tests/owner-session-broker.test.mjs`
- `tests/owner-session-environment-binding.test.mjs`
- `tests/owner-auth-proxy-routing.test.mjs`

**Exit gate satisfied:** expired/revoked/risky sessions fail closed; recovery cannot bypass authorization.

## P2.2 — Passkey / WebAuthn owner identity

Status: **PASS**

The owner passkey contract requires platform-authenticator user verification, rejects unsupported or downgraded authenticator paths, supports multiple credentials and revocation/management, and stores no biometric template/private key material.

Primary acceptance coverage:

- `tests/category2-p22-passkey-contract.test.mjs`
- `tests/owner-passkey-auth.test.mjs`
- `tests/owner-passkey-management-runtime.test.mjs`
- `tests/supabase-passkeys.test.mjs`

**Exit gate satisfied:** UV-required registration/assertion behavior is enforced and unsupported devices never silently bypass verification.

Physical Samsung/platform-authenticator acceptance remains a Category-15 owner/device gate; it is not fabricated by branch tests.

## P2.3 — Device and session inventory

Status: **PASS**

The branch maintains owner-visible session/device state, assurance, bindings, trust state, activity, revocation, stolen-device containment, and local/global settings. Revoked devices invalidate bound sessions and protected access paths.

Primary acceptance coverage:

- `tests/category2-p23-device-revocation.test.mjs`
- `tests/category2-p23-inventory.test.mjs`
- `tests/category2-p23-settings.test.mjs`
- `tests/category2-p23-stolen-device.test.mjs`
- `tests/category2-session-revocation-gates.test.mjs`

**Exit gate satisfied:** revoked devices/sessions lose protected access consistently in the clean-room security/runtime contracts.

## P2.4 — Authorization, policy, and risk engine

Status: **PASS**

Protected actions resolve through centralized deny-by-default policy, scoped permissions, risk/assurance rules, freshness, expiry/revocation, and auditable precondition decisions.

Primary acceptance coverage:

- `tests/category2-p24-policy-audit.test.mjs`
- `tests/category2-p24-precondition-audit.test.mjs`
- `tests/category2-policy-compatibility.test.mjs`

**Exit gate satisfied:** every protected action resolves through one auditable policy decision and precondition failures are recorded before side effects.

## P2.5 — Secrets and credential-reference isolation

Status: **PASS**

Secret-bearing channels are server/reference-only; provider health and owner surfaces remain metadata/reference based; secret-like material is rejected or redacted from ordinary logs, URLs, notes, Brain channels, errors, and client-safe provider state. Provider replacement/rotation paths do not expose raw secret material.

Primary acceptance coverage:

- `tests/category2-p25-provider-replacement.test.mjs`
- `tests/category2-p25-secret-channels.test.mjs`
- `tests/security-foundation.test.mjs`

**Exit gate satisfied:** confidential secret material is prevented from reaching the prohibited client/ordinary channels covered by the contract suite.

## P2.6 — RLS and canonical data boundaries

Status: **PASS**

The canonical boundary contract is owner/project/company/business/account/environment aware, defaults to least privilege/read-only where write authority is absent, and fails closed for omitted or cross-boundary dimensions. The prepared migration forces RLS on canonical scope grants, removes ordinary direct mutation, and exposes only narrow authenticated boundary/project RPCs.

Primary acceptance coverage:

- `tests/category2-p26-boundary-adversarial.test.mjs`
- `tests/category2-p26-rls-contract.test.mjs`
- `tests/category2-database-hardening.test.mjs`

**Exit gate satisfied:** adversarial read/write attempts cannot cross the authorized canonical data boundary in the clean-room contracts and migration structure.

Applying those migrations to production is a later protected production action; production application is not required to truthfully satisfy this branch exit gate and was not performed here.

## P2.7 — Protected-action gate and fresh verification

Status: **PASS**

Protected side effects execute only after a live, intent-bound, fresh authorization. Stale verification, expired/revoked/absent authorization, changed intent, session mismatch, replay, and unregistered protected actions all fail before the side effect executes.

Primary acceptance coverage:

- `tests/category2-p27-protected-side-effects.test.mjs`
- `tests/category2-session-revocation-gates.test.mjs`
- `tests/security-foundation.test.mjs`

**Exit gate satisfied:** no protected side effect executes from stale or absent authorization/verification.

## P2.8 — Security events and incident response

Status: **PASS**

Incident drills produce append-only suspicious/opened/contained/recovering/resolved evidence, enforce monotonic lifecycle timing, support alert acknowledgement/resolution, and keep notification text privacy-safe.

Primary acceptance coverage:

- `tests/category2-p28-incident-drill.test.mjs`

**Exit gate satisfied:** incident drills yield traceable containment and recovery evidence.

## P2.9 — Security adversarial and recovery suite

Status: **PASS**

The mandatory branch suite covers authorization replay, stolen-session reuse, privilege confusion, unavailable policy, prompt/model-content injection into authority, secret leakage, compromised integration signatures, assurance downgrade, offline recovery bypass, canonical data-boundary attacks, and backend/supply-chain identity downgrade.

Primary acceptance coverage:

- `tests/category2-p29-adversarial-security.test.mjs`
- `tests/category2-adversarial-recovery.test.mjs`
- `tests/category2-p26-boundary-adversarial.test.mjs`

**Exit gate satisfied:** the mandatory security/adversarial suite passed in the full `npm run test:modules` gate.

## Category-15 boundaries deliberately deferred

The following remain later production/owner acceptance obligations and are **not** silently reclassified as Category-2 blockers:

1. Apply authorized security/database migrations to production and verify live policy/RPC state.
2. Deploy/promote the exact release candidate and verify the live runtime.
3. Perform physical Samsung/platform-authenticator and owner-device acceptance.
4. Make any authorized provider-console security-setting changes and verify them live.
5. Run final production/live, release-candidate, and physical-device acceptance required by Category 15.

No production deployment, main merge, provider mutation, paid action, or physical-device acceptance was performed for this Category-2 closure.

## Advancement boundary

Category 2 / P2.1–P2.9 is verified complete for the clean-room branch scope. Category 3 remains the next roadmap category. This acceptance record does not start or claim completion of P3.
