# COMMAND CENTER — BIOMETRIC SECURITY + RELIABLE UPDATE CLARIFICATIONS

Date: 2026-10-23
Status: **BINDING OWNER CLARIFICATIONS — INCORPORATE BEFORE SPECIFICATION LOCK v2**

## Canonical-count correction

These are **not new count-bearing canonical requirements**.

The reconciled baseline remains **5,825** until the current Agency/Foundry owner additions are fully deduplicated and reconciled.

- Biometric/fingerprint-backed security is explicit surfacing/clarification of existing identity/passkey/WebAuthn/device/security requirements.
- Reliable installed-PWA/application updates are explicit surfacing/clarification of existing update/version/cache/release/recovery requirements.

Controlling clarification metadata is also recorded in `Command_Center_Canonical_Owner_Additions_REV2.json`.

Do **not** create or use `CCR-05826` or `CCR-05827` as new canonical IDs merely for these two clarifications.

---

# OWNER-CLARIFY-20261023-BIOMETRIC

## Existing canonical scope clarified

Relevant existing requirement lineage includes:

- `CCR-04057`
- `CCR-04058`
- `CCR-04960`
- `CCR-05541`
- `CCR-05544`
- `CCR-05746`
- `CCR-05816`

## Owner intent

Command Center security must be top-notch. On James's Samsung, the installed app must support fingerprint/device-biometric-backed owner verification so private Command Center access and high-risk actions are not protected only by a long-lived browser/app session.

## Architecture requirement

Use **WebAuthn / passkeys with a platform authenticator and user verification required**. On compatible Samsung/Android devices, that platform authenticator can be backed by fingerprint or another OS-approved device verification method.

Command Center must never read, store, transmit, or compare raw fingerprint images or biometric templates. Biometric verification stays inside the device/authenticator boundary.

## Required behavior

1. **Enrollment**
   - Owner can enroll one or more passkey/WebAuthn credentials from a fully authenticated owner session.
   - Prefer the local platform authenticator where appropriate.
   - Registration requires user verification.
   - Store only public-key credential data and safe authenticator metadata needed for verification.

2. **App unlock**
   - A valid server/auth session alone is not enough after the local lock policy triggers.
   - Supported devices require a WebAuthn assertion with user verification required.
   - UI labels the actual device capability truthfully.

3. **Automatic relock**
   - Relock after configured background timeout.
   - Relock after restart when the local unlock lease is invalid.
   - Relock after explicit lock/sign-out, security containment, credential revocation, or device-trust changes.
   - Never leave sensitive content rendered underneath a cosmetic lock overlay.

4. **Fresh verification for protected actions**
   - High-risk actions require fresh user verification when the authorization freshness window has expired.
   - Includes money movement, purchases, publishing, external communications, merge/deploy, destructive deletion, permission/security changes, credential management, protected-asset changes, legal acceptance, and other policy-classified protected actions.

5. **Recovery / lockout protection**
   - Support multiple enrolled credentials where practical.
   - Recovery must not silently weaken identity assurance.
   - Lost/stolen-device flow revokes affected credential/session/device trust.
   - Recovery generates audit evidence and may require broader reauthentication.

6. **Privacy / anti-spoofing**
   - No biometric template enters Supabase, GitHub, logs, analytics, Brain memory, Agency state, or browser storage.
   - No custom JavaScript/device-fingerprinting mechanism is accepted as biometric authentication.
   - UI cannot claim biometric verification succeeded unless the WebAuthn assertion is actually verified.

7. **Compatibility / fallback**
   - If the platform authenticator uses another OS-approved screen-lock method, label it truthfully.
   - Unsupported devices use a secure owner-policy fallback/recovery path; no silent bypass.

## Acceptance obligations

- Register a platform passkey on the physical Samsung.
- Verify user-verification-required unlock.
- Verify failed/cancelled verification leaves private content locked.
- Verify background timeout relocks.
- Verify sensitive content is not left rendered after relock.
- Verify protected-action step-up.
- Verify credential/session/device revocation.
- Verify no biometric data is stored.
- Verify final Samsung acceptance only in Category 15.

## Roadmap placement baseline

Primary impacted areas include identity/authentication, device/session inventory, policy/risk, protected-action gates, security events/incidents, security adversarial testing, app shell/startup, PWA/device behavior, Category 15 security audit, and Samsung physical acceptance.

