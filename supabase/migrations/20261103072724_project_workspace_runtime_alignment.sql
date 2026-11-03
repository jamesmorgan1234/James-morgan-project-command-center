-- Align the empty production Agency shell columns with the authoritative
-- Category 5 checkpoint and Category 7 run definitions before installing their RPCs.
-- Existing records are never deleted, replaced, or silently converted.
do $$ begin
  if exists(select 1 from public.command_center_project_checkpoints)
     or exists(select 1 from public.command_center_agency_runs) then
    raise exception 'Agency/checkpoint shell contains records; review type conversion before applying';
  end if;
end $$;
alter table public.command_center_project_checkpoints alter column checkpoint_id type uuid using checkpoint_id::uuid;
create unique index if not exists command_center_project_checkpoints_runtime_id on public.command_center_project_checkpoints(checkpoint_id);
alter table public.command_center_agency_runs alter column priority drop default;
alter table public.command_center_agency_runs alter column priority type integer using priority::integer;
alter table public.command_center_agency_runs alter column priority set default 0;
alter table public.command_center_agency_runs alter column checkpoint_id type uuid using checkpoint_id::uuid;
