-- Command Center Brain — Integrations complete
-- Phases 1–8: registry, permissions, read sync, normalization, health,
-- controlled writes, webhook intake, and reconnect/recovery.
-- Provider-neutral and multi-account by design. No external account is fabricated.

create schema if not exists command_center_private;
revoke all on schema command_center_private from public, anon, authenticated;
grant usage on schema command_center_private to postgres, service_role;

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  provider_key text not null,
  provider_label text not null,
  account_label text not null,
  external_account_id text null,
  adapter_kind text not null default 'manual_json' check (adapter_kind in ('command_center','manual_json','generic_webhook','provider_api')),
  status text not null default 'disconnected' check (status in ('connected','disconnected','needs_auth','reconnecting','error','archived')),
  read_enabled boolean not null default true,
  write_enabled boolean not null default false,
  webhook_enabled boolean not null default false,
  capabilities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  sync_cursor jsonb not null default '{}'::jsonb,
  auth_expires_at timestamptz null,
  last_sync_at timestamptz null,
  last_success_at timestamptz null,
  last_health_check_at timestamptz null,
  last_error text null,
  reconnect_count integer not null default 0 check (reconnect_count >= 0),
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists integration_connections_owner_provider_external_uidx
  on public.integration_connections(owner_id,provider_key,external_account_id)
  where external_account_id is not null and status <> 'archived';
create index if not exists integration_connections_owner_provider_idx on public.integration_connections(owner_id,provider_key,status);
create index if not exists integration_connections_project_idx on public.integration_connections(project_id) where project_id is not null;

create table if not exists public.integration_permissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  scope_key text not null,
  access_mode text not null default 'read' check (access_mode in ('read','write','read_write')),
  authorized boolean not null default false,
  authorized_at timestamptz null,
  revoked_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id,scope_key)
);
create index if not exists integration_permissions_owner_connection_idx on public.integration_permissions(owner_id,connection_id);

create table if not exists public.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  sync_kind text not null check (sync_kind in ('manual','scheduled','webhook','reconnect','internal')),
  status text not null default 'running' check (status in ('running','succeeded','partial','failed')),
  idempotency_key text not null,
  source_cursor jsonb not null default '{}'::jsonb,
  records_received integer not null default 0 check (records_received >= 0),
  records_normalized integer not null default 0 check (records_normalized >= 0),
  error_message text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(owner_id,idempotency_key)
);
create index if not exists integration_sync_runs_owner_time_idx on public.integration_sync_runs(owner_id,started_at desc);
create index if not exists integration_sync_runs_connection_idx on public.integration_sync_runs(connection_id,started_at desc);

create table if not exists public.integration_source_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  sync_run_id uuid null references public.integration_sync_runs(id) on delete set null,
  event_kind text not null default 'snapshot',
  provider_event_id text null,
  idempotency_key text not null,
  payload jsonb not null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(owner_id,idempotency_key)
);
create index if not exists integration_source_events_connection_idx on public.integration_source_events(connection_id,observed_at desc);

create table if not exists public.integration_metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  source_event_id uuid null references public.integration_source_events(id) on delete set null,
  metric_key text not null,
  value_numeric numeric null,
  value_text text null,
  unit text null,
  currency text null,
  period_start timestamptz null,
  period_end timestamptz null,
  observed_at timestamptz not null default now(),
  verified boolean not null default true,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists integration_metrics_owner_key_time_idx on public.integration_metrics(owner_id,metric_key,observed_at desc);
create index if not exists integration_metrics_connection_time_idx on public.integration_metrics(connection_id,observed_at desc);
create index if not exists integration_metrics_project_idx on public.integration_metrics(project_id,metric_key,observed_at desc) where project_id is not null;

create table if not exists public.integration_write_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  action_key text not null,
  payload jsonb not null default '{}'::jsonb,
  authorization_state text not null default 'draft' check (authorization_state in ('draft','authorized','revoked')),
  status text not null default 'pending' check (status in ('pending','executing','succeeded','failed','canceled')),
  idempotency_key text not null,
  authorized_at timestamptz null,
  executed_at timestamptz null,
  output jsonb not null default '{}'::jsonb,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,idempotency_key)
);
create index if not exists integration_write_requests_connection_idx on public.integration_write_requests(connection_id,created_at desc);