---

# OWNER-CLARIFY-20261023-UPDATES

## Existing canonical scope clarified

Relevant existing requirement lineage includes:

- `CCR-00306`
- `CCR-00312`
- `CCR-00313`
- `CCR-00316`
- `CCR-00649`
- `CCR-00681`
- `CCR-00852`
- `CCR-00853`
- `CCR-00971`
- `CCR-01000`
- `CCR-01438`
- `CCR-01463`
- `CCR-01466`
- `CCR-01965`
- `CCR-01982`
- `CCR-01990`
- `CCR-02000`
- `CCR-02001`
- `CCR-02203`
- `CCR-02251`
- `CCR-02252`
- `CCR-05143`
- `CCR-05666`
- `CCR-05668`
- `CCR-05669`
- `CCR-05769`
- `CCR-05771`

## Owner intent

Installed Command Center updates must actually work. A Samsung/PWA user must not remain on stale runtime/UI files after a release, and an update must not create mixed-version app/cache/schema state.

## Required update architecture

1. **Single immutable release identity**
   - Every release has a unique release ID tied to exact source/artifacts/checksums.
   - HTML, JS, CSS, manifest, service worker, schema/API compatibility, and protected static assets resolve to the same release identity.

2. **Update discovery**
   - Check for updates on startup after connectivity is available.
   - Check again after a meaningful background interval/foreground return.
   - Provide explicit owner `Check for update` behavior.
   - Use standards-based service-worker/application update mechanisms rather than assuming a long-lived cached worker will refresh itself correctly.

3. **Two-phase install / activate**
   - Download/install the new worker and required static artifact set first.
   - Validate asset/release compatibility before activation.
   - Never activate a half-cached release.
   - Never mix an old page runtime with incompatible new assets/contracts.

4. **Safe activation policy**
   - Compatibility-safe releases may activate at a safe boundary.
   - Releases that could interrupt protected/in-flight work wait for a safe state or explicit restart/update boundary.
   - Immediate worker takeover mechanisms are permitted only when the release protocol proves they cannot create mixed-version state.

5. **Controller-change / reload handshake**
   - New activation triggers a controlled one-time reload or compatible runtime handshake.
   - Prevent reload loops.
   - Preserve safe navigation/resume state where compatible.
   - Do not duplicate active Agency/protected operations during reload.

6. **Cache discipline**
   - Static caches are release-versioned.
   - Old caches are removed only after new activation succeeds.
   - Sensitive auth/API/private responses are never treated as static app assets.
   - Runtime caches have explicit freshness/expiration rules.

7. **Release compatibility**
   - Frontend release declares compatible schema/API contract where applicable.
   - Incompatible client/server/database combinations fail closed into a recovery/update-required state rather than operating unpredictably.

8. **Rollback / known-good**
   - Preserve prior known-good release metadata/rollback target.
   - Failed post-deploy health checks block promotion or trigger defined rollback.
   - Rollback must include service-worker/cache compatibility, not only source-code rollback.

9. **Update observability**
   - Record discovery, download, waiting, activation, reload, failure, rollback, controller version, and cache/release identity.
   - Expose owner-readable update health without leaking sensitive information.

10. **Offline behavior**
    - Existing known-good shell continues to open offline.
    - Update attempts do not destroy the last known-good offline shell before replacement is verified.
    - Update reconciliation resumes after connectivity returns.

11. **Physical Samsung acceptance**
    - Install an older known-good Command Center release.
    - Deploy a newer real production release.
    - Verify the installed PWA reaches the newer release without routine uninstall/reinstall.
    - Verify runtime/cache/manifest/icon/release identity.
    - Verify Back, scroll, session lock, and protected state survive the update.
    - Verify no stale visual screen remains after controlled activation.

## Roadmap placement baseline

Primary impacted areas include kernel recovery, realtime/reconciliation, app shell/startup, PWA/install/update, regression testing, backup/restore, schema migration/rollback, chaos/recovery, exact release candidate, production deployment, Samsung acceptance, and final completion lock.

---

## Current roadmap status

These two clarifications remain binding during the current owner review, but the roadmap has since expanded substantially through The Agency, Project Foundry, Conversational Project Studio, autonomy governance, and portfolio/domain playbooks.

Therefore all phase references above are **placement baselines only** until the expanded Master Build Plan is reconciled. The final phase count is not yet locked.
