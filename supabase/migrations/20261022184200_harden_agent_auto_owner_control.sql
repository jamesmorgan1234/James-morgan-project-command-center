create or replace function public.command_center_agent_service_set_auto(
  p_owner_id uuid,
  p_enabled boolean,
  p_updated_by text default 'command_center'
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_owner_id or not public.is_command_center_authorized() then
    raise exception 'authorized Command Center owner session required';
  end if;
  if not public.command_center_agent_service_owner_active(p_owner_id) then
    raise exception 'owner is not active';
  end if;
  insert into public.agent_runner_controls(owner_id,auto_enabled,updated_at,updated_by)
  values(p_owner_id,coalesce(p_enabled,false),now(),coalesce(nullif(p_updated_by,''),'command_center'))
  on conflict(owner_id) do update set
    auto_enabled=excluded.auto_enabled,
    updated_at=excluded.updated_at,
    updated_by=excluded.updated_by;
  return jsonb_build_object('owner_id',p_owner_id,'auto_enabled',coalesce(p_enabled,false),'updated_at',now());
end $$;
