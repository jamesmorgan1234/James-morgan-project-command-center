-- Allow MFA challenge events to be audited while a verified factor exists but the
-- current session has not yet reached aal2. This is intentionally narrower than
-- full Command Center authorization.

create or replace function command_center_private.is_live_member_session()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1
    from public.command_center_members m
    join auth.sessions s
      on s.user_id=m.user_id
     and s.id::text=(select auth.jwt()->>'session_id')
    where m.user_id=(select auth.uid())
      and m.access_status='active'
      and m.revoked_at is null
      and (s.not_after is null or s.not_after>now())
  );
$$;
revoke all on function command_center_private.is_live_member_session() from public,anon,authenticated;

create or replace function public.command_center_security_log_client_event(
  p_event_key text,
  p_target_type text default 'security',
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=(select auth.uid());
  event_id uuid;
  risk text;
  action_name text;
  mfa_pending_event boolean:=p_event_key in ('mfa.challenge_verified','mfa.challenge_failed');
begin
  if u is null then raise exception 'Unauthorized'; end if;
  if mfa_pending_event then
    if not command_center_private.is_live_member_session() then raise exception 'Unauthorized'; end if;
  elsif not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;

  if p_event_key not in (
    'session.revoke_others','session.signout_global','mfa.enrolled','mfa.unenrolled',
    'mfa.challenge_verified','mfa.challenge_failed','security.authorization.created',
    'security.authorization.revoked','security.integrity_warning'
  ) then raise exception 'Unsupported security event'; end if;

  risk:=case
    when p_event_key in ('mfa.challenge_failed','session.revoke_others','session.signout_global','mfa.unenrolled','security.authorization.created','security.authorization.revoked') then 'warning'
    when p_event_key='security.integrity_warning' then 'critical'
    else 'info' end;
  action_name:=case
    when p_event_key like 'session.%' then 'session_control'
    when p_event_key like 'mfa.%' then 'mfa_control'
    when p_event_key like 'security.authorization.%' then 'authorization_control'
    else 'integrity_check' end;

  insert into public.security_audit_events(
    owner_id,actor_user_id,actor_session_id,actor_aal,event_key,action,
    target_type,target_id,risk_level,source,success,metadata
  ) values (
    u,u,(select auth.jwt()->>'session_id'),(select auth.jwt()->>'aal'),
    p_event_key,action_name,coalesce(nullif(btrim(p_target_type),''),'security'),p_target_id,
    risk,'client',p_event_key<>'mfa.challenge_failed',coalesce(p_metadata,'{}'::jsonb)
  ) returning id into event_id;
  return event_id;
end $$;
revoke all on function public.command_center_security_log_client_event(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_security_log_client_event(text,text,text,jsonb) to authenticated;
