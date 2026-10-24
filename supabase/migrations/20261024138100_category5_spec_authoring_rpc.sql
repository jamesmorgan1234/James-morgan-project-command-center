-- P5.12 completion — governed authoring RPCs for playbook requirements and project spec dimensions.
-- Branch-only migration. No production state is changed by committing this file.

create or replace function public.command_center_project_register_spec_requirement(
  p_playbook_key text,p_dimension_key text,p_matrix_group text,p_applicable_by_default boolean,p_required boolean,p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_playbook text:=btrim(coalesce(p_playbook_key,'')); v_dimension text:=btrim(coalesce(p_dimension_key,'')); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_playbook='' or v_dimension !~ '^[a-z0-9][a-z0-9._:-]{0,159}$' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Invalid spec requirement'; end if;
  if p_matrix_group not in ('functional','nonfunctional','security','privacy','data','operations','recovery','cost','monetization','maintenance','testing','accessibility','future_dormant','domain') then raise exception 'Invalid spec matrix group'; end if;
  insert into public.command_center_spec_dimension_requirements(owner_id,playbook_key,dimension_key,matrix_group,applicable_by_default,required,source_ref)
  values(u,v_playbook,v_dimension,p_matrix_group,coalesce(p_applicable_by_default,true),coalesce(p_required,true),btrim(p_source_ref))
  on conflict(owner_id,playbook_key,dimension_key) do update
    set matrix_group=excluded.matrix_group,applicable_by_default=excluded.applicable_by_default,required=excluded.required,source_ref=excluded.source_ref,updated_at=now();
  return jsonb_build_object('playbook_key',v_playbook,'dimension_key',v_dimension);
end $$;

create or replace function public.command_center_project_start_spec(
  p_project_id text,p_spec_version bigint,p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.command_center_project_profiles%rowtype; t public.command_center_project_types%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(p_spec_version,0)<1 or coalesce(btrim(p_source_ref),'')='' then raise exception 'Spec version and source are required'; end if;
  select * into p from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id);
  if not found then raise exception 'Project not found'; end if;
  select * into t from public.command_center_project_types where owner_id=u and type_key=p.type_key and active;
  if not found then raise exception 'Project type/playbook not found'; end if;
  if not exists(select 1 from public.command_center_spec_dimension_requirements where owner_id=u and playbook_key=t.domain_playbook_key and required) then raise exception 'Project playbook has no required spec dimensions'; end if;
  insert into public.command_center_project_specs(owner_id,project_id,spec_version,type_key,playbook_key,source_ref)
  values(u,p.project_id,p_spec_version,p.type_key,t.domain_playbook_key,btrim(p_source_ref));
  return jsonb_build_object('project_id',p.project_id,'spec_version',p_spec_version,'playbook_key',t.domain_playbook_key,'state','draft');
end $$;

create or replace function public.command_center_project_set_spec_dimension(
  p_project_id text,p_spec_version bigint,p_dimension_key text,p_applicable boolean,p_state text,p_evidence_refs text[],p_exclusion_reason text,p_assumption_refs text[],p_unknown_refs text[],p_future_dormant_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); s public.command_center_project_specs%rowtype; v_key text:=btrim(coalesce(p_dimension_key,'')); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.command_center_project_specs where owner_id=u and project_id=btrim(p_project_id) and spec_version=p_spec_version;
  if not found then raise exception 'Project spec not found'; end if;
  if not exists(select 1 from public.command_center_spec_dimension_requirements where owner_id=u and playbook_key=s.playbook_key and dimension_key=v_key) then raise exception 'Dimension is not registered for this playbook'; end if;
  if p_state not in ('addressed','excluded_with_reason','unknown') then raise exception 'Invalid spec dimension state'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Spec evidence');
  perform command_center_private.c5_assert_unique_text_array(p_assumption_refs,'Spec assumptions');
  perform command_center_private.c5_assert_unique_text_array(p_unknown_refs,'Spec unknowns');
  perform command_center_private.c5_assert_unique_text_array(p_future_dormant_refs,'Spec future/dormant references');
  if p_state='addressed' and cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Addressed dimension requires evidence'; end if;
  if p_state='excluded_with_reason' and coalesce(btrim(p_exclusion_reason),'')='' then raise exception 'Excluded dimension requires reason'; end if;
  if p_state='unknown' and coalesce(p_applicable,true) and cardinality(coalesce(p_unknown_refs,'{}'::text[]))=0 then raise exception 'Applicable unknown dimension requires an explicit unknown reference'; end if;
  insert into public.command_center_project_spec_dimensions(owner_id,project_id,spec_version,dimension_key,applicable,state,evidence_refs,exclusion_reason,assumption_refs,unknown_refs,future_dormant_refs)
  values(u,s.project_id,s.spec_version,v_key,coalesce(p_applicable,true),p_state,coalesce(p_evidence_refs,'{}'::text[]),nullif(btrim(coalesce(p_exclusion_reason,'')),''),coalesce(p_assumption_refs,'{}'::text[]),case when p_state='unknown' then coalesce(p_unknown_refs,'{}'::text[]) else '{}'::text[] end,coalesce(p_future_dormant_refs,'{}'::text[]))
  on conflict(owner_id,project_id,spec_version,dimension_key) do update
    set applicable=excluded.applicable,state=excluded.state,evidence_refs=excluded.evidence_refs,exclusion_reason=excluded.exclusion_reason,assumption_refs=excluded.assumption_refs,unknown_refs=excluded.unknown_refs,future_dormant_refs=excluded.future_dormant_refs,updated_at=now();
  update public.command_center_project_specs set state='draft',completed_at=null,updated_at=now() where owner_id=u and project_id=s.project_id and spec_version=s.spec_version;
  return jsonb_build_object('project_id',s.project_id,'spec_version',s.spec_version,'dimension_key',v_key,'state',p_state,'applicable',coalesce(p_applicable,true));
end $$;

revoke all on function public.command_center_project_register_spec_requirement(text,text,text,boolean,boolean,text) from public,anon;
revoke all on function public.command_center_project_start_spec(text,bigint,text) from public,anon;
revoke all on function public.command_center_project_set_spec_dimension(text,bigint,text,boolean,text,text[],text,text[],text[],text[]) from public,anon;
grant execute on function public.command_center_project_register_spec_requirement(text,text,text,boolean,boolean,text) to authenticated;
grant execute on function public.command_center_project_start_spec(text,bigint,text) to authenticated;
grant execute on function public.command_center_project_set_spec_dimension(text,bigint,text,boolean,text,text[],text,text[],text[],text[]) to authenticated;
