-- Category 3 / P3.6 — cross-device sync, deterministic reconciliation and projection state.
-- Branch-only migration.

create table if not exists public.command_center_sync_events (
  event_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null,
  incoming_version bigint not null check (incoming_version >= 1),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  source_node text not null,
  outcome text not null check (outcome in ('accept','ignore_duplicate','reject_stale','conflict','reconcile_gap')),
  reason text not null,
  occurred_at timestamptz not null default now(),
  primary key(owner_id,event_id),
  check (length(btrim(source_node)) between 1 and 240),
  check (length(btrim(reason)) between 1 and 500)
);
create index if not exists command_center_sync_events_entity_idx on public.command_center_sync_events(owner_id,entity_id,occurred_at desc);

create table if not exists public.command_center_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null,
  conflict_kind text not null check (conflict_kind in ('same_version_different_hash','version_gap','temporal_regression')),
  local_version bigint,
  local_hash text,
  incoming_version bigint not null check (incoming_version >= 1),
  incoming_hash text not null check (incoming_hash ~ '^[a-f0-9]{64}$'),
  incoming_schema_version integer not null check (incoming_schema_version >= 1),
  incoming_entity_type text not null,
  incoming_project_id text,
  incoming_updated_at timestamptz not null,
  incoming_source_node text not null,
  incoming_payload jsonb not null check (jsonb_typeof(incoming_payload)='object'),
  source_ref text not null,
  state text not null default 'pending' check (state in ('pending','resolved_keep_local','resolved_rebuild_required')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_ref text,
  unique(owner_id,entity_id,incoming_version,incoming_hash,incoming_source_node),
  check (local_hash is null or local_hash ~ '^[a-f0-9]{64}$'),
  check (resolved_at is null or resolved_at >= created_at)
);
create index if not exists command_center_sync_conflicts_pending_idx on public.command_center_sync_conflicts(owner_id,created_at) where state='pending';

create table if not exists public.command_center_sync_cursors (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_node text not null,
  last_event_at timestamptz not null,
  last_event_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key(owner_id,source_node)
);

create table if not exists public.command_center_canonical_projection (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null,
  project_id text,
  entity_type text not null,
  version bigint not null check (version >= 1),
  schema_version integer not null check (schema_version >= 1),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  canonical_updated_at timestamptz not null,
  deleted_at timestamptz,
  projected_at timestamptz not null default now(),
  primary key(owner_id,entity_id)
);

-- Projection is derived state only; canonical tables remain source of truth.
create or replace function command_center_private.c3_project_canonical_entity()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.command_center_canonical_projection(owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash,canonical_updated_at,deleted_at,projected_at)
  values(new.owner_id,new.entity_id,new.project_id,new.entity_type,new.version,new.schema_version,new.payload,new.content_hash,new.updated_at,new.deleted_at,now())
  on conflict(owner_id,entity_id) do update set
    project_id=excluded.project_id,
    entity_type=excluded.entity_type,
    version=excluded.version,
    schema_version=excluded.schema_version,
    payload=excluded.payload,
    content_hash=excluded.content_hash,
    canonical_updated_at=excluded.canonical_updated_at,
    deleted_at=excluded.deleted_at,
    projected_at=now()
  where public.command_center_canonical_projection.version <= excluded.version;
  return new;
end $$;
revoke all on function command_center_private.c3_project_canonical_entity() from public,anon,authenticated;
drop trigger if exists trg_c3_project_canonical_entity on public.command_center_canonical_entities;
create trigger trg_c3_project_canonical_entity
after insert or update on public.command_center_canonical_entities
for each row execute function command_center_private.c3_project_canonical_entity();

