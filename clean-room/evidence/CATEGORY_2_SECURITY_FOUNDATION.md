# Category 2 — Identity, Security, Permissions and Recovery

Status: **PARTIAL — branch implementation and mandatory QA are complete; production application, provider hardening, and physical owner/device acceptance remain unauthorized/unverified.**

This file records the reconciled Category 2 state. It deliberately distinguishes branch implementation from live production state. No migration, production deployment, main-branch merge, provider-setting change, or physical-device acceptance is implied by this evidence.

## Verified branch QA checkpoint

Core security/runtime checkpoint:

`e6fec777d66e7406f771db7c26634c72559adb40`

GitHub Actions run:

`40099600448`

Observed result at that checkpoint:

- Typecheck: PASS.
- Repository audit: PASS (`704/704` tracked files reviewed, `0` secret findings, `0` violations).
- Build: PASS.
- Release artifact audit: PASS.
- Module/security/adversarial tests: **226/226 PASS**.
- Protected-asset/release-candidate audit: PASS.
- PWA lifecycle: PASS.
- Final Category 15 nonproduction phase gate: expected FAIL because Category 2 intentionally changes runtime code after the frozen evidence-only Category 15 candidate. That truthful gate has not been weakened or falsified.

## P2.1 — Authentication architecture

Status: **IMPLEMENTED BUT UNVERIFIED**

Branch implementation includes:

- same-origin Vercel auth proxy;
- HttpOnly `__Host-cc-owner-refresh` refresh-token broker;
- `Secure`, `SameSite=Strict`, root-path cookie semantics;
- origin / fetch-site validation;
- server-side refresh-token rotation;
- browser receives access/public session state only, never the broker refresh token;
- browser owner session storage is ephemeral;
- owner access/refresh tokens are not persisted to `localStorage`;
- refresh/session failures fail closed and clear broker state;
- `ManagedOwnerRuntimeProvider` preserves the existing `signIn` / `signOut` API while adding security management.

The architecture is covered by owner-session broker, proxy-routing, recovery, and adversarial tests. It is not marked verified complete because the changed runtime is not deployed/accepted in production.

## P2.2 — Passkey / WebAuthn owner identity

Status: **READY FOR OWNER ACCEPTANCE**

Branch implementation includes:

- owner passkey sign-in through the canonical auth transport;
- registration explicitly forces platform authenticator attachment;
- resident/discoverable credential requirement;
- `userVerification: "required"` is forced for registration and authentication even if provider options are weaker;
- a reported cross-platform authenticator fails closed;
- multiple credential list/register/rename/remove support;
- Settings UI exposes only passkey metadata;
- Command Center stores no fingerprint, face, PIN, biometric template, private key, or raw credential secret;
- passkey removal requires a new platform-UV ceremony, then a fresh critical single-use authorization, then authorization consumption, then provider deletion;
- password sign-in remains the recovery fallback and does not silently bypass protected-action verification.

Physical Samsung/platform-authenticator registration, assertion, management, and removal remain an owner/device acceptance boundary and are not fabricated by branch tests.

## P2.3 — Device and session inventory

Status: **IMPLEMENTED BUT UNVERIFIED**

Branch migration `20261024102000_category2_session_device_inventory.sql` adds canonical owner device/session inventory and makes authorization fail closed for revoked sessions/devices.

Branch migration `20261024110000_category2_protected_session_device_revocation.sql` disables the original ungated revoke entry points and replaces them with fresh, single-use authorized session/device revocation.

Runtime Settings now exposes owner-visible current-session marker, device label/platform, trust state, assurance, session start/last seen/revocation state, revoke-session action, and revoke-device-and-bound-sessions action.

Only a random non-secret device UUID is persistently stored client-side. Access/refresh tokens remain outside persistent browser storage.

These migrations/UI changes are branch-only and are not claimed as applied production state.

## P2.4 — Authorization, policy, and risk engine

Status: **IMPLEMENTED BUT UNVERIFIED**

Branch migration `20261024103000_category2_policy_single_use_authorizations.sql` centralizes protected-action policy:

- unknown protected actions deny by default;
- risk class, resource class, and freshness TTL are server-owned;
- caller-supplied risk/resource values must exactly match server policy and cannot downgrade it;
- authorizations record source session, fresh-verification timestamp, and policy version;
- authorizations are single-use and transition to `consumed` at the actual protected boundary;
- authorization replay, mismatched resource/action, expired verification, revoked source session, and revoked device fail closed;
- pre-hardening outstanding authorization rows without required provenance are revoked by the migration.

`20261024105700_category2_sol_medium_policy_alignment.sql` preserves the existing exact Sol Medium `protected` owner-approval semantics while retaining server ownership of policy.

