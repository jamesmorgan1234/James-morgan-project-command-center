-- P5.3 completion — governed roadmap authoring, finalization and gate evidence.
-- Branch-only migration. No production state is changed by committing this file.

alter table public.command_center_project_roadmaps
  add column if not exists structure_verified boolean not null default false,
  add column if not exists denominator_evidence_refs text[] not null default '{}'::text[];

create or replace function public.command_center_project_start_roadmap(
  p_project_id text,p_version bigint,p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); current_version bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Project not found'; end if;
  if coalesce(p_version,0)<1 or coalesce(btrim(p_source_ref),'')='' then raise exception 'Roadmap version and source are required'; end if;
  select version into current_version from public.command_center_project_roadmaps where owner_id=u and project_id=btrim(p_project_id) and state='current' for update;
  if current_version is null then
    if p_version<>1 then raise exception 'Initial roadmap version must be 1'; end if;
  else
    if p_version<>current_version+1 then raise exception 'Roadmap version must advance exactly by one'; end if;
    update public.command_center_project_roadmaps set state='superseded',superseded_at=now() where owner_id=u and project_id=btrim(p_project_id) and version=current_version;
  end if;
  insert into public.command_center_project_roadmaps(owner_id,project_id,version,state,source_ref,structure_verified,denominator_trusted,denominator_evidence_refs)
  values(u,btrim(p_project_id),p_version,'current',btrim(p_source_ref),false,false,'{}'::text[]);
  return jsonb_build_object('project_id',btrim(p_project_id),'version',p_version,'state','current','structure_verified',false);
end $$;

create or replace function public.command_center_project_put_roadmap_gate(
  p_project_id text,p_roadmap_version bigint,p_gate_id text,p_satisfied boolean,p_evidence_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_roadmaps where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version and state='current') then raise exception 'Current roadmap version not found'; end if;
  if coalesce(btrim(p_gate_id),'')='' then raise exception 'Gate identity is required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Roadmap gate evidence');
  if coalesce(p_satisfied,false) and cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Satisfied gate requires evidence'; end if;
  insert into public.command_center_project_roadmap_gates(owner_id,project_id,roadmap_version,gate_id,satisfied,evidence_refs)
  values(u,btrim(p_project_id),p_roadmap_version,btrim(p_gate_id),coalesce(p_satisfied,false),coalesce(p_evidence_refs,'{}'::text[]))
  on conflict(owner_id,project_id,roadmap_version,gate_id) do update set satisfied=excluded.satisfied,evidence_refs=excluded.evidence_refs,updated_at=now();
  update public.command_center_project_roadmaps set structure_verified=false,denominator_trusted=false,denominator_evidence_refs='{}'::text[] where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version;
  return jsonb_build_object('gate_id',btrim(p_gate_id),'satisfied',coalesce(p_satisfied,false));
end $$;

create or replace function public.command_center_project_put_work_unit(
  p_project_id text,p_roadmap_version bigint,p_work_unit_id text,p_category_id text,p_phase_id text,p_title text,p_status text,p_applicable boolean,p_dependency_ids text[],p_gate_ids text[],p_acceptance_criteria text[],p_evidence_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_roadmaps where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version and state='current') then raise exception 'Current roadmap version not found'; end if;
  if p_status not in ('planned','ready','working','blocked','verified','skipped') then raise exception 'Invalid work-unit status'; end if;
  if coalesce(btrim(p_work_unit_id),'')='' or coalesce(btrim(p_category_id),'')='' or coalesce(btrim(p_phase_id),'')='' or coalesce(btrim(p_title),'')='' then raise exception 'Work-unit identity/category/phase/title are required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_dependency_ids,'Work-unit dependencies');
  perform command_center_private.c5_assert_unique_text_array(p_gate_ids,'Work-unit gates');
  perform command_center_private.c5_assert_unique_text_array(p_acceptance_criteria,'Acceptance criteria');
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Work-unit evidence');
  if cardinality(coalesce(p_acceptance_criteria,'{}'::text[]))=0 then raise exception 'Work unit requires acceptance criteria'; end if;
  if p_status in ('verified','skipped') and cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Completion status requires evidence'; end if;
  insert into public.command_center_project_work_units(owner_id,project_id,roadmap_version,work_unit_id,category_id,phase_id,title,status,applicable,dependency_ids,gate_ids,acceptance_criteria,evidence_refs)
  values(u,btrim(p_project_id),p_roadmap_version,btrim(p_work_unit_id),btrim(p_category_id),btrim(p_phase_id),btrim(p_title),p_status,coalesce(p_applicable,true),coalesce(p_dependency_ids,'{}'::text[]),coalesce(p_gate_ids,'{}'::text[]),p_acceptance_criteria,coalesce(p_evidence_refs,'{}'::text[]))
  on conflict(owner_id,project_id,roadmap_version,work_unit_id) do update set category_id=excluded.category_id,phase_id=excluded.phase_id,title=excluded.title,status=excluded.status,applicable=excluded.applicable,dependency_ids=excluded.dependency_ids,gate_ids=excluded.gate_ids,acceptance_criteria=excluded.acceptance_criteria,evidence_refs=excluded.evidence_refs,updated_at=now();
  update public.command_center_project_roadmaps set structure_verified=false,denominator_trusted=false,denominator_evidence_refs='{}'::text[] where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version;
  return jsonb_build_object('work_unit_id',btrim(p_work_unit_id),'status',p_status);