-- Owner-readable, directly immutable sync evidence and projections.
do $$
declare t text;
begin
  foreach t in array array['command_center_sync_events','command_center_sync_conflicts','command_center_sync_cursors','command_center_canonical_projection'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c3_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c3_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c3_record_sync_event(
  p_owner_id uuid,p_event_id uuid,p_entity_id text,p_version bigint,p_hash text,p_source_node text,p_outcome text,p_reason text
) returns void language plpgsql security definer set search_path='' as $$
begin
  insert into public.command_center_sync_events(event_id,owner_id,entity_id,incoming_version,content_hash,source_node,outcome,reason)
  values(p_event_id,p_owner_id,btrim(p_entity_id),p_version,p_hash,btrim(p_source_node),p_outcome,left(btrim(p_reason),500))
  on conflict(owner_id,event_id) do nothing;
  insert into public.command_center_sync_cursors(owner_id,source_node,last_event_at,last_event_id)
  values(p_owner_id,btrim(p_source_node),now(),p_event_id)
  on conflict(owner_id,source_node) do update set last_event_at=excluded.last_event_at,last_event_id=excluded.last_event_id,updated_at=now()
  where public.command_center_sync_cursors.last_event_at <= excluded.last_event_at;
end $$;
revoke all on function command_center_private.c3_record_sync_event(uuid,uuid,text,bigint,text,text,text,text) from public,anon,authenticated;

create or replace function command_center_private.c3_queue_sync_conflict(
  p_owner_id uuid,p_entity_id text,p_kind text,p_local_version bigint,p_local_hash text,p_incoming_version bigint,p_incoming_hash text,
  p_schema_version integer,p_entity_type text,p_project_id text,p_updated_at timestamptz,p_source_node text,p_payload jsonb,p_source_ref text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; begin
  insert into public.command_center_sync_conflicts(owner_id,entity_id,conflict_kind,local_version,local_hash,incoming_version,incoming_hash,incoming_schema_version,incoming_entity_type,incoming_project_id,incoming_updated_at,incoming_source_node,incoming_payload,source_ref)
  values(p_owner_id,btrim(p_entity_id),p_kind,p_local_version,p_local_hash,p_incoming_version,p_incoming_hash,p_schema_version,btrim(p_entity_type),nullif(btrim(coalesce(p_project_id,'')),''),p_updated_at,btrim(p_source_node),p_payload,btrim(p_source_ref))
  on conflict(owner_id,entity_id,incoming_version,incoming_hash,incoming_source_node) do update set source_ref=excluded.source_ref
  returning id into v_id;
  return v_id;
end $$;
revoke all on function command_center_private.c3_queue_sync_conflict(uuid,text,text,bigint,text,bigint,text,integer,text,text,timestamptz,text,jsonb,text) from public,anon,authenticated;

create or replace function public.command_center_sync_apply_entity(
  p_event_id uuid,p_entity_id text,p_entity_type text,p_project_id text,p_version bigint,p_schema_version integer,p_updated_at timestamptz,
  p_content_hash text,p_source_node text,p_payload jsonb,p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  e public.command_center_canonical_entities%rowtype;
  v_hash text;
  v_conflict uuid;
  prior public.command_center_sync_events%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_event_id is null or coalesce(btrim(p_entity_id),'')='' or coalesce(btrim(p_entity_type),'')='' or coalesce(btrim(p_source_node),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Sync identity and provenance are required'; end if;
  if p_version<1 or p_schema_version<1 or p_updated_at is null or jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' then raise exception 'Invalid sync envelope'; end if;
  v_hash:=command_center_private.c3_hash_json(p_payload);
  if lower(coalesce(p_content_hash,''))<>v_hash then raise exception 'Sync payload hash mismatch'; end if;

  select * into prior from public.command_center_sync_events where owner_id=u and event_id=p_event_id;
  if found then return jsonb_build_object('action',prior.outcome,'reason','idempotent_replay','event_id',prior.event_id); end if;

  select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=btrim(p_entity_id) for update;
  if not found then
    if p_version<>1 then
      v_conflict:=command_center_private.c3_queue_sync_conflict(u,p_entity_id,'version_gap',null,null,p_version,v_hash,p_schema_version,p_entity_type,p_project_id,p_updated_at,p_source_node,p_payload,p_source_ref);
      perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'reconcile_gap','missing canonical base version');
      return jsonb_build_object('action','reconcile_gap','reason','missing_base_version','conflict_id',v_conflict);
    end if;
    insert into public.command_center_canonical_entities(owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash,created_at,updated_at)
    values(u,btrim(p_entity_id),nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_entity_type),1,p_schema_version,p_payload,v_hash,p_updated_at,p_updated_at);
    insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref,recorded_at)
    values(u,btrim(p_entity_id),1,nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_entity_type),p_schema_version,p_payload,v_hash,'create',btrim(p_source_ref),now());
    perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'accept','new_entity');
    return jsonb_build_object('action','accept','reason','new_entity','version',1);
  end if;

  if p_version<e.version then
    perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'reject_stale','incoming_version_older');
    return jsonb_build_object('action','reject_stale','reason','incoming_version_older','canonical_version',e.version);
  end if;
  if p_version=e.version and v_hash=e.content_hash then
    perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'ignore_duplicate','same_version_same_hash');
    return jsonb_build_object('action','ignore_duplicate','reason','same_version_same_hash','canonical_version',e.version);
  end if;
  if p_version=e.version and v_hash<>e.content_hash then
    v_conflict:=command_center_private.c3_queue_sync_conflict(u,p_entity_id,'same_version_different_hash',e.version,e.content_hash,p_version,v_hash,p_schema_version,p_entity_type,p_project_id,p_updated_at,p_source_node,p_payload,p_source_ref);
    perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'conflict','same_version_different_hash');
    return jsonb_build_object('action','conflict','reason','same_version_different_hash','conflict_id',v_conflict);
  end if;
  if p_version>e.version+1 then
    v_conflict:=command_center_private.c3_queue_sync_conflict(u,p_entity_id,'version_gap',e.version,e.content_hash,p_version,v_hash,p_schema_version,p_entity_type,p_project_id,p_updated_at,p_source_node,p_payload,p_source_ref);
    perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'reconcile_gap','version_gap_requires_rebuild');
    return jsonb_build_object('action','reconcile_gap','reason','version_gap_requires_rebuild','conflict_id',v_conflict);
  end if;
  if p_updated_at<e.updated_at then
    v_conflict:=command_center_private.c3_queue_sync_conflict(u,p_entity_id,'temporal_regression',e.version,e.content_hash,p_version,v_hash,p_schema_version,p_entity_type,p_project_id,p_updated_at,p_source_node,p_payload,p_source_ref);
    perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'conflict','next_version_timestamp_regressed');
    return jsonb_build_object('action','conflict','reason','next_version_timestamp_regressed','conflict_id',v_conflict);
  end if;
  if e.deleted_at is not null then raise exception 'Tombstoned canonical entity cannot be silently revived by sync'; end if;
  if e.entity_type<>btrim(p_entity_type) or e.project_id is distinct from nullif(btrim(coalesce(p_project_id,'')),'') then raise exception 'Sync envelope cannot change canonical identity or project ownership'; end if;

  update public.command_center_canonical_entities set version=p_version,schema_version=p_schema_version,payload=p_payload,content_hash=v_hash,updated_at=p_updated_at where owner_id=u and entity_id=e.entity_id;
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,e.entity_id,p_version,e.project_id,e.entity_type,p_schema_version,p_payload,v_hash,'replace',btrim(p_source_ref));
  perform command_center_private.c3_record_sync_event(u,p_event_id,p_entity_id,p_version,v_hash,p_source_node,'accept','next_version');
  return jsonb_build_object('action','accept','reason','next_version','version',p_version);
