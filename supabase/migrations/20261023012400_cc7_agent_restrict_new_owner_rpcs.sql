revoke all on function public.cc7_agent_owner_set_boundary_sweep(boolean) from public;
revoke all on function public.cc7_agent_owner_set_boundary_sweep(boolean) from anon;
grant execute on function public.cc7_agent_owner_set_boundary_sweep(boolean) to authenticated;

revoke all on function public.cc7_agent_owner_retry_work_rung(uuid,text) from public;
revoke all on function public.cc7_agent_owner_retry_work_rung(uuid,text) from anon;
grant execute on function public.cc7_agent_owner_retry_work_rung(uuid,text) to authenticated;
