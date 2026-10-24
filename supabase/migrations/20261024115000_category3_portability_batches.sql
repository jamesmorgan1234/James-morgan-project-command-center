-- Category 3 / P3.7 — durable import/export portability with dry-run staging, conflict evidence, and rollback.
-- Branch-only migration. No production state changes until an explicitly authorized migration window.

create table if not exists public.command_center_import_batches (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  import_kind text not null check (import_kind in ('portable','historical_chat_export')),
  source_ref text not null,
  state text not null default 'staged' check (state in ('staged','validated','committed','rolled_back','rejected')),
  manifest_hash text not null check (manifest_hash ~ '^[a-f0-9]{64}$'),
  item_count integer not null default 0 check (item_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  redacted_count integer not null default 0 check (redacted_count >= 0),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  committed_at timestamptz,
  rolled_back_at timestamptz,
  commit_authorization_id uuid,
  rollback_authorization_id uuid,
  check (length(btrim(source_ref)) between 1 and 1000),
  check (validated_at is null or validated_at >= created_at),
  check (committed_at is null or committed_at >= created_at),
  check (rolled_back_at is null or rolled_back_at >= created_at)
);

create table if not exists public.command_center_import_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.command_center_import_batches(id) on delete cascade,
  item_key text not null,
  entity_type text not null,
  project_id text,
  incoming_version bigint not null check (incoming_version >= 1),
  schema_version integer not null default 1 check (schema_version >= 1),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected','secret')),
  provenance_refs text[] not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  disposition text not null check (disposition in ('create','update','duplicate','conflict','redacted')),
  disposition_reason text not null,
  before_version bigint,
  before_schema_version integer,
  before_payload jsonb,
  before_content_hash text,
  before_deleted_at timestamptz,
  applied_version bigint,
  created_at timestamptz not null default now(),
  unique(owner_id,batch_id,item_key),
  check (length(btrim(item_key)) between 1 and 240),
  check (length(btrim(entity_type)) between 1 and 120),
  check (cardinality(provenance_refs) > 0),
  check (command_center_private.c3_text_array_unique_nonblank(provenance_refs)),
  check (before_content_hash is null or before_content_hash ~ '^[a-f0-9]{64}$'),
  check (sensitivity <> 'secret' or (disposition='redacted' and payload='{}'::jsonb))
);
create index if not exists command_center_import_items_batch_idx on public.command_center_import_items(owner_id,batch_id,created_at);

-- Import evidence is owner-readable but directly immutable to browser roles.
do $$
declare t text;
begin
  foreach t in array array['command_center_import_batches','command_center_import_items'] loop
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

