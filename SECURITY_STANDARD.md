# Command Center Security standard

This standard defines the completed Security capability for Command Center. It applies alongside the global checkpoint/roadmap standards and does not weaken existing project-specific authorization rules.

## Free-first security model

Security must remain $0/free-first unless James Morgan explicitly authorizes a paid feature.

Command Center uses Supabase Auth's TOTP MFA capability because TOTP MFA is available on all Supabase projects. It does not enable phone MFA, paid SMS/WhatsApp MFA, Pro-only organization MFA enforcement, or other paid security add-ons without exact authorization.

Supabase leaked-password protection is a useful additional control but is available only on the Pro plan and above. While the Command Center Supabase organization remains on the Free plan, this is an accepted plan limitation rather than an excuse to spend money or falsely claim the warning is resolved. Compensating controls are live-session validation, optional free TOTP MFA, strict RLS, narrow RPC grants, explicit action authorization, audit history, alerts, and revocation controls.

## Phase 1 — Identity & Session Controls

A signed-in user is not automatically authorized.

Command Center authorization requires all of the following:

1. `auth.uid()` belongs to an active Command Center member.
2. That member has not been revoked or disabled.
3. The JWT `session_id` still exists as a live row in `auth.sessions` for that user.
4. The session has not passed its `not_after` boundary when one is present.
5. If the member has at least one verified MFA factor, the current JWT must have `aal2` assurance.

This gives revoked-session checking stronger semantics than relying only on JWT expiry.

MFA is never silently enrolled. If no verified MFA factor exists, an ordinary active member session may continue at `aal1`. Once the user explicitly enrolls a verified TOTP factor, Command Center automatically requires `aal2` for protected access.

Ordinary **Sign out** means local/current-session sign-out. Global sign-out and revoking other sessions are separate, explicit security actions.

## Phase 2 — Row-Level Data Isolation

Every table exposed through the public schema must have RLS enabled. Public views used by the browser must run with `security_invoker=true` so they inherit underlying RLS.

Browser table access is never granted to the anonymous role. Legacy RLS policies must target `authenticated` rather than `PUBLIC` even when their predicates already check `auth.uid()`.

Browser roles do not need structural table privileges such as `TRUNCATE`, `TRIGGER`, or `REFERENCES`.

No exposed `SECURITY DEFINER` function may be executable anonymously. Trigger-only definer functions are not browser RPCs. Intentional signed-in definer RPCs must have explicit authorization/ownership checks and narrow grants.

## Phase 3 — Permission Registry

`security_permission_registry` is the normalized, owner-scoped map of effective security permissions. It is derived from verified source-of-truth rows rather than manually invented entries.

Current synchronized principals include:

- Command Center member access
- Integration connection scopes
- Automation action authorization
- Security protected-action authorization

The registry records source table/source ID evidence so an entry is traceable to its canonical authorization source.

## Phase 4 — Action Authorization Gates

Security does not replace the explicit gates already built into Automation and Integrations:

- Automation actions require their existing authorized/active state.
- Integration writes require their existing explicitly authorized write request plus connection write scope.

Security adds a generic, idempotent protected-action authorization contract for Security and future Agent Mode. An authorization has an action, resource, risk level, optional reason/expiry, and durable state. Browser code cannot insert arbitrary authorization rows directly; it uses controlled RPCs.

Authorization is explicit and does not mean the action itself has executed.

## Phase 5 — Secrets Isolation

The browser may contain only public/publishable client configuration such as the Supabase `sb_publishable_...` key.

The following must never appear as literal browser assets, UI text, logs, checkpoints, or client-side storage:

- Supabase service-role/secret keys
- OAuth client secrets
- provider API secrets/tokens that require confidential storage
- webhook signing secrets after their one-time setup display
- TOTP enrollment secrets after the active enrollment flow ends

Server secrets belong in Edge Function environment variables or another server-only secret store. `command_center_private` remains inaccessible to browser roles.

## Phase 6 — Audit Trail

`security_audit_events` is append-only from the browser's perspective. Users may read their own events but cannot directly edit or delete them.

Database triggers audit meaningful protected state changes using minimal metadata only. Audit records do not copy email bodies, webhook payloads, passwords, tokens, provider secrets, or other unnecessary content.

Controlled client security events are logged through a whitelisted RPC that sets event severity and identity server-side.

## Phase 7 — Security Alerts

Warning/critical audit events create durable `security_alerts` records. The browser cannot fabricate alert rows directly.

Alerts can be acknowledged, resolved, or reopened only through the controlled alert-state RPC. Alert text is derived from safe event metadata rather than private content.

MFA challenge failures, permission changes, authorization changes, session-revocation actions, and access revocation can therefore surface as reviewable security events.

## Phase 8 — Access Revocation & Recovery

The Security workspace provides explicit controls to:

- sign out the current session;
- revoke all other sessions while keeping the current session;
- request global sign-out of all sessions;
- enroll, verify, list, and explicitly unenroll TOTP MFA factors.

A browser session whose member access has been revoked cannot restore itself. Member recovery is service-role-only through `command_center_security_set_member_access_service`, preserving an external recovery path without creating a self-bypass.

Access-token behavior follows Supabase Auth semantics: revoking sessions invalidates refresh/session state, while a previously issued access JWT may continue until its expiry. Command Center therefore also validates the JWT session ID against live `auth.sessions` on every authorization check.

## Security completion evidence

Security is complete only when all of the following are true:

- all eight Security phases are implemented;
- the migration passes rollback/live QA;
- every public table has RLS;
- every public browser view is security-invoker;
- no legacy RLS policy targets `PUBLIC`;
- anonymous roles have no public-table access and no SECURITY DEFINER execution;
- browser-visible code contains no server secret material;
- permission registry, audit trail, alerts, action authorization and recovery controls are functional;
- MFA is not silently enabled for the user;
- all existing Command Center regression suites remain green;
- the exact production merge SHA is deployed and verified.
