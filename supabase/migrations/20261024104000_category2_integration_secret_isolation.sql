-- Category 2 / P2.5 + P2.7 — integration secret isolation and protected write gates.
-- Branch-only migration. No live credential or provider state is changed by committing this file.

-- Secret hashes are server verification material, not ordinary owner-facing data.
revoke select on table public.integration_webhook_endpoints from authenticated;

create or replace function public.command_center_integration_webhook_status(p_connection_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  c public.integration_connections%rowtype;
  e public.integration_webhook_endpoints%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u and status<>'archived';
  if not found then raise exception 'Connection not found'; end if;
  select * into e from public.integration_webhook_endpoints where connection_id=c.id and owner_id=u;
  if not found then
    return jsonb_build_object('connection_id',c.id,'configured',false,'secret_ref',null,'status','not_configured');
  end if;
  return jsonb_build_object(
    'connection_id',c.id,
    'configured',true,
    'secret_ref','webhook:'||e.public_key::text,
    'public_key',e.public_key,
    'status',e.status,
    'last_received_at',e.last_received_at,
    'delivery_count',e.delivery_count,
    'updated_at',e.updated_at
  );
end;
$$;
revoke all on function public.command_center_integration_webhook_status(uuid) from public, anon;
grant execute on function public.command_center_integration_webhook_status(uuid) to authenticated;

-- Preserve the old signature only as a fail-closed tombstone so no browser/client can
-- accidentally receive a newly generated raw credential after this migration.
create or replace function public.command_center_integration_rotate_webhook_secret(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Raw webhook secret rotation is server-side only';
end;
$$;
revoke all on function public.command_center_integration_rotate_webhook_secret(uuid) from public, anon, authenticated, service_role;

-- The server-side rotation path may receive the raw secret exactly once so a trusted
-- provider adapter can install it. It is never exposed to browser roles or stored raw.
create or replace function public.command_center_integration_service_rotate_webhook_secret(
  p_owner_id uuid,
  p_connection_id uuid,
  p_authorization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.integration_connections%rowtype;
  v_secret text;
  v_public_key uuid;
begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=p_owner_id and status<>'archived' for update;
  if not found then raise exception 'Connection not found'; end if;

  perform command_center_private.consume_action_authorization(
    p_owner_id,p_authorization_id,'integration.rotate_webhook_secret','integration_connection',c.id::text
  );

  v_secret := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.integration_webhook_endpoints(owner_id,connection_id,secret_hash,status)
  values(p_owner_id,c.id,encode(extensions.digest(v_secret,'sha256'),'hex'),'active')
  on conflict(connection_id) do update
    set secret_hash=excluded.secret_hash,status='active',updated_at=now()
  returning public_key into v_public_key;

  update public.integration_connections set webhook_enabled=true where id=c.id;
  return jsonb_build_object(
    'connection_id',c.id,
    'public_key',v_public_key,
    'secret_ref','webhook:'||v_public_key::text,
    'secret',v_secret
  );
end;
$$;
revoke all on function public.command_center_integration_service_rotate_webhook_secret(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.command_center_integration_service_rotate_webhook_secret(uuid,uuid,uuid) to service_role;

alter table public.integration_write_requests
  add column if not exists security_authorization_id uuid references public.security_action_authorizations(id) on delete set null;

create index if not exists integration_write_requests_security_auth_idx
  on public.integration_write_requests(security_authorization_id)
  where security_authorization_id is not null;

create or replace function public.command_center_integration_attach_write_authorization(
  p_request_id uuid,
  p_authorization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  r public.integration_write_requests%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.integration_write_requests where id=p_request_id and owner_id=u for update;
  if not found then raise exception 'Write request not found'; end if;
  if r.status <> 'pending' then raise exception 'Only a pending write request can receive authorization'; end if;
  if not exists (
    select 1 from public.security_action_authorizations a
    where a.id=p_authorization_id
      and a.owner_id=u
      and a.action_key='integration.execute_write'
      and a.resource_type='integration_write_request'
      and a.resource_id=r.id::text
      and a.status='authorized'
      and a.expires_at>now()
      and a.authorized_session_id is not null
      and a.fresh_verified_at is not null
  ) then raise exception 'Valid integration-write authorization not found'; end if;

  update public.integration_write_requests
     set security_authorization_id=p_authorization_id,
         authorization_state='authorized',
         authorized_at=now()
   where id=r.id;
  return jsonb_build_object('ok',true,'request_id',r.id,'authorization_id',p_authorization_id);
end;
$$;
revoke all on function public.command_center_integration_attach_write_authorization(uuid,uuid) from public, anon;
grant execute on function public.command_center_integration_attach_write_authorization(uuid,uuid) to authenticated;

-- The table transition is the canonical write boundary, so future wrapper RPCs cannot
-- bypass single-use authorization by forgetting an explicit check.
create or replace function command_center_private.enforce_integration_write_authorization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status='executing' and old.status is distinct from 'executing' then
    perform command_center_private.consume_action_authorization(
      new.owner_id,
      new.security_authorization_id,
      'integration.execute_write',
      'integration_write_request',
      new.id::text
    );
  end if;
  return new;
end;
$$;
revoke all on function command_center_private.enforce_integration_write_authorization() from public, anon, authenticated;
drop trigger if exists trg_integration_write_protected_authorization on public.integration_write_requests;
create trigger trg_integration_write_protected_authorization
before update of status on public.integration_write_requests
for each row
execute function command_center_private.enforce_integration_write_authorization();

-- An authenticated client may request reconnect work, but it may not self-assert that a
-- provider is connected. Provider/account verification must happen on the server path.
create or replace function public.command_center_integration_reconnect(p_connection_id uuid,p_mark_connected boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare u uuid:=auth.uid(); c public.integration_connections%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(p_mark_connected,false) then raise exception 'Connected state requires server-side provider verification'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u and status<>'archived';
  if not found then raise exception 'Connection not found'; end if;
  update public.integration_connections
     set status='reconnecting',reconnect_count=reconnect_count+1,last_error=null
   where id=c.id;
  return jsonb_build_object('ok',true,'connection_id',c.id,'status','reconnecting','configuration_preserved',true);
end;
$$;
revoke all on function public.command_center_integration_reconnect(uuid,boolean) from public, anon;
grant execute on function public.command_center_integration_reconnect(uuid,boolean) to authenticated;

create or replace function public.command_center_integration_service_mark_connected(
  p_owner_id uuid,
  p_connection_id uuid,
  p_authorization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare c public.integration_connections%rowtype; begin
  if not public.command_center_agent_service_owner_active(p_owner_id) then raise exception 'Owner is not active'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=p_owner_id and status<>'archived' for update;
  if not found then raise exception 'Connection not found'; end if;
  perform command_center_private.consume_action_authorization(
    p_owner_id,p_authorization_id,'integration.reconnect_mark_connected','integration_connection',c.id::text
  );
  update public.integration_connections set status='connected',last_error=null,last_success_at=now() where id=c.id;
  return jsonb_build_object('ok',true,'connection_id',c.id,'status','connected','verified_server_side',true);
end;
$$;
revoke all on function public.command_center_integration_service_mark_connected(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.command_center_integration_service_mark_connected(uuid,uuid,uuid) to service_role;
