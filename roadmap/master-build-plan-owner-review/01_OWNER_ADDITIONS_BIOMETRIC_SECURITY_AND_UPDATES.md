# COMMAND CENTER — HISTORICAL RECOVERY CORRECTION + OWNER ADDITION

Date: 2026-10-23
Status: **MUST BE INCORPORATED BEFORE SPECIFICATION LOCK v2**

This file contains two different provenance cases and they must not be conflated:

1. **CCR-05826 — Biometric / fingerprint security** is a **recovered historical Command Center requirement that was missed during reconciliation**. Command Center history from 2026-10-19 shows James wanted phone-security integration so Command Center could use fingerprint instead of relying on password-only access, and security was prioritized over a simple keep-signed-in experience. It was discussed as a separate future feature rather than implemented in that specific build. James reconfirmed on 2026-10-23 that fingerprint was already part of the Command Center idea and must be in the roadmap.
2. **CCR-05827 — Reliable PWA / application updates** is an owner-directed requirement added/reconfirmed during the 2026-10-23 roadmap review after stale-update behavior exposed that the update lifecycle must be designed as a first-class system.

Neither is optional polish. Both are part of the owner-review canonical set before Specification Lock v2.

## CCR-05826 — RECOVERED HISTORICAL REQUIREMENT — BIOMETRIC / FINGERPRINT SECURITY

### Historical provenance correction

This requirement must not be labeled as newly invented on 2026-10-23. It is restored historical scope from the 2026-10-19 Command Center discussions. The prior recovery/reconciliation process failed to carry that feature forward explicitly.

### Owner intent

Command Center security must be top-notch. On James's Samsung, the installed app must support fingerprint-backed authentication/unlock so the private Command Center does not remain exposed merely because the device/browser session exists.

### Architecture decision

Use **WebAuthn / passkeys with the platform authenticator and user verification required**. On compatible Samsung/Android devices, the platform authenticator can use the device biometric authenticator such as fingerprint. Command Center must not attempt to read, store, transmit, or compare fingerprint images/templates itself; biometric verification stays inside the device/authenticator security boundary.

### Required behavior

1. **Enrollment**
   - Owner can enroll one or more WebAuthn/passkey credentials after a fully authenticated owner session.
   - Default preference is the local platform authenticator.
   - Registration requires user verification.
   - Credential metadata stores only public-key credential material and safe authenticator metadata required for verification; no biometric template ever enters Command Center.

2. **App unlock**
   - A valid server/auth session is necessary but not sufficient to expose private Command Center content after the local lock policy triggers.
   - On supported devices, unlock requires a WebAuthn assertion with `userVerification: required`.
   - The UI may say **Fingerprint / device biometric** where the OS confirms a biometric-capable platform authenticator, but the security contract is WebAuthn user verification rather than a fake browser-level fingerprint API.

3. **Automatic relock**
   - Relock when the app has been backgrounded beyond the configured secure interval.
   - Relock after browser/PWA restart when the local unlock lease is no longer valid.
   - Relock after session-risk signals, explicit lock, sign-out, security-event containment, credential revocation, or device-trust changes.
   - Never render sensitive content behind an unlocked DOM while a visual lock screen is merely overlaid.

4. **Fresh verification for protected actions**
   - High-risk actions require fresh user verification even if the app is otherwise unlocked when the authorization freshness window has expired.
   - Includes money movement, purchases, publishing, external communications, merge/deploy, destructive deletion, permission/security changes, credential management, protected-asset changes, legal acceptance, and other protected actions defined by the policy engine.

5. **Recovery / lockout protection**
   - Support more than one enrolled authenticator/passkey where available.
   - Recovery never weakens owner identity controls silently.
   - Lost/stolen-device flow revokes that credential/session/device trust.
   - Recovery events generate audit evidence and can force global session reauthentication.

6. **Privacy and anti-spoofing**
   - No fingerprint data or biometric template is stored in Supabase, GitHub, logs, analytics, Brain memory, Agent state, or browser storage.
   - No custom JavaScript "fingerprint authentication" or device fingerprinting is accepted as biometric authentication.
   - UI may not claim biometric verification succeeded unless the WebAuthn assertion verified server-side against the registered public key and challenge.

7. **Compatibility / fallback**
   - If the platform authenticator uses an OS-approved screen-lock method instead of fingerprint, Command Center must label the actual capability truthfully rather than claiming a fingerprint event it cannot observe.
   - Unsupported devices receive an explicit secure fallback/recovery path defined by owner policy; they do not bypass the strong-auth requirement silently.

### Acceptance tests

- Register a platform passkey on the physical Samsung.
- Verify unlock with `userVerification: required`.
- Verify failed/cancelled biometric challenge leaves all private content locked.
- Verify background timeout relocks.
- Verify sensitive data is not present in the rendered unlocked screen state after relock.
- Verify high-risk action step-up authentication.
- Verify credential revocation blocks subsequent assertions.
- Verify lost-device/session revocation path.
- Verify no biometric data is present in DB/logs/storage.
- Verify Samsung physical acceptance at Category 15.

