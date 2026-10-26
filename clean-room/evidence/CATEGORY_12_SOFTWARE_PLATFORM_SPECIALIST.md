# P12.7 — Software-platform specialist profile

Status: IMPLEMENTED FOR ISOLATED BRANCH VERIFICATION

## Truth ownership and isolation

`clean-room/src/specialists/software-platform.ts` owns canonical software-platform specialist contracts. Each platform binds owner/project/company identity to an exact repository and deployment provider. Repository ownership is isolated per owner/project, and silent repository/provider substitution is rejected.

## Covered platform domains

The specialist preserves exact scoped state for:

- user;
- role;
- roadmap;
- repository;
- deployment;
- provider;
- analytics;
- support;
- monetization.

Deployment evidence must bind the exact canonical repository, commit, environment, deployment provider, and deployment reference for the project. A deployment record is evidence, not authority to deploy.

## Durable evidence contract

`supabase/migrations/20261026141000_p12_7_software_platform_specialist.sql` adds owner-isolated durable project bindings, state history, and immutable deployment evidence. Recovery/source/evidence references and versions are retained. History and deployment evidence reject update/delete mutation through database triggers.

All tables enable RLS and require both `auth.uid() = owner_user_id` and `public.is_command_center_authorized()` for authenticated access. Specialist autonomy cannot bypass Command Center, protected actions, cost gates, environment boundaries, or exact-candidate production authorization.

## Acceptance evidence

`clean-room/tests/p12-7-software-platform-specialist.test.mjs` verifies generic future-platform registration, repository isolation, all platform-state domains, exact project/repository/provider deployment binding, cross-repository rejection, immutable evidence, recovery fields, and Command Center authorization enforcement in the database contract.

Full verification requires the exact commit containing these artifacts to pass the repository's build/typecheck/test/audit workflow. This file alone is not a CI result and does not authorize staging or production actions.
