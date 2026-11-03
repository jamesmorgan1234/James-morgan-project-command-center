-- Preserve repository roadmap checks; deduplicate reachable pairs rather than enumerate every path.
create or replace function command_center_private.c5_assert_roadmap_integrity(p_owner uuid,p_project_id text,p_version bigint)
returns void language plpgsql security definer set search_path='' as $$
declare r record; dep text; gate_key text; begin
  for r in select * from public.command_center_project_work_units where owner_id=p_owner and project_id=p_project_id and roadmap_version=p_version loop
    perform command_center_private.c5_assert_unique_text_array(r.dependency_ids,'Work-unit dependencies');
    perform command_center_private.c5_assert_unique_text_array(r.gate_ids,'Work-unit gates');
    perform command_center_private.c5_assert_unique_text_array(r.acceptance_criteria,'Acceptance criteria');
    foreach dep in array r.dependency_ids loop
      if not exists(select 1 from public.command_center_project_work_units where owner_id=p_owner and project_id=p_project_id and roadmap_version=p_version and work_unit_id=dep) then
        raise exception 'Unknown dependency % for %',dep,r.work_unit_id;
      end if;
    end loop;
    foreach gate_key in array r.gate_ids loop
      if not exists(select 1 from public.command_center_project_roadmap_gates where owner_id=p_owner and project_id=p_project_id and roadmap_version=p_version and gate_id=gate_key) then
        raise exception 'Unknown gate % for %',gate_key,r.work_unit_id;
      end if;
    end loop;
  end loop;
  if exists(
    with recursive reachable(root,node) as (
      select w.work_unit_id,d.dep
      from public.command_center_project_work_units w
      cross join lateral unnest(w.dependency_ids) d(dep)
      where w.owner_id=p_owner and w.project_id=p_project_id and w.roadmap_version=p_version
      union
      select reachable.root,d.dep
      from reachable
      join public.command_center_project_work_units w on w.owner_id=p_owner and w.project_id=p_project_id and w.roadmap_version=p_version and w.work_unit_id=reachable.node
      cross join lateral unnest(w.dependency_ids) d(dep)
    ) select 1 from reachable where root=node limit 1
  ) then raise exception 'Roadmap dependency cycle detected'; end if;
end $$;
revoke all on function command_center_private.c5_assert_roadmap_integrity(uuid,text,bigint) from public,anon,authenticated;
