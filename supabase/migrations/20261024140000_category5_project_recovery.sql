-- Category 5 / P5.14 — durable project recovery/rescue/migration/revival/retirement.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_recovery_plans (
  owner_id uuid not null references auth.users(id) on delete cascade,
  recovery_plan_id text not null,
  project_id text not null,
  mode text not null check (mode in ('greenfield','clean_rebuild','rescue','migration','modernization','reality_reconstruction','archived_revival','retirement')),
  lineage_refs text[] not null,
  asset_refs text[] not null default '{}'::text[],
  decision_refs text[] not null,
  checkpoint_refs text[] not null default '{}'::text[],
  owner_reactivation_ref text,
  owner_decision_ref text,
  state text not null default 'proposed' check (state in ('proposed','authorized','executing','completed','cancelled')),
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,recovery_plan_id),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (length(btrim(recovery_plan_id)) between 1 and 240),
  check (cardinality(lineage_refs)>0),
  check (cardinality(decision_refs)>0),
  check (mode<>'archived_revival' or owner_reactivation_ref is not null),
  check (mode not in ('rescue','migration','modernization','reality_reconstruction','archived_revival') or cardinality(checkpoint_refs)>0),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_project_recovery_events (
  recovery_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  recovery_plan_id text not null,
  project_id text not null,
  event_type text not null check (event_type in ('proposed','authorized','execution_started','canonical_lifecycle_changed','completed','cancelled','failed')),
  evidence_refs text[] not null,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail)='object'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,recovery_plan_id) references public.command_center_project_recovery_plans(owner_id,recovery_plan_id) on delete cascade,
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_project_recovery_history_idx
  on public.command_center_project_recovery_events(owner_id,project_id,occurred_at,recovery_event_id);

