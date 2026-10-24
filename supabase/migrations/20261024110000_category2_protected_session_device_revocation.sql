-- Category 2 / P2.3 + P2.7 — owner-visible session/device revocation is protected.
-- Branch-only migration.

-- Retire the original owner-only entry points so callers cannot bypass fresh verification.
create or replace function public.command_center_revoke_owner_session(
  p_session_id uuid,
  p_reason text default 'owner_revoked'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Session revocation requires fresh protected authorization';
end;
$$;

create or replace function public.command_center_revoke_owner_device(
  p_device_id uuid,
  p_reason text default 'owner_revoked_device'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Device revocation requires fresh protected authorization';
end;
$$;

create or replace function public.command_center_revoke_owner_session_authorized(
  p_session_id uuid,
  p_authorization_id uuid,
  p_reason text default 'owner_revoked'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_reason text := coalesce(nullif(left(trim(coalesce(p_reason,'')),240),''),'owner_revoked');
begin
  if v_owner is null or not public.is_command_center_authorized() then raise exception 'not authorized'; end if;
  if p_session_id is null or not exists(
    select 1 from auth.sessions s where s.id=p_session_id and s.user_id=v_owner
  ) then raise exception 'unknown owner session'; end if;

  perform command_center_private.consume_action_authorization(
    v_owner,p_authorization_id,'security.revoke_session','owner_session',p_session_id::text
  );

  insert into public.command_center_owner_sessions(
    session_id,owner_id,assurance,first_seen_at,last_seen_at,revoked_at,revoked_reason
  )
  select s.id,v_owner,coalesce(s.aal::text,'unknown'),s.created_at,
         coalesce(s.updated_at,s.created_at),now(),v_reason
  from auth.sessions s
  where s.id=p_session_id and s.user_id=v_owner
  on conflict(session_id) do update
    set revoked_at=coalesce(public.command_center_owner_sessions.revoked_at,now()),
        revoked_reason=coalesce(public.command_center_owner_sessions.revoked_reason,excluded.revoked_reason)
  where public.command_center_owner_sessions.owner_id=excluded.owner_id;

  return true;
end;
$$;

create or replace function public.command_center_revoke_owner_device_authorized(
  p_device_id uuid,
  p_authorization_id uuid,
  p_reason text default 'owner_revoked_device'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_count integer := 0;
  v_reason text := coalesce(nullif(left(trim(coalesce(p_reason,'')),240),''),'owner_revoked_device');
begin
  if v_owner is null or not public.is_command_center_authorized() then raise exception 'not authorized'; end if;
  if p_device_id is null or not exists(
    select 1 from public.command_center_owner_devices d where d.id=p_device_id and d.owner_id=v_owner
  ) then raise exception 'unknown owner device'; end if;

  perform command_center_private.consume_action_authorization(
    v_owner,p_authorization_id,'security.revoke_device','owner_device',p_device_id::text
  );

  update public.command_center_owner_devices
     set trust_state='revoked',
         revoked_at=coalesce(revoked_at,now()),
         revoked_reason=coalesce(revoked_reason,v_reason)
   where id=p_device_id and owner_id=v_owner;

  update public.command_center_owner_sessions
     set revoked_at=coalesce(revoked_at,now()),
         revoked_reason=coalesce(revoked_reason,v_reason)
   where device_id=p_device_id and owner_id=v_owner and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.command_center_revoke_owner_session(uuid,text) from public, anon, authenticated;
revoke all on function public.command_center_revoke_owner_device(uuid,text) from public, anon, authenticated;
revoke all on function public.command_center_revoke_owner_session_authorized(uuid,uuid,text) from public, anon;
revoke all on function public.command_center_revoke_owner_device_authorized(uuid,uuid,text) from public, anon;
grant execute on function public.command_center_revoke_owner_session_authorized(uuid,uuid,text) to authenticated;
grant execute on function public.command_center_revoke_owner_device_authorized(uuid,uuid,text) to authenticated;
