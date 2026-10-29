## Scope and authority

- [ ] This change is limited to the stated requirement/defect and preserves current architecture.
- [ ] I recorded the source branch, commit, and affected canonical requirement IDs.
- [ ] James Morgan's reserved authority and Command Center's top-level control-plane role are preserved.

## Safety and compatibility

- [ ] Company/project isolation, authorization, revocation, RLS, and protected-action rules were reviewed where affected.
- [ ] No secret or private data was added to fixtures, logs, evidence, or exports.
- [ ] Migration, version compatibility, recovery, and rollback behavior were considered where affected.
- [ ] Provider, production, financial, legal, external-communication, and device actions remain separately authorized.

## Evidence

- [ ] Focused positive behavior is covered.
- [ ] Relevant negative/unauthorized and failure-path behavior is covered.
- [ ] I ran only the relevant checks listed below and recorded exact outcomes; unchecked means not run.

| Check | Exact command/source | Result or link |
|---|---|---|
| Focused tests | | |
| Typecheck/build, if affected | | |
| Security/adversarial checks, if affected | | |
| Source-bound CI/qualification evidence, if applicable | | |

- [ ] Evidence is bound to the exact source and does not claim production, provider, owner, legal, or physical-device acceptance that was not observed.
- [ ] Generated traceability was changed only through its guarded repository-native workflow.
- [ ] Open blockers and unproven claims are listed below.

## Remaining blockers or limits

<!-- State unresolved evidence, acceptance, compatibility, or scope boundaries. Do not imply completion from this checklist. -->