### Roadmap impact

Primary phases to revise:
- P2.1 Authentication architecture
- P2.2 Passkey/WebAuthn-ready identity
- P2.3 Device/session inventory
- P2.4 Authorization and risk policy engine
- P2.7 Protected-action gate
- P2.8 Security Event / Incident Center
- P2.9 Security adversarial suite
- P4.2 Application shell and startup
- P4.6 PWA/install/update architecture
- P15.4 Full security/red-team audit
- P15.10 Samsung physical acceptance

---

## CCR-05827 — RELIABLE PWA / APP UPDATE SYSTEM

### Owner intent

Command Center updates must actually work properly. Installed Samsung/PWA users must not be left on stale UI/runtime files after a release, and an update must not create mixed-version runtime/cache state.

### Required update architecture

1. **Single version identity**
   - Every release has a unique immutable release ID tied to the exact source commit/artifact checksum.
   - HTML, JS, CSS, manifest, service worker, schema/migration compatibility, and protected static assets declare or resolve to the same release identity.

2. **Update discovery**
   - Check for service-worker/application updates on startup after connectivity is available.
   - Check again when the app returns to foreground after a meaningful background interval.
   - Allow an explicit owner `Check for update` action.
   - Use `ServiceWorkerRegistration.update()` or standards-equivalent browser mechanisms rather than relying only on a long-lived cached worker.

3. **Two-phase install / activate**
   - Download/install the new worker and static artifact set first.
   - Validate required asset availability and release-manifest compatibility before activation.
   - Never activate a half-cached release.
   - Do not mix an old page runtime with incompatible new cached assets.

4. **Safe activation policy**
   - A compatibility-safe release may activate automatically at a safe boundary.
   - A release that can interrupt an active protected workflow waits until the app reaches a safe state or the owner chooses to restart/update.
   - `skipWaiting()` / `clients.claim()` may be used only when the release protocol guarantees that immediate takeover cannot create mixed-version state.

5. **Controller change / reload handshake**
   - When a new worker becomes active, the page performs a one-time controlled reload or runtime handshake.
   - Prevent reload loops.
   - Preserve safe navigation/resume state where compatible.
   - Active Agent/protected operations must not be duplicated by reload.

6. **Cache discipline**
   - Static caches are namespaced by release ID.
   - Old static caches are removed only after the new release activates successfully.
   - Sensitive Supabase/API/auth responses are never cached as static app assets.
   - Runtime cache entries carry explicit freshness/expiration rules.

7. **Release compatibility**
   - Frontend release declares minimum/maximum compatible schema/API contract where applicable.
   - If the database/API is incompatible, fail closed into a recovery/update-required shell rather than operating on mismatched contracts.

8. **Rollback / known-good**
   - Preserve the prior known-good production release metadata and rollback target.
   - Failed post-deploy health checks block promotion or trigger the defined rollback process.
   - Cache/service-worker rollback must not strand the installed PWA between versions.

9. **Update observability**
   - Record release discovered, downloaded, waiting, activated, reload completed, failed, rollback, current controller version, and cache version.
   - Expose update health in Deployment / About-Advanced without leaking sensitive data.

10. **Offline behavior**
   - Existing known-good shell continues to open offline.
   - Update attempts never destroy the last known-good offline shell before the replacement is verified.
   - When connection returns, update discovery/reconciliation resumes.

11. **Physical Samsung update acceptance**
   - Install an older known-good Command Center release on the Samsung.
   - Deploy a newer release through the real production process.
   - Verify the installed PWA discovers and reaches the new release without uninstall/reinstall.
   - Verify icon/manifest/runtime/cache identity matches the new release.
   - Verify Back/scroll/session lock behavior survives the update.
   - Verify no stale visual screen remains after controlled activation.

### Roadmap impact

Primary phases to revise:
- P1.7 Kernel recovery shell
- P3.6 Realtime/reconciliation layer
- P4.2 Application shell and startup
- P4.6 PWA/install/update architecture
- P4.8 Visual/reference regression suite
- P14.1 Backup strategy
- P14.2 Restore and disaster recovery
- P14.3 Schema migration / rollback discipline
- P14.10 Long-horizon chaos suite
- P15.6 Full recovery/migration exercise
- P15.7 Exact release candidate
- P15.8 Production deployment
- P15.10 Samsung physical acceptance
- P15.11 Final completion lock

## Standards basis checked 2026-10-23

- W3C Web Authentication Level 3 is the current Recommendation and provides public-key credentials backed by authenticators with user consent/user verification.
- PWA service-worker update handling must follow the service-worker lifecycle: new worker discovery/install, waiting/activation behavior, controlled `skipWaiting()`/`clients.claim()` where safe, explicit registration update checks, and release-versioned cache management.

Both requirements are part of the owner-review canonical set before Specification Lock v2. CCR-05826 is a restored historical requirement; CCR-05827 is the reliable-update requirement captured during the current roadmap review.
