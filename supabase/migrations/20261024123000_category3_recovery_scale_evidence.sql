-- Category 3 / P3.12 — canonical projection recovery, provider-replacement validation and durable recovery evidence.
-- Branch-only migration. Canonical source rows are never rewritten by projection recovery.

create table if not exists public.command_center_data_recovery_runs (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  recovery_kind text not null check (recovery_kind in ('projection_rebuild','provider_replacement_validation','import_rollback','migration_validation','scale_test')),
  state text not null default 'running' check (state in ('running','succeeded','failed')),
  source_ref text not null,
  input_count bigint not null default 0 check (input_count >= 0),
  output_count bigint not null default 0 check (output_count >= 0),
  evidence_hash text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check (length(btrim(source_ref)) between 1 and 1000),
  check (evidence_hash is null or evidence_hash ~ '^[a-f0-9]{64}$'),
  check (completed_at is null or completed_at >= started_at),
  check ((state='running' and completed_at is null) or (state in ('succeeded','failed') and completed_at is not null)),
  check (details::text !~* '(^|[^a-z])(secret|token|password|private[_ -]?key|authorization)([^a-z]|$)'),
  check (details::text !~* 'Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}')
);

alter table public.command_center_data_recovery_runs enable row level security;
revoke all on table public.command_center_data_recovery_runs from public,anon,authenticated;
grant select on table public.command_center_data_recovery_runs to authenticated;
drop policy if exists c3_owner_select_data_recovery_runs on public.command_center_data_recovery_runs;
create policy c3_owner_select_data_recovery_runs on public.command_center_data_recovery_runs for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_rebuild_canonical_projection(p_run_id uuid,p_source_ref text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  v_input bigint;
  v_output bigint:=0;
  v_hash text;
  v_failure text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_run_id is null or coalesce(btrim(p_source_ref),'')='' then raise exception 'Recovery run identity and provenance are required'; end if;
  if exists(select 1 from public.command_center_data_recovery_runs where id=p_run_id) then raise exception 'Recovery run already exists'; end if;

  select count(*) into v_input from public.command_center_canonical_entities where owner_id=u;
  insert into public.command_center_data_recovery_runs(id,owner_id,recovery_kind,state,source_ref,input_count)
  values(p_run_id,u,'projection_rebuild','running',btrim(p_source_ref),v_input);

  -- The inner subtransaction rolls back any partial projection rewrite, while the outer
  -- recovery row remains available for durable failed-run evidence.
  begin
    delete from public.command_center_canonical_projection where owner_id=u;
    insert into public.command_center_canonical_projection(owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash,canonical_updated_at,deleted_at,projected_at)
    select owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash,updated_at,deleted_at,now()
    from public.command_center_canonical_entities where owner_id=u;

    select count(*) into v_output from public.command_center_canonical_projection where owner_id=u;
    if v_output<>v_input then raise exception 'Projection rebuild count mismatch'; end if;
    select encode(extensions.digest(coalesce(string_agg(entity_id||':'||version::text||':'||content_hash,'|' order by entity_id),''),'sha256'),'hex')
      into v_hash from public.command_center_canonical_projection where owner_id=u;
  exception when others then
    v_failure:=sqlstate||':'||sqlerrm;
  end;

  if v_failure is not null then
    update public.command_center_data_recovery_runs
       set state='failed',output_count=0,completed_at=now(),details=jsonb_build_object('reason','projection_rebuild_failed','sqlstate',split_part(v_failure,':',1),'canonical_mutated',false,'projection_preserved',true)
     where id=p_run_id and owner_id=u;
    return jsonb_build_object('run_id',p_run_id,'state','failed','reason','projection_rebuild_failed','canonical_mutated',false,'projection_preserved',true);
  end if;

  update public.command_center_data_recovery_runs
     set state='succeeded',output_count=v_output,evidence_hash=v_hash,completed_at=now(),details=jsonb_build_object('canonical_mutated',false,'projection_rebuilt',true)
   where id=p_run_id and owner_id=u;
  return jsonb_build_object('run_id',p_run_id,'state','succeeded','input_count',v_input,'output_count',v_output,'evidence_hash',v_hash,'canonical_mutated',false);
end $$;

create or replace function public.command_center_validate_provider_replacement(
  p_run_id uuid,
  p_old_provider_key text,
  p_replacement_provider_key text,
  p_required_capabilities text[],
  p_free_first boolean,
  p_source_ref text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  oldp public.command_center_provider_registry%rowtype;
  newp public.command_center_provider_registry%rowtype;
  cap text;
  v_hash text;
  v_failure text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_run_id is null or coalesce(btrim(p_source_ref),'')='' or not command_center_private.c3_text_array_unique_nonblank(p_required_capabilities) then raise exception 'Replacement validation identity, capabilities and provenance are required'; end if;
  if exists(select 1 from public.command_center_data_recovery_runs where id=p_run_id) then raise exception 'Recovery run already exists'; end if;

  insert into public.command_center_data_recovery_runs(id,owner_id,recovery_kind,state,source_ref,input_count)
  values(p_run_id,u,'provider_replacement_validation','running',btrim(p_source_ref),cardinality(p_required_capabilities));

  select * into oldp from public.command_center_provider_registry where owner_id=u and provider_key=p_old_provider_key;
  if not found then v_failure:='old_provider_not_registered'; end if;
  if v_failure is null then
    select * into newp from public.command_center_provider_registry where owner_id=u and provider_key=p_replacement_provider_key;
    if not found then v_failure:='replacement_provider_not_registered'; end if;
  end if;
  if v_failure is null and (not newp.enabled or newp.health in ('unavailable','unconfigured')) then v_failure:='replacement_provider_not_operationally_eligible'; end if;
  if v_failure is null and coalesce(p_free_first,false) and newp.cost='paid' then v_failure:='paid_replacement_violates_free_first'; end if;
  if v_failure is null then
    foreach cap in array p_required_capabilities loop
      if not (newp.capabilities @> array[cap]) then v_failure:='replacement_provider_missing_required_capability'; exit; end if;
    end loop;
  end if;
  if v_failure is null and newp.provider_key=oldp.provider_key and newp.version<=oldp.version then v_failure:='same_provider_replacement_must_advance_version'; end if;

  if v_failure is not null then
    update public.command_center_data_recovery_runs
       set state='failed',completed_at=now(),details=jsonb_build_object('reason',v_failure,'validated_only',true,'provider_switched',false)
     where id=p_run_id and owner_id=u;
    return jsonb_build_object('run_id',p_run_id,'state','failed','reason',v_failure,'provider_switched',false);
  end if;

  v_hash:=encode(extensions.digest(oldp.provider_key||'|'||oldp.version::text||'|'||newp.provider_key||'|'||newp.version::text||'|'||array_to_string(p_required_capabilities,','),'sha256'),'hex');
  update public.command_center_data_recovery_runs
     set state='succeeded',output_count=cardinality(p_required_capabilities),evidence_hash=v_hash,completed_at=now(),details=jsonb_build_object('old_provider',oldp.provider_key,'replacement_provider',newp.provider_key,'validated_only',true,'provider_switched',false)
   where id=p_run_id and owner_id=u;
  return jsonb_build_object('run_id',p_run_id,'state','succeeded','replacement_provider',newp.provider_key,'evidence_hash',v_hash,'provider_switched',false);
end $$;

revoke all on function public.command_center_rebuild_canonical_projection(uuid,text) from public,anon;
grant execute on function public.command_center_rebuild_canonical_projection(uuid,text) to authenticated;
revoke all on function public.command_center_validate_provider_replacement(uuid,text,text,text[],boolean,text) from public,anon;
grant execute on function public.command_center_validate_provider_replacement(uuid,text,text,text[],boolean,text) to authenticated;
