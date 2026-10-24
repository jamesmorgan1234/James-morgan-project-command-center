-- Category 5 / P5.13 — durable prototype/wireframe/usability lane with protected-design guard.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_prototypes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  prototype_id text not null,
  project_id text not null,
  spec_version bigint not null,
  artifact_asset_id text not null,
  requirement_refs text[] not null,
  protected_design_asset_refs text[] not null default '{}'::text[],
  state text not null default 'active' check (state in ('active','superseded','accepted')),
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,prototype_id),
  foreign key(owner_id,project_id,spec_version) references public.command_center_project_specs(owner_id,project_id,spec_version) on delete restrict,
  foreign key(owner_id,artifact_asset_id) references public.command_center_assets(owner_id,asset_id) on delete restrict,
  check (length(btrim(prototype_id)) between 1 and 240),
  check (cardinality(requirement_refs)>0),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_project_prototype_feedback (
  owner_id uuid not null references auth.users(id) on delete cascade,
  feedback_id text not null,
  prototype_id text not null,
  project_id text not null,
  requirement_refs text[] not null,
  decision_ref text not null,
  evidence_refs text[] not null,
  changes_protected_design boolean not null default false,
  protected_design_owner_authorization_ref text,
  feedback_state text not null default 'recorded' check (feedback_state in ('recorded','accepted_into_spec','rejected')),
  created_at timestamptz not null default now(),
  primary key(owner_id,feedback_id),
  foreign key(owner_id,prototype_id) references public.command_center_project_prototypes(owner_id,prototype_id) on delete restrict,
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (length(btrim(feedback_id)) between 1 and 240),
  check (cardinality(requirement_refs)>0),
  check (cardinality(evidence_refs)>0),
  check (length(btrim(decision_ref)) between 1 and 1000),
  check (not changes_protected_design or protected_design_owner_authorization_ref is not null)
);

-- Read only to browser roles. Prototype/feedback recording is narrow RPC-only.
do $$
declare t text;
begin
  foreach t in array array['command_center_project_prototypes','command_center_project_prototype_feedback'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_project_register_prototype(
  p_prototype_id text,p_project_id text,p_spec_version bigint,p_artifact_asset_id text,p_requirement_refs text[],p_protected_design_asset_refs text[],p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_prototype text:=btrim(coalesce(p_prototype_id,'')); v_asset text:=btrim(coalesce(p_artifact_asset_id,'')); protected_ref text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_prototype='' or v_asset='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Prototype identity, artifact and source are required'; end if;
  if not exists(select 1 from public.command_center_project_specs where owner_id=u and project_id=btrim(p_project_id) and spec_version=p_spec_version) then raise exception 'Project spec not found'; end if;
  if not exists(select 1 from public.command_center_assets where owner_id=u and asset_id=v_asset and project_id=btrim(p_project_id) and original_state='available') then raise exception 'Prototype artifact must be an available canonical project asset'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_requirement_refs,'Prototype requirements');
  perform command_center_private.c5_assert_unique_text_array(p_protected_design_asset_refs,'Protected design assets');
  if cardinality(coalesce(p_requirement_refs,'{}'::text[]))=0 then raise exception 'Prototype requires requirement lineage'; end if;
  foreach protected_ref in array coalesce(p_protected_design_asset_refs,'{}'::text[]) loop
    if not exists(select 1 from public.command_center_assets where owner_id=u and asset_id=protected_ref and project_id=btrim(p_project_id) and sensitivity='protected' and approval_state in ('approved','locked')) then
      raise exception 'Protected design reference % is not an approved/locked protected project asset',protected_ref;
    end if;
  end loop;
  insert into public.command_center_project_prototypes(owner_id,prototype_id,project_id,spec_version,artifact_asset_id,requirement_refs,protected_design_asset_refs,source_ref)
  values(u,v_prototype,btrim(p_project_id),p_spec_version,v_asset,p_requirement_refs,coalesce(p_protected_design_asset_refs,'{}'::text[]),btrim(p_source_ref));
  return jsonb_build_object('prototype_id',v_prototype,'project_id',btrim(p_project_id),'spec_version',p_spec_version,'state','active');
end $$;

create or replace function public.command_center_project_record_prototype_feedback(
  p_feedback_id text,p_prototype_id text,p_requirement_refs text[],p_decision_ref text,p_evidence_refs text[],p_changes_protected_design boolean,p_protected_design_owner_authorization_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.command_center_project_prototypes%rowtype; v_feedback text:=btrim(coalesce(p_feedback_id,'')); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into p from public.command_center_project_prototypes where owner_id=u and prototype_id=btrim(p_prototype_id) and state='active';
  if not found then raise exception 'Active prototype not found'; end if;
  if v_feedback='' or coalesce(btrim(p_decision_ref),'')='' then raise exception 'Feedback identity and decision lineage are required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_requirement_refs,'Prototype feedback requirements');
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Prototype feedback evidence');
  if cardinality(coalesce(p_requirement_refs,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Prototype feedback requires requirement and evidence lineage'; end if;
  if coalesce(p_changes_protected_design,false) and coalesce(btrim(p_protected_design_owner_authorization_ref),'')='' then raise exception 'Protected visual design cannot be overridden by prototype feedback without owner authorization'; end if;
  insert into public.command_center_project_prototype_feedback(owner_id,feedback_id,prototype_id,project_id,requirement_refs,decision_ref,evidence_refs,changes_protected_design,protected_design_owner_authorization_ref)
  values(u,v_feedback,p.prototype_id,p.project_id,p_requirement_refs,btrim(p_decision_ref),p_evidence_refs,coalesce(p_changes_protected_design,false),nullif(btrim(coalesce(p_protected_design_owner_authorization_ref,'')),''));
  -- Feedback is evidence only. It does not mutate the spec, prototype asset, or protected design automatically.
  return jsonb_build_object('feedback_id',v_feedback,'prototype_id',p.prototype_id,'project_id',p.project_id,'spec_mutation',false,'protected_asset_mutation',false);
end $$;

revoke all on function public.command_center_project_register_prototype(text,text,bigint,text,text[],text[],text) from public,anon;
revoke all on function public.command_center_project_record_prototype_feedback(text,text,text[],text,text[],boolean,text) from public,anon;
grant execute on function public.command_center_project_register_prototype(text,text,bigint,text,text[],text[],text) to authenticated;
grant execute on function public.command_center_project_record_prototype_feedback(text,text,text[],text,text[],boolean,text) to authenticated;
