-- Cover the Security-specific foreign key surfaced by the Supabase performance advisor.
create index if not exists security_audit_events_actor_user_fk_idx
  on public.security_audit_events(actor_user_id)
  where actor_user_id is not null;