end $$;

create or replace function public.command_center_project_finalize_roadmap(
  p_project_id text,p_roadmap_version bigint,p_denominator_trusted boolean,p_denominator_evidence_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); total bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_roadmaps where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version and state='current') then raise exception 'Current roadmap version not found'; end if;
  perform command_center_private.c5_assert_roadmap_integrity(u,btrim(p_project_id),p_roadmap_version);
  select count(*) into total from public.command_center_project_work_units where owner_id=u and project_id=btrim(p_project_id) and roadmap_version=p_roadmap_version;
  if total=0 then raise exception 'Roadmap cannot finalize without work units'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_denominator_evidence_refs,'Roadmap denominator evidence');
  if coalesce(p_denominator_trusted,false) and cardinality(coalesce(p_denominator_evidence_refs,'{}'::text[]))=0 then raise exception 'Trusted denominator requires evidence'; end if;
  update public.command_center_project_roadmaps set structure_verified=true,denominator_trusted=coalesce(p_denominator_trusted,false),denominator_evidence_refs=case when coalesce(p_denominator_trusted,false) then p_denominator_evidence_refs else '{}'::text[] end where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version;
  return jsonb_build_object('project_id',btrim(p_project_id),'version',p_roadmap_version,'structure_verified',true,'denominator_trusted',coalesce(p_denominator_trusted,false),'work_unit_count',total);
end $$;

create or replace function public.command_center_project_work_readiness(p_project_id text,p_roadmap_version bigint,p_work_unit_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); w public.command_center_project_work_units%rowtype; r public.command_center_project_roadmaps%rowtype; deps text[]; gates text[]; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_project_roadmaps where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version;
  if not found then raise exception 'Roadmap not found'; end if;
  select * into w from public.command_center_project_work_units where owner_id=u and project_id=r.project_id and roadmap_version=r.version and work_unit_id=btrim(p_work_unit_id);
  if not found then raise exception 'Work unit not found'; end if;
  select coalesce(array_agg(dep order by dep),'{}'::text[]) into deps from unnest(w.dependency_ids) dep where not exists(select 1 from public.command_center_project_work_units d where d.owner_id=u and d.project_id=w.project_id and d.roadmap_version=w.roadmap_version and d.work_unit_id=dep and d.status in ('verified','skipped'));
  select coalesce(array_agg(gate_key order by gate_key),'{}'::text[]) into gates from unnest(w.gate_ids) gate_key where not exists(select 1 from public.command_center_project_roadmap_gates g where g.owner_id=u and g.project_id=w.project_id and g.roadmap_version=w.roadmap_version and g.gate_id=gate_key and g.satisfied);
  return jsonb_build_object('ready',r.state='current' and r.structure_verified and w.applicable and cardinality(deps)=0 and cardinality(gates)=0 and w.status in ('planned','ready'),'unmet_dependencies',deps,'unmet_gates',gates,'structure_verified',r.structure_verified);
end $$;

revoke all on function public.command_center_project_start_roadmap(text,bigint,text) from public,anon;
revoke all on function public.command_center_project_put_roadmap_gate(text,bigint,text,boolean,text[]) from public,anon;
revoke all on function public.command_center_project_put_work_unit(text,bigint,text,text,text,text,text,boolean,text[],text[],text[],text[]) from public,anon;
revoke all on function public.command_center_project_finalize_roadmap(text,bigint,boolean,text[]) from public,anon;
revoke all on function public.command_center_project_work_readiness(text,bigint,text) from public,anon;
grant execute on function public.command_center_project_start_roadmap(text,bigint,text) to authenticated;
grant execute on function public.command_center_project_put_roadmap_gate(text,bigint,text,boolean,text[]) to authenticated;
grant execute on function public.command_center_project_put_work_unit(text,bigint,text,text,text,text,text,boolean,text[],text[],text[],text[]) to authenticated;
grant execute on function public.command_center_project_finalize_roadmap(text,bigint,boolean,text[]) to authenticated;
grant execute on function public.command_center_project_work_readiness(text,bigint,text) to authenticated;