-- Browser roles are read-only.
do $$
declare t text;
begin
  foreach t in array array['command_center_project_recovery_plans','command_center_project_recovery_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_project_stage_recovery_plan(
  p_recovery_plan_id text,p_project_id text,p_mode text,p_lineage_refs text[],p_asset_refs text[],p_decision_refs text[],p_checkpoint_refs text[],p_owner_reactivation_ref text,p_source_ref text,p_evidence_refs text[],p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id text:=btrim(coalesce(p_recovery_plan_id,'')); v_mode text:=btrim(coalesce(p_mode,'')); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Project not found'; end if;
  if v_id='' or v_mode not in ('greenfield','clean_rebuild','rescue','migration','modernization','reality_reconstruction','archived_revival','retirement') or coalesce(btrim(p_source_ref),'')='' then raise exception 'Invalid recovery plan'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_lineage_refs,'Recovery lineage');
  perform command_center_private.c5_assert_unique_text_array(p_asset_refs,'Recovery assets');
  perform command_center_private.c5_assert_unique_text_array(p_decision_refs,'Recovery decisions');
  perform command_center_private.c5_assert_unique_text_array(p_checkpoint_refs,'Recovery checkpoints');
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Recovery evidence');
  if cardinality(coalesce(p_lineage_refs,'{}'::text[]))=0 or cardinality(coalesce(p_decision_refs,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Recovery plan must preserve lineage, decisions and evidence'; end if;
  if v_mode='archived_revival' and coalesce(btrim(p_owner_reactivation_ref),'')='' then raise exception 'Archived project revival requires owner-governed reactivation'; end if;
  if v_mode in ('rescue','migration','modernization','reality_reconstruction','archived_revival') and cardinality(coalesce(p_checkpoint_refs,'{}'::text[]))=0 then raise exception '% requires a verified checkpoint reference',v_mode; end if;
  insert into public.command_center_project_recovery_plans(owner_id,recovery_plan_id,project_id,mode,lineage_refs,asset_refs,decision_refs,checkpoint_refs,owner_reactivation_ref,source_ref)
  values(u,v_id,btrim(p_project_id),v_mode,p_lineage_refs,coalesce(p_asset_refs,'{}'::text[]),p_decision_refs,coalesce(p_checkpoint_refs,'{}'::text[]),nullif(btrim(coalesce(p_owner_reactivation_ref,'')),''),btrim(p_source_ref));
  insert into public.command_center_project_recovery_events(owner_id,recovery_plan_id,project_id,event_type,evidence_refs,occurred_at)
  values(u,v_id,btrim(p_project_id),'proposed',p_evidence_refs,p_occurred_at);
  return jsonb_build_object('recovery_plan_id',v_id,'project_id',btrim(p_project_id),'mode',v_mode,'state','proposed');
end $$;

create or replace function public.command_center_project_authorize_recovery(
  p_recovery_plan_id text,p_owner_decision_ref text,p_evidence_refs text[],p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_project_recovery_plans%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_project_recovery_plans where owner_id=u and recovery_plan_id=btrim(p_recovery_plan_id) and state='proposed' for update;
  if not found then raise exception 'Proposed recovery plan not found'; end if;
  if coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Recovery authorization requires explicit owner decision evidence'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Recovery authorization evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Recovery authorization evidence is required'; end if;
  update public.command_center_project_recovery_plans set state='authorized',owner_decision_ref=btrim(p_owner_decision_ref),updated_at=now() where owner_id=u and recovery_plan_id=r.recovery_plan_id;
  insert into public.command_center_project_recovery_events(owner_id,recovery_plan_id,project_id,event_type,evidence_refs,detail,occurred_at)
  values(u,r.recovery_plan_id,r.project_id,'authorized',p_evidence_refs,jsonb_build_object('owner_decision_ref',btrim(p_owner_decision_ref)),p_occurred_at);
  return jsonb_build_object('recovery_plan_id',r.recovery_plan_id,'state','authorized');
end $$;

create or replace function public.command_center_project_apply_recovery_lifecycle(
  p_recovery_plan_id text,p_evidence_refs text[],p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); r public.command_center_project_recovery_plans%rowtype; p public.command_center_project_profiles%rowtype; e public.command_center_canonical_entities%rowtype;
  v_target text; v_event text; v_next bigint; v_payload jsonb; v_hash text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_project_recovery_plans where owner_id=u and recovery_plan_id=btrim(p_recovery_plan_id) and state='authorized' for update;
  if not found then raise exception 'Authorized recovery plan not found'; end if;
  if r.mode not in ('archived_revival','retirement') then raise exception 'This recovery mode does not define a canonical lifecycle transition'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Recovery lifecycle evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Recovery lifecycle evidence is required'; end if;
  select * into p from public.command_center_project_profiles where owner_id=u and project_id=r.project_id for update;
  if not found then raise exception 'Project profile not found'; end if;
  select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=p.canonical_entity_id for update;
  if not found or e.deleted_at is not null then raise exception 'Live canonical project entity not found'; end if;

  if r.mode='archived_revival' then
    if p.lifecycle<>'archived' then raise exception 'Archived revival requires an archived project'; end if;
    if coalesce(btrim(r.owner_reactivation_ref),'')='' then raise exception 'Owner reactivation evidence is missing'; end if;
    v_target:='paused'; v_event:='reactivated';
  else
    if p.lifecycle in ('archived','superseded') then raise exception 'Project is already retired from active lifecycle'; end if;
    v_target:='archived'; v_event:='retired';
  end if;

  v_next:=e.version+1;
  v_payload:=jsonb_set(e.payload,'{lifecycle}',to_jsonb(v_target),true);
  v_hash:=command_center_private.c3_hash_json(v_payload);
  update public.command_center_canonical_entities set version=v_next,payload=v_payload,content_hash=v_hash,updated_at=now() where owner_id=u and entity_id=e.entity_id;
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,e.entity_id,v_next,e.project_id,e.entity_type,e.schema_version,v_payload,v_hash,'replace','recovery-plan:'||r.recovery_plan_id);
  update public.command_center_project_profiles set lifecycle=v_target,version=version+1,source_ref='recovery-plan:'||r.recovery_plan_id,updated_at=now() where owner_id=u and project_id=p.project_id;
  insert into public.command_center_project_lineage_events(owner_id,project_id,event_type,occurred_at,owner_decision_ref,related_project_id,evidence_refs)
  values(u,p.project_id,v_event,p_occurred_at,r.owner_decision_ref,null,p_evidence_refs);
  update public.command_center_project_recovery_plans set state='completed',updated_at=now() where owner_id=u and recovery_plan_id=r.recovery_plan_id;
  insert into public.command_center_project_recovery_events(owner_id,recovery_plan_id,project_id,event_type,evidence_refs,detail,occurred_at)
  values(u,r.recovery_plan_id,p.project_id,'canonical_lifecycle_changed',p_evidence_refs,jsonb_build_object('from',p.lifecycle,'to',v_target,'canonical_version',v_next),p_occurred_at);
  insert into public.command_center_project_recovery_events(owner_id,recovery_plan_id,project_id,event_type,evidence_refs,detail,occurred_at)
  values(u,r.recovery_plan_id,p.project_id,'completed',p_evidence_refs,jsonb_build_object('mode',r.mode),p_occurred_at);
  return jsonb_build_object('recovery_plan_id',r.recovery_plan_id,'project_id',p.project_id,'from_lifecycle',p.lifecycle,'to_lifecycle',v_target,'canonical_version',v_next,'state','completed');
end $$;

revoke all on function public.command_center_project_stage_recovery_plan(text,text,text,text[],text[],text[],text[],text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_project_authorize_recovery(text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_project_apply_recovery_lifecycle(text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_project_stage_recovery_plan(text,text,text,text[],text[],text[],text[],text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_project_authorize_recovery(text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_project_apply_recovery_lifecycle(text,text[],timestamptz) to authenticated;