## P2.5 — Secrets and credential-reference isolation

Status: **IMPLEMENTED BUT UNVERIFIED**

Branch security/runtime work includes recursive reference-only metadata validation, nested secret-field rejection, secret-like value detection, browser removal from raw webhook secret-hash access, metadata/reference/health-only owner surfaces, server-only webhook rotation, and canonical authorization consumption for provider writes.

The browser cannot self-assert provider reconnect success. No live provider credential or secret has been changed by this branch work.

## P2.6 — RLS and canonical data boundaries

Status: **PARTIAL**

Live production read-only verification on Supabase project `gmlsucpwliegwlxymjvp` established:

- observed public tables have RLS enabled;
- observed public views use `security_invoker=true`;
- anonymous roles have no direct access to the inspected security tables/views;
- authenticated clients have SELECT-only access to the inspected security evidence tables;
- `security_audit_events` is append-only from the ordinary authenticated-client boundary;
- security policies are owner-scoped and use canonical authorization checks;
- `agent_runner_controls` and `command_center_members` are fail-closed to ordinary roles because direct table privileges are absent;
- queue wrapper RPCs delegate to a private helper that checks `auth.uid()`, canonical authorization, and owner scope;
- `command_center_agent_service_set_auto(uuid,boolean)` verifies `auth.uid() = p_owner_id` plus canonical authorization before mutation;
- `command_center_agent_service_get_auto(uuid)` was identified as a real browser-role ACL mismatch. Branch migration `20261024093000_category2_service_get_auto_acl_hardening.sql` removes browser execution and grants it only to `service_role`.

Remaining P2.6 blockers:

- branch ACL/schema hardening is not applied to production without owner authorization;
- Supabase security advisor still reports leaked-password protection disabled; that provider setting has not been changed without authorization;
- `SECURITY DEFINER` advisor findings are classified individually rather than treated as automatic vulnerabilities.

## P2.7 — Protected-action gate and fresh verification

Status: **IMPLEMENTED BUT UNVERIFIED**

Branch implementation includes signed AMR-based fresh verification, bounded freshness windows, one-time authorization consumption, authorization tied to a live source session/device, protected Agent execution at the canonical database state transition, integration write execution gating, critical passkey removal gating, protected session/device revocation, and server-owned policy classes for deployment, merge, publishing, communications, money, legal, protected assets, credentials/security, Agent, and integrations.

No production protected side effect was executed while building or testing this branch.

## P2.8 — Security events and incident response

Status: **IMPLEMENTED BUT UNVERIFIED**

Live production already contains durable owner-scoped security audit/alert evidence.

Branch migration `20261024105000_category2_security_incident_response.sql` adds the durable lifecycle:

`open -> acknowledged -> contained -> recovering -> resolved`

Containment and recovery evidence are mandatory before resolution. Every transition appends to the existing immutable `security_audit_events` stream. The TypeScript incident model is reconciled to the same state machine.

The migration is not claimed as applied production state.

## P2.9 — Security adversarial and recovery suite

Status: **VERIFIED COMPLETE** for the isolated branch QA scope.

The mandatory branch suite covers authorization replay, stolen/revoked session reuse, privilege confusion, cross-owner/project access, untrusted integration/prompt-injection boundaries, secret leakage, RLS/ACL contracts, compromised-integration gating, policy downgrade, unsupported passkey downgrade, offline recovery, incident containment/recovery, and supply-chain seams.

Supply-chain hardening includes TypeScript pinned to `5.8.3`, `actions/checkout` pinned to `11d5960a326750d5838078e36cf38b85af677262`, `actions/setup-node` pinned to `49933ea5288caeca8642d1e84afbd3f7d6820020`, dependency installation with `--ignore-scripts`, and read-only workflow contents permission.

The mandatory branch suite passed as part of the **226/226** exact-head core test result above.

## Remaining authorized-work boundary

Category 2 cannot truthfully be called production-verified from branch work alone. Remaining actions require boundaries that are currently unauthorized or physically owner-bound:

1. Apply the prepared Category 2 Supabase migrations to production and verify resulting policies/RPC grants/state.
2. Deploy/promote the changed runtime and verify the live application.
3. Perform physical Samsung/platform-authenticator passkey registration/assertion/rename/remove acceptance and session/device revocation tests.
4. Enable and verify Supabase leaked-password protection or explicitly accept a different provider policy.
5. Re-run the adversarial/recovery suite against the applied production paths and capture final evidence.
6. Only then advance Category 2 from PARTIAL/IMPLEMENTED states to production `VERIFIED COMPLETE`.

Until those authorized/owner-bound actions occur, branch implementation is preserved without altering production, main, Edge Finder, or the protected Command Center icon.
