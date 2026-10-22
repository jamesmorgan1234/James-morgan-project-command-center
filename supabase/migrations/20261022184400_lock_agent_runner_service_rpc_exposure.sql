revoke execute on function public.command_center_agent_service_list_runnable(integer) from public, anon, authenticated;
revoke execute on function public.command_center_agent_service_get_auto(uuid) from public, anon;
grant execute on function public.command_center_agent_service_get_auto(uuid) to authenticated;
revoke execute on function public.command_center_agent_service_set_auto(uuid,boolean,text) from public, anon;
grant execute on function public.command_center_agent_service_set_auto(uuid,boolean,text) to authenticated;