create or replace function public.command_center_stage_portable_import(
  p_batch_id uuid,
  p_source_ref text,
  p_records jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  rec jsonb;
  e public.command_center_canonical_entities%rowtype;
  v_key text;
  v_type text;
  v_project text;
  v_version bigint;
  v_schema integer;
  v_hash text;
  v_sensitivity text;
  v_refs text[];
  v_payload jsonb;
  v_disp text;
  v_reason text;
  v_items integer:=0;
  v_conflicts integer:=0;
  v_redacted integer:=0;
  v_manifest_hash text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_batch_id is null or coalesce(btrim(p_source_ref),'')='' or jsonb_typeof(p_records)<>'array' then raise exception 'Import batch identity, provenance and record array are required'; end if;
  if jsonb_array_length(p_records)=0 then raise exception 'Import batch cannot be empty'; end if;
  if exists(select 1 from public.command_center_import_batches where owner_id=u and id=p_batch_id) then raise exception 'Import batch already exists'; end if;

  v_manifest_hash:=encode(extensions.digest(p_records::text,'sha256'),'hex');
  insert into public.command_center_import_batches(id,owner_id,import_kind,source_ref,state,manifest_hash)
  values(p_batch_id,u,'portable',btrim(p_source_ref),'staged',v_manifest_hash);

  for rec in select value from jsonb_array_elements(p_records) loop
    v_key:=btrim(coalesce(rec->>'id',''));
    v_type:=btrim(coalesce(rec->>'entityType',''));
    v_project:=nullif(btrim(coalesce(rec->>'projectId','')),'');
    begin v_version:=(rec->>'version')::bigint; exception when others then v_version:=0; end;
    begin v_schema:=coalesce((rec->>'schemaVersion')::integer,1); exception when others then v_schema:=0; end;
    v_hash:=lower(btrim(coalesce(rec->>'contentHash','')));
    v_sensitivity:=btrim(coalesce(rec->>'sensitivity',''));
    v_payload:=coalesce(rec->'data','null'::jsonb);
    select coalesce(array_agg(x order by ord),'{}'::text[]) into v_refs
      from jsonb_array_elements_text(coalesce(rec->'provenanceRefs','[]'::jsonb)) with ordinality as r(x,ord);

    if v_key='' or v_type='' or v_version<1 or v_schema<1 or v_hash !~ '^[a-f0-9]{64}$' or v_sensitivity not in ('internal','sensitive','protected','secret') or jsonb_typeof(v_payload)<>'object' then
      raise exception 'Invalid portable record in import batch';
    end if;
    if not command_center_private.c3_text_array_unique_nonblank(v_refs) then raise exception 'Portable record provenance must be unique and nonblank'; end if;
    if v_sensitivity<>'secret' and command_center_private.c3_hash_json(v_payload)<>v_hash then raise exception 'Portable record payload hash mismatch'; end if;
    if exists(select 1 from public.command_center_import_items where owner_id=u and batch_id=p_batch_id and item_key=v_key) then raise exception 'Duplicate item id inside import batch'; end if;

    if v_sensitivity='secret' then
      v_disp:='redacted'; v_reason:='secret_payload_not_staged'; v_payload:='{}'::jsonb; v_redacted:=v_redacted+1;
      e:=null;
    else
      select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=v_key;
      if not found then
        if v_version=1 then v_disp:='create'; v_reason:='new_id';
        else v_disp:='conflict'; v_reason:='missing_base_version'; v_conflicts:=v_conflicts+1; end if;
      elsif e.entity_type<>v_type or e.project_id is distinct from v_project then
        v_disp:='conflict'; v_reason:='canonical_identity_or_project_mismatch'; v_conflicts:=v_conflicts+1;
      elsif e.deleted_at is not null then
        v_disp:='conflict'; v_reason:='tombstoned_entity_cannot_be_silently_revived'; v_conflicts:=v_conflicts+1;
      elsif e.version=v_version and e.content_hash=v_hash then
        v_disp:='duplicate'; v_reason:='same_version_same_hash';
      elsif v_version=e.version+1 then
        v_disp:='update'; v_reason:='exact_next_version';
      else
        v_disp:='conflict'; v_reason:='would_overwrite_or_skip_canonical_version'; v_conflicts:=v_conflicts+1;
      end if;
    end if;

    insert into public.command_center_import_items(
      owner_id,batch_id,item_key,entity_type,project_id,incoming_version,schema_version,content_hash,sensitivity,provenance_refs,payload,
      disposition,disposition_reason,before_version,before_schema_version,before_payload,before_content_hash,before_deleted_at
    ) values (
      u,p_batch_id,v_key,v_type,v_project,v_version,v_schema,v_hash,v_sensitivity,v_refs,v_payload,v_disp,v_reason,
      case when e.owner_id is null then null else e.version end,
      case when e.owner_id is null then null else e.schema_version end,
      case when e.owner_id is null then null else e.payload end,
      case when e.owner_id is null then null else e.content_hash end,
      case when e.owner_id is null then null else e.deleted_at end
    );
    v_items:=v_items+1;
  end loop;

  update public.command_center_import_batches
     set state=case when v_conflicts=0 then 'validated' else 'staged' end,
         item_count=v_items,conflict_count=v_conflicts,redacted_count=v_redacted,
         validated_at=case when v_conflicts=0 then now() else null end
   where owner_id=u and id=p_batch_id;

  return jsonb_build_object('batch_id',p_batch_id,'state',case when v_conflicts=0 then 'validated' else 'staged' end,'item_count',v_items,'conflict_count',v_conflicts,'redacted_count',v_redacted,'canonical_mutated',false);
end $$;

create or replace function public.command_center_commit_portable_import(p_batch_id uuid,p_authorization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  b public.command_center_import_batches%rowtype;
  i public.command_center_import_items%rowtype;
  v_applied integer:=0;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_import_batches where owner_id=u and id=p_batch_id for update;
  if not found then raise exception 'Import batch not found'; end if;
  if b.import_kind<>'portable' or b.state<>'validated' or b.conflict_count<>0 then raise exception 'Import batch is not eligible to commit'; end if;
  perform command_center_private.consume_action_authorization(u,p_authorization_id,'canonical.import.commit','import_batch',b.id::text);

  for i in select * from public.command_center_import_items where owner_id=u and batch_id=b.id order by created_at,id for update loop
    if i.disposition in ('duplicate','redacted') then continue; end if;
    if i.disposition='create' then
      if exists(select 1 from public.command_center_canonical_entities where owner_id=u and entity_id=i.item_key) then raise exception 'Canonical state changed after import validation'; end if;
      insert into public.command_center_canonical_entities(owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash)
      values(u,i.item_key,i.project_id,i.entity_type,1,i.schema_version,i.payload,i.content_hash);
      insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
      values(u,i.item_key,1,i.project_id,i.entity_type,i.schema_version,i.payload,i.content_hash,'create','import:'||b.id::text||':'||b.source_ref);
      update public.command_center_import_items set applied_version=1 where id=i.id;
      v_applied:=v_applied+1;
    elsif i.disposition='update' then
      if not exists(select 1 from public.command_center_canonical_entities e where e.owner_id=u and e.entity_id=i.item_key and e.version=i.before_version and e.content_hash=i.before_content_hash and e.deleted_at is not distinct from i.before_deleted_at) then raise exception 'Canonical state changed after import validation'; end if;
      update public.command_center_canonical_entities set version=i.incoming_version,schema_version=i.schema_version,payload=i.payload,content_hash=i.content_hash,updated_at=now() where owner_id=u and entity_id=i.item_key;
      insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
      values(u,i.item_key,i.incoming_version,i.project_id,i.entity_type,i.schema_version,i.payload,i.content_hash,'replace','import:'||b.id::text||':'||b.source_ref);
      update public.command_center_import_items set applied_version=i.incoming_version where id=i.id;
      v_applied:=v_applied+1;
    else
      raise exception 'Unresolved import disposition cannot commit';
    end if;
  end loop;

  update public.command_center_import_batches set state='committed',committed_at=now(),commit_authorization_id=p_authorization_id where owner_id=u and id=b.id;
  return jsonb_build_object('batch_id',b.id,'state','committed','applied_count',v_applied);
end $$;

create or replace function public.command_center_rollback_portable_import(p_batch_id uuid,p_authorization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  b public.command_center_import_batches%rowtype;
  i public.command_center_import_items%rowtype;
  e public.command_center_canonical_entities%rowtype;
  v_next bigint;
  v_rolled integer:=0;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_import_batches where owner_id=u and id=p_batch_id for update;
  if not found then raise exception 'Import batch not found'; end if;
  if b.import_kind<>'portable' or b.state<>'committed' then raise exception 'Only a committed portable import can be rolled back'; end if;
  perform command_center_private.consume_action_authorization(u,p_authorization_id,'canonical.import.rollback','import_batch',b.id::text);

  for i in select * from public.command_center_import_items where owner_id=u and batch_id=b.id and applied_version is not null order by created_at desc,id desc for update loop
    select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=i.item_key for update;
    if not found or e.version<>i.applied_version then raise exception 'Canonical state advanced after import; automatic rollback is unsafe'; end if;
    v_next:=e.version+1;
    if i.before_version is null then
      update public.command_center_canonical_entities set version=v_next,updated_at=now(),deleted_at=now() where owner_id=u and entity_id=e.entity_id;
      insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
      values(u,e.entity_id,v_next,e.project_id,e.entity_type,e.schema_version,e.payload,e.content_hash,'tombstone','import-rollback:'||b.id::text);
    else
      update public.command_center_canonical_entities set version=v_next,schema_version=i.before_schema_version,payload=i.before_payload,content_hash=i.before_content_hash,updated_at=now(),deleted_at=i.before_deleted_at where owner_id=u and entity_id=e.entity_id;
      insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
      values(u,e.entity_id,v_next,e.project_id,e.entity_type,i.before_schema_version,i.before_payload,i.before_content_hash,'replace','import-rollback:'||b.id::text);
    end if;
    v_rolled:=v_rolled+1;
  end loop;

  update public.command_center_import_batches set state='rolled_back',rolled_back_at=now(),rollback_authorization_id=p_authorization_id where owner_id=u and id=b.id;
  return jsonb_build_object('batch_id',b.id,'state','rolled_back','rolled_back_count',v_rolled);
end $$;

revoke all on function public.command_center_stage_portable_import(uuid,text,jsonb) from public,anon;
grant execute on function public.command_center_stage_portable_import(uuid,text,jsonb) to authenticated;
revoke all on function public.command_center_commit_portable_import(uuid,uuid) from public,anon;
grant execute on function public.command_center_commit_portable_import(uuid,uuid) to authenticated;
revoke all on function public.command_center_rollback_portable_import(uuid,uuid) from public,anon;
grant execute on function public.command_center_rollback_portable_import(uuid,uuid) to authenticated;
