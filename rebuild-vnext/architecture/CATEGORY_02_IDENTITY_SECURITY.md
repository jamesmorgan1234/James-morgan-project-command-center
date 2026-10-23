# Category 2 — Identity + Security

Status target: **IMPLEMENTED AND CATEGORY-QA VERIFIED** before Category 3 begins.

## Implemented contracts

- owner/session/device registry with expiration and revocation;
- authenticated does not imply authorized;
- default-deny Permission Registry;
- scoped, expiring, evidence-bearing authorization grants;
- authorization scope cannot silently broaden;
- Protected Action Registry;
- Security Gate that requires owner-trust source, active owner session, and matching explicit authorization;
- external content and model output cannot authorize protected actions;
- secret-reference registry that forbids secret-bearing fields;
- sensitivity classes and derived-output non-downgrade behavior;
- append-only in-memory security audit contract;
- explicit security-incident lifecycle;
- runtime composition exposes security services without coupling them to UI.

## Protected action classes represented by the architecture

Money movement, purchase/spending, account open/close, publication, communication/send, deployment/merge, destructive deletion, permission/security change, protected-asset change, legal acceptance, identity verification, MFA/security recovery.

## Explicit non-goals

No real identity provider connection, secrets, bank/social/provider credentials, Supabase mutation, production deployment, or public action is performed in Category 2.

## Exit gates

- default deny verified;
- scoped authorization verified;
- source-trust rule verified;
- revoked session rejected;
- secret-value rejection verified;
- sensitivity non-downgrade verified;
- incident lifecycle verified;
- Category 1 regression suite remains green.