create table if not exists public.integration_webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null unique references public.integration_connections(id) on delete cascade,
  public_key uuid not null default gen_random_uuid() unique,
  secret_hash text not null,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  last_received_at timestamptz null,
  delivery_count bigint not null default 0 check (delivery_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists integration_webhook_owner_connection_idx on public.integration_webhook_endpoints(owner_id,connection_id);

create table if not exists public.integration_health_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  health_state text not null check (health_state in ('healthy','stale','needs_auth','disconnected','error')),
  reason text null,
  checked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists integration_health_events_connection_idx on public.integration_health_events(connection_id,checked_at desc);

alter table public.integration_connections enable row level security;
alter table public.integration_permissions enable row level security;
alter table public.integration_sync_runs enable row level security;
alter table public.integration_source_events enable row level security;
alter table public.integration_metrics enable row level security;
alter table public.integration_write_requests enable row level security;
alter table public.integration_webhook_endpoints enable row level security;
alter table public.integration_health_events enable row level security;

-- Owner-managed configuration.
do $$ declare t text; begin
  foreach t in array array['integration_connections','integration_permissions','integration_write_requests'] loop
    execute format('drop policy if exists %I_select_own on public.%I',t,t);
    execute format('create policy %I_select_own on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
    execute format('drop policy if exists %I_insert_own on public.%I',t,t);
    execute format('create policy %I_insert_own on public.%I for insert to authenticated with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
    execute format('drop policy if exists %I_update_own on public.%I',t,t);
    execute format('create policy %I_update_own on public.%I for update to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
    execute format('drop policy if exists %I_delete_own on public.%I',t,t);
    execute format('create policy %I_delete_own on public.%I for delete to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
  end loop;
end $$;

-- Engine output/history is owner-read-only.
do $$ declare t text; begin
  foreach t in array array['integration_sync_runs','integration_source_events','integration_metrics','integration_webhook_endpoints','integration_health_events'] loop
    execute format('drop policy if exists %I_select_own on public.%I',t,t);
    execute format('create policy %I_select_own on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',t,t);
  end loop;
end $$;

revoke all on public.integration_connections,public.integration_permissions,public.integration_write_requests from anon,authenticated;
grant select,insert,update,delete on public.integration_connections,public.integration_permissions,public.integration_write_requests to authenticated;
revoke all on public.integration_sync_runs,public.integration_source_events,public.integration_metrics,public.integration_webhook_endpoints,public.integration_health_events from anon,authenticated;
grant select on public.integration_sync_runs,public.integration_source_events,public.integration_metrics,public.integration_webhook_endpoints,public.integration_health_events to authenticated;

create or replace function command_center_private.prepare_integration_connection()
returns trigger language plpgsql set search_path='' as $$
begin
  new.provider_key:=lower(regexp_replace(btrim(new.provider_key),'[^a-z0-9_-]+','-','g'));
  new.provider_label:=btrim(new.provider_label); new.account_label:=btrim(new.account_label);
  if new.provider_key='' or new.provider_label='' or new.account_label='' then raise exception 'Provider and account labels are required'; end if;
  if new.project_id is not null and not exists(select 1 from public.projects p where p.id=new.project_id and p.owner_id=new.owner_id) then raise exception 'Connection project must belong to owner'; end if;
  if new.adapter_kind='provider_api' and new.status='connected' and coalesce(new.external_account_id,'')='' then raise exception 'Provider API connections require an external account id before connected'; end if;
  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now()); else new.archived_at:=null; end if;
  return new;
end $$;
drop trigger if exists integration_connections_prepare on public.integration_connections;
create trigger integration_connections_prepare before insert or update on public.integration_connections for each row execute function command_center_private.prepare_integration_connection();
drop trigger if exists integration_connections_updated_at on public.integration_connections;
create trigger integration_connections_updated_at before update on public.integration_connections for each row execute function public.command_center_set_updated_at();

drop trigger if exists integration_permissions_updated_at on public.integration_permissions;
create trigger integration_permissions_updated_at before update on public.integration_permissions for each row execute function public.command_center_set_updated_at();
drop trigger if exists integration_write_requests_updated_at on public.integration_write_requests;
create trigger integration_write_requests_updated_at before update on public.integration_write_requests for each row execute function public.command_center_set_updated_at();
drop trigger if exists integration_webhook_updated_at on public.integration_webhook_endpoints;
create trigger integration_webhook_updated_at before update on public.integration_webhook_endpoints for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.scope_authorized(p_owner uuid,p_connection uuid,p_scope text,p_mode text default 'read')
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.integration_permissions s
    where s.owner_id=p_owner and s.connection_id=p_connection and s.scope_key=p_scope and s.authorized=true
      and (s.expires_at is null or s.expires_at>now())
      and (s.access_mode='read_write' or s.access_mode=p_mode)
  );
$$;
revoke all on function command_center_private.scope_authorized(uuid,uuid,text,text) from public,anon,authenticated;

create or replace function command_center_private.normalize_integration_payload(p_owner uuid,p_connection uuid,p_event uuid,p_payload jsonb,p_observed timestamptz)
returns integer language plpgsql security definer set search_path='' as $$
declare c public.integration_connections%rowtype; n integer:=0; v numeric; cur text; k text; begin
  select * into c from public.integration_connections where id=p_connection and owner_id=p_owner;
  if not found then raise exception 'Connection not found'; end if;
  cur:=upper(coalesce(p_payload->>'currency','USD'));
  foreach k in array array['followers','subscribers','views','likes','comments','shares','watch_time_seconds','revenue'] loop
    begin v:=(p_payload->>k)::numeric; exception when others then v:=null; end;
    if v is not null then
      insert into public.integration_metrics(owner_id,connection_id,project_id,source_event_id,metric_key,value_numeric,unit,currency,observed_at,verified,source,metadata)
      values(p_owner,p_connection,c.project_id,p_event,
        case k when 'followers' then 'social.followers' when 'subscribers' then 'social.subscribers' when 'views' then 'content.views' when 'likes' then 'content.likes' when 'comments' then 'content.comments' when 'shares' then 'content.shares' when 'watch_time_seconds' then 'content.watch_time_seconds' when 'revenue' then 'revenue.reported' end,
        v,case when k='watch_time_seconds' then 'seconds' when k='revenue' then 'currency' else 'count' end,case when k='revenue' then cur else null end,p_observed,true,'integration:'||c.provider_key||':'||c.id::text,
        jsonb_build_object('provider_key',c.provider_key,'account_label',c.account_label,'external_account_id',c.external_account_id));
      n:=n+1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function command_center_private.normalize_integration_payload(uuid,uuid,uuid,jsonb,timestamptz) from public,anon,authenticated;

create or replace function public.command_center_integration_ingest(p_connection_id uuid,p_payload jsonb,p_idempotency_key text default null,p_sync_kind text default 'manual')
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.integration_connections%rowtype; rid uuid; eid uuid; idem text; n integer; obs timestamptz; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u and status<>'archived';
  if not found then raise exception 'Connection not found'; end if;
  if not c.read_enabled or not command_center_private.scope_authorized(u,c.id,'metrics','read') then raise exception 'Read scope metrics is not authorized'; end if;
  if p_sync_kind not in ('manual','scheduled','webhook','reconnect','internal') then raise exception 'Invalid sync kind'; end if;
  idem:=coalesce(nullif(btrim(p_idempotency_key),''),'ingest:'||c.id::text||':'||encode(gen_random_bytes(12),'hex'));
  if exists(select 1 from public.integration_sync_runs where owner_id=u and idempotency_key=idem) then
    select id into rid from public.integration_sync_runs where owner_id=u and idempotency_key=idem;
    return jsonb_build_object('ok',true,'duplicate',true,'sync_run_id',rid);
  end if;
  obs:=coalesce((p_payload->>'observed_at')::timestamptz,now());
  insert into public.integration_sync_runs(owner_id,connection_id,sync_kind,status,idempotency_key,records_received) values(u,c.id,p_sync_kind,'running',idem,1) returning id into rid;
  insert into public.integration_source_events(owner_id,connection_id,sync_run_id,event_kind,idempotency_key,payload,observed_at)
  values(u,c.id,rid,'snapshot',idem||':event',p_payload,obs) returning id into eid;
  n:=command_center_private.normalize_integration_payload(u,c.id,eid,p_payload,obs);
  update public.integration_sync_runs set status='succeeded',records_normalized=n,completed_at=now() where id=rid;
  update public.integration_connections set status='connected',last_sync_at=now(),last_success_at=now(),last_error=null where id=c.id;
  return jsonb_build_object('ok',true,'duplicate',false,'sync_run_id',rid,'source_event_id',eid,'metrics_normalized',n);
exception when others then
  if rid is not null then update public.integration_sync_runs set status='failed',error_message=sqlerrm,completed_at=now() where id=rid; end if;
  update public.integration_connections set last_sync_at=now(),last_error=sqlerrm,status=case when status='needs_auth' then status else 'error' end where id=p_connection_id and owner_id=u;
  raise;
end $$;
revoke all on function public.command_center_integration_ingest(uuid,jsonb,text,text) from public,anon;
grant execute on function public.command_center_integration_ingest(uuid,jsonb,text,text) to authenticated;

create or replace function public.command_center_integration_check_health(p_connection_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.integration_connections%rowtype; hs text; why text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u;
  if not found then raise exception 'Connection not found'; end if;
  if c.status='needs_auth' or (c.auth_expires_at is not null and c.auth_expires_at<=now()) then hs:='needs_auth';why:='Authorization expired or required';
  elsif c.status='disconnected' then hs:='disconnected';why:='Connection is disconnected';
  elsif c.status='error' then hs:='error';why:=coalesce(c.last_error,'Connection error');
  elsif c.last_success_at is null or c.last_success_at<now()-interval '24 hours' then hs:='stale';why:='No successful sync in the last 24 hours';
  else hs:='healthy';why:='Recent successful sync'; end if;
  insert into public.integration_health_events(owner_id,connection_id,health_state,reason) values(u,c.id,hs,why);
  update public.integration_connections set last_health_check_at=now(),status=case when hs='needs_auth' then 'needs_auth' when hs='error' then 'error' when hs='disconnected' then 'disconnected' when status='reconnecting' and hs='healthy' then 'connected' else status end where id=c.id;
  return jsonb_build_object('connection_id',c.id,'health_state',hs,'reason',why);
end $$;
revoke all on function public.command_center_integration_check_health(uuid) from public,anon;
grant execute on function public.command_center_integration_check_health(uuid) to authenticated;

create or replace function public.command_center_integration_reconnect(p_connection_id uuid,p_mark_connected boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.integration_connections%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u and status<>'archived'; if not found then raise exception 'Connection not found'; end if;
  update public.integration_connections set status=case when p_mark_connected then 'connected' else 'reconnecting' end,reconnect_count=reconnect_count+1,last_error=null where id=c.id;
  return jsonb_build_object('ok',true,'connection_id',c.id,'status',case when p_mark_connected then 'connected' else 'reconnecting' end,'configuration_preserved',true);
end $$;
revoke all on function public.command_center_integration_reconnect(uuid,boolean) from public,anon;
grant execute on function public.command_center_integration_reconnect(uuid,boolean) to authenticated;

create or replace function public.command_center_integration_rotate_webhook_secret(p_connection_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.integration_connections%rowtype; secret text; pub uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u and status<>'archived'; if not found then raise exception 'Connection not found'; end if;
  secret:=encode(gen_random_bytes(24),'hex');
  insert into public.integration_webhook_endpoints(owner_id,connection_id,secret_hash,status) values(u,c.id,encode(digest(secret,'sha256'),'hex'),'active')
  on conflict(connection_id) do update set secret_hash=excluded.secret_hash,status='active',updated_at=now() returning public_key into pub;
  update public.integration_connections set webhook_enabled=true where id=c.id;
  return jsonb_build_object('connection_id',c.id,'public_key',pub,'secret',secret);
end $$;
revoke all on function public.command_center_integration_rotate_webhook_secret(uuid) from public,anon;
grant execute on function public.command_center_integration_rotate_webhook_secret(uuid) to authenticated;

create or replace function public.command_center_integration_execute_write(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.integration_write_requests%rowtype; c public.integration_connections%rowtype; out jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.integration_write_requests where id=p_request_id and owner_id=u; if not found then raise exception 'Write request not found'; end if;
  if r.status='succeeded' then return jsonb_build_object('ok',true,'duplicate',true,'output',r.output); end if;
  if r.authorization_state<>'authorized' then raise exception 'Write request is not explicitly authorized'; end if;
  select * into c from public.integration_connections where id=r.connection_id and owner_id=u; if not found then raise exception 'Connection not found'; end if;
  if not c.write_enabled or not command_center_private.scope_authorized(u,c.id,'actions','write') then raise exception 'Write scope actions is not authorized'; end if;
  update public.integration_write_requests set status='executing' where id=r.id;
  if c.adapter_kind='command_center' and r.action_key='set_connection_note' then
    update public.integration_connections set metadata=jsonb_set(metadata,'{note}',to_jsonb(coalesce(r.payload->>'note','')),true) where id=c.id;
    out:=jsonb_build_object('adapter','command_center','action','set_connection_note','connection_id',c.id);
  else
    update public.integration_write_requests set status='failed',error_message='Provider write adapter is not connected yet' where id=r.id;
    raise exception 'Provider write adapter is not connected yet';
  end if;
  update public.integration_write_requests set status='succeeded',executed_at=now(),output=out,error_message=null where id=r.id;
  return jsonb_build_object('ok',true,'duplicate',false,'output',out);
end $$;
revoke all on function public.command_center_integration_execute_write(uuid) from public,anon;
grant execute on function public.command_center_integration_execute_write(uuid) to authenticated;

-- Webhook ingestion helper is intentionally service-role only. The public Edge
-- Function authenticates each webhook using the one-time connection secret.
create or replace function command_center_private.ingest_webhook(p_public_key uuid,p_secret_hash text,p_provider_event_id text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.integration_webhook_endpoints%rowtype; c public.integration_connections%rowtype; rid uuid; eid uuid; idem text; n integer; begin
  select * into e from public.integration_webhook_endpoints where public_key=p_public_key and status='active'; if not found then raise exception 'Webhook endpoint not found'; end if;
  if e.secret_hash<>p_secret_hash then raise exception 'Invalid webhook secret'; end if;
  select * into c from public.integration_connections where id=e.connection_id and owner_id=e.owner_id and status<>'archived'; if not found then raise exception 'Connection not found'; end if;
  if not c.webhook_enabled or not c.read_enabled then raise exception 'Webhook intake is disabled'; end if;
  idem:='webhook:'||c.id::text||':'||coalesce(nullif(p_provider_event_id,''),encode(digest(p_payload::text,'sha256'),'hex'));
  if exists(select 1 from public.integration_source_events where owner_id=c.owner_id and idempotency_key=idem||':event') then return jsonb_build_object('ok',true,'duplicate',true); end if;
  insert into public.integration_sync_runs(owner_id,connection_id,sync_kind,status,idempotency_key,records_received) values(c.owner_id,c.id,'webhook','running',idem,1) returning id into rid;
  insert into public.integration_source_events(owner_id,connection_id,sync_run_id,event_kind,provider_event_id,idempotency_key,payload,observed_at) values(c.owner_id,c.id,rid,'webhook',p_provider_event_id,idem||':event',p_payload,coalesce((p_payload->>'observed_at')::timestamptz,now())) returning id into eid;
  n:=command_center_private.normalize_integration_payload(c.owner_id,c.id,eid,p_payload,coalesce((p_payload->>'observed_at')::timestamptz,now()));
  update public.integration_sync_runs set status='succeeded',records_normalized=n,completed_at=now() where id=rid;
  update public.integration_webhook_endpoints set last_received_at=now(),delivery_count=delivery_count+1 where id=e.id;
  update public.integration_connections set status='connected',last_sync_at=now(),last_success_at=now(),last_error=null where id=c.id;
  return jsonb_build_object('ok',true,'duplicate',false,'metrics_normalized',n,'sync_run_id',rid);
end $$;
revoke all on function command_center_private.ingest_webhook(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function command_center_private.ingest_webhook(uuid,text,text,jsonb) to service_role;

-- Seed one real built-in internal adapter only. This is architecture metadata,
-- not an external connection or user account.
comment on table public.integration_connections is 'One row per provider account/profile/channel. Multiple rows for the same provider are expected and supported.';
comment on table public.integration_metrics is 'Normalized provider-reported metrics. Social/account metrics include social.followers, social.subscribers, content views/engagement and revenue.reported when supplied by the provider.';
