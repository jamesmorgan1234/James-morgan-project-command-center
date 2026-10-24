-- Category 5 / P5.5 — truthful project progress from a trusted persisted roadmap denominator.
-- Branch-only migration. No production state is changed by committing this file.

alter table public.command_center_project_roadmaps
  add column if not exists denominator_trusted boolean not null default false;

create or replace function public.command_center_project_progress(p_project_id text,p_roadmap_version bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r public.command_center_project_roadmaps%rowtype;
  v_applicable bigint;
  v_verified bigint;
  v_percent integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_roadmap_version is null then
    select * into r from public.command_center_project_roadmaps
      where owner_id=u and project_id=btrim(p_project_id) and state='current';
  else
    select * into r from public.command_center_project_roadmaps
      where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version;
  end if;
  if not found then raise exception 'Roadmap not found'; end if;
  if not r.denominator_trusted then
    return jsonb_build_object('kind','na','label','N/A','reason','roadmap_denominator_untrusted','roadmap_version',r.version);
  end if;
  select count(*) filter(where applicable),
         count(*) filter(where applicable and status in ('verified','skipped'))
    into v_applicable,v_verified
    from public.command_center_project_work_units
    where owner_id=u and project_id=r.project_id and roadmap_version=r.version;
  if v_applicable=0 then
    return jsonb_build_object('kind','na','label','N/A','reason','no_applicable_work_units','roadmap_version',r.version);
  end if;
  v_percent:=round((v_verified::numeric/v_applicable::numeric)*100)::integer;
  return jsonb_build_object('kind','percent','verified',v_verified,'applicable',v_applicable,'percent',v_percent,'roadmap_version',r.version);
end $$;

revoke all on function public.command_center_project_progress(text,bigint) from public,anon;
grant execute on function public.command_center_project_progress(text,bigint) to authenticated;