end $$;

create or replace function public.command_center_resolve_sync_conflict(p_conflict_id uuid,p_resolution text,p_resolution_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.command_center_sync_conflicts%rowtype; v_state text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_resolution not in ('keep_local','rebuild_required') or coalesce(btrim(p_resolution_ref),'')='' then raise exception 'Explicit reconciliation resolution evidence is required'; end if;
  select * into c from public.command_center_sync_conflicts where id=p_conflict_id and owner_id=u for update;
  if not found then raise exception 'Sync conflict not found'; end if;
  if c.state<>'pending' then raise exception 'Sync conflict is already resolved'; end if;
  v_state:=case when p_resolution='keep_local' then 'resolved_keep_local' else 'resolved_rebuild_required' end;
  update public.command_center_sync_conflicts set state=v_state,resolved_at=now(),resolution_ref=btrim(p_resolution_ref) where id=c.id;
  return jsonb_build_object('conflict_id',c.id,'state',v_state,'canonical_mutated',false);
end $$;

revoke all on function public.command_center_sync_apply_entity(uuid,text,text,text,bigint,integer,timestamptz,text,text,jsonb,text) from public,anon;
grant execute on function public.command_center_sync_apply_entity(uuid,text,text,text,bigint,integer,timestamptz,text,text,jsonb,text) to authenticated;
revoke all on function public.command_center_resolve_sync_conflict(uuid,text,text) from public,anon;
grant execute on function public.command_center_resolve_sync_conflict(uuid,text,text) to authenticated;
