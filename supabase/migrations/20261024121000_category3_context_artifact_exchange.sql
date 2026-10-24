-- Category 3 / P3.10 — immutable scoped context snapshots and artifact exchange manifests.
-- Branch-only migration. Snapshots are derived exchange evidence and cannot mutate canonical source truth.

create or replace function command_center_private.c3_sensitivity_rank(p_sensitivity text)
returns integer
language sql
immutable
set search_path=''
as $$
  select case p_sensitivity when 'internal' then 0 when 'sensitive' then 1 when 'protected' then 2 when 'secret' then 3 else 99 end;
$$;
revoke all on function command_center_private.c3_sensitivity_rank(text) from public,anon,authenticated;

create table if not exists public.command_center_context_snapshots (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  max_sensitivity text not null check (max_sensitivity in ('internal','sensitive','protected')),
  manifest_hash text not null check (manifest_hash ~ '^[a-f0-9]{64}$'),
  source_count integer not null default 0 check (source_count >= 0),
  artifact_count integer not null default 0 check (artifact_count >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  check (expires_at is null or expires_at > created_at)
);

create table if not exists public.command_center_context_snapshot_sources (
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid not null references public.command_center_context_snapshots(id) on delete cascade,
  source_key text not null,
  source_kind text not null check (source_kind in ('canonical_entity','knowledge','rule','decision','checkpoint','historical_evidence','calculation')),
  source_version bigint not null check (source_version >= 1),
  project_id text,
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected')),
  verification_state text not null check (verification_state in ('verified','owner_stated','calculated','inferred','historical','stale','conflicting')),
  source_ref text not null,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  value jsonb not null check (jsonb_typeof(value)='object'),
  created_at timestamptz not null default now(),
  primary key(owner_id,snapshot_id,source_key),
  check (length(btrim(source_key)) between 1 and 500),
  check (length(btrim(source_ref)) between 1 and 1000)
);

create table if not exists public.command_center_artifact_exchange_manifests (
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid not null references public.command_center_context_snapshots(id) on delete cascade,
  asset_id text not null,
  asset_version bigint not null check (asset_version >= 1),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected')),
  source_ref text not null,
  media_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  created_at timestamptz not null default now(),
  primary key(owner_id,snapshot_id,asset_id),
  foreign key(owner_id,asset_id) references public.command_center_assets(owner_id,asset_id) on delete restrict
);

-- Exchange snapshots are immutable evidence: browser roles may read only their own rows.
do $$
declare t text;
begin
  foreach t in array array['command_center_context_snapshots','command_center_context_snapshot_sources','command_center_artifact_exchange_manifests'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c3_owner_select_'||t,t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',
      'c3_owner_select_'||t,t
    );
  end loop;
end $$;

create or replace function public.command_center_create_context_snapshot(
  p_snapshot_id uuid,
  p_project_id text,
  p_max_sensitivity text,
  p_sources jsonb,
  p_artifact_ids text[] default '{}'::text[],
  p_expires_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  src jsonb;
  a public.command_center_assets%rowtype;
  v_source_key text;
  v_source_kind text;
  v_source_version bigint;
  v_source_owner text;
  v_source_project text;
  v_sensitivity text;
  v_verification text;
  v_source_ref text;
  v_content_hash text;
  v_value jsonb;
  v_sources integer:=0;
  v_artifacts integer:=0;
  v_manifest_hash text;
  v_asset_id text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_snapshot_id is null or coalesce(btrim(p_project_id),'')='' or p_max_sensitivity not in ('internal','sensitive','protected') or jsonb_typeof(p_sources)<>'array' then raise exception 'Snapshot identity, project, sensitivity and source array are required'; end if;
  if not exists(select 1 from public.projects p where p.owner_id=u and p.id=btrim(p_project_id)) then raise exception 'Snapshot project is outside owner scope'; end if;
  if p_expires_at is not null and p_expires_at<=now() then raise exception 'Snapshot expiry must be in the future'; end if;
  if exists(select 1 from public.command_center_context_snapshots s where s.id=p_snapshot_id) then raise exception 'Snapshot id already exists'; end if;
  if cardinality(p_artifact_ids)<>cardinality(array(select distinct x from unnest(p_artifact_ids) x)) then raise exception 'Artifact manifest ids must be unique'; end if;

  v_manifest_hash:=encode(extensions.digest((p_sources::text||'|'||coalesce(array_to_string(p_artifact_ids,','),'')||'|'||p_project_id||'|'||p_max_sensitivity),'sha256'),'hex');
  insert into public.command_center_context_snapshots(id,owner_id,project_id,max_sensitivity,manifest_hash,expires_at)
  values(p_snapshot_id,u,btrim(p_project_id),p_max_sensitivity,v_manifest_hash,p_expires_at);

  for src in select value from jsonb_array_elements(p_sources) loop
    v_source_key:=btrim(coalesce(src->>'id',''));
    v_source_kind:=btrim(coalesce(src->>'kind',''));
    begin v_source_version:=(src->>'version')::bigint; exception when others then v_source_version:=0; end;
    v_source_owner:=coalesce(src->>'ownerId','');
    v_source_project:=nullif(btrim(coalesce(src->>'projectId','')),'');
    v_sensitivity:=btrim(coalesce(src->>'sensitivity',''));
    v_verification:=btrim(coalesce(src->>'verificationState',''));
    v_source_ref:=btrim(coalesce(src->>'sourceRef',''));
    v_content_hash:=lower(btrim(coalesce(src->>'contentHash','')));
    v_value:=coalesce(src->'value','null'::jsonb);

    if v_source_key='' or v_source_kind not in ('canonical_entity','knowledge','rule','decision','checkpoint','historical_evidence','calculation') or v_source_version<1 or v_source_ref='' or jsonb_typeof(v_value)<>'object' then raise exception 'Invalid context source envelope'; end if;
    if v_source_owner<>u::text then raise exception 'Context source owner mismatch'; end if;
    if v_source_project is not null and v_source_project<>btrim(p_project_id) then raise exception 'Context source project mismatch'; end if;
    if v_sensitivity not in ('internal','sensitive','protected') or command_center_private.c3_sensitivity_rank(v_sensitivity)>command_center_private.c3_sensitivity_rank(p_max_sensitivity) then raise exception 'Context source exceeds snapshot sensitivity boundary'; end if;
    if v_verification not in ('verified','owner_stated','calculated','inferred','historical','stale','conflicting') then raise exception 'Context source verification state is required'; end if;
    if v_content_hash !~ '^[a-f0-9]{64}$' or v_content_hash<>command_center_private.c3_hash_json(v_value) then raise exception 'Context source content hash mismatch'; end if;

    insert into public.command_center_context_snapshot_sources(owner_id,snapshot_id,source_key,source_kind,source_version,project_id,sensitivity,verification_state,source_ref,content_hash,value)
    values(u,p_snapshot_id,v_source_key,v_source_kind,v_source_version,v_source_project,v_sensitivity,v_verification,v_source_ref,v_content_hash,v_value);
    v_sources:=v_sources+1;
  end loop;

  foreach v_asset_id in array p_artifact_ids loop
    select * into a from public.command_center_assets where owner_id=u and asset_id=v_asset_id;
    if not found then raise exception 'Artifact manifest references missing owner asset'; end if;
    if a.original_state<>'available' or a.sha256 is null then raise exception 'Artifact manifest cannot exchange a missing/reconstructed-without-bytes asset'; end if;
    if a.sensitivity='secret' or command_center_private.c3_sensitivity_rank(a.sensitivity)>command_center_private.c3_sensitivity_rank(p_max_sensitivity) then raise exception 'Artifact exceeds snapshot sensitivity boundary'; end if;
    if a.project_id is not null and a.project_id<>btrim(p_project_id) then raise exception 'Artifact project mismatch'; end if;
    insert into public.command_center_artifact_exchange_manifests(owner_id,snapshot_id,asset_id,asset_version,sha256,sensitivity,source_ref,media_type,byte_size)
    values(u,p_snapshot_id,a.asset_id,a.version,a.sha256,a.sensitivity,a.source_ref,a.media_type,a.byte_size);
    v_artifacts:=v_artifacts+1;
  end loop;

  update public.command_center_context_snapshots set source_count=v_sources,artifact_count=v_artifacts where id=p_snapshot_id and owner_id=u;
  return jsonb_build_object('snapshot_id',p_snapshot_id,'manifest_hash',v_manifest_hash,'source_count',v_sources,'artifact_count',v_artifacts,'immutable',true,'canonical_mutated',false);
end $$;

revoke all on function public.command_center_create_context_snapshot(uuid,text,text,jsonb,text[],timestamptz) from public,anon;
grant execute on function public.command_center_create_context_snapshot(uuid,text,text,jsonb,text[],timestamptz) to authenticated;
