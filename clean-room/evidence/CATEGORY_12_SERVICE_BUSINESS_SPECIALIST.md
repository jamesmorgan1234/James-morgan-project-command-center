# P12.6 — Service-business specialist profile

Status: IMPLEMENTED FOR ISOLATED BRANCH VERIFICATION

## Truth ownership and isolation

`clean-room/src/specialists/service-business.ts` owns canonical service-business specialist contracts. The project binding is owner/project/company scoped and binds the service project to its CRM plus optional calendar and payment-provider references. CRM ownership is isolated per owner/project and provider substitution is rejected rather than silently accepted.

## Covered business lifecycle domains

The specialist preserves exact scoped state for:

- lead;
- estimate;
- contract;
- job;
- material;
- schedule;
- payment;
- follow-up;
- reputation.

Job linkage preserves lead/estimate/contract/job/schedule/payment lineage so a service project can recover the chain without flattening independent records.

## Durable evidence contract

`supabase/migrations/20261026140000_p12_6_service_business_specialist.sql` adds owner-isolated durable records for project bindings, state, and job linkage. Each mutable surface has append-only history. History mutation is rejected by database triggers. Recovery references, source/evidence references, actor identity, versioning, and owner-approval evidence are retained where applicable.

All service-business tables enable RLS and require both `auth.uid() = owner_user_id` and `public.is_command_center_authorized()` for authenticated access. No service-business specialist may broaden Command Center authority, cross owner/project boundaries, or convert historical evidence into authorization.

## Acceptance evidence

`clean-room/tests/p12-6-service-business-specialist.test.mjs` verifies:

- canonical truth ownership;
- generic future service-project registration without hard-coded business identity;
- CRM isolation across projects;
- complete service-state domain validation;
- lead/estimate/contract/job/schedule/payment lineage validation;
- cross-project rejection;
- durable immutable history and recovery fields;
- Command Center authorization enforcement in the database contract.

Full verification requires the exact commit containing these artifacts to pass the repository's build/typecheck/test/audit workflow. This evidence file alone is not a CI result and does not authorize production actions.
