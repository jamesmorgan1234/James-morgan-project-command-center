-- P5.3 corrective hardening — verification must still recheck dependencies/gates.
-- Branch-only migration. No production state is changed by committing this file.

create or replace function public.command_center_project_set_work_status(
  p_project_id text,p_roadmap_version bigint,p_work_unit_id text,p_expected_status text,p_new_status text,p_evidence_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); w public.command_center_project_work_units%rowtype; readiness jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into w from public.command_center_project_work_units where owner_id=u and project_id=btrim(p_project_id) and roadmap_version=p_roadmap_version and work_unit_id=btrim(p_work_unit_id) for update;
  if not found then raise exception 'Work unit not found'; end if;
  if w.status<>p_expected_status then raise exception 'Work-unit status conflict'; end if;
  if p_new_status not in ('planned','ready','working','blocked','verified','skipped') then raise exception 'Invalid work-unit status'; end if;

  if p_new_status in ('ready','working','verified') then
    readiness:=public.command_center_project_work_readiness(w.project_id,w.roadmap_version,w.work_unit_id);
    if jsonb_array_length(coalesce(readiness->'unmet_dependencies','[]'::jsonb))>0
       or jsonb_array_length(coalesce(readiness->'unmet_gates','[]'::jsonb))>0
       or not w.applicable then
      raise exception 'Work unit cannot advance past unmet dependencies or gates';
    end if;
    if p_new_status in ('ready','working') and w.status not in ('planned','ready') then raise exception 'Invalid work-unit advancement source state'; end if;
    if p_new_status='verified' and w.status not in ('ready','working') then raise exception 'Work unit must be ready or working before verification'; end if;
  end if;

  if p_new_status in ('verified','skipped') and cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Completion status requires evidence'; end if;
  update public.command_center_project_work_units set status=p_new_status,evidence_refs=coalesce(p_evidence_refs,evidence_refs),updated_at=now()
   where owner_id=u and project_id=w.project_id and roadmap_version=w.roadmap_version and work_unit_id=w.work_unit_id;
  return jsonb_build_object('project_id',w.project_id,'roadmap_version',w.roadmap_version,'work_unit_id',w.work_unit_id,'status',p_new_status);
end $$;

revoke all on function public.command_center_project_set_work_status(text,bigint,text,text,text,text[]) from public,anon;
grant execute on function public.command_center_project_set_work_status(text,bigint,text,text,text,text[]) to authenticated;
