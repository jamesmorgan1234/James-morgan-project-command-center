-- P12.8 branch-only hardening. Reuse the P1.1/PIF.1 canonical evidence ID contract.
-- Do not rewrite immutable historical evidence. Invalid existing rows block migration
-- and require separately authorized reconciliation before any database rollout.
begin;
alter table public.command_center_specialist_lifecycle_history
  add constraint p12_8_lifecycle_canonical_authorization
  check (authorization_ref is null or authorization_ref ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.command_center_specialist_project_history
  add constraint p12_8_project_canonical_authorization
  check (authorization_ref is null or authorization_ref ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint p12_8_protected_action_requires_authorization
  check (action not in ('rename','merge','activate','replace','archive') or authorization_ref is not null);
commit;
